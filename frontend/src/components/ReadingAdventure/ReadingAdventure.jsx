// frontend/src/components/ReadingAdventure/ReadingAdventure.jsx
// FIXES:
//  1. Reads childFullName correctly
//  2. Quest locking works: each new child starts all locked except first
//  3. Quests unlock in sequence as each is completed
//  4. Never navigates away on its own (no redirect loops)
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import QuestPath from './QuestPath';
import './ReadingAdventure.css';

const INITIAL_QUESTS = [
  { id:1, title:'Word Explorer',           description:'Read words aloud and build confidence',              status:'active', animal:'owl',    difficulty:'easy',   taskPath:'/tasks/task-one'      },
  { id:2, title:'Story Reader',            description:'Read a magical story with your voice',               status:'locked', animal:'fox',    difficulty:'easy',   taskPath:'/tasks/enhanced-voice'},
  { id:3, title:'Letter Detective',        description:'Compare letter groups — Same or Different?',         status:'locked', animal:'rabbit', difficulty:'medium', taskPath:'/tasks/task-three'    },
  { id:4, title:'Number Memory Challenge', description:'Listen to numbers and repeat them in reverse order!',status:'locked', animal:'bear',   difficulty:'medium', taskPath:'/tasks/task-four'     },
];

const computeStatuses = (quests, completedIds) =>
  quests.map((q, i) => {
    if (completedIds.includes(q.id)) return { ...q, status:'completed' };
    const prevDone = i === 0 || completedIds.includes(quests[i-1].id);
    return { ...q, status: prevDone ? 'active' : 'locked' };
  });

export default function ReadingAdventure() {
  const navigate = useNavigate();
  const [childInfo, setChildInfo] = useState(null);
  const [quests, setQuests] = useState(INITIAL_QUESTS);

  // Load child info
  useEffect(() => {
    const saved = localStorage.getItem('child_info');
    if (!saved) { 
      navigate('/child-info'); 
      return; 
    }
    setChildInfo(JSON.parse(saved));
  }, [navigate]);

  // Load and apply saved progress
  const refreshProgress = useCallback(() => {
    const raw = localStorage.getItem('reading_adventure_progress');
    const completedIds = raw ? JSON.parse(raw) : [];
    setQuests(computeStatuses(INITIAL_QUESTS, completedIds));
  }, []);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  // Re-apply progress whenever window gets focus (after returning from a task)
  useEffect(() => {
    window.addEventListener('focus', refreshProgress);
    return () => window.removeEventListener('focus', refreshProgress);
  }, [refreshProgress]);

  const handleQuestClick = (quest) => {
    if (quest.status === 'locked') return;
    localStorage.setItem('current_quest', JSON.stringify(quest));
    navigate(quest.taskPath);
  };

  if (!childInfo) return null;

  const displayName  = childInfo.childFullName || childInfo.childName || 'Adventurer';
  const displayGrade = childInfo.childGrade ? `Grade ${childInfo.childGrade}` : '';
  const displayAge   = childInfo.childAge    ? `Age ${childInfo.childAge}`    : '';

  return (
    <div className="reading-adventure">
      {/* Logo only – no back button, no navbar */}
      <div className="adventure-logo">
        <div className="adventure-logo-icon">DS</div>
        <span className="adventure-logo-text">Dyslexia Support</span>
      </div>

      <div className="adventure-background">
        <img src="/assets/levels2.png" alt="Reading Adventure" className="background-image" />
        <div className="background-overlay" />
      </div>

      <div className="adventure-welcome">
        <div className="welcome-content">
          <span className="welcome-emoji">🎮</span>
          <span className="welcome-text">Welcome, {displayName}!</span>
          <span className="welcome-grade">{displayGrade}{displayAge ? ` • ${displayAge}` : ''}</span>
        </div>
      </div>

      <div className="adventure-content">
        <QuestPath quests={quests} onQuestClick={handleQuestClick} />
      </div>
    </div>
  );
}