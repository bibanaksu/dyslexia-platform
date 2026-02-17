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
            Dyslexia is a neurodevelopmental learning disorder that affects reading accuracy, fluency, and spelling. It is not related to intelligence — many individuals with dyslexia demonstrate strong creativity, problem-solving skills, and verbal reasoning abilities.
          </p>

          <p>
            According to the American Psychiatric Association in the Diagnostic and Statistical Manual of Mental Disorders, dyslexia is classified as a Specific Learning Disorder with impairment in reading.
          </p>

          <p>
            With early identification and structured intervention, children with dyslexia can significantly improve their literacy skills and academic confidence.
          </p>

          <h3>Common Signs of Dyslexia</h3>
          <ul className="About__signs">
            <li>Difficulty with reading fluency and word recognition</li>
            <li>Challenges with spelling and written expression</li>
            <li>Trouble remembering sequences (letters, numbers, words)</li>
            <li>Confusion between similar letters (b, d, p, q)</li>
            <li>Strong verbal skills but difficulty expressing ideas in writing</li>
          </ul>

          <h3>Why Early Support Matters</h3>
          <p>
            Early screening and targeted, evidence-based intervention make a measurable difference. Structured assessment allows specialists to identify specific learning gaps and design personalized strategies that help children build strong, lasting reading skills.
          </p>

          <div className="About__quote">
            <blockquote>
              "With the right support, dyslexia becomes a superpower. I've seen children
              transform their relationship with learning."
            </blockquote>
            <p className="About__quote-author"></p>
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