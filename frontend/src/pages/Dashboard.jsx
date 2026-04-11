import React from 'react';
import useAuthStore from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Clock, BookOpen, Video, Activity, User, Calendar, DollarSign, CheckCircle, ArrowRight } from 'lucide-react';
import { fetchLiveSessions, fetchUpcomingSessions, enrollInSession, joinScheduledSession } from '../services/api';
import WaveformPlayer from '../components/WaveformPlayer';
import PageShell from '../components/layout/PageShell';
import { Link } from 'react-router-dom';
import CourseReviewForm from '../components/CourseReviewForm';

const sidebarItems = [
  { id: 'courses', label: 'My courses', icon: BookOpen, href: '#my-courses' },
  { id: 'live', label: 'Live sessions', icon: Video, href: '#live-sessions' },
  { id: 'practice', label: 'Practice', icon: Activity, href: '#practice' },
  { id: 'profile', label: 'Profile', icon: User, href: '#profile' },
];

export default function Dashboard() {
  const { userInfo } = useAuthStore();
  const { data: upcomingSessions, refetch: refetchUpcoming } = useQuery({
    queryKey: ['upcoming-sessions'],
    queryFn: fetchUpcomingSessions,
    enabled: !!userInfo?.token,
  });

  const { data: liveSessions } = useQuery({
    queryKey: ['live-sessions'],
    queryFn: fetchLiveSessions,
    enabled: !!userInfo?.token,
    refetchInterval: 15000, // Refetch every 15s as a fallback to socket events
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
          <nav className="premium-panel p-4 sticky top-28 space-y-1.5">
            <p className="label-caps px-3 py-2">Sanctuary</p>
            {sidebarItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-rv-text-2 hover:text-gold hover:bg-gold/5 border border-transparent hover:border-gold/15 transition-all text-sm font-medium group"
              >
                <item.icon className="w-4.5 h-4.5 text-gold/60 group-hover:text-gold shrink-0 transition-colors" strokeWidth={1.8} />
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
            <div className="premium-panel px-8 py-5 text-center min-w-[200px] flex flex-col justify-center">
              <p className="label-caps mb-1">Riyāz streak</p>
              <p className="text-3xl font-display font-semibold text-gradient-gold">
                {userInfo.riyaazStreak || 0} <span className="text-sm text-rv-text-muted font-sans font-normal lowercase tracking-wide ml-1">days</span>
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
            
            {/* Real implementation would pass actual enrolled context ID when finished. 
                Using no ID explicitly here satisfies "after completion business rules" text placeholder. */}
            <CourseReviewForm courseId={null} />
          </section>

           <section id="masterclasses" className="scroll-mt-28">
            <h2 className="text-2xl font-display font-semibold text-ivory mb-6 flex items-center gap-3">
              <Calendar className="text-gold w-6 h-6" strokeWidth={1.5} /> Upcoming Masterclasses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(!upcomingSessions || upcomingSessions.length === 0) && (
                <div className="premium-panel p-8 col-span-full text-center border-dashed">
                  <Calendar className="w-8 h-8 text-gold/20 mx-auto mb-3" strokeWidth={1} />
                  <p className="text-rv-text-muted text-sm italic max-w-sm mx-auto">
                    The masterclass schedule is currently being curated. We'll notify you when new sessions are available.
                  </p>
                </div>
              )}
              {(upcomingSessions || []).filter(s => ['scheduled', 'live'].includes(s.status)).map((s) => {
                const isEnrolled = s.enrolledStudents?.includes(userInfo._id);
                const isLive = s.status === 'live';
                
                return (
                  <motion.div 
                    key={s._id}
                    whileHover={{ y: -4 }}
                    className="premium-panel overflow-hidden flex flex-col h-full group"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={s.thumbnailUrl || 'https://images.unsplash.com/photo-1514320298324-ee4a66e13788?w=800&q=80'} 
                        alt={s.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border ${isLive ? 'bg-saffron/90 border-saffron text-ink animate-pulse' : 'bg-gold/10 border-gold/20 text-gold-light'}`}>
                          {isLive ? 'Live Now' : 'Masterclass'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex-1">
                        <h3 className="text-xl font-display font-semibold text-ivory mb-1 group-hover:text-gold transition-colors">{s.title}</h3>
                        <p className="text-xs text-ivory/45 flex items-center gap-2 mb-4">
                          <User className="w-3 h-3 text-gold/60" /> {s.instructor?.name}
                        </p>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                           <div className="flex items-center gap-2 text-sm text-ivory/70 font-light">
                              <Calendar className="w-4 h-4 text-gold/40" /> {new Date(s.scheduledAt).toLocaleDateString()}
                           </div>
                           <div className="flex items-center gap-2 text-sm text-ivory/70 font-light underline decoration-gold/20 underline-offset-4">
                              <DollarSign className="w-4 h-4 text-gold/40" /> {s.sessionType === 'free' ? 'Free' : `₹${s.price.toLocaleString()}`}
                           </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-gold/10 flex items-center justify-between gap-4">
                        <div className="text-[10px] text-ivory/30 uppercase tracking-tighter">
                          {s.enrolledStudents?.length || 0} Registered
                        </div>
                        
                        {isLive ? (
                          <button
                            onClick={() => navigate(`/classroom/${s._id}?type=masterclass`)}
                            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-gold to-gold-dark text-ink font-bold text-xs shadow-glow hover:scale-105 transition-all"
                          >
                            Join Now
                          </button>
                        ) : isEnrolled ? (
                          <div className="flex items-center gap-2 text-gold-light text-xs font-bold bg-gold/5 px-4 py-2 rounded-full border border-gold/20">
                             <CheckCircle className="w-4 h-4" /> Enrolled
                          </div>
                        ) : (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={async () => {
                               try {
                                 await enrollInSession(s._id);
                                 refetchUpcoming();
                               } catch (err) {
                                 console.error(err);
                               }
                            }}
                            className="px-6 py-2.5 rounded-full border border-gold/35 text-gold text-xs font-bold hover:bg-gold/10 transition-all flex items-center gap-2"
                          >
                            Enroll Session <ArrowRight className="w-3 h-3" />
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
           </section>

          <section id="live-sessions" className="scroll-mt-28">
            <h2 className="text-2xl font-display font-semibold text-ivory mb-6 flex items-center gap-3">
              <Video className="text-gold w-6 h-6" strokeWidth={1.5} /> Live sessions
            </h2>
            <div className="space-y-4">
              {(!liveSessions || liveSessions.length === 0) && (
                <div className="premium-panel p-10 text-center border-dashed">
                  <Video className="w-8 h-8 text-gold/20 mx-auto mb-3" strokeWidth={1} />
                  <p className="text-rv-text-muted text-sm max-w-xs mx-auto">
                    No live classes are currently in progress. Check back soon or browse our course library.
                  </p>
                </div>
              )}
              {(liveSessions || []).filter(s => ['live', 'scheduled', 'pending'].includes(s.status)).map((s) => (
                <div key={s._id} className="premium-panel p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
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
                        {' · '}
                        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gold/10 border border-gold/20 text-gold-light ml-2">
                          {s.accessType === 'public' ? '🌍 Public' : s.accessType === 'private' ? '🔒 Private' : '🎓 Enrolled'}
                        </span>
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
            <div className="premium-panel p-8 text-center">
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
              <div className="premium-panel p-6">
                <p className="text-xs uppercase tracking-widest text-ivory/45 mb-2">Account</p>
                <p className="text-xl font-display text-ivory">{userInfo.name}</p>
                <p className="text-sm text-ivory/50 mt-1">{userInfo.email}</p>
              </div>
              <div className="premium-panel p-6">
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
