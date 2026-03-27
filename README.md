# Raag Vidya - Classical Music Learning Platform with Video Conferencing

A premium, production-grade learning platform for Indian Classical Music using the MERN stack with integrated real-time video conferencing.

## Architecture & Tech Stack

**Frontend (React/Vite):**
- React 18 & React Router DOM v6
- Tailwind CSS v3 (Custom deep black & gold theme)
- Framer Motion (Animations)
- Zustand (Global State Management)
- React Query (Data Fetching & Caching)
- Socket.io Client (Real-time live classes)
- LiveKit Client (WebRTC SFU for video conferencing)
- Web Audio API (Noise suppression)
- Canvas API (Background blur)

**Backend (Node.js/Express):**
- Express.js (MVC Architecture)
- MongoDB & Mongoose
- JSON Web Tokens (JWT) for Role-Based Access
- Socket.io (Real-time communication, Hand Raise, Live Chat)
- LiveKit Server SDK (SFU management)
- Bcrypt.js (Password Hashing)
- Express Rate Limit (Security)

**Media/Streaming:**
- LiveKit SFU (Scalable WebRTC)
- WebRTC APIs (Peer-to-peer with SFU fallback)
- Adaptive bitrate streaming
- Simulcast support

**DevOps:**
- Docker & Docker Compose
- Nginx (Frontend serving)
- MongoDB & Redis
- Production-ready configuration

## Features

### 👨‍🏫 Host (Teacher) Features
- Create meeting rooms with unique IDs
- Role-based access control
- Mute/unmute participants remotely
- Remove participants from meetings
- Lock/unlock meeting rooms
- Screen sharing (entire screen, tab, window)
- Real-time collaborative whiteboard
- Server-side recording with download
- Manage raised hands
- Control participant permissions (audio/video/chat)

### 👨‍🎓 Student Features
- Join meetings via ID or invite link
- Toggle microphone and camera
- Raise hand for attention
- Real-time group and private chat
- View screen shares and whiteboard
- Switch between grid and speaker view
- Background blur and noise suppression

### 🎥 Advanced Video Features
- SFU architecture for scalability (50+ participants)
- Low latency (<300ms target)
- Network quality indicators
- Adaptive bitrate
- Simulcast streams
- Reconnection logic

### 🔐 Security & Performance
- JWT-based authentication
- End-to-end encryption (WebRTC DTLS)
- Rate limiting and input validation
- Lazy loading and virtualization
- Memory optimization

## Quick Start Guide

### Prerequisites
- Node.js 18+
- MongoDB
- Redis (optional, for caching)
- LiveKit server (or use self-hosted)

### 1. Environment Setup

Copy the environment file:
```bash
cp .env.example .env
```

Fill in your configuration:
```dotenv
# Database
MONGODB_URI=mongodb://localhost:27017/raagvidya

# JWT
JWT_SECRET=your-super-secret-jwt-key

# LiveKit (for video conferencing)
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
LIVEKIT_URL=ws://localhost:7881

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

### 2. Using Docker (Recommended)

Start all services:
```bash
docker-compose up -d
```

This will start:
- MongoDB on port 27017
- Redis on port 6379
- LiveKit SFU on ports 7880, 7881, 5004
- Backend API on port 5001
- Frontend on port 80

### 3. Manual Setup

#### Start MongoDB & Redis
```bash
# MongoDB
mongod

# Redis (in another terminal)
redis-server
```

#### Start LiveKit Server
```bash
# Download and run LiveKit
docker run --rm -p 7880:7880 -p 7881:7881 -p 5004:5004/udp \
  -e LIVEKIT_KEYS="your-api-key:your-api-secret" \
  livekit/livekit-server:latest
```

#### Start Backend
```bash
cd backend
npm install
npm run dev
```
*(Runs on http://localhost:5001)*

#### Start Frontend
```bash
cd frontend
npm install
npm run dev
```
*(Runs on http://localhost:5173)*

## API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Live Sessions
- `GET /api/live-sessions` - List sessions
- `POST /api/live-sessions` - Create session
- `POST /api/live-sessions/:id/token` - Get LiveKit token
- `POST /api/live-sessions/:id/recording/start` - Start recording
- `POST /api/live-sessions/:id/recording/stop` - Stop recording

### Meeting Management
- `POST /api/live-sessions/:id/lock` - Lock/unlock meeting
- `POST /api/live-sessions/:id/participants/:userId/mute` - Mute participant
- `POST /api/live-sessions/:id/participants/:userId/remove` - Remove participant

## Deployment

### Production Deployment

1. **Environment Variables**: Set production values in `.env`
2. **SSL Certificates**: Configure HTTPS with Let's Encrypt
3. **Reverse Proxy**: Use Nginx or Caddy for SSL termination
4. **Database**: Use MongoDB Atlas or AWS DocumentDB
5. **Redis**: Use Redis Cloud or AWS ElastiCache
6. **LiveKit**: Use LiveKit Cloud or self-host on AWS/GCP

### AWS EC2 Deployment

```bash
# Install Docker
sudo apt update
sudo apt install docker.io docker-compose

# Clone repository
git clone <your-repo>
cd raag-vidya

# Configure environment
cp .env.example .env
# Edit .env with production values

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

## Development

### Code Structure
```
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Authentication & validation
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── socket/          # Real-time handlers
│   └── utils/           # Helper functions
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API calls
│   │   ├── store/       # State management
│   │   └── utils/       # Utilities
│   └── public/          # Static assets
└── docker/              # Docker configurations
```

### Testing
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@raagvidya.com or join our Discord community.

### Features Included:
- **Authentication:** JWT based role access logic for Student, Instructor, and Admin limits.
- **Premium UI:** Glassmorphism, deep charcoal blacks, and gold accents (`#C9A34E`) across all components. Responsive and interactive elements via Framer Motion. 
- **Course Marketplace:** Explore and fetch course details.
- **Student Dashboard:** Track Riyaaz streaks and continue learning progress.
- **Live Gurukul:** Join live sessions with real-time text chat and "Raise Hand" capability via Socket.io.
