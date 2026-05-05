// ParentDashboard.jsx — LexiCare Parent Portal (Redesigned & Connected)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import {
  apiFetch,
  getCurrentUser,
  fetchMyResults,
  fetchMessages,
  sendMessage,
  updateParentProfile,
  fetchAssignmentsForChild,
} from '../../services/api';
import './ParentDashboard.css';

// =========================== ICONS ===========================
const Icon = ({ d, size = 18, fill = 'none', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const ProfileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const ResultsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const ActivitiesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const ChatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const GamesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 11h4M8 9v4M15 12h.01M18 10h.01M17.32 5H6.68a4 4 0 0 0-3.978 3.59C2.2 10.07 2 11.03 2 12c0 2.21 2.02 4 4.5 4 .67 0 1.3-.14 1.86-.4 1.06-.5 1.92-1.33 2.39-2.3.32-.65.82-1.23 1.42-1.68.6-.45 1.27-.73 1.97-.87.7-.14 1.41-.13 2.1.02.68.16 1.31.45 1.85.86.53.41.96.93 1.25 1.52.28.59.41 1.23.41 1.88 0 2.48-2.02 4.5-4.5 4.5a4.5 4.5 0 0 1-3.85-2.16" />
  </svg>
);
const ProgressTabIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 12h4l3-9 4 18 3-9h4" />
  </svg>
);
const LogoutIcon = () => <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />;
const AddIcon = () => <Icon d="M12 5v14M5 12h14" strokeWidth="2.5" />;
const EditIcon = () => <Icon d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />;
const SendIcon = () => <Icon d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" size={16} />;
const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const PhoneIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const CalendarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const BellIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const ChevronIcon = ({ open }) => (
  <svg className={`chevron ${open ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M6 9l6 6 6-6" />
  </svg>
);
const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

// =========================== HELPERS ===========================
const RISK_CONFIG = {
  Normal:   { color: '#1a6b40', bg: '#e6f5ee', label: 'Normal' },
  Mild:     { color: '#8a5a0a', bg: '#fef6e4', label: 'Mild' },
  Moderate: { color: '#8a3a10', bg: '#fff0e8', label: 'Moderate' },
  Severe:   { color: '#8a1f1f', bg: '#feeaea', label: 'Severe' },
};

const scoreColor = (s) => {
  if (s == null) return '#c4c2dc';
  if (s >= 85) return '#1a6b40';
  if (s >= 70) return '#8a5a0a';
  if (s >= 50) return '#8a3a10';
  return '#8a1f1f';
};

const getRiskFromScore = (score) => {
  if (score == null) return 'Normal';
  if (score >= 85) return 'Normal';
  if (score >= 70) return 'Mild';
  if (score >= 50) return 'Moderate';
  return 'Severe';
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';

// =========================== TOAST SYSTEM ===========================
function Toast({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <span>{t.message}</span>
          <button className="toast-close" onClick={() => removeToast(t.id)}><XIcon /></button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);
  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);
  return { toasts, addToast, removeToast };
}

// =========================== SCORE BAR ===========================
function ScoreBar({ label, score }) {
  const color = scoreColor(score);
  return (
    <div className="bar-row">
      <div className="bar-hdr">
        <span>{label}</span>
        <span className="bar-val" style={{ color }}>{score != null ? `${score}%` : 'N/A'}</span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${score ?? 0}%`, background: color }} />
      </div>
    </div>
  );
}

// =========================== ADD CHILD MODAL ===========================
function AddChildModal({ onClose, onAdded, addToast }) {
  const [form, setForm] = useState({ full_name: '', grade: '', dob: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/children', { method: 'POST', body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add child');
      addToast('Child registered successfully!', 'success');
      onAdded();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Register a Child</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {error && <div className="error-msg show" style={{ margin: '0 24px' }}>{error}</div>}
        <div className="modal-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="field">
              <label>Full name *</label>
              <input type="text" placeholder="Child's full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div className="field">
              <label>School year *</label>
              <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} required>
                <option value="">Select year</option>
                {[1, 2, 3, 4, 5, 6].map(g => <option key={g} value={g}>Year {g}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Date of birth (optional)</label>
              <input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Register child'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// =========================== PROFILE TAB ===========================
function ProfileTab({ user, parentInfo, children, onChildrenChange, addToast }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (parentInfo) setForm({ full_name: parentInfo.full_name || '', phone: parentInfo.phone || '' });
  }, [parentInfo]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/parents/${user.userId}`, { method: 'PUT', body: JSON.stringify(form) });
      addToast('Profile updated successfully.', 'success');
      setEditing(false);
    } catch {
      addToast('Failed to save changes.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const displayName = form.full_name || user?.name || 'Parent';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="pane active">
      <div className="page-eyebrow">Step 1 of 5 — Completed</div>
      <h1 className="page-title">Your <em>Profile</em></h1>
      <p className="page-sub">Manage your account details and registered children.</p>

      <div className="profile-hero">
        <div className="ph-mono">{initial}</div>
        <div className="ph-info">
          <div className="ph-name">{displayName}</div>
          <div className="ph-role">Parent Account</div>
          <div className="ph-plan">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            <div><div className="ph-plan-txt">Active Treatment Plan</div></div>
          </div>
        </div>
        <div className="ph-actions">
          {!editing && (
            <button className="btn btn-ghost-light btn-sm" onClick={() => setEditing(true)}>
              <EditIcon /> Edit profile
            </button>
          )}
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-header"><span className="card-title">Account details</span></div>
          {!editing ? (
            <>
              <div className="info-row">
                <div className="ir-icon"><ProfileIcon /></div>
                <div><div className="ir-label">Full name</div><div className="ir-val">{parentInfo?.full_name || '—'}</div></div>
              </div>
              <div className="info-row">
                <div className="ir-icon"><MailIcon /></div>
                <div><div className="ir-label">Email</div><div className="ir-val">{parentInfo?.email || '—'}</div></div>
              </div>
              <div className="info-row">
                <div className="ir-icon"><PhoneIcon /></div>
                <div><div className="ir-label">Phone</div><div className="ir-val">{parentInfo?.phone || 'Not provided'}</div></div>
              </div>
              <div className="info-row">
                <div className="ir-icon"><CalendarIcon /></div>
                <div><div className="ir-label">Member since</div><div className="ir-val">{fmtDate(parentInfo?.created_at)}</div></div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '4px' }}>
              <div className="field"><label>Full name</label><input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div className="field"><label>Phone</label><input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Registered children {children.length > 0 ? `(${children.length})` : ''}</span>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><AddIcon /> Add child</button>
          </div>
          {children.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--ink-soft)', fontSize: '13px' }}>No children registered yet.</div>
          ) : (
            children.map(child => (
              <div key={child.id} className="child-row">
                <div className="cr-av">{child.full_name?.charAt(0)}</div>
                <div>
                  <div className="cr-name">{child.full_name}</div>
                  <div className="cr-meta">
                    {child.dob ? `Age ${new Date().getFullYear() - new Date(child.dob).getFullYear()} · ` : ''}
                    <span className="year-pill">Year {child.grade}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <AddChildModal
          onClose={() => setShowModal(false)}
          onAdded={() => { setShowModal(false); onChildrenChange(); }}
          addToast={addToast}
        />
      )}
    </div>
  );
}

// =========================== RESULTS TAB ===========================
// =========================== RESULTS TAB (FIXED) ===========================
function ResultsTab({ allResults, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [expanded, setExpanded] = useState(null);

  // Helper to extract a subtask score from a result object
  const getSubtaskScore = (result, taskKey) => {
    // Try multiple possible field names
    const fieldMap = {
      wordExplore: ['letter_score', 'task1_score', 'word_explorer', 'word_explorer_score'],
      storyReader: ['word_score', 'task2_score', 'story_reader', 'story_reader_score'],
      letterDetective: ['comprehension_score', 'task3_score', 'letter_detective', 'letter_detective_score'],
      numberMemory: ['fluency_score', 'task4_score', 'number_memory', 'number_memory_score'],
    };
    const possibleKeys = fieldMap[taskKey];
    for (let key of possibleKeys) {
      if (result[key] !== undefined && result[key] !== null) {
        return result[key];
      }
    }
    // Also check nested `tasks` object if present
    if (result.tasks) {
      const nestedMap = {
        wordExplore: 'task1',
        storyReader: 'task2',
        letterDetective: 'task3',
        numberMemory: 'task4',
      };
      const task = result.tasks[nestedMap[taskKey]];
      if (task && typeof task.score === 'number') return task.score;
    }
    return null;
  };

  useEffect(() => {
    fetchMyResults()
      .then(data => {
        // Log the first result to see what fields exist (remove after debugging)
        if (data && data.length > 0) {
          console.log('Sample assessment result:', data[0]);
        }
        setResults(data);
        localStorage.setItem('lastResultsView', Date.now().toString());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state"><div className="spinner"></div><div>Loading results...</div></div>;

  // Compute stats
  const latestResult = results.length > 0
    ? results.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0]
    : null;
  const latestScore = latestResult?.overall_score ?? latestResult?.summary?.overallScore ?? null;
  const latestRisk = latestResult?.risk_level ?? latestResult?.summary?.riskLevel ?? '—';
  const prevResult = results.length > 1 ? results[1] : null;
  const prevScore = prevResult?.overall_score ?? prevResult?.summary?.overallScore ?? null;
  const scoreDiff = (latestScore != null && prevScore != null) ? latestScore - prevScore : null;

  return (
    <div className="pane active">
      <div className="page-eyebrow">Step 3 of 5</div>
      <h1 className="page-title">Assessment <em>Results</em></h1>
      <p className="page-sub">View your child's reading assessment scores and progress over time.</p>

      {/* Stats cards */}
      <div className="three-col" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-val">{results.length}</div>
          <div className="stat-lbl">Assessments completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: scoreColor(latestScore) }}>
            {latestScore != null ? `${latestScore}%` : '—'}
          </div>
          <div className="stat-lbl">Latest overall score</div>
          <div className={`stat-change ${scoreDiff > 0 ? 'up' : scoreDiff < 0 ? 'down' : 'neutral'}`}>
            {scoreDiff != null ? `${scoreDiff > 0 ? '↑' : '↓'} ${Math.abs(scoreDiff)}% from last` : 'First assessment'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ fontSize: '1.5rem', color: RISK_CONFIG[latestRisk]?.color || 'var(--forest)' }}>
            {latestRisk}
          </div>
          <div className="stat-lbl">Current risk level</div>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-soft)' }}>
          <div style={{ marginBottom: '12px', fontSize: '2rem' }}>📋</div>
          <div style={{ fontWeight: 700, marginBottom: '8px' }}>No assessment results yet</div>
          <p style={{ fontSize: '13px', marginBottom: '16px' }}>Complete activities assigned by your therapist to start seeing results.</p>
          <button className="btn btn-primary" onClick={() => onNavigate('activities')}>Go to Activities</button>
        </div>
      ) : (
        results.map((r, i) => {
          const risk = RISK_CONFIG[r.risk_level] || RISK_CONFIG[r.riskLevel] || RISK_CONFIG.Normal;
          const isOpen = expanded === i;
          // Get subtask scores using our helper
          const wordExploreScore = getSubtaskScore(r, 'wordExplore');
          const storyReaderScore = getSubtaskScore(r, 'storyReader');
          const letterDetectiveScore = getSubtaskScore(r, 'letterDetective');
          const numberMemoryScore = getSubtaskScore(r, 'numberMemory');

          return (
            <div key={r.id || i} className="session-card">
              <div className="session-top" onClick={() => setExpanded(isOpen ? null : i)}>
                <div className="session-av" style={{ background: risk.bg, color: risk.color }}>
                  {r.risk_level?.[0] || r.riskLevel?.[0] || 'N'}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="session-name">
                    Assessment {results.length - i} — {fmtDate(r.completed_at)}
                  </div>
                  <div className="session-meta">
                    {r.child_name || 'Child'} · {r.risk_level || r.riskLevel || 'Normal'} risk
                  </div>
                </div>
                <div className="session-score" style={{ color: scoreColor(r.overall_score ?? r.summary?.overallScore) }}>
                  {r.overall_score != null ? `${r.overall_score}%` : r.summary?.overallScore != null ? `${r.summary.overallScore}%` : '—'}
                </div>
                <ChevronIcon open={isOpen} />
              </div>
              {isOpen && (
                <div className="session-body">
                  <ScoreBar label="Word Explore" score={wordExploreScore} />
                  <ScoreBar label="Story Reader" score={storyReaderScore} />
                  <ScoreBar label="Letter Detective" score={letterDetectiveScore} />
                  <ScoreBar label="Number Memory" score={numberMemoryScore} />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// =========================== ASSIGNMENT PROGRESS MODAL ===========================
function AssignmentProgressModal({ child, onClose }) {
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState({ letter_score: null, word_score: null, comprehension_score: null, fluency_score: null });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChildResults = async () => {
      try {
        const allResults = await fetchMyResults();
        const childResults = allResults.filter(r => r.child_id === child.id);
        if (childResults.length === 0) {
          setError('No assessment data for this child yet.');
          setLoading(false);
          return;
        }
        const latest = childResults.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0];
        setScores({
          letter_score: latest.letter_score,
          word_score: latest.word_score,
          comprehension_score: latest.comprehension_score,
          fluency_score: latest.fluency_score,
        });
      } catch {
        setError('Could not load progress data.');
      } finally {
        setLoading(false);
      }
    };
    if (child) fetchChildResults();
  }, [child]);

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Tasks Progress – {child.full_name}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {loading && <div className="loading-state">Loading progress...</div>}
          {error && <div className="error-msg show">{error}</div>}
          {!loading && !error && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <ScoreBar label="Letter Recognition" score={scores.letter_score} />
              <ScoreBar label="Word Reading" score={scores.word_score} />
              <ScoreBar label="Comprehension" score={scores.comprehension_score} />
              <ScoreBar label="Fluency" score={scores.fluency_score} />
              <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '8px', textAlign: 'center' }}>
                Based on most recent assessment
              </div>
            </div>
          )}
        </div>
        <div className="modal-actions" style={{ padding: '0 24px 24px' }}>
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// =========================== ACTIVITIES TAB ===========================

function ActivitiesTab({ children, assignments, selectedChildId, onSelectChild, onRefresh, onNavigate, addToast }) {
  const navigate = useNavigate();
  const [localAssignments, setLocalAssignments] = useState(assignments || []);
  const [progressModalChild, setProgressModalChild] = useState(null);

  useEffect(() => {
    setLocalAssignments(assignments);
  }, [assignments]);

  // Helper to get a default one‑line description based on activity type
  const getActivityDescription = (assignment) => {
    if (assignment.description && assignment.description.trim() !== '') {
      return assignment.description; // use therapist's description if provided
    }
    // Fallback descriptions
    if (assignment.type === 'letter_sound') {
      return 'Match each letter to its animal picture – a fun phonics game.';
    }
    if (assignment.type === 'syllable') {
      return 'Tap syllables, listen, then drag letters to build each word.';
    }
    return 'Complete this activity to build reading skills.';
  };

  const handleStart = (assignment) => {
    const { id, child_id, type, config } = assignment;
    let path = '';
    if (type === 'letter_sound') path = '/activity/letter-sound';
    else if (type === 'syllable') path = '/activity/syllable-breaking';
    else {
      addToast('Unknown activity type. Please contact your therapist.', 'error');
      return;
    }
    navigate(path, { state: { assignmentId: id, childId: child_id, config } });
  };

  const handleChildChange = (childId) => {
    onSelectChild(childId);
    if (onRefresh) onRefresh(childId);
  };

  const showSelector = children.length > 1;
  const filteredAssignments = localAssignments.filter(a => a.type === 'letter_sound' || a.type === 'syllable');

  return (
    <div className="pane active">
      <div className="page-eyebrow">Therapist‑Assigned</div>
      <h1 className="page-title">Learning <em>Activities</em></h1>
      <p className="page-sub">Complete these tasks to build reading and phonics skills.</p>

      {showSelector && (
        <div className="child-selector">
          <span className="child-selector-label">Activity for:</span>
          <select className="child-select" value={selectedChildId || ''} onChange={e => handleChildChange(e.target.value)}>
            <option value="">Select a child</option>
            {children.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
        </div>
      )}

      {children.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-soft)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>👶</div>
          <div style={{ fontWeight: 700, marginBottom: '8px' }}>No children registered yet</div>
          <p style={{ fontSize: '13px', marginBottom: '16px' }}>Register a child in your profile to see activities.</p>
          <button className="btn btn-primary" onClick={() => onNavigate('profile')}>Go to Profile</button>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-soft)' }}>
          <div style={{ fontWeight: 700, marginBottom: '8px' }}>No activities assigned yet</div>
          <p style={{ fontSize: '13px', marginBottom: '16px' }}>The therapist will add activities here. You can message them to ask about your plan.</p>
          <button className="btn btn-primary" onClick={() => onNavigate('chat')}>Message Therapist</button>
        </div>
      ) : (
        <div className="activities-grid">
          {filteredAssignments.map(assign => {
            const childForAssign = children.find(c => c.id === assign.child_id);
            let typeLabel = '';
            if (assign.type === 'letter_sound') typeLabel = 'Alphabet Swiping';
            else if (assign.type === 'syllable') typeLabel = 'Syllable Breaking';
            else typeLabel = 'Activity';

            return (
              <div key={assign.id} className="activity-card activity-card--forest">
                <div className="ac-top">
                  <div className="ac-badge-row"><span className="ac-badge ac-badge--forest">Assigned</span></div>
                </div>
                <div className="ac-body">
                  <div className="ac-tag">{typeLabel}</div>
                  <h3 className="ac-title">{assign.name}</h3>
                  {/* One‑line description – either custom or default */}
                  <p className="ac-desc">{getActivityDescription(assign)}</p>
                  <div className="ac-meta-row"><span className="ac-meta-item">Level {assign.difficulty_level}</span></div>
                </div>
                <div className="ac-footer" style={{ display: 'flex', gap: '10px', padding: '0 28px 24px' }}>
                  <button
                    className="ac-cta ac-cta--forest"
                    style={{ flex: 1 }}
                    onClick={(e) => { e.stopPropagation(); handleStart(assign); }}
                  >
                    Start Activity →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {progressModalChild && (
        <AssignmentProgressModal child={progressModalChild} onClose={() => setProgressModalChild(null)} />
      )}
    </div>
  );
}

// =========================== CHAT TAB ===========================
// =========================== CHAT TAB (WIDER, DARKER BORDERS, NO SIDEBAR) ===========================
function ChatTab({ user, addToast }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      localStorage.setItem('lastMessagesRead', Date.now().toString());
    }
  }, [messages, loading]);

  const loadMessages = useCallback(async () => {
    try {
      const msgs = await fetchMessages();
      setMessages(msgs);
      setError('');
    } catch {
      setError('Failed to load messages. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
    pollRef.current = setInterval(loadMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    try {
      const msg = await sendMessage(text);
      setMessages(prev => [...prev, msg]);
    } catch {
      setInput(text);
      addToast('Failed to send message. Please try again.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (loading) return <div className="loading-state"><div className="spinner"></div><div>Loading conversation...</div></div>;

  return (
    <div className="pane active">
      <div className="page-eyebrow">Treatment Plan</div>
      <h1 className="page-title">Messages with your <em>Therapist</em></h1>
      <p className="page-sub">Direct communication with your assigned dyslexia specialist.</p>

      {error && <div className="error-msg show" style={{ marginBottom: '16px' }}>{error}</div>}

      {/* Full-width chat window, no sidebar */}
      <div className="chat-window" style={{
  width: '100%',
  border: '2px solid #2D453A',
  borderRadius: 'var(--radius-xl)',
  boxShadow: '0 6px 20px rgba(61,90,76,0.15)'
}}>
        <div className="chat-topbar" style={{
          borderBottom: '1.5px solid rgba(61,90,76,0.3)', // darker separator
          background: 'var(--bg-beige)'
        }}>
          <div className="therapist-av">Dr</div>
          <div>
            <div className="therapist-name">Dr. Acheb Kenza</div>
            <div className="therapist-role">Speech Therapist

            </div>
          </div>
          <div className="online-badge">
            
          </div>
        </div>

        <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-soft)' }}>
              
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px' }}>No messages yet</div>
              <p style={{ fontSize: '14px' }}>Discuss your child’s progress with your therapist.</p>
            </div>
          ) : (
            messages.map((m) => {
              const isParent = m.sender_role === 'parent';
              return (
                <div key={m.id} className={`msg-wrap ${isParent ? 'right' : ''}`} style={{ marginBottom: '16px' }}>
                  {!isParent && <div className="msg-av">Dr</div>}
                  <div>
                    <div className={`bubble ${isParent ? 'p' : 't'}`} style={{
                      fontSize: '14px',
                      padding: '10px 16px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                      {m.content}
                    </div>
                    <div className={`msg-time ${isParent ? 'r' : ''}`} style={{ fontSize: '11px', marginTop: '4px' }}>
                      {fmtTime(m.created_at)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-footer" style={{
          borderTop: '1.5px solid rgba(61,90,76,0.3)',
          padding: '16px 24px',
          gap: '12px'
        }}>
          <textarea
            className="chat-inp"
            placeholder="Write a message to your therapist..."
            rows="1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={sending}
            style={{
              border: '1.5px solid rgba(61,90,76,0.3)',
              fontSize: '14px',
              padding: '12px 16px'
            }}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            style={{
              width: '48px',
              height: '48px',
              background: 'var(--forest)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================== GAMES TAB ===========================
function GamesTab({ selectedChildId, children, onNavigate, addToast }) {
  const navigate = useNavigate();

  const handleStartSpellingGame = () => {
    if (!selectedChildId) {
      addToast('Please select a child in the Activities tab first.', 'error');
      return;
    }
    navigate(`/spelling-bag?childId=${selectedChildId}`);
  };

  const hasChild = children && children.length > 0;

  return (
    <div className="pane active">
      <div className="page-eyebrow">Play & Learn</div>
      <h1 className="page-title">Literacy <em>Games</em></h1>
      <p className="page-sub">Fun, interactive games to reinforce reading skills.</p>

      {!hasChild && (
        <div className="journey-banner" style={{ marginBottom: '20px' }}>
          <div className="jb-icon" style={{ background: 'var(--gold-dark)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
          </div>
          <div className="jb-text">
            <div className="jb-title">Register a child to play games</div>
            <div className="jb-desc">You need at least one child registered before starting games.</div>
          </div>
          <button className="btn btn-primary btn-sm jb-action" onClick={() => onNavigate('profile')}>Add Child</button>
        </div>
      )}

      <div className="activities-grid">
        <div
          className="activity-card activity-card--forest"
          onClick={hasChild ? handleStartSpellingGame : undefined}
          style={{ cursor: hasChild ? 'pointer' : 'not-allowed', opacity: hasChild ? 1 : 0.6 }}
        >
          <div className="ac-top">
            <div className="ac-badge-row"><span className="ac-badge ac-badge--forest">Spelling</span></div>
          </div>
          <div className="ac-body">
            <div className="ac-tag">Picture Spelling</div>
            <h3 className="ac-title">Spelling words</h3>
            <p className="ac-desc">Look at the picture, listen to the word, and drag the letters into the correct order.</p>
            <div className="ac-meta-row">
        
            </div>
          </div>
          <div className="ac-footer">
            <button
              className="ac-cta ac-cta--forest"
              onClick={(e) => { e.stopPropagation(); handleStartSpellingGame(); }}
              disabled={!hasChild}
            >
              Start Game →
            </button>
          </div>
        </div>

        
      </div>
    </div>
  );
}


// =========================== ACTIVITIES PROGRESS TAB ===========================
// =========================== ACTIVITIES PROGRESS TAB (Grouped Bar Chart) ===========================
function ActivitiesProgressTab({ children, selectedChildId, assignments, allResults }) {
  const selectedChild = children.find(c => c.id === selectedChildId);

  const getSubtaskScore = (result, key) => {
    const fieldMap = {
      letter: ['letter_score', 'task1_score'],
      word: ['word_score', 'task2_score'],
    };
    for (let f of fieldMap[key]) {
      if (result[f] !== undefined && result[f] !== null) return result[f];
    }
    return null;
  };

  const childResults = allResults
    .filter(r => r.child_id === selectedChildId)
    .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));

  const chartData = childResults.map(r => {
    const letterScore = getSubtaskScore(r, 'letter');
    const wordScore = getSubtaskScore(r, 'word');
    let activitiesAvg = null;
    if (letterScore != null && wordScore != null) {
      activitiesAvg = (letterScore + wordScore) / 2;
    }
    return {
      dateStr: fmtDate(r.completed_at),
      overall: r.overall_score ?? r.summary?.overallScore ?? null,
      activitiesAvg,
    };
  }).filter(item => item.overall !== null || item.activitiesAvg !== null);

  const latest = chartData[chartData.length - 1];
  const latestOverall = latest?.overall ?? null;
  const latestActivities = latest?.activitiesAvg ?? null;

  if (!selectedChild) {
    return (
      <div className="pane active">
        <div className="page-eyebrow">Child Progress</div>
        <h1 className="page-title">Activities <em>Progress</em></h1>
        <p className="page-sub">Select a child from Activities to track their progress.</p>
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-soft)' }}>
          <div style={{ fontWeight: 700, marginBottom: '8px' }}>No child selected</div>
          <p style={{ fontSize: '13px' }}>Go to Activities and select a child first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pane active">
      <div className="page-eyebrow">Child Progress</div>
      <h1 className="page-title">Activities <em>Progress</em></h1>
      <p className="page-sub">{selectedChild.full_name}'s assessment scores and activity performance over time.</p>

      <div className="two-col" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-val" style={{ color: '#3D5A4C' }}>{latestOverall != null ? `${latestOverall}%` : '—'}</div>
          <div className="stat-lbl">Latest Assessment</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: '#E8A87C' }}>{latestActivities != null ? `${latestActivities}%` : '—'}</div>
          <div className="stat-lbl">Latest Activities Avg</div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>No data available</div>
          <p style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>Complete activities assigned by the therapist to see progress.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: '20px' }}>
          <ResponsiveContainer width="100%" height={420}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
              barSize={28}
              barGap={6}
              barCategoryGap={35}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(61,90,76,0.1)" />
              <XAxis
                dataKey="dateStr"
                tick={{ fontSize: 11, fill: '#555' }}
                tickLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={70}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#555' }} tickFormatter={(v) => `${v}%`} />
              <RechartsTooltip
                formatter={(value) => `${value}%`}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{ borderRadius: '12px', borderColor: 'rgba(61,90,76,0.15)' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontFamily: 'Nunito, sans-serif' }} />
              <Bar dataKey="overall" name="Assessment Results" fill="#3D5A4C" radius={[4,4,0,0]} />
              <Bar dataKey="activitiesAvg" name="Activities Progress" fill="#E8A87C" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: '11px', color: 'var(--ink-faint)', textAlign: 'center', marginTop: '16px' }}>
            Activities Progress = average of Alphabet Swiping & Syllable Breaking scores.
          </div>
        </div>
      )}
    </div>
  );
}
// =========================== HOME TAB ===========================

function HomeTab({ parentInfo, children, assignedCount, assignmentsList, allResults, selectedChildId, onNavigate, refreshAssignments }) {
  const selectedChild = children.find(c => c.id === selectedChildId);
  const childResults = allResults.filter(r => r.child_id === selectedChildId);
  const latestResult = childResults.length > 0
    ? childResults.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0]
    : null;

  const latestScore = latestResult?.overall_score ?? latestResult?.summary?.overallScore ?? null;
  const latestRisk = latestResult ? getRiskFromScore(latestScore) : null;
  const riskCfg = latestRisk ? RISK_CONFIG[latestRisk] : null;

  const progressPercent = latestScore ?? 0;
  const firstName = parentInfo?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="pane active">
      <div className="page-eyebrow">Parent portal</div>
      <h1 className="page-title">{getGreeting()}, <em>{firstName}</em></h1>
      <p className="page-sub">Here's an overview of {selectedChild ? `${selectedChild.full_name}'s` : 'your child\'s'} journey.</p>

      {/* Treatment Plan Banner */}
      <div className="plan-banner">
        <div className="pb-icon"><CheckIcon /></div>
        <div style={{ flex: 1 }}>
          <div className="pb-label">Active Treatment Plan</div>
          <div className="pb-name">With Dr. ACHEB Kenza — Speech Therapist</div>
          <div className="pb-bar"><div className="pb-fill" style={{ width: `${progressPercent}%` }} /></div>
          <div className="pb-prog">{progressPercent}% of programme completed</div>
        </div>
        <div className="pb-actions">
          {/* Buttons removed as per your existing code */}
        </div>
      </div>

      {/* Quick Action Cards (unchanged) */}
      <div className="quick-actions">
        <div className="qa-card" onClick={() => onNavigate('activities')}>
          <div className="qa-icon" style={{ background: 'var(--forest-faint)' }}><ActivitiesIcon /></div>
          <div className="qa-name">Start Activity</div>
          <div className="qa-sub">{assignedCount > 0 ? `${assignedCount} assigned by therapist` : 'No activities yet'}</div>
        </div>
        <div className="qa-card" onClick={() => onNavigate('results')}>
          <div className="qa-icon" style={{ background: 'var(--sage-light)' }}><ResultsIcon /></div>
          <div className="qa-name">Latest Score</div>
          <div className="qa-sub" style={{ color: latestScore != null ? scoreColor(latestScore) : undefined }}>
            {latestScore != null ? `${latestScore}% — ${latestRisk} risk` : 'No results yet'}
          </div>
        </div>
        <div className="qa-card" onClick={() => onNavigate('chat')}>
          <div className="qa-icon" style={{ background: 'var(--gold-light)' }}><ChatIcon /></div>
          <div className="qa-name">Contact Therapist</div>
          <div className="qa-sub">Dr. ACHEB Kenza</div>
        </div>
      </div>

      {/* TODAY'S PLAN CARD (with refresh button) */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-header">
          <span className="card-title">Today's Plan for {selectedChild?.full_name || 'your child'}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {assignmentsList && assignmentsList.length > 0 && (
              <button className="btn btn-outline btn-sm" onClick={() => onNavigate('activities')}>See all →</button>
            )}
          
          </div>
        </div>

        {assignmentsList && assignmentsList.length > 0 ? (
          assignmentsList.slice(0, 4).map((assign, i) => {
            let typeLabel = '';
            if (assign.type === 'letter_sound') typeLabel = 'Alphabet Swiping';
            else if (assign.type === 'syllable') typeLabel = 'Syllable Breaking';
            else typeLabel = 'Activity';
            return (
              <div key={assign.id || i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 0',
                borderBottom: i < Math.min(assignmentsList.length, 4) - 1 ? '1px solid var(--border-soft)' : 'none'
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--sage)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>{assign.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>{typeLabel} · Level {assign.difficulty_level}</div>
                </div>
                <span style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '20px', background: 'var(--lavender-light)', color: 'var(--forest)', fontWeight: 800 }}>Not started</span>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <div style={{ marginBottom: '12px', color: 'var(--ink-soft)' }}>No activities assigned yet.</div>
            {/* Optional: add a button to message therapist – uncomment if needed */}
            {/* <button className="btn btn-outline btn-sm" onClick={() => onNavigate('chat')}>Message Therapist</button> */}
          </div>
        )}
      </div>

      {/* No children CTA (unchanged) */}
      {children.length === 0 && (
        <div className="journey-banner">
          <div className="jb-icon" style={{ background: 'var(--gold-dark)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
          </div>
          <div className="jb-text">
            <div className="jb-title">Get started — Register a child</div>
            <div className="jb-desc">Add your child's profile to start tracking their progress and accessing activities.</div>
          </div>
          <button className="btn btn-primary btn-sm jb-action" onClick={() => onNavigate('profile')}>Add Child</button>
        </div>
      )}
    </div>
  );
}

// =========================== MAIN DASHBOARD ===========================
const ParentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [user] = useState(getCurrentUser());
  const [parentInfo, setParentInfo] = useState(null);
  const [children, setChildren] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newResults, setNewResults] = useState(0);
  const [assignedActivitiesCount, setAssignedActivitiesCount] = useState(0);
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [allResults, setAllResults] = useState([]);
  const { toasts, addToast, removeToast } = useToast();

  const fetchAll = useCallback(async () => {
    try {
      const [infoRes, childRes] = await Promise.all([apiFetch('/api/parents/me'), apiFetch('/api/children')]);
      if (infoRes.ok) setParentInfo(await infoRes.json());
      if (childRes.ok) {
        const childrenData = await childRes.json();
        setChildren(childrenData);
        if (childrenData.length > 0 && !selectedChildId) {
          setSelectedChildId(childrenData[0].id);
        }
      } else if (childRes.status === 401) {
        localStorage.clear();
        navigate('/auth');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInit(false);
    }
  }, [navigate, selectedChildId]);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const results = await fetchMyResults();
        setAllResults(results);
      } catch (err) {
        console.error('Failed to load results', err);
      }
    };
    if (!loadingInit) loadResults();
  }, [loadingInit]);

const loadAssignments = useCallback(async (childId) => {
  if (!childId) {
    setAssignmentsList([]);
    setAssignedActivitiesCount(0);
    return;
  }
  try {
   
    const res = await apiFetch(`/api/child-assignments/${childId}`);
    if (res.ok) {
      const data = await res.json();
      const filtered = (data.assignments || [])
        .filter(a => a.type === 'letter_sound' || a.type === 'syllable')
        .map(a => ({ ...a, name: a.name || a.activity_name }));
      setAssignmentsList(filtered);
      setAssignedActivitiesCount(filtered.length);
    } else {
      console.error('Failed to load assignments');
      setAssignmentsList([]);
    }
  } catch (err) {
    console.error('Error loading assignments:', err);
    setAssignmentsList([]);
  }
}, []);
  useEffect(() => {
    if (selectedChildId) loadAssignments(selectedChildId);
  }, [selectedChildId, loadAssignments]);

  const getChildProgress = (childId) => {
    const childResults = allResults.filter(r => r.child_id === childId);
    if (childResults.length === 0) return 0;
    const latest = childResults.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0];
    return latest.overall_score || 0;
  };

  const updateUnreadMessages = useCallback(async () => {
    try {
      const msgs = await fetchMessages();
      const lastRead = parseInt(localStorage.getItem('lastMessagesRead') || '0', 10);
      setUnreadMessages(msgs.filter(m => new Date(m.created_at).getTime() > lastRead).length);
    } catch {}
  }, []);

  const updateNewResults = useCallback(async () => {
    try {
      const res = await fetchMyResults();
      const lastView = parseInt(localStorage.getItem('lastResultsView') || '0', 10);
      setNewResults(res.filter(r => new Date(r.completed_at).getTime() > lastView).length);
    } catch {}
  }, []);

  useEffect(() => {
    if (!loadingInit) {
      updateUnreadMessages();
      updateNewResults();
      const interval = setInterval(() => { updateUnreadMessages(); updateNewResults(); }, 10000);
      return () => clearInterval(interval);
    }
  }, [loadingInit, updateUnreadMessages, updateNewResults]);

  useEffect(() => {
    if (activeTab === 'results') {
      localStorage.setItem('lastResultsView', Date.now());
      setNewResults(0);
    } else if (activeTab === 'chat') {
      localStorage.setItem('lastMessagesRead', Date.now());
      setUnreadMessages(0);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchAll();
    const handler = (e) => setActiveTab(e.detail);
    window.addEventListener('switchTab', handler);
    return () => window.removeEventListener('switchTab', handler);
  }, [fetchAll]);

  const handleLogout = async () => {
    try { await apiFetch('/api/auth/logout', { method: 'POST' }); } catch {}
    localStorage.clear();
    navigate('/auth');
  };

  const handleNotificationClick = () => {
    localStorage.setItem('lastMessagesRead', Date.now());
    localStorage.setItem('lastResultsView', Date.now());
    setUnreadMessages(0);
    setNewResults(0);
    addToast('All notifications cleared', 'success');
  };

  if (loadingInit) return <div className="loading-state"><div className="spinner" /><div>Loading portal...</div></div>;

  const displayName = parentInfo?.full_name || user?.name || 'Parent';
  const initial = displayName.charAt(0).toUpperCase();
  const totalNotifications = unreadMessages + newResults;
  const selectedChild = children.find(c => c.id === selectedChildId);
  const activeChildProgress = selectedChild ? getChildProgress(selectedChild.id) : 0;

  // Sidebar nav items
  const SIDEBAR_ITEMS = [
    { section: 'Main' },
    { key: 'home', label: 'Home', icon: HomeIcon },
    { key: 'profile', label: 'Profile', icon: ProfileIcon },
    { section: 'Progress' },
    { key: 'results', label: 'Assessment Results', icon: ResultsIcon, badge: newResults > 0 ? newResults : null },
    { key: 'activities', label: 'Activities', icon: ActivitiesIcon, badge: assignedActivitiesCount > 0 ? assignedActivitiesCount : null, badgeType: 'gold' },
    { key: 'games', label: 'Games', icon: GamesIcon },
    { key: 'progress', label: 'Progress', icon: ProgressTabIcon },
    { section: 'Care' },
    { key: 'chat', label: 'Messages', icon: ChatIcon, badge: unreadMessages > 0 ? unreadMessages : null },
  ];

  // Mobile bottom nav (5 key tabs)
  const MOBILE_TABS = [
    { key: 'home', label: 'Home', icon: HomeIcon },
    { key: 'activities', label: 'Activities', icon: ActivitiesIcon, badge: assignedActivitiesCount },
    { key: 'results', label: 'Results', icon: ResultsIcon, badge: newResults },
    { key: 'chat', label: 'Messages', icon: ChatIcon, badge: unreadMessages },
    { key: 'profile', label: 'Profile', icon: ProfileIcon },
  ];

  return (
    <div className="pd">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* TOP NAV — brand + user only, NO tab buttons */}
      <nav className="topnav">
        <div className="brand">
          <div className="brand-icon">DS</div>
          <span className="brand-name">Dyslexia<span style={{ fontStyle: 'italic' }}>Support</span></span>
        </div>

        <div className="nav-right">
         
          
         
          <button className="user-chip logout-chip" onClick={handleLogout}>
            <LogoutIcon />
            <span>Sign out</span>
          </button>
        </div>
      </nav>

      {/* JOURNEY STRIP — steps are now clickable */}
      <div className="journey-strip">
        <div className="journey-step">
          <div className="jstep done" onClick={() => setActiveTab('profile')} title="Go to Profile">
            <div className="jstep-num"><CheckIcon /></div>
            <div><div className="jstep-label">Register</div><div className="jstep-sub">Profile & child</div></div>
          </div>
          <div className="jconnector done"></div>
        </div>
        <div className="journey-step">
          <div className="jstep done" onClick={() => setActiveTab('activities')} title="Go to Activities">
            <div className="jstep-num"><CheckIcon /></div>
            <div><div className="jstep-label">First task</div><div className="jstep-sub">Complete activities</div></div>
          </div>
          <div className="jconnector done"></div>
        </div>
        <div className="journey-step">
          <div className={`jstep ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')} title="Go to Results">
            <div className="jstep-num">3</div>
            <div><div className="jstep-label">Assessment</div><div className="jstep-sub">View results</div></div>
          </div>
          <div className="jconnector"></div>
        </div>
        <div className="journey-step">
          <div className={`jstep ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')} title="Go to Messages">
            <div className="jstep-num">4</div>
            <div><div className="jstep-label">Treatment plan</div><div className="jstep-sub">Sign up with therapist</div></div>
          </div>
          <div className="jconnector"></div>
        </div>
        <div className="journey-step">
          <div className={`jstep ${activeTab === 'progress' ? 'active' : ''}`} onClick={() => setActiveTab('progress')} title="Go to Progress">
            <div className="jstep-num">5</div>
            <div><div className="jstep-label">Ongoing care</div><div className="jstep-sub">Chat & monitor</div></div>
          </div>
        </div>
      </div>

      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          {SIDEBAR_ITEMS.map((item, i) => {
            if (item.section) return <div key={i} className="sidebar-section">{item.section}</div>;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={`slink ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => setActiveTab(item.key)}
              >
                <Icon />
                {item.label}
                {item.badge != null && (
                  <span className={`slink-badge ${item.badgeType === 'gold' ? 'gold' : ''}`}>{item.badge}</span>
                )}
              </button>
            );
          })}

          {selectedChild && (
            <div className="child-summary">
              <div className="cs-label">Active child</div>
              <div className="cs-name">{selectedChild.full_name}</div>
              <div className="cs-meta">Year {selectedChild.grade}</div>
            
            </div>
          )}
        </aside>

        {/* MAIN CONTENT */}
        <main className="main">
       {activeTab === 'home' && (
  <HomeTab
    parentInfo={parentInfo}
    children={children}
    assignedCount={assignedActivitiesCount}
    assignmentsList={assignmentsList}   
    allResults={allResults}
    selectedChildId={selectedChildId}
    onNavigate={setActiveTab}
  />
)}
          {activeTab === 'profile' && (
            <ProfileTab
              user={user}
              parentInfo={parentInfo}
              children={children}
              onChildrenChange={fetchAll}
              addToast={addToast}
            />
          )}
          {activeTab === 'results' && (
            <ResultsTab allResults={allResults} onNavigate={setActiveTab} />
          )}
          {activeTab === 'activities' && (
            <ActivitiesTab
              children={children}
              assignments={assignmentsList}
              selectedChildId={selectedChildId}
              onSelectChild={setSelectedChildId}
              onRefresh={loadAssignments}
              onNavigate={setActiveTab}
              addToast={addToast}
            />
          )}
          {activeTab === 'games' && (
            <GamesTab
              selectedChildId={selectedChildId}
              children={children}
              onNavigate={setActiveTab}
              addToast={addToast}
            />
          )}
          {activeTab === 'progress' && (
            <ActivitiesProgressTab
              children={children}
              selectedChildId={selectedChildId}
              assignments={assignmentsList}
              allResults={allResults}
            />
          )}
          {activeTab === 'chat' && (
            <ChatTab user={user} addToast={addToast} />
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="mobile-nav">
        {MOBILE_TABS.map(tab => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              className={`mob-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <div className="mob-tab-icon">
                <TabIcon />
                {tab.badge > 0 && <span className="mob-badge">{tab.badge}</span>}
              </div>
              <span className="mob-tab-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default ParentDashboard;