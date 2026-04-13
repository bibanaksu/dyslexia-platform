// pages/ForgotPassword.jsx
import { useState } from 'react';
import { forgotPassword } from '../services/api';

export default function ForgotPassword() {
    const [email,   setEmail]   = useState('');
    const [status,  setStatus]  = useState('idle');   // idle | loading | success | error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const data = await forgotPassword(email.trim());
            setStatus('success');
            setMessage(data.message);

            // Dev only: show the link in the console so you can test without email
            if (data.devLink) {
                console.info('🔑 Dev reset link:', data.devLink);
            }
        } catch (err) {
            setStatus('error');
            setMessage(err.message || 'Something went wrong. Please try again.');
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.icon}>🔐</div>
                    <h1 style={styles.title}>Forgot Password</h1>
                    <p style={styles.subtitle}>
                        Enter your email and we'll send you a reset link.
                    </p>
                </div>

                {/* Success state */}
                {status === 'success' ? (
                    <div style={styles.successBox}>
                        <div style={styles.successIcon}>✅</div>
                        <p style={styles.successText}>{message}</p>
                        <p style={styles.successNote}>
                            Check your email inbox (and spam folder). The link expires in 15 minutes.
                        </p>
                        <button
                            style={styles.secondaryBtn}
                            onClick={() => { setStatus('idle'); setEmail(''); setMessage(''); }}
                        >
                            Send another link
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={styles.form}>
                        {status === 'error' && (
                            <div style={styles.errorBox}>{message}</div>
                        )}

                        <div style={styles.field}>
                            <label style={styles.label}>Email Address</label>
                            <input
                                type="email"
                                style={styles.input}
                                placeholder="your@email.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            style={{
                                ...styles.submitBtn,
                                opacity: status === 'loading' ? 0.7 : 1,
                                cursor:  status === 'loading' ? 'not-allowed' : 'pointer',
                            }}
                            disabled={status === 'loading'}
                        >
                            {status === 'loading' ? 'Sending…' : 'Send Reset Link'}
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
        maxWidth:     '420px',
    },
    header: {
        textAlign:    'center',
        marginBottom: '32px',
    },
    icon: {
        fontSize:     '48px',
        marginBottom: '16px',
    },
    title: {
        fontSize:   '26px',
        fontWeight: '700',
        color:      '#1a1a1a',
        margin:     '0 0 8px',
    },
    subtitle: {
        color:    '#6b7280',
        fontSize: '15px',
        margin:   0,
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
    input: {
        border:       '1.5px solid #d1d5db',
        borderRadius: '8px',
        padding:      '12px 14px',
        fontSize:     '15px',
        outline:      'none',
        transition:   'border-color 0.2s',
        width:        '100%',
        boxSizing:    'border-box',
    },
    submitBtn: {
        background:   '#16a34a',
        color:        '#fff',
        border:       'none',
        borderRadius: '8px',
        padding:      '14px',
        fontSize:     '16px',
        fontWeight:   '600',
        cursor:       'pointer',
        transition:   'background 0.2s',
        marginTop:    '4px',
    },
    secondaryBtn: {
        background:   'transparent',
        color:        '#16a34a',
        border:       '1.5px solid #16a34a',
        borderRadius: '8px',
        padding:      '12px 24px',
        fontSize:     '15px',
        fontWeight:   '600',
        cursor:       'pointer',
        marginTop:    '12px',
    },
    errorBox: {
        background:  '#fef2f2',
        border:      '1px solid #fca5a5',
        borderRadius: '8px',
        color:       '#dc2626',
        padding:     '12px 14px',
        fontSize:    '14px',
    },
    successBox: {
        textAlign: 'center',
        padding:   '8px 0',
    },
    successIcon: {
        fontSize:     '48px',
        marginBottom: '16px',
    },
    successText: {
        color:        '#16a34a',
        fontWeight:   '600',
        fontSize:     '16px',
        marginBottom: '8px',
    },
    successNote: {
        color:        '#6b7280',
        fontSize:     '14px',
        marginBottom: '20px',
    },
    footer: {
        textAlign:  'center',
        marginTop:  '28px',
    },
    backLink: {
        color:          '#16a34a',
        textDecoration: 'none',
        fontSize:       '14px',
        fontWeight:     '500',
    },
};