import React, { useState } from 'react';
import useAuthStore from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { fetchCourses, createLiveSession } from '../services/api';
import { motion } from 'framer-motion';
import { Plus, Users, BookOpen, TrendingUp, DollarSign, Edit, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';

const InstructorDashboard = () => {
  const { userInfo } = useAuthStore();
  const navigate = useNavigate();
  const [liveTitle, setLiveTitle] = useState('');
  const [liveCourse, setLiveCourse] = useState('');
  const [liveStart, setLiveStart] = useState('');

  const { data: courses, isLoading } = useQuery({
    queryKey: ['instructor-courses', userInfo._id],
    queryFn: () => fetchCourses({ instructor: userInfo._id }),
    enabled: !!userInfo?._id,
  });

  if (!userInfo || userInfo.role !== 'Instructor') {
    return (
      <PageShell>
        <p className="text-center mt-20 text-gold text-2xl font-display">Access denied. Instructors only.</p>
      </PageShell>
    );
  }

  const stats = [
    { label: 'Total students', value: '1,240', icon: Users, color: 'text-copper' },
    { label: 'Active courses', value: courses?.length || 0, icon: BookOpen, color: 'text-gold' },
    { label: 'Course rating', value: '4.9', icon: TrendingUp, color: 'text-saffron' },
    { label: 'Revenue', value: '₹45,200', icon: DollarSign, color: 'text-gold-light' },
  ];

  return (
    <PageShell>
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold/70 mb-3">Faculty</p>
          <h1 className="font-display text-display-lg font-semibold text-ivory">
            Instructor <span className="text-gradient-gold">panel</span>
          </h1>
          <p className="text-ivory/50 mt-2 text-lg font-light">Curate syllabi with the clarity of a manuscript.</p>
        </div>
        <div className="flex flex-col sm:items-end gap-3">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r from-gold to-gold-dark text-ink font-bold py-3 px-6 rounded-xl shadow-glow flex items-center gap-2 w-fit"
          >
            <Plus className="w-5 h-5" /> New masterclass
          </motion.button>
        </div>
      </div>

      <section className="music-sheet-card rounded-2xl p-6 border-gold/20 mb-10">
        <h2 className="text-lg font-display font-semibold text-ivory mb-4 flex items-center gap-2">
          <Radio className="w-5 h-5 text-gold" /> Live gurukul
        </h2>
        <p className="text-sm text-ivory/50 mb-4">
          Schedule a session, then open the classroom. Students join via SFU (LiveKit) — scalable video, screen share,
          and host controls.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            value={liveTitle}
            onChange={(e) => setLiveTitle(e.target.value)}
            placeholder="Session title (e.g. Raag Yaman — Vistar)"
            className="w-full bg-ink/50 border border-gold/15 rounded-xl px-4 py-3 text-ivory text-sm"
          />
          <input
            type="datetime-local"
            value={liveStart}
            onChange={(e) => setLiveStart(e.target.value)}
            className="w-full bg-ink/50 border border-gold/15 rounded-xl px-4 py-3 text-ivory text-sm"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <select
            value={liveCourse}
            onChange={(e) => setLiveCourse(e.target.value)}
            className="w-full sm:w-64 bg-ink/50 border border-gold/15 rounded-xl px-3 py-2 text-sm text-ivory"
          >
            <option value="">Open session (any enrolled / no course lock)</option>
            {(courses || []).map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            disabled={!liveTitle.trim()}
            onClick={async () => {
              const s = await createLiveSession({
                title: liveTitle.trim(),
                scheduledStart: liveStart ? new Date(liveStart).toISOString() : null,
                course: liveCourse || null,
              });
              navigate(`/classroom/${s._id}`);
            }}
            className="rounded-full bg-gradient-to-r from-gold to-gold-dark text-ink font-semibold px-6 py-2.5 text-sm disabled:opacity-40"
          >
            Create & open classroom
          </motion.button>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            key={stat.label}
            className="music-sheet-card p-6 rounded-2xl border-gold/15"
          >
            <div className={`w-11 h-11 rounded-xl bg-gold/5 border border-gold/15 flex items-center justify-center mb-4 ${stat.color}`}>
              <stat.icon className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <p className="text-[10px] text-ivory/40 uppercase tracking-widest font-semibold">{stat.label}</p>
            <p className="text-3xl font-display font-semibold text-ivory mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-display font-semibold text-ivory">Your courses</h2>
          {isLoading ? (
            <p className="text-gold animate-pulse">Loading…</p>
          ) : (
            <div className="space-y-4">
              {courses?.map((course) => (
                <div
                  key={course._id}
                  className="music-sheet-card p-5 rounded-2xl flex items-center gap-6 border-gold/10 hover:border-gold/25 transition-colors"
                >
                  <img
                    src={course.thumbnail || 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=200&q=80'}
                    alt=""
                    className="w-24 h-24 rounded-xl object-cover border border-gold/15"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-display font-semibold text-ivory truncate">{course.title}</h3>
                    <p className="text-sm text-ivory/45">
                      {course.instrument} · {course.level}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs bg-gold/15 text-gold px-2.5 py-1 rounded-lg border border-gold/20">
                        ₹{course.price}
                      </span>
                      <span className="text-xs text-ivory/40">{course.lessons?.length || 0} lessons</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="p-3 rounded-xl bg-ink/60 border border-gold/15 text-ivory/50 hover:text-gold hover:border-gold/30 transition-all shrink-0"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {courses?.length === 0 && (
                <div className="music-sheet-card p-10 rounded-2xl text-center border border-dashed border-gold/20">
                  <p className="text-ivory/45 mb-4">You have not published a masterclass yet.</p>
                  <button type="button" className="text-gold font-semibold link-underline-gold">
                    Launch your first course →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-8">
          <section className="glass-panel p-6 rounded-2xl border-gold/15">
            <h2 className="text-xl font-display font-semibold text-ivory mb-6 pb-4 border-b border-gold/10">
              Recent inquiries
            </h2>
            <div className="space-y-4">
              {[
                { name: 'Arjun M.', msg: 'Regarding Yaman taan…', time: '2m ago' },
                { name: 'Sita R.', msg: 'Bhairav vistar doubt', time: '1h ago' },
              ].map((inquiry, i) => (
                <div key={i} className="p-3 hover:bg-gold/5 rounded-xl transition-colors cursor-pointer group border border-transparent hover:border-gold/10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm text-ivory group-hover:text-gold transition-colors">
                      {inquiry.name}
                    </span>
                    <span className="text-[10px] text-ivory/35">{inquiry.time}</span>
                  </div>
                  <p className="text-xs text-ivory/45 line-clamp-1">{inquiry.msg}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel p-6 rounded-2xl border-gold/25 bg-maroon/20">
            <h2 className="text-xl font-display font-semibold text-gold mb-3">Partner support</h2>
            <p className="text-sm text-ivory/55 mb-6 leading-relaxed">
              Audio mastering, curriculum design, and payout questions — we respond like a stage manager before opening
              night.
            </p>
            <button
              type="button"
              className="w-full bg-gold/15 text-gold border border-gold/30 py-3 rounded-xl font-semibold hover:bg-gold/20 transition-all"
            >
              Contact partner manager
            </button>
          </section>
        </div>
      </div>
    </PageShell>
  );
};

export default InstructorDashboard;
