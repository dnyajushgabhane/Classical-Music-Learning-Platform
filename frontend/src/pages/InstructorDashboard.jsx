import React, { useState, useMemo } from 'react';
import useAuthStore from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, BookOpen, TrendingUp, DollarSign, Edit, Radio, Star, MessageSquare, Calendar, Activity, ReceiptText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import { 
  fetchCourseRatingSummary, 
  fetchCourses, 
  createLiveSession, 
  fetchInstructorSessions,
  fetchInstructorDashboardStats,
  fetchStudentAnalytics,
  fetchRevenueAnalytics,
  fetchActivityFeed,
  fetchRevenueDetails
} from '../services/api';
import CourseUploadModal from '../components/CourseUploadModal';
import CourseReviewsModal from '../components/CourseReviewsModal';
import ScheduleMasterclassModal from '../components/ScheduleMasterclassModal';
import ActivityFeed from '../components/instructor/ActivityFeed';
import TrendChart from '../components/instructor/TrendChart';
import RevenueLedger from '../components/instructor/RevenueLedger';

const InstructorDashboard = () => {
  const { userInfo } = useAuthStore();
  const navigate = useNavigate();
  const [liveTitle, setLiveTitle] = useState('');
  const [liveCourse, setLiveCourse] = useState('');
  const [liveStart, setLiveStart] = useState('');
  const [liveAccess, setLiveAccess] = useState('enrolled');
  const [invitedEmails, setInvitedEmails] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedCourseForReviews, setSelectedCourseForReviews] = useState(null);

  const { data: courses, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['instructor-courses', userInfo?._id],
    queryFn: () => fetchCourses({ instructor: userInfo._id }),
    enabled: !!userInfo?._id,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const { data: dashboardStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['instructor-dashboard-stats'],
    queryFn: fetchInstructorDashboardStats,
    enabled: !!userInfo?._id,
    staleTime: 300000, // Stats can be slightly older
    refetchOnWindowFocus: false,
  });

  const { data: studentAnalytics, isLoading: isStudentAnalyticsLoading } = useQuery({
    queryKey: ['instructor-student-analytics'],
    queryFn: fetchStudentAnalytics,
    enabled: !!userInfo?._id,
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  const { data: revenueAnalytics, isLoading: isRevenueAnalyticsLoading } = useQuery({
    queryKey: ['instructor-revenue-analytics'],
    queryFn: fetchRevenueAnalytics,
    enabled: !!userInfo?._id,
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  const { data: activityFeed, isLoading: isActivityLoading } = useQuery({
    queryKey: ['instructor-activity-feed'],
    queryFn: fetchActivityFeed,
    enabled: !!userInfo?._id,
    staleTime: 30000, // Faster refresh for activity
    refetchOnWindowFocus: false,
  });

  const { data: instructorsSessions_data, isLoading: isMSLoading } = useQuery({
    queryKey: ['instructor-sessions'],
    queryFn: fetchInstructorSessions,
    enabled: !!userInfo?._id,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const [ledgerPage, setLedgerPage] = useState(1);
  const { data: revenueDetails, isLoading: isLedgerLoading } = useQuery({
    queryKey: ['instructor-revenue-details', ledgerPage],
    queryFn: () => fetchRevenueDetails(ledgerPage),
    enabled: !!userInfo?._id,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const stats = useMemo(() => [
    { 
      label: 'Total Students', 
      value: dashboardStats?.stats?.totalStudents?.toLocaleString() || '0', 
      isLoading: isStatsLoading,
      icon: Users, 
      color: 'text-copper' 
    },
    { label: 'Active Courses', value: dashboardStats?.stats?.activeCourses || 0, icon: BookOpen, color: 'text-gold', isLoading: isStatsLoading },
    { label: 'Avg Rating', value: dashboardStats?.stats?.avgRating || '0.0', icon: Star, color: 'text-saffron', isLoading: isStatsLoading },
    { 
      label: 'Revenue', 
      value: dashboardStats?.stats?.totalRevenue ? `₹${dashboardStats.stats.totalRevenue.toLocaleString()}` : '₹0', 
      icon: DollarSign, 
      color: 'text-gold-light',
      isLoading: isStatsLoading 
    },
  ], [dashboardStats?.stats, isStatsLoading]);

  if (!userInfo || userInfo.role !== 'Instructor') {
    return (
      <PageShell>
        <p className="text-center mt-20 text-gold text-2xl font-display">Access denied. Instructors only.</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 page-enter">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold-safe mb-3">Faculty</p>
          <h1 className="font-display text-display-lg font-semibold text-ivory">
            Instructor <span className="text-gradient-gold">panel</span>
          </h1>
          <p className="text-ivory/50 mt-2 text-lg font-light">Curate syllabi with the clarity of a manuscript.</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="btn-premium bg-gold/10 text-gold font-bold py-3 px-6 border border-gold/20 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Launch Course
          </button>
          
          <button
            type="button"
            onClick={() => setIsScheduleModalOpen(true)}
            className="btn-premium bg-gradient-to-r from-gold to-gold-dark text-ink font-bold py-3 px-6 shadow-glow-sm flex items-center gap-2"
          >
            <Calendar className="w-5 h-5" /> Schedule Masterclass →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-10">
          {/* 0. Stats Cards (Relocated) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div
                key={stat.label}
                className="premium-panel p-6 cursor-default group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gold/5 border border-gold/15 flex items-center justify-center mb-4 ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <p className="text-[10px] text-ivory/40 uppercase font-bold tracking-[0.2em]">{stat.label}</p>
                {stat.isLoading ? (
                  <div className="h-9 w-24 skeleton-shimmer opacity-40 mt-2"></div>
                ) : (
                  <p className="text-3xl font-display font-bold text-ivory mt-1">{stat.value}</p>
                )}
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity pointer-events-none">
                    <stat.icon className="w-16 h-16" />
                </div>
              </div>
            ))}
          </div>

          {/* 1. Live Session Management */}
          <section className="space-y-6">
            <h2 className="text-xl font-display font-semibold text-ivory flex items-center gap-2">
               <Radio className="w-5 h-5 text-saffron" /> Live Session Management
            </h2>
            
            <div className="grid grid-cols-1 gap-6">
              {/* Gurukul Setup */}
              <div className="premium-panel p-6">
                <p className="text-xs text-gold-safe mb-4 uppercase tracking-widest font-bold">Instant Classroom</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    value={liveTitle}
                    onChange={(e) => setLiveTitle(e.target.value)}
                    placeholder="Session title (e.g. Raag Yaman — Vistar)"
                    className="w-full bg-ink/50 border border-gold/15 rounded-xl px-4 py-3 text-ivory text-sm focus:border-gold/40 outline-none transition-colors"
                  />
                  <input
                    type="datetime-local"
                    value={liveStart}
                    onChange={(e) => setLiveStart(e.target.value)}
                    className="w-full bg-ink/50 border border-gold/15 rounded-xl px-4 py-3 text-ivory text-sm focus:border-gold/40 outline-none transition-colors"
                  />
                </div>
                {liveAccess === 'private' && (
                  <div className="mb-4">
                    <input
                      value={invitedEmails}
                      onChange={(e) => setInvitedEmails(e.target.value)}
                      placeholder="Invite students by email (comma separated)"
                      className="w-full bg-ink/50 border border-gold/15 rounded-xl px-4 py-3 text-ivory text-xs italic"
                    />
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <select
                    value={liveCourse}
                    onChange={(e) => {
                      setLiveCourse(e.target.value);
                      if (e.target.value) setLiveAccess('enrolled');
                    }}
                    className="w-full sm:w-64 bg-ink/50 border border-gold/15 rounded-xl px-3 py-2.5 text-sm text-ivory outline-none focus:border-gold/40"
                  >
                    <option value="">No course lock</option>
                    {(courses || []).map((c) => (
                      <option key={c._id} value={c._id}>{c.title}</option>
                    ))}
                  </select>
                  <select
                    value={liveAccess}
                    onChange={(e) => setLiveAccess(e.target.value)}
                    className="w-full sm:w-48 bg-ink/50 border border-gold/15 rounded-xl px-3 py-2.5 text-sm text-ivory outline-none focus:border-gold/40"
                  >
                    <option value="public">🌍 Public</option>
                    <option value="enrolled">🎓 Enrolled only</option>
                    <option value="private">🔒 Private invite</option>
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
                        accessType: liveAccess,
                        invitedEmails: invitedEmails.split(',').map(e => e.trim()).filter(Boolean),
                      });
                      navigate(`/classroom/${s._id}`);
                    }}
                    className="rounded-xl bg-gradient-to-r from-gold to-gold-dark text-ink font-bold px-6 py-2.5 text-sm disabled:opacity-40 shadow-glow-sm"
                  >
                    Start Session
                  </motion.button>
                </div>
              </div>
            </div>
          </section>

          {/* 1.5 Planned Masterclasses (Separated) */}
          <section className="space-y-6">
            <h2 className="text-xl font-display font-semibold text-ivory flex items-center gap-2">
               <Calendar className="w-5 h-5 text-gold" /> Planned Masterclasses
            </h2>
            <div className="premium-panel p-6">
              <div className="space-y-3">
                {(instructorsSessions_data || []).length > 0 ? (
                  instructorsSessions_data.slice(0, 3).map(sess => (
                    <div key={sess._id} className="p-3 bg-ink/40 border border-gold/5 rounded-xl flex items-center justify-between hover:border-gold/20 transition-all group">
                       <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-1.5 rounded-full ${sess.status === 'live' ? 'bg-saffron animate-pulse shadow-glow-sm' : 'bg-gold/40'}`} />
                          <div>
                             <h4 className="text-xs font-bold text-ivory">{sess.title}</h4>
                             <p className="text-[10px] text-ivory/40 uppercase tracking-tighter">
                                {new Date(sess.scheduledAt).toLocaleDateString()} · {new Date(sess.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </p>
                          </div>
                       </div>
                       <button 
                         onClick={() => navigate(`/classroom/${sess._id}`)}
                         className="px-3 py-1 rounded bg-gold/5 text-gold text-[10px] font-bold border border-gold/10 hover:bg-gold/10 transition-all"
                       >
                         Join
                       </button>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-ivory/30 italic">No future sessions on the horizon.</p>
                )}
              </div>
            </div>
          </section>

          {/* 2. Published Curriculum (Compressed) */}
          <section className="space-y-6">
            <h2 className="text-xl font-display font-semibold text-ivory flex items-center gap-2">
               <BookOpen className="w-5 h-5 text-gold" /> Published Curriculum
            </h2>
            {isCoursesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="premium-panel h-20 skeleton-shimmer opacity-30" />
                ))}
              </div>
            ) : courses?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((course) => (
                  <div key={course._id} className="premium-panel p-4 flex items-center gap-4 cursor-default">
                    <img
                      src={course.thumbnail || 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=100&q=80'}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover border border-gold/15"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-ivory truncate">{course.title}</h3>
                      <div className="flex items-center gap-3 mt-1 opacity-60">
                         <span className="text-[10px] text-gold uppercase tracking-widest">₹{course.price}</span>
                         <span className="text-[10px] text-ivory flex items-center gap-1">
                           <Star className="w-2.5 h-2.5 text-gold fill-gold" />
                           {course.rating ? parseFloat(course.rating).toFixed(1) : '—'}
                         </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setSelectedCourseForReviews(course._id)} className="p-2 rounded bg-ink/40 text-ivory/40 hover:text-gold transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="premium-panel p-6 text-center">
                 <p className="text-xs text-ivory/40 italic mb-4">You haven't published any legacy yet.</p>
                 <button onClick={() => setIsUploadModalOpen(true)} className="text-xs text-gold font-bold hover:underline">Start your first course →</button>
              </div>
            )}
          </section>

          {/* 2.1 support Liaison (Relocated) */}
          <section className="premium-panel p-6 bg-gradient-to-br from-maroon/20 to-transparent">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/25 flex items-center justify-center text-gold animate-pulse-soft">
                   <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                   <h3 className="text-[11px] font-bold text-gold uppercase tracking-widest">Liaison Office Active</h3>
                   <p className="text-[10px] text-ivory/40 italic">Global Production Support</p>
                </div>
             </div>
             <button className="w-full py-3 bg-gold/5 border border-gold/20 text-gold text-[10px] font-bold rounded-xl hover:bg-gold/15 transition-all shadow-glow-sm">
                Connect Now
             </button>
          </section>

        </div>

        {/* 3. Modular Deck: Insights & Activity */}
        <div className="lg:col-span-4 lg:sticky lg:top-8 self-start flex flex-col gap-8">
           {/* Card A: Activity Feed */}
           <section className="premium-panel p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-8 h-8 rounded-lg bg-gold/5 border border-gold/15 flex items-center justify-center text-gold">
                    <Activity className="w-4 h-4" />
                 </div>
                 <h2 className="text-xs font-display font-bold text-ivory uppercase tracking-[0.2em]">Operations Feed</h2>
              </div>
              <ActivityFeed activities={activityFeed} isLoading={isActivityLoading} />
           </section>

           {/* Card B: Revenue Ledger (Compact) */}
           <section className="premium-panel p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gold/5 border border-gold/15 flex items-center justify-center text-gold">
                       <ReceiptText className="w-4 h-4" />
                    </div>
                    <h2 className="text-xs font-display font-bold text-ivory uppercase tracking-[0.2em]">Financial Ledger</h2>
                 </div>
                 {revenueDetails?.total && <span className="text-[10px] text-gold font-bold">₹{revenueDetails.total.toLocaleString()}</span>}
              </div>
              <RevenueLedger entries={revenueDetails?.entries} isLoading={isLedgerLoading} compact={true} />
           </section>

           {/* Card C: Analytics (Trends) */}
           {(studentAnalytics?.length > 1 || revenueAnalytics?.length > 1) && (
              <section className="premium-panel p-6 shadow-xl hover:border-gold/25 transition-all">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-gold/5 border border-gold/15 flex items-center justify-center text-gold">
                       <TrendingUp className="w-4 h-4" />
                    </div>
                    <h2 className="text-xs font-display font-bold text-ivory uppercase tracking-[0.2em]">Growth Trends</h2>
                 </div>
                 <div className="space-y-8">
                    <div className="h-40">
                       <p className="text-[9px] text-gold/60 font-bold uppercase tracking-widest mb-3 px-1">Students</p>
                       <TrendChart data={studentAnalytics} dataKey="students" isLoading={isStudentAnalyticsLoading} />
                    </div>
                    <div className="h-40">
                       <p className="text-[9px] text-gold/60 font-bold uppercase tracking-widest mb-3 px-1">Revenue</p>
                       <TrendChart data={revenueAnalytics} dataKey="revenue" isLoading={isRevenueAnalyticsLoading} color="#b87333" />
                    </div>
                 </div>
              </section>
           )}

           {/* 2.5 Masterclass Promotion CTA (Relocated) */}
           <section className="premium-panel p-10 flex flex-col items-center justify-center text-center group">
              <div className="w-16 h-16 rounded-2xl bg-gold/5 border border-gold/10 flex items-center justify-center text-gold mb-6 group-hover:scale-110 transition-transform duration-500 shadow-glow-sm">
                 <Calendar className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-display font-bold text-ivory mb-3 tracking-tight">Expand Your Legacy</h2>
              <p className="text-sm text-ivory/40 max-w-sm mb-8 italic">Ready to engage with students in real-time? Host a scheduled masterclass and build deeper connections with your global cohort.</p>
              <button 
                 onClick={() => setIsScheduleModalOpen(true)}
                 className="px-8 py-3.5 bg-gradient-gold text-ink font-display font-bold rounded-xl text-sm shadow-glow-sm hover:shadow-glow-md hover:scale-[1.02] transition-all flex items-center gap-3"
              >
                 Schedule Masterclass <ArrowRight className="w-4 h-4" />
              </button>
           </section>
        </div>
      </div>

      <ScheduleMasterclassModal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} />
      <CourseUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
      <CourseReviewsModal 
        isOpen={!!selectedCourseForReviews} 
        courseId={selectedCourseForReviews} 
        onClose={() => setSelectedCourseForReviews(null)} 
      />
    </PageShell>
  );
};

export default InstructorDashboard;
