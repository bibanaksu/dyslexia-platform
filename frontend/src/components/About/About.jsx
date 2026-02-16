import { useScrollReveal } from '../../hooks/useScrollReveal';
import { StatCard } from './StatCard';
import './About.css';

const stats = [
  { value: '1 in 5', label: 'Children affected by dyslexia' },
  { value: '85%', label: 'Show improvement with proper support' },
  { value: '10+', label: 'Years of specialist expertise' },
  { value: '1000+', label: 'Children helped' },
];

export function About() {
  const [ref, revealed] = useScrollReveal();

  return (
    <section className={`About ${revealed}`} ref={ref} id="about">
      <div className="About__container">
        <div className="About__content">
          <h2>What is Dyslexia?</h2>
          <p>
            Dyslexia is a specific learning difference that affects how the brain processes
            information related to reading and writing. It's not related to intelligence - many
            individuals with dyslexia are exceptionally bright and creative.
          </p>
          <p>
            With the right support and strategies, children with dyslexia can thrive in
            school and beyond. Early intervention and specialized instruction make a
            tremendous difference.
          </p>

          <h3>Common Signs</h3>
          <ul className="About__signs">
            <li>Difficulty with reading fluency and comprehension</li>
            <li>Challenges with spelling and written expression</li>
            <li>Trouble remembering sequences (letters, numbers, words)</li>
            <li>Difficulty distinguishing between similar letters (b, d, p, q)</li>
            <li>Strong verbal skills but difficulty with written tasks</li>
          </ul>

          <div className="About__quote">
            <blockquote>
              "With the right support, dyslexia becomes a superpower. I've seen children
              transform their relationship with learning."
            </blockquote>
            <p className="About__quote-author">- Sarah Mitchell, Dyslexia Specialist</p>
          </div>
        </div>

        <div className="About__stats">
          <div className="About__image-placeholder">
            <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="300" height="300" fill="#EAE7DC" />
              <circle cx="100" cy="80" r="50" fill="#3D5A4C" opacity="0.15" />
              <circle cx="200" cy="100" r="40" fill="#3D5A4C" opacity="0.1" />
              <rect x="50" y="150" width="200" height="130" rx="10" fill="#3D5A4C" opacity="0.08" />
              <text
                x="150"
                y="270"
                textAnchor="middle"
                fontSize="16"
                fill="#6B6B6B"
                fontFamily="Arial"
              >
                Children Learning Together
              </text>
            </svg>
          </div>

          <div className="About__stats-grid">
            {stats.map((stat, index) => (
              <StatCard key={index} value={stat.value} label={stat.label} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}