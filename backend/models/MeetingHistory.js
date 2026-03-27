const mongoose = require('mongoose');

const meetingHistorySchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LiveSession',
      required: true,
    },
    roomId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      identity: String,
      name: String,
      joinedAt: Date,
      leftAt: Date,
      duration: Number, // in seconds
      role: {
        type: String,
        enum: ['host', 'participant'],
        default: 'participant',
      },
    }],
    startedAt: {
      type: Date,
      required: true,
    },
    endedAt: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // in seconds
      required: true,
    },
    recordings: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SessionRecording',
    }],
    totalParticipants: {
      type: Number,
      default: 0,
    },
    peakParticipants: {
      type: Number,
      default: 0,
    },
    chatMessages: {
      type: Number,
      default: 0,
    },
    raisedHands: {
      type: Number,
      default: 0,
    },
    settings: {
      waitingRoomEnabled: Boolean,
      locked: Boolean,
      recordingEnabled: Boolean,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
meetingHistorySchema.index({ session: 1 });
meetingHistorySchema.index({ teacher: 1 });
meetingHistorySchema.index({ startedAt: -1 });
meetingHistorySchema.index({ 'participants.user': 1 });

module.exports = mongoose.model('MeetingHistory', meetingHistorySchema);