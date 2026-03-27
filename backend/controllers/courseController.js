const Course = require('../models/Course');
const Subscription = require('../models/Subscription');
const CoursePurchase = require('../models/CoursePurchase');

const Razorpay = require('razorpay');
const crypto = require('crypto');

const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

const getCourses = async (req, res) => {
    const { instrument, level, raag, mood, composer, q } = req.query;
    let query = {};
    if (instrument) query.instrument = instrument;
    if (level) query.level = level;
    if (raag) query.raag = raag;
    if (mood) query.mood = mood;
    if (composer) query.composer = { $regex: composer, $options: 'i' };
    if (q) {
        query.$or = [
            { title: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } }
        ];
    }

    try {
        const courses = await Course.find(query).populate('instructor', 'name');
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'name')
            .populate('lessons');
            
        if (!course) return res.status(404).json({ message: 'Course not found' });

        // Check premium access
        let hasPremiumAccess = false;

        if (course.isPremium) {
            if (!req.user) {
                return res.status(401).json({ message: 'Authentication required for premium content' });
            }

            const subscription = await Subscription.findOne({ user: req.user._id });
            const hasActiveSubscription = subscription && subscription.tier === 'Premium' && subscription.status === 'Active';
            const hasCoursePurchase = await CoursePurchase.findOne({ user: req.user._id, course: course._id, status: 'Paid' });

            if (!hasActiveSubscription && !hasCoursePurchase) {
                return res.status(403).json({ 
                    message: 'Premium subscription or purchased course required', 
                    isPremiumRequired: true,
                    course: { _id: course._id, title: course.title, thumbnail: course.thumbnail },
                });
            }

            hasPremiumAccess = true;
        }

        const courseResponse = course.toObject ? course.toObject() : course;
        courseResponse.hasPremiumAccess = hasPremiumAccess;
        res.json(courseResponse);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const createCourseOrder = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (!course.isPremium || !course.price || course.price <= 0) {
            return res.status(400).json({ message: 'This course is not eligible for Razorpay checkout' });
        }

        const razorpay = getRazorpayInstance();
        if (!razorpay) {
            return res.status(500).json({ message: 'Razorpay keys are not configured on server' });
        }

        const options = {
            amount: Math.round(course.price * 100),
            currency: 'INR',
            receipt: `course_${course._id}_user_${req.user._id}_${Date.now()}`,
            payment_capture: 1,
        };

        const order = await razorpay.orders.create(options);

        if (!order) {
            return res.status(500).json({ message: 'Failed to create Razorpay order' });
        }

        await CoursePurchase.findOneAndUpdate(
            { user: req.user._id, course: course._id },
            {
                razorpayOrderId: order.id,
                amount: order.amount,
                currency: order.currency,
                status: 'Created',
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({
            key: process.env.RAZORPAY_KEY_ID,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            courseId: course._id,
            courseTitle: course.title,
        });
    } catch (error) {
        console.error('createCourseOrder', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const verifyCoursePayment = async (req, res) => {
    try {
        const courseId = req.params.id;
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        if (!courseId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return res.status(400).json({ message: 'Missing required payment details' });
        }

        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) {
            return res.status(500).json({ message: 'Razorpay key secret not configured on server' });
        }

        const generatedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Invalid Razorpay signature' });
        }

        const purchase = await CoursePurchase.findOne({
            user: req.user._id,
            course: courseId,
            razorpayOrderId: razorpay_order_id,
        });

        if (!purchase) {
            return res.status(404).json({ message: 'Purchase record not found' });
        }

        purchase.razorpayPaymentId = razorpay_payment_id;
        purchase.razorpaySignature = razorpay_signature;
        purchase.status = 'Paid';
        await purchase.save();

        let subscription = await Subscription.findOne({ user: req.user._id });
        if (!subscription) {
            subscription = new Subscription({
                user: req.user._id,
                tier: 'Premium',
                status: 'Active',
                validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            });
        } else {
            subscription.tier = 'Premium';
            subscription.status = 'Active';
            subscription.validUntil = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        }

        await subscription.save();

        res.json({ success: true, message: 'Payment verified and premium access granted' });
    } catch (error) {
        console.error('verifyCoursePayment', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const createCourse = async (req, res) => {
    try {
        const { title, price, category, instrument, level, raag, thumbnail, description, isPremium } = req.body;

        const course = new Course({
            title,
            price,
            category,
            instrument,
            level,
            raag,
            thumbnail,
            description,
            isPremium,
            instructor: req.user._id,
        });

        const createdCourse = await course.save();
        res.status(201).json(createdCourse);
    } catch (error) {
        res.status(500).json({ message: 'Error creating course' });
    }
};

const updateCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        // Only instructor of the course can update
        if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized to update this course' });
        }

        const { title, price, category, instrument, level, raag, thumbnail, description, isPremium } = req.body;
        
        course.title = title || course.title;
        course.price = price || course.price;
        course.category = category || course.category;
        course.instrument = instrument || course.instrument;
        course.level = level || course.level;
        course.raag = raag || course.raag;
        course.thumbnail = thumbnail || course.thumbnail;
        course.description = description || course.description;
        course.isPremium = isPremium !== undefined ? isPremium : course.isPremium;

        const updatedCourse = await course.save();
        res.json(updatedCourse);
    } catch (error) {
        res.status(500).json({ message: 'Error updating course' });
    }
};

const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized to delete this course' });
        }

        await course.deleteOne();
        res.json({ message: 'Course removed' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting course' });
    }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  createCourseOrder,
  verifyCoursePayment,
};
