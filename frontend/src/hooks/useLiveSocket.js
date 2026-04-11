import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { getSocketOrigin } from '../config/env';
import useAuthStore from '../store/authStore';

export function useLiveSocket() {
  const token = useAuthStore((s) => s.userInfo?.token);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      return undefined;
    }

    const s = io(`${getSocketOrigin()}/live`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    s.on('connect', () => {
      console.log(`[Socket] Connected to /live namespace: ${s.id}`);
      setConnected(true);
    });

    s.on('connect_error', (err) => {
      console.error(`[Socket] Connection error: ${err.message}`);
      
      // If unauthorized, the token is likely expired or invalid.
      // We must treat this like an API 401 and logout.
      if (err.message === 'Unauthorized' || err.message === 'Missing token' || err.message === 'User not found') {
        console.warn('[Socket] Session expired. Redirecting to login...');
        localStorage.removeItem('userInfo');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true';
        }
      } else {
        toast.error(`Socket connection issue: ${err.message}`, { id: 'socket-error' });
      }
    });

    s.on('reconnect_attempt', (attempt) => {
      console.log(`[Socket] Reconnect attempt #${attempt}`);
      if (attempt === 1) toast.loading('Reconnecting to real-time server...', { id: 'socket-reconnect' });
    });

    s.on('reconnect_failed', () => {
      console.error('[Socket] Failed to reconnect after maximum attempts');
      toast.error('Real-time connection lost permanently.', { id: 'socket-reconnect' });
    });

    s.on('disconnect', (reason) => {
      console.warn(`[Socket] Disconnected: ${reason}`);
      setConnected(false);
      
      if (reason !== 'io client disconnect') {
        toast.error('Real-time connection interrupted', { id: 'socket-reconnect' });
      }
      
      // If server disconnected us, it might be due to heartbeats
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, you need to reconnect manually
        s.connect();
      }
    });

    setSocket(s);

    return () => {
      s.removeAllListeners();
      s.close();
      setConnected(false);
      setSocket(null);
    };
  }, [token]);

  return { socket, connected };
}
