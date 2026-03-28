import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchCourseRatingSummary } from '../services/api';

const CourseReviewsModal = ({ courseId, isOpen, onClose }) => {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['rating-summary', courseId],
    queryFn: () => fetchCourseRatingSummary(courseId),
    enabled: !!courseId && isOpen,
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink/80 backdrop-blur-sm pointer-events-auto"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-[700px] max-h-[90vh] bg-ink border border-gold/20 rounded-2xl shadow-2xl overflow-y-auto pointer-events-auto flex flex-col"
          >
            <div className="sticky top-0 z-10 bg-ink/95 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-gold/10">
              <h2 className="text-xl font-display font-semibold text-ivory flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gold" /> Student Reviews
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -mr-2 rounded-full hover:bg-gold/10 text-ivory/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-20 bg-gold/5 rounded-xl"></div>
                  <div className="h-20 bg-gold/5 rounded-xl"></div>
                </div>
              ) : summary ? (
                <>
                  <div className="flex flex-col sm:flex-row gap-8 items-center bg-gold/5 border border-gold/10 rounded-2xl p-6 mb-8">
                    <div className="text-center sm:border-r border-gold/10 sm:pr-8">
                      <p className="text-5xl font-display font-bold text-gradient-gold">{summary.averageRating}</p>
                      <div className="flex items-center justify-center mt-2 mb-1">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className={`w-4 h-4 ${i <= Math.round(summary.averageRating) ? 'text-gold fill-gold' : 'text-ivory/20'}`} />
                        ))}
                      </div>
                      <p className="text-sm text-ivory/50">{summary.totalReviews} ratings</p>
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      {[5,4,3,2,1].map(r => {
                        const count = summary.distribution[r] || 0;
                        const pct = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
                        return (
                          <div key={r} className="flex items-center gap-3 text-sm">
                            <span className="w-4 text-ivory/70">{r}</span>
                            <Star className="w-3 h-3 text-gold/50 fill-gold/50" />
                            <div className="flex-1 h-2 rounded-full bg-ink/50 overflow-hidden">
                              <div className="h-full bg-gold" style={{ width: `${pct}%` }}></div>
                            </div>
                            <span className="w-8 text-right text-ivory/40 text-xs">{pct.toFixed(0)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-display text-lg text-ivory mb-2">Written Reviews</h3>
                    {summary.reviews.length === 0 && <p className="text-ivory/50 text-sm">No reviews yet.</p>}
                    {summary.reviews.map(review => (
                      <div key={review._id} className="p-4 rounded-xl border border-gold/10 bg-ink/30">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-ivory text-sm">{review.user?.name || 'Anonymous Student'}</p>
                            <div className="flex items-center gap-0.5 mt-1">
                              {[1,2,3,4,5].map(i => (
                                <Star key={i} className={`w-3 h-3 ${i <= review.rating ? 'text-gold fill-gold' : 'text-ivory/20'}`} />
                              ))}
                            </div>
                          </div>
                          <span className="text-[10px] text-ivory/40">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-ivory/70 mt-3 leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-ivory/50">Error loading reviews.</p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CourseReviewsModal;
