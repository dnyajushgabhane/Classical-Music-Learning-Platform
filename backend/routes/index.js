const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const courseRoutes = require('./courseRoutes');
const eventRoutes = require('./eventRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');
const liveSessionRoutes = require('./liveSessionRoutes');
const instructorRoutes = require('./instructorRoutes');
const reviewRoutes = require('./reviewRoutes');
const sessionRoutes = require('./sessionRoutes');
const masterclassRoutes = require('./masterclassRoutes');

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/events', eventRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/live-sessions', liveSessionRoutes);
router.use('/instructor', instructorRoutes);
router.use('/reviews', reviewRoutes);
router.use('/sessions', sessionRoutes);
router.use('/masterclass', masterclassRoutes);

module.exports = router;
