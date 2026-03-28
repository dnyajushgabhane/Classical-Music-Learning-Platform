const mongoose = require('mongoose');

const coursePurchaseSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['Created', 'Paid', 'Failed'],
      default: 'Created',
    },
  },
  {
    timestamps: true,
  }
);

coursePurchaseSchema.index({ course: 1, status: 1, createdAt: -1 });
coursePurchaseSchema.index({ user: 1, status: 1 });
coursePurchaseSchema.index({ createdAt: -1 });

const CoursePurchase = mongoose.model('CoursePurchase', coursePurchaseSchema);
module.exports = CoursePurchase;
