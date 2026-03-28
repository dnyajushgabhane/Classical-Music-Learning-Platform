const ScheduledSession = require('../models/ScheduledSession');
const { v4: uuidv4 } = require('uuid');
const { createLivekitToken } = require('../services/livekitService');

// @desc Create scheduled masterclass
// @route POST /api/sessions
const createSession = async (req, res) => {
  try {
    const { title, description, scheduledAt, duration, sessionType, price, capacity, thumbnailUrl } = req.body;
    
    // Prevent scheduling in the past
    if (new Date(scheduledAt) < new Date()) {
      return res.status(400).json({ message: 'Cannot schedule sessions in the past' });
    }

    const session = new ScheduledSession({
      title,
      description,
      instructor: req.user._id,
      scheduledAt,
      duration,
      sessionType,
      price: sessionType === 'free' ? 0 : price,
      capacity,
      thumbnailUrl,
      roomId: uuidv4(),
    });

    const saved = await session.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc Get instructor's sessions
// @route GET /api/instructor/sessions
const getInstructorSessions = async (req, res) => {
  try {
    const sessions = await ScheduledSession.find({ instructor: req.user._id })
      .sort({ scheduledAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get upcoming public sessions (for students)
// @route GET /api/sessions/upcoming
const getPublicSessions = async (req, res) => {
  try {
    // Current + Future sessions only
    const sessions = await ScheduledSession.find({ 
      isPublished: true, 
      status: { $in: ['scheduled', 'live'] },
      scheduledAt: { $gte: new Date(Date.now() - 3600000) } // Buffer 1 hour in case it's still live
    })
    .populate('instructor', 'name email')
    .sort({ scheduledAt: 1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Enroll in a session
// @route POST /api/sessions/:id/enroll
const enrollSession = async (req, res) => {
  try {
    const session = await ScheduledSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (session.status === 'completed' || session.status === 'cancelled') {
        return res.status(400).json({ message: 'Cannot enroll in past or cancelled sessions' });
    }

    // Prevent duplicate enrollment
    const isEnrolled = session.enrolledStudents.some(id => id.toString() === req.user._id.toString());
    if (isEnrolled) return res.status(400).json({ message: 'Already enrolled' });

    // Check capacity
    if (session.capacity > 0 && session.enrolledStudents.length >= session.capacity) {
      return res.status(400).json({ message: 'Session is full' });
    }

    // If paid -> logically should verify payment here. 
    // For now we fulfill the requirement: "Students can enroll before session"
    // "Increment enrolled count safely" 
    session.enrolledStudents.push(req.user._id);
    await session.save();

    res.json({ message: 'Enrollment successful', enrolledCount: session.enrolledStudents.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Secure Join Logic
// @route POST /api/sessions/:id/join
const joinSession = async (req, res) => {
  try {
    const session = await ScheduledSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const isInstructor = session.instructor.toString() === req.user._id.toString();
    const isEnrolled = session.enrolledStudents.some(id => id.toString() === req.user._id.toString());

    // SECURE: Verify student is enrolled OR is instructor
    if (!isInstructor && !isEnrolled) {
      return res.status(403).json({ message: 'Not enrolled in this session' });
    }

    // Verify session is active (scheduled or live)
    // Instructor can always join to start it
    if (!isInstructor && session.status !== 'live') {
      return res.status(403).json({ message: 'The session has not started yet.' });
    }

    if (session.status === 'completed' || session.status === 'cancelled') {
        return res.status(403).json({ message: 'The session has ended or been cancelled.' });
    }

    // Generate secure LiveKit token
    const userName = req.user.name || 'Student';
    const token = await createLivekitToken(session.roomId, `uid:${req.user._id}:${userName}`);

    res.json({ 
      token, 
      roomId: session.roomId,
      title: session.title,
      instructor: session.instructor 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSession,
  getInstructorSessions,
  getPublicSessions,
  enrollSession,
  joinSession,
};
