import { useState, useEffect } from 'react';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── helpers ────────────────────────────────────────────────────────────────
const token = () => localStorage.getItem('token');
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token()}`,
});

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API_URL}${path}`, { headers: authHeaders(), ...opts });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ─── Risk level config ───────────────────────────────────────────────────────
const RISK_CONFIG = {
  Normal:   { bg: '#e6f5ee', color: '#1a6b40', label: 'Normal' },
  Mild:     { bg: '#fef6e4', color: '#8a5a0a', label: 'Mild' },
  Moderate: { bg: '#fff0e8', color: '#8a3a10', label: 'Moderate' },
  Severe:   { bg: '#feeaea', color: '#8a1f1f', label: 'Severe' },
};

const riskFromScore = (s) => {
  if (s == null) return null;
  if (s >= 85) return 'Normal';
  if (s >= 70) return 'Mild';
  if (s >= 50) return 'Moderate';
  return 'Severe';
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─── mini components ─────────────────────────────────────────────────────────
function RiskBadge({ riskLevel }) {
  const cfg = RISK_CONFIG[riskLevel];
  if (!cfg) return <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#f0f0f0', color: '#888' }}>NO DATA</span>;
  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    'ON TRACK':      { bg: '#e6f9f0', color: '#1db87a' },
    'NEEDS SUPPORT': { bg: '#fff3e0', color: '#f59e0b' },
    'AT RISK':       { bg: '#fff0f0', color: '#e84848' },
    'NO DATA':       { bg: '#f0f0f0', color: '#999' },
  };
  const s = map[status] || map['NO DATA'];
  return <span style={{ background: s.bg, color: s.color, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>{status}</span>;
}

function Avatar({ name }) {
  const initials = name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return <div className="dashboard__avatar">{initials}</div>;
}

function MiniScoreBar({ value, color = '#4a7cf6' }) {
  return (
    <div style={{ background: '#f0f0f0', borderRadius: 4, height: 6, width: 80, overflow: 'hidden' }}>
      <div style={{ background: color, height: '100%', width: `${Math.min(value ?? 0, 100)}%`, borderRadius: 4, transition: 'width 0.6s ease' }} />
    </div>
  );
}

// ─── Assessment Detail Modal ─────────────────────────────────────────────────
function AssessmentDetailModal({ student, assessments, onClose }) {
  if (!student) return null;
  return (
    <div className="dashboard__modal-overlay" onClick={onClose}>
      <div className="dashboard__modal" style={{ maxWidth: 580, width: '92%' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 className="dashboard__modal-title" style={{ margin: 0 }}>
            Assessment History — {student.child_name || student.name}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#666', lineHeight: 1 }}>×</button>
        </div>

        {assessments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#999', fontSize: 13 }}>No assessment records yet.</div>
        ) : (
          assessments.map((a, i) => {
            const riskConf = RISK_CONFIG[a.risk_level];
            return (
              <div key={a.session_uuid || i} style={{ border: '1px solid #eee', borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1E2D25' }}>Session {assessments.length - i}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Year {a.child_grade} · {fmtDate(a.completed_at || a.session_started_at)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 22, color: riskConf?.color || '#888' }}>{a.overall_score != null ? `${a.overall_score}%` : '—'}</div>
                    <RiskBadge riskLevel={a.risk_level} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'Word Explorer', score: a.task1_score },
                    { label: 'Story Reader', score: a.task2_score },
                    { label: 'Letter Detective', score: a.task3_score },
                    { label: 'Number Memory', score: a.task4_score },
                  ].map(({ label, score }) => (
                    <div key={label} style={{ background: '#f8f9fa', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{label}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MiniScoreBar value={score} color={riskConf?.color || '#4a7cf6'} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>{score != null ? `${score}%` : 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {a.scoring_method && (
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 10, textAlign: 'right' }}>Method: {a.scoring_method === 'weighted' ? 'Weighted average' : 'Simple average'}</div>
                )}
              </div>
            );
          })
        )}
        <div className="dashboard__modal-actions">
          <button onClick={onClose} className="dashboard__modal-cancel">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── static mock data ────────────────────────────────────────────────────────
const MOCK_STUDENTS = [
  { id: 1, name: 'Leo Henderson', grade: 'Grade 3', age: 8, status: 'ON TRACK', phonologicalScore: 84, assessmentCount: 1 },
  { id: 2, name: 'Sarah Miller', grade: 'Grade 4', age: 9, status: 'AT RISK', phonologicalScore: 42, assessmentCount: 1 },
  { id: 3, name: 'Jamie Watson', grade: 'Grade 2', age: 7, status: 'NO DATA', phonologicalScore: null, assessmentCount: 0 },
];

const MOCK_ACTIVITY = [
  { id: 1, dot: '#4a7cf6', title: 'Leo H. completed "Vowel Sounds Mastery"', sub: 'Score: 92% • Duration: 12 mins • Today at 10:45 AM' },
  { id: 2, dot: '#f59e0b', title: 'Sarah M. struggled with "Blending Level 2"', sub: 'System flagged high error rate (45%) • 2 hours ago' },
];

const MOCK_NOTES = [
  { id: 1, date: 'Dec 12, 2023', text: 'Follow up with Sarah\'s parents regarding the updated intervention plan.' },
];

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
  { id: 'students',  label: 'Students',  icon: '👥' },
  { id: 'reports',   label: 'Reports',   icon: '📊' },
  { id: 'settings',  label: 'Settings',  icon: '⚙' },
  { id: 'audit',     label: 'Security Log', icon: '🔐' },
];

export default function Dashboard() {
  const [activePage, setActivePage] = useState('dashboard');
  const [students, setStudents] = useState(MOCK_STUDENTS);
  const [activity, setActivity] = useState(MOCK_ACTIVITY);
  const [notes, setNotes] = useState(MOCK_NOTES);
  const [newNote, setNewNote] = useState('');
  const [search, setSearch] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', grade: '', age: '' });

  // Assessment summaries keyed by child name (from full_assessment_summary)
  const [assessmentMap, setAssessmentMap] = useState({}); // { childName: [summary, ...] }
  const [selectedStudent, setSelectedStudent] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    window.location.href = '/';
  };

  useEffect(() => { loadDashboardData(); }, []);

  async function loadDashboardData() {
    try {
      // Load students AND all assessment summaries in parallel
      const [childrenRes, activityRes, summariesRes] = await Promise.allSettled([
        apiFetch('/api/dashboard/students'),
        apiFetch('/api/dashboard/activity'),
        apiFetch('/api/dashboard/assessment-summaries'),  // new endpoint
      ]);

      if (childrenRes.status === 'fulfilled' && childrenRes.value?.students?.length) {
        setStudents(childrenRes.value.students);
      }
      if (activityRes.status === 'fulfilled' && activityRes.value?.activity?.length) {
        setActivity(activityRes.value.activity);
      }
      if (summariesRes.status === 'fulfilled' && summariesRes.value?.summaries) {
        // Group summaries by child_name (or child_id)
        const map = {};
        for (const s of summariesRes.value.summaries) {
          const key = s.child_name || 'Unknown';
          if (!map[key]) map[key] = [];
          map[key].push(s);
        }
        setAssessmentMap(map);
      }
    } catch {
      // fall back to mock data
    }
  }

  // Merge assessment data into student rows
  const enrichedStudents = students.map((s) => {
    const summaries = assessmentMap[s.name] || [];
    const latest = summaries[0]; // already ordered DESC
    return {
      ...s,
      riskLevel: latest?.risk_level || null,
      overallScore: latest?.overall_score ?? s.phonologicalScore,
      assessmentCount: latest ? summaries.length : (s.assessmentCount || 0),
      lastAssessmentDate: latest?.completed_at || s.lastAssessmentDate || null,
      summaries,
    };
  });

  const handleNavigation = (id) => {
    if (id === 'audit') { window.location.href = '/audit-log'; }
    else { setActivePage(id); }
  };

  const filtered = enrichedStudents.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'Total Students', value: students.length, badge: null, icon: '👤', iconBg: '#e0f0ff' },
    { label: 'Assessments Completed', value: Object.values(assessmentMap).flat().length, badge: null, icon: '📋', iconBg: '#fff3e0' },
    { label: 'At Risk', value: enrichedStudents.filter(s => s.riskLevel === 'Severe' || s.riskLevel === 'Moderate').length, badge: null, icon: '⚠️', iconBg: '#ffeaea' },
    { label: 'Normal Range', value: enrichedStudents.filter(s => s.riskLevel === 'Normal').length, badge: null, icon: '✅', iconBg: '#e6fff4' },
  ];

  async function handleAddNote(e) {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      const data = await apiFetch('/api/dashboard/notes', { method: 'POST', body: JSON.stringify({ text: newNote }) });
      setNotes((prev) => [data.note, ...prev]);
    } catch {
      setNotes((prev) => [{ id: Date.now(), date: 'Today', text: newNote }, ...prev]);
    }
    setNewNote('');
  }

  async function handleAddStudent(e) {
    e.preventDefault();
    try {
      const data = await apiFetch('/api/dashboard/students', {
        method: 'POST',
        body: JSON.stringify({ name: addForm.name, grade: addForm.grade, age: addForm.age }),
      });
      setStudents((prev) => [...prev, data.student]);
    } catch {
      setStudents((prev) => [...prev, { id: Date.now(), name: addForm.name, grade: addForm.grade, age: parseInt(addForm.age), status: 'NO DATA', phonologicalScore: null, assessmentCount: 0 }]);
    }
    setAddForm({ name: '', grade: '', age: '' });
    setShowAddStudent(false);
  }

  return (
    <div className="dashboard">
      <aside className="dashboard__sidebar">
        <div className="dashboard__logo">
          <div className="dashboard__logo-icon">L</div>
          <span className="dashboard__logo-text">LexiCare</span>
        </div>

        <nav className="dashboard__nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`dashboard__nav-item ${activePage === item.id ? 'dashboard__nav-item--active' : ''}`}
            >
              <span className="dashboard__nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="dashboard__user">
          <div className="dashboard__user-label">LOGGED IN AS</div>
          <div className="dashboard__user-details">
            <div className="dashboard__user-avatar">T</div>
            <div>
              <div className="dashboard__user-name">Therapist</div>
              <div className="dashboard__user-role">Clinical Specialist</div>
            </div>
          </div>
          <button onClick={handleLogout} className="dashboard__logout-btn">Logout</button>
        </div>
      </aside>

      <main className="dashboard__main">
        <header className="dashboard__header">
          <div className="dashboard__breadcrumb">
            <span>Dashboard</span><span>›</span>
            <span className="dashboard__breadcrumb-current">Student Overview</span>
          </div>
          <div className="dashboard__actions">
            <div className="dashboard__search">
              <span className="dashboard__search-icon">🔍</span>
              <input placeholder="Search students…" value={search} onChange={(e) => setSearch(e.target.value)} className="dashboard__search-input" />
            </div>
            <button onClick={loadDashboardData} style={{ background: 'none', border: '1px solid #ddd', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, color: '#555' }}>↻ Refresh</button>
          </div>
        </header>

        <div className="dashboard__content">
          {/* Stats Row */}
          <div className="dashboard__stats-grid">
            {stats.map((s) => (
              <div key={s.label} className="dashboard__stat-card">
                <div className="dashboard__stat-header">
                  <div className="dashboard__stat-icon" style={{ background: s.iconBg }}>{s.icon}</div>
                </div>
                <div className="dashboard__stat-label">{s.label}</div>
                <div className="dashboard__stat-value">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Student Progress Table */}
          <div className="dashboard__table-container">
            <div className="dashboard__table-header">
              <h2 className="dashboard__table-title">Student Assessment Results</h2>
              <div className="dashboard__table-actions">
                <button onClick={() => setShowAddStudent(true)} className="dashboard__add-btn">+ Add Student</button>
              </div>
            </div>

            <div className="dashboard__table">
              <div className="dashboard__col-headers">
                <div>STUDENT</div>
                <div>RISK LEVEL</div>
                <div>OVERALL SCORE</div>
                <div>TASK BREAKDOWN</div>
                <div>LAST ASSESSMENT</div>
                <div>ACTIONS</div>
              </div>

              {filtered.map((s) => {
                const riskConf = RISK_CONFIG[s.riskLevel];
                const latest = s.summaries?.[0];
                const scoreColor = riskConf?.color || '#aaa';

                return (
                  <div key={s.id} className="dashboard__row">
                    {/* Student */}
                    <div className="dashboard__student-info">
                      <Avatar name={s.name} />
                      <div className="dashboard__student-details">
                        <div className="dashboard__student-name">{s.name}</div>
                        <div className="dashboard__student-meta">{s.grade}{s.age ? ` • Age ${s.age}` : ''}</div>
                        {s.assessmentCount > 0 && <div style={{ fontSize: 10, color: '#aaa' }}>{s.assessmentCount} session{s.assessmentCount !== 1 ? 's' : ''}</div>}
                      </div>
                    </div>

                    {/* Risk */}
                    <div>
                      {s.riskLevel ? <RiskBadge riskLevel={s.riskLevel} /> : <StatusBadge status={s.status || 'NO DATA'} />}
                    </div>

                    {/* Overall Score */}
                    <div>
                      {s.overallScore != null ? (
                        <span style={{ fontWeight: 800, fontSize: 18, color: scoreColor }}>{s.overallScore}%</span>
                      ) : (
                        <span style={{ color: '#bbb', fontSize: 13 }}>—</span>
                      )}
                    </div>

                    {/* Task Breakdown mini bars */}
                    <div>
                      {latest ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {[
                            { key: 'task1_score', label: 'T1' },
                            { key: 'task2_score', label: 'T2' },
                            { key: 'task3_score', label: 'T3' },
                            { key: 'task4_score', label: 'T4' },
                          ].map(({ key, label }) => (
                            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span style={{ fontSize: 10, color: '#aaa', width: 14 }}>{label}</span>
                              <MiniScoreBar value={latest[key]} color={scoreColor} />
                              <span style={{ fontSize: 10, color: '#666', width: 26 }}>{latest[key] != null ? `${latest[key]}%` : '—'}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#bbb', fontSize: 12 }}>No data</span>
                      )}
                    </div>

                    {/* Last Assessment */}
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {s.lastAssessmentDate ? fmtDate(s.lastAssessmentDate) : <span style={{ color: '#bbb' }}>—</span>}
                    </div>

                    {/* Actions */}
                    <div className="dashboard__actions-group">
                      <button
                        className="dashboard__review-btn"
                        onClick={() => setSelectedStudent(s)}
                        disabled={!s.summaries?.length}
                        style={{ opacity: s.summaries?.length ? 1 : 0.4 }}
                      >
                        View Results
                      </button>
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div style={{ padding: '32px', textAlign: 'center', color: '#aaa', fontSize: 13 }}>No students found.</div>
              )}
            </div>

            <div className="dashboard__table-footer">
              <span>Showing {filtered.length} of {students.length} students</span>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="dashboard__bottom-grid">
            <div className="dashboard__activity-card">
              <h3 className="dashboard__card-title">Recent Student Activity</h3>
              <div className="dashboard__activity-list">
                {activity.map((a) => (
                  <div key={a.id} className="dashboard__activity-item">
                    <div className="dashboard__activity-dot" style={{ background: a.dot }} />
                    <div>
                      <div className="dashboard__activity-title">{a.title}</div>
                      <div className="dashboard__activity-sub">{a.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard__notes-card">
              <h3 className="dashboard__card-title">Therapist Notes</h3>
              <div className="dashboard__notes-list">
                {notes.map((n) => (
                  <div key={n.id} className="dashboard__note-item">
                    <div className="dashboard__note-date">{n.date}</div>
                    <div className="dashboard__note-text">{n.text}</div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddNote} className="dashboard__note-form">
                <div className="dashboard__note-input-container">
                  <input
                    placeholder="+ Add Quick Note"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="dashboard__note-input"
                  />
                  {newNote && <button type="submit" className="dashboard__note-save">Save</button>}
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="dashboard__modal-overlay" onClick={() => setShowAddStudent(false)}>
          <div className="dashboard__modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="dashboard__modal-title">Add New Student</h3>
            <form onSubmit={handleAddStudent}>
              {[
                { label: 'Full Name', key: 'name', type: 'text', placeholder: 'e.g. Emily Johnson' },
                { label: 'Grade', key: 'grade', type: 'text', placeholder: 'e.g. Grade 3' },
                { label: 'Age', key: 'age', type: 'number', placeholder: 'e.g. 8' },
              ].map((f) => (
                <div key={f.key} className="dashboard__form-group">
                  <label className="dashboard__form-label">{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={addForm[f.key]}
                    onChange={(e) => setAddForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    required
                    className="dashboard__form-input"
                  />
                </div>
              ))}
              <div className="dashboard__modal-actions">
                <button type="button" onClick={() => setShowAddStudent(false)} className="dashboard__modal-cancel">Cancel</button>
                <button type="submit" className="dashboard__modal-submit">Add Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assessment Detail Modal */}
      {selectedStudent && (
        <AssessmentDetailModal
          student={selectedStudent}
          assessments={selectedStudent.summaries || []}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}