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
  
  // Check for b/d within short words
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

// Calculate similarity between spoken and expected word
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

// Match spoken phrase to the passage and update progress
const matchSpokenToPassage = (spokenText, currentProgress, words) => {
  const cleanSpoken = cleanText(spokenText);
  const spokenWords = cleanSpoken.split(/\s+/);
  
  let matchedIndices = [];
  let startIndex = currentProgress;
  
  for (let i = 0; i < spokenWords.length && startIndex + i < words.length; i++) {
    const similarity = calculateSimilarity(spokenWords[i], words[startIndex + i]);
    if (similarity >= 0.6) {
      matchedIndices.push({
        index: startIndex + i,
        word: words[startIndex + i],
        spoken: spokenWords[i],
        correct: true,
        similarity: similarity
      });
    } else {
      matchedIndices.push({
        index: startIndex + i,
        word: words[startIndex + i],
        spoken: spokenWords[i],
        correct: false,
        similarity: similarity
      });
      // Stop matching on first error (can't skip ahead)
      break;
    }
  }
  
  return matchedIndices;
};

// Generate encouraging feedback
const generateFeedback = (accuracy, expectedWord, spokenWord) => {
  if (accuracy >= 90) {
    return { feedback: `🎉 Excellent! "${expectedWord}" was perfect!`, tip: "You're a reading star!", stars: 3 };
  } else if (accuracy >= 80) {
    return { feedback: `🌟 Great job on "${expectedWord}"! So close!`, tip: "Keep up the great work!", stars: 3 };
  } else if (accuracy >= 70) {
    return { feedback: `🌻 Nice try! "${expectedWord}" is getting there!`, tip: "Say it slowly: " + expectedWord.toLowerCase().split('').join(' • '), stars: 2 };
  } else if (accuracy >= 60) {
    return { feedback: `💪 Good effort! "${expectedWord}" was almost right!`, tip: "Let's try that sound again", stars: 2 };
  } else if (accuracy >= 40) {
    return { feedback: `🌱 I love how you're trying! Keep practicing "${expectedWord}".`, tip: "Look at the word shape", stars: 1 };
  } else {
    return { feedback: `✨ You're brave for trying! Let's learn "${expectedWord}" together.`, tip: "I know you can do it!", stars: 1 };
  }
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
  const [feedback, setFeedback] = useState(null);
  const [lastProcessedLength, setLastProcessedLength] = useState(0);
  
  const recognitionRef = useRef(null);
  const currentWordRef = useRef(null);
  const timeoutRef = useRef(null);
  
  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionSupported(false);
    }
  }, []);
  
  // Clear feedback after delay
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);
  
  // Scroll current word into view
  useEffect(() => {
    if (currentWordRef.current) {
      currentWordRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentWordIndex]);
  
  // Process continuous speech
  const processContinuousSpeech = useCallback((newTranscript) => {
    if (isComplete) return;
    
    // Get the full accumulated transcript
    const fullText = finalTranscript + " " + newTranscript;
    const cleanFull = cleanText(fullText);
    const spokenWords = cleanFull.split(/\s+/);
    
    // Don't reprocess if no new words
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
      // Update state with new matches
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
          
          // Show feedback for each word
          const { feedback: fbText, tip, stars } = generateFeedback(match.accuracy, match.expected, match.spoken);
          setFeedback({ feedback: fbText, tip, stars, accuracy: match.accuracy });
        }
        
        setErrorWords(prevErrors => [...prevErrors, ...newErrors]);
        return updated;
      });
      
      // Update current word index to the next unprocessed word
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
    
    // Check if complete
    if (currentPos >= allWords.length || 
        (currentWordIndex >= allWords.length - 1 && newMatches.some(m => m.index === allWords.length - 1))) {
      finishAssessment();
    }
  }, [currentWordIndex, finalTranscript, lastProcessedLength, wordResults, isComplete]);
  
  // Initialize speech recognition with continuous mode
  const initRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;  // Keep listening continuously
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    let accumulatedTranscript = "";
    
    recognition.onstart = () => {
      console.log("🎙️ Continuous listening started");
      setIsListening(true);
      setTranscript("");
      setFinalTranscript("");
      setLastProcessedLength(0);
    };
    
    recognition.onend = () => {
      console.log("🎙️ Listening ended");
      setIsListening(false);
      
      // Auto-restart if not finished
      if (currentWordIndex < allWords.length && !isComplete) {
        timeoutRef.current = setTimeout(() => {
          if (!isListening && !isComplete) {
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
  }, [currentWordIndex, isComplete, processContinuousSpeech]);
  
  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      const recognition = initRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
        setMicAllowed(true);
        setFeedback({ 
          feedback: "🎤 I'm listening! Read the passage aloud. Take your time!", 
          tip: "Read naturally, I'll follow along",
          stars: 3
        });
      }
    } catch (error) {
      console.error("Microphone error:", error);
      setMicAllowed(false);
    }
  };
  
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsListening(false);
  };
  
  const finishAssessment = () => {
    stopListening();
    
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
    setFeedback(null);
    startListening();
  };
  
  // Results Screen
  if (isComplete) {
    const results = JSON.parse(localStorage.getItem('enhanced_voice_results') || '{}');
    
    return (
      <div className="enhanced-voice-container">
        <div className="enhanced-bg"></div>
        <div className="enhanced-overlay"></div>
        
        <div className="enhanced-nav">
          <button className="enhanced-back-btn" onClick={() => navigate('/adventure')}>
            ← Back
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
            <button className="btn-home" onClick={() => navigate('/adventure')}>
              🏠 Back to Adventure
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Start Screen
  if (!isListening && currentWordIndex === 0 && Object.keys(wordResults).length === 0 && !isComplete) {
    return (
      <div className="enhanced-voice-container">
        <div className="enhanced-bg"></div>
        <div className="enhanced-overlay"></div>
        
        <div className="enhanced-nav">
          <button className="enhanced-back-btn" onClick={() => navigate('/adventure')}>
            ← Back
          </button>
          <div className="enhanced-title">🎙️ Voice Reading</div>
        </div>
        
        <div className="enhanced-start-screen" style={{ overflowY: 'auto', flex: 1 }}>
          {!recognitionSupported ? (
            <div className="error-box">
              <div className="error-icon">⚠️</div>
              <h2>Browser Not Supported</h2>
              <p>Please use <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong> for voice reading.</p>
              <button className="btn-back" onClick={() => navigate('/adventure')}>Go Back</button>
            </div>
          ) : !micAllowed ? (
            <div className="error-box">
              <div className="error-icon">🎙️</div>
              <h2>Microphone Access Needed</h2>
              <p>Please allow microphone access. I can't wait to hear you read!</p>
              <button className="btn-retry" onClick={() => window.location.reload()}>
                🔄 Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="passage-preview">
                <h2>{READING_PASSAGE.title}</h2>
                <div className="passage-text-preview">
                  {READING_PASSAGE.text}
                </div>
              </div>
              
              <div className="instructions">
                <h3>✨ How it works:</h3>
                <ul>
                  <li>🎙️ Click "Start Reading" and allow microphone access</li>
                  <li>📖 Read the <strong>whole passage</strong> aloud at your own pace</li>
                  <li>🎯 I will follow along and highlight words as you read them</li>
                  <li>✅ Words you read correctly turn <span style={{color: '#4CAF50', fontWeight: 'bold'}}>GREEN</span></li>
                  <li>🟠 Words to practice turn <span style={{color: '#E65100', fontWeight: 'bold'}}>ORANGE</span></li>
                  <li>💡 You can pause anytime or click "Finish" when done</li>
                  <li>🌟 Just read naturally - I'm here to cheer you on!</li>
                </ul>
              </div>
              
              <button className="start-voice-btn" onClick={startListening}>
                🎙️ Start Reading
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
  
  // Reading Screen
  const stars = feedback?.stars || 0;
  
  return (
    <div className="enhanced-voice-container reading-active">
      <div className="enhanced-bg"></div>
      <div className="enhanced-overlay"></div>
      
      {/* Fixed Header */}
      <div className="enhanced-nav reading-nav">
        <button className="enhanced-back-btn" onClick={stopListening}>
          ← Back
        </button>
        <div className="enhanced-title">🎙️ Reading Time</div>
        <div className="progress-badge">
          {Object.keys(wordResults).filter(i => wordResults[i]?.correct).length} / {allWords.length}
        </div>
      </div>
      
      {/* Main Content - Scrollable */}
      <div className="enhanced-reading-content" style={{ overflowY: 'auto', flex: 1 }}>
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
        
        {/* Feedback Panel */}
        {feedback && (
          <div className={`feedback-panel mb-4 p-4 rounded-xl text-center ${
            stars === 3 ? 'bg-green-100' : stars === 2 ? 'bg-amber-100' : 'bg-orange-100'
          }`}>
            <div className="text-xl mb-1">
              {"★".repeat(stars)}{"☆".repeat(3 - stars)}
            </div>
            <p className="font-bold text-md">{feedback.feedback}</p>
            {feedback.tip && <p className="text-sm mt-1">💡 {feedback.tip}</p>}
          </div>
        )}
        
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
      </div>
      
      {/* Fixed Footer Controls */}
      <div className="enhanced-controls">
        {!isListening ? (
          <button className="ctrl-btn resume" onClick={startListening}>
            ▶️ Resume Reading
          </button>
        ) : (
          <button className="ctrl-btn pause" onClick={stopListening}>
            ⏸️ Pause
          </button>
        )}
        <button className="ctrl-btn finish" onClick={finishAssessment}>
          🏁 Finish Reading
        </button>
      </div>
    </div>
  );
}