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
      toast.error(`Socket connection error: ${err.message}`);
      // If unauthorized, we might need to clear state or redirect
      if (err.message === 'Unauthorized') {
        console.error('[Socket] Auth failure during reconnect');
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
