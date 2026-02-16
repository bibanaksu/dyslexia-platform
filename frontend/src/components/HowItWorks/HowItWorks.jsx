import { useScrollReveal } from '../../hooks/useScrollReveal';
import { useState } from 'react';
import './HowItWorks.css';

const steps = [
  {
    number: 1,
    title: 'Child Takes Assessment',
    description: 'Simple screening to understand your child\'s needs',
    icon: '📋',
  },
  {
    number: 2,
    title: 'Therapist Reviews',
    description: 'Specialist recommends personalized activities',
    icon: '👩‍⚕️',
  },
  {
    number: 3,
    title: 'Access Activities',
    description: 'Get your personalized activity library',
    icon: '🎮',
  },
  {
    number: 4,
    title: 'Track Progress',
    description: 'Watch your child\'s skills develop over time',
    icon: '📈',
  },
];

export function HowItWorks() {
  const [ref, revealed] = useScrollReveal();
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) % steps.length);
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
  };

  return (
    <section className={`HowItWorks ${revealed}`} ref={ref} id="how-it-works">
      <div className="HowItWorks__container">
        <h2 className="HowItWorks__title">How It Works</h2>
        
        {/* Mobile: Step Carousel with Arrows */}
        <div className="HowItWorks__mobile">
          <div className="HowItWorks__step-card">
            <div className="HowItWorks__step-number">{steps[currentStep].number}</div>
            <div className="HowItWorks__step-icon">{steps[currentStep].icon}</div>
            <h3 className="HowItWorks__step-title">{steps[currentStep].title}</h3>
            <p className="HowItWorks__step-description">{steps[currentStep].description}</p>
          </div>
          
          <div className="HowItWorks__arrows">
            <button 
              className="HowItWorks__arrow HowItWorks__arrow--prev" 
              onClick={prevStep}
              aria-label="Previous step"
            >
              ←
            </button>
            <button 
              className="HowItWorks__arrow HowItWorks__arrow--next" 
              onClick={nextStep}
              aria-label="Next step"
            >
              →
            </button>
          </div>
          <div className="HowItWorks__dots">
            {steps.map((_, index) => (
              <button
                key={index}
                className={`HowItWorks__dot ${index === currentStep ? 'active' : ''}`}
                onClick={() => setCurrentStep(index)}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Desktop: Grid Layout */}
        <div className="HowItWorks__grid">
          {steps.map((step, index) => (
            <div key={index} className="HowItWorks__grid-step">
              <div className="HowItWorks__grid-number">{step.number}</div>
              <div className="HowItWorks__grid-icon">{step.icon}</div>
              <h3 className="HowItWorks__grid-title">{step.title}</h3>
              <p className="HowItWorks__grid-description">{step.description}</p>
              {index < steps.length - 1 && (
                <div className="HowItWorks__grid-arrow">→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}