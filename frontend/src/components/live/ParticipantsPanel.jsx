import React from 'react';
import { motion } from 'framer-motion';
import { MicOff, VideoOff, UserMinus, Hand, Star, UserCheck } from 'lucide-react';
import { useSpeakingParticipants } from '@livekit/components-react';

const emojiReactions = ['🙏', '👏', '❤️', '🎵', '🔥'];

export default function ParticipantsPanel({
  roomId,
  socket,
  participants,
  isHost,
  selfUserId,
  onSpotlight,
  spotlightIdentity,
  onReaction,
  waitingEntries = [],
  onAdmitUser,
}) {
  const speakers = useSpeakingParticipants();
  const speakingIds = new Set(speakers.map((p) => p.identity));

  const liveKitIdentity = (userId) => `uid:${userId}`;

  return (
    <div className="flex flex-col h-full min-h-0 glass-panel rounded-2xl border-gold/20 overflow-hidden">
      <div className="px-5 py-4 border-b border-rv-border flex items-center justify-between">
        <span className="text-sm font-semibold text-rv-text tracking-wide">Participants</span>
        <span className="text-xs font-medium text-rv-text-muted bg-ivory/5 px-2 py-0.5 rounded-full border border-rv-border-subtle">
           {participants.length}
        </span>
      </div>

      {/* ─── WAITING ROOM QUEUE (host only) ─────────────────────────────── */}
      {isHost && (
        <div className="border-b border-saffron/20 bg-saffron/[0.03]">
          <p className="label-caps-accent px-5 pt-4 pb-2">
            Waiting Admission ({waitingEntries.length})
          </p>
          {waitingEntries.length > 0 ? (
            <div className="px-2 pb-2 space-y-1">
              {waitingEntries.map((w) => (
                <motion.div
                  key={w.userId}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl border border-saffron/20 bg-rv-bg-card shadow-sm"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-saffron animate-pulse shrink-0" />
                  <p className="text-sm font-medium text-rv-text flex-1 truncate">{w.name}</p>
                  <button
                    type="button"
                    onClick={() => onAdmitUser?.(w.userId)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-saffron/20 border border-saffron/40 text-saffron text-xs font-bold hover:bg-saffron/30 transition-colors shrink-0"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Admit
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="px-5 pb-4 text-[11px] text-rv-text-muted italic">
              No students waiting currently.
            </div>
          )}
        </div>
      )}
      {/* ──────────────────────────────────────────────────────────────────── */}

      {!isHost && (
        <div className="px-3 py-2 border-b border-gold/10 flex flex-wrap gap-2">
          {emojiReactions.map((e) => (
            <button
              key={e}
              type="button"
              className="text-lg hover:scale-110 transition-transform"
              onClick={() => {
                socket?.emit('reaction', { roomId, emoji: e });
                onReaction?.(e);
              }}
            >
              {e}
            </button>
          ))}
          <button
            type="button"
            onClick={() => socket?.emit('hand:raise', { roomId })}
            className="flex items-center gap-1 text-xs text-gold border border-gold/30 rounded-lg px-2 py-1 ml-auto"
          >
            <Hand className="w-3.5 h-3.5" /> Raise
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
        {participants.map((p) => {
          const identity = liveKitIdentity(p.userId);
          const isSelf = p.userId === selfUserId;
          const speaking = speakingIds.has(identity);
          return (
            <motion.div
              key={p.userId}
              layout
              className={`rounded-xl px-4 py-2.5 flex items-center gap-3 border transition-all duration-200 ${
                speaking 
                  ? 'border-gold/35 bg-gold/[0.08] shadow-glow-sm' 
                  : 'border-rv-border bg-rv-bg-card hover:bg-rv-hover'
              } ${spotlightIdentity === identity ? 'ring-1 ring-gold/40' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-rv-text truncate flex items-center gap-1.5">
                  {p.name}
                  {p.role === 'host' && <Star className="w-3.5 h-3.5 text-gold fill-gold/20 shrink-0" />}
                  {isSelf && <span className="text-[11px] font-normal text-rv-text-faint">(you)</span>}
                </p>
                {speaking && <p className="text-[10px] font-semibold text-gold tracking-tight lowercase">Speaking…</p>}
              </div>
              {isHost && !isSelf && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    title="Mute audio"
                    className="p-1.5 rounded-lg border border-gold/15 text-ivory/60 hover:text-gold"
                    onClick={() => socket?.emit('host:mute-audio', { roomId, targetIdentity: identity })}
                  >
                    <MicOff className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Stop video"
                    className="p-1.5 rounded-lg border border-gold/15 text-ivory/60 hover:text-gold"
                    onClick={() => socket?.emit('host:mute-video', { roomId, targetIdentity: identity })}
                  >
                    <VideoOff className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Spotlight"
                    className="p-1.5 rounded-lg border border-gold/15 text-ivory/60 hover:text-gold"
                    onClick={() => onSpotlight?.(identity)}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Remove"
                    className="p-1.5 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10"
                    onClick={() => socket?.emit('host:remove', { roomId, targetIdentity: identity })}
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {isHost && (
        <div className="p-2 border-t border-gold/10">
          <button
            type="button"
            onClick={() => socket?.emit('host:mute-all', { roomId })}
            className="w-full py-2 rounded-xl text-xs font-semibold border border-gold/25 text-gold hover:bg-gold/10"
          >
            Mute all microphones
          </button>
        </div>
      )}
    </div>
  );
}
