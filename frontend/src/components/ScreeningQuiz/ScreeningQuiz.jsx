import { useState } from 'react';
import './ScreeningQuiz.css';

// Arrow icon for submit button
const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

const questions = [
  {
    id: 1,
    text: "Does your child have any diagnosed vision problems (even if corrected with glasses)?",
  },
  {
    id: 2,
    text: "Has your child had hearing difficulties or frequent ear infections?",
  },
  {
    id: 3,
    text: "Does your child have any history of neurological disorders or seizures?",
  },
  {
    id: 4,
    text: "Has your child been diagnosed with any developmental delay (speech, language, or motor skills)?",
  },
  {
    id: 5,
    text: "Does your child struggle to recognize letters or match letters to sounds?",
  },
  {
    id: 6,
    text: "Does your child confuse similar letters (such as b/d, p/q) or reverse letters while reading or writing?",
  },
  {
    id: 7,
    text: "Does your child read significantly slower than other children of the same age?",
  },
  {
    id: 8,
    text: "Is there a family history of reading difficulties or dyslexia?",
  }
];

export function ScreeningQuiz() {
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const calculateScore = () => {
    const yesCount = Object.values(answers).filter(answer => answer === true).length;
    return {
      yes: yesCount,
      total: questions.length,
      percentage: (yesCount / questions.length) * 100
    };
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) {
      alert('Please answer all questions before submitting');
      return;
    }
    setShowResults(true);
    
    setTimeout(() => {
      const quizSection = document.getElementById('parent-quiz');
      if (quizSection) {
        quizSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const getResultMessage = (yesCount) => {
    if (yesCount <= 2) {
      return "Your child shows few risk factors. Continue monitoring their development and consult with professionals if you have any concerns.";
    } else if (yesCount <= 4) {
      return "Your child shows some risk factors. We recommend discussing these results with a healthcare provider or specialist.";
    } else {
      return "Your child shows several risk factors. We strongly recommend consulting with a pediatrician or specialist for a comprehensive evaluation.";
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setShowResults(false);
  };

  const progress = (Object.keys(answers).length / questions.length) * 100;

  if (showResults) {
    const score = calculateScore();
    return (
      <section id="parent-quiz" className="ScreeningQuiz">
        <div className="ScreeningQuiz__container">
          <div className="ScreeningQuiz__results">
            <h3>Quiz Complete!</h3>
            <div className="ScreeningQuiz__results-score">
              {score.yes} / {score.total}
            </div>
            <div className="ScreeningQuiz__results-message">
              {getResultMessage(score.yes)}
            </div>
            <div className="ScreeningQuiz__results-actions">
              <button 
                className="ScreeningQuiz__button ScreeningQuiz__button--secondary"
                onClick={handleRetake}
              >
                Retake Quiz
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="parent-quiz" className="ScreeningQuiz">
      <div className="ScreeningQuiz__container">
        <div className="ScreeningQuiz__header">
          <h2>Parent Screening Quiz</h2>
          <p>Please answer these questions about your child's development and health history</p>
        </div>

        <div className="ScreeningQuiz__progress">
          <div className="ScreeningQuiz__step">
            Step <span>{Object.keys(answers).length}</span> of <span>{questions.length}</span>
          </div>
          <div className="ScreeningQuiz__progress-bar">
            <div 
              className="ScreeningQuiz__progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="ScreeningQuiz__questions">
          {questions.map((question) => (
            <div key={question.id} className="ScreeningQuiz__question-row">
              <h3 className="ScreeningQuiz__question-text">{question.text}</h3>
              <div className="ScreeningQuiz__options">
                <div className="ScreeningQuiz__option">
                  <input
                    type="radio"
                    name={`q${question.id}`}
                    id={`q${question.id}-no`}
                    checked={answers[question.id] === false}
                    onChange={() => handleAnswer(question.id, false)}
                  />
                  <label htmlFor={`q${question.id}-no`}>No</label>
                </div>
                <div className="ScreeningQuiz__option">
                  <input
                    type="radio"
                    name={`q${question.id}`}
                    id={`q${question.id}-yes`}
                    checked={answers[question.id] === true}
                    onChange={() => handleAnswer(question.id, true)}
                  />
                  <label htmlFor={`q${question.id}-yes`}>Yes</label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="ScreeningQuiz__actions">
          <button 
            className="ScreeningQuiz__submit-btn"
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < questions.length}
          >
            Submit Quiz
            <ArrowIcon />
          </button>
        </div>
      </div>
    </section>
  );
}