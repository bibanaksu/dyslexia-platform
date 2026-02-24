import { useState } from 'react';
import './Auth.css';

// Icons - Define all icons here
const BackArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export function Auth() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignIn) {
        // SIGN IN
        console.log('Attempting login with:', { email, password });
        
        // TEMPORARY: Hardcoded test login
        if (email === 'therapist@dyslexiaplatform.com' && password === 'Therapist@123') {
          localStorage.setItem('token', 'test-token');
          localStorage.setItem('userRole', 'therapist');
          localStorage.setItem('userId', '1');
          localStorage.setItem('userName', 'Dr. Sarah Chen');
          window.location.href = '/dashboard';
          return;
        } else {
          throw new Error('Invalid email or password. Try: therapist@dyslexiaplatform.com / Therapist@123');
        }
      } else {
        // SIGN UP
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        
        alert('Sign up functionality will be added soon!');
        setLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fillTestCredentials = () => {
    setEmail('therapist@dyslexiaplatform.com');
    setPassword('Therapist@123');
  };

  return (
    <div className="Auth">
      {/* Left Panel - 9:16 Image */}
      <div className="Auth__left">
        <a href="/" className="Auth__back-btn" title="Back to Home">
          <BackArrowIcon />
        </a>

        <div className="Auth__illustration">
          <img
            src="assets/authnt.png"
            alt="Child reading"
            className="Auth__illustration-img"
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) {
                e.target.nextSibling.style.display = 'flex';
              }
            }}
          />
          <div className="Auth__illustration-fallback">
            <svg viewBox="0 0 120 120" width="120" height="120" fill="none">
              <circle cx="60" cy="35" r="20" fill="#a8c4b0"/>
              <rect x="20" y="60" width="80" height="50" rx="8" fill="#7aaa8d"/>
              <rect x="30" y="65" width="60" height="8" rx="2" fill="white" opacity="0.6"/>
              <rect x="30" y="78" width="45" height="8" rx="2" fill="white" opacity="0.6"/>
              <rect x="30" y="91" width="55" height="8" rx="2" fill="white" opacity="0.6"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="Auth__right">
        <div className="Auth__form-container">
          <div className="Auth__header">
            <h1>{isSignIn ? 'Welcome Back!' : 'Create an Account'}</h1>
            <p>{isSignIn ? 'Sign in to continue your journey.' : 'Start your journey with intelligent dyslexia support tools.'}</p>
          </div>

          {/* Toggle */}
          <div className="Auth__toggle">
            <button 
              type="button"
              className={`Auth__toggle-btn ${isSignIn ? 'active' : ''}`} 
              onClick={() => setIsSignIn(true)}
            >
              Sign In
            </button>
            <button 
              type="button"
              className={`Auth__toggle-btn ${!isSignIn ? 'active' : ''}`} 
              onClick={() => setIsSignIn(false)}
            >
              Sign Up
            </button>
          </div>

          {/* Test credentials helper */}
          {isSignIn && (
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              <button 
                type="button"
                onClick={fillTestCredentials}
                style={{
                  background: 'none',
                  border: '1px dashed #3D5A4C',
                  padding: '5px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  color: '#3D5A4C',
                  cursor: 'pointer'
                }}
              >
                Use Test Therapist Account
              </button>
            </div>
          )}

          {error && (
            <div style={{ 
              background: '#ffebee', 
              color: '#c62828', 
              padding: '10px', 
              borderRadius: '5px',
              marginBottom: '15px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="Auth__form">
            {/* Full Name — Sign Up only */}
            {!isSignIn && (
              <div className="Auth__field">
                <label>Full Name</label>
                <div className="Auth__input-wrapper">
                  <span className="Auth__input-icon"><UserIcon /></span>
                  <input 
                    type="text" 
                    className="Auth__input" 
                    placeholder="John Doe" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isSignIn}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="Auth__field">
              <label>Email Address</label>
              <div className="Auth__input-wrapper">
                <span className="Auth__input-icon"><MailIcon /></span>
                <input 
                  type="email" 
                  className="Auth__input" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Phone Number — Sign Up only */}
            {!isSignIn && (
              <div className="Auth__field">
                <label>Phone Number</label>
                <div className="Auth__input-wrapper">
                  <span className="Auth__input-icon"><PhoneIcon /></span>
                  <input 
                    type="tel" 
                    className="Auth__input" 
                    placeholder="+213 000-0000" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="Auth__field">
              <label>Password</label>
              <div className="Auth__input-wrapper">
                <span className="Auth__input-icon"><LockIcon /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="Auth__input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="Auth__input-toggle" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {!isSignIn && (
                <div className="Auth__password-hint">Must be at least 8 characters with one special symbol.</div>
              )}
            </div>

            {/* Confirm Password — Sign Up only */}
            {!isSignIn && (
              <div className="Auth__field">
                <label>Confirm Password</label>
                <div className="Auth__input-wrapper">
                  <span className="Auth__input-icon"><LockIcon /></span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="Auth__input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={!isSignIn}
                  />
                  <button 
                    type="button" 
                    className="Auth__input-toggle" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="Auth__submit-btn"
              disabled={loading}
            >
              <span>{loading ? 'Please wait...' : (isSignIn ? 'Sign In' : 'Create Account')}</span>
              {!loading && <ArrowIcon />}
            </button>
          </form>

          <div className="Auth__divider">
            <span>Or continue with</span>
          </div>

          <div className="Auth__social">
            <button 
              type="button"
              className="Auth__social-btn"
              onClick={() => alert('Google login coming soon!')}
            >
              <GoogleIcon />
              <span>Google</span>
            </button>
          </div>

          <div className="Auth__switch">
            {isSignIn ? (
              <p>Don't have an account? <a onClick={() => setIsSignIn(false)}>Sign up instead</a></p>
            ) : (
              <p>Already have an account? <a onClick={() => setIsSignIn(true)}>Sign in instead</a></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}