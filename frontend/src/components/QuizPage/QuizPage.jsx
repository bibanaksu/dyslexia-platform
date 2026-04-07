import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './QuizPage.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ALL_QUESTIONS = [
  { id: 1, text: "Does your child have any diagnosed vision problems (even if corrected with glasses)?" },
  { id: 2, text: "Has your child had hearing difficulties or frequent ear infections?" },
  { id: 3, text: "Does your child have any history of neurological disorders or seizures?" },
  { id: 4, text: "Has your child been diagnosed with any developmental delay (speech, language, or motor skills)?" },
  { id: 5, text: "Does your child struggle to recognize letters or match letters to sounds?" },
  { id: 6, text: "Does your child confuse similar letters (such as b/d, p/q) or reverse letters while reading or writing?" },
  { id: 7, text: "Does your child read significantly slower than other children of the same age?" },
  { id: 8, text: "Is there a family history of reading difficulties or dyslexia?" },
];

const QUESTIONS_PER_PAGE = 4;
const TOTAL_PAGES = Math.ceil(ALL_QUESTIONS.length / QUESTIONS_PER_PAGE);

const RISK_CONFIG = {
  LOW:      { color: '#4CAF50', bg: '#e8f5e9', label: 'Low Risk', emoji: '✅' },
  MODERATE: { color: '#FF9800', bg: '#fff3e0', label: 'Moderate Risk', emoji: '⚠️' },
  HIGH:     { color: '#f44336', bg: '#ffebee', label: 'High Risk', emoji: '🔴' },
};

const RESULT_MESSAGES = {
  LOW:      'Your child shows few risk factors for dyslexia. Continue monitoring their development and consult with a professional if you notice any changes.',
  MODERATE: 'Your child shows some risk factors. We recommend discussing these results with a healthcare provider or specialist for further evaluation.',
  HIGH:     'Your child shows several risk factors. We strongly recommend consulting with a pediatrician or dyslexia specialist for a comprehensive evaluation as soon as possible.',
};

export default function QuizPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState({});
  const [childName, setChildName] = useState('');
  const [childGrade, setChildGrade] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentQuestions = ALL_QUESTIONS.slice(
    currentPage * QUESTIONS_PER_PAGE,
    (currentPage + 1) * QUESTIONS_PER_PAGE
  );
  
  const currentPageAnswered = currentQuestions.every(q => q.id in answers);
  const totalAnswered = Object.keys(answers).length;
  const progress = (totalAnswered / ALL_QUESTIONS.length) * 100;

  const handleAnswer = (id, val) => {
    setAnswers(prev => ({ ...prev, [id]: val }));
  };

  const handleNextPage = () => {
    if (!currentPageAnswered) return;
    setCurrentPage(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (totalAnswered < ALL_QUESTIONS.length) {
      setError('Please answer all questions before submitting.');
      return;
    }
    setError('');
    setLoading(true);

    const token = localStorage.getItem('token');

    try {
      if (token) {
        const response = await fetch(`${API}/api/quiz/submit`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            answers, 
            child_name: childName || undefined, 
            child_grade: childGrade || undefined 
          })
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            const totalYes = Object.values(answers).filter(Boolean).length;
            const total = ALL_QUESTIONS.length;
            const percentage = Math.round((totalYes / total) * 100);
            const riskLevel = totalYes <= 2 ? 'LOW' : totalYes <= 5 ? 'MODERATE' : 'HIGH';
            setResult({ totalYes, total, percentage, riskLevel, guest: true, tokenError: true });
          } else {
            const data = await response.json();
            throw new Error(data.error || 'Submission failed');
          }
        } else {
          const data = await response.json();
          setResult(data);
        }
      } else {
        const totalYes = Object.values(answers).filter(Boolean).length;
        const total = ALL_QUESTIONS.length;
        const percentage = Math.round((totalYes / total) * 100);
        const riskLevel = totalYes <= 2 ? 'LOW' : totalYes <= 5 ? 'MODERATE' : 'HIGH';
        setResult({ totalYes, total, percentage, riskLevel, guest: true });
      }
    } catch (err) {
      console.error('Submission error:', err);
      const totalYes = Object.values(answers).filter(Boolean).length;
      const total = ALL_QUESTIONS.length;
      const percentage = Math.round((totalYes / total) * 100);
      const riskLevel = totalYes <= 2 ? 'LOW' : totalYes <= 5 ? 'MODERATE' : 'HIGH';
      setResult({ totalYes, total, percentage, riskLevel, guest: true, connectionError: true });
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    const cfg = RISK_CONFIG[result.riskLevel] || RISK_CONFIG.LOW;
    return (
      <div className="quiz-page">
        <div className="quiz-page__header">
          <button className="quiz-page__back" onClick={() => navigate('/')}>
            ←
          </button>
        </div>
        <div className="quiz-page__results-container">
          <div className="quiz-results">
            <div className="quiz-results__emoji">{cfg.emoji}</div>
            <h2 className="quiz-results__title">Assessment Complete!</h2>
            <div className="quiz-results__score-ring" style={{ '--ring-color': cfg.color }}>
              <span className="quiz-results__pct">{result.percentage}%</span>
              <span className="quiz-results__pct-label">Risk Score</span>
            </div>
            <div className="quiz-results__badge" style={{ background: cfg.bg, color: cfg.color }}>
              {cfg.label}
            </div>
            <p className="quiz-results__message">{RESULT_MESSAGES[result.riskLevel]}</p>
            <div className="quiz-results__stats">
              <div className="quiz-results__stat">
                <div className="quiz-results__stat-val">{result.totalYes}</div>
                <div className="quiz-results__stat-lbl">Yes Answers</div>
              </div>
              <div className="quiz-results__stat">
                <div className="quiz-results__stat-val">{result.total - result.totalYes}</div>
                <div className="quiz-results__stat-lbl">No Answers</div>
              </div>
              <div className="quiz-results__stat">
                <div className="quiz-results__stat-val">{result.total}</div>
                <div className="quiz-results__stat-lbl">Total Questions</div>
              </div>
            </div>
            {result.connectionError && (
              <div className="quiz-results__token-warning">
                ⚠️ Unable to connect to server. Results shown locally.
              </div>
            )}
            {result.tokenError && (
              <div className="quiz-results__token-warning">
                ⚠️ Your session expired. Results shown below.
              </div>
            )}
            {result.guest && (
              <div className="quiz-results__cta-box">
                <p>Create a free account to save your results and get connected with a specialist.</p>
                <button className="quiz-results__cta-btn" onClick={() => navigate('/auth')}>
                  Save Results — Sign Up Free
                </button>
              </div>
            )}
            {!result.guest && !result.tokenError && !result.connectionError && (
              <p className="quiz-results__saved-note">✓ Your results have been saved</p>
            )}
            <div className="quiz-results__actions">
              <button className="quiz-results__btn quiz-results__btn--outline"
                onClick={() => { setAnswers({}); setResult(null); setCurrentPage(0); setChildName(''); setChildGrade(''); }}>
                Retake Quiz
              </button>
              <button className="quiz-results__btn quiz-results__btn--primary"
                onClick={() => navigate('/')}>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-page">
      <div className="quiz-page__header">
        <button className="quiz-page__back" onClick={() => navigate('/')}>
          ←
        </button>
      </div>

      <div className="quiz-page__container">
        {/* Progress */}
        <div className="quiz-page__progress-section">
          <div className="quiz-page__progress-info">
            <span>Question {totalAnswered} of {ALL_QUESTIONS.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="quiz-page__progress-bar">
            <div className="quiz-page__progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="quiz-page__page-indicator">
            Page {currentPage + 1} of {TOTAL_PAGES}
          </div>
        </div>

        {/* Child Info - Bigger section */}
        <div className="quiz-page__child-info">
          <h3>📋 About Your Child <span>(optional)</span></h3>
          <div className="quiz-page__child-fields">
            <div className="quiz-page__field">
              <label>Child's Full Name</label>
              <input 
                type="text" 
                placeholder="Enter your child's name" 
                value={childName}
                onChange={e => setChildName(e.target.value)} 
              />
            </div>
            <div className="quiz-page__field">
              <label>Current Grade Level</label>
              <select value={childGrade} onChange={e => setChildGrade(e.target.value)}>
                <option value="">Select grade</option>
                <option value="K">Kindergarten</option>
                <option value="1">Grade 1</option>
                <option value="2">Grade 2</option>
                <option value="3">Grade 3</option>
                <option value="4">Grade 4</option>
                <option value="5">Grade 5</option>
                <option value="6">Grade 6</option>
                <option value="7">Grade 7</option>
                <option value="8">Grade 8</option>
                <option value="9">Grade 9</option>
                <option value="10">Grade 10</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
              </select>
            </div>
          </div>
        </div>

        {/* Questions - 4 per page */}
        <div className="quiz-page__questions">
          {currentQuestions.map((q, idx) => (
            <div key={q.id} className={`quiz-page__question ${answers[q.id] !== undefined ? 'answered' : ''}`}>
              <div className="quiz-page__question-number">
                Q{currentPage * QUESTIONS_PER_PAGE + idx + 1}
              </div>
              <p className="quiz-page__q-text">{q.text}</p>
              <div className="quiz-page__options">
                <button
                  className={`quiz-page__option quiz-page__option--no ${answers[q.id] === false ? 'selected' : ''}`}
                  onClick={() => handleAnswer(q.id, false)}
                >
                  No
                </button>
                <button
                  className={`quiz-page__option quiz-page__option--yes ${answers[q.id] === true ? 'selected' : ''}`}
                  onClick={() => handleAnswer(q.id, true)}
                >
                  Yes
                </button>
              </div>
            </div>
          ))}
        </div>

        {error && <div className="quiz-page__error">{error}</div>}

        {/* Navigation Buttons */}
        <div className="quiz-page__nav">
          {currentPage > 0 && (
            <button
              className="quiz-page__nav-btn quiz-page__nav-btn--back"
              onClick={handlePreviousPage}
            >
              ← Previous
            </button>
          )}
          <div className="quiz-page__nav-spacer" />
          {currentPage < TOTAL_PAGES - 1 ? (
            <button
              className={`quiz-page__nav-btn quiz-page__nav-btn--next ${!currentPageAnswered ? 'disabled' : ''}`}
              onClick={handleNextPage}
              disabled={!currentPageAnswered}
            >
              Next →
            </button>
          ) : (
            <button
              className={`quiz-page__nav-btn quiz-page__nav-btn--submit ${totalAnswered < ALL_QUESTIONS.length || loading ? 'disabled' : ''}`}
              onClick={handleSubmit}
              disabled={totalAnswered < ALL_QUESTIONS.length || loading}
            >
              {loading ? 'Submitting...' : 'Submit Assessment →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}