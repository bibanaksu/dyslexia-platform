// frontend/src/components/tasks/EnhancedVoiceReading.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./EnhancedVoiceReading.css";
import { getChildInfo, getUserInfo, getCurrentChildSessionId } from "../../utils/childSession";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const TASK2_URL = `${API}/api/assessments/task2/submit`;

// ===== READING PASSAGE =====
const READING_PASSAGE = {
  title: "Lina's Morning",
  text: `Lina wakes up in the morning. She eats bread and drinks milk then goes outside to play with her friend Sara in the yard. They run, laugh, and play hide and seek near the trees. Lina finds Sara and they are very happy. After playing, they sit under a tree and rest together. 

`,
};

const allWords = READING_PASSAGE.text.split(/\s+/).filter(w => w.length > 0);

const cleanText = t => t.toLowerCase().replace(/[.,!?;:'"()\[\]{}]/g, '').replace(/\s+/g, ' ').trim();

// ─────────────────────────────────────────────────────────────
// 🔥 IMPROVED SIMILARITY FUNCTION (Levenshtein distance)
// ─────────────────────────────────────────────────────────────
const levenshteinDistance = (a, b) => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const isDyslexiaSwap = (cleanSpoken, cleanExpected) => {
  const swaps = { 'b':'d','d':'b','p':'q','q':'p','was':'saw','saw':'was','their':'there','there':'their','from':'form','form':'from','no':'on','on':'no' };
  if (swaps[cleanSpoken] === cleanExpected || swaps[cleanExpected] === cleanSpoken) return true;
  if (cleanSpoken.length === cleanExpected.length && cleanSpoken.length <= 5) {
    let diff = 0;
    for (let i = 0; i < cleanSpoken.length; i++) {
      if (cleanSpoken[i] !== cleanExpected[i]) {
        const pair = cleanSpoken[i] + cleanExpected[i];
        if (pair === 'bd' || pair === 'db' || pair === 'pq' || pair === 'qp') diff++;
        else return false;
      }
    }
    return diff <= 2;
  }
  return false;
};

const calcSimilarity = (spoken, expected) => {
  const cs = cleanText(spoken);
  const ce = cleanText(expected);
  if (!cs || !ce) return 0;
  if (cs === ce) return 1.0;
  if (isDyslexiaSwap(cs, ce)) return 0.9; // dyslexia‑friendly boost

  const distance = levenshteinDistance(cs, ce);
  const maxLength = Math.max(cs.length, ce.length);
  return 1 - distance / maxLength;
};

const markQuestCompleted = () => {
  const q = JSON.parse(localStorage.getItem('current_quest') || '{}');
  if (!q.id) return;
  const saved = JSON.parse(localStorage.getItem('reading_adventure_progress') || '[]');
  if (!saved.includes(q.id)) {
    localStorage.setItem('reading_adventure_progress', JSON.stringify([...saved, q.id]));
  }
};

export default function EnhancedVoiceReading() {
  const navigate = useNavigate();

  const [isListening,          setIsListening]          = useState(false);
  const [currentWordIndex,     setCurrentWordIndex]     = useState(0);
  const [wordResults,          setWordResults]          = useState({});
  const [errorWords,           setErrorWords]           = useState([]);
  const [isComplete,           setIsComplete]           = useState(false);
  const [transcript,           setTranscript]           = useState('');
  const [micAllowed,           setMicAllowed]           = useState(true);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [timeRemaining,        setTimeRemaining]        = useState(180);
  const [showTimeWarning,      setShowTimeWarning]      = useState(false);
  const [isTimeUp,             setIsTimeUp]             = useState(false);
  const [saving,               setSaving]               = useState(false);
  const [resultsData,          setResultsData]          = useState(null);
  const [saveError,            setSaveError]            = useState('');
  const [hasStarted,           setHasStarted]           = useState(false);

  const recognitionRef           = useRef(null);
  const currentWordRef           = useRef(null);
  const timerIntervalRef         = useRef(null);
  const isPausedRef              = useRef(false);
  const isCompleteRef            = useRef(false);
  const isTimeUpRef              = useRef(false);
  const isListeningRef           = useRef(false);
  const startTimeRef             = useRef(null);
  const pausedAtRef              = useRef(null);
  const totalPausedMsRef         = useRef(0);
  const isMountedRef             = useRef(true);
  const currentWordIndexRef      = useRef(0);
  const wordResultsRef           = useRef({});
  const errorWordsRef            = useRef([]);
  const finalTranscriptRef       = useRef('');
  const lastProcessedRef         = useRef(0);
  const timeRemainingRef         = useRef(180);
  const markedCompletedRef       = useRef(false);
  const buildRecognitionRef      = useRef(null);
  const finishAssessmentInternalRef = useRef(null);

  useEffect(() => { currentWordIndexRef.current = currentWordIndex; }, [currentWordIndex]);
  useEffect(() => { wordResultsRef.current      = wordResults;      }, [wordResults]);
  useEffect(() => { errorWordsRef.current       = errorWords;       }, [errorWords]);
  useEffect(() => { isCompleteRef.current       = isComplete;       }, [isComplete]);
  useEffect(() => { isTimeUpRef.current         = isTimeUp;         }, [isTimeUp]);
  useEffect(() => { timeRemainingRef.current    = timeRemaining;    }, [timeRemaining]);

  useEffect(() => {
    isMountedRef.current = true;
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      setRecognitionSupported(false);
    }
    return () => { isMountedRef.current = false; stopRecognition(); stopTimer(); };
  }, []);

  useEffect(() => {
    if (currentWordRef.current) currentWordRef.current.scrollIntoView({ behavior:'smooth', block:'center' });
  }, [currentWordIndex]);

  const stopRecognition = () => {
    if (recognitionRef.current) { try { recognitionRef.current.onend = null; recognitionRef.current.stop(); } catch(_){} recognitionRef.current = null; }
  };
  const stopTimer = () => { if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; } };

  const startTimer = () => {
    stopTimer();
    timerIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current || isPausedRef.current || isCompleteRef.current || isTimeUpRef.current) return;
      setTimeRemaining(prev => {
        const next = prev - 1;
        timeRemainingRef.current = next;
        if (next === 30) setShowTimeWarning(true);
        if (next <= 0) { stopTimer(); isTimeUpRef.current = true; setIsTimeUp(true); stopRecognition(); if(isMountedRef.current) finishAssessmentInternal(); return 0; }
        return next;
      });
    }, 1000);
  };

  const formatTime = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  const buildPayload = useCallback((resultsObj, isPartial = false) => {
    const childSessionId = getCurrentChildSessionId();
    if (!childSessionId) throw new Error('No active child session ID found');
    const user = getUserInfo();
    const correctCount = Object.values(resultsObj.wordResults || wordResultsRef.current).filter(r => r?.correct).length;
    const totalWordsRead = Object.keys(resultsObj.wordResults || wordResultsRef.current).length;
    const incorrectCount = totalWordsRead - correctCount;
    const elapsed = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current - totalPausedMsRef.current) / 1000) : 0;
    const percentage = totalWordsRead > 0 ? Math.round((correctCount / totalWordsRead) * 100) : 0;
    let performanceLevel = 'Building';
    if (percentage >= 95) performanceLevel = 'Advanced';
    else if (percentage >= 85) performanceLevel = 'Proficient';
    else if (percentage >= 70) performanceLevel = 'Basic';
    const payload = {
      child_session_id:   parseInt(childSessionId, 10),
      child_id:           user?.childId ? parseInt(user.childId, 10) : null,
      total_words:        totalWordsRead,
      correct_count:      correctCount,
      incorrect_count:    incorrectCount,
      timeout_count:      0,
      percentage:         percentage,
      performance_level:  performanceLevel,
      total_time_seconds: elapsed,
      avg_time_per_word:  totalWordsRead > 0 ? Math.round(elapsed / totalWordsRead) : 0,
      word_details:       JSON.stringify(resultsObj.error_details || errorWordsRef.current),
    };
    return payload;
  }, []);

  const saveResultsToDB = useCallback(async (results, isPartial = false) => {
    if (!isMountedRef.current) return;
    setSaving(true); setSaveError('');
    try {
      const payload = buildPayload(results, isPartial);
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await axios.post(TASK2_URL, payload, { headers });
      if (res.data?.resultId) console.log('✅ Task2 saved, id:', res.data.resultId);
    } catch (err) {
      console.error('Task2 save error:', err);
      setSaveError('Network error – progress saved locally only.');
      if (isMountedRef.current) {
        localStorage.setItem('task2_results_backup', JSON.stringify({ ...results, savedAt: new Date().toISOString() }));
      }
    } finally {
      if (isMountedRef.current) setSaving(false);
    }
  }, [buildPayload]);

  const processSpeech = useCallback(newAccumulated => {
    if (isCompleteRef.current || isPausedRef.current || isTimeUpRef.current) return;
    const cleanFull   = cleanText(newAccumulated);
    const spokenWords = cleanFull.split(/\s+/).filter(Boolean);
    if (spokenWords.length <= lastProcessedRef.current) return;
    const newSlice  = spokenWords.slice(lastProcessedRef.current);
    const newMatches = [];
    let pos = currentWordIndexRef.current;
    for (const sw of newSlice) {
      if (pos >= allWords.length) break;
      if (wordResultsRef.current[pos]) { pos++; continue; }
      const sim = calcSimilarity(sw, allWords[pos]);
      newMatches.push({ index:pos, expected:allWords[pos], spoken:sw, correct:sim>=0.6, accuracy:Math.round(sim*100) });
      pos++;
    }
    lastProcessedRef.current = spokenWords.length;
    if (!newMatches.length) return;

    setWordResults(prev => {
      const upd = { ...prev };
      for (const m of newMatches) upd[m.index] = { correct:m.correct, spoken:m.spoken, similarity:m.accuracy/100, expected:m.expected, accuracy:m.accuracy };
      wordResultsRef.current = upd;
      return upd;
    });
    const newErrors = newMatches.filter(m => !m.correct).map(m => ({ index:m.index, expected:m.expected, spoken:m.spoken, similarity:m.accuracy }));
    if (newErrors.length) {
      setErrorWords(prev => { const upd = [...prev, ...newErrors]; errorWordsRef.current = upd; return upd; });
    }
    currentWordIndexRef.current = pos;
    setCurrentWordIndex(pos);
    if (pos >= allWords.length) finishAssessmentInternalRef.current?.();
  }, []);

  const buildRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US'; rec.maxAlternatives = 1;
    let acc = finalTranscriptRef.current;
    rec.onstart = () => { if(!isMountedRef.current) return; isListeningRef.current=true; setIsListening(true); setTranscript(''); };

    rec.onend = () => {
      if (!isMountedRef.current) return;
      isListeningRef.current = false; setIsListening(false);
      if (!isPausedRef.current && !isCompleteRef.current && !isTimeUpRef.current
          && timeRemainingRef.current > 0 && currentWordIndexRef.current < allWords.length) {
        setTimeout(() => {
          if (isMountedRef.current && !isPausedRef.current && !isCompleteRef.current
              && !isTimeUpRef.current && !isListeningRef.current) {
            const newRec = buildRecognitionRef.current?.();
            if (newRec && isMountedRef.current) {
              recognitionRef.current = newRec;
              try { newRec.start(); } catch (e) { console.error('SR restart failed:', e); }
            }
          }
        }, 300);
      }
    };

    rec.onerror = e => {
      if (!isMountedRef.current) return;
      if (e.error === 'not-allowed') { setMicAllowed(false); return; }
      if (['no-speech', 'audio-capture', 'network', 'aborted'].includes(e.error)) {
        isListeningRef.current = false;
        if (!isPausedRef.current && !isCompleteRef.current && !isTimeUpRef.current) {
          setTimeout(() => {
            if (isMountedRef.current && !isPausedRef.current && !isCompleteRef.current
                && !isTimeUpRef.current && !isListeningRef.current) {
              stopRecognition();
              const newRec = buildRecognitionRef.current?.();
              if (newRec && isMountedRef.current) {
                recognitionRef.current = newRec;
                try { newRec.start(); } catch (err) { console.error('SR error-restart failed:', err); }
              }
            }
          }, 500);
        }
      }
    };

    rec.onresult = e => {
      if (isPausedRef.current || isCompleteRef.current || isTimeUpRef.current) return;
      let interim = '', finalSeg = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalSeg += t; else interim += t;
      }
      if (finalSeg) {
        acc += ' ' + finalSeg;
        finalTranscriptRef.current = acc;
        processSpeech(acc);
      } else if (interim) {
        processSpeech(acc + ' ' + interim);
      }
      if (isMountedRef.current) setTranscript(interim || finalSeg);
    };
    return rec;
  }, [processSpeech]);

  buildRecognitionRef.current = buildRecognition;

  const startListening = useCallback(() => {
    if (!isMountedRef.current) return;
    isPausedRef.current = false;
    if (!startTimeRef.current) startTimeRef.current = Date.now();
    stopRecognition();
    const rec = buildRecognition();
    if (!rec || !isMountedRef.current) return;
    recognitionRef.current = rec;
    try { rec.start(); startTimer(); setMicAllowed(true); } catch(e) { console.error(e); }
  }, [buildRecognition]);

  const pauseListening = useCallback(async () => {
    isPausedRef.current = true;
    pausedAtRef.current = Date.now();
    stopRecognition(); stopTimer();
    setIsListening(false); isListeningRef.current = false;
    const elapsed = startTimeRef.current ? Math.round((Date.now()-startTimeRef.current-totalPausedMsRef.current)/1000) : 0;
    const cc = Object.values(wordResultsRef.current).filter(r=>r?.correct).length;
    await saveResultsToDB({ correctWords:cc, errors:errorWordsRef.current.length, time_used:elapsed, error_details:errorWordsRef.current, wordResults:wordResultsRef.current }, true);
  }, [saveResultsToDB]);

  const resumeListening = useCallback(() => {
    if (isCompleteRef.current||isTimeUpRef.current) return;
    if (pausedAtRef.current) { totalPausedMsRef.current += Date.now()-pausedAtRef.current; pausedAtRef.current=null; }
    startListening();
  }, [startListening]);

  const finishAssessmentInternal = useCallback(async () => {
    if (isCompleteRef.current) return;
    isCompleteRef.current = true;
    stopRecognition(); stopTimer();
    isListeningRef.current = false; setIsListening(false);

    const elapsed = startTimeRef.current ? Math.round((Date.now()-startTimeRef.current-totalPausedMsRef.current)/1000) : 0;
    const cc  = Object.values(wordResultsRef.current).filter(r=>r?.correct).length;
    const pct = allWords.length > 0 ? Math.round((cc/allWords.length)*100) : 0;

    let fluency='Building', fColor='#f44336', rec='💪 You tried your best — that is what matters!';
    if(pct>=85){fluency='Excellent';fColor='#4CAF50';rec='🎉 Amazing reading! You are a superstar!';}
    else if(pct>=70){fluency='Good';fColor='#8BC34A';rec='👍 Great job! A few words to practice and you will be perfect!';}
    else if(pct>=50){fluency='Developing';fColor='#FF9800';rec='🌱 You are growing every day! Keep practicing!';}

    const results = {
      total_words: allWords.length,
      correct_words: cc,
      errors: errorWordsRef.current.length,
      percentage: pct,
      fluency_level: fluency,
      fluency_color: fColor,
      recommendation: rec,
      error_details: errorWordsRef.current,
      time_used: elapsed,
      finishedEarly: pct===100 || isTimeUpRef.current===false,
      wordResults: wordResultsRef.current,
    };
    localStorage.setItem('enhanced_voice_results', JSON.stringify(results));
    if (!markedCompletedRef.current) { markQuestCompleted(); markedCompletedRef.current=true; }
    if (isMountedRef.current) { setResultsData(results); setIsComplete(true); }
    await saveResultsToDB(results, false);
  }, [saveResultsToDB]);

  const finishAssessment = useCallback(() => finishAssessmentInternal(), [finishAssessmentInternal]);
  finishAssessmentInternalRef.current = finishAssessmentInternal;

  const resetAssessment = useCallback(() => {
    stopRecognition(); stopTimer();
    isPausedRef.current=false; isCompleteRef.current=false; isTimeUpRef.current=false;
    isListeningRef.current=false; startTimeRef.current=null; pausedAtRef.current=null;
    totalPausedMsRef.current=0; finalTranscriptRef.current=''; lastProcessedRef.current=0;
    currentWordIndexRef.current=0; wordResultsRef.current={}; errorWordsRef.current=[];
    timeRemainingRef.current=180; markedCompletedRef.current=false;

    setCurrentWordIndex(0); setWordResults({}); setErrorWords([]); setIsComplete(false);
    setIsTimeUp(false); setTranscript(''); setTimeRemaining(180); setShowTimeWarning(false);
    setSaveError(''); setResultsData(null); setIsListening(false); setHasStarted(false);
  }, []);

  const handleBack = useCallback(() => { stopRecognition(); stopTimer(); navigate('/adventure'); }, [navigate]);

  const handleStart = useCallback(async () => {
    setHasStarted(true);
    await startListening();
  }, [startListening]);

  // ─────────────────── START SCREEN ───────────────────
  if (!hasStarted && !isComplete) {
    return (
      <div className="enhanced-voice-container reading-active">
        <div className="enhanced-bg" />
        <div className="enhanced-overlay" />

        <div className="assessment-header-bar">
          <div className="header-left">
            <div className="task-logo-icon">DS</div>
            <span className="category-name">Story Reader</span>
          </div>
          <div className="header-center" />
          <div className="header-right" />
        </div>

        <div className="enhanced-reading-content" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
          <div className="enhanced-word-card" style={{ maxWidth: '450px', textAlign: 'center' }}>
            <div className="enhanced-word-text" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
              📖 Ready to Read?
            </div>
            <p style={{ marginBottom: '1rem', color: '#3D5A4C' }}>
              You will read the passage aloud. Click the button below and allow microphone access.
            </p>
            <button
              onClick={handleStart}
              style={{
                background: '#3D5A4C',
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '3rem',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              🎙️ Start Reading
            </button>
            {!recognitionSupported && (
              <p style={{ color: 'red', marginTop: '1rem' }}>
                Your browser does not support speech recognition. Please use Chrome, Edge, or Safari.
              </p>
            )}
            {!micAllowed && recognitionSupported && (
              <p style={{ color: '#D64545', marginTop: '1rem' }}>
                Microphone access is blocked. Please allow microphone permissions and try again.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────── RESULTS SCREEN ───────────────────
  if (isComplete) {
    const r = resultsData || JSON.parse(localStorage.getItem('enhanced_voice_results') || '{}');
    const pct = r.percentage || 0;
    return (
      <div className="enhanced-voice-container results-screen">
        <div className="task-bg" />
        <div className="dark-overlay" />
        <div className="task-brand">
          <div className="task-logo-icon">DS</div>
          <span className="task-logo-text">Dyslexia Support</span>
        </div>
        <div className="results-header-area">
          <div className="trophy-icon">🏆</div>
          <h1>Reading Complete!</h1>
          <p>You read the story with fluency</p>
        </div>
        <div className="final-score-area">
          <div className="score-circle-big">
            <span className="score-number-big">{r.correct_words}/{r.total_words}</span>
            <span className="score-label-small">Correct Words</span>
          </div>
          <div className="grade-circle-big" style={{ background: pct >= 80 ? '#3D5A4C' : pct >= 60 ? '#FFB84D' : '#D64545' }}>
            {pct}%
          </div>
        </div>

        <div className="category-breakdown-area">
          <h2>Your Performance</h2>
          <div className="breakdown-grid-area">
            <div className="breakdown-card-item">
              <div className="breakdown-icon-item">✅</div>
              <h3>Correct Words</h3>
              <div className="breakdown-score-item">{r.correct_words}/{r.total_words}</div>
              <div className="breakdown-bar-item">
                <div className="bar-fill-item" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="breakdown-card-item">
              <div className="breakdown-icon-item">📖</div>
              <h3>Total Words</h3>
              <div className="breakdown-score-item">{r.total_words}</div>
            </div>
            <div className="breakdown-card-item">
              <div className="breakdown-icon-item">🎯</div>
              <h3>Accuracy</h3>
              <div className="breakdown-score-item">{pct}%</div>
              <div className="breakdown-bar-item">
                <div className="bar-fill-item" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="results-action-buttons">
          <button className="btn-home-page" onClick={handleBack}>🏠 Back to Adventure</button>
        </div>
      </div>
    );
  }

  // ─────────────────── MAIN READING SCREEN ───────────────────
  const totalWords = allWords.length;
  const completedWords = currentWordIndex;
  const progressPercent = totalWords ? (completedWords / totalWords) * 100 : 0;

  return (
    <div className="enhanced-voice-container reading-active">
      <div className="enhanced-bg" />
      <div className="enhanced-overlay" />

      <div className="assessment-header-bar">
        <div className="header-left">
          <div className="task-logo-icon">DS</div>
          <button className="btn-pause" onClick={isListening ? pauseListening : resumeListening}>
            {isListening ? "⏸️ Pause" : "▶️ Resume"}
          </button>
          <span className="category-name">Story Reader</span>
        </div>
        <div className="header-center">
          <div className="progress-display">
            Word {completedWords} of {totalWords}
          </div>
        </div>
        <div className="header-right">
          <div className={`timer ${showTimeWarning ? 'warning' : ''}`}>
            {formatTime(timeRemaining)}
          </div>
        </div>
      </div>

      <div className="assessment-progress-bar">
        <div className="assessment-progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="enhanced-reading-content">
        <div className="current-word-section">
          <div className="enhanced-word-card">
            <div className="enhanced-word-text">
              {currentWordIndex < allWords.length ? allWords[currentWordIndex] : ''}
            </div>
          </div>

          {saving && <div style={{ textAlign: 'center', color: '#3D5A4C', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>💾 Saving…</div>}

          <div className="mic-status-section">
            <div className={`mic-indicator ${isListening ? 'listening' : ''}`}>
              {isListening ? <><span>🎙️</span><span className="mic-text"> Listening… Keep reading!</span></> : <><span>⏸️</span><span className="mic-text"> Paused — press Resume</span></>}
            </div>
            {transcript && (
              <div className="transcript-box">
                <span className="transcript-label">I hear:</span>
                <span className="transcript-text"> "{transcript}"</span>
              </div>
            )}
          </div>

          <div className="full-passage">
            <h3>{READING_PASSAGE.title}</h3>
            <div className="passage-words">
              {allWords.map((word, idx) => {
                let cls = 'passage-word';
                if (idx === currentWordIndex && !wordResults[idx]) cls += ' current';
                if (wordResults[idx]) cls += wordResults[idx].correct ? ' done-correct' : ' done-wrong';
                return <span key={idx} className={cls} ref={idx === currentWordIndex ? currentWordRef : null}>{word} </span>;
              })}
            </div>
          </div>

          <div className="big-action-button">
            <button className="big-finish-btn" onClick={finishAssessment}>
              🏁 Finish Reading
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}