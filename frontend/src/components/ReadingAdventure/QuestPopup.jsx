import React from 'react';

const QuestPopup = ({ quest, isVisible, onClose, onStart }) => {
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
            onClick={onStart}
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