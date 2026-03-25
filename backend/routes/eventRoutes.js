const express = require('express');
const router = express.Router();
const { getUpcomingEvents, purchaseEventTicket } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(getUpcomingEvents);
router.route('/:id/purchase').post(protect, purchaseEventTicket);

module.exports = router;
