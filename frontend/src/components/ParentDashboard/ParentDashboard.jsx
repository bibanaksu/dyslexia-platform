// ParentDashboard.jsx — LexiCare Parent Portal (Redesigned)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
const BookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
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
const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);
const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
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

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';

// =========================== COMPONENTS ===========================
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

function AddChildModal({ onClose, onAdded }) {
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

function ProfileTab({ user, parentInfo, children, onChildrenChange }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (parentInfo) setForm({ full_name: parentInfo.full_name || '', phone: parentInfo.phone || '' });
  }, [parentInfo]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      await apiFetch(`/api/parents/${user.userId}`, { method: 'PUT', body: JSON.stringify(form) });
      setSaveMsg('Profile updated successfully.');
      setEditing(false);
      setTimeout(() => setSaveMsg(''), 3500);
    } catch {
      setSaveMsg('Failed to save changes.');
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <div>
              <div className="ph-plan-txt">Active Treatment Plan</div>
              <div className="ph-plan-sub">With Dr. Amara Nwosu — 42% complete</div>
            </div>
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

      {saveMsg && <div className="success-msg show" style={{ marginBottom: '14px' }}>{saveMsg}</div>}

      <div className="two-col">
        <div className="card">
          <div className="card-header"><span className="card-title">Account details</span></div>
          <div id="profile-view" style={{ display: editing ? 'none' : 'block' }}>
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
          </div>
          {editing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '4px' }}>
              <div className="field"><label>Full name</label><input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div className="field"><label>Phone</label><input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>Save changes</button>
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
                    {child.dob ? `Age ${new Date().getFullYear() - new Date(child.dob).getFullYear()}` : ''}
                    <span className="year-pill">Year {child.grade}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && <AddChildModal onClose={() => setShowModal(false)} onAdded={() => { setShowModal(false); onChildrenChange(); }} />}
    </div>
  );
}

function ResultsTab() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetchMyResults()
      .then(data => {
        setResults(data);
        localStorage.setItem('lastResultsView', Date.now().toString());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state"><div className="spinner"></div><div>Loading results...</div></div>;

  return (
    <div className="pane active">
      <div className="page-eyebrow">Step 3 of 5</div>
      <h1 className="page-title">Assessment <em>Results</em></h1>
      <p className="page-sub">View your child's reading assessment scores and progress over time.</p>

      <div className="three-col" style={{ marginBottom: '24px' }}>
        <div className="stat-card"><div className="stat-val">{results.length}</div><div className="stat-lbl">Sessions completed</div><div className="stat-change up">+1 this month</div></div>
        <div className="stat-card"><div className="stat-val">78%</div><div className="stat-lbl">Latest overall score</div><div className="stat-change up">↑ 6% from last session</div></div>
        <div className="stat-card"><div className="stat-val">Mild</div><div className="stat-lbl">Current risk level</div><div className="stat-change neutral">Stable</div></div>
      </div>

      {results.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-soft)' }}>No assessment results yet.</div>
      ) : results.map((r, i) => {
        const risk = RISK_CONFIG[r.risk_level] || RISK_CONFIG.Normal;
        const isOpen = expanded === i;
        return (
          <div key={r.id || i} className="session-card">
            <div className="session-top" onClick={() => setExpanded(isOpen ? null : i)}>
              <div className="session-av" style={{ background: risk.bg, color: risk.color }}>{r.risk_level?.[0] || 'N'}</div>
              <div style={{ flex: 1 }}>
                <div className="session-name">Session {results.length - i} — {fmtDate(r.completed_at)}</div>
                <div className="session-meta">{r.child_name || 'Child'} · {r.risk_level || 'Normal'} risk</div>
              </div>
              <div className="session-score" style={{ color: scoreColor(r.overall_score) }}>{r.overall_score != null ? `${r.overall_score}%` : '—'}</div>
              <ChevronIcon open={isOpen} />
            </div>
            {isOpen && (
              <div className="session-body">
                <ScoreBar label="Letter Recognition" score={r.letter_score} />
                <ScoreBar label="Word Reading" score={r.word_score} />
                <ScoreBar label="Comprehension" score={r.comprehension_score} />
                <ScoreBar label="Fluency" score={r.fluency_score} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ActivitiesTab({ children, assignments, onRefresh }) {
  const navigate = useNavigate();
  const [selectedChildId, setSelectedChildId] = useState('');
  const [localAssignments, setLocalAssignments] = useState(assignments || []);

  useEffect(() => {
    setLocalAssignments(assignments);
  }, [assignments]);

  const handleStart = (assignment) => {
    const { id, child_id, type, config } = assignment;
    let path = '';
    if (type === 'matching') path = '/activity/word-picture';
    else if (type === 'letter_sound') path = '/activity/letter-sound';
    else if (type === 'reading') path = '/activity/reading';
    else path = '/spelling-bag';
    
    navigate(path, { state: { assignmentId: id, childId: child_id, config } });
  };

  const handleChildChange = async (childId) => {
    setSelectedChildId(childId);
    const fresh = await fetchAssignmentsForChild(childId);
    setLocalAssignments(fresh);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="pane active">
      <div className="page-eyebrow">Therapist‑Assigned</div>
      <h1 className="page-title">Learning <em>Activities</em></h1>
      <p className="page-sub">Complete these tasks to build reading and phonics skills.</p>

      {children.length > 1 && (
        <div className="child-selector">
          <span className="child-selector-label">Activity for:</span>
          <select className="child-select" value={selectedChildId} onChange={e => handleChildChange(e.target.value)}>
            <option value="">Select a child</option>
            {children.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
        </div>
      )}

      {localAssignments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-soft)' }}>
          No activities assigned yet. Your therapist will add activities here.
        </div>
      ) : (
        <div className="activities-grid">
          {localAssignments.map(assign => (
            <div key={assign.id} className="activity-card activity-card--forest" onClick={() => handleStart(assign)}>
              <div className="ac-top">
                <div className="ac-badge-row"><span className="ac-badge ac-badge--forest">Assigned</span></div>
              </div>
              <div className="ac-body">
                <div className="ac-tag">{assign.type === 'matching' ? '📷 Matching' : assign.type === 'letter_sound' ? '🔊 Phonics' : '📖 Reading'}</div>
                <h3 className="ac-title">{assign.name}</h3>
                <p className="ac-desc">{assign.description}</p>
                <div className="ac-meta-row"><span className="ac-meta-item">⭐ Level {assign.difficulty_level}</span></div>
              </div>
              <div className="ac-footer">
                <button className="ac-cta ac-cta--forest" onClick={(e) => { e.stopPropagation(); handleStart(assign); }}>Start Activity →</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatTab({ user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const [error, setError] = useState('');

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
    } catch (err) {
      console.error(err);
      setError('Failed to load messages');
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
    } catch (err) {
      console.error(err);
      setInput(text);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) return <div className="loading-state"><div className="spinner"></div><div>Loading conversation...</div></div>;

  return (
    <div className="pane active">
      <div className="page-eyebrow">Steps 4 & 5 — Treatment & ongoing care</div>
      <h1 className="page-title">Messages with your <em>Therapist</em></h1>
      <p className="page-sub">Direct communication with Dr. Amara Nwosu, your assigned dyslexia specialist.</p>

      {error && <div className="error-msg show">{error}</div>}

      <div className="journey-banner" style={{ marginBottom: '20px' }}>
        <div className="jb-icon"><CheckIcon /></div>
        <div className="jb-text">
          <div className="jb-title">Step 4: Confirm your treatment plan</div>
          <div className="jb-desc">Based on your child's results, a 5-session programme is recommended. Reply below to confirm enrollment.</div>
        </div>
      </div>

      <div className="chat-layout">
        <div className="chat-window">
          <div className="chat-topbar">
            <div className="therapist-av">Dr</div>
            <div>
              <div className="therapist-name">Dr. Amara Nwosu</div>
              <div className="therapist-role">Dyslexia Specialist</div>
            </div>
            <div className="online-badge"><div className="green-dot"></div>Online</div>
          </div>
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-soft)' }}>
                No messages yet. Introduce yourself to your therapist.
              </div>
            ) : (
              messages.map((m) => {
                const isParent = m.sender_role === 'parent';
                return (
                  <div key={m.id} className={`msg-wrap ${isParent ? 'right' : ''}`}>
                    {!isParent && <div className="msg-av">Dr</div>}
                    <div>
                      <div className={`bubble ${isParent ? 'p' : 't'}`}>{m.content}</div>
                      <div className={`msg-time ${isParent ? 'r' : ''}`}>{fmtTime(m.created_at)}</div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
          <div className="chat-footer">
            <textarea
              className="chat-inp"
              placeholder="Write a message to Dr. Nwosu..."
              rows="1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={sending}
            />
            <button className="send-btn" onClick={handleSend} disabled={!input.trim() || sending}>
              <SendIcon />
            </button>
          </div>
        </div>

        <div className="chat-info">
          <div className="ci-head">Therapist details</div>
          <div className="ci-row"><span className="ci-label">Name</span><span className="ci-val">Dr. Amara Nwosu</span></div>
          <div className="ci-row"><span className="ci-label">Specialty</span><span className="ci-val">Dyslexia & literacy</span></div>
          <div className="ci-row"><span className="ci-label">Plan</span><span className="ci-val">5 sessions</span></div>
          <div className="ci-row"><span className="ci-label">Progress</span><span className="ci-val">Session 2 of 5</span></div>
          <div style={{ marginTop: '14px' }}>
            <button className="btn btn-primary" style={{ width: '100%' }}>Book next session</button>
          </div>
          <div style={{ marginTop: '8px' }}>
            <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'results' }))}>
              View full results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeTab({ parentInfo, children, assignedCount }) {
  const navigate = useNavigate();
  const progressPercent = 42;

  const handleStartActivity = () => {
    if (children.length > 0) navigate(`/spelling-bag?childId=${children[0].id}`);
    else alert('Please add a child first.');
  };
  const handleViewResults = () => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'results' }));
  const handleMessage = () => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'chat' }));
  const handleActivities = () => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'activities' }));

  return (
    <div className="pane active">
      <div className="page-eyebrow">Parent portal</div>
      <h1 className="page-title">Good morning, <em>{parentInfo?.full_name?.split(' ')[0] || 'Parent'}</em></h1>
      <p className="page-sub">Here's an overview of your child's journey.</p>

      <div className="plan-banner">
        <div className="pb-icon"><CheckIcon /></div>
        <div style={{ flex: 1 }}>
          <div className="pb-label">Active Treatment Plan</div>
          <div className="pb-name">With Dr. Sarah Mohamed — Dyslexia Specialist</div>
          <div className="pb-bar"><div className="pb-fill" style={{ width: `${progressPercent}%` }} /></div>
          <div className="pb-prog">{progressPercent}% of programme completed — Session 2 of 5</div>
        </div>
        <div className="pb-actions">
          <button className="btn btn-ghost-light" onClick={handleMessage}>Message Therapist</button>
          <button className="btn btn-ghost-light" onClick={handleViewResults}>View Results</button>
        </div>
      </div>

      <div className="quick-actions">
        <div className="qa-card" onClick={handleActivities}>
          <div className="qa-icon" style={{ background: 'var(--forest-faint)' }}><ActivitiesIcon /></div>
          <div className="qa-name">Start Activity</div>
          <div className="qa-sub">{assignedCount} assigned by therapist</div>
        </div>
        <div className="qa-card" onClick={handleViewResults}>
          <div className="qa-icon" style={{ background: 'var(--sage-light)' }}><ResultsIcon /></div>
          <div className="qa-name">Latest Score</div>
          <div className="qa-sub">78% — Mild risk level</div>
        </div>
        <div className="qa-card" onClick={handleMessage}>
          <div className="qa-icon" style={{ background: 'var(--gold-light)' }}><ChatIcon /></div>
          <div className="qa-name">Contact Therapist</div>
          <div className="qa-sub">Dr. Sarah</div>
        </div>
      </div>

      <div className="home-activities-section">
        <div className="home-activities-header">
          <span className="home-activities-title">Today's Activities</span>
          <button className="btn-text-link" onClick={handleActivities}>View all →</button>
        </div>
        <div className="home-activities-grid">
          <div className="home-act-card" onClick={handleStartActivity}>
            <div className="hac-left">
              <div className="hac-icon hac-icon--forest"><BookIcon /></div>
              <div><div className="hac-tag">Spelling</div><div className="hac-name">Picture Spelling</div><div className="hac-meta"><ClockIcon /> 10 min</div></div>
            </div>
            <button className="hac-btn hac-btn--forest" onClick={(e) => { e.stopPropagation(); handleStartActivity(); }}>Start →</button>
          </div>
        </div>
      </div>
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

  const fetchAll = useCallback(async () => {
    try {
      const [infoRes, childRes] = await Promise.all([apiFetch('/api/parents/me'), apiFetch('/api/children')]);
      if (infoRes.ok) setParentInfo(await infoRes.json());
      if (childRes.ok) setChildren(await childRes.json());
      else if (childRes.status === 401) { localStorage.clear(); navigate('/auth'); }
    } catch (err) { console.error(err); } finally { setLoadingInit(false); }
  }, [navigate]);

 const loadAssignments = useCallback(async () => {
  if (children.length === 0) {
    setAssignedActivitiesCount(0);
    setAssignmentsList([]);
    return;
  }
  // Use the first child's ID (or the selected one)
  const firstChildId = children[0]?.id;
  if (!firstChildId) return;
  try {
    const assignments = await fetchAssignmentsForChild(firstChildId);
    console.log('Loaded assignments for child', firstChildId, assignments);
    setAssignmentsList(assignments);
    setAssignedActivitiesCount(assignments.length);
  } catch (err) {
    console.error('Error loading assignments:', err);
  }
}, [children]);

  useEffect(() => { if (!loadingInit && children.length) loadAssignments(); }, [loadingInit, children, loadAssignments]);

  const updateUnreadMessages = useCallback(async () => {
    try {
      const msgs = await fetchMessages();
      const lastRead = parseInt(localStorage.getItem('lastMessagesRead') || '0', 10);
      setUnreadMessages(msgs.filter(m => new Date(m.created_at).getTime() > lastRead).length);
    } catch (err) {}
  }, []);

  const updateNewResults = useCallback(async () => {
    try {
      const res = await fetchMyResults();
      const lastView = parseInt(localStorage.getItem('lastResultsView') || '0', 10);
      setNewResults(res.filter(r => new Date(r.completed_at).getTime() > lastView).length);
    } catch (err) {}
  }, []);

  useEffect(() => {
    if (!loadingInit) {
      updateUnreadMessages();
      updateNewResults();
      const interval = setInterval(() => { updateUnreadMessages(); updateNewResults(); }, 10000);
      return () => clearInterval(interval);
    }
  }, [loadingInit]);

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
    alert('Notifications cleared');
  };

  if (loadingInit) return <div className="loading-state"><div className="spinner" /><div>Loading portal...</div></div>;

  const displayName = parentInfo?.full_name || user?.name || 'Parent';
  const initial = displayName.charAt(0).toUpperCase();
  const totalNotifications = unreadMessages + newResults;
  const TABS = [
    { key: 'home', label: 'Home', icon: HomeIcon },
    { key: 'profile', label: 'Profile', icon: ProfileIcon },
    { key: 'results', label: 'Results', icon: ResultsIcon },
    { key: 'activities', label: 'Activities', icon: ActivitiesIcon },
    { key: 'chat', label: 'Messages', icon: ChatIcon }
  ];

  return (
    <div className="pd">
      <nav className="topnav">
        <div className="brand"><div className="brand-dot"><BookIcon /></div><span className="brand-name">Lexi<em>Care</em></span></div>
        <div className="nav-tabs">{TABS.map(tab => <button key={tab.key} className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}><tab.icon /> {tab.label}</button>)}</div>
        <div className="nav-right">
          <button className="notif-btn" onClick={handleNotificationClick}><BellIcon />{totalNotifications > 0 && <div className="notif-dot">{totalNotifications}</div>}</button>
          <div className="user-chip"><div className="user-av">{initial}</div><span className="user-name">{displayName}</span></div>
          <button className="user-chip" onClick={handleLogout}><LogoutIcon /><span>Sign out</span></button>
        </div>
      </nav>

      <div className="journey-strip">
        <div className="journey-step"><div className="jstep done"><div className="jstep-num"><CheckIcon /></div><div><div className="jstep-label">Register</div><div className="jstep-sub">Profile & child</div></div></div><div className="jconnector done"></div></div>
        <div className="journey-step"><div className="jstep done"><div className="jstep-num"><CheckIcon /></div><div><div className="jstep-label">First task</div><div className="jstep-sub">Complete activities</div></div></div><div className="jconnector done"></div></div>
        <div className="journey-step"><div className={`jstep ${activeTab === 'results' ? 'active' : ''}`}><div className="jstep-num">3</div><div><div className="jstep-label">Assessment</div><div className="jstep-sub">View results</div></div></div><div className="jconnector"></div></div>
        <div className="journey-step"><div className={`jstep ${activeTab === 'chat' ? 'active' : ''}`}><div className="jstep-num">4</div><div><div className="jstep-label">Treatment plan</div><div className="jstep-sub">Sign up with therapist</div></div></div><div className="jconnector"></div></div>
        <div className="journey-step"><div className="jstep"><div className="jstep-num">5</div><div><div className="jstep-label">Ongoing care</div><div className="jstep-sub">Chat & monitor</div></div></div></div>
      </div>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-section">Main</div>
          <button className={`slink ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}><HomeIcon /> Home</button>
          <button className={`slink ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}><ProfileIcon /> Profile</button>
          <div className="sidebar-section">Progress</div>
          <button className={`slink ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}><ResultsIcon /> Assessment Results{newResults > 0 && <span className="slink-badge">{newResults}</span>}</button>
          <button className={`slink ${activeTab === 'activities' ? 'active' : ''}`} onClick={() => setActiveTab('activities')}><ActivitiesIcon /> Activities{assignedActivitiesCount > 0 && <span className="slink-badge gold">{assignedActivitiesCount}</span>}</button>
          <div className="sidebar-section">Care</div>
          <button className={`slink ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}><ChatIcon /> Messages{unreadMessages > 0 && <span className="slink-badge">{unreadMessages}</span>}</button>
          {children.length > 0 && (
            <div className="child-summary">
              <div className="cs-label">Active child</div>
              <div className="cs-name">{children[0]?.full_name}</div>
              <div className="cs-meta">Year {children[0]?.grade}</div>
              <div className="cs-bar"><div className="cs-bar-fill"></div></div>
              <div className="cs-prog">42% treatment complete</div>
            </div>
          )}
        </aside>
        <main className="main">
          {activeTab === 'home' && <HomeTab parentInfo={parentInfo} children={children} assignedCount={assignedActivitiesCount} />}
          {activeTab === 'profile' && <ProfileTab user={user} parentInfo={parentInfo} children={children} onChildrenChange={fetchAll} />}
          {activeTab === 'results' && <ResultsTab />}
          {activeTab === 'activities' && 
  <ActivitiesTab 
    children={children} 
    assignments={assignmentsList} 
    onRefresh={loadAssignments} 
  />
}
          {activeTab === 'chat' && <ChatTab user={user} />}
        </main>
      </div>
    </div>
  );
};

export default ParentDashboard;