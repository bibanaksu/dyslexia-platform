import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BASE_URL = 'http://localhost:5000';

// Simple ID generator
const generateSessionId = () => {
  return Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
};

export default function ChildInfo() {
  const navigate = useNavigate();
  const [childName, setChildName] = useState('');
  const [childGrade, setChildGrade] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const saveChildSession = async (sessionData) => {
    const token = localStorage.getItem('token');
    
    const payload = {
      sessionUUID: sessionData.sessionUUID,
      childName: sessionData.childName,
      childGrade: sessionData.childGrade,
      childAge: sessionData.childAge || null,
      parentId: null,
      guestId: 'guest_' + Date.now(),
    };
    
    console.log('Saving child session to DB:', payload);
    
    const res = await fetch(`${BASE_URL}/api/child-info/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to save child session');
    }
    
    const data = await res.json();
    console.log('Child session saved successfully:', data);
    
    if (data.sessionId) {
      localStorage.setItem('child_session_id', data.sessionId);
    } else if (data.sessionUUID) {
      localStorage.setItem('child_session_id', data.sessionUUID);
    }
    
    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = childName.trim();
    const grade = childGrade.trim();
    
    if (!name) {
      setError("Please enter the child's name.");
      return;
    }
    if (!grade) {
      setError("Please select the child's grade.");
      return;
    }
    
    setIsLoading(true);
    setError('');

    const sessionId = generateSessionId();
    const gradeNum = parseInt(grade, 10);
    const childAge = isNaN(gradeNum) ? null : gradeNum + 5; // Grade 1 = age 6, consistent with 6-12 range

    // Save to localStorage for frontend access
    localStorage.setItem('child_session_id', sessionId);
    localStorage.setItem('child_info', JSON.stringify({
      childFullName: name,
      childGrade: grade,
      childAge: childAge,
      sessionId: sessionId
    }));

    // Clear all old quest/task progress for fresh start
    const progressKeys = [
      'reading_adventure_progress',
      'current_quest',
      'task_one_progress',
      'task_one_saved_db_id',
      'task3_progress',
      'task4_progress',
      'task3_saved_id',
      'task4_saved_id'
    ];
    progressKeys.forEach(k => localStorage.removeItem(k));

    try {
      await saveChildSession({
        sessionUUID: sessionId,
        childName: name,
        childGrade: grade,
        childAge: childAge
      });
      
      console.log('Child session successfully saved to database!');
      setIsLoading(false);
      navigate('/start');
      
    } catch (err) {
      console.error('Failed to save child session:', err);
      setError(err.message || 'Failed to save child information. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <div style={s.navBar}>
        <button onClick={() => navigate('/')} style={s.navBack}>←</button>
        <div style={s.logo}>
          <div style={s.logoIcon}>DS</div>
          <span style={s.logoText}>Dyslexia Support</span>
        </div>
      </div>
      <div style={s.card}>
        <h1 style={s.title}>Child Information</h1>
        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div style={s.fg}>
            <label style={s.label}>
              Child's Full Name <span style={{ color: '#D64545' }}>*</span>
            </label>
            <input
              type="text"
              value={childName}
              onChange={e => { setChildName(e.target.value); setError(''); }}
              placeholder="Enter the child's full name"
              style={s.input}
              maxLength={100}
              autoComplete="off"
            />
            <span style={s.hint}>As it will appear on the report</span>
          </div>
          <div style={s.fg}>
            <label style={s.label}>
              Grade Level <span style={{ color: '#D64545' }}>*</span>
            </label>
            <select
              value={childGrade}
              onChange={e => { setChildGrade(e.target.value); setError(''); }}
              style={s.input}
            >
              <option value="">— Select grade —</option>
              {[1, 2, 3, 4, 5, 6].map(g => {
                const ageLow = g + 5;
                const ageHigh = g + 6;
                return (
                  <option key={g} value={String(g)}>
                    Grade {g} (ages {ageLow}–{ageHigh} years)
                  </option>
                );
              })}
            </select>
          </div>
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" style={s.btn} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Continue →'}
          </button>
        </form>
        <div style={s.trust}>
          <span style={s.trustItem}>Free Assessment</span>
        </div>
      </div>
    </div>
  );
}

const s = {
  navBar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 2rem',
    background: 'rgba(250,246,239,0.95)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(45,74,62,0.08)',
    fontFamily: "'DM Sans', sans-serif"
  },
  navBack: {
    background: 'white',
    border: '1.5px solid rgba(45,74,62,0.18)',
    color: '#2D4A3E',
    padding: '8px 20px',
    borderRadius: '100px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.875rem'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    background: '#FFB84D',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'DM Serif Display', serif",
    fontWeight: 900,
    fontSize: '0.85rem',
    color: '#1E2D25'
  },
  logoText: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: '1rem',
    fontWeight: 400,
    color: '#3D5A4C'
  },
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg,#FAF6EF 0%,#F5EDE0 100%)',
    padding: '5rem 1rem 2rem',
    fontFamily: "'DM Sans', sans-serif"
  },
  card: {
    background: 'white',
    borderRadius: '2rem',
    padding: '2.5rem 2rem',
    maxWidth: 500,
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    textAlign: 'center'
  },
  title: {
    color: '#2D4A3E',
    marginBottom: '1.8rem',
    fontSize: '1.8rem',
    fontWeight: 800,
    fontFamily: "'Fraunces', serif"
  },
  fg: { marginBottom: '1.2rem' },
  label: {
    display: 'block',
    fontWeight: 700,
    color: '#2D4A3E',
    marginBottom: '0.4rem',
    fontSize: '0.85rem'
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '2px solid #E2DDD5',
    borderRadius: '0.8rem',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    color: '#333',
    background: '#FAF6EF'
  },
  hint: { fontSize: '0.7rem', color: '#7A8580', marginTop: '0.35rem', display: 'block' },
  error: {
    color: '#e53935',
    fontWeight: 700,
    marginBottom: '0.8rem',
    fontSize: '0.9rem',
    background: '#FEF2F2',
    padding: '12px 16px',
    borderRadius: '12px',
    borderLeft: '3px solid #D64545'
  },
  btn: {
    width: '100%',
    padding: '0.9rem',
    background: 'linear-gradient(135deg,#2D4A3E,#5A7F6E)',
    color: 'white',
    border: 'none',
    borderRadius: '2rem',
    fontSize: '1.1rem',
    fontWeight: 800,
    cursor: 'pointer',
    marginTop: '0.5rem'
  },
  trust: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1.5rem',
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid rgba(45,74,62,.1)'
  },
  trustItem: { fontSize: '0.75rem', color: '#7A8580', fontWeight: 500 }
};