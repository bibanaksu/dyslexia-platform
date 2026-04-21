// frontend/src/components/tasks/TaskFour.jsx
// FIXES:
//  1. Header bar on top with sequence info, replay button, and pause button
//  2. Progress bar below header
//  3. Reads childFullName + sessionUUID correctly
//  4. POST once → PATCH every subsequent save (no duplicate rows)
//  5. SKIP button - takes user directly to assessment results
//  6. Results button navigates to /assessment/results page
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./TaskFour.css";
import { getChildInfo, getSessionUUID, getUserInfo, getGuestId } from "../../utils/childSession";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
const SAVED_ID_KEY = 'task4_saved_db_id';

const saveLocal   = (idx, results, fi, ri, fs, rs, fc, rc) =>
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({ currentIndex:idx, results, forwardInput:fi, reverseInput:ri, forwardSubmitted:fs, reverseSubmitted:rs, forwardCorrect:fc, reverseCorrect:rc, savedAt:Date.now() }));
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

/* ── Contact Modal ── */
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

/* ── Main Component ── */
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
  // ── FIX: single DB row per session ──
  const savedIdRef    = useRef(localStorage.getItem(SAVED_ID_KEY) || null);

  const currentSeq = sequences[currentIndex];

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

  // ── SKIP FUNCTION: finish assessment with current results ──
  const handleSkipToResults = async () => {
    stopSpeech();
    if (autoAdvRef.current) clearTimeout(autoAdvRef.current);
    
    let finalResults = [...results];
    
    if (forwardSubmitted) {
      const currentResult = { 
        sequence_id: currentSeq.id, 
        original_numbers:[...currentSeq.numbers], 
        forward_correct:forwardCorrect, 
        reverse_correct:reverseCorrect, 
        forward_user_input:forwardInput, 
        reverse_user_input:reverseInput, 
        sequence_length:currentSeq.length 
      };
      const alreadyAdded = finalResults.some(r => r.sequence_id === currentSeq.id);
      if (!alreadyAdded) {
        finalResults.push(currentResult);
      }
    }
    
    await finishAssessment(finalResults);
  };

  // ── FIXED: buildPayload reads childFullName ──
  const buildPayload = useCallback((res, isPartial) => {
    const user      = getUserInfo();
    const childInfo = getChildInfo();
    const sessionUUID = getSessionUUID();
    const tp = sequences.length * 2;
    let cc = 0;
    res.forEach(r => { if(r.forward_correct) cc++; if(r.reverse_correct) cc++; });
    const pct = res.length>0 ? Math.round((cc/(res.length*2))*100) : 0;
    let perf='Needs Practice';
    if(pct>=90)perf='Excellent!';else if(pct>=75)perf='Very Good!';else if(pct>=60)perf='Good Start!';else if(pct>=40)perf='Keep Going!';
    const elapsed = Math.floor((Date.now()-startTimeRef.current-totalPausedMs.current)/1000);

    return {
      sessionUUID,
      childName:       childInfo?.childFullName || childInfo?.childName || user?.name || 'Guest User',
      childGrade:      childInfo?.childGrade    || user?.childGrade     || 'Not Specified',
      childId:         user?.childId || null,
      parentId:        user?.role==='parent' ? user.id : null,
      guestId:         getGuestId(),
      totalPossible:   tp,
      completedItems:  res.length*2,
      correctCount:    cc,
      incorrectCount:  (res.length*2)-cc,
      timeoutCount:    0,
      percentage:      pct,
      performanceLevel:perf,
      totalTimeSeconds:elapsed,
      avgTimePerItem:  res.length>0 ? Math.round(elapsed/(res.length*2)) : 0,
      sequenceDetails: JSON.stringify(res),
      isPartial:       isPartial?1:0,
    };
  }, [sequences]);

  // ── FIXED: POST once → PATCH after ──
  const saveResultsToDB = useCallback(async (res, isPartial=false) => {
    if (saving) return;
    setSaving(true); setSaveError('');
    const payload = buildPayload(res, isPartial);
    const token   = localStorage.getItem('token');
    const headers = { 'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{}) };
    try {
      let response;
      if (savedIdRef.current) {
        response = await axios.patch(`${API_URL}/api/task4/submit/${savedIdRef.current}`, payload, {headers});
      } else {
        response = await axios.post(`${API_URL}/api/task4/submit`, payload, {headers});
        if (response.data?.resultId) {
          savedIdRef.current = String(response.data.resultId);
          localStorage.setItem(SAVED_ID_KEY, savedIdRef.current);
        }
      }
      console.log('✅ Task4 saved, id:', savedIdRef.current);
    } catch(err) {
      console.error('Task4 save error:', err);
      setSaveError('Network error — saved locally only.');
    } finally { setSaving(false); }
  }, [buildPayload, saving]);

  const handleNext = useCallback(() => {
    if (autoAdvRef.current) { clearTimeout(autoAdvRef.current); autoAdvRef.current=null; }
    stopSpeech();
    const newResult = { sequence_id:currentSeq.id, original_numbers:[...currentSeq.numbers], forward_correct:forwardCorrect, reverse_correct:reverseCorrect, forward_user_input:forwardInput, reverse_user_input:reverseInput, sequence_length:currentSeq.length };
    const updated = [...results, newResult];
    setResults(updated);
    saveResultsToDB(updated, true);

    if (currentIndex+1 >= sequences.length) {
      finishAssessment(updated);
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
    const tp = sequences.length*2; let cc=0;
    finalResults.forEach(r=>{ if(r.forward_correct)cc++; if(r.reverse_correct)cc++; });
    const pct = Math.round((cc/tp)*100);
    let perf='Needs Practice', rec='Start with 2-number sequences and practice!';
    if(pct>=90){perf='Excellent!';rec='Amazing memory skills!';}
    else if(pct>=75){perf='Very Good!';rec='Great job remembering the numbers!';}
    else if(pct>=60){perf='Good Start!';rec='Keep practicing number sequences!';}
    else if(pct>=40){perf='Keep Going!';rec='Practice with shorter sequences first.';}
    const elapsed = Math.floor((Date.now()-startTimeRef.current-totalPausedMs.current)/1000);
    const data = { totalPossible:tp, correctCount:cc, percentage:pct, performanceLevel:perf, recommendation:rec, totalTimeSeconds:elapsed, sequenceDetails:finalResults };
    setResultsData(data);
    localStorage.setItem('task4_results', JSON.stringify(data));
    if (pct>=40 && !markedCompleted) { markQuestCompleted(); setMarkedCompleted(true); }
    await saveResultsToDB(finalResults, false);
    // Clear saved ID for next fresh session
    localStorage.removeItem(SAVED_ID_KEY); savedIdRef.current=null;
    setIsComplete(true);
  };

  const handleContactTherapist = form => { alert(`Thank you ${form.parentName}! A therapist will contact you at ${form.email} within 24 hours.`); setShowModal(false); };
  const handlePause  = () => { if(isComplete) return; stopSpeech(); pausedAtRef.current=Date.now(); setIsPaused(true); saveLocal(currentIndex,results,forwardInput,reverseInput,forwardSubmitted,reverseSubmitted,forwardCorrect,reverseCorrect); };
  const handleResume = () => { if(isComplete) return; if(pausedAtRef.current){totalPausedMs.current+=Date.now()-pausedAtRef.current;pausedAtRef.current=null;} setIsPaused(false); };
  const handleQuit   = () => { stopSpeech(); saveLocal(currentIndex,results,forwardInput,reverseInput,forwardSubmitted,reverseSubmitted,forwardCorrect,reverseCorrect); navigate('/adventure'); };
  const handleBack   = () => { stopSpeech(); navigate('/adventure'); };
  
  // Navigate to central assessment results page
  const handleViewFullResults = () => {
    navigate('/assessment/results');
  };

  const progress = (currentIndex/sequences.length)*100;

  // ── Resume prompt ────────────────────────────────────────────
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

  // ── Results Screen ── Navigates to central Assessment Results page
  if (isComplete && resultsData) {
    return (
      <div className="task-four-container">
        <div className="task-four-bg"/><div className="dark-overlay"/>
        <div className="results-screen" style={{display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',height:'100vh',position:'relative',zIndex:10,padding:'2rem'}}>
          <div className="results-header-area" style={{textAlign:'center'}}>
            <div className="trophy-icon" style={{fontSize:'4rem'}}>{resultsData.percentage>=75?'🏆':'🎉'}</div>
            <h1 style={{color:'white',fontSize:'2rem',marginBottom:'0.5rem'}}>{resultsData.percentage>=75?'Number Memory Champion!':'Assessment Complete!'}</h1>
            <p style={{color:'rgba(255,255,255,0.9)'}}>You completed {resultsData.sequenceDetails.length} of {sequences.length} number sequences!</p>
            <p className="score-preview" style={{color:'#FFD700',fontSize:'1.2rem',marginTop:'0.5rem'}}>Your Score: {resultsData.correctCount}/{resultsData.totalPossible} ({resultsData.percentage}%)</p>
          </div>
          <div className="results-action-buttons" style={{display:'flex',gap:'1rem',marginTop:'2rem'}}>
            <button className="btn-check-results" onClick={handleViewFullResults} style={{background:'#3D5A4C',color:'white',border:'none',padding:'0.8rem 1.5rem',borderRadius:'2rem',fontWeight:700,cursor:'pointer'}}>View Full Assessment Report</button>
            <button className="btn-home-page" onClick={handleBack} style={{background:'#a8d0db',color:'#3D5A4C',border:'none',padding:'0.8rem 1.5rem',borderRadius:'2rem',fontWeight:700,cursor:'pointer'}}>Back to Adventure</button>
          </div>
        </div>
        <ContactModal isOpen={showModal} onClose={()=>setShowModal(false)} onSubmit={handleContactTherapist}/>
      </div>
    );
  }

  // ── Skip Confirmation Modal ──
  if (showSkipConfirm) return (
    <div className="task-four-container">
      <div className="task-four-bg"/><div className="dark-overlay"/>
      <div className="skip-confirm-container" style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',position:'relative',zIndex:10}}>
        <div style={{background:'white',padding:'2rem',borderRadius:'2rem',textAlign:'center',maxWidth:'400px',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
          <div style={{fontSize:'3rem',marginBottom:'0.5rem'}}>⏭️</div>
          <h2 style={{color:'#3D5A4C',marginBottom:'0.5rem'}}>Skip to Results?</h2>
          <p style={{color:'#666',marginBottom:'0.5rem'}}>
            You've completed {results.length} of {sequences.length} sequences.
          </p>
          <p style={{color:'#FF9800',fontSize:'0.85rem',marginBottom:'1.5rem'}}>
            Your results will be calculated based on completed sequences only.
          </p>
          <div style={{display:'flex',gap:'1rem',justifyContent:'center'}}>
            <button onClick={()=>{setShowSkipConfirm(false);}} style={{background:'#a8d0db',color:'#3D5A4C',border:'none',borderRadius:'1rem',padding:'0.75rem 1.5rem',fontSize:'1rem',fontWeight:700,cursor:'pointer'}}>Cancel</button>
            <button onClick={handleSkipToResults} style={{background:'#FF9800',color:'white',border:'none',borderRadius:'1rem',padding:'0.75rem 1.5rem',fontSize:'1rem',fontWeight:700,cursor:'pointer'}}>Yes, Show Results</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Main Assessment ───────────────────────────────────────────
  return (
    <div className="task-four-container">
      <div className="task-four-bg"/><div className="dark-overlay"/>

      {/* ── HEADER BAR AT THE VERY TOP (no navbar) ── */}
      <div className="assessment-header-bar" style={{
        position: 'relative',
        zIndex: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.8rem 2rem',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '2px solid rgba(61,90,76,0.2)'
      }}>
        <div className="header-left">
          <button className="nav-back-btn" onClick={handleBack} style={{background:'#3D5A4C',color:'white',border:'none',padding:'0.5rem 1rem',borderRadius:'2rem',fontWeight:600,cursor:'pointer'}}>← Back</button>
          <span className="sequence-info" style={{marginLeft:'1rem',fontWeight:700,color:'#3D5A4C'}}>Sequence {currentIndex+1} of {sequences.length}</span>
        </div>
        <div className="header-center">
          {isPlaying && (
            <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
              <div className="sound-wave-small"><span/><span/><span/><span/></div>
              <span style={{fontSize:'0.85rem',fontWeight:700,color:'#3D5A4C'}}>Listening…</span>
            </div>
          )}
        </div>
        <div className="header-right" style={{display:'flex',gap:'0.75rem',alignItems:'center'}}>
          <span style={{color:'#3D5A4C',fontWeight:700,fontSize:'0.85rem'}}>{results.length}/{sequences.length}</span>
          <button className="replay-btn" onClick={()=>!isPlaying&&!isPaused&&playSequence([...currentSeq.numbers])} disabled={isPlaying||isPaused} style={{background:'#3D5A4C',color:'white',border:'none',padding:'0.5rem 1rem',borderRadius:'2rem',fontWeight:600,cursor:'pointer'}}>🔊 Replay</button>
          <button className="nav-pause-btn" onClick={handlePause} style={{background:'#FF9800',color:'white',border:'none',padding:'0.5rem 1rem',borderRadius:'2rem',fontWeight:600,cursor:'pointer'}}>{isPaused ? '▶️' : '⏸️'}</button>
          <button className="nav-skip-btn" onClick={()=>setShowSkipConfirm(true)} style={{background:'#f44336',color:'white',border:'none',padding:'0.5rem 1rem',borderRadius:'2rem',fontWeight:600,cursor:'pointer'}}>⏭️ Skip</button>
        </div>
      </div>

      {/* ── Progress bar right below header ── */}
      <div className="top-progress-bar" style={{
        height: '6px',
        background: 'rgba(255,255,255,0.4)',
        borderRadius: '3px',
        margin: '0',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 10
      }}>
        <div className="assessment-progress-fill" style={{width:`${progress}%`,height:'100%',background:'linear-gradient(90deg, #3D5A4C, #5FB9B0)',transition:'width 0.5s ease'}}/>
      </div>

      <div className="assessment-screen" style={{padding:'1rem 2rem',height:'calc(100vh - 70px)',overflowY:'auto'}}>
        {isPlaying && (
          <div className="playing-indicator" style={{textAlign:'center',background:'rgba(255,255,255,0.9)',borderRadius:'2rem',padding:'0.75rem',marginBottom:'1rem'}}>
            <div className="sound-wave-small" style={{display:'inline-flex',gap:'3px',marginRight:'0.5rem'}}><span/><span/><span/><span/></div>
            <p style={{display:'inline',color:'#3D5A4C',fontWeight:700}}>Listen carefully! (1 second between numbers)</p>
          </div>
        )}

        {/* ── Writing area ── */}
        <div className="writing-area" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
          {/* Forward */}
          <div className={`writing-card forward-card ${forwardSubmitted?(forwardCorrect?'correct':'incorrect'):''}`} style={{background:'rgba(255,255,255,0.95)',borderRadius:'1.5rem',padding:'1.25rem'}}>
            <div className="card-header" style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.75rem'}}>
              <span className="direction-icon" style={{fontSize:'1.4rem'}}>➡️</span>
              <h3 style={{color:'#3D5A4C',fontSize:'1rem',fontWeight:800,margin:0,flex:1}}>Forward Order</h3>
              <span className="direction-label" style={{fontSize:'0.75rem',color:'#888',fontWeight:600}}>Left → Right</span>
            </div>
            <div className="writing-box">
              <div className="writing-line" style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                {forwardSubmitted&&forwardCorrect&&<span className="check-mark" style={{color:'#4CAF50',fontSize:'1.3rem',fontWeight:900}}>✓</span>}
                {forwardSubmitted&&forwardCorrect===false&&<span className="x-mark" style={{color:'#f44336',fontSize:'1.3rem',fontWeight:900}}>✗</span>}
                <input type="text" className={`writing-input ${forwardSubmitted?(forwardCorrect?'correct-input':'incorrect-input'):''}`}
                  value={forwardInput} placeholder="Type numbers in order (e.g. 4 7)"
                  onChange={e=>!forwardSubmitted&&setForwardInput(e.target.value)}
                  disabled={forwardSubmitted||isPlaying}
                  style={{flex:1,padding:'0.6rem 0.9rem',border:'2px solid #ddd',borderRadius:'1rem',fontSize:'1rem'}}/>
              </div>
              <div className="writing-hint" style={{fontSize:'0.75rem',color:'#888',marginTop:'0.4rem',fontStyle:'italic'}}>Write the numbers in the SAME order you heard</div>
            </div>
            {!forwardSubmitted&&<button className="submit-btn forward-btn" onClick={handleForwardSubmit} disabled={!forwardInput.trim()||isPlaying} style={{width:'100%',padding:'0.65rem',background:'#3D5A4C',color:'white',border:'none',borderRadius:'1.5rem',fontWeight:700,marginTop:'0.5rem',cursor:'pointer'}}>✅ Submit Forward</button>}
            {forwardSubmitted&&forwardCorrect&&<div className="feedback-badge correct-badge" style={{background:'#e8f5e9',color:'#2e7d32',padding:'0.5rem',borderRadius:'1rem',textAlign:'center',marginTop:'0.5rem'}}>🎉 Correct!</div>}
            {forwardSubmitted&&forwardCorrect===false&&<div className="feedback-badge incorrect-badge" style={{background:'#ffebee',color:'#c62828',padding:'0.5rem',borderRadius:'1rem',textAlign:'center',marginTop:'0.5rem',fontSize:'0.8rem'}}>Correct order: {currentSeq.numbers.join(' → ')}</div>}
          </div>

          {/* Reverse */}
          <div className={`writing-card reverse-card ${reverseSubmitted?(reverseCorrect?'correct':'incorrect'):''}`} style={{background:'rgba(255,255,255,0.95)',borderRadius:'1.5rem',padding:'1.25rem'}}>
            <div className="card-header" style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.75rem'}}>
              <span className="direction-icon" style={{fontSize:'1.4rem'}}>⬅️</span>
              <h3 style={{color:'#3D5A4C',fontSize:'1rem',fontWeight:800,margin:0,flex:1}}>Reverse Order</h3>
              <span className="direction-label" style={{fontSize:'0.75rem',color:'#888',fontWeight:600}}>Right → Left</span>
            </div>
            <div className="writing-box">
              <div className="writing-line" style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                {reverseSubmitted&&reverseCorrect&&<span className="check-mark" style={{color:'#4CAF50',fontSize:'1.3rem',fontWeight:900}}>✓</span>}
                {reverseSubmitted&&reverseCorrect===false&&<span className="x-mark" style={{color:'#f44336',fontSize:'1.3rem',fontWeight:900}}>✗</span>}
                <input type="text" className={`writing-input ${reverseSubmitted?(reverseCorrect?'correct-input':'incorrect-input'):''}`}
                  value={reverseInput} placeholder="Type numbers BACKWARDS (e.g. 7 4)"
                  onChange={e=>!reverseSubmitted&&setReverseInput(e.target.value)}
                  disabled={reverseSubmitted||isPlaying}
                  style={{flex:1,padding:'0.6rem 0.9rem',border:'2px solid #ddd',borderRadius:'1rem',fontSize:'1rem'}}/>
              </div>
              <div className="writing-hint" style={{fontSize:'0.75rem',color:'#888',marginTop:'0.4rem',fontStyle:'italic'}}>Write the numbers in REVERSE order (last to first)</div>
            </div>
            {!reverseSubmitted&&<button className="submit-btn reverse-btn" onClick={handleReverseSubmit} disabled={!reverseInput.trim()||isPlaying} style={{width:'100%',padding:'0.65rem',background:'#FFB84D',color:'#333',border:'none',borderRadius:'1.5rem',fontWeight:700,marginTop:'0.5rem',cursor:'pointer'}}>🔄 Submit Reverse</button>}
            {reverseSubmitted&&reverseCorrect&&<div className="feedback-badge correct-badge" style={{background:'#e8f5e9',color:'#2e7d32',padding:'0.5rem',borderRadius:'1rem',textAlign:'center',marginTop:'0.5rem'}}>🎉 Correct!</div>}
            {reverseSubmitted&&reverseCorrect===false&&<div className="feedback-badge incorrect-badge" style={{background:'#ffebee',color:'#c62828',padding:'0.5rem',borderRadius:'1rem',textAlign:'center',marginTop:'0.5rem',fontSize:'0.8rem'}}>Correct reverse: {[...currentSeq.numbers].reverse().join(' → ')}</div>}
          </div>
        </div>

        <div className="character-area" style={{position:'relative',display:'flex',flexDirection:'column',alignItems:'center',marginTop:'0.5rem'}}>
          <div className="character-thinking" style={{fontSize:'2.5rem',animation:'float 3s ease-in-out infinite'}}>🐵</div>
          <div className="speech-bubble" style={{position:'absolute',top:'-60px',left:'50%',transform:'translateX(-50%)',background:'white',padding:'0.6rem 1.2rem',borderRadius:'1.5rem',boxShadow:'0 4px 12px rgba(0,0,0,0.1)',fontSize:'0.85rem',fontWeight:600,color:'#3D5A4C',whiteSpace:'nowrap'}}>
            {isPlaying?'🎤 Listen carefully!':!forwardSubmitted?'✏️ Write the numbers FORWARD first!':!reverseSubmitted?'🔄 Now write them in REVERSE!':'🎉 Moving to next sequence…'}
          </div>
        </div>

        {isPaused&&(
          <div className="pause-overlay-full" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(5px)',display:'flex',justifyContent:'center',alignItems:'center',zIndex:1000}}>
            <div className="pause-content-card" style={{background:'white',padding:'2rem',borderRadius:'2rem',textAlign:'center',maxWidth:'350px',width:'90%'}}>
              <h2 style={{color:'#3D5A4C',fontSize:'1.5rem',marginBottom:'0.5rem'}}>⏸️ Game Paused</h2>
              <p style={{color:'#666',marginBottom:'1rem'}}>Your progress has been saved!</p>
              <button className="btn-resume-game" onClick={handleResume} style={{display:'block',width:'100%',margin:'0.5rem 0',padding:'0.8rem',background:'#3D5A4C',color:'white',border:'none',borderRadius:'2rem',cursor:'pointer',fontWeight:700}}>▶️ Resume</button>
              <button className="btn-quit-game" onClick={handleQuit} style={{display:'block',width:'100%',margin:'0.5rem 0',padding:'0.8rem',background:'#FFB84D',color:'#2C2C2C',border:'none',borderRadius:'2rem',cursor:'pointer',fontWeight:700}}>🏠 Save & Quit</button>
            </div>
          </div>
        )}
        {saving&&<div className="saving-overlay" style={{position:'fixed',bottom:'20px',right:'20px',background:'rgba(0,0,0,0.8)',color:'white',padding:'10px 20px',borderRadius:'30px',zIndex:1001,fontWeight:'bold'}}>💾 Saving...</div>}
        {saveError&&!saving&&<div className="error-notice" style={{position:'fixed',bottom:'20px',left:'20px',background:'rgba(244,67,54,0.9)',color:'white',padding:'10px 20px',borderRadius:'30px',zIndex:1001,fontWeight:'bold',fontSize:'0.85rem'}}>⚠️ {saveError}</div>}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .sound-wave-small span {
          display: inline-block;
          width: 4px;
          background: #3D5A4C;
          border-radius: 2px;
          animation: soundWave 0.8s ease-in-out infinite;
        }
        .sound-wave-small span:nth-child(1) { height: 12px; }
        .sound-wave-small span:nth-child(2) { height: 20px; animation-delay: 0.1s; }
        .sound-wave-small span:nth-child(3) { height: 16px; animation-delay: 0.2s; }
        .sound-wave-small span:nth-child(4) { height: 10px; animation-delay: 0.3s; }
        @keyframes soundWave {
          0%,100% { transform: scaleY(1); }
          50% { transform: scaleY(1.8); }
        }
      `}</style>
    </div>
  );
}