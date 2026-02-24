import mongoose from 'mongoose'
import Member from '../models/Member.js'
import Marketting from '../models/Marketting.js'
import { sendWhatsAppText } from '../../services/whatsappReminder.js'

const escapeRegExp = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const normalizeWhatsAppTo = (rawPhone) => {
	const cc = String(process.env.WA_DEFAULT_COUNTRY_CODE || '91').trim()
	const digits = String(rawPhone || '').replace(/\D/g, '')
	if (!digits) return null

	if (digits.length === 10) return `${cc}${digits}`
	if (digits.length === 11 && digits.startsWith('0')) return `${cc}${digits.slice(1)}`
	if (digits.length >= 11 && digits.length <= 15) return digits
	return null
}

const parseMaxRecipients = () => {
	const raw = process.env.WA_BULK_MAX_RECIPIENTS
	const n = Number.parseInt(String(raw || ''), 10)
	if (!Number.isFinite(n) || n <= 0) return 100
	return Math.min(Math.max(1, n), 1000)
}

const normalizeIdList = (ids) => {
	if (!Array.isArray(ids)) return []
	return ids
		.map((x) => (x == null ? '' : String(x).trim()))
		.filter(Boolean)
		.filter((id) => mongoose.Types.ObjectId.isValid(id))
}

const mapWithConcurrency = async (items, concurrency, mapper) => {
	const max = Math.max(1, Math.floor(concurrency || 1))
	const results = new Array(items.length)
	let idx = 0

	const workers = new Array(Math.min(max, items.length)).fill(0).map(async () => {
		while (true) {
			const current = idx
			idx += 1
			if (current >= items.length) break
			results[current] = await mapper(items[current], current)
		}
	})

	await Promise.all(workers)
	return results
}

const buildMembersQuery = ({ q, status, planType, category } = {}) => {
	const query = {}
	const text = String(q || '').trim()
	if (text) {
		const rx = new RegExp(escapeRegExp(text), 'i')
		query.$or = [{ name: rx }, { phone: rx }]
	}

	if (status === 'active' || status === 'expired') query.status = status
	if (planType) query.planType = String(planType).trim()
	if (category === 'infant' || category === 'kids' || category === 'adult') query.category = category

	return query
}

const buildCustomersQuery = ({ q, source } = {}) => {
	const query = {}
	const text = String(q || '').trim()
	if (text) {
		const rx = new RegExp(escapeRegExp(text), 'i')
		query.$or = [{ customerName: rx }, { whatsappNumber: rx }]
	}
	const s = String(source || '').trim()
	if (s) query.sources = s
	return query
}

export const sendBulkWhatsApp = async (req, res) => {
	try {
		const { audience, filters, message, memberIds, customerIds } = req.body || {}
		const body = String(message || '').trim()
		if (!body) {
			return res.status(400).json({ success: false, message: 'Message is required' })
		}

		const aud = String(audience || '').trim().toLowerCase()
		if (aud !== 'members' && aud !== 'customers') {
			return res.status(400).json({ success: false, message: 'Audience must be either "members" or "customers"' })
		}

		const maxRecipients = parseMaxRecipients()
		let recipients = []

		if (aud === 'members') {
			const selected = normalizeIdList(memberIds)
			const members = selected.length
				? await Member.find({ _id: { $in: selected } }).select({ name: 1, phone: 1 }).lean()
				: await Member.find(buildMembersQuery(filters)).select({ name: 1, phone: 1 }).lean()
			recipients = (members || []).map((m) => ({
				id: String(m?._id || ''),
				name: String(m?.name || '').trim(),
				to: normalizeWhatsAppTo(m?.phone),
				source: 'member',
			}))
		} else {
			const selected = normalizeIdList(customerIds)
			const customers = selected.length
				? await Marketting.find({ _id: { $in: selected } }).select({ customerName: 1, whatsappNumber: 1 }).lean()
				: await Marketting.find(buildCustomersQuery(filters)).select({ customerName: 1, whatsappNumber: 1 }).lean()
			recipients = (customers || []).map((c) => ({
				id: String(c?._id || ''),
				name: String(c?.customerName || '').trim(),
				to: normalizeWhatsAppTo(c?.whatsappNumber),
				source: 'customer',
			}))
		}

		// Remove invalid numbers
		recipients = recipients.filter((r) => Boolean(r.to))

		// De-dupe by WhatsApp destination
		const seen = new Set()
		recipients = recipients.filter((r) => {
			if (!r.to) return false
			if (seen.has(r.to)) return false
			seen.add(r.to)
			return true
		})

		const totalRecipients = recipients.length
		if (!totalRecipients) {
			return res.status(200).json({
				success: true,
				message: 'No recipients matched the selected filters',
				data: { audience: aud, totalRecipients: 0, attempted: 0, sent: 0, failed: 0 },
			})
		}

		if (totalRecipients > maxRecipients) {
			return res.status(400).json({
				success: false,
				message: `Too many recipients (${totalRecipients}). Narrow filters or increase WA_BULK_MAX_RECIPIENTS (current ${maxRecipients}).`,
				data: { audience: aud, totalRecipients, maxRecipients },
			})
		}

		const concurrency = Math.min(5, Math.max(1, Number.parseInt(process.env.WA_BULK_CONCURRENCY || '3', 10) || 3))
		let sent = 0
		let failed = 0
		const failures = []

		await mapWithConcurrency(recipients, concurrency, async (recipient) => {
			try {
				await sendWhatsAppText({ to: recipient.to, body })
				sent += 1
				return { ok: true }
			} catch (e) {
				failed += 1
				if (failures.length < 15) {
					failures.push({ to: recipient.to, id: recipient.id, error: e?.message || 'Send failed' })
				}
				return { ok: false }
			}
		})

		return res.status(200).json({
			success: true,
			message: `Bulk WhatsApp send complete: sent=${sent} failed=${failed}`,
			data: {
				audience: aud,
				totalRecipients,
				attempted: totalRecipients,
				sent,
				failed,
				failures,
			},
		})
	} catch (error) {
		console.error('Error sending bulk WhatsApp:', error)
		return res.status(500).json({ success: false, message: error?.message || 'Failed to send bulk WhatsApp messages' })
	}
}
