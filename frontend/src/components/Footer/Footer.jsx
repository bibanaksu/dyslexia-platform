import './Footer.css';

// Icons
const LogoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" strokeLinejoin="round"/>
  </svg>
);

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 7L12 13L2 7" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92V19C22 20.5913 20.5913 22 19 22C14.5826 22 10.4147 19.9726 7.22113 16.7789C4.0275 13.5853 2 9.4174 2 5C2 3.4087 3.4087 2 5 2H7.08C7.64 2 8.14 2.33 8.34 2.84L9.7 6.3C9.91 6.83 9.74 7.44 9.3 7.78L7.62 9.12C7.24 9.41 7.1 9.93 7.27 10.4C7.96 12.26 9.74 14.04 11.6 14.73C12.07 14.9 12.59 14.76 12.88 14.38L14.22 12.7C14.56 12.26 15.17 12.09 15.7 12.3L19.16 13.66C19.67 13.86 20 14.36 20 14.92V16.92Z" />
  </svg>
);

const LocationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 6.68629 5.68629 4 9 4C10.5913 4 12.1174 4.63214 13.2426 5.75736C14.3679 6.88258 15 8.4087 15 10" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" />
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 3C22.0424 3.67548 20.9821 4.19211 19.86 4.53C19.2577 3.83751 18.4573 3.34669 17.567 3.12393C16.6767 2.90116 15.7395 2.95724 14.8821 3.28545C14.0247 3.61366 13.2884 4.19631 12.773 4.95376C12.2575 5.71122 11.9877 6.60555 12 7.52V8.52C10.2426 8.57557 8.50127 8.18581 6.93101 7.39545C5.36074 6.60509 4.01032 5.44368 3 4C3 4 -1 13 5 17C2.94053 18.398 0.48716 19.0989 -2 19C5 23 13 23 19 19C23 16 24 10 23 7C23.5 6.5 24 5.5 24 4.5L23 3Z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="3" />
    <circle cx="18" cy="6" r="1" />
  </svg>
);

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="Footer">
      <div className="Footer__container">
        {/* Brand Section */}
        <div className="Footer__brand">
          <div className="Footer__logo-wrapper">
            <div className="Footer__logo-icon">
              <LogoIcon />
            </div>
            <span className="Footer__logo-text">DyslexiaSupport</span>
          </div>
          <p className="Footer__tagline">
            Empowering children with dyslexia through evidence-based tools and compassionate support.
          </p>
          
          <div className="Footer__contact">
            <div className="Footer__contact-item">
              <EmailIcon />
              <a href="mailto:hello@dyslexiasupport.org">hello@dyslexiasupport.org</a>
            </div>
            <div className="Footer__contact-item">
              <PhoneIcon />
              <a href="tel:+1-888-READ-NOW">1-888-READ-NOW</a>
            </div>
            <div className="Footer__contact-item">
              <LocationIcon />
              <span>Boston, Massachusetts</span>
            </div>
          </div>
        </div>

        {/* Company Section */}
        <div className="Footer__section">
          <h4 className="Footer__section-title">Company</h4>
          <ul className="Footer__links">
            <li><a href="#about">About Us</a></li>
            <li><a href="#mission">Our Mission</a></li>
            <li><a href="#team">Our Team</a></li>
            <li><a href="#careers">Careers</a></li>
            <li><a href="#press">Press</a></li>
          </ul>
        </div>

        {/* Resources Section */}
        <div className="Footer__section">
          <h4 className="Footer__section-title">Resources</h4>
          <ul className="Footer__links">
            <li><a href="#blog">Blog</a></li>
            <li><a href="#research">Research</a></li>
            <li><a href="#guides">Parent Guides</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#support">Support</a></li>
          </ul>
        </div>

        
      </div>

      {/* Bottom Bar */}
      <div className="Footer__bottom">
        <p className="Footer__copyright">
          © {currentYear} DyslexiaSupport. All rights reserved.
        </p>
        <div className="Footer__social">
          <a href="#" className="Footer__social-link" aria-label="Facebook">
            <FacebookIcon />
          </a>
          <a href="#" className="Footer__social-link" aria-label="Twitter">
            <TwitterIcon />
          </a>
          <a href="#" className="Footer__social-link" aria-label="Instagram">
            <InstagramIcon />
          </a>
        </div>
      </div>
    </footer>
  );
}