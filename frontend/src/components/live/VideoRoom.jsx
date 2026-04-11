import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTracks, useSpeakingParticipants, RoomAudioRenderer } from '@livekit/components-react';
import { Track } from 'livekit-client';
import VideoTile from './VideoTile';
import Controls from './Controls';
import ChatPanel from './ChatPanel';
import ParticipantsPanel from './ParticipantsPanel';
import WhiteboardPanel from './WhiteboardPanel';
import RecordingsPanel from './RecordingsPanel';
import FloatingReactions from './FloatingReactions';

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
  onLayoutChange,
  layout,
  onEndSession,
  onReaction,
  floatingReactions = [],
  onRemoveReaction,
  waitingEntries = [],
  onAdmitUser,
}) {
  const [rightPanel, setRightPanel] = useState('chat');
  const [pinnedIdentity, setPinnedIdentity] = useState(null);
  const [handRaised, setHandRaised] = useState(false);

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
    (userInfo?.role === 'Instructor' || userInfo?.role === 'Admin') &&
    (String(teacherId) === String(selfId) || userInfo?.role === 'Admin');

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

  const gridClass = useMemo(() => {
    if (layout === 'speaker') {
      // Speaker layout: main speaker large, others small grid
      return sorted.length <= 1
        ? 'grid-cols-1'
        : 'grid-cols-1 lg:grid-cols-4 lg:grid-rows-2';
    }
    // Grid layout
    return sorted.length <= 1
      ? 'grid-cols-1'
      : sorted.length === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : sorted.length <= 4
          ? 'grid-cols-2'
          : 'grid-cols-2 lg:grid-cols-3';
  }, [sorted.length, layout]);

  const handleRaiseHand = () => {
    const newRaised = !handRaised;
    setHandRaised(newRaised);
    socket?.emit('hand:raise', { roomId });
  };

  const getTileClass = (index, trackRef) => {
    if (layout === 'speaker') {
      if (index === 0 && trackRef.source !== Track.Source.ScreenShare) {
        // Main speaker
        return 'col-span-1 lg:col-span-3 lg:row-span-2';
      }
      // Other participants
      return 'col-span-1';
    }
    // Grid layout
    return trackRef.source === Track.Source.ScreenShare ? 'sm:col-span-2' : '';
  };

  return (
    <div className="relative flex flex-col h-[100dvh] bg-rv-bg text-rv-text overflow-hidden transition-colors duration-300">
      <RoomAudioRenderer />

      <header className="shrink-0 z-20 px-4 py-3 border-b border-gold/15 glass-nav flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="label-caps-accent mb-0.5">Live gurukul</p>
          <h1 className="font-display text-xl font-semibold text-rv-text truncate">{session.title}</h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {isHost && waitingEntries.length > 0 && (
            <button
              type="button"
              onClick={() => setRightPanel('people')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-saffron/15 border border-saffron/40 text-saffron text-xs font-bold animate-pulse"
            >
              <span className="w-2 h-2 rounded-full bg-saffron" />
              {waitingEntries.length} waiting
            </button>
          )}
          <div className="flex items-center gap-2 text-xs font-medium text-rv-text-muted">
            <span className="w-2 h-2 rounded-full bg-saffron animate-pulse" />
            LIVE
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <main className="flex-1 min-w-0 flex flex-col p-3 gap-3 relative">
          <FloatingReactions reactions={floatingReactions} onRemove={onRemoveReaction} />

          <div className={`grid gap-3 flex-1 min-h-0 overflow-y-auto ${gridClass}`}>
            {sorted.map((trackRef, index) => {
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
                  className={getTileClass(index, trackRef)}
                  isMainSpeaker={layout === 'speaker' && index === 0 && !isScreen}
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
              layout={layout}
              onLayoutChange={onLayoutChange}
              onRaiseHand={handleRaiseHand}
              handRaised={handRaised}
              onEndSession={onEndSession}
              onReaction={onReaction}
            />
          </div>
        </main>

        {rightPanel !== 'hidden' && (
          <aside className="w-full sm:w-[340px] lg:w-[380px] shrink-0 border-l border-rv-border flex flex-col bg-rv-bg-card/95 backdrop-blur-md min-h-0 max-h-[100dvh] shadow-xl">
            <div className="flex border-b border-rv-border bg-rv-bg-card/50">
              {['chat', 'people', 'board', ...(isHost ? ['recordings'] : [])].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRightPanel(tab)}
                  className={`flex-1 py-3.5 transition-all duration-200 label-caps border-b-2 ${
                    rightPanel === tab 
                      ? 'text-gold border-gold bg-gold/[0.03]' 
                      : 'text-rv-text-muted border-transparent hover:text-rv-text hover:bg-rv-hover'
                  }`}
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
                  waitingEntries={waitingEntries}
                  onAdmitUser={onAdmitUser}
                  onSpotlight={(identity) => {
                    setPinnedIdentity(identity || null);
                    onSpotlightMeta?.(identity || '');
                  }}
                />
              )}
              {rightPanel === 'board' && (
                <WhiteboardPanel socket={socket} roomId={roomId} isHost={isHost} readOnly={!isHost} />
              )}
              {rightPanel === 'recordings' && (
                <RecordingsPanel sessionId={session._id} isHost={isHost} />
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
