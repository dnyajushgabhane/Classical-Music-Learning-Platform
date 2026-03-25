import React from 'react';
import useAuthStore from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Clock, BookOpen, Video, Activity, User } from 'lucide-react';
import { fetchLiveSessions } from '../services/api';
import WaveformPlayer from '../components/WaveformPlayer';
import PageShell from '../components/layout/PageShell';
import { Link } from 'react-router-dom';

const sidebarItems = [
  { id: 'courses', label: 'My courses', icon: BookOpen, href: '#my-courses' },
  { id: 'live', label: 'Live sessions', icon: Video, href: '#live-sessions' },
  { id: 'practice', label: 'Practice', icon: Activity, href: '#practice' },
  { id: 'profile', label: 'Profile', icon: User, href: '#profile' },
];

export default function Dashboard() {
  const { userInfo } = useAuthStore();
  const { data: liveSessions } = useQuery({
    queryKey: ['live-sessions'],
    queryFn: fetchLiveSessions,
    enabled: !!userInfo?.token,
  });

  if (!userInfo) {
    return (
      <PageShell>
        <p className="text-center mt-20 text-gold text-2xl font-display">Please sign in to open your dashboard.</p>
      </PageShell>
    );
  }

  return (
    <PageShell className="!max-w-[1400px]">
      <div className="flex flex-col lg:flex-row gap-12">
        <motion.aside
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:w-56 shrink-0"
        >
          <nav className="glass-panel rounded-2xl p-4 border-gold/15 sticky top-28 space-y-1">
            <p className="text-[10px] uppercase tracking-[0.25em] text-ivory/40 px-3 py-2">Sanctuary</p>
            {sidebarItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-ivory/70 hover:text-gold hover:bg-gold/5 border border-transparent hover:border-gold/15 transition-all text-sm font-medium"
              >
                <item.icon className="w-5 h-5 text-gold/80 shrink-0" strokeWidth={1.5} />
                {item.label}
              </a>
            ))}
            <div className="pt-4 mt-4 border-t border-gold/10 px-3">
              <Link to="/courses" className="text-xs text-gold/80 link-underline-gold uppercase tracking-widest">
                Browse courses
              </Link>
            </div>
          </nav>
        </motion.aside>

        <div className="flex-1 space-y-12 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-semibold text-ivory">
                Welcome, <span className="text-gradient-gold">{userInfo.name}</span>
              </h1>
              <p className="text-ivory/50 mt-2 text-lg font-light">Your riyāz awaits — quiet, focused, royal.</p>
            </div>
            <div className="music-sheet-card rounded-2xl px-8 py-5 text-center min-w-[200px]">
              <p className="text-[10px] text-ivory/45 uppercase tracking-[0.2em] font-semibold mb-1">
                Riyāz streak
              </p>
              <p className="text-3xl font-display font-semibold text-gradient-gold">
                {userInfo.riyaazStreak || 0} <span className="text-lg text-ivory/60 font-sans font-normal">days</span>
              </p>
            </div>
          </div>

          <section id="my-courses" className="scroll-mt-28">
            <h2 className="text-2xl font-display font-semibold text-ivory mb-6 flex items-center gap-3">
              <BookOpen className="text-gold w-6 h-6" strokeWidth={1.5} /> My courses
            </h2>
            <WaveformPlayer
              url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
              title="Lesson 3: Vistar & taan — Raag Malkauns"
              artist="Pt. Jasraj Academy"
            />
          </section>

          <section id="live-sessions" className="scroll-mt-28">
            <h2 className="text-2xl font-display font-semibold text-ivory mb-6 flex items-center gap-3">
              <Video className="text-gold w-6 h-6" strokeWidth={1.5} /> Live sessions
            </h2>
            <div className="space-y-4">
              {(!liveSessions || liveSessions.length === 0) && (
                <p className="text-ivory/45 text-sm">No upcoming or live classes on the schedule.</p>
              )}
              {(liveSessions || []).map((s) => (
                <div key={s._id} className="music-sheet-card rounded-2xl p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                  <div className="flex gap-4 items-center min-w-0">
                    <div className="p-3 rounded-xl bg-gold/10 border border-gold/20 text-gold shrink-0">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg text-ivory truncate">{s.title}</h3>
                      <p className="text-sm text-ivory/50">
                        {s.teacher?.name} ·{' '}
                        <span className={s.status === 'live' ? 'text-saffron font-semibold' : ''}>
                          {s.status === 'live' ? 'LIVE NOW' : 'Scheduled'}
                        </span>
                        {s.scheduledStart && ` · ${new Date(s.scheduledStart).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/classroom/${s._id}`}
                    className={`text-center rounded-full font-semibold px-8 py-3 text-sm shrink-0 ${
                      s.status === 'live'
                        ? 'bg-gradient-to-r from-gold to-gold-dark text-ink shadow-glow-sm'
                        : 'border border-gold/35 text-gold hover:bg-gold/10'
                    }`}
                  >
                    {s.status === 'live' ? 'Join class' : 'Open lobby'}
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <section id="practice" className="scroll-mt-28">
            <h2 className="text-2xl font-display font-semibold text-ivory mb-6 flex items-center gap-3">
              <Activity className="text-gold w-6 h-6" strokeWidth={1.5} /> Practice
            </h2>
            <div className="music-sheet-card rounded-2xl p-8 text-center">
              <p className="text-ivory/55 mb-6 max-w-md mx-auto">
                Digital tanpura, metronome, and riyāz room live in the dedicated practice space.
              </p>
              <Link
                to="/practice"
                className="inline-flex rounded-full border border-gold/40 px-8 py-3 text-sm font-semibold text-gold hover:bg-gold/10 transition-colors"
              >
                Open practice room
              </Link>
            </div>
          </section>

          <section id="profile" className="scroll-mt-28 pb-8">
            <h2 className="text-2xl font-display font-semibold text-ivory mb-6 flex items-center gap-3">
              <User className="text-gold w-6 h-6" strokeWidth={1.5} /> Profile
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="music-sheet-card rounded-2xl p-6">
                <p className="text-xs uppercase tracking-widest text-ivory/45 mb-2">Account</p>
                <p className="text-xl font-display text-ivory">{userInfo.name}</p>
                <p className="text-sm text-ivory/50 mt-1">{userInfo.email}</p>
              </div>
              <div className="music-sheet-card rounded-2xl p-6">
                <h3 className="text-lg font-display font-semibold text-ivory mb-4 flex items-center gap-2">
                  <Trophy className="text-gold w-5 h-5" /> Achievements
                </h3>
                <div className="flex gap-8">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gold/15 flex items-center justify-center border border-gold/35 mx-auto mb-2 text-xl shadow-glow-sm">
                      ✨
                    </div>
                    <p className="text-xs text-ivory/60">First riyāz</p>
                  </div>
                  <div className="text-center opacity-45 grayscale">
                    <div className="w-16 h-16 rounded-full bg-ivory/5 flex items-center justify-center mx-auto mb-2 text-xl border border-gold/10">
                      🏆
                    </div>
                    <p className="text-xs text-ivory/40">7-day streak</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
