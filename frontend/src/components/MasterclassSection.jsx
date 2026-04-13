import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const VIDEO_ID = 'Yn4R4endnC4';
const THUMBNAIL = `https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`;
const THUMBNAIL_FALLBACK = `https://img.youtube.com/vi/${VIDEO_ID}/hqdefault.jpg`;
const EMBED_URL = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&color=white`;

export default function MasterclassSection() {
  const [open, setOpen] = useState(false);
  const [thumbSrc, setThumbSrc] = useState(THUMBNAIL);

  // Close modal on Escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setOpen(false);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleKeyDown]);

  return (
    <>
      {/* ─── Section ─────────────────────────────────────────────── */}
      <section className="relative w-full py-24 md:py-32 overflow-hidden">

        {/* Ambient background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 50% 0%, rgba(212,175,55,0.07) 0%, transparent 60%),
              radial-gradient(ellipse 50% 40% at 20% 100%, rgba(184,115,51,0.05) 0%, transparent 55%)
            `,
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">

          {/* ── Header ── */}
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* eyebrow */}
            <div className="inline-flex items-center gap-2 mb-5">
              <Sparkles
                className="text-gold/80"
                size={13}
                strokeWidth={1.5}
              />
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.28em]"
                style={{ color: 'var(--text-accent)' }}
              >
                Exclusive Masterclass
              </span>
              <Sparkles
                className="text-gold/80"
                size={13}
                strokeWidth={1.5}
              />
            </div>

            <h2
              className="font-display font-semibold mb-5"
              style={{
                fontSize: 'clamp(2rem, 4.5vw, 3.25rem)',
                lineHeight: 1.08,
                color: 'var(--text-primary)',
              }}
            >
              Experience the artistry of{' '}
              <span className="text-gradient-gold">timeless</span>{' '}
              classical expression.
            </h2>

            <p
              className="text-base md:text-lg font-light leading-relaxed max-w-xl mx-auto"
              style={{
                color: 'var(--text-muted)',
                letterSpacing: '0.01em',
              }}
            >
              A curated window into the soul of classical music — brought to
              you by a maestro who breathes every phrase.
            </p>
          </motion.div>

          {/* ── Video Card ── */}
          <motion.div
            className="relative mx-auto"
            style={{ maxWidth: 780 }}
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Card */}
            <motion.button
              id="masterclass-play-btn"
              type="button"
              aria-label="Play masterclass video"
              onClick={() => setOpen(true)}
              className="group relative w-full overflow-hidden focus:outline-none"
              style={{
                borderRadius: 22,
                boxShadow: `
                  0 24px 64px -8px rgba(0,0,0,0.55),
                  0 0 0 1px rgba(212,175,55,0.18),
                  0 0 80px -20px rgba(212,175,55,0.12)
                `,
              }}
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.985 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Thumbnail image */}
              <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                <img
                  src={thumbSrc}
                  alt="Classical Music Masterclass — YouTube thumbnail"
                  onError={() => setThumbSrc(THUMBNAIL_FALLBACK)}
                  className="w-full h-full object-cover"
                  style={{ borderRadius: 22 }}
                  loading="lazy"
                />

                {/* Glassmorphism top strip */}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-28 pointer-events-none"
                  style={{
                    borderRadius: '22px 22px 0 0',
                    background:
                      'linear-gradient(to bottom, rgba(15,8,4,0.55) 0%, transparent 100%)',
                  }}
                />

                {/* Bottom gradient overlay with label */}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 pointer-events-none"
                  style={{
                    borderRadius: '0 0 22px 22px',
                    padding: '0 0 22px 24px',
                    background:
                      'linear-gradient(to top, rgba(10,6,4,0.88) 0%, rgba(10,6,4,0.55) 40%, transparent 100%)',
                  }}
                >
                  <p className="font-display text-ivory/90 font-medium text-left"
                    style={{ fontSize: 'clamp(1rem, 2.5vw, 1.4rem)', letterSpacing: '-0.01em' }}>
                    Classical Raga Unveiled
                  </p>
                  <p className="text-ivory/50 text-xs tracking-[0.14em] uppercase mt-1 text-left">
                    Curated Masterclass · 38 min
                  </p>
                </div>

                {/* Glassmorphism shimmer over card */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    borderRadius: 22,
                    background:
                      'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, transparent 50%, rgba(212,175,55,0.04) 100%)',
                  }}
                />

                {/* ── Center Play Button ── */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {/* Pulse ring 1 */}
                  <motion.div
                    aria-hidden="true"
                    className="absolute rounded-full"
                    style={{
                      width: 92,
                      height: 92,
                      border: '1.5px solid rgba(212,175,55,0.35)',
                    }}
                    animate={{ scale: [1, 1.55], opacity: [0.5, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                  />
                  {/* Pulse ring 2 */}
                  <motion.div
                    aria-hidden="true"
                    className="absolute rounded-full"
                    style={{
                      width: 92,
                      height: 92,
                      border: '1.5px solid rgba(212,175,55,0.2)',
                    }}
                    animate={{ scale: [1, 1.85], opacity: [0.35, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                  />

                  {/* Play disc */}
                  <motion.div
                    className="relative flex items-center justify-center rounded-full"
                    style={{
                      width: 72,
                      height: 72,
                      background: 'rgba(255,255,255,0.12)',
                      backdropFilter: 'blur(14px)',
                      WebkitBackdropFilter: 'blur(14px)',
                      border: '1.5px solid rgba(255,255,255,0.25)',
                      boxShadow: `
                        0 8px 32px rgba(0,0,0,0.45),
                        0 0 0 1px rgba(212,175,55,0.3),
                        0 0 24px rgba(212,175,55,0.2)
                      `,
                    }}
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Play
                      className="text-ivory"
                      size={26}
                      strokeWidth={0}
                      fill="currentColor"
                      style={{ marginLeft: 3 }}
                    />
                  </motion.div>
                </div>
              </div>
            </motion.button>

            {/* ── Below-card row ── */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-7 px-1"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {/* Tag badge */}
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.18em]"
                style={{
                  background: 'rgba(212,175,55,0.09)',
                  border: '1px solid rgba(212,175,55,0.22)',
                  color: 'var(--text-accent)',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: 'var(--text-accent)' }}
                />
                Curated Masterclass
              </div>

              {/* CTA */}
              <Link
                to="/courses"
                id="masterclass-explore-cta"
                className="group/link inline-flex items-center gap-2 text-sm font-medium link-underline-gold"
                style={{ color: 'var(--text-primary)' }}
              >
                Explore More Sessions
                <ArrowRight
                  size={15}
                  className="transition-transform duration-200 group-hover/link:translate-x-1"
                />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="masterclass-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Masterclass video player"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'rgba(8,5,3,0.88)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
              }}
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Video container */}
            <motion.div
              className="relative w-full z-10"
              style={{
                maxWidth: 960,
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: `
                  0 40px 80px -16px rgba(0,0,0,0.85),
                  0 0 0 1px rgba(212,175,55,0.2)
                `,
              }}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Close button */}
              <button
                type="button"
                id="masterclass-modal-close"
                aria-label="Close video"
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 z-20 flex items-center justify-center rounded-full transition-all duration-200"
                style={{
                  width: 38,
                  height: 38,
                  background: 'rgba(15,10,6,0.8)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#F8F1E9',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(212,175,55,0.25)';
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(15,10,6,0.8)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                }}
              >
                <X size={17} strokeWidth={2} />
              </button>

              {/* YouTube iframe */}
              <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                <iframe
                  src={EMBED_URL}
                  title="Classical Music Masterclass"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
