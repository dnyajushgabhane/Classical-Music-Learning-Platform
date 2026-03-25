const mongoose = require('mongoose');

const sessionRecordingSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveSession', required: true, index: true },
    roomId: { type: String, required: true },
    startedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['starting', 'active', 'completed', 'failed'],
      default: 'starting',
    },
    /** LiveKit egress id when using cloud/self-hosted egress */
    egressId: { type: String, default: '' },
    /** Public or signed playback URL after processing */
    playbackUrl: { type: String, default: '' },
    durationSeconds: { type: Number, default: 0 },
    errorMessage: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SessionRecording', sessionRecordingSchema);
