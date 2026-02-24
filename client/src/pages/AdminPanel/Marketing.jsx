import React from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import AdminNavbar from '../../components/adminPanel/AdminNavbar.jsx'
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

export default function Marketing() {
	const navigate = useNavigate()
	const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

	const [q, setQ] = React.useState('')
	const [status, setStatus] = React.useState('')
	const [planType, setPlanType] = React.useState('')
	const [category, setCategory] = React.useState('')
	const [page, setPage] = React.useState(1)
	const [limit, setLimit] = React.useState(25)
	const [sort, setSort] = React.useState('createdAt')
	const [order, setOrder] = React.useState('desc')

	const [items, setItems] = React.useState([])
	const [total, setTotal] = React.useState(0)
	const [selectedIds, setSelectedIds] = React.useState(() => new Set())
	const [message, setMessage] = React.useState('')

	const [loading, setLoading] = React.useState(false)
	const [error, setError] = React.useState('')
	const [result, setResult] = React.useState(null)

	React.useEffect(() => {
		if (!isAdminAuthenticated()) navigate('/admin')
	}, [navigate])

	const pageCount = Math.max(1, Math.ceil(total / limit))

	const buildListUrl = React.useCallback(() => {
		const params = new URLSearchParams()
		if (q.trim()) params.set('q', q.trim())
		if (status) params.set('status', status)
		if (planType.trim()) params.set('planType', planType.trim())
		// category isn't supported by the existing listMembers endpoint; keep it client-side filter for now.
		params.set('page', String(page))
		params.set('limit', String(limit))
		params.set('sort', sort)
		params.set('order', order)
		return `${apiBase}/membership/members?${params.toString()}`
	}, [apiBase, limit, order, page, planType, q, sort, status])

	const loadMembers = React.useCallback(async () => {
		setLoading(true)
		setError('')
		try {
			const res = await adminFetch(buildListUrl())
			const parsed = await safeReadJson(res)
			if (!res.ok || parsed?.success === false) {
				throw new Error(parsed?.message || `Failed (${res.status})`)
			}
			const data = parsed?.data
			let nextItems = Array.isArray(data?.items) ? data.items : []
			if (category) {
				nextItems = nextItems.filter((m) => String(m?.category || '') === String(category))
			}
			setItems(nextItems)
			setTotal(typeof data?.total === 'number' ? data.total : 0)
		} catch (e) {
			setError(e?.message || 'Failed to load members')
			setItems([])
			setTotal(0)
		} finally {
			setLoading(false)
		}
	}, [buildListUrl, category])

	const filterKey = React.useMemo(() => JSON.stringify({ q: q.trim(), status, planType: planType.trim(), category }), [category, planType, q, status])
	React.useEffect(() => {
		setPage(1)
		setSelectedIds(new Set())
	}, [filterKey])

	React.useEffect(() => {
		loadMembers()
	}, [loadMembers])

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

	const onSend = async (e) => {
		e?.preventDefault?.()
		if (!selectedCount) {
			await Swal.fire({
				title: 'Select members',
				text: 'Please select at least 1 member to send WhatsApp.',
				icon: 'info',
			})
			return
		}

		setLoading(true)
		setError('')
		setResult(null)

		try {
			const confirm = await Swal.fire({
				title: `Send WhatsApp to ${selectedCount} member(s)?`,
				text: 'This will send the same message to all selected members.',
				icon: 'warning',
				showCancelButton: true,
				confirmButtonText: 'Send',
				cancelButtonText: 'Cancel',
				confirmButtonColor: '#00FFD4',
			})
			if (!confirm.isConfirmed) return

			const payload = {
				audience: 'members',
				message,
				memberIds: Array.from(selectedIds),
			}

			const res = await adminFetch(`${apiBase}/admin/marketing/whatsapp/bulk-send`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})
			const parsed = await safeReadJson(res)
			if (!res.ok || parsed?.success === false) {
				throw new Error(parsed?.message || `Send failed (${res.status})`)
			}

			setResult(parsed?.data || null)
			await Swal.fire({
				title: 'WhatsApp sent',
				text: parsed?.message || 'WhatsApp message sent',
				icon: 'success',
				confirmButtonColor: '#00FFD4',
			})
		} catch (err) {
			const msg = err?.message || 'Failed to send bulk WhatsApp'
			setError(msg)
			await Swal.fire({
				title: 'Error',
				text: msg,
				icon: 'error',
				confirmButtonColor: '#FF6B9D',
			})
		} finally {
			setLoading(false)
		}
	}

	const cardStyle = {
		background: 'rgba(15, 25, 50, 0.7)',
		border: '1px solid rgba(0, 255, 200, 0.25)',
		borderRadius: '16px',
		padding: '24px',
	}

	const labelStyle = {
		display: 'block',
		color: 'rgba(255, 255, 255, 0.7)',
		fontSize: '0.9rem',
		marginBottom: '6px',
	}

	const inputStyle = {
		width: '100%',
		padding: '12px 14px',
		borderRadius: '10px',
		border: '1px solid rgba(0, 255, 200, 0.3)',
		background: 'rgba(255, 255, 255, 0.05)',
		color: '#fff',
		boxSizing: 'border-box',
		fontFamily: 'Poppins, system-ui',
		outline: 'none',
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

			<div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
				<h1 style={{ color: '#00FFD4', fontSize: '2.1rem', fontWeight: 900, marginBottom: '8px' }}>Marketing (Bulk WhatsApp)</h1>
				<p style={{ color: 'rgba(255, 255, 255, 0.65)', marginTop: 0, marginBottom: '22px' }}>
					Filter members, select them, and send one WhatsApp message.
				</p>

				<form onSubmit={onSend} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '18px' }}>
					<div style={{ ...cardStyle }}>
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
							<div>
								<label style={labelStyle}>Search (name/phone/group id)</label>
								<input value={q} disabled={loading} onChange={(e) => setQ(e.target.value)} style={inputStyle} placeholder="Type to filter" />
							</div>

							<div>
								<label style={labelStyle}>Status</label>
								<select value={status} disabled={loading} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
									<option value="">All</option>
									<option value="active">Active</option>
									<option value="expired">Expired</option>
								</select>
							</div>

							<div>
								<label style={labelStyle}>Plan Type</label>
								<input
									value={planType}
									disabled={loading}
									onChange={(e) => setPlanType(e.target.value)}
									style={inputStyle}
									placeholder="e.g. monthly, yearly, public"
								/>
							</div>

							<div>
								<label style={labelStyle}>Category</label>
								<select value={category} disabled={loading} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
									<option value="">All</option>
									<option value="infant">Infant</option>
									<option value="kids">Kids</option>
									<option value="adult">Adult</option>
								</select>
							</div>
						</div>
					</div>

					<div style={{ ...cardStyle }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
							<div style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
								<b style={{ color: '#00FFD4' }}>Members:</b> {total} total • {items.length} shown • {selectedCount} selected
							</div>
							<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
								<label style={{ ...labelStyle, margin: 0 }}>Rows</label>
								<select value={limit} disabled={loading} onChange={(e) => setLimit(Number(e.target.value) || 25)} style={{ ...inputStyle, width: '120px' }}>
									<option value={10}>10</option>
									<option value={25}>25</option>
									<option value={50}>50</option>
									<option value={100}>100</option>
								</select>
								<button
									type="button"
									disabled={loading}
									onClick={() => loadMembers()}
									style={{
										padding: '10px 14px',
										borderRadius: '10px',
										border: '1px solid rgba(0, 255, 200, 0.35)',
										background: 'rgba(255, 255, 255, 0.05)',
										color: 'rgba(255, 255, 255, 0.85)',
										cursor: loading ? 'not-allowed' : 'pointer',
										fontWeight: 700,
									}}
								>
									{loading ? 'Loading…' : 'Refresh'}
								</button>
							</div>
						</div>

						<div style={{ marginTop: '14px', overflowX: 'auto' }}>
							<table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
								<thead>
									<tr style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.9rem', textAlign: 'left' }}>
										<th style={{ padding: '10px 8px', borderBottom: '1px solid rgba(0, 255, 200, 0.2)', width: '48px' }}>
											<input type="checkbox" checked={allSelectedOnPage} disabled={loading || !items.length} onChange={toggleSelectAllOnPage} />
										</th>
										<th style={{ padding: '10px 8px', borderBottom: '1px solid rgba(0, 255, 200, 0.2)' }}>Name</th>
										<th style={{ padding: '10px 8px', borderBottom: '1px solid rgba(0, 255, 200, 0.2)' }}>Phone</th>
										<th style={{ padding: '10px 8px', borderBottom: '1px solid rgba(0, 255, 200, 0.2)' }}>Status</th>
										<th style={{ padding: '10px 8px', borderBottom: '1px solid rgba(0, 255, 200, 0.2)' }}>Plan</th>
										<th style={{ padding: '10px 8px', borderBottom: '1px solid rgba(0, 255, 200, 0.2)' }}>Expiry</th>
									</tr>
								</thead>
								<tbody>
									{items.map((m) => {
										const id = String(m?._id || '')
										const checked = id && selectedIds.has(id)
										return (
											<tr key={id} style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
												<td style={{ padding: '10px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
													<input type="checkbox" checked={checked} disabled={loading || !id} onChange={() => toggleSelectOne(id)} />
												</td>
												<td style={{ padding: '10px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{m?.name || ''}</td>
												<td style={{ padding: '10px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{m?.phone || ''}</td>
												<td style={{ padding: '10px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{m?.status || ''}</td>
												<td style={{ padding: '10px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{m?.plan?.planName || m?.planType || ''}</td>
												<td style={{ padding: '10px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
													{m?.expiryDate ? new Date(m.expiryDate).toLocaleDateString() : ''}
												</td>
											</tr>
										)
									})}
									{!items.length && !loading ? (
										<tr>
											<td colSpan={6} style={{ padding: '14px 8px', color: 'rgba(255,255,255,0.65)' }}>
												No members found for these filters.
											</td>
										</tr>
									) : null}
								</tbody>
							</table>
						</div>

						<div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
							<div style={{ color: 'rgba(255,255,255,0.65)' }}>
								Page {page} / {pageCount}
							</div>
							<div style={{ display: 'flex', gap: '10px' }}>
								<button
									type="button"
									disabled={loading || page <= 1}
									onClick={() => setPage((p) => Math.max(1, p - 1))}
									style={{
										padding: '10px 14px',
										borderRadius: '10px',
										border: '1px solid rgba(0, 255, 200, 0.35)',
										background: 'rgba(255, 255, 255, 0.05)',
										color: 'rgba(255, 255, 255, 0.85)',
										cursor: loading ? 'not-allowed' : 'pointer',
										fontWeight: 700,
									}}
								>
									Prev
								</button>
								<button
									type="button"
									disabled={loading || page >= pageCount}
									onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
									style={{
										padding: '10px 14px',
										borderRadius: '10px',
										border: '1px solid rgba(0, 255, 200, 0.35)',
										background: 'rgba(255, 255, 255, 0.05)',
										color: 'rgba(255, 255, 255, 0.85)',
										cursor: loading ? 'not-allowed' : 'pointer',
										fontWeight: 700,
									}}
								>
									Next
								</button>
							</div>
						</div>
					</div>

					<div style={{ ...cardStyle }}>
						<label style={labelStyle}>Message</label>
						<textarea
							value={message}
							disabled={loading}
							onChange={(e) => setMessage(e.target.value)}
							rows={6}
							style={{ ...inputStyle, resize: 'vertical' }}
							placeholder="Write your WhatsApp message here..."
						/>
						<div style={{ marginTop: '10px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
							<button
								type="submit"
								disabled={loading || !message.trim() || selectedCount === 0}
								style={{
									padding: '12px 18px',
									borderRadius: '10px',
									border: '1px solid rgba(0, 255, 200, 0.4)',
									background: loading ? 'rgba(0, 255, 212, 0.25)' : 'linear-gradient(135deg, #00FFD4 0%, #0099FF 100%)',
									color: '#000',
									cursor: loading ? 'not-allowed' : 'pointer',
									fontWeight: 800,
								}}
							>
								{loading ? 'Sending…' : `Send WhatsApp to ${selectedCount} selected`}
							</button>
							<span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>
								Make sure `WA_PHONE_ID` and `WA_TOKEN` are configured on server.
							</span>
						</div>

						{error ? (
							<div style={{ marginTop: '14px', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255, 50, 100, 0.35)', background: 'rgba(255, 50, 100, 0.12)', color: '#FF6B9D' }}>
								{error}
							</div>
						) : null}

						{result ? (
							<div style={{ marginTop: '14px', padding: '12px', borderRadius: '10px', border: '1px solid rgba(0, 255, 200, 0.25)', background: 'rgba(0, 255, 200, 0.08)', color: 'rgba(255, 255, 255, 0.8)' }}>
								<b style={{ color: '#00FFD4' }}>Result:</b> attempted {result?.attempted || 0}, sent {result?.sent || 0}, failed {result?.failed || 0}
							</div>
						) : null}
					</div>
				</form>
			</div>
		</div>
	)
}
