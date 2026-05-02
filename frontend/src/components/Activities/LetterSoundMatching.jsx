// LetterSoundMatching.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { completeAssignment } from '../../services/api';
import './ActivityCommon.css';

export default function LetterSoundMatching() {
  const navigate = useNavigate();
  const location = useLocation();
  const { assignmentId, childId, config } = location.state || {};
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    if (config && config.items) setLoading(false);
    else setLoading(false);
  }, [config]);

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  const handleAnswer = (selectedLetter) => {
    if (!config || !config.items[currentIndex]) return;
    const correct = config.items[currentIndex].letter;
    if (selectedLetter === correct) {
      setFeedback('Great hearing! 🎵');
      setScore(prev => prev + 1);
      setTimeout(() => {
        if (currentIndex + 1 < config.items.length) {
          setCurrentIndex(prev => prev + 1);
          setFeedback('');
        } else {
          const finalScore = Math.round(((score + 1) / config.items.length) * 100);
          completeAssignment(assignmentId, finalScore, { totalCorrect: score + 1, total: config.items.length })
            .catch(err => console.error('Save error:', err));
          setShowResult(true);
        }
      }, 1000);
    } else {
      setFeedback('Wrong letter. Listen again!');
      setTimeout(() => setFeedback(''), 1000);
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

  if (!config || !config.items || config.items.length === 0) {
    return (
      <div className="activity-error">
        <div>⚠️ Activity configuration missing.</div>
        <button className="btn-final" onClick={() => navigate('/parent-dashboard')}>Go Back</button>
      </div>
    );
  }

  if (showResult) {
    const percent = Math.round((score / config.items.length) * 100);
    return (
      <div className="activity-result-overlay">
        <div className="activity-result-card">
          <div className="result-emoji">{percent >= 80 ? '🎧🎉' : '👂'}</div>
          <h2>Well done!</h2>
          <p>You matched {score} out of {config.items.length} sounds</p>
          <div className="result-score">{percent}%</div>
          <button className="btn-final" onClick={() => navigate('/parent-dashboard')}>Finish</button>
        </div>
      </div>
    );
  }

  const item = config.items[currentIndex];
  return (
    <div className="activity-game-container">
      <div className="activity-bg" />
      <div className="activity-top-bar">
        <button className="activity-home-btn" onClick={() => navigate('/parent-dashboard')}>🏠 Exit</button>
        <div className="activity-progress">Sound {currentIndex+1} / {config.items.length}</div>
        <div className="activity-stars">⭐ {score}</div>
      </div>
      <div className="activity-main-card">
        {item.image && <img src={item.image} alt={item.letter} className="activity-image-small" />}
        <button className="sound-play-btn" onClick={playSound}>🔊 Play Sound</button>
        <audio ref={audioRef} src={item.sound} preload="auto" />
        <div className="activity-question">Choose the letter that matches the sound:</div>
        <div className="activity-options letter-grid">
          {config.items.map((it, idx) => (
            <button key={idx} className="activity-letter-btn" onClick={() => handleAnswer(it.letter)} disabled={feedback !== ''}>
              {it.letter}
            </button>
          ))}
        </div>
        {feedback && <div className="activity-feedback">{feedback}</div>}
      </div>
    </div>
  );
}