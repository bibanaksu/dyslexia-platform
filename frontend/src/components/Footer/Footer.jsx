import './Footer.css';

// Icons (unchanged, TwitterIcon removed)
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
        {/* Left column: Logo + Tagline (logo above tagline) */}
        <div className="Footer__left">
          <div className="Footer__logo-wrapper">
            <div 
              className="Footer__logo-icon"
              style={{
                width: 36,
                height: 36,
                background: '#FFB84D',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '0.8rem',
                color: '#1E2D25',
                fontFamily: "'DM Serif Display', serif"
              }}
              aria-label="Dyslexia Support logo"
            >
              DS
            </div>
            <span className="Footer__logo-text">DyslexiaSupport</span>
          </div>
          <p className="Footer__tagline">
            Empowering children with dyslexia through evidence-based tools and compassionate support.
          </p>
        </div>

        {/* Middle column: Contact details (email, phone, address) */}
        <div className="Footer__middle">
          <div className="Footer__contact">
            <div className="Footer__contact-item">
              <EmailIcon />
              <a href="mailto:Orthophoniste.Ach.K@gmail.com">Orthophoniste.Ach.K@gmail.com</a>
            </div>
            <div className="Footer__contact-item">
              <PhoneIcon />
              <a href="tel:0797 22 15 32">0797 22 15 32</a>
            </div>
            <div className="Footer__contact-item">
              <LocationIcon />
              <span>Cité 24 Février Bloc 04 N° 13 Staoueli</span>
            </div>
          </div>
        </div>

        {/* Right column: Platform section with updated links */}
        <div className="Footer__right">
          <div className="Footer__section">
            <h4 className="Footer__section-title">Platform</h4>
            <ul className="Footer__links">
              <li><a href="#features">Features</a></li>
              <li><a href="#how-it-works">How it works</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#signin">Sign in</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Twitter icon removed */}
      <div className="Footer__bottom">
        <p className="Footer__copyright">
          © {currentYear} DyslexiaSupport. All rights reserved.
        </p>
        <div className="Footer__social">
          <a href="#" className="Footer__social-link" aria-label="Facebook">
            <FacebookIcon />
          </a>
          <a href="#" className="Footer__social-link" aria-label="Instagram">
            <InstagramIcon />
          </a>
        </div>
      </div>
    </footer>
  );
}