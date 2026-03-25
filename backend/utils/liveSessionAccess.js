const User = require('../models/User');

function isEnrolledInCourse(user, courseId) {
  if (!courseId) return true;
  if (!user?.progress?.length) return false;
  const cid = courseId.toString();
  return user.progress.some((p) => p.course && p.course.toString() === cid);
}

async function loadUserWithProgress(userId) {
  return User.findById(userId).populate('progress.course', '_id title');
}

function canTeachSession(user, session) {
  if (!user || !session) return false;
  return user.role === 'Admin' || session.teacher.toString() === user._id.toString();
}

/**
 * Whether user may obtain a LiveKit token (media join).
 * Waiting room still enforced in token controller.
 */
function canAccessSession(user, session) {
  if (!user || !session) return false;
  if (session.status === 'ended') return false;
  if (user.role === 'Instructor' || user.role === 'Admin') {
    return canTeachSession(user, session);
  }
  if (session.locked && !canTeachSession(user, session)) return false;
  if (!isEnrolledInCourse(user, session.course)) return false;
  return true;
}

/** Read session metadata (e.g. ended sessions) — still enrollment-gated for students */
function canViewSession(user, session) {
  if (!user || !session) return false;
  if (user.role === 'Admin') return true;
  if (canTeachSession(user, session)) return true;
  return isEnrolledInCourse(user, session.course);
}

module.exports = {
  isEnrolledInCourse,
  loadUserWithProgress,
  canTeachSession,
  canAccessSession,
  canViewSession,
};
