const mongoose = require('mongoose');

const playlistSchema = mongoose.Schema(
    {
        title: { type: String, required: true },
        creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        description: { type: String },
        isPublic: { type: Boolean, default: true },
        tracks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
        followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    },
    { timestamps: true }
);

module.exports = mongoose.model('Playlist', playlistSchema);
