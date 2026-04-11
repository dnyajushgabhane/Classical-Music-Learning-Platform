const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LiveSession = require('../models/LiveSession');
const ScheduledSession = require('../models/ScheduledSession');
const SessionMessage = require('../models/SessionMessage');
const { canTeachSession, canAccessSession, loadUserWithProgress } = require('../utils/liveSessionAccess');
const livekit = require('../services/livekitService');

/** @param {import('socket.io').Server} io */
function initLiveSocket(io) {
  const nsp = io.of('/live');

  nsp.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {});
        token = cookies.token;
      }

      if (!token) return next(new Error('Missing token'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      socket.userId = user._id.toString();
      next();
    } catch (err) {
      next(new Error('Unauthorized'));
    }
  });

  nsp.on('connection', (socket) => {
    console.log(`[Socket] New connection: ${socket.id} (User: ${socket.userId})`);
    socket.join(`user:${socket.userId}`);

    socket.on('room:join', async ({ roomId: _roomId }, cb) => {
      try {
        const roomId = _roomId?.trim();
        if (!roomId) throw new Error('roomId required');
        let session = await LiveSession.findOne({ roomId });
        if (!session) {
          session = await ScheduledSession.findOne({ roomId });
        }
        if (!session) throw new Error('Session not found');
        const user = await loadUserWithProgress(socket.user._id);
        const isHost = canTeachSession(user, session);

        // ─── WAITING ROOM GATE ───────────────────────────────────────────────
        // For sessions with waiting room enabled, non-host, non-admitted users
        // must NOT be added as full participants or emit participant:joined.
        if (!isHost && session.waitingRoomEnabled) {
          const uid = user._id.toString();
          const alreadyAdmitted = (session.admittedUsers || []).some(
            (id) => id.toString() === uid
          );

          if (!alreadyAdmitted) {
            // Add to waiting queue if not already there
            const alreadyWaiting = (session.waitingQueue || []).some(
              (w) => w.user.toString() === uid
            );
            if (!alreadyWaiting) {
              session.waitingQueue.push({ user: user._id });
              await session.save();
            }

            // Track as 'waiting' participant in DB (for server-side audit)
            const identity = `uid:${uid}`;
            const existing = session.participants.find((p) => p.identity === identity);
            if (!existing) {
              session.participants.push({
                identity,
                user: user._id,
                name: user.name,
                role: 'participant',
                status: 'waiting',
                joinedAt: new Date(),
              });
              await session.save();
            }

            // Tell the host a student is waiting
            nsp.to(roomId).emit('waiting:user-joined', {
              userId: uid,
              name: user.name,
              queueLength: session.waitingQueue.length,
            });

            // Tell the student they are in the waiting room
            cb?.({ ok: false, code: 'WAITING_ROOM', message: 'Waiting for host admission' });
            return;
          }
        }
        // ────────────────────────────────────────────────────────────────────

        // User is host or admitted — full join
        if (!isHost && !canAccessSession(user, session)) throw new Error('Forbidden');

        socket.roomId = roomId;
        socket.role = isHost ? 'host' : 'participant';
        socket.join(roomId);
        console.log(`[Socket] User ${socket.userId} joined room: ${roomId} as ${socket.role}`);

        const identity = `uid:${socket.userId}`;
        
        // Use atomic update to avoid version conflicts and duplicates
        // We first try to update existing participant in the array
        const updatedSession = await LiveSession.findOneAndUpdate(
          { roomId, "participants.identity": identity },
          {
            $set: {
              "participants.$.joinedAt": new Date(),
              "participants.$.role": socket.role,
              "participants.$.status": 'joined',
              "participants.$.name": socket.user.name
            }
          },
          { new: true }
        );

        // If participant wasn't in array, add them
        if (!updatedSession) {
          await LiveSession.findOneAndUpdate(
            { roomId },
            {
              $addToSet: {
                participants: {
                  identity,
                  user: user._id,
                  name: user.name,
                  role: socket.role,
                  status: 'joined',
                  joinedAt: new Date()
                }
              }
            }
          );
        }

        nsp.to(roomId).emit('participant:joined', {
          userId: socket.userId,
          name: socket.user.name,
          identity,
          role: socket.role,
          status: 'joined',
        });

        cb?.({ 
          ok: true, 
          role: socket.role,
          participants: (session.participants || [])
            .filter(p => p.status === 'joined')
            .map(p => ({
              userId: p.user.toString(),
              name: p.name,
              identity: p.identity,
              role: p.role,
              raisedHand: !!p.raisedHand,
              status: p.status,
            })),
          waitingQueue: isHost
            ? session.waitingQueue.map(w => ({
                userId: w.user.toString(),
                name: (session.participants || []).find(p => p.user.toString() === w.user.toString())?.name || 'Student',
              }))
            : [],
          recording: !!session.activeRecording,
          spotlight: session.spotlightIdentity || ''
        });
      } catch (e) {
        console.error(`[Socket] room:join error: ${e.message}`);
        cb?.({ ok: false, message: e.message });
      }
    });

    socket.on('room:sync', async ({ roomId }, cb) => {
      try {
        let session = await LiveSession.findOne({ roomId });
        if (!session) session = await ScheduledSession.findOne({ roomId });
        if (!session) return cb?.({ ok: false, message: 'Not found' });
        cb?.({
          ok: true,
          participants: (session.participants || [])
            .filter(p => p.status === 'joined')
            .map(p => ({
              userId: p.user.toString(),
              name: p.name,
              identity: p.identity,
              role: p.role,
              raisedHand: !!p.raisedHand
            })),
          recording: !!session.activeRecording,
          spotlight: session.spotlightIdentity || ''
        });
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

    socket.on('chat:group', async ({ roomId, text }, cb) => {
      try {
        console.log(`[Chat] Group msg from ${socket.userId} in room ${roomId}`);
        if (!text?.trim()) throw new Error('Empty message');
        
        let session = await LiveSession.findOne({ roomId });
        if (!session) session = await ScheduledSession.findOne({ roomId });
        if (!session || !canAccessSession(await loadUserWithProgress(socket.user._id), session)) throw new Error('Forbidden');
        
        const doc = await SessionMessage.create({
          session: session._id,
          roomId,
          sender: socket.userId,
          senderName: socket.user.name,
          text: text.trim().slice(0, 4000),
          scope: 'group',
        });
        
        const payload = {
          id: doc._id,
          sender: socket.userId,
          senderName: socket.user.name,
          text: doc.text,
          scope: 'group',
          createdAt: doc.createdAt,
        };

        // Broadcast to EVERYONE in the room including sender
        nsp.to(roomId).emit('chat:message', payload);
        
        // Acknowledge to sender
        cb?.({ ok: true, message: payload });
      } catch (e) { 
        console.error(`[Chat] Error: ${e.message}`);
        cb?.({ ok: false, message: e.message }); 
      }
    });

    socket.on('chat:private', async ({ roomId, text, recipientUserId }, cb) => {
      try {
        console.log(`[Chat] Private msg from ${socket.userId} to ${recipientUserId} in room ${roomId}`);
        if (!text?.trim() || !recipientUserId) throw new Error('Invalid private message');

        const doc = await SessionMessage.create({
          roomId,
          sender: socket.userId,
          senderName: socket.user.name,
          text: text.trim().slice(0, 4000),
          scope: 'private',
          recipient: recipientUserId,
        });

        const payload = {
          id: doc._id,
          sender: socket.userId,
          senderName: socket.user.name,
          text: doc.text,
          scope: 'private',
          createdAt: doc.createdAt,
        };

        // Emit to sender's own channel and recipient's channel
        nsp.to(`user:${socket.userId}`).emit('chat:message', payload);
        nsp.to(`user:${recipientUserId}`).emit('chat:message', payload);

        cb?.({ ok: true, message: payload });
      } catch (e) {
        cb?.({ ok: false, message: e.message });
      }
    });

    socket.on('hand:raise', async ({ roomId }) => {
      try {
        let session = await LiveSession.findOne({ roomId });
        if (!session) session = await ScheduledSession.findOne({ roomId });
        if (!session || !canAccessSession(await loadUserWithProgress(socket.user._id), session)) return;
        if (!session.settings || !session.settings.allowRaiseHand) return;

        const identity = `uid:${socket.userId}`;
        const p = session.participants.find(x => x.identity === identity);
        if (p) {
          p.raisedHand = !p.raisedHand;
          p.raisedAt = p.raisedHand ? new Date() : null;
          await session.save();
          nsp.to(roomId).emit('hand:raised', {
            userId: socket.userId,
            identity,
            raised: p.raisedHand,
            name: socket.user.name
          });
        }
      } catch (e) {}
    });

    socket.on('session:reaction', ({ roomId, type }) => {
      console.log(`[Reaction] ${type} from ${socket.userId} in room ${roomId}`);
      // Validate reaction type
      const allowed = ['❤️', '👍', '😂', '👏', '🔥'];
      if (!allowed.includes(type)) return;
      
      nsp.to(roomId).emit('session:reaction', {
        userId: socket.userId,
        name: socket.user.name,
        type
      });
    });

    // ─── WHITEBOARD HANDLERS ──────────────────────────────────────────────
    socket.on('whiteboard:stroke', ({ roomId, stroke }) => {
      if (!roomId || !stroke) return;
      // Broadcast to everyone else in the room
      socket.to(roomId).emit('whiteboard:stroke', { stroke });
    });

    socket.on('whiteboard:clear', async ({ roomId }) => {
      try {
        await assertHost(roomId);
        nsp.to(roomId).emit('whiteboard:clear');
      } catch (e) { socket.emit('host:error', { message: e.message }); }
    });
    // ──────────────────────────────────────────────────────────────────────

    async function assertHost(roomId) {
      let session = await LiveSession.findOne({ roomId });
      if (!session) session = await ScheduledSession.findOne({ roomId });
      if (!session || !canTeachSession(socket.user, session)) throw new Error('Host only');
      return session;
    }

    socket.on('host:mute-audio', async ({ roomId, targetIdentity }) => {
      try {
        await assertHost(roomId);
        const res = await livekit.muteParticipantAudio(roomId, targetIdentity, true);
        if (res.ok) nsp.to(roomId).emit('host:control', { type: 'mute-audio', targetIdentity });
        else socket.emit('host:error', { message: res.error });
      } catch (e) { socket.emit('host:error', { message: e.message }); }
    });

    socket.on('host:mute-video', async ({ roomId, targetIdentity }) => {
      try {
        await assertHost(roomId);
        const res = await livekit.muteParticipantVideo(roomId, targetIdentity, true);
        if (res.ok) nsp.to(roomId).emit('host:control', { type: 'mute-video', targetIdentity });
        else socket.emit('host:error', { message: res.error });
      } catch (e) { socket.emit('host:error', { message: e.message }); }
    });

    socket.on('host:mute-all', async ({ roomId }) => {
      try {
        await assertHost(roomId);
        const hostIdentity = `uid:${socket.userId}`;
        const res = await livekit.muteAllAudio(roomId, hostIdentity);
        if (res.ok) nsp.to(roomId).emit('host:control', { type: 'mute-all', exceptIdentity: hostIdentity });
        else socket.emit('host:error', { message: res.error });
      } catch (e) { socket.emit('host:error', { message: e.message }); }
    });

    socket.on('host:remove', async ({ roomId, targetIdentity }) => {
      try {
        await assertHost(roomId);
        const res = await livekit.removeParticipant(roomId, targetIdentity);
        if (res.ok) {
          nsp.to(roomId).emit('host:control', { type: 'remove', targetIdentity });
          const session = await LiveSession.findOne({ roomId });
          if (session) {
            session.participants = session.participants.filter(p => p.identity !== targetIdentity);
            await session.save();
          }
        } else socket.emit('host:error', { message: res.error });
      } catch (e) { socket.emit('host:error', { message: e.message }); }
    });

    socket.on('disconnecting', async () => {
      try {
        const rooms = [...socket.rooms].filter(r => r !== socket.id && !r.startsWith('user:'));
        const roomId = socket.roomId || (rooms.length > 0 ? rooms[0] : null);
        if (roomId) {
          nsp.to(roomId).emit('participant:left', { userId: socket.userId });
          let session = await LiveSession.findOne({ roomId });
          if (!session) session = await ScheduledSession.findOne({ roomId });
          
          if (session && session.status === 'live') {
            const userIdStr = socket.userId.toString();
            // Remove from participants
            session.participants = session.participants.filter(p => p.identity !== `uid:${socket.userId}`);
            await session.save();

            // GRACE PERIOD CLEANUP
            // Check if ANY host is still present in the updated participants
            const anyHostLeft = session.participants.some(p => p.role === 'host');
            
            if (!anyHostLeft) {
              // No host left. Wait 1 minute, check again, and if still no host, end it.
              setTimeout(async () => {
                try {
                  const finalCheck = await (session.constructor.modelName === 'ScheduledSession' 
                    ? ScheduledSession.findById(session._id) 
                    : LiveSession.findById(session._id));
                  
                  if (finalCheck && finalCheck.status === 'live') {
                    const hostPresent = finalCheck.participants.some(p => p.role === 'host');
                    if (!hostPresent) {
                      console.log(`[AutoEnd] Session ${finalCheck._id} ended - no host present.`);
                      finalCheck.status = 'ended';
                      finalCheck.isLive = false;
                      finalCheck.endedAt = new Date();
                      await finalCheck.save();
                      
                      // Broadcast globally
                      nsp.emit('session:ended', { sessionId: finalCheck._id.toString(), roomId: finalCheck.roomId });
                    }
                  }
                } catch (err) { console.error('[AutoEnd] Error:', err); }
              }, 60000); // 1 minute grace for reconnect
            }
          }
        }
      } catch (e) {}
    });
  });
}

module.exports = { initLiveSocket };
