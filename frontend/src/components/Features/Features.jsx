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
    title: 'Specialist-Designed',
    description: 'Activities created by experienced dyslexia therapists',
  },
  {
    icon: ChartIcon,
    title: 'Track Progress',
    description: "Monitor your child's reading and comprehension growth",
  },
  {
    icon: CorrectIcon,
    title: 'Learn Through Play',
    description: 'Engaging games that build confidence and skills',
  },
  {
    icon: GrowthIcon,
    title: 'Parent Dashboard',
    description: 'See achievements and personalized recommendations',
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
            Evidence-based tools that make a real difference
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