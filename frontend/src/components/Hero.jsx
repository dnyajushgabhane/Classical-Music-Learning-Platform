import { motion } from 'framer-motion';
import FloatingNotes from './effects/FloatingNotes';
import SoundWaveBackdrop from './effects/SoundWaveBackdrop';
import { PremiumButton } from './PremiumButton';

export default function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center px-4 sm:px-6 overflow-hidden pt-24 pb-32">
      <div className="absolute inset-0 bg-gradient-radial-hero" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -12deg,
            transparent,
            transparent 40px,
            rgba(212, 175, 55, 0.15) 40px,
            rgba(212, 175, 55, 0.15) 41px
          )`,
        }}
      />
      <SoundWaveBackdrop className="pb-[18%]" />
      <FloatingNotes count={14} />

      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.5 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
        className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[min(90vw,720px)] h-[min(90vw,720px)] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.18) 0%, rgba(59, 10, 10, 0.25) 45%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-xs sm:text-sm uppercase tracking-[0.35em] text-gold/80 mb-8 font-medium"
        >
          Gurukul · Mehfil · Riyaaz
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="font-display font-semibold text-display-xl text-ivory mb-8"
        >
          Master the Art of{' '}
          <span className="text-gradient-gold block sm:inline mt-2 sm:mt-0">Indian Classical Music</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.65 }}
          className="text-lg sm:text-xl text-ivory/65 max-w-2xl mx-auto leading-relaxed font-light mb-12"
        >
            A sanctuary for serious learners — curated pathways through ragas, lay, and the living tradition of the gharanas.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-16"
        >
          <PremiumButton to="/courses" variant="primary">
            Start Learning
          </PremiumButton>
          <PremiumButton to="/courses" variant="outline">
            Explore Ragas
          </PremiumButton>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="flex flex-col items-center gap-2 text-ivory/65 pointer-events-none"
        >
          <span className="text-xs uppercase tracking-[0.3em]">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-px h-10 bg-gradient-to-b from-gold/60 to-transparent rounded-full"
          />
        </motion.div>
      </div>
    </section>
  );
}
