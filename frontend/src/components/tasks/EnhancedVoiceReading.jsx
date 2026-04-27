// frontend/src/components/tasks/EnhancedVoiceReading.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./EnhancedVoiceReading.css";
import { getChildInfo, getUserInfo, getCurrentChildSessionId } from "../../utils/childSession";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const TASK2_URL = `${API}/api/assessments/task2/submit`;

const READING_PASSAGE = {
  title: "The Teacher",
  text: `While the children were sitting around their father, talking together, one of them asked: "Is there any similarity between you and the teacher, Father?" The father replied, "Yes." "The teacher, my son, takes care of your mind and dedicates his life to educating and guiding you. A polite student obeys teachers just as he obeys his parents and respects them. All teachers make great efforts to raise and educate students. Therefore, students should listen to their advice and recognize the teacher's value, just as they recognize the value of their parents." Then the father turned to his children and said, "Do not neglect your duties. Be kind to those who are kind to you. Work hard for your future and for the service of your country."`,
};

const allWords = READING_PASSAGE.text.split(/\s+/).filter(w => w.length > 0);

const cleanText = t => t.toLowerCase().replace(/[.,!?;:'"()\[\]{}]/g, '').replace(/\s+/g, ' ').trim();

const isDyslexiaSwap = (spoken, expected) => {
  const swaps = { 'b':'d','d':'b','p':'q','q':'p','was':'saw','saw':'was','their':'there','there':'their','from':'form','form':'from','no':'on','on':'no' };
  const cs = cleanText(spoken); const ce = cleanText(expected);
  if (swaps[cs] === ce || swaps[ce] === cs) return true;
  if (cs.length === ce.length && cs.length <= 5) {
    let diff = 0;
    for (let i = 0; i < cs.length; i++) {
      if (cs[i] !== ce[i]) { const pair = cs[i]+ce[i]; if (pair==='bd'||pair==='db'||pair==='pq'||pair==='qp') diff++; else return false; }
    }
    return diff <= 2;
  }
  return false;
};

const calcSimilarity = (spoken, expected) => {
  const cs = cleanText(spoken); const ce = cleanText(expected);
  if (cs === ce) return 1.0;
  if (isDyslexiaSwap(spoken, expected)) return 0.85;
  if (cs.includes(ce) || ce.includes(cs)) return 0.8;
  let m = 0; const min = Math.min(cs.length, ce.length);
  for (let i = 0; i < min; i++) { if (cs[i] === ce[i]) m++; }
  return m / Math.max(cs.length, ce.length);
};

const markQuestCompleted = () => {
  const q = JSON.parse(localStorage.getItem('current_quest') || '{}');
  if (!q.id) return;
  const saved = JSON.parse(localStorage.getItem('reading_adventure_progress') || '[]');
  if (!saved.includes(q.id)) {
    localStorage.setItem('reading_adventure_progress', JSON.stringify([...saved, q.id]));
    console.log('✅ Task2 quest completed');
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

  const recognitionRef      = useRef(null);
  const currentWordRef      = useRef(null);
  const timerIntervalRef    = useRef(null);
  const isPausedRef         = useRef(false);
  const isCompleteRef       = useRef(false);
  const isTimeUpRef         = useRef(false);
  const isListeningRef      = useRef(false);
  const startTimeRef        = useRef(null);
  const pausedAtRef         = useRef(null);
  const totalPausedMsRef    = useRef(0);
  const isMountedRef        = useRef(true);
  const currentWordIndexRef = useRef(0);
  const wordResultsRef      = useRef({});
  const errorWordsRef       = useRef([]);
  const finalTranscriptRef  = useRef('');
  const lastProcessedRef    = useRef(0);
  const timeRemainingRef    = useRef(180);
  const markedCompletedRef  = useRef(false);

  useEffect(() => { currentWordIndexRef.current = currentWordIndex; }, [currentWordIndex]);
  useEffect(() => { wordResultsRef.current      = wordResults;      }, [wordResults]);
  useEffect(() => { errorWordsRef.current       = errorWords;       }, [errorWords]);
  useEffect(() => { isCompleteRef.current       = isComplete;       }, [isComplete]);
  useEffect(() => { isTimeUpRef.current         = isTimeUp;         }, [isTimeUp]);
  useEffect(() => { timeRemainingRef.current    = timeRemaining;    }, [timeRemaining]);

  useEffect(() => {
    isMountedRef.current = true;
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) { setRecognitionSupported(false); return; }
    startListening();
    return () => { isMountedRef.current = false; stopRecognition(); stopTimer(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ─── Build payload for task2_results (matches schema) ───
  const buildPayload = useCallback((resultsObj, isPartial = false) => {
    const childSessionId = getCurrentChildSessionId();
    if (!childSessionId) {
      throw new Error('No active child session ID found');
    }

    const user = getUserInfo();
    const childInfo = getChildInfo();

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

  // ─── Save results to database (always POST – ON DUPLICATE KEY UPDATE handles upsert) ───
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
      if (res.data?.resultId) {
        console.log('✅ Task2 saved, id:', res.data.resultId);
      }
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

  // Process speech – same as before
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
    if (pos >= allWords.length) finishAssessmentInternal();
  }, []);

  const buildRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US'; rec.maxAlternatives = 1;
    let acc = finalTranscriptRef.current;
    rec.onstart = () => { if(!isMountedRef.current) return; isListeningRef.current=true; setIsListening(true); setTranscript(''); };
    rec.onend   = () => {
      if(!isMountedRef.current) return;
      isListeningRef.current=false; setIsListening(false);
      if (!isPausedRef.current && !isCompleteRef.current && !isTimeUpRef.current && timeRemainingRef.current>0 && currentWordIndexRef.current<allWords.length) {
        setTimeout(() => { if(isMountedRef.current&&!isPausedRef.current&&!isCompleteRef.current&&!isTimeUpRef.current&&!isListeningRef.current) { try{rec.start();}catch(_){} } }, 300);
      }
    };
    rec.onerror = e => { if(e.error==='not-allowed'&&isMountedRef.current) setMicAllowed(false); };
    rec.onresult = e => {
      if (isPausedRef.current||isCompleteRef.current||isTimeUpRef.current) return;
      let interim='', finalSeg='';
      for (let i=e.resultIndex; i<e.results.length; i++) {
        const t=e.results[i][0].transcript;
        if(e.results[i].isFinal) finalSeg+=t; else interim+=t;
      }
      if (finalSeg) { acc+=' '+finalSeg; finalTranscriptRef.current=acc; processSpeech(acc); }
      if (isMountedRef.current) setTranscript(interim);
    };
    return rec;
  }, [processSpeech]);

  const startListening = useCallback(async () => {
    if (!isMountedRef.current) return;
    try { const s=await navigator.mediaDevices.getUserMedia({audio:true}); s.getTracks().forEach(t=>t.stop()); }
    catch { if(isMountedRef.current) setMicAllowed(false); return; }
    isPausedRef.current = false;
    if (!startTimeRef.current) startTimeRef.current = Date.now();
    const rec = buildRecognition();
    if (!rec || !isMountedRef.current) return;
    stopRecognition();
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

  const resetAssessment = useCallback(() => {
    stopRecognition(); stopTimer();
    isPausedRef.current=false; isCompleteRef.current=false; isTimeUpRef.current=false;
    isListeningRef.current=false; startTimeRef.current=null; pausedAtRef.current=null;
    totalPausedMsRef.current=0; finalTranscriptRef.current=''; lastProcessedRef.current=0;
    currentWordIndexRef.current=0; wordResultsRef.current={}; errorWordsRef.current=[];
    timeRemainingRef.current=180; markedCompletedRef.current=false;

    setCurrentWordIndex(0); setWordResults({}); setErrorWords([]); setIsComplete(false);
    setIsTimeUp(false); setTranscript(''); setTimeRemaining(180); setShowTimeWarning(false);
    setSaveError(''); setResultsData(null); setIsListening(false);
    setTimeout(() => { if(isMountedRef.current) startListening(); }, 200);
  }, [startListening]);

  const handleBack = useCallback(() => { stopRecognition(); stopTimer(); navigate('/adventure'); }, [navigate]);

  // Results screen (unchanged)
  // ─── RESULTS SCREEN with TaskOne‑style header ─────────────────
if (isComplete) {
  const r   = resultsData || JSON.parse(localStorage.getItem('enhanced_voice_results') || '{}');
  const pct = r.percentage || 0;
  return (
    <div className="task-one-container results-screen">
      <div className="task-bg"/><div className="dark-overlay"/>

      {/* TaskOne‑style header bar (instead of old .task-nav) */}
      <div className="assessment-header-bar">
        <div className="header-left">
          <button className="nav-back-btn" onClick={handleBack}>
            ← Back
          </button>
          <span className="category-name">🎙️ Story Reader</span>
        </div>
        <div className="header-center">
          <div className="progress-display">✨ Results ✨</div>
        </div>
        <div className="header-right">
          <div className="timer" style={{ background: '#3D5A4C' }}>
            ✓ Completed
          </div>
        </div>
      </div>

      <div className="results-header-area">
        <div className="trophy-icon">🎉</div>
        <h1>Wonderful Reading!</h1>
        <p>You read the passage — great effort! 🌟</p>
      </div>

      {saving && <div style={{textAlign:'center',color:'#3D5A4C',fontWeight:600,marginBottom:'.5rem',position:'relative',zIndex:10}}>💾 Saving…</div>}
      {saveError && !saving && <div style={{textAlign:'center',color:'#f44336',fontWeight:600,marginBottom:'.5rem',position:'relative',zIndex:10}}>⚠️ {saveError}</div>}

      <div className="final-score-area">
        <div className="score-circle-big">
          <span className="score-number-big">{r.correct_words}/{r.total_words}</span>
          <span className="score-label-small">Words Correct</span>
        </div>
        <div className="score-grade-area">
          <div className="grade-circle-big" style={{background:pct>=80?'#7fb685':pct>=60?'#ff9a76':'#a8d0db'}}>
            {pct}%
          </div>
          <p className="grade-label-text">
            {pct>=80?'🌟 Excellent!':pct>=60?'👍 Good Job!':'💪 Keep Practicing!'}
          </p>
        </div>
      </div>

      <div className="category-breakdown-area">
        <h2>📊 Your Reading Performance</h2>
        <div className="breakdown-grid-area">
          <div className="breakdown-card-item">
            <div className="breakdown-icon-item">📖</div>
            <h3>Words Read</h3>
            <div className="breakdown-score-item">{r.correct_words}/{r.total_words}</div>
          </div>
          <div className="breakdown-card-item">
            <div className="breakdown-icon-item">📝</div>
            <h3>Let's Practice</h3>
            <div className="breakdown-score-item">{r.errors}</div>
          </div>
          <div className="breakdown-card-item">
            <div className="breakdown-icon-item">⭐</div>
            <h3>Your Level</h3>
            <div className="breakdown-score-item" style={{color:r.fluency_color}}>{r.fluency_level}</div>
          </div>
        </div>
      </div>

      <div className="results-action-buttons">
        <button className="btn-home-page" onClick={handleBack}>🏠 Back to Adventure</button>
      </div>
    </div>
  );
}

  // ─── Main reading screen with TaskOne‑style header bar ───
  const totalWords = allWords.length;
  const completedWords = currentWordIndex; // number of words processed (read or attempted)
  const progressPercent = totalWords ? (completedWords / totalWords) * 100 : 0;

  return (
    <div className="enhanced-voice-container reading-active">
      <div className="enhanced-bg"/><div className="enhanced-overlay"/>

      {/* NEW HEADER BAR – exactly like Task One */}
      <div className="assessment-header-bar">
        <div className="header-left">
          <button className="btn-pause" onClick={isListening ? pauseListening : resumeListening}>
            {isListening ? "⏸️ Pause" : "▶️ Resume"}
          </button>
          <span className="category-name">🎙️ Story Reader</span>
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

      {/* Progress bar (optional, matches TaskOne) */}
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

          {saving && <div style={{textAlign:'center',color:'#3D5A4C',fontWeight:600,fontSize:'0.85rem',marginBottom:'0.5rem'}}>💾 Saving…</div>}

          <div className="mic-status-section">
            <div className={`mic-indicator ${isListening?'listening':''}`}>
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
                return <span key={idx} className={cls} ref={idx===currentWordIndex?currentWordRef:null}>{word} </span>;
              })}
            </div>
          </div>

          {/* BIG FINISH BUTTON – styled like TaskOne's "CHECK WORD" button */}
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