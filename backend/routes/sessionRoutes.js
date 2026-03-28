const express = require('express');
const router = express.Router();
const {
  createSession,
  getInstructorSessions,
  getPublicSessions,
  enrollSession,
  joinSession,
} = require('../controllers/sessionController');
const { protect, instructor } = require('../middleware/authMiddleware');

// Public upcoming sessions
router.get('/upcoming', protect, getPublicSessions);

// Student enrollment and join
router.post('/:id/enroll', protect, enrollSession);
router.post('/:id/join', protect, joinSession);

// Instructor routes
router.post('/', protect, instructor, createSession);
router.get('/instructor', protect, instructor, getInstructorSessions);

module.exports = router;
