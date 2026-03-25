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
} = require('../controllers/liveSessionController');
const { protect, instructor } = require('../middleware/authMiddleware');

router.get('/', protect, getLiveSessions);

router.post('/', protect, instructor, createLiveSession);

router.get('/:id/messages', protect, getSessionMessages);

router.post('/:id/token', protect, getLiveKitToken);

router.post('/:id/waiting', protect, joinWaitingRoom);

router.post('/:id/admit', protect, instructor, admitWaitingUser);

router.post('/:id/recording/start', protect, instructor, startSessionRecording);

router.post('/:id/recording/stop', protect, instructor, stopSessionRecording);

router.put('/:id/status', protect, instructor, updateLiveSessionStatus);

router.put('/:id', protect, instructor, updateLiveSessionMeta);

router.get('/:id', protect, getLiveSessionById);

module.exports = router;
