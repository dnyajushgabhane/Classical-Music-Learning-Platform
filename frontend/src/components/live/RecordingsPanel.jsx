import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Play, Trash2 } from 'lucide-react';
import { fetchMeetingHistory, downloadRecording } from '../../services/api';

export default function RecordingsPanel({ sessionId, isHost }) {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isHost) return;

    const loadRecordings = async () => {
      try {
        const history = await fetchMeetingHistory({ sessionId });
        const sessionRecordings = history.filter(h => h.recordings?.length > 0)
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

  if (!isHost) {
    return (
      <div className="p-4 text-center text-ivory/60">
        Recordings are only available to hosts.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto"></div>
        <p className="text-ivory/60 mt-2">Loading recordings...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-ivory mb-4">Recordings</h3>
      
      {recordings.length === 0 ? (
        <p className="text-ivory/60">No recordings available</p>
      ) : (
        <div className="space-y-3">
          {recordings.map((recording) => (
            <motion.div
              key={recording.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-nav rounded-lg p-3 border border-gold/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-ivory font-medium">{recording.filename || `Recording ${recording.id}`}</p>
                  <p className="text-ivory/60 text-sm">
                    {new Date(recording.createdAt).toLocaleString()}
                  </p>
                  <p className="text-ivory/60 text-sm">
                    Duration: {recording.duration || 'Unknown'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(recording.id, recording.filename)}
                    className="p-2 rounded-lg bg-gold/20 hover:bg-gold/30 text-gold transition-colors"
                    title="Download recording"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}