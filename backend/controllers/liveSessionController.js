const LiveSession = require('../models/LiveSession');
const SessionMessage = require('../models/SessionMessage');
const SessionRecording = require('../models/SessionRecording');
const TranscriptionJob = require('../models/TranscriptionJob');
const {
  canAccessSession,
  canTeachSession,
  canViewSession,
  loadUserWithProgress,
  extractId,
} = require('../utils/liveSessionAccess');
const { 
  createLivekitToken, 
  removeParticipant, 
  muteParticipant, 
  isLivekitConfigured,
  startRoomCompositeEgress,
  stopEgress,
} = require('../services/livekitService');
const axios = require('axios');

const populateTeacher = { path: 'teacher', select: 'name email role' };
const populateCourse = { path: 'course', select: 'title instructor' };

const attachIO = (req) => req.app.get('io');

function emitToLive(io, roomId, event, payload) {
  if (!io) return;
  io.of('/live').to(roomId).emit(event, payload);
}

function emitToUser(io, userId, event, payload) {
  if (!io) return;
  io.of('/live').to(`user:${userId}`).emit(event, payload);
}
const isLivekitConfiguredLocal = () => {
  return !!(process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET);
}

// @desc Health check for LiveKit server
const checkLiveKitHealth = async (req, res) => {
  const host = process.env.LIVEKIT_HTTP_URL || 'http://127.0.0.1:7880';
  try {
    // LiveKit server returns "OK" at the root path
    const { data } = await axios.get(`${host}/`, { timeout: 2000 });
    if (data === 'OK' || data === 'ok' || data?.status === 'ok') {
      return res.json({ status: 'ok', configured: isLivekitConfiguredLocal() });
    }
    // Some versions might have /health
    await axios.get(`${host}/health`, { timeout: 2000 });
    res.json({ status: 'ok', configured: isLivekitConfiguredLocal() });
  } catch (error) {
    console.error('[Health] LiveKit unreachable:', host, error.message);
    res.status(503).json({ 
      status: 'unreachable', 
      host,
      message: 'LiveKit media server is down or misconfigured' 
    });
  }
};

// @desc Create session (instructor)
const createLiveSession = async (req, res) => {
  try {
    const { title, description, course, scheduledStart, scheduledEnd, waitingRoomEnabled, accessType, invitedUsers, invitedEmails } = req.body;
    
    let userIdsFromEmails = [];
    if (accessType === 'private' && Array.isArray(invitedEmails) && invitedEmails.length > 0) {
      const User = require('../models/User');
      const foundUsers = await User.find({ email: { $in: invitedEmails } }).select('_id');
      userIdsFromEmails = foundUsers.map(u => u._id);
    }

    const session = new LiveSession({
      title,
      description: description || '',
      teacher: req.user._id,
      course: course || null,
      accessType: accessType || (course ? 'enrolled' : 'public'),
      invitedUsers: [...(invitedUsers || []), ...userIdsFromEmails],
      scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
      scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
      waitingRoomEnabled: waitingRoomEnabled !== false,
      status: 'scheduled',
    });
    const saved = await session.save();
    const out = await LiveSession.findById(saved._id).populate(populateTeacher).populate(populateCourse);
    res.status(201).json(out);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc List sessions (live + upcoming) — scoped by role / enrollment
const getLiveSessions = async (req, res) => {
  try {
    const user = await loadUserWithProgress(req.user._id);
    const statusMatch = { status: { $in: ['created', 'scheduled', 'live'] } };

    let filter;
    if (user.role === 'Admin') {
      filter = statusMatch;
    } else if (user.role === 'Instructor') {
      filter = { ...statusMatch, teacher: user._id };
    } else {
      const enrolledIds = (user.progress || []).map((p) => p.course).filter(Boolean);
      filter = {
        ...statusMatch,
        $or: [
          { accessType: 'public' },
          { accessType: 'enrolled', course: { $in: enrolledIds } },
          { accessType: 'private', invitedUsers: user._id },
          // Backward compatibility for sessions created before accessType field
          { accessType: { $exists: false }, course: { $in: enrolledIds } },
          { accessType: { $exists: false }, course: null },
        ],
      };
    }

    // Aggressive Cleanup: Filter out sessions that have been "Live" but stagnant for too long (e.g. 4 hours)
    // or those that are ended.
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const filterWithStale = {
      ...filter,
      $or: [
        { status: { $in: ['created', 'scheduled'] } },
        { status: 'live', updatedAt: { $gte: fourHoursAgo } }
      ]
    };

    const sessions = await LiveSession.find(filterWithStale)
      .populate(populateTeacher)
      .populate(populateCourse)
      .sort({ scheduledStart: 1, createdAt: -1 })
      .lean();

    const mapped = sessions.map((s) => ({
      ...s,
      status: s.status, // We now use deterministic status
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc Single session (Mongo _id or roomId)
const getLiveSessionById = async (req, res) => {
  try {
    const q = req.params.id;
    let session = await LiveSession.findById(q)
      .populate(populateTeacher)
      .populate(populateCourse)
      .populate({ path: 'waitingQueue.user', select: 'name email' });
    
    if (!session) {
      session = await LiveSession.findOne({ roomId: q })
        .populate(populateTeacher)
        .populate(populateCourse)
        .populate({ path: 'waitingQueue.user', select: 'name email' });
    }

    // Try ScheduledSession if not found
    if (!session) {
      const ScheduledSession = require('../models/ScheduledSession');
      session = await ScheduledSession.findById(q).populate({ path: 'instructor', select: 'name email role' });
      if (session) {
        // Map ScheduledSession to a compatible format for the frontend
        session = session.toObject();
        session.teacher = session.instructor;
        session.isMasterclass = true;
      }
    }

    if (!session) return res.status(404).json({ message: 'Live session not found' });

    const viewer = await loadUserWithProgress(req.user._id);

    // --- OWNER FAST-PATH: session creator always can view their own session ---
    // This bypasses canViewSession entirely to ensure the host is never locked out.
    const viewerId = extractId(viewer);
    const teacherDoc = session.teacher || session.instructor;
    const teacherId = extractId(teacherDoc);
    const isOwner = viewerId && teacherId && viewerId === teacherId;

    // Also allow by email in case IDs are mismatched due to serialization
    const ownerEmail = teacherDoc?.email;
    const isOwnerByEmail = ownerEmail && viewer.email &&
      String(ownerEmail).toLowerCase() === String(viewer.email).toLowerCase();

    if (!isOwner && !isOwnerByEmail && viewer.role !== 'Admin' && !canViewSession(viewer, session)) {
      console.error(`[403] Session ${q}: viewer=${viewerId} (${viewer.email}) teacher=${teacherId} (${ownerEmail}) role=${viewer.role}`);
      return res.status(403).json({ 
        message: 'You do not have access to this session',
        debug: {
          viewerId,
          teacherId,
          viewerRole: viewer.role,
          accessType: session.accessType,
        }
      });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc Update go-live / end
const updateLiveSessionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    let session = await LiveSession.findById(req.params.id);
    let ModelClass = LiveSession;
    
    if (!session) {
      const ScheduledSession = require('../models/ScheduledSession');
      session = await ScheduledSession.findById(req.params.id);
      ModelClass = ScheduledSession;
    }

    if (!session) {
      console.warn(`[StatusUpdate] Session ${req.params.id} not found in any model`);
      return res.status(404).json({ message: 'Session not found' });
    }
    
    const isScheduledModel = session.constructor.modelName === 'ScheduledSession';
    const isOwner = isScheduledModel
      ? session.instructor.toString() === req.user._id.toString() 
      : canTeachSession(req.user, session);

    if (!isOwner && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to change this session status' });
    }
    if (!['scheduled', 'live', 'ended', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const previousStatus = session.status;
    let targetStatus = status;
    
    // Explicit status mapping and validation
    if (!['created', 'scheduled', 'live', 'ended', 'recorded', 'archived', 'cancelled'].includes(targetStatus)) {
      return res.status(400).json({ message: 'Invalid status provided' });
    }
    
    session.status = targetStatus;
    session.isLive = (targetStatus === 'live');
    
    console.log(`[StatusUpdate] Session ${session._id} changing ${previousStatus} -> ${targetStatus}`);

    // If ending the session, create meeting history
    if (targetStatus === 'ended' && previousStatus === 'live') {
      session.endedAt = new Date();
      session.isLive = false;
      try {
        const MeetingHistory = require('../models/MeetingHistory');
        const SessionMessage = require('../models/SessionMessage');
        const messagesCount = await SessionMessage.countDocuments({ session: session._id });
        const history = new MeetingHistory({
          session: session._id,
          roomId: session.roomId,
          title: session.title,
          teacher: isScheduledModel ? session.instructor : session.teacher,
          participants: (session.participants || []).map(p => ({
            user: p.user,
            identity: p.identity,
            name: p.name,
            joinedAt: p.joinedAt,
            role: p.role,
            duration: Math.floor((Date.now() - new Date(p.joinedAt).getTime()) / 1000),
          })),
          startedAt: session.updatedAt,
          endedAt: new Date(),
          duration: Math.max(0, Math.floor((Date.now() - session.updatedAt.getTime()) / 1000)),
          recordings: session.activeRecording ? [session.activeRecording] : [],
          totalParticipants: (session.participants || []).length,
          peakParticipants: (session.participants || []).length,
          chatMessages: messagesCount,
          settings: session.settings || {},
        });
        await history.save();
      } catch (hErr) {
        console.error('History creation failed', hErr);
      }
    }

    await session.save();
    const io = attachIO(req);
    emitToLive(io, session.roomId, 'session:status', { status: session.status });

    // Broadcast globally for dashboard invalidation
    if (io) {
      io.of('/live').emit('session:ended', { sessionId: session._id.toString(), roomId: session.roomId });
    }

    // Auto-stop recording if session ends
    if ((targetStatus === 'ended' || targetStatus === 'completed' || targetStatus === 'cancelled') && session.activeRecording) {
      try {
        const SessionRecording = require('../models/SessionRecording');
        const rec = await SessionRecording.findById(session.activeRecording);
        if (rec && rec.status === 'active' && rec.egressId) {
          await stopEgress(rec.egressId);
          rec.status = 'completed';
          await rec.save();
        }
        session.activeRecording = null;
        await session.save();
        emitToLive(io, session.roomId, 'recording:state', { active: false });
      } catch (recErr) {
        console.error('[StatusUpdate] Failed to stop recording on session end', recErr);
      }
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc Host settings: lock, waiting room, schedule
const updateLiveSessionMeta = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Live session not found' });
    if (!canTeachSession(req.user, session)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { locked, waitingRoomEnabled, scheduledStart, scheduledEnd, spotlightIdentity } = req.body;
    if (typeof locked === 'boolean') session.locked = locked;
    if (typeof waitingRoomEnabled === 'boolean') session.waitingRoomEnabled = waitingRoomEnabled;
    if (scheduledStart) session.scheduledStart = new Date(scheduledStart);
    if (scheduledEnd) session.scheduledEnd = new Date(scheduledEnd);
    if (typeof spotlightIdentity === 'string') session.spotlightIdentity = spotlightIdentity;
    await session.save();
    emitToLive(attachIO(req), session.roomId, 'session:meta', {
      locked: session.locked,
      waitingRoomEnabled: session.waitingRoomEnabled,
      spotlightIdentity: session.spotlightIdentity,
    });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc LiveKit JWT for SFU
const getLiveKitToken = async (req, res) => {
  try {
    const q = req.params.id;
    let session = await LiveSession.findById(q).populate('course');
    if (!session) {
      const ScheduledSession = require('../models/ScheduledSession');
      session = await ScheduledSession.findById(q);
    }
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const user = await loadUserWithProgress(req.user._id);
    const isTeacher = canTeachSession(user, session);

    // Access control verification
    if (!isTeacher && !canAccessSession(user, session)) {
      const reason = session.accessType === 'private' 
        ? 'This is a private session (invite-only).' 
        : session.accessType === 'enrolled' 
        ? 'Not enrolled in the related course.' 
        : 'You do not have permission to join this session.';
        
      return res.status(403).json({ message: reason });
    }

    if (!isTeacher && session.status !== 'live') {
      const msg = ['ended', 'recorded', 'archived'].includes(session.status) ? 'The class has already ended.' : 'The class is not live yet.';
      return res.status(403).json({ code: 'NOT_LIVE', message: msg });
    }
    
    if (['ended', 'recorded', 'archived', 'cancelled'].includes(session.status)) {
      return res.status(403).json({ code: 'ENDED', message: 'This session is no longer active.' });
    }

    if (session.waitingRoomEnabled && !isTeacher) {
      const admitted = session.admittedUsers.some((id) => id.toString() === user._id.toString());
      if (!admitted) {
        return res.status(403).json({ code: 'WAITING_ROOM', message: 'Wait for host to admit you' });
      }
    }

    const identity = `uid:${user._id.toString()}`;
    const token = await createLivekitToken(session.roomId, identity);

    // Track participant in session
    const existingParticipant = session.participants.find((p) => p.identity === identity);
    if (!existingParticipant) {
      session.participants.push({
        identity,
        user: user._id,
        name: user.name,
        role: isTeacher ? 'host' : 'participant',
        permissions: {
          canPublishAudio: true,
          canPublishVideo: true,
          canPublishData: session.settings?.allowChat !== false,
          muted: false,
          videoMuted: false,
        },
        joinedAt: new Date(),
        raisedHand: false,
      });
      await session.save();
    }

    res.json({
      token,
      url: process.env.LIVEKIT_URL || 'ws://localhost:7880',
      roomName: session.roomId,
      identity,
      isTeacher,
      livekitConfigured: isLivekitConfigured(),
    });
  } catch (error) {
    console.error('Error in getLiveKitToken:', error);
    const code = error.statusCode || 500;
    res.status(code).json({ message: error.message });
  }
};

// @desc Student enters waiting queue
const joinWaitingRoom = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Live session not found' });

    const user = await loadUserWithProgress(req.user._id);
    if (canTeachSession(user, session)) {
      return res.json({ admitted: true, message: 'Host does not use waiting room' });
    }
    if (!canAccessSession(user, session)) {
      return res.status(403).json({ message: 'Not enrolled' });
    }
    if (!session.waitingRoomEnabled) {
      session.admittedUsers.addToSet(user._id);
      await session.save();
      return res.json({ admitted: true });
    }

    if (session.admittedUsers.some((id) => id.toString() === user._id.toString())) {
      return res.json({ admitted: true });
    }

    const already = session.waitingQueue.some((w) => w.user.toString() === user._id.toString());
    if (!already) session.waitingQueue.push({ user: user._id });
    await session.save();

    emitToLive(attachIO(req), session.roomId, 'waiting:user-joined', {
      userId: user._id.toString(),
      name: user.name,
      queueLength: session.waitingQueue.length + (already ? 0 : 1),
    });

    res.json({ admitted: false, waiting: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Admit one student
const admitWaitingUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const session = await LiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Live session not found' });
    if (!canTeachSession(req.user, session)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // 1. Add to admittedUsers set (server source-of-truth for access)
    const isAlreadyAdmitted = session.admittedUsers.some(id => id.toString() === userId);
    if (!isAlreadyAdmitted) {
      session.admittedUsers.push(userId);
    }

    // 2. Remove from waiting queue
    session.waitingQueue = session.waitingQueue.filter((w) => w.user.toString() !== userId);

    // 3. Update participant status from 'waiting' → 'admitted'
    const identity = `uid:${userId}`;
    const participant = session.participants.find((p) => p.identity === identity);
    if (participant) {
      participant.status = 'admitted';
    }

    await session.save();

    // 4. Notify the specific student they can now connect
    emitToUser(attachIO(req), userId, 'waiting:admitted', {
      sessionId: session._id.toString(),
      roomId: session.roomId,
    });

    // 5. Notify everyone in the room that a waiting user was admitted (to update host UI)
    emitToLive(attachIO(req), session.roomId, 'waiting:admitted-broadcast', { userId });

    res.json({ ok: true, roomId: session.roomId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Chat history
const getSessionMessages = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Live session not found' });
    const user = await loadUserWithProgress(req.user._id);
    if (!canViewSession(user, session)) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    const messages = await SessionMessage.find({ session: session._id })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('sender', 'name')
      .lean();
    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Recording marker (hook LiveKit egress + S3 in production)
const startSessionRecording = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Live session not found' });
    if (!canTeachSession(req.user, session)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (session.status !== 'live') {
      return res.status(400).json({ message: 'Session must be live to record' });
    }
    if (session.activeRecording) {
      return res.status(400).json({ message: 'Recording already active' });
    }

    const outputFileName = `session_${session._id}_${Date.now()}`;
    const egress = await startRoomCompositeEgress(session.roomId, outputFileName);
    
    if (!egress.ok) {
      return res.status(500).json({ message: 'Failed to start recording', error: egress.error });
    }

    const rec = await SessionRecording.create({
      session: session._id,
      roomId: session.roomId,
      startedBy: req.user._id,
      status: 'active',
      egressId: egress.egressId,
      playbackUrl: process.env.AWS_S3_BUCKET ? `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/recordings/${outputFileName}.mp4` : '',
    });
    session.activeRecording = rec._id;
    await session.save();

    emitToLive(attachIO(req), session.roomId, 'recording:state', { active: true });

    res.status(201).json({
      recording: rec,
      note: 'Recording started successfully using LiveKit Egress.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const stopSessionRecording = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Live session not found' });
    if (!canTeachSession(req.user, session)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!session.activeRecording) {
      return res.status(400).json({ message: 'No active recording' });
    }
    const rec = await SessionRecording.findById(session.activeRecording);
    if (rec) {
      if (rec.egressId) {
        await stopEgress(rec.egressId);
      }
      rec.status = 'completed';
      rec.durationSeconds = Math.floor((Date.now() - rec.createdAt.getTime()) / 1000);
      await rec.save();

      // Trigger Mock AI Job
      try {
        await TranscriptionJob.create({
          session: session._id,
          recordingId: rec.id || rec._id,
          status: 'completed',
          summary: 'This session covered the advanced principles of the curriculum with focus on real-world applications.',
          keyPoints: [
            'Overview of core architectural patterns',
            'Deep dive into state management strategies',
            'Interactive Q&A session on production deployment'
          ],
          processedAt: new Date(),
        });
        console.log(`[AI] Mock job created for ${rec.id || rec._id}`);
      } catch (e) {
        console.error('[AI] Job creation failed:', e);
      }
    }
    session.activeRecording = null;
    await session.save();

    emitToLive(attachIO(req), session.roomId, 'recording:state', { active: false });

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadSessionMaterial = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Live session not found' });
    if (!canTeachSession(req.user, session)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const materialUrl = `/uploads/${req.file.filename}`;
    // Store in settings or a new field
    if (!session.settings) session.settings = {};
    session.settings.materialUrl = materialUrl;
    await session.save();

    // Broadcast to the room
    const io = attachIO(req);
    emitToLive(io, session.roomId, 'session:material', { url: materialUrl });

    res.json({ url: materialUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTranscriptionSummary = async (req, res) => {
  try {
    const { recordingId } = req.params;
    const job = await TranscriptionJob.findOne({ recordingId });
    if (!job) {
      // Return a simulated one if it's new (for demo purposes)
      return res.status(404).json({ message: 'Processing in progress...' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createLiveSession,
  getLiveSessions,
  getLiveSessionById,
  updateLiveSessionStatus,
  updateLiveSessionMeta,
  getLiveKitToken,
  joinWaitingRoom,
  admitWaitingUser,
  getSessionMessages,
  startSessionRecording,
  stopSessionRecording,
  checkLiveKitHealth,
  uploadSessionMaterial,
  getTranscriptionSummary,
};
