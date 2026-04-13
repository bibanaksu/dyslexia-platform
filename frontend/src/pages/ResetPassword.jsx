// pages/ResetPassword.jsx
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/api';

export default function ResetPassword() {
    const [searchParams]                    = useSearchParams();
    const navigate                          = useNavigate();
    const token                             = searchParams.get('token') || '';

    const [password,        setPassword]        = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPw,          setShowPw]          = useState(false);
    const [status,          setStatus]          = useState('idle');  // idle|loading|success|error
    const [message,         setMessage]         = useState('');

    // Validate password strength in real time
    const checks = {
        length:  password.length >= 8,
        special: /[^a-zA-Z0-9]/.test(password),
        match:   password === confirmPassword && password.length > 0,
    };
    const allPassed = checks.length && checks.special && checks.match;

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No reset token found. Please request a new link.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!allPassed) return;

        setStatus('loading');
        setMessage('');

        try {
            const data = await resetPassword(token, password);
            setStatus('success');
            setMessage(data.message);
            // Redirect to login after 3 seconds
            setTimeout(() => navigate('/auth', { replace: true }), 3000);
        } catch (err) {
            setStatus('error');
            setMessage(err.message || 'Reset failed. Please request a new link.');
        }
    };

    // ── Render ────────────────────────────────────────────────
    if (status === 'success') {
        return (
            <div style={styles.page}>
                <div style={styles.card}>
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
                        <h1 style={styles.title}>Password Reset!</h1>
                        <p style={{ color: '#16a34a', fontWeight: '600', marginBottom: '8px' }}>
                            {message}
                        </p>
                        <p style={{ color: '#6b7280', fontSize: '14px' }}>
                            Redirecting to sign in…
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔑</div>
                    <h1 style={styles.title}>Set New Password</h1>
                    <p style={styles.subtitle}>Choose a strong password for your account.</p>
                </div>

                {/* Token missing or expired */}
                {!token && (
                    <div style={styles.errorBox}>
                        {message}
                        <br />
                        <a href="/forgot-password" style={{ color: '#dc2626', fontWeight: '600' }}>
                            Request a new link →
                        </a>
                    </div>
                )}

                {token && (
                    <form onSubmit={handleSubmit} style={styles.form}>
                        {status === 'error' && (
                            <div style={styles.errorBox}>
                                {message}&nbsp;
                                <a href="/forgot-password" style={{ color: '#dc2626', fontWeight: '600' }}>
                                    Request a new link →
                                </a>
                            </div>
                        )}

                        {/* New Password */}
                        <div style={styles.field}>
                            <label style={styles.label}>New Password</label>
                            <div style={styles.inputWrapper}>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    style={styles.input}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    style={styles.toggleBtn}
                                    onClick={() => setShowPw(p => !p)}
                                    tabIndex={-1}
                                >
                                    {showPw ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div style={styles.field}>
                            <label style={styles.label}>Confirm Password</label>
                            <input
                                type={showPw ? 'text' : 'password'}
                                style={{
                                    ...styles.input,
                                    borderColor: confirmPassword && !checks.match ? '#ef4444' : '#d1d5db',
                                }}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        {/* Strength checklist */}
                        {password.length > 0 && (
                            <div style={styles.checklist}>
                                <CheckItem ok={checks.length}  label="At least 8 characters" />
                                <CheckItem ok={checks.special} label="At least one special character (e.g. @, #, !)" />
                                <CheckItem ok={checks.match}   label="Passwords match" />
                            </div>
                        )}

                        <button
                            type="submit"
                            style={{
                                ...styles.submitBtn,
                                opacity: (!allPassed || status === 'loading') ? 0.5 : 1,
                                cursor:  (!allPassed || status === 'loading') ? 'not-allowed' : 'pointer',
                            }}
                            disabled={!allPassed || status === 'loading'}
                        >
                            {status === 'loading' ? 'Resetting…' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <div style={styles.footer}>
                    <a href="/auth" style={styles.backLink}>← Back to Sign In</a>
                </div>
            </div>
        </div>
    );
}

function CheckItem({ ok, label }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: ok ? '#16a34a' : '#9ca3af', fontSize: '16px' }}>
                {ok ? '✅' : '○'}
            </span>
            <span style={{ color: ok ? '#15803d' : '#6b7280', fontWeight: ok ? '600' : '400' }}>
                {label}
            </span>
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────
const styles = {
    page: {
        minHeight:      '100vh',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        background:     'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        padding:        '24px',
        fontFamily:     'system-ui, -apple-system, sans-serif',
    },
    card: {
        background:   '#fff',
        borderRadius: '16px',
        boxShadow:    '0 8px 32px rgba(0,0,0,0.10)',
        padding:      '48px 40px',
        width:        '100%',
        maxWidth:     '440px',
    },
    header: {
        textAlign:    'center',
        marginBottom: '32px',
    },
    title: {
        fontSize:   '26px',
        fontWeight: '700',
        color:      '#1a1a1a',
        margin:     '0 0 8px',
    },
    subtitle: {
        color:  '#6b7280',
        fontSize: '15px',
        margin: 0,
    },
    form: {
        display:       'flex',
        flexDirection: 'column',
        gap:           '20px',
    },
    field: {
        display:       'flex',
        flexDirection: 'column',
        gap:           '6px',
    },
    label: {
        fontSize:   '14px',
        fontWeight: '600',
        color:      '#374151',
    },
    inputWrapper: {
        position: 'relative',
        display:  'flex',
    },
    input: {
        border:       '1.5px solid #d1d5db',
        borderRadius: '8px',
        padding:      '12px 44px 12px 14px',
        fontSize:     '15px',
        outline:      'none',
        width:        '100%',
        boxSizing:    'border-box',
    },
    toggleBtn: {
        position:   'absolute',
        right:      '12px',
        top:        '50%',
        transform:  'translateY(-50%)',
        background: 'none',
        border:     'none',
        cursor:     'pointer',
        fontSize:   '16px',
        padding:    '0',
    },
    checklist: {
        display:       'flex',
        flexDirection: 'column',
        gap:           '6px',
        background:    '#f9fafb',
        borderRadius:  '8px',
        padding:       '12px 14px',
    },
    submitBtn: {
        background:   '#16a34a',
        color:        '#fff',
        border:       'none',
        borderRadius: '8px',
        padding:      '14px',
        fontSize:     '16px',
        fontWeight:   '600',
        transition:   'background 0.2s',
        marginTop:    '4px',
    },
    errorBox: {
        background:    '#fef2f2',
        border:        '1px solid #fca5a5',
        borderRadius:  '8px',
        color:         '#dc2626',
        padding:       '12px 14px',
        fontSize:      '14px',
        lineHeight:    '1.6',
    },
    footer: {
        textAlign: 'center',
        marginTop: '28px',
    },
    backLink: {
        color:          '#16a34a',
        textDecoration: 'none',
        fontSize:       '14px',
        fontWeight:     '500',
    },
};