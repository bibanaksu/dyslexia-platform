// frontend/src/components/tasks/TaskFour.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./TaskFour.css";
import { getChildInfo, getUserInfo, getCurrentChildSessionId } from "../../utils/childSession";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const TASK4_URL = `${API_URL}/api/task4/submit`;

const NUMBER_SEQUENCES = [
  { id:1, numbers:[4,7],         length:2, responseTime:10 },
  { id:2, numbers:[3,8,1],       length:3, responseTime:15 },
  { id:3, numbers:[6,2,9,5],     length:4, responseTime:20 },
  { id:4, numbers:[1,4,7,2,8],   length:5, responseTime:25 },
  { id:5, numbers:[5,0,9,3,6,1], length:6, responseTime:30 },
  { id:6, numbers:[2,6,4,8,0,7,3],length:7,responseTime:35 },
  { id:7, numbers:[9,2],         length:2, responseTime:10 },
  { id:8, numbers:[1,5,3],       length:3, responseTime:15 },
  { id:9, numbers:[7,0,6,2,4],   length:5, responseTime:25 },
  { id:10,numbers:[8,3,1,9,5,2], length:6, responseTime:30 },
];

const PROGRESS_KEY = 'task4_progress';
const saveLocal   = (idx, results, fi, ri, fs, rs, fc, rc) => localStorage.setItem(PROGRESS_KEY, JSON.stringify({ currentIndex:idx, results, forwardInput:fi, reverseInput:ri, forwardSubmitted:fs, reverseSubmitted:rs, forwardCorrect:fc, reverseCorrect:rc, savedAt:Date.now() }));
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

const cmpArrays = (input, expected) => {
  const nums = input.trim().split(/\s+/).filter(Boolean).map(n=>parseInt(n,10));
  return nums.length===expected.length && nums.every((n,i)=>n===expected[i]);
};

// Contact Modal (unchanged)
const ContactModal = ({ isOpen, onClose, onSubmit }) => {
  const [form, setForm] = useState({ parentName:'', childName:'', childAge:'', email:'', phone:'', concerns:'' });
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>Contact a Therapist</h2>
        <p>Fill out the form and our team will reach out within 24 hours.</p>
        <form onSubmit={e=>{e.preventDefault();onSubmit(form);}}>
          {[['parentName','Parent Full Name'],['childName',"Child's Name"],['email','Email Address']].map(([k,l])=>(
            <div key={k} className="form-group">
              <label>{l} *</label>
              <input type={k==='email'?'email':'text'} required value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/>
            </div>
          ))}
          <div className="form-group"><label>Child's Age</label><input type="number" value={form.childAge} onChange={e=>setForm({...form,childAge:e.target.value})}/></div>
          <div className="form-group"><label>Phone</label><input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
          <div className="form-group"><label>Concerns</label><textarea rows="3" value={form.concerns} onChange={e=>setForm({...form,concerns:e.target.value})} placeholder="Describe any specific concerns…"/></div>
          <button type="submit" className="submit-request-btn">Send Request</button>
        </form>
      </div>
    </div>
  );
};

export default function TaskFour() {
  const navigate = useNavigate();
  const [sequences]        = useState(NUMBER_SEQUENCES);
  const [currentIndex,     setCurrentIndex]     = useState(0);
  const [forwardInput,     setForwardInput]     = useState('');
  const [reverseInput,     setReverseInput]     = useState('');
  const [forwardSubmitted, setForwardSubmitted] = useState(false);
  const [reverseSubmitted, setReverseSubmitted] = useState(false);
  const [forwardCorrect,   setForwardCorrect]   = useState(null);
  const [reverseCorrect,   setReverseCorrect]   = useState(null);
  const [results,          setResults]          = useState([]);
  const [isComplete,       setIsComplete]       = useState(false);
  const [isPlaying,        setIsPlaying]        = useState(false);
  const [isPaused,         setIsPaused]         = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [saveError,        setSaveError]        = useState('');
  const [resultsData,      setResultsData]      = useState(null);
  const [showModal,        setShowModal]        = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [pendingProgress,  setPendingProgress]  = useState(null);
  const [markedCompleted,  setMarkedCompleted]  = useState(false);
  const [showSkipConfirm,  setShowSkipConfirm]  = useState(false);

  const isPausedRef   = useRef(false);
  const playTokenRef  = useRef(0);
  const startTimeRef  = useRef(Date.now());
  const totalPausedMs = useRef(0);
  const pausedAtRef   = useRef(null);
  const autoAdvRef    = useRef(null);
  const isMountedRef  = useRef(true);
  // No savedIdRef – we always POST

  const currentSeq = sequences[currentIndex];

  useEffect(() => { isMountedRef.current = true; return () => { isMountedRef.current = false; }; }, []);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  const stopSpeech = useCallback(() => {
    playTokenRef.current += 1;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsPlaying(false);
  }, []);

  const playSequence = useCallback(async numbers => {
    const tok = playTokenRef.current + 1;
    playTokenRef.current = tok;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    await new Promise(r => setTimeout(r, 150));
    if (playTokenRef.current !== tok || isPausedRef.current) return;
    setIsPlaying(true);
    for (let i = 0; i < numbers.length; i++) {
      if (playTokenRef.current !== tok || isPausedRef.current) break;
      await new Promise(r => {
        const u = new SpeechSynthesisUtterance(numbers[i].toString());
        u.lang='en-US'; u.rate=0.9; u.pitch=1.1; u.onend=r; u.onerror=r;
        window.speechSynthesis.speak(u);
      });
      if (i<numbers.length-1 && playTokenRef.current===tok && !isPausedRef.current)
        await new Promise(r => setTimeout(r, 1000));
    }
    if (playTokenRef.current === tok) setIsPlaying(false);
  }, []);

  useEffect(() => {
    startTimeRef.current = Date.now();
    const p = loadLocal();
    if (p && p.currentIndex>0 && p.currentIndex<sequences.length) { setPendingProgress(p); setShowResumePrompt(true); }
    else { setTimeout(()=>playSequence([...NUMBER_SEQUENCES[0].numbers]),500); }
    return () => stopSpeech();
  }, []);

  const handleResumeSaved = () => {
    if (!pendingProgress) return;
    setCurrentIndex(pendingProgress.currentIndex);
    setResults(pendingProgress.results);
    setForwardInput(pendingProgress.forwardInput||'');
    setReverseInput(pendingProgress.reverseInput||'');
    setForwardSubmitted(pendingProgress.forwardSubmitted||false);
    setReverseSubmitted(pendingProgress.reverseSubmitted||false);
    setForwardCorrect(pendingProgress.forwardCorrect||null);
    setReverseCorrect(pendingProgress.reverseCorrect||null);
    setShowResumePrompt(false); setPendingProgress(null);
  };
  const handleStartFresh = () => {
    clearLocal(); setShowResumePrompt(false); setPendingProgress(null);
    setCurrentIndex(0); setResults([]);
    setForwardInput(''); setReverseInput('');
    setForwardSubmitted(false); setReverseSubmitted(false);
    setForwardCorrect(null); setReverseCorrect(null);
    setTimeout(()=>playSequence([...NUMBER_SEQUENCES[0].numbers]),500);
  };

  const handleForwardSubmit = () => {
    if (forwardSubmitted||isPlaying) return;
    const ok = cmpArrays(forwardInput, currentSeq.numbers);
    setForwardCorrect(ok); setForwardSubmitted(true); playSound(ok);
    if (!ok) setForwardInput(currentSeq.numbers.join(' '));
    saveLocal(currentIndex, results, forwardInput, reverseInput, true, reverseSubmitted, ok, reverseCorrect);
  };

  const handleReverseSubmit = () => {
    if (reverseSubmitted||isPlaying) return;
    const expected = [...currentSeq.numbers].reverse();
    const ok = cmpArrays(reverseInput, expected);
    setReverseCorrect(ok); setReverseSubmitted(true); playSound(ok);
    if (!ok) setReverseInput(expected.join(' '));
    saveLocal(currentIndex, results, forwardInput, reverseInput, forwardSubmitted, true, forwardCorrect, ok);
  };

  useEffect(() => {
    if (forwardSubmitted && reverseSubmitted && !isComplete) {
      autoAdvRef.current = setTimeout(handleNext, 1500);
    }
    return () => { if(autoAdvRef.current) clearTimeout(autoAdvRef.current); };
  }, [forwardSubmitted, reverseSubmitted]);

  const buildPayload = useCallback((res, isPartial) => {
    const childSessionId = getCurrentChildSessionId();
    if (!childSessionId) throw new Error('No active child session ID');

    const user = getUserInfo();
    const childInfo = getChildInfo();

    const totalPossible = sequences.length * 2;
    let correctCount = 0;
    res.forEach(r => { if(r.forward_correct) correctCount++; if(r.reverse_correct) correctCount++; });
    const pct = res.length > 0 ? Math.round((correctCount / (res.length * 2)) * 100) : 0;
    let perf = 'Needs Practice';
    if (pct >= 90) perf = 'Excellent!';
    else if (pct >= 75) perf = 'Very Good!';
    else if (pct >= 60) perf = 'Good Start!';
    else if (pct >= 40) perf = 'Keep Going!';
    const elapsed = Math.floor((Date.now() - startTimeRef.current - totalPausedMs.current) / 1000);

    return {
      child_session_id:   parseInt(childSessionId, 10),
      child_id:           user?.childId ? parseInt(user.childId, 10) : null,
      seq_total:          20,
      seq_correct:        res.reduce((sum, r) => sum + (r.forward_correct ? 1 : 0), 0),
      seq_incorrect:      res.reduce((sum, r) => sum + (r.forward_correct === false ? 1 : 0), 0),
      seq_timeout:        0,
      seq_percentage:     res.length > 0 ? Math.round((res.reduce((sum,r)=>sum+(r.forward_correct?1:0),0) / res.length) * 100) : 0,
      seq_time_seconds:   Math.round(elapsed / (res.length || 1)),
      seq_details:        JSON.stringify(res.map(r => ({ forward: { correct: r.forward_correct, input: r.forward_user_input, expected: r.original_numbers } }))),
      rev_total:          10,
      rev_correct:        res.reduce((sum, r) => sum + (r.reverse_correct ? 1 : 0), 0),
      rev_incorrect:      res.reduce((sum, r) => sum + (r.reverse_correct === false ? 1 : 0), 0),
      rev_timeout:        0,
      rev_percentage:     res.length > 0 ? Math.round((res.reduce((sum,r)=>sum+(r.reverse_correct?1:0),0) / res.length) * 100) : 0,
      rev_time_seconds:   Math.round(elapsed / (res.length || 1)),
      rev_details:        JSON.stringify(res.map(r => ({ reverse: { correct: r.reverse_correct, input: r.reverse_user_input, expected: [...r.original_numbers].reverse() } }))),
      overall_percentage: pct,
      performance_level:  perf,
    };
  }, [sequences]);

  const saveResultsToDB = useCallback(async (res, isPartial = false) => {
    if (!isMountedRef.current) return;
    setSaving(true); setSaveError('');
    try {
      const payload = buildPayload(res, isPartial);
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const response = await axios.post(TASK4_URL, payload, { headers });
      if (response.data?.resultId) console.log('✅ Task4 saved, id:', response.data.resultId);
    } catch (err) {
      console.error('Task4 save error:', err);
      setSaveError('Network error – progress saved locally only.');
      localStorage.setItem('task4_results_backup', JSON.stringify({ ...res, savedAt: new Date().toISOString() }));
    } finally { setSaving(false); }
  }, [buildPayload]);

  const handleNext = useCallback(async () => {
    if (autoAdvRef.current) { clearTimeout(autoAdvRef.current); autoAdvRef.current=null; }
    stopSpeech();
    const newResult = {
      sequence_id: currentSeq.id,
      original_numbers: [...currentSeq.numbers],
      forward_correct: forwardCorrect,
      reverse_correct: reverseCorrect,
      forward_user_input: forwardInput,
      reverse_user_input: reverseInput,
      sequence_length: currentSeq.length
    };
    const updated = [...results, newResult];
    setResults(updated);
    await saveResultsToDB(updated, true);

    if (currentIndex+1 >= sequences.length) {
      await finishAssessment(updated);
    } else {
      const next = currentIndex+1;
      setCurrentIndex(next); setForwardInput(''); setReverseInput('');
      setForwardSubmitted(false); setReverseSubmitted(false);
      setForwardCorrect(null); setReverseCorrect(null);
      clearLocal();
      setTimeout(()=>playSequence([...sequences[next].numbers]), 600);
    }
  }, [currentIndex, forwardCorrect, reverseCorrect, forwardInput, reverseInput, results, sequences, stopSpeech, playSequence, saveResultsToDB]);

  const finishAssessment = async finalResults => {
    stopSpeech(); clearLocal();
    const totalPossible = sequences.length * 2;
    let correctCount = 0;
    finalResults.forEach(r => { if(r.forward_correct) correctCount++; if(r.reverse_correct) correctCount++; });
    const pct = Math.round((correctCount / totalPossible) * 100);
    let perf = 'Needs Practice', rec = 'Start with 2-number sequences and practice!';
    if (pct >= 90) { perf = 'Excellent!'; rec = 'Amazing memory skills!'; }
    else if (pct >= 75) { perf = 'Very Good!'; rec = 'Great job remembering the numbers!'; }
    else if (pct >= 60) { perf = 'Good Start!'; rec = 'Keep practicing number sequences!'; }
    else if (pct >= 40) { perf = 'Keep Going!'; rec = 'Practice with shorter sequences first.'; }
    const elapsed = Math.floor((Date.now() - startTimeRef.current - totalPausedMs.current) / 1000);
    const data = {
      totalPossible, correctCount, percentage: pct, performanceLevel: perf, recommendation: rec,
      totalTimeSeconds: elapsed, sequenceDetails: finalResults
    };
    setResultsData(data);
    localStorage.setItem('task4_results', JSON.stringify(data));
    if (pct >= 40 && !markedCompleted) { markQuestCompleted(); setMarkedCompleted(true); }
    await saveResultsToDB(finalResults, false);
    setIsComplete(true);
  };

  const handleContactTherapist = form => { alert(`Thank you ${form.parentName}! A therapist will contact you at ${form.email} within 24 hours.`); setShowModal(false); };
  const handlePause = async () => {
    if(isComplete) return;
    stopSpeech(); pausedAtRef.current=Date.now(); setIsPaused(true);
    saveLocal(currentIndex, results, forwardInput, reverseInput, forwardSubmitted, reverseSubmitted, forwardCorrect, reverseCorrect);
    if (results.length > 0) await saveResultsToDB(results, true);
  };
  const handleResume = () => {
    if(isComplete) return;
    if(pausedAtRef.current){totalPausedMs.current+=Date.now()-pausedAtRef.current;pausedAtRef.current=null;}
    setIsPaused(false);
  };
  const handleQuit   = () => { stopSpeech(); saveLocal(currentIndex, results, forwardInput, reverseInput, forwardSubmitted, reverseSubmitted, forwardCorrect, reverseCorrect); navigate('/adventure'); };
  const handleBack   = () => { stopSpeech(); navigate('/adventure'); };
  const handleSkipToResults = async () => {
    stopSpeech();
    if (autoAdvRef.current) clearTimeout(autoAdvRef.current);
    let finalResults = [...results];
    if (forwardSubmitted) {
      const currentResult = {
        sequence_id: currentSeq.id, original_numbers:[...currentSeq.numbers],
        forward_correct: forwardCorrect, reverse_correct: reverseCorrect,
        forward_user_input: forwardInput, reverse_user_input: reverseInput,
        sequence_length: currentSeq.length
      };
      const alreadyAdded = finalResults.some(r => r.sequence_id === currentSeq.id);
      if (!alreadyAdded) finalResults.push(currentResult);
    }
    await finishAssessment(finalResults);
  };

  const progress = (currentIndex / sequences.length) * 100;

  // ─── Resume prompt screen ─────────────────────────────────────
  if (showResumePrompt) return (
    <div className="task-four-container">
      <div className="task-four-bg"/><div className="dark-overlay"/>
      <div className="resume-prompt-container" style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',position:'relative',zIndex:10}}>
        <div style={{background:'white',padding:'2.5rem',borderRadius:'2rem',textAlign:'center',maxWidth:'400px',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
          <div style={{fontSize:'3rem',marginBottom:'1rem'}}>💾</div>
          <h2 style={{color:'#3D5A4C',marginBottom:'0.5rem'}}>Welcome Back!</h2>
          <p style={{color:'#666',marginBottom:'1.5rem'}}>You were on sequence <strong>{pendingProgress?.currentIndex+1}</strong> of {sequences.length}. Continue?</p>
          <div style={{display:'flex',gap:'1rem',justifyContent:'center'}}>
            <button onClick={handleResumeSaved} style={{background:'#4CAF50',color:'white',border:'none',borderRadius:'1rem',padding:'0.75rem 1.5rem',fontSize:'1rem',fontWeight:700,cursor:'pointer'}}>Continue</button>
            <button onClick={handleStartFresh}  style={{background:'#f44336',color:'white',border:'none',borderRadius:'1rem',padding:'0.75rem 1.5rem',fontSize:'1rem',fontWeight:700,cursor:'pointer'}}>Start Over</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── RESULTS SCREEN (TaskOne‑style header) ─────────────────────
  if (isComplete && resultsData) {
    return (
      <div className="task-four-container">
        <div className="task-four-bg"/><div className="dark-overlay"/>
        <div className="assessment-header-bar" style={{
          position: 'relative', zIndex: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.8rem 2rem', background: 'rgba(255,255,255,0.95)', borderBottom: '2px solid rgba(61,90,76,0.2)'
        }}>
          <div className="header-left">
            <button className="nav-back-btn" onClick={handleBack} style={{background:'#3D5A4C',color:'white',border:'none',padding:'0.5rem 1rem',borderRadius:'2rem',fontWeight:600,cursor:'pointer'}}>← Back</button>
            <span className="category-name" style={{marginLeft:'1rem',fontWeight:700,color:'#3D5A4C'}}>🎯 Number Memory</span>
          </div>
          <div className="header-center">
            <div className="progress-display" style={{fontWeight:700,color:'#3D5A4C'}}>✨ Results ✨</div>
          </div>
          <div className="header-right">
            <div className="timer" style={{background:'#3D5A4C',color:'white',padding:'0.5rem 1rem',borderRadius:'1.5rem',fontWeight:800}}>✓ Completed</div>
          </div>
        </div>

        <div className="results-screen" style={{display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',height:'calc(100vh - 70px)',position:'relative',zIndex:10,padding:'2rem',overflowY:'auto'}}>
          <div className="results-header-area" style={{textAlign:'center'}}>
            <div className="trophy-icon" style={{fontSize:'4rem'}}>{resultsData.percentage>=75?'🏆':'🎉'}</div>
            <h1 style={{color:'white',fontSize:'2rem',marginBottom:'0.5rem'}}>{resultsData.percentage>=75?'Number Memory Champion!':'Assessment Complete!'}</h1>
            <p style={{color:'rgba(255,255,255,0.9)'}}>You completed {resultsData.sequenceDetails.length} of {sequences.length} number sequences!</p>
            <p className="score-preview" style={{color:'#FFD700',fontSize:'1.2rem',marginTop:'0.5rem'}}>Your Score: {resultsData.correctCount}/{resultsData.totalPossible} ({resultsData.percentage}%)</p>
          </div>
          {saving && <div style={{textAlign:'center',color:'#fff',marginTop:'1rem'}}>💾 Saving results...</div>}
          {saveError && !saving && <div style={{textAlign:'center',color:'#ffaa00',marginTop:'1rem'}}>⚠️ {saveError}</div>}
          <div className="results-action-buttons" style={{display:'flex',gap:'1rem',marginTop:'2rem',flexWrap:'wrap',justifyContent:'center'}}>
            <button className="btn-check-results" onClick={() => navigate('/assessment/results')} style={{background:'#3D5A4C',color:'white',border:'none',padding:'0.8rem 1.5rem',borderRadius:'2rem',fontWeight:700,cursor:'pointer',minWidth:'180px'}}>View Full Assessment Report</button>
            <button className="btn-home-page" onClick={handleBack} style={{background:'#a8d0db',color:'#3D5A4C',border:'none',padding:'0.8rem 1.5rem',borderRadius:'2rem',fontWeight:700,cursor:'pointer'}}>Back to Adventure</button>
          </div>
        </div>
        <ContactModal isOpen={showModal} onClose={()=>setShowModal(false)} onSubmit={handleContactTherapist}/>
      </div>
    );
  }

  // ─── Skip confirmation modal ───────────────────────────────────
  if (showSkipConfirm) return (
    <div className="task-four-container">
      <div className="task-four-bg"/><div className="dark-overlay"/>
      <div className="skip-confirm-container" style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',position:'relative',zIndex:10}}>
        <div style={{background:'white',padding:'2rem',borderRadius:'2rem',textAlign:'center',maxWidth:'400px',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
          <div style={{fontSize:'3rem',marginBottom:'0.5rem'}}>⏭️</div>
          <h2 style={{color:'#3D5A4C',marginBottom:'0.5rem'}}>Skip to Results?</h2>
          <p style={{color:'#666',marginBottom:'0.5rem'}}>You've completed {results.length} of {sequences.length} sequences.</p>
          <p style={{color:'#FF9800',fontSize:'0.85rem',marginBottom:'1.5rem'}}>Your results will be calculated based on completed sequences only.</p>
          <div style={{display:'flex',gap:'1rem',justifyContent:'center'}}>
            <button onClick={()=>{setShowSkipConfirm(false);}} style={{background:'#a8d0db',color:'#3D5A4C',border:'none',borderRadius:'1rem',padding:'0.75rem 1.5rem',fontSize:'1rem',fontWeight:700,cursor:'pointer'}}>Cancel</button>
            <button onClick={handleSkipToResults} style={{background:'#FF9800',color:'white',border:'none',borderRadius:'1rem',padding:'0.75rem 1.5rem',fontSize:'1rem',fontWeight:700,cursor:'pointer'}}>Yes, Show Results</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── MAIN ASSESSMENT SCREEN (TaskOne‑style header + progress bar) ──
  return (
    <div className="task-four-container">
      <div className="task-four-bg"/><div className="dark-overlay"/>

      {/* TaskOne‑style header bar */}
      <div className="assessment-header-bar">
        <div className="header-left">
          <button className="nav-back-btn" onClick={handleBack}>← Back</button>
          <span className="sequence-info">Sequence {currentIndex+1} of {sequences.length}</span>
        </div>
        <div className="header-center">
          {isPlaying && (
            <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
              <div className="sound-wave-small"><span/><span/><span/><span/></div>
              <span style={{fontSize:'0.85rem',fontWeight:700,color:'#3D5A4C'}}>Listening…</span>
            </div>
          )}
        </div>
        <div className="header-right">
          <button className="replay-btn" onClick={()=>!isPlaying&&!isPaused&&playSequence([...currentSeq.numbers])} disabled={isPlaying||isPaused}>🔊 Replay</button>
          <button className="nav-pause-btn" onClick={handlePause}>{isPaused ? '▶️ Resume' : '⏸️ Pause'}</button>
          <button className="nav-skip-btn" onClick={()=>setShowSkipConfirm(true)}>⏭️ Skip</button>
        </div>
      </div>

      {/* Progress bar (immediately below header) */}
      <div className="assessment-progress-bar" style={{margin:'0 0 0.5rem 0'}}>
        <div className="assessment-progress-fill" style={{width:`${progress}%`}} />
      </div>

      <div className="assessment-screen">
        {isPlaying && (
          <div className="playing-indicator">
            <div className="sound-wave-small"><span/><span/><span/><span/></div>
            <p>Listen carefully! (1 second between numbers)</p>
          </div>
        )}

        <div className="writing-area">
          {/* Forward card */}
          <div className={`writing-card forward-card ${forwardSubmitted?(forwardCorrect?'correct':'incorrect'):''}`}>
            <div className="card-header">
              <span className="direction-icon">➡️</span>
              <h3>Forward Order</h3>
              <span className="direction-label">Left → Right</span>
            </div>
            <div className="writing-box">
              <div className="writing-line">
                {forwardSubmitted&&forwardCorrect&&<span className="check-mark">✓</span>}
                {forwardSubmitted&&forwardCorrect===false&&<span className="x-mark">✗</span>}
                <input type="text" className={`writing-input ${forwardSubmitted?(forwardCorrect?'correct-input':'incorrect-input'):''}`}
                  value={forwardInput} placeholder="Type numbers in order (e.g. 4 7)"
                  onChange={e=>!forwardSubmitted&&setForwardInput(e.target.value)}
                  disabled={forwardSubmitted||isPlaying}/>
              </div>
              <div className="writing-hint">Write the numbers in the SAME order you heard</div>
            </div>
            {!forwardSubmitted&&<button className="submit-btn forward-btn" onClick={handleForwardSubmit} disabled={!forwardInput.trim()||isPlaying}>✅ Submit Forward</button>}
            {forwardSubmitted&&forwardCorrect&&<div className="feedback-badge correct-badge">🎉 Correct!</div>}
            {forwardSubmitted&&forwardCorrect===false&&<div className="feedback-badge incorrect-badge">Correct order: {currentSeq.numbers.join(' → ')}</div>}
          </div>

          {/* Reverse card */}
          <div className={`writing-card reverse-card ${reverseSubmitted?(reverseCorrect?'correct':'incorrect'):''}`}>
            <div className="card-header">
              <span className="direction-icon">⬅️</span>
              <h3>Reverse Order</h3>
              <span className="direction-label">Right → Left</span>
            </div>
            <div className="writing-box">
              <div className="writing-line">
                {reverseSubmitted&&reverseCorrect&&<span className="check-mark">✓</span>}
                {reverseSubmitted&&reverseCorrect===false&&<span className="x-mark">✗</span>}
                <input type="text" className={`writing-input ${reverseSubmitted?(reverseCorrect?'correct-input':'incorrect-input'):''}`}
                  value={reverseInput} placeholder="Type numbers BACKWARDS (e.g. 7 4)"
                  onChange={e=>!reverseSubmitted&&setReverseInput(e.target.value)}
                  disabled={reverseSubmitted||isPlaying}/>
              </div>
              <div className="writing-hint">Write the numbers in REVERSE order (last to first)</div>
            </div>
            {!reverseSubmitted&&<button className="submit-btn reverse-btn" onClick={handleReverseSubmit} disabled={!reverseInput.trim()||isPlaying}>🔄 Submit Reverse</button>}
            {reverseSubmitted&&reverseCorrect&&<div className="feedback-badge correct-badge">🎉 Correct!</div>}
            {reverseSubmitted&&reverseCorrect===false&&<div className="feedback-badge incorrect-badge">Correct reverse: {[...currentSeq.numbers].reverse().join(' → ')}</div>}
          </div>
        </div>

        <div className="character-area">
          <div className="character-thinking">🐵</div>
          <div className="speech-bubble">
            {isPlaying?'🎤 Listen carefully!':!forwardSubmitted?'✏️ Write the numbers FORWARD first!':!reverseSubmitted?'🔄 Now write them in REVERSE!':'🎉 Moving to next sequence…'}
          </div>
        </div>

        {isPaused&&(
          <div className="pause-overlay-full">
            <div className="pause-content-card">
              <h2>⏸️ Game Paused</h2>
              <p>Your progress has been saved!</p>
              <button className="btn-resume-game" onClick={handleResume}>▶️ Resume</button>
              <button className="btn-quit-game" onClick={handleQuit}>🏠 Save & Quit</button>
            </div>
          </div>
        )}
        {saving&&<div className="saving-overlay">💾 Saving...</div>}
        {saveError&&!saving&&<div className="error-notice">⚠️ {saveError}</div>}
      </div>

      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .sound-wave-small span { 
          display: inline-block; width: 4px; background: #3D5A4C; border-radius: 2px; 
          animation: soundWave 0.8s ease-in-out infinite; 
        }
        .sound-wave-small span:nth-child(1) { height: 12px; }
        .sound-wave-small span:nth-child(2) { height: 20px; animation-delay: 0.1s; }
        .sound-wave-small span:nth-child(3) { height: 16px; animation-delay: 0.2s; }
        .sound-wave-small span:nth-child(4) { height: 10px; animation-delay: 0.3s; }
        @keyframes soundWave { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(1.8); } }
      `}</style>
    </div>
  );
}