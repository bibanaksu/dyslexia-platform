// WordPictureMatching.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { completeAssignment } from '../../services/api';
import './ActivityCommon.css';

export default function WordPictureMatching() {
  const navigate = useNavigate();
  const location = useLocation();
  const { assignmentId, childId, config } = location.state || {};
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!config || !config.pairs) {
      setLoading(false);
      return;
    }
    const allWords = config.pairs.map(p => p.word);
    setOptions(shuffleArray(allWords));
    setLoading(false);
  }, [config]);

  const shuffleArray = (arr) => [...arr].sort(() => Math.random() - 0.5);

  const handleAnswer = (word) => {
    if (!config || !config.pairs[currentIndex]) return;
    const correctWord = config.pairs[currentIndex].word;
    if (word === correctWord) {
      setFeedback('Correct! 🎉');
      setScore(prev => prev + 1);
      setTimeout(() => {
        if (currentIndex + 1 < config.pairs.length) {
          setCurrentIndex(prev => prev + 1);
          setFeedback('');
          setSelected(null);
          const newWords = config.pairs.map(p => p.word);
          setOptions(shuffleArray(newWords));
        } else {
          const finalScore = Math.round(((score + 1) / config.pairs.length) * 100);
          completeAssignment(assignmentId, finalScore, { totalCorrect: score + 1, total: config.pairs.length })
            .catch(err => console.error('Save error:', err));
          setShowResult(true);
        }
      }, 1000);
    } else {
      setFeedback('Oops! Try again ❌');
      setSelected(word);
      setTimeout(() => setFeedback(''), 800);
    }
  };

  if (loading) {
    return (
      <div className="activity-loading">
        <div className="spinner"></div>
        <div>Loading activity...</div>
      </div>
    );
  }

  if (!config || !config.pairs || config.pairs.length === 0) {
    return (
      <div className="activity-error">
        <div>⚠️ Activity configuration missing.</div>
        <button className="btn-final" onClick={() => navigate('/parent-dashboard')}>Go Back</button>
      </div>
    );
  }

  if (showResult) {
    const percent = Math.round((score / config.pairs.length) * 100);
    return (
      <div className="activity-result-overlay">
        <div className="activity-result-card">
          <div className="result-emoji">{percent >= 80 ? '🏆🎉' : '👍'}</div>
          <h2>Great job!</h2>
          <p>You scored {score} out of {config.pairs.length}</p>
          <div className="result-score">{percent}%</div>
          <button className="btn-final" onClick={() => navigate('/parent-dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const currentPair = config.pairs[currentIndex];
  return (
    <div className="activity-game-container">
      <div className="activity-bg" />
      <div className="activity-top-bar">
        <button className="activity-home-btn" onClick={() => navigate('/parent-dashboard')}>🏠 Exit</button>
        <div className="activity-progress">Word {currentIndex+1} / {config.pairs.length}</div>
        <div className="activity-stars">⭐ {score}</div>
      </div>
      <div className="activity-main-card">
        <img src={currentPair.image} alt={currentPair.word} className="activity-image" 
          onError={(e) => { e.target.src = 'https://placehold.co/200x200?text=🐾'; }} />
        <div className="activity-question">Which word matches the picture?</div>
        <div className="activity-options">
          {options.map(opt => (
            <button
              key={opt}
              className={`activity-option-btn ${selected === opt ? (feedback.includes('Correct') ? 'correct' : 'incorrect') : ''}`}
              onClick={() => handleAnswer(opt)}
              disabled={selected !== null}
            >
              {opt}
            </button>
          ))}
        </div>
        {feedback && <div className="activity-feedback">{feedback}</div>}
      </div>
    </div>
  );
}