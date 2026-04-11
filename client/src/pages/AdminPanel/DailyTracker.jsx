
import { useEffect, useState } from 'react';
import {
  fetchDailyTracker,
  fetchAllTrackerEntries,
  addDailyTrackerEntry,
  updateDailyTrackerEntry,
  deleteDailyTrackerById,
  deleteDailyTrackerByDate,
  deleteAllTrackerEntries
} from '../../api/dailyTracker';
import api from '../../api/api';
import Swal from 'sweetalert2';
import { formatHHmmTo12Hour } from '../../utils/dateTime';



// Utility to format date/time
const getNow = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return {
    date: `${year}-${month}-${day}`,
    time: d.toTimeString().slice(0, 5),
  };
};



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
  switch (type) {
    case 'Stock':
    case 'Order':
    case '1 Hour Order':
    case '1 Hour':
    case '1 Hour Stock':
    case 'Public Stock':
    case 'Public Order': return 'green';
    case 'Pending Amount': return 'purple';
    case 'Expense': return 'red';
    case 'Withdrawal': return 'gray';
    default: return 'blue'; // Assume blue for all dynamic membership plans
  }
};
const getPaymentColor = (ptype) => {
  switch ((ptype || '').toLowerCase()) {
    case 'cash': return 'yellow';
    case 'gpay': return 'purple';
    default: return 'gray';
  }
};

function exportToCSV(rows, cashBox, dateSuffix = null) {
  const header = ['Type', 'Name', 'Payment Type', 'Amount', 'Date', 'Time', 'Details/Notes'];
  const csvRows = rows.map(r =>
    [r.type, r.name, r.paymentType, r.amount, r.date, r.time, r.notes].map(x => `"${x ?? ''}"`).join(',')
  );

  const typeTotals = {};
  rows.forEach(r => {
    if (!typeTotals[r.type]) typeTotals[r.type] = 0;
    typeTotals[r.type] += Number(r.amount) || 0;
  });

  const earningEntries = rows.filter(r => r.type !== 'Expense' && r.type !== 'Withdrawal');
  const totalEarningCount = earningEntries.length;

  const cashRowsTotal = earningEntries.filter(r => (r.paymentType || '').toLowerCase() === 'cash').reduce((sum, r) => sum + Number(r.amount), 0);
  const gpayRowsTotal = earningEntries.filter(r => (r.paymentType || '').toLowerCase() === 'gpay').reduce((sum, r) => sum + Number(r.amount), 0);

  const breakdownStatsStr = Object.entries(typeTotals).map(([t, v]) => `${t}: Rupees ${v}`).join(' | ');
  const combinedStatsStr = `${breakdownStatsStr}${breakdownStatsStr ? ' | ' : ''}Cash Earnings: Rupees ${cashRowsTotal} | GPay Earnings: Rupees ${gpayRowsTotal}`;

  // Add totals row (with 'Rupees' instead of symbol)
  const totalsRow = [
    `Totals (Earning Entries: ${totalEarningCount})`, '', '', '', '', '',
    `"${combinedStatsStr}"`
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
  const suffix = dateSuffix ? `-${dateSuffix}` : `-${getNow().date}`;
  a.download = `daily-tracker${suffix}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}




const DailyTracker = () => {
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [rows, setRows] = useState([]);
  const [printData, setPrintData] = useState(null);
  const [cashBox, setCashBox] = useState({ hardCash: 0, gpayCash: 0 });
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [formType, setFormType] = useState('');
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(() => getNow().date);

  // "All Entries" view mode
  const [viewMode, setViewMode] = useState('date'); // 'date' | 'all'
  const [allRows, setAllRows] = useState([]);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Inline editing
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await api.get('/membership/plans?isActive=true');
        if (data.success) {
           setMembershipPlans(data.data.map(p => p.planName));
        }
      } catch (err) {
        console.error("Failed to load membership plans", err);
      }
    };
    fetchPlans();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (viewMode === 'date') {
        const res = await fetchDailyTracker(date);
        setRows(res.data || []);
        if (res.cashBox) setCashBox(res.cashBox);
      } else {
        const res = await fetchAllTrackerEntries({ fromDate: dateRange.from, toDate: dateRange.to, limit: 10000 });
        setAllRows(res.data || []);
        if (res.cashBox) setCashBox(res.cashBox);
      }
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (row) => {
    setEditingId(row._id);
    setEditDraft({ name: row.name, paymentType: row.paymentType, amount: row.amount, notes: row.notes || '' });
  };
  const cancelEdit = () => { setEditingId(null); setEditDraft({}); };
  const saveEdit = async (id) => {
    try {
      setLoading(true);
      await updateDailyTrackerEntry(id, editDraft);
      setEditingId(null);
      setEditDraft({});
      await fetchData();
      Swal.fire({ title: 'Updated!', icon: 'success', timer: 1200, showConfirmButton: false });
    } catch (err) {
      setLoading(false);
      Swal.fire('Error', err?.response?.data?.message || 'Failed to update', 'error');
    }
  };
  const deleteRow = async (id) => {
    const result = await Swal.fire({
      title: 'Delete this entry?',
      text: 'This will also adjust the Grocer Box balance.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Yes, delete it'
    });
    if (!result.isConfirmed) return;
    try {
      setLoading(true);
      await deleteDailyTrackerById(id);
      await fetchData();
      Swal.fire({ title: 'Deleted!', icon: 'success', timer: 1000, showConfirmButton: false });
    } catch (e) {
      setLoading(false);
      Swal.fire('Error', 'Failed to delete entry.', 'error');
    }
  };

  // Fetch entries when date or viewMode changes
  useEffect(() => {
    fetchData();
  }, [date, viewMode]);

  // Add Entry
  const openModal = (row = null) => {
    setModalData(row);
    setFormType(row?.type || '');
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setModalData(null);
  };
  const saveModal = async (e) => {
    e.preventDefault();
    const action = e.nativeEvent?.submitter?.value || 'save';
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

        if ((payload.type !== 'Expense' && payload.type !== 'Withdrawal') && action === 'print') {
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


  // Download CSV then delete all entries (either for the selected day or fully)
  const downloadAndClear = async () => {
    const dataToExport = viewMode === 'all' ? allRows : rows;
    if (dataToExport.length === 0) {
      Swal.fire('Nothing to clear', 'There are no entries to process.', 'info');
      return;
    }
    let suffix;
    if (viewMode === 'all') {
      if (dateRange?.from || dateRange?.to) {
        suffix = `${dateRange.from || 'start'}_to_${dateRange.to || 'end'}_cleared-${getNow().date}`;
      } else {
        suffix = `FULL-HISTORY-${getNow().date}`;
      }
    } else {
      suffix = date;
    }
    
    // Step 1: Download CSV first
    exportToCSV(dataToExport, cashBox, suffix);
    // Step 2: Confirm deletion
    const isFullPurge = viewMode === 'all';
    const result = await Swal.fire({
      title: isFullPurge ? 'Clear ALL history?' : 'Clear all entries for today?',
      text: `CSV downloaded. ${isFullPurge ? 'THE ENTIRE HISTORY' : `All ${rows.length} entries for ${date}`} will be permanently deleted.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: isFullPurge ? 'Yes, PURGE ALL DATA' : 'Yes, delete all',
      cancelButtonText: 'Keep data'
    });
    if (result.isConfirmed) {
      setLoading(true);
      if (isFullPurge) {
        await deleteAllTrackerEntries();
        setAllRows([]);
      } else {
        await deleteDailyTrackerByDate(date);
        setRows([]);
      }
      setCashBox({ hardCash: 0, gpayCash: 0 });
      setLoading(false);
      Swal.fire({ title: 'Cleared!', text: 'Entries deleted successfully.', icon: 'success', timer: 1500, showConfirmButton: false });
    }
  };

  // Filtered rows (for both date and all modes)
  const baseRows = viewMode === 'all' ? allRows : rows;
  const filtered = baseRows.filter(r =>
    (!filter || Object.values(r).some(v => String(v).toLowerCase().includes(filter.toLowerCase()))) &&
    (!typeFilter || r.type === typeFilter)
  );

  // Running totals
  const allTypesInCurrentView = [...new Set(filtered.map(r => r.type))];
  const totals = allTypesInCurrentView.reduce((acc, type) => {
    acc[type] = filtered.filter(r => r.type === type).reduce((sum, r) => sum + Number(r.amount), 0);
    return acc;
  }, {});

  const earningEntriesUI = filtered.filter(r => r.type !== 'Expense' && r.type !== 'Withdrawal');
  const totalCount = earningEntriesUI.length;

  const totalCashCollected = earningEntriesUI
    .filter(r => (r.paymentType || '').toLowerCase() === 'cash')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const totalGpayCollected = earningEntriesUI
    .filter(r => (r.paymentType || '').toLowerCase() === 'gpay')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const totalExpensesUI = filtered
    .filter(r => r.type === 'Expense')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const netProfit = (totalCashCollected + totalGpayCollected) - totalExpensesUI;

  const typeOptions = ['Stock', '1 Hour Order', 'Pending Amount', 'Expense', 'Withdrawal'];
  const filterTypeOptions = ['Stock', '1 Hour Order', 'Pending Amount', 'Expense', 'Withdrawal', ...membershipPlans];

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
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ===== RESPONSIVE STYLES ===== */
        .dt-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .dt-title {
          font-weight: 900;
          font-size: 2.4rem;
          color: #0f172a;
          letter-spacing: -0.5px;
          margin: 0;
        }
        .dt-toggle-group {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
        .dt-filter-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          align-items: center;
        }
        .dt-filter-bar input,
        .dt-filter-bar select {
          flex: 1;
          min-width: 130px;
        }
        .dt-filter-bar button {
          white-space: nowrap;
        }
        .dt-main-layout {
          display: flex;
          gap: 20px;
          align-items: flex-start;
          margin-top: 10px;
        }
        .dt-sidebar {
          width: 280px;
          flex-shrink: 0;
          background: #fff;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .dt-table-wrap {
          flex: 1;
          min-width: 0;
          overflow-x: auto;
        }
        .dt-modal-form {
          background: #fff;
          padding: 36px;
          border-radius: 14px;
          min-width: 370px;
          max-width: 420px;
          box-shadow: 0 2px 24px rgba(0,0,0,0.20);
          max-height: 90vh;
          overflow-y: auto;
          width: 100%;
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .dt-title { font-size: 1.6rem; }
          .dt-toggle-group button { padding: 6px 12px !important; font-size: 12px !important; }
          .dt-main-layout { flex-direction: column; gap: 16px; }
          .dt-sidebar { width: 100% !important; }
          .dt-cashbox-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .dt-modal-form {
            min-width: unset;
            padding: 20px 16px;
            border-radius: 10px;
            margin: 8px;
          }
          .dt-modal-form h3 { font-size: 18px !important; }
          .dt-modal-row { flex-direction: column !important; }
          .dt-filter-bar button { flex: 1 1 140px; }
        }

        @media (max-width: 480px) {
          .dt-title { font-size: 1.3rem; }
          .no-print > div { padding: 12px !important; }
          .dt-filter-bar { gap: 8px; }
          .dt-filter-bar input,
          .dt-filter-bar select { min-width: 100%; }
        }
      `}</style>

      <div className="no-print" style={{ padding: 0, margin: 0, width: '100%', background: '#f8fafc', minHeight: '100vh' }}>
        <div style={{ background: '#ffffff', borderRadius: 0, boxShadow: 'none', padding: '20px', margin: 0, border: 'none' }}>
          <div className="dt-header">
            <h2 className="dt-title">Daily Tracker</h2>
            <div className="dt-toggle-group">
              <button
                onClick={() => setViewMode('date')}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', background: viewMode === 'date' ? '#2563eb' : '#f1f5f9', color: viewMode === 'date' ? '#fff' : '#475569' }}
              >📅 By Date</button>
              <button
                onClick={() => setViewMode('all')}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', background: viewMode === 'all' ? '#7c3aed' : '#f1f5f9', color: viewMode === 'all' ? '#fff' : '#475569' }}
              >📊 All</button>
            </div>
          </div>

          <div className="dt-filter-bar">
            {viewMode === 'date' ? (
              <>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }} title="Select date" />
                <input placeholder="Search..." value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }} title="Search entries" />
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: 10, borderRadius: 8, fontSize: 15, border: '1px solid #cbd5e1' }} title="Filter by type">
                  <option value="">All Types</option>
                  {filterTypeOptions.map(t => <option key={t}>{t}</option>)}
                </select>
                <button onClick={() => openModal()} style={{ padding: '10px 22px', borderRadius: 8, background: '#2563eb', color: '#fff', fontWeight: 700, border: 'none', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }} title="Add new entry">
                  <span style={{ fontSize: 18 }}>➕</span> Add Entry
                </button>
                <button onClick={downloadAndClear} style={{ padding: '10px 22px', borderRadius: 8, background: '#dc2626', color: '#fff', fontWeight: 700, border: 'none', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }} title="Download CSV then delete all entries">
                  <span style={{ fontSize: 18 }}>⬇️🗑️</span> Download &amp; Clear
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <span style={{ color: '#7c3aed', fontWeight: 700, fontSize: 16 }}>All history ({filtered.length} entries shown)</span>
                  
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => exportToCSV(filtered, cashBox, dateRange.from || dateRange.to ? `${dateRange.from || 'start'}_to_${dateRange.to || 'end'}_generated-${getNow().date}` : `ALL-HISTORY-${getNow().date}`)} style={{ padding: '10px 22px', borderRadius: 8, background: '#10b981', color: '#fff', fontWeight: 700, border: 'none', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>⬇️</span> Download CSV
                    </button>
                    <button onClick={downloadAndClear} style={{ padding: '10px 22px', borderRadius: 8, background: '#dc2626', color: '#fff', fontWeight: 700, border: 'none', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>⬇️🗑️</span> Download &amp; Clear All
                    </button>
                  </div>
                </div>
                
                {/* Secondary row of filters for All-History */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <input type="date" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
                  <span style={{ color: '#64748b', fontSize: 14 }}>to</span>
                  <input type="date" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
                  <button onClick={() => fetchData()} style={{ padding: '10px 16px', borderRadius: 8, background: '#7c3aed', color: '#fff', fontWeight: 700, border: 'none', fontSize: 14, cursor: 'pointer' }}>Apply Date Range</button>
                  
                  <input placeholder="Search..." value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, flex: 1, minWidth: 150 }} title="Search entries in current view" />
                  <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: 10, borderRadius: 8, fontSize: 13, border: '1px solid #cbd5e1' }} title="Filter by type">
                    <option value="">All Types</option>
                    {filterTypeOptions.map(t => <option key={t}>{t}</option>)}
                  </select>

                  <button onClick={() => { setDateRange({from: '', to: ''}); setFilter(''); setTypeFilter(''); setTimeout(() => setViewMode('date'), 0); setTimeout(() => setViewMode('all'), 100); }} style={{ padding: '10px 16px', borderRadius: 8, background: '#e2e8f0', color: '#475569', fontWeight: 700, border: 'none', fontSize: 14, cursor: 'pointer' }}>Clear Filters</button>
                </div>
              </div>
            )}
          </div>
          {loading ? (
            <div style={{ color: '#2563eb', margin: 24, textAlign: 'center', fontSize: 18, fontWeight: 600 }}>
              <span className="spinner" style={{ display: 'inline-block', width: 24, height: 24, border: '3px solid #cbd5e1', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', verticalAlign: 'middle', marginRight: 10 }} />
              Loading data...
            </div>
          ) : null}
          <div className="dt-main-layout">
            {/* ASIDE - CASH BOX SIDEBAR */}
            <div className="dt-sidebar">
              <div style={{ background: '#1e293b', color: '#fff', padding: '16px', fontWeight: 900, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>💰</span> Central Cash Box
              </div>
              <div className="dt-cashbox-grid" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: 8, borderLeft: '4px solid #10b981' }}>
                   <div style={{ fontSize: 12, color: '#475569', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Cash Balance</div>
                   <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>₹ {cashBox.hardCash?.toLocaleString('en-IN') || 0}</div>
                </div>
                <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: 8, borderLeft: '4px solid #3b82f6' }}>
                   <div style={{ fontSize: 12, color: '#475569', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>GPay Balance</div>
                   <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>₹ {cashBox.gpayCash?.toLocaleString('en-IN') || 0}</div>
                </div>
                <div style={{ background: '#fef2f2', padding: '12px', borderRadius: 8, borderLeft: '4px solid #ef4444' }}>
                   <div style={{ fontSize: 12, color: '#991b1b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Lifetime Expense</div>
                   <div style={{ fontSize: 18, fontWeight: 800, color: '#7f1d1d' }}>₹ {(cashBox.lifetimeExpense || 0).toLocaleString('en-IN')}</div>
                </div>
                <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: 8, borderLeft: '4px solid #10b981' }}>
                   <div style={{ fontSize: 12, color: '#065f46', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Lifetime Withdrawal</div>
                   <div style={{ fontSize: 18, fontWeight: 800, color: '#064e3b' }}>₹ {(cashBox.lifetimeWithdrawal || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>
              
              <div style={{ background: '#1e293b', color: '#fff', padding: '16px', fontWeight: 900, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid #334155' }}>
                <span>📋</span> All-Time Totals
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(() => {
                   const orderStats = cashBox.orderStats || { count: 0, amount: 0 };
                   const oneHourOrderStats = cashBox.oneHourOrderStats || { count: 0, amount: 0 };
                   const memStats = cashBox.membershipStats || [];
                   
                   const items = [
                     { name: 'Stock', stats: orderStats },
                     { name: '1 Hour Order', stats: oneHourOrderStats },
                     ...memStats.map(m => ({ name: m.planName, stats: m }))
                   ];

                   return items.map(item => {
                     return (
                       <div key={item.name} style={{ background: '#f8fafc', padding: '12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                         <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
                           {item.name}
                         </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                           <div style={{ color: '#475569', fontSize: 13, fontWeight: 600 }}>Count: {item.stats.count}</div>
                           <div style={{ color: '#10b981', fontSize: 14, fontWeight: 800 }}>₹{(item.stats.amount || 0).toLocaleString('en-IN')}</div>
                         </div>
                       </div>
                     );
                   });
                })()}
              </div>
            </div>

            {/* MAIN TABLE */}
            <div className="dt-table-wrap">
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#fff', borderRadius: 14, overflow: 'hidden', minWidth: 900, border: '1px solid #e2e8f0' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr style={{ background: '#f1f5f9', fontWeight: 900, fontSize: 15, color: '#1e293b' }}>
                  <th colSpan={3} style={{ padding: '14px 14px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Totals <span style={{ color: '#2563eb', fontSize: 13, marginLeft: 8 }}>(Earning Entries: {totalCount})</span></th>
                  <th colSpan={4} style={{ padding: '14px 14px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    {allTypesInCurrentView.map(t => `${t}: Rupees ${totals[t] || 0}`).join(' | ')} {allTypesInCurrentView.length > 0 ? ' | ' : ''}Cash Earnings: Rupees {totalCashCollected} | GPay Earnings: Rupees {totalGpayCollected}
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
                  <th style={{ padding: '16px 14px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: '#888', padding: 24, fontSize: 16 }}>No entries found.</td>
                  </tr>
                ) : filtered.map((row, idx) => {
                  const isEditing = editingId === row._id;
                  return (
                    <tr key={row._id || idx} style={{
                      background: isEditing ? '#eff6ff' : (idx % 2 === 0 ? '#f8fafc' : '#ffffff'),
                      transition: 'background 0.2s',
                    }}
                      onMouseEnter={(e) => !isEditing && (e.currentTarget.style.background = '#f1f5f9')}
                      onMouseLeave={(e) => !isEditing && (e.currentTarget.style.background = idx % 2 === 0 ? '#f8fafc' : '#ffffff')}
                    >
                      <td style={{ padding: '14px 14px', verticalAlign: 'middle', borderBottom: '1px solid #e2e8f0' }}>
                        <Badge color={getTypeColor(row.type)}>{row.type}</Badge>
                      </td>
                      <td style={{ padding: '14px 14px', verticalAlign: 'middle', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #e2e8f0' }}>
                        {isEditing
                          ? <input value={editDraft.name} onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))} style={{ padding: '5px 8px', borderRadius: 6, border: '1.5px solid #2563eb', width: '100%', fontSize: 14 }} />
                          : row.name}
                      </td>
                      <td style={{ padding: '14px 14px', verticalAlign: 'middle', borderBottom: '1px solid #e2e8f0' }}>
                        {isEditing
                          ? <select value={editDraft.paymentType} onChange={e => setEditDraft(d => ({ ...d, paymentType: e.target.value }))} style={{ padding: '5px 8px', borderRadius: 6, border: '1.5px solid #2563eb', fontSize: 14 }}>
                            <option value="cash">Cash</option>
                            <option value="gpay">GPay</option>
                          </select>
                          : <Badge color={getPaymentColor(row.paymentType)}>{row.paymentType}</Badge>}
                      </td>
                      <td style={{ padding: '14px 14px', verticalAlign: 'middle', fontWeight: 800, color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>
                        {isEditing
                          ? <input type="number" value={editDraft.amount} onChange={e => setEditDraft(d => ({ ...d, amount: Number(e.target.value) }))} style={{ padding: '5px 8px', borderRadius: 6, border: '1.5px solid #2563eb', width: 90, fontSize: 14 }} />
                          : <>₹ {Number(row.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>}
                      </td>
                      <td style={{ padding: '14px 14px', verticalAlign: 'middle', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{row.date}</td>
                      <td style={{ padding: '14px 14px', verticalAlign: 'middle', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{formatHHmmTo12Hour(row.time)}</td>
                      <td style={{ padding: '14px 14px', verticalAlign: 'middle', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                        {isEditing
                          ? <input value={editDraft.notes} onChange={e => setEditDraft(d => ({ ...d, notes: e.target.value }))} style={{ padding: '5px 8px', borderRadius: 6, border: '1.5px solid #2563eb', width: '100%', fontSize: 14 }} />
                          : row.notes}
                      </td>
                      <td style={{ padding: '14px 14px', verticalAlign: 'middle', borderBottom: '1px solid #e2e8f0', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button onClick={() => saveEdit(row._id)} title="Save" style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>✅ Save</button>
                            <button onClick={cancelEdit} title="Cancel" style={{ background: '#64748b', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>✕</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button onClick={() => startEdit(row)} title="Edit" style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 16 }}>✏️</button>
                            <button onClick={() => deleteRow(row._id)} title="Delete" style={{ background: 'none', border: '1px solid #fecaca', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 16 }}>🗑️</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        {/* Modal for Add Entry */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '10px', boxSizing: 'border-box' }}>
            <form onSubmit={saveModal} className="dt-modal-form">
              <h3 style={{ fontWeight: 900, fontSize: 24, marginBottom: 8, color: '#2563eb', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>📝</span> Add Daily Entry
              </h3>
              <div style={{ color: '#64748b', fontSize: 14, marginBottom: 18, background: '#f1f5f9', padding: 10, borderRadius: 6 }}>
                <span style={{ color: '#ef4444' }}>Admins: Double-check amount and type before saving.</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 10 }}>
                <div className="dt-modal-row" style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Type <span style={{ color: '#ef4444' }}>*</span></label>
                    <select name="type" value={formType} onChange={e => setFormType(e.target.value)} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 15 }}>
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
                <div className="dt-modal-row" style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input name="name" placeholder="Full name or description" defaultValue={modalData?.name || ''} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 15 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Amount (₹) <span style={{ color: '#ef4444' }}>*</span></label>
                    <input name="amount" type="number" min="0" step="0.01" placeholder="0.00" defaultValue={modalData?.amount || ''} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 15 }} />
                  </div>
                </div>
                <div className="dt-modal-row" style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Date <span style={{ color: '#ef4444' }}>*</span></label>
                    <input name="date" type="date" defaultValue={modalData?.date || date} readOnly required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 15, opacity: 0.7, cursor: 'not-allowed', backgroundColor: '#f9fafb' }} />
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
                <button type="button" onClick={closeModal} disabled={loading} style={{ background: '#f1f5f9', color: '#333', padding: '10px 28px', borderRadius: 7, border: 'none', fontWeight: 700, fontSize: 16, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>Cancel</button>
                <button type="submit" name="action" value="save" disabled={loading} style={{ background: '#2563eb', color: '#fff', padding: '10px 20px', borderRadius: 7, border: 'none', fontWeight: 800, fontSize: 16, letterSpacing: 1, boxShadow: '0 4px 6px -1px #2563eb44', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? 'Saving...' : 'Save'}</button>
                {formType === 'Public Order' || formType === 'Order' || formType === '1 Hour Order' ? (
                  <button type="submit" name="action" value="print" disabled={loading} style={{ background: '#059669', color: '#fff', padding: '10px 20px', borderRadius: 7, border: 'none', fontWeight: 800, fontSize: 16, letterSpacing: 1, boxShadow: '0 4px 6px -1px #05966944', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? 'Saving...' : 'Save & Print'}</button>
                ) : ''}
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
              <span>{formatHHmmTo12Hour(printData.time)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>
                <b>{printData.name}</b>
              </span>
              <span><b>{printData.paymentType.toUpperCase()}</b></span>
            </div>

            <p style={{ margin: '2px 0', textAlign: 'center', fontSize: '12px' }}>----------------------------</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', margin: '4px 0' }}>
              <span>{printData.type === 'Public Order' || printData.type === 'Order' || printData.type === '1 Hour Order' ? 'Pool(1Hr)' : printData.type}</span>
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
