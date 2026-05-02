import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navigation.css';

export function Navigation({ scrollY = 0 }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      setIsScrolled(scrollTop > 50);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'About', href: '#about' },
  ];

  const handleSignIn = () => navigate('/auth');
  const handleScrollToSection = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <nav className={`Navigation ${isScrolled ? 'scrolled' : ''}`}>
      <div className="Navigation__container">
        {/* Logo – DS text badge (matching AssessmentResults) */}
        <a href="#home" className="Navigation__logo" onClick={(e) => {
          e.preventDefault();
          handleScrollToSection('#home');
        }}>
          <div className="Navigation__logo-icon">
            <span className="Navigation__logo-ds">DS</span>
          </div>
          <span className="Navigation__logo-text">Dyslexia Support</span>
        </a>

        {/* Desktop Navigation Links */}
        <div className="Navigation__links">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="Navigation__link"
              onClick={(e) => {
                e.preventDefault();
                handleScrollToSection(link.href);
              }}
            >
              {link.name}
              <span className="Navigation__link-underline"></span>
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="Navigation__actions">
          <button className="Navigation__signin-btn" onClick={handleSignIn}>Sign In</button>
          <button
            className={`Navigation__hamburger ${isMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`Navigation__mobile-menu ${isMenuOpen ? 'active' : ''}`}>
        <div className="Navigation__mobile-menu-content">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="Navigation__mobile-link"
              onClick={(e) => {
                e.preventDefault();
                handleScrollToSection(link.href);
              }}
            >
              {link.name}
            </a>
          ))}
          <button className="Navigation__mobile-signin-btn" onClick={handleSignIn}>Sign In</button>
        </div>
      </div>
    </nav>
  );
}