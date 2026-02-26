import React, { useState } from 'react';
import QuestPath from './QuestPath';
import QuestPopup from './QuestPopup';
import './ReadingAdventure.css';

const ReadingAdventure = () => {
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const quests = [
    {
      id: 1,
      title: 'Letter Sounds',
      description: 'Match letters to their magical sounds',
      status: 'completed',
      animal: 'owl',
      difficulty: 'easy',
      stars: 3
    },
    {
      id: 2,
      title: 'Word Builder',
      description: 'Combine letters to create enchanted words',
      status: 'active',
      animal: 'fox',
      difficulty: 'easy',
      stars: 3
    },
    {
      id: 3,
      title: 'Rhyme Time',
      description: 'Discover words that dance together',
      status: 'locked',
      animal: 'rabbit',
      difficulty: 'medium',
      stars: 4
    },
    {
      id: 4,
      title: 'Sentence Explorer',
      description: 'Read magical sentences aloud',
      status: 'locked',
      animal: 'bear',
      difficulty: 'medium',
      stars: 4
    },
    {
      id: 5,
      title: 'Story Sorcerer',
      description: 'Arrange story events in the right order',
      status: 'locked',
      animal: 'owl',
      difficulty: 'hard',
      stars: 5
    },
    {
      id: 6,
      title: 'Word Wizard',
      description: 'Find the missing word in each spell',
      status: 'locked',
      animal: 'fox',
      difficulty: 'hard',
      stars: 5
    },
    {
      id: 7,
      title: 'Reading Champion',
      description: 'The ultimate magical reading challenge!',
      status: 'locked',
      animal: 'dragon',
      difficulty: 'legendary',
      stars: 7
    }
  ];

  const handleQuestClick = (quest) => {
    setSelectedQuest(quest);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setTimeout(() => setSelectedQuest(null), 300);
  };

  const handleStartQuest = () => {
    if (selectedQuest?.status === 'locked') return;
    handleClosePopup();
    console.log(`Starting quest: ${selectedQuest?.title}`);
  };

  return (
    <div className="reading-adventure">
      {/* Full screen image background */}
      <div className="adventure-background">
        <img 
          src="/assets/levels2.png" 
          alt="Reading Adventure Background"
          className="background-image"
        />
        <div className="background-overlay"></div>
      </div>

      {/* Quest Path - Centered on the image */}
      <div className="adventure-content">
        <QuestPath 
          quests={quests} 
          onQuestClick={handleQuestClick}
        />
      </div>

      {/* Quest Popup */}
      <QuestPopup
        quest={selectedQuest}
        isVisible={showPopup}
        onClose={handleClosePopup}
        onStart={handleStartQuest}
      />
    </div>
  );
};

export default ReadingAdventure;