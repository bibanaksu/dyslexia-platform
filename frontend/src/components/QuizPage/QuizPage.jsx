import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './QuizPage.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── Result messages ────────────────────────────────────────────────────────
const RESULT_MESSAGES = {
  LOW: 'Your responses do not show strong indicators of reading difficulty at this stage. If you have any concerns, a professional reading assessment can provide reassurance and further guidance.',
  MODERATE: 'Some of your responses suggest it may be helpful to explore your child\'s reading development further. A professional assessment is recommended to better understand their learning profile.',
  HIGH: 'Based on your responses, we recommend a professional reading and learning assessment to better understand your child\'s needs and provide appropriate support.',
};

const RISK_CONFIG = {
  LOW: {
    color: '#3AB07A', bg: '#E8F8F0', ringColor: '#3AB07A',
    headerBg: 'linear-gradient(135deg, #E8F8F0, #F0FAF4)',
    label: 'No immediate concerns',
  },
  MODERATE: {
    color: '#E8A234', bg: '#FFF3DC', ringColor: '#E8A234',
    headerBg: 'linear-gradient(135deg, #FFF3DC, #FFF8EC)',
    label: 'Further evaluation recommended',
  },
  HIGH: {
    color: '#D64545', bg: '#FDEAEA', ringColor: '#D64545',
    headerBg: 'linear-gradient(135deg, #FDEAEA, #FEF2F2)',
    label: 'Assessment strongly recommended',
  },
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

// ─── Key used to persist a pending (pre-session) quiz in sessionStorage ─────
const PENDING_QUIZ_KEY = 'pending_quiz';

// ─────────────────────────────────────────────────────────────────────────────
// Exported helper: link a previously submitted quiz to a child session
// ─────────────────────────────────────────────────────────────────────────────
export async function linkPendingQuiz(childSessionId) {
  try {
    const raw = sessionStorage.getItem(PENDING_QUIZ_KEY);
    if (!raw) return false;

    const pending = JSON.parse(raw);
    if (!pending?.guest_quiz_id) return false;

    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/quiz/link-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        guest_quiz_id: pending.guest_quiz_id,
        child_session_id: childSessionId,
      }),
    });

    if (res.ok) {
      console.log('✅ Pending quiz linked to session:', childSessionId);
      sessionStorage.removeItem(PENDING_QUIZ_KEY);
      return true;
    } else {
      console.warn('⚠️ Failed to link quiz to session');
      return false;
    }
  } catch (err) {
    console.error('linkPendingQuiz error:', err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function QuizPage() {
  const navigate = useNavigate();
  const [questions, setQuestions]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers]         = useState({});
  const [childSessionId, setChildSessionId] = useState(null);
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState('');

  // ── Read child_session_id (set by child-info form) ───────────────────────
  useEffect(() => {
    const id = sessionStorage.getItem('child_session_id');
    if (id) setChildSessionId(id);
  }, []);

  // ── Fetch questions ───────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function fetchQuestions() {
      try {
        const res  = await fetch(`${API}/api/quiz/questions`);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.success && Array.isArray(data.questions) && data.questions.length) {
          setQuestions(data.questions);
        } else {
          setQuestions(FALLBACK_QUESTIONS);
        }
      } catch {
        if (!cancelled) setQuestions(FALLBACK_QUESTIONS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchQuestions();
    return () => { cancelled = true; };
  }, []);

  const totalPages   = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const startIndex   = currentPage * QUESTIONS_PER_PAGE;
  const currentQs    = questions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);
  const totalAnswered = Object.keys(answers).length;
  const pageAnswered  = currentQs.every(q => q.id in answers);

  const handleAnswer = (id, val) => setAnswers(prev => ({ ...prev, [id]: val }));
  const handleNext   = () => { if (pageAnswered) { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
  const handlePrev   = () => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (totalAnswered < questions.length) {
      setError('Please answer all questions before submitting.');
      return;
    }
    setError('');
    setSubmitting(true);

    const yesCount   = Object.values(answers).filter(Boolean).length;
    const pct        = (yesCount / questions.length) * 100;
    const riskLevel  = pct <= 25 ? 'LOW' : pct <= 60 ? 'MODERATE' : 'HIGH';
    const token      = localStorage.getItem('token');

    // Ordered question metadata (id + display_order) so backend can fill q1..q8
    const orderedQuestions = [...questions].sort((a, b) => a.display_order - b.display_order)
      .map(q => ({ id: q.id, display_order: q.display_order }));

    const payload = {
      child_session_id: childSessionId ?? null,
      answers,
      questions: orderedQuestions,
      total_yes_count: yesCount,
      risk_level: riskLevel,
      risk_score: Math.round(pct),
    };

    const resultsData = {
      totalYes: yesCount,
      total: questions.length,
      percentage: Math.round(pct),
      riskLevel,
      saved: false,
      message: '',
    };

    try {
      const res  = await fetch(`${API}/api/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        resultsData.saved = true;
        resultsData.message = data.message || '';

        // ── If the quiz was submitted WITHOUT a session (parent did quiz first),
        //    save the DB row id so we can link it later when the child-info form
        //    creates the session.
        if (!childSessionId && data.quiz_id) {
          sessionStorage.setItem(
            PENDING_QUIZ_KEY,
            JSON.stringify({ guest_quiz_id: data.quiz_id, riskLevel, riskScore: Math.round(pct) })
          );
        }
      } else {
        resultsData.message = data.error || 'Could not save results.';
      }
    } catch (err) {
      console.error('Quiz submit error:', err);
      resultsData.message = 'Could not save to server.';
    }

    // If still no session, nudge parent to start child-info flow
    if (!childSessionId) {
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

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="quiz-page">
        <QuizHeader onBack={() => navigate('/')} />
        <div className="quiz-page__loading">
          <div className="quiz-page__spinner" />
          <h2>Preparing Assessment</h2>
          <p>Loading questions...</p>
        </div>
      </div>
    );
  }

  // ── Results screen ────────────────────────────────────────────────────────
  if (result) {
    const cfg         = RISK_CONFIG[result.riskLevel];
    const needsTherapy = result.riskLevel === 'MODERATE' || result.riskLevel === 'HIGH';

    return (
      <div className="quiz-page">
        <QuizHeader onBack={resetQuiz} label="← " />
        <div className="quiz-page__results-wrapper">
          <div className="quiz-results">
            <div className="quiz-results__header" style={{ '--header-bg': cfg.headerBg }}>
              <h2 className="quiz-results__title">Quiz Complete</h2>
            </div>

            <div className="quiz-results__body">
              <div className="quiz-results__ring-wrap">
                <div className="quiz-results__score-ring" style={{ '--ring-color': cfg.ringColor }}>
                  <span className="quiz-results__pct">{result.percentage}%</span>
                </div>
                <div
                  className="quiz-results__badge"
                  style={{ color: cfg.color, borderColor: cfg.color, background: cfg.bg }}
                >
                  {cfg.label}
                </div>
              </div>

              <div
                className="quiz-results__message"
                style={{ '--msg-bg': cfg.bg, '--ring-color': cfg.ringColor }}
              >
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

              {!result.saved && result.message && (
                <div className="quiz-results__info-note">{result.message}</div>
              )}

              {/* Parent has NOT yet done the child-info form → nudge them */}
              {!childSessionId && (
                <div className="quiz-results__cta">
                  <p>
                    For a complete, structured evaluation with a detailed action plan, begin the full
                    assessment. Your quiz answers will be automatically saved to the profile.
                  </p>
                  <button
                    className="quiz-results__cta-btn"
                    onClick={() => navigate('/child-info')}
                  >
                    Start Free Assessment →
                  </button>
                </div>
              )}

              {/* Parent HAS a session and needs further support */}
              {needsTherapy && childSessionId && (
                <div className="quiz-results__cta">
                  <p>
                    Based on these results, a specialist evaluation is strongly recommended. Connect
                    with a certified therapist to create a personalised intervention plan.
                  </p>
                  <button
                    className="quiz-results__cta-btn"
                    onClick={() => navigate('/auth')}
                  >
                    Sign up for a Treatment Plan →
                  </button>
                </div>
              )}

              <div className="quiz-results__actions">
                <button
                  className="quiz-results__btn quiz-results__btn--outline"
                  onClick={resetQuiz}
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz screen ───────────────────────────────────────────────────────────
  return (
    <div className="quiz-page">
      <QuizHeader onBack={() => navigate('/')} />
      <div className="quiz-page__container">
        <div className="quiz-page__hero">
          <h1>Parent Dyslexia Quiz</h1>
          <p>Answer the following questions about your child.</p>
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
                  <button
                    className={`quiz-page__option quiz-page__option--no ${answers[q.id] === false ? 'selected' : ''}`}
                    onClick={() => handleAnswer(q.id, false)}
                  >No</button>
                  <button
                    className={`quiz-page__option quiz-page__option--yes ${answers[q.id] === true ? 'selected' : ''}`}
                    onClick={() => handleAnswer(q.id, true)}
                  >Yes</button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="quiz-page__nav">
          {currentPage > 0 && (
            <button className="quiz-page__nav-btn quiz-page__nav-btn--back" onClick={handlePrev}>
              ← Previous
            </button>
          )}
          <div className="quiz-page__nav-spacer" />
          {currentPage < totalPages - 1 ? (
            <button
              className={`quiz-page__nav-btn quiz-page__nav-btn--next ${!pageAnswered ? 'disabled' : ''}`}
              onClick={handleNext}
              disabled={!pageAnswered}
            >
              Next Page →
            </button>
          ) : (
            <button
              className={`quiz-page__nav-btn quiz-page__nav-btn--submit ${totalAnswered < questions.length || submitting ? 'disabled' : ''}`}
              onClick={handleSubmit}
              disabled={totalAnswered < questions.length || submitting}
            >
              {submitting ? 'Saving…' : 'Submit Assessment'}
            </button>
          )}
        </div>

        {currentPage === totalPages - 1 && totalAnswered < questions.length && (
          <p className="quiz-page__submit-hint">Answer all {questions.length} questions to submit.</p>
        )}
      </div>
    </div>
  );
}

// ── QuizHeader ────────────────────────────────────────────────────────────────
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