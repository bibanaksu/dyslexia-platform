import { useScrollReveal } from '../../hooks/useScrollReveal';
import { useState } from 'react';
import { ClipboardIcon } from '../common/icons/ClipboardIcon';
import { BrainGearIcon } from '../common/icons/BrainGearIcon';
import { TargetIcon } from '../common/icons/TargetIcon';
import { TrendingUpIcon } from '../common/icons/TrendingUpIcon';
import './HowItWorks.css';

const steps = [
  {
    icon: ClipboardIcon,
    title: 'Initial Assessment',
    description: 'Identify reading fluency gaps, phonological awareness challenges, and comprehension difficulties through structured screening tools.',
    accentColor: 'var(--accent-blue)',
  },
  {
    icon: BrainGearIcon,
    title: 'Specialist Analysis & Intervention Plan',
    description: 'Certified dyslexia specialists review results and generate a targeted support plan tailored to your child\'s learning profile.',
    accentColor: 'var(--accent-orange)',
  },
  {
    icon: TargetIcon,
    title: 'Guided Personalized Intervention',
    description: 'Your child follows adaptive reading activities designed specifically to strengthen identified weak areas.',
    accentColor: 'var(--accent-teal)',
  },
  {
    icon: TrendingUpIcon,
    title: 'Continuous Progress Tracking',
    description: 'Monitor measurable gains in fluency, accuracy, and confidence through real-time dashboards and structured progress reports.',
    accentColor: 'var(--accent-lavender)',
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
          <h2 className="HowItWorks__title">Our Evidence-Based Process</h2>
          <p className="HowItWorks__subtitle">
            A structured four-step approach designed to ensure every child receives the specialized support they need
          </p>
        </div>

        {/* Mobile: Step Carousel with Arrows */}
        <div className="HowItWorks__mobile">
          <div className="HowItWorks__step-card" style={{ '--step-accent': steps[currentStep].accentColor }}>
            <div className="HowItWorks__step-icon">
              {(() => {
                const Icon = steps[currentStep].icon;
                return <Icon size={64} color={steps[currentStep].accentColor} />;
              })()}
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
              <div key={index} className="HowItWorks__grid-step" style={{ '--step-accent': step.accentColor }}>
                <div className="HowItWorks__grid-icon">
                  <Icon size={64} color={step.accentColor} />
                </div>
                <h3 className="HowItWorks__grid-title">{step.title}</h3>
                <p className="HowItWorks__grid-description">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="HowItWorks__grid-arrow">→</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}