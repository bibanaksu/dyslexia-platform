import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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

// Layout component to conditionally show Navigation and Footer
function Layout({ children, showNavAndFooter = true, scrollY }) {
  const location = useLocation();
  // Hide nav and footer on auth page
  const shouldShow = showNavAndFooter && location.pathname !== '/auth';

  return (
    <>
      {shouldShow && <Navigation scrollY={scrollY} />}
      {children}
      {shouldShow && <Footer />}
    </>
  );
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
          <Route path="/auth" element={
            <Layout showNavAndFooter={false} scrollY={scrollY}>
              <Auth />
            </Layout>
          } />
          <Route path="/" element={
            <Layout showNavAndFooter={true} scrollY={scrollY}>
              <Hero />
              <Features />
              <HowItWorks />
              <About />
              <StatsGrid />
              <ScreeningQuiz />
              <CTA />
            </Layout>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;