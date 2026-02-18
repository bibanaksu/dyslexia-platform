import { useScrollReveal } from '../../hooks/useScrollReveal';
import { FeatureCard } from './FeatureCard';
import './Features.css';

// Custom Icons - Professional and Clean
const SpecialistIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 4L4 12V22C4 32 13 42 24 44C35 42 44 32 44 22V12L24 4Z" stroke="#3D5A4C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="24" cy="24" r="8" stroke="#3D5A4C" strokeWidth="2.5"/>
    <path d="M24 16V24L28 28" stroke="#3D5A4C" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const ProgressIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 40V20M20 40V8M32 40V16M44 40H4" stroke="#B39DBD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="14" cy="30" r="2" fill="#B39DBD"/>
    <circle cx="26" cy="20" r="2" fill="#B39DBD"/>
    <circle cx="38" cy="26" r="2" fill="#B39DBD"/>
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="16" stroke="#5FB9B0" strokeWidth="2.5"/>
    <path d="M20 16L32 24L20 32V16Z" stroke="#5FB9B0" strokeWidth="2.5" strokeLinejoin="round"/>
    <path d="M14 8L18 12M34 8L30 12M14 40L18 36M34 40L30 36" stroke="#5FB9B0" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const DashboardIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="10" width="36" height="28" rx="3" stroke="#4A90E2" strokeWidth="2.5"/>
    <path d="M14 18H22M14 24H34M14 30H28" stroke="#4A90E2" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="34" cy="30" r="2" fill="#4A90E2"/>
  </svg>
);

const features = [
  {
    icon: SpecialistIcon,
    title: 'Specialist-Designed',
    description: 'Activities created by experienced dyslexia therapists using evidence-based methodologies',
  },
  {
    icon: ProgressIcon,
    title: 'Track Progress',
    description: 'Monitor your child\'s reading fluency and comprehension with detailed analytics',
  },
  {
    icon: PlayIcon,
    title: 'Learn Through Play',
    description: 'Engaging interactive games that build confidence while developing essential skills',
  },
  {
    icon: DashboardIcon,
    title: 'Parent Dashboard',
    description: 'Comprehensive insights and personalized recommendations for continued growth',
  },
];

export function Features() {
  const [ref, revealed] = useScrollReveal();

  return (
    <section className={`Features ${revealed}`} ref={ref} id="features">
      <div className="Features__container">
        <div className="Features__header">
          <h2>Why Choose Our Platform</h2>
          <p className="Features__subtitle">
            Evidence-based tools designed by specialists to make a real difference
          </p>
        </div>

        <div className="Features__grid">
          {features.map((feature, index) => (
            <div key={index} className={`Features__card-wrapper card-${index + 1}`}>
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}