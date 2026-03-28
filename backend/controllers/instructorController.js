const User = require('../models/User');
const CoursePurchase = require('../models/CoursePurchase');
const Course = require('../models/Course');
const Review = require('../models/Review');
const ScheduledSession = require('../models/ScheduledSession');

const getStudentStats = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Core filter rule: only role Student, not soft-deleted, no test accounts
        const baseQuery = {
            role: { $regex: /^student$/i },
            isDeleted: { $ne: true },
            email: { $not: /test/i },
            name: { $not: /test/i }
        };

        const totalStudents = await User.countDocuments(baseQuery);

        const activeStudents = await User.countDocuments({
            ...baseQuery,
            lastLoginAt: { $gte: sevenDaysAgo }
        });

        // enrolledStudents = students enrolled in at least one course
        // Paid course purchases represent enrollment. 
        // Using distinct to get unique user IDs, then intersecting with our valid students
        const enrolledUserIds = await CoursePurchase.distinct('user', { status: 'Paid' });
        
        const enrolledStudents = await User.countDocuments({
            ...baseQuery,
            _id: { $in: enrolledUserIds }
        });

        // Get Instructor's courses to scope revenue calculation
        const instructorCourses = await Course.find({ instructor: req.user._id }).select('_id title');
        const courseIds = instructorCourses.map(c => c._id);

        const paidPurchasesForInstructor = await CoursePurchase.find({ 
            course: { $in: courseIds },
            status: 'Paid' 
        })
        .populate('user', 'name email role isDeleted')
        .populate('course', 'title price')
        .sort({ updatedAt: -1 });

        const totalRevenue = paidPurchasesForInstructor.reduce((acc, p) => acc + (p.amount || 0), 0);
        
        const revenueEntries = paidPurchasesForInstructor.map(p => ({
            _id: p._id,
            studentName: p.user?.name || 'Unknown Student',
            studentEmail: p.user?.email || 'N/A',
            courseTitle: p.course?.title || 'Unknown Course',
            amount: p.amount,
            date: p.updatedAt,
        }));

        res.json({
            totalStudents,
            activeStudents,
            enrolledStudents,
            totalRevenue,
            revenueEntries,
            students,
        });
    } catch (error) {
        console.error('getStudentStats Error:', error);
        res.status(500).json({ message: 'Server Error fetching student stats', error: error.message });
    }
};

const getCourseRatingSummary = async (req, res) => {
    try {
        const { courseId } = req.params;
        
        // Ensure course belongs to this instructor
        const course = await Course.findOne({ _id: courseId, instructor: req.user._id });
        if (!course) {
            return res.status(404).json({ message: 'Course not found or unauthorized' });
        }

        const reviews = await Review.find({ course: courseId })
            .populate('user', 'name')
            .sort({ createdAt: -1 });

        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews) : 0;
        
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(r => distribution[r.rating]++);

        res.json({
            courseTitle: course.title,
            averageRating: averageRating.toFixed(1),
            totalReviews,
            distribution,
            reviews
        });
    } catch (error) {
        console.error('getCourseRatingSummary Error:', error);
        res.status(500).json({ message: 'Server Error fetching rating summary' });
    }
};

const getInstructorDashboardStats = async (req, res) => {
    try {
        const instructorId = req.user._id;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // 1. Get Instructor's courses
        const instructorCourses = await Course.find({ instructor: instructorId }).select('_id status rating');
        const courseIds = instructorCourses.map(c => c._id);

        // 2. Aggregate Revenue
        const revenueAggregate = await CoursePurchase.aggregate([
            { $match: { course: { $in: courseIds }, status: 'Paid' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);

        // 3. Aggregate Student Counts (Distinct students enrolled in instructor's courses)
        const studentAggregate = await CoursePurchase.aggregate([
            { $match: { course: { $in: courseIds }, status: 'Paid' } },
            { $group: { _id: '$user' } },
            { $count: 'total' }
        ]);

        // 4. Calculate Average Rating
        const avgRating = instructorCourses.length > 0 
            ? (instructorCourses.reduce((acc, c) => acc + (c.rating || 0), 0) / instructorCourses.length).toFixed(1)
            : '0.0';

        // 5. Active Courses Count
        const activeCourses = instructorCourses.filter(c => c.status === 'active').length;

        // 6. Recent Revenue Entries (for the card trend display if needed)
        const recentRevenue = await CoursePurchase.find({ course: { $in: courseIds }, status: 'Paid' })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name');

        res.json({
            stats: {
                totalStudents: studentAggregate[0]?.total || 0,
                activeCourses,
                avgRating,
                totalRevenue: revenueAggregate[0]?.total || 0,
                enrollmentCount: revenueAggregate[0]?.count || 0,
            },
            recentRevenue: recentRevenue.map(r => ({
                amount: r.amount,
                student: r.user?.name || 'Student',
                date: r.createdAt
            }))
        });
    } catch (error) {
        console.error('getInstructorDashboardStats Error:', error);
        res.status(500).json({ message: 'Error fetching dashboard stats' });
    }
};

const getStudentAnalytics = async (req, res) => {
    try {
        const instructorId = req.user._id;
        const courses = await Course.find({ instructor: instructorId }).select('_id');
        const courseIds = courses.map(c => c._id);

        // Group enrollments by month for the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        const analytics = await CoursePurchase.aggregate([
            { 
                $match: { 
                    course: { $in: courseIds }, 
                    status: 'Paid',
                    createdAt: { $gte: sixMonthsAgo }
                } 
            },
            {
                $group: {
                    _id: {
                        month: { $month: '$createdAt' },
                        year: { $year: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.json(analytics.map(a => ({
            month: new Date(a._id.year, a._id.month - 1).toLocaleString('default', { month: 'short' }),
            students: a.count
        })));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching student analytics' });
    }
};

const getRevenueAnalytics = async (req, res) => {
    try {
        const instructorId = req.user._id;
        const courses = await Course.find({ instructor: instructorId }).select('_id');
        const courseIds = courses.map(c => c._id);

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        const analytics = await CoursePurchase.aggregate([
            { 
                $match: { 
                    course: { $in: courseIds }, 
                    status: 'Paid',
                    createdAt: { $gte: sixMonthsAgo }
                } 
            },
            {
                $group: {
                    _id: {
                        month: { $month: '$createdAt' },
                        year: { $year: '$createdAt' }
                    },
                    amount: { $sum: '$amount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.json(analytics.map(a => ({
            month: new Date(a._id.year, a._id.month - 1).toLocaleString('default', { month: 'short' }),
            revenue: a.amount
        })));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching revenue analytics' });
    }
};

const getActivityFeed = async (req, res) => {
    try {
        const instructorId = req.user._id;
        const courses = await Course.find({ instructor: instructorId }).select('_id title');
        const courseIds = courses.map(c => c._id);

        // Concurrent fetch for efficiency
        const [purchases, reviews, sessions] = await Promise.all([
            CoursePurchase.find({ course: { $in: courseIds }, status: 'Paid' })
                .sort({ createdAt: -1 }).limit(10).populate('user', 'name').populate('course', 'title'),
            Review.find({ course: { $in: courseIds } })
                .sort({ createdAt: -1 }).limit(10).populate('user', 'name').populate('course', 'title'),
            ScheduledSession.find({ instructor: instructorId })
                .sort({ createdAt: -1 }).limit(10)
        ]);

        const activities = [
            ...purchases.map(p => ({
                id: p._id,
                type: 'enrollment',
                title: 'New Enrollment',
                description: `${p.user?.name || 'Student'} enrolled in ${p.course?.title || 'Course'}`,
                date: p.createdAt,
                amount: p.amount
            })),
            ...reviews.map(r => ({
                id: r._id,
                type: 'review',
                title: 'New Review',
                description: `${r.user?.name || 'Student'} rated ${r.course?.title || 'Course'} ${r.rating} stars`,
                date: r.createdAt,
                meta: { rating: r.rating }
            })),
            ...sessions.map(s => ({
                id: s._id,
                type: 'session',
                title: 'Session Scheduled',
                description: `New masterclass scheduled: ${s.title}`,
                date: s.createdAt,
                meta: { status: s.status }
            }))
        ].sort((a, b) => b.date - a.date).slice(0, 15);

        res.json(activities);
    } catch (error) {
        console.error('getActivityFeed Error:', error);
        res.status(500).json({ message: 'Error fetching activity feed' });
    }
};

const getRevenueDetails = async (req, res) => {
    try {
        const instructorId = req.user._id;
        const courses = await Course.find({ instructor: instructorId }).select('_id');
        const courseIds = courses.map(c => c._id);

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const purchases = await CoursePurchase.find({ course: { $in: courseIds }, status: 'Paid' })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user', 'name email')
            .populate('course', 'title');

        const total = await CoursePurchase.countDocuments({ course: { $in: courseIds }, status: 'Paid' });

        res.json({
            entries: purchases.map(p => ({
                _id: p._id,
                studentName: p.user?.name || 'Unknown',
                studentEmail: p.user?.email,
                courseTitle: p.course?.title,
                amount: p.amount,
                status: p.status,
                date: p.createdAt
            })),
            total,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching revenue details' });
    }
};

module.exports = {
    getStudentStats,
    getCourseRatingSummary,
    getInstructorDashboardStats,
    getStudentAnalytics,
    getRevenueAnalytics,
    getActivityFeed,
    getRevenueDetails
};
