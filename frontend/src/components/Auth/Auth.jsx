// Auth.jsx - DS logo in top‑right corner
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerParent, login, saveUserSession, apiFetch } from '../../services/api';
import './Auth.css';

// ── Icons (same as before, included for completeness) ──
const BackArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
    <rect x="3" y="11" width="20" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// DS Logo component (visual identical to Quiz page)
const DSLogo = () => (
  <div className="Auth__logo">
    <div className="Auth__logo-icon">DS</div>
    <span className="Auth__logo-text">Dyslexia Support</span>
  </div>
);

// Inspirational Quote (stays on left panel)
const SupportQuote = () => (
  <div className="Auth__quote">
   
  </div>
);

export function Auth() {
  const navigate = useNavigate();

  const [isSignIn, setIsSignIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [childName, setChildName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setPhone('');
    setChildName('');
    setError('');
  };

  const verifyTokenWorks = async () => {
    try {
      const role = localStorage.getItem('userRole') || 'parent';
      const endpoint = role === 'therapist' ? '/api/therapist/patients' : '/api/children';
      const res = await apiFetch(endpoint);
      if (res.ok) {
        console.log(`✅ Token works for ${role}! Auth successful.`);
        return true;
      } else {
        console.error(`❌ Token verification failed for ${role}:`, res.status);
        return false;
      }
    } catch (err) {
      console.error('❌ Token verification error:', err);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignIn) {
        const data = await login(email, password);
        if (!data.token) throw new Error('No token received');
        saveUserSession(data);
        await verifyTokenWorks();
        navigate(data.role === 'therapist' ? '/dashboard' : '/parent-dashboard');
      } else {
        if (password !== confirmPassword) throw new Error('Passwords do not match');
        if (password.length < 8) throw new Error('Password must be at least 8 characters');
        if (!childName.trim()) throw new Error('Please enter your child\'s name');

        const child_session_id = localStorage.getItem('child_session_id');
        if (!child_session_id) throw new Error('No active child session found. Please start an assessment first.');

        const data = await registerParent(fullName, email, phone, password, child_session_id, childName.trim());
        if (!data.token) throw new Error('No token received');
        saveUserSession(data);
        await verifyTokenWorks();
        navigate(data.role === 'therapist' ? '/dashboard' : '/parent-dashboard');
      }
    } catch (err) {
      setError(err.message);
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="Auth">
      {/* Logo now placed outside left/right, in the top‑right corner of the whole page */}
      <DSLogo />

      <div className="Auth__left">
        <a href="/" className="Auth__back-btn" title="Back to Home">
          <BackArrowIcon />
        </a>
        <div className="Auth__illustration">
          <img
            src="/assets/authnt.png"
            alt="Child reading"
            className="Auth__illustration-img"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
        <SupportQuote />
      </div>

      <div className="Auth__right">
        <div className="Auth__form-container">
          <div className="Auth__header">
            <h1>{isSignIn ? 'Welcome Back!' : 'Create an Account'}</h1>
            <p>{isSignIn ? 'Sign in to continue your journey.' : 'Start your journey with dyslexia support tools.'}</p>
          </div>

          <div className="Auth__toggle">
            <button type="button" className={`Auth__toggle-btn ${isSignIn ? 'active' : ''}`} onClick={() => { setIsSignIn(true); resetForm(); }}>Sign In</button>
            <button type="button" className={`Auth__toggle-btn ${!isSignIn ? 'active' : ''}`} onClick={() => { setIsSignIn(false); resetForm(); }}>Sign Up</button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="Auth__form">
            {!isSignIn && (
              <>
                <div className="Auth__field">
                  <label>Full Name</label>
                  <div className="Auth__input-wrapper">
                    <span className="Auth__input-icon"><UserIcon /></span>
                    <input type="text" className="Auth__input" placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                </div>
                <div className="Auth__field">
                  <label>Child's Name</label>
                  <div className="Auth__input-wrapper">
                    <input type="text" className="Auth__input" placeholder="Enter your child’s name" value={childName} onChange={(e) => setChildName(e.target.value)} required />
                  </div>
                </div>
              </>
            )}

            <div className="Auth__field">
              <label>Email Address</label>
              <div className="Auth__input-wrapper">
                <span className="Auth__input-icon"><MailIcon /></span>
                <input type="email" className="Auth__input" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            {!isSignIn && (
              <div className="Auth__field">
                <label>Phone Number</label>
                <div className="Auth__input-wrapper">
                  <span className="Auth__input-icon"><PhoneIcon /></span>
                  <input type="tel" className="Auth__input" placeholder="+213 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
            )}

            <div className="Auth__field">
              <label>Password</label>
              <div className="Auth__input-wrapper">
                <span className="Auth__input-icon"><LockIcon /></span>
                <input type={showPassword ? 'text' : 'password'} className="Auth__input" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" className="Auth__input-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {!isSignIn && <div className="Auth__password-hint">Must be at least 8 characters</div>}
            </div>

            {!isSignIn && (
              <div className="Auth__field">
                <label>Confirm Password</label>
                <div className="Auth__input-wrapper">
                  <span className="Auth__input-icon"><LockIcon /></span>
                  <input type={showConfirmPassword ? 'text' : 'password'} className="Auth__input" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  <button type="button" className="Auth__input-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            )}

            {isSignIn && (
              <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '8px' }}>
                <a href="/forgot-password" style={{ fontSize: '13px', color: '#3d5a4c', textDecoration: 'none', fontWeight: 600 }}>Forgot password?</a>
              </div>
            )}

            <button type="submit" className="Auth__submit-btn" disabled={loading}>
              <span>{loading ? 'Please wait…' : isSignIn ? 'Sign In' : 'Create Account'}</span>
              {!loading && <ArrowIcon />}
            </button>
          </form>

          <div className="Auth__divider"><span>Or continue with</span></div>
          <div className="Auth__social">
            <button type="button" className="Auth__social-btn" onClick={() => alert('Google login coming soon!')}>
              <GoogleIcon /><span>Google</span>
            </button>
          </div>

          <div className="Auth__switch">
            {isSignIn ? (
              <p>Don't have an account? <a onClick={() => { setIsSignIn(false); resetForm(); }} style={{ cursor: 'pointer' }}>Sign up instead</a></p>
            ) : (
              <p>Already have an account? <a onClick={() => { setIsSignIn(true); resetForm(); }} style={{ cursor: 'pointer' }}>Sign in instead</a></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}