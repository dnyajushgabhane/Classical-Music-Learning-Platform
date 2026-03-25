const express = require('express');
const router = express.Router();
const { getCourses, getCourseById, createCourse, updateCourse, deleteCourse } = require('../controllers/courseController');
const { protect, instructor } = require('../middleware/authMiddleware');

router.route('/').get(getCourses).post(protect, instructor, createCourse);
router.route('/:id')
  .get(getCourseById)
  .put(protect, instructor, updateCourse)
  .delete(protect, instructor, deleteCourse);

module.exports = router;
