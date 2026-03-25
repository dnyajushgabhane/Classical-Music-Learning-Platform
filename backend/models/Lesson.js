const mongoose = require('mongoose');

const lessonSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Course',
        },
        videoUrl: {
            type: String,
        },
        audioUrl: {
            type: String, // High-Fidelity Lossless FLAC URL
        },
        audioQuality: {
            type: String,
            enum: ['Standard', 'High-Res', 'Lossless'],
            default: 'Standard'
        },
        duration: {
            type: Number, 
            required: true,
        },
        description: {
            type: String,
        },
        notes: {
            type: String,
        },
        order: {
            type: Number,
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

const Lesson = mongoose.model('Lesson', lessonSchema);
module.exports = Lesson;
