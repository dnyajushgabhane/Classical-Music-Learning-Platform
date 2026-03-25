import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Volume2, VolumeX, Settings, Maximize2, Repeat } from 'lucide-react';

const GOLD = '#D4AF37';
const GOLD_DIM = '#8A7029';

const WaveformPlayer = ({ url, title, artist }) => {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgba(248, 241, 233, 0.12)',
      progressColor: GOLD,
      cursorColor: GOLD_DIM,
      barWidth: 2,
      barRadius: 3,
      responsive: true,
      height: 60,
      normalize: true,
      partialRender: true,
    });

    wavesurfer.load(url);

    wavesurfer.on('ready', () => {
      setDuration(wavesurfer.getDuration());
      wavesurferRef.current = wavesurfer;
    });

    wavesurfer.on('audioprocess', () => {
      setCurrentTime(wavesurfer.getCurrentTime());
    });

    wavesurfer.on('finish', () => {
      setIsPlaying(false);
    });

    return () => {
      wavesurfer.destroy();
    };
  }, [url]);

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
      setIsPlaying(wavesurferRef.current.isPlaying());
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(newVolume);
    }
    setIsMuted(newVolume === 0);
  };

  const handleSpeedChange = () => {
    const nextSpeed = speed === 1 ? 1.25 : speed === 1.25 ? 1.5 : speed === 1.5 ? 0.75 : 1;
    setSpeed(nextSpeed);
    if (wavesurferRef.current) {
      wavesurferRef.current.setPlaybackRate(nextSpeed);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="music-sheet-card rounded-3xl p-6 md:p-8 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold/20 to-ink border border-gold/25 flex items-center justify-center shrink-0 shadow-glow-sm">
          <Maximize2 className="text-gold w-8 h-8" strokeWidth={1.25} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-display font-semibold text-ivory truncate">{title || 'Masterclass'}</h3>
          <p className="text-gold/90 text-sm font-medium mt-1">{artist || 'Grandmaster'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
          <button
            type="button"
            onClick={handleSpeedChange}
            className="px-3 py-1.5 rounded-full border border-gold/25 text-[10px] font-bold text-gold hover:bg-gold/10 transition-colors"
          >
            {speed}x speed
          </button>
          <div className="bg-maroon/40 text-gold/90 text-[10px] font-bold px-3 py-1.5 rounded-full border border-gold/20">
            HI-RES
          </div>
        </div>
      </div>

      <div ref={containerRef} className="mb-4 cursor-pointer" />

      <div className="flex items-center justify-between text-[10px] font-mono text-ivory/45 mb-6 px-2">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex items-center gap-6">
          <button type="button" className="text-ivory/45 hover:text-gold transition-colors">
            <Repeat className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handlePlayPause}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-ink hover:scale-110 transition-transform shadow-glow"
          >
            {isPlaying ? <Pause className="fill-current w-6 h-6" /> : <Play className="fill-current w-6 h-6 ml-0.5" />}
          </button>
          <button type="button" className="text-ivory/45 hover:text-gold transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 items-center gap-4 px-0 sm:px-4 min-w-0">
          <button type="button" onClick={() => setIsMuted(!isMuted)} className="text-ivory/45 hover:text-gold shrink-0">
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="flex-1 accent-gold bg-ivory/10 h-1 rounded-lg appearance-none cursor-pointer min-w-0"
          />
        </div>
      </div>
    </div>
  );
};

export default WaveformPlayer;
