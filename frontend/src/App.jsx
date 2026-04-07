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

// Protected Route Component with role support
function ProtectedRoute({ children, requiredRole = 'therapist' }) {
  const isAuthenticated = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

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
          
          {/* Auth Route - Always accessible, even when logged in */}
          <Route path="/auth" element={<Auth />} />
          
          {/* Therapist Dashboard - Protected */}
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRole="therapist">
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* Task One - Word Reading Assessment */}
          <Route path="/tasks/task-one" element={<TaskOne />} />
          
          {/* Parent Dashboard - Protected */}
          <Route path="/parent-dashboard" element={
            <ProtectedRoute requiredRole="parent">
              <ParentDashboard />
            </ProtectedRoute>
          } />
          
          {/* Reading Adventure - Public route (no login required) */}
          <Route path="/adventure" element={
            <ReadingAdventure />
          } />
          
          {/* Start Assessment Page */}
          <Route path="/start-assessment" element={<StartAssessment />} />
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;