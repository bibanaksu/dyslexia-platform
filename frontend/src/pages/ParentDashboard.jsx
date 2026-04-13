// pages/ParentDashboard.jsx
import { useState, useEffect } from 'react';
import { fetchChildren, fetchChildAssessments, logout, getCurrentUser } from '../services/api';

export default function ParentDashboard() {
    const user                              = getCurrentUser();
    const [children,    setChildren]        = useState([]);
    const [selected,    setSelected]        = useState(null);    // selected child id
    const [assessments, setAssessments]     = useState([]);
    const [loading,     setLoading]         = useState(true);
    const [assLoading,  setAssLoading]      = useState(false);
    const [error,       setError]           = useState('');

    // Load children on mount
    useEffect(() => {
        fetchChildren()
            .then(list => { setChildren(list); setLoading(false); })
            .catch(e   => { setError(e.message); setLoading(false); });
    }, []);

    // Load assessments when a child is selected
    useEffect(() => {
        if (!selected) { setAssessments([]); return; }
        setAssLoading(true);
        fetchChildAssessments(selected)
            .then(list => { setAssessments(list); setAssLoading(false); })
            .catch(e   => { setError(e.message); setAssLoading(false); });
    }, [selected]);

    const selectedChild = children.find(c => c.id === selected);

    // ── Render ────────────────────────────────────────────────
    return (
        <div style={styles.page}>
            {/* Top nav */}
            <nav style={styles.nav}>
                <div style={styles.navLeft}>
                    <div style={styles.navLogo}>🧠 Dyslexia Platform</div>
                    <span style={styles.navRole}>Parent Portal</span>
                </div>
                <div style={styles.navRight}>
                    <span style={styles.navName}>👤 {user.name}</span>
                    <button style={styles.logoutBtn} onClick={logout}>Sign Out</button>
                </div>
            </nav>

            <div style={styles.content}>
                {/* Page title */}
                <div style={styles.pageHeader}>
                    <div>
                        <h1 style={styles.title}>My Children</h1>
                        <p style={styles.subtitle}>Track progress and assessment results.</p>
                    </div>
                </div>

                {/* Error */}
                {error && <div style={styles.errorBox}>{error}</div>}

                {/* Loading */}
                {loading ? (
                    <div style={styles.center}>Loading your children…</div>
                ) : children.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div style={styles.layout}>
                        {/* Child cards column */}
                        <div style={styles.childList}>
                            {children.map(child => (
                                <ChildCard
                                    key={child.id}
                                    child={child}
                                    isSelected={selected === child.id}
                                    onClick={() => setSelected(child.id === selected ? null : child.id)}
                                />
                            ))}
                        </div>

                        {/* Detail panel */}
                        {selected && (
                            <div style={styles.detail}>
                                <div style={styles.detailHeader}>
                                    <h2 style={styles.detailTitle}>
                                        {selectedChild?.full_name} — Assessment History
                                    </h2>
                                    <button
                                        style={styles.closeBtn}
                                        onClick={() => setSelected(null)}
                                    >✕</button>
                                </div>

                                {assLoading ? (
                                    <div style={styles.center}>Loading assessments…</div>
                                ) : assessments.length === 0 ? (
                                    <div style={styles.noAssessments}>
                                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
                                        <p>No assessments recorded yet.</p>
                                        <p style={{ color: '#9ca3af', fontSize: '13px' }}>
                                            Your therapist will add assessment results here.
                                        </p>
                                    </div>
                                ) : (
                                    <div style={styles.assessmentList}>
                                        {assessments.map(a => (
                                            <AssessmentCard key={a.id} assessment={a} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Child Card ────────────────────────────────────────────────
function ChildCard({ child, isSelected, onClick }) {
    const pct = child.activityCompletionPct;

    return (
        <div
            style={{
                ...styles.childCard,
                border: isSelected
                    ? '2px solid #16a34a'
                    : '2px solid transparent',
                background: isSelected ? '#f0fdf4' : '#fff',
            }}
            onClick={onClick}
        >
            {/* Avatar */}
            <div style={styles.avatar}>
                {child.full_name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div style={styles.cardInfo}>
                <div style={styles.cardName}>{child.full_name}</div>
                <div style={styles.cardMeta}>
                    Grade {child.grade}
                    {child.age ? ` · ${child.age} years old` : ''}
                </div>

                {/* Activity progress bar */}
                <div style={styles.progressRow}>
                    <span style={styles.progressLabel}>
                        Activities: {pct !== null ? `${pct}%` : 'None yet'}
                    </span>
                    <div style={styles.progressTrack}>
                        <div style={{
                            ...styles.progressBar,
                            width: `${pct || 0}%`,
                            background: (pct || 0) >= 75 ? '#16a34a' : (pct || 0) >= 40 ? '#f59e0b' : '#e5e7eb',
                        }} />
                    </div>
                </div>

                {/* Assessment summary */}
                <div style={styles.cardFooter}>
                    <span style={styles.cardTag}>
                        📋 {child.assessmentCount} assessment{child.assessmentCount !== 1 ? 's' : ''}
                    </span>
                    {child.latestEvaluation && (
                        <span style={styles.cardEval}>{child.latestEvaluation}</span>
                    )}
                </div>
            </div>

            <div style={styles.chevron}>{isSelected ? '▲' : '▼'}</div>
        </div>
    );
}

// ── Assessment Card ───────────────────────────────────────────
function AssessmentCard({ assessment: a }) {
    const scores = [
        { label: 'Letter Recognition', value: a.letter_recognition_score },
        { label: 'Word Reading',       value: a.word_reading_score       },
        { label: 'Comprehension',      value: a.comprehension_score      },
    ].filter(s => s.value !== null);

    return (
        <div style={styles.assessCard}>
            <div style={styles.assessHeader}>
                <span style={styles.assessDate}>
                    {new Date(a.assessment_date).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric',
                    })}
                </span>
                {a.averageScore !== null && (
                    <span style={{
                        ...styles.avgBadge,
                        background: a.averageScore >= 75 ? '#dcfce7' : a.averageScore >= 50 ? '#fef3c7' : '#fef2f2',
                        color:      a.averageScore >= 75 ? '#15803d' : a.averageScore >= 50 ? '#b45309' : '#dc2626',
                    }}>
                        Avg: {a.averageScore}%
                    </span>
                )}
            </div>

            {/* Score bars */}
            {scores.length > 0 && (
                <div style={styles.scoreGrid}>
                    {scores.map(s => (
                        <ScoreBar key={s.label} label={s.label} value={Number(s.value)} />
                    ))}
                </div>
            )}

            {scores.length === 0 && (
                <p style={{ color: '#9ca3af', fontSize: '13px', margin: '8px 0 0' }}>
                    No scores recorded for this assessment.
                </p>
            )}

            {a.notes && (
                <div style={styles.assessNotes}>
                    <strong>Notes:</strong> {a.notes}
                </div>
            )}

            {a.overall_evaluation && (
                <div style={styles.assessEval}>
                    <strong>Overall:</strong> {a.overall_evaluation}
                </div>
            )}
        </div>
    );
}

function ScoreBar({ label, value }) {
    const color = value >= 75 ? '#16a34a' : value >= 50 ? '#f59e0b' : '#ef4444';
    return (
        <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', color: '#374151' }}>{label}</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color }}>{value}%</span>
            </div>
            <div style={styles.progressTrack}>
                <div style={{ ...styles.progressBar, width: `${value}%`, background: color }} />
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div style={styles.emptyState}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>👶</div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>
                No children registered yet
            </h2>
            <p style={{ color: '#6b7280' }}>
                Contact your therapist to get your child added to the platform.
            </p>
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────
const styles = {
    page:       { minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' },
    nav:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 28px', height: '60px' },
    navLeft:    { display: 'flex', alignItems: 'center', gap: '16px' },
    navLogo:    { fontSize: '18px', fontWeight: '800', color: '#16a34a' },
    navRole:    { fontSize: '13px', color: '#6b7280', background: '#f0fdf4', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' },
    navRight:   { display: 'flex', alignItems: 'center', gap: '16px' },
    navName:    { fontSize: '14px', color: '#374151', fontWeight: '500' },
    logoutBtn:  { background: 'none', border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px', color: '#6b7280' },
    content:    { maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' },
    pageHeader: { marginBottom: '28px' },
    title:      { fontSize: '28px', fontWeight: '800', margin: '0 0 4px', color: '#111827' },
    subtitle:   { color: '#6b7280', margin: 0, fontSize: '15px' },
    layout:     { display: 'grid', gridTemplateColumns: '1fr', gap: '24px' },
    childList:  { display: 'flex', flexDirection: 'column', gap: '14px' },
    childCard:  { display: 'flex', alignItems: 'center', gap: '16px', background: '#fff', borderRadius: '12px', padding: '18px 20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
    avatar:     { width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a, #4a7cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '800', flexShrink: 0 },
    cardInfo:   { flex: 1, minWidth: 0 },
    cardName:   { fontSize: '17px', fontWeight: '700', color: '#111827', marginBottom: '2px' },
    cardMeta:   { fontSize: '13px', color: '#6b7280', marginBottom: '8px' },
    progressRow:{ marginBottom: '8px' },
    progressLabel: { fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' },
    progressTrack: { height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' },
    progressBar: { height: '100%', borderRadius: '3px', transition: 'width 0.4s ease' },
    cardFooter: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
    cardTag:    { fontSize: '12px', color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px' },
    cardEval:   { fontSize: '12px', color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' },
    chevron:    { color: '#9ca3af', fontSize: '12px', flexShrink: 0 },
    detail:     { background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: '24px', marginTop: '8px' },
    detailHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    detailTitle: { fontSize: '18px', fontWeight: '700', margin: 0, color: '#111827' },
    closeBtn:   { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#9ca3af', lineHeight: 1, padding: '4px' },
    assessmentList: { display: 'flex', flexDirection: 'column', gap: '16px' },
    assessCard: { border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px 18px' },
    assessHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    assessDate: { fontWeight: '700', color: '#111827', fontSize: '15px' },
    avgBadge:   { padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' },
    scoreGrid:  { display: 'flex', flexDirection: 'column', gap: '4px' },
    assessNotes: { marginTop: '12px', fontSize: '13px', color: '#374151', background: '#f9fafb', padding: '10px 12px', borderRadius: '8px' },
    assessEval: { marginTop: '8px', fontSize: '13px', color: '#15803d', background: '#f0fdf4', padding: '10px 12px', borderRadius: '8px', fontWeight: '500' },
    noAssessments: { textAlign: 'center', padding: '40px', color: '#6b7280' },
    errorBox:   { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#dc2626', padding: '12px 14px', fontSize: '14px', marginBottom: '20px' },
    emptyState: { textAlign: 'center', padding: '80px 20px', color: '#1a1a1a' },
    center:     { textAlign: 'center', padding: '48px', color: '#6b7280' },
};