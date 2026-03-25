const Event = require('../models/Event');

const getUpcomingEvents = async (req, res) => {
    try {
        const events = await Event.find({ date: { $gte: new Date() } }).populate('artist', 'name');
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const purchaseEventTicket = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        
        if (!event.attendees.includes(req.user._id)) {
            event.attendees.push(req.user._id);
            await event.save();
        }
        res.json({ message: 'Ticket purchased successfully', event });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getUpcomingEvents, purchaseEventTicket };
