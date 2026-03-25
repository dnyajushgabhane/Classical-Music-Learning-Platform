import React, { useState } from 'react';
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
}) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [screenBusy, setScreenBusy] = useState(false);

  const micOn = localParticipant.isMicrophoneEnabled;
  const camOn = localParticipant.isCameraEnabled;

  const toggleMic = async () => {
    await localParticipant.setMicrophoneEnabled(!micOn);
  };

  const toggleCam = async () => {
    await localParticipant.setCameraEnabled(!camOn);
  };

  const toggleScreen = async () => {
    try {
      setScreenBusy(true);
      const on = localParticipant.isScreenShareEnabled;
      await localParticipant.setScreenShareEnabled(!on);
    } finally {
      setScreenBusy(false);
    }
  };

  const cyclePanel = (key) => {
    onSetRightPanel((prev) => (prev === key ? 'hidden' : key));
  };

  return (
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
  );
}
