import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLiveSocket } from '../hooks/useLiveSocket';
import toast from 'react-hot-toast';

export default function GlobalSocketListener() {
  const queryClient = useQueryClient();
  const { socket } = useLiveSocket();

  useEffect(() => {
    if (!socket) return;

    const onSessionEnded = (data) => {
      console.log('[Global] Live session ended:', data.sessionId);
      
      // Invalidate all relevant session-related queries
      queryClient.invalidateQueries({ queryKey: ['live-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-sessions'] });
      
      // If we are currently in that session, let's toast
      // But LiveSessionPage already has its own listener to handle disconnect
    };

    socket.on('session:ended', onSessionEnded);

    return () => {
      socket.off('session:ended', onSessionEnded);
    };
  }, [socket, queryClient]);

  return null;
}
