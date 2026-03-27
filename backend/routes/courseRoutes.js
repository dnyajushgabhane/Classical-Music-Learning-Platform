const express = require('express');
const router = express.Router();
const { getCourses, getCourseById, createCourse, updateCourse, deleteCourse, createCourseOrder, verifyCoursePayment } = require('../controllers/courseController');
const { protect, instructor } = require('../middleware/authMiddleware');

router.route('/').get(getCourses).post(protect, instructor, createCourse);
router.route('/:id')
  .get(getCourseById)
  .put(protect, instructor, updateCourse)
  .delete(protect, instructor, deleteCourse);

router.route('/:id/razorpay/order').post(protect, createCourseOrder);
router.route('/:id/razorpay/verify').post(protect, verifyCoursePayment);

module.exports = router;
