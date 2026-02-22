import { useScrollReveal } from '../../hooks/useScrollReveal';
import './StatsGrid.css';

const statsData = [
  {
    value: '1 in 10',
    label: 'children',
    title: 'Global Prevalence',
    description: 'Approximately 10% of children worldwide have dyslexia, making it one of the most common learning differences.',
    badge: 'Most Common'
  },
  {
    value: '40–60%',
    label: 'heritability',
    title: 'Strong Genetic Link',
    description: 'Research shows that 40–60% of dyslexia cases are hereditary, meaning it often runs in families.',
    badge: 'Genetic Factor'
  },
  {
    value: '95%',
    label: 'can improve',
    title: 'Early Intervention Works',
    description: 'Structured, evidence-based intervention helps up to 95% of children improve reading skills.',
    badge: 'Highly Effective'
  },
  {
    value: '70–80%',
    label: 'struggle',
    title: 'Spelling Difficulties',
    description: 'Around 70–80% of children with dyslexia struggle with spelling and written expression.',
    badge: 'Common Challenge'
  }
];

export function StatsGrid() {
  const [ref, revealed] = useScrollReveal();

  return (
    <section className={`StatsGrid ${revealed}`} ref={ref}>
      <div className="StatsGrid__container">
        <div className="StatsGrid__header">
          <h2>Key Facts About Dyslexia</h2>
        
        </div>
        
        <div className="StatsGrid__grid">
          {statsData.map((stat, index) => (
            <div key={index} className="StatsGrid__card">
              <div className="StatsGrid__card-content">
                <div className="StatsGrid__value-row">
                  <span className="StatsGrid__value">{stat.value}</span>
                  <span className="StatsGrid__value-label">{stat.label}</span>
                </div>
                <h3 className="StatsGrid__title">{stat.title}</h3>
                <p className="StatsGrid__description">{stat.description}</p>
                <span className="StatsGrid__badge">{stat.badge}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}