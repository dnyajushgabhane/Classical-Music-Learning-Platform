const express = require('express');
const router = express.Router();
const { 
    getStudentStats, 
    getCourseRatingSummary,
    getInstructorDashboardStats,
    getStudentAnalytics,
    getRevenueAnalytics,
    getActivityFeed,
    getRevenueDetails
} = require('../controllers/instructorController');
const { protect, instructor } = require('../middleware/authMiddleware');

router.route('/stats/students').get(protect, instructor, getStudentStats);
router.route('/dashboard-stats').get(protect, instructor, getInstructorDashboardStats);
router.route('/analytics/students').get(protect, instructor, getStudentAnalytics);
router.route('/analytics/revenue').get(protect, instructor, getRevenueAnalytics);
router.route('/activity').get(protect, instructor, getActivityFeed);
router.route('/revenue/details').get(protect, instructor, getRevenueDetails);
router.route('/courses/:courseId/rating-summary').get(protect, instructor, getCourseRatingSummary);

module.exports = router;
