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
    words: ["cat", "bat", "hat", "mat", "cap", "cup", "map", "mop", "pin", "pen", "sit", "set", "bad", "bed", "big", "pig", "fan", "van", "tap", "top"],
    timeLimit: 120
  },
  {
    id: 2,
    key: "nonSimilarWords",
    title: "Everyday Words 🏡",
    description: "Words you know from daily life",
    icon: "🏡",
    accent: "#E8A87C",
    accentDark: "#C45D2C",
    words: ["house", "tree", "school", "water", "mother", "father", "child", "book", "table", "chair", "apple", "bread", "car", "road", "sun", "moon", "dog", "cat", "friend", "teacher"],
    timeLimit: 150
  },
  {
    id: 3,
    key: "nonWords",
    title: "Funny Words 🤪",
    description: "Made-up words - sound them out!",
    icon: "🤪",
    accent: "#E8A87C",
    accentDark: "#C45D2C",
    words: ["mip", "lat", "nob", "kep", "sud", "fik", "zan", "pel", "mot", "rib", "dak", "vun", "sep", "gol", "tim", "paf", "lod", "kes", "bim", "ran"],
    timeLimit: 180
  },
];

// Storage key for saving progress
const STORAGE_KEY = 'task_one_progress';

/* ─── Simple sound effects ─────────────────────────────── */
const playSwipeSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.15);
  } catch (e) {
    // Audio not supported
  }
};

const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (e) {
    // Audio not supported
  }
};

/* ─── Main Component ─────────────────────────────────── */
export default function TaskOne() {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState('categories');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryProgress, setCategoryProgress] = useState({
    similarWords: { completed: 0, correct: 0, timeSpent: 0 },
    nonSimilarWords: { completed: 0, correct: 0, timeSpent: 0 },
    nonWords: { completed: 0, correct: 0, timeSpent: 0 }
  });
  
  // Current assessment state
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [answeredWords, setAnsweredWords] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [feedbackBorder, setFeedbackBorder] = useState(null);
  const timerRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);

  // Load saved progress on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const progress = JSON.parse(saved);
      setCategoryProgress(progress.categoryProgress);
      // If there was an active assessment, restore it
      if (progress.currentCategory && progress.currentWordIndex !== undefined && progress.timeRemaining !== undefined) {
        const category = EXERCISES.find(ex => ex.key === progress.currentCategory);
        if (category) {
          setSelectedCategory(category);
          setCurrentWordIndex(progress.currentWordIndex);
          setTimeRemaining(progress.timeRemaining);
          setAnsweredWords(progress.answeredWords || []);
          setCurrentScreen('assessment');
          setTimerRunning(false);
          setIsPaused(true);
        }
      }
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    if (currentScreen === 'assessment' && selectedCategory) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        categoryProgress,
        currentCategory: selectedCategory.key,
        currentWordIndex,
        timeRemaining,
        answeredWords,
        lastUpdated: Date.now()
      }));
    } else if (currentScreen !== 'assessment') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        categoryProgress,
        lastUpdated: Date.now()
      }));
    }
  }, [categoryProgress, currentScreen, selectedCategory, currentWordIndex, timeRemaining, answeredWords]);

  // Timer effect
  useEffect(() => {
    if (timerRunning && timeRemaining > 0 && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning, timeRemaining, isPaused]);

  // Cleanup feedback timeout
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  // Start a category
  const startCategory = (categoryKey) => {
    const category = EXERCISES.find(ex => ex.key === categoryKey);
    setSelectedCategory(category);
    setCurrentWordIndex(0);
    setAnsweredWords([]);
    setTimeRemaining(category.timeLimit);
    setTimerRunning(true);
    setIsPaused(false);
    setCurrentScreen('assessment');
  };

  // Resume from pause
  const handleResume = () => {
    setIsPaused(false);
    setTimerRunning(true);
  };

  // Handle word answer
  const handleAnswer = (isCorrect) => {
    if (feedbackBorder) return;
    
    if (isCorrect) {
      playSuccessSound();
      setFeedbackBorder('correct');
    } else {
      playSwipeSound();
      setFeedbackBorder('incorrect');
    }
    
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedbackBorder(null);
      
      const currentWord = selectedCategory.words[currentWordIndex];
      
      setAnsweredWords(prev => [...prev, {
        word: currentWord,
        correct: isCorrect,
        time: new Date().toLocaleTimeString()
      }]);

      setCategoryProgress(prev => ({
        ...prev,
        [selectedCategory.key]: {
          ...prev[selectedCategory.key],
          completed: prev[selectedCategory.key].completed + 1,
          correct: prev[selectedCategory.key].correct + (isCorrect ? 1 : 0)
        }
      }));

      if (currentWordIndex < selectedCategory.words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
      } else {
        setTimerRunning(false);
        const newProgress = {
          ...categoryProgress,
          [selectedCategory.key]: {
            ...categoryProgress[selectedCategory.key],
            completed: categoryProgress[selectedCategory.key].completed + 1,
            correct: categoryProgress[selectedCategory.key].correct + (isCorrect ? 1 : 0)
          }
        };
        
        const allDone = Object.values(newProgress).every(
          cat => cat.completed >= 20
        );
        
        if (allDone) {
          setCurrentScreen('finalResults');
        } else {
          setCurrentScreen('categories');
        }
      }
    }, 300);
  };

  // Calculate overall progress
  const calculateTotalProgress = () => {
    const totalWords = 60;
    const completedWords = Object.values(categoryProgress).reduce(
      (sum, cat) => sum + cat.completed, 0
    );
    return Math.round((completedWords / totalWords) * 100);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get score percentage for a category
  const getScorePercentage = (progress) => {
    if (progress.completed === 0) return 0;
    return Math.round((progress.correct / progress.completed) * 100);
  };

  // Categories Screen
  if (currentScreen === 'categories') {
    const totalProgress = calculateTotalProgress();
    
    return (
      <div className="task-one-container categories-screen">
        <div className="task-bg"></div>
        <div className="dark-overlay"></div>
        
       
        
        

        <div className="categories-grid">
          {EXERCISES.map((category) => {
            const progress = categoryProgress[category.key];
            const percentage = Math.round((progress.completed / 20) * 100);
            const scorePercentage = getScorePercentage(progress);
            
            return (
              <div 
                key={category.key}
                className={`category-card ${progress.completed === 20 ? 'completed' : ''}`}
                onClick={() => startCategory(category.key)}
              >
                <div className="category-icon">
                  {category.icon}
                </div>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
                
                <div className="category-stats">
                  <div className="stat">
                    <span className="stat-label">Words:</span>
                    <span className="stat-value">{progress.completed}/20</span>
                  </div>
                  
                </div>
                
                <div className="progress-indicator">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${percentage}%` }}
                  ></div>
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
            <button 
              className="btn-final-results"
              onClick={() => setCurrentScreen('finalResults')}
            >
              See Final Results 🏆
            </button>
          </div>
        )}
      </div>
    );
  }

  // Assessment Screen
  if (currentScreen === 'assessment') {
    const category = selectedCategory;
    const currentWord = category.words[currentWordIndex];
    const progress = ((currentWordIndex + 1) / 20) * 100;
    
    return (
      <div className="task-one-container assessment-screen">
        <div className="task-bg"></div>
        <div className="dark-overlay"></div>
        
        <div className="assessment-header-bar">
          <div className="header-left">
            <button 
              className="btn-pause"
              onClick={() => setIsPaused(true)}
            >
              {isPaused ? '▶️ Resume' : '⏸️ Pause'}
            </button>
            <span className="category-name">{category.title}</span>
          </div>
          
          <div className="header-center">
            <div className="progress-display">
              Word {currentWordIndex + 1} of 20
            </div>
          </div>
          
          <div className="header-right">
            <div className="timer">
              ⏰ {formatTime(timeRemaining)}
            </div>
          </div>
        </div>

        <div className="assessment-progress-bar">
          <div 
            className="assessment-progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="word-display-area">
          <div 
            className={`word-card-big ${feedbackBorder === 'correct' ? 'feedback-correct-border' : ''} ${feedbackBorder === 'incorrect' ? 'feedback-incorrect-border' : ''}`}
          >
            <div className="word-text-big">
              {currentWord.split('').map((letter, index) => (
                <span 
                  key={index} 
                  className="letter-animated"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {letter}
                </span>
              ))}
            </div>
            
            <div className="word-hint">
              {category.key === 'nonWords' 
                ? '🔤 Sound it out!' 
                : '📖 Read it out loud!'}
            </div>
          </div>

          <div className="character-area">
            <div className="character-thinking">
              🐵
            </div>
            <div className="speech-bubble">
              Can you read this word?
            </div>
          </div>
        </div>

        <div className="assessment-action-buttons">
          <button 
            className="btn-next-word"
            onClick={() => handleAnswer(false)}
            disabled={feedbackBorder !== null}
          >
            ➡️ Next Word
            <span className="sub-text">I'll try this later</span>
          </button>
          
          <button 
            className="btn-got-it"
            onClick={() => handleAnswer(true)}
            disabled={feedbackBorder !== null}
          >
            ✅ Got It!
            <span className="sub-text">I read it correctly</span>
          </button>
        </div>

        {isPaused && (
          <div className="pause-overlay-full">
            <div className="pause-content-card">
              <h2>⏸️ Game Paused</h2>
              <p>Your progress has been saved!</p>
              <button 
                className="btn-resume-game"
                onClick={handleResume}
              >
                ▶️ Resume Challenge
              </button>
              <button 
                className="btn-quit-game"
                onClick={() => setCurrentScreen('categories')}
              >
                🏠 Back to Challenges
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Final Results Screen
  if (currentScreen === 'finalResults') {
    const totalCorrect = Object.values(categoryProgress).reduce(
      (sum, cat) => sum + cat.correct, 0
    );
    const totalWords = 60;
    const percentage = Math.round((totalCorrect / totalWords) * 100);
    
    const results = {
      date: new Date().toISOString(),
      totalCorrect,
      totalWords,
      percentage,
      categoryProgress,
    };
    localStorage.setItem('task_one_results', JSON.stringify(results));
    localStorage.removeItem(STORAGE_KEY);
    
    return (
      <div className="task-one-container results-screen">
        <div className="task-bg"></div>
        <div className="dark-overlay"></div>
        
        <div className="task-nav">
          <button className="nav-back-btn" onClick={() => navigate('/adventure')}>
            ← Back to Adventure
          </button>
          <div className="nav-title">🏆 Results</div>
          <div className="nav-spacer"></div>
        </div>

        <div className="results-header-area">
          <div className="trophy-icon">🏆</div>
          <h1 className="child-font">Reading Champion!</h1>
          <p>You completed all 3 challenges! Amazing work! 🎉</p>
        </div>

        <div className="final-score-area">
          <div className="score-circle-big">
            <span className="score-number-big">{totalCorrect}/60</span>
            <span className="score-label-small">Words Correct</span>
          </div>
          <div className="score-grade-area">
            <div className="grade-circle-big" style={{ 
              background: percentage >= 80 ? '#7fb685' : 
                         percentage >= 60 ? '#ff9a76' : '#a8d0db'
            }}>
              {percentage}%
            </div>
            <p className="grade-label-text">
              {percentage >= 80 ? '🌟 Excellent!' : 
               percentage >= 60 ? '👍 Good Job!' : '💪 Keep Practicing!'}
            </p>
          </div>
        </div>

        <div className="category-breakdown-area">
          <h2>📊 Your Results by Challenge</h2>
          <div className="breakdown-grid-area">
            {EXERCISES.map((category) => {
              const progress = categoryProgress[category.key];
              const catPercentage = Math.round((progress.correct / 20) * 100);
              
              return (
                <div key={category.key} className="breakdown-card-item">
                  <div className="breakdown-icon-item">
                    {category.icon}
                  </div>
                  <h3>{category.title}</h3>
                  <div className="breakdown-score-item">
                    <span className="score-number-item">{progress.correct}/20</span>
                    <span className="percentage-item">({catPercentage}%)</span>
                  </div>
                  <div className="breakdown-bar-item">
                    <div 
                      className="bar-fill-item" 
                      style={{ width: `${catPercentage}%` }}
                    ></div>
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
          <button 
            className="btn-play-again"
            onClick={() => {
              setCategoryProgress({
                similarWords: { completed: 0, correct: 0, timeSpent: 0 },
                nonSimilarWords: { completed: 0, correct: 0, timeSpent: 0 },
                nonWords: { completed: 0, correct: 0, timeSpent: 0 }
              });
              setCurrentScreen('categories');
            }}
          >
            🔄 Play Again
          </button>
          <button 
            className="btn-home-page"
            onClick={() => navigate('/adventure')}
          >
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