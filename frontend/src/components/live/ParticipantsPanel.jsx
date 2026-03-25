import React from 'react';
import { motion } from 'framer-motion';
import { MicOff, VideoOff, UserMinus, Hand, Star } from 'lucide-react';
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
}) {
  const speakers = useSpeakingParticipants();
  const speakingIds = new Set(speakers.map((p) => p.identity));

  const liveKitIdentity = (userId) => `uid:${userId}`;

  return (
    <div className="flex flex-col h-full min-h-0 glass-panel rounded-2xl border-gold/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-gold/15">
        <span className="text-sm font-display font-semibold text-ivory">Participants</span>
        <span className="text-xs text-ivory/45 ml-2">({participants.length})</span>
      </div>

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
              className={`rounded-xl px-3 py-2 flex items-center gap-2 border ${
                speaking ? 'border-gold/40 bg-gold/5' : 'border-gold/10 bg-ink/40'
              } ${spotlightIdentity === identity ? 'ring-1 ring-gold' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ivory truncate flex items-center gap-1">
                  {p.name}
                  {p.role === 'host' && <Star className="w-3.5 h-3.5 text-gold shrink-0" />}
                  {isSelf && <span className="text-[10px] text-ivory/40">(you)</span>}
                </p>
                {speaking && <p className="text-[10px] text-gold/80">Speaking…</p>}
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
