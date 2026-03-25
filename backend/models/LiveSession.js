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
  },
  { timestamps: true }
);

liveSessionSchema.index({ status: 1, scheduledStart: 1 });

module.exports = mongoose.model('LiveSession', liveSessionSchema);
