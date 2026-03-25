import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTracks, useSpeakingParticipants, RoomAudioRenderer } from '@livekit/components-react';
import { Track } from 'livekit-client';
import VideoTile from './VideoTile';
import Controls from './Controls';
import ChatPanel from './ChatPanel';
import ParticipantsPanel from './ParticipantsPanel';
import WhiteboardPanel from './WhiteboardPanel';

export default function VideoRoom({
  session,
  socket,
  userInfo,
  onLeave,
  chatMessages,
  participants,
  onFetchMessages,
  onSpotlightMeta,
  spotlightIdentity,
  recordingOn,
  onToggleRecording,
  reactionPopup,
}) {
  const [rightPanel, setRightPanel] = useState('chat');
  const [pinnedIdentity, setPinnedIdentity] = useState(null);

  const speakers = useSpeakingParticipants();
  const speakingSet = useMemo(() => new Set(speakers.map((p) => p.identity)), [speakers]);

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const roomId = session.roomId;
  const selfId = userInfo?._id || userInfo?.id;
  const teacherId = session.teacher?._id || session.teacher;
  const isHost =
    userInfo?.role === 'Instructor' && String(teacherId) === String(selfId);

  const effectivePin = spotlightIdentity || pinnedIdentity;

  const sorted = useMemo(() => {
    const list = [...tracks];
    list.sort((a, b) => {
      const as = a.source === Track.Source.ScreenShare ? 0 : 1;
      const bs = b.source === Track.Source.ScreenShare ? 0 : 1;
      if (as !== bs) return as - bs;
      const ap = a.participant?.identity === effectivePin ? 0 : 1;
      const bp = b.participant?.identity === effectivePin ? 0 : 1;
      return ap - bp;
    });
    return list;
  }, [tracks, effectivePin]);

  const gridClass =
    sorted.length <= 1
      ? 'grid-cols-1'
      : sorted.length === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : sorted.length <= 4
          ? 'grid-cols-2'
          : 'grid-cols-2 lg:grid-cols-3';

  return (
    <div className="relative flex flex-col h-[100dvh] bg-ink text-ivory overflow-hidden">
      <RoomAudioRenderer />

      <header className="shrink-0 z-20 px-4 py-3 border-b border-gold/15 glass-nav flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold/70">Live gurukul</p>
          <h1 className="font-display text-lg font-semibold truncate">{session.title}</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-ivory/55 shrink-0">
          <span className="w-2 h-2 rounded-full bg-saffron animate-pulse" />
          LIVE
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <main className="flex-1 min-w-0 flex flex-col p-3 gap-3 relative">
          <AnimatePresence>
            {reactionPopup && (
              <motion.div
                key={reactionPopup.ts}
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-30 text-4xl pointer-events-none drop-shadow-lg"
              >
                {reactionPopup.emoji}
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`grid gap-3 flex-1 min-h-0 overflow-y-auto ${gridClass}`}>
            {sorted.map((trackRef) => {
              if (!trackRef?.participant) return null;
              const id = trackRef.participant.identity;
              const isScreen = trackRef.source === Track.Source.ScreenShare;
              return (
                <VideoTile
                  key={`${id}-${trackRef.source}`}
                  trackRef={trackRef}
                  isSpeaking={speakingSet.has(id)}
                  isPinned={effectivePin === id}
                  showPin={isHost}
                  onTogglePin={(identity) => {
                    const next = effectivePin === identity ? '' : identity;
                    setPinnedIdentity(next || null);
                    onSpotlightMeta?.(next);
                  }}
                  className={isScreen ? 'sm:col-span-2' : ''}
                />
              );
            })}
          </div>

          <div className="shrink-0 flex justify-center">
            <Controls
              rightPanel={rightPanel}
              onSetRightPanel={setRightPanel}
              isHost={isHost}
              recordingOn={recordingOn}
              onToggleRecording={onToggleRecording}
              onLeave={onLeave}
            />
          </div>
        </main>

        {rightPanel !== 'hidden' && (
          <aside className="w-full sm:w-[340px] lg:w-[380px] shrink-0 border-l border-gold/15 flex flex-col bg-background-dark/95 min-h-0 max-h-[100dvh]">
            <div className="flex border-b border-gold/15 text-[11px] font-semibold uppercase tracking-wider">
              {['chat', 'people', 'board'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRightPanel(tab)}
                  className={`flex-1 py-2 transition-colors ${rightPanel === tab ? 'text-gold border-b-2 border-gold' : 'text-ivory/45'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex-1 min-h-0 p-2 flex flex-col overflow-hidden">
              {rightPanel === 'chat' && (
                <ChatPanel
                  socket={socket}
                  roomId={roomId}
                  sessionId={session._id}
                  messages={chatMessages}
                  participants={participants}
                  selfUserId={selfId}
                  fetchMessages={onFetchMessages}
                />
              )}
              {rightPanel === 'people' && (
                <ParticipantsPanel
                  roomId={roomId}
                  socket={socket}
                  participants={participants}
                  isHost={isHost}
                  selfUserId={selfId}
                  spotlightIdentity={effectivePin}
                  onSpotlight={(identity) => {
                    setPinnedIdentity(identity || null);
                    onSpotlightMeta?.(identity || '');
                  }}
                />
              )}
              {rightPanel === 'board' && (
                <WhiteboardPanel socket={socket} roomId={roomId} isHost={isHost} readOnly={!isHost} />
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
