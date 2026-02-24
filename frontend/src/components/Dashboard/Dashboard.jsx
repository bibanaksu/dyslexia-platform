import { useState, useEffect } from 'react';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─── helpers ────────────────────────────────────────────────────────────────
const token = () => localStorage.getItem("token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token()}`,
});

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: authHeaders(),
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ─── mini components ─────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    "ON TRACK": { bg: "#e6f9f0", color: "#1db87a", label: "ON TRACK" },
    "NEEDS ATTENTION": { bg: "#fff0f0", color: "#e84848", label: "NEEDS ATTENTION" },
    "ASSESSMENT READY": { bg: "#eef4ff", color: "#4a7cf6", label: "ASSESSMENT READY" },
  };
  const s = map[status] || map["ON TRACK"];
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: 10,
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: 6,
        letterSpacing: 0.3,
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

function Avatar({ name, src }) {
  const initials = name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return src ? (
    <img src={src} alt={name} className="dashboard__avatar-img" />
  ) : (
    <div className="dashboard__avatar">
      {initials}
    </div>
  );
}

// ─── static mock data (used as fallback / seed) ──────────────────────────────
const MOCK_STUDENTS = [
  {
    id: 1,
    name: "Leo Henderson",
    grade: "Grade 3",
    age: 8,
    status: "ON TRACK",
    phonologicalScore: 84,
    scoreDelta: 5,
    fluency: 72,
    fluencyMax: 100,
    trend: [40, 52, 48, 60, 62, 70, 75],
  },
  {
    id: 2,
    name: "Sarah Miller",
    grade: "Grade 4",
    age: 9,
    status: "NEEDS ATTENTION",
    phonologicalScore: 62,
    scoreDelta: -2,
    fluency: 45,
    fluencyMax: 100,
    trend: [55, 58, 50, 48, 45, 43, 42],
  },
  {
    id: 3,
    name: "Jamie Watson",
    grade: "Grade 2",
    age: 7,
    status: "ASSESSMENT READY",
    phonologicalScore: 78,
    scoreDelta: 12,
    fluency: 58,
    fluencyMax: 100,
    trend: [30, 38, 45, 50, 55, 62, 66],
  },
];

const MOCK_ACTIVITY = [
  {
    id: 1,
    dot: "#4a7cf6",
    title: 'Leo H. completed "Vowel Sounds Mastery"',
    sub: "Score: 92% • Duration: 12 mins • Today at 10:45 AM",
  },
  {
    id: 2,
    dot: "#f59e0b",
    title: 'Sarah M. struggled with "Blending Level 2"',
    sub: "System flagged high error rate (45%) • 2 hours ago",
  },
  {
    id: 3,
    dot: "#10b981",
    title: "Jamie W. achieved a new reading record",
    sub: "62 words per minute • Yesterday at 4:30 PM",
  },
];

const MOCK_NOTES = [
  {
    id: 1,
    date: "Dec 12, 2023",
    text: "Follow up with Sarah's parents regarding the updated intervention plan.",
  },
  {
    id: 2,
    date: "Dec 11, 2023",
    text: "Prepare assessment materials for Leo's mid-term review.",
  },
];

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "students", label: "Students", icon: "👥" },
  { id: "activities", label: "Activity Library", icon: "📋" },
  { id: "reports", label: "Reports", icon: "📊" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

export default function Dashboard() {
  const [activePage, setActivePage] = useState("dashboard");
  const [students, setStudents] = useState(MOCK_STUDENTS);
  const [activity, setActivity] = useState(MOCK_ACTIVITY);
  const [notes, setNotes] = useState(MOCK_NOTES);
  const [newNote, setNewNote] = useState("");
  const [search, setSearch] = useState("");
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", grade: "", age: "" });

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    window.location.href = "/";
  };

  // Try to load real data from backend
  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const [childrenRes, activityRes] = await Promise.all([
        apiFetch("/api/dashboard/students"),
        apiFetch("/api/dashboard/activity"),
      ]);
      if (childrenRes?.students?.length) setStudents(childrenRes.students);
      if (activityRes?.activity?.length) setActivity(activityRes.activity);
    } catch {
      // fall back to mock data — backend may not be running yet
    }
  }

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    {
      label: "Total Students",
      value: students.length,
      badge: "+2 this week",
      badgeColor: "#1db87a",
      icon: "👤",
      iconBg: "#e0f0ff",
    },
    {
      label: "Pending Reviews",
      value: students.filter((s) => s.status === "NEEDS ATTENTION").length + 10,
      badge: `${students.filter((s) => s.status === "NEEDS ATTENTION").length + 2} urgent`,
      badgeColor: "#e84848",
      icon: "📋",
      iconBg: "#fff3e0",
    },
    {
      label: "Avg. Improvement",
      value: "18.4%",
      badge: null,
      icon: "📈",
      iconBg: "#e6fff4",
    },
    {
      label: "Sessions Today",
      value: 6,
      badge: null,
      icon: "📅",
      iconBg: "#f0ebff",
    },
  ];

  function handleAddStudent(e) {
    e.preventDefault();
    const s = {
      id: Date.now(),
      name: addForm.name,
      grade: addForm.grade,
      age: parseInt(addForm.age),
      status: "ON TRACK",
      phonologicalScore: 75,
      scoreDelta: 0,
      fluency: 50,
      fluencyMax: 100,
      trend: [40, 45, 50, 55, 58, 62, 65],
    };
    setStudents((prev) => [...prev, s]);
    setAddForm({ name: "", grade: "", age: "" });
    setShowAddStudent(false);
    // Try to save to backend
    apiFetch("/api/dashboard/students", {
      method: "POST",
      body: JSON.stringify({ name: s.name, grade: s.grade, age: s.age }),
    }).catch(() => {});
  }

  function handleAddNote(e) {
    e.preventDefault();
    if (!newNote.trim()) return;
    const n = {
      id: Date.now(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      text: newNote,
    };
    setNotes((prev) => [n, ...prev]);
    setNewNote("");
    apiFetch("/api/dashboard/notes", {
      method: "POST",
      body: JSON.stringify({ text: n.text }),
    }).catch(() => {});
  }

  function MiniBar({ value = 0, color = "#4a7cf6" }) {
    return (
      <div className="dashboard__fluency-bar">
        <div 
          className="dashboard__fluency-fill" 
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    );
  }

  function MiniBarChart({ trend = [] }) {
    const bars = trend.length ? trend : [30, 50, 40, 60, 55, 70, 65];
    const max = Math.max(...bars);
    return (
      <div className="dashboard__trend">
        {bars.map((v, i) => (
          <div
            key={i}
            className={`dashboard__trend-bar ${i === bars.length - 1 ? 'dashboard__trend-bar--latest' : ''}`}
            style={{ height: `${(v / max) * 100}%` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="dashboard__sidebar">
        <div className="dashboard__logo">
          <div className="dashboard__logo-icon">📍</div>
          <span className="dashboard__logo-text">LexiSupport</span>
        </div>

        <nav className="dashboard__nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setActivePage(n.id)}
              className={`dashboard__nav-item ${activePage === n.id ? 'dashboard__nav-item--active' : ''}`}
            >
              <span className="dashboard__nav-icon">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        <div className="dashboard__user">
          <div className="dashboard__user-label">LOGGED IN AS</div>
          <div className="dashboard__user-details">
            <div className="dashboard__user-avatar">SC</div>
            <div>
              <div className="dashboard__user-name">Dr. Sarah Chen</div>
              <div className="dashboard__user-role">Clinical Specialist</div>
            </div>
          </div>
          <button onClick={handleLogout} className="dashboard__logout-btn">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard__main">
        <header className="dashboard__header">
          <div className="dashboard__breadcrumb">
            <span>Dashboard</span>
            <span>›</span>
            <span className="dashboard__breadcrumb-current">Student Overview</span>
          </div>
          <div className="dashboard__actions">
            <div className="dashboard__search">
              <span className="dashboard__search-icon">🔍</span>
              <input
                placeholder="Search students…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="dashboard__search-input"
              />
            </div>
            <div className="dashboard__notification">
              🔔
              <span className="dashboard__notification-badge"></span>
            </div>
          </div>
        </header>

        <div className="dashboard__content">
          {/* Stats Row */}
          <div className="dashboard__stats-grid">
            {stats.map((s) => (
              <div key={s.label} className="dashboard__stat-card">
                <div className="dashboard__stat-header">
                  <div className="dashboard__stat-icon" style={{ background: s.iconBg }}>
                    {s.icon}
                  </div>
                  {s.badge && (
                    <span
                      className="dashboard__stat-badge"
                      style={{ color: s.badgeColor, background: s.badgeColor + "18" }}
                    >
                      {s.badge}
                    </span>
                  )}
                </div>
                <div className="dashboard__stat-label">{s.label}</div>
                <div className="dashboard__stat-value">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Student Progress Table */}
          <div className="dashboard__table-container">
            <div className="dashboard__table-header">
              <h2 className="dashboard__table-title">Student Progress Tracking</h2>
              <div className="dashboard__table-actions">
                <button className="dashboard__filter-btn">⚙ Filter</button>
                <button
                  onClick={() => setShowAddStudent(true)}
                  className="dashboard__add-btn"
                >
                  + Add Student
                </button>
              </div>
            </div>

            <div className="dashboard__table">
              <div className="dashboard__col-headers">
                <div>STUDENT</div>
                <div>STATUS</div>
                <div>PHONOLOGICAL SCORE</div>
                <div>FLUENCY</div>
                <div>PERFORMANCE TREND</div>
                <div>ACTIONS</div>
              </div>

              {filtered.map((s, i) => (
                <div key={s.id} className="dashboard__row">
                  <div className="dashboard__student-info">
                    <Avatar name={s.name} />
                    <div className="dashboard__student-details">
                      <div className="dashboard__student-name">{s.name}</div>
                      <div className="dashboard__student-meta">
                        {s.grade} • Age {s.age}
                      </div>
                    </div>
                  </div>

                  <div>
                    <StatusBadge status={s.status} />
                  </div>

                  <div>
                    <span className="dashboard__score">
                      {s.phonologicalScore}%{" "}
                      <span
                        className={`dashboard__score-delta ${
                          s.scoreDelta >= 0 ? 'dashboard__score-delta--positive' : 'dashboard__score-delta--negative'
                        }`}
                      >
                        {s.scoreDelta >= 0 ? "↑" : "↓"}
                        {Math.abs(s.scoreDelta)}%
                      </span>
                    </span>
                  </div>

                  <div className="dashboard__fluency">
                    <MiniBar
                      value={(s.fluency / s.fluencyMax) * 100}
                      color={s.status === "NEEDS ATTENTION" ? "#f59e0b" : "#4a7cf6"}
                    />
                    <div className="dashboard__fluency-value">{s.fluency} wpm</div>
                  </div>

                  <div>
                    <MiniBarChart trend={s.trend} />
                  </div>

                  <div className="dashboard__actions-group">
                    <button className="dashboard__assign-btn">Assign</button>
                    <button className="dashboard__review-btn">Review</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="dashboard__table-footer">
              <span>
                Showing {filtered.length} of {students.length} students
              </span>
              <div className="dashboard__pagination">
                <button className="dashboard__page-btn">‹</button>
                <button className="dashboard__page-btn">›</button>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="dashboard__bottom-grid">
            {/* Recent Activity */}
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
              <button className="dashboard__view-all">View All Activity</button>
            </div>

            {/* Therapist Notes */}
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
                  {newNote && (
                    <button type="submit" className="dashboard__note-save">
                      Save
                    </button>
                  )}
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
                { label: "Full Name", key: "name", type: "text", placeholder: "e.g. Emily Johnson" },
                { label: "Grade", key: "grade", type: "text", placeholder: "e.g. Grade 3" },
                { label: "Age", key: "age", type: "number", placeholder: "e.g. 8" },
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
                <button
                  type="button"
                  onClick={() => setShowAddStudent(false)}
                  className="dashboard__modal-cancel"
                >
                  Cancel
                </button>
                <button type="submit" className="dashboard__modal-submit">
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}