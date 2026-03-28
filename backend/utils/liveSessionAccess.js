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
 * Central access check for LiveKit token issuance (media join).
 * Respects: public, enrolled (course check), private (invitation check).
 */
function canAccessSession(user, session) {
  if (!user || !session) return false;
  if (session.status === 'ended') return false;

  // 1. Instructors & Admins
  if (user.role === 'Admin' || user.role === 'Instructor') {
    return canTeachSession(user, session);
  }

  // 2. Room Lock (Manual lock by teacher)
  if (session.locked && !canTeachSession(user, session)) return false;

  // 3. Multi-mode Access Control
  const mode = session.accessType || 'enrolled'; // Default to enrolled for backward safety if course exists

  if (mode === 'public') return true;

  if (mode === 'private') {
    if (!session.invitedUsers) return false;
    return session.invitedUsers.some((id) => id.toString() === user._id.toString());
  }

  // mode === 'enrolled' or fallback
  return isEnrolledInCourse(user, session.course);
}

/** Read session metadata (e.g. ended sessions or list visibility) */
function canViewSession(user, session) {
  if (!user || !session) return false;
  
  // Admins and Teachers see their own
  if (user.role === 'Admin') return true;
  if (canTeachSession(user, session)) return true;

  // Derive mode for sessions without explicit accessType
  const mode = session.accessType || (session.course ? 'enrolled' : 'public');

  if (mode === 'public') return true;

  // Private is only for invited
  if (mode === 'private') {
    if (!session.invitedUsers) return false;
    return session.invitedUsers.some((id) => id.toString() === user._id.toString());
  }

  // Enrolled check
  return isEnrolledInCourse(user, session.course);
}

module.exports = {
  isEnrolledInCourse,
  loadUserWithProgress,
  canTeachSession,
  canAccessSession,
  canViewSession,
};
