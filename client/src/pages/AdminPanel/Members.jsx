/**
 * What it is: Admin panel page (Members list/manage screen).
 * Non-tech note: Admins use this to view members and manage member actions.
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { downloadMemberIdCard } from '../../utils/idCard'
import { adminFetch, isAdminAuthenticated } from '../../utils/adminAuth'
import { FaSyncAlt, FaDownload, FaTrash, FaChevronLeft, FaChevronRight, FaWhatsapp } from 'react-icons/fa'
import AdminNavbar from '../../components/adminPanel/AdminNavbar'

/**
 * Utility: Parse API responses that might be JSON or plain text.
 * Bluefins admin endpoints typically return JSON, but this keeps the UI resilient
 * when the server returns an empty body or a plain-text error.
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
 * Format a date value for display in the admin table.
 */
const formatDate = value => {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString()
};

/**
 * Normalize a date to the end of the local day.
 * Used so expiry-date logic matches “valid through end of that day”.
 */
const endOfLocalDay = value => {
    if (!value) return null
    const d = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(d.getTime())) return null
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
};

/**
 * Calculate remaining days until a member’s plan expires.
 * Some plan types store timestamps; others are treated as valid until end-of-day.
 */
const daysUntil = (expiryDate, planType) => {
    if (!expiryDate) return null
    const isPublic = String(planType || '').toLowerCase() === 'public'
    const d = isPublic ? new Date(expiryDate) : endOfLocalDay(expiryDate)
    if (!d || Number.isNaN(d.getTime())) return null
    const diff = d.getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
};

const formatDiscountSuffix = discountPct => {
	const n = Number(discountPct)
	if (!Number.isFinite(n) || n <= 0) return ''
	const pctText = Number.isInteger(n) ? String(n) : String(n)
	return ` (${pctText}% disc)`
}

const formatPaymentMethodSuffix = paymentMethod => {
	const raw = paymentMethod == null ? '' : String(paymentMethod).trim().toLowerCase()
	if (!raw) return ''
	if (raw === 'cash' || raw === 'gpay' || raw === 'phonepay' || raw === 'paytm') return ` (${raw})`
	return ''
}

const planNameWithDiscount = m => {
	const base = m?.plan?.planName
	if (!base) return ''
	return `${base}${formatDiscountSuffix(m?.discountPct)}${formatPaymentMethodSuffix(m?.paymentMethod)}`
}

/**
 * Client-side CSV export for admin reporting.
 * Used by the Members screen “Export CSV” action.
 */
const downloadCsv = ({ rows, filename }) => {
    /**
	 * Escape CSV values (commas/quotes/newlines) so spreadsheets open correctly.
     */
    const escape = v => {
        const s = v == null ? '' : String(v)
        if (/[\n\r\t,"]/g.test(s)) return `"${s.replaceAll('"', '""')}"`
        return s
    };

    const lines = rows.map(/**
	 * Convert each row array into a single CSV line.
     */
    row => {
        return row.map(escape).join(',');
    })
    const csv = lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
};

export default /**
 * Bluefins admin screen: Members registry.
 * Admins use this to search/filter members, monitor expiry, export a CSV report,
 * download member ID cards (QR), and delete records when required.
 */
function Members() {
    const navigate = useNavigate()

    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

    const [q, setQ] = React.useState('')
    const [status, setStatus] = React.useState('')
    const [planType, setPlanType] = React.useState('')
    const [page, setPage] = React.useState(1)
    const [limit, setLimit] = React.useState(25)
    const [sort, setSort] = React.useState('createdAt')
    const [order, setOrder] = React.useState('desc')

    const [items, setItems] = React.useState([])
    const [total, setTotal] = React.useState(0)
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState('')
    const [selectedIds, setSelectedIds] = React.useState(/**
	 * Initialize selection state once; a Set makes bulk actions straightforward.
     */
    () => {
        return new Set();
    })

    React.useEffect(/**
	 * Admin-only guard: redirect to login if there is no valid admin session.
     */
    () => {
        if (!isAdminAuthenticated()) navigate('/admin')
    }, [navigate])

    const pageCount = Math.max(1, Math.ceil(total / limit))

    const buildUrl = React.useCallback(/**
		* Build the list API URL from the current filters/sort/pagination.
		* Memoized so the `load()` fetch function stays stable across renders.
     */
    () => {
        const params = new URLSearchParams()
        if (q.trim()) params.set('q', q.trim())
        if (status) params.set('status', status)
        if (planType) params.set('planType', planType)
        params.set('page', String(page))
        params.set('limit', String(limit))
        params.set('sort', sort)
        params.set('order', order)
        return `${apiBase}/membership/members?${params.toString()}`
    }, [apiBase, limit, order, page, planType, q, sort, status])

    const load = React.useCallback(/**
		* Fetch members for the current view (filters + page) and refresh the table.
		* Resets selection because the visible rows may have changed.
     */
    async () => {
        setLoading(true)
        setError('')
        try {
			const res = await adminFetch(buildUrl())
			const parsed = await safeReadJson(res)
			if (!res.ok || parsed?.success === false) {
				throw new Error(parsed?.message || `Failed (${res.status})`)
			}
			const data = parsed?.data
			setItems(Array.isArray(data?.items) ? data.items : [])
			setTotal(typeof data?.total === 'number' ? data.total : 0)
			setSelectedIds(new Set())
		} catch (e) {
			setError(e?.message || 'Failed to load members')
			setItems([])
			setTotal(0)
		} finally {
			setLoading(false)
		}
    }, [buildUrl])

    const selectedCount = selectedIds.size
    const pageIds = React.useMemo(/**
	 * Cache IDs for members visible on the current page.
	 * Used for “select all on page”.
     */
    () => {
        return items.map(/**
		 * Extract the member id from each row.
         */
        m => {
            return String(m?._id || '');
        }).filter(Boolean);
    }, [items])
    const allSelectedOnPage = React.useMemo(/**
	 * True when every row on the current page is selected.
	 * Drives the header checkbox state.
     */
    () => {
        if (!pageIds.length) return false
        for (const id of pageIds) {
			if (!selectedIds.has(id)) return false
		}
        return true
    }, [pageIds, selectedIds])

    /**
		* Toggle selection for a single member row.
     */
    const toggleSelectOne = id => {
        const key = String(id || '').trim()
        if (!key) return
        setSelectedIds(/**
		 * Functional update avoids stale state when toggling rapidly.
         */
        prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
			else next.add(key)
            return next
        })
    };

    /**
	 * Select/deselect all rows visible on the current page.
     */
    const toggleSelectAllOnPage = () => {
        setSelectedIds(/**
		 * Only add/remove the IDs present on this page.
         */
        prev => {
            const next = new Set(prev)
            if (!pageIds.length) return next
            const shouldSelectAll = !allSelectedOnPage
            if (shouldSelectAll) {
				for (const id of pageIds) next.add(id)
			} else {
				for (const id of pageIds) next.delete(id)
			}
            return next
        })
    };

    /**
		* Admin bulk action: delete all selected members after confirmation.
		* Intended for cleanup (duplicates/test data) and should be used carefully.
     */
    const onBulkDeleteSelected = async () => {
        if (!selectedCount) return

        const result = await Swal.fire({
			title: `Delete ${selectedCount} member(s)?`,
			text: 'This cannot be undone.',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Delete selected',
			cancelButtonText: 'Cancel',
			confirmButtonColor: '#FF6B9D',
		})
        if (!result.isConfirmed) return

        setLoading(true)
        setError('')
        try {
			const res = await adminFetch(`${apiBase}/membership/members/bulk-delete`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids: Array.from(selectedIds) }),
			})
			const parsed = await safeReadJson(res)
			if (!res.ok || parsed?.success === false) {
				throw new Error(parsed?.message || `Bulk delete failed (${res.status})`)
			}
			const deletedCount = Number(parsed?.data?.deletedCount || 0)
			await Swal.fire({
				title: 'Deleted',
				text: `Deleted ${deletedCount} member(s).`,
				icon: 'success',
			})
			await load()
		} catch (e) {
			setError(e?.message || 'Failed to delete selected members')
			await Swal.fire({
				title: 'Error',
				text: e?.message || 'Failed to delete selected members',
				icon: 'error',
			})
		} finally {
			setLoading(false)
		}
    };

    /**
		* Admin action: delete one member after confirmation.
     */
    const onDelete = async member => {
        if (!member?._id) return

        const result = await Swal.fire({
			title: 'Delete member?',
			text: `Delete "${member.name}"? This cannot be undone.`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Delete',
			cancelButtonText: 'Cancel',
			confirmButtonColor: '#FF6B9D',
		})
        if (!result.isConfirmed) return

        setLoading(true)
        setError('')
        try {
			const res = await adminFetch(`${apiBase}/membership/members/${member._id}`, { method: 'DELETE' })
			const parsed = await safeReadJson(res)
			if (!res.ok || parsed?.success === false) {
				throw new Error(parsed?.message || `Delete failed (${res.status})`)
			}
			await Swal.fire({
				title: 'Deleted',
				text: 'Member deleted successfully.',
				icon: 'success',
			})
			await load()
		} catch (e) {
			setError(e?.message || 'Failed to delete member')
			await Swal.fire({
				title: 'Error',
				text: e?.message || 'Failed to delete member',
				icon: 'error',
			})
		} finally {
			setLoading(false)
		}
    };

    /**
		* Admin action: download the member ID card that includes the QR code.
		* The QR is used for quick attendance scanning at the pool.
     */
    const onDownloadId = async member => {
        try {
			if (!member?._id) throw new Error('Missing member id')
			if (!member?.qrCode) throw new Error('QR not available for this member')
			await downloadMemberIdCard({
				name: member.name,
				phone: member.phone,
				memberId: member._id,
				qrDataUrl: member.qrCode,
				planName: member?.plan?.planName,
				joinDate: member?.joinDate,
				expiryDate: member?.expiryDate,
			})
		} catch (e) {
			await Swal.fire({
				title: 'Error',
				text: e?.message || 'Failed to download ID card',
				icon: 'error',
			})
		}
    };

    React.useEffect(/**
	 * Load the table on mount and whenever filters/sorting/pagination changes.
     */
    () => {
        load()
    }, [load])

    React.useEffect(/**
	 * Keep `page` in range when total/limit changes reduce the page count.
     */
    () => {
        if (page > pageCount) setPage(pageCount)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageCount])

    /**
	 * Export the current page of results to CSV (quick admin reporting).
     */
    const onExport = () => {
        const rows = [
			['Name', 'Phone', 'Plan', 'Plan Type', 'Status', 'Join Date', 'Expiry Date', 'Days Left', 'Visits', 'Member ID', 'Group ID'],
			...items.map(/**
			 * Convert each member record into a flat CSV row.
             */
            m => {
                const daysLeft = daysUntil(m.expiryDate, m.planType)
                return [
					m.name,
					m.phone,
					planNameWithDiscount(m) || '',
					m.planType || '',
					m.status,
					formatDate(m.joinDate),
					formatDate(m.expiryDate),
					daysLeft == null ? '' : String(daysLeft),
					m.attendanceDaysCount == null ? '' : String(m.attendanceDaysCount),
					m._id,
					m.membershipGroupId || '',
				]
            }),
		]
        downloadCsv({ rows, filename: `bluefins-members-page-${page}.csv` })
    };

    /**
	 * Decide the status badge for a row.
	 * Highlights expired members and those expiring soon.
     */
    const badgeFor = m => {
        const daysLeft = daysUntil(m.expiryDate, m.planType)
        if (m.status === 'expired' || (daysLeft != null && daysLeft <= 0)) {
			return { label: 'Expired', color: '#FF6B9D', bg: 'rgba(255, 107, 157, 0.15)', border: 'rgba(255, 107, 157, 0.35)' }
		}
        if (daysLeft != null && daysLeft <= 7) {
			return { label: `Expiring (${daysLeft}d)`, color: '#FFD700', bg: 'rgba(255, 215, 0, 0.12)', border: 'rgba(255, 215, 0, 0.35)' }
		}
        return { label: 'Active', color: '#00FFD4', bg: 'rgba(0, 255, 212, 0.12)', border: 'rgba(0, 255, 212, 0.35)' }
    };

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
						<h1 style={{ color: '#00FFD4', fontSize: '2.0rem', fontWeight: 700, margin: 0 }}>Members</h1>
						<p style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: '8px', fontSize: '0.95rem' }}>
							Search, filter, export, and inspect membership QR.
						</p>
					</div>

					<div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
						<button
							onClick={load}
							disabled={loading}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								padding: '10px 16px',
								background: 'rgba(0, 255, 212, 0.15)',
								color: '#00FFD4',
								border: '1px solid rgba(0, 255, 212, 0.35)',
								borderRadius: '10px',
								cursor: loading ? 'not-allowed' : 'pointer',
								fontWeight: 600,
							}}
						>
							<FaSyncAlt /> {loading ? 'Loading…' : 'Refresh'}
						</button>
						<button
							onClick={onExport}
							disabled={loading || items.length === 0}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								padding: '10px 16px',
								background: 'rgba(0, 153, 255, 0.15)',
								color: '#0099FF',
								border: '1px solid rgba(0, 153, 255, 0.35)',
								borderRadius: '10px',
								cursor: loading || items.length === 0 ? 'not-allowed' : 'pointer',
								fontWeight: 600,
							}}
						>
							<FaDownload /> Export CSV
						</button>
						<button
							onClick={onBulkDeleteSelected}
							disabled={loading || selectedCount === 0}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								padding: '10px 16px',
								background: 'rgba(255, 107, 157, 0.15)',
								color: '#FF6B9D',
								border: '1px solid rgba(255, 107, 157, 0.35)',
								borderRadius: '10px',
								cursor: loading || selectedCount === 0 ? 'not-allowed' : 'pointer',
								fontWeight: 700,
							}}
							title={selectedCount === 0 ? 'Select members to delete' : `Delete ${selectedCount} selected`}
						>
							<FaTrash /> Delete selected {selectedCount ? `(${selectedCount})` : ''}
						</button>
					</div>
				</div>

				<div
					style={{
						background: 'rgba(15, 25, 50, 0.7)',
						border: '1px solid rgba(0, 255, 212, 0.25)',
						borderRadius: '16px',
						padding: '18px',
						marginBottom: '18px',
					}}
				>
					<div className="admin-filter-grid">
						<div className="admin-filter-span-2">
							<input
								value={q}
								onChange={/**
								 * Update search query and reset to page 1.
                                 */
                                e => {
                                    setPage(1)
                                    setQ(e.target.value)
                                }}
								placeholder="Search name / phone / group id"
								style={{
									width: '100%',
									padding: '12px 14px',
									borderRadius: '12px',
									border: '1px solid rgba(255, 255, 255, 0.12)',
									background: 'rgba(10, 14, 39, 0.6)',
									color: 'rgba(255,255,255,0.9)',
									outline: 'none',
								}}
							/>
						</div>

						<select
							value={status}
							onChange={/**
							 * Filter by status and reset to page 1.
                             */
                            e => {
                                setPage(1)
                                setStatus(e.target.value)
                            }}
							style={{
								padding: '12px 14px',
								borderRadius: '12px',
								border: '1px solid rgba(255, 255, 255, 0.12)',
								background: 'rgba(10, 14, 39, 0.6)',
								color: 'rgba(255,255,255,0.9)',
								outline: 'none',
							}}
						>
							<option value="">All status</option>
							<option value="active">Active</option>
							<option value="expired">Expired</option>
						</select>

						<select
							value={planType}
							onChange={/**
							 * Filter by plan type and reset to page 1.
                             */
                            e => {
                                setPage(1)
                                setPlanType(e.target.value)
                            }}
							style={{
								padding: '12px 14px',
								borderRadius: '12px',
								border: '1px solid rgba(255, 255, 255, 0.12)',
								background: 'rgba(10, 14, 39, 0.6)',
								color: 'rgba(255,255,255,0.9)',
								outline: 'none',
							}}
						>
							<option value="">All plan types</option>
							<option value="summer">Summer</option>
							<option value="monthly">Monthly</option>
							<option value="yearly">Yearly</option>
							<option value="family">Family</option>
							<option value="public">Public</option>
						</select>

						<select
							value={limit}
							onChange={/**
							 * Change page size and reset to page 1.
                             */
                            e => {
                                setPage(1)
                                setLimit(Number(e.target.value))
                            }}
							style={{
								padding: '12px 14px',
								borderRadius: '12px',
								border: '1px solid rgba(255, 255, 255, 0.12)',
								background: 'rgba(10, 14, 39, 0.6)',
								color: 'rgba(255,255,255,0.9)',
								outline: 'none',
							}}
						>
							<option value={10}>10 / page</option>
							<option value={25}>25 / page</option>
							<option value={50}>50 / page</option>
							<option value={100}>100 / page</option>
						</select>

						<select
							value={`${sort}:${order}`}
							onChange={/**
							 * Change sorting and reset to page 1.
                             */
                            e => {
                                setPage(1)
                                const [sf, od] = String(e.target.value).split(':')
                                setSort(sf)
                                setOrder(od)
                            }}
							style={{
								padding: '12px 14px',
								borderRadius: '12px',
								border: '1px solid rgba(255, 255, 255, 0.12)',
								background: 'rgba(10, 14, 39, 0.6)',
								color: 'rgba(255,255,255,0.9)',
								outline: 'none',
							}}
						>
							<option value="createdAt:desc">Newest</option>
							<option value="createdAt:asc">Oldest</option>
							<option value="expiryDate:asc">Expiry (soonest)</option>
							<option value="expiryDate:desc">Expiry (latest)</option>
							<option value="name:asc">Name (A-Z)</option>
							<option value="name:desc">Name (Z-A)</option>
						</select>

						<div className="admin-filter-summary" style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
							{total ? `Showing ${(page - 1) * limit + 1}-${Math.min(page * limit, total)} of ${total}` : 'No members'}
						</div>
					</div>
				</div>

				{error ? (
					<div
						style={{
							background: 'rgba(255, 107, 157, 0.12)',
							border: '1px solid rgba(255, 107, 157, 0.35)',
							borderRadius: '14px',
							padding: '14px 16px',
							color: '#FF6B9D',
							fontWeight: 600,
							marginBottom: '14px',
						}}
					>
						{error}
					</div>
				) : null}

				<div
					style={{
						background: 'rgba(15, 25, 50, 0.7)',
						border: '1px solid rgba(0, 255, 212, 0.25)',
						borderRadius: '16px',
						overflow: 'hidden',
					}}
				>
					<div style={{ overflowX: 'auto' }}>
						<table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1250px' }}>
							<thead>
								<tr style={{ background: 'rgba(10, 14, 39, 0.7)' }}>
									{['', 'Member', 'Phone', 'Plan', 'Status', 'Join', 'Expiry', 'Days Left', 'Visits', 'QR', ''].map(/**
									 * Render table headers (first column is the “select all on page” checkbox).
                                     */
                                    h => {
                                        return (
                                            <th
                                                key={h}
                                                style={{
                                                    textAlign: 'left',
                                                    padding: '10px 12px',
                                                    color: 'rgba(255,255,255,0.65)',
                                                    fontWeight: 600,
                                                    fontSize: '0.8rem',
                                                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                                                }}
                                            >
                                                {h === '' ? (
                                                    <input
                                                        type="checkbox"
                                                        checked={allSelectedOnPage}
                                                        onChange={toggleSelectAllOnPage}
                                                        disabled={loading || items.length === 0}
                                                        title="Select all on this page"
                                                        style={{ transform: 'translateY(1px)' }}
                                                    />
                                                ) : (
                                                    h
                                                )}
                                            </th>
                                        );
                                    })}
								</tr>
							</thead>
							<tbody>
								{items.map(/**
								 * Render each member row.
                                 */
                                m => {
                                    const b = badgeFor(m)
                                    const daysLeft = daysUntil(m.expiryDate, m.planType)
                                    const rowBorder = b.border
                                    const id = String(m._id)
                                    const isSelected = selectedIds.has(id)
                                    return (
                                        <React.Fragment key={m._id}>
                                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
												<td style={{ padding: '10px 12px' }}>
													<input
														type="checkbox"
														checked={isSelected}
														onChange={/**
														 * Toggle selection for this row.
                                                         */
                                                        () => {
                                                            return toggleSelectOne(id);
                                                        }}
														disabled={loading}
														title="Select member"
														style={{ transform: 'translateY(1px)' }}
													/>
												</td>
												<td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.9rem' }}>
													<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
														<div
															style={{
																width: 10,
																height: 10,
																borderRadius: 999,
																background: b.color,
																boxShadow: `0 0 16px ${b.color}55`,
															}}
														/>
														<div>
															<div>{m.name}</div>
															<div style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500, fontSize: '0.8rem' }}>
																ID: {String(m._id).slice(-8)}
															</div>
														</div>
													</div>
												</td>
												<td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.8)', fontWeight: 500, fontSize: '0.85rem' }}>{m.phone}</td>
												<td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.8)', fontWeight: 500, fontSize: '0.85rem' }}>
													<div style={{ color: '#00FFD4', fontWeight: 600 }}>{planNameWithDiscount(m) || '—'}</div>
													<div style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 700, fontSize: '0.8rem' }}>
														{m.planType || '—'}
													</div>
												</td>
												<td style={{ padding: '10px 12px' }}>
													<span
														style={{
															padding: '6px 8px',
															borderRadius: 999,
															border: `1px solid ${rowBorder}`,
															background: b.bg,
															color: b.color,
															fontWeight: 600,
															fontSize: '0.8rem',
														}}
													>
														{b.label}
													</span>
												</td>
												<td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.75)', fontWeight: 500, fontSize: '0.85rem' }}>{formatDate(m.joinDate)}</td>
												<td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.75)', fontWeight: 500, fontSize: '0.85rem' }}>{formatDate(m.expiryDate)}</td>
												<td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.75)', fontWeight: 500, fontSize: '0.85rem' }}>
													{daysLeft == null ? '—' : daysLeft}
												</td>
												<td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.75)', fontWeight: 600, fontSize: '0.85rem' }}>
													{m.attendanceDaysCount == null ? '—' : m.attendanceDaysCount}
												</td>
												<td style={{ padding: '10px 12px' }}>
													<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
														<div
															style={{
																width: 30,
																height: 30,
																borderRadius: 9,
																overflow: 'hidden',
																border: '1px solid rgba(255,255,255,0.12)',
																background: 'rgba(10, 14, 39, 0.5)',
															}}
														>
															{m.qrCode ? (
																<img src={m.qrCode} alt="QR" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
															) : (
																<div
																	style={{
																		width: '100%',
																		height: '100%',
																		display: 'grid',
																		placeItems: 'center',
																		color: 'rgba(255,255,255,0.5)',
																		fontWeight: 600,
																		fontSize: '0.75rem',
																	}}
																>
																	—
																</div>
															)}
														</div>

														<button
															onClick={/**
															 * Download ID card (with QR) for this member.
                                                             */
                                                            () => {
                                                                return onDownloadId(m);
                                                            }}
															disabled={loading || !m.qrCode}
															title="Download ID Card"
															aria-label={`Download ID for ${m.name}`}
															style={{
																display: 'inline-flex',
																alignItems: 'center',
																justifyContent: 'center',
															width: 28,
															height: 28,
																background: 'rgba(0, 153, 255, 0.15)',
																color: '#0099FF',
																border: '1px solid rgba(0, 153, 255, 0.35)',
															borderRadius: '9px',
																cursor: loading || !m.qrCode ? 'not-allowed' : 'pointer',
															}}
														>
														<FaDownload style={{ fontSize: 13 }} />
														</button>

														<button
															onClick={() => {
																const url = `https://bluefinsaquaticsolutions.com/member/id/${m._id}`
																const message = `Hello *${m.name}* 👋\n\nWelcome to *Blue Fins Aquatic Solutions*! 🏊‍♂️ Thank you for registering with us.\n\nYour Official Digital Member ID Card is ready. 🪪\nPlease use the secure link below to view and download your ID card for attendance and entry:\n\n👉 ${url}\n\nWe look forward to seeing you at the pool! 🌊\nRegards,\n*Team Blue Fins* 💙`;
																const whatsappUrl = `https://wa.me/91${m.phone}?text=${encodeURIComponent(message)}`
																window.open(whatsappUrl, '_blank')
															}}
															disabled={loading || !m.qrCode}
															title="Send ID via WhatsApp"
															aria-label={`Send ID via WhatsApp for ${m.name}`}
															style={{
																display: 'inline-flex',
																alignItems: 'center',
																justifyContent: 'center',
																width: 28,
																height: 28,
																background: 'rgba(37, 211, 102, 0.15)',
																color: '#25D366',
																border: '1px solid rgba(37, 211, 102, 0.35)',
																borderRadius: '9px',
																cursor: loading || !m.qrCode ? 'not-allowed' : 'pointer',
															}}
														>
															<FaWhatsapp style={{ fontSize: 16 }} />
														</button>
													</div>
												</td>
											<td style={{ padding: '10px 12px' }}>
													<button
														onClick={/**
															 * Delete this member after confirmation.
                                                         */
                                                        () => {
                                                            return onDelete(m);
                                                        }}
														disabled={loading}
														aria-label={`Delete ${m.name}`}
														title="Delete"
														style={{
															display: 'inline-flex',
															alignItems: 'center',
															justifyContent: 'center',
														width: 28,
														height: 28,
															background: 'rgba(255, 50, 100, 0.18)',
															color: '#FF6B9D',
															border: '1px solid rgba(255, 50, 100, 0.35)',
														borderRadius: '9px',
															cursor: loading ? 'not-allowed' : 'pointer',
													fontWeight: 600,
														}}
													>
													<FaTrash style={{ fontSize: 13 }} />
													</button>
												</td>
											</tr>
                                        </React.Fragment>
                                    );
                                })}

								{!loading && items.length === 0 ? (
									<tr>
										<td colSpan={11} style={{ padding: '16px 12px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.9rem' }}>
											No members found for current filters.
										</td>
									</tr>
								) : null}
							</tbody>
						</table>
					</div>

					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							padding: '14px 16px',
							borderTop: '1px solid rgba(255,255,255,0.08)',
						}}
					>
						<div style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>
							Page {page} / {pageCount}
						</div>
						<div style={{ display: 'flex', gap: '10px' }}>
							<button
								onClick={/**
								 * Pagination: go to previous page.
                                 */
                                () => {
                                    return setPage(/**
									 * Functional update avoids stale state.
                                     */
                                    p => {
                                        return Math.max(1, p - 1);
                                    });
                                }}
								disabled={loading || page <= 1}
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									gap: '8px',
									padding: '9px 12px',
									background: 'rgba(255,255,255,0.06)',
									color: 'rgba(255,255,255,0.8)',
									border: '1px solid rgba(255,255,255,0.12)',
									borderRadius: '10px',
									cursor: loading || page <= 1 ? 'not-allowed' : 'pointer',
									fontWeight: 600,
									fontSize: '0.9rem',
								}}
							>
								<FaChevronLeft /> Prev
							</button>
							<button
								onClick={/**
								 * Pagination: go to next page.
                                 */
                                () => {
                                    return setPage(/**
									 * Functional update avoids stale state.
                                     */
                                    p => {
                                        return Math.min(pageCount, p + 1);
                                    });
                                }}
								disabled={loading || page >= pageCount}
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									gap: '8px',
									padding: '9px 12px',
									background: 'rgba(255,255,255,0.06)',
									color: 'rgba(255,255,255,0.8)',
									border: '1px solid rgba(255,255,255,0.12)',
									borderRadius: '10px',
									cursor: loading || page >= pageCount ? 'not-allowed' : 'pointer',
									fontWeight: 600,
									fontSize: '0.9rem',
								}}
							>
								Next <FaChevronRight />
							</button>
						</div>
					</div>
				</div>
			</div>
        </div>
    );
}
