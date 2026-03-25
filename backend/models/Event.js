const mongoose = require('mongoose');

const eventSchema = mongoose.Schema(
    {
        title: { type: String, required: true },
        artist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        date: { type: Date, required: true },
        price: { type: Number, required: true, default: 0 },
        isLive: { type: Boolean, default: false },
        streamUrl: { type: String },
        attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    },
    { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
