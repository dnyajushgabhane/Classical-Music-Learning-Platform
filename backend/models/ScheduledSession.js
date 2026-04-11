const mongoose = require('mongoose');

const scheduledSessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'A title is required for the masterclass.'],
    },
    description: {
      type: String,
      default: '',
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    duration: {
      type: Number, // in minutes
      default: 60,
    },
    sessionType: {
      type: String,
      enum: ['free', 'paid'],
      default: 'free',
    },
    price: {
      type: Number,
      default: 0,
    },
    capacity: {
      type: Number,
      default: 0, // 0 for unlimited
    },
    enrolledStudents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    status: {
      type: String,
      enum: ['created', 'scheduled', 'live', 'ended', 'recorded', 'archived', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    thumbnailUrl: {
      type: String,
      default: '',
    },
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    endedAt: { type: Date, default: null },
    isLive: { type: Boolean, default: false },
    waitingRoomEnabled: { type: Boolean, default: true },
    locked: { type: Boolean, default: false },
    admittedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    waitingQueue: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        enqueuedAt: { type: Date, default: Date.now },
      },
    ],
    activeRecording: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SessionRecording',
      default: null,
    },
    spotlightIdentity: { type: String, default: '' },
    participants: [{
      identity: String,
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: String,
      role: {
        type: String,
        enum: ['host', 'moderator', 'participant'],
        default: 'participant',
      },
      permissions: {
        canPublishAudio: { type: Boolean, default: true },
        canPublishVideo: { type: Boolean, default: true },
        canPublishData: { type: Boolean, default: true },
        muted: { type: Boolean, default: false },
        videoMuted: { type: Boolean, default: false },
      },
      joinedAt: { type: Date, default: Date.now },
      raisedHand: { type: Boolean, default: false },
      raisedAt: { type: Date, default: null },
    }],
    settings: {
      allowRaiseHand: { type: Boolean, default: true },
      allowChat: { type: Boolean, default: true },
      allowScreenShare: { type: Boolean, default: true },
      maxParticipants: { type: Number, default: 50 },
      recordingEnabled: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

scheduledSessionSchema.index({ instructor: 1 });
scheduledSessionSchema.index({ scheduledAt: 1, status: 1 });

module.exports = mongoose.model('ScheduledSession', scheduledSessionSchema);
