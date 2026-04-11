const User = require('../models/User');

/**
 * Safely extract a string ID from either a raw ObjectId, a populated Mongoose document,
 * or any other value. Returns null if nothing can be extracted.
 */
function extractId(val) {
  if (!val) return null;
  // Populated Mongoose document: has ._id
  if (val._id) return String(val._id);
  // Plain ObjectId or string
  return String(val);
}

function isEnrolledInCourse(user, courseId) {
  if (!courseId) return true;
  if (!user?.progress?.length) return false;
  const cid = extractId(courseId);
  return user.progress.some((p) => p.course && extractId(p.course) === cid);
}

async function loadUserWithProgress(userId) {
  return User.findById(userId).populate('progress.course', '_id title');
}

/**
 * Returns true if `user` is the teacher/instructor of `session`, or is an Admin.
 * Handles both raw ObjectIds and fully populated teacher documents.
 */
function canTeachSession(user, session) {
  if (!user || !session) return false;

  // Admins always have access
  if (user.role === 'Admin') return true;

  const uid = extractId(user);
  const tDoc = session.teacher || session.instructor;
  if (!tDoc) return false;

  const tid = extractId(tDoc);

  // --- DEBUG (remove after confirming fix) ---
  try {
    const fs = require('fs');
    const path = require('path');
    fs.appendFileSync(
      path.join(__dirname, '..', 'debug_access.log'),
      `[canTeachSession] uid=${uid} tid=${tid} role=${user.role} email=${user.email} tEmail=${tDoc.email || 'N/A'} match=${tid === uid}\n`
    );
  } catch (_) {}
  // --- END DEBUG ---

  // Primary: ID match
  if (tid && uid && tid === uid) return true;

  // Fallback: Email match (works when teacher doc is populated with email)
  if (tDoc.email && user.email) {
    return String(tDoc.email).toLowerCase() === String(user.email).toLowerCase();
  }

  return false;
}

/**
 * Central access check for LiveKit token issuance (media join).
 * Handles: public, enrolled, private (invite + admitted).
 */
function canAccessSession(user, session) {
  if (!user || !session) return false;
  if (session.status === 'ended') return false;

  // Host always has access
  if (canTeachSession(user, session)) return true;

  // Room lock: only host can enter a locked room
  if (session.locked) return false;

  const mode = session.accessType || (session.course ? 'enrolled' : 'public');

  if (mode === 'public') return true;

  if (mode === 'private') {
    const uid = extractId(user);
    const isInvited = (session.invitedUsers || []).some((id) => extractId(id) === uid);
    const isAdmitted = (session.admittedUsers || []).some((id) => extractId(id) === uid);
    return isInvited || isAdmitted;
  }

  // mode === 'enrolled'
  return isEnrolledInCourse(user, session.course);
}

/**
 * Can the user read session metadata (not necessarily join via LiveKit)?
 * More permissive than canAccessSession — allows viewing ended sessions.
 */
function canViewSession(user, session) {
  if (!user || !session) return false;

  // Admins see everything
  if (user.role === 'Admin') return true;

  // Session owner always can view
  if (canTeachSession(user, session)) return true;

  const mode = session.accessType || (session.course ? 'enrolled' : 'public');

  if (mode === 'public') return true;

  if (mode === 'private') {
    const uid = extractId(user);
    const isInvited = (session.invitedUsers || []).some((id) => extractId(id) === uid);
    const isAdmitted = (session.admittedUsers || []).some((id) => extractId(id) === uid);
    return isInvited || isAdmitted;
  }

  // mode === 'enrolled'
  return isEnrolledInCourse(user, session.course);
}

module.exports = {
  extractId,
  isEnrolledInCourse,
  loadUserWithProgress,
  canTeachSession,
  canAccessSession,
  canViewSession,
};
