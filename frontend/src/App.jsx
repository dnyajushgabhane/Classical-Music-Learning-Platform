import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PageMotionLayout from './components/layout/PageMotionLayout';
import CursorGlow from './components/effects/CursorGlow';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalSocketListener from './components/GlobalSocketListener';

// Lazy load pages for performance
const Home = lazy(() => import('./pages/Home'));
const Courses = lazy(() => import('./pages/Courses'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const InstructorDashboard = lazy(() => import('./pages/InstructorDashboard'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const LiveClass = lazy(() => import('./pages/LiveClass'));
const LiveSessionPage = lazy(() => import('./pages/LiveSessionPage'));
const LiveConcerts = lazy(() => import('./pages/LiveConcerts'));
const PracticeRoom = lazy(() => import('./pages/PracticeRoom'));
const Pricing = lazy(() => import('./pages/Pricing'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex h-[60vh] w-full items-center justify-center">
    <div className="relative h-12 w-12">
      <div className="absolute inset-0 animate-ping rounded-full bg-gold/20" />
      <div className="relative h-12 w-12 animate-spin rounded-full border-2 border-gold/40 border-t-gold" />
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-right" reverseOrder={false} />
      <GlobalSocketListener />
      <div className="min-h-screen flex flex-col relative bg-page">
        <CursorGlow />
        <Navbar />
        <main className="flex-1 w-full">
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}

export default App;

