const mongoose = require('mongoose');

const sessionMessageSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LiveSession',
      required: true,
      index: true,
    },
    roomId: { type: String, required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    text: { type: String, required: true, maxlength: 4000 },
    scope: {
      type: String,
      enum: ['group', 'private'],
      default: 'group',
    },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

sessionMessageSchema.index({ session: 1, createdAt: -1 });

module.exports = mongoose.model('SessionMessage', sessionMessageSchema);
