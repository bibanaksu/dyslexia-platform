import { useEffect, useRef, useState } from 'react';
import './Hero.css';

export function Hero() {
  const heroRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setIsLoaded(true);

    const handleScroll = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        if (rect.bottom > 0) {
          setScrollY(window.scrollY);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const parallaxOffset = scrollY * 0.3;
  const opacityFade = Math.max(0, 1 - scrollY / 600);

  return (
    <section
      id="home"
      ref={heroRef}
      className="Hero"
    >
      {/* Background Image with Parallax */}
      <div
        className="Hero__background"
        style={{ transform: `translateY(${parallaxOffset}px)` }}
      >
        <div className="Hero__background-image"></div>
        {/* Gradient Overlay */}
        <div className="Hero__overlay"></div>
      </div>

      {/* Floating Dust Particles */}
      <div className="Hero__particles">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="Hero__particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${4 + Math.random() * 4}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Content */}
      <div
        className="Hero__content"
        style={{ opacity: opacityFade }}
      >
        <div className="Hero__content-inner">
          {/* Headline */}
          <h1
            className={`Hero__headline ${isLoaded ? 'loaded' : ''}`}
            style={{ transitionDelay: '0.2s' }}
          >
            Empowering Children with<br />
            <span className="Hero__headline-highlight">Dyslexia to Thrive</span>
          </h1>

          {/* Description */}
          <p
            className={`Hero__description ${isLoaded ? 'loaded' : ''}`}
            style={{ transitionDelay: '0.4s' }}
          >
            Specialist-designed activities that make learning fun and effective.
            Give your child the tools to succeed.
          </p>

          {/* CTA Buttons */}
          <div
            className={`Hero__buttons ${isLoaded ? 'loaded' : ''}`}
            style={{ transitionDelay: '0.6s' }}
          >
            <a href="#features" className="Hero__button Hero__button--primary">
              <span>Start Your Journey</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
            <a href="#features" className="Hero__button Hero__button--secondary">
              Explore Features
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div
          className={`Hero__scroll-indicator ${isLoaded ? 'loaded' : ''}`}
          style={{ transitionDelay: '1s' }}
        >
          <a href="#features" className="Hero__scroll-link">
            <span>Scroll to explore</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}