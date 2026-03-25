import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import useAuthStore from '../store/authStore';
import { Send, Hand, Users, Video } from 'lucide-react';
import PageShell from '../components/layout/PageShell';

const socket = io('http://localhost:5000');

const LiveClass = () => {
  const { roomId } = useParams();
  const { userInfo } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [messageReq, setMessageReq] = useState('');

  useEffect(() => {
    if (roomId) socket.emit('join-room', roomId);

    socket.on('receive-message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on('hand-raised', (user) => {
      alert(`${user.name} has raised their hand!`);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!messageReq.trim()) return;

    const msgData = {
      user: userInfo?.name || 'Guest',
      text: messageReq,
      time: new Date().toLocaleTimeString(),
    };
    socket.emit('send-message', { roomId, message: msgData });
    setMessageReq('');
  };

  const raiseHand = () => {
    socket.emit('raise-hand', { roomId, user: userInfo });
  };

  return (
    <PageShell className="!max-w-[1400px]">
      <div className="h-[80vh] flex flex-col lg:flex-row gap-6">
        <div className="flex-1 lg:w-2/3 bg-ink rounded-2xl overflow-hidden border border-gold/15 relative min-h-[280px]">
          <div className="absolute top-4 left-4 z-10 bg-maroon/90 text-gold text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md border border-gold/25 animate-pulse">
            Live
          </div>
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#070605]">
            <Video className="w-28 h-28 text-gold/20 mb-4" strokeWidth={1} />
            <p className="text-ivory/45 text-center px-6">Waiting for the guru to begin the stream…</p>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-ink/90 backdrop-blur-md px-6 py-3 rounded-full border border-gold/20 shadow-glow-sm">
            <button
              type="button"
              onClick={raiseHand}
              className="flex flex-col items-center justify-center text-ivory/55 hover:text-gold transition-colors"
              title="Raise hand"
            >
              <Hand className="w-6 h-6 mb-1" />
            </button>
            <button
              type="button"
              className="flex flex-col items-center justify-center text-ivory/55 hover:text-gold transition-colors ml-4"
              title="Participants"
            >
              <Users className="w-6 h-6 mb-1" />
            </button>
          </div>
        </div>

        <div className="flex-1 lg:w-1/3 flex flex-col rounded-2xl overflow-hidden border border-gold/15 glass-panel min-h-[320px]">
          <div className="p-4 border-b border-gold/10 bg-maroon/30 text-center font-display font-semibold text-ivory tracking-wide">
            Satsang — live chat
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col bg-ink/40">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl max-w-[85%] ${
                  msg.user === userInfo?.name
                    ? 'bg-gold/15 ml-auto border border-gold/25'
                    : 'bg-ink/80 border border-gold/10 mr-auto'
                }`}
              >
                <div className="flex justify-between items-center mb-1 gap-2">
                  <span
                    className={`text-xs font-bold ${msg.user === userInfo?.name ? 'text-gold' : 'text-ivory/45'}`}
                  >
                    {msg.user}
                  </span>
                  <span className="text-[10px] text-ivory/35 shrink-0">{msg.time}</span>
                </div>
                <p className="text-sm text-ivory/85">{msg.text}</p>
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} className="p-4 border-t border-gold/10 bg-ink/60 flex gap-2">
            <input
              type="text"
              className="flex-1 bg-ink border border-gold/15 rounded-xl px-4 py-3 focus:outline-none focus:border-gold/40 placeholder:text-ivory/35 text-ivory text-sm"
              placeholder="Ask guruji…"
              value={messageReq}
              onChange={(e) => setMessageReq(e.target.value)}
            />
            <button
              type="submit"
              className="bg-gradient-to-br from-gold to-gold-dark text-ink p-3 rounded-xl shadow-glow-sm hover:brightness-105 transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </PageShell>
  );
};

export default LiveClass;
