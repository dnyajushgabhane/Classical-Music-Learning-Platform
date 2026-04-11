import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Play, Trash2, Cpu, FileText, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { fetchMeetingHistory, downloadRecording, fetchTranscriptionSummary } from '../../services/api';

export default function RecordingsPanel({ sessionId, isHost }) {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState({});
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!isHost) return;

    const loadRecordings = async () => {
      try {
        const history = await fetchMeetingHistory({ sessionId });
        const sessionRecordings = (history || []).filter(h => h.recordings?.length > 0)
          .flatMap(h => h.recordings);
        setRecordings(sessionRecordings);
      } catch (error) {
        console.error('Failed to load recordings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecordings();
  }, [sessionId, isHost]);

  const handleDownload = async (recordingId, filename) => {
    try {
      const blob = await downloadRecording(recordingId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `recording-${recordingId}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download recording:', error);
    }
  };

  const toggleSummary = async (recordingId) => {
    if (expanded === recordingId) {
      setExpanded(null);
      return;
    }
    setExpanded(recordingId);
    if (!summaries[recordingId]) {
      try {
        setSummaries(prev => ({ ...prev, [recordingId]: { loading: true } }));
        const summaryData = await fetchTranscriptionSummary(sessionId, recordingId);
        setSummaries(prev => ({ ...prev, [recordingId]: { ...summaryData, loading: false } }));
      } catch (err) {
        setSummaries(prev => ({ ...prev, [recordingId]: { error: 'Summary not available yet.', loading: false } }));
      }
    }
  };

  if (!isHost) {
    return (
      <div className="p-8 text-center glass border-rv-border m-4 shadow-sm">
         <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-gold/25 shadow-glow-sm">
            <Cpu className="w-8 h-8 text-gold/40" />
         </div>
         <p className="text-rv-text-muted text-sm font-medium">Recordings and AI summaries are restricted to instructors.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="relative w-12 h-12 mx-auto mb-4">
           <div className="absolute inset-0 border-2 border-gold/20 rounded-full" />
           <div className="absolute inset-0 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="label-caps-accent animate-pulse">Analysing data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between px-3 mb-6">
        <h3 className="label-caps-accent flex items-center gap-2.5">
           <Play className="w-3.5 h-3.5 fill-gold text-gold" />
           Session Archives
        </h3>
        <span className="text-[10px] bg-gold/15 text-gold px-2.5 py-1 rounded-full border border-gold/30 font-bold uppercase tracking-wider">
          {recordings.length} Saved
        </span>
      </div>
      
      {recordings.length === 0 ? (
        <div className="py-16 text-center glass border-rv-border mx-3 border-dashed opacity-60">
           <FileText className="w-10 h-10 text-rv-text-faint mx-auto mb-5" />
           <p className="text-rv-text-muted text-xs italic">No recordings found for this session</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recordings.map((recording) => (
            <motion.div
              key={recording.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="group"
            >
              <div className="glass border-rv-border overflow-hidden hover:border-gold/40 transition-all duration-300 shadow-sm">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                     <p className="text-rv-text font-display font-semibold transition-colors group-hover:text-gold truncate mb-1">
                        {recording.filename || 'Class Archive'}
                     </p>
                     <div className="flex items-center gap-3 label-caps opacity-60 font-medium">
                        <span>{new Date(recording.createdAt).toLocaleDateString()}</span>
                        <span className="w-1 h-1 rounded-full bg-gold/40" />
                        <span>{recording.duration || 'Full duration'}</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSummary(recording.id)}
                      className={`p-2.5 rounded-xl border transition-all ${expanded === recording.id ? 'bg-gold border-gold text-ink' : 'bg-gold/5 border-gold/20 text-gold hover:bg-gold/10'}`}
                      title="AI Insights"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(recording.id, recording.filename)}
                      className="p-2.5 rounded-xl bg-ivory/5 border border-ivory/10 text-ivory/80 hover:bg-ivory/10 transition-all"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expanded === recording.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-rv-bg-elevated/90 border-t border-rv-border overflow-hidden shadow-inner"
                    >
                      <div className="p-4 pt-1">
                        {summaries[recording.id]?.loading ? (
                          <div className="py-6 flex flex-col items-center gap-3">
                             <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                             <p className="text-xs text-gold/60 animate-pulse uppercase tracking-widest">Generating AI Summary...</p>
                          </div>
                        ) : summaries[recording.id]?.error ? (
                          <div className="py-4 text-center">
                             <p className="text-xs text-red-300/40 italic">{summaries[recording.id].error}</p>
                          </div>
                        ) : (
                          <div className="space-y-4 py-3">
                             <div>
                                <h4 className="label-caps-accent mb-2.5 flex items-center gap-2">
                                   <div className="w-1 h-3.5 bg-gold rounded-full" />
                                   Executive Summary
                                </h4>
                                <p className="text-xs text-rv-text-2 leading-relaxed font-medium italic bg- gold/[0.03] p-3 rounded-xl border border-gold/10">
                                   "{summaries[recording.id]?.summary || 'The instructor discussed core principles of the subject matter with active student engagement.'}"
                                </p>
                             </div>
                             {summaries[recording.id]?.keyPoints && (
                               <div>
                                  <h4 className="text-[10px] text-gold font-black uppercase tracking-widest mb-2">Key Highlights</h4>
                                  <ul className="space-y-1.5">
                                     {summaries[recording.id].keyPoints.map((pt, i) => (
                                        <li key={i} className="text-[11px] text-ivory/50 flex gap-2">
                                           <span className="text-gold">•</span>
                                           <span>{pt}</span>
                                        </li>
                                     ))}
                                  </ul>
                               </div>
                             )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}