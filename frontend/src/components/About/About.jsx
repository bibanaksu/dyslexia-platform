import { useScrollReveal } from '../../hooks/useScrollReveal';
import './About.css';

export function About() {
  const [ref, revealed] = useScrollReveal();

  return (
    <section className={`About ${revealed}`} ref={ref} id="about">
      <div className="About__container">
        <div className="About__content">
          <h2>What is Dyslexia?</h2>
          <p className="About__description">
            Dyslexia is a specific learning difference that affects how the brain processes
            information related to reading and writing. It's not related to intelligence - many
            individuals with dyslexia are exceptionally bright and creative.
          </p>
          <p className="About__description">
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
        </div>

        <div className="About__stats">
          <div className="About__image-container">
            <img 
              src="/assets/about.png" 
              alt="Children learning together in a supportive environment" 
              className="About__image"
            />
            <p className="About__image-caption">Children Learning Together</p>
          </div>
        </div>
      </div>
    </section>
  );
}