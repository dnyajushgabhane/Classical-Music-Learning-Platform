const Course = require('../models/Course');
const Subscription = require('../models/Subscription');

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
        if (course.isPremium) {
            // Need a user to check subscription
            // We'll require authentication for premium courses
            if (!req.user) {
                return res.status(401).json({ message: 'Authentication required for premium content' });
            }

            const subscription = await Subscription.findOne({ user: req.user._id });
            if (!subscription || subscription.tier !== 'Premium' || subscription.status !== 'Active') {
                return res.status(403).json({ 
                    message: 'Premium subscription required', 
                    isPremiumRequired: true,
                    course: { _id: course._id, title: course.title, thumbnail: course.thumbnail } 
                });
            }
        }

        res.json(course);
    } catch (error) {
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

module.exports = { getCourses, getCourseById, createCourse, updateCourse, deleteCourse };
