import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
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
    });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

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
