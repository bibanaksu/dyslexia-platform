// pages/AuditLog.jsx
// Therapist-only page showing login history, IPs, and attempt counts.
import { useState, useEffect } from 'react';
import { fetchAuditLog } from '../services/api';

const EVENT_LABELS = {
    login_success:          { label: 'Login',           color: '#16a34a', bg: '#dcfce7', icon: '✅' },
    login_failure:          { label: 'Failed attempt',  color: '#dc2626', bg: '#fef2f2', icon: '❌' },
    logout:                 { label: 'Logout',          color: '#6b7280', bg: '#f3f4f6', icon: '🚪' },
    password_change:        { label: 'Password changed',color: '#d97706', bg: '#fef3c7', icon: '🔑' },
    password_reset_request: { label: 'Reset requested', color: '#7c3aed', bg: '#ede9fe', icon: '📧' },
};

export default function AuditLog() {
    const [log,       setLog]       = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [error,     setError]     = useState('');
    const [filter,    setFilter]    = useState('all');    // all | login_success | login_failure | …
    const [search,    setSearch]    = useState('');

    useEffect(() => {
        fetchAuditLog()
            .then(setLog)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    // Derived stats
    const totalLogins   = log.filter(e => e.event_type === 'login_success').length;
    const failedLogins  = log.filter(e => e.event_type === 'login_failure').length;
    const uniqueIPs     = new Set(log.map(e => e.ip_address).filter(Boolean)).size;

    // Filtered list
    const filtered = log.filter(row => {
        const matchType   = filter === 'all' || row.event_type === filter;
        const matchSearch = !search ||
            (row.user_name  || '').toLowerCase().includes(search.toLowerCase()) ||
            (row.ip_address || '').includes(search) ||
            (row.user_role  || '').includes(search.toLowerCase());
        return matchType && matchSearch;
    });

    return (
        <div style={styles.page}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Security Audit Log</h1>
                    <p style={styles.subtitle}>
                        Full login history, failed attempts, and security events.
                    </p>
                </div>
                <a href="/dashboard" style={styles.backBtn}>← Dashboard</a>
            </div>

            {/* Stat cards */}
            <div style={styles.statsRow}>
                <StatCard label="Total Logins"    value={totalLogins}  icon="✅" color="#16a34a" />
                <StatCard label="Failed Attempts" value={failedLogins} icon="❌" color="#dc2626" />
                <StatCard label="Unique IPs"      value={uniqueIPs}    icon="🌐" color="#4a7cf6" />
                <StatCard label="Total Events"    value={log.length}   icon="📋" color="#7c3aed" />
            </div>

            {/* Filters */}
            <div style={styles.controls}>
                <input
                    style={styles.searchInput}
                    type="text"
                    placeholder="Search by name, IP, or role…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div style={styles.filterGroup}>
                    {['all', 'login_success', 'login_failure', 'logout', 'password_change'].map(f => (
                        <button
                            key={f}
                            style={{
                                ...styles.filterBtn,
                                background:  filter === f ? '#16a34a' : '#f3f4f6',
                                color:       filter === f ? '#fff'    : '#374151',
                                fontWeight:  filter === f ? '700'     : '400',
                            }}
                            onClick={() => setFilter(f)}
                        >
                            {f === 'all' ? 'All Events' : (EVENT_LABELS[f]?.label || f)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div style={styles.center}>Loading audit log…</div>
            ) : error ? (
                <div style={styles.errorBox}>{error}</div>
            ) : filtered.length === 0 ? (
                <div style={styles.center}>No events match your filter.</div>
            ) : (
                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.thead}>
                                <th style={styles.th}>Event</th>
                                <th style={styles.th}>User</th>
                                <th style={styles.th}>Role</th>
                                <th style={styles.th}>IP Address</th>
                                <th style={styles.th}>Browser / Device</th>
                                <th style={styles.th}>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(row => {
                                const meta = EVENT_LABELS[row.event_type] || { label: row.event_type, color: '#6b7280', bg: '#f3f4f6', icon: '•' };
                                return (
                                    <tr key={row.id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.badge,
                                                color:      meta.color,
                                                background: meta.bg,
                                            }}>
                                                {meta.icon} {meta.label}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.userName}>
                                                {row.user_name || `#${row.user_id}`}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.rolePill,
                                                background: row.user_role === 'therapist' ? '#ede9fe' : '#dbeafe',
                                                color:      row.user_role === 'therapist' ? '#7c3aed' : '#1d4ed8',
                                            }}>
                                                {row.user_role}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <code style={styles.code}>{row.ip_address || '—'}</code>
                                        </td>
                                        <td style={{ ...styles.td, maxWidth: '260px', overflow: 'hidden' }}>
                                            <span style={styles.ua} title={row.user_agent}>
                                                {parseUA(row.user_agent)}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.time}>
                                                {row.formatted_time || new Date(row.created_at).toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <p style={styles.count}>
                        Showing {filtered.length} of {log.length} events
                    </p>
                </div>
            )}
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────

function StatCard({ label, value, icon, color }) {
    return (
        <div style={styles.statCard}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
            <div style={{ fontSize: '32px', fontWeight: '800', color }}>{value}</div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>{label}</div>
        </div>
    );
}

// Parses a user agent string into a short readable string
function parseUA(ua) {
    if (!ua) return '—';
    if (ua.includes('Chrome'))  return `Chrome · ${ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'Mac' : 'Linux'}`;
    if (ua.includes('Firefox')) return `Firefox · ${ua.includes('Windows') ? 'Windows' : 'Other'}`;
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari · Mac/iOS';
    if (ua.includes('Edg'))     return 'Edge';
    return ua.substring(0, 50) + '…';
}

// ── Styles ────────────────────────────────────────────────────
const styles = {
    page: {
        maxWidth:   '1200px',
        margin:     '0 auto',
        padding:    '32px 24px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color:      '#1a1a1a',
    },
    header: {
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'flex-start',
        marginBottom:   '28px',
        flexWrap:       'wrap',
        gap:            '12px',
    },
    title: {
        fontSize:   '28px',
        fontWeight: '800',
        margin:     '0 0 4px',
    },
    subtitle: {
        color:    '#6b7280',
        margin:   0,
        fontSize: '15px',
    },
    backBtn: {
        display:        'inline-flex',
        alignItems:     'center',
        color:          '#16a34a',
        textDecoration: 'none',
        fontWeight:     '600',
        fontSize:       '14px',
        border:         '1.5px solid #16a34a',
        borderRadius:   '8px',
        padding:        '8px 14px',
    },
    statsRow: {
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap:                 '16px',
        marginBottom:        '28px',
    },
    statCard: {
        background:   '#fff',
        borderRadius: '12px',
        boxShadow:    '0 2px 8px rgba(0,0,0,0.07)',
        padding:      '20px',
        textAlign:    'center',
    },
    controls: {
        display:        'flex',
        gap:            '12px',
        marginBottom:   '20px',
        flexWrap:       'wrap',
        alignItems:     'center',
    },
    searchInput: {
        border:       '1.5px solid #d1d5db',
        borderRadius: '8px',
        padding:      '10px 14px',
        fontSize:     '14px',
        outline:      'none',
        width:        '240px',
        flexShrink:   0,
    },
    filterGroup: {
        display:  'flex',
        gap:      '8px',
        flexWrap: 'wrap',
    },
    filterBtn: {
        border:       'none',
        borderRadius: '6px',
        padding:      '8px 14px',
        fontSize:     '13px',
        cursor:       'pointer',
        transition:   'all 0.15s',
    },
    tableWrapper: {
        background:   '#fff',
        borderRadius: '12px',
        boxShadow:    '0 2px 8px rgba(0,0,0,0.07)',
        overflow:     'hidden',
    },
    table: {
        width:          '100%',
        borderCollapse: 'collapse',
    },
    thead: {
        background: '#f9fafb',
    },
    th: {
        padding:   '12px 16px',
        textAlign: 'left',
        fontSize:  '12px',
        fontWeight:'700',
        color:     '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderBottom: '1px solid #e5e7eb',
    },
    tr: {
        borderBottom: '1px solid #f3f4f6',
    },
    td: {
        padding:        '12px 16px',
        fontSize:       '14px',
        verticalAlign:  'middle',
    },
    badge: {
        display:      'inline-flex',
        alignItems:   'center',
        gap:          '4px',
        padding:      '4px 10px',
        borderRadius: '20px',
        fontSize:     '13px',
        fontWeight:   '600',
        whiteSpace:   'nowrap',
    },
    rolePill: {
        display:      'inline-block',
        padding:      '3px 10px',
        borderRadius: '20px',
        fontSize:     '12px',
        fontWeight:   '600',
    },
    userName: {
        fontWeight: '600',
        color:      '#111827',
    },
    code: {
        fontFamily:  'monospace',
        fontSize:    '13px',
        color:       '#374151',
        background:  '#f3f4f6',
        padding:     '2px 6px',
        borderRadius:'4px',
    },
    ua: {
        color:     '#6b7280',
        fontSize:  '13px',
        display:   'block',
        overflow:  'hidden',
        textOverflow: 'ellipsis',
        whiteSpace:'nowrap',
    },
    time: {
        color:    '#6b7280',
        fontSize: '13px',
        whiteSpace:'nowrap',
    },
    count: {
        color:     '#9ca3af',
        fontSize:  '12px',
        padding:   '12px 16px',
        margin:    0,
        textAlign: 'right',
    },
    center: {
        textAlign: 'center',
        color:     '#6b7280',
        padding:   '48px',
        fontSize:  '15px',
    },
    errorBox: {
        background:   '#fef2f2',
        border:       '1px solid #fca5a5',
        borderRadius: '8px',
        color:        '#dc2626',
        padding:      '16px',
        fontSize:     '14px',
    },
};