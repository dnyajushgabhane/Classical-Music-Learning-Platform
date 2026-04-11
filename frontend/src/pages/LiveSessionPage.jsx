import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LiveKitRoom } from '@livekit/components-react';
import { Room, RoomEvent, VideoPresets, Track } from 'livekit-client';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCcw, WifiOff, Loader2 } from 'lucide-react';
import VideoRoom from '../components/live/VideoRoom';
import { useLiveSocket } from '../hooks/useLiveSocket';
import useAuthStore from '../store/authStore';
import PageShell from '../components/layout/PageShell';
import { getLiveKitURL } from '../config/env';
import {
  fetchLiveSession,
  getLiveKitToken,
  joinLiveWaitingRoom,
  updateLiveSessionStatus,
  fetchLiveMessages,
  updateLiveSessionMeta,
  startLiveRecording,
  stopLiveRecording,
  checkLiveKitHealth,
  joinScheduledSession,
  admitLiveUser,
} from '../services/api';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1500;

export default function LiveSessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const userInfo = useAuthStore((s) => s.userInfo);
  const { socket, connected: socketConnected } = useLiveSocket();

  // Session & UI States
  const [session, setSession] = useState(null);
  const [lk, setLk] = useState(null); // { token, url }
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('idle'); // idle | checking | connecting | connected | retrying | failed | disconnected
  const [retryCount, setRetryCount] = useState(0);
  const [healthStatus, setHealthStatus] = useState(null);
  const [shouldPublish, setShouldPublish] = useState(false);

  // Classroom Data States
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [spotlightIdentity, setSpotlightIdentity] = useState('');
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [recordingOn, setRecordingOn] = useState(false);
  const [waitingEntries, setWaitingEntries] = useState([]);
  const [layout, setLayout] = useState('grid');

  // Refs for lifecycle control
  const mountingRef = useRef(false);
  const connectionInProgressRef = useRef(false);
  const retryTimeoutRef = useRef(null);
  const lastAdmitTimeRef = useRef(0);
  const joinedRoomRef = useRef(null);

  const roomRef = useRef(null);
  const [roomInstance, setRoomInstance] = useState(null);

  const isTeacher = userInfo?.role === 'Instructor' || userInfo?.role === 'Admin';

  // --- Helpers ---

  const log = (msg, data = null) => {
    const time = new Date().toLocaleTimeString();
    if (data) console.log(`[Meeting ${time}] ${msg}`, data);
    else console.log(`[Meeting ${time}] ${msg}`);
  };

  const loadSession = useCallback(async () => {
    log(`Loading session metadata: ${sessionId}`);
    try {
      const data = await fetchLiveSession(sessionId);
      setSession(data);
      setSpotlightIdentity(data.spotlightIdentity || '');
      setRecordingOn(!!data.activeRecording);
      if (Array.isArray(data.waitingQueue)) {
        setWaitingEntries(
          data.waitingQueue.map((w) => ({
            userId: String(w.user?._id || w.user),
            name: w.user?.name || 'Student',
          }))
        );
      }
    } catch (err) {
      log('Failed to load session metadata', err);
      setError('Could not load session details.');
    }
  }, [sessionId]);

  const loadMessages = useCallback(async () => {
    try {
      const data = await fetchLiveMessages(sessionId);
      setMessages(data.map(m => ({
        id: m._id,
        sender: String(m.sender?._id || m.sender),
        senderName: m.senderName,
        text: m.text,
        scope: m.scope,
        createdAt: m.createdAt,
      })));
    } catch (err) {
      log('Failed to load messages', err);
    }
  }, [sessionId]);

  const performHealthCheck = async () => {
    setConnectionStatus('checking');
    log('Performing LiveKit health check...');
    try {
      const health = await checkLiveKitHealth();
      setHealthStatus(health);
      setConnectionStatus('idle');
      return true;
    } catch (err) {
      log('Health check failed', err);
      setConnectionStatus('failed');
      setError('Media server unreachable.');
      return false;
    }
  };

  const tryConnect = useCallback(async (isRetry = false) => {
    // 🛡️ Lock to prevent parallel connection attempts
    if (connectionInProgressRef.current) return;
    connectionInProgressRef.current = true;
    
    // 1. Reset state for fresh start
    setLk(null);
    setShouldPublish(false);
    setRoomInstance(null);

    // 2. Cleanup existing room instance
    if (roomRef.current) {
      log('Cleaning up existing room instance before retry/connect...');
      roomRef.current.removeAllListeners();
      if (roomRef.current.state !== 'disconnected') {
        await roomRef.current.disconnect();
      }
      roomRef.current = null;
    }

    if (!isRetry) {
      setConnectionStatus('connecting');
      setRetryCount(0);
    } else {
      setConnectionStatus('retrying');
    }

    try {
      const queryParams = new URLSearchParams(window.location.search);
      const isMasterclass = queryParams.get('type') === 'masterclass';
      
      let data;
      if (isMasterclass) {
        data = await joinScheduledSession(sessionId);
      } else {
        data = await getLiveKitToken(sessionId);
      }
      
      const wsUrl = getLiveKitURL(data.url);
      
      // 3. Create FRESH Room instance
      log('Creating fresh Room instance...');
      const r = new Room({
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          videoSimulcast: true,
          videoCodec: 'h264',
          videoEncoding: VideoPresets.h720.encoding,
        },
        audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true }
      });

      // 4. Setup listeners on fresh instance
      r.on(RoomEvent.Disconnected, (reason) => {
        log(`[Room] Disconnected: ${reason}`);
        setConnectionStatus('disconnected');
        setShouldPublish(false);
      });

      r.on(RoomEvent.Connected, () => {
        log('[Room] Connected - Signaling transport handshake complete');
        setConnectionStatus('connected');
        // Critical: Wait for transport to stabilize before publishing
        setTimeout(() => {
          if (r.state === 'connected') setShouldPublish(true);
        }, 1000);
      });

      r.on(RoomEvent.Reconnecting, () => setConnectionStatus('retrying'));
      r.on(RoomEvent.Reconnected, () => setConnectionStatus('connected'));
      r.on(RoomEvent.Error, (err) => {
        log('[Room] Error', err);
        setConnectionStatus('failed');
      });

      roomRef.current = r;
      setRoomInstance(r);

      // 5. Manual Connect (Total control over sequence)
      log(`[Room] Attempting manual connect to ${wsUrl}`);
      await r.connect(wsUrl, data.token);
      
      setLk({ token: data.token, url: wsUrl });
      setWaiting(false);
      setError('');
    } catch (e) {
      log('Connection lifecycle failed', e);
      const code = e.response?.data?.code;
      if (code === 'WAITING_ROOM') {
        setWaiting(true);
        setConnectionStatus('idle');
      } else if (code === 'NOT_LIVE') {
        setError('not-live');
        setConnectionStatus('idle');
      } else {
        if (retryCount < MAX_RETRIES) {
          const backoff = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
          const delay = backoff + (Math.random() * 500);
          log(`Retrying in ${Math.round(delay)}ms (Attempt ${retryCount + 1}/${MAX_RETRIES})...`);
          
          setRetryCount(prev => prev + 1);
          retryTimeoutRef.current = setTimeout(() => {
            connectionInProgressRef.current = false;
            tryConnect(true);
          }, delay);
        } else {
          setConnectionStatus('failed');
          setError('Media engine connection timeout. Please check your network or stability.');
        }
      }
    } finally {
      if (connectionStatus !== 'retrying' && !retryTimeoutRef.current) {
        connectionInProgressRef.current = false;
      }
    }
  }, [sessionId, retryCount, connectionStatus]);

  // --- Effects ---

  useEffect(() => {
    if (mountingRef.current) return;
    mountingRef.current = true;
    if (!userInfo) { navigate('/login'); return; }

    (async () => {
      await loadSession();
      await performHealthCheck();
    })();

    return () => {
      mountingRef.current = false;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, [userInfo, navigate, loadSession]);

  useEffect(() => {
    if (!session || !userInfo || ['connected', 'connecting', 'retrying'].includes(connectionStatus)) return;

    if (isTeacher) {
      if (session.status === 'live' && !lk) tryConnect();
    } else {
      if (session.status === 'live' && !lk && !waiting) {
        (async () => {
          if (session.waitingRoomEnabled) {
            try {
              const w = await joinLiveWaitingRoom(sessionId);
              if (w.admitted) tryConnect();
              else setWaiting(true);
            } catch (err) {
              if (err.response?.status === 403) setError('Access forbidden.');
            }
          } else {
            tryConnect();
          }
        })();
      }
    }
  }, [session, userInfo, isTeacher, tryConnect, lk, waiting, connectionStatus, sessionId]);

  useEffect(() => {
    if (!socket || !session?.roomId || !userInfo) return;
    const { roomId } = session;

    // Stable Join Logic - prevent re-joins unless roomId changed
    if (joinedRoomRef.current === roomId && socketConnected) return;
    joinedRoomRef.current = roomId;
    
    const syncState = (data) => {
      if (data.participants) {
        setParticipants(data.participants.map(p => ({
          userId: p.userId,
          name: p.name,
          identity: p.identity,
          role: p.role,
          raisedHand: p.raisedHand
        })));
      }
      if (data.recording !== undefined) setRecordingOn(data.recording);
      if (data.spotlight !== undefined) setSpotlightIdentity(data.spotlight);
    };

    const onStatus = ({ status }) => {
      if (status === 'ended') {
        setLk(null);
        setConnectionStatus('disconnected');
        toast('Session has ended.');
      } else loadSession();
    };

    const onAdmitted = ({ roomId: admittedRoomId }) => {
      // Debounce admissions to prevent multiple rapid connections
      const now = Date.now();
      if (now - lastAdmitTimeRef.current < 2000) return;
      lastAdmitTimeRef.current = now;

      log('Admitted event received — upgrading to full participant');
      setWaiting(false);
      
      const targetRoom = admittedRoomId || session?.roomId;
      if (targetRoom) {
        log(`[Socket] Attempting room:join for ${targetRoom}`);
        socket.emit('room:join', { roomId: targetRoom }, (resp) => {
          if (resp?.ok) {
            log('[Socket] Re-joined socket room after admission', resp);
            // After successful socket join, trigger SFU connection
            tryConnect();
          } else {
            log('[Socket] Room join failed after admission', resp);
          }
        });
      }
    };

    const onUserJoined = (data) => {
      if (isTeacher) {
        setWaitingEntries(prev => {
          if (prev.some(w => w.userId === data.userId)) return prev;
          return [...prev, { userId: data.userId, name: data.name }];
        });
        toast(`${data.name} joined the waiting room`, { icon: '🚪' });
      }
    };

    const onAdmittedBroadcast = ({ userId }) => {
      if (isTeacher) {
        setWaitingEntries(prev => prev.filter(w => w.userId !== userId));
      }
    };

    const onParticipantJoined = (p) => {
      setParticipants(prev => {
        if (prev.some(x => x.userId === p.userId)) return prev;
        return [...prev, { userId: p.userId, name: p.name, identity: p.identity, role: p.role }];
      });
    };

    const onParticipantLeft = ({ userId }) => {
      setParticipants(prev => prev.filter(p => p.userId !== userId));
    };

    const onSync = (data) => syncState(data);

    // Initial join
    socket.emit('room:join', { roomId }, (resp) => {
      if (resp?.ok) {
        syncState(resp);
        if (isTeacher && Array.isArray(resp.waitingQueue)) {
          setWaitingEntries(resp.waitingQueue);
        }
      } else if (resp?.code === 'WAITING_ROOM') {
        setWaiting(true);
        setConnectionStatus('idle');
      }
    });

    socket.on('session:status', onStatus);
    socket.on('waiting:admitted', onAdmitted);
    socket.on('waiting:user-joined', onUserJoined);
    socket.on('waiting:admitted-broadcast', onAdmittedBroadcast);
    socket.on('participant:joined', onParticipantJoined);
    socket.on('participant:left', onParticipantLeft);
    socket.on('recording:state', ({ active }) => setRecordingOn(!!active));
    socket.on('sync:participants', onSync);

    socket.on('chat:message', (msg) => {
      log('[Socket] Chat message received:', msg);
      setMessages(prev => {
        // Prevent duplicates
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('session:reaction', (data) => {
      const id = `${data.userId}-${Date.now()}-${Math.random()}`;
      setFloatingReactions(prev => [
        ...prev.slice(-20),
        { id, ...data, x: Math.random() * (window.innerWidth * 0.7) + (window.innerWidth * 0.15) }
      ]);
    });

    socket.on('session:meta', (meta) => {
      if (meta.spotlightIdentity !== undefined) setSpotlightIdentity(meta.spotlightIdentity);
    });

    socket.on('connect', () => {
      socket.emit('room:join', { roomId }, (resp) => { if (resp?.ok) syncState(resp); });
    });

    return () => {
      // Only emit leave if component is truly unmounting or room is actually changing
      socket.emit('room:leave', { roomId });
      joinedRoomRef.current = null;

      socket.off('session:status', onStatus);
      socket.off('waiting:admitted', onAdmitted);
      socket.off('waiting:user-joined', onUserJoined);
      socket.off('waiting:admitted-broadcast', onAdmittedBroadcast);
      socket.off('participant:joined', onParticipantJoined);
      socket.off('participant:left', onParticipantLeft);
      socket.off('recording:state');
      socket.off('sync:participants');
      socket.off('chat:message');
      socket.off('session:meta');
      socket.off('connect');
    };
  }, [socket, session?.roomId, userInfo, isTeacher, tryConnect, loadSession]);

  // --- Handlers ---

  const handleReaction = (type) => {
    socket?.emit('session:reaction', { roomId: session.roomId, type });
  };

  const handleSpotlight = async (identity) => {
    setSpotlightIdentity(identity);
    try {
      await updateLiveSessionMeta(sessionId, { spotlightIdentity: identity });
    } catch (err) { log('Spotlight error', err); }
  };

  const handleRecordingToggle = async () => {
    const next = !recordingOn;
    setRecordingOn(next);
    try {
      if (!next) await stopLiveRecording(sessionId);
      else await startLiveRecording(sessionId);
    } catch (err) {
      log('Recording error', err);
      setRecordingOn(!next); // revert
      toast.error('Failed to toggle recording');
    }
  };

  const goLive = async () => {
    try {
      await updateLiveSessionStatus(sessionId, 'live');
      await loadSession();
      await tryConnect();
    } catch (err) { setError('Could not start session.'); }
  };

  const handleEndSession = async () => {
    try {
      await updateLiveSessionStatus(sessionId, 'ended');
      setLk(null);
      if (roomRef.current) await roomRef.current.disconnect();
      toast.success('Session ended successfully');
      navigate(isTeacher ? '/instructor-dashboard' : '/dashboard');
    } catch (err) {
      log('Failed to end session', err);
      toast.error('Could not end session properly.');
    }
  };

  const handleReconnect = () => {
    setError('');
    setRetryCount(0);
    connectionInProgressRef.current = false;
    performHealthCheck().then(h => { if (h) tryConnect(); });
  };

  const handleAdmitUser = async (userId) => {
    try {
      await admitLiveUser(sessionId, userId);
      setWaitingEntries(prev => prev.filter(w => w.userId !== userId));
      toast.success('Student admitted');
    } catch (err) {
      log('Failed to admit user', err);
      toast.error('Could not admit user. Please try again.');
    }
  };

  // --- Render ---

  if (connectionStatus === 'failed' || (error && !lk)) {
    return (
      <PageShell className="max-w-lg text-center">
        <div className="music-sheet-card p-8 bg-maroon/5 rounded-2xl border border-saffron/30">
          <AlertCircle className="w-12 h-12 text-saffron mx-auto mb-4" />
          <h2 className="text-xl font-display text-ivory mb-2">Connection Issue</h2>
          <p className="text-ivory/60 mb-6">{error === 'not-live' ? 'The guru has not started this session yet.' : error}</p>
          <div className="flex flex-col gap-3">
            <button onClick={handleReconnect} className="bg-gold text-ink font-bold py-3 rounded-xl flex items-center justify-center gap-2">
              <RefreshCcw className="w-4 h-4" /> Try Again
            </button>
            <button onClick={() => navigate(isTeacher ? '/instructor-dashboard' : '/dashboard')} className="text-ivory/40 text-sm">Return Home</button>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!session) return <PageShell><div className="flex flex-col items-center py-24"><Loader2 className="animate-spin text-gold" /></div></PageShell>;

  if (waiting && !lk) {
    return (
      <PageShell className="max-w-lg text-center">
        <div className="music-sheet-card p-12 bg-rv-bg-card/40 rounded-3xl border border-gold/10 backdrop-blur-md">
          <Loader2 className="w-16 h-16 text-gold animate-spin mx-auto mb-8 opacity-60" />
          <h1 className="font-display text-3xl text-ivory/90 mb-4 tracking-tight">Access Pending</h1>
          <p className="text-ivory/50 text-lg">The host has been notified. You will be admitted shortly.</p>
          <div className="mt-12 pt-8 border-t border-gold/5 flex flex-col gap-4">
             <div className="flex items-center justify-center gap-2 text-gold/60 text-sm italic font-serif">
                Shishya (Student) Waiting Room
             </div>
             <button onClick={() => navigate(isTeacher ? '/instructor-dashboard' : '/dashboard')} className="text-ivory/30 text-xs hover:text-gold transition-colors">
               Cancel and Return Home
             </button>
          </div>
        </div>
      </PageShell>
    );
  }

  if (isTeacher && session.status !== 'live' && !lk) {
    return (
      <PageShell className="max-w-xl">
        <h1 className="font-display text-3xl text-ivory mb-4">{session.title}</h1>
        <div className="bg-ink/40 border border-gold/15 p-8 rounded-2xl">
          <h3 className="text-gold text-xs font-bold uppercase mb-6 tracking-[0.2em]">Readiness Check</h3>
          <ul className="space-y-4 mb-10 text-ivory/70 text-sm">
            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-gold" /> Equipment check complete</li>
            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-gold" /> Media server connection: Ready</li>
          </ul>
          <button onClick={goLive} className="w-full bg-gold text-ink font-bold py-4 rounded-xl shadow-glow">Start Session</button>
        </div>
      </PageShell>
    );
  }

  if (!lk?.token || !lk?.url || (['connecting', 'retrying'].includes(connectionStatus) && !lk)) {
    return (
      <PageShell>
        <div className="flex flex-col items-center py-32 space-y-8">
          <div className="relative">
            <Loader2 className="animate-spin text-gold w-14 h-14" />
            <div className="absolute inset-0 bg-gold/10 blur-xl rounded-full scale-110" />
          </div>
          <div className="text-center">
            <p className="text-gold/80 text-xs font-bold uppercase tracking-[0.2em] mb-2">{connectionStatus === 'retrying' ? 'Reconnecting' : 'Initializing'}</p>
            <p className="text-ivory/40 text-sm font-serif">Preparing yours live session environment...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <LiveKitRoom
      token={lk.token}
      serverUrl={lk.url}
      room={roomInstance}
      connect={false} // Managed manually in tryConnect for higher precision
      video={shouldPublish}
      audio={shouldPublish}
      options={{ 
        audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true }, 
        publishDefaults: { videoSimulcast: true, videoCodec: 'h264' } 
      }}
      onDisconnected={() => setConnectionStatus('disconnected')}
      onError={(err) => { 
        log('LiveKitRoom UI error', err);
        setConnectionStatus('failed'); 
      }}
    >
      <VideoRoom
        session={session}
        socket={socket}
        userInfo={userInfo}
        onLeave={() => { setLk(null); navigate(isTeacher ? '/instructor-dashboard' : '/dashboard'); }}
        chatMessages={messages}
        participants={participants}
        onFetchMessages={loadMessages}
        onSpotlightMeta={handleSpotlight}
        spotlightIdentity={spotlightIdentity}
        recordingOn={recordingOn}
        onToggleRecording={handleRecordingToggle}
        onEndSession={handleEndSession}
        onReaction={handleReaction}
        floatingReactions={floatingReactions}
        onRemoveReaction={(id) => setFloatingReactions(prev => prev.filter(r => r.id !== id))}
        layout={layout}
        onLayoutChange={setLayout}
        waitingEntries={waitingEntries}
        onAdmitUser={handleAdmitUser}
      />
    </LiveKitRoom>
  );
}
