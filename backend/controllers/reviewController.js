const Review = require('../models/Review');
const Course = require('../models/Course');
const CoursePurchase = require('../models/CoursePurchase');
const mongoose = require('mongoose');

const createOrUpdateReview = async (req, res) => {
    try {
        const { courseId, rating, comment } = req.body;
        const userId = req.user._id;

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Verify the student is enrolled
        const hasPurchased = await CoursePurchase.findOne({
            user: userId,
            course: courseId,
            status: 'Paid'
        });

        if (!hasPurchased) {
            return res.status(403).json({ message: 'You must be enrolled to review this course' });
        }

        // Upsert review
        const review = await Review.findOneAndUpdate(
            { user: userId, course: courseId },
            { rating, comment },
            { new: true, upsert: true }
        );

        // Update Course caching securely
        const stats = await Review.aggregate([
            { $match: { course: mongoose.Types.ObjectId(courseId) } },
            { $group: { _id: '$course', averageRating: { $avg: '$rating' }, numReviews: { $sum: 1 } } }
        ]);

        if (stats.length > 0) {
            await Course.findByIdAndUpdate(courseId, {
                rating: stats[0].averageRating,
                numReviews: stats[0].numReviews
            });
        }

        res.status(200).json(review);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getCourseReviews = async (req, res) => {
    try {
        const { courseId } = req.params;
        const reviews = await Review.find({ course: courseId })
            .populate('user', 'name')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { createOrUpdateReview, getCourseReviews };
