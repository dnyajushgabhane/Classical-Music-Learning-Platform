import { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { motion } from 'framer-motion';
import { Play, Pause, Music, Info, Activity } from 'lucide-react';
import PageShell from '../components/layout/PageShell';

const TANPURA_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

const PracticeRoom = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(0.5);
  const [bpm, setBpm] = useState(120);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);

  const tanpuraRef = useRef(null);

  useEffect(() => {
    tanpuraRef.current = new Howl({
      src: [TANPURA_URL],
      loop: true,
      volume,
      rate: pitch,
      html5: true,
    });

    return () => {
      if (tanpuraRef.current) tanpuraRef.current.unload();
    };
  }, []);

  useEffect(() => {
    if (tanpuraRef.current) {
      tanpuraRef.current.volume(volume);
      tanpuraRef.current.rate(pitch);
    }
  }, [volume, pitch]);

  const toggleTanpura = () => {
    if (isPlaying) {
      tanpuraRef.current.pause();
    } else {
      tanpuraRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMetronome = () => {
    setIsMetronomeActive(!isMetronomeActive);
  };

  const range =
    'w-full accent-gold bg-ivory/10 h-1.5 rounded-lg appearance-none cursor-pointer';

  return (
    <PageShell className="max-w-4xl">
      <header className="mb-12 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-gold/70 mb-3">Riyāz</p>
        <h1 className="font-display text-display-lg font-semibold text-ivory mb-3">
          Practice <span className="text-gradient-gold">room</span>
        </h1>
        <p className="text-ivory/50 font-light text-lg">Tools worthy of a daily sādhanā.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="music-sheet-card rounded-3xl p-8 flex flex-col items-center text-center border-gold/20"
        >
          <div className="w-16 h-16 bg-gold/10 rounded-2xl border border-gold/20 flex items-center justify-center mb-6">
            <Music className="text-gold w-8 h-8" strokeWidth={1.25} />
          </div>
          <h3 className="text-2xl font-display font-semibold text-ivory mb-2">Digital tanpura</h3>
          <p className="text-ivory/50 text-sm mb-8 max-w-xs">A steady drone — the spine of intonation.</p>

          <div className="w-full space-y-6 mb-8">
            <div className="space-y-2 text-left">
              <div className="flex justify-between text-xs text-ivory/45 uppercase tracking-widest">
                <span>Pitch (rate)</span>
                <span>{pitch.toFixed(2)}×</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.01"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className={range}
              />
            </div>
            <div className="space-y-2 text-left">
              <div className="flex justify-between text-xs text-ivory/45 uppercase tracking-widest">
                <span>Volume</span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className={range}
              />
            </div>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={toggleTanpura}
            className={`w-full py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-3 ${
              isPlaying
                ? 'bg-maroon/50 text-saffron border border-saffron/30'
                : 'bg-gradient-to-r from-gold to-gold-dark text-ink shadow-glow'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5" /> Stop drone
              </>
            ) : (
              <>
                <Play className="w-5 h-5" /> Start tanpura
              </>
            )}
          </motion.button>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="music-sheet-card rounded-3xl p-8 flex flex-col items-center text-center border-gold/20"
        >
          <div className="w-16 h-16 bg-gold/10 rounded-2xl border border-gold/20 flex items-center justify-center mb-6">
            <Activity className="text-gold w-8 h-8" strokeWidth={1.25} />
          </div>
          <h3 className="text-2xl font-display font-semibold text-ivory mb-2">Metronome / tāl</h3>
          <p className="text-ivory/50 text-sm mb-8 max-w-xs">Lay the foundation — then soar through tempo.</p>

          <div className="w-full space-y-6 mb-8">
            <div className="flex items-center justify-center gap-6 mb-4">
              <button
                type="button"
                onClick={() => setBpm((b) => Math.max(40, b - 5))}
                className="w-11 h-11 rounded-full border border-gold/30 flex items-center justify-center hover:bg-gold/10 text-gold"
              >
                −
              </button>
              <div className="text-center min-w-[5rem]">
                <span className="text-4xl font-mono font-semibold text-ivory">{bpm}</span>
                <p className="text-[10px] text-ivory/40 uppercase tracking-widest">BPM</p>
              </div>
              <button
                type="button"
                onClick={() => setBpm((b) => Math.min(240, b + 5))}
                className="w-11 h-11 rounded-full border border-gold/30 flex items-center justify-center hover:bg-gold/10 text-gold"
              >
                +
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((beat) => (
                <div
                  key={beat}
                  className={`h-2 rounded-full transition-colors ${
                    isMetronomeActive ? 'bg-gold animate-pulse' : 'bg-ivory/10'
                  }`}
                />
              ))}
            </div>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={toggleMetronome}
            className={`w-full py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-3 ${
              isMetronomeActive
                ? 'bg-maroon/50 text-saffron border border-saffron/30'
                : 'border border-gold/35 text-gold hover:bg-gold/10'
            }`}
          >
            {isMetronomeActive ? (
              <>
                <Pause className="w-5 h-5" /> Stop
              </>
            ) : (
              <>
                <Play className="w-5 h-5" /> Start metronome
              </>
            )}
          </motion.button>
        </motion.div>
      </div>

      <div className="mt-12 p-6 music-sheet-card rounded-2xl border-gold/15 flex items-start gap-4">
        <Info className="text-gold w-6 h-6 flex-shrink-0 mt-0.5" strokeWidth={1.25} />
        <p className="text-sm text-ivory/55 leading-relaxed">
          Tune the tanpura to your Sa and let the metronome sculpt your laya. Advanced learners may fine-tune rate to
          match their śruti — as a gharānā would expect.
        </p>
      </div>
    </PageShell>
  );
};

export default PracticeRoom;
