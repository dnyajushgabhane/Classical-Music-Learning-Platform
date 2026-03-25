# Raag Vidya - Classical Music Learning Platform

A premium, production-grade learning platform for Indian Classical Music using the MERN stack.

## Architecture & Tech Stack

**Frontend (React/Vite):**
- React 18 & React Router DOM v6
- Tailwind CSS v3 (Custom deep black & gold theme)
- Framer Motion (Animations)
- Zustand (Global State Management)
- React Query (Data Fetching & Caching)
- Socket.io Client (Real-time live classes)

**Backend (Node.js/Express):**
- Express.js (MVC Architecture)
- MongoDB & Mongoose
- JSON Web Tokens (JWT) for Role-Based Access
- Socket.io (Real-time communication, Hand Raise, Live Chat)
- Bcrypt.js (Password Hashing)

## Quick Start Guide

### 1. Start the Backend

```bash
cd backend
npm install
npm run dev
```
*(The backend will run on http://localhost:5000)*

### 2. Start the Frontend

Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*(The frontend will run on http://localhost:5173)*

### Features Included:
- **Authentication:** JWT based role access logic for Student, Instructor, and Admin limits.
- **Premium UI:** Glassmorphism, deep charcoal blacks, and gold accents (`#C9A34E`) across all components. Responsive and interactive elements via Framer Motion. 
- **Course Marketplace:** Explore and fetch course details.
- **Student Dashboard:** Track Riyaaz streaks and continue learning progress.
- **Live Gurukul:** Join live sessions with real-time text chat and "Raise Hand" capability via Socket.io.
