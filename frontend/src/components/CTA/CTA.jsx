import { useScrollReveal } from '../../hooks/useScrollReveal';
import './CTA.css';

// Clock icon for time indicator
const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export function CTA() {
  const [ref, revealed] = useScrollReveal();

  return (
    <section className={`CTA ${revealed}`} ref={ref}>
      <div className="CTA__container">
        <h2 className="CTA__headline">
          Ready to <span className="CTA__headline-highlight">Get Started?</span>
        </h2>
        
        <p className="CTA__subheadline">
          Take the first step in supporting your child's reading journey. 
          Our assessment is free, fun, and takes just 20-30 minutes.
        </p>

        <div className="CTA__button-group">
          <button className="CTA__button CTA__button--primary">
            Start Assessment Now
          </button>
          
          <button className="CTA__button CTA__button--secondary">
            Take Parent Quiz
          </button>
        </div>

        
      </div>
    </section>
  );
}