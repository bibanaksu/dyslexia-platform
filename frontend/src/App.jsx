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
import { ScreeningQuiz } from './components/ScreeningQuiz/ScreeningQuiz';
import { Auth } from './components/Auth/Auth';
import { CTA } from './components/CTA/CTA';
import { Footer } from './components/Footer/Footer';
import Dashboard from './components/Dashboard/Dashboard';

// Protected Route Component
function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem('token') && 
                         localStorage.getItem('userRole') === 'therapist';
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
}

function App() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Home Page Route */}
          <Route path="/" element={
            <>
              <Navigation scrollY={scrollY} />
              <Hero />
              <Features />
              <HowItWorks />
              <About />
              <StatsGrid />
              <ScreeningQuiz />
              <CTA />
              <Footer />
            </>
          } />
          
          {/* Auth Route */}
          <Route path="/auth" element={<Auth />} />
          
          {/* Protected Dashboard Route */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;