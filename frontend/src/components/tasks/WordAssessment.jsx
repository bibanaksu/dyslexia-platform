import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [currentStage, setCurrentStage] = useState(0); // 0 = map, 1-3 = stages
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
      // Stage complete
      if (currentStage < 3) {
        setUnlockedStages(prev => [...prev, currentStage + 1]);
      }
      setCurrentStage(0); // Return to map
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
        
        {/* Animated leaves */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="floating-leaf"
            initial={{ x: Math.random() * 100 + '%', y: -20, rotate: 0 }}
            animate={{ 
              y: '120%', 
              x: `${Math.random() * 100}%`,
              rotate: 360 
            }}
            transition={{ 
              duration: 8 + Math.random() * 4, 
              repeat: Infinity, 
              delay: i * 0.8,
              ease: 'linear'
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
            <motion.div
              key={loc.id}
              className={`location-node ${isUnlocked ? 'unlocked' : 'locked'}`}
              style={{ 
                left: `${loc.x}%`, 
                top: `${loc.y}%`,
                '--location-color': loc.color
              }}
              whileHover={isUnlocked ? { scale: 1.1 } : {}}
              whileTap={isUnlocked ? { scale: 0.95 } : {}}
              onClick={() => isUnlocked && onStageSelect(loc.id)}
            >
              <div className="location-glow"></div>
              <div className="location-icon">
                {loc.id === 1 && '🍄'}
                {loc.id === 2 && '✨'}
                {loc.id === 3 && '🌳'}
              </div>
              <span className="location-name">{loc.name}</span>
              {!isUnlocked && <div className="lock-icon">🔒</div>}
              
              {isExplorerHere && (
                <motion.div 
                  className="explorer-icon"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  🧒
                </motion.div>
              )}
            </motion.div>
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

  useEffect(() => {
    // Randomize option order
    const distractor = distractorOptions[Math.floor(Math.random() * distractorOptions.length)];
    const shuffled = Math.random() > 0.5 
      ? [currentWord, distractor] 
      : [distractor, currentWord];
    setOptions(shuffled);
    onWordStart();
    setShowAnimal(false);
    setWobbleIndex(null);
  }, [wordIndex, currentWord]);

  const handleOptionClick = (option, index) => {
    if (option === currentWord) {
      setShowAnimal(true);
      // Play chime sound
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJCVk4lwYXCIjI6LfXFnc4CJjIqAcGdsf4iMioF0aG1/hYuLgXRocH+GiouBeGlwgIaJiYB5a3GAhoiJgHptcYGGiImBe25ygYWIiIF8b3KChYeIgX1wcoKFh4eBfXFygoWHh4F+cXOChYaHgX9yc4KFhoeAgHNzgoSGhoCAc3SChIaGgIB0dIKEhYWAgHV0goSFhYCAd3WBg4WFgIB3dYGDhIWAgHh2gYOEhICBeHaBg4SEgIB5d4GCg4SAgHl4gYKDg4CAeniAgoODgIF6eYCCgoOAgXp6gIGCgoCAe3qAgYKCgIF8e4CBgYKAgHx8gIGBgYCAf32AgIGBgIB/fYCAgYGAgH9+gICAgICAf36AgICAgICAf36AgICAgICAgH+AgICAgICAgICAgICAgICAgICAgICAgICAgICA');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch (e) {}
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
            <motion.div 
              key={i} 
              className="cloud"
              animate={{ x: ['-10%', '110%'] }}
              transition={{ duration: 20 + i * 5, repeat: Infinity, delay: i * 3 }}
            />
          ))}
        </div>
        <div className="flowers">
          {[...Array(6)].map((_, i) => (
            <motion.div 
              key={i} 
              className="flower"
              style={{ left: `${10 + i * 15}%` }}
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>

      <div className="stage-header">
        <span className="stage-progress">🌟 {correctCount} / 20 mushrooms found</span>
      </div>

      {/* Main mushroom with word */}
      <motion.div 
        className="main-mushroom"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        key={wordIndex}
      >
        <div className="mushroom-cap">
          <span className="word-display">{currentWord}</span>
        </div>
        <div className="mushroom-stem"></div>
      </motion.div>

      {/* Answer mushrooms */}
      <div className="answer-mushrooms">
        {options.map((option, index) => (
          <motion.button
            key={`${wordIndex}-${index}`}
            className={`answer-mushroom ${wobbleIndex === index ? 'wobble' : ''}`}
            onClick={() => handleOptionClick(option, index)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="small-mushroom-cap">
              <span className="option-word">{option}</span>
            </div>
            <div className="small-mushroom-stem"></div>
          </motion.button>
        ))}
      </div>

      {/* Running animal animation */}
      <AnimatePresence>
        {showAnimal && (
          <motion.div
            className="running-animal"
            initial={{ x: '-100px' }}
            animate={{ x: 'calc(100vw + 100px)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          >
            {Math.random() > 0.5 ? '🐰' : '🐿️'}
          </motion.div>
        )}
      </AnimatePresence>
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
    
    // Randomize options (1 correct + 2 distractors)
    const shuffled = [...distractorOptions, currentWord]
      .sort(() => Math.random() - 0.5);
    setOptions(shuffled);
    
    // Animate letter reveal
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
        {/* Fireflies */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="firefly"
            animate={{
              x: [Math.random() * 100 + '%', Math.random() * 100 + '%', Math.random() * 100 + '%'],
              y: [Math.random() * 100 + '%', Math.random() * 100 + '%', Math.random() * 100 + '%'],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
        <div className="mist-layer"></div>
      </div>

      <div className="stage-header misty-header">
        <span className="stage-progress">🦋 {correctCount} / 20 firefly messages</span>
      </div>

      {/* Firefly word formation */}
      <div className="firefly-word-container">
        <div className="firefly-word">
          {currentWord.split('').map((letter, i) => (
            <motion.span
              key={i}
              className={`firefly-letter ${i < revealedLetters ? 'revealed' : ''}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={i < revealedLetters ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.3 }}
            >
              {letter}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Falling leaves with options */}
      <AnimatePresence>
        {wordRevealed && (
          <div className="falling-leaves">
            {options.map((option, index) => (
              <motion.button
                key={`${wordIndex}-${index}`}
                className={`leaf-option ${shakeIndex === index ? 'shake' : ''}`}
                onClick={() => handleLeafClick(option, index)}
                initial={{ y: -100, opacity: 0, rotate: -30 }}
                animate={{ 
                  y: 0, 
                  opacity: 1, 
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  y: { duration: 1, delay: index * 0.2 },
                  rotate: { duration: 3, repeat: Infinity }
                }}
                whileHover={{ scale: 1.1 }}
              >
                <span className="leaf-word">{option}</span>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Light burst effect */}
      <AnimatePresence>
        {showBurst && (
          <motion.div
            className="light-burst"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>
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
    
    // Reveal rune after animation
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
        {/* Glowing particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="golden-particle"
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 2 + Math.random(), repeat: Infinity, delay: i * 0.1 }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>

      <div className="stage-header ancient-header">
        <span className="stage-progress">🌟 {correctCount} / 20 spells cast</span>
      </div>

      {/* Owl introduction */}
      <AnimatePresence>
        {showOwl && (
          <motion.div
            className="owl-intro"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <div className="owl-character">🦉</div>
            <div className="owl-speech">
              <p>"These are MAGIC FOREST SPELLS! Can you read them so the ancient tree wakes up? They are not real words — they are SPELLS, so sound them out!"</p>
              <button className="owl-dismiss" onClick={() => setShowOwl(false)}>
                Let's go!
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ancient tree with progress */}
      <div className="ancient-tree">
        <div className="tree-trunk">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className={`tree-branch ${i < correctCount ? 'lit' : ''}`}
              animate={i < correctCount ? { 
                boxShadow: ['0 0 10px #DAA520', '0 0 20px #DAA520', '0 0 10px #DAA520']
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          ))}
        </div>

        {/* Rune display on tree */}
        <motion.div 
          className="rune-display"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          key={wordIndex}
        >
          <span className={`rune-word ${runeRevealed ? 'revealed' : ''}`}>
            {currentWord}
          </span>
        </motion.div>
      </div>

      {/* Spell scroll options */}
      {!showOwl && (
        <div className="spell-scrolls">
          {options.map((option, index) => (
            <motion.button
              key={`${wordIndex}-${index}`}
              className={`spell-scroll ${scrollShake === index ? 'shake' : ''}`}
              onClick={() => handleScrollClick(option, index)}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 + index * 0.15 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <span className="scroll-word">{option}</span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
};

// Celebration Screen
const CelebrationScreen = ({ onViewResults }) => {
  return (
    <div className="celebration-screen">
      <div className="confetti-container">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="confetti-piece"
            style={{
              left: `${Math.random() * 100}%`,
              backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][Math.floor(Math.random() * 5)]
            }}
            initial={{ y: -20, rotate: 0 }}
            animate={{ 
              y: '100vh', 
              rotate: 360 * (Math.random() > 0.5 ? 1 : -1) 
            }}
            transition={{ 
              duration: 3 + Math.random() * 2, 
              repeat: Infinity,
              delay: Math.random() * 2 
            }}
          />
        ))}
      </div>

      <motion.div 
        className="celebration-content"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
      >
        <motion.div 
          className="trophy"
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🏆
        </motion.div>
        <h1 className="celebration-title">YOU WOKE UP THE FOREST!</h1>
        <p className="celebration-subtitle">Amazing Explorer!</p>
        
        <div className="celebration-stars">
          {[...Array(5)].map((_, i) => (
            <motion.span
              key={i}
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            >
              ⭐
            </motion.span>
          ))}
        </div>

        <button className="view-results-btn" onClick={onViewResults}>
          View Your Adventure Results
        </button>
      </motion.div>
    </div>
  );
};

// Assessment Summary
const AssessmentSummary = ({ results, onBackToMap }) => {
  const navigate = useNavigate();
  
  const exportJSON = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `forest-adventure-results-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const stats = {
    total: results.length,
    correct: results.filter(r => r.correct).length,
    avgTime: Math.round(results.filter(r => r.correct).reduce((a, b) => a + b.responseTimeMs, 0) / results.filter(r => r.correct).length) || 0
  };

  return (
    <div className="summary-screen">
      <div className="summary-card">
        <h1 className="summary-title">Adventure Summary</h1>
        
        <div className="stats-overview">
          <div className="stat-box">
            <span className="stat-value">{stats.correct}</span>
            <span className="stat-label">Correct Answers</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Words</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{stats.avgTime}ms</span>
            <span className="stat-label">Avg Response Time</span>
          </div>
        </div>

        <div className="results-table-container">
          <table className="results-table">
            <thead>
              <tr>
                <th>Word</th>
                <th>Type</th>
                <th>Correct</th>
                <th>Time (ms)</th>
                <th>Stage</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={index} className={result.correct ? 'correct-row' : 'incorrect-row'}>
                  <td className="word-cell">{result.word}</td>
                  <td>{result.wordType}</td>
                  <td>{result.correct ? '✓' : '✗'}</td>
                  <td>{result.responseTimeMs}</td>
                  <td>{result.stage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="summary-actions">
          <button className="export-btn" onClick={exportJSON}>
            Export as JSON
          </button>
          <button className="back-btn-summary" onClick={() => navigate('/adventure')}>
            Back to Adventure
          </button>
        </div>
      </div>
    </div>
  );
};

// Main WordAssessment Component
const WordAssessment = () => {
  const navigate = useNavigate();
  const {
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
  } = useAssessment();

  const [correctCount, setCorrectCount] = useState(0);
  const [showEncouragement, setShowEncouragement] = useState(null);
  const wordStartTimeRef = useRef(null);

  const handleWordStart = () => {
    wordStartTimeRef.current = Date.now();
  };

  const handleAnswer = (isCorrect) => {
    const responseTime = Date.now() - (wordStartTimeRef.current || Date.now());
    const stageData = STAGE_DATA[currentStage];
    
    recordResult(
      stageData.words[currentWordIndex],
      stageData.wordType,
      isCorrect,
      responseTime
    );

    if (isCorrect) {
      const newCount = correctCount + 1;
      setCorrectCount(newCount);
      
      // Show encouragement every 5 correct answers
      if (newCount % 5 === 0) {
        const message = ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];
        setShowEncouragement(message);
        setTimeout(() => setShowEncouragement(null), 2000);
      }
      
      setTimeout(() => {
        if (currentWordIndex < stageData.words.length - 1) {
          setCurrentWordIndex(currentWordIndex + 1);
        } else {
          // Stage complete
          setCorrectCount(0);
          if (currentStage === 3) {
            setGameComplete(true);
          } else {
            setCurrentStage(0);
          }
          setCurrentWordIndex(0);
        }
      }, 500);
    }
  };

  const handleStageSelect = (stageId) => {
    setCurrentStage(stageId);
    setCurrentWordIndex(0);
    setCorrectCount(0);
  };

  // Show celebration screen
  if (gameComplete && !showSummary) {
    return <CelebrationScreen onViewResults={() => setShowSummary(true)} />;
  }

  // Show summary
  if (showSummary) {
    return <AssessmentSummary results={results} onBackToMap={() => navigate('/adventure')} />;
  }

  // Show map
  if (currentStage === 0) {
    return (
      <div className="word-assessment">
        <button className="nav-back-btn" onClick={() => navigate('/adventure')}>
          ← Back to Adventure
        </button>
        <ForestMap 
          unlockedStages={unlockedStages} 
          onStageSelect={handleStageSelect}
          explorerPosition={Math.max(...unlockedStages)}
        />
      </div>
    );
  }

  return (
    <div className="word-assessment">
      <button className="nav-back-btn stage-back" onClick={() => setCurrentStage(0)}>
        ← Back to Map
      </button>
      
      {/* Encouragement popup */}
      <AnimatePresence>
        {showEncouragement && (
          <motion.div
            className="encouragement-popup"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
          >
            {showEncouragement}
          </motion.div>
        )}
      </AnimatePresence>

      {currentStage === 1 && (
        <Stage1Clearing 
          wordIndex={currentWordIndex}
          onAnswer={handleAnswer}
          onWordStart={handleWordStart}
          correctCount={correctCount}
        />
      )}
      
      {currentStage === 2 && (
        <Stage2MistyWoods 
          wordIndex={currentWordIndex}
          onAnswer={handleAnswer}
          onWordStart={handleWordStart}
          correctCount={correctCount}
        />
      )}
      
      {currentStage === 3 && (
        <Stage3AncientTree 
          wordIndex={currentWordIndex}
          onAnswer={handleAnswer}
          onWordStart={handleWordStart}
          correctCount={correctCount}
        />
      )}
    </div>
  );
};

export default WordAssessment;
