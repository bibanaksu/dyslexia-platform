import { useState, useEffect } from 'react';
import './styles/variables.css';
import './styles/reset.css';
import './styles/typography.css';
import './App.css';
import { Navigation } from './components/Navigation/Navigation';
import { Hero } from './components/Hero/Hero';
import { Features } from './components/Features/Features';
import { HowItWorks } from './components/HowItWorks/HowItWorks';
import { About } from './components/About/About';
import { CTA } from './components/CTA/CTA';
import { Footer } from './components/Footer/Footer';

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
    <div className="app">
      <Navigation scrollY={scrollY} />
      <Hero />
      <Features />
      <HowItWorks />
      <About />
      <CTA />
      <Footer />
    </div>
  );
}

export default App;