// frontend/src/components/tasks/TaskFour.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./TaskFour.css";
import { getChildInfo, getUserInfo, getCurrentChildSessionId } from "../../utils/childSession";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const TASK4_URL = `${API_URL}/api/task4/submit`;

const NUMBER_SEQUENCES = [
  { id:1,  numbers:[4,7],          length:2, responseTime:10 },
  { id:2,  numbers:[3,8,1],        length:3, responseTime:15 },
  { id:3,  numbers:[6,2,9,5],      length:4, responseTime:20 },
  { id:4,  numbers:[1,4,7,2,8],    length:5, responseTime:25 },
  { id:5,  numbers:[5,0,9,3,6,1],  length:6, responseTime:30 },
  { id:6,  numbers:[2,6,4,8,0,7,3],length:7, responseTime:35 },
  { id:7,  numbers:[9,2],          length:2, responseTime:10 },
  { id:8,  numbers:[1,5,3],        length:3, responseTime:15 },
  { id:9,  numbers:[7,0,6,2,4],    length:5, responseTime:25 },
  { id:10, numbers:[8,3,1,9,5,2],  length:6, responseTime:30 },
];

const PROGRESS_KEY = 'task4_progress';
const saveLocal  = (idx, results, fi, ri, fs, rs, fc, rc) =>
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({ currentIndex:idx, results, forwardInput:fi, reverseInput:ri, forwardSubmitted:fs, reverseSubmitted:rs, forwardCorrect:fc, reverseCorrect:rc, savedAt:Date.now() }));
const loadLocal  = () => { try { const r=localStorage.getItem(PROGRESS_KEY); return r?JSON.parse(r):null; } catch{return null;} };
const clearLocal = () => localStorage.removeItem(PROGRESS_KEY);

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

export default function TaskFour() {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, []);

  const navigate = useNavigate();
  const [sequences]         = useState(NUMBER_SEQUENCES);
  const [currentIndex,      setCurrentIndex]      = useState(0);
  const [forwardInput,      setForwardInput]      = useState('');
  const [reverseInput,      setReverseInput]      = useState('');
  const [forwardSubmitted,  setForwardSubmitted]  = useState(false);
  const [reverseSubmitted,  setReverseSubmitted]  = useState(false);
  const [forwardCorrect,    setForwardCorrect]    = useState(null);
  const [reverseCorrect,    setReverseCorrect]    = useState(null);
  const [results,           setResults]           = useState([]);
  const [isPlaying,         setIsPlaying]         = useState(false);
  const [isPaused,          setIsPaused]          = useState(false);
  const [saving,            setSaving]            = useState(false);
  const [saveError,         setSaveError]         = useState('');
  const [showResumePrompt,  setShowResumePrompt]  = useState(false);
  const [pendingProgress,   setPendingProgress]   = useState(null);
  const [markedCompleted,   setMarkedCompleted]   = useState(false);
  const [showSkipConfirm,   setShowSkipConfirm]   = useState(false);

  const isPausedRef   = useRef(false);
  const playTokenRef  = useRef(0);
  const startTimeRef  = useRef(Date.now());
  const totalPausedMs = useRef(0);
  const pausedAtRef   = useRef(null);
  const autoAdvRef    = useRef(null);
  const isMountedRef  = useRef(true);

  const currentSeq = sequences[currentIndex];
  const progress   = (currentIndex / sequences.length) * 100;

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
    if (p && p.currentIndex>0 && p.currentIndex<sequences.length) {
      setPendingProgress(p); setShowResumePrompt(true);
    } else {
      setTimeout(()=>playSequence([...NUMBER_SEQUENCES[0].numbers]),500);
    }
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
    if (forwardSubmitted && reverseSubmitted) {
      autoAdvRef.current = setTimeout(handleNext, 1500);
    }
    return () => { if(autoAdvRef.current) clearTimeout(autoAdvRef.current); };
  }, [forwardSubmitted, reverseSubmitted]);

  const buildPayload = useCallback((res) => {
    const childSessionId = getCurrentChildSessionId();
    if (!childSessionId) throw new Error('No active child session ID');
    const user = getUserInfo();
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
      await axios.post(TASK4_URL, payload, {
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
    } catch (err) {
      setSaveError('Progress saved locally.');
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
      await finishAndRedirect(updated);
    } else {
      const next = currentIndex+1;
      setCurrentIndex(next);
      setForwardInput(''); setReverseInput('');
      setForwardSubmitted(false); setReverseSubmitted(false);
      setForwardCorrect(null); setReverseCorrect(null);
      clearLocal();
      setTimeout(()=>playSequence([...sequences[next].numbers]), 600);
    }
  }, [currentIndex, forwardCorrect, reverseCorrect, forwardInput, reverseInput, results, sequences, stopSpeech, playSequence, saveResultsToDB]);

  const finishAndRedirect = async (finalResults) => {
    stopSpeech(); clearLocal();
    const totalPossible = sequences.length * 2;
    let correctCount = 0;
    finalResults.forEach(r => { if(r.forward_correct) correctCount++; if(r.reverse_correct) correctCount++; });
    const pct = Math.round((correctCount / totalPossible) * 100);
    const data = {
      totalPossible, correctCount, percentage: pct,
      totalTimeSeconds: Math.floor((Date.now() - startTimeRef.current - totalPausedMs.current) / 1000),
      sequenceDetails: finalResults
    };
    localStorage.setItem('task4_results', JSON.stringify(data));
    if (pct >= 40 && !markedCompleted) { markQuestCompleted(); setMarkedCompleted(true); }
    await saveResultsToDB(finalResults, false);
    navigate('/assessment/results');
  };

  const handleSkipToResults = async () => {
    stopSpeech();
    if (autoAdvRef.current) clearTimeout(autoAdvRef.current);
    let finalResults = [...results];
    if (forwardSubmitted) {
      const current = {
        sequence_id: currentSeq.id, original_numbers:[...currentSeq.numbers],
        forward_correct: forwardCorrect, reverse_correct: reverseCorrect,
        forward_user_input: forwardInput, reverse_user_input: reverseInput,
        sequence_length: currentSeq.length
      };
      if (!finalResults.some(r => r.sequence_id === currentSeq.id)) finalResults.push(current);
    }
    await finishAndRedirect(finalResults);
  };

  const handlePause = async () => {
    if (isPaused) {
      if(pausedAtRef.current){totalPausedMs.current+=Date.now()-pausedAtRef.current;pausedAtRef.current=null;}
      setIsPaused(false);
    } else {
      stopSpeech(); pausedAtRef.current=Date.now(); setIsPaused(true);
      saveLocal(currentIndex, results, forwardInput, reverseInput, forwardSubmitted, reverseSubmitted, forwardCorrect, reverseCorrect);
      if (results.length > 0) await saveResultsToDB(results, true);
    }
  };

  const handleBack = () => { stopSpeech(); navigate('/adventure'); };

  if (showResumePrompt) return (
    <div className="t4-shell">
      <div className="t4-bg"/><div className="t4-overlay"/>
      <div className="t4-modal-center">
        <div className="t4-dialog">
          <div className="t4-dialog-icon">💾</div>
          <h2>Welcome Back!</h2>
          <p>You were on sequence <strong>{pendingProgress?.currentIndex+1}</strong> of {sequences.length}.</p>
          <div className="t4-dialog-btns">
            <button className="t4-btn t4-btn--green" onClick={handleResumeSaved}>Continue</button>
            <button className="t4-btn t4-btn--red"   onClick={handleStartFresh}>Start Over</button>
          </div>
        </div>
      </div>
    </div>
  );

  if (showSkipConfirm) return (
    <div className="t4-shell">
      <div className="t4-bg"/><div className="t4-overlay"/>
      <div className="t4-modal-center">
        <div className="t4-dialog">
          <div className="t4-dialog-icon">⏭</div>
          <h2>Skip to Results?</h2>
          <p>{results.length} of {sequences.length} sequences completed.</p>
          <p className="t4-dialog-warn">Results will be based on completed sequences only.</p>
          <div className="t4-dialog-btns">
            <button className="t4-btn t4-btn--ghost" onClick={()=>setShowSkipConfirm(false)}>Cancel</button>
            <button className="t4-btn t4-btn--amber" onClick={handleSkipToResults}>Yes, Show Results</button>
          </div>
        </div>
      </div>
    </div>
  );

  // MAIN ASSESSMENT SCREEN with DS logo exactly like TaskOne
  return (
    <div className="t4-shell">
      <div className="t4-bg"/><div className="t4-overlay"/>

      <div className="assessment-header-bar">
        <div className="header-left">
          {/* DS logo exactly like TaskOne */}
          <div className="task-logo-icon">DS</div>
          <button className="btn-pause" onClick={handlePause}>
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <span className="category-name">Number Memory</span>
        </div>
        <div className="header-center">
          <div className="progress-display">
            {isPlaying ? (
              <span className="t4-listening-pulse">Listening…</span>
            ) : (
              `Sequence ${currentIndex+1} of ${sequences.length}`
            )}
          </div>
        </div>
        <div className="header-right">
          <button
            className="t4-replay-btn"
            onClick={()=>!isPlaying&&!isPaused&&playSequence([...currentSeq.numbers])}
            disabled={isPlaying||isPaused}
          >
            Replay
          </button>
          <button className="t4-skip-btn" onClick={()=>setShowSkipConfirm(true)}>
            Skip to Results
          </button>
        </div>
      </div>

      <div className="assessment-progress-bar">
        <div className="assessment-progress-fill" style={{ width:`${progress}%` }}/>
      </div>

      <div className="t4-content">

        {isPlaying && (
          <div className="t4-listening-banner">
            <div className="t4-soundwave">
              <span/><span/><span/><span/><span/>
            </div>
            <span>Listen carefully — one second between numbers</span>
          </div>
        )}

        <div className="t4-seq-info">
          <span className="t4-seq-dots">
            {currentSeq.numbers.map((_, i) => (
              <span key={i} className="t4-dot"/>
            ))}
          </span>
          <span className="t4-seq-label">{currentSeq.length} numbers</span>
        </div>

        <div className="t4-cards">
          <div className={`t4-card${forwardSubmitted ? (forwardCorrect ? ' t4-card--correct' : ' t4-card--wrong') : ''}`}>
            <div className="t4-card-head">
              <div className="t4-card-tag t4-card-tag--fwd">Forward</div>
              <span className="t4-card-dir">Same order you heard</span>
            </div>
            <div className="t4-input-wrap">
              <input
                type="text"
                className={`t4-input${forwardSubmitted ? (forwardCorrect ? ' t4-input--ok' : ' t4-input--err') : ''}`}
                value={forwardInput}
                placeholder="e.g. 4 7"
                onChange={e=>!forwardSubmitted&&setForwardInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&handleForwardSubmit()}
                disabled={forwardSubmitted||isPlaying}
              />
              {forwardSubmitted && (
                <span className={`t4-result-icon${forwardCorrect?' t4-result-icon--ok':' t4-result-icon--err'}`}>
                  {forwardCorrect ? '✓' : '✗'}
                </span>
              )}
            </div>
            {!forwardSubmitted ? (
              <button
                className="t4-submit-btn t4-submit-btn--fwd"
                onClick={handleForwardSubmit}
                disabled={!forwardInput.trim()||isPlaying}
              >
                Submit Forward
              </button>
            ) : (
              <div className={`t4-feedback${forwardCorrect ? ' t4-feedback--ok' : ' t4-feedback--err'}`}>
                {forwardCorrect ? 'Correct!' : `Answer: ${currentSeq.numbers.join(' ')}`}
              </div>
            )}
          </div>

          <div className={`t4-card${reverseSubmitted ? (reverseCorrect ? ' t4-card--correct' : ' t4-card--wrong') : ''}`}>
            <div className="t4-card-head">
              <div className="t4-card-tag t4-card-tag--rev">Reverse</div>
              <span className="t4-card-dir">Backwards — last to first</span>
            </div>
            <div className="t4-input-wrap">
              <input
                type="text"
                className={`t4-input${reverseSubmitted ? (reverseCorrect ? ' t4-input--ok' : ' t4-input--err') : ''}`}
                value={reverseInput}
                placeholder="e.g. 7 4"
                onChange={e=>!reverseSubmitted&&setReverseInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&handleReverseSubmit()}
                disabled={reverseSubmitted||isPlaying}
              />
              {reverseSubmitted && (
                <span className={`t4-result-icon${reverseCorrect?' t4-result-icon--ok':' t4-result-icon--err'}`}>
                  {reverseCorrect ? '✓' : '✗'}
                </span>
              )}
            </div>
            {!reverseSubmitted ? (
              <button
                className="t4-submit-btn t4-submit-btn--rev"
                onClick={handleReverseSubmit}
                disabled={!reverseInput.trim()||isPlaying}
              >
                Submit Reverse
              </button>
            ) : (
              <div className={`t4-feedback${reverseCorrect ? ' t4-feedback--ok' : ' t4-feedback--err'}`}>
                {reverseCorrect ? 'Correct!' : `Answer: ${[...currentSeq.numbers].reverse().join(' ')}`}
              </div>
            )}
          </div>
        </div>

        {saving    && <div className="t4-notice t4-notice--saving">Saving…</div>}
        {saveError && !saving && <div className="t4-notice t4-notice--error">{saveError}</div>}
      </div>

      {isPaused && (
        <div className="t4-pause-overlay">
          <div className="t4-pause-card">
            <div className="t4-pause-icon">⏸</div>
            <h2>Paused</h2>
            <p>Your progress has been saved.</p>
            <button className="t4-btn t4-btn--green t4-btn--wide" onClick={handlePause}>Resume</button>
            <button className="t4-btn t4-btn--ghost t4-btn--wide" onClick={handleBack}>Save & Quit</button>
          </div>
        </div>
      )}
    </div>
  );
}