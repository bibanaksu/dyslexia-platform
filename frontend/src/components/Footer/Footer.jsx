import './Footer.css';

// Icons
const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 7L12 13L2 7" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92V19C22 19.7956 21.6839 20.5587 21.1213 21.1213C20.5587 21.6839 19.7956 22 19 22C15.0997 21.563 11.4215 19.9161 8.39091 17.2625C5.34437 14.5974 3.14964 11.092 2 7.16C1.99789 6.36446 2.31077 5.6017 2.86922 5.03944C3.42767 4.47718 4.18825 4.15899 4.98375 4.15527H7.065C7.73697 4.14444 8.38306 4.43496 8.82 4.94C9.21661 5.44114 9.46687 6.04695 9.54 6.69C9.69519 7.96884 10.0514 9.21178 10.59 10.37C10.7608 10.7716 10.7425 11.2296 10.5403 11.6164C10.338 12.0032 9.97742 12.2736 9.555 12.35C9.40633 12.3757 9.26227 12.4228 9.1275 12.49C9.35427 13.0902 9.68267 13.6476 10.095 14.13C10.5912 14.6926 11.173 15.1767 11.82 15.565C12.3017 15.8617 12.8264 16.0811 13.375 16.215C13.4431 15.9625 13.5378 15.7186 13.6565 15.4879C13.7752 15.2572 13.9166 15.0415 14.0775 14.845C14.3708 14.4629 14.7897 14.1952 15.265 14.09C15.7244 13.9891 16.2019 14.0003 16.6556 14.1226C17.1094 14.2449 17.5242 14.4742 17.865 14.79C18.8087 15.6379 19.5578 16.6797 20.06 17.84C20.2013 18.1701 20.3052 18.5147 20.37 18.8675C20.4333 19.2906 20.3754 19.7229 20.2033 20.1115C20.0313 20.5 19.7533 20.8257 19.405 21.045C19.0567 21.2643 18.6544 21.367 18.25 21.34" />
  </svg>
);

const LocationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="Footer">
      <div className="Footer__container">
        {/* Brand Section with Contact */}
        <div className="Footer__brand">
          <h3 className="Footer__logo">DyslexiaSupport</h3>
          <p className="Footer__tagline">
            Making reading accessible to every child. Specialist-designed activities 
            and personalized support for children with dyslexia.
          </p>
          
          <div className="Footer__contact">
            <div className="Footer__contact-item">
              <EmailIcon />
              <a href="mailto:hello@dyslexiasupport.com">hello@dyslexiasupport.com</a>
            </div>
            <div className="Footer__contact-item">
              <PhoneIcon />
              <a href="tel:+1-800-DYSLEXIA">1-800-DYSLEXIA</a>
            </div>
            <div className="Footer__contact-item">
              <LocationIcon />
              <span>Portland, Oregon, USA</span>
            </div>
          </div>
        </div>

        {/* Company Section */}
        <div className="Footer__section">
          <h4 className="Footer__section-title">Company</h4>
          <ul className="Footer__links">
            <li><a href="#about">About Us</a></li>
            <li><a href="#story">Our Story</a></li>
            <li><a href="#careers">Careers</a></li>
            <li><a href="#press">Press</a></li>
          </ul>
        </div>

        {/* Support Section */}
        <div className="Footer__section">
          <h4 className="Footer__section-title">Support</h4>
          <ul className="Footer__links">
            <li><a href="#help">Help Center</a></li>
            <li><a href="#contact">Contact Us</a></li>
            <li><a href="#shipping">Shipping Info</a></li>
            <li><a href="#returns">Returns</a></li>
          </ul>
        </div>

        {/* Legal Section */}
        <div className="Footer__section">
          <h4 className="Footer__section-title">Legal</h4>
          <ul className="Footer__links">
            <li><a href="#privacy">Privacy Policy</a></li>
            <li><a href="#terms">Terms of Service</a></li>
            <li><a href="#cookies">Cookie Policy</a></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="Footer__bottom">
        <p className="Footer__copyright">
          © {currentYear} DyslexiaSupport. All rights reserved.
        </p>
       
      </div>
    </footer>
  );
}