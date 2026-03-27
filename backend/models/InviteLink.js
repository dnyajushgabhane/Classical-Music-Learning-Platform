const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const inviteLinkSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LiveSession',
      required: true,
    },
    code: {
      type: String,
      default: () => uuidv4().substring(0, 8).toUpperCase(),
      unique: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
    maxUses: {
      type: Number,
      default: null, // unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    permissions: {
      canPublish: {
        type: Boolean,
        default: true,
      },
      canSubscribe: {
        type: Boolean,
        default: true,
      },
      canPublishData: {
        type: Boolean,
        default: true,
      },
      role: {
        type: String,
        enum: ['participant', 'moderator'],
        default: 'participant',
      },
    },
    usedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      usedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  { timestamps: true }
);

// Indexes
inviteLinkSchema.index({ session: 1 });
inviteLinkSchema.index({ expiresAt: 1 });
inviteLinkSchema.index({ isActive: 1 });

module.exports = mongoose.model('InviteLink', inviteLinkSchema);