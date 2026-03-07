import React from 'react';
import { useNavigate } from 'react-router-dom';

const QuestPopup = ({ quest, isVisible, onClose, onStart }) => {
  const navigate = useNavigate();

  if (!quest) return null;

  const getMascot = (animal) => {
    const mascots = {
      owl: '🦉',
      fox: '🦊',
      rabbit: '🐰',
      bear: '🐻',
      dragon: '🐉'
    };
    return mascots[animal] || '🦊';
  };

  const handleStartClick = () => {
    if (quest.status === 'locked') return;
    
    // Close the popup first
    onClose();
    
    // Navigate to the word assessment instructions page
    setTimeout(() => {
      navigate('/tasks/word-assessment');
    }, 300);
  };

  return (
    <div 
      className={`quest-overlay ${isVisible ? 'visible' : ''}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="quest-popup">
        <div className="popup-mascot" style={{ fontSize: '5rem' }}>
          {getMascot(quest.animal)}
        </div>
        <h2 className="popup-title">{quest.title}</h2>
        <p className="popup-description">{quest.description}</p>
        <div className="popup-buttons">
          <button 
            className="btn-start"
            onClick={handleStartClick}
            disabled={quest.status === 'locked'}
          >
            {quest.status === 'locked' ? '🔒 Still Locked' : '✨ Start Quest!'}
          </button>
          <button className="btn-later" onClick={onClose}>
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestPopup;