import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import Attendance from '../models/Attendance.js'
import Member from '../models/Member.js'

const QR_PREFIX = 'bluefins:member:'

const BUSINESS_TZ_OFFSET_MINUTES = Number.parseInt(process.env.BUSINESS_TZ_OFFSET_MINUTES || '330', 10)

const toDateKey = (date) => {
	const d = date instanceof Date ? date : new Date(date)
	if (Number.isNaN(d.getTime())) return null
	const shifted = new Date(d.getTime() + BUSINESS_TZ_OFFSET_MINUTES * 60 * 1000)
	const y = shifted.getUTCFullYear()
	const m = String(shifted.getUTCMonth() + 1).padStart(2, '0')
	const day = String(shifted.getUTCDate()).padStart(2, '0')
	return `${y}-${m}-${day}`
}

const SHORT_ID_RE = /^[a-f0-9]{8}$/i

const findMemberIdByShortSuffix = async (shortId) => {
	const suffix = String(shortId || '').trim().toLowerCase()
	if (!SHORT_ID_RE.test(suffix)) return { ok: false, message: 'Invalid short id' }

	const hits = await Member.aggregate([
		{ $addFields: { _idStr: { $toString: '$_id' } } },
		{ $match: { _idStr: { $regex: `${suffix}$`, $options: 'i' } } },
		{ $project: { _id: 1 } },
		{ $limit: 2 },
	])

	if (!hits.length) return { ok: false, message: 'Member not found for this short id' }
	if (hits.length > 1) {
		return { ok: false, message: 'Short id is not unique. Please use the full Member ID or QR payload.' }
	}
	return { ok: true, memberId: String(hits[0]._id) }
}

const resolveMemberIdFromPayload = async (payload) => {
	const raw0 = payload == null ? '' : String(payload).trim()
	if (!raw0) return { ok: false, message: 'payload is required' }

	let raw = raw0
	if (raw.toLowerCase().startsWith(QR_PREFIX)) raw = raw.slice(QR_PREFIX.length)
	raw = raw.trim()

	// If a full ObjectId exists anywhere in the string, accept it.
	const fullMatch = raw.match(/[a-f0-9]{24}/i)
	if (fullMatch && mongoose.isValidObjectId(fullMatch[0])) {
		return { ok: true, memberId: fullMatch[0] }
	}

	// Accept an explicit short id (last 8 hex chars).
	if (SHORT_ID_RE.test(raw)) {
		return await findMemberIdByShortSuffix(raw)
	}

	const labeled = raw.match(/\bID\s*:\s*([a-f0-9]{8})\b/i)
	if (labeled) {
		return await findMemberIdByShortSuffix(labeled[1])
	}

	return { ok: false, message: 'Invalid member id. Use QR payload, full Member ID, or last 8 characters.' }
}

const parseDateOnlyParts = (value) => {
	const s = value == null ? '' : String(value).trim()
	if (!s) return null

	// YYYY-MM-DD
	if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
		const [yy, mm, dd] = s.split('-').map((x) => Number(x))
		if (!Number.isFinite(yy) || !Number.isFinite(mm) || !Number.isFinite(dd)) return null
		return { y: yy, m: mm, d: dd }
	}

	// DD/MM/YYYY
	if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
		const [dd, mm, yy] = s.split('/').map((x) => Number(x))
		if (!Number.isFinite(yy) || !Number.isFinite(mm) || !Number.isFinite(dd)) return null
		return { y: yy, m: mm, d: dd }
	}

	return null
}

const endOfUtcDayFromParts = (parts) => {
	if (!parts) return null
	const { y, m, d } = parts
	const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 23, 59, 59, 999))
	return Number.isNaN(dt.getTime()) ? null : dt
}

const endOfUtcDayFromValue = (value) => {
	const parts = parseDateOnlyParts(value)
	if (parts) return endOfUtcDayFromParts(parts)
	const d = value instanceof Date ? value : new Date(value)
	if (Number.isNaN(d.getTime())) return null
	return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999))
}

const computeMemberStatus = ({ expiryDate, planType, publicSlot }) => {
	const now = Date.now()
	const isPublic = String(planType || '').toLowerCase() === 'public'
	const expirySource = isPublic && publicSlot?.date ? publicSlot.date : expiryDate
	if (!expirySource) return 'expired'
	const eod = endOfUtcDayFromValue(expirySource)
	if (!eod) return 'expired'
	return eod.getTime() >= now ? 'active' : 'expired'
}

const clampInt = (value, { min, max, fallback }) => {
	const n = Number.parseInt(value, 10)
	if (!Number.isFinite(n)) return fallback
	return Math.max(min, Math.min(max, n))
}

const isDateOnly = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s)

const parseDateStart = (value) => {
	if (!value) return null
	const s = String(value).trim()
	if (!s) return null
	if (isDateOnly(s)) {
		const [y, m, d] = s.split('-').map((x) => Number(x))
		const dt = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0)
		return Number.isNaN(dt.getTime()) ? null : dt
	}
	const dt = new Date(s)
	return Number.isNaN(dt.getTime()) ? null : dt
}

const parseDateEnd = (value) => {
	if (!value) return null
	const s = String(value).trim()
	if (!s) return null
	if (isDateOnly(s)) {
		const [y, m, d] = s.split('-').map((x) => Number(x))
		const dt = new Date(y, (m || 1) - 1, d || 1, 23, 59, 59, 999)
		return Number.isNaN(dt.getTime()) ? null : dt
	}
	const dt = new Date(s)
	return Number.isNaN(dt.getTime()) ? null : dt
}

const escapeCsv = (value) => {
	const s = value == null ? '' : String(value)
	if (/[\n\r\t,"]/.test(s)) return `"${s.replaceAll('"', '""')}"`
	return s
}

const normalizeQueryForAttendance = async (reqQuery) => {
	const {
		date,
		dateFrom,
		dateTo,
		from,
		to,
		result,
		method,
		planId,
		memberId,
		q,
	} = reqQuery || {}

	const query = {}
	const and = []

	const start = parseDateStart(dateFrom || from)
	const end = parseDateEnd(dateTo || to)

	if (start && end) {
		query.scannedAt = { $gte: start, $lte: end }
	} else if (start) {
		query.scannedAt = { $gte: start }
	} else if (end) {
		query.scannedAt = { $lte: end }
	}

	if (!query.scannedAt && date) {
		const ds = String(date)
		const dayStart = parseDateStart(ds)
		const dayEnd = parseDateEnd(ds)
		if (!Number.isNaN(dayStart.getTime()) && !Number.isNaN(dayEnd.getTime())) {
			query.scannedAt = { $gte: dayStart, $lte: dayEnd }
		}
	}

	if (result && ['accepted', 'rejected'].includes(String(result))) {
		query.result = String(result)
	}
	if (method && ['qr', 'manual'].includes(String(method))) {
		query.method = String(method)
	}

	const rawPlanId = planId == null ? '' : String(planId).trim()
	if (rawPlanId) {
		if (!mongoose.isValidObjectId(rawPlanId)) {
			return { ok: false, message: 'Invalid planId' }
		}
		// Resolve members by planId and constrain attendance by those memberIds.
		// Capped to protect DB; if membership size is extremely large, add more specific filters.
		const planMembers = await Member.find({ planId: rawPlanId })
			.select({ _id: 1 })
			.limit(50000)
		const planMemberIds = planMembers.map((m) => m._id)
		and.push({ memberId: planMemberIds.length ? { $in: planMemberIds } : { $in: [] } })
	}

	const directMemberId = memberId ? String(memberId).trim() : ''
	if (directMemberId) {
		if (!mongoose.isValidObjectId(directMemberId)) {
			return { ok: false, message: 'Invalid memberId' }
		}
		and.push({ memberId: directMemberId })
		if (and.length === 1) query.memberId = and[0].memberId
		else if (and.length > 1) query.$and = and
		return { ok: true, query }
	}

	const rawQ = q == null ? '' : String(q).trim()
	if (!rawQ) {
		if (and.length === 1) query.memberId = and[0].memberId
		else if (and.length > 1) query.$and = and
		return { ok: true, query }
	}

	// Allow scanning payload, full ObjectId, or short id in the search box.
	const parsed = await resolveMemberIdFromPayload(rawQ)
	if (parsed.ok) {
		and.push({ memberId: parsed.memberId })
		if (and.length === 1) query.memberId = and[0].memberId
		else if (and.length > 1) query.$and = and
		return { ok: true, query }
	}

	if (mongoose.isValidObjectId(rawQ)) {
		and.push({ memberId: rawQ })
		if (and.length === 1) query.memberId = and[0].memberId
		else if (and.length > 1) query.$and = and
		return { ok: true, query }
	}

	// Name/phone search via Member lookup; capped to protect DB.
	const rx = new RegExp(rawQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
	const memberHits = await Member.find({ $or: [{ name: rx }, { phone: rx }] })
		.select({ _id: 1 })
		.limit(2000)

	const ids = memberHits.map((m) => m._id)
	and.push({ memberId: ids.length ? { $in: ids } : { $in: [] } })
	if (and.length === 1) query.memberId = and[0].memberId
	else if (and.length > 1) query.$and = and
	return { ok: true, query }
}

export const scanAttendance = asyncHandler(async (req, res) => {
	const { payload, method } = req.body || {}
	const parsed = await resolveMemberIdFromPayload(payload)
	if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.message })

	const member = await Member.findById(parsed.memberId).populate('planId')
	if (!member) return res.status(404).json({ success: false, message: 'Member not found' })

	const computedStatus = computeMemberStatus({ expiryDate: member.expiryDate, planType: member.planType, publicSlot: member.publicSlot })
	if (member.status !== computedStatus) {
		member.status = computedStatus
		await member.save()
	}

	const now = new Date()
	const dateKey = toDateKey(now)
	if (!dateKey) return res.status(500).json({ success: false, message: 'Unable to compute attendance date' })

	const windowSeconds = 30
	const since = new Date(Date.now() - windowSeconds * 1000)
	const recent = await Attendance.findOne({ memberId: member._id, scannedAt: { $gte: since } }).sort({ scannedAt: -1 })
	if (recent) {
		return res.json({
			success: true,
			data: {
				attendance: recent,
				member,
			},
			meta: { duplicate: true, duplicateType: 'window', duplicateWindowSeconds: windowSeconds },
		})
	}

	const alreadyToday = await Attendance.findOne({ memberId: member._id, date: dateKey }).sort({ scannedAt: -1 })
	if (alreadyToday) {
		return res.json({
			success: true,
			data: {
				attendance: alreadyToday,
				member,
			},
			meta: { duplicate: true, duplicateType: 'day', date: dateKey },
		})
	}

	const result = computedStatus === 'active' ? 'accepted' : 'rejected'
	const reason = result === 'accepted' ? undefined : 'Membership expired'

	let attendance
	try {
		attendance = await Attendance.create({
			memberId: member._id,
			date: dateKey,
			scannedAt: now,
			method: method === 'manual' ? 'manual' : 'qr',
			rawPayload: payload == null ? undefined : String(payload).slice(0, 512),
			result,
			reason,
			meta: {
				ip: req.ip,
				userAgent: req.get('user-agent'),
			},
		})
	} catch (e) {
		// If the unique index (memberId, date) exists and races, return a friendly duplicate response.
		if (e && (e.code === 11000 || String(e.message || '').includes('E11000'))) {
			const existing = await Attendance.findOne({ memberId: member._id, date: dateKey }).sort({ scannedAt: -1 })
			if (existing) {
				return res.json({
					success: true,
					data: { attendance: existing, member },
					meta: { duplicate: true, duplicateType: 'day', date: dateKey },
				})
			}
		}
		throw e
	}

	res.status(201).json({
		success: true,
		data: {
			attendance,
			member,
		},
	})

	// Persist all-time visit count (accepted check-ins).
	// This runs only when a new attendance record is created; duplicates return earlier.
	if (attendance?.result === 'accepted') {
		try {
			await Member.updateOne({ _id: member._id }, { $inc: { attendanceDaysCount: 1 } })
		} catch {
			// ignore counter update failures
		}
	}
})

export const listAttendance = asyncHandler(async (req, res) => {
	const page = clampInt(req.query?.page, { min: 1, max: 1000000, fallback: 1 })
	const limit = clampInt(req.query?.limit, { min: 1, max: 200, fallback: 25 })

	const norm = await normalizeQueryForAttendance(req.query)
	if (!norm.ok) return res.status(400).json({ success: false, message: norm.message })

	const [total, items] = await Promise.all([
		Attendance.countDocuments(norm.query),
		Attendance.find(norm.query)
			.sort({ scannedAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit)
			.populate({ path: 'memberId', populate: { path: 'planId' } }),
	])

	res.json({ success: true, data: { items, total, page, limit } })
})

export const deleteAttendance = asyncHandler(async (req, res) => {
	const { id } = req.params
	if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid id' })
	const deleted = await Attendance.deleteOne({ _id: id })
	res.json({ success: true, data: { deletedCount: deleted.deletedCount || 0 } })
})

export const bulkDeleteAttendance = asyncHandler(async (req, res) => {
	const ids = Array.isArray(req.body?.ids) ? req.body.ids : []
	const cleaned = ids.map((x) => String(x)).filter((x) => mongoose.isValidObjectId(x))
	if (cleaned.length === 0) return res.status(400).json({ success: false, message: 'ids array is required' })
	const deleted = await Attendance.deleteMany({ _id: { $in: cleaned } })
	res.json({ success: true, data: { deletedCount: deleted.deletedCount || 0 } })
})

export const purgeAttendanceBefore = asyncHandler(async (req, res) => {
	const before = req.query?.before
	const d = parseDateStart(before)
	if (!d) return res.status(400).json({ success: false, message: 'before is required (YYYY-MM-DD or ISO date)' })
	const deleted = await Attendance.deleteMany({ scannedAt: { $lt: d } })
	res.json({ success: true, data: { deletedCount: deleted.deletedCount || 0, before: d.toISOString() } })
})

export const exportAttendanceCsv = asyncHandler(async (req, res) => {
	const maxExport = clampInt(req.query?.max, { min: 1, max: 50000, fallback: 20000 })
	const norm = await normalizeQueryForAttendance(req.query)
	if (!norm.ok) return res.status(400).json({ success: false, message: norm.message })

	const items = await Attendance.find(norm.query)
		.sort({ scannedAt: -1 })
		.limit(maxExport)
		.populate({ path: 'memberId', populate: { path: 'planId' } })
		.lean()

	const filename = `bluefins-attendance-${new Date().toISOString().slice(0, 10)}.csv`
	res.setHeader('Content-Type', 'text/csv; charset=utf-8')
	res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

	res.write(
		[
			'Scanned At',
			'Result',
			'Method',
			'Reason',
			'Member Name',
			'Phone',
			'Plan',
			'Member ID',
			'Attendance ID',
		]
			.map(escapeCsv)
			.join(',') + '\n'
	)

	for (const row of items) {
		const member = row?.memberId
		const plan = member?.planId
		const line = [
			row?.scannedAt ? new Date(row.scannedAt).toISOString() : '',
			row?.result || '',
			row?.method || '',
			row?.reason || '',
			member?.name || '',
			member?.phone || '',
			plan?.planName || '',
			member?._id || '',
			row?._id || '',
		]
			.map(escapeCsv)
			.join(',')
		res.write(line + '\n')
	}
	res.end()
})
