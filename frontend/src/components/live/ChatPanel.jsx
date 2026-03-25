import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User } from 'lucide-react';

export default function ChatPanel({
  socket,
  roomId,
  sessionId,
  messages,
  participants,
  selfUserId,
  fetchMessages,
}) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState('group');
  const [privateTo, setPrivateTo] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket || !sessionId) return;

    const onGroup = (msg) => {
      fetchMessages?.();
    };
    const onPrivate = () => fetchMessages?.();

    socket.on('chat:message', onGroup);
    socket.on('chat:private', onPrivate);
    return () => {
      socket.off('chat:message', onGroup);
      socket.off('chat:private', onPrivate);
    };
  }, [socket, sessionId, fetchMessages]);

  const send = () => {
    if (!text.trim() || !socket || !roomId) return;
    if (mode === 'private') {
      if (!privateTo) return;
      socket.emit('chat:private', { roomId, text, recipientUserId: privateTo });
    } else {
      socket.emit('chat:group', { roomId, text });
    }
    setText('');
  };

  return (
    <div className="flex flex-col h-full min-h-0 glass-panel rounded-2xl border-gold/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-gold/15 flex items-center justify-between gap-2">
        <span className="text-sm font-display font-semibold text-ivory">Chat</span>
        <div className="flex rounded-lg border border-gold/20 overflow-hidden text-[10px] font-bold uppercase">
          <button
            type="button"
            onClick={() => setMode('group')}
            className={`px-2 py-1 ${mode === 'group' ? 'bg-gold/20 text-gold' : 'text-ivory/50'}`}
          >
            Group
          </button>
          <button
            type="button"
            onClick={() => setMode('private')}
            className={`px-2 py-1 ${mode === 'private' ? 'bg-gold/20 text-gold' : 'text-ivory/50'}`}
          >
            Direct
          </button>
        </div>
      </div>

      {mode === 'private' && (
        <div className="px-3 py-2 border-b border-gold/10">
          <label className="text-[10px] uppercase tracking-wider text-ivory/40 block mb-1">To</label>
          <select
            value={privateTo}
            onChange={(e) => setPrivateTo(e.target.value)}
            className="w-full bg-ink/60 border border-gold/15 rounded-lg px-2 py-1.5 text-xs text-ivory"
          >
            <option value="">Select participant</option>
            {participants
              .filter((p) => p.userId !== selfUserId)
              .map((p) => (
                <option key={p.userId} value={p.userId}>
                  {p.name}
                </option>
              ))}
          </select>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div
              key={m.id || `${m.createdAt}-${m.sender}`}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className={`rounded-xl px-3 py-2 text-sm max-w-[95%] ${
                m.sender === selfUserId ? 'ml-auto bg-gold/15 border border-gold/25 text-ivory' : 'bg-ink/80 border border-gold/10 text-ivory/85'
              }`}
            >
              <div className="flex items-center gap-1 text-[10px] text-ivory/45 mb-0.5">
                <User className="w-3 h-3" />
                {m.senderName}
                {m.scope === 'private' && <span className="text-gold/70"> · direct</span>}
              </div>
              <p className="break-words">{m.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <form
        className="p-3 border-t border-gold/15 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          className="flex-1 bg-ink/60 border border-gold/15 rounded-xl px-3 py-2 text-sm text-ivory placeholder:text-ivory/35 focus:outline-none focus:border-gold/40"
        />
        <button
          type="submit"
          className="p-2 rounded-xl bg-gradient-to-br from-gold to-gold-dark text-ink shadow-glow-sm"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
