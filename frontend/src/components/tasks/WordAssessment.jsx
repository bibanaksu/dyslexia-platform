import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './WordAssessment.css';

// Word data for each stage
const STAGE_DATA = {
  1: {
    name: 'The Sunny Clearing',
    theme: 'sunny',
    wordType: 'common',
    words: ['the', 'cat', 'dog', 'run', 'big', 'red', 'my', 'see', 'play', 'jump', 'said', 'like', 'look', 'come', 'here', 'good', 'day', 'go', 'up', 'he'],
    distractors: {
      'the': ['teh', 'te'],
      'cat': ['cot', 'bat'],
      'dog': ['bog', 'dop'],
      'run': ['ran', 'rub'],
      'big': ['pig', 'bag'],
      'red': ['rad', 'bed'],
      'my': ['me', 'by'],
      'see': ['sea', 'she'],
      'play': ['plan', 'ploy'],
      'jump': ['dump', 'bump'],
      'said': ['sad', 'siad'],
      'like': ['lick', 'lake'],
      'look': ['lock', 'book'],
      'come': ['came', 'comb'],
      'here': ['hear', 'her'],
      'good': ['goof', 'goob'],
      'day': ['bay', 'doy'],
      'go': ['so', 'bo'],
      'up': ['us', 'op'],
      'he': ['be', 'me']
    }
  },
  2: {
    name: 'The Misty Woods',
    theme: 'misty',
    wordType: 'uncommon',
    words: ['feather', 'enormous', 'whisper', 'clumsy', 'distant', 'ancient', 'hollow', 'tangled', 'shimmer', 'frosty', 'pebble', 'scatter', 'twisted', 'meadow', 'rustle', 'glimmer', 'mossy', 'burrow', 'timber', 'wander'],
    distractors: {
      'feather': ['father', 'weather'],
      'enormous': ['enermous', 'enormus'],
      'whisper': ['wisper', 'whisker'],
      'clumsy': ['clumzy', 'clumsly'],
      'distant': ['distint', 'destant'],
      'ancient': ['ancent', 'anchent'],
      'hollow': ['hallow', 'holow'],
      'tangled': ['tangeld', 'tanglud'],
      'shimmer': ['shimer', 'shimmar'],
      'frosty': ['frostie', 'frozty'],
      'pebble': ['peble', 'pebel'],
      'scatter': ['scater', 'skatter'],
      'twisted': ['twistid', 'twested'],
      'meadow': ['medow', 'meadoe'],
      'rustle': ['rustel', 'russel'],
      'glimmer': ['glimer', 'glammer'],
      'mossy': ['mosy', 'mossie'],
      'burrow': ['burow', 'borrow'],
      'timber': ['timbre', 'tumber'],
      'wander': ['wonder', 'wanter']
    }
  },
  3: {
    name: 'The Ancient Tree',
    theme: 'ancient',
    wordType: 'pseudoword',
    words: ['blurst', 'fimble', 'draven', 'quilp', 'snortle', 'blivit', 'mopple', 'triven', 'zandel', 'gloffen', 'nurbit', 'whelsh', 'cradox', 'spulm', 'fendril', 'yottle', 'brimf', 'skoven', 'plunket', 'garvil'],
    distractors: {
      'blurst': ['blirst', 'blerst'],
      'fimble': ['fimbel', 'fumble'],
      'draven': ['droven', 'dravin'],
      'quilp': ['qulip', 'quilb'],
      'snortle': ['snortel', 'snortul'],
      'blivit': ['blivot', 'blivut'],
      'mopple': ['moppel', 'mapple'],
      'triven': ['trivin', 'trovin'],
      'zandel': ['zandal', 'zandil'],
      'gloffen': ['gloffin', 'glofton'],
      'nurbit': ['nurbat', 'nerbit'],
      'whelsh': ['whelch', 'whilsh'],
      'cradox': ['cradex', 'crodox'],
      'spulm': ['spulb', 'spulme'],
      'fendril': ['fendral', 'findril'],
      'yottle': ['yottel', 'yattle'],
      'brimf': ['brimb', 'brimp'],
      'skoven': ['skovin', 'skovan'],
      'plunket': ['plunkit', 'plonket'],
      'garvil': ['garvol', 'garvul']
    }
  }
};

const ENCOURAGEMENT_MESSAGES = [
  "Wow, you're amazing!",
  "The forest loves you!",
  "Keep going explorer!",
  "You're so brave!",
  "Fantastic reading!",
  "The animals are cheering!"
];

// Custom hook for assessment logic
const useAssessment = () => {
  const [currentStage, setCurrentStage] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [unlockedStages, setUnlockedStages] = useState([1]);
  const [wordStartTime, setWordStartTime] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const recordResult = useCallback((word, wordType, correct, responseTimeMs) => {
    setResults(prev => [...prev, {
      word,
      wordType,
      correct,
      responseTimeMs,
      timestamp: new Date().toISOString(),
      stage: currentStage
    }]);
  }, [currentStage]);

  const startWord = useCallback(() => {
    setWordStartTime(Date.now());
  }, []);

  const advanceWord = useCallback(() => {
    const stageData = STAGE_DATA[currentStage];
    if (currentWordIndex < stageData.words.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      if (currentStage < 3) {
        setUnlockedStages(prev => [...prev, currentStage + 1]);
      }
      setCurrentStage(0);
      setCurrentWordIndex(0);
      if (currentStage === 3) {
        setGameComplete(true);
      }
    }
  }, [currentStage, currentWordIndex]);

  return {
    currentStage,
    setCurrentStage,
    currentWordIndex,
    setCurrentWordIndex,
    results,
    unlockedStages,
    wordStartTime,
    startWord,
    recordResult,
    advanceWord,
    gameComplete,
    setGameComplete,
    showSummary,
    setShowSummary
  };
};

// Forest Map Component
const ForestMap = ({ unlockedStages, onStageSelect, explorerPosition }) => {
  const locations = [
    { id: 1, name: 'The Sunny Clearing', x: 20, y: 70, color: '#FFD79C' },
    { id: 2, name: 'The Misty Woods', x: 50, y: 40, color: '#7B68EE' },
    { id: 3, name: 'The Ancient Tree', x: 80, y: 65, color: '#DAA520' }
  ];

  return (
    <div className="forest-map">
      <div className="map-background">
        <div className="map-trees"></div>
        <div className="map-path"></div>
        
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="floating-leaf"
            style={{ 
              animationDelay: `${i * 0.8}s`,
              left: `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>

      <h1 className="map-title">Forest Adventure</h1>
      <p className="map-subtitle">Choose your path, brave explorer!</p>

      <div className="locations-container">
        {locations.map((loc) => {
          const isUnlocked = unlockedStages.includes(loc.id);
          const isExplorerHere = explorerPosition === loc.id || (explorerPosition === 0 && loc.id === 1);
          
          return (
            <div
              key={loc.id}
              className={`location-node ${isUnlocked ? 'unlocked' : 'locked'}`}
              style={{ 
                left: `${loc.x}%`, 
                top: `${loc.y}%`,
                '--location-color': loc.color
              }}
              onClick={() => isUnlocked && onStageSelect(loc.id)}
            >
              <div className="location-glow"></div>
              <div className="location-icon">
                {loc.id === 1 && <span role="img" aria-label="mushroom">&#127812;</span>}
                {loc.id === 2 && <span role="img" aria-label="sparkles">&#10024;</span>}
                {loc.id === 3 && <span role="img" aria-label="tree">&#127795;</span>}
              </div>
              <span className="location-name">{loc.name}</span>
              {!isUnlocked && <div className="lock-icon"><span role="img" aria-label="locked">&#128274;</span></div>}
              
              {isExplorerHere && (
                <div className="explorer-icon">
                  <span role="img" aria-label="explorer">&#129490;</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Stage 1 - Sunny Clearing (Mushroom mechanic)
const Stage1Clearing = ({ wordIndex, onAnswer, onWordStart, correctCount }) => {
  const stageData = STAGE_DATA[1];
  const currentWord = stageData.words[wordIndex];
  const distractorOptions = stageData.distractors[currentWord];
  const [options, setOptions] = useState([]);
  const [showAnimal, setShowAnimal] = useState(false);
  const [wobbleIndex, setWobbleIndex] = useState(null);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const distractor = distractorOptions[Math.floor(Math.random() * distractorOptions.length)];
    const shuffled = Math.random() > 0.5 
      ? [currentWord, distractor] 
      : [distractor, currentWord];
    setOptions(shuffled);
    onWordStart();
    setShowAnimal(false);
    setWobbleIndex(null);
    setAnimateIn(false);
    setTimeout(() => setAnimateIn(true), 50);
  }, [wordIndex, currentWord]);

  const handleOptionClick = (option, index) => {
    if (option === currentWord) {
      setShowAnimal(true);
      setTimeout(() => {
        onAnswer(true);
      }, 800);
    } else {
      setWobbleIndex(index);
      onAnswer(false);
      setTimeout(() => setWobbleIndex(null), 500);
    }
  };

  return (
    <div className="stage stage-sunny">
      <div className="sunny-background">
        <div className="sun"></div>
        <div className="clouds">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i} 
              className="cloud"
              style={{ animationDelay: `${i * 3}s`, animationDuration: `${20 + i * 5}s` }}
            />
          ))}
        </div>
        <div className="flowers">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="flower"
              style={{ left: `${10 + i * 15}%`, animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>

      <div className="stage-header">
        <span className="stage-progress"><span role="img" aria-label="star">&#11088;</span> {correctCount} / 20 mushrooms found</span>
      </div>

      <div className={`main-mushroom ${animateIn ? 'animate-in' : ''}`} key={wordIndex}>
        <div className="mushroom-cap">
          <span className="word-display">{currentWord}</span>
        </div>
        <div className="mushroom-stem"></div>
      </div>

      <div className="answer-mushrooms">
        {options.map((option, index) => (
          <button
            key={`${wordIndex}-${index}`}
            className={`answer-mushroom ${wobbleIndex === index ? 'wobble' : ''} ${animateIn ? 'animate-in' : ''}`}
            onClick={() => handleOptionClick(option, index)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="small-mushroom-cap">
              <span className="option-word">{option}</span>
            </div>
            <div className="small-mushroom-stem"></div>
          </button>
        ))}
      </div>

      {showAnimal && (
        <div className="running-animal">
          {Math.random() > 0.5 ? <span role="img" aria-label="rabbit">&#128048;</span> : <span role="img" aria-label="squirrel">&#128063;</span>}
        </div>
      )}
    </div>
  );
};

// Stage 2 - Misty Woods (Firefly mechanic)
const Stage2MistyWoods = ({ wordIndex, onAnswer, onWordStart, correctCount }) => {
  const stageData = STAGE_DATA[2];
  const currentWord = stageData.words[wordIndex];
  const distractorOptions = stageData.distractors[currentWord];
  const [options, setOptions] = useState([]);
  const [wordRevealed, setWordRevealed] = useState(false);
  const [revealedLetters, setRevealedLetters] = useState(0);
  const [showBurst, setShowBurst] = useState(false);
  const [shakeIndex, setShakeIndex] = useState(null);

  useEffect(() => {
    setWordRevealed(false);
    setRevealedLetters(0);
    setShowBurst(false);
    setShakeIndex(null);
    
    const shuffled = [...distractorOptions, currentWord]
      .sort(() => Math.random() - 0.5);
    setOptions(shuffled);
    
    const interval = setInterval(() => {
      setRevealedLetters(prev => {
        if (prev >= currentWord.length) {
          clearInterval(interval);
          setWordRevealed(true);
          onWordStart();
          return prev;
        }
        return prev + 1;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [wordIndex, currentWord]);

  const handleLeafClick = (option, index) => {
    if (!wordRevealed) return;
    
    if (option === currentWord) {
      setShowBurst(true);
      setTimeout(() => onAnswer(true), 600);
    } else {
      setShakeIndex(index);
      onAnswer(false);
      setTimeout(() => setShakeIndex(null), 500);
    }
  };

  return (
    <div className="stage stage-misty">
      <div className="misty-background">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="firefly"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
        <div className="mist-layer"></div>
      </div>

      <div className="stage-header misty-header">
        <span className="stage-progress"><span role="img" aria-label="butterfly">&#129419;</span> {correctCount} / 20 firefly messages</span>
      </div>

      <div className="firefly-word-container">
        <div className="firefly-word">
          {currentWord.split('').map((letter, i) => (
            <span
              key={i}
              className={`firefly-letter ${i < revealedLetters ? 'revealed' : ''}`}
            >
              {letter}
            </span>
          ))}
        </div>
      </div>

      {wordRevealed && (
        <div className="falling-leaves">
          {options.map((option, index) => (
            <button
              key={`${wordIndex}-${index}`}
              className={`leaf-option ${shakeIndex === index ? 'shake' : ''}`}
              onClick={() => handleLeafClick(option, index)}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <span className="leaf-word">{option}</span>
            </button>
          ))}
        </div>
      )}

      {showBurst && <div className="light-burst" />}
    </div>
  );
};

// Stage 3 - Ancient Tree (Rune mechanic)
const Stage3AncientTree = ({ wordIndex, onAnswer, onWordStart, correctCount }) => {
  const stageData = STAGE_DATA[3];
  const currentWord = stageData.words[wordIndex];
  const distractorOptions = stageData.distractors[currentWord];
  const [options, setOptions] = useState([]);
  const [runeRevealed, setRuneRevealed] = useState(false);
  const [scrollShake, setScrollShake] = useState(null);
  const [showOwl, setShowOwl] = useState(wordIndex === 0);

  useEffect(() => {
    setRuneRevealed(false);
    setScrollShake(null);
    
    const distractor = distractorOptions[Math.floor(Math.random() * distractorOptions.length)];
    const shuffled = Math.random() > 0.5 
      ? [currentWord, distractor] 
      : [distractor, currentWord];
    setOptions(shuffled);
    
    setTimeout(() => {
      setRuneRevealed(true);
      onWordStart();
    }, 800);
  }, [wordIndex, currentWord]);

  const handleScrollClick = (option, index) => {
    if (!runeRevealed) return;
    
    if (option === currentWord) {
      onAnswer(true);
    } else {
      setScrollShake(index);
      onAnswer(false);
      setTimeout(() => setScrollShake(null), 500);
    }
  };

  return (
    <div className="stage stage-ancient">
      <div className="ancient-background">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="golden-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: `${2 + Math.random()}s`
            }}
          />
        ))}
      </div>

      <div className="stage-header ancient-header">
        <span className="stage-progress"><span role="img" aria-label="star">&#11088;</span> {correctCount} / 20 spells cast</span>
      </div>

      {showOwl && (
        <div className="owl-intro">
          <div className="owl-character"><span role="img" aria-label="owl">&#129417;</span></div>
          <div className="owl-speech">
            <p>"These are MAGIC FOREST SPELLS! Can you read them so the ancient tree wakes up? They are not real words - they are SPELLS, so sound them out!"</p>
            <button className="owl-dismiss" onClick={() => setShowOwl(false)}>
              Let's go!
            </button>
          </div>
        </div>
      )}

      <div className="ancient-tree">
        <div className="tree-trunk">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`tree-branch ${i < correctCount ? 'lit' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className={`rune-stone ${runeRevealed ? 'revealed' : ''}`}>
        <div className="rune-glow"></div>
        <span className="rune-word">{currentWord}</span>
      </div>

      <div className="scroll-options">
        {options.map((option, index) => (
          <button
            key={`${wordIndex}-${index}`}
            className={`scroll-option ${scrollShake === index ? 'shake' : ''}`}
            onClick={() => handleScrollClick(option, index)}
          >
            <div className="scroll-body">
              <span className="scroll-word">{option}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Celebration Component
const CelebrationScreen = ({ onContinue }) => {
  return (
    <div className="celebration-screen">
      <div className="confetti-container">
        {[...Array(50)].map((_, i) => (
          <div 
            key={i} 
            className="confetti-piece"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA', '#34D399'][Math.floor(Math.random() * 5)]
            }}
          />
        ))}
      </div>
      
      <div className="celebration-content">
        <div className="trophy"><span role="img" aria-label="trophy">&#127942;</span></div>
        <h1 className="celebration-title">Amazing Explorer!</h1>
        <p className="celebration-text">You've completed the entire Forest Adventure!</p>
        <div className="forest-animals">
          <span role="img" aria-label="rabbit">&#128048;</span>
          <span role="img" aria-label="fox">&#129418;</span>
          <span role="img" aria-label="owl">&#129417;</span>
          <span role="img" aria-label="deer">&#129420;</span>
          <span role="img" aria-label="squirrel">&#128063;</span>
        </div>
        <button className="celebration-button" onClick={onContinue}>
          See My Results
        </button>
      </div>
    </div>
  );
};

// Results Summary Component
const ResultsSummary = ({ results, onClose }) => {
  const navigate = useNavigate();
  
  const stageResults = {
    1: results.filter(r => r.stage === 1),
    2: results.filter(r => r.stage === 2),
    3: results.filter(r => r.stage === 3)
  };

  const calculateStats = (stageData) => {
    if (stageData.length === 0) return { accuracy: 0, avgTime: 0 };
    const correct = stageData.filter(r => r.correct).length;
    const avgTime = stageData.reduce((acc, r) => acc + r.responseTimeMs, 0) / stageData.length;
    return {
      accuracy: Math.round((correct / stageData.length) * 100),
      avgTime: Math.round(avgTime)
    };
  };

  const exportResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      totalWords: results.length,
      results: results,
      summary: {
        stage1: calculateStats(stageResults[1]),
        stage2: calculateStats(stageResults[2]),
        stage3: calculateStats(stageResults[3])
      }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `word-assessment-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="results-summary">
      <div className="results-container">
        <h1 className="results-title">Assessment Results</h1>
        
        <div className="stage-summaries">
          {[1, 2, 3].map(stage => {
            const stats = calculateStats(stageResults[stage]);
            return (
              <div key={stage} className={`stage-summary stage-${stage}-summary`}>
                <h3>{STAGE_DATA[stage].name}</h3>
                <p className="word-type">{STAGE_DATA[stage].wordType} words</p>
                <div className="stats">
                  <div className="stat">
                    <span className="stat-value">{stats.accuracy}%</span>
                    <span className="stat-label">Accuracy</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{stats.avgTime}ms</span>
                    <span className="stat-label">Avg Time</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="results-table-container">
          <h2>Detailed Results</h2>
          <table className="results-table">
            <thead>
              <tr>
                <th>Word</th>
                <th>Type</th>
                <th>Result</th>
                <th>Time (ms)</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={index} className={result.correct ? 'correct' : 'incorrect'}>
                  <td>{result.word}</td>
                  <td>{result.wordType}</td>
                  <td>{result.correct ? 'Correct' : 'Incorrect'}</td>
                  <td>{result.responseTimeMs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="results-actions">
          <button className="export-button" onClick={exportResults}>
            Export Results (JSON)
          </button>
          <button className="close-button" onClick={() => navigate('/reading-adventure')}>
            Back to Adventure
          </button>
        </div>
      </div>
    </div>
  );
};

// Encouragement Toast
const EncouragementToast = ({ message, visible }) => {
  if (!visible) return null;
  
  return (
    <div className="encouragement-toast">
      <span className="toast-emoji"><span role="img" aria-label="sparkles">&#10024;</span></span>
      <span className="toast-message">{message}</span>
    </div>
  );
};

// Main Component
const WordAssessment = () => {
  const navigate = useNavigate();
  const {
    currentStage,
    setCurrentStage,
    currentWordIndex,
    results,
    unlockedStages,
    wordStartTime,
    startWord,
    recordResult,
    advanceWord,
    gameComplete,
    setGameComplete,
    showSummary,
    setShowSummary
  } = useAssessment();

  const [correctCount, setCorrectCount] = useState(0);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [encouragementMessage, setEncouragementMessage] = useState('');
  const totalCorrectRef = useRef(0);

  const handleAnswer = useCallback((correct) => {
    const responseTime = Date.now() - wordStartTime;
    const stageData = STAGE_DATA[currentStage];
    const currentWord = stageData.words[currentWordIndex];
    
    recordResult(currentWord, stageData.wordType, correct, responseTime);
    
    if (correct) {
      setCorrectCount(prev => prev + 1);
      totalCorrectRef.current += 1;
      
      if (totalCorrectRef.current % 5 === 0) {
        const randomMessage = ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];
        setEncouragementMessage(randomMessage);
        setShowEncouragement(true);
        setTimeout(() => setShowEncouragement(false), 2000);
      }
    }
    
    setTimeout(() => advanceWord(), correct ? 1000 : 500);
  }, [wordStartTime, currentStage, currentWordIndex, recordResult, advanceWord]);

  const handleStageSelect = (stageId) => {
    setCurrentStage(stageId);
    setCorrectCount(0);
  };

  if (showSummary) {
    return <ResultsSummary results={results} onClose={() => navigate('/reading-adventure')} />;
  }

  if (gameComplete) {
    return <CelebrationScreen onContinue={() => setShowSummary(true)} />;
  }

  return (
    <div className="word-assessment">
      <EncouragementToast message={encouragementMessage} visible={showEncouragement} />
      
      {currentStage === 0 && (
        <ForestMap
          unlockedStages={unlockedStages}
          onStageSelect={handleStageSelect}
          explorerPosition={unlockedStages[unlockedStages.length - 1]}
        />
      )}

      {currentStage === 1 && (
        <Stage1Clearing
          wordIndex={currentWordIndex}
          onAnswer={handleAnswer}
          onWordStart={startWord}
          correctCount={correctCount}
        />
      )}

      {currentStage === 2 && (
        <Stage2MistyWoods
          wordIndex={currentWordIndex}
          onAnswer={handleAnswer}
          onWordStart={startWord}
          correctCount={correctCount}
        />
      )}

      {currentStage === 3 && (
        <Stage3AncientTree
          wordIndex={currentWordIndex}
          onAnswer={handleAnswer}
          onWordStart={startWord}
          correctCount={correctCount}
        />
      )}

      {currentStage !== 0 && (
        <button className="back-to-map" onClick={() => setCurrentStage(0)}>
          <span role="img" aria-label="map">&#128506;</span> Back to Map
        </button>
      )}
    </div>
  );
};

export default WordAssessment;
