import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './QuizPage.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const RISK_CONFIG = {
  LOW: {
    color: '#3AB07A',
    bg: '#E8F8F0',
    ringColor: '#3AB07A',
    headerBg: 'linear-gradient(135deg, #E8F8F0, #F0FAF4)',
    label: 'Low Risk',
  },
  MODERATE: {
    color: '#E8A234',
    bg: '#FFF3DC',
    ringColor: '#E8A234',
    headerBg: 'linear-gradient(135deg, #FFF3DC, #FFF8EC)',
    label: 'Moderate Risk',
  },
  HIGH: {
    color: '#D64545',
    bg: '#FDEAEA',
    ringColor: '#D64545',
    headerBg: 'linear-gradient(135deg, #FDEAEA, #FEF2F2)',
    label: 'High Risk',
  },
};

const RESULT_MESSAGES = {
  LOW: 'Your child shows few risk factors for dyslexia. Continue monitoring their development and consult with a professional if you notice any changes.',
  MODERATE: 'Your child shows some risk factors. A professional evaluation is recommended to determine appropriate support strategies.',
  HIGH: 'Your child shows several risk factors. We strongly recommend a comprehensive evaluation by a dyslexia specialist as soon as possible.',
};

const FALLBACK_QUESTIONS = [
  { id: 1, question_text: 'Does your child have any diagnosed vision problems (even if corrected with glasses)?', display_order: 1 },
  { id: 2, question_text: 'Has your child had hearing difficulties or frequent ear infections?', display_order: 2 },
  { id: 3, question_text: 'Does your child have any history of neurological disorders or seizures?', display_order: 3 },
  { id: 4, question_text: 'Has your child been diagnosed with any developmental delay (speech, language, or motor skills)?', display_order: 4 },
  { id: 5, question_text: 'Does your child struggle to recognize letters or match letters to sounds?', display_order: 5 },
  { id: 6, question_text: 'Does your child confuse similar letters (such as b/d, p/q) or reverse letters while reading or writing?', display_order: 6 },
  { id: 7, question_text: 'Does your child read significantly slower than other children of the same age?', display_order: 7 },
  { id: 8, question_text: 'Is there a family history of reading difficulties or dyslexia?', display_order: 8 },
];

const QUESTIONS_PER_PAGE = 4;

export default function QuizPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState({});
  const [childSessionId, setChildSessionId] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const sessionId = sessionStorage.getItem('child_session_id');
    if (sessionId) setChildSessionId(sessionId);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchQuestions() {
      try {
        const res = await fetch(`${API}/api/quiz/questions`);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.success && Array.isArray(data.questions) && data.questions.length) {
          setQuestions(data.questions);
          setFetchError('');
        } else {
          setQuestions(FALLBACK_QUESTIONS);
          setFetchError('');
        }
      } catch {
        if (!cancelled) {
          setQuestions(FALLBACK_QUESTIONS);
          setFetchError('');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchQuestions();
    return () => { cancelled = true; };
  }, []);

  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const startIndex = currentPage * QUESTIONS_PER_PAGE;
  const currentQs = questions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);
  const totalAnswered = Object.keys(answers).length;
  const pageAnswered = currentQs.every(q => q.id in answers);

  const handleAnswer = (id, val) => setAnswers(prev => ({ ...prev, [id]: val }));
  const handleNext = () => { if (pageAnswered) { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
  const handlePrev = () => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handleSubmit = async () => {
    if (totalAnswered < questions.length) {
      setError('Please answer all questions before submitting.');
      return;
    }
    setError('');
    setSubmitting(true);

    const yesCount = Object.values(answers).filter(Boolean).length;
    const pct = (yesCount / questions.length) * 100;
    const riskLevel = pct <= 25 ? 'LOW' : pct <= 60 ? 'MODERATE' : 'HIGH';
    const token = localStorage.getItem('token');

    const resultsData = {
      totalYes: yesCount,
      total: questions.length,
      percentage: Math.round(pct),
      riskLevel,
      saved: false,
      message: '',
    };

    if (childSessionId) {
      try {
        const res = await fetch(`${API}/api/quiz/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            child_session_id: childSessionId,
            answers,
            total_yes_count: yesCount,
            risk_level: riskLevel,
            risk_score: Math.round(pct),
          }),
        });
        const data = await res.json();
        resultsData.saved = res.ok && data.success;
        resultsData.message = data.message || '';
      } catch (err) {
        resultsData.message = 'Could not save to server.';
      }
    } else {
      resultsData.message = 'Complete the full assessment to save your results and receive a personalised plan.';
    }

    setResult(resultsData);
    setSubmitting(false);
  };

  const resetQuiz = () => {
    setAnswers({});
    setResult(null);
    setCurrentPage(0);
    setError('');
  };

  if (loading) {
    return (
      <div className="quiz-page">
        <QuizHeader onBack={() => navigate('/')} />
        <div className="quiz-page__loading"><div className="quiz-page__spinner" /><h2>Preparing Assessment</h2><p>Loading questions...</p></div>
      </div>
    );
  }

  if (result) {
    const cfg = RISK_CONFIG[result.riskLevel];
    const needsTherapy = result.riskLevel === 'MODERATE' || result.riskLevel === 'HIGH';

    return (
      <div className="quiz-page">
        <QuizHeader onBack={resetQuiz} label="← Take Again" />
        <div className="quiz-page__results-wrapper">
          <div className="quiz-results">
            <div className="quiz-results__header" style={{ '--header-bg': cfg.headerBg }}>
              {/* No SVG icon */}
              <h2 className="quiz-results__title">Quiz Complete</h2>
              <p className="quiz-results__subtitle">Dyslexia Risk Screening Results</p>
            </div>

            <div className="quiz-results__body">
              <div className="quiz-results__ring-wrap">
                <div className="quiz-results__score-ring" style={{ '--ring-color': cfg.ringColor }}>
                  <span className="quiz-results__pct">{result.percentage}%</span>
                  <span className="quiz-results__pct-label">Risk Score</span>
                </div>
                <div className="quiz-results__badge" style={{ color: cfg.color, borderColor: cfg.color, background: cfg.bg }}>
                  {cfg.label}
                </div>
              </div>

              <div className="quiz-results__message" style={{ '--msg-bg': cfg.bg, '--ring-color': cfg.ringColor }}>
                {RESULT_MESSAGES[result.riskLevel]}
              </div>

              <div className="quiz-results__stats">
                <div className="quiz-results__stat">
                  <div className="quiz-results__stat-val">{result.totalYes}</div>
                  <div className="quiz-results__stat-lbl">Yes</div>
                </div>
                <div className="quiz-results__stat">
                  <div className="quiz-results__stat-val">{result.total - result.totalYes}</div>
                  <div className="quiz-results__stat-lbl">No</div>
                </div>
                <div className="quiz-results__stat">
                  <div className="quiz-results__stat-val">{result.total}</div>
                  <div className="quiz-results__stat-lbl">Total</div>
                </div>
              </div>

              {!result.saved && (
                <div className="quiz-results__info-note">
                  {result.message || "Complete the full assessment to save your results and receive a personalised plan."}
                </div>
              )}

              {!childSessionId && (
                <div className="quiz-results__cta">
                  <p>For a complete, structured evaluation with a detailed action plan, create a child profile and begin the full assessment.</p>
                  <button className="quiz-results__cta-btn" onClick={() => navigate('/child-info')}>
                    Start Free Assessment →
                  </button>
                </div>
              )}

              {needsTherapy && childSessionId && (
                <div className="quiz-results__cta">
                  <p>Based on these results, a specialist evaluation is strongly recommended. Connect with a certified therapist to create a personalised intervention plan.</p>
                  <button className="quiz-results__cta-btn" onClick={() => navigate('/auth')}>
                    Sign up for a Treatment Plan →
                  </button>
                </div>
              )}

              <div className="quiz-results__actions">
                <button className="quiz-results__btn quiz-results__btn--outline" onClick={resetQuiz}>
                  Take Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-page">
      <QuizHeader onBack={() => navigate('/')} />
      <div className="quiz-page__container">
        <div className="quiz-page__hero">
          <div className="quiz-page__hero-eyebrow">Early Detection Assessment</div>
          <h1>Dyslexia Screening Tool</h1>
          <p>Answer the following questions about your child. Each page contains 4 questions.</p>
        </div>
        {error && <div className="quiz-page__error">{error}</div>}
        <div className="quiz-page__questions">
          {currentQs.map((q, idx) => {
            const answered = q.id in answers;
            return (
              <div key={q.id} className={`quiz-page__question ${answered ? 'answered' : ''}`}>
                <div className="quiz-page__question-left">
                  <div className="quiz-page__q-num">{answered ? '✓' : startIndex + idx + 1}</div>
                  <p className="quiz-page__q-text">{q.question_text}</p>
                </div>
                <div className="quiz-page__options">
                  <button className={`quiz-page__option quiz-page__option--no ${answers[q.id] === false ? 'selected' : ''}`} onClick={() => handleAnswer(q.id, false)}>No</button>
                  <button className={`quiz-page__option quiz-page__option--yes ${answers[q.id] === true ? 'selected' : ''}`} onClick={() => handleAnswer(q.id, true)}>Yes</button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="quiz-page__nav">
          {currentPage > 0 && <button className="quiz-page__nav-btn quiz-page__nav-btn--back" onClick={handlePrev}>← Previous</button>}
          <div className="quiz-page__nav-spacer" />
          {currentPage < totalPages - 1 ? (
            <button className={`quiz-page__nav-btn quiz-page__nav-btn--next ${!pageAnswered ? 'disabled' : ''}`} onClick={handleNext} disabled={!pageAnswered}>Next Page →</button>
          ) : (
            <button className={`quiz-page__nav-btn quiz-page__nav-btn--submit ${totalAnswered < questions.length || submitting ? 'disabled' : ''}`} onClick={handleSubmit} disabled={totalAnswered < questions.length || submitting}>{submitting ? 'Saving…' : 'Submit Assessment'}</button>
          )}
        </div>
        {currentPage === totalPages - 1 && totalAnswered < questions.length && <p className="quiz-page__submit-hint">Answer all {questions.length} questions to submit.</p>}
      </div>
    </div>
  );
}

// ========== QuizHeader Component ==========
function QuizHeader({ onBack, label = '←' }) {
  return (
    <div className="quiz-page__header">
      <button className="quiz-page__back" onClick={onBack}>{label}</button>
      <div className="quiz-page__logo">
        <div className="quiz-page__logo-icon">DS</div>
        <span className="quiz-page__logo-text">Dyslexia Support</span>
      </div>
    </div>
  );
}