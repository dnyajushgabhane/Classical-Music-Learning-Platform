import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Users, DollarSign, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { createScheduledSession } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';

const ScheduleMasterclassModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 60,
    sessionType: 'free',
    price: 0,
    capacity: 0,
  });

  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleClose = useCallback(() => {
    if (status === 'loading') return;
    
    // Reset state after animation finishes
    setTimeout(() => {
      setFormData({
        title: '',
        description: '',
        scheduledDate: '',
        scheduledTime: '',
        duration: 60,
        sessionType: 'free',
        price: 0,
        capacity: 0,
      });
      setStatus('idle');
      setErrorMessage('');
    }, 300);
    
    onClose();
  }, [status, onClose]);

  // Lock body scroll and listen for escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e) => {
        if (e.key === 'Escape') handleClose();
      };
      window.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, handleClose]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.scheduledDate || !formData.scheduledTime) {
      setErrorMessage('Please fill in title, date, and time.');
      return;
    }

    // Combine date and time
    const scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
    if (scheduledAt < new Date()) {
      setErrorMessage('Masterclass must be scheduled in the future.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      await createScheduledSession({
        ...formData,
        scheduledAt: scheduledAt.toISOString(),
      });

      setStatus('success');
      queryClient.invalidateQueries({ queryKey: ['instructor-sessions'] });
      
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.response?.data?.message || err.message || 'Scheduling failed');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink/80 backdrop-blur-sm pointer-events-auto"
            onClick={handleClose}
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[600px] max-h-[90vh] bg-ink border border-gold/20 rounded-2xl sm:rounded-3xl shadow-2xl overflow-y-auto pointer-events-auto flex flex-col"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-ink/95 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-gold/10">
              <h2 className="text-xl sm:text-2xl font-display font-semibold text-ivory">Schedule Masterclass</h2>
              <button
                type="button"
                onClick={handleClose}
                disabled={status === 'loading'}
                className="p-2 -mr-2 rounded-full hover:bg-gold/10 text-ivory/50 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-6">
              {status === 'success' ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                    <CheckCircle className="w-20 h-20 text-green-400 mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-display text-ivory font-semibold mb-2">Masterclass Scheduled!</h3>
                  <p className="text-ivory/50 italic">"The stage is set for your digital sabha."</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {errorMessage && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p className="text-sm">{errorMessage}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gold uppercase tracking-widest mb-1.5 ml-1">Title *</label>
                      <input
                        required
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full bg-ink/50 border border-gold/15 rounded-xl px-4 py-3 text-ivory text-sm focus:border-gold/50 outline-none transition-colors"
                        placeholder="e.g. Masterclass in Raag Bhairavi"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gold uppercase tracking-widest mb-1.5 ml-1">Brief Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full bg-ink/50 border border-gold/15 rounded-xl px-4 py-3 text-ivory text-sm focus:border-gold/50 outline-none transition-colors resize-none"
                        placeholder="What should students prepare for?"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-gold uppercase tracking-widest mb-1.5 ml-1">
                          <Calendar className="w-3 h-3" /> Date *
                        </label>
                        <input
                          required
                          type="date"
                          name="scheduledDate"
                          value={formData.scheduledDate}
                          onChange={handleInputChange}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full bg-ink/50 border border-gold/15 rounded-xl px-4 py-3 text-ivory text-sm focus:border-gold/50 outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-gold uppercase tracking-widest mb-1.5 ml-1">
                          <Clock className="w-3 h-3" /> Time *
                        </label>
                        <input
                          required
                          type="time"
                          name="scheduledTime"
                          value={formData.scheduledTime}
                          onChange={handleInputChange}
                          className="w-full bg-ink/50 border border-gold/15 rounded-xl px-4 py-3 text-ivory text-sm focus:border-gold/50 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-gold uppercase tracking-widest mb-1.5 ml-1">
                          Duration (min)
                        </label>
                        <select
                          name="duration"
                          value={formData.duration}
                          onChange={handleInputChange}
                          className="w-full bg-ink/50 border border-gold/15 rounded-xl px-4 py-3 text-ivory text-sm focus:border-gold/50 outline-none transition-colors appearance-none"
                        >
                          {[30, 45, 60, 90, 120, 180].map(m => (
                            <option key={m} value={m}>{m} Minutes</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-gold uppercase tracking-widest mb-1.5 ml-1">
                           Capacity
                        </label>
                        <div className="relative">
                           <Users className="absolute left-3 top-3.5 w-4 h-4 text-ivory/30" />
                           <input
                             type="number"
                             name="capacity"
                             value={formData.capacity}
                             onChange={handleInputChange}
                             min="0"
                             className="w-full bg-ink/50 border border-gold/15 rounded-xl pl-10 pr-4 py-3 text-ivory text-sm focus:border-gold/50 outline-none transition-colors"
                             placeholder="Unlimited"
                           />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gold/5 border border-gold/10 rounded-2xl space-y-4">
                       <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-ivory">Session Type</span>
                          <div className="flex bg-ink rounded-lg p-1 border border-gold/10">
                             <button
                               type="button"
                               onClick={() => setFormData(p => ({ ...p, sessionType: 'free' }))}
                               className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${formData.sessionType === 'free' ? 'bg-gold text-ink' : 'text-ivory/50 hover:text-ivory'}`}
                             >
                               Free
                             </button>
                             <button
                               type="button"
                               onClick={() => setFormData(p => ({ ...p, sessionType: 'paid' }))}
                               className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${formData.sessionType === 'paid' ? 'bg-saffron text-ink' : 'text-ivory/50 hover:text-ivory'}`}
                             >
                               Paid
                             </button>
                          </div>
                       </div>
                       
                       {formData.sessionType === 'paid' && (
                         <motion.div
                           initial={{ opacity: 0, height: 0 }}
                           animate={{ opacity: 1, height: 'auto' }}
                           className="space-y-2"
                         >
                           <label className="block text-xs font-bold text-saffron uppercase tracking-widest ml-1">Registration Price (₹)</label>
                           <div className="relative">
                              <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-saffron/50" />
                              <input
                                required
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                min="1"
                                className="w-full bg-ink/60 border border-saffron/20 rounded-xl pl-10 pr-4 py-3 text-ivory text-sm focus:border-saffron/50 outline-none transition-colors"
                                placeholder="999"
                              />
                           </div>
                         </motion.div>
                       )}
                    </div>
                  </div>

                  <div className="pt-6 mt-4 flex justify-end gap-3 border-t border-gold/10">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-6 py-2.5 rounded-xl text-ivory/70 font-semibold hover:bg-gold/10 transition-colors"
                    >
                      Wait, not yet
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      disabled={status === 'loading'}
                      type="submit"
                      className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-ink font-bold shadow-glow transition-all hover:scale-[1.02] flex items-center gap-2"
                    >
                      {status === 'loading' ? (
                        <span className="animate-spin h-4 w-4 border-2 border-ink border-t-transparent rounded-full" />
                      ) : (
                        <>Schedule Masterclass →</>
                      )}
                    </motion.button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ScheduleMasterclassModal;
