import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/variables.css';
import './styles/reset.css';
import './styles/typography.css';
import './App.css';
import { Navigation } from './components/Navigation/Navigation';
import { Hero } from './components/Hero/Hero';
import { Features } from './components/Features/Features';
import { HowItWorks } from './components/HowItWorks/HowItWorks';
import { About } from './components/About/About';
import { StatsGrid } from './components/StatsGrid/StatsGrid';
import { Auth } from './components/Auth/Auth';
import { CTA } from './components/CTA/CTA';
import { Footer } from './components/Footer/Footer';
import Dashboard from './components/Dashboard/Dashboard';
import ReadingAdventure from './components/ReadingAdventure/ReadingAdventure';
import ParentDashboard from './components/ParentDashboard/ParentDashboard';
import StartAssessment from './components/StartAssessment/StartAssessment';
import QuizPage from './components/QuizPage/QuizPage';
import TaskOne from './components/tasks/TaskOne';
import EnhancedVoiceReading from './components/tasks/EnhancedVoiceReading';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AuditLog from './pages/AuditLog';
import { PrivateRoute, RoleRoute, PublicRoute } from './components/RouteGuards';

function App() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Home Page Route - Public */}
          <Route path="/" element={
            <>
              <Navigation scrollY={scrollY} />
              <Hero />
              <Features />
              <HowItWorks />
              <About />
              <StatsGrid />
              <CTA />
              <Footer />
            </>
          } />
          
          {/* Quiz Page Route - Public */}
          <Route path="/quiz" element={<QuizPage />} />
          
          {/* Reading Adventure - Public route (no login required) */}
          <Route path="/adventure" element={<ReadingAdventure />} />
          
          {/* Auth Route - Redirects to dashboard if already logged in */}
          <Route path="/auth" element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          } />
          
          {/* Forgot Password - Public */}
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } />
          
          {/* Reset Password - Public (with token) */}
          <Route path="/reset-password/:token" element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          } />
          
          {/* Therapist Dashboard - Protected */}
          <Route path="/dashboard" element={
            <RoleRoute allowedRole="therapist">
              <Dashboard />
            </RoleRoute>
          } />
          
          {/* Audit Log - Therapist Only */}
          <Route path="/audit-log" element={
            <RoleRoute allowedRole="therapist">
              <AuditLog />
            </RoleRoute>
          } />
          
          {/* Tasks - Therapist Only */}
          <Route path="/tasks/enhanced-voice" element={
            <RoleRoute allowedRole="therapist">
              <EnhancedVoiceReading />
            </RoleRoute>
          } />
          
          {/* Task One - Word Reading Assessment - Therapist Only */}
          <Route path="/tasks/task-one" element={
            <RoleRoute allowedRole="therapist">
              <TaskOne />
            </RoleRoute>
          } />
          
          {/* Parent Dashboard - Protected */}
          <Route path="/parent-dashboard" element={
            <RoleRoute allowedRole="parent">
              <ParentDashboard />
            </RoleRoute>
          } />
          
          {/* Start Assessment Page - Parent only */}
          <Route path="/start-assessment" element={
            <RoleRoute allowedRole="parent">
              <StartAssessment />
            </RoleRoute>
          } />
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;