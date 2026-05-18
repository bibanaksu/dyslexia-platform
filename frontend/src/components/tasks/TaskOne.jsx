import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./TaskOne.css";
import { getChildInfo, getUserInfo, getCurrentChildSessionId } from "../../utils/childSession";

const EXERCISES = [
  {
    id: 1, key: "similarWords", title: "Twins Words 👯",
    description: "Words that look or sound similar", icon: "👯",
    accent: "#3D5A4C", accentDark: "#2C4A3A",
    words: ["cat","bat","hat","mat","cap","cup","map","mop","pin","pen",
            "sit","set","bad","bed","big","pig","fan","van","tap","top"],
    timeLimit: 120,
  },
  {
    id: 2, key: "nonSimilarWords", title: "Everyday Words 🏡",
    description: "Words you know from daily life", icon: "🏡",
    accent: "#E8A87C", accentDark: "#C45D2C",
    words: ["house","tree","school","water","mother","father","child","book",
            "table","chair","apple","bread","car","road","sun","moon","dog",
            "cat","friend","teacher"],
    timeLimit: 150,
  },
  {
    id: 3, key: "nonWords", title: "Funny Words 🤪",
    description: "Made-up words - sound them out!", icon: "🤪",
    accent: "#E8A87C", accentDark: "#C45D2C",
    words: ["mip","lat","nob","kep","sud","fik","zan","pel","mot","rib",
            "dak","vun","sep","gol","tim","paf","lod","kes","bim","ran"],
    timeLimit: 180,
  },
];

const STORAGE_KEY = 'task_one_progress';

const getTotalWordsAll = () => EXERCISES.reduce((sum, cat) => sum + cat.words.length, 0);

const playSwipeSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
    g.gain.setValueAtTime(0.1, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.start(); osc.stop(ctx.currentTime + 0.15);
  } catch (e) {}
};

const playSuccessSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start(); osc.stop(ctx.currentTime + 0.2);
  } catch (e) {}
};

const markQuestCompleted = () => {
  const currentQuest = JSON.parse(localStorage.getItem('current_quest') || '{}');
  if (currentQuest.id) {
    const saved = localStorage.getItem('reading_adventure_progress');
    const completed = saved ? JSON.parse(saved) : [];
    if (!completed.includes(currentQuest.id)) {
      localStorage.setItem('reading_adventure_progress', JSON.stringify([...completed, currentQuest.id]));
    }
  }
};

export default function TaskOne() {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState('categories');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryStartTime, setCategoryStartTime] = useState(null);

  const [categoryAnswers, setCategoryAnswers] = useState({
    similarWords: [],
    nonSimilarWords: [],
    nonWords: [],
  });

  const [categoryTimeSpent, setCategoryTimeSpent] = useState({
    similarWords: 0,
    nonSimilarWords: 0,
    nonWords: 0,
  });

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [feedbackBorder, setFeedbackBorder] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // ─── Ref to always hold the latest answers (fix stale closure) ───
  const latestAnswersRef = useRef(categoryAnswers);
  useEffect(() => {
    latestAnswersRef.current = categoryAnswers;
  }, [categoryAnswers]);

  const timerRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);
  const categoryTimerRef = useRef(null);

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const progress = JSON.parse(saved);
      if (progress.child_session_id && !getCurrentChildSessionId()) {
        localStorage.setItem('child_session_id', progress.child_session_id);
      }
      if (progress.categoryAnswers) {
        setCategoryAnswers(progress.categoryAnswers);
      }
      if (progress.categoryTimeSpent) {
        setCategoryTimeSpent(progress.categoryTimeSpent);
      }
      if (progress.currentCategory && progress.currentWordIndex !== undefined) {
        const category = EXERCISES.find(ex => ex.key === progress.currentCategory);
        if (category) {
          setSelectedCategory(category);
          setCurrentWordIndex(progress.currentWordIndex);
          setTimeElapsed(progress.timeElapsed || 0);
          setCurrentScreen('assessment');
          setTimerRunning(false);
          setIsPaused(true);
        }
      }
    }
  }, []);

  // Redirect if no session
  useEffect(() => {
    const sessionId = getCurrentChildSessionId();
    if (!sessionId && currentScreen !== 'categories') {
      setSaveError('No active child session. Redirecting to start...');
      setTimeout(() => navigate('/child-info'), 2000);
    }
  }, [navigate, currentScreen]);

  // Persist progress
  useEffect(() => {
    if (currentScreen === 'assessment' && selectedCategory) {
      const currentSessionId = getCurrentChildSessionId();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        categoryAnswers,
        categoryTimeSpent,
        currentCategory: selectedCategory.key,
        currentWordIndex,
        timeElapsed,
        child_session_id: currentSessionId,
        lastUpdated: Date.now(),
      }));
    } else if (currentScreen !== 'assessment') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        categoryAnswers,
        categoryTimeSpent,
        child_session_id: getCurrentChildSessionId(),
        lastUpdated: Date.now()
      }));
    }
  }, [categoryAnswers, categoryTimeSpent, currentScreen, selectedCategory, currentWordIndex, timeElapsed]);

  // Timer
  useEffect(() => {
    if (timerRunning && !isPaused) {
      timerRef.current = setInterval(() => setTimeElapsed(p => p + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning, isPaused]);

  // Category time tracking
  useEffect(() => {
    if (currentScreen === 'assessment' && !isPaused && categoryStartTime && selectedCategory) {
      if (categoryTimerRef.current) clearInterval(categoryTimerRef.current);
      categoryTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - categoryStartTime) / 1000);
        setCategoryTimeSpent(prev => ({
          ...prev,
          [selectedCategory.key]: elapsed,
        }));
      }, 1000);
    }
    return () => { if (categoryTimerRef.current) clearInterval(categoryTimerRef.current); };
  }, [currentScreen, isPaused, categoryStartTime, selectedCategory]);

  useEffect(() => {
    return () => { if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current); };
  }, []);

  // Mark quest completed when on final results
  useEffect(() => {
    if (currentScreen === 'finalResults') {
      markQuestCompleted();
    }
  }, [currentScreen]);

  // ─── Build payload for backend ──────────────────────────────────────────
  const buildPayloadForBackend = useCallback((answers, totalCorrect, totalCompleted, percentage) => {
    const childSessionId = getCurrentChildSessionId();
    if (!childSessionId) throw new Error('No active child session ID');
    const user = getUserInfo();

    const similarAnswers    = answers.similarWords    || [];
    const nonSimilarAnswers = answers.nonSimilarWords || [];
    const nonWordsAnswers   = answers.nonWords        || [];

    const similarCorrect    = similarAnswers.filter(a => a.correct).length;
    const nonSimilarCorrect = nonSimilarAnswers.filter(a => a.correct).length;
    const nonWordsCorrect   = nonWordsAnswers.filter(a => a.correct).length;

    let performanceLevel = 'Needs Improvement';
    if (percentage >= 90) performanceLevel = 'Excellent';
    else if (percentage >= 75) performanceLevel = 'Good';
    else if (percentage >= 60) performanceLevel = 'Satisfactory';

    const totalTimeSeconds = categoryTimeSpent.similarWords + categoryTimeSpent.nonSimilarWords + categoryTimeSpent.nonWords;
    const avgTimePerWord   = totalCompleted > 0 ? Math.round(totalTimeSeconds / totalCompleted) : 0;

    const allErrors = [
      ...similarAnswers.filter(a => !a.correct).map(a => a.word),
      ...nonSimilarAnswers.filter(a => !a.correct).map(a => a.word),
      ...nonWordsAnswers.filter(a => !a.correct).map(a => a.word),
    ];

    const totalWordsAll = getTotalWordsAll();

    return {
      child_session_id:        parseInt(childSessionId, 10),
      child_id:                user?.childId ? parseInt(user.childId, 10) : null,
      similar_words_score:     similarCorrect,
      non_similar_words_score: nonSimilarCorrect,
      pseudo_words_score:      nonWordsCorrect,
      total_score:             totalCorrect,
      total_words:             totalWordsAll,
      percentage,
      performance_level:       performanceLevel,
      total_time_seconds:      totalTimeSeconds,
      avg_time_per_word:       avgTimePerWord,
      error_patterns:          allErrors.length > 0 ? JSON.stringify(allErrors) : null,
    };
  }, [categoryTimeSpent]);

  // Save to backend
  const saveResultsToBackend = useCallback(async (payload) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    setIsSaving(true);
    setSaveError('');
    try {
      const res = await axios.post(`/api/task1/submit`, payload, { headers });
      if (res.data?.resultId) console.log('✅ Task1 saved, id:', res.data.resultId);
      return true;
    } catch (error) {
      console.error('❌ Save error:', error.response?.data || error.message);
      setSaveError(error.response?.data?.error || 'Network error – progress saved locally only.');
      return false;
    } finally {
      setTimeout(() => setIsSaving(false), 800);
    }
  }, []);

  // ─── Finalise entire assessment (saves and navigates to results) ─────────
  const finaliseAssessment = useCallback(async () => {
    const finalAnswers = latestAnswersRef.current;

    const similarAnswers    = finalAnswers.similarWords    || [];
    const nonSimilarAnswers = finalAnswers.nonSimilarWords || [];
    const nonWordsAnswers   = finalAnswers.nonWords        || [];

    const totalCorrect =
      similarAnswers.filter(a => a.correct).length +
      nonSimilarAnswers.filter(a => a.correct).length +
      nonWordsAnswers.filter(a => a.correct).length;

    const totalCompleted =
      similarAnswers.length +
      nonSimilarAnswers.length +
      nonWordsAnswers.length;

    const percentage = totalCompleted > 0
      ? Math.round((totalCorrect / totalCompleted) * 100)
      : 0;

    // Build final payload
    const payload = buildPayloadForBackend(finalAnswers, totalCorrect, totalCompleted, percentage);
    await saveResultsToBackend(payload);

    // Store results for the results screen
    localStorage.setItem('task1_final_results', JSON.stringify({
      totalCorrect,
      totalCompleted,
      percentage,
      categoryAnswers: finalAnswers,
    }));

    // Clear local progress and navigate
    localStorage.removeItem(STORAGE_KEY);
    setCurrentScreen('finalResults');
  }, [buildPayloadForBackend, saveResultsToBackend]);

  const startCategory = (categoryKey) => {
    const category = EXERCISES.find(ex => ex.key === categoryKey);
    const answers  = categoryAnswers[categoryKey] || [];
    setSelectedCategory(category);
    setCurrentWordIndex(answers.length);
    setTimeElapsed(0);
    setTimerRunning(true);
    setIsPaused(false);
    setCategoryStartTime(Date.now());
    setCurrentScreen('assessment');
  };

  const handlePause = async () => {
    setIsPaused(true);
    setTimerRunning(false);
    if (categoryTimerRef.current) clearInterval(categoryTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    // Save partial progress
    const latest = latestAnswersRef.current;
    const totalCorrect = Object.values(latest).flat().filter(a => a?.correct).length;
    const totalCompleted = Object.values(latest).flat().length;
    const percentage = totalCompleted > 0 ? Math.round((totalCorrect / totalCompleted) * 100) : 0;
    const payload = buildPayloadForBackend(latest, totalCorrect, totalCompleted, percentage);
    await saveResultsToBackend(payload);
  };

  const handleResume = () => {
    setIsPaused(false);
    setTimerRunning(true);
    const savedTime = categoryTimeSpent[selectedCategory?.key] || 0;
    setCategoryStartTime(Date.now() - savedTime * 1000);
  };

  const handleQuit = async () => {
    await handlePause(); // saves partial
    localStorage.removeItem(STORAGE_KEY);
    setCurrentScreen('categories');
  };

  const handleAnswer = async (isCorrect) => {
    if (feedbackBorder) return;
    isCorrect ? playSuccessSound() : playSwipeSound();
    setFeedbackBorder(isCorrect ? 'correct' : 'incorrect');

    const word        = selectedCategory.words[currentWordIndex];
    const categoryKey = selectedCategory.key;
    const newAnswer   = { word, correct: isCorrect };

    // Snapshot current answers for this category
    const currentCategoryAnswers    = latestAnswersRef.current[categoryKey] || [];
    const newAnswersForCategory     = [...currentCategoryAnswers, newAnswer];
    const isLastWordInCategory      = newAnswersForCategory.length === selectedCategory.words.length;

    // Commit to state
    setCategoryAnswers(prev => ({
      ...prev,
      [categoryKey]: newAnswersForCategory,
    }));

    feedbackTimeoutRef.current = setTimeout(async () => {
      setFeedbackBorder(null);

      if (!isLastWordInCategory) {
        // More words in this category
        setCurrentWordIndex(prev => prev + 1);
      } else {
        // This category is done – check if all categories are complete
        const latest = {
          ...latestAnswersRef.current,
          [categoryKey]: newAnswersForCategory,
        };

        const allDone = EXERCISES.every(cat => {
          const count = latest[cat.key]?.length ?? 0;
          return count === cat.words.length;
        });

        if (allDone) {
          // Stop all timers
          setTimerRunning(false);
          if (categoryTimerRef.current) clearInterval(categoryTimerRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
          // Finalise everything (saves & navigates)
          await finaliseAssessment();
        } else {
          // Not finished – go back to categories screen to choose next category
          setCurrentScreen('categories');
        }
      }
    }, 300);
  };

  const calculateTotalProgress = () => {
    const totalCompleted = Object.values(categoryAnswers).reduce((sum, arr) => sum + arr.length, 0);
    return Math.round((totalCompleted / getTotalWordsAll()) * 100);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ========== CATEGORIES SCREEN ==========
  if (currentScreen === 'categories') {
    const totalProgress = calculateTotalProgress();
    return (
      <div className="task-one-container categories-screen">
        <div className="task-bg" /><div className="dark-overlay" />
        <div className="task-brand">
          <div className="task-logo-icon">DS</div>
        </div>
        <div className="categories-grid">
          {EXERCISES.map((category) => {
            const answers   = categoryAnswers[category.key] || [];
            const completed = answers.length;
            const correct   = answers.filter(a => a.correct).length;
            const totalWords = category.words.length;
            const pct       = totalWords > 0 ? Math.round((completed / totalWords) * 100) : 0;
            const isDone    = completed === totalWords;
            return (
              <div
                key={category.key}
                className={`category-card ${isDone ? 'completed' : ''}`}
                onClick={() => !isDone && startCategory(category.key)}
                style={{ cursor: isDone ? 'default' : 'pointer' }}
              >
                <div className="category-icon">{category.icon}</div>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
                <div className="category-stats">
                  <div className="stat">
                    <span className="stat-label">Words:</span>
                    <span className="stat-value">{completed}/{totalWords}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Correct:</span>
                    <span className="stat-value">{correct}</span>
                  </div>
                </div>
                <div className="progress-indicator">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                  <span className="progress-percentage">{pct}%</span>
                </div>
                {!isDone && (
                  <button className="category-button">
                    {completed > 0 ? '▶️ Continue' : '🚀 Start'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {totalProgress === 100 && (
          <div className="celebration">
            <div className="confetti">🎉</div>
            <p className="celebration-text">All challenges completed! Ready for results?</p>
            <button className="btn-final-results" onClick={finaliseAssessment}>
              See Final Results 🏆
            </button>
          </div>
        )}
      </div>
    );
  }

  // ========== ASSESSMENT SCREEN ==========
  if (currentScreen === 'assessment' && selectedCategory) {
    const word       = selectedCategory.words[currentWordIndex];
    const totalWords = selectedCategory.words.length;
    const progress   = ((currentWordIndex + 1) / totalWords) * 100;
    return (
      <div className="task-one-container assessment-screen">
        <div className="task-bg" /><div className="dark-overlay" />
        <div className="assessment-header-bar">
          <div className="header-left">
            <div className="task-logo-icon">DS</div>
            <button className="btn-pause" onClick={handlePause}>
              {isPaused ? '▶️ Resume' : '⏸️ Pause'}
            </button>
            <span className="category-name">{selectedCategory.title}</span>
          </div>
          <div className="header-center">
            <div className="progress-display">Word {currentWordIndex + 1} of {totalWords}</div>
          </div>
          <div className="header-right">
            <div className="timer">{formatTime(timeElapsed)}</div>
          </div>
        </div>
        <div className="assessment-progress-bar">
          <div className="assessment-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="word-display-area">
          <div className={`word-card-big ${feedbackBorder === 'correct' ? 'feedback-correct-border' : ''} ${feedbackBorder === 'incorrect' ? 'feedback-incorrect-border' : ''}`}>
            <div className="word-text-big">
              {word.split('').map((letter, i) => (
                <span key={i} className="letter-animated" style={{ animationDelay: `${i * 0.1}s` }}>
                  {letter}
                </span>
              ))}
            </div>
            <div className="word-hint">
              {selectedCategory.key === 'nonWords' ? '🔤 Sound it out!' : '📖 Read it out loud!'}
            </div>
          </div>
          <div className="character-area">
            <div className="character-thinking">🦁</div>
            <div className="speech-bubble">Can you read this word?</div>
          </div>
        </div>
        <div className="assessment-action-buttons">
          <button
            className="btn-next-word"
            onClick={() => handleAnswer(false)}
            disabled={feedbackBorder !== null}
          >
            ➡️ Next Word
          </button>
          <button
            className="btn-got-it"
            onClick={() => handleAnswer(true)}
            disabled={feedbackBorder !== null}
          >
            ✅ Got It!
          </button>
        </div>
        {isPaused && (
          <div className="pause-overlay-full">
            <div className="pause-content-card">
              <h2>⏸️ Game Paused</h2>
              <p>Your progress has been saved!</p>
              <button className="btn-resume-game" onClick={handleResume}>▶️ Resume Challenge</button>
              <button className="btn-quit-game" onClick={handleQuit}>🏠 Save & Quit</button>
            </div>
          </div>
        )}
        {isSaving && (
          <div className="saving-overlay">
            <div className="saving-spinner">💾 Saving...</div>
          </div>
        )}
        {saveError && !isSaving && <div className="error-notice">{saveError}</div>}
      </div>
    );
  }

  // ========== RESULTS SCREEN ==========
  if (currentScreen === 'finalResults') {
    // Try to load from localStorage first (fallback in case state is stale)
    const stored = localStorage.getItem('task1_final_results');
    let finalData = stored ? JSON.parse(stored) : null;

    let similarAnswers, nonSimilarAnswers, nonWordsAnswers;
    let totalCorrect, totalCompleted, percentage;

    if (finalData) {
      totalCorrect   = finalData.totalCorrect;
      totalCompleted = finalData.totalCompleted;
      percentage     = finalData.percentage;
      similarAnswers    = finalData.categoryAnswers?.similarWords    || [];
      nonSimilarAnswers = finalData.categoryAnswers?.nonSimilarWords || [];
      nonWordsAnswers   = finalData.categoryAnswers?.nonWords        || [];
    } else {
      // Fallback to current state
      similarAnswers    = categoryAnswers.similarWords    || [];
      nonSimilarAnswers = categoryAnswers.nonSimilarWords || [];
      nonWordsAnswers   = categoryAnswers.nonWords        || [];
      totalCorrect = [...similarAnswers, ...nonSimilarAnswers, ...nonWordsAnswers].filter(a => a.correct).length;
      totalCompleted = similarAnswers.length + nonSimilarAnswers.length + nonWordsAnswers.length;
      percentage = totalCompleted > 0 ? Math.round((totalCorrect / totalCompleted) * 100) : 0;
    }

    return (
      <div className="task-one-container results-screen">
        <div className="task-bg" /><div className="dark-overlay" />
        <div className="task-brand">
          <div className="task-logo-icon">DS</div>
        </div>
        <div className="results-header-area">
          <div className="trophy-icon">🤩</div>
          <h1>Reading Champion!</h1>
          <p>You completed all 3 challenges! Amazing work! 🎉</p>
        </div>
        <div className="final-score-area">
          <div className="score-circle-big">
            <span className="score-number-big">{totalCorrect}/{totalCompleted}</span>
            <span className="score-label-small">Words Correct</span>
          </div>
          <div className="score-grade-area">
            <div
              className="grade-circle-big"
              style={{ background: percentage >= 80 ? '#7fb685' : percentage >= 60 ? '#ff9a76' : '#a8d0db' }}
            >
              {percentage}%
            </div>
            <p className="grade-label-text">
              {percentage >= 80 ? '🌟 Excellent!' : percentage >= 60 ? '👍 Good Job!' : '💪 Keep Practicing!'}
            </p>
          </div>
        </div>
        <div className="category-breakdown-area">
          <h2>Your Results by Challenge</h2>
          <div className="breakdown-grid-area">
            {EXERCISES.map((category) => {
              let answers, correct, total;
              if (category.key === 'similarWords') {
                answers = similarAnswers;
              } else if (category.key === 'nonSimilarWords') {
                answers = nonSimilarAnswers;
              } else {
                answers = nonWordsAnswers;
              }
              correct = answers.filter(a => a.correct).length;
              total = answers.length;
              const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
              return (
                <div key={category.key} className="breakdown-card-item">
                  <div className="breakdown-icon-item">{category.icon}</div>
                  <h3>{category.title}</h3>
                  <div className="breakdown-score-item">
                    {correct}/{total} <span className="percentage-item">({pct}%)</span>
                  </div>
                  <div className="breakdown-bar-item">
                    <div className="bar-fill-item" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="results-action-buttons">
          <button className="btn-home-page" onClick={() => navigate('/adventure')}>
            🏠 Back to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}