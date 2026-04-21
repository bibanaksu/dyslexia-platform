// ParentDashboard.jsx - Complete beautiful dashboard
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, getCurrentUser, logout } from '../../services/api';
import './ParentDashboard.css';

// Icons
const AddIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const ChildIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="8" r="4" />
    <path d="M5 20v-2a7 7 0 0 1 14 0v2" />
  </svg>
);

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const BookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const AssessmentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const ProgressIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 12A10 10 0 1 1 12 2" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChild, setNewChild] = useState({ full_name: '', grade: '', dob: '' });
  const [user, setUser] = useState(getCurrentUser());
  const [parentInfo, setParentInfo] = useState(null);

  useEffect(() => {
    fetchChildren();
    fetchParentInfo();
  }, []);

  const fetchParentInfo = async () => {
    try {
      const res = await apiFetch('/api/parents/me');
      const data = await res.json();
      if (res.ok) {
        setParentInfo(data);
      }
    } catch (error) {
      console.error('Error fetching parent info:', error);
    }
  };

  const fetchChildren = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/children');
      const data = await res.json();
      if (res.ok) {
        setChildren(data);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/children', {
        method: 'POST',
        body: JSON.stringify(newChild),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchChildren();
        setShowAddChild(false);
        setNewChild({ full_name: '', grade: '', dob: '' });
      } else {
        alert(data.error || 'Failed to add child');
      }
    } catch (error) {
      alert('Error adding child: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.clear();
      navigate('/auth');
    }
  };

  const getGradeColor = (grade) => {
    const colors = {
      1: '#10b981', 2: '#34d399', 3: '#fbbf24',
      4: '#f59e0b', 5: '#ef4444', 6: '#8b5cf6'
    };
    return colors[grade] || '#6b7280';
  };

  return (
    <div className="parent-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="welcome-badge">
            <span className="welcome-text">Welcome back,</span>
            <span className="parent-name">{user?.name || 'Parent'}! 👋</span>
          </div>
          <p className="header-subtitle">Manage your children's learning journey</p>
        </div>
        <div className="header-right">
          <button className="logout-btn" onClick={handleLogout}>
            <LogoutIcon />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👨‍👩‍👧‍👦</div>
          <div className="stat-info">
            <h3>{children.length}</h3>
            <p>Children</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <h3>4</h3>
            <p>Activities</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-info">
            <h3>0</h3>
            <p>Assessments</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        <div className="content-header">
          <h2>My Children</h2>
          <button className="add-child-btn" onClick={() => setShowAddChild(true)}>
            <AddIcon />
            <span>Add Child</span>
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your children...</p>
          </div>
        ) : children.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👶</div>
            <h3>No children added yet</h3>
            <p>Add your first child to start tracking their progress</p>
            <button className="empty-add-btn" onClick={() => setShowAddChild(true)}>
              Add Your First Child
            </button>
          </div>
        ) : (
          <div className="children-grid">
            {children.map((child) => (
              <div key={child.id} className="child-card">
                <div className="child-avatar" style={{ backgroundColor: getGradeColor(child.grade) }}>
                  <ChildIcon />
                </div>
                <div className="child-info">
                  <h3>{child.full_name}</h3>
                  <div className="child-details">
                    <span className="grade-badge" style={{ backgroundColor: getGradeColor(child.grade) }}>
                      Grade {child.grade}
                    </span>
                    {child.dob && (
                      <span className="age-badge">
                        {new Date().getFullYear() - new Date(child.dob).getFullYear()} years
                      </span>
                    )}
                  </div>
                </div>
                <div className="child-actions">
                  <button 
                    className="action-btn start-btn"
                    onClick={() => navigate(`/adventure?childId=${child.id}`)}
                  >
                    <BookIcon />
                    <span>Start Adventure</span>
                  </button>
                  <button 
                    className="action-btn assessment-btn"
                    onClick={() => navigate(`/quiz?childId=${child.id}&childName=${child.full_name}&childGrade=${child.grade}`)}
                  >
                    <AssessmentIcon />
                    <span>Assessment</span>
                  </button>
                </div>
                <div className="child-progress">
                  <div className="progress-item">
                    <ProgressIcon />
                    <span>Progress: 0%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Child Modal */}
      {showAddChild && (
        <div className="modal-overlay" onClick={() => setShowAddChild(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Child</h3>
              <button className="modal-close" onClick={() => setShowAddChild(false)}>×</button>
            </div>
            <form onSubmit={handleAddChild}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter child's full name"
                  value={newChild.full_name}
                  onChange={(e) => setNewChild({ ...newChild, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Grade *</label>
                <select
                  value={newChild.grade}
                  onChange={(e) => setNewChild({ ...newChild, grade: e.target.value })}
                  required
                >
                  <option value="">Select grade</option>
                  {[1, 2, 3, 4, 5, 6].map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date of Birth (Optional)</label>
                <input
                  type="date"
                  value={newChild.dob}
                  onChange={(e) => setNewChild({ ...newChild, dob: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddChild(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Add Child
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;