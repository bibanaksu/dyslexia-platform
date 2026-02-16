import { useState } from 'react';
import './Navigation.css';

export function Navigation({ scrollY = 0 }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'About', href: '#about' },
  ];

  const isScrolled = scrollY > 50;

  return (
    <nav className={`Navigation ${isScrolled ? 'scrolled' : ''}`}>
      <div className="Navigation__container">
        {/* Logo */}
        <a href="#home" className="Navigation__logo">
          <div className="Navigation__logo-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 6V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 18V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="Navigation__logo-text">DyslexiaSupport</span>
        </a>

        {/* Desktop Navigation Links */}
        <div className="Navigation__links">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="Navigation__link"
            >
              {link.name}
              <span className="Navigation__link-underline"></span>
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="Navigation__actions">
          {/* SIGN IN BUTTON - REPLACED SEARCH ICON */}
          <button className="Navigation__signin-btn">
            Sign In
          </button>

          <button
            className={`Navigation__hamburger ${isMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
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
              onClick={() => setIsMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}
          {/* Mobile Sign In Button */}
          <button className="Navigation__mobile-signin-btn">
            Sign In
          </button>
        </div>
      </div>
    </nav>
  );
}