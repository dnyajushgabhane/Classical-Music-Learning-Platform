import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchMasterclasses } from '../services/api';

export default function MasterclassSection() {
  const [open, setOpen] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState(null);

  const { data: masterclasses, isLoading } = useQuery({
    queryKey: ['masterclasses'],
    queryFn: fetchMasterclasses,
    staleTime: 60000,
  });

  const displayMasterclasses = masterclasses && masterclasses.length > 0 ? masterclasses : [];

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

  const handlePlay = (id) => {
    setActiveVideoId(id);
    setOpen(true);
  };

  return (
    <>
      {/* ─── Section ─────────────────────────────────────────────── */}
      <section className="relative w-full py-20 overflow-hidden">

        {/* Ambient background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 50% 0%, rgba(212,175,55,0.05) 0%, transparent 60%)
            `,
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">

          {/* ── Header ── */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <Sparkles className="text-gold/80" size={13} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-safe">
                Premium Curriculum
              </span>
              <Sparkles className="text-gold/80" size={13} />
            </div>

            <h2 className="font-display text-3xl md:text-4xl font-semibold text-ivory mb-4">
              Featured <span className="text-gradient-gold">Masterclasses</span>
            </h2>
          </motion.div>

          {/* ── Video Cards Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {isLoading ? (
              [...Array(2)].map((_, i) => (
                <div key={i} className="aspect-video premium-panel skeleton-shimmer opacity-30" />
              ))
            ) : displayMasterclasses.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-ivory/40 italic">No masterclasses available yet.</p>
              </div>
            ) : (
              displayMasterclasses.map((mc, idx) => (
                <motion.div
                  key={mc._id || mc.videoId}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: idx * 0.15 }}
                  className="flex flex-col"
                >
                  {/* Card */}
                  <motion.button
                    type="button"
                    aria-label={`Play ${mc.title}`}
                    onClick={() => handlePlay(mc.videoId)}
                    className="group relative w-full overflow-hidden focus:outline-none premium-panel aspect-video"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.985 }}
                  >
                    <img
                      src={mc.thumbnail || `https://img.youtube.com/vi/${mc.videoId}/maxresdefault.jpg`}
                      alt={mc.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = `https://img.youtube.com/vi/${mc.videoId}/hqdefault.jpg`;
                      }}
                    />

                    {/* Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    
                    {/* Info */}
                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 text-left">
                      <p className="font-display text-ivory/90 font-medium text-lg leading-snug">
                        {mc.title}
                      </p>
                      <p className="text-ivory/50 text-xs tracking-widest uppercase mt-1.5">
                        {mc.subtitle || 'Premium Masterclass'}
                      </p>
                    </div>

                    {/* Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 flex items-center justify-center rounded-full bg-ivory/10 backdrop-blur-md border border-ivory/30 group-hover:scale-110 transition-transform duration-300 shadow-glow-sm">
                        <Play className="text-ivory ml-1" size={20} fill="currentColor" />
                      </div>
                    </div>
                  </motion.button>

                  {/* Tag & Link */}
                  <div className="flex items-center justify-between mt-4 px-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gold/80 px-3 py-1 rounded-full border border-gold/20 bg-gold/5">
                      {mc.tag || 'Masterclass'}
                    </div>
                    <Link
                      to="/courses"
                      className="group/link inline-flex items-center gap-2 text-xs font-medium text-ivory/70 hover:text-gold transition-colors"
                    >
                      Watch Now
                      <ArrowRight size={12} className="transition-transform group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </motion.div>
              ))
            )}
          </div>
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
                  src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0&modestbranding=1&color=white`}
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
