// frontend/src/components/tasks/TaskThree.jsx
// FIXES:
//  1. Reads childFullName + sessionUUID — no more NULL/Guest User in DB
//  2. savedId pattern: POST once → PATCH on every save after
//  3. Navbar matches Task 1 style
//  4. Pause stays inside task, does NOT navigate away
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./TaskThree.css";
import { getChildInfo, getSessionUUID, getUserInfo, getGuestId } from "../../utils/childSession";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL  = `${API_BASE}/api`;

const PROGRESS_KEY = 'task3_progress';
const SAVED_ID_KEY = 'task3_saved_db_id';

const saveLocal   = (idx, results) => localStorage.setItem(PROGRESS_KEY, JSON.stringify({ currentIndex:idx, results, savedAt:Date.now() }));
const loadLocal   = () => { try { const r=localStorage.getItem(PROGRESS_KEY); return r?JSON.parse(r):null; } catch{return null;} };
const clearLocal  = () => localStorage.removeItem(PROGRESS_KEY);

const markQuestCompleted = () => {
  const q = JSON.parse(localStorage.getItem('current_quest')||'{}');
  if (!q.id) return;
  const saved = JSON.parse(localStorage.getItem('reading_adventure_progress')||'[]');
  if (!saved.includes(q.id)) localStorage.setItem('reading_adventure_progress', JSON.stringify([...saved, q.id]));
};

const playSound = isCorrect => {
  try {
    const c=new(window.AudioContext||window.webkitAudioContext)();
    const o=c.createOscillator(); const g=c.createGain();
    o.connect(g); g.connect(c.destination); o.type='sine';
    if(isCorrect){o.frequency.setValueAtTime(600,c.currentTime);o.frequency.exponentialRampToValueAtTime(800,c.currentTime+0.15);g.gain.setValueAtTime(0.15,c.currentTime);g.gain.exponentialRampToValueAtTime(0.01,c.currentTime+0.2);}
    else{o.frequency.setValueAtTime(400,c.currentTime);o.frequency.exponentialRampToValueAtTime(200,c.currentTime+0.1);g.gain.setValueAtTime(0.1,c.currentTime);g.gain.exponentialRampToValueAtTime(0.01,c.currentTime+0.15);}
    o.start(); o.stop(c.currentTime+0.2);
  } catch(e){}
};

const FALLBACK = [
  {id:1,exercise_number:1,group1:"T Z R",    group2:"T Z R",      is_same:true },
  {id:2,exercise_number:2,group1:"B L N",    group2:"B L N",      is_same:true },
  {id:3,exercise_number:3,group1:"S D Z",    group2:"Z D S",      is_same:false},
  {id:4,exercise_number:4,group1:"F Q R S",  group2:"SH S Q F",   is_same:false},
  {id:5,exercise_number:5,group1:"F Q",      group2:"F Q",        is_same:true },
  {id:6,exercise_number:6,group1:"B Y T",    group2:"B Y T",      is_same:true },
  {id:7,exercise_number:7,group1:"A B M Y",  group2:"A B M A",    is_same:false},
  {id:8,exercise_number:8,group1:"H KH J",   group2:"H KH J",     is_same:true },
  {id:9,exercise_number:9,group1:"Y R W",    group2:"Y S J D",    is_same:false},
  {id:10,exercise_number:10,group1:"D D D D",group2:"D D D D",    is_same:true },
  {id:11,exercise_number:11,group1:"A GH F", group2:"A GH F",     is_same:true },
  {id:12,exercise_number:12,group1:"Q S S",  group2:"Q S S",      is_same:true },
  {id:13,exercise_number:13,group1:"W Z R",  group2:"R R Z W",    is_same:false},
  {id:14,exercise_number:14,group1:"TH DH H",group2:"TH DH H",    is_same:true },
  {id:15,exercise_number:15,group1:"S SH S Z",group2:"S SH S Z",  is_same:true },
  {id:16,exercise_number:16,group1:"A L SH J R T",group2:"A L SH J R T",is_same:true},
  {id:17,exercise_number:17,group1:"TH F Q KH",group2:"Q F TH KH",is_same:false},
  {id:18,exercise_number:18,group1:"Y I L A", group2:"I Y L A",   is_same:false},
  {id:19,exercise_number:19,group1:"T TH B",  group2:"T TH B",    is_same:true },
  {id:20,exercise_number:20,group1:"P R B",   group2:"P R B",     is_same:true },
];

export default function TaskThree() {
  const navigate = useNavigate();
  const [comparisons,      setComparisons]      = useState([]);
  const [currentIndex,     setCurrentIndex]     = useState(0);
  const [results,          setResults]          = useState([]);
  const [isComplete,       setIsComplete]       = useState(false);
  const [isLoading,        setIsLoading]        = useState(true);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [pendingProgress,  setPendingProgress]  = useState(null);
  const [timeRemaining,    setTimeRemaining]    = useState(15);
  const [showTimeWarning,  setShowTimeWarning]  = useState(false);
  const [isPaused,         setIsPaused]         = useState(false);
  const [feedback,         setFeedback]         = useState(null);
  const [isSaving,         setIsSaving]         = useState(false);
  const [resultsData,      setResultsData]      = useState(null);

  const timerRef      = useRef(null);
  const fbTimeoutRef  = useRef(null);
  const startTimeRef  = useRef(Date.now());
  const savedTimeRef  = useRef(15);
  // ── FIX: single DB row per session ──
  const savedIdRef    = useRef(localStorage.getItem(SAVED_ID_KEY) || null);

  useEffect(() => { fetchComparisons(); }, []);

  const fetchComparisons = async () => {
    try {
      const r = await axios.get(`${API_URL}/task3/exercises`);
      const loaded = (r.data.success && r.data.exercises?.length) ? r.data.exercises : FALLBACK;
      setComparisons(loaded);
      checkResume(loaded);
    } catch {
      setComparisons(FALLBACK);
      checkResume(FALLBACK);
    } finally { setIsLoading(false); }
  };

  const checkResume = loaded => {
    const p = loadLocal();
    if (p && p.currentIndex > 0 && p.currentIndex < loaded.length) { setPendingProgress(p); setShowResumePrompt(true); }
  };

  const handleResumeSaved = () => { if(!pendingProgress) return; setCurrentIndex(pendingProgress.currentIndex); setResults(pendingProgress.results); setShowResumePrompt(false); setPendingProgress(null); };
  const handleStartFresh  = () => { clearLocal(); setShowResumePrompt(false); setPendingProgress(null); setCurrentIndex(0); setResults([]); };

  useEffect(() => {
    if (comparisons.length>0 && currentIndex<comparisons.length && !isComplete && !isPaused && !showResumePrompt) startTimer();
    return () => { if(timerRef.current) clearInterval(timerRef.current); };
  }, [currentIndex, comparisons, isComplete, showResumePrompt, isPaused]);

  const startTimer = () => {
    if(timerRef.current) clearInterval(timerRef.current);
    savedTimeRef.current=15; setTimeRemaining(15); setShowTimeWarning(false);
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if(prev<=1){ clearInterval(timerRef.current); handleTimeout(); return 0; }
        if(prev===6) setShowTimeWarning(true);
        return prev-1;
      });
    }, 1000);
  };

  const resumeTimer = from => {
    if(timerRef.current) clearInterval(timerRef.current);
    setShowTimeWarning(from<=5);
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if(prev<=1){ clearInterval(timerRef.current); handleTimeout(); return 0; }
        if(prev===6) setShowTimeWarning(true);
        return prev-1;
      });
    }, 1000);
  };

  const handleTimeout = () => {
    if(feedback||isPaused) return;
    const comp = comparisons[currentIndex];
    setFeedback('timeout'); playSound(false);
    const newResult = { comparison_number:comp.exercise_number||comp.id, group1:comp.group1, group2:comp.group2, expected_same:comp.is_same, user_answer:null, is_correct:false, is_timeout:true, time_taken:15-timeRemaining };
    const updated = [...results, newResult];
    setResults(updated); saveLocal(currentIndex+1, updated);
    fbTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
      if(currentIndex+1>=comparisons.length) finishAssessment(updated); else setCurrentIndex(p=>p+1);
    }, 1000);
  };

  const handleAnswer = userAnswer => {
    if(feedback||isPaused) return;
    const comp = comparisons[currentIndex];
    const isCorrect = (userAnswer==='same'&&comp.is_same)||(userAnswer==='different'&&!comp.is_same);
    if(timerRef.current) clearInterval(timerRef.current);
    setFeedback(isCorrect?'correct':'incorrect'); playSound(isCorrect);
    const newResult = { comparison_number:comp.exercise_number||comp.id, group1:comp.group1, group2:comp.group2, expected_same:comp.is_same, user_answer:userAnswer, is_correct:isCorrect, is_timeout:false, time_taken:15-timeRemaining };
    const updated = [...results, newResult];
    setResults(updated); saveLocal(currentIndex+1, updated);
    fbTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
      if(currentIndex+1>=comparisons.length) finishAssessment(updated); else setCurrentIndex(p=>p+1);
    }, 800);
  };

  // ── FIXED: buildPayload reads childFullName ──
  const buildPayload = (data, isPartial) => {
    const user      = getUserInfo();
    const childInfo = getChildInfo();
    const sessionUUID = getSessionUUID();
    return {
      sessionUUID,
      childName:          childInfo?.childFullName || childInfo?.childName || user?.name || 'Guest User',
      childGrade:         childInfo?.childGrade    || user?.childGrade     || 'Not Specified',
      childId:            user?.childId || null,
      parentId:           user?.role === 'parent' ? user.id : null,
      guestId:            getGuestId(),
      totalExercises:     data.total_comparisons,
      correctCount:       data.correct_count,
      incorrectCount:     data.incorrect_count,
      timeoutCount:       data.timeout_count,
      percentage:         data.percentage,
      performanceLevel:   data.performance_level,
      totalTimeSeconds:   data.total_time_seconds,
      avgTimePerExercise: data.avg_time_per_comparison,
      exerciseDetails:    JSON.stringify(data.comparison_details),
      isPartial:          isPartial ? 1 : 0,
    };
  };

  // ── FIXED: POST once → PATCH after ──
  const saveResultsToDB = async (data, isPartial = false) => {
    setIsSaving(true);
    const payload = buildPayload(data, isPartial);
    const token   = localStorage.getItem('token');
    const headers = { 'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{}) };
    try {
      let res;
      if (savedIdRef.current) {
        res = await axios.patch(`${API_URL}/task3/submit/${savedIdRef.current}`, payload, { headers });
      } else {
        res = await axios.post(`${API_URL}/task3/submit`, payload, { headers });
        if (res.data?.resultId) {
          savedIdRef.current = String(res.data.resultId);
          localStorage.setItem(SAVED_ID_KEY, savedIdRef.current);
        }
      }
      console.log('✅ Task3 saved, id:', savedIdRef.current);
    } catch(err) {
      console.error('Task3 save error:', err);
      localStorage.setItem('task3_results_backup', JSON.stringify({ ...payload, savedAt:new Date().toISOString() }));
    } finally { setIsSaving(false); }
  };

  const finishAssessment = async finalResults => {
    if(timerRef.current) clearInterval(timerRef.current);
    clearLocal();
    const totalTime = Math.floor((Date.now()-startTimeRef.current)/1000);
    const correct   = finalResults.filter(r=>r.is_correct).length;
    const incorrect = finalResults.filter(r=>!r.is_correct&&!r.is_timeout).length;
    const timeout   = finalResults.filter(r=>r.is_timeout).length;
    const pct       = Math.round((correct/comparisons.length)*100);
    let perf='Needs Practice';
    if(pct>=90)perf='Excellent! 🌟';else if(pct>=75)perf='Very Good! 👍';else if(pct>=60)perf='Good Start! 📖';else if(pct>=40)perf='Keep Going! 💪';

    const data = { total_comparisons:comparisons.length, correct_count:correct, incorrect_count:incorrect, timeout_count:timeout, percentage:pct, performance_level:perf, total_time_seconds:totalTime, avg_time_per_comparison:totalTime/comparisons.length, comparison_details:finalResults };
    setResultsData(data);
    localStorage.setItem('task3_results', JSON.stringify(data));
    if(pct>=50) markQuestCompleted();
    await saveResultsToDB(data, false);
    // Clear saved ID for fresh session next time
    localStorage.removeItem(SAVED_ID_KEY);
    savedIdRef.current = null;
    setIsComplete(true);
  };

  const handlePause = () => {
    if(isComplete) return;
    savedTimeRef.current = timeRemaining;
    setIsPaused(true);
    if(timerRef.current){ clearInterval(timerRef.current); timerRef.current=null; }
    saveLocal(currentIndex, results);
  };
  const handleResume = () => { if(isComplete) return; setIsPaused(false); resumeTimer(savedTimeRef.current); };
  const handleQuit   = () => { if(timerRef.current) clearInterval(timerRef.current); saveLocal(currentIndex, results); navigate('/adventure'); };
  const handleBack   = () => { if(timerRef.current) clearInterval(timerRef.current); navigate('/adventure'); };

  const formatTime = (seconds) => `${seconds}s`;

  // ── Loading ────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="task-three-container">
      <div className="task-three-bg"/><div className="dark-overlay"/>
      <div className="assessment-screen" style={{justifyContent:'center',alignItems:'center'}}>
        <div style={{background:'white',padding:'2rem',borderRadius:'2rem',textAlign:'center'}}><div style={{fontSize:'3rem',marginBottom:'1rem'}}>🔍</div><h2 style={{color:'#3D5A4C'}}>Loading…</h2></div>
      </div>
    </div>
  );

  // ── Resume Prompt ──────────────────────────────────────────────
  if (showResumePrompt) return (
    <div className="task-three-container">
      <div className="task-three-bg"/><div className="dark-overlay"/>
      <div className="assessment-screen" style={{justifyContent:'center',alignItems:'center'}}>
        <div style={{background:'white',padding:'2.5rem',borderRadius:'2rem',textAlign:'center',maxWidth:'400px',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
          <div style={{fontSize:'3rem',marginBottom:'1rem'}}>💾</div>
          <h2 style={{color:'#3D5A4C',marginBottom:'0.5rem'}}>Welcome Back!</h2>
          <p style={{color:'#666',marginBottom:'1.5rem'}}>You were on question <strong>{pendingProgress?.currentIndex+1}</strong> of {comparisons.length}. Continue?</p>
          <div style={{display:'flex',gap:'1rem',justifyContent:'center'}}>
            <button onClick={handleResumeSaved} style={{background:'#4CAF50',color:'white',border:'none',borderRadius:'1rem',padding:'0.75rem 1.5rem',fontSize:'1rem',fontWeight:700,cursor:'pointer'}}>▶️ Continue</button>
            <button onClick={handleStartFresh}  style={{background:'#f44336',color:'white',border:'none',borderRadius:'1rem',padding:'0.75rem 1.5rem',fontSize:'1rem',fontWeight:700,cursor:'pointer'}}>🔄 Start Over</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Results Screen ─────────────────────────────────────────────
  if (isComplete && resultsData) return (
    <div className="task-three-container">
      <div className="task-three-bg"/><div className="dark-overlay"/>
      <div className="results-screen">
        <div className="results-header-area">
          <div className="trophy-icon">{resultsData.percentage>=75?'🏆':'🎉'}</div>
          <h1>{resultsData.percentage>=75?'Excellent Detective!':'Great Try!'}</h1>
          <p>You completed all {resultsData.total_comparisons} letter comparisons!</p>
        </div>
        {isSaving&&<div style={{textAlign:'center',color:'#3D5A4C',fontWeight:600,marginBottom:'.75rem',position:'relative',zIndex:10}}>💾 Saving your results…</div>}
        <div className="final-score-area">
          <div className="score-circle-big"><span className="score-number-big">{resultsData.correct_count}/{resultsData.total_comparisons}</span><span className="score-label-small">Correct</span></div>
          <div className="score-circle-big" style={{background:resultsData.percentage>=75?'#4CAF50':resultsData.percentage>=50?'#FF9800':'#f44336'}}><span className="score-number-big">{resultsData.percentage}%</span><span className="score-label-small">Accuracy</span></div>
        </div>
        <div className="category-breakdown-area">
          <h2>📊 Your Performance</h2>
          <div className="breakdown-grid-area">
            <div className="breakdown-card-item"><div className="breakdown-icon-item">✅</div><h3>Correct</h3><div className="breakdown-score-item">{resultsData.correct_count}</div></div>
            <div className="breakdown-card-item"><div className="breakdown-icon-item">❌</div><h3>Incorrect</h3><div className="breakdown-score-item">{resultsData.incorrect_count}</div></div>
            <div className="breakdown-card-item"><div className="breakdown-icon-item">⏱️</div><h3>Timeouts</h3><div className="breakdown-score-item">{resultsData.timeout_count}</div></div>
          </div>
        </div>
        <div className="results-action-buttons">
          <button className="btn-home-page" onClick={handleBack}>🏠 Back to Adventure</button>
        </div>
      </div>
    </div>
  );

  // ── Assessment Screen (UPDATED DESIGN from second code) ─────────
  const comp     = comparisons[currentIndex];
  const progress = (currentIndex/comparisons.length)*100;
  if(!comp) return null;
  const g1 = comp.group1?.split(' ')||[];
  const g2 = comp.group2?.split(' ')||[];

  return (
    <div className="task-three-container">
      <div className="task-three-bg"/><div className="dark-overlay"/>

      {/* ── NEW HEADER DESIGN (matches second code) ── */}
      <div className="assessment-screen">
        <div className="assessment-header-bar">
          <button
            className="nav-pause-btn"
            onClick={isPaused ? handleResume : handlePause}
          >
            {isPaused ? '▶️ Resume' : '⏸️ Pause'}
          </button>
          <div className="header-left">
            <span className="category-name">📝 Comparison {currentIndex + 1} of {comparisons.length}</span>
          </div>
          <div className="header-center">
            <div className="progress-display">
              {results.length} completed
            </div>
          </div>
          <div className="header-right">
            <div className={`timer ${showTimeWarning && timeRemaining <= 5 ? 'warning' : ''}`}>
              ⏱️ {formatTime(timeRemaining)}
            </div>
          </div>
        </div>

        <div className="assessment-progress-bar">
          <div className="assessment-progress-fill" style={{ width: `${progress}%` }}/>
        </div>

        <div className="letter-display-area">
          <div className={`comparison-card ${feedback==='correct'?'feedback-correct':feedback==='incorrect'?'feedback-incorrect':feedback==='timeout'?'feedback-timeout':''}`}>
            <div className="groups-container">
              <div className="group-box"><div className="group-label">Group 1</div><div className="letters-group">{g1.map((l,i)=><div key={i} className="letter-item">{l}</div>)}</div></div>
              <div className="group-box"><div className="group-label">Group 2</div><div className="letters-group">{g2.map((l,i)=><div key={i} className="letter-item">{l}</div>)}</div></div>
            </div>
            <div className="question-hint">🔍 Are these two groups the SAME or DIFFERENT?</div>
          </div>
          <div className="character-area">
            <div className="character-thinking">🐵</div>
            <div className="speech-bubble">
              {isPaused ? '⏸️ Game paused. Click Resume to continue!' : feedback ? {correct:'✅ Great job!',incorrect:'❌ Oops!',timeout:'⏰ Time is up!'}[feedback] : 'Are they the same or different?'}
            </div>
          </div>
        </div>

        <div className="assessment-action-buttons">
          <button className="btn-same"      onClick={()=>handleAnswer('same')}      disabled={!!feedback||isPaused}>🔄 SAME</button>
          <button className="btn-different" onClick={()=>handleAnswer('different')} disabled={!!feedback||isPaused}>⚡ DIFFERENT</button>
        </div>

        {isPaused&&(
          <div className="pause-overlay-full">
            <div className="pause-content-card">
              <h2>⏸️ Game Paused</h2>
              <p>Your progress has been saved!</p>
              <button className="btn-resume-game" onClick={handleResume}>▶️ Resume Challenge</button>
              <button className="btn-quit-game"   onClick={handleQuit}>🏠 Save & Quit</button>
            </div>
          </div>
        )}
        {isSaving&&<div className="saving-overlay"><div className="saving-spinner">💾 Saving...</div></div>}
      </div>
    </div>
  );
}