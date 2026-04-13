const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/classical-music-learning');
    const user = await User.findOne({ email: 'dnyajushgabhane@gmail.com' }).lean();
    console.log('User record:', user);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
})();
