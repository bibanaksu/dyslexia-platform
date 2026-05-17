// pages/ForgotPassword.jsx
import { useState } from 'react';
import { forgotPassword } from '../services/api';

export default function ForgotPassword() {
    const [email,   setEmail]   = useState('');
    const [status,  setStatus]  = useState('idle'); // idle | loading | success | error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const data = await forgotPassword(email.trim());
            setStatus('success');
            setMessage(data.message);

            if (data.devLink) {
                console.info('🔑 Dev reset link:', data.devLink);
            }
        } catch (err) {
            setStatus('error');
            setMessage(err.message || 'Something went wrong. Please try again.');
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Instrument+Sans:wght@400;500;600&display=swap');

                .fp-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #EAE7DC;
                    padding: 24px;
                    font-family: 'Instrument Sans', system-ui, sans-serif;
                }

                .fp-card {
                    background: #F5F3ED;
                    border: 1px solid #D9D5C9;
                    border-radius: 20px;
                    padding: 48px 44px 40px;
                    width: 100%;
                    max-width: 420px;
                    position: relative;
                    overflow: hidden;
                }

                .fp-card::before {
                    content: '';
                    position: absolute;
                    top: -60px;
                    right: -60px;
                    width: 180px;
                    height: 180px;
                    border-radius: 50%;
                    background: rgba(61, 90, 76, 0.08);
                    pointer-events: none;
                }

                .fp-card::after {
                    content: '';
                    position: absolute;
                    bottom: -40px;
                    left: -40px;
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    background: rgba(61, 90, 76, 0.04);
                    pointer-events: none;
                }

                .fp-icon-wrap {
                    width: 56px;
                    height: 56px;
                    background: #3D5A4C;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                }

                .fp-icon-svg {
                    width: 26px;
                    height: 26px;
                    stroke: #F5F3ED;
                    fill: none;
                    stroke-width: 1.8;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                }

                .fp-title {
                    font-family: 'DM Serif Display', serif;
                    font-size: 28px;
                    font-weight: 400;
                    color: #2C2C2C;
                    text-align: center;
                    margin: 0 0 8px;
                    letter-spacing: -0.3px;
                    position: relative;
                    z-index: 1;
                }

                .fp-subtitle {
                    font-size: 14px;
                    color: #6B6B6B;
                    text-align: center;
                    margin: 0 0 32px;
                    line-height: 1.65;
                    position: relative;
                    z-index: 1;
                }

                .fp-divider {
                    height: 1px;
                    background: linear-gradient(90deg, transparent, #D9D5C9 30%, #D9D5C9 70%, transparent);
                    margin: 0 -8px 32px;
                }

                .fp-label {
                    font-size: 12px;
                    font-weight: 600;
                    color: #2C2C2C;
                    letter-spacing: 0.6px;
                    text-transform: uppercase;
                    display: block;
                    margin-bottom: 8px;
                    position: relative;
                    z-index: 1;
                }

                .fp-input-wrap {
                    position: relative;
                    margin-bottom: 20px;
                    z-index: 1;
                }

                .fp-input-icon {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 17px;
                    height: 17px;
                    stroke: #8F8A7E;
                    fill: none;
                    stroke-width: 1.8;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                    pointer-events: none;
                }

                .fp-input {
                    width: 100%;
                    box-sizing: border-box;
                    border: 1.5px solid #C8C4BA;
                    border-radius: 10px;
                    padding: 13px 14px 13px 42px;
                    font-size: 15px;
                    font-family: 'Instrument Sans', system-ui, sans-serif;
                    background: #FDFCF9;
                    color: #2C2C2C;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
                }

                .fp-input::placeholder { color: #B0AA9F; }

                .fp-input:focus {
                    border-color: #3D5A4C;
                    box-shadow: 0 0 0 3px rgba(61, 90, 76, 0.12);
                    background: #fff;
                }

                .fp-submit-btn {
                    width: 100%;
                    background: #3D5A4C;
                    color: #F5F3ED;
                    border: none;
                    border-radius: 10px;
                    padding: 14px;
                    font-size: 15px;
                    font-weight: 600;
                    font-family: 'Instrument Sans', system-ui, sans-serif;
                    cursor: pointer;
                    letter-spacing: 0.2px;
                    transition: background 0.2s, transform 0.15s, opacity 0.2s;
                    position: relative;
                    z-index: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .fp-submit-btn:hover:not(:disabled) { background: #2E4538; }
                .fp-submit-btn:active:not(:disabled) { transform: scale(0.98); }
                .fp-submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }

                .fp-btn-arrow {
                    width: 16px;
                    height: 16px;
                    stroke: #F5F3ED;
                    fill: none;
                    stroke-width: 2;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                }

                .fp-loading-dots {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    margin-left: 6px;
                }

                .fp-dot {
                    width: 5px;
                    height: 5px;
                    background: #F5F3ED;
                    border-radius: 50%;
                    animation: fpBounce 1s infinite;
                }

                .fp-dot:nth-child(2) { animation-delay: 0.15s; }
                .fp-dot:nth-child(3) { animation-delay: 0.3s; }

                @keyframes fpBounce {
                    0%, 80%, 100% { transform: translateY(0); opacity: 0.6; }
                    40% { transform: translateY(-4px); opacity: 1; }
                }

                .fp-error-box {
                    background: #FEF0EE;
                    border: 1px solid #E8C4BC;
                    border-radius: 8px;
                    color: #7A3728;
                    padding: 11px 13px;
                    font-size: 13px;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    position: relative;
                    z-index: 1;
                    line-height: 1.5;
                }

                .fp-error-icon {
                    width: 16px;
                    height: 16px;
                    stroke: #7A3728;
                    fill: none;
                    stroke-width: 2;
                    stroke-linecap: round;
                    flex-shrink: 0;
                    margin-top: 1px;
                }

                .fp-success-wrap {
                    text-align: center;
                    padding: 8px 0;
                    position: relative;
                    z-index: 1;
                }

                .fp-success-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: #EAF2EC;
                    border: 1px solid #B8D9BE;
                    color: #2E5C38;
                    border-radius: 99px;
                    padding: 5px 16px;
                    font-size: 13px;
                    font-weight: 600;
                    margin-bottom: 20px;
                }

                .fp-check-icon {
                    width: 14px;
                    height: 14px;
                    stroke: #2E5C38;
                    fill: none;
                    stroke-width: 2.5;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                }

                .fp-success-title {
                    font-family: 'DM Serif Display', serif;
                    font-size: 22px;
                    color: #2C2C2C;
                    margin: 0 0 10px;
                    font-weight: 400;
                }

                .fp-success-text {
                    color: #6B6B6B;
                    font-size: 14px;
                    line-height: 1.65;
                    margin: 0 0 28px;
                }

                .fp-outline-btn {
                    background: transparent;
                    color: #3D5A4C;
                    border: 1.5px solid #3D5A4C;
                    border-radius: 10px;
                    padding: 12px 28px;
                    font-size: 14px;
                    font-weight: 600;
                    font-family: 'Instrument Sans', system-ui, sans-serif;
                    cursor: pointer;
                    transition: background 0.2s, transform 0.15s;
                }

                .fp-outline-btn:hover { background: rgba(61, 90, 76, 0.06); }
                .fp-outline-btn:active { transform: scale(0.98); }

                .fp-footer {
                    text-align: center;
                    margin-top: 28px;
                    position: relative;
                    z-index: 1;
                }

                .fp-back-link {
                    color: #6B6B6B;
                    font-size: 13px;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    transition: color 0.2s;
                }

                .fp-back-link:hover { color: #3D5A4C; }

                .fp-back-arrow {
                    width: 14px;
                    height: 14px;
                    stroke: currentColor;
                    fill: none;
                    stroke-width: 2;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                }
            `}</style>

            <div className="fp-page">
                <div className="fp-card">
                    {/* Lock icon */}
                    <div className="fp-icon-wrap" aria-hidden="true">
                        <svg className="fp-icon-svg" viewBox="0 0 24 24">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>

                    <h1 className="fp-title">Forgot Password</h1>
                    <p className="fp-subtitle">
                        Enter your email please
                    
                    </p>
                    <div className="fp-divider" />

                    {/* ── Success state ── */}
                    {status === 'success' ? (
                        <div className="fp-success-wrap">
                            <div className="fp-success-badge">
                                <svg className="fp-check-icon" viewBox="0 0 24 24">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Link sent
                            </div>
                            <p className="fp-success-title">Check your inbox</p>
                            <p className="fp-success-text">
                                {message || "We've sent a password reset link to your email."}<br />
                                The link expires in 15 minutes — don't forget to check your spam folder.
                            </p>
                            <button
                                className="fp-outline-btn"
                                onClick={() => { setStatus('idle'); setEmail(''); setMessage(''); }}
                            >
                                Send another link
                            </button>
                        </div>
                    ) : (
                        /* ── Form state ── */
                        <form onSubmit={handleSubmit}>
                            {status === 'error' && (
                                <div className="fp-error-box" role="alert">
                                    <svg className="fp-error-icon" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    <span>{message}</span>
                                </div>
                            )}

                            <label className="fp-label" htmlFor="fp-email">
                                Email Address
                            </label>
                            <div className="fp-input-wrap">
                                <svg className="fp-input-icon" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                                <input
                                    id="fp-email"
                                    className="fp-input"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                    autoComplete="email"
                                />
                            </div>

                            <button
                                type="submit"
                                className="fp-submit-btn"
                                disabled={status === 'loading'}
                            >
                                {status === 'loading' ? (
                                    <>
                                        Sending
                                        <span className="fp-loading-dots" aria-hidden="true">
                                            <span className="fp-dot" />
                                            <span className="fp-dot" />
                                            <span className="fp-dot" />
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        Send Reset Link
                                        <svg className="fp-btn-arrow" viewBox="0 0 24 24" aria-hidden="true">
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                            <polyline points="12 5 19 12 12 19" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <div className="fp-footer">
                        <a href="/auth" className="fp-back-link">
                            <svg className="fp-back-arrow" viewBox="0 0 24 24" aria-hidden="true">
                                <line x1="19" y1="12" x2="5" y2="12" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                            Back to Sign In
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}