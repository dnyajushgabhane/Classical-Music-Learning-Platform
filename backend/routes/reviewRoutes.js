const express = require('express');
const router = express.Router();
const { createOrUpdateReview, getCourseReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createOrUpdateReview);
router.route('/course/:courseId').get(getCourseReviews);

module.exports = router;
