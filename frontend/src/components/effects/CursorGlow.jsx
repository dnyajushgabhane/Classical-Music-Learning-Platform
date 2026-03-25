import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CursorGlow() {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 280, damping: 28 });
  const sy = useSpring(y, { stiffness: 280, damping: 28 });

  useEffect(() => {
    const onMove = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] hidden md:block"
      style={{ mixBlendMode: 'screen' }}
    >
      <motion.div
        className="absolute h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.09]"
        style={{
          left: sx,
          top: sy,
          background: 'radial-gradient(circle, rgba(212,175,55,0.55) 0%, rgba(184,115,51,0.2) 35%, transparent 70%)',
          filter: 'blur(28px)',
        }}
      />
    </motion.div>
  );
}
