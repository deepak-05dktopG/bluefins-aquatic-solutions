
import { useEffect, useState } from 'react';
// import * as XLSX from 'xlsx';
import { fetchDailyTracker, addDailyTrackerEntry, deleteDailyTrackerByDate } from '../../api/dailyTracker';



// Utility to format date/time
const getNow = () => {
  const d = new Date();
  return {
    date: d.toISOString().slice(0, 10),
    time: d.toTimeString().slice(0, 5),
  };
};



const typeOptions = ['Order', 'Expense', 'Withdrawal'];
const filterTypeOptions = ['Order', 'Registration', 'Expense', 'Withdrawal'];
const paymentOptions = ['Cash', 'GPay', 'Other'];

function exportToCSV(rows) {
  const header = ['Type', 'Name', 'Payment Type', 'Amount', 'Date', 'Time', 'Details/Notes'];
  const csvRows = rows.map(r =>
    [r.type, r.name, r.paymentType, r.amount, r.date, r.time, r.notes].map(x => `"${x ?? ''}"`).join(',')
  );

  // Calculate totals
  const typeTotals = { Order: 0, Expense: 0, Withdrawal: 0 };
  rows.forEach(r => {
    if (typeTotals[r.type] !== undefined) {
      typeTotals[r.type] += Number(r.amount) || 0;
    }
  });

  // Add totals row (with 'Rupees' instead of symbol)
  const totalsRow = [
    'Totals', '', '', '', '', '',
    `${Object.entries(typeTotals).map(([t, v]) => `${t}: Rupees ${v}`).join(' | ')}`
  ].join(',');

  const csv = [header.join(','), ...csvRows, totalsRow].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `daily-tracker-${getNow().date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}




const DailyTracker = () => {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(() => getNow().date);

  // Fetch tracker entries for the selected date
  useEffect(() => {
    setLoading(true);
    fetchDailyTracker(date)
      .then(res => setRows(res.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [date]);

  // Add Entry
  const openModal = (row = null) => {
    setModalData(row);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setModalData(null);
  };
  const saveModal = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    if (!modalData) {
      // Add new entry
      setLoading(true);
      await addDailyTrackerEntry({ ...data, date, time: data.time || getNow().time });
      const res = await fetchDailyTracker(date);
      setRows(res.data || []);
      setLoading(false);
    }
    closeModal();
  };

  // Delete all (after download)
  const deleteAll = async () => {
    if (window.confirm('Delete all tracker data for today?')) {
      setLoading(true);
      await deleteDailyTrackerByDate(date);
      setRows([]);
      setLoading(false);
    }
  };

  // Filtered rows
  const filtered = rows.filter(r =>
    (!filter || Object.values(r).some(v => String(v).toLowerCase().includes(filter.toLowerCase()))) &&
    (!typeFilter || r.type === typeFilter)
  );

  // Running totals
  const totals = typeOptions.reduce((acc, type) => {
    acc[type] = filtered.filter(r => r.type === type).reduce((sum, r) => sum + Number(r.amount), 0);
    return acc;
  }, {});

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
        borderRadius: 18,
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        padding: 32,
        marginBottom: 32,
        border: '1px solid #e3e8ee',
      }}>
        <h2 style={{ fontWeight: 900, fontSize: '2.2rem', marginBottom: 10, color: '#1e293b', letterSpacing: 1 }}>Daily Tracker</h2>
        {/* <div style={{ color: '#FF5252', fontWeight: 600, marginBottom: 18, fontSize: 15 }}>
          <span style={{ verticalAlign: 'middle', marginRight: 6 }}>⚠️</span>
          For one-hour/Rupees 150 entries, use <b>Order</b> type here. Do <b>not</b> register as a member.
        </div> */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', minWidth: 140, fontSize: 15 }}
            title="Select date"
          />
          <input
            placeholder="Search by name, notes, etc."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', minWidth: 220, fontSize: 15 }}
            title="Search entries"
          />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: 10, borderRadius: 8, fontSize: 15, border: '1px solid #cbd5e1' }} title="Filter by type">
            <option value="">All Types</option>
            {filterTypeOptions.map(t => <option key={t}>{t}</option>)}
          </select>
          <button onClick={() => openModal()} style={{ padding: '10px 22px', borderRadius: 8, background: '#2563eb', color: '#fff', fontWeight: 700, border: 'none', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }} title="Add new entry">
            <span style={{ fontSize: 18 }}>➕</span> Add Entry
          </button>
          <button onClick={() => exportToCSV(filtered)} style={{ padding: '10px 22px', borderRadius: 8, background: '#059669', color: '#fff', fontWeight: 700, border: 'none', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }} title="Download as CSV">
            <span style={{ fontSize: 18 }}>⬇️</span> Download CSV
          </button>

          <button onClick={deleteAll} style={{ padding: '10px 22px', borderRadius: 8, background: '#ef4444', color: '#fff', fontWeight: 700, border: 'none', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }} title="Delete all entries for this day">
            <span style={{ fontSize: 18 }}>🗑️</span> Delete All
          </button>
        </div>
        {loading ? (
          <div style={{ color: '#2563eb', margin: 24, textAlign: 'center', fontSize: 18, fontWeight: 600 }}>
            <span className="spinner" style={{ display: 'inline-block', width: 24, height: 24, border: '3px solid #cbd5e1', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', verticalAlign: 'middle', marginRight: 10 }} />
            Loading data...
          </div>
        ) : null}
        <div style={{ overflowX: 'auto', marginTop: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', minWidth: 900 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr style={{ background: '#e0e7ef', color: '#1e293b', fontWeight: 800, fontSize: 15 }}>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #cbd5e1' }}>Type</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #cbd5e1' }}>Name</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #cbd5e1' }}>Payment Type</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #cbd5e1' }}>Amount</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #cbd5e1' }}>Date</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #cbd5e1' }}>Time</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #cbd5e1' }}>Details/Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#888', padding: 24, fontSize: 16 }}>No entries found for this day.</td>
                </tr>
              ) : filtered.map((row, idx) => (
                <tr key={idx} style={{
                  background: idx % 2 === 0 ? '#f8fafc' : '#fff',
                  borderBottom: '1px solid #e5e7eb',
                  transition: 'background 0.2s',
                  cursor: 'pointer',
                  ':hover': { background: '#e0e7ef' }
                }}>
                  <td style={{ padding: '10px 8px' }}>{row.type}</td>
                  <td style={{ padding: '10px 8px' }}>{row.name}</td>
                  <td style={{ padding: '10px 8px' }}>{row.paymentType}</td>
                  <td style={{ padding: '10px 8px' }}>{row.amount}</td>
                  <td style={{ padding: '10px 8px' }}>{row.date}</td>
                  <td style={{ padding: '10px 8px' }}>{row.time}</td>
                  <td style={{ padding: '10px 8px' }}>{row.notes}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f1f5f9', fontWeight: 900, fontSize: 15, color: '#1e293b' }}>
                <td colSpan={3} style={{ padding: '12px 8px' }}>Totals</td>
                <td colSpan={5} style={{ padding: '12px 8px' }}>
                  {typeOptions.map(t => `${t}: Rupees ${totals[t] || 0}`).join(' | ')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal for Add Entry */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={saveModal} style={{ background: '#fff', padding: 36, borderRadius: 14, minWidth: 370, boxShadow: '0 2px 24px rgba(0,0,0,0.20)', maxWidth: 420 }}>
            <h3 style={{ fontWeight: 900, fontSize: 24, marginBottom: 8, color: '#2563eb', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>📝</span> Add Daily Entry
            </h3>
            <div style={{ color: '#64748b', fontSize: 14, marginBottom: 18, background: '#f1f5f9', padding: 10, borderRadius: 6 }}>
              <span style={{ color: '#ef4444' }}>Admins: Double-check amount and type before saving.</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 10 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Type <span style={{ color: '#ef4444' }}>*</span></label>
                  <select name="type" defaultValue={modalData?.type || ''} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 15 }}>
                    <option value="">Select type</option>
                    {typeOptions.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Payment <span style={{ color: '#ef4444' }}>*</span></label>
                  <select name="paymentType" defaultValue={modalData?.paymentType || ''} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 15 }}>
                    <option value="">Select payment</option>
                    {paymentOptions.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input name="name" placeholder="Full name or description" defaultValue={modalData?.name || ''} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 15 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Amount (₹) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input name="amount" type="number" min="0" step="0.01" placeholder="0.00" defaultValue={modalData?.amount || ''} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 15 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Date <span style={{ color: '#ef4444' }}>*</span></label>
                  <input name="date" type="date" defaultValue={modalData?.date || getNow().date} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 15 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Time <span style={{ color: '#ef4444' }}>*</span></label>
                  <input name="time" type="time" defaultValue={modalData?.time || getNow().time} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 15 }} />
                </div>
              </div>
              <div>
                <label style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Details/Notes</label>
                <input name="notes" placeholder="Optional notes, remarks, etc." defaultValue={modalData?.notes || ''} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 15 }} />
              </div>
            </div>
            <div style={{ marginTop: 28, display: 'flex', gap: 14, justifyContent: 'flex-end' }}>
              <button type="submit" style={{ background: '#2563eb', color: '#fff', padding: '10px 28px', borderRadius: 7, border: 'none', fontWeight: 800, fontSize: 16, letterSpacing: 1, boxShadow: '0 1px 4px #2563eb22' }}>Save</button>
              <button type="button" onClick={closeModal} style={{ background: '#f1f5f9', color: '#333', padding: '10px 28px', borderRadius: 7, border: 'none', fontWeight: 700, fontSize: 16 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DailyTracker;
