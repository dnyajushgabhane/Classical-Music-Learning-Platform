const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');

dotenv.config();

const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const { initLiveSocket } = require('./socket/liveSocket');

connectDB();

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Classical Music Learning Platform API is running');
});

const eventRoutes = require('./routes/eventRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const liveSessionRoutes = require('./routes/liveSessionRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/live-sessions', liveSessionRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);
initLiveSocket(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
