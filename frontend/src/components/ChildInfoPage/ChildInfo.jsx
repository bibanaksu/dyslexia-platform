// frontend/src/components/ChildInfo.jsx
// FIX: after submit → /start (StartAssessment), NOT /adventure
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getUserInfo = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };

const getOrCreateGuestId = () => {
  let id = localStorage.getItem('guest_id');
  if (!id) { id = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2,9); localStorage.setItem('guest_id', id); }
  return id;
};

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r=(Math.random()*16)|0; return (c==='x'?r:(r&0x3)|0x8).toString(16); });
};

export default function ChildInfo() {
  const navigate = useNavigate();
  const [childName, setChildName] = useState('');
  const [childGrade, setChildGrade] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = childName.trim();
    const grade = childGrade.trim();
    if (!name)  { setError("Please enter the child's name."); return; }
    if (!grade) { setError("Please select the child's grade."); return; }
    setIsLoading(true); setError('');

    const sessionUUID = generateUUID();
    const gradeNum = parseInt(grade, 10);
    const childAge = isNaN(gradeNum) ? null : gradeNum + 5;

    localStorage.setItem('child_session_uuid', sessionUUID);
    localStorage.setItem('child_info', JSON.stringify({ childFullName: name, childGrade: grade, childAge }));

    // Reset all quest/task progress for fresh start
    ['reading_adventure_progress','current_quest','task_one_progress',
     'task_one_saved_db_id','task3_progress','task4_progress',
     'task3_saved_id','task4_saved_id'].forEach(k => localStorage.removeItem(k));

    const user = getUserInfo();
    const guestId = getOrCreateGuestId();
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_URL}/api/child-info/session`,
        { sessionUUID, childName: name, childGrade: grade, parentId: user?.role==='parent'?user.id:null, guestId },
        { headers: { 'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{}) } }
      );
    } catch (err) { console.warn('DB session save failed:', err.message); }

    setIsLoading(false);
    navigate('/start'); // ← goes to StartAssessment page
  };

  return (
    <div style={s.container}>
      <div style={s.navBar}>
        <button onClick={() => navigate('/')} style={s.navBack}>←</button>
        <span style={s.navBrand}>DyslexiaSupport</span>
      </div>
      <div style={s.card}>
        <div style={s.icon}>🧒</div>
        <h1 style={s.title}>Child Information</h1>
        <form onSubmit={handleSubmit} style={{textAlign:'left'}}>
          <div style={s.fg}>
            <label style={s.label}>Child's Full Name <span style={{color:'#D64545'}}>*</span></label>
            <input type="text" value={childName} onChange={e=>{setChildName(e.target.value);setError('');}}
              placeholder="Enter the child's full name" style={s.input} maxLength={100} autoComplete="off"/>
            <span style={s.hint}>As it will appear on the report</span>
          </div>
          <div style={s.fg}>
            <label style={s.label}>Grade Level <span style={{color:'#D64545'}}>*</span></label>
            <select value={childGrade} onChange={e=>{setChildGrade(e.target.value);setError('');}} style={s.input}>
              <option value="">— Select grade —</option>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(g=>(
                <option key={g} value={String(g)}>Grade {g} ({g+5}–{g+6} years)</option>
              ))}
            </select>
          </div>
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" style={s.btn} disabled={isLoading}>
            {isLoading ? '⏳ Saving...' : 'Submit →'}
          </button>
        </form>
        <div style={s.trust}>
          <span style={s.trustItem}>🔒 Private</span>
          <span style={s.trustItem}>✅ Free Assessment</span>
        </div>
      </div>
    </div>
  );
}

const s = {
  navBar:{position:'fixed',top:0,left:0,right:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1rem 2rem',background:'rgba(250,246,239,0.95)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(45,74,62,0.08)',fontFamily:"'DM Sans',sans-serif"},
  navBack:{background:'white',border:'1.5px solid rgba(45,74,62,0.18)',color:'#2D4A3E',padding:'8px 20px',borderRadius:'100px',cursor:'pointer',fontWeight:600,fontSize:'0.875rem'},
  navBrand:{fontFamily:"'Fraunces',serif",fontSize:'1.1rem',fontWeight:600,color:'#2D4A3E',opacity:0.7},
  container:{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#FAF6EF 0%,#F5EDE0 100%)',padding:'5rem 1rem 2rem',fontFamily:"'DM Sans',sans-serif"},
  card:{background:'white',borderRadius:'2rem',padding:'2.5rem 2rem',maxWidth:500,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.15)',textAlign:'center'},
  icon:{fontSize:'3.5rem',marginBottom:'0.5rem'},
  title:{color:'#2D4A3E',marginBottom:'1.5rem',fontSize:'1.8rem',fontWeight:800,fontFamily:"'Fraunces',serif"},
  fg:{marginBottom:'1.2rem'},
  label:{display:'block',fontWeight:700,color:'#2D4A3E',marginBottom:'0.4rem',fontSize:'0.85rem'},
  input:{width:'100%',padding:'0.75rem 1rem',border:'2px solid #E2DDD5',borderRadius:'0.8rem',fontSize:'1rem',outline:'none',boxSizing:'border-box',fontFamily:'inherit',color:'#333',background:'#FAF6EF'},
  hint:{fontSize:'0.7rem',color:'#7A8580',marginTop:'0.35rem',display:'block'},
  error:{color:'#e53935',fontWeight:700,marginBottom:'0.8rem',fontSize:'0.9rem',background:'#FEF2F2',padding:'12px 16px',borderRadius:'12px',borderLeft:'3px solid #D64545'},
  btn:{width:'100%',padding:'0.9rem',background:'linear-gradient(135deg,#2D4A3E,#5A7F6E)',color:'white',border:'none',borderRadius:'2rem',fontSize:'1.1rem',fontWeight:800,cursor:'pointer',marginTop:'0.5rem'},
  trust:{display:'flex',justifyContent:'center',gap:'1.5rem',marginTop:'2rem',paddingTop:'1.5rem',borderTop:'1px solid rgba(45,74,62,.1)'},
  trustItem:{fontSize:'0.75rem',color:'#7A8580',fontWeight:500},
};