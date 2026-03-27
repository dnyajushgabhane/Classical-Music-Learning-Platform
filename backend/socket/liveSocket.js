const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LiveSession = require('../models/LiveSession');
const SessionMessage = require('../models/SessionMessage');
const { canTeachSession, canAccessSession, loadUserWithProgress } = require('../utils/liveSessionAccess');
const livekit = require('../services/livekitService');

/** @param {import('socket.io').Server} io */
function initLiveSocket(io) {
  const nsp = io.of('/live');

  nsp.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      // Also check cookies if token is not in auth object
      if (!token && socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {});
        token = cookies.token;
      }

      console.log(`[Socket] Auth attempt for socket ${socket.id}`);
      
      if (!token) {
        console.warn(`[Socket] Missing token for socket ${socket.id}`);
        return next(new Error('Missing token'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        console.warn(`[Socket] User not found for ID ${decoded.id}`);
        return next(new Error('User not found'));
      }

      socket.user = user;
      socket.userId = user._id.toString();
      console.log(`[Socket] User ${user.email} authenticated successfully`);
      next();
    } catch (err) {
      console.error(`[Socket] Auth Error for socket ${socket.id}: ${err.message}`);
      next(new Error('Unauthorized'));
    }
  });

  nsp.on('connection', (socket) => {
    console.log(`[Socket] New connection: ${socket.id} (User: ${socket.user.email})`);
    socket.join(`user:${socket.userId}`);

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${socket.id} (Reason: ${reason})`);
    });

    socket.on('room:join', async ({ roomId }, cb) => {
      try {
        if (!roomId) throw new Error('roomId required');
        const session = await LiveSession.findOne({ roomId });
        if (!session) throw new Error('Session not found');
        const user = await loadUserWithProgress(socket.user._id);
        if (!canAccessSession(user, session)) throw new Error('Forbidden');
        socket.sessionDbId = session._id.toString();
        socket.roomId = roomId;
        socket.join(roomId);

        // Update participant tracking
        const identity = `uid:${socket.userId}`;
        const existingParticipant = session.participants.find(p => p.identity === identity);
        if (existingParticipant) {
          existingParticipant.joinedAt = new Date();
        }

        nsp.to(roomId).emit('participant:joined', {
          userId: socket.userId,
          name: socket.user.name,
          identity,
        });
        cb?.({ ok: true });
      } catch (e) {
        cb?.({ ok: false, message: e.message });
      }
    });

    socket.on('room:leave', ({ roomId }) => {
      if (roomId) {
        socket.leave(roomId);
        nsp.to(roomId).emit('participant:left', { userId: socket.userId });
      }
    });

    socket.on(
      'chat:group',
      async ({ roomId, text }, cb) => {
        try {
          if (!text?.trim()) throw new Error('Empty message');
          const session = await LiveSession.findOne({ roomId });
          if (!session) throw new Error('Session not found');
          const user = await loadUserWithProgress(socket.user._id);
          if (!canAccessSession(user, session)) throw new Error('Forbidden');
          const doc = await SessionMessage.create({
            session: session._id,
            roomId,
            sender: user._id,
            senderName: user.name,
            text: text.trim().slice(0, 4000),
            scope: 'group',
          });
          const payload = {
            id: doc._id.toString(),
            sender: user._id.toString(),
            senderName: user.name,
            text: doc.text,
            scope: 'group',
            createdAt: doc.createdAt,
          };
          nsp.to(roomId).emit('chat:message', payload);
          cb?.({ ok: true, id: doc._id.toString() });
        } catch (e) {
          cb?.({ ok: false, message: e.message });
        }
      }
    );

    socket.on(
      'chat:private',
      async ({ roomId, text, recipientUserId }, cb) => {
        try {
          if (!text?.trim() || !recipientUserId) throw new Error('Invalid payload');
          const session = await LiveSession.findOne({ roomId });
          if (!session) throw new Error('Session not found');
          const user = await loadUserWithProgress(socket.user._id);
          if (!canAccessSession(user, session)) throw new Error('Forbidden');
          const doc = await SessionMessage.create({
            session: session._id,
            roomId,
            sender: user._id,
            senderName: user.name,
            text: text.trim().slice(0, 4000),
            scope: 'private',
            recipient: recipientUserId,
          });
          const payload = {
            id: doc._id.toString(),
            sender: user._id.toString(),
            senderName: user.name,
            recipient: recipientUserId,
            text: doc.text,
            scope: 'private',
            createdAt: doc.createdAt,
          };
          nsp.to(`user:${recipientUserId}`).emit('chat:private', payload);
          socket.emit('chat:private', payload);
          cb?.({ ok: true });
        } catch (e) {
          cb?.({ ok: false, message: e.message });
        }
      }
    );

    socket.on('hand:raise', async ({ roomId }) => {
      try {
        const session = await LiveSession.findOne({ roomId });
        if (!session || !canAccessSession(await loadUserWithProgress(socket.user._id), session)) return;

        if (!session.settings.allowRaiseHand) return;

        const identity = `uid:${socket.userId}`;
        const participant = session.participants.find(p => p.identity === identity);
        if (participant) {
          participant.raisedHand = !participant.raisedHand;
          participant.raisedAt = participant.raisedHand ? new Date() : null;
          await session.save();
        }

        nsp.to(roomId).emit('hand:raised', {
          userId: socket.userId,
          name: socket.user.name,
          identity,
          raised: participant?.raisedHand || false,
        });
      } catch (e) {
        // Suppress errors
      }
    });

    socket.on('hand:lower', async ({ roomId, targetIdentity }) => {
      try {
        const session = await assertHost(roomId);
        const participant = session.participants.find(p => p.identity === targetIdentity);
        if (participant) {
          participant.raisedHand = false;
          participant.raisedAt = null;
          await session.save();
        }
        nsp.to(roomId).emit('hand:lowered', { identity: targetIdentity });
      } catch (e) {
        socket.emit('host:error', { message: e.message });
      }
    });

    socket.on('reaction', async ({ roomId, emoji }) => {
      try {
        if (!emoji || emoji.length > 8) return;
        const session = await LiveSession.findOne({ roomId });
        if (!session || !canAccessSession(await loadUserWithProgress(socket.user._id), session)) return;
        nsp.to(roomId).emit('reaction', {
          userId: socket.userId,
          name: socket.user.name,
          emoji,
          ts: Date.now(),
        });
      } catch (e) {
        // Suppress errors
      }
    });

    socket.on('whiteboard:stroke', ({ roomId, stroke }) => {
      try {
        if (!stroke) return;
        nsp.to(roomId).emit('whiteboard:stroke', { stroke, from: socket.userId });
      } catch (e) {
        // Suppress errors
      }
    });

    socket.on('whiteboard:clear', async ({ roomId }) => {
      try {
        const session = await LiveSession.findOne({ roomId });
        if (!session || !canTeachSession(socket.user, session)) return;
        nsp.to(roomId).emit('whiteboard:clear', {});
      } catch (e) {
        // Suppress errors
      }
    });

    async function assertHost(roomId) {
      const session = await LiveSession.findOne({ roomId });
      if (!session || !canTeachSession(socket.user, session)) throw new Error('Host only');
      return session;
    }

    socket.on('host:mute-audio', async ({ roomId, targetIdentity }) => {
      try {
        await assertHost(roomId);
        await livekit.muteParticipantAudio(roomId, targetIdentity, true);
        nsp.to(roomId).emit('host:control', { type: 'mute-audio', targetIdentity });
      } catch (e) {
        socket.emit('host:error', { message: e.message });
      }
    });

    socket.on('host:mute-video', async ({ roomId, targetIdentity }) => {
      try {
        await assertHost(roomId);
        await livekit.muteParticipantVideo(roomId, targetIdentity, true);
        nsp.to(roomId).emit('host:control', { type: 'mute-video', targetIdentity });
      } catch (e) {
        socket.emit('host:error', { message: e.message });
      }
    });

    socket.on('host:mute-all', async ({ roomId }) => {
      try {
        await assertHost(roomId);
        const hostIdentity = `uid:${socket.userId}`;
        await livekit.muteAllAudio(roomId, hostIdentity);
        nsp.to(roomId).emit('host:control', { type: 'mute-all', exceptIdentity: hostIdentity });
      } catch (e) {
        socket.emit('host:error', { message: e.message });
      }
    });

    socket.on('host:remove', async ({ roomId, targetIdentity }) => {
      try {
        await assertHost(roomId);
        await livekit.removeParticipant(roomId, targetIdentity);
        nsp.to(roomId).emit('host:control', { type: 'remove', targetIdentity });
      } catch (e) {
        socket.emit('host:error', { message: e.message });
      }
    });

    socket.on('disconnecting', async () => {
      try {
        const rooms = [...socket.rooms].filter((r) => r !== socket.id && !r.startsWith('user:'));
        if (rooms.length > 0 && socket.roomId) {
          const roomId = socket.roomId;
          nsp.to(roomId).emit('participant:left', { userId: socket.userId });

          const session = await LiveSession.findOne({ roomId });
          if (session) {
            const identity = `uid:${socket.userId}`;
            const participant = session.participants.find((p) => p.identity === identity);
            if (participant) {
              participant.leftAt = new Date();
              await session.save();
            }
          }
        }
      } catch (e) {
        console.error('Error in disconnecting handler:', e.message);
      }
    });
  });
}

module.exports = { initLiveSocket };
