const mongoose = require('mongoose');

const transcriptionJobSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveSession',
    required: true,
  },
  recordingId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  transcript: {
    type: String,
  },
  summary: {
    type: String,
  },
  keyPoints: [{
    type: String,
  }],
  error: {
    type: String,
  },
  processedAt: {
    type: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model('TranscriptionJob', transcriptionJobSchema);
