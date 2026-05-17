// frontend/src/App.jsx
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
import StartAssessment from './components/Startassessment/Startassessment';
import ChildInfo from './components/ChildInfoPage/ChildInfo.jsx';
import QuizPage from './components/QuizPage/QuizPage';
import TaskOne from './components/tasks/TaskOne';
import EnhancedVoiceReading from './components/tasks/EnhancedVoiceReading';
import TaskThree from './components/tasks/TaskThree';
import TaskFour from './components/tasks/TaskFour';
import AssessmentResults from './components/AssessmentResults/AssessmentResults.jsx';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AuditLog from './pages/AuditLog';
import { PrivateRoute, RoleRoute, PublicRoute } from './components/RouteGuards';
import SpellingBagGame from './components/ParentDashboard/SpellingBagGame';
import AlphabetSwipe from "./components/Activities/AlphabetSwipe";
import SyllableBreaking from "./components/Activities/SyllableBreaking";
import GoogleCallback from './pages/GoogleCallback';


function App() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Router>
      <div className="app">
        <Routes>
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
          
          <Route path="/home" element={<Navigate to="/" replace />} />
          
          <Route path="/child-info" element={<ChildInfo />} />
          <Route path="/start-assessment" element={<StartAssessment />} />
          <Route path="/start" element={<Navigate to="/start-assessment" replace />} />
          <Route path="/adventure" element={<ReadingAdventure />} />
          
          <Route path="/tasks/task-one" element={<TaskOne />} />
          <Route path="/tasks/enhanced-voice" element={<EnhancedVoiceReading />} />
          <Route path="/tasks/task-three" element={<TaskThree />} />
          <Route path="/tasks/task-four" element={<TaskFour />} />
          
          <Route path="/assessment/results" element={<AssessmentResults />} />
          <Route path="/assessment/summary" element={<Navigate to="/assessment/results" replace />} />
          
          <Route path="/quiz" element={<QuizPage />} />
          
          <Route path="/spelling-bag" element={<SpellingBagGame />} />
          
          <Route path="/auth" element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          } />

          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } />
          
          <Route path="/reset-password/:token" element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          } />
          
          <Route path="/dashboard" element={
            <RoleRoute allowedRole="therapist">
              <Dashboard />
            </RoleRoute>
          } />
          
          <Route path="/audit-log" element={
            <RoleRoute allowedRole="therapist">
              <AuditLog />
            </RoleRoute>
          } />
          
        
         <Route path="/activity/syllable-breaking" element={<SyllableBreaking />} />
              <Route path="/activity/letter-sound" element={<AlphabetSwipe />} />
              <Route path="/activity/syllable-breaking" element={<SyllableBreaking />} />
          <Route path="/parent-dashboard" element={
            <RoleRoute allowedRole="parent">
              <ParentDashboard />
            </RoleRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;