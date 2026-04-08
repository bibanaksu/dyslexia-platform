// frontend/src/components/tasks/EnhancedVoiceReading.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./EnhancedVoiceReading.css";

const READING_PASSAGE = {
  title: "The Teacher",
  text: `While the children were sitting around their father, talking together, one of them asked: "Is there any similarity between you and the teacher, Father?" The father replied, "Yes." "The teacher, my son, takes care of your mind and dedicates his life to educating and guiding you. A polite student obeys teachers just as he obeys his parents and respects them. All teachers make great efforts to raise and educate students. Therefore, students should listen to their advice and recognize the teacher's value, just as they recognize the value of their parents." Then the father turned to his children and said, "Do not neglect your duties. Be kind to those who are kind to you. Work hard for your future and for the service of your country."`,
};

// Split into words
const allWords = READING_PASSAGE.text.split(/\s+/).filter(w => w.length > 0);

// Text cleaning for comparison
const cleanText = (text) => {
  return text.toLowerCase()
    .replace(/[.,!?;:'"()\[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Common dyslexia swaps for partial credit
const isDyslexiaSwap = (spoken, expected) => {
  const swaps = {
    'b': 'd', 'd': 'b', 'p': 'q', 'q': 'p',
    'was': 'saw', 'saw': 'was',
    'their': 'there', 'there': 'their',
    'from': 'form', 'form': 'from',
    'no': 'on', 'on': 'no',
    'not': 'ton', 'ton': 'not'
  };
  
  const cleanSpoken = cleanText(spoken);
  const cleanExpected = cleanText(expected);
  
  if (swaps[cleanSpoken] === cleanExpected) return true;
  if (swaps[cleanExpected] === cleanSpoken) return true;
  
  if (cleanSpoken.length === cleanExpected.length && cleanSpoken.length <= 5) {
    let diffCount = 0;
    for (let i = 0; i < cleanSpoken.length; i++) {
      if (cleanSpoken[i] !== cleanExpected[i]) {
        const pair = cleanSpoken[i] + cleanExpected[i];
        if (pair === 'bd' || pair === 'db' || pair === 'pq' || pair === 'qp') {
          diffCount++;
        } else {
          return false;
        }
      }
    }
    return diffCount <= 2;
  }
  
  return false;
};

// Calculate similarity
const calculateSimilarity = (spoken, expected) => {
  const cleanSpoken = cleanText(spoken);
  const cleanExpected = cleanText(expected);
  
  if (cleanSpoken === cleanExpected) return 1.0;
  if (isDyslexiaSwap(spoken, expected)) return 0.85;
  if (cleanSpoken.includes(cleanExpected) || cleanExpected.includes(cleanSpoken)) return 0.8;
  
  let matches = 0;
  const minLength = Math.min(cleanSpoken.length, cleanExpected.length);
  for (let i = 0; i < minLength; i++) {
    if (cleanSpoken[i] === cleanExpected[i]) matches++;
  }
  
  return matches / Math.max(cleanSpoken.length, cleanExpected.length);
};

export default function EnhancedVoiceReading() {
  const navigate = useNavigate();
  
  const [isListening, setIsListening] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordResults, setWordResults] = useState({});
  const [errorWords, setErrorWords] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [micAllowed, setMicAllowed] = useState(true);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [lastProcessedLength, setLastProcessedLength] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  
  const recognitionRef = useRef(null);
  const currentWordRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const isPausedRef = useRef(false);
  
  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionSupported(false);
    }
  }, []);
  
  // Timer for 3 minutes
  useEffect(() => {
    if (isListening && !isComplete && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            if (recognitionRef.current) {
              recognitionRef.current.stop();
            }
            finishAssessment();
            return 0;
          }
          if (prev <= 31 && prev > 30) {
            setShowTimeWarning(true);
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isListening, isComplete]);
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Scroll current word into view
  useEffect(() => {
    if (currentWordRef.current) {
      currentWordRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentWordIndex]);
  
  // Process continuous speech
  const processContinuousSpeech = useCallback((newTranscript) => {
    if (isComplete || isPausedRef.current) return;
    
    const fullText = finalTranscript + " " + newTranscript;
    const cleanFull = cleanText(fullText);
    const spokenWords = cleanFull.split(/\s+/);
    
    if (spokenWords.length <= lastProcessedLength) return;
    
    const newWords = spokenWords.slice(lastProcessedLength);
    let newMatches = [];
    let currentPos = currentWordIndex;
    
    for (const spokenWord of newWords) {
      if (currentPos >= allWords.length) break;
      if (wordResults[currentPos]) {
        currentPos++;
        continue;
      }
      
      const expectedWord = allWords[currentPos];
      const similarity = calculateSimilarity(spokenWord, expectedWord);
      const isCorrect = similarity >= 0.6;
      const accuracyPercent = Math.round(similarity * 100);
      
      newMatches.push({
        index: currentPos,
        expected: expectedWord,
        spoken: spokenWord,
        correct: isCorrect,
        accuracy: accuracyPercent
      });
      
      currentPos++;
    }
    
    if (newMatches.length > 0) {
      setWordResults(prev => {
        const updated = { ...prev };
        const newErrors = [];
        
        for (const match of newMatches) {
          updated[match.index] = {
            correct: match.correct,
            spoken: match.spoken,
            similarity: match.accuracy / 100,
            expected: match.expected,
            accuracy: match.accuracy
          };
          
          if (!match.correct) {
            newErrors.push({
              index: match.index,
              expected: match.expected,
              spoken: match.spoken,
              similarity: match.accuracy
            });
          }
        }
        
        setErrorWords(prevErrors => [...prevErrors, ...newErrors]);
        return updated;
      });
      
      let nextIndex = currentWordIndex;
      while (nextIndex < allWords.length && wordResults[nextIndex]) {
        nextIndex++;
      }
      for (const match of newMatches) {
        if (match.index >= nextIndex) {
          nextIndex = match.index + 1;
        }
      }
      setCurrentWordIndex(nextIndex);
    }
    
    setLastProcessedLength(spokenWords.length);
    
    if (currentPos >= allWords.length || 
        (currentWordIndex >= allWords.length - 1 && newMatches.some(m => m.index === allWords.length - 1))) {
      finishAssessment();
    }
  }, [currentWordIndex, finalTranscript, lastProcessedLength, wordResults, isComplete]);
  
  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    let accumulatedTranscript = "";
    
    recognition.onstart = () => {
      console.log("🎙️ Continuous listening started");
      setIsListening(true);
      isPausedRef.current = false;
      setTranscript("");
    };
    
    recognition.onend = () => {
      console.log("🎙️ Listening ended");
      setIsListening(false);
      
      if (!isPausedRef.current && currentWordIndex < allWords.length && !isComplete && timeRemaining > 0) {
        setTimeout(() => {
          if (!isListening && !isComplete && !isPausedRef.current) {
            try {
              recognition.start();
            } catch (e) {
              console.log("Restart error:", e);
            }
          }
        }, 500);
      }
    };
    
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'not-allowed') {
        setMicAllowed(false);
      }
      setIsListening(false);
    };
    
    recognition.onresult = (event) => {
      if (isPausedRef.current) return;
      
      let interimTranscript = "";
      let finalTranscriptSegment = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscriptSegment += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscriptSegment) {
        accumulatedTranscript += " " + finalTranscriptSegment;
        setFinalTranscript(prev => prev + " " + finalTranscriptSegment);
        setTranscript(interimTranscript);
        processContinuousSpeech(accumulatedTranscript);
      } else {
        setTranscript(interimTranscript);
      }
    };
    
    return recognition;
  }, [currentWordIndex, isComplete, processContinuousSpeech, timeRemaining]);
  
  const startListening = async () => {
    if (currentWordIndex === 0 && Object.keys(wordResults).length === 0) {
      setTimeRemaining(180);
      setShowTimeWarning(false);
      setFinalTranscript("");
      setLastProcessedLength(0);
      setWordResults({});
      setErrorWords([]);
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      const recognition = initRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
        setMicAllowed(true);
        isPausedRef.current = false;
      }
    } catch (error) {
      console.error("Microphone error:", error);
      setMicAllowed(false);
    }
  };
  
  const pauseListening = () => {
    isPausedRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsListening(false);
  };
  
  const resumeListening = () => {
    if (isComplete) return;
    isPausedRef.current = false;
    startListening();
  };
  
  const finishAssessment = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsListening(false);
    
    const correctCount = Object.values(wordResults).filter(r => r && r.correct === true).length;
    const percentage = Math.round((correctCount / allWords.length) * 100);
    
    let fluencyLevel = '';
    let fluencyColor = '';
    let recommendation = '';
    
    if (percentage >= 85) {
      fluencyLevel = 'Excellent';
      fluencyColor = '#4CAF50';
      recommendation = '🎉 Amazing reading! You are a superstar! Keep sharing your wonderful voice with the world! 🌟';
    } else if (percentage >= 70) {
      fluencyLevel = 'Good';
      fluencyColor = '#8BC34A';
      recommendation = '👍 Great job! You read so well! A few words to practice and you will be perfect!';
    } else if (percentage >= 50) {
      fluencyLevel = 'Developing';
      fluencyColor = '#FF9800';
      recommendation = '🌱 You are growing every day! Keep practicing these words and you will shine!';
    } else {
      fluencyLevel = 'Building';
      fluencyColor = '#f44336';
      recommendation = '💪 You tried your best and that is what matters! Every time you read, you get better and better!';
    }
    
    const results = {
      total_words: allWords.length,
      correct_words: correctCount,
      errors: errorWords.length,
      percentage: percentage,
      fluency_level: fluencyLevel,
      fluency_color: fluencyColor,
      recommendation: recommendation,
      error_details: errorWords
    };
    
    localStorage.setItem('enhanced_voice_results', JSON.stringify(results));
    setIsComplete(true);
  };
  
  const resetAssessment = () => {
    setCurrentWordIndex(0);
    setWordResults({});
    setErrorWords([]);
    setIsComplete(false);
    setTranscript("");
    setFinalTranscript("");
    setLastProcessedLength(0);
    setTimeRemaining(180);
    setShowTimeWarning(false);
    isPausedRef.current = false;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    
    setTimeout(() => {
      startListening();
    }, 100);
  };
  
  const handleBack = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsListening(false);
    navigate('/adventure');
  };
  
  // Results Screen
  if (isComplete) {
    const results = JSON.parse(localStorage.getItem('enhanced_voice_results') || '{}');
    
    return (
      <div className="enhanced-voice-container">
        <div className="enhanced-bg"></div>
        <div className="enhanced-overlay"></div>
        
        <div className="enhanced-nav">
          <button className="enhanced-back-btn" onClick={handleBack}>
            ←
          </button>
          <div className="enhanced-title">🎙️ Reading Results</div>
        </div>
        
        <div className="enhanced-results" style={{ overflowY: 'auto', flex: 1 }}>
          <div className="results-icon">🎉</div>
          <h1>Wonderful Reading!</h1>
          
          <div className="score-circle" style={{ borderColor: results.fluency_color }}>
            <span className="score-number">{results.percentage}%</span>
            <span className="score-label">Accuracy</span>
          </div>
          
          <div className="results-stats">
            <div className="stat">
              <div className="stat-value">{results.correct_words}/{results.total_words}</div>
              <div className="stat-label">Great Reads</div>
            </div>
            <div className="stat">
              <div className="stat-value">{results.errors}</div>
              <div className="stat-label">Let's Practice</div>
            </div>
            <div className="stat">
              <div className="stat-value" style={{ color: results.fluency_color }}>{results.fluency_level}</div>
              <div className="stat-label">Your Level</div>
            </div>
          </div>
          
          <div className="recommendation-box">
            <p>{results.recommendation}</p>
          </div>
          
          {results.error_details && results.error_details.length > 0 && (
            <div className="error-list">
              <h3>📝 Words to practice together:</h3>
              <div className="error-grid">
                {results.error_details.slice(0, 15).map((err, idx) => (
                  <div key={idx} className="error-item">
                    <span className="expected">{err.expected}</span>
                    <span className="spoken">→ "{err.spoken}"</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="enhanced-actions">
            <button className="btn-try-again" onClick={resetAssessment}>
              🔄 Read Again
            </button>
            <button className="btn-home" onClick={handleBack}>
              🏠 Back to Adventure
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  
 
  // Reading Screen
  return (
    <div className="enhanced-voice-container reading-active">
      <div className="enhanced-bg"></div>
      <div className="enhanced-overlay"></div>
      
      {/* Fixed Header */}
      <div className="enhanced-nav reading-nav">
        <button className="enhanced-back-btn" onClick={handleBack}>
          ←
        </button>
        <div className="enhanced-title">🎙️ Reading Time</div>
        <div className={`timer-badge ${showTimeWarning && timeRemaining <= 30 ? 'warning' : ''}`}>
          ⏱️ {formatTime(timeRemaining)}
        </div>
        <div className="progress-badge">
          {Object.keys(wordResults).filter(i => wordResults[i]?.correct).length} / {allWords.length}
        </div>
      </div>
      
      {/* Main Content - Scrollable */}
      <div className="enhanced-reading-content" style={{ overflowY: 'auto', flex: 1 }}>
        {/* Current Word Card with Controls */}
        <div className="current-word-section">
          <div className="enhanced-word-card">
            <div className="enhanced-word-text">{allWords[currentWordIndex]}</div>
            {!wordResults[currentWordIndex] && (
              <div className="word-timer">
                ⏰ {timeRemaining}s
              </div>
            )}
          </div>
          
         
        
        {/* Microphone Status */}
        <div className="mic-status-section">
          <div className={`mic-indicator ${isListening ? 'listening' : ''}`}>
            {isListening ? (
              <>
                <span className="mic-wave">🎙️</span>
                <span className="mic-text">Listening... Keep reading! I'm following along</span>
              </>
            ) : (
              <>
                <span className="mic-wave">⏸️</span>
                <span className="mic-text">Paused - Click Resume to continue reading</span>
              </>
            )}
          </div>
          
          {transcript && (
            <div className="transcript-box">
              <span className="transcript-label">I hear:</span>
              <span className="transcript-text">"{transcript}"</span>
            </div>
          )}
        </div>
        
        {/* Full Passage with Colors */}
        <div className="full-passage">
          <h3>The Teacher</h3>
          <div className="passage-words">
            {allWords.map((word, idx) => {
              let className = 'passage-word';
              if (idx === currentWordIndex && !wordResults[idx]) {
                className += ' current';
              }
              if (wordResults[idx]) {
                if (wordResults[idx].correct === true) {
                  className += ' done-correct';
                } else {
                  className += ' done-wrong';
                }
              }
              return (
                <span 
                  key={idx} 
                  className={className}
                  ref={idx === currentWordIndex ? currentWordRef : null}
                >
                  {word}{' '}
                </span>
              );
            })}
          </div>
        </div>
        {/* Controls under the word card - no footer */}
          <div className="word-controls">
            {!isListening ? (
              <button className="word-ctrl-btn resume-word" onClick={resumeListening}>
                ▶️ Resume
              </button>
            ) : (
              <button className="word-ctrl-btn pause-word" onClick={pauseListening}>
                ⏸️ Pause
              </button>
            )}
            <button className="word-ctrl-btn finish-word" onClick={finishAssessment}>
              🏁 Finish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}