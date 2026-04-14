// frontend/src/components/tasks/EnhancedVoiceReading.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./EnhancedVoiceReading.css";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const READING_PASSAGE = {
  title: "The Teacher",
  text: `While the children were sitting around their father, talking together, one of them asked: "Is there any similarity between you and the teacher, Father?" The father replied, "Yes." "The teacher, my son, takes care of your mind and dedicates his life to educating and guiding you. A polite student obeys teachers just as he obeys his parents and respects them. All teachers make great efforts to raise and educate students. Therefore, students should listen to their advice and recognize the teacher's value, just as they recognize the value of their parents." Then the father turned to his children and said, "Do not neglect your duties. Be kind to those who are kind to you. Work hard for your future and for the service of your country."`,
};

const allWords = READING_PASSAGE.text.split(/\s+/).filter(w => w.length > 0);

/* ─── Text helpers ──────────────────────────────────────── */
const cleanText = (text) =>
  text.toLowerCase().replace(/[.,!?;:'"()\[\]{}]/g, '').replace(/\s+/g, ' ').trim();

const isDyslexiaSwap = (spoken, expected) => {
  const swaps = {
    'b':'d','d':'b','p':'q','q':'p',
    'was':'saw','saw':'was',
    'their':'there','there':'their',
    'from':'form','form':'from',
    'no':'on','on':'no','not':'ton','ton':'not',
  };
  const cs = cleanText(spoken);
  const ce = cleanText(expected);
  if (swaps[cs] === ce || swaps[ce] === cs) return true;
  if (cs.length === ce.length && cs.length <= 5) {
    let diff = 0;
    for (let i = 0; i < cs.length; i++) {
      if (cs[i] !== ce[i]) {
        const pair = cs[i] + ce[i];
        if (pair === 'bd' || pair === 'db' || pair === 'pq' || pair === 'qp') diff++;
        else return false;
      }
    }
    return diff <= 2;
  }
  return false;
};

const calculateSimilarity = (spoken, expected) => {
  const cs = cleanText(spoken);
  const ce = cleanText(expected);
  if (cs === ce) return 1.0;
  if (isDyslexiaSwap(spoken, expected)) return 0.85;
  if (cs.includes(ce) || ce.includes(cs)) return 0.8;
  let matches = 0;
  const min = Math.min(cs.length, ce.length);
  for (let i = 0; i < min; i++) { if (cs[i] === ce[i]) matches++; }
  return matches / Math.max(cs.length, ce.length);
};

/* ─── Component ─────────────────────────────────────────── */
export default function EnhancedVoiceReading() {
  const navigate = useNavigate();

  const [isListening, setIsListening]               = useState(false);
  const [currentWordIndex, setCurrentWordIndex]     = useState(0);
  const [wordResults, setWordResults]               = useState({});
  const [errorWords, setErrorWords]                 = useState([]);
  const [isComplete, setIsComplete]                 = useState(false);
  const [transcript, setTranscript]                 = useState('');
  const [finalTranscript, setFinalTranscript]       = useState('');
  const [micAllowed, setMicAllowed]                 = useState(true);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [lastProcessedLength, setLastProcessedLength] = useState(0);
  const [timeRemaining, setTimeRemaining]           = useState(180);
  const [timeUsed, setTimeUsed]                     = useState(0);
  const [showTimeWarning, setShowTimeWarning]       = useState(false);

  // Save state
  const [saving, setSaving]     = useState(false);
  const [savedId, setSavedId]   = useState(null);
  const [saveError, setSaveError] = useState('');
  const [resultsData, setResultsData] = useState(null);

  const recognitionRef     = useRef(null);
  const currentWordRef     = useRef(null);
  const timerIntervalRef   = useRef(null);
  const isPausedRef        = useRef(false);
  const startTimeRef       = useRef(null);

  useEffect(() => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      setRecognitionSupported(false);
    }
  }, []);

  /* ── Timer ────────────────────────────────────────────── */
  useEffect(() => {
    if (isListening && !isComplete && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            if (recognitionRef.current) recognitionRef.current.stop();
            finishAssessment();
            return 0;
          }
          if (prev === 31) setShowTimeWarning(true);
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [isListening, isComplete]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  useEffect(() => {
    if (currentWordRef.current) {
      currentWordRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentWordIndex]);

  /* ── Save to DB ───────────────────────────────────────── */
  const saveResultsToDB = async (results) => {
    setSaving(true);
    setSaveError('');
    const token = localStorage.getItem('token');
    try {
      const res  = await fetch(`${API}/api/assessments/task2/submit`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          totalWords:   results.total_words,
          correctWords: results.correct_words,
          errorCount:   results.errors,
          percentage:   results.percentage,
          fluencyLevel: results.fluency_level,
          timeUsedSec:  results.time_used,
          passageTitle: READING_PASSAGE.title,
          errorDetails: results.error_details,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSavedId(data.resultId);
        console.log('✅ Task2 saved, result:', data.resultId);
      } else {
        setSaveError(data.error || 'Could not save to server.');
      }
    } catch {
      setSaveError('Network error — results shown locally only.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Speech processing ────────────────────────────────── */
  const processContinuousSpeech = useCallback((newTranscript) => {
    if (isComplete || isPausedRef.current) return;

    const fullText   = finalTranscript + ' ' + newTranscript;
    const cleanFull  = cleanText(fullText);
    const spokenWords = cleanFull.split(/\s+/);

    if (spokenWords.length <= lastProcessedLength) return;

    const newWords = spokenWords.slice(lastProcessedLength);
    let newMatches = [];
    let currentPos = currentWordIndex;

    for (const spokenWord of newWords) {
      if (currentPos >= allWords.length) break;
      if (wordResults[currentPos]) { currentPos++; continue; }

      const expectedWord  = allWords[currentPos];
      const similarity    = calculateSimilarity(spokenWord, expectedWord);
      const isCorrect     = similarity >= 0.6;
      const accuracyPct   = Math.round(similarity * 100);

      newMatches.push({ index: currentPos, expected: expectedWord, spoken: spokenWord, correct: isCorrect, accuracy: accuracyPct });
      currentPos++;
    }

    if (newMatches.length > 0) {
      setWordResults(prev => {
        const updated = { ...prev };
        const newErrors = [];
        for (const match of newMatches) {
          updated[match.index] = { correct: match.correct, spoken: match.spoken, similarity: match.accuracy / 100, expected: match.expected, accuracy: match.accuracy };
          if (!match.correct) newErrors.push({ index: match.index, expected: match.expected, spoken: match.spoken, similarity: match.accuracy });
        }
        setErrorWords(prevErrs => [...prevErrs, ...newErrors]);
        return updated;
      });

      let nextIndex = currentWordIndex;
      while (nextIndex < allWords.length && wordResults[nextIndex]) nextIndex++;
      for (const match of newMatches) { if (match.index >= nextIndex) nextIndex = match.index + 1; }
      setCurrentWordIndex(nextIndex);
    }

    setLastProcessedLength(spokenWords.length);

    if (currentPos >= allWords.length ||
        (currentWordIndex >= allWords.length - 1 && newMatches.some(m => m.index === allWords.length - 1))) {
      finishAssessment();
    }
  }, [currentWordIndex, finalTranscript, lastProcessedLength, wordResults, isComplete]);

  /* ── Recognition setup ────────────────────────────────── */
  const initRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;

    const recognition          = new SR();
    recognition.continuous     = true;
    recognition.interimResults = true;
    recognition.lang           = 'en-US';

    let accumulated = '';

    recognition.onstart = () => { setIsListening(true); isPausedRef.current = false; setTranscript(''); };

    recognition.onend = () => {
      setIsListening(false);
      if (!isPausedRef.current && currentWordIndex < allWords.length && !isComplete && timeRemaining > 0) {
        setTimeout(() => {
          if (!isListening && !isComplete && !isPausedRef.current) {
            try { recognition.start(); } catch {}
          }
        }, 500);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') setMicAllowed(false);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      if (isPausedRef.current) return;
      let interim = '', finalSeg = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalSeg += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      if (finalSeg) {
        accumulated += ' ' + finalSeg;
        setFinalTranscript(prev => prev + ' ' + finalSeg);
        setTranscript(interim);
        processContinuousSpeech(accumulated);
      } else {
        setTranscript(interim);
      }
    };

    return recognition;
  }, [currentWordIndex, isComplete, processContinuousSpeech, timeRemaining]);

  /* ── Controls ─────────────────────────────────────────── */
  const startListening = async () => {
    if (currentWordIndex === 0 && Object.keys(wordResults).length === 0) {
      setTimeRemaining(180);
      setShowTimeWarning(false);
      setFinalTranscript('');
      setLastProcessedLength(0);
      setWordResults({});
      setErrorWords([]);
      startTimeRef.current = Date.now();
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      const recognition = initRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
        setMicAllowed(true);
        isPausedRef.current = false;
        if (!startTimeRef.current) startTimeRef.current = Date.now();
      }
    } catch {
      setMicAllowed(false);
    }
  };

  const pauseListening = () => {
    isPausedRef.current = true;
    if (recognitionRef.current) recognitionRef.current.stop();
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    setIsListening(false);
  };

  const resumeListening = () => {
    if (isComplete) return;
    isPausedRef.current = false;
    startListening();
  };

  const finishAssessment = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    setIsListening(false);

    const elapsed      = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;
    const correctCount = Object.values(wordResults).filter(r => r?.correct === true).length;
    const percentage   = Math.round((correctCount / allWords.length) * 100);

    let fluencyLevel = 'Building', fluencyColor = '#f44336',
        recommendation = '💪 You tried your best and that is what matters! Every time you read, you get better and better!';

    if (percentage >= 85) {
      fluencyLevel = 'Excellent'; fluencyColor = '#4CAF50';
      recommendation = '🎉 Amazing reading! You are a superstar! Keep sharing your wonderful voice with the world! 🌟';
    } else if (percentage >= 70) {
      fluencyLevel = 'Good'; fluencyColor = '#8BC34A';
      recommendation = '👍 Great job! You read so well! A few words to practice and you will be perfect!';
    } else if (percentage >= 50) {
      fluencyLevel = 'Developing'; fluencyColor = '#FF9800';
      recommendation = '🌱 You are growing every day! Keep practicing these words and you will shine!';
    }

    const results = {
      total_words:   allWords.length,
      correct_words: correctCount,
      errors:        errorWords.length,
      percentage,
      fluency_level: fluencyLevel,
      fluency_color: fluencyColor,
      recommendation,
      error_details: errorWords,
      time_used:     elapsed,
    };

    localStorage.setItem('enhanced_voice_results', JSON.stringify(results));
    setResultsData(results);
    setTimeUsed(elapsed);
    setIsComplete(true);

    // Save to DB
    saveResultsToDB(results);
  };

  const resetAssessment = () => {
    setCurrentWordIndex(0);
    setWordResults({});
    setErrorWords([]);
    setIsComplete(false);
    setTranscript('');
    setFinalTranscript('');
    setLastProcessedLength(0);
    setTimeRemaining(180);
    setShowTimeWarning(false);
    setSavedId(null);
    setSaveError('');
    setResultsData(null);
    isPausedRef.current    = false;
    startTimeRef.current   = null;
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    setTimeout(() => startListening(), 100);
  };

  const handleBack = () => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsListening(false);
    navigate('/adventure');
  };

  /* ════════════════════════════════════════════════════════
     RESULTS SCREEN
  ════════════════════════════════════════════════════════ */
  if (isComplete) {
    const results = resultsData || JSON.parse(localStorage.getItem('enhanced_voice_results') || '{}');

    return (
      <div className="enhanced-voice-container">
        <div className="enhanced-bg"></div>
        <div className="enhanced-overlay"></div>

        <div className="enhanced-nav">
          <button className="enhanced-back-btn" onClick={handleBack}>←</button>
          <div className="enhanced-title">🎙️ Reading Results</div>
        </div>

        <div className="enhanced-results" style={{ overflowY: 'auto', flex: 1 }}>
          <div className="results-icon">🎉</div>
          <h1>Wonderful Reading!</h1>

          {/* Save status */}
          {saving && (
            <div style={{ textAlign: 'center', color: '#3D5A4C', fontWeight: 600, marginBottom: '.75rem' }}>
              💾 Saving your results…
            </div>
          )}
          {savedId && !saving && (
            <div style={{ textAlign: 'center', color: '#4CAF50', fontWeight: 600, marginBottom: '.75rem' }}>
              ✓ Results saved to your account!
            </div>
          )}
          {saveError && !saving && (
            <div style={{ textAlign: 'center', color: '#FF9800', fontSize: '.85rem', marginBottom: '.75rem' }}>
              ⚠️ {saveError}
            </div>
          )}

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
            <button className="btn-try-again" onClick={resetAssessment}>🔄 Read Again</button>
            <button className="btn-home"      onClick={handleBack}>🏠 Back to Adventure</button>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     READING SCREEN
  ════════════════════════════════════════════════════════ */
  return (
    <div className="enhanced-voice-container reading-active">
      <div className="enhanced-bg"></div>
      <div className="enhanced-overlay"></div>

      {/* Fixed Header */}
      <div className="enhanced-nav reading-nav">
        <button className="enhanced-back-btn" onClick={handleBack}>←</button>
        <div className="enhanced-title">🎙️ Reading Time</div>
        <div className={`timer-badge ${showTimeWarning && timeRemaining <= 30 ? 'warning' : ''}`}>
          ⏱️ {formatTime(timeRemaining)}
        </div>
        <div className="progress-badge">
          {Object.keys(wordResults).filter(i => wordResults[i]?.correct).length} / {allWords.length}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="enhanced-reading-content" style={{ overflowY: 'auto', flex: 1 }}>
        <div className="current-word-section">
          <div className="enhanced-word-card">
            <div className="enhanced-word-text">{allWords[currentWordIndex]}</div>
            {!wordResults[currentWordIndex] && (
              <div className="word-timer">⏰ {timeRemaining}s</div>
            )}
          </div>

          {/* Mic status */}
          <div className="mic-status-section">
            <div className={`mic-indicator ${isListening ? 'listening' : ''}`}>
              {isListening ? (
                <><span className="mic-wave">🎙️</span><span className="mic-text">Listening... Keep reading! I'm following along</span></>
              ) : (
                <><span className="mic-wave">⏸️</span><span className="mic-text">Paused - Click Resume to continue reading</span></>
              )}
            </div>
            {transcript && (
              <div className="transcript-box">
                <span className="transcript-label">I hear:</span>
                <span className="transcript-text">"{transcript}"</span>
              </div>
            )}
          </div>

          {/* Full passage */}
          <div className="full-passage">
            <h3>The Teacher</h3>
            <div className="passage-words">
              {allWords.map((word, idx) => {
                let cls = 'passage-word';
                if (idx === currentWordIndex && !wordResults[idx]) cls += ' current';
                if (wordResults[idx]) cls += wordResults[idx].correct ? ' done-correct' : ' done-wrong';
                return (
                  <span key={idx} className={cls} ref={idx === currentWordIndex ? currentWordRef : null}>
                    {word}{' '}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Controls */}
          <div className="word-controls">
            {!isListening ? (
              <button className="word-ctrl-btn resume-word" onClick={resumeListening}>▶️ Resume</button>
            ) : (
              <button className="word-ctrl-btn pause-word" onClick={pauseListening}>⏸️ Pause</button>
            )}
            <button className="word-ctrl-btn finish-word" onClick={finishAssessment}>🏁 Finish</button>
          </div>
        </div>
      </div>
    </div>
  );
}