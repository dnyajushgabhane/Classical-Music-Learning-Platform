import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, FileVideo, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { createCourse } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';

const CourseUploadModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    instrument: 'Vocal',
    level: 'Beginner',
    isPremium: false,
  });

  const [files, setFiles] = useState({
    thumbnail: null,
    video: null,
  });

  const [previews, setPreviews] = useState({
    thumbnail: null,
    video: null,
  });

  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const thumbnailRef = useRef(null);
  const videoRef = useRef(null);

  const handleClose = useCallback(() => {
    if (status === 'uploading') return;

    // Reset state after animation finishes
    setTimeout(() => {
      setFormData({
        title: '',
        description: '',
        category: '',
        instrument: 'Vocal',
        level: 'Beginner',
        isPremium: false,
      });
      setFiles({ thumbnail: null, video: null });
      setPreviews({ thumbnail: null, video: null });
      setStatus('idle');
      setProgress(0);
      setErrorMessage('');
    }, 300);

    onClose();
  }, [status, onClose]);

  // Lock body scroll and listen for escape key when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };

      window.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, handleClose]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileDrop = useCallback((e, type) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer?.files[0] || e.target.files[0];
    validateAndSetFile(droppedFile, type);
  }, []);

  const validateAndSetFile = (file, type) => {
    if (!file) return;

    if (type === 'thumbnail') {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Thumbnail must be an image.');
        return;
      }
      setFiles((prev) => ({ ...prev, thumbnail: file }));
      setPreviews((prev) => ({ ...prev, thumbnail: URL.createObjectURL(file) }));
    } else if (type === 'video') {
      if (!file.type.startsWith('video/')) {
        setErrorMessage('Only video files are allowed for course media.');
        return;
      }
      setFiles((prev) => ({ ...prev, video: file }));
      setPreviews((prev) => ({ ...prev, video: file.name }));
    }
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.category) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      payload.append(key, value);
    });

    if (files.thumbnail) {
      payload.append('thumbnail', files.thumbnail);
    }
    if (files.video) {
      payload.append('video', files.video);
    }

    setStatus('uploading');
    setProgress(0);
    setErrorMessage('');

    try {
      await createCourse(payload, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percentCompleted);
      });

      setStatus('success');
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.response?.data?.message || err.message || 'Upload failed');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        // Render inside a full-screen fixed container to act effectively as a portal-like overlay
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
            {/* Sticky Header so it is always visible on scroll */}
            <div className="sticky top-0 z-10 bg-ink/95 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-gold/10">
              <h2 className="text-xl sm:text-2xl font-display font-semibold text-ivory">Launch Masterclass</h2>
              <button
                type="button"
                onClick={handleClose}
                disabled={status === 'uploading'}
                className="p-2 -mr-2 rounded-full hover:bg-gold/10 text-ivory/50 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gold/50"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-6">
              {status === 'success' ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                  >
                    <CheckCircle className="w-20 h-20 text-green-400 mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-display text-ivory font-semibold mb-2">Masterclass Published!</h3>
                  <p className="text-ivory/50">Your course is now available to students.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {errorMessage && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p className="text-sm">{errorMessage}</p>
                    </div>
                  )}

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm text-ivory/70 mb-2">Title *</label>
                      <input
                        required
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full bg-ink/50 border border-gold/15 rounded-xl px-4 py-3 text-ivory text-sm focus:border-gold/50 outline-none transition-colors"
                        placeholder="e.g. Masterclass in Raag Bhairav"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-ivory/70 mb-2">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full bg-ink/50 border border-gold/15 rounded-xl px-4 py-3 text-ivory text-sm focus:border-gold/50 outline-none transition-colors resize-none"
                        placeholder="Describe what students will learn..."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-sm text-ivory/70 mb-2">Category *</label>
                        <input
                          required
                          type="text"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full bg-ink/50 border border-gold/15 rounded-xl px-4 py-3 text-ivory text-sm focus:border-gold/50 outline-none transition-colors"
                          placeholder="e.g. Hindustani Classical"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-ivory/70 mb-2">Instrument</label>
                        <select
                          name="instrument"
                          value={formData.instrument}
                          onChange={handleInputChange}
                          className="w-full bg-ink/50 border border-gold/15 rounded-xl px-4 py-3 text-ivory text-sm focus:border-gold/50 outline-none transition-colors appearance-none"
                        >
                          {['Vocal', 'Tabla', 'Sitar', 'Harmonium', 'Flute', 'Other'].map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-sm text-ivory/70 mb-2">Level</label>
                        <select
                          name="level"
                          value={formData.level}
                          onChange={handleInputChange}
                          className="w-full bg-ink/50 border border-gold/15 rounded-xl px-4 py-3 text-ivory text-sm focus:border-gold/50 outline-none transition-colors appearance-none"
                        >
                          {['Beginner', 'Intermediate', 'Advanced'].map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center sm:justify-start sm:mt-8 mt-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            name="isPremium"
                            checked={formData.isPremium}
                            onChange={handleInputChange}
                            className="w-5 h-5 rounded border-gold/20 text-gold bg-ink/50 focus:ring-gold focus:ring-offset-ink group-hover:border-gold/50 transition-colors"
                          />
                          <span className="text-sm text-ivory/70 group-hover:text-ivory transition-colors">Premium Access Only</span>
                        </label>
                      </div>
                    </div>

                    {/* Thumbnail Upload */}
                    <div>
                      <label className="block text-sm text-ivory/70 mb-2">Thumbnail</label>
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleFileDrop(e, 'thumbnail')}
                        onClick={() => thumbnailRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${previews.thumbnail ? 'border-gold/50 bg-gold/5' : 'border-gold/20 hover:border-gold/40'
                          }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={thumbnailRef}
                          onChange={(e) => handleFileDrop(e, 'thumbnail')}
                        />
                        {previews.thumbnail ? (
                          <div className="flex flex-col items-center gap-3">
                            <img src={previews.thumbnail} alt="Preview" className="h-28 w-auto object-cover rounded-lg shadow-md border border-gold/20" />
                            <p className="text-xs text-ivory/50">Click or drag to replace</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3">
                            <ImageIcon className="w-8 h-8 text-gold/50" />
                            <p className="text-sm text-ivory/70">Drag & drop an image, or <span className="text-gold">browse files</span></p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Video Upload */}
                    <div>
                      <label className="block text-sm text-ivory/70 mb-2">Course Masterclass Video</label>
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleFileDrop(e, 'video')}
                        onClick={() => videoRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${previews.video ? 'border-gold/50 bg-gold/5' : 'border-gold/20 hover:border-gold/40'
                          }`}
                      >
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          ref={videoRef}
                          onChange={(e) => handleFileDrop(e, 'video')}
                        />
                        {previews.video ? (
                          <div className="flex flex-col items-center gap-3">
                            <FileVideo className="w-10 h-10 text-gold" />
                            <p className="text-sm text-ivory font-medium break-all px-4">{previews.video}</p>
                            <p className="text-xs text-ivory/50">Click or drag to replace</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3">
                            <UploadCloud className="w-8 h-8 text-gold/50" />
                            <p className="text-sm text-ivory/70">Drag & drop a video file, or <span className="text-gold">browse files</span></p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {status === 'uploading' && (
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-xs text-ivory/50">
                        <span>Uploading securely...</span>
                        <span className="font-semibold text-gold">{progress}%</span>
                      </div>
                      <div className="w-full bg-ink/50 h-2 rounded-full overflow-hidden border border-gold/10">
                        <motion.div
                          className="h-full bg-gradient-to-r from-gold to-gold-dark"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-6 mt-4 flex justify-end gap-3 border-t border-gold/10">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={status === 'uploading'}
                      className="px-6 py-2.5 rounded-xl text-ivory/70 font-semibold hover:bg-gold/10 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      disabled={status === 'uploading'}
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-ink font-bold shadow-glow transition-all hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {status === 'uploading' ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin h-4 w-4 border-2 border-ink border-t-transparent rounded-full" />
                          Uploading...
                        </span>
                      ) : (
                        <>Publish Course</>
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

export default CourseUploadModal;
