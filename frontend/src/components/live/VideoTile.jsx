import React from 'react';
import { motion } from 'framer-motion';
import { VideoTrack } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Pin, Monitor } from 'lucide-react';

/**
 * @param {import('@livekit/components-react').TrackReference} trackRef
 */
export default function VideoTile({
  trackRef,
  isSpeaking,
  isPinned,
  onTogglePin,
  showPin,
  className = '',
  isMainSpeaker = false,
}) {
  if (!trackRef?.participant) return null;

  const isScreen = trackRef.source === Track.Source.ScreenShare;
  const name = trackRef.participant?.name || trackRef.participant?.identity || 'Participant';

  return (
    <motion.div
      layout
      className={`relative rounded-xl overflow-hidden border bg-ink/90 transition-all duration-300 ${
        isSpeaking ? 'border-gold shadow-glow-sm ring-1 ring-gold/40' : 'border-gold/15'
      } ${isPinned ? 'ring-2 ring-gold' : ''} ${isMainSpeaker ? 'ring-2 ring-gold shadow-2xl' : ''} ${className}`}
    >
      <VideoTrack trackRef={trackRef} className="w-full h-full object-cover aspect-video bg-black" />

      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 text-xs text-ivory/90 truncate">
          {isScreen && <Monitor className="w-3.5 h-3.5 text-gold shrink-0" />}
          <span className="truncate font-medium">{isScreen ? 'Screen share' : name}</span>
          {isMainSpeaker && <span className="text-gold text-[10px] font-bold">SPEAKER</span>}
        </div>
        {showPin && !isScreen && (
          <button
            type="button"
            onClick={() => onTogglePin?.(trackRef.participant.identity)}
            className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
              isPinned ? 'border-gold bg-gold/20 text-gold' : 'border-gold/20 text-ivory/60 hover:text-gold'
            }`}
            title={isPinned ? 'Unpin' : 'Pin / spotlight'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
