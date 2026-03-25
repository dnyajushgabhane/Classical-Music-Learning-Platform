const express = require('express');
const router = express.Router();
const { getSubscriptionStatus, upgradeSubscription } = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getSubscriptionStatus);
router.route('/upgrade').post(protect, upgradeSubscription);

module.exports = router;
