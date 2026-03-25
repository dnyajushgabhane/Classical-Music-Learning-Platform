const Subscription = require('../models/Subscription');

const premiumOnly = async (req, res, next) => {
    try {
        const subscription = await Subscription.findOne({ user: req.user._id });
        
        if (subscription && subscription.tier === 'Premium' && subscription.status === 'Active') {
            next();
        } else {
            res.status(403).json({ 
                message: 'Access Denied: This content requires a Premium subscription.',
                isPremiumRequired: true
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error verifying subscription status' });
    }
};

module.exports = { premiumOnly };
