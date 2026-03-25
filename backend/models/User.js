const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['Student', 'Instructor', 'Admin'],
            default: 'Student',
        },
        progress: [{
            course: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Course'
            },
            completedLessons: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Lesson'
            }]
        }],
        riyaazStreak: {
            type: Number,
            default: 0
        },
        lastRiyaazDate: {
            type: Date
        }
    },
    {
        timestamps: true,
    }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
module.exports = User;
