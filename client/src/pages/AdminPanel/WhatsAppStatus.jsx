import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import Swal from 'sweetalert2';
import AdminNavbar from '../../components/adminPanel/AdminNavbar';

const WhatsAppStatus = () => {
    const [status, setStatus] = useState('loading');
    const [qr, setQr] = useState(null);
    const [phone, setPhone] = useState(null);
    const [notificationTime, setNotificationTime] = useState('08:00');
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [counts, setCounts] = useState({ total: 0, sent: 0, failed: 0 });

    const fetchStatus = async () => {
        try {
            const { data } = await api.get('/whatsapp/status');
            setStatus(data.status);
            setPhone(data.phone);
            if (data.status === 'qr_pending') {
                const qrRes = await api.get('/whatsapp/qr');
                setQr(qrRes.data.qr);
            } else {
                setQr(null);
            }
        } catch (err) {
            console.error('Failed to fetch WhatsApp status', err);
            setStatus('error');
        }
    };

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/whatsapp/time');
            if (data.success) setNotificationTime(data.time);
        } catch (err) {
            console.error('Failed to fetch settings', err);
        }
    };

    const fetchLogs = async () => {
        try {
            const { data } = await api.get('/whatsapp/logs?limit=15');
            setLogs(data.data || []);
            setCounts(data.counts || { total: 0, sent: 0, failed: 0 });
        } catch (err) {
            console.error('Failed to fetch logs', err);
        }
    };

    useEffect(() => {
        fetchStatus();
        fetchSettings();
        fetchLogs();
        const interval = setInterval(fetchStatus, 10000); // Check status every 10s
        return () => clearInterval(interval);
    }, []);

    const updateTime = async () => {
        try {
            setLoading(true);
            await api.post('/whatsapp/time', { time: notificationTime });
            setLoading(false);
            Swal.fire('Updated!', `Notifications will now be sent daily at ${notificationTime} IST.`, 'success');
        } catch (err) {
            setLoading(false);
            Swal.fire('Error', 'Failed to update time.', 'error');
        }
    };

    const handleDisconnect = async () => {
        const result = await Swal.fire({
            title: 'Disconnect WhatsApp?',
            text: "This will log you out. You'll need to scan a QR code to link a new number.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, Disconnect'
        });

        if (result.isConfirmed) {
            try {
                setLoading(true);
                await api.post('/whatsapp/disconnect');
                setLoading(false);
                fetchStatus();
                Swal.fire('Disconnected', 'The linked number has been removed.', 'success');
            } catch (err) {
                setLoading(false);
                Swal.fire('Error', 'Failed to disconnect.', 'error');
            }
        }
    };

    const runManualCheck = async () => {
        try {
            setLoading(true);
            const { data } = await api.post('/whatsapp/run-check');
            setLoading(false);
            Swal.fire('Success', `Expiry check finished. Sent ${data.data.sent} reminders.`, 'success');
            fetchLogs();
        } catch (err) {
            setLoading(false);
            Swal.fire('Error', 'Failed to run manually', 'error');
        }
    };

    const sendTest = async () => {
        const { value: phoneNum } = await Swal.fire({
            title: 'Send Test Message',
            input: 'text',
            placeholder: 'e.g. 9876543210',
            inputLabel: 'Enter 10-digit Phone Number',
            showCancelButton: true
        });
        if (phoneNum) {
            try {
                Swal.fire({ title: 'Sending...', didOpen: () => Swal.showLoading() });
                await api.post('/whatsapp/test', { phone: phoneNum });
                Swal.fire('Sent!', 'Check the destination WhatsApp.', 'success');
            } catch (err) {
                Swal.fire('Error', err.response?.data?.message || 'Failed to send test', 'error');
            }
        }
    };

    const clearLogs = async () => {
        const result = await Swal.fire({
            title: 'Clear Notification History?',
            text: 'This will permanently delete all notification logs. Members reminder flags will NOT be reset.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, Clear All'
        });
        if (result.isConfirmed) {
            try {
                const { data } = await api.delete('/whatsapp/logs');
                Swal.fire('Cleared!', data.message, 'success');
                fetchLogs();
            } catch (err) {
                Swal.fire('Error', 'Failed to clear logs.', 'error');
            }
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <AdminNavbar />
            <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', letterSpacing: -0.5 }}>WhatsApp Control Center</h1>
                    <div style={{ padding: '8px 16px', borderRadius: '30px', background: status === 'connected' ? '#dcfce7' : status === 'initializing' ? '#fef3c7' : '#fee2e2', color: status === 'connected' ? '#166534' : status === 'initializing' ? '#92400e' : '#991b1b', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: status === 'connected' ? '#22c55e' : status === 'initializing' ? '#f59e0b' : '#ef4444' }} />
                        {status === 'connected' ? 'ACTIVE' : status === 'qr_pending' ? 'LINK PENDING' : status === 'initializing' ? 'INITIALIZING' : 'DISCONNECTED'}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                    {/* Status & Connection Card */}
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>Linked Account</h3>
                        
                        {status === 'qr_pending' && qr ? (
                            <div style={{ textAlign: 'center', background: '#fff', padding: '16px', borderRadius: '12px' }}>
                                <img src={qr} alt="Scan QR" style={{ width: '200px', marginBottom: '16px', border: '1px solid #f1f5f9' }} />
                                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Open WhatsApp {'>'} Linked Devices {'>'} Link a Device</p>
                            </div>
                        ) : status === 'connected' ? (
                            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '40px', marginBottom: '8px' }}>📱</div>
                                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>+{phone}</div>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Linked & Ready to Send</div>
                            </div>
                        ) : status === 'initializing' ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                                <div style={{ marginBottom: 8, fontSize: 24 }}>⏳</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>Connecting to WhatsApp...</div>
                                <div style={{ fontSize: 12, marginTop: 4 }}>This can take up to 60 seconds.</div>
                            </div>
                        ) : (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#ef4444', fontWeight: 600 }}>WhatsApp is disconnected. Check logs.</div>
                        )}

                        {status === 'connected' && (
                            <button onClick={handleDisconnect} style={{ width: '100%', marginTop: '20px', padding: '10px', borderRadius: '8px', border: '1.5px solid #ef4444', background: '#fff', color: '#ef4444', fontWeight: 700, cursor: 'pointer' }}>
                                Disconnect / Switch Number
                            </button>
                        )}
                    </div>

                    {/* Automation Settings Card */}
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>Automation Schedule</h3>
                        
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Daily Notification Time (IST)</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input type="time" value={notificationTime} onChange={(e) => setNotificationTime(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', flex: 1, fontWeight: 700 }} />
                                <button onClick={updateTime} style={{ padding: '0 20px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Set</button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button onClick={runManualCheck} disabled={loading || status !== 'connected'} style={{ width: '100%', padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', opacity: (loading || status !== 'connected') ? 0.6 : 1 }}>
                                {loading ? 'Running...' : 'Run Manual Expiry Check'}
                            </button>
                            <button onClick={sendTest} disabled={status !== 'connected'} style={{ width: '100%', padding: '12px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', opacity: status !== 'connected' ? 0.6 : 1 }}>
                                Send Test Message
                            </button>
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Notification History</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ fontSize: '14px', color: '#64748b' }}>Passed: <b style={{ color: '#16a34a' }}>{counts.sent}</b></div>
                            <div style={{ fontSize: '14px', color: '#64748b' }}>Failed: <b style={{ color: '#dc2626' }}>{counts.failed}</b></div>
                            <button onClick={clearLogs} disabled={logs.length === 0} style={{ padding: '6px 14px', background: '#fff', border: '1.5px solid #ef4444', color: '#ef4444', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', opacity: logs.length === 0 ? 0.4 : 1 }}>
                                🗑 Clear History
                            </button>
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc' }}>
                                <tr style={{ textAlign: 'left' }}>
                                    <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Member</th>
                                    <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Phone</th>
                                    <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Reminder</th>
                                    <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                                    <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '16px 24px', fontWeight: 700, color: '#0f172a' }}>{log.memberName}</td>
                                        <td style={{ padding: '16px 24px', color: '#64748b' }}>{log.phone}</td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ padding: '4px 8px', borderRadius: '6px', background: '#f1f5f9', fontSize: '12px', fontWeight: 700, color: '#475569' }}>{log.daysBeforeExpiry}-DAY</span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: log.status === 'sent' ? '#f0fdf4' : '#fef2f2', color: log.status === 'sent' ? '#16a34a' : '#ef4444', fontSize: '12px', fontWeight: 800 }}>
                                                {log.status === 'sent' ? '✓ SENT' : '⨯ FAILED'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px', fontSize: '13px', color: '#94a3b8' }}>{new Date(log.sentAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '15px' }}>No notification logs found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppStatus;
