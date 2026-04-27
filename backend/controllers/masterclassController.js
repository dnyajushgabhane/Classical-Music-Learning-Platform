const Masterclass = require('../models/Masterclass');
const axios = require('axios');

// @desc    Add a new masterclass
// @route   POST /api/masterclass
// @access  Private (Instructor)
exports.addMasterclass = async (req, res) => {
  try {
    const { title, youtubeUrl, videoId, thumbnail, instructorId, subtitle, tag } = req.body;

    // Check if video already exists
    const existingVideo = await Masterclass.findOne({ videoId });
    if (existingVideo) {
      return res.status(400).json({ message: 'This video has already been added to masterclasses.' });
    }

    const masterclass = new Masterclass({
      title,
      youtubeUrl,
      videoId,
      thumbnail,
      instructorId,
      subtitle,
      tag
    });

    const savedMasterclass = await masterclass.save();
    res.status(201).json(savedMasterclass);
  } catch (error) {
    console.error('Error adding masterclass:', error);
    res.status(500).json({ message: 'Server error while adding masterclass' });
  }
};

// @desc    Get all masterclasses
// @route   GET /api/masterclass
// @access  Public
exports.getMasterclasses = async (req, res) => {
  try {
    const masterclasses = await Masterclass.find().sort({ createdAt: -1 });
    res.status(200).json(masterclasses);
  } catch (error) {
    console.error('Error fetching masterclasses:', error);
    res.status(500).json({ message: 'Server error while fetching masterclasses' });
  }
};

// Bonus: Auto-fetch video title and duration using oEmbed or YouTube API
// For simplicity and to avoid requiring a YouTube API key, we can use oEmbed
exports.getVideoInfo = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ message: 'URL is required' });

    const response = await axios.get(`https://www.youtube.com/oembed?url=${url}&format=json`);
    res.status(200).json({
      title: response.data.title,
      author: response.data.author_name,
      thumbnail: response.data.thumbnail_url
    });
  } catch (error) {
    console.error('Error fetching video info:', error);
    res.status(400).json({ message: 'Could not fetch video info' });
  }
};
