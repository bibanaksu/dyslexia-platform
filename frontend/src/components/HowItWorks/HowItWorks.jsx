import { useScrollReveal } from '../../hooks/useScrollReveal';
import { useState } from 'react';
import './HowItWorks.css';

// Professional Icons
const QuizIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M24 28L30 34L40 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 42L42 42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="32" cy="20" r="2" fill="currentColor"/>
  </svg>
);

const GameIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="20" width="40" height="28" rx="6" stroke="currentColor" strokeWidth="2.5"/>
    <circle cx="24" cy="34" r="3" stroke="currentColor" strokeWidth="2.5"/>
    <circle cx="40" cy="34" r="3" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M32 24V28M32 38V42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M20 44L24 40M44 44L40 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ChartIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 48V16M24 48V24M40 48V32M56 48H8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="14" y="36" width="6" height="12" fill="currentColor" opacity="0.3"/>
    <rect x="30" y="28" width="6" height="20" fill="currentColor" opacity="0.3"/>
    <rect x="46" y="20" width="6" height="28" fill="currentColor" opacity="0.3"/>
    <circle cx="17" cy="42" r="2" fill="currentColor"/>
    <circle cx="33" cy="36" r="2" fill="currentColor"/>
    <circle cx="49" cy="30" r="2" fill="currentColor"/>
  </svg>
);

// Clean Human/Medical Professional Icon
const SupportIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Professional silhouette */}
    <circle cx="32" cy="20" r="8" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <path d="M12 48C12 40 20 34 32 34C44 34 52 40 52 48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    
    {/* Medical cross */}
    <path d="M44 14L52 22M52 14L44 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    
    {/* Stethoscope */}
    <path d="M40 30C40 34 36 38 32 38C28 38 24 34 24 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="40" cy="28" r="3" stroke="currentColor" strokeWidth="2.5"/>
    
    {/* Plus sign for medical */}
    <path d="M20 12L12 20M20 20L12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const steps = [
  {
    icon: QuizIcon,
    title: 'Quick Screen',
    description: 'Start with our 8-question parent quiz to identify potential risk factors',
    gradient: 'linear-gradient(135deg, #3D5A4C 0%, #2C2C2C 100%)',
  },
  {
    icon: GameIcon,
    title: 'Fun Assessment',
    description: 'Your child completes 7 engaging activities that feel like games',
    gradient: 'linear-gradient(135deg, #B39DBD 0%, #8B5AA0 100%)',
  },
  {
    icon: ChartIcon,
    title: 'Track Progress',
    description: 'View detailed results and monitor improvement over time',
    gradient: 'linear-gradient(135deg, #5FB9B0 0%, #3D5A4C 100%)',
  },
  {
    icon: SupportIcon,
    title: 'Get Support',
    description: 'Connect with professionals and access personalized learning plans',
    gradient: 'linear-gradient(135deg, #FFB84D 0%, #FF9500 100%)',
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
        <div className="HowItWorks__header">
          <h2 className="HowItWorks__title">How It Works</h2>
          <p className="HowItWorks__subtitle">
            Our evidence-based approach makes dyslexia screening simple, accurate, and stress-free.
          </p>
        </div>

        {/* Mobile: Step Carousel with Arrows */}
        <div className="HowItWorks__mobile">
          <div className="HowItWorks__step-card" style={{ '--step-gradient': steps[currentStep].gradient }}>
            <div className="HowItWorks__step-icon-wrapper">
              <div className="HowItWorks__step-icon-bg"></div>
              <div className="HowItWorks__step-icon">
                {(() => {
                  const Icon = steps[currentStep].icon;
                  return <Icon />;
                })()}
              </div>
            </div>
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
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="HowItWorks__grid-step" style={{ '--step-gradient': step.gradient }}>
                <div className="HowItWorks__grid-icon-wrapper">
                  <div className="HowItWorks__grid-icon-bg"></div>
                  <div className="HowItWorks__grid-icon">
                    <Icon />
                  </div>
                </div>
                <h3 className="HowItWorks__grid-title">{step.title}</h3>
                <p className="HowItWorks__grid-description">{step.description}</p>
              </div>
            );
          })}
          
          {/* Simple arrows perfectly centered between cards */}
          <span className="HowItWorks__grid-arrow arrow-1">→</span>
          <span className="HowItWorks__grid-arrow arrow-2">→</span>
          <span className="HowItWorks__grid-arrow arrow-3">→</span>
        </div>
      </div>
    </section>
  );
}