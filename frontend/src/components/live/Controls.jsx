import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MessageSquare,
  Users,
  PhoneOff,
  PenLine,
  Circle,
  PanelRightClose,
  Grid3X3,
  User,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Settings,
  Hand,
  Download,
  MoreVertical,
} from 'lucide-react';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';

const btn =
  'flex flex-col items-center justify-center gap-1 px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-semibold transition-all border shrink-0';

export default function Controls({
  rightPanel,
  onSetRightPanel,
  isHost,
  recordingOn,
  onToggleRecording,
  onLeave,
  layout = 'grid',
  onLayoutChange,
  onRaiseHand,
  handRaised = false,
  onEndSession,
  onReaction,
}) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [screenBusy, setScreenBusy] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [backgroundBlur, setBackgroundBlur] = useState(false);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const reactions = ['❤️', '👍', '😂', '👏', '🔥'];

  const micOn = localParticipant?.isMicrophoneEnabled;
  const camOn = localParticipant?.isCameraEnabled;

  const toggleMic = async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setMicrophoneEnabled(!micOn, {
        echoCancellation: true,
        noiseSuppression: noiseSuppression,
        autoGainControl: true,
      });
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
      toast.error('Could not toggle microphone. Please check permissions.');
    }
  };

  const toggleCam = async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setCameraEnabled(!camOn);
    } catch (error) {
      console.error('Failed to toggle camera:', error);
      toast.error('Could not toggle camera. Please check permissions.');
    }
  };

  const toggleScreen = async () => {
    if (!localParticipant) return;
    try {
      setScreenBusy(true);
      const on = localParticipant.isScreenShareEnabled;
      await localParticipant.setScreenShareEnabled(!on);
    } catch (error) {
      console.error('Failed to toggle screen share:', error);
    } finally {
      setScreenBusy(false);
    }
  };

  const toggleBackgroundBlur = async () => {
    try {
      setBackgroundBlur(!backgroundBlur);
      // Implementation placeholder for background blur logic
    } catch (error) {
      console.error('Failed to toggle background blur:', error);
    }
  };

  const toggleNoiseSuppression = async () => {
    try {
      setNoiseSuppression(!noiseSuppression);
      await localParticipant.setMicrophoneEnabled(micOn, {
        echoCancellation: true,
        noiseSuppression: !noiseSuppression,
        autoGainControl: true,
      });
    } catch (error) {
      console.error('Failed to toggle noise suppression:', error);
    }
  };

  const cyclePanel = (key) => {
    onSetRightPanel((prev) => (prev === key ? 'hidden' : key));
  };

  const cycleLayout = () => {
    const layouts = ['grid', 'speaker'];
    const currentIndex = layouts.indexOf(layout);
    const nextLayout = layouts[(currentIndex + 1) % layouts.length];
    onLayoutChange?.(nextLayout);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto px-4 pb-4">
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-nav rounded-2xl px-3 py-2 sm:py-3 flex items-center justify-between sm:justify-center gap-1 sm:gap-4 border-gold/20 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Core Controls - Always Visible */}
          <button
            type="button"
            onClick={toggleMic}
            className={`${btn} ${micOn ? 'border-gold/30 bg-gold/5 text-ivory' : 'border-red-500/40 bg-red-500/10 text-red-300'}`}
          >
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            <span className="hidden md:inline">Mic</span>
          </button>

          <button
            type="button"
            onClick={toggleCam}
            className={`${btn} ${camOn ? 'border-gold/30 bg-gold/5 text-ivory' : 'border-ivory/20 bg-ivory/5 text-ivory/50'}`}
          >
            {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            <span className="hidden md:inline">Cam</span>
          </button>
        </div>

        {/* Desktop-Only / Secondary Controls */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            type="button"
            onClick={toggleScreen}
            disabled={screenBusy}
            className={`${btn} border-gold/30 bg-gold/10 text-gold ${localParticipant.isScreenShareEnabled ? 'ring-1 ring-gold' : ''}`}
          >
            <MonitorUp className="w-5 h-5" />
            Share
          </button>

          <button
            type="button"
            onClick={() => cyclePanel('chat')}
            className={`${btn} ${rightPanel === 'chat' ? 'border-gold ring-1 ring-gold/40 text-gold' : 'border-gold/20 text-ivory/80'}`}
          >
            <MessageSquare className="w-5 h-5" />
            Chat
          </button>

          <button
            type="button"
            onClick={() => cyclePanel('people')}
            className={`${btn} ${rightPanel === 'people' ? 'border-gold ring-1 ring-gold/40 text-gold' : 'border-gold/20 text-ivory/80'}`}
          >
            <Users className="w-5 h-5" />
            People
          </button>

          <button
            type="button"
            onClick={() => cyclePanel('board')}
            className={`${btn} ${rightPanel === 'board' ? 'border-gold ring-1 ring-gold/40 text-gold' : 'border-gold/20 text-ivory/80'}`}
          >
            <PenLine className="w-5 h-5" />
            Board
          </button>

          {isHost && (
            <button
              type="button"
              onClick={onToggleRecording}
              className={`${btn} ${recordingOn ? 'border-red-400/60 bg-red-500/15 text-red-300' : 'border-gold/20 text-ivory/80'}`}
            >
              <Circle className={`w-5 h-5 ${recordingOn ? 'fill-red-400 text-red-400' : ''}`} />
              Rec
            </button>
          )}

          <button
            type="button"
            onClick={cycleLayout}
            className={`${btn} border-gold/20 text-ivory/80`}
          >
            {layout === 'grid' ? <Grid3X3 className="w-5 h-5" /> : <User className="w-5 h-5" />}
            {layout === 'grid' ? 'Grid' : 'Speaker'}
          </button>
        </div>

        {/* Reaction Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowReactions(!showReactions)}
            className={`${btn} border-gold/20 text-ivory/80`}
          >
            <span className="text-xl leading-none">😊</span>
            <span className="hidden md:inline">React</span>
          </button>
          
          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-ink/90 border border-gold/20 rounded-full backdrop-blur-md shadow-glow-sm"
              >
                {reactions.map(r => (
                  <button
                    key={r}
                    onClick={() => {
                      onReaction?.(r);
                      setShowReactions(false);
                    }}
                    className="text-2xl hover:scale-125 transition-transform p-1"
                  >
                    {r}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile More Menu Button */}
          <button
            type="button"
            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            className={`lg:hidden ${btn} border-gold/20 text-ivory/80`}
          >
            <MoreVertical className="w-5 h-5" />
            More
          </button>

          {!isHost && onRaiseHand && (
            <button
              type="button"
              onClick={onRaiseHand}
              className={`hidden sm:flex ${btn} ${handRaised ? 'border-gold ring-1 ring-gold/40 text-gold' : 'border-gold/20 text-ivory/80'}`}
            >
              <Hand className={`w-5 h-5 ${handRaised ? 'fill-gold' : ''}`} />
              <span className="hidden md:inline">Hand</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              room?.disconnect?.();
              onLeave?.();
            }}
            className={`${btn} border-red-500/50 bg-red-900/40 text-red-200 hover:bg-red-900/60 transition-colors`}
          >
            <PhoneOff className="w-5 h-5" />
            <span className="hidden md:inline">Leave</span>
          </button>

          {isHost && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to end this session for everyone?')) {
                  onEndSession?.();
                }
              }}
              className={`hidden sm:flex ${btn} border-red-500 bg-red-600 text-ivory hover:bg-red-700`}
            >
              <PhoneOff className="w-5 h-5 rotate-135" />
              <span className="hidden md:inline">End</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* More Menu for Mobile/Tablet */}
      <AnimatePresence>
        {moreMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="lg:hidden absolute bottom-full mb-4 right-4 w-72 bg-ink/95 rounded-2xl border border-gold/20 p-4 shadow-2xl z-50 backdrop-blur-xl"
          >
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button onClick={() => { toggleScreen(); setMoreMenuOpen(false); }} className={`${btn} w-full flex-row gap-2`}>
                <MonitorUp className="w-4 h-4" /> Share
              </button>
              <button onClick={() => { cyclePanel('chat'); setMoreMenuOpen(false); }} className={`${btn} w-full flex-row gap-2 ${rightPanel === 'chat' ? 'border-gold' : ''}`}>
                <MessageSquare className="w-4 h-4" /> Chat
              </button>
              <button onClick={() => { cyclePanel('people'); setMoreMenuOpen(false); }} className={`${btn} w-full flex-row gap-2 ${rightPanel === 'people' ? 'border-gold' : ''}`}>
                <Users className="w-4 h-4" /> People
              </button>
              <button onClick={() => { cyclePanel('board'); setMoreMenuOpen(false); }} className={`${btn} w-full flex-row gap-2 ${rightPanel === 'board' ? 'border-gold' : ''}`}>
                <PenLine className="w-4 h-4" /> Board
              </button>
              <button onClick={() => { cycleLayout(); setMoreMenuOpen(false); }} className={`${btn} w-full flex-row gap-2`}>
                {layout === 'grid' ? <Grid3X3 className="w-4 h-4" /> : <User className="w-4 h-4" />} Layout
              </button>
              {onRaiseHand && !isHost && (
                <button onClick={() => { onRaiseHand(); setMoreMenuOpen(false); }} className={`${btn} w-full flex-row gap-2 ${handRaised ? 'text-gold' : ''}`}>
                  <Hand className="w-4 h-4" /> Hand
                </button>
              )}
              {isHost && (
                <button onClick={() => { onToggleRecording(); setMoreMenuOpen(false); }} className={`${btn} w-full flex-row gap-2 ${recordingOn ? 'text-red-400' : ''}`}>
                  <Circle className="w-4 h-4" /> Rec
                </button>
              )}
            </div>
            
            <div className="pt-4 border-t border-gold/10 space-y-3">
               <button onClick={toggleNoiseSuppression} className="flex items-center justify-between w-full text-xs text-ivory/70 px-2 py-1">
                 <div className="flex items-center gap-2">
                   {noiseSuppression ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />} Noise Suppression
                 </div>
                 <div className={`w-8 h-4 rounded-full relative transition-colors ${noiseSuppression ? 'bg-gold' : 'bg-ivory/20'}`}>
                    <div className={`absolute top-1 w-2 h-2 rounded-full bg-ink transition-all ${noiseSuppression ? 'right-1' : 'left-1'}`} />
                 </div>
               </button>
               <button onClick={toggleBackgroundBlur} className="flex items-center justify-between w-full text-xs text-ivory/70 px-2 py-1">
                 <div className="flex items-center gap-2">
                   <Eye className="w-4 h-4" /> Background Blur
                 </div>
                 <div className={`w-8 h-4 rounded-full relative transition-colors ${backgroundBlur ? 'bg-gold' : 'bg-ivory/20'}`}>
                    <div className={`absolute top-1 w-2 h-2 rounded-full bg-ink transition-all ${backgroundBlur ? 'right-1' : 'left-1'}`} />
                 </div>
               </button>
               
               {isHost && (
                <button onClick={() => { if(confirm('End session?')) onEndSession(); setMoreMenuOpen(false); }} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 text-ivory text-xs font-bold mt-2">
                   <PhoneOff className="w-4 h-4 rotate-135" /> End Session for All
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
