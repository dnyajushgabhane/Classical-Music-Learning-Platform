const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const liveSessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'A title is required for the live session.'],
    },
    description: {
      type: String,
      default: '',
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    /** Optional course — enrollment required for students when set */
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
    },
    accessType: {
      type: String,
      enum: ['public', 'enrolled', 'private'],
      default: 'public',
    },
    invitedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'live', 'ended'],
      default: 'scheduled',
    },
    /** Stable id used as LiveKit room name + socket room */
    roomId: {
      type: String,
      default: () => uuidv4(),
      unique: true,
    },
    scheduledStart: { type: Date, default: null },
    scheduledEnd: { type: Date, default: null },
    waitingRoomEnabled: { type: Boolean, default: true },
    locked: { type: Boolean, default: false },
    /** Users allowed past waiting room (socket notifies + token issue) */
    admittedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    waitingQueue: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        enqueuedAt: { type: Date, default: Date.now },
      },
    ],
    /** Active recording document id while live */
    activeRecording: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SessionRecording',
      default: null,
    },
    spotlightIdentity: { type: String, default: '' },
    /** Participant permissions and raised hands */
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
    /** Meeting settings */
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

liveSessionSchema.index({ status: 1, scheduledStart: 1 });

module.exports = mongoose.model('LiveSession', liveSessionSchema);
