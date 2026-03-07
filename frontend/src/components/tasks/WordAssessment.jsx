import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './WordAssessment.css';

const WordAssessment = () => {
  const navigate = useNavigate();
  const [showInstructions, setShowInstructions] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const exercises = [
    {
      id: 1,
      title: 'Similar Words',
      description: 'Test visual and phonological discrimination',
      instruction: 'Read each word aloud. Take your time.',
      note: 'These words look or sound very similar, which is difficult for children with dyslexia.',
      totalWords: 20,
      progress: 0 // 0% completed
    },
    {
      id: 2,
      title: 'Common Words',
      description: 'Test basic word recognition and vocabulary',
      instruction: 'Read each word aloud.',
      note: 'These are common, familiar words with clear structures.',
      totalWords: 20,
      progress: 0
    },
    {
      id: 3,
      title: 'Made-Up Words',
      description: 'Test decoding ability',
      instruction: 'These are not real words. Try to read them anyway.',
      note: 'These words do not exist. The child must rely on phonics, not memory.',
      totalWords: 20,
      progress: 0
    }
  ];

  const handleStartExercise = (exercise) => {
    setSelectedExercise(exercise);
    setShowInstructions(false);
    // Here you would navigate to the actual exercise
    console.log('Starting exercise:', exercise.title);
  };

  const handleBack = () => {
    navigate('/adventure');
  };

  // Main Instructions Screen
  if (showInstructions) {
    return (
      <div className="assessment-container">
        <div className="instructions-main-card">
          <button onClick={handleBack} className="back-btn">← Back to Adventure</button>
          
          <h1 className="main-title">Reading Assessment</h1>
          <p className="main-subtitle">Choose an exercise to begin</p>
          
          <div className="exercises-grid">
            {exercises.map((exercise) => (
              <div key={exercise.id} className="exercise-card">
                <div className="exercise-card-header">
                  <h2 className="exercise-card-title">{exercise.title}</h2>
                  <span className="exercise-badge">{exercise.totalWords} words</span>
                </div>
                
                <p className="exercise-card-description">{exercise.description}</p>
                
                <div className="instruction-bubble">
                  <span className="quote-icon">📢</span>
                  <p className="instruction-text">{exercise.instruction}</p>
                </div>
                
                {exercise.note && (
                  <div className="note-bubble">
                    <span className="note-icon">⚠️</span>
                    <p className="note-text">{exercise.note}</p>
                  </div>
                )}
                
                <div className="progress-section">
                  <div className="progress-header">
                    <span className="progress-label">Progress</span>
                    <span className="progress-percent">{exercise.progress}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-fill"
                      style={{ width: `${exercise.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <button 
                  className="start-exercise-btn"
                  onClick={() => handleStartExercise(exercise)}
                >
                  Start Exercise →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Individual Exercise Instructions (when an exercise is selected)
  return (
    <div className="assessment-container">
      <div className="exercise-instructions-card">
        <button onClick={() => setShowInstructions(true)} className="back-btn-small">
          ← Back to Exercises
        </button>
        
        <div className="exercise-header">
          <h1 className="exercise-title">{selectedExercise?.title}</h1>
          <span className="word-count">{selectedExercise?.totalWords} words</span>
        </div>
        
        <div className="instruction-box">
          <p className="main-instruction">{selectedExercise?.instruction}</p>
          <p className="timing-info">⏱️ Timer starts when you begin</p>
        </div>
        
        {selectedExercise?.note && (
          <div className="warning-box">
            <p className="warning-text">{selectedExercise?.note}</p>
          </div>
        )}
        
        <div className="words-preview-section">
          <h3 className="preview-title">Preview words:</h3>
          <div className="words-grid">
            {selectedExercise?.id === 1 && (
              <>
                <span className="word-chip">cat</span>
                <span className="word-chip">bat</span>
                <span className="word-chip">hat</span>
                <span className="word-chip">mat</span>
                <span className="word-chip">cap</span>
                <span className="word-chip">cup</span>
                <span className="word-chip">map</span>
                <span className="word-chip">mop</span>
                <span className="word-chip">pin</span>
                <span className="word-chip">pen</span>
                <span className="word-chip">sit</span>
                <span className="word-chip">set</span>
                <span className="word-chip">bad</span>
                <span className="word-chip">bed</span>
                <span className="word-chip">big</span>
                <span className="word-chip">pig</span>
                <span className="word-chip">fan</span>
                <span className="word-chip">van</span>
                <span className="word-chip">tap</span>
                <span className="word-chip">top</span>
              </>
            )}
            {selectedExercise?.id === 2 && (
              <>
                <span className="word-chip">house</span>
                <span className="word-chip">tree</span>
                <span className="word-chip">school</span>
                <span className="word-chip">water</span>
                <span className="word-chip">mother</span>
                <span className="word-chip">father</span>
                <span className="word-chip">child</span>
                <span className="word-chip">book</span>
                <span className="word-chip">table</span>
                <span className="word-chip">chair</span>
                <span className="word-chip">apple</span>
                <span className="word-chip">bread</span>
                <span className="word-chip">car</span>
                <span className="word-chip">road</span>
                <span className="word-chip">sun</span>
                <span className="word-chip">moon</span>
                <span className="word-chip">dog</span>
                <span className="word-chip">cat</span>
                <span className="word-chip">friend</span>
                <span className="word-chip">teacher</span>
              </>
            )}
            {selectedExercise?.id === 3 && (
              <>
                <span className="word-chip">mip</span>
                <span className="word-chip">lat</span>
                <span className="word-chip">nob</span>
                <span className="word-chip">kep</span>
                <span className="word-chip">sud</span>
                <span className="word-chip">fik</span>
                <span className="word-chip">zan</span>
                <span className="word-chip">pel</span>
                <span className="word-chip">mot</span>
                <span className="word-chip">rib</span>
                <span className="word-chip">dak</span>
                <span className="word-chip">vun</span>
                <span className="word-chip">sep</span>
                <span className="word-chip">gol</span>
                <span className="word-chip">tim</span>
                <span className="word-chip">paf</span>
                <span className="word-chip">lod</span>
                <span className="word-chip">kes</span>
                <span className="word-chip">bim</span>
                <span className="word-chip">ran</span>
              </>
            )}
          </div>
        </div>
        
        <button className="begin-button">
          Begin Exercise (Timer Starts)
        </button>
      </div>
    </div>
  );
};

export default WordAssessment;