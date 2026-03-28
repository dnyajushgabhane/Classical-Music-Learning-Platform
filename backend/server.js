const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const cookieParser = require('cookie-parser');

dotenv.config();

const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const eventRoutes = require('./routes/eventRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const liveSessionRoutes = require('./routes/liveSessionRoutes');

const { initLiveSocket } = require('./socket/liveSocket');
const { apiLimiter, authLimiter } = require('./middleware/rateLimitMiddleware');

const app = express();


// 🔥 CONNECT DATABASE FIRST
connectDB();


// 🔍 Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});


// 🔐 Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);


// 🚦 Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);


const path = require('path');

// 🧠 Body parser
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// 📁 Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// 🌐 CORS (IMPORTANT for frontend)
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);


// ✅ Root route
app.get('/', (req, res) => {
  res.send('Classical Music Learning Platform API is running');
});


// ✅ HEALTH ROUTE (VERY IMPORTANT FOR DOCKER)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});


const instructorRoutes = require('./routes/instructorRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

// 🚀 API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/live-sessions', liveSessionRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/sessions', sessionRoutes);


// ❌ 404 handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});


// ❌ Error handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});


// 🌐 Create HTTP server
const server = http.createServer(app);


// 🔌 Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.set('io', io);
initLiveSocket(io);


// 🚀 Start server
const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


// 🛑 Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});


// ❗ Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  console.error(err.stack);
});


// ❗ Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`❌ Uncaught Exception: ${err.message}`);
  console.error(err.stack);
});