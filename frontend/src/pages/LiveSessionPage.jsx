import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LiveKitRoom } from '@livekit/components-react';
import { motion } from 'framer-motion';
import VideoRoom from '../components/live/VideoRoom';
import { useLiveSocket } from '../hooks/useLiveSocket';
import useAuthStore from '../store/authStore';
import PageShell from '../components/layout/PageShell';
import {
  fetchLiveSession,
  getLiveKitToken,
  joinLiveWaitingRoom,
  updateLiveSessionStatus,
  fetchLiveMessages,
  updateLiveSessionMeta,
  startLiveRecording,
  stopLiveRecording,
  admitLiveUser,
} from '../services/api';

export default function LiveSessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const userInfo = useAuthStore((s) => s.userInfo);
  const { socket } = useLiveSocket();

  const [session, setSession] = useState(null);
  const [lk, setLk] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [spotlightIdentity, setSpotlightIdentity] = useState('');
  const [reactionPopup, setReactionPopup] = useState(null);
  const [recordingOn, setRecordingOn] = useState(false);
  const [waitingEntries, setWaitingEntries] = useState([]);

  const teacherId = session ? String(session.teacher?._id || session.teacher) : '';
  const selfId = userInfo ? String(userInfo._id) : '';
  const isTeacher = userInfo?.role === 'Instructor' && teacherId === selfId;

  const loadSession = useCallback(async () => {
    const data = await fetchLiveSession(sessionId);
    setSession(data);
    setSpotlightIdentity(data.spotlightIdentity || '');
    if (Array.isArray(data.waitingQueue)) {
      setWaitingEntries(
        data.waitingQueue.map((w) => ({
          userId: String(w.user?._id || w.user),
          name: w.user?.name || 'Student',
        }))
      );
    }
  }, [sessionId]);

  const loadMessages = useCallback(async () => {
    const data = await fetchLiveMessages(sessionId);
    setMessages(
      data.map((m) => ({
        id: m._id,
        sender: String(m.sender?._id || m.sender),
        senderName: m.senderName,
        text: m.text,
        scope: m.scope,
        createdAt: m.createdAt,
      }))
    );
  }, [sessionId]);

  useEffect(() => {
    studentInitRef.current = false;
  }, [sessionId]);

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }
    loadSession().catch(() => setError('Could not load session'));
  }, [userInfo, navigate, loadSession]);

  useEffect(() => {
    if (!session || !userInfo) return;
    loadMessages();
  }, [session, userInfo, loadMessages]);

  useEffect(() => {
    if (error !== 'not-live') return undefined;
    const id = setInterval(() => {
      loadSession();
    }, 8000);
    return () => clearInterval(id);
  }, [error, loadSession]);

  const tryConnect = useCallback(async () => {
    try {
      const data = await getLiveKitToken(sessionId);
      setLk(data);
      setWaiting(false);
      setError('');
    } catch (e) {
      const code = e.response?.data?.code;
      const msg = e.response?.data?.message || e.message;
      if (code === 'WAITING_ROOM') setWaiting(true);
      else if (code === 'NOT_LIVE') setError('not-live');
      else setError(msg);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!session || !userInfo) return;

    if (isTeacher) {
      if (session.status === 'live') tryConnect();
      return;
    }

    if (session.status !== 'live') {
      setError('not-live');
      return;
    }

    if (studentInitRef.current) return;
    studentInitRef.current = true;

    (async () => {
      if (session.waitingRoomEnabled) {
        const w = await joinLiveWaitingRoom(sessionId);
        if (w.admitted) await tryConnect();
        else setWaiting(true);
      } else {
        await tryConnect();
      }
    })();
  }, [session, userInfo, isTeacher, tryConnect, sessionId, session?.waitingRoomEnabled, session?.status]);

  useEffect(() => {
    if (!socket || !session?.roomId || !userInfo) return;
    const { roomId } = session;

    socket.emit('room:join', { roomId }, () => {});

    const tid = String(session.teacher?._id || session.teacher);
    const tname = session.teacher?.name || 'Guru';

    if (isTeacher) {
      setParticipants([{ userId: selfId, name: userInfo.name, role: 'host' }]);
    } else {
      setParticipants([
        { userId: tid, name: tname, role: 'host' },
        { userId: selfId, name: userInfo.name, role: 'student' },
      ]);
    }

    const onJoin = ({ userId, name }) => {
      setParticipants((prev) => {
        if (prev.some((p) => String(p.userId) === String(userId))) return prev;
        return [...prev, { userId: String(userId), name, role: 'student' }];
      });
    };
    const onLeft = ({ userId }) => {
      setParticipants((prev) => prev.filter((p) => String(p.userId) !== String(userId)));
    };

    socket.on('participant:joined', onJoin);
    socket.on('participant:left', onLeft);

    const onAdmitted = () => {
      setWaiting(false);
      tryConnect();
    };
    socket.on('waiting:admitted', onAdmitted);

    const onQueue = ({ userId, name }) => {
      setWaitingEntries((prev) => {
        if (prev.some((e) => e.userId === String(userId))) return prev;
        return [...prev, { userId: String(userId), name }];
      });
    };

    socket.on('waiting:user-joined', onQueue);

    const onMeta = (meta) => {
      if (meta.spotlightIdentity !== undefined) setSpotlightIdentity(meta.spotlightIdentity);
    };
    socket.on('session:meta', onMeta);

    const onReaction = (r) => {
      setReactionPopup(r);
      setTimeout(() => setReactionPopup(null), 2200);
    };
    socket.on('reaction', onReaction);

    const onRec = ({ active }) => setRecordingOn(!!active);
    socket.on('recording:state', onRec);

    return () => {
      socket.emit('room:leave', { roomId });
      socket.off('participant:joined', onJoin);
      socket.off('participant:left', onLeft);
      socket.off('waiting:admitted', onAdmitted);
      socket.off('waiting:user-joined', onQueue);
      socket.off('session:meta', onMeta);
      socket.off('reaction', onReaction);
      socket.off('recording:state', onRec);
    };
  }, [socket, session, userInfo, isTeacher, selfId, tryConnect]);

  const handleSpotlight = async (identity) => {
    setSpotlightIdentity(identity);
    try {
      await updateLiveSessionMeta(sessionId, { spotlightIdentity: identity });
    } catch {
      /* non-fatal */
    }
  };

  const handleRecordingToggle = async () => {
    try {
      if (recordingOn) {
        await stopLiveRecording(sessionId);
        setRecordingOn(false);
      } else {
        await startLiveRecording(sessionId);
        setRecordingOn(true);
      }
    } catch {
      /* toast in production */
    }
  };

  const goLive = async () => {
    await updateLiveSessionStatus(sessionId, 'live');
    await loadSession();
    await tryConnect();
  };

  if (!session) {
    return (
      <PageShell>
        <p className="text-gold text-center py-24 animate-pulse font-display">Opening classroom…</p>
      </PageShell>
    );
  }

  if (error === 'not-live' && !isTeacher) {
    return (
      <PageShell className="max-w-lg text-center">
        <h1 className="font-display text-2xl text-ivory mb-4">{session.title}</h1>
        <p className="text-ivory/55 mb-6">The guru has not started this session yet.</p>
        {session.scheduledStart && (
          <p className="text-sm text-gold/80 mb-8">
            Scheduled: {new Date(session.scheduledStart).toLocaleString()}
          </p>
        )}
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => loadSession()}
          className="rounded-full border border-gold/40 px-8 py-3 text-gold text-sm font-semibold"
        >
          Refresh
        </motion.button>
      </PageShell>
    );
  }

  if (waiting && !lk) {
    return (
      <PageShell className="max-w-lg text-center">
        <h1 className="font-display text-2xl text-ivory mb-4">Waiting room</h1>
        <p className="text-ivory/55">The host will admit you shortly.</p>
        <p className="text-xs text-ivory/35 mt-8">Do not close this tab.</p>
      </PageShell>
    );
  }

  if (error && !lk) {
    return (
      <PageShell className="max-w-lg">
        <p className="text-saffron mb-4">{error}</p>
        <p className="text-sm text-ivory/45">
          Add LiveKit credentials to the backend (.env) and ensure this account is enrolled in the session course.
        </p>
      </PageShell>
    );
  }

  if (isTeacher && session.status !== 'live' && !lk) {
    return (
      <PageShell className="max-w-xl">
        <h1 className="font-display text-2xl text-ivory mb-2">{session.title}</h1>
        <p className="text-ivory/50 text-sm mb-8">Prepare your instruments — start when students may enter.</p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={goLive}
          className="w-full sm:w-auto rounded-full bg-gradient-to-r from-gold to-gold-dark text-ink font-bold px-10 py-3 shadow-glow mb-10"
        >
          Go live
        </motion.button>

        {session.waitingRoomEnabled && waitingEntries.length > 0 && (
          <div className="music-sheet-card rounded-2xl p-6 border-gold/20">
            <h2 className="text-sm font-semibold text-gold mb-4 uppercase tracking-widest">Waiting</h2>
            <ul className="space-y-2">
              {waitingEntries.map((e) => (
                <li key={e.userId} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-ivory truncate">{e.name || e.userId}</span>
                  <button
                    type="button"
                    className="shrink-0 text-xs font-bold text-gold border border-gold/30 rounded-lg px-3 py-1"
                    onClick={async () => {
                      await admitLiveUser(sessionId, e.userId);
                      setWaitingEntries((prev) => prev.filter((x) => x.userId !== e.userId));
                      loadSession();
                    }}
                  >
                    Admit
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </PageShell>
    );
  }

  if (!lk?.token || !lk?.url) {
    return (
      <PageShell>
        <p className="text-ivory/55">Connecting to media server…</p>
      </PageShell>
    );
  }

  return (
    <LiveKitRoom
      token={lk.token}
      serverUrl={lk.url}
      connect
      video
      audio
      options={{
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        videoCaptureDefaults: {
          resolution: { width: 1280, height: 720, frameRate: 30 },
        },
      }}
      onDisconnected={() => {
        setLk(null);
        navigate('/dashboard');
      }}
    >
      <VideoRoom
        session={session}
        socket={socket}
        userInfo={userInfo}
        onLeave={() => navigate('/dashboard')}
        chatMessages={messages}
        participants={participants}
        onFetchMessages={loadMessages}
        onSpotlightMeta={handleSpotlight}
        spotlightIdentity={spotlightIdentity}
        recordingOn={recordingOn}
        onToggleRecording={handleRecordingToggle}
        reactionPopup={reactionPopup}
      />
    </LiveKitRoom>
  );
}
