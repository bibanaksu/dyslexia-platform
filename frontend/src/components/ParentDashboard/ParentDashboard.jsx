import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ParentDashboard.css';

const ParentDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="parent-dashboard">
      <header className="dashboard-header">
        <h1>Welcome back, Parent! 👋</h1>
        <button 
          className="start-adventure-btn"
          onClick={() => navigate('/adventure')}
        >
          Start Reading Adventure ✨
        </button>
      </header>

      <div className="dashboard-content">
        <p>Your dashboard is being set up. Please check back soon!</p>
      </div>
    </div>
  );
};

export default ParentDashboard;