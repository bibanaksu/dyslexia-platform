import React from 'react';

const QuestNode = ({ quest, position, onClick }) => {
  const getAnimalIcon = (animal) => {
    const icons = {
      owl: '🦉',
      fox: '🦊',
      rabbit: '🐰',
      bear: '🐻',
      dragon: '🐉'
    };
    return icons[animal] || '🦊';
  };

  return (
    <div className="quest-node">
      <div className={`node-row ${position === 'right' ? 'right' : ''}`}>
        <div 
          className={`node-bubble ${quest.status}`}
          onClick={() => onClick(quest)}
        >
          {quest.status === 'completed' && (
            <svg width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="15" fill="white" opacity="0.3"/>
              <path d="M12 20 L18 26 L28 14" stroke="white" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          )}
          
          {quest.status === 'active' && (
            <span style={{ fontSize: '1.8rem' }}>✨</span>
          )}
          
          {quest.status === 'locked' && (
            <svg width="30" height="30" viewBox="0 0 30 30">
              <rect x="8" y="12" width="14" height="12" rx="3" fill="white" opacity="0.7"/>
              <path d="M11 12V9a4 4 0 018 0v3" stroke="white" strokeWidth="3" fill="none"/>
            </svg>
          )}

          {quest.status === 'completed' && (
            <span className="check-badge">✓</span>
          )}
        </div>

        <div 
          className={`quest-card ${quest.status}`}
          onClick={() => onClick(quest)}
        >
          {/* ===== THESE ARE THE TEXT ELEMENTS YOU WANT TO CHANGE ===== */}
          <div className={`quest-tag tag-${quest.status}`}>
            {quest.status === 'completed' && '✦ Completed'}      {/* ← CHANGE THIS */}
            {quest.status === 'active' && '⚡ Start Here!'}       {/* ← CHANGE THIS */}
            {quest.status === 'locked' && '🔒 Locked'}            {/* ← CHANGE THIS */}
          </div>
          <div className="quest-title">{quest.title}</div>        {/* ← QUEST TITLE */}
          <div className="quest-description">{quest.description}</div> {/* ← DESCRIPTION */}
          <div className="quest-animal">
            {getAnimalIcon(quest.animal)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestNode;