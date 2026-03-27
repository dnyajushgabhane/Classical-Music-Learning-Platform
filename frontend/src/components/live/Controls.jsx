import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';

const btn =
  'flex flex-col items-center justify-center gap-1 px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-semibold transition-all border';

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
}) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [screenBusy, setScreenBusy] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [backgroundBlur, setBackgroundBlur] = useState(false);
  const [noiseSuppression, setNoiseSuppression] = useState(true);

  const audioProcessorRef = useRef(null);
  const backgroundBlurRef = useRef(null);

  const micOn = localParticipant.isMicrophoneEnabled;
  const camOn = localParticipant.isCameraEnabled;

  const toggleMic = async () => {
    try {
      await localParticipant.setMicrophoneEnabled(!micOn, {
        echoCancellation: true,
        noiseSuppression: noiseSuppression,
        autoGainControl: true,
      });
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
    }
  };

  const toggleCam = async () => {
    try {
      await localParticipant.setCameraEnabled(!camOn);
    } catch (error) {
      console.error('Failed to toggle camera:', error);
    }
  };

  const toggleScreen = async () => {
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
      if (!backgroundBlurRef.current) {
        const videoElement = document.querySelector('video[data-lk-local-participant="true"]');
        if (videoElement) {
          const BackgroundBlur = (await import('../../utils/backgroundBlur')).default;
          backgroundBlurRef.current = new BackgroundBlur(videoElement);
        }
      }

      if (backgroundBlur) {
        backgroundBlurRef.current?.disable();
        setBackgroundBlur(false);
      } else {
        backgroundBlurRef.current?.enable();
        setBackgroundBlur(true);
      }
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
    <div className="relative">
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-nav rounded-2xl px-2 sm:px-4 py-2 sm:py-3 flex flex-wrap items-center justify-center gap-1 sm:gap-2 border-gold/20 max-w-[100vw]"
      >
      <button
        type="button"
        onClick={toggleMic}
        className={`${btn} ${micOn ? 'border-gold/30 bg-gold/5 text-ivory' : 'border-red-500/40 bg-red-500/10 text-red-300'}`}
      >
        {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        Mic
      </button>

      <button
        type="button"
        onClick={toggleCam}
        className={`${btn} ${camOn ? 'border-gold/30 bg-gold/5 text-ivory' : 'border-ivory/20 bg-ivory/5 text-ivory/50'}`}
      >
        {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        Cam
      </button>

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
        title="Whiteboard"
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
        title={`Switch to ${layout === 'grid' ? 'speaker' : 'grid'} view`}
      >
        {layout === 'grid' ? <Grid3X3 className="w-5 h-5" /> : <User className="w-5 h-5" />}
        {layout === 'grid' ? 'Grid' : 'Speaker'}
      </button>

      {!isHost && onRaiseHand && (
        <button
          type="button"
          onClick={onRaiseHand}
          className={`${btn} ${handRaised ? 'border-gold ring-1 ring-gold/40 text-gold' : 'border-gold/20 text-ivory/80'}`}
          title={handRaised ? 'Lower hand' : 'Raise hand'}
        >
          <Hand className={`w-5 h-5 ${handRaised ? 'fill-gold' : ''}`} />
          Hand
        </button>
      )}

      <button
        type="button"
        onClick={() => setSettingsOpen(!settingsOpen)}
        className={`${btn} ${settingsOpen ? 'border-gold ring-1 ring-gold/40 text-gold' : 'border-gold/20 text-ivory/80'}`}
        title="Audio & video settings"
      >
        <Settings className="w-5 h-5" />
        Settings
      </button>

      {isHost && (
        <button
          type="button"
          onClick={() => cyclePanel('recordings')}
          className={`${btn} ${rightPanel === 'recordings' ? 'border-gold ring-1 ring-gold/40 text-gold' : 'border-gold/20 text-ivory/80'}`}
          title="View recordings"
        >
          <Download className="w-5 h-5" />
          Recordings
        </button>
      )}

      <button
        type="button"
        onClick={() => onSetRightPanel((p) => (p === 'hidden' ? 'chat' : 'hidden'))}
        className={`${btn} border-gold/15 text-ivory/60`}
        title="Toggle sidebar"
      >
        <PanelRightClose className="w-5 h-5" />
        Panel
      </button>

      <button
        type="button"
        onClick={() => {
          room?.disconnect?.();
          onLeave?.();
        }}
        className={`${btn} border-red-500/50 bg-red-900/30 text-red-200 hover:bg-red-900/50 ml-1`}
      >
        <PhoneOff className="w-5 h-5" />
        Leave
      </button>
    </motion.div>

    {settingsOpen && (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="absolute bottom-full mb-2 right-0 glass-nav rounded-xl p-3 border border-gold/20 min-w-[200px]"
      >
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gold uppercase tracking-wider">Audio Settings</div>
          
          <button
            type="button"
            onClick={toggleNoiseSuppression}
            className="flex items-center gap-2 w-full text-left text-sm text-ivory/80 hover:text-ivory"
          >
            {noiseSuppression ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            Noise Suppression
          </button>

          <div className="text-xs font-semibold text-gold uppercase tracking-wider pt-2 border-t border-gold/10">Video Settings</div>
          
          <button
            type="button"
            onClick={toggleBackgroundBlur}
            className="flex items-center gap-2 w-full text-left text-sm text-ivory/80 hover:text-ivory"
          >
            {backgroundBlur ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            Background Blur
          </button>
        </div>
      </motion.div>
    )}
  </div>
);
}
