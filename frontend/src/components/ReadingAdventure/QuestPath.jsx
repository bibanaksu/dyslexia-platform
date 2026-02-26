import React from 'react';
import QuestNode from './QuestNode';

const QuestPath = ({ quests, onQuestClick }) => {
  return (
    <div className="quest-path">
      {/* REMOVED: Level badge completely */}
      
      <div className="quest-nodes">
        {quests.map((quest, index) => (
          <React.Fragment key={quest.id}>
            <QuestNode 
              quest={quest}
              position={index % 2 === 0 ? 'left' : 'right'}
              onClick={() => onQuestClick(quest)}
            />
            {index < quests.length - 1 && (
              <div className={`connector-line ${quest.status === 'completed' ? 'completed' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default QuestPath;