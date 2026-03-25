const mongoose = require('mongoose');

const subscriptionSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        tier: {
            type: String,
            required: true,
            enum: ['Free', 'Premium'],
            default: 'Free',
        },
        status: {
            type: String,
            required: true,
            enum: ['Active', 'Canceled', 'Expired'],
            default: 'Active',
        },
        validUntil: {
            type: Date,
        },
        stripeSubscriptionId: {
            type: String,
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
