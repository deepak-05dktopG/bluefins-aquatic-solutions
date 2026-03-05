/**
 * What it is: Admin panel page (Attendance records screen).
 * Non-tech note: Admins use this to view past attendance entries.
 */

import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { adminFetch, isAdminAuthenticated } from '../../utils/adminAuth'
import { formatDateTime } from '../../utils/dateTime'
import { FaCamera, FaSyncAlt, FaDownload, FaTrash } from 'react-icons/fa'
import AdminNavbar from '../../components/adminPanel/AdminNavbar'

/**
 * Purpose: Do Safe Read Json
 * Plain English: What this function is used for.
 */
const safeReadJson = async res => {
    const text = await res.text()
    if (!text) return { ok: false, message: 'Empty response from server' }
    try {
		return JSON.parse(text)
	} catch {
		return { ok: false, message: text }
	}
};

/**
 * Purpose: Do Today ISO
 * Plain English: What this function is used for.
 */
const todayISO = () => {
    return new Date().toISOString().slice(0, 10);
};

/**
 * Purpose: Format Time
 * Plain English: What this function is used for.
 */
const formatTime = value => {
    return formatDateTime(value);
};

/**
 * Purpose: Do To Query String
 * Plain English: What this function is used for.
 */
const toQueryString = params => {
    const sp = new URLSearchParams()
    Object.entries(params || {}).forEach(/**
     * Purpose: Array loop callback (runs once for each item)
     * Plain English: What this function is used for.
     */
    ([k, v]) => {
        if (v == null) return
        const s = String(v)
        if (!s.trim()) return
        sp.set(k, s)
    })
    return sp.toString()
};

export default /**
 * Purpose: Do Attendance Records
 * Plain English: What this function is used for.
 */
function AttendanceRecords() {
    const navigate = useNavigate()
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

    const [q, setQ] = React.useState('')
    const [result, setResult] = React.useState('')
    const [method, setMethod] = React.useState('')
    const [planId, setPlanId] = React.useState('')
    const [dateFrom, setDateFrom] = React.useState(todayISO())
    const [dateTo, setDateTo] = React.useState(todayISO())
    const [page, setPage] = React.useState(1)
    const [limit, setLimit] = React.useState(25)
    const [plans, setPlans] = React.useState([])

    const [items, setItems] = React.useState([])
    const [total, setTotal] = React.useState(0)
    const [loading, setLoading] = React.useState(false)
    const [selected, setSelected] = React.useState(/**
     * Purpose: Helper callback used inside a larger operation
     * Plain English: What this function is used for.
     */
    () => {
        return new Set();
    })
    const [purgeBefore, setPurgeBefore] = React.useState('')

    React.useEffect(/**
     * Purpose: React effect callback (runs after render based on dependencies)
     * Plain English: What this function is used for.
     */
    () => {
        if (!isAdminAuthenticated()) navigate('/admin')
    }, [navigate])

    React.useEffect(/**
     * Purpose: React effect callback (runs after render based on dependencies)
     * Plain English: What this function is used for.
     */
    () => {
        let active = true
        /**
         * Purpose: Fetch Plans from server
         * Plain English: What this function is used for.
         */
        const fetchPlans = async () => {
            try {
				const res = await fetch(`${apiBase}/membership/plans?isActive=true`)
				const parsed = await safeReadJson(res)
				if (!res.ok || parsed?.success === false) return
				const list = Array.isArray(parsed?.data) ? parsed.data : []
				if (active) setPlans(list)
			} catch {
				// ignore
			}
        };
        fetchPlans()
        return (
            /**
             * Purpose: Helper callback used inside a larger operation
             * Plain English: What this function is used for.
             */
            () => {
                active = false
            }
        );
    }, [apiBase])

    const load = React.useCallback(/**
     * Purpose: React callback memoizer (keeps function stable between renders)
     * Plain English: What this function is used for.
     */
    async () => {
        setLoading(true)
        try {
			const qs = toQueryString({ q, result, method, planId, dateFrom, dateTo, page, limit })
			const res = await adminFetch(`${apiBase}/attendance?${qs}`)
			const parsed = await safeReadJson(res)
			if (!res.ok || parsed?.success === false) throw new Error(parsed?.message || `Failed (${res.status})`)
			setItems(Array.isArray(parsed?.data?.items) ? parsed.data.items : [])
			setTotal(typeof parsed?.data?.total === 'number' ? parsed.data.total : 0)
			setSelected(new Set())
		} catch {
			setItems([])
			setTotal(0)
			setSelected(new Set())
		} finally {
			setLoading(false)
		}
    }, [apiBase, dateFrom, dateTo, limit, method, page, planId, q, result])

    React.useEffect(/**
     * Purpose: React effect callback (runs after render based on dependencies)
     * Plain English: What this function is used for.
     */
    () => {
        load()
    }, [load])

    const pageCount = Math.max(1, Math.ceil(total / limit))

    React.useEffect(/**
     * Purpose: React effect callback (runs after render based on dependencies)
     * Plain English: What this function is used for.
     */
    () => {
        if (page > pageCount) setPage(pageCount)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageCount])

    /**
     * Purpose: Do Toggle Selected
     * Plain English: What this function is used for.
     */
    const toggleSelected = id => {
        setSelected(/**
         * Purpose: Helper callback used inside a larger operation
         * Plain English: What this function is used for.
         */
        prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
			else next.add(id)
            return next
        })
    };

    /**
     * Purpose: Do Select All On Page
     * Plain English: What this function is used for.
     */
    const selectAllOnPage = () => {
        setSelected(/**
         * Purpose: Helper callback used inside a larger operation
         * Plain English: What this function is used for.
         */
        prev => {
            const next = new Set(prev)
            for (const row of items) next.add(row._id)
            return next
        })
    };

    /**
     * Purpose: Do Clear Selection
     * Plain English: What this function is used for.
     */
    const clearSelection = () => {
        return setSelected(new Set());
    };

    const isAllOnPageSelected = items.length > 0 && items.every(/**
     * Purpose: Array check callback (true if all items match)
     * Plain English: What this function is used for.
     */
    r => {
        return selected.has(r._id);
    })

    /**
     * Purpose: Do Download Csv
     * Plain English: What this function is used for.
     */
    const downloadCsv = async () => {
        try {
			const qs = toQueryString({ q, result, method, planId, dateFrom, dateTo, max: 50000 })
			const res = await adminFetch(`${apiBase}/attendance/export?${qs}`)
			if (!res.ok) {
				const parsed = await safeReadJson(res)
				throw new Error(parsed?.message || `Export failed (${res.status})`)
			}
			const blob = await res.blob()
			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = `bluefins-attendance-${dateFrom || 'all'}-to-${dateTo || 'all'}.csv`
			document.body.appendChild(a)
			a.click()
			a.remove()
			window.URL.revokeObjectURL(url)
		} catch (e) {
			await Swal.fire({ title: 'Download Failed', text: e?.message || 'Unable to export', icon: 'error', confirmButtonColor: '#FF6B9D' })
		}
    };

    /**
     * Purpose: Do Delete One
     * Plain English: What this function is used for.
     */
    const deleteOne = async id => {
        const confirm = await Swal.fire({
			title: 'Delete record?',
			text: 'This attendance record will be permanently removed.',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Delete',
			cancelButtonText: 'Cancel',
			confirmButtonColor: '#FF6B9D',
		})
        if (!confirm.isConfirmed) return
        try {
			const res = await adminFetch(`${apiBase}/attendance/${id}`, { method: 'DELETE' })
			const parsed = await safeReadJson(res)
			if (!res.ok || parsed?.success === false) throw new Error(parsed?.message || `Delete failed (${res.status})`)
			await load()
		} catch (e) {
			await Swal.fire({ title: 'Delete Failed', text: e?.message || 'Unable to delete', icon: 'error', confirmButtonColor: '#FF6B9D' })
		}
    };

    /**
     * Purpose: Do Delete Selected
     * Plain English: What this function is used for.
     */
    const deleteSelected = async () => {
        const ids = Array.from(selected)
        if (ids.length === 0) return
        const confirm = await Swal.fire({
			title: `Delete ${ids.length} selected?`,
			text: 'Selected attendance records will be permanently removed.',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Delete Selected',
			cancelButtonText: 'Cancel',
			confirmButtonColor: '#FF6B9D',
		})
        if (!confirm.isConfirmed) return
        try {
			const res = await adminFetch(`${apiBase}/attendance/bulk-delete`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids }),
			})
			const parsed = await safeReadJson(res)
			if (!res.ok || parsed?.success === false) throw new Error(parsed?.message || `Bulk delete failed (${res.status})`)
			clearSelection()
			await load()
		} catch (e) {
			await Swal.fire({ title: 'Delete Failed', text: e?.message || 'Unable to delete', icon: 'error', confirmButtonColor: '#FF6B9D' })
		}
    };

    /**
     * Purpose: Do Purge Old
     * Plain English: What this function is used for.
     */
    const purgeOld = async () => {
        if (!purgeBefore) {
			await Swal.fire({ title: 'Select a date', text: 'Choose a date to purge records before it.', icon: 'info', confirmButtonColor: '#0099FF' })
			return
		}
        const confirm = await Swal.fire({
			title: 'Purge old attendance?',
			text: `This will permanently delete all attendance records before ${purgeBefore}.`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Purge',
			cancelButtonText: 'Cancel',
			confirmButtonColor: '#FF6B9D',
		})
        if (!confirm.isConfirmed) return
        try {
			const res = await adminFetch(`${apiBase}/attendance/purge?before=${encodeURIComponent(purgeBefore)}`, { method: 'DELETE' })
			const parsed = await safeReadJson(res)
			if (!res.ok || parsed?.success === false) throw new Error(parsed?.message || `Purge failed (${res.status})`)
			await Swal.fire({ title: 'Purged', text: `${parsed?.data?.deletedCount || 0} records deleted.`, icon: 'success', confirmButtonColor: '#00FFD4' })
			setPurgeBefore('')
			await load()
		} catch (e) {
			await Swal.fire({ title: 'Purge Failed', text: e?.message || 'Unable to purge', icon: 'error', confirmButtonColor: '#FF6B9D' })
		}
    };

    const cardStyle = {
		background: 'rgba(15, 25, 50, 0.75)',
		border: '1px solid rgba(0, 255, 212, 0.25)',
		borderRadius: '16px',
		padding: '22px',
	}

    const labelStyle = { color: 'rgba(255,255,255,0.65)', fontWeight: 600, fontSize: '0.8rem', marginBottom: '6px' }
    const buttonBase = {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '6px',
		padding: '8px 11px',
		borderRadius: '10px',
		fontWeight: 600,
		fontSize: '0.85rem',
	}

    return (
        <div
			style={{
				minHeight: '100vh',
				background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1629 100%)',
				fontFamily: 'Poppins, system-ui',
			}}
		>
            <AdminNavbar />
            <div className="admin-page-container" style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: '20px' }}>
					<div>
						<h1 style={{ color: '#00FFD4', fontSize: '2.0rem', fontWeight: 700, margin: 0 }}>Attendance Records</h1>
						<p style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: '8px' }}>Filter, download, and clean up attendance history.</p>
					</div>
					<Link
						to="/admin/attendance/scan"
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: '8px',
							padding: '10px 16px',
							borderRadius: '10px',
							background: 'rgba(0, 255, 212, 0.15)',
							color: '#00FFD4',
							border: '1px solid rgba(0, 255, 212, 0.35)',
							textDecoration: 'none',
							fontWeight: 600,
						}}
					>
						<FaCamera /> Open Scanner
					</Link>
				</div>

				<div style={cardStyle}>
					<div className="admin-filter-grid" style={{ gap: '10px' }}>
						<div className="admin-filter-span-2">
							<div style={labelStyle}>Search</div>
							<input
								value={q}
								onChange={/**
                                 * Purpose: Helper callback used inside a larger operation
                                 * Plain English: What this function is used for.
                                 */
                                e => {
                                    setQ(e.target.value)
                                    setPage(1)
                                }}
								placeholder="Name / Phone / Member ID / Payload"
								style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(10, 14, 39, 0.65)', color: 'rgba(255,255,255,0.92)', outline: 'none' }}
							/>
						</div>

						<div>
							<div style={labelStyle}>Membership Plan</div>
							<select
								value={planId}
								onChange={/**
                                 * Purpose: Helper callback used inside a larger operation
                                 * Plain English: What this function is used for.
                                 */
                                e => {
                                    setPlanId(e.target.value)
                                    setPage(1)
                                }}
								style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(10, 14, 39, 0.65)', color: 'rgba(255,255,255,0.92)' }}
							>
								<option value="">All Plans</option>
								{plans.map(/**
                                 * Purpose: Array mapping callback (converts each item to a new value)
                                 * Plain English: What this function is used for.
                                 */
                                p => {
                                    return (
                                        <option key={p._id} value={p._id}>
                                            {p.planName}
                                        </option>
                                    );
                                })}
							</select>
						</div>

						<div>
							<div style={labelStyle}>From</div>
							<input
								type="date"
								value={dateFrom}
								onChange={/**
                                 * Purpose: Helper callback used inside a larger operation
                                 * Plain English: What this function is used for.
                                 */
                                e => {
                                    setDateFrom(e.target.value)
                                    setPage(1)
                                }}
								style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(10, 14, 39, 0.65)', color: 'rgba(255,255,255,0.92)' }}
							/>
						</div>

						<div>
							<div style={labelStyle}>To</div>
							<input
								type="date"
								value={dateTo}
								onChange={/**
                                 * Purpose: Helper callback used inside a larger operation
                                 * Plain English: What this function is used for.
                                 */
                                e => {
                                    setDateTo(e.target.value)
                                    setPage(1)
                                }}
								style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(10, 14, 39, 0.65)', color: 'rgba(255,255,255,0.92)' }}
							/>
						</div>

						<div>
							<div style={labelStyle}>Result</div>
							<select
								value={result}
								onChange={/**
                                 * Purpose: Helper callback used inside a larger operation
                                 * Plain English: What this function is used for.
                                 */
                                e => {
                                    setResult(e.target.value)
                                    setPage(1)
                                }}
								style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(10, 14, 39, 0.65)', color: 'rgba(255,255,255,0.92)' }}
							>
								<option value="">All</option>
								<option value="accepted">Accepted</option>
								<option value="rejected">Rejected</option>
							</select>
						</div>

						<div>
							<div style={labelStyle}>Method</div>
							<select
								value={method}
								onChange={/**
                                 * Purpose: Helper callback used inside a larger operation
                                 * Plain English: What this function is used for.
                                 */
                                e => {
                                    setMethod(e.target.value)
                                    setPage(1)
                                }}
								style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(10, 14, 39, 0.65)', color: 'rgba(255,255,255,0.92)' }}
							>
								<option value="">All</option>
								<option value="qr">QR</option>
								<option value="manual">Manual</option>
							</select>
						</div>
					</div>

					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
						<div style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
							Total: <span style={{ color: 'rgba(255,255,255,0.92)' }}>{total}</span>
							{selected.size ? <span style={{ marginLeft: '10px', color: '#00FFD4' }}>Selected: {selected.size}</span> : null}
						</div>
						<div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
							<button
								onClick={load}
								disabled={loading}
								style={{ ...buttonBase, background: 'rgba(0, 153, 255, 0.15)', color: '#0099FF', border: '1px solid rgba(0, 153, 255, 0.35)', cursor: loading ? 'not-allowed' : 'pointer' }}
							>
								<FaSyncAlt /> {loading ? 'Loading…' : 'Refresh'}
							</button>
							<button
								onClick={downloadCsv}
								style={{ ...buttonBase, background: 'rgba(0, 255, 212, 0.15)', color: '#00FFD4', border: '1px solid rgba(0, 255, 212, 0.35)', cursor: 'pointer' }}
							>
								<FaDownload /> Download CSV
							</button>
							<button
								onClick={deleteSelected}
								disabled={selected.size === 0}
								style={{
									...buttonBase,
									background: selected.size === 0 ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 50, 100, 0.2)',
									color: selected.size === 0 ? 'rgba(255,255,255,0.4)' : '#FF6B9D',
									border: '1px solid rgba(255, 50, 100, 0.35)',
									cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
								}}
							>
								<FaTrash /> Delete Selected
							</button>
						</div>
					</div>

					<div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
						<div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
							<button
								onClick={/**
                                 * Purpose: Helper callback used inside a larger operation
                                 * Plain English: What this function is used for.
                                 */
                                () => {
                                    if (isAllOnPageSelected) clearSelection()
									else selectAllOnPage()
                                }}
								disabled={items.length === 0}
								style={{ ...buttonBase, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.14)', cursor: items.length === 0 ? 'not-allowed' : 'pointer' }}
							>
								{isAllOnPageSelected ? 'Unselect Page' : 'Select Page'}
							</button>
							<select
								value={limit}
								onChange={/**
                                 * Purpose: Helper callback used inside a larger operation
                                 * Plain English: What this function is used for.
                                 */
                                e => {
                                    setLimit(Number(e.target.value))
                                    setPage(1)
                                }}
								style={{ padding: '8px 11px', borderRadius: '10px', background: 'rgba(10, 14, 39, 0.65)', color: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.14)', fontWeight: 600, fontSize: '0.85rem' }}
							>
								<option value={10}>10 / page</option>
								<option value={25}>25 / page</option>
								<option value={50}>50 / page</option>
								<option value={100}>100 / page</option>
							</select>
						</div>
						<div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
							<div style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>Page {page} / {pageCount}</div>
							<button
								onClick={/**
                                 * Purpose: Helper callback used inside a larger operation
                                 * Plain English: What this function is used for.
                                 */
                                () => {
                                    return setPage(/**
                                     * Purpose: Helper callback used inside a larger operation
                                     * Plain English: What this function is used for.
                                     */
                                    p => {
                                        return Math.max(1, p - 1);
                                    });
                                }}
								disabled={page <= 1}
								style={{ ...buttonBase, padding: '8px 10px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.14)', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
							>
								Prev
							</button>
							<button
								onClick={/**
                                 * Purpose: Helper callback used inside a larger operation
                                 * Plain English: What this function is used for.
                                 */
                                () => {
                                    return setPage(/**
                                     * Purpose: Helper callback used inside a larger operation
                                     * Plain English: What this function is used for.
                                     */
                                    p => {
                                        return Math.min(pageCount, p + 1);
                                    });
                                }}
								disabled={page >= pageCount}
								style={{ ...buttonBase, padding: '8px 10px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.14)', cursor: page >= pageCount ? 'not-allowed' : 'pointer' }}
							>
								Next
							</button>
						</div>
					</div>

					<div style={{ marginTop: '18px', padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
							<div>
								<div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>Data Retention</div>
								<div style={{ color: 'rgba(255,255,255,0.6)', marginTop: '6px' }}>Purge old attendance to prevent database overload.</div>
							</div>
							<div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
								<input
									type="date"
									value={purgeBefore}
									onChange={/**
                                     * Purpose: Helper callback used inside a larger operation
                                     * Plain English: What this function is used for.
                                     */
                                    e => {
                                        return setPurgeBefore(e.target.value);
                                    }}
									style={{ padding: '8px 11px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(10, 14, 39, 0.65)', color: 'rgba(255,255,255,0.92)', fontWeight: 600, fontSize: '0.85rem' }}
								/>
								<button
									onClick={purgeOld}
									style={{ ...buttonBase, background: 'rgba(255, 50, 100, 0.2)', color: '#FF6B9D', border: '1px solid rgba(255, 50, 100, 0.35)', cursor: 'pointer' }}
								>
									<FaTrash /> Purge Before
								</button>
							</div>
						</div>
					</div>
				</div>

				<div style={{ marginTop: '20px', ...cardStyle }}>
					<div style={{ overflowX: 'auto' }}>
						<table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
							<thead>
								<tr>
										<th style={{ textAlign: 'left', color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', padding: '0 8px' }}>
										<input
											type="checkbox"
											checked={isAllOnPageSelected}
											onChange={/**
                                             * Purpose: Helper callback used inside a larger operation
                                             * Plain English: What this function is used for.
                                             */
                                            () => {
                                                if (isAllOnPageSelected) clearSelection()
												else selectAllOnPage()
                                            }}
											disabled={items.length === 0}
											style={{ transform: 'scale(1.1)' }}
										/>
									</th>
										<th style={{ textAlign: 'left', color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', padding: '0 8px' }}>Time</th>
										<th style={{ textAlign: 'left', color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', padding: '0 8px' }}>Member</th>
										<th style={{ textAlign: 'left', color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', padding: '0 8px' }}>Phone</th>
										<th style={{ textAlign: 'left', color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', padding: '0 8px' }}>Plan</th>
										<th style={{ textAlign: 'left', color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', padding: '0 8px' }}>Result</th>
										<th style={{ textAlign: 'left', color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', padding: '0 8px' }}>Method</th>
										<th style={{ textAlign: 'right', color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', padding: '0 8px' }}>Actions</th>
								</tr>
							</thead>
							<tbody>
								{items.length === 0 ? (
									<tr>
										<td colSpan={8} style={{ padding: '12px 8px', color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem' }}>{loading ? 'Loading…' : 'No records found.'}</td>
									</tr>
								) : (
									items.map(/**
                                     * Purpose: Array mapping callback (converts each item to a new value)
                                     * Plain English: What this function is used for.
                                     */
                                    row => {
                                        const member = row?.memberId
                                        const plan = member?.planId
                                        const rejected = row?.result === 'rejected'
                                        return (
                                            <tr key={row._id}>
                                                <td style={{ padding: '10px 8px', background: 'rgba(10, 14, 39, 0.65)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '12px 0 0 12px' }}>
													<input type="checkbox" checked={selected.has(row._id)} onChange={/**
                                                     * Purpose: Helper callback used inside a larger operation
                                                     * Plain English: What this function is used for.
                                                     */
                                                    () => {
                                                        return toggleSelected(row._id);
                                                    }} style={{ transform: 'scale(1.1)' }} />
												</td>
                                                <td style={{ padding: '10px 8px', background: 'rgba(10, 14, 39, 0.65)', borderTop: '1px solid rgba(255,255,255,0.10)', borderBottom: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.85)', fontWeight: 500, fontSize: '0.88rem' }}>{formatTime(row?.scannedAt)}</td>
                                                <td style={{ padding: '10px 8px', background: 'rgba(10, 14, 39, 0.65)', borderTop: '1px solid rgba(255,255,255,0.10)', borderBottom: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.92)', fontWeight: 600, fontSize: '0.9rem' }}>{member?.name || '—'}</td>
                                                <td style={{ padding: '10px 8px', background: 'rgba(10, 14, 39, 0.65)', borderTop: '1px solid rgba(255,255,255,0.10)', borderBottom: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.75)', fontWeight: 500, fontSize: '0.88rem' }}>{member?.phone || '—'}</td>
                                                <td style={{ padding: '10px 8px', background: 'rgba(10, 14, 39, 0.65)', borderTop: '1px solid rgba(255,255,255,0.10)', borderBottom: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.75)', fontWeight: 500, fontSize: '0.88rem' }}>{plan?.planName || '—'}</td>
                                                <td style={{ padding: '10px 8px', background: 'rgba(10, 14, 39, 0.65)', borderTop: '1px solid rgba(255,255,255,0.10)', borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
																<span style={{ display: 'inline-flex', padding: '6px 10px', borderRadius: '999px', border: rejected ? '1px solid rgba(255, 50, 100, 0.55)' : '1px solid rgba(0, 255, 212, 0.55)', background: rejected ? 'rgba(255, 50, 100, 0.14)' : 'rgba(0, 255, 212, 0.14)', color: rejected ? '#FF6B9D' : '#00FFD4', fontWeight: 600, fontSize: '0.8rem' }}>
														{rejected ? 'REJECTED' : 'ACCEPTED'}
													</span>
												</td>
                                                <td style={{ padding: '10px 8px', background: 'rgba(10, 14, 39, 0.65)', borderTop: '1px solid rgba(255,255,255,0.10)', borderBottom: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: '0.85rem' }}>{(row?.method || '—').toUpperCase()}</td>
                                                <td style={{ padding: '10px 8px', background: 'rgba(10, 14, 39, 0.65)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '0 12px 12px 0', textAlign: 'right' }}>
													<button
														onClick={/**
                                                         * Purpose: Helper callback used inside a larger operation
                                                         * Plain English: What this function is used for.
                                                         */
                                                        () => {
                                                            return deleteOne(row._id);
                                                        }}
														style={{ padding: '7px 10px', borderRadius: '10px', background: 'rgba(255, 50, 100, 0.18)', color: '#FF6B9D', border: '1px solid rgba(255, 50, 100, 0.35)', cursor: 'pointer', fontWeight: 600 }}
													>
														<FaTrash />
													</button>
												</td>
                                            </tr>
                                        );
                                    })
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
        </div>
    );
}
