import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LiveKitRoom } from '@livekit/components-react';
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
  admitLiveUser,
  checkLiveKitHealth,
  joinScheduledSession,
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

  // Classroom Data States
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [spotlightIdentity, setSpotlightIdentity] = useState('');
  const [reactionPopup, setReactionPopup] = useState(null);
  const [recordingOn, setRecordingOn] = useState(false);
  const [waitingEntries, setWaitingEntries] = useState([]);
  const [layout, setLayout] = useState('grid');

  // Refs for lifecycle control
  const mountingRef = useRef(false);
  const connectionInProgressRef = useRef(false);
  const retryTimeoutRef = useRef(null);

  const isTeacher = userInfo?.role === 'Instructor';

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
      log('Health check passed', health);
      setConnectionStatus('idle'); // Set to idle so button becomes enabled
      return true;
    } catch (err) {
      log('Health check failed - LiveKit server unreachable', err);
      setConnectionStatus('failed');
      setError('Media server unreachable. Please contact support.');
      return false;
    }
  };

  const tryConnect = useCallback(async (isRetry = false) => {
    // Prevent double-connection attempts
    if (connectionInProgressRef.current) {
      log('Connection already in progress, skipping attempt.');
      return;
    }
    
    // Clear any previous token to force a clean reconnect
    setLk(null);
    
    connectionInProgressRef.current = true;

    if (!isRetry) {
      setConnectionStatus('connecting');
      setRetryCount(0);
    } else {
      setConnectionStatus('retrying');
    }

    log(`Attempting connection (Retry: ${isRetry ? retryCount + 1 : 0})...`);

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
      
      log('Token received successfully', { 
        url: wsUrl, 
        identity: data.identity,
        room: data.roomName 
      });

      setLk({ token: data.token, url: wsUrl });
      setWaiting(false);
      setError('');
      setConnectionStatus('connected');
      toast.success('Secure media connection established');
    } catch (e) {
      const code = e.response?.data?.code;
      const msg = e.response?.data?.message || e.message;
      log(`Connection attempt failed: ${code || msg}`);

      if (code === 'WAITING_ROOM') {
        setWaiting(true);
        setConnectionStatus('idle');
      } else if (code === 'NOT_LIVE') {
        setError('not-live');
        setConnectionStatus('idle');
      } else {
        // Handle retries for generic connection failures
        if (retryCount < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
          log(`Retrying in ${delay}ms...`);
          setRetryCount(prev => prev + 1);
          toast.error(`Connection failed. Retrying in ${delay/1000}s...`);
          retryTimeoutRef.current = setTimeout(() => {
            connectionInProgressRef.current = false;
            tryConnect(true);
          }, delay);
        } else {
          setConnectionStatus('failed');
          setError('Failed to establish secure connection after multiple attempts.');
          toast.error('Multiple connection attempts failed.');
        }
      }
    } finally {
      if (connectionStatus !== 'retrying') {
        connectionInProgressRef.current = false;
      }
    }
  }, [sessionId, retryCount]);

  // --- Effects ---

  // Initialization & Health Check
  useEffect(() => {
    if (mountingRef.current) return;
    mountingRef.current = true;

    if (!userInfo) {
      navigate('/login');
      return;
    }

    (async () => {
      await loadSession();
      const healthy = await performHealthCheck();
      if (healthy && isTeacher) {
        // Teachers might need to "Go Live" first, handled in goLive
      }
    })();

    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [userInfo, navigate, loadSession, isTeacher]);

  // Handle Automatic Connection Logic
  useEffect(() => {
    if (!session || !userInfo || connectionStatus === 'connected' || connectionStatus === 'connecting' || connectionStatus === 'retrying') return;

    if (isTeacher) {
      if (session.status === 'live' && !lk) {
        log('Teacher: Session is live, initiating connection');
        tryConnect();
      }
    } else {
      if (session.status === 'live' && !lk && !waiting) {
        log('Student: Session is live, starting join flow');
        (async () => {
          if (session.waitingRoomEnabled) {
            const w = await joinLiveWaitingRoom(sessionId);
            if (w.admitted) tryConnect();
            else setWaiting(true);
          } else {
            tryConnect();
          }
        })();
      }
    }
  }, [session, userInfo, isTeacher, tryConnect, lk, waiting, connectionStatus]);

  // Socket Events & Metadata
  useEffect(() => {
    if (!socket || !session?.roomId || !userInfo) return;

    const { roomId } = session;
    socket.emit('room:join', { roomId });

    socket.on('connect', () => {
      log('[Socket] Reconnected. Re-joining room...');
      socket.emit('room:join', { roomId });
    });

    socket.on('session:status', ({ status }) => {
      log(`Session status changed: ${status}`);
      if (status === 'ended') {
        setLk(null);
        setConnectionStatus('disconnected');
      } else {
        loadSession();
      }
    });

    socket.on('waiting:admitted', () => {
      log('Admitted from waiting room');
      setWaiting(false);
      tryConnect();
    });

    socket.on('participant:joined', ({ userId, name }) => {
      setParticipants(prev => {
        if (prev.some(p => String(p.userId) === String(userId))) return prev;
        return [...prev, { userId: String(userId), name, role: 'student' }];
      });
    });

    socket.on('participant:left', ({ userId }) => {
      setParticipants(prev => prev.filter(p => String(p.userId) !== String(userId)));
    });

    socket.on('recording:state', ({ active }) => setRecordingOn(!!active));
    socket.on('session:meta', (meta) => {
      if (meta.spotlightIdentity !== undefined) setSpotlightIdentity(meta.spotlightIdentity);
    });

    return () => {
      socket.emit('room:leave', { roomId });
      socket.off('session:status');
      socket.off('waiting:admitted');
      socket.off('participant:joined');
      socket.off('participant:left');
      socket.off('recording:state');
      socket.off('session:meta');
    };
  }, [socket, session, userInfo, tryConnect, loadSession]);

  // --- Handlers ---

  const handleSpotlight = async (identity) => {
    log(`Setting spotlight: ${identity}`);
    setSpotlightIdentity(identity);
    try {
      await updateLiveSessionMeta(sessionId, { spotlightIdentity: identity });
    } catch (err) {
      log('Failed to update spotlight', err);
    }
  };

  const handleRecordingToggle = async () => {
    log(`Toggling recording. Current state: ${recordingOn}`);
    try {
      if (recordingOn) {
        await stopLiveRecording(sessionId);
        setRecordingOn(false);
      } else {
        await startLiveRecording(sessionId);
        setRecordingOn(true);
      }
    } catch (err) {
      log('Failed to toggle recording', err);
    }
  };

  const goLive = async () => {
    log('Teacher initiating Go Live');
    try {
      await updateLiveSessionStatus(sessionId, 'live');
      await loadSession();
      await tryConnect();
    } catch (err) {
      log('Failed to go live', err);
      setError('Could not start the session.');
    }
  };

  const handleReconnect = () => {
    log('Manual reconnect requested');
    setError('');
    setRetryCount(0);
    connectionInProgressRef.current = false;
    performHealthCheck().then(healthy => {
      if (healthy) tryConnect();
    });
  };

  // --- Render Helpers ---

  if (!session) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-gold animate-spin mb-4" />
          <p className="text-gold font-display animate-pulse">Opening classroom…</p>
        </div>
      </PageShell>
    );
  }

  // Error / Status Views
  if (connectionStatus === 'failed' || (error && !lk)) {
    return (
      <PageShell className="max-w-lg text-center">
        <div className="music-sheet-card rounded-2xl p-8 border-saffron/30 bg-maroon/5">
          <AlertCircle className="w-12 h-12 text-saffron mx-auto mb-4" />
          <h2 className="text-xl font-display text-ivory mb-2">Connection Issue</h2>
          <p className="text-ivory/60 mb-6">{error === 'not-live' ? 'The guru has not started this session yet.' : error}</p>
          
          <div className="flex flex-col gap-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleReconnect}
              className="flex items-center justify-center gap-2 bg-gold text-ink font-bold py-3 rounded-xl"
            >
              <RefreshCcw className="w-4 h-4" />
              Try Again
            </motion.button>
            <button 
              onClick={() => navigate(isTeacher ? '/instructor-dashboard' : '/dashboard')}
              className="text-ivory/40 text-sm hover:text-ivory transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  if (waiting && !lk) {
    return (
      <PageShell className="max-w-lg text-center">
        <div className="py-12">
          <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-gold/20">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
          <h1 className="font-display text-2xl text-ivory mb-2">Waiting Room</h1>
          <p className="text-ivory/55">The host will admit you shortly. Please stay on this page.</p>
        </div>
      </PageShell>
    );
  }

  if (isTeacher && session.status !== 'live' && !lk) {
    return (
      <PageShell className="max-w-xl">
        <h1 className="font-display text-3xl text-ivory mb-2">{session.title}</h1>
        <p className="text-ivory/50 mb-8 italic">"The music is not in the notes, but in the silence between."</p>
        
        <div className="bg-ink/40 border border-gold/15 rounded-2xl p-8 backdrop-blur-sm">
          <h3 className="text-gold text-sm font-bold uppercase tracking-widest mb-4">Readiness Check</h3>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-3 text-sm text-ivory/70">
              <div className="w-1.5 h-1.5 rounded-full bg-gold" />
              Camera and Microphone access granted
            </li>
            <li className="flex items-center gap-3 text-sm text-ivory/70">
              <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'failed' ? 'bg-saffron' : 'bg-gold'}`} />
              Media server connection: {connectionStatus === 'checking' ? 'Checking...' : connectionStatus === 'failed' ? 'Failed' : 'Ready'}
            </li>
          </ul>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={goLive}
            disabled={connectionStatus === 'checking' || connectionStatus === 'failed'}
            className="w-full bg-gradient-to-r from-gold to-gold-dark text-ink font-bold py-4 rounded-xl shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Session
          </motion.button>
        </div>
      </PageShell>
    );
  }

  if (!lk?.token || !lk?.url || connectionStatus === 'connecting' || connectionStatus === 'retrying') {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="relative mb-6">
            <Loader2 className="w-12 h-12 text-gold animate-spin" />
            {connectionStatus === 'retrying' && (
              <div className="absolute -top-2 -right-2 bg-saffron text-ink text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {retryCount}
              </div>
            )}
          </div>
          <p className="text-ivory/70 font-display tracking-wide">
            {connectionStatus === 'retrying' ? 'Connection lost. Retrying...' : 'Connecting to secure media stream...'}
          </p>
          <p className="text-ivory/30 text-xs mt-2 italic">Establishing WebRTC handshake</p>
        </div>
      </PageShell>
    );
  }

  // --- Classroom View ---

  return (
    <LiveKitRoom
      token={lk.token}
      serverUrl={lk.url}
      connect={true}
      video={true}
      audio={true}
      options={{
        audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true },
        publishDefaults: { videoSimulcast: true, screenShareSimulcast: true },
        // Production-grade ICE configuration
        rtcConfig: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        }
      }}
      onDisconnected={(reason) => {
        log(`LiveKitRoom disconnected. Reason: ${reason}`);
        setConnectionStatus('disconnected');
        
        // Log WebRTC state for debugging
        if (reason === 7) {
          log('ICE connection failure detected. Possible firewall issue.');
        }
      }}
      onError={(err) => {
        log('LiveKitRoom error', err);
        setConnectionStatus('failed');
        setError(`Media connection failed: ${err.message}`);
        
        // Detailed error logging
        if (err.name === 'ConnectionError') {
          log('WebRTC signaling failure. Retrying might help.');
        }
      }}
    >
      <AnimatePresence mode="wait">
        {connectionStatus === 'disconnected' ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-ink/95 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="max-w-sm w-full text-center">
              <WifiOff className="w-16 h-16 text-saffron mx-auto mb-6" />
              <h2 className="text-2xl font-display text-ivory mb-2">Connection Lost</h2>
              <p className="text-ivory/50 mb-8">You have been disconnected from the classroom stream.</p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleReconnect}
                  className="bg-gold text-ink font-bold py-3 rounded-xl shadow-glow"
                >
                  Reconnect Now
                </button>
                <button 
                  onClick={() => navigate(isTeacher ? '/instructor-dashboard' : '/dashboard')}
                  className="text-ivory/40 text-sm hover:text-ivory transition-colors"
                >
                  Leave Classroom
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <VideoRoom
            session={session}
            socket={socket}
            userInfo={userInfo}
            onLeave={() => {
              log('User initiated leave');
              setLk(null);
              navigate(isTeacher ? '/instructor-dashboard' : '/dashboard');
            }}
            chatMessages={messages}
            participants={participants}
            onFetchMessages={loadMessages}
            onSpotlightMeta={handleSpotlight}
            spotlightIdentity={spotlightIdentity}
            recordingOn={recordingOn}
            onToggleRecording={handleRecordingToggle}
            reactionPopup={reactionPopup}
            layout={layout}
            onLayoutChange={setLayout}
          />
        )}
      </AnimatePresence>
    </LiveKitRoom>
  );
}
