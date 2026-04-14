// frontend/src/components/tasks/TaskOne.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./TaskOne.css";

/* ─── DATA ─────────────────────────────────────────────── */
const EXERCISES = [
  {
    id: 1,
    key: "similarWords",
    title: "Twins Words 👯",
    description: "Words that look or sound similar",
    icon: "👯",
    accent: "#3D5A4C",
    accentDark: "#2C4A3A",
    words: ["cat","bat","hat","mat","cap","cup","map","mop","pin","pen","sit","set","bad","bed","big","pig","fan","van","tap","top"],
    timeLimit: 120,
  },
  {
    id: 2,
    key: "nonSimilarWords",
    title: "Everyday Words 🏡",
    description: "Words you know from daily life",
    icon: "🏡",
    accent: "#E8A87C",
    accentDark: "#C45D2C",
    words: ["house","tree","school","water","mother","father","child","book","table","chair","apple","bread","car","road","sun","moon","dog","cat","friend","teacher"],
    timeLimit: 150,
  },
  {
    id: 3,
    key: "nonWords",
    title: "Funny Words 🤪",
    description: "Made-up words - sound them out!",
    icon: "🤪",
    accent: "#E8A87C",
    accentDark: "#C45D2C",
    words: ["mip","lat","nob","kep","sud","fik","zan","pel","mot","rib","dak","vun","sep","gol","tim","paf","lod","kes","bim","ran"],
    timeLimit: 180,
  },
];

const API         = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const STORAGE_KEY = 'task_one_progress';

/* ─── Sound helpers ─────────────────────────────────────── */
const playTone = (freq1, freq2, duration) => {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq1, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq2, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration + 0.05);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.05);
  } catch {}
};

const playSuccessSound = () => playTone(600, 800, 0.15);
const playSwipeSound   = () => playTone(400, 200, 0.1);

/* ─── Main Component ─────────────────────────────────────── */
export default function TaskOne() {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen]     = useState('categories');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryProgress, setCategoryProgress] = useState({
    similarWords:    { completed: 0, correct: 0, timeSpent: 0 },
    nonSimilarWords: { completed: 0, correct: 0, timeSpent: 0 },
    nonWords:        { completed: 0, correct: 0, timeSpent: 0 },
  });

  // Assessment state
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [answeredWords, setAnsweredWords]       = useState([]);
  const [timeRemaining, setTimeRemaining]       = useState(0);
  const [categoryStartTime, setCategoryStartTime] = useState(null);
  const [isPaused, setIsPaused]                 = useState(false);
  const [timerRunning, setTimerRunning]         = useState(false);
  const [feedbackBorder, setFeedbackBorder]     = useState(null);

  // Save state
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedId, setSavedId]   = useState(null);

  const timerRef          = useRef(null);
  const feedbackTimeoutRef = useRef(null);

  /* ── Restore progress ─────────────────────────────────── */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const p = JSON.parse(saved);
      setCategoryProgress(p.categoryProgress);
      if (p.currentCategory && p.currentWordIndex !== undefined) {
        const cat = EXERCISES.find(ex => ex.key === p.currentCategory);
        if (cat) {
          setSelectedCategory(cat);
          setCurrentWordIndex(p.currentWordIndex);
          setTimeRemaining(p.timeRemaining);
          setAnsweredWords(p.answeredWords || []);
          setCurrentScreen('assessment');
          setTimerRunning(false);
          setIsPaused(true);
        }
      }
    } catch {}
  }, []);

  /* ── Persist progress ─────────────────────────────────── */
  useEffect(() => {
    const data = currentScreen === 'assessment' && selectedCategory
      ? { categoryProgress, currentCategory: selectedCategory.key, currentWordIndex, timeRemaining, answeredWords, lastUpdated: Date.now() }
      : { categoryProgress, lastUpdated: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [categoryProgress, currentScreen, selectedCategory, currentWordIndex, timeRemaining, answeredWords]);

  /* ── Timer ────────────────────────────────────────────── */
  useEffect(() => {
    if (timerRunning && timeRemaining > 0 && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); setTimerRunning(false); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning, timeRemaining, isPaused]);

  useEffect(() => () => { if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current); }, []);

  /* ── Save results to DB ───────────────────────────────── */
  const saveResultsToDB = async (finalProgress) => {
    setSaving(true);
    setSaveError('');
    const token = localStorage.getItem('token');
    try {
      const res  = await fetch(`${API}/api/assessments/task1/submit`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ categoryProgress: finalProgress }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSavedId(data.sessionId);
        console.log('✅ Task 1 saved, session:', data.sessionId);
      } else {
        setSaveError(data.error || 'Could not save to server.');
      }
    } catch {
      setSaveError('Network error — results shown locally only.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Actions ──────────────────────────────────────────── */
  const startCategory = (categoryKey) => {
    const category = EXERCISES.find(ex => ex.key === categoryKey);
    setSelectedCategory(category);
    setCurrentWordIndex(0);
    setAnsweredWords([]);
    setTimeRemaining(category.timeLimit);
    setCategoryStartTime(Date.now());
    setTimerRunning(true);
    setIsPaused(false);
    setCurrentScreen('assessment');
  };

  const handleResume = () => { setIsPaused(false); setTimerRunning(true); };

  const handleAnswer = (isCorrect) => {
    if (feedbackBorder) return;
    isCorrect ? playSuccessSound() : playSwipeSound();
    setFeedbackBorder(isCorrect ? 'correct' : 'incorrect');

    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedbackBorder(null);
      const currentWord  = selectedCategory.words[currentWordIndex];
      const elapsed      = categoryStartTime ? Math.round((Date.now() - categoryStartTime) / 1000) : 0;

      setAnsweredWords(prev => [
        ...prev,
        { word: currentWord, correct: isCorrect, time: new Date().toLocaleTimeString() },
      ]);

      setCategoryProgress(prev => {
        const updated = {
          ...prev,
          [selectedCategory.key]: {
            ...prev[selectedCategory.key],
            completed: prev[selectedCategory.key].completed + 1,
            correct:   prev[selectedCategory.key].correct + (isCorrect ? 1 : 0),
            timeSpent: elapsed,
          },
        };

        const lastWord = currentWordIndex >= selectedCategory.words.length - 1;
        const allDone  = Object.values(updated).every(cat => cat.completed >= 20);

        if (lastWord) {
          setTimerRunning(false);
          if (allDone) {
            // All 3 categories done — save and show results
            saveResultsToDB(updated);
            setCurrentScreen('finalResults');
          } else {
            setCurrentScreen('categories');
          }
        } else {
          setCurrentWordIndex(i => i + 1);
        }

        return updated;
      });
    }, 300);
  };

  /* ── Helpers ──────────────────────────────────────────── */
  const calculateTotalProgress = () => {
    const completed = Object.values(categoryProgress).reduce((s, c) => s + c.completed, 0);
    return Math.round((completed / 60) * 100);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const getScorePercentage = (p) =>
    p.completed === 0 ? 0 : Math.round((p.correct / p.completed) * 100);

  /* ════════════════════════════════════════════════════════
     CATEGORIES SCREEN
  ════════════════════════════════════════════════════════ */
  if (currentScreen === 'categories') {
    const totalProgress = calculateTotalProgress();
    return (
      <div className="task-one-container categories-screen">
        <div className="task-bg"></div>
        <div className="dark-overlay"></div>

        <div className="categories-grid">
          {EXERCISES.map((category) => {
            const progress    = categoryProgress[category.key];
            const percentage  = Math.round((progress.completed / 20) * 100);

            return (
              <div
                key={category.key}
                className={`category-card ${progress.completed === 20 ? 'completed' : ''}`}
                onClick={() => startCategory(category.key)}
              >
                <div className="category-icon">{category.icon}</div>
                <h3>{category.title}</h3>
                <p>{category.description}</p>

                <div className="category-stats">
                  <div className="stat">
                    <span className="stat-label">Words:</span>
                    <span className="stat-value">{progress.completed}/20</span>
                  </div>
                </div>

                <div className="progress-indicator">
                  <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
                  <span className="progress-percentage">{percentage}%</span>
                </div>

                <button className="category-button">
                  {progress.completed === 20 ? '🎯 Review' : '🚀 Start'}
                </button>
              </div>
            );
          })}
        </div>

        {totalProgress === 100 && (
          <div className="celebration">
            <div className="confetti">🎉</div>
            <p className="celebration-text">All challenges completed! Ready for results?</p>
            <button className="btn-final-results" onClick={() => setCurrentScreen('finalResults')}>
              See Final Results 🏆
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     ASSESSMENT SCREEN
  ════════════════════════════════════════════════════════ */
  if (currentScreen === 'assessment') {
    const category    = selectedCategory;
    const currentWord = category.words[currentWordIndex];
    const progress    = ((currentWordIndex + 1) / 20) * 100;

    return (
      <div className="task-one-container assessment-screen">
        <div className="task-bg"></div>
        <div className="dark-overlay"></div>

        <div className="assessment-header-bar">
          <div className="header-left">
            <button className="btn-pause" onClick={() => setIsPaused(true)}>
              {isPaused ? '▶️ Resume' : '⏸️ Pause'}
            </button>
            <span className="category-name">{category.title}</span>
          </div>

          <div className="header-center">
            <div className="progress-display">Word {currentWordIndex + 1} of 20</div>
          </div>

          <div className="header-right">
            <div className="timer">⏰ {formatTime(timeRemaining)}</div>
          </div>
        </div>

        <div className="assessment-progress-bar">
          <div className="assessment-progress-fill" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="word-display-area">
          <div className={`word-card-big ${feedbackBorder === 'correct' ? 'feedback-correct-border' : ''} ${feedbackBorder === 'incorrect' ? 'feedback-incorrect-border' : ''}`}>
            <div className="word-text-big">
              {currentWord.split('').map((letter, i) => (
                <span key={i} className="letter-animated" style={{ animationDelay: `${i * 0.1}s` }}>
                  {letter}
                </span>
              ))}
            </div>
            <div className="word-hint">
              {category.key === 'nonWords' ? '🔤 Sound it out!' : '📖 Read it out loud!'}
            </div>
          </div>

          <div className="character-area">
            <div className="character-thinking">🐵</div>
            <div className="speech-bubble">Can you read this word?</div>
          </div>
        </div>

        <div className="assessment-action-buttons">
          <button className="btn-next-word" onClick={() => handleAnswer(false)} disabled={feedbackBorder !== null}>
            ➡️ Next Word
            <span className="sub-text">I'll try this later</span>
          </button>
          <button className="btn-got-it" onClick={() => handleAnswer(true)} disabled={feedbackBorder !== null}>
            ✅ Got It!
            <span className="sub-text">I read it correctly</span>
          </button>
        </div>

        {isPaused && (
          <div className="pause-overlay-full">
            <div className="pause-content-card">
              <h2>⏸️ Game Paused</h2>
              <p>Your progress has been saved!</p>
              <button className="btn-resume-game" onClick={handleResume}>▶️ Resume Challenge</button>
              <button className="btn-quit-game" onClick={() => setCurrentScreen('categories')}>🏠 Back to Challenges</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     FINAL RESULTS SCREEN
  ════════════════════════════════════════════════════════ */
  if (currentScreen === 'finalResults') {
    const totalCorrect = Object.values(categoryProgress).reduce((s, c) => s + c.correct, 0);
    const totalWords   = 60;
    const percentage   = Math.round((totalCorrect / totalWords) * 100);

    // Also persist to localStorage (for offline reference)
    localStorage.setItem('task_one_results', JSON.stringify({
      date: new Date().toISOString(), totalCorrect, totalWords, percentage, categoryProgress,
    }));
    localStorage.removeItem(STORAGE_KEY);

    return (
      <div className="task-one-container results-screen">
        <div className="task-bg"></div>
        <div className="dark-overlay"></div>

        <div className="task-nav">
          <button className="nav-back-btn" onClick={() => navigate('/adventure')}>← Back to Adventure</button>
          <div className="nav-title">🏆 Results</div>
          <div className="nav-spacer"></div>
        </div>

        <div className="results-header-area">
          <div className="trophy-icon">🏆</div>
          <h1 className="child-font">Reading Champion!</h1>
          <p>You completed all 3 challenges! Amazing work! 🎉</p>
        </div>

        {/* Save status */}
        {saving && (
          <div style={{ textAlign: 'center', color: '#3D5A4C', marginBottom: '1rem', fontWeight: 600 }}>
            💾 Saving your results…
          </div>
        )}
        {savedId && !saving && (
          <div style={{ textAlign: 'center', color: '#3AB07A', marginBottom: '1rem', fontWeight: 600 }}>
            ✓ Results saved to your account!
          </div>
        )}
        {saveError && !saving && (
          <div style={{ textAlign: 'center', color: '#E8A234', marginBottom: '1rem', fontSize: '.85rem' }}>
            ⚠️ {saveError}
          </div>
        )}

        <div className="final-score-area">
          <div className="score-circle-big">
            <span className="score-number-big">{totalCorrect}/60</span>
            <span className="score-label-small">Words Correct</span>
          </div>
          <div className="score-grade-area">
            <div className="grade-circle-big" style={{
              background: percentage >= 80 ? '#7fb685' : percentage >= 60 ? '#ff9a76' : '#a8d0db',
            }}>
              {percentage}%
            </div>
            <p className="grade-label-text">
              {percentage >= 80 ? '🌟 Excellent!' : percentage >= 60 ? '👍 Good Job!' : '💪 Keep Practicing!'}
            </p>
          </div>
        </div>

        <div className="category-breakdown-area">
          <h2>📊 Your Results by Challenge</h2>
          <div className="breakdown-grid-area">
            {EXERCISES.map((category) => {
              const prog      = categoryProgress[category.key];
              const catPct    = Math.round((prog.correct / 20) * 100);
              return (
                <div key={category.key} className="breakdown-card-item">
                  <div className="breakdown-icon-item">{category.icon}</div>
                  <h3>{category.title}</h3>
                  <div className="breakdown-score-item">
                    <span className="score-number-item">{prog.correct}/20</span>
                    <span className="percentage-item">({catPct}%)</span>
                  </div>
                  <div className="breakdown-bar-item">
                    <div className="bar-fill-item" style={{ width: `${catPct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="recommendations-area">
          <h2>💡 Reading Tips</h2>
          <div className="tips-grid-area">
            <div className="tip-card-item">
              <div className="tip-icon-item">🔤</div>
              <h4>For Twins Words</h4>
              <p>Practice letter sounds: b/p, f/v, sh/ch</p>
            </div>
            <div className="tip-card-item">
              <div className="tip-icon-item">📚</div>
              <h4>For Everyday Words</h4>
              <p>Read books about things you love!</p>
            </div>
            <div className="tip-card-item">
              <div className="tip-icon-item">🎮</div>
              <h4>For Funny Words</h4>
              <p>Play sound games - you're great at decoding!</p>
            </div>
          </div>
        </div>

        <div className="results-action-buttons">
          <button className="btn-play-again" onClick={() => {
            setCategoryProgress({
              similarWords:    { completed: 0, correct: 0, timeSpent: 0 },
              nonSimilarWords: { completed: 0, correct: 0, timeSpent: 0 },
              nonWords:        { completed: 0, correct: 0, timeSpent: 0 },
            });
            setSavedId(null);
            setSaveError('');
            setCurrentScreen('categories');
          }}>
            🔄 Play Again
          </button>
          <button className="btn-home-page" onClick={() => navigate('/adventure')}>
            🏠 Back to Home
          </button>
        </div>

        <div className="certificate-area">
          <p>🎓 <strong>Certificate of Reading</strong></p>
          <p>Presented to: <em>Our Amazing Reader</em></p>
          <p>For completing the Dyslexia Word Adventure!</p>
          <p className="certificate-date">{new Date().toLocaleDateString()}</p>
        </div>
      </div>
    );
  }

  return null;
}