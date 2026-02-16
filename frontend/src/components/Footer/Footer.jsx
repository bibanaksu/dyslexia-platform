import './Footer.css';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="Footer">
      <div className="Footer__container">
        <div className="Footer__section">
          <h4 className="Footer__logo">DyslexiaSupport</h4>
          <p className="Footer__description">
            Empowering children with dyslexia through specialist-designed activities.
          </p>
        </div>

        <div className="Footer__section">
          <h5>Quick Links</h5>
          <ul className="Footer__links">
            <li>
              <a href="#home">Home</a>
            </li>
            <li>
              <a href="#features">Features</a>
            </li>
            <li>
              <a href="#how-it-works">How It Works</a>
            </li>
            <li>
              <a href="#about">About</a>
            </li>
          </ul>
        </div>

        <div className="Footer__section">
          <h5>Legal</h5>
          <ul className="Footer__links">
            <li>
              <a href="#privacy">Privacy Policy</a>
            </li>
            <li>
              <a href="#terms">Terms of Service</a>
            </li>
            <li>
              <a href="#contact">Contact</a>
            </li>
          </ul>
        </div>

        <div className="Footer__section">
          <h5>Contact</h5>
          <p className="Footer__contact-info">
            <a href="mailto:info@dyslexiasupport.com">info@dyslexiasupport.com</a>
          </p>
          <p className="Footer__contact-info">
            <a href="tel:+1-800-DYSLEXIA">+1-800-DYSLEXIA</a>
          </p>
        </div>
      </div>

      <div className="Footer__bottom">
        <p className="Footer__copyright">
          &copy; {currentYear} DyslexiaSupport Platform. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
