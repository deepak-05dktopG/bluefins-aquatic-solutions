import React from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { downloadMemberIdCard } from '../../utils/idCard'
import { adminFetch, isAdminAuthenticated } from '../../utils/adminAuth'

const safeReadJson = async (res) => {
	const text = await res.text()
	if (!text) return { ok: false, message: 'Empty response from server' }
	try {
		return JSON.parse(text)
	} catch {
		return { ok: false, message: text }
	}
}

const formatDate = (value) => {
	if (!value) return ''
	const d = new Date(value)
	if (Number.isNaN(d.getTime())) return ''
	return d.toLocaleDateString()
}

const endOfLocalDay = (value) => {
	if (!value) return null
	const d = value instanceof Date ? value : new Date(value)
	if (Number.isNaN(d.getTime())) return null
	return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

const daysUntil = (expiryDate, planType) => {
	if (!expiryDate) return null
	const isPublic = String(planType || '').toLowerCase() === 'public'
	const d = isPublic ? new Date(expiryDate) : endOfLocalDay(expiryDate)
	if (!d || Number.isNaN(d.getTime())) return null
	const diff = d.getTime() - Date.now()
	return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const downloadCsv = ({ rows, filename }) => {
	const escape = (v) => {
		const s = v == null ? '' : String(v)
		if (/[\n\r\t,"]/g.test(s)) return `"${s.replaceAll('"', '""')}"`
		return s
	}

	const lines = rows.map((row) => row.map(escape).join(','))
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
}

export default function Members() {
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
	const [selectedIds, setSelectedIds] = React.useState(() => new Set())

	React.useEffect(() => {
		if (!isAdminAuthenticated()) navigate('/admin')
	}, [navigate])

	const pageCount = Math.max(1, Math.ceil(total / limit))

	const buildUrl = React.useCallback(() => {
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

	const load = React.useCallback(async () => {
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
	const pageIds = React.useMemo(() => items.map((m) => String(m?._id || '')).filter(Boolean), [items])
	const allSelectedOnPage = React.useMemo(() => {
		if (!pageIds.length) return false
		for (const id of pageIds) {
			if (!selectedIds.has(id)) return false
		}
		return true
	}, [pageIds, selectedIds])

	const toggleSelectOne = (id) => {
		const key = String(id || '').trim()
		if (!key) return
		setSelectedIds((prev) => {
			const next = new Set(prev)
			if (next.has(key)) next.delete(key)
			else next.add(key)
			return next
		})
	}

	const toggleSelectAllOnPage = () => {
		setSelectedIds((prev) => {
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
	}

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
	}

	const onDelete = async (member) => {
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
	}

	const onDownloadId = async (member) => {
		try {
			if (!member?._id) throw new Error('Missing member id')
			if (!member?.qrCode) throw new Error('QR not available for this member')
			await downloadMemberIdCard({
				name: member.name,
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
	}

	React.useEffect(() => {
		load()
	}, [load])

	React.useEffect(() => {
		if (page > pageCount) setPage(pageCount)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pageCount])

	const onExport = () => {
		const rows = [
			['Name', 'Phone', 'Plan', 'Plan Type', 'Status', 'Join Date', 'Expiry Date', 'Days Left', 'Visits', 'Member ID', 'Group ID'],
			...items.map((m) => {
				const daysLeft = daysUntil(m.expiryDate, m.planType)
				return [
					m.name,
					m.phone,
					m?.plan?.planName || '',
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
	}

	const badgeFor = (m) => {
		const daysLeft = daysUntil(m.expiryDate, m.planType)
		if (m.status === 'expired' || (daysLeft != null && daysLeft <= 0)) {
			return { label: 'Expired', color: '#FF6B9D', bg: 'rgba(255, 107, 157, 0.15)', border: 'rgba(255, 107, 157, 0.35)' }
		}
		if (daysLeft != null && daysLeft <= 7) {
			return { label: `Expiring (${daysLeft}d)`, color: '#FFD700', bg: 'rgba(255, 215, 0, 0.12)', border: 'rgba(255, 215, 0, 0.35)' }
		}
		return { label: 'Active', color: '#00FFD4', bg: 'rgba(0, 255, 212, 0.12)', border: 'rgba(0, 255, 212, 0.35)' }
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
								onChange={(e) => {
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
							onChange={(e) => {
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
							onChange={(e) => {
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
							onChange={(e) => {
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
							onChange={(e) => {
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
									{['', 'Member', 'Phone', 'Plan', 'Status', 'Join', 'Expiry', 'Days Left', 'Visits', 'QR', ''].map((h) => (
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
									))}
								</tr>
							</thead>
							<tbody>
								{items.map((m) => {
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
														onChange={() => toggleSelectOne(id)}
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
													<div style={{ color: '#00FFD4', fontWeight: 600 }}>{m?.plan?.planName || '—'}</div>
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
															onClick={() => onDownloadId(m)}
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
													</div>
												</td>
											<td style={{ padding: '10px 12px' }}>
													<button
														onClick={() => onDelete(m)}
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
									)
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
								onClick={() => setPage((p) => Math.max(1, p - 1))}
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
								onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
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
	)
}
