const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/liveSessionController');
const {
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
} = require('../controllers/enhancedLiveSessionController');
const { protect, instructor } = require('../middleware/authMiddleware');
const { liveSessionLimiter } = require('../middleware/rateLimitMiddleware');
const {
  handleValidationErrors,
} = require('../middleware/validationMiddleware');

router.get('/health/livekit', protect, checkLiveKitHealth);

router.get('/', protect, getLiveSessions);

router.post('/', protect, instructor, createLiveSession);

router.get('/:id/messages', protect, getSessionMessages);

router.post('/:id/token', protect, liveSessionLimiter, getLiveKitToken);

router.post('/:id/waiting', protect, joinWaitingRoom);

router.post('/:id/admit', protect, instructor, admitWaitingUser);

router.post('/:id/recording/start', protect, instructor, startSessionRecording);

router.post('/:id/recording/stop', protect, instructor, stopSessionRecording);

router.put('/:id/status', protect, instructor, updateLiveSessionStatus);

router.put('/:id', protect, instructor, updateLiveSessionMeta);

router.put('/:id/settings', protect, instructor, updateSessionSettings);

router.get('/:id', protect, getLiveSessionById);

// Enhanced routes
router.post('/:sessionId/invite-links', protect, instructor, ...validateInviteLink, createInviteLink);

router.get('/:sessionId/invite-links', protect, instructor, getInviteLinks);

router.delete('/:sessionId/invite-links/:linkId', protect, instructor, deactivateInviteLink);

router.post('/join/:code', protect, joinViaInviteLink);

router.post('/:sessionId/participants/audio', protect, instructor, validateParticipantAction, toggleParticipantAudio);

router.post('/:sessionId/participants/video', protect, instructor, validateParticipantAction, toggleParticipantVideo);

router.delete('/:sessionId/participants', protect, instructor, validateParticipantAction, removeParticipant);

router.post('/:sessionId/participants/permissions', protect, instructor, validateParticipantAction, updateParticipantPermissions);

router.post('/:sessionId/raise-hand', protect, raiseHand);

router.post('/:sessionId/lower-hand', protect, instructor, validateParticipantAction, lowerHand);

router.get('/:sessionId/participants', protect, getSessionParticipants);

// Meeting history
router.get('/history/meetings', protect, getMeetingHistory);

module.exports = router;
