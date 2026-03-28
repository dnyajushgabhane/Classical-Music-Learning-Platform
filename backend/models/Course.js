const mongoose = require('mongoose');

const courseSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        instructor: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        price: {
            type: Number,
            required: true,
            default: 0,
        },
        category: {
            type: String,
            required: true,
        },
        instrument: {
            type: String,
            required: true,
            enum: ['Vocal', 'Tabla', 'Sitar', 'Harmonium', 'Flute', 'Other'],
        },
        level: {
            type: String,
            required: true,
            enum: ['Beginner', 'Intermediate', 'Advanced'],
        },
        raag: {
            type: String,
        },
        thumbnail: {
            type: String,
        },
        video: {
            type: String,
        },
        description: {
            type: String,
        },
        composer: {
            type: String,
        },
        mood: {
            type: String,
            enum: ['Meditative', 'Joyful', 'Romantic', 'Devotional', 'Melancholic', 'Energetic', 'Other'],
        },
        isPremium: {
            type: Boolean,
            default: false,
        },
        lessons: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lesson'
        }],
        rating: {
            type: Number,
            required: true,
            default: 0,
        },
        numReviews: {
            type: Number,
            required: true,
            default: 0,
        },
        status: {
            type: String,
            required: true,
            enum: ['active', 'archived'],
            default: 'active',
        },
    },
    {
        timestamps: true,
    }
);

courseSchema.index({ instructor: 1, rating: -1 });
courseSchema.index({ createdAt: -1 });

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;
