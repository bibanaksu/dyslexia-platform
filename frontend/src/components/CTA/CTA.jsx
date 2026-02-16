import { useScrollReveal } from '../../hooks/useScrollReveal';
import './CTA.css';

export function CTA() {
  const [ref, revealed] = useScrollReveal();

  return (
    <section className={`CTA ${revealed}`} ref={ref}>
      <div className="CTA__container">
        <h2 className="CTA__headline">Ready to Start Your Child's Journey?</h2>
        <p className="CTA__subheadline">Take the first step today and watch them thrive</p>
        <button className="CTA__button">Get Started Today</button>
      </div>
    </section>
  );
}
