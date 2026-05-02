// frontend/src/components/AssessmentResults.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getCurrentChildSessionId, getChildInfo } from '../../utils/childSession';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ─── palette ────────────────────────────────────────────────── */
const C = {
  forest:   '#3D5A4C',
  forestDk: '#2C4238',
  forestLt: '#4E7260',
  beige:    '#F5F0E8',
  beigeDk:  '#EBE4D8',
  beigeXdk: '#D9CFBF',
  gold:     '#FFB84D',
  goldDk:   '#E09A30',
  ink:      '#1E2D25',
  mist:     '#8FA898',
  white:    '#FFFFFF',
};

/* ─── task definitions ───────────────────────────────────────── */
const TASKS = [
  { key: 'task1', label: 'Word Explorer',   sub: 'Vocabulary & word recognition',   num: '01' },
  { key: 'task2', label: 'Story Reader',    sub: 'Reading fluency & comprehension',  num: '02' },
  { key: 'task3', label: 'Letter Detective',sub: 'Phonological awareness',           num: '03' },
  { key: 'task4', label: 'Number Memory',   sub: 'Working memory & sequencing',      num: '04' },
];

/* ─── TASK WEIGHTS ───────────────────────────────────────────── */
const TASK_WEIGHTS = {
  task1: 2,  // Word Explorer
  task2: 2,  // Story Reader
  task3: 3,  // Letter Detective
  task4: 1,  // Number Memory
};

const USE_WEIGHTED_SCORE = true;

/* ─── RISK CLASSIFICATION (new thresholds 85/70/50) ──────────── */
const RISK = {
  'Normal':   { label: 'Normal Range',      accent: '#3D5A4C', bg: '#EAF1EC', text: 'No signs of dyslexia detected. Your child is performing within the expected range. Continue encouraging daily reading and language exploration.' },
  'Mild':     { label: 'Mild Difficulties', accent: '#8A6000', bg: '#FFF5E0', text: 'Slight difficulties observed. Monitor progress and consider light structured reading support. Early awareness is key.' },
  'Moderate': { label: 'Moderate Risk',     accent: '#CC7B00', bg: '#FFF0D0', text: 'Clear signs of reading challenges. Targeted reading support and structured exercises are strongly recommended.' },
  'Severe':   { label: 'Severe Risk',       accent: '#8B2020', bg: '#FDECEA', text: 'Strong indicators of dyslexia. A specialist evaluation is urgently advised — early intensive intervention has the most significant positive impact.' },
};

/* ─── CLASSIFY & RECOMMEND (based on 85/70/50) ───────────────── */
const classify = (s) => {
  if (s == null) return { label: 'Not Assessed', c: C.mist };
  const rounded = Math.round(s);
  if (rounded >= 85) return { label: 'Normal', c: C.forest };
  if (rounded >= 70) return { label: 'Mild', c: '#8A6000' };
  if (rounded >= 50) return { label: 'Moderate', c: '#CC7B00' };
  return { label: 'Severe', c: '#8B2020' };
};

const recommend = (s) => {
  if (s == null) return 'Complete this task to receive a personalised recommendation.';
  const rounded = Math.round(s);
  if (rounded >= 85) return 'Excellent performance. Maintain current habits and introduce more complex reading material.';
  if (rounded >= 70) return 'Solid foundation with minor gaps. Daily phonics exercises and structured reading will help.';
  if (rounded >= 50) return 'Focused intervention is advised. A specialist can design a targeted programme for this domain.';
  return 'Significant challenges detected. Immediate specialist evaluation and intensive intervention are strongly recommended.';
};

/* ─── SCORING HELPERS ───────────────────────────────────────── */
const calculateOverallScore = (scores) => {
  const tasksCompleted = Object.values(scores).filter(s => s != null);
  if (tasksCompleted.length === 0) return null;

  if (!USE_WEIGHTED_SCORE) {
    const sum = tasksCompleted.reduce((a, b) => a + b, 0);
    return Math.round(sum / tasksCompleted.length);
  } else {
    let totalWeightedScore = 0;
    let totalWeight = 0;
    for (const [taskKey, weight] of Object.entries(TASK_WEIGHTS)) {
      const score = scores[taskKey];
      if (score != null) {
        totalWeightedScore += score * weight;
        totalWeight += weight;
      }
    }
    if (totalWeight === 0) return null;
    return Math.round(totalWeightedScore / totalWeight);
  }
};

const getRiskLevelFromScore = (score) => {
  if (score == null) return null;
  if (score >= 85) return 'Normal';
  if (score >= 70) return 'Mild';
  if (score >= 50) return 'Moderate';
  return 'Severe';
};

/* ─── CHART COMPONENTS ───────────────────────────────────────── */
function GaugeArc({ score, size = 220 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (score == null) return;
    let c = 0;
    const step = score / 90;
    const id = setInterval(() => {
      c += step;
      if (c >= score) {
        setV(score);
        clearInterval(id);
      } else {
        setV(Math.round(c));
      }
    }, 16);
    return () => clearInterval(id);
  }, [score]);

  const roundedScore = score != null ? Math.round(score) : null;
  let barColor = '#D9CFBF';
  let textColor = '#8FA898';
  if (roundedScore >= 85) {
    barColor = '#3D5A4C';
    textColor = '#3D5A4C';
  } else if (roundedScore >= 70) {
    barColor = '#8A6000';
    textColor = '#8A6000';
  } else if (roundedScore >= 50) {
    barColor = '#CC7B00';
    textColor = '#CC7B00';
  } else if (roundedScore != null) {
    barColor = '#8B2020';
    textColor = '#8B2020';
  }

  const percentage = v;
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ textAlign: 'center', position: 'relative', width: size, margin: '0 auto' }}>
      <svg width={size} height={size * 0.65} viewBox="0 0 200 130">
        <path d="M 30 110 A 70 70 0 0 1 170 110" fill="none" stroke="#D9CFBF" strokeWidth="12" strokeLinecap="round" />
        {score != null && v > 0 && (
          <path d="M 30 110 A 70 70 0 0 1 170 110" fill="none" stroke={barColor} strokeWidth="12" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 0.05s linear' }} />
        )}
        <text x="100" y="85" textAnchor="middle" dominantBaseline="middle" fill={score != null ? textColor : '#8FA898'}
              fontSize="36" fontWeight="700" fontFamily="'DM Serif Display', serif">
          {roundedScore != null ? `${roundedScore}%` : '—'}
        </text>
        <text x="100" y="110" textAnchor="middle" dominantBaseline="middle" fill="#8FA898" fontSize="9"
              fontWeight="600" fontFamily="'Nunito', sans-serif" letterSpacing="3">OVERALL SCORE</text>
      </svg>
    </div>
  );
}

function Ring({ score, size = 72 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (score == null) return;
    let c = 0;
    const step = score / 55;
    const id = setInterval(() => {
      c += step;
      if (c >= score) {
        setV(score);
        clearInterval(id);
      } else {
        setV(Math.round(c));
      }
    }, 16);
    return () => clearInterval(id);
  }, [score]);

  const center = size / 2;
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (v / 100) * circumference;
  const { c: color } = classify(score);
  const displayScore = score != null ? Math.round(score) : null;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke={C.beigeXdk} strokeWidth={6} />
        {score != null && (
          <circle cx={center} cy={center} r={radius} fill="none" stroke={color} strokeWidth={6}
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round" transform={`rotate(-90 ${center} ${center})`}
                  style={{ transition: 'stroke-dashoffset 0.05s linear' }} />
        )}
      </svg>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    textAlign: 'center', fontSize: size / 4.2, fontWeight: 700, fontFamily: "'DM Serif Display', serif",
                    color: score != null ? color : C.mist }}>
        {displayScore != null ? `${displayScore}%` : '—'}
      </div>
    </div>
  );
}

function BarChart({ scores, animate }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:'1rem', height:140 }}>
      {TASKS.map(({ key, label }) => {
        const sc = scores[key];
        const pct = sc != null ? Math.round(sc) : 0;
        const { c } = classify(sc);
        return (
          <div key={key} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'0.4rem' }}>
            <span style={{ fontSize:'0.72rem', fontWeight:700, color: sc!=null ? c : C.mist, fontFamily:"'Nunito', sans-serif" }}>
              {sc != null ? `${pct}%` : '—'}
            </span>
            <div style={{ width:'100%', height:110, background:C.beigeXdk, borderRadius:'6px 6px 0 0', display:'flex', alignItems:'flex-end', overflow:'hidden' }}>
              <div style={{ width:'100%', background: c, borderRadius:'6px 6px 0 0',
                            height: animate ? `${pct}%` : '0%', transition:'height 1.4s cubic-bezier(0.22,1,0.36,1)' }} />
            </div>
            <span style={{ fontSize:'0.58rem', fontWeight:800, color:C.mist, letterSpacing:'0.06em', textAlign:'center', fontFamily:"'Nunito', sans-serif", lineHeight:1.2 }}>
              {label.split(' ').map((w,i)=> <span key={i} style={{display:'block'}}>{w}</span>)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Radar({ scores }) {
  const cx=145, cy=140, r=100, keys=['task1','task2','task3','task4'];
  const labels=['Word\nExplorer','Story\nReader','Letter\nDetective','Number\nMemory'];
  const angle = i => (Math.PI*2*i/keys.length) - Math.PI/2;
  const pts = keys.map((k,i)=>{ const v=(scores[k]??0)/100; return [cx+r*v*Math.cos(angle(i)), cy+r*v*Math.sin(angle(i))]; });
  const grid = f => keys.map((_,i)=>`${cx+r*f*Math.cos(angle(i))},${cy+r*f*Math.sin(angle(i))}`).join(' ');
  return (
    <svg viewBox="0 0 290 280" style={{ width:'100%', maxWidth:270, display:'block', margin:'0 auto' }}>
      {[0.25,0.5,0.75,1].map(f=><polygon key={f} points={grid(f)} fill={f===0.5||f===1?`rgba(61,90,76,${f===1?0.06:0.03})`:'none'} stroke={C.beigeXdk} strokeWidth={f===1?1.5:0.8}/>)}
      {keys.map((_,i)=><line key={i} x1={cx} y1={cy} x2={cx+r*Math.cos(angle(i))} y2={cy+r*Math.sin(angle(i))} stroke={C.beigeXdk} strokeWidth={1}/>)}
      <polygon points={pts.map(p=>p.join(',')).join(' ')} fill={`rgba(61,90,76,0.14)`} stroke={C.forest} strokeWidth={2.5} strokeLinejoin="round"/>
      {pts.map((p,i)=>{ const {c}=classify(scores[keys[i]]); return <circle key={i} cx={p[0]} cy={p[1]} r={5} fill={c} stroke={C.beige} strokeWidth={2}/> })}
      {keys.map((_,i)=>{
        const lx=cx+(r+28)*Math.cos(angle(i)), ly=cy+(r+28)*Math.sin(angle(i)), lines=labels[i].split('\n');
        return <text key={i} textAnchor="middle" fontSize={9} fontWeight="800" fill={C.ink} fontFamily="'Nunito', sans-serif">
          {lines.map((ln,li)=><tspan key={li} x={lx} y={ly+(li-(lines.length-1)/2)*12}>{ln}</tspan>)}
        </text>;
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function AssessmentResults() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(false);

  // Restore body scroll — TaskFour locks it, we need to release it here
  useEffect(() => {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  }, []);

  useEffect(() => {
    const finalizeAndFetch = async () => {
      const childSessionId = getCurrentChildSessionId();
      if (!childSessionId) {
        console.warn('No child_session_id found – using local data only');
        buildLocal();
        setLoading(false);
        return;
      }

      // First, tell the backend to compute and save the summary
      try {
        await axios.post(`${API_URL}/api/assessment/finalize/${childSessionId}`);
        console.log('✅ Summary saved to database');
      } catch (err) {
        console.warn('Could not save summary to backend:', err.message);
      }

      // Then fetch the summary (which will come from the DB or be computed again)
      try {
        const res = await axios.get(`${API_URL}/api/assessment/summary/${childSessionId}`);
        if (res.data.success) {
          setData(res.data);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Backend fetch failed – falling back to local storage', err);
      }
      buildLocal();
      setLoading(false);
    };

    finalizeAndFetch();
  }, []);

  useEffect(() => {
    if (data) {
      setTimeout(() => setVisible(true), 100);
      setTimeout(() => setAnimate(true), 700);
    }
  }, [data]);

  const buildLocal = () => {
    const ci = getChildInfo();
    const gt = (key) => {
      try {
        const raw = localStorage.getItem(`${key}_results`);
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    };
    const t1 = gt('task1');
    const t2 = JSON.parse(localStorage.getItem('enhanced_voice_results') || 'null');
    const t3 = gt('task3');
    const t4 = gt('task4');

    const scores = {
      task1: t1?.percentage ?? null,
      task2: t2?.percentage ?? null,
      task3: t3?.percentage ?? null,
      task4: t4?.percentage ?? null,
    };
    const overall = calculateOverallScore(scores);
    const riskLevel = getRiskLevelFromScore(overall);
    const tasksCompleted = Object.values(scores).filter(s => s != null).length;

    setData({
      session: {
        childName: ci?.childFullName || ci?.childName || 'Your Child',
        childGrade: ci?.childGrade || '—',
        createdAt: new Date().toISOString(),
      },
      tasks: {
        task1: t1 ? { score: t1.percentage, level: t1.performance_level } : null,
        task2: t2 ? { score: t2.percentage, level: t2.fluency_level } : null,
        task3: t3 ? { score: t3.percentage, level: t3.performance_level } : null,
        task4: t4 ? { score: t4.percentage, level: t4.performance_level } : null,
      },
      summary: { overallScore: overall, riskLevel, tasksCompleted },
    });
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:C.beige, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:48, height:48, margin:'0 auto', border:`4px solid ${C.beigeXdk}`, borderTop:`4px solid ${C.forest}`, borderRadius:'50%', animation:'spin 0.9s linear infinite' }} />
          <p style={{ color:C.mist, fontFamily:"'Nunito', sans-serif", marginTop:'1.5rem', fontWeight:600 }}>Preparing your report…</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!data) return null;
  const { session, tasks, summary } = data;
  const risk = summary.riskLevel ? RISK[summary.riskLevel] : null;
  const scores = { task1:tasks.task1?.score??null, task2:tasks.task2?.score??null, task3:tasks.task3?.score??null, task4:tasks.task4?.score??null };
  const date = session.createdAt ? new Date(session.createdAt).toLocaleDateString('en-US',{ year:'numeric', month:'long', day:'numeric' }) : '';

  return (
    <div style={{ minHeight:'100vh', background:C.beige, fontFamily:"'Nunito', sans-serif", color:C.ink, opacity:visible?1:0, transition:'opacity 0.8s ease', overflowY:'auto', overflowX:'hidden' }}>
      <style>{GLOBAL_CSS}</style>

      {/* NAV */}
      <nav className="no-print" style={{ position:'sticky', top:0, zIndex:100, background:C.forest, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.85rem 2.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.85rem' }}>
          <div style={{ width:36, height:36, background:C.gold, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:'0.8rem', color:C.ink, fontFamily:"'DM Serif Display', serif" }}>DS</div>
          <span style={{ color:C.beige, fontFamily:"'DM Serif Display', serif", fontSize:'1.1rem', fontWeight:400 }}>Dyslexia Support</span>
        </div>
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <button className="btn-ghost-nav" onClick={()=>navigate('/adventure')}>Back</button>
          <button className="btn-gold" onClick={()=>window.print()}>Print Report</button>
        </div>
      </nav>

      {/* HERO BAND */}
      <section style={{ background:`linear-gradient(135deg, ${C.forestDk} 0%, ${C.forest} 60%, ${C.forestLt} 100%)`, padding:'4rem 2.5rem 0', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-80, right:-80, width:300, height:300, borderRadius:'50%', border:`1px solid rgba(255,255,255,0.06)` }} />
        <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, borderRadius:'50%', border:`1px solid rgba(255,255,255,0.06)` }} />
        <div style={{ position:'absolute', bottom:0, left:-60, width:250, height:250, borderRadius:'50%', border:`1px solid rgba(255,255,255,0.05)` }} />

        <div style={{ margin:'0 auto' }}>
          <p style={{ color:`rgba(255,184,77,0.9)`, fontSize:'0.68rem', fontWeight:800, letterSpacing:'0.22em', textTransform:'uppercase', margin:'0 0 1rem' }}>Dyslexia Screening Assessment</p>

          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'2rem', alignItems:'flex-end', flexWrap:'wrap' }}>
            <div>
              <h1 style={{ fontFamily:"'DM Serif Display', serif", fontSize:'clamp(2.4rem,6vw,4rem)', fontWeight:400, color:C.white, margin:'0 0 1.25rem', lineHeight:1.1 }}>
                {session.childName}
                <span style={{ display:'block', color:`rgba(255,255,255,0.45)`, fontSize:'clamp(1rem,2.5vw,1.4rem)', fontWeight:400, marginTop:'0.4rem', fontFamily:"'Nunito', sans-serif" }}>
                  Grade {session.childGrade} &nbsp;·&nbsp; {date}
                </span>
              </h1>
              <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', marginBottom:'2.5rem' }}>
                {[`${summary.tasksCompleted} of 4 Tasks Completed`, summary.riskLevel || 'Pending Review'].map((chip,i)=>(
                  <span key={i} style={{ background:`rgba(255,255,255,0.1)`, border:`1px solid rgba(255,255,255,0.18)`, color:'rgba(255,255,255,0.85)', fontSize:'0.78rem', fontWeight:700, padding:'0.3rem 0.9rem', borderRadius:100, backdropFilter:'blur(6px)' }}>{chip}</span>
                ))}
              </div>
            </div>
            <div style={{ background:C.beige, borderRadius:'1.25rem 1.25rem 0 0', padding:'1.5rem 2rem 0', textAlign:'center', boxShadow:'0 -8px 40px rgba(0,0,0,0.12)', minWidth:200 }}>
              <GaugeArc score={summary.overallScore} size={210} />
            </div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth:'none', margin:'0 auto', padding:'2.5rem 3.5rem 6rem' }}>

        {/* RISK BANNER */}
        {risk && (
          <div style={{ background:risk.bg, border:`1.5px solid ${risk.accent}30`, borderRadius:'1rem', padding:'1.5rem 2rem', display:'flex', alignItems:'center', gap:'1.5rem', marginBottom:'3rem', flexWrap:'wrap' }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:risk.accent, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background:C.white, opacity:0.9 }} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:'1.25rem', color:risk.accent, marginBottom:'0.3rem' }}>{risk.label}</div>
              <p style={{ margin:0, fontSize:'0.86rem', color:C.ink, opacity:0.75, lineHeight:1.7 }}>{risk.text}</p>
            </div>
            {summary.overallScore != null && (
              <div style={{ textAlign:'center', flexShrink:0 }}>
                <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:'2.6rem', color:risk.accent, lineHeight:1 }}>{Math.round(summary.overallScore)}%</div>
                <div style={{ fontSize:'0.65rem', fontWeight:800, color:risk.accent, opacity:0.6, letterSpacing:'0.12em' }}>AVG SCORE</div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 1 — TASK RESULTS */}
        <Band n="01" title="Individual Task Results" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:'1.25rem', marginBottom:'1rem' }}>
          {TASKS.map(({ key, label, sub, num }) => {
            const t = tasks[key];
            const sc = t?.score ?? null;
            const { label:clsLabel, c } = classify(sc);
            return (
              <div key={key} className="task-card" style={{ background:C.white, borderRadius:'1rem', overflow:'hidden', boxShadow:'0 2px 20px rgba(30,45,37,0.08)' }}>
                <div style={{ height:4, background:`linear-gradient(90deg, ${C.forest}, ${C.forestLt})` }} />
                <div style={{ padding:'1.5rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
                    <div>
                      <div style={{ fontSize:'0.6rem', fontWeight:800, color:C.mist, letterSpacing:'0.15em', marginBottom:'0.3rem' }}>{num}</div>
                      <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:'1.1rem', color:C.ink }}>{label}</div>
                      <div style={{ fontSize:'0.72rem', color:C.mist, marginTop:'0.2rem' }}>{sub}</div>
                    </div>
                    <Ring score={sc} size={68} />
                  </div>
                  {t?.level && <div style={{ fontSize:'0.7rem', fontStyle:'italic', color:C.mist, marginBottom:'0.85rem' }}>{t.level}</div>}
                  <div style={{ height:1, background:C.beigeDk, margin:'0 0 0.9rem' }} />
                  <span style={{ display:'inline-block', padding:'0.22rem 0.7rem', borderRadius:4, fontSize:'0.66rem', fontWeight:800, letterSpacing:'0.07em', textTransform:'uppercase', color:c, background:`${c}18`, marginBottom:'0.65rem' }}>{clsLabel}</span>
                  <p style={{ margin:0, fontSize:'0.79rem', color:'#4A5A50', lineHeight:1.7 }}>{recommend(sc)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* SECTION 2 — CHARTS */}
        <Band n="02" title="Performance Analysis" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem', marginBottom:'1.25rem' }}>
          <div style={{ background:C.white, borderRadius:'1rem', padding:'2rem', boxShadow:'0 2px 20px rgba(30,45,37,0.08)' }}>
            <ChartHead title="Score Comparison" sub="Performance across all four assessment domains" />
            <div style={{ marginTop:'1.5rem' }}><BarChart scores={scores} animate={animate} /></div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.75rem', paddingTop:'0.5rem', borderTop:`1px dashed ${C.beigeXdk}` }}>
              {[0,25,50,75,100].map(n=><span key={n} style={{ fontSize:'0.62rem', color:C.mist, fontWeight:700 }}>{n}%</span>)}
            </div>
          </div>
          <div style={{ background:C.white, borderRadius:'1rem', padding:'2rem', boxShadow:'0 2px 20px rgba(30,45,37,0.08)' }}>
            <ChartHead title="Skills Radar" sub="Holistic view of strengths and areas for growth" />
            <div style={{ marginTop:'0.5rem' }}><Radar scores={scores} /></div>
          </div>
        </div>

        {/* SECTION 3 — SCORING METHODOLOGY - BIGGER */}
        <Band n="03" title="Scoring Methodology" />
        <div style={{ 
          background: C.white, 
          borderRadius: '1.5rem', 
          padding: '2rem 2.5rem', 
          marginBottom: '2rem', 
          boxShadow: '0 4px 25px rgba(30,45,37,0.12)' 
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '2.5rem'
          }}>
            {/* Calculation Method Section */}
            <div style={{ 
              background: '#F8F9FA', 
              borderRadius: '1.25rem', 
              padding: '1.75rem'
            }}>
              <div style={{ 
                fontFamily: "'DM Serif Display', serif", 
                fontSize: '1.4rem', 
                color: C.forest, 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{ fontSize: '1.8rem' }}></span> Calculation Method
              </div>
              <p style={{ 
                fontSize: '1rem', 
                color: '#4A5A50', 
                lineHeight: 1.7, 
                margin: 0,
                marginBottom: '1.25rem'
              }}>
                {USE_WEIGHTED_SCORE
                  ? `Weighted average using task-specific weights. Some tasks (e.g., Letter Detective) are weighted higher due to their diagnostic importance for dyslexia.`
                  : `Simple average of all completed tasks — each assessment contributes equally to the final score.`}
              </p>
              {USE_WEIGHTED_SCORE && (
                <div style={{ 
                  marginTop: '1rem', 
                  fontSize: '0.95rem', 
                  color: C.mist,
                  background: 'rgba(61,90,76,0.08)',
                  padding: '1rem',
                  borderRadius: '1rem'
                }}>
                  <strong style={{ fontSize: '1rem', color: C.forest }}>Weights:</strong><br />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.75rem' }}>
                    <span> Word Explorer: <strong>{TASK_WEIGHTS.task1}</strong></span>
                    <span> Story Reader: <strong>{TASK_WEIGHTS.task2}</strong></span>
                    <span> Letter Detective: <strong>{TASK_WEIGHTS.task3}</strong></span>
                    <span> Number Memory: <strong>{TASK_WEIGHTS.task4}</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Interpretation Scale Section */}
            <div style={{ 
              background: '#F8F9FA', 
              borderRadius: '1.25rem', 
              padding: '1.75rem'
            }}>
              <div style={{ 
                fontFamily: "'DM Serif Display', serif", 
                fontSize: '1.4rem', 
                color: C.forest, 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{ fontSize: '1.8rem' }}></span> Interpretation Scale
              </div>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.8rem', 
                fontSize: '1rem'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  background: 'rgba(61,90,76,0.06)',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem'
                }}>
                  <span style={{ display: 'inline-block', width: 20, height: 20, borderRadius: 4, background: C.forest, marginRight: '0.5rem', flexShrink: 0 }} />
                  <span><strong>85–100%</strong> — Normal (no signs)</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  background: 'rgba(138,96,0,0.06)',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem'
                }}>
                  <span style={{ display: 'inline-block', width: 20, height: 20, borderRadius: 4, background: '#8A6000', marginRight: '0.5rem', flexShrink: 0 }} />
                  <span><strong>70–84%</strong> — Mild (monitor)</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  background: 'rgba(204,123,0,0.06)',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem'
                }}>
                  <span style={{ display: 'inline-block', width: 20, height: 20, borderRadius: 4, background: '#CC7B00', marginRight: '0.5rem', flexShrink: 0 }} />
                  <span><strong>50–69%</strong> — Moderate (support needed)</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  background: 'rgba(139,32,32,0.06)',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem'
                }}>
                  <span style={{ display: 'inline-block', width: 20, height: 20, borderRadius: 4, background: '#8B2020', marginRight: '0.5rem', flexShrink: 0 }} />
                  <span><strong>0–49%</strong> — Severe (intervention required)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ marginTop:'3rem', borderRadius:'1.25rem', overflow:'hidden', background:`linear-gradient(135deg, ${C.forestDk} 0%, ${C.forest} 100%)`, position:'relative' }}>
          <div style={{ position:'absolute', right:-60, top:-60, width:240, height:240, borderRadius:'50%', border:'1px solid rgba(255,184,77,0.12)' }} />
          <div style={{ position:'absolute', right:-20, top:-20, width:140, height:140, borderRadius:'50%', border:'1px solid rgba(255,184,77,0.12)' }} />
          <div style={{ position:'absolute', left:-40, bottom:-40, width:180, height:180, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.05)' }} />
          <div style={{ position:'relative', display:'grid', gridTemplateColumns:'1.8fr 1fr', gap:'3rem', padding:'3.5rem', alignItems:'center' }}>
            <div>
              <p style={{ margin:'0 0 0.5rem', fontSize:'0.68rem', fontWeight:800, letterSpacing:'0.22em', color:C.gold, textTransform:'uppercase' }}>Next Steps for {session.childName}</p>
              <h2 style={{ margin:'0 0 1.25rem', fontFamily:"'DM Serif Display', serif", fontSize:'2rem', fontWeight:400, color:C.white, lineHeight:1.25 }}>Turn These Results Into a Personalised Plan</h2>
              <p style={{ margin:'0 0 1.75rem', fontSize:'0.87rem', color:'rgba(255,255,255,0.72)', lineHeight:1.8 }}>Our certified specialists use assessments like this to design a customised intervention programme — targeting exactly the areas where your child needs support, while building on their existing strengths.</p>
              <ul style={{ listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:'0.65rem' }}>
                {['One-on-one sessions with a certified dyslexia specialist','Custom exercises built directly from these results','Weekly parent progress reports and guidance','School coordination and educator support'].map((item,i)=>(
                  <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem', fontSize:'0.85rem', color:'rgba(255,255,255,0.78)', lineHeight:1.6 }}>
                    <span style={{ color:C.gold, fontWeight:900, fontSize:'1rem', flexShrink:0, marginTop:'-0.05rem' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,184,77,0.25)', borderRadius:'1rem', padding:'2.25rem', textAlign:'center' }}>
              <p style={{ margin:'0 0 0.6rem', fontSize:'0.62rem', fontWeight:800, letterSpacing:'0.22em', color:C.gold, textTransform:'uppercase' }}>Free Initial Consultation</p>
              <p style={{ margin:'0 0 0.6rem', fontFamily:"'DM Serif Display', serif", fontSize:'1.35rem', color:C.white, lineHeight:1.3 }}>Ready to take the next step?</p>
              <p style={{ margin:'0 0 1.75rem', fontSize:'0.8rem', color:'rgba(255,255,255,0.6)', lineHeight:1.65 }}>A specialist will review these results with you within 48 hours of signing up.</p>
              <button className="btn-cta" onClick={()=>navigate('/auth')}
                style={{ width:'100%', background:`linear-gradient(135deg, ${C.gold}, ${C.goldDk})`, color:C.ink, border:'none', padding:'1rem', borderRadius:8, cursor:'pointer', fontWeight:800, fontSize:'0.95rem', fontFamily:"'Nunito', sans-serif", marginBottom:'0.85rem' }}>
                Create Your Account
              </button>
              <p style={{ margin:0, fontSize:'0.68rem', color:'rgba(255,255,255,0.35)' }}>No commitment required &nbsp;·&nbsp; Cancel anytime</p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer style={{ marginTop:'4rem', paddingTop:'2rem', borderTop:`1px solid ${C.beigeXdk}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'0.5rem', fontSize:'0.75rem', color:C.mist, fontWeight:600, marginBottom:'0.75rem' }}>
            <span>Dyslexia Support Platform &nbsp;·&nbsp; Screening Report &nbsp;·&nbsp; {date}</span>
            <span style={{ opacity:0.6 }}>{session.childName} · Grade {session.childGrade}</span>
          </div>
          <p style={{ margin:0, fontSize:'0.71rem', color:C.mist, lineHeight:1.75, opacity:0.8 }}>
            This report is a screening instrument and does not constitute a clinical diagnosis. Results should be reviewed by a qualified educational professional.
            Early identification and evidence-based intervention are strongly associated with improved literacy outcomes.
          </p>
        </footer>
      </div>
    </div>
  );
}

/* ─── small helpers ──────────────────────────────────────────── */
function Band({ n, title }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'1rem', margin:'3rem 0 1.5rem' }}>
      <span style={{ fontFamily:"'DM Serif Display', serif", fontSize:'2rem', color:C.beigeXdk, lineHeight:1, flexShrink:0 }}>{n}</span>
      <div style={{ height:1, background:`linear-gradient(90deg, ${C.beigeXdk}, transparent)`, flex:0.18 }} />
      <h2 style={{ margin:0, fontFamily:"'DM Serif Display', serif", fontSize:'1.45rem', fontWeight:400, color:C.ink, whiteSpace:'nowrap' }}>{title}</h2>
      <div style={{ flex:1, height:1, background:`linear-gradient(90deg, ${C.beigeXdk}, transparent)` }} />
    </div>
  );
}

function ChartHead({ title, sub }) {
  return (
    <>
      <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:'1.15rem', color:C.ink, marginBottom:'0.25rem' }}>{title}</div>
      <div style={{ fontSize:'0.74rem', color:C.mist }}>{sub}</div>
    </>
  );
}

/* ─── global css ─────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Nunito:wght@400;600;700;800;900&display=swap');
  @keyframes spin { to { transform: rotate(360deg); } }

  .btn-ghost-nav {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.25);
    color: rgba(255,255,255,0.85);
    padding: 0.42rem 1.1rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 700;
    font-size: 0.82rem;
    font-family: 'Nunito', sans-serif;
    transition: all 0.2s ease;
  }
  .btn-ghost-nav:hover {
    background: rgba(255,255,255,0.18);
    border-color: rgba(255,255,255,0.4);
  }
  .btn-gold {
    background: linear-gradient(135deg, #FFB84D, #E09A30);
    color: #1E2D25;
    border: none;
    padding: 0.5rem 1.2rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 800;
    font-size: 0.82rem;
    font-family: 'Nunito', sans-serif;
    transition: all 0.2s ease;
  }
  .btn-gold:hover { opacity: 0.88; transform: translateY(-1px); }

  .task-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .task-card:hover { transform: translateY(-4px); box-shadow: 0 12px 36px rgba(30,45,37,0.14) !important; }

  .btn-cta { transition: opacity 0.2s ease, transform 0.2s ease; }
  .btn-cta:hover { opacity: 0.88; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255,184,77,0.35) !important; }

  @media (max-width: 768px) {
    section > div { padding: 2rem 1.25rem 0 !important; }
    section > div > div:last-child { grid-template-columns: 1fr !important; }
    .scoring-methodology-grid { grid-template-columns: 1fr !important; }
  }
  @media print {
    .no-print { display: none !important; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  }
`;