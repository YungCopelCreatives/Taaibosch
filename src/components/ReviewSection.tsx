import React, { useState, useEffect, useMemo } from 'react';
import { Star, MessageSquare, Send, User, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Review } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ReviewSectionProps {
  productId: string;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ productId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<'All' | 'Good' | 'Bad'>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [newReview, setNewReview] = useState({
    userName: '',
    rating: 5,
    comment: ''
  });

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews');
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json();
      setReviews(Array.isArray(data) ? data.filter((r: Review) => r.productId === productId) : []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const filteredReviews = useMemo(() => {
    if (filter === 'Good') return reviews.filter(r => r.rating >= 4);
    if (filter === 'Bad') return reviews.filter(r => r.rating <= 3);
    return reviews;
  }, [reviews, filter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.userName || !newReview.comment) return;

    setSubmitState('sending');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, ...newReview }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not send your review.');
      setSubmitState('sent');
      setSubmitMessage('Thank you! Your review will appear once it has been approved.');
      setNewReview({ userName: '', rating: 5, comment: '' });
      setIsFormOpen(false);
    } catch (error) {
      setSubmitState('error');
      setSubmitMessage(error instanceof Error ? error.message : 'Could not send your review.');
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-12 border-b border-black/5">
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold tracking-tight">Customer Reviews</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-yellow-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  size={16} 
                  fill={i < Math.round(Number(averageRating)) ? "currentColor" : "none"} 
                  className={i < Math.round(Number(averageRating)) ? "" : "text-brand-ink/10"}
                />
              ))}
            </div>
            <span className="text-sm font-bold">{averageRating} out of 5</span>
            <span className="text-xs text-brand-ink/40 uppercase tracking-widest font-bold">({reviews.length} Reviews)</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-brand-grey p-1 rounded-full">
            {(['All', 'Good', 'Bad'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all",
                  filter === f ? "bg-brand-green-deep text-white shadow-md" : "text-brand-ink/40 hover:text-brand-green-deep"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="px-8 py-3 bg-brand-green-deep text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-md"
          >
            Write a Review
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="bg-brand-grey p-8 rounded-[2rem] space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/40">Your Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-6 py-4 bg-white rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-brand-green-deep transition-all"
                    value={newReview.userName}
                    onChange={e => setNewReview({ ...newReview, userName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/40">Rating</label>
                  <div className="flex items-center space-x-2 h-[52px]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating: i + 1 })}
                        aria-label={`${i + 1} star${i ? 's' : ''}`}
                        className="text-yellow-500 transition-transform hover:scale-110"
                      >
                        <Star size={24} fill={i < newReview.rating ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/40">Your Review</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full px-6 py-4 bg-white rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-brand-green-deep transition-all resize-none"
                  value={newReview.comment}
                  onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 hover:text-brand-green-deep"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitState === 'sending'}
                  className="disabled:opacity-60 px-10 py-3 bg-brand-green-deep text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center space-x-2 shadow-md"
                >
                  <span>Submit Review</span>
                  <Send size={14} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {submitMessage && !isFormOpen && (
        <div role="status" className={cn('flex items-center gap-3 p-4 rounded-2xl text-sm', submitState === 'error' ? 'bg-red-50 text-red-700' : 'bg-brand-green-light text-brand-green-deep')}>
          {submitState !== 'error' && <Check size={16} />}
          {submitMessage}
        </div>
      )}
      {submitState === 'error' && isFormOpen && <p role="alert" className="text-sm text-red-600">{submitMessage}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review, idx) => (
            <motion.div 
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="p-8 bg-white rounded-[2rem] border border-black/5 space-y-4 relative group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-brand-grey rounded-full flex items-center justify-center text-brand-ink/20">
                    <User size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{review.userName}</h4>
                    <p className="text-[10px] text-brand-ink/40 font-bold uppercase tracking-widest">{review.date}</p>
                  </div>
                </div>
                <div className="flex items-center text-yellow-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      size={12} 
                      fill={i < review.rating ? "currentColor" : "none"} 
                      className={i < review.rating ? "" : "text-brand-ink/10"}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-brand-ink/60 leading-relaxed italic">"{review.comment}"</p>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4 bg-brand-grey rounded-[2rem]">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto text-brand-ink/10">
              <MessageSquare size={32} />
            </div>
            <p className="text-brand-ink/40 text-sm font-medium">{reviews.length ? 'No reviews match this filter.' : 'No reviews yet. Be the first to share your experience.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
