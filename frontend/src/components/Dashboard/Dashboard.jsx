// Dashboard.jsx — LexiCare Clinical Portal (Old Design, Only Alphabet Swiping & Syllable Breaking)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  apiFetch, 
  fetchPatients, 
  fetchTherapistNotes, 
  addTherapistNote, 
  deleteTherapistNote, 
  fetchActivities, 
  fetchAssignments, 
  assignActivity, 
  sendTherapistMessage, 
  logout as apiLogout 
} from '../../services/api';
import './Dashboard.css';
import ChildAssessmentDetail from './ChildAssessmentDetail';

const BASE_URL = 'http://localhost:5000';

// ─── RISK CONFIG ──────────────────────────────────────────────
const RISK = {
  Normal:   { label: 'Normal',   color: '#1a6b40', bg: '#e6f5ee', dot: '#22c55e' },
  Mild:     { label: 'Mild',     color: '#92610a', bg: '#fef6e4', dot: '#f59e0b' },
  Moderate: { label: 'Moderate', color: '#9a3d12', bg: '#fff0e8', dot: '#f97316' },
  Severe:   { label: 'Severe',   color: '#8b1f1f', bg: '#feeaea', dot: '#ef4444' },
};
const getRisk = (s) => {
  if (s == null) return RISK.Normal;
  if (s >= 85) return RISK.Normal;
  if (s >= 70) return RISK.Mild;
  if (s >= 50) return RISK.Moderate;
  return RISK.Severe;
};
const getRiskLabel = (s) => {
  if (s == null) return 'Normal';
  if (s >= 85) return 'Normal';
  if (s >= 70) return 'Mild';
  if (s >= 50) return 'Moderate';
  return 'Severe';
};
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }) : '';

// ─── ICONS ────────────────────────────────────────────────────
const Ico = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const Icons = {
  home:      'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  patients:  'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  chat:      'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  notes:     'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  activity:  'M22 12h-4l-3 9L9 3l-3 9H2',
  logout:    'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  send:      'M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z',
  plus:      'M12 5v14M5 12h14',
  check:     'M20 6L9 17l-5-5',
  chevron:   'M6 9l6 6 6-6',
  user:      'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  bell:      'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  clock:     'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v6l4 2',
  star:      'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  trash:     'M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2',
  assign:    'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  search:    'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  brain:     'M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2zM14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z',
};

// ─── SCORE BAR ────────────────────────────────────────────────
function ScoreBar({ label, score, weight }) {
  const risk = getRisk(score);
  return (
    <div className="td-bar-row">
      <div className="td-bar-hdr">
        <span>{label}</span>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          {weight && <span className="td-weight-pill">×{weight}</span>}
          <span style={{ color: risk.color, fontWeight: 700 }}>{score != null ? `${Math.round(score)}%` : 'N/A'}</span>
        </div>
      </div>
      <div className="td-bar-track">
        <div className="td-bar-fill" style={{
          width: `${score ?? 0}%`,
          background: `linear-gradient(90deg, ${risk.color}cc, ${risk.color})`,
        }} />
      </div>
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────
function StatCard({ icon, value, label, sub, accent }) {
  return (
    <div className="td-stat" style={{ '--accent': accent || 'var(--teal)' }}>
      <div className="td-stat-icon"><Ico d={icon} size={20} /></div>
      <div className="td-stat-val">{value}</div>
      <div className="td-stat-lbl">{label}</div>
      {sub && <div className="td-stat-sub">{sub}</div>}
    </div>
  );
}
// ─── RISK BADGE ───────────────────────────────────────────────
function RiskBadge({ score }) {
  const label = getRiskLabel(score);
  const risk = RISK[label] || RISK.Normal;
  return (
    <span className="td-risk-badge" style={{ background: risk.bg, color: risk.color }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background: risk.dot, display:'inline-block', marginRight:5 }} />
      {label}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════
// HOME TAB
// ══════════════════════════════════════════════════════════════
function HomeTab({ patients, onViewPatient }) {
  // ------------------------------------------------------------------
  // 1. Safely extract valid numeric overall scores
  // ------------------------------------------------------------------
  const validScores = patients
    .map(p => {
      const score = p.overall_score;
      if (score === null || score === undefined) return null;
      const num = Number(score);
      return isNaN(num) ? null : num;
    })
    .filter(score => score !== null);

  const completedCount = validScores.length;

  // ------------------------------------------------------------------
  // 2. Count patients by risk level (using the existing getRisk logic)
  // ------------------------------------------------------------------
  const severe = patients.filter(p => {
    const s = p.overall_score;
    return s != null && !isNaN(Number(s)) && Number(s) < 50;
  }).length;

  const moderate = patients.filter(p => {
    const s = p.overall_score;
    return s != null && !isNaN(Number(s)) && Number(s) >= 50 && Number(s) < 70;
  }).length;

  const normal = patients.filter(p => {
    const s = p.overall_score;
    return s != null && !isNaN(Number(s)) && Number(s) >= 85;
  }).length;

  // ------------------------------------------------------------------
  // 3. Average score (0 if none)
  // ------------------------------------------------------------------
  const avgScore = completedCount
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / completedCount)
    : 0;

  // ------------------------------------------------------------------
  // 4. Recent 5 assessments – only valid and with a completion date
  // ------------------------------------------------------------------
  const recent = patients
    .filter(p => {
      const s = p.overall_score;
      return s != null && !isNaN(Number(s)) && p.completed_at;
    })
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
    .slice(0, 5);

  // ------------------------------------------------------------------
  // 5. Render
  // ------------------------------------------------------------------
  return (
    <div className="td-pane">
     
      <h1 className="td-page-title">Good morning, <em>Dr. Acheb</em></h1>
      <p className="td-page-sub">Here's your patient overview and today's activity summary.</p>

      <div className="td-stats-grid">
        <StatCard
          icon={Icons.patients}
          value={patients.length}
          label="Registered Patients"
          sub={`${completedCount} assessed`}
          accent="var(--teal)"
        />
        <StatCard
          icon={Icons.activity}
          value={`${avgScore}%`}
          label="Average Score"
          sub="across all assessments"
          accent="var(--gold-dark)"
        />
        <StatCard
          icon={Icons.brain}
          value={severe}
          label="Severe Cases"
          sub="need immediate attention"
          accent="#c0392b"
        />
        <StatCard
          icon={Icons.check}
          value={normal}
          label="Normal Range"
          sub="performing well"
          accent="#1a6b40"
        />
      </div>

      

        
           

      <div className="td-card">
        <div className="td-card-hdr">
          <span className="td-card-title">Recent Assessments</span>
        </div>
        {recent.length === 0 ? (
          <div className="td-empty">No assessments completed yet.</div>
        ) : (
          <table className="td-table">
            <thead>
              <tr>
                <th>Child</th>
                <th>Grade</th>
                <th>Overall</th>
                <th>Risk</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recent.map(p => (
                <tr key={p.child_session_id || p.child_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="td-av">{p.child_name?.charAt(0)}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.child_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                          {p.parent_name || '—'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>Year {p.grade}</td>
                  <td style={{ fontWeight: 700, color: getRisk(p.overall_score).color }}>
                    {p.overall_score != null ? `${Math.round(p.overall_score)}%` : '—'}
                  </td>
                  <td><RiskBadge score={p.overall_score} /></td>
                  <td>{fmtDate(p.completed_at)}</td>
                  <td>
                    <button className="td-btn-sm" onClick={() => onViewPatient(p)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
// ══════════════════════════════════════════════════════════════
// PATIENTS TAB
// ══════════════════════════════════════════════════════════════
function PatientsTab({ patients, onViewPatient }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    const nameMatch = p.child_name?.toLowerCase().includes(q) || p.parent_name?.toLowerCase().includes(q);
    if (!nameMatch) return false;
    if (filter === 'all') return true;
    return getRiskLabel(p.overall_score).toLowerCase() === filter;
  });

  return (
    <div className="td-pane">
      <div className="td-page-eyebrow">Patient Management</div>
      <h1 className="td-page-title">All <em>Patients</em></h1>
      <p className="td-page-sub">Children who have completed the full assessment screening.</p>

      <div className="td-toolbar">
        <div className="td-search-wrap">
          <Ico d={Icons.search} size={16} />
          <input className="td-search" placeholder="Search by child or parent name…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="td-filter-tabs">
          {['all','normal','mild','moderate','severe'].map(f => (
            <button key={f} className={`td-filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="td-patient-grid">
        {filtered.length === 0 ? (
          <div className="td-empty" style={{ gridColumn:'1/-1' }}>No patients found.</div>
        ) : filtered.map(p => {
          const risk = getRisk(p.overall_score);
          return (
            <div key={p.child_session_id || p.child_id} className="td-patient-card"
              onClick={() => onViewPatient(p)} style={{ '--risk-color': risk.color }}>
              <div className="td-pc-top">
                <div className="td-pc-av">{p.child_name?.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div className="td-pc-name">{p.child_name}</div>
                  <div className="td-pc-meta">Year {p.grade} · Parent: {p.parent_name || '—'}</div>
                </div>
                <RiskBadge score={p.overall_score} />
              </div>

              <div className="td-pc-score-row">
                <div className="td-pc-gauge">
                  <svg viewBox="0 0 80 50" width="80" height="50">
                    <path d="M 10 45 A 35 35 0 0 1 70 45" fill="none" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
                    <path d="M 10 45 A 35 35 0 0 1 70 45" fill="none" stroke={risk.color} strokeWidth="6"
                      strokeLinecap="round" strokeDasharray="110"
                      strokeDashoffset={110 - ((p.overall_score ?? 0) / 100) * 110} />
                    <text x="40" y="44" textAnchor="middle" fontSize="11" fontWeight="700" fill={risk.color}>
                      {p.overall_score != null ? `${Math.round(p.overall_score)}%` : '—'}
                    </text>
                  </svg>
                </div>
                <div className="td-pc-tasks">
                  {[
                    { k: 'task1_score', l: 'Word' },
                    { k: 'task2_score', l: 'Story' },
                    { k: 'task3_score', l: 'Letter' },
                    { k: 'task4_score', l: 'Memory' },
                  ].map(({ k, l }) => (
                    <div key={k} className="td-mini-task">
                      <div className="td-mini-label">{l}</div>
                      <div className="td-mini-bar-track">
                        <div className="td-mini-bar-fill" style={{
                          width: `${p[k] ?? 0}%`,
                          background: getRisk(p[k]).color,
                        }} />
                      </div>
                      <div className="td-mini-val" style={{ color: getRisk(p[k]).color }}>
                        {p[k] != null ? `${Math.round(p[k])}%` : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="td-pc-footer">
                <span><Ico d={Icons.clock} size={12} /> {fmtDate(p.completed_at)}</span>
                <button className="td-btn-sm" onClick={e => { e.stopPropagation(); onViewPatient(p); }}>
                  Full Report →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ASSESSMENT DETAILS TAB — per-exercise breakdown
// ══════════════════════════════════════════════════════════════
const TASK1_EXERCISES = [
  { key: 'similarWords',    label: 'Exercise 1 — Twin Words 👯',   words: ['cat','bat','hat','mat','cap','cup','map','mop','pin','pen','sit','set','bad','bed','big','pig','fan','van','tap','top'] },
  { key: 'nonSimilarWords', label: 'Exercise 2 — Everyday Words 🏡', words: ['house','tree','school','water','mother','father','child','book','table','chair','apple','bread','car','road','sun','moon','dog','cat','friend','teacher'] },
  { key: 'nonWords',        label: 'Exercise 3 — Funny Words 🤪',  words: ['mip','lat','nob','kep','sud','fik','zan','pel','mot','rib','dak','vun','sep','gol','tim','paf','lod','kes','bim','ran'] },
];

function AssessmentDetailsTab({ childSessionId }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [activeTask, setActiveTask] = useState('task1');

  useEffect(() => {
    if (!childSessionId) { setLoading(false); return; }
    setLoading(true);
    apiFetch(`/api/therapist/child-task-details/${childSessionId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [childSessionId]);

  if (loading) return <div style={{ padding: 24, color: '#8FA898', textAlign: 'center' }}>Loading assessment details…</div>;
  if (error)   return <div style={{ padding: 24, color: '#C62828' }}>⚠️ {error}</div>;
  if (!data)   return <div style={{ padding: 24, color: '#8FA898' }}>No session data available.</div>;

  const safeJson = (v) => {
    if (!v) return null;
    if (typeof v === 'object') return v;
    try { return JSON.parse(v); } catch { return null; }
  };

  // ── Task 1 ──────────────────────────────────────────────────
  const renderTask1 = () => {
    const t = data.task1;
    if (!t) return <div style={styles.noData}>Task 1 not completed yet.</div>;
    const errors = safeJson(t.errorPatterns) || [];
    const errorSet = new Set(Array.isArray(errors) ? errors.map(e => typeof e === 'string' ? e : e.word || e) : []);

    return (
      <div>
        <div style={styles.taskSummaryRow}>
          <span style={styles.taskSummaryChip}>Score: <b style={{ color: scoreColor(t.percentage) }}>{Math.round(t.percentage || 0)}%</b></span>
          <span style={styles.taskSummaryChip}>Correct: <b style={{ color: '#1a6b40' }}>{t.totalScore ?? '—'}</b></span>
          <span style={styles.taskSummaryChip}>Total: <b>{t.totalWords ?? 60}</b></span>
        </div>
        {TASK1_EXERCISES.map((ex) => {
          const wrongWords = ex.words.filter(w => errorSet.has(w));
          const correctWords = ex.words.filter(w => !errorSet.has(w));
          return (
            <div key={ex.key} style={styles.exerciseBlock}>
              <div style={styles.exerciseHeader}>{ex.label}</div>
              <div style={styles.wordGrid}>
                {ex.words.map((word, i) => {
                  const isWrong = errorSet.has(word);
                  return (
                    <div key={i} style={{ ...styles.wordCard, background: isWrong ? B.errBg : B.bluePale, borderColor: isWrong ? B.errBorder : B.blueLight }}>
                      <span style={{ fontWeight: 700, color: isWrong ? B.errText : B.navyMid, fontSize: 14 }}>{word}</span>
                      {isWrong
                        ? <span style={styles.badge(B.errText, B.errBg)}>incorrect</span>
                        : <span style={styles.badge(B.blue, B.blueLight)}>correct</span>
                      }
                    </div>
                  );
                })}
              </div>
              <div style={styles.exSummary}>
                <span style={{ color: B.blue, fontWeight: 600 }}>{correctWords.length} correct</span>
                <span style={{ color: B.errText, fontWeight: 600 }}>{wrongWords.length} incorrect</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Task 2 ──────────────────────────────────────────────────
  const renderTask2 = () => {
    const t = data.task2;
    if (!t) return <div style={styles.noData}>Task 2 not completed yet.</div>;
    const wordDetails = safeJson(t.wordDetails);
    const items = wordDetails
      ? (Array.isArray(wordDetails) ? wordDetails : Object.values(wordDetails))
      : [];

    return (
      <div>
        <div style={styles.taskSummaryRow}>
          <span style={styles.taskSummaryChip}>Score: <b style={{ color: scoreColor(t.percentage) }}>{Math.round(t.percentage || 0)}%</b></span>
          <span style={styles.taskSummaryChip}>Correct: <b style={{ color: '#1a6b40' }}>{t.correctCount ?? '—'}</b></span>
          <span style={styles.taskSummaryChip}>Incorrect: <b style={{ color: '#C62828' }}>{t.incorrectCount ?? '—'}</b></span>
        </div>
        <div style={styles.exerciseBlock}>
          <div style={styles.exerciseHeader}>Story Reading — Word by Word</div>
          {items.length === 0 ? (
            <div style={styles.noData}>No word-level data recorded for this session.</div>
          ) : (
            <div>
              {items.map((item, i) => {
                const expected = item.expected || item.word || item.target || `Word ${i+1}`;
                const spoken   = item.spoken   || item.userAnswer || item.response || '—';
                const correct  = item.correct  || item.isCorrect;
                return (
                  <div key={i} style={{ ...styles.resultRow, background: correct ? B.bluePale : B.errBg, borderLeft: `3px solid ${correct ? B.blueMid : B.errDot}` }}>
                    <span style={styles.exNum}>#{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: B.navy }}>{expected}</span>
                      {!correct && (
                        <span style={{ marginLeft: 10, color: B.errText, fontSize: 12 }}>
                          child said: <b>"{spoken}"</b>
                        </span>
                      )}
                    </div>
                    <span style={styles.badge(correct ? B.blue : B.errText, correct ? B.blueLight : B.errBg)}>
                      {correct ? 'correct' : 'incorrect'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Task 3 ──────────────────────────────────────────────────
  const renderTask3 = () => {
    const t = data.task3;
    if (!t) return <div style={styles.noData}>Task 3 not completed yet.</div>;
    const details = safeJson(t.comparisonDetails);
    const items = details ? (Array.isArray(details) ? details : Object.values(details)) : [];

    return (
      <div>
        <div style={styles.taskSummaryRow}>
          <span style={styles.taskSummaryChip}>Score: <b style={{ color: scoreColor(t.percentage) }}>{Math.round(t.percentage || 0)}%</b></span>
          <span style={styles.taskSummaryChip}>Correct: <b style={{ color: '#1a6b40' }}>{t.correctCount ?? '—'}</b></span>
          <span style={styles.taskSummaryChip}>Incorrect: <b style={{ color: '#C62828' }}>{t.incorrectCount ?? '—'}</b></span>
        </div>
        <div style={styles.exerciseBlock}>
          <div style={styles.exerciseHeader}>Letter Comparisons</div>
          {items.length === 0 ? (
            <div style={styles.noData}>No comparison data recorded for this session.</div>
          ) : (
            <div>
              {items.map((item, i) => {
                const g1 = item.group1 || item.letterA || item.left || '?';
                const g2 = item.group2 || item.letterB || item.right || '?';
                const correct = item.is_correct !== undefined ? item.is_correct : (item.correct || item.isCorrect);
                const userAns = item.user_answer !== undefined ? item.user_answer : (item.userAnswer || item.answer);
                const expected = item.expected_same !== undefined
                  ? (item.expected_same ? 'Same' : 'Different')
                  : (item.correctAnswer || '—');
                const isTimeout = item.is_timeout;
                const g1Display = Array.isArray(g1) ? g1.join(' ') : String(g1);
                const g2Display = Array.isArray(g2) ? g2.join(' ') : String(g2);
                return (
                  <div key={i} style={{ ...styles.resultRow, background: correct ? B.bluePale : B.errBg, borderLeft: `3px solid ${correct ? B.blueMid : B.errDot}` }}>
                    <span style={styles.exNum}>#{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontFamily: 'Georgia, serif', fontWeight: 800, fontSize: 17, letterSpacing: 2, color: B.navy }}>{g1Display}</span>
                      <span style={{ margin: '0 8px', color: B.gray400, fontSize: 12 }}>vs</span>
                      <span style={{ fontFamily: 'Georgia, serif', fontWeight: 800, fontSize: 17, letterSpacing: 2, color: B.navy }}>{g2Display}</span>
                      {!correct && userAns !== null && userAns !== undefined && (
                        <span style={{ marginLeft: 10, color: B.errText, fontSize: 12 }}>
                          said: <b>{String(userAns)}</b> · correct: <b style={{ color: B.blue }}>{expected}</b>
                        </span>
                      )}
                      {isTimeout && <span style={{ marginLeft: 8, color: B.warnText, fontSize: 12 }}>timeout</span>}
                    </div>
                    <span style={styles.badge(correct ? B.blue : B.errText, correct ? B.blueLight : B.errBg)}>
                      {correct ? 'correct' : 'incorrect'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Task 4 ──────────────────────────────────────────────────
  const renderTask4 = () => {
    const t = data.task4;
    if (!t) return <div style={styles.noData}>Task 4 not completed yet.</div>;

    const renderSubTask = (sub, label, exNum) => {
      if (!sub) return null;
      const details = safeJson(sub.details) || [];
      return (
        <div style={styles.exerciseBlock}>
          <div style={styles.exerciseHeader}>{exNum} — {label}</div>
          <div style={styles.taskSummaryRow}>
            <span style={styles.taskSummaryChip}>Score: <b style={{ color: scoreColor(sub.percentage) }}>{Math.round(sub.percentage || 0)}%</b></span>
            <span style={styles.taskSummaryChip}>Correct: <b style={{ color: '#1a6b40' }}>{sub.correct ?? '—'}</b></span>
            <span style={styles.taskSummaryChip}>Incorrect: <b style={{ color: '#C62828' }}>{sub.incorrect ?? '—'}</b></span>
          </div>
          {details.length === 0 ? (
            <div style={styles.noData}>No item-level data recorded.</div>
          ) : (
            <div>
              {details.map((item, i) => {
                const inner = item.forward || item.reverse || item;
                const correct  = inner.correct;
                const input    = inner.input;
                const expected = inner.expected;
                const inputStr    = Array.isArray(input)    ? input.join(', ')    : String(input    ?? '—');
                const expectedStr = Array.isArray(expected) ? expected.join(', ') : String(expected ?? '—');
                return (
                  <div key={i} style={{ ...styles.resultRow, background: correct ? B.bluePale : B.errBg, borderLeft: `3px solid ${correct ? B.blueMid : B.errDot}` }}>
                    <span style={styles.exNum}>#{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: B.gray600 }}>Sequence: </span>
                      <span style={{ fontFamily: 'monospace', fontSize: 14, color: B.navy }}>{expectedStr}</span>
                      {!correct && (
                        <span style={{ marginLeft: 10, color: B.errText, fontSize: 12 }}>
                          child answered: <b>{inputStr}</b>
                        </span>
                      )}
                    </div>
                    <span style={styles.badge(correct ? B.blue : B.errText, correct ? B.blueLight : B.errBg)}>
                      {correct ? 'correct' : 'incorrect'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    };

    return (
      <div>
        <div style={styles.taskSummaryRow}>
          <span style={styles.taskSummaryChip}>Overall: <b style={{ color: scoreColor(t.overallPercentage) }}>{Math.round(t.overallPercentage || 0)}%</b></span>
        </div>
        {renderSubTask(t.sequence, 'Number Sequence Memory', 'Exercise 1')}
        {renderSubTask(t.reversal, 'Number Reversal Memory',  'Exercise 2')}
      </div>
    );
  };

  const taskTabs = [
    { key: 'task1', label: 'Word Explorer',    score: data.task1?.percentage },
    { key: 'task2', label: 'Story Reader',     score: data.task2?.percentage },
    { key: 'task3', label: 'Letter Detective', score: data.task3?.percentage },
    { key: 'task4', label: 'Number Memory',    score: data.task4?.overallPercentage },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Task selector tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, background: B.gray50, borderRadius: 10, padding: 4, border: `1px solid ${B.gray200}` }}>
        {taskTabs.map(t => {
          const active = activeTask === t.key;
          const sc = scoreColor(t.score);
          return (
            <button key={t.key} onClick={() => setActiveTask(t.key)} style={{
              flex: 1, padding: '8px 10px', borderRadius: 7, border: 'none',
              background: active ? B.white : 'transparent',
              boxShadow: active ? '0 1px 4px rgba(15,39,68,0.1)' : 'none',
              color: active ? B.navyMid : B.gray400,
              fontSize: 11, fontWeight: active ? 700 : 500, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              transition: 'all 0.15s',
            }}>
              <span style={{ whiteSpace: 'nowrap' }}>{t.label}</span>
              {t.score != null && (
                <span style={{
                  background: active ? B.blueLight : 'transparent',
                  color: active ? B.blue : sc,
                  borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700,
                }}>{Math.round(t.score)}%</span>
              )}
            </button>
          );
        })}
      </div>
      {/* Content */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {activeTask === 'task1' && renderTask1()}
        {activeTask === 'task2' && renderTask2()}
        {activeTask === 'task3' && renderTask3()}
        {activeTask === 'task4' && renderTask4()}
      </div>
    </div>
  );
}

// ── BLUE/WHITE PALETTE ────────────────────────────────────────
const B = {
  navy:     '#0f2744',
  navyMid:  '#1a3a5c',
  blue:     '#1d6fa6',
  blueMid:  '#2589c9',
  blueLight:'#daeeff',
  bluePale: '#f0f8ff',
  white:    '#ffffff',
  gray50:   '#f8fafc',
  gray100:  '#f1f5f9',
  gray200:  '#e2e8f0',
  gray400:  '#94a3b8',
  gray600:  '#475569',
  gray800:  '#1e293b',
  okText:   '#15803d', okBg: '#f0fdf4', okBorder: '#bbf7d0', okDot: '#22c55e',
  errText:  '#b91c1c', errBg: '#fef2f2', errBorder: '#fecaca', errDot: '#ef4444',
  warnText: '#a16207', warnBg: '#fefce8', warnDot: '#eab308',
};

const scoreColor = (s) => {
  if (s == null) return B.gray400;
  if (s >= 85)   return B.okText;
  if (s >= 70)   return B.warnText;
  if (s >= 50)   return '#c2410c';
  return B.errText;
};

const styles = {
  noData: { padding: 20, color: B.gray400, fontStyle: 'italic', fontSize: 13, textAlign: 'center', background: B.bluePale, borderRadius: 8, border: `1px solid ${B.blueLight}` },
  exerciseBlock: { marginBottom: 16, background: B.white, borderRadius: 10, overflow: 'hidden', border: `1px solid ${B.gray200}`, boxShadow: '0 1px 4px rgba(15,39,68,0.05)' },
  exerciseHeader: { background: B.navyMid, color: B.white, padding: '10px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' },
  wordGrid: { display: 'flex', flexWrap: 'wrap', gap: 8, padding: 14 },
  wordCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 14px', borderRadius: 8, border: '1.5px solid', minWidth: 72 },
  taskSummaryRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, padding: '0 2px' },
  taskSummaryChip: { background: B.blueLight, borderRadius: 20, padding: '4px 12px', fontSize: 12, color: B.navyMid, fontWeight: 500 },
  resultRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', marginBottom: 2, borderRadius: 0 },
  exNum: { fontSize: 11, color: B.gray400, minWidth: 28, fontWeight: 600 },
  exSummary: { padding: '8px 16px 12px', fontSize: 12, borderTop: `1px solid ${B.gray100}`, display: 'flex', gap: 14 },
  badge: (color, bg) => ({ background: bg, color, border: `1px solid ${color}33`, borderRadius: 4, padding: '2px 9px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }),
};

// ══════════════════════════════════════════════════════════════
// PATIENT DETAIL PANEL
// ══════════════════════════════════════════════════════════════
function PatientDetail({ patient, onClose, onAssignActivity, onOpenChat }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [activities, setActivities] = useState([]);
  const [activePanel, setActivePanel] = useState('overview');
  const [assessmentActiveTab, setAssessmentActiveTab] = useState('task1');

  useEffect(() => {
    if (!patient) return;
    setActivePanel('overview');
    fetchTherapistNotes(patient.child_id).then(setNotes).catch(() => setNotes([]));
    fetchActivities().then(data => {
      const acts = data?.activities || (Array.isArray(data) ? data : []);
      setActivities(acts);
    }).catch(() => setActivities([]));
  }, [patient]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const note = await addTherapistNote(patient.child_id, newNote.trim());
      setNotes(prev => [note, ...prev]);
      setNewNote('');
    } catch (err) { console.error(err); }
    setSavingNote(false);
  };

  if (!patient) return null;

  const tasks = [
    { label: 'Word Explorer',    score: patient.task1_score, weight: 2, key: 'task1' },
    { label: 'Story Reader',     score: patient.task2_score, weight: 2, key: 'task2' },
    { label: 'Letter Detective', score: patient.task3_score, weight: 3, key: 'task3' },
    { label: 'Number Memory',    score: patient.task4_score, weight: 1, key: 'task4' },
  ];

  const panelTabs = [
    { key: 'overview',    label: 'Overview',    icon: Icons.home },
    { key: 'assessment',  label: 'Assessment Details', icon: Icons.brain },
    { key: 'notes',       label: 'Notes',       icon: Icons.notes },
    { key: 'activities',  label: 'Activities',  icon: Icons.activity },
  ];

  return (
    <div className="td-detail-overlay" onClick={onClose}>
      <div className="td-detail-panel" style={{ display: 'flex', flexDirection: 'column', maxWidth: 720, width: '95vw' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="td-detail-hdr" style={{ background: `linear-gradient(135deg, #1a3a5c, #1d6fa6)`, flexShrink: 0 }}>
          <button className="td-detail-close" onClick={onClose}>×</button>
          <div className="td-detail-av">{patient.child_name?.charAt(0)}</div>
          <div className="td-detail-info">
            <div className="td-detail-name">{patient.child_name}</div>
            <div className="td-detail-meta"> Parent: {patient.parent_name || '—'}</div>
            <RiskBadge score={patient.overall_score} />
          </div>
          <div className="td-detail-overall">
            <div style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>
              {patient.overall_score != null ? `${Math.round(patient.overall_score)}%` : '—'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Overall Score</div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', background: '#eef2f6', flexShrink: 0, overflowX: 'auto' }}>
          {panelTabs.map(t => (
            <button key={t.key} onClick={() => setActivePanel(t.key)} style={{
              flex: '0 0 auto', padding: '11px 18px', border: 'none', cursor: 'pointer',
              background: activePanel === t.key ? '#ffffff' : 'transparent',
              color: activePanel === t.key ? '#1a3a5c' : '#475569',
              fontWeight: activePanel === t.key ? 700 : 500,
              fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
              borderBottom: activePanel === t.key ? '3px solid #1d6fa6' : '3px solid transparent',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}>
              <Ico d={t.icon} size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* Panel body */}
        <div className="td-detail-body" style={{ flex: 1, overflowY: 'auto' }}>

          {/* OVERVIEW */}
          {activePanel === 'overview' && (
            <>
              <div className="td-detail-section">
                <div className="td-detail-section-title">Assessment Results</div>
                {tasks.map(t => <ScoreBar key={t.key} label={t.label} score={t.score} weight={t.weight} />)}
              </div>
              <div className="td-detail-section">
                <div className="td-detail-section-title">Session Information</div>
                <div className="td-info-grid">
                  <div className="td-info-item"><span>Completed</span><strong>{fmtDate(patient.completed_at)}</strong></div>
              
                  <div className="td-info-item"><span>Parent</span><strong>{patient.parent_name || '—'}</strong></div>
                </div>
              </div>
              <div className="td-detail-actions">
                <button className="td-btn-primary" style={{ flex: 1 }} onClick={() => onOpenChat(patient)}>
                  <Ico d={Icons.chat} size={15} /> Message Parent
                </button>
              </div>
            </>
          )}

          {/* ASSESSMENT DETAILS - using the imported ChildAssessmentDetail */}
          {activePanel === 'assessment' && (
            <div className="td-detail-section" style={{ height: '100%' }}>
              <div className="td-detail-section-title">Assessment Details – Exercises & Answers</div>
              <ChildAssessmentDetail
                childSessionId={patient.child_session_id}
                childName={patient.child_name}
                activeTab={assessmentActiveTab}
                onTabChange={setAssessmentActiveTab}
              />
            </div>
          )}

          {/* NOTES */}
          {activePanel === 'notes' && (
            <div className="td-detail-section">
              <div className="td-detail-section-title">Clinical Notes</div>
              <div className="td-note-input-row">
                <textarea className="td-note-input" placeholder="Add a clinical note…" value={newNote} onChange={e => setNewNote(e.target.value)} rows={2} />
                <button className="td-btn-primary" onClick={addNote} disabled={savingNote || !newNote.trim()}>{savingNote ? '…' : 'Add'}</button>
              </div>
              <div className="td-notes-list">
                {notes.length === 0 && <div className="td-empty-sm">No notes yet.</div>}
                {notes.map((n, i) => (
                  <div key={i} className="td-note-item">
                    <div className="td-note-text">{n.note_text}</div>
                    <div className="td-note-date">{fmtDate(n.created_at)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVITIES */}
          {activePanel === 'activities' && (
            <div className="td-detail-section">
              <div className="td-detail-section-title">Assign Activity</div>
              <div className="td-activities-list">
                {activities.length === 0 && <div className="td-empty-sm">No activities available.</div>}
                {activities.map(act => (
                  <div key={act.id} className="td-act-item">
                    <div>
                      <div className="td-act-name">{act.name}</div>
                      <div className="td-act-desc">{act.description}</div>
                      <span className="td-act-level">Level {act.difficulty_level}</span>
                    </div>
                    <button className="td-btn-assign" onClick={() => onAssignActivity(patient.child_id, act.id)}>
                      <Ico d={Icons.assign} size={14} /> Assign
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
// ══════════════════════════════════════════════════════════════
// CHAT TAB
// ══════════════════════════════════════════════════════════════
function ChatTab({ patients, defaultParent, onMessagesRead }) {
  const [conversations, setConversations] = useState([]);
  const [activeParentId, setActiveParentId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    const parentMap = {};
    patients.forEach(p => {
      if (p.parent_id && !parentMap[p.parent_id]) {
        parentMap[p.parent_id] = {
          parent_id: p.parent_id,
          parent_name: p.parent_name || 'Unknown Parent',
          child_name: p.child_name,
          child_id: p.child_id,
        };
      }
    });
    setConversations(Object.values(parentMap));
  }, [patients]);

  useEffect(() => {
    if (defaultParent?.parent_id) setActiveParentId(defaultParent.parent_id);
  }, [defaultParent]);

  const loadMessages = useCallback(async () => {
    if (!activeParentId) return;
    setLoadingMsgs(true);
    try {
      const res = await apiFetch(`/api/messages?parentId=${activeParentId}`);
      const data = await res.json();
      const msgs = data.messages || [];
      setMessages(msgs);
      const unreadIds = msgs.filter(m => m.sender_role === 'parent' && !m.is_read).map(m => m.id);
      if (unreadIds.length) {
        await Promise.all(unreadIds.map(id => apiFetch(`/api/messages/${id}/read`, { method: 'PUT' })));
        if (onMessagesRead) onMessagesRead();
      }
    } catch (err) { console.error(err); }
    setLoadingMsgs(false);
  }, [activeParentId, onMessagesRead]);

  useEffect(() => {
    loadMessages();
    pollRef.current = setInterval(loadMessages, 4000);
    return () => clearInterval(pollRef.current);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !activeParentId) return;
    setSending(true);
    setInput('');
    try {
      const conv = conversations.find(c => c.parent_id === activeParentId);
      await sendTherapistMessage(activeParentId, text, conv?.child_id || null);
      await loadMessages();
    } catch (err) {
      console.error(err);
      setInput(text);
    }
    setSending(false);
  };

  const activeConv = conversations.find(c => c.parent_id === activeParentId);

  return (
    <div className="td-pane">
      <div className="td-page-eyebrow">Communication</div>
      <h1 className="td-page-title">Parent <em>Messages</em></h1>
      <p className="td-page-sub">Communicate directly with parents about their child's progress.</p>

      <div className="td-chat-layout">
        <div className="td-conv-list">
          <div className="td-conv-head">Conversations</div>
          {conversations.length === 0 && (
            <div className="td-empty-sm" style={{ padding: '20px 16px' }}>No conversations yet.</div>
          )}
          {conversations.map(c => (
            <div
              key={c.parent_id}
              className={`td-conv-item ${activeParentId === c.parent_id ? 'active' : ''}`}
              onClick={() => setActiveParentId(c.parent_id)}
            >
              <div className="td-conv-av">{c.parent_name?.charAt(0)}</div>
              <div>
                <div className="td-conv-name">{c.parent_name}</div>
                <div className="td-conv-child">re: {c.child_name}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="td-chat-panel">
          {!activeParentId ? (
            <div className="td-chat-empty">
              <Ico d={Icons.chat} size={40} />
              <p>Select a conversation to begin</p>
            </div>
          ) : (
            <>
              <div className="td-chat-topbar">
                <div className="td-chat-av">{activeConv?.parent_name?.charAt(0)}</div>
                <div>
                  <div className="td-chat-name">{activeConv?.parent_name}</div>
                  <div className="td-chat-sub">Parent of {activeConv?.child_name}</div>
                </div>
              </div>

              <div className="td-chat-messages">
                {loadingMsgs && messages.length === 0 && (
                  <div className="td-empty-sm">Loading…</div>
                )}
                {messages.length === 0 && !loadingMsgs && (
                  <div className="td-chat-start">
                    Start the conversation with {activeConv?.parent_name}.
                  </div>
                )}
                {messages.map(m => {
                  const isTherapist = m.sender_role === 'therapist';
                  return (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: isTherapist ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                        marginBottom: '12px'
                      }}
                    >
                      {!isTherapist && (
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          marginBottom: 4
                        }}>
                          {activeConv?.parent_name?.charAt(0)}
                        </div>
                      )}
                      <div
                        style={{
                          background: isTherapist ? '#2563eb' : '#f1f5f9',
                          color: isTherapist ? 'white' : '#0f172a',
                          padding: '10px 14px',
                          borderRadius: isTherapist ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          fontSize: 13,
                          lineHeight: 1.45,
                          wordWrap: 'break-word'
                        }}
                      >
                        {m.content}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: '#94a3b8',
                          marginTop: 4,
                          textAlign: isTherapist ? 'right' : 'left'
                        }}
                      >
                        {fmtTime(m.created_at)}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="td-chat-footer">
                <textarea
                  className="td-chat-inp"
                  rows={1}
                  placeholder="Write a message…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  className="td-send-btn"
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                >
                  <Ico d={Icons.send} size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// NOTES TAB
// ══════════════════════════════════════════════════════════════
function NotesTab({ patients }) {
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [selectedChild, setSelectedChild] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTherapistNotes().then(setNotes).catch(() => setNotes([])).finally(() => setLoading(false));
  }, []);

  const addNote = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      const note = await addTherapistNote(selectedChild ? parseInt(selectedChild) : null, noteText.trim());
      setNotes(prev => [note, ...prev]);
      setNoteText('');
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const deleteNote = async (id) => {
    try {
      await deleteTherapistNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (err) { console.error(err); }
  };

  const childOptions = patients.filter(p => p.child_id);

  return (
    <div className="td-pane">
      <div className="td-page-eyebrow">Clinical Documentation</div>
      <h1 className="td-page-title">Clinical <em>Notes</em></h1>
      <p className="td-page-sub">Private notes and observations about your patients.</p>

      <div className="td-notes-layout">
        <div className="td-note-editor">
          <div className="td-card">
            <div className="td-card-hdr"><span className="td-card-title">New Note</span></div>
            <div style={{ padding: '0 20px 20px' }}>
              <div className="td-field" style={{ marginBottom: 12 }}>
                <label>Link to patient (optional)</label>
                <select className="td-select" value={selectedChild} onChange={e => setSelectedChild(e.target.value)}>
                  <option value="">General note (no patient)</option>
                  {childOptions.map(p => <option key={p.child_id} value={p.child_id}>{p.child_name} — Year {p.grade}</option>)}
                </select>
              </div>
              <div className="td-field">
                <label>Note content</label>
                <textarea className="td-textarea" placeholder="Write your clinical observation…" value={noteText} onChange={e => setNoteText(e.target.value)} rows={6} />
              </div>
              <button className="td-btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={addNote} disabled={saving || !noteText.trim()}>{saving ? 'Saving…' : '+ Save Note'}</button>
            </div>
          </div>
        </div>
        <div className="td-notes-feed">
          {loading ? <div className="td-empty">Loading notes…</div> : null}
          {!loading && notes.length === 0 && <div className="td-empty">No notes yet. Add your first note.</div>}
          {notes.map((n, i) => {
            const child = patients.find(p => p.child_id === n.child_id);
            return (
              <div key={n.id || i} className="td-note-card">
                <div className="td-note-card-hdr">
                  <div>
                    {child && <span className="td-note-tag">{child.child_name}</span>}
                    <div className="td-note-card-date">{fmtDate(n.created_at)}</div>
                  </div>
                  <button className="td-btn-icon" onClick={() => deleteNote(n.id)}><Ico d={Icons.trash} size={14} /></button>
                </div>
                <div className="td-note-card-text">{n.note_text}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ACTIVITIES TAB – Only two activities, fixed table syntax
// ══════════════════════════════════════════════════════════════
function ActivitiesTab({ patients }) {
  const defaultActivities = [
    { id: 1, name: 'Alphabet Swiping', description: 'Swipe through animal flashcards, then match the first letter to the animal picture. Builds phonemic awareness and letter‑sound association.', type: 'letter_sound', difficulty_level: 1 },
    { id: 2, name: 'Syllable Breaking', description: 'Break words into syllables, hear each part, then build the word by dragging letters into the correct syllable slots. Teaches word segmentation.', type: 'syllable', difficulty_level: 1 },
  ];

  const [activities, setActivities] = useState(defaultActivities);
  const [assignments, setAssignments] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchAssignments().then(data => setAssignments(Array.isArray(data) ? data : [])).catch(() => setAssignments([]));
    fetchActivities().then(data => {
      const acts = data?.activities || (Array.isArray(data) ? data : []);
      const filtered = acts.filter(a => a.type === 'letter_sound' || a.type === 'syllable');
      if (filtered.length > 0) setActivities(filtered);
    }).catch(() => {});
  }, []);

  const assign = async () => {
    if (!selectedChild || !selectedActivity) return;
    setAssigning(true);
    setMsg('');
    try {
      await assignActivity(selectedChild, selectedActivity);
      setMsg('Activity assigned successfully!');
      const updated = await fetchAssignments();
      setAssignments(Array.isArray(updated) ? updated : []);
    } catch (err) {
      console.error(err);
      setMsg('Failed to assign activity.');
    }
    setAssigning(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const childOptions = patients.filter(p => p.child_id);
  const DIFF_LABELS = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' };

  return (
    <div className="td-pane">
      <div className="td-page-eyebrow">Intervention Management</div>
      <h1 className="td-page-title">Learning <em>Activities</em></h1>
      <p className="td-page-sub">Assign targeted activities to children.</p>

      <div className="td-act-layout">
        <div className="td-card" style={{ flex: '0 0 340px' }}>
          <div className="td-card-hdr"><span className="td-card-title">Assign Activity</span></div>
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="td-field">
              <label>Select patient</label>
              <select className="td-select" value={selectedChild} onChange={e => setSelectedChild(e.target.value)}>
                <option value="">Choose a child…</option>
                {childOptions.map(p => <option key={p.child_id} value={p.child_id}>{p.child_name} — Year {p.grade}</option>)}
              </select>
            </div>
            <div className="td-field">
              <label>Select activity</label>
              <select className="td-select" value={selectedActivity} onChange={e => setSelectedActivity(e.target.value)}>
                <option value="">Choose an activity…</option>
                {activities.map(a => <option key={a.id} value={a.id}>{a.name} (Level {a.difficulty_level})</option>)}
              </select>
            </div>
            {msg && <div className="td-msg-flash">{msg}</div>}
            <button className="td-btn-primary" onClick={assign} disabled={assigning || !selectedChild || !selectedActivity}>
              {assigning ? 'Assigning…' : '+ Assign to Child'}
            </button>
          </div>

          <div className="td-card-hdr" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="td-card-title">Available Activities</span>
          </div>
          <div style={{ padding: '0 20px 20px', maxHeight: '300px', overflowY: 'auto' }}>
            {activities.map(a => (
              <div key={a.id} className="td-avail-act">
                <div className="td-avail-act-name">{a.name}</div>
                <div className="td-avail-act-desc">{a.description}</div>
                <span className="td-diff-pill" data-level={a.difficulty_level}>
                  {DIFF_LABELS[a.difficulty_level] || 'Level ' + a.difficulty_level}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="td-card" style={{ flex: 1 }}>
          <div className="td-card-hdr"><span className="td-card-title">Recent Assignments</span></div>
          {assignments.length === 0 ? (
            <div className="td-empty">No assignments yet.</div>
          ) : (
            <table className="td-table">
              <thead>
                <tr><th>Child</th><th>Activity</th><th>Level</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {assignments.map((a, i) => (
                  <tr key={i}>
                    <td><div style={{ fontWeight: 600 }}>{a.child_name || `Child #${a.child_id}`}</div></td>
                    <td>{a.activity_name || `Activity #${a.activity_id}`}</td>
                    <td>
                      <span className="td-diff-pill" data-level={a.difficulty_level}>
                        {DIFF_LABELS[a.difficulty_level] || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`td-status-pill ${a.completed ? 'done' : 'pending'}`}>
                        {a.completed ? 'Completed' : 'In Progress'}
                      </span>
                    </td>
                    <td>{fmtDate(a.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
const TherapistDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [chatDefaultParent, setChatDefaultParent] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchPatients().then(data => setPatients(Array.isArray(data) ? data : [])).catch(err => { console.error(err); setPatients([]); }).finally(() => setLoading(false));
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await apiFetch('/api/messages/unread-count');
      const data = await res.json();
      setUnreadCount(data.count || 0);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  useEffect(() => {
    window.refreshUnreadCount = refreshUnreadCount;
    return () => { delete window.refreshUnreadCount; };
  }, [refreshUnreadCount]);

  const handleLogout = () => {
    apiLogout();
    navigate('/auth');
  };

const assignActivityHandler = async (childId, activityId) => {
  try {
    const res = await apiFetch('/api/therapist/assignments', {
      method: 'POST',
      body: JSON.stringify({ child_id: childId, activity_id: activityId }),
    });
    if (res.ok) {
      alert('Activity assigned successfully!');
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to assign');
    }
  } catch (err) {
    console.error(err);
    alert('Network error');
  }
};

  const openChat = (patient) => {
    setChatDefaultParent(patient);
    setSelectedPatient(null);
    setActiveTab('chat');
  };

  if (loading) return <div className="td-loading"><div className="td-spinner" /><div>Loading dashboard…</div></div>;

  const TABS = [
    { key: 'home', label: 'Overview', icon: Icons.home },
    { key: 'patients', label: 'Patients', icon: Icons.patients },
    { key: 'chat', label: 'Messages', icon: Icons.chat },
    { key: 'notes', label: 'Notes', icon: Icons.notes },
    { key: 'activities', label: 'Activities', icon: Icons.activity },
  ];

  const completedCount = patients.filter(p => p.overall_score != null).length;

 return (
    <div className="td-root">
      <nav className="td-topnav">
        <div className="td-brand">
          <div className="td-brand-icon" style={{ background: '#FFB84D', border: 'none' }}>
            <span style={{ color: '#1E2D25', fontWeight: 900, fontSize: '16px', fontFamily: "'DM Serif Display', serif" }}>DS</span>
          </div>
          <div>
            <span className="td-brand-name" style={{ fontFamily: "'DM Serif Display', serif", color: '#fff' }}>Dyslexia <em>Support</em></span>
            
          </div>
        </div>
        <div className="td-nav-tabs">
         
        </div>
        <div className="td-nav-right">
          
          
          <div className="td-therapist-chip">
  <div className="td-therapist-av">A</div>
  <div>
    <div className="td-therapist-name">Dr. Acheb Kenza</div>
    <div className="td-therapist-role">Speech Therapist</div>
  </div>
</div>
          <button className="td-logout" onClick={handleLogout}><Ico d={Icons.logout} size={15} /> Sign out</button>
        </div>
      </nav>

  

      <div className="td-layout">
        <aside className="td-sidebar">
          <div className="td-sb-section">Navigation</div>
          {TABS.map(t => (
            <button key={t.key} className={`td-slink ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
              <Ico d={t.icon} size={16} /> {t.label}
              {t.key === 'chat' && unreadCount > 0 && <span className="td-unread-badge" style={{ marginLeft: 'auto' }}>{unreadCount}</span>}
            </button>
          ))}
         
       
        </aside>

        <main className="td-main">
          {activeTab === 'home' && <HomeTab patients={patients} onViewPatient={p => setSelectedPatient(p)} />}
          {activeTab === 'patients' && <PatientsTab patients={patients} onViewPatient={p => setSelectedPatient(p)} />}
          {activeTab === 'chat' && <ChatTab patients={patients} defaultParent={chatDefaultParent} onMessagesRead={refreshUnreadCount} />}
          {activeTab === 'notes' && <NotesTab patients={patients} />}
          {activeTab === 'activities' && <ActivitiesTab patients={patients} />}
        </main>
      </div>

      {/* Mobile bottom nav – only visible under 900px */}
      <div className="td-mobile-nav">
        <div className="td-mobile-nav-inner">
          {TABS.map(t => (
            <button key={t.key} className={`td-mobile-nav-btn ${activeTab === t.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(t.key)}>
              <Ico d={t.icon} size={18} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedPatient && <PatientDetail patient={selectedPatient} onClose={() => setSelectedPatient(null)} onAssignActivity={assignActivityHandler} onOpenChat={openChat} />}
    </div>
  );
};

export default TherapistDashboard;