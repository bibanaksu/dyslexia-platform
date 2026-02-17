import { useScrollReveal } from '../../hooks/useScrollReveal';
import { FeatureCard } from './FeatureCard';
import { BrainIcon } from '../common/icons/BrainIcon';
import { ChartIcon } from '../common/icons/ChartIcon';
import { CorrectIcon } from '../common/icons/CorrectIcon';
import { GrowthIcon } from '../common/icons/GrowthIcon';
import './Features.css';

const features = [
  {
    icon: BrainIcon,
    title: 'Evidence-Based Intervention Programs',
    description: 'Structured reading and phonological exercises built on clinically validated dyslexia methodologies.',
    accentColor: 'var(--accent-blue)',
  },
  {
    icon: ChartIcon,
    title: 'Real-Time Progress Tracking',
    description: 'Monitor reading fluency, comprehension, and phonemic awareness with clear dashboards and measurable growth indicators.',
    accentColor: 'var(--accent-orange)',
  },
  {
    icon: CorrectIcon,
    title: 'Adaptive Learning Engine',
    description: 'Activities automatically adjust difficulty based on performance to ensure steady, personalized improvement.',
    accentColor: 'var(--accent-teal)',
  },
  {
    icon: GrowthIcon,
    title: 'Parent–Therapist Collaboration Hub',
    description: 'Shared reports, coordinated intervention plans, and seamless communication between home and clinical support.',
    accentColor: 'var(--accent-lavender)',
  },
];

export function Features() {
  const [ref, revealed] = useScrollReveal();

  return (
    <section className={`Features ${revealed}`} ref={ref} id="features">
      <div className="Features__container">
        <div className="Features__header">
          <h2>Comprehensive Dyslexia Support Solution</h2>
          <p className="Features__subtitle">
            A complete platform designed to bridge the gap between clinical expertise and home-based intervention
          </p>
        </div>

        <div className="Features__grid">
          {features.map((feature, index) => (
            <div key={index} className={`Features__card-wrapper card-${index + 1}`}>
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                accentColor={feature.accentColor}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}