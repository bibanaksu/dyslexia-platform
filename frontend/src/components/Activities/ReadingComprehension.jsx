// ReadingComprehension.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { completeAssignment } from '../../services/api';
import './ActivityCommon.css';

export default function ReadingComprehension() {
  const navigate = useNavigate();
  const location = useLocation();
  const { assignmentId, childId, config } = location.state || {};
  
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (config && config.questions) setLoading(false);
    else setLoading(false);
  }, [config]);

  const handleAnswer = (selectedIdx) => {
    if (!config || !config.questions[currentQ]) return;
    const isCorrect = (selectedIdx === config.questions[currentQ].correct);
    const newAnswers = [...answers, { q: currentQ, correct: isCorrect, selected: selectedIdx }];
    setAnswers(newAnswers);
    if (isCorrect) {
      setFeedback('✅ Correct!');
    } else {
      setFeedback(`❌ Wrong. The correct answer was: ${config.questions[currentQ].options[config.questions[currentQ].correct]}`);
    }
    setTimeout(() => {
      if (currentQ + 1 < config.questions.length) {
        setCurrentQ(prev => prev + 1);
        setFeedback('');
      } else {
        const correctCount = newAnswers.filter(a => a.correct).length;
        const finalScore = Math.round((correctCount / config.questions.length) * 100);
        completeAssignment(assignmentId, finalScore, { answers: newAnswers })
          .catch(err => console.error('Save error:', err));
        setShowResult(true);
      }
    }, 1500);
  };

  if (loading) {
    return (
      <div className="activity-loading">
        <div className="spinner"></div>
        <div>Loading story...</div>
      </div>
    );
  }

  if (!config || !config.questions || config.questions.length === 0) {
    return (
      <div className="activity-error">
        <div>⚠️ Activity configuration missing.</div>
        <button className="btn-final" onClick={() => navigate('/parent-dashboard')}>Go Back</button>
      </div>
    );
  }

  if (showResult) {
    const correctCount = answers.filter(a => a.correct).length;
    const percent = Math.round((correctCount / config.questions.length) * 100);
    return (
      <div className="activity-result-overlay">
        <div className="activity-result-card">
          <div className="result-emoji">{percent >= 80 ? '📚🎉' : '📖👍'}</div>
          <h2>Reading completed!</h2>
          <p>You answered {correctCount} out of {config.questions.length} correctly</p>
          <div className="result-score">{percent}%</div>
          <button className="btn-final" onClick={() => navigate('/parent-dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const question = config.questions[currentQ];
  return (
    <div className="activity-game-container reading-bg">
      <div className="activity-top-bar">
        <button className="activity-home-btn" onClick={() => navigate('/parent-dashboard')}>🏠 Exit</button>
        <div className="activity-progress">Question {currentQ+1} / {config.questions.length}</div>
      </div>
      <div className="reading-passage-card">
        <h3>📖 Read the story</h3>
        <div className="reading-passage">{config.passage}</div>
        <div className="reading-question">{question.text}</div>
        <div className="activity-options vertical">
          {question.options.map((opt, idx) => (
            <button key={idx} className="reading-option-btn" onClick={() => handleAnswer(idx)}>
              {opt}
            </button>
          ))}
        </div>
        {feedback && <div className="activity-feedback">{feedback}</div>}
      </div>
    </div>
  );
}