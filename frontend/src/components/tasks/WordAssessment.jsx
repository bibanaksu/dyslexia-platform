import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./WordAssessment.css";

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
    words: ["bat", "pat", "pin", "bin", "cap", "cup", "bed", "bad", "fan", "van", "ship", "sheep", "log", "bog", "map", "mop", "fit", "sit", "coat", "goat"],
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
    words: ["tree", "house", "sun", "water", "book", "car", "apple", "school", "dog", "chair", "bread", "road", "clock", "mountain", "river", "pencil", "window", "flower", "table", "sky"],
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
    words: ["mip", "lat", "zog", "fep", "nusk", "belm", "tark", "siv", "lom", "praf", "dek", "mun", "vop", "gled", "rin", "sok", "tave", "blim", "zant", "kesh"],
    timeLimit: 180
  },
];

/* ─── Simple beep sounds ─────────────────────────────── */
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
    console.log("Audio not supported");
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
    console.log("Audio not supported");
  }
};

/* ─── Main Component ─────────────────────────────────── */
export default function WordReadingTest() {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState('categories'); // categories, description, assessment, finalResults
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
  const timerRef = useRef(null);

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

  // Start a category
  const startCategory = (categoryKey) => {
    const category = EXERCISES.find(ex => ex.key === categoryKey);
    setSelectedCategory(category);
    setCurrentScreen('description');
  };

  // Start the actual assessment
  const startAssessment = () => {
    setCurrentWordIndex(0);
    setAnsweredWords([]);
    setTimeRemaining(selectedCategory.timeLimit);
    setTimerRunning(true);
    setIsPaused(false);
    setCurrentScreen('assessment');
  };

  // Handle word answer
  const handleAnswer = (isCorrect) => {
    if (isCorrect) {
      playSuccessSound();
    } else {
      playSwipeSound();
    }

    const currentWord = selectedCategory.words[currentWordIndex];
    
    setAnsweredWords(prev => [...prev, {
      word: currentWord,
      correct: isCorrect,
      time: new Date().toLocaleTimeString()
    }]);

    // Update progress
    setCategoryProgress(prev => ({
      ...prev,
      [selectedCategory.key]: {
        ...prev[selectedCategory.key],
        completed: prev[selectedCategory.key].completed + 1,
        correct: prev[selectedCategory.key].correct + (isCorrect ? 1 : 0)
      }
    }));

    // Move to next word or finish
    if (currentWordIndex < selectedCategory.words.length - 1) {
      setTimeout(() => {
        setCurrentWordIndex(prev => prev + 1);
      }, 400);
    } else {
      setTimerRunning(false);
      setTimeout(() => {
        // Check if all categories are done
        const allDone = Object.values(categoryProgress).every(
          cat => cat.completed + (selectedCategory ? 1 : 0) >= 20
        );
        
        if (allDone) {
          setCurrentScreen('finalResults');
        } else {
          setCurrentScreen('categories');
        }
      }, 1000);
    }
  };

  // Calculate overall progress
  const calculateTotalProgress = () => {
    const totalWords = 60;
    const completedWords = Object.values(categoryProgress).reduce(
      (sum, cat) => sum + cat.completed, 0
    );
    return Math.round((completedWords / totalWords) * 100);
  };

  // Categories Screen
  if (currentScreen === 'categories') {
    const totalProgress = calculateTotalProgress();
    
    return (
      <div className="new-assessment-container categories-screen">
        <div className="full-hd-bg"></div>
        <div className="dark-overlay"></div>
        
        <div className="assessment-header">
          <h1 className="child-font">🎮 Word Adventure Time!</h1>
          <p>Complete all 3 challenges to become a Reading Champion! 🏆</p>
          
          <div className="overall-progress">
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${totalProgress}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {totalProgress}% Complete • {60 - Object.values(categoryProgress).reduce((sum, cat) => sum + cat.completed, 0)} words left
            </div>
          </div>
        </div>

        <div className="categories-grid">
          {EXERCISES.map((category) => {
            const progress = categoryProgress[category.key];
            const percentage = Math.round((progress.completed / 20) * 100);
            
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
                  <div className="stat">
                    <span className="stat-label">Score:</span>
                    <span className="stat-value">{progress.correct}/{progress.completed || 1}</span>
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

        {/* Celebration animation when all done */}
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

  // Category Description Screen
  if (currentScreen === 'description') {
    const category = selectedCategory;
    
    return (
      <div className="new-assessment-container description-screen">
        <div className="full-hd-bg"></div>
        <div className="dark-overlay"></div>
        
        <div className="description-header">
          <button 
            className="back-button"
            onClick={() => setCurrentScreen('categories')}
          >
            ← Back to Challenges
          </button>
          <h1 className="child-font">{category.title}</h1>
        </div>

        <div className="description-content">
          <div className="description-card">
            <div className="description-icon">
              {category.icon}
            </div>
            
            <h2>How to Play:</h2>
            <ul className="instructions-list">
              <li>📖 Read each word out loud</li>
              <li>⏱️ You have {Math.floor(category.timeLimit/60)} minutes for 20 words</li>
              <li>✅ Click "Got It!" if you read it correctly</li>
              <li>➡️ Click "Next" if unsure (no penalty!)</li>
              <li>⏸️ You can pause anytime</li>
            </ul>

            <div className="example-words">
              <h3>Example Words:</h3>
              <div className="words-grid">
                {category.words.slice(0, 6).map((word, index) => (
                  <span key={index} className="example-word">
                    {word}
                  </span>
                ))}
              </div>
            </div>

            <div className="time-info">
              <div className="time-icon">⏰</div>
              <div className="time-details">
                <h4>Time Challenge</h4>
                <p>{category.timeLimit} seconds total</p>
                <p>≈ {Math.round(category.timeLimit/20)} seconds per word</p>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              className="btn-start-challenge"
              onClick={startAssessment}
            >
              🚀 Start Challenge!
            </button>
            <button 
              className="btn-back"
              onClick={() => setCurrentScreen('categories')}
            >
              Choose Different Challenge
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Assessment Screen
  if (currentScreen === 'assessment') {
    const category = selectedCategory;
    const currentWord = category.words[currentWordIndex];
    const progress = ((currentWordIndex + 1) / 20) * 100;
    
    return (
      <div className="new-assessment-container assessment-screen">
        <div className="full-hd-bg"></div>
        <div className="dark-overlay"></div>
        
        {/* Header with progress and timer */}
        <div className="assessment-header">
          <div className="header-left">
            <button 
              className="btn-pause"
              onClick={() => setIsPaused(!isPaused)}
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
              ⏰ {timeRemaining}s
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="assessment-progress">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Word display */}
        <div className="word-display">
          <div className="word-card">
            <div className="word-text">
              {currentWord.split('').map((letter, index) => (
                <span 
                  key={index} 
                  className="letter"
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

          {/* Character animation */}
          <div className="character-container">
            <div className="character character-thinking">
              🐵
            </div>
            <div className="speech-bubble">
              Can you read this {category.key === 'nonWords' ? 'funny word' : 'word'}?
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="assessment-actions">
          <button 
            className="btn-next"
            onClick={() => handleAnswer(false)}
          >
            ➡️ Next Word
            <span className="sub-text">I'll try this later</span>
          </button>
          
          <button 
            className="btn-correct"
            onClick={() => handleAnswer(true)}
          >
            ✅ Got It!
            <span className="sub-text">I read it correctly</span>
          </button>
        </div>

        {/* Pause overlay */}
        {isPaused && (
          <div className="pause-overlay">
            <div className="pause-content">
              <h2>⏸️ Game Paused</h2>
              <p>Take your time! Ready to continue?</p>
              <button 
                className="btn-resume"
                onClick={() => setIsPaused(false)}
              >
                ▶️ Resume Challenge
              </button>
              <button 
                className="btn-quit"
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
    
    return (
      <div className="new-assessment-container results-screen">
        <div className="full-hd-bg"></div>
        <div className="dark-overlay"></div>
        
        <div className="results-header">
          <div className="trophy-icon">🏆</div>
          <h1 className="child-font">Reading Champion!</h1>
          <p>You completed all 3 challenges! Amazing work! 🎉</p>
        </div>

        <div className="final-score">
          <div className="score-circle">
            <span className="score-number">{totalCorrect}/60</span>
            <span className="score-label">Words Correct</span>
          </div>
          <div className="score-grade">
            <div className="grade-circle" style={{ 
              background: percentage >= 80 ? '#7fb685' : 
                         percentage >= 60 ? '#ff9a76' : '#a8d0db'
            }}>
              {percentage}%
            </div>
            <p className="grade-label">
              {percentage >= 80 ? '🌟 Excellent!' : 
               percentage >= 60 ? '👍 Good Job!' : '💪 Keep Practicing!'}
            </p>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="category-breakdown">
          <h2>📊 Your Results by Challenge</h2>
          <div className="breakdown-grid">
            {EXERCISES.map((category) => {
              const progress = categoryProgress[category.key];
              const catPercentage = Math.round((progress.correct / 20) * 100);
              
              return (
                <div key={category.key} className="breakdown-card">
                  <div className="breakdown-icon">
                    {category.icon}
                  </div>
                  <h3>{category.title}</h3>
                  <div className="breakdown-score">
                    <span className="score">{progress.correct}/20</span>
                    <span className="percentage">({catPercentage}%)</span>
                  </div>
                  <div className="breakdown-bar">
                    <div 
                      className="bar-fill" 
                      style={{ width: `${catPercentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommendations */}
        <div className="recommendations">
          <h2>💡 Reading Tips</h2>
          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-icon">🔤</div>
              <h4>For Twins Words</h4>
              <p>Practice letter sounds: b/p, f/v, sh/ch</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">📚</div>
              <h4>For Everyday Words</h4>
              <p>Read books about things you love!</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">🎮</div>
              <h4>For Funny Words</h4>
              <p>Play sound games - you're great at decoding!</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="results-actions">
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
            className="btn-home"
            onClick={() => navigate('/adventure')}
          >
            🏠 Back to Home
          </button>
        </div>

        {/* Certificate */}
        <div className="certificate">
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