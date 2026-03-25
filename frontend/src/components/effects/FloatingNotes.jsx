import { motion } from 'framer-motion';

const NOTES = ['♪', '♫', '𝄞', '♬', '𝄢', '♩'];

function Note({ delay, x, size, duration }) {
  return (
    <motion.span
      className="pointer-events-none absolute select-none font-serif text-gold/25"
      style={{ left: `${x}%`, fontSize: size, bottom: '-8%' }}
      initial={{ opacity: 0, y: '110vh', rotate: 0 }}
      animate={{ opacity: [0, 0.45, 0.35, 0], y: '-20vh', rotate: [0, 12, -8, 20] }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {NOTES[(delay * 7) % NOTES.length]}
    </motion.span>
  );
}

export default function FloatingNotes({ count = 12 }) {
  const items = Array.from({ length: count }, (_, i) => ({
    id: i,
    delay: (i * 1.1) % 5,
    x: (i * 17 + 7) % 92,
    size: `${0.85 + (i % 4) * 0.35}rem`,
    duration: 12 + (i % 5) * 2,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {items.map((n) => (
        <Note key={n.id} delay={n.delay} x={n.x} size={n.size} duration={n.duration} />
      ))}
    </div>
  );
}
