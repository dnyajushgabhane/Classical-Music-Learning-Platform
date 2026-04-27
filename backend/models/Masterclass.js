const mongoose = require('mongoose');

const masterclassSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  youtubeUrl: {
    type: String,
    required: true,
  },
  videoId: {
    type: String,
    required: true,
    unique: true,
  },
  thumbnail: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: 'Premium Masterclass'
  },
  tag: {
    type: String,
    default: 'Masterclass'
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Masterclass', masterclassSchema);
