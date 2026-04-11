import React from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, Award, Users, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import PageShell from '../components/layout/PageShell';

const features = [
  { icon: PlayCircle, title: 'Masterclasses', desc: 'Cinematic lessons with maestros — every phrase, every bol.' },
  { icon: Users, title: 'Live gurukul', desc: 'Intimate cohorts with real-time guidance, as in a royal mehfil.' },
  { icon: BookOpen, title: 'Rāgā encyclopædia', desc: 'Theory that breathes: that, chalan, and the soul of each raga.' },
  { icon: Award, title: 'Riyāz rituals', desc: 'Structured practice with streaks that honour discipline.' },
];

export default function Home() {
  return (
    <div className="w-full">
      <Hero />

      <PageShell>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-gold/70 mb-4">The experience</p>
          <h2 className="font-display text-display-lg font-semibold text-ivory mb-6">
            Designed for those who hear the <span className="text-gradient-gold">tanpura</span> in silence.
          </h2>
          <p className="text-ivory/55 text-lg font-light leading-relaxed">
            No clutter. Only craft. Your path is curated like a manuscript — each module a new line on the staff.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.55 }}
              whileHover={{ y: -6 }}
              className="group relative premium-panel p-8 flex flex-col items-center text-center overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-gold/5 via-transparent to-copper/5 pointer-events-none" />
              <feature.icon className="text-gold w-11 h-11 mb-6 relative z-10" strokeWidth={1.25} />
              <h3 className="text-xl font-display font-semibold text-ivory mb-3 relative z-10">{feature.title}</h3>
              <p className="text-ivory/50 text-sm leading-relaxed relative z-10">{feature.desc}</p>
              <Link
                to={idx === 0 ? '/courses' : idx === 1 ? '/events' : idx === 2 ? '/courses' : '/practice'}
                className="mt-6 text-xs uppercase tracking-widest text-gold/80 link-underline-gold relative z-10"
              >
                Discover
              </Link>
            </motion.div>
          ))}
        </div>
      </PageShell>
    </div>
  );
}
