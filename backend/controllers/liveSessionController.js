const LiveSession = require('../models/LiveSession');
const SessionMessage = require('../models/SessionMessage');
const SessionRecording = require('../models/SessionRecording');
const {
  canAccessSession,
  canTeachSession,
  canViewSession,
  loadUserWithProgress,
} = require('../utils/liveSessionAccess');
const { createLivekitToken, removeParticipant, muteParticipant, isLivekitConfigured } = require('../services/livekitService');
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
    const statusMatch = { status: { $in: ['pending', 'scheduled', 'live'] } };

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

    const sessions = await LiveSession.find(filter)
      .populate(populateTeacher)
      .populate(populateCourse)
      .sort({ scheduledStart: 1, createdAt: -1 })
      .lean();

    const mapped = sessions.map((s) => ({
      ...s,
      status: s.status === 'pending' ? 'scheduled' : s.status,
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
    const session =
      (await LiveSession.findById(q).populate(populateTeacher).populate(populateCourse).populate({
        path: 'waitingQueue.user',
        select: 'name email',
      })) ||
      (await LiveSession.findOne({ roomId: q })
        .populate(populateTeacher)
        .populate(populateCourse)
        .populate({ path: 'waitingQueue.user', select: 'name email' }));

    if (!session) return res.status(404).json({ message: 'Live session not found' });

    const viewer = await loadUserWithProgress(req.user._id);
    if (!canViewSession(viewer, session)) {
      return res.status(403).json({ message: 'You do not have access to this session' });
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
    const session = await LiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Live session not found' });
    if (!canTeachSession(req.user, session)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!['scheduled', 'live', 'ended', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const previousStatus = session.status;
    session.status = status === 'pending' ? 'scheduled' : status;

    // If ending the session, create meeting history
    if (status === 'ended' && previousStatus === 'live') {
      const MeetingHistory = require('../models/MeetingHistory');
      const SessionMessage = require('../models/SessionMessage');

      const messages = await SessionMessage.countDocuments({ session: session._id });
      const raisedHands = session.participants.filter(p => p.raisedHand).length;

      const history = new MeetingHistory({
        session: session._id,
        roomId: session.roomId,
        title: session.title,
        teacher: session.teacher,
        participants: session.participants.map(p => ({
          user: p.user,
          identity: p.identity,
          name: p.name,
          joinedAt: p.joinedAt,
          role: p.role,
          duration: Math.floor((Date.now() - new Date(p.joinedAt).getTime()) / 1000),
        })),
        startedAt: session.updatedAt, // Approximate start time
        endedAt: new Date(),
        duration: Math.floor((Date.now() - session.updatedAt.getTime()) / 1000),
        recordings: session.activeRecording ? [session.activeRecording] : [],
        totalParticipants: session.participants.length,
        peakParticipants: session.participants.length, // Simplified
        chatMessages: messages,
        raisedHands,
        settings: {
          waitingRoomEnabled: session.waitingRoomEnabled,
          locked: session.locked,
          recordingEnabled: session.settings?.recordingEnabled || false,
        },
      });

      await history.save();
    }

    await session.save();
    emitToLive(attachIO(req), session.roomId, 'session:status', { status: session.status });
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
    const session = await LiveSession.findById(req.params.id).populate('course');
    if (!session) return res.status(404).json({ message: 'Live session not found' });

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
      return res.status(403).json({ code: 'NOT_LIVE', message: 'The class is not live yet.' });
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
      queueLength: session.waitingQueue.length,
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
    session.admittedUsers.addToSet(userId);
    session.waitingQueue = session.waitingQueue.filter((w) => w.user.toString() !== userId);
    await session.save();

    emitToUser(attachIO(req), userId, 'waiting:admitted', {
      sessionId: session._id.toString(),
      roomId: session.roomId,
    });
    emitToLive(attachIO(req), session.roomId, 'waiting:admitted-broadcast', { userId });

    res.json({ ok: true });
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
    if (session.activeRecording) {
      return res.status(400).json({ message: 'Recording already active' });
    }

    const rec = await SessionRecording.create({
      session: session._id,
      roomId: session.roomId,
      startedBy: req.user._id,
      status: 'active',
      egressId: '',
    });
    session.activeRecording = rec._id;
    await session.save();

    emitToLive(attachIO(req), session.roomId, 'recording:state', { active: true });

    res.status(201).json({
      recording: rec,
      note:
        'Configure LiveKit Egress + cloud storage to capture composite video. This record is metadata-only until egress is wired.',
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
      rec.status = 'completed';
      await rec.save();
    }
    session.activeRecording = null;
    await session.save();

    emitToLive(attachIO(req), session.roomId, 'recording:state', { active: false });

    res.json({ ok: true });
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
};
