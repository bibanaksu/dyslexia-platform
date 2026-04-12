import { useState, useEffect } from 'react';
import { fetchAuditLog, getCurrentUser } from '../services/api';
import './Dashboard.css';

function TherapistDashboard() {
    const [auditLog, setAuditLog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const user = getCurrentUser();

    useEffect(() => {
        loadAuditLog();
    }, []);

    const loadAuditLog = async () => {
        try {
            setLoading(true);
            const data = await fetchAuditLog();
            setAuditLog(data);
            setError('');
        } catch (err) {
            setError(err.message);
            console.error('Failed to load audit log:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const getEventStyle = (eventType) => {
        return eventType === 'login_success' 
            ? { backgroundColor: '#e8f5e9', color: '#2e7d32' }
            : { backgroundColor: '#ffebee', color: '#c62828' };
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Welcome, {user.name}!</h1>
                <p>Therapist Dashboard</p>
            </div>

            <div className="dashboard-stats">
                <div className="stat-card">
                    <h3>Total Logins</h3>
                    <p>{auditLog.filter(log => log.event_type === 'login_success').length}</p>
                </div>
                <div className="stat-card">
                    <h3>Failed Attempts</h3>
                    <p>{auditLog.filter(log => log.event_type === 'login_failure').length}</p>
                </div>
            </div>

            <div className="audit-log-section">
                <h2>Login History</h2>
                {loading && (
                    <div className="loading-spinner">
                        Loading login history...
                    </div>
                )}
                
                {error && (
                    <div className="error-message" style={{
                        backgroundColor: '#ffebee',
                        color: '#c62828',
                        padding: '10px',
                        borderRadius: '5px',
                        marginBottom: '15px'
                    }}>
                        Error: {error}
                    </div>
                )}
                
                {!loading && !error && (
                    <div className="audit-table-container">
                        <table className="audit-table" style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            marginTop: '15px'
                        }}>
                            <thead>
                                <tr style={{
                                    backgroundColor: '#3d5a4c',
                                    color: 'white'
                                }}>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Date & Time</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Event</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>IP Address</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Browser</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditLog.slice(0, 20).map((log, index) => (
                                    <tr key={log.id} style={{
                                        backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white',
                                        ...getEventStyle(log.event_type)
                                    }}>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                                            {formatDate(log.created_at)}
                                        </td>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                                            {log.event_type === 'login_success' ? '✓ Success' : '✗ Failed'}
                                        </td>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                                            {log.ip_address || 'Unknown'}
                                        </td>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                                            {log.user_agent || 'Unknown'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {auditLog.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                No login history available yet.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TherapistDashboard;
