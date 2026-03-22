
import { useEffect, useState } from 'react';
// import * as XLSX from 'xlsx';
import { fetchDailyTracker, addDailyTrackerEntry, deleteDailyTrackerByDate } from '../../api/dailyTracker';
import Swal from 'sweetalert2';



// Utility to format date/time
const getNow = () => {
  const d = new Date();
  return {
    date: d.toISOString().slice(0, 10),
    time: d.toTimeString().slice(0, 5),
  };
};



const typeOptions = ['Order', 'Expense', 'Withdrawal'];
const filterTypeOptions = ['Order', 'Expense','Registration', 'Withdrawal'];
const paymentOptions = ['Cash', 'GPay'];

const Badge = ({ children, color }) => {
  const colors = {
    blue: { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
    green: { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
    red: { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' },
    yellow: { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
    purple: { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff' },
    gray: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  };
  const theme = colors[color] || colors.gray;
  return (
    <span style={{ backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, padding: '4px 12px', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
      {children}
    </span>
  );
};
const getTypeColor = (type) => {
  switch(type) {
    case 'Order': return 'green';
    case 'Registration': return 'blue';
    case 'Expense': return 'red';
    case 'Withdrawal': return 'gray';
    default: return 'gray';
  }
};
const getPaymentColor = (ptype) => {
  switch((ptype||'').toLowerCase()) {
    case 'cash': return 'yellow';
    case 'gpay': return 'purple';
    default: return 'gray';
  }
};

function exportToCSV(rows, cashBox) {
  const header = ['Type', 'Name', 'Payment Type', 'Amount', 'Date', 'Time', 'Details/Notes'];
  const csvRows = rows.map(r =>
    [r.type, r.name, r.paymentType, r.amount, r.date, r.time, r.notes].map(x => `"${x ?? ''}"`).join(',')
  );

  // Calculate totals (now includes Registration)
  const typeTotals = { Order: 0, Registration: 0, Expense: 0, Withdrawal: 0 };
  rows.forEach(r => {
    if (typeTotals[r.type] !== undefined) {
      typeTotals[r.type] += Number(r.amount) || 0;
    }
  });

  const orderCountCSV = rows.filter(r => r.type === 'Order').length;
  const regCountCSV = rows.filter(r => r.type === 'Registration').length;
  const totalCountCSV = orderCountCSV + regCountCSV;

  // Add totals row (with 'Rupees' instead of symbol)
  const totalsRow = [
    `Totals (Orders(${orderCountCSV}) + Registration(${regCountCSV}) = ${totalCountCSV})`, '', '', '', '', '',
    `${Object.entries(typeTotals).map(([t, v]) => `${t}: Rupees ${v}`).join(' | ')}`
  ].join(',');

  const cashBoxRow = [
    'Cash Box', '', '', '', '', '',
    `Cash: Rupees ${cashBox?.hardCash || 0} | GPay: Rupees ${cashBox?.gpayCash || 0}`
  ].join(',');

  const emptyRow = ['', '', '', '', '', '', ''].join(',');

  const csv = [header.join(','), ...csvRows, emptyRow, totalsRow, cashBoxRow].join('\n');
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
  const [printData, setPrintData] = useState(null);
  const [cashBox, setCashBox] = useState({ hardCash: 0, gpayCash: 0 });
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
      .then(res => {
        setRows(res.data || []);
        if (res.cashBox) setCashBox(res.cashBox);
      })
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
    // Ensure paymentType is lowercase for backend compatibility
    if (data.paymentType) {
      data.paymentType = data.paymentType.toLowerCase();
    }
    if (!modalData) {
      // Add new entry
      try {
        setLoading(true);
        await addDailyTrackerEntry({ ...data, date, time: data.time || getNow().time });
        const res = await fetchDailyTracker(date);
        setRows(res.data || []);
        if (res.cashBox) setCashBox(res.cashBox);
        setLoading(false);
        closeModal();
        
        const payload = { ...data, date: data.date || date, time: data.time || getNow().time, amount: Number(data.amount) };
        
        if (payload.type === 'Order' || payload.type === 'Registration') {
          setPrintData(payload);
          setTimeout(() => {
            window.print();
            setPrintData(null);
          }, 400); // Allow DOM to render thermal layout before triggering the print menu
        } else {
          Swal.fire({
            title: 'Success!',
            text: 'Entry added successfully',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        }
      } catch (err) {
        setLoading(false);
        const msg = err?.response?.data?.message || err.message || 'Failed to add entry';
        Swal.fire('Error', msg, 'error');
      }
    } else {
      closeModal();
    }
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

  const orderCount = filtered.filter(r => r.type === 'Order').length;
  const regCount = filtered.filter(r => r.type === 'Registration').length;
  const totalCount = orderCount + regCount;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only {
            display: block !important;
            width: 58mm;
            font-family: monospace;
            font-size: 13px;
            margin: 0;
            padding: 0;
            color: #000;
          }
          @page { margin: 0; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>

    <div className="no-print" style={{ padding: '32px 24px', maxWidth: 1250, margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.03)',
        padding: '36px 40px',
        marginBottom: 32,
        border: '1px solid rgba(226, 232, 240, 0.8)',
      }}>
        <h2 style={{ fontWeight: 900, fontSize: '2.4rem', marginBottom: 10, color: '#0f172a', letterSpacing: -0.5 }}>Daily Tracker</h2>
        {/* <div style={{ color: '#FF5252', fontWeight: 600, marginBottom: 18, fontSize: 15 }}>
          <span style={{ verticalAlign: 'middle', marginRight: 6 }}>⚠️</span>
          For one-hour/Rupees 150 entries, use <b>Order</b> type here. Do <b>not</b> register as a member.
        </div> */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
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
          <button onClick={() => exportToCSV(filtered, cashBox)} style={{ padding: '10px 22px', borderRadius: 8, background: '#059669', color: '#fff', fontWeight: 700, border: 'none', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }} title="Download as CSV">
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
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#fff', borderRadius: 14, overflow: 'hidden', minWidth: 900, border: '1px solid #e2e8f0' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background: '#f1f5f9', fontWeight: 900, fontSize: 15, color: '#1e293b' }}>
                <th colSpan={3} style={{ padding: '14px 14px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Totals <span style={{ color: '#2563eb', fontSize: 13, marginLeft: 8 }}>(Orders({orderCount}) + Registration({regCount}) = {totalCount})</span></th>
                <th colSpan={4} style={{ padding: '14px 14px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                  {typeOptions.map(t => `${t}: Rupees ${totals[t] || 0}`).join(' | ')}
                </th>
              </tr>
              <tr style={{ background: '#e2e8f0', fontWeight: 900, fontSize: 16, color: '#0f172a' }}>
                <th colSpan={3} style={{ padding: '16px 14px', textAlign: 'left', borderBottom: '2px solid #cbd5e1' }}>💰 Cash Box</th>
                <th colSpan={4} style={{ padding: '16px 14px', textAlign: 'left', borderBottom: '2px solid #cbd5e1' }}>
                  Cash: Rupees {cashBox.hardCash?.toLocaleString('en-IN') || 0} | GPay: Rupees {cashBox.gpayCash?.toLocaleString('en-IN') || 0}
                </th>
              </tr>
              <tr style={{ background: '#f8fafc', color: '#475569', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                <th style={{ padding: '16px 14px', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '16px 14px', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '16px 14px', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>Payment Type</th>
                <th style={{ padding: '16px 14px', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>Amount</th>
                <th style={{ padding: '16px 14px', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '16px 14px', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>Time</th>
                <th style={{ padding: '16px 14px', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>Details/Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#888', padding: 24, fontSize: 16 }}>No entries found for this day.</td>
                </tr>
              ) : filtered.map((row, idx) => (
                <tr key={idx} style={{
                  background: idx % 2 === 0 ? '#f8fafc' : '#ffffff',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? '#f8fafc' : '#ffffff'}
                >
                  <td style={{ padding: '14px 14px', verticalAlign: 'middle', borderBottom: '1px solid #e2e8f0' }}><Badge color={getTypeColor(row.type)}>{row.type}</Badge></td>
                  <td style={{ padding: '14px 14px', verticalAlign: 'middle', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #e2e8f0' }}>{row.name}</td>
                  <td style={{ padding: '14px 14px', verticalAlign: 'middle', borderBottom: '1px solid #e2e8f0' }}><Badge color={getPaymentColor(row.paymentType)}>{row.paymentType}</Badge></td>
                  <td style={{ padding: '14px 14px', verticalAlign: 'middle', fontWeight: 800, color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>₹ {Number(row.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style={{ padding: '14px 14px', verticalAlign: 'middle', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{row.date}</td>
                  <td style={{ padding: '14px 14px', verticalAlign: 'middle', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{row.time}</td>
                  <td style={{ padding: '14px 14px', verticalAlign: 'middle', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add Entry */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
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

    {/* Hidden Thermal Printer Container (Compact Layout) */}
    <div className="print-only">
      {printData && (
        <div style={{ width: '100%', padding: '0 4px', boxSizing: 'border-box' }}>
          <h3 style={{ margin: '0 0 2px 0', fontSize: '15px', textAlign: 'center', fontWeight: '900' }}>BLUE FINS AQUATICS</h3>
          <p style={{ margin: '0 0 4px 0', textAlign: 'center', fontSize: '11px' }}>bluefinsaquaticsolutions.com</p>
          
          <p style={{ margin: '2px 0', textAlign: 'center', fontSize: '12px' }}>----------------------------</p>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
            <span>{printData.date}</span>
            <span>{printData.time}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>
              <b>{printData.name}</b>
            </span>
            <span><b>{printData.paymentType.toUpperCase()}</b></span>
          </div>
          
          <p style={{ margin: '2px 0', textAlign: 'center', fontSize: '12px' }}>----------------------------</p>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', margin: '4px 0' }}>
            <span>{printData.type === 'Order' ? 'Pool(1Hr)' : printData.type}</span>
            <span>₹ {printData.amount}</span>
          </div>
          
          <p style={{ margin: '2px 0', textAlign: 'center', fontSize: '12px' }}>----------------------------</p>
          <p style={{ margin: '4px 0 0 0', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>Thank You!</p>
        </div>
      )}
    </div>
    </>
  );
};

export default DailyTracker;
