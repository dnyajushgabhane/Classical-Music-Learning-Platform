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
    // Scroll to bottom on any new messages
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    <div className="flex flex-col h-full min-h-0 glass border-rv-border overflow-hidden">
      <div className="px-5 py-4 border-b border-rv-border flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-rv-text tracking-wide">Chat</span>
        <div className="flex rounded-lg border border-rv-border overflow-hidden label-caps">
          <button
            type="button"
            onClick={() => setMode('group')}
            className={`px-3 py-1.5 transition-colors ${mode === 'group' ? 'bg-gold/25 text-gold' : 'text-rv-text-muted hover:text-rv-text hover:bg-rv-hover'}`}
          >
            Group
          </button>
          <button
            type="button"
            onClick={() => setMode('private')}
            className={`px-3 py-1.5 transition-colors ${mode === 'private' ? 'bg-gold/25 text-gold' : 'text-rv-text-muted hover:text-rv-text hover:bg-rv-hover'}`}
          >
            Direct
          </button>
        </div>
      </div>

      {mode === 'private' && (
        <div className="px-4 py-3 border-b border-rv-border bg-gold/[0.02]">
          <label className="label-caps mb-2 block">To</label>
          <select
            value={privateTo}
            onChange={(e) => setPrivateTo(e.target.value)}
            className="rv-input py-2 text-xs"
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
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl px-4 py-2.5 text-sm max-w-[90%] shadow-sm ${
                m.sender === selfUserId 
                  ? 'ml-auto bg-gold/15 border border-gold/30 text-rv-text' 
                  : 'bg-rv-bg-input border border-rv-border text-rv-text-2'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-rv-text-muted mb-1 opacity-70">
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
        className="p-4 border-t border-rv-border flex gap-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          className="rv-input py-2.5"
        />
        <button
          type="submit"
          className="p-2.5 rounded-xl bg-gradient-to-br from-gold to-gold-dark text-ink shadow-glow-sm hover:scale-[1.05] active:scale-[0.98] transition-all"
        >
          <Send className="w-5 h-5" strokeWidth={2} />
        </button>
      </form>
    </div>
  );
}
