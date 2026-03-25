const Subscription = require('../models/Subscription');

const getSubscriptionStatus = async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ user: req.user._id });
        if (subscription) {
            res.json(subscription);
        } else {
            res.json({ tier: 'Free', status: 'None' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const upgradeSubscription = async (req, res) => {
    try {
        const { tier } = req.body;
        
        let subscription = await Subscription.findOne({ user: req.user._id });
        
        if (subscription) {
            subscription.tier = tier;
            subscription.status = 'Active';
            subscription.validUntil = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        } else {
            subscription = new Subscription({
                user: req.user._id,
                tier,
                status: 'Active',
                validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            });
        }

        const upgradedSub = await subscription.save();
        res.json(upgradedSub);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getSubscriptionStatus, upgradeSubscription };
