const express = require('express');
const router = express.Router();
const { addMasterclass, getMasterclasses, getVideoInfo } = require('../controllers/masterclassController');
const { protect, instructor } = require('../middleware/authMiddleware');

router.post('/', protect, instructor, addMasterclass);
router.get('/', getMasterclasses);
router.get('/info', protect, instructor, getVideoInfo);

module.exports = router;
