const LiveSession = require('../models/LiveSession');
const MeetingHistory = require('../models/MeetingHistory');
const InviteLink = require('../models/InviteLink');
const User = require('../models/User');
const {
  canAccessSession,
  canTeachSession,
  canViewSession,
  loadUserWithProgress,
} = require('../utils/liveSessionAccess');
const livekit = require('../services/livekitService');
const {
  validateObjectId,
  validateRequiredString,
  validateOptionalString,
  validateBoolean,
  validateDate,
  validatePositiveInteger,
  handleValidationErrors,
} = require('../middleware/validationMiddleware');
const { body } = require('express-validator');

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

// Validation middleware
const validateParticipantAction = [
  validateRequiredString('identity'),
  handleValidationErrors,
];

const validateInviteLink = [
  validateDate('expiresAt'),
  validatePositiveInteger('maxUses'),
  validateBoolean('permissions.canPublish'),
  validateBoolean('permissions.canSubscribe'),
  validateBoolean('permissions.canPublishData'),
  body('permissions.role').optional().isIn(['participant', 'moderator']).withMessage('Invalid role'),
  handleValidationErrors,
];

// @desc Create invite link for session
const createInviteLink = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Live session not found' });

    if (!canTeachSession(req.user, session)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { expiresAt, maxUses, permissions } = req.body;

    const inviteLink = new InviteLink({
      session: session._id,
      createdBy: req.user._id,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      maxUses,
      permissions: {
        ...permissions,
        canPublish: permissions?.canPublish !== false,
        canSubscribe: permissions?.canSubscribe !== false,
        canPublishData: permissions?.canPublishData !== false,
      },
    });

    const saved = await inviteLink.save();
    await saved.populate('createdBy', 'name email');

    res.status(201).json(saved);
  } catch (error) {
    console.error('Create invite link error:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc Get invite links for session
const getInviteLinks = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Live session not found' });

    if (!canTeachSession(req.user, session)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const links = await InviteLink.find({
      session: session._id,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).populate('createdBy', 'name email').sort({ createdAt: -1 });

    res.json(links);
  } catch (error) {
    console.error('Get invite links error:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc Deactivate invite link
const deactivateInviteLink = async (req, res) => {
  try {
    const link = await InviteLink.findById(req.params.linkId);
    if (!link) return res.status(404).json({ message: 'Invite link not found' });

    const session = await LiveSession.findById(link.session);
    if (!canTeachSession(req.user, session)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    link.isActive = false;
    await link.save();

    res.json({ message: 'Invite link deactivated' });
  } catch (error) {
    console.error('Deactivate invite link error:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc Join session via invite link
const joinViaInviteLink = async (req, res) => {
  try {
    const { code } = req.params;

    const link = await InviteLink.findOne({
      code,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).populate('session');

    if (!link) {
      return res.status(404).json({ message: 'Invalid or expired invite link' });
    }

    if (link.maxUses && link.usedCount >= link.maxUses) {
      return res.status(400).json({ message: 'Invite link has reached maximum uses' });
    }

    const session = link.session;
    const user = await loadUserWithProgress(req.user._id);

    // Check if user can access the session
    if (!canAccessSession(user, session)) {
      return res.status(403).json({ message: 'Not authorized to join this session' });
    }

    // Record usage
    link.usedCount += 1;
    link.usedBy.push({ user: user._id });
    await link.save();

    // Admit user if waiting room is enabled
    if (session.waitingRoomEnabled) {
      session.admittedUsers.addToSet(user._id);
      await session.save();
    }

    res.json({
      session: {
        _id: session._id,
        title: session.title,
        roomId: session.roomId,
        status: session.status,
      },
      permissions: link.permissions,
    });
  } catch (error) {
    console.error('Join via invite link error:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc Mute/unmute participant
const toggleParticipantAudio = async (req, res) => {
  try {
    const { identity, mute } = req.body;
    const session = await LiveSession.findById(req.params.sessionId);

    if (!session) return res.status(404).json({ message: 'Live session not found' });
    if (!canTeachSession(req.user, session)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await livekit.muteParticipantAudio(session.roomId, identity, mute);

    if (!result.ok) {
      return res.status(500).json({ message: result.error });
    }

    // Update session state
    const participant = session.participants.find(p => p.identity === identity);
    if (participant) {
      participant.permissions.muted = mute;
      await session.save();
    }

    emitToLive(attachIO(req), session.roomId, 'participant:audio-muted', {
      identity,
      muted: mute,
    });

    res.json({ message: `Participant ${mute ? 'muted' : 'unmuted'}` });
  } catch (error) {
    console.error('Toggle participant audio error:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc Mute/unmute participant video
const toggleParticipantVideo = async (req, res) => {
  try {
    const { identity, mute } = req.body;
    const session = await LiveSession.findById(req.params.sessionId);

    if (!session) return res.status(404).json({ message: 'Live session not found' });
    if (!canTeachSession(req.user, session)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await livekit.muteParticipantVideo(session.roomId, identity, mute);

    if (!result.ok) {
      return res.status(500).json({ message: result.error });
    }

    // Update session state
    const participant = session.participants.find(p => p.identity === identity);
    if (participant) {
      participant.permissions.videoMuted = mute;
      await session.save();
    }

    emitToLive(attachIO(req), session.roomId, 'participant:video-muted', {
      identity,
      videoMuted: mute,
    });

    res.json({ message: `Participant video ${mute ? 'muted' : 'unmuted'}` });
  } catch (error) {
    console.error('Toggle participant video error:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc Remove participant from session
const removeParticipant = async (req, res) => {
  try {
    const { identity } = req.body;
    const session = await LiveSession.findById(req.params.sessionId);

    if (!session) return res.status(404).json({ message: 'Live session not found' });
    if (!canTeachSession(req.user, session)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await livekit.removeParticipant(session.roomId, identity);

    if (!result.ok) {
      return res.status(500).json({ message: result.error });
    }

    // Remove from session participants
    session.participants = session.participants.filter(p => p.identity !== identity);
    await session.save();

    emitToLive(attachIO(req), session.roomId, 'participant:removed', { identity });

    res.json({ message: 'Participant removed' });
  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc Raise hand
const raiseHand = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Live session not found' });

    const user = await loadUserWithProgress(req.user._id);
    if (!canAccessSession(user, session)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!session.settings.allowRaiseHand) {
      return res.status(400).json({ message: 'Raise hand is disabled for this session' });
    }

    const identity = `uid:${user._id.toString()}`;
    const participant = session.participants.find(p => p.identity === identity);

    if (!participant) {
      return res.status(400).json({ message: 'Participant not found in session' });
    }

    participant.raisedHand = !participant.raisedHand;
    participant.raisedAt = participant.raisedHand ? new Date() : null;

    await session.save();

    emitToLive(attachIO(req), session.roomId, 'participant:hand-raised', {
      identity,
      raised: participant.raisedHand,
      name: participant.name,
    });

    res.json({ raised: participant.raisedHand });
  } catch (error) {
    console.error('Raise hand error:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc Lower hand (host action)
const lowerHand = async (req, res) => {
  try {
    const { identity } = req.body;
    const session = await LiveSession.findById(req.params.sessionId);

    if (!session) return res.status(404).json({ message: 'Live session not found' });
    if (!canTeachSession(req.user, session)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const participant = session.participants.find(p => p.identity === identity);
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    participant.raisedHand = false;
    participant.raisedAt = null;
    await session.save();

    emitToLive(attachIO(req), session.roomId, 'participant:hand-lowered', { identity });

    res.json({ message: 'Hand lowered' });
  } catch (error) {
    console.error('Lower hand error:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc Update participant permissions
const updateParticipantPermissions = async (req, res) => {
  try {
    const { identity, permissions } = req.body;
    const session = await LiveSession.findById(req.params.sessionId);

    if (!session) return res.status(404).json({ message: 'Live session not found' });
    if (!canTeachSession(req.user, session)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const participant = session.participants.find(p => p.identity === identity);
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Update permissions
    if (permissions.canPublishAudio !== undefined) {
      participant.permissions.canPublishAudio = permissions.canPublishAudio;
    }
    if (permissions.canPublishVideo !== undefined) {
      participant.permissions.canPublishVideo = permissions.canPublishVideo;
    }
    if (permissions.canPublishData !== undefined) {
      participant.permissions.canPublishData = permissions.canPublishData;
    }

    await session.save();

    emitToLive(attachIO(req), session.roomId, 'participant:permissions-updated', {
      identity,
      permissions: participant.permissions,
    });

    res.json({ message: 'Permissions updated', permissions: participant.permissions });
  } catch (error) {
    console.error('Update participant permissions error:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc Get meeting history
const getMeetingHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const user = await loadUserWithProgress(req.user._id);
    let filter = {};

    if (user.role === 'Instructor') {
      filter.teacher = user._id;
    } else if (user.role !== 'Admin') {
      // For students, only show history for sessions they participated in
      filter['participants.user'] = user._id;
    }

    const history = await MeetingHistory.find(filter)
      .populate('session', 'title course')
      .populate('teacher', 'name email')
      .populate('participants.user', 'name email')
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MeetingHistory.countDocuments(filter);

    res.json({
      history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get meeting history error:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc Get session participants
const getSessionParticipants = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Live session not found' });

    const user = await loadUserWithProgress(req.user._id);
    if (!canViewSession(user, session)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get LiveKit participants
    const livekitResult = await livekit.listParticipants(session.roomId);
    const livekitParticipants = livekitResult.ok ? livekitResult.participants : [];

    // Merge with session participants data
    const participants = session.participants.map(sessionParticipant => {
      const livekitParticipant = livekitParticipants.find(lp => lp.identity === sessionParticipant.identity);
      return {
        ...sessionParticipant.toObject(),
        isConnected: !!livekitParticipant,
        tracks: livekitParticipant?.tracks || [],
      };
    });

    res.json({ participants });
  } catch (error) {
    console.error('Get session participants error:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc Update session settings
const updateSessionSettings = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Live session not found' });

    if (!canTeachSession(req.user, session)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const {
      allowRaiseHand,
      allowChat,
      allowScreenShare,
      maxParticipants,
      recordingEnabled,
    } = req.body;

    session.settings = {
      ...session.settings,
      allowRaiseHand: allowRaiseHand !== undefined ? allowRaiseHand : session.settings.allowRaiseHand,
      allowChat: allowChat !== undefined ? allowChat : session.settings.allowChat,
      allowScreenShare: allowScreenShare !== undefined ? allowScreenShare : session.settings.allowScreenShare,
      maxParticipants: maxParticipants || session.settings.maxParticipants,
      recordingEnabled: recordingEnabled !== undefined ? recordingEnabled : session.settings.recordingEnabled,
    };

    await session.save();

    emitToLive(attachIO(req), session.roomId, 'session:settings-updated', session.settings);

    res.json(session.settings);
  } catch (error) {
    console.error('Update session settings error:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

module.exports = {
  createInviteLink,
  getInviteLinks,
  deactivateInviteLink,
  joinViaInviteLink,
  toggleParticipantAudio,
  toggleParticipantVideo,
  removeParticipant,
  raiseHand,
  lowerHand,
  updateParticipantPermissions,
  getMeetingHistory,
  getSessionParticipants,
  updateSessionSettings,
  validateParticipantAction,
  validateInviteLink,
};