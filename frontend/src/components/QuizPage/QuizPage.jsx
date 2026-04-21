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
    emoji: '✅',
    icon: '🟢',
  },
  MODERATE: {
    color: '#E8A234',
    bg: '#FFF3DC',
    ringColor: '#E8A234',
    headerBg: 'linear-gradient(135deg, #FFF3DC, #FFF8EC)',
    label: 'Moderate Risk',
    emoji: '⚠️',
    icon: '🟡',
  },
  HIGH: {
    color: '#D64545',
    bg: '#FDEAEA',
    ringColor: '#D64545',
    headerBg: 'linear-gradient(135deg, #FDEAEA, #FEF2F2)',
    label: 'High Risk',
    emoji: '🔴',
    icon: '🔴',
  },
};

const RESULT_MESSAGES = {
  LOW: 'Your child shows few risk factors for dyslexia. Continue monitoring their development and consult with a professional if you notice any changes.',
  MODERATE: 'Your child shows some risk factors. We recommend discussing these results with a healthcare provider or specialist for further evaluation.',
  HIGH: 'Your child shows several risk factors. We strongly recommend consulting with a pediatrician or dyslexia specialist for a comprehensive evaluation as soon as possible.',
};

const GRADES = [
  'Kindergarten','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5',
  'Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12',
];

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
  const [questions, setQuestions]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [fetchError, setFetchError]     = useState('');
  const [currentPage, setCurrentPage]   = useState(0);
  const [answers, setAnswers]           = useState({});
  const [childFullName, setChildFullName] = useState('');
  const [childGrade, setChildGrade]     = useState('');
  const [result, setResult]             = useState(null);
  const [error, setError]               = useState('');

  /* ── Fetch questions ──────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    async function fetchQuestions() {
      try {
        const res  = await fetch(`${API}/api/quiz/questions`);
        const data = await res.json();

        if (cancelled) return;

        if (res.ok && data.success && Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
          setFetchError('');
        } else {
          setFetchError('Could not load questions from server — using built-in questions.');
          setQuestions(FALLBACK_QUESTIONS);
        }
      } catch {
        if (!cancelled) {
          setFetchError('Cannot reach server — using built-in questions.');
          setQuestions(FALLBACK_QUESTIONS);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchQuestions();
    return () => { cancelled = true; };
  }, []);

  /* ── Derived values ───────────────────────────────────── */
  const totalPages     = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const startIndex     = currentPage * QUESTIONS_PER_PAGE;
  const currentQs      = questions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);
  const totalAnswered  = Object.keys(answers).length;
  const progress       = questions.length > 0 ? (totalAnswered / questions.length) * 100 : 0;
  const pageAnswered   = currentQs.every(q => q.id in answers);

  /* ── Handlers ─────────────────────────────────────────── */
  const handleAnswer = (id, val) =>
    setAnswers(prev => ({ ...prev, [id]: val }));

  const handleNext = () => {
    if (!pageAnswered) return;
    setCurrentPage(p => p + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = () => {
    setCurrentPage(p => p - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!childFullName.trim()) { setError("Please enter your child's full name."); return; }
    if (!childGrade)           { setError("Please select your child's grade level."); return; }
    if (totalAnswered < questions.length) { setError('Please answer all questions before submitting.'); return; }

    setError('');
    setSubmitting(true);

    const yesCount  = Object.values(answers).filter(Boolean).length;
    const pct       = (yesCount / questions.length) * 100;
    const riskLevel = pct <= 25 ? 'LOW' : pct <= 60 ? 'MODERATE' : 'HIGH';
    const token     = localStorage.getItem('token');

    try {
      const res  = await fetch(`${API}/api/quiz/submit`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          answers,
          childFullName: childFullName.trim(),
          childGrade,
          riskLevel,
        }),
      });

      const data = await res.json();

      setResult({
        totalYes:  yesCount,
        total:     questions.length,
        percentage: Math.round(pct),
        riskLevel,
        childName: childFullName.trim(),
        childGrade,
        saved:     res.ok && data.success,
        message:   data.message || '',
      });
    } catch {
      // Show results locally even if save fails
      setResult({
        totalYes:  yesCount,
        total:     questions.length,
        percentage: Math.round(pct),
        riskLevel,
        childName: childFullName.trim(),
        childGrade,
        saved:     false,
        message:   'Network error — results shown locally.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setAnswers({});
    setResult(null);
    setCurrentPage(0);
    setChildFullName('');
    setChildGrade('');
    setError('');
  };

  /* ── Loading ──────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="quiz-page">
        <QuizHeader onBack={() => navigate('/')} />
        <div className="quiz-page__loading">
          <div className="quiz-page__spinner" />
          <h2>Preparing Assessment</h2>
          <p>Loading questions, just a moment…</p>
        </div>
      </div>
    );
  }

  /* ── Results ──────────────────────────────────────────── */
  if (result) {
    const cfg = RISK_CONFIG[result.riskLevel] || RISK_CONFIG.LOW;
    return (
      <div className="quiz-page">
        <QuizHeader onBack={resetQuiz} label="← Take Again" />
        <div className="quiz-page__results-wrapper">
          <div className="quiz-results">

            {/* Coloured header band */}
            <div
              className="quiz-results__header"
              style={{ '--header-bg': cfg.headerBg }}
            >
              <div className="quiz-results__emoji-wrap">{cfg.emoji}</div>
              <h2 className="quiz-results__title">Assessment Complete</h2>
              <p className="quiz-results__subtitle">
                Dyslexia Screening Report for {result.childName}
              </p>
            </div>

            <div className="quiz-results__body">

              {/* Child pill */}
              <div className="quiz-results__child-pill">
                <span>👤 <strong>{result.childName}</strong></span>
                <div className="quiz-results__child-divider" />
                <span>🎓 <strong>{result.childGrade}</strong></span>
              </div>

              {/* Ring + Badge */}
              <div className="quiz-results__ring-wrap">
                <div
                  className="quiz-results__score-ring"
                  style={{ '--ring-color': cfg.ringColor }}
                >
                  <span className="quiz-results__pct">{result.percentage}%</span>
                  <span className="quiz-results__pct-label">Risk Score</span>
                </div>
                <div
                  className="quiz-results__badge"
                  style={{ color: cfg.color, borderColor: cfg.color, background: cfg.bg }}
                >
                  {cfg.icon} {cfg.label}
                </div>
              </div>

              {/* Message */}
              <div
                className="quiz-results__message"
                style={{ '--msg-bg': cfg.bg, '--ring-color': cfg.ringColor }}
              >
                {RESULT_MESSAGES[result.riskLevel]}
              </div>

              {/* Stats */}
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

              {/* Save status */}
              {result.saved ? (
                <p className="quiz-results__saved-note">✓ Results saved to your account</p>
              ) : (
                <div className="quiz-results__warning-note">
                  ⚠️ {result.message || 'Log in to save your results.'}
                </div>
              )}

              {/* CTA */}
              {result.riskLevel !== 'LOW' && (
                <div className="quiz-results__cta">
                  <p>
                    {result.riskLevel === 'HIGH'
                      ? 'We strongly recommend consulting a specialist. Our platform connects you with certified therapists.'
                      : 'A professional evaluation can give you clarity. Connect with a specialist today.'}
                  </p>
                  <button
                    className="quiz-results__cta-btn"
                    onClick={() => navigate('/therapists')}
                  >
                    Find a Specialist →
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="quiz-results__actions">
                <button className="quiz-results__btn quiz-results__btn--outline" onClick={resetQuiz}>
                  Take Again
                </button>
                <button className="quiz-results__btn quiz-results__btn--primary" onClick={() => navigate('/')}>
                  Back to Home
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Quiz ─────────────────────────────────────────────── */
  return (
    <div className="quiz-page">
      <QuizHeader onBack={() => navigate('/')} />

      <div className="quiz-page__container">

        {/* Hero */}
        <div className="quiz-page__hero">
          <div className="quiz-page__hero-eyebrow">
            📋 Dyslexia Screening Tool
          </div>
          <h1>Early Detection Assessment</h1>
          <p>Answer a few questions about your child to receive a personalised risk evaluation.</p>
        </div>

        {/* Fetch warning */}
        {fetchError && (
          <div className="quiz-page__error" style={{ marginBottom: '1rem' }}>
            ℹ️ {fetchError}
          </div>
        )}

        

        {/* Child Info */}
        <div className="quiz-page__child-info">
          <div className="quiz-page__child-info-header">
            <div className="quiz-page__child-info-icon">👤</div>
            <h3>
              About Your Child
              <span>— required</span>
            </h3>
          </div>
          <div className="quiz-page__child-fields">
            <div className="quiz-page__field">
              <label>Child's Full Name</label>
              <input
                type="text"
                placeholder="e.g. Sarah Johnson"
                value={childFullName}
                onChange={e => setChildFullName(e.target.value)}
              />
            </div>
            <div className="quiz-page__field">
              <label>Grade Level</label>
              <select value={childGrade} onChange={e => setChildGrade(e.target.value)}>
                <option value="">Select grade…</option>
                {GRADES.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="quiz-page__questions">
          {currentQs.map((q, idx) => {
            const answered = q.id in answers;
            return (
              <div
                key={q.id}
                className={`quiz-page__question${answered ? ' answered' : ''}`}
              >
                <div className="quiz-page__question-left">
                  <div className="quiz-page__q-num">
                    {answered ? '✓' : startIndex + idx + 1}
                  </div>
                  <p className="quiz-page__q-text">{q.question_text}</p>
                </div>
                <div className="quiz-page__options">
                  <button
                    className={`quiz-page__option quiz-page__option--no${answers[q.id] === false ? ' selected' : ''}`}
                    onClick={() => handleAnswer(q.id, false)}
                  >
                    No
                  </button>
                  <button
                    className={`quiz-page__option quiz-page__option--yes${answers[q.id] === true ? ' selected' : ''}`}
                    onClick={() => handleAnswer(q.id, true)}
                  >
                    Yes
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {error && <div className="quiz-page__error">{error}</div>}

        {/* Navigation */}
        <div className="quiz-page__nav">
          {currentPage > 0 && (
            <button className="quiz-page__nav-btn quiz-page__nav-btn--back" onClick={handlePrev}>
              ← Previous
            </button>
          )}
          <div className="quiz-page__nav-spacer" />
          {currentPage < totalPages - 1 ? (
            <button
              className={`quiz-page__nav-btn quiz-page__nav-btn--next${!pageAnswered ? ' disabled' : ''}`}
              onClick={handleNext}
              disabled={!pageAnswered}
            >
              Next Page →
            </button>
          ) : (
            <button
              className={`quiz-page__nav-btn quiz-page__nav-btn--submit${
                totalAnswered < questions.length || submitting ? ' disabled' : ''
              }`}
              onClick={handleSubmit}
              disabled={totalAnswered < questions.length || submitting}
            >
              {submitting ? 'Saving…' : 'Submit Assessment →'}
            </button>
          )}
        </div>

        {currentPage === totalPages - 1 && totalAnswered < questions.length && (
          <p className="quiz-page__submit-hint">
            Answer all {questions.length} questions to submit.
          </p>
        )}

      </div>
    </div>
  );
}

/* ── Shared Header Component ─────────────────────────────── */
function QuizHeader({ onBack, label = '← Back' }) {
  return (
    <div className="quiz-page__header">
      <button className="quiz-page__back" onClick={onBack}>
        {label}
      </button>
      <span className="quiz-page__header-brand">DyslexiaSupport</span>
    </div>
  );
}