import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { createOrUpdateReview } from '../services/api';
import toast from 'react-hot-toast';

export default function CourseReviewForm({ courseId }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // If no specific course ID is passed safely (like on a mocked dashboard page), we cannot submit a meaningful rating
  if (!courseId) {
    return (
      <div className="premium-panel p-6 mt-8 text-center">
        <p className="text-ivory/50 text-sm italic">Finish completing a course module to unlock the ability to leave a rating and review.</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a star rating before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrUpdateReview({ courseId, rating, comment });
      toast.success('Thank you for your review!');
      setIsSuccess(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review. Are you enrolled?');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="premium-panel p-6 mt-8 text-center">
        <p className="text-green-400 font-semibold mb-2">⭐ Review Submitted Successfully</p>
        <p className="text-ivory/50 text-sm">Your feedback helps shape the future of RaagVidya.</p>
        <button 
          onClick={() => setIsSuccess(false)}
          className="mt-4 text-xs text-gold hover:underline"
        >
          Edit Review
        </button>
      </div>
    );
  }

  return (
    <div className="premium-panel p-6 md:p-8 mt-8">
      <h3 className="text-lg font-display text-ivory mb-2">Rate this course</h3>
      <p className="text-sm text-ivory/50 mb-6 font-light">Your review is public and helps fellow students discover the right masterclass.</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  star <= (hoverRating || rating)
                    ? 'text-gold fill-gold'
                    : 'text-ivory/20'
                }`}
              />
            </button>
          ))}
          <span className="ml-3 text-sm font-semibold text-gold">
            {rating > 0 ? `${rating}.0` : ''}
          </span>
        </div>

        <div>
           <textarea
             value={comment}
             onChange={(e) => setComment(e.target.value)}
             placeholder="What did you think of the curriculum? (Optional)"
             rows={3}
             className="w-full bg-ink/50 border border-gold/15 rounded-xl px-4 py-3 text-ivory text-sm focus:border-gold/50 outline-none transition-colors resize-none"
           />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="px-6 py-2.5 rounded-xl bg-gold/10 text-gold border border-gold/30 font-semibold hover:bg-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isSubmitting ? 'Submitting...' : 'Post Review'}
        </button>
      </form>
    </div>
  );
}
