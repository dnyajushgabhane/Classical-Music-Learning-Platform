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
      enum: ['scheduled', 'live', 'completed', 'cancelled'],
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
    }
  },
  { timestamps: true }
);

scheduledSessionSchema.index({ instructor: 1 });
scheduledSessionSchema.index({ scheduledAt: 1, status: 1 });

module.exports = mongoose.model('ScheduledSession', scheduledSessionSchema);
