import { motion } from 'framer-motion';

const BARS = 40;

export default function SoundWaveBackdrop({ className = '' }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 flex items-end justify-center gap-0.5 opacity-[0.12] ${className}`}
      aria-hidden
    >
      {Array.from({ length: BARS }).map((_, i) => (
        <motion.div
          key={i}
          className="w-0.5 max-h-[45%] min-h-[8%] rounded-full bg-gradient-to-t from-gold-dark via-gold to-transparent origin-bottom"
          animate={{
            scaleY: [0.35, 1, 0.5, 0.85, 0.4],
          }}
          transition={{
            duration: 1.6 + (i % 7) * 0.08,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.04,
          }}
        />
      ))}
    </div>
  );
}
