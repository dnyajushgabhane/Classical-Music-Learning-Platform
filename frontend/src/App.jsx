import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PageMotionLayout from './components/layout/PageMotionLayout';
import CursorGlow from './components/effects/CursorGlow';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Courses from './pages/Courses';
import Dashboard from './pages/Dashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import LiveClass from './pages/LiveClass';
import LiveSessionPage from './pages/LiveSessionPage';
import LiveConcerts from './pages/LiveConcerts';
import PracticeRoom from './pages/PracticeRoom';
import Pricing from './pages/Pricing';
import GlobalSocketListener from './components/GlobalSocketListener';

function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-right" reverseOrder={false} />
      <GlobalSocketListener />
      <div className="min-h-screen flex flex-col relative">
        <CursorGlow />
        <Navbar />
        <main className="flex-1 w-full">
          <Routes>
            <Route element={<PageMotionLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/courses" element={<Courses />} />
            </Route>
            <Route path="/events" element={<LiveConcerts />} />
            <Route path="/practice" element={<PracticeRoom />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/instructor-dashboard" element={<InstructorDashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/live-class" element={<LiveClass />} />
            <Route path="/live/:roomId" element={<LiveClass />} />
            <Route path="/classroom/:sessionId" element={<LiveSessionPage />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}

export default App;
