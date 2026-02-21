import crypto from 'crypto'
import qrcode from 'qrcode'
import asyncHandler from 'express-async-handler'
import Razorpay from 'razorpay'
import MembershipPlan from '../models/MembershipPlan.js'
import Member from '../models/Member.js'
import Payment from '../models/Payment.js'
import Attendance from '../models/Attendance.js'

const BUSINESS_TZ_OFFSET_MINUTES = Number.parseInt(process.env.BUSINESS_TZ_OFFSET_MINUTES || '330', 10)

const getForcedTestAmountInr = () => {
	const enabledRaw = process.env.ENABLE_TEST_MODE
	const enabled = String(enabledRaw || '').trim().toLowerCase()
	if (!(enabled === 'true' || enabled === '1' || enabled === 'yes')) return null

	const raw = process.env.FORCE_TEST_AMOUNT_INR
	if (raw == null || String(raw).trim() === '') return null
	const n = Number(raw)
	if (!Number.isFinite(n) || n <= 0) return null
	return Math.round((n + Number.EPSILON) * 100) / 100
}

const applyForcedPricing = (pricing) => {
	const forced = getForcedTestAmountInr()
	if (forced == null) return pricing
	return {
		subtotal: forced,
		commission: 0,
		gst: 0,
		total: forced,
		config: { commissionPct: 0, commissionFlatInr: 0, gstPct: 0 },
	}
}

const toNumberOr = (value, fallback) => {
	const n = Number(value)
	return Number.isFinite(n) ? n : fallback
}

const round2 = (value) => {
	const n = Number(value)
	if (!Number.isFinite(n)) return 0
	return Math.round((n + Number.EPSILON) * 100) / 100
}

const getPaymentChargesConfig = () => {
	// NOTE: keep these configurable from env; default 0 so existing installs are not broken.
	// Defaults align with common Razorpay card/UPI blended fee assumptions:
	// - 2% gateway fee
	// - GST applied on the gateway fee (typically 18%)
	// You can override any of these via env.
	const commissionPct = Math.max(0, toNumberOr(process.env.PAYMENT_COMMISSION_PCT, 2))
	const commissionFlatInr = Math.max(0, toNumberOr(process.env.PAYMENT_COMMISSION_FLAT_INR, 0))
	// GST is typically applied on the payment gateway service fee.
	const gstPct = Math.max(0, toNumberOr(process.env.PAYMENT_GST_PCT, 18))
	return { commissionPct, commissionFlatInr, gstPct }
}

const computePayablePricing = (subtotalInr) => {
	const subtotal = round2(subtotalInr)
	const { commissionPct, commissionFlatInr, gstPct } = getPaymentChargesConfig()

	const commission = round2(subtotal * (commissionPct / 100) + commissionFlatInr)
	const gst = round2(commission * (gstPct / 100))
	const total = round2(subtotal + commission + gst)

	return applyForcedPricing({
		subtotal,
		commission,
		gst,
		total,
		config: { commissionPct, commissionFlatInr, gstPct },
	})
}

const computeOfflinePricing = (subtotalInr) => {
	const subtotal = round2(subtotalInr)
	return {
		subtotal,
		commission: 0,
		gst: 0,
		total: subtotal,
		config: { commissionPct: 0, commissionFlatInr: 0, gstPct: 0 },
	}
}

const requireRazorpayConfig = () => {
	// IMPORTANT: do not initialize Razorpay client at import-time.
	// In ESM, controllers can be evaluated before dotenv.config() runs.
	if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
		const err = new Error('Razorpay is not configured (missing RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET)')
		err.statusCode = 500
		throw err
	}
}

const getRazorpayClient = () => {
	requireRazorpayConfig()
	return new Razorpay({
		key_id: process.env.RAZORPAY_KEY_ID,
		key_secret: process.env.RAZORPAY_KEY_SECRET,
	})
}

const toPaise = (amountInInr) => {
	const n = Number(amountInInr)
	if (!Number.isFinite(n)) return null
	const paise = Math.round(n * 100)
	return Number.isFinite(paise) && paise > 0 ? paise : null
}

const mongoTzFromOffsetMinutes = (minutes) => {
	const sign = minutes >= 0 ? '+' : '-'
	const abs = Math.abs(minutes)
	const hh = String(Math.floor(abs / 60)).padStart(2, '0')
	const mm = String(abs % 60).padStart(2, '0')
	return `${sign}${hh}:${mm}`
}

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const clampInt = (value, { min, max, fallback }) => {
	const n = Number.parseInt(value, 10)
	if (!Number.isFinite(n)) return fallback
	return Math.max(min, Math.min(max, n))
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

	// Business rule: if expiry date is today, member can enter until 11:59pm.
	// For public plans, prefer the selected slot date (calendar date) if present.
	const isPublic = String(planType || '').toLowerCase() === 'public'
	const expirySource = isPublic && publicSlot?.date ? publicSlot.date : expiryDate
	if (!expirySource) return 'expired'

	const eod = endOfUtcDayFromValue(expirySource)
	if (!eod) return 'expired'
	return eod.getTime() >= now ? 'active' : 'expired'
}

const getCategoryPrice = (plan, category) => {
	const normalized = category ? String(category).toLowerCase() : ''
	const match = (plan.categoryPrices || []).find((p) => p.category === normalized)
	return match ? match.price : null
}

const computeAmount = ({ plan, selection }) => {
	const type = plan.type
	const normalizedCategory = selection?.category ? String(selection.category).toLowerCase() : undefined
	const quantity = selection?.quantity ? Number(selection.quantity) : 1

	if (type === 'public') {
		if (!Number.isFinite(quantity) || quantity < 1) return { ok: false, message: 'quantity must be >= 1' }
		return { ok: true, amount: plan.basePrice * quantity, computed: { quantity } }
	}

	if (plan.categoryRequired) {
		if (!normalizedCategory) return { ok: false, message: 'category is required for this plan' }
		const categoryPrice = getCategoryPrice(plan, normalizedCategory)
		if (categoryPrice == null) return { ok: false, message: 'Invalid category for this plan' }
		return { ok: true, amount: categoryPrice, computed: { category: normalizedCategory } }
	}

	let amount = plan.basePrice
	if (type === 'yearly' && selection?.coachingAddOn) {
		amount += plan.addOns?.coachingAddOnMonthly || 0
	}

	return { ok: true, amount, computed: { coachingAddOn: Boolean(selection?.coachingAddOn) } }
}

const ALLOWED_GENDERS = new Set(['male', 'female', 'other'])

const normalizeText = (value) => (value == null ? '' : String(value)).trim()

const normalizePhone10 = (value) => {
	const raw = normalizeText(value)
	if (!raw) return ''
	const digits = raw.replace(/\D/g, '')
	if (!digits) return ''
	if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
	if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
	return digits
}

const validatePhone10 = (value) => /^\d{10}$/.test(String(value || ''))

const normalizeGender = (value) => {
	const raw = normalizeText(value)
	if (!raw) return 'other'
	const g = raw.toLowerCase()
	return ALLOWED_GENDERS.has(g) ? g : null
}

const normalizeAge = (value) => {
	if (value == null || value === '') return { ok: true, age: undefined }
	const n = Number(value)
	if (!Number.isFinite(n)) return { ok: false, message: 'Age must be a number' }
	if (n < 1 || n > 120) return { ok: false, message: 'Age must be between 1 and 120' }
	return { ok: true, age: Math.floor(n) }
}

const normalizeMemberInput = ({ member, label, requireName, requirePhone }) => {
	const name = normalizeText(member?.name)
	const phone = normalizePhone10(member?.phone)
	const gender = normalizeGender(member?.gender)
	const ageRes = normalizeAge(member?.age)

	if (requireName && !name) return { ok: false, message: `${label} name is required` }
	if (requirePhone && !phone) return { ok: false, message: `${label} phone is required` }
	if (phone && !validatePhone10(phone)) return { ok: false, message: `${label} phone must be a valid 10-digit number` }
	if (gender === null) return { ok: false, message: `${label} gender must be one of: male, female, other` }
	if (!ageRes.ok) return { ok: false, message: `${label} ${ageRes.message}` }

	return {
		ok: true,
		member: {
			name,
			phone,
			age: ageRes.age,
			gender: gender || 'other',
		},
	}
}

const isValidTimeHHMM = (value) => {
	const raw = normalizeText(value)
	if (!/^\d{2}:\d{2}$/.test(raw)) return false
	const [h, m] = raw.split(':').map((v) => Number(v))
	return Number.isFinite(h) && Number.isFinite(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59
}

const prepareOfflineMembershipDraft = ({ plan, member, selection, familyMembers }) => {
	const normalizedSelection = selection || {}

	const baseAmountRes = computeAmount({ plan, selection: normalizedSelection })
	if (!baseAmountRes.ok) return { ok: false, message: baseAmountRes.message }

	const pricing = computeOfflinePricing(baseAmountRes.amount)
	const amountRes = {
		...baseAmountRes,
		amount: pricing.total,
		computed: {
			...(baseAmountRes.computed || {}),
			pricing,
		},
	}

	const membershipGroupId = `grp_${crypto.randomUUID().replaceAll('-', '')}`
	const membersToCreate = []

	if (plan.type === 'family') {
		const list = Array.isArray(familyMembers) ? familyMembers : []
		if (!list.length) return { ok: false, message: 'familyMembers is required for family plan' }
		if (plan.maxMembers && list.length > plan.maxMembers) {
			return { ok: false, message: `Maximum ${plan.maxMembers} members allowed for this plan` }
		}

		const contactRes = normalizeMemberInput({ member, label: 'Contact', requireName: true, requirePhone: true })
		if (!contactRes.ok) return { ok: false, message: contactRes.message }

		for (const fm of list) {
			const fmName = normalizeText(fm?.name)
			if (!fmName) return { ok: false, message: 'Each family member requires name' }
			const fmPhone = normalizePhone10(fm?.phone)
			if (fmPhone && !validatePhone10(fmPhone)) return { ok: false, message: 'Family member phone must be a valid 10-digit number' }
			const fmGender = normalizeGender(fm?.gender)
			if (fmGender === null) return { ok: false, message: 'Family member gender must be one of: male, female, other' }
			const fmAgeRes = normalizeAge(fm?.age)
			if (!fmAgeRes.ok) return { ok: false, message: `Family member ${fmAgeRes.message}` }
			membersToCreate.push({
				name: fmName,
				phone: fmPhone || contactRes.member.phone,
				age: fmAgeRes.age,
				gender: fmGender || 'other',
			})
		}
	} else {
		const memberRes = normalizeMemberInput({ member, label: 'Member', requireName: true, requirePhone: true })
		if (!memberRes.ok) return { ok: false, message: memberRes.message }
		membersToCreate.push({
			name: memberRes.member.name,
			phone: memberRes.member.phone,
			age: memberRes.member.age,
			gender: memberRes.member.gender,
		})
	}

	let joinDate = new Date()
	let expiryDate = new Date(joinDate)
	let publicSlot = undefined

	if (plan.type === 'public') {
		if (!isValidTimeHHMM(normalizedSelection?.publicSlot?.startTime)) {
			return { ok: false, message: 'Invalid publicSlot.startTime (use HH:MM)' }
		}
		if (normalizedSelection?.publicSlot?.endTime && !isValidTimeHHMM(normalizedSelection?.publicSlot?.endTime)) {
			return { ok: false, message: 'Invalid publicSlot.endTime (use HH:MM)' }
		}
		const slotRes = resolvePublicSlot(normalizedSelection)
		if (!slotRes.ok) return { ok: false, message: slotRes.message }
		publicSlot = {
			...slotRes.slot,
			quantity: normalizedSelection.quantity ? Number(normalizedSelection.quantity) : 1,
		}
		joinDate = new Date(`${publicSlot.date}T${publicSlot.startTime}:00`)
		expiryDate = new Date(`${publicSlot.date}T${publicSlot.endTime}:00`)
	} else {
		const days = plan.durationInDays || 30
		expiryDate.setDate(expiryDate.getDate() + days)
	}

	return {
		ok: true,
		amountRes,
		normalizedSelection,
		membershipGroupId,
		membersToCreate,
		joinDate,
		expiryDate,
		publicSlot,
	}
}

const prepareMembershipDraft = ({ plan, member, selection, familyMembers }) => {
	const normalizedSelection = selection || {}

	const baseAmountRes = computeAmount({ plan, selection: normalizedSelection })
	if (!baseAmountRes.ok) return { ok: false, message: baseAmountRes.message }

	const pricing = computePayablePricing(baseAmountRes.amount)
	const amountRes = {
		...baseAmountRes,
		amount: pricing.total,
		computed: {
			...(baseAmountRes.computed || {}),
			pricing,
		},
	}
	if (!amountRes.ok) return { ok: false, message: amountRes.message }

	const membershipGroupId = `grp_${crypto.randomUUID().replaceAll('-', '')}`
	const membersToCreate = []

	if (plan.type === 'family') {
		const list = Array.isArray(familyMembers) ? familyMembers : []
		if (!list.length) return { ok: false, message: 'familyMembers is required for family plan' }
		if (plan.maxMembers && list.length > plan.maxMembers) {
			return { ok: false, message: `Maximum ${plan.maxMembers} members allowed for this plan` }
		}
		const contactRes = normalizeMemberInput({ member, label: 'Contact', requireName: true, requirePhone: true })
		if (!contactRes.ok) return { ok: false, message: contactRes.message }

		for (const fm of list) {
			const fmName = normalizeText(fm?.name)
			if (!fmName) return { ok: false, message: 'Each family member requires name' }
			const fmPhone = normalizePhone10(fm?.phone)
			if (fmPhone && !validatePhone10(fmPhone)) return { ok: false, message: 'Family member phone must be a valid 10-digit number' }
			const fmGender = normalizeGender(fm?.gender)
			if (fmGender === null) return { ok: false, message: 'Family member gender must be one of: male, female, other' }
			const fmAgeRes = normalizeAge(fm?.age)
			if (!fmAgeRes.ok) return { ok: false, message: `Family member ${fmAgeRes.message}` }
			membersToCreate.push({
				name: fmName,
				phone: fmPhone || contactRes.member.phone,
				age: fmAgeRes.age,
				gender: fmGender || 'other',
			})
		}
	} else {
		const memberRes = normalizeMemberInput({ member, label: 'Member', requireName: true, requirePhone: true })
		if (!memberRes.ok) return { ok: false, message: memberRes.message }
		membersToCreate.push({
			name: memberRes.member.name,
			phone: memberRes.member.phone,
			age: memberRes.member.age,
			gender: memberRes.member.gender,
		})
	}

	let joinDate = new Date()
	let expiryDate = new Date(joinDate)
	let publicSlot = undefined

	if (plan.type === 'public') {
		if (!isValidTimeHHMM(normalizedSelection?.publicSlot?.startTime)) {
			return { ok: false, message: 'Invalid publicSlot.startTime (use HH:MM)' }
		}
		if (normalizedSelection?.publicSlot?.endTime && !isValidTimeHHMM(normalizedSelection?.publicSlot?.endTime)) {
			return { ok: false, message: 'Invalid publicSlot.endTime (use HH:MM)' }
		}
		const slotRes = resolvePublicSlot(normalizedSelection)
		if (!slotRes.ok) return { ok: false, message: slotRes.message }
		publicSlot = {
			...slotRes.slot,
			quantity: normalizedSelection.quantity ? Number(normalizedSelection.quantity) : 1,
		}
		joinDate = new Date(`${publicSlot.date}T${publicSlot.startTime}:00`)
		expiryDate = new Date(`${publicSlot.date}T${publicSlot.endTime}:00`)
	} else {
		const days = plan.durationInDays || 30
		expiryDate.setDate(expiryDate.getDate() + days)
	}

	return {
		ok: true,
		amountRes,
		normalizedSelection,
		membershipGroupId,
		membersToCreate,
		joinDate,
		expiryDate,
		publicSlot,
	}
}

const createMembersForDraft = async ({ plan, amountRes, membersToCreate, joinDate, expiryDate, publicSlot, membershipGroupId }) => {
	const createdMembers = []
	for (const m of membersToCreate) {
		const doc = await Member.create({
			name: m.name,
			phone: m.phone,
			age: m.age,
			gender: m.gender,
			planId: plan._id,
			planType: plan.type,
			category: amountRes.computed?.category,
			membershipGroupId: plan.type === 'family' ? membershipGroupId : undefined,
			joinDate,
			expiryDate,
			status: computeMemberStatus({ expiryDate, planType: plan.type, publicSlot }),
			publicSlot: plan.type === 'public' ? publicSlot : undefined,
		})

		const qrPayload = `bluefins:member:${doc._id.toString()}`
		const qrCode = await qrcode.toDataURL(qrPayload)
		doc.qrPayload = qrPayload
		doc.qrCode = qrCode
		await doc.save()
		createdMembers.push(doc)
	}
	return createdMembers
}

const finalizePaymentAndCreateMembers = async ({ paymentDoc, providerPaymentId, providerSignature }) => {
	if (!paymentDoc) throw new Error('Payment not found')
	if (paymentDoc.status === 'paid' && Array.isArray(paymentDoc.memberIds) && paymentDoc.memberIds.length) {
		const plan = await MembershipPlan.findById(paymentDoc.planId)
		const members = await Member.find({ _id: { $in: paymentDoc.memberIds } })
		return { plan, payment: paymentDoc, members, member: members[0] || null }
	}

	const plan = await MembershipPlan.findById(paymentDoc.planId)
	if (!plan || plan.isActive === false) throw new Error('Plan not found')

	const membersToCreate = plan.type === 'family'
		? (Array.isArray(paymentDoc.familyMembersDraft) ? paymentDoc.familyMembersDraft : [])
		: [paymentDoc.memberDraft].filter(Boolean)

	if (!membersToCreate.length) throw new Error('No member details found for this payment')

	const draftRes = prepareMembershipDraft({
		plan,
		member: paymentDoc.memberDraft,
		selection: paymentDoc.selection,
		familyMembers: paymentDoc.familyMembersDraft,
	})
	if (!draftRes.ok) throw new Error(draftRes.message)

	const createdMembers = await createMembersForDraft({
		plan,
		amountRes: draftRes.amountRes,
		membersToCreate: draftRes.membersToCreate,
		joinDate: draftRes.joinDate,
		expiryDate: draftRes.expiryDate,
		publicSlot: draftRes.publicSlot,
		membershipGroupId: paymentDoc.membershipGroupId || draftRes.membershipGroupId,
	})

	paymentDoc.status = 'paid'
	paymentDoc.provider = 'razorpay'
	if (providerPaymentId) paymentDoc.paymentId = providerPaymentId
	if (providerSignature) paymentDoc.providerSignature = providerSignature
	paymentDoc.memberId = createdMembers[0]?._id
	paymentDoc.memberIds = createdMembers.map((x) => x._id)
	await paymentDoc.save()

	return { plan, payment: paymentDoc, members: createdMembers, member: createdMembers[0] || null }
}

const resolvePublicSlot = (selection) => {
	const slot = selection?.publicSlot
	if (!slot?.date || !slot?.startTime) {
		return { ok: false, message: 'publicSlot.date and publicSlot.startTime are required' }
	}

	const parts = parseDateOnlyParts(slot.date)
	if (!parts) {
		return { ok: false, message: 'Invalid publicSlot.date (use YYYY-MM-DD)' }
	}
	const normalizedDate = `${String(parts.y).padStart(4, '0')}-${String(parts.m).padStart(2, '0')}-${String(parts.d).padStart(2, '0')}`

	const startTime = String(slot.startTime)
	const endTime = slot.endTime ? String(slot.endTime) : null

	if (!endTime) {
		const [h, m] = startTime.split(':').map((v) => Number(v))
		if (!Number.isFinite(h) || !Number.isFinite(m)) return { ok: false, message: 'Invalid startTime format' }
		const endH = (h + 1) % 24
		const computedEnd = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
		return { ok: true, slot: { date: normalizedDate, startTime, endTime: computedEnd } }
	}

	return { ok: true, slot: { date: normalizedDate, startTime, endTime } }
}

const inferLegacyType = (doc) => {
	// Best-effort inference for older documents that may not have `type`.
	if (doc?.durationInMinutes || doc?.publicEntryWindow) return 'public'
	if (doc?.maxMembers && (doc?.durationInDays || 0) >= 300) return 'family'
	if ((doc?.durationInDays || 0) >= 300) return 'yearly'
	if ((doc?.durationInDays || 0) >= 28 && (doc?.durationInDays || 0) <= 31) return 'monthly'
	if ((doc?.durationInDays || 0) === 15) return 'summer'
	return 'monthly'
}

const normalizePlanForClient = (planDoc) => {
	const raw = planDoc?.toObject ? planDoc.toObject({ virtuals: false }) : planDoc
	const type = raw?.type || inferLegacyType(raw)
	return {
		...raw,
		planName: raw?.planName || raw?.name || 'Membership Plan',
		type,
		basePrice: typeof raw?.basePrice === 'number' ? raw.basePrice : typeof raw?.price === 'number' ? raw.price : 0,
		categoryRequired: Boolean(raw?.categoryRequired),
		categoryPrices: Array.isArray(raw?.categoryPrices) ? raw.categoryPrices : [],
		isActive: typeof raw?.isActive === 'boolean' ? raw.isActive : true,
	}
}

export const listPlans = asyncHandler(async (req, res) => {
	const { isActive } = req.query
	const query = {}
	if (typeof isActive !== 'undefined') query.isActive = isActive === 'true'
	const plans = await MembershipPlan.find(query).sort({ basePrice: 1, price: 1 })
	const charges = getPaymentChargesConfig()
	const testAmountInr = getForcedTestAmountInr()
	res.json({
		success: true,
		data: plans.map(normalizePlanForClient),
		meta: {
			paymentCharges: {
				commissionPct: charges.commissionPct,
				commissionFlatInr: charges.commissionFlatInr,
				gstPct: charges.gstPct,
				gstAppliesOn: 'commission',
			},
			testAmountInr: testAmountInr == null ? undefined : testAmountInr,
		},
	})
})

export const seedOfficialPlans = asyncHandler(async (req, res) => {
	const existing = await MembershipPlan.countDocuments()
	const validExisting = await MembershipPlan.countDocuments({
		planName: { $exists: true, $type: 'string', $ne: '' },
		type: { $exists: true, $type: 'string', $ne: '' },
		basePrice: { $exists: true, $type: 'number' },
	})

	// If legacy plans exist (older fields like `name`/`price`), replace them with the official structure.
	if (existing > 0 && validExisting === 0) {
		await MembershipPlan.deleteMany({})
	}

	// Poster update rule: keep historical records, but ensure only the new poster plans are active.
	// This avoids breaking old payments/members while "completely updating" what users can buy now.
	if (existing > 0 && validExisting > 0) {
		await MembershipPlan.updateMany({}, { $set: { isActive: false } })
	}

	const officialPlans = [
		{
			planName: 'Public Entry (Per Session)',
			type: 'public',
			categoryRequired: false,
			durationInMinutes: 60,
			basePrice: 150,
			publicEntryWindow: { startTime: '10:00', endTime: '15:00' },
			isRecurring: false,
			isActive: true,
		},
		{
			planName: 'Monthly Membership',
			type: 'monthly',
			categoryRequired: false,
			durationInDays: 30,
			basePrice: 2000,
			isRecurring: true,
			isActive: true,
		},
		{
			planName: '3 Monthly Membership',
			type: 'monthly',
			categoryRequired: false,
			durationInDays: 90,
			basePrice: 4999,
			isRecurring: true,
			isActive: true,
		},
		{
			planName: '6 Monthly Membership',
			type: 'yearly',
			categoryRequired: false,
			durationInDays: 180,
			basePrice: 7499,
			isRecurring: true,
			isActive: true,
		},
		{
			planName: 'Yearly Membership',
			type: 'yearly',
			categoryRequired: false,
			durationInDays: 365,
			basePrice: 12000,
			isRecurring: true,
			isActive: true,
		},
		{
			planName: 'Infant Plan (21 Days)',
			type: 'summer',
			categoryRequired: false,
			durationInDays: 21,
			basePrice: 4000,
			isRecurring: false,
			isActive: true,
		},
		{
			planName: 'Family Membership (Max 4 Members)',
			type: 'family',
			categoryRequired: false,
			durationInDays: 365,
			basePrice: 18000,
			maxMembers: 4,
			isRecurring: true,
			isActive: true,
		},
		{
			planName: 'Coaching (One Month)',
			type: 'monthly',
			categoryRequired: false,
			durationInDays: 30,
			basePrice: 4500,
			isRecurring: true,
			isActive: true,
		},
		{
			planName: 'Coaching (15 Days)',
			type: 'summer',
			categoryRequired: false,
			durationInDays: 15,
			basePrice: 3000,
			isRecurring: false,
			isActive: true,
		},
		{
			planName: 'Adult & Ladies Batch (15 Days)',
			type: 'summer',
			categoryRequired: false,
			durationInDays: 15,
			basePrice: 3500,
			isRecurring: false,
			isActive: true,
		},
		{
			planName: 'Special Coaching (Per Month)',
			type: 'monthly',
			categoryRequired: false,
			durationInDays: 30,
			basePrice: 1500,
			isRecurring: true,
			isActive: true,
		},
		{
			planName: 'Exclusive Personal Coaching (Per Session)',
			type: 'public',
			categoryRequired: false,
			durationInMinutes: 60,
			basePrice: 300,
			publicEntryWindow: { startTime: '10:00', endTime: '15:00' },
			isRecurring: false,
			isActive: true,
		},
	]

	const upserted = []
	for (const plan of officialPlans) {
		const resUpsert = await MembershipPlan.updateOne(
			{ type: plan.type, planName: plan.planName },
			{ $set: plan },
			{ upsert: true }
		)
		upserted.push({ planName: plan.planName, type: plan.type, inserted: Boolean(resUpsert.upsertedId) })
	}

	const plans = await MembershipPlan.find({}).sort({ basePrice: 1, price: 1, planName: 1 })
	res.status(201).json({ success: true, message: 'Seed complete', data: plans.map(normalizePlanForClient), meta: { upserted } })
})

export const registerPaidMembership = asyncHandler(async (req, res) => {
	const { planId, member, selection, familyMembers } = req.body
	if (!planId) return res.status(400).json({ success: false, message: 'planId is required' })

	const plan = await MembershipPlan.findById(planId)
	if (!plan || plan.isActive === false) {
		return res.status(404).json({ success: false, message: 'Plan not found' })
	}
	const draftRes = prepareMembershipDraft({ plan, member, selection, familyMembers })
	if (!draftRes.ok) return res.status(400).json({ success: false, message: draftRes.message })

	const orderId = `local_${crypto.randomUUID().replaceAll('-', '')}`
	const paymentId = `paid_${Date.now()}`

	const createdMembers = await createMembersForDraft({
		plan,
		amountRes: draftRes.amountRes,
		membersToCreate: draftRes.membersToCreate,
		joinDate: draftRes.joinDate,
		expiryDate: draftRes.expiryDate,
		publicSlot: draftRes.publicSlot,
		membershipGroupId: draftRes.membershipGroupId,
	})

	const payment = await Payment.create({
		planId: plan._id,
		orderId,
		paymentId,
		amount: draftRes.amountRes.amount,
		pricing: draftRes.amountRes.computed?.pricing,
		currency: 'INR',
		status: 'paid',
		provider: 'cash',
		membershipGroupId: plan.type === 'family' ? draftRes.membershipGroupId : undefined,
		selection: {
			...draftRes.normalizedSelection,
			...draftRes.amountRes.computed,
			publicSlot: draftRes.publicSlot,
		},
		memberDraft: {
			name: member?.name,
			phone: member?.phone,
			age: member?.age,
			gender: member?.gender,
		},
		familyMembersDraft: plan.type === 'family' ? draftRes.membersToCreate : [],
		memberId: createdMembers[0]?._id,
		memberIds: createdMembers.map((x) => x._id),
	})

	res.status(201).json({
		success: true,
		data: {
			plan,
			payment,
			members: createdMembers,
			member: createdMembers[0] || null,
		},
	})
})

export const registerOfflineMembership = asyncHandler(async (req, res) => {
	const { planId, member, selection, familyMembers, collectedBy } = req.body
	if (!planId) return res.status(400).json({ success: false, message: 'planId is required' })
	if (!collectedBy || !String(collectedBy).trim()) {
		return res.status(400).json({ success: false, message: 'collectedBy (admin name) is required' })
	}

	const plan = await MembershipPlan.findById(planId)
	if (!plan || plan.isActive === false) {
		return res.status(404).json({ success: false, message: 'Plan not found' })
	}

	const draftRes = prepareOfflineMembershipDraft({ plan, member, selection, familyMembers })
	if (!draftRes.ok) return res.status(400).json({ success: false, message: draftRes.message })

	const orderId = `cash_${crypto.randomUUID().replaceAll('-', '')}`
	const paymentId = `cash_${Date.now()}`

	const createdMembers = await createMembersForDraft({
		plan,
		amountRes: draftRes.amountRes,
		membersToCreate: draftRes.membersToCreate,
		joinDate: draftRes.joinDate,
		expiryDate: draftRes.expiryDate,
		publicSlot: draftRes.publicSlot,
		membershipGroupId: draftRes.membershipGroupId,
	})

	const payment = await Payment.create({
		planId: plan._id,
		orderId,
		paymentId,
		amount: draftRes.amountRes.amount,
		pricing: draftRes.amountRes.computed?.pricing,
		currency: 'INR',
		status: 'paid',
		provider: 'cash',
		collectedBy: collectedBy ? String(collectedBy).trim() : undefined,
		membershipGroupId: plan.type === 'family' ? draftRes.membershipGroupId : undefined,
		selection: {
			...draftRes.normalizedSelection,
			...draftRes.amountRes.computed,
			publicSlot: draftRes.publicSlot,
		},
		memberDraft: {
			name: member?.name,
			phone: member?.phone,
			age: member?.age,
			gender: member?.gender,
		},
		familyMembersDraft: plan.type === 'family' ? draftRes.membersToCreate : [],
		memberId: createdMembers[0]?._id,
		memberIds: createdMembers.map((x) => x._id),
	})

	res.status(201).json({
		success: true,
		data: {
			plan,
			payment,
			members: createdMembers,
			member: createdMembers[0] || null,
		},
	})
})

export const createRazorpayOrder = asyncHandler(async (req, res) => {
	const razorpay = getRazorpayClient()

	const { planId, member, selection, familyMembers } = req.body
	if (!planId) return res.status(400).json({ success: false, message: 'planId is required' })

	const plan = await MembershipPlan.findById(planId)
	if (!plan || plan.isActive === false) {
		return res.status(404).json({ success: false, message: 'Plan not found' })
	}

	const draftRes = prepareMembershipDraft({ plan, member, selection, familyMembers })
	if (!draftRes.ok) return res.status(400).json({ success: false, message: draftRes.message })

	const amountPaise = toPaise(draftRes.amountRes.amount)
	if (!amountPaise) return res.status(400).json({ success: false, message: 'Invalid amount' })

	const orderId = `local_${crypto.randomUUID().replaceAll('-', '')}`
	const membershipGroupId = plan.type === 'family' ? draftRes.membershipGroupId : undefined

	const paymentDoc = await Payment.create({
		planId: plan._id,
		orderId,
		amount: draftRes.amountRes.amount,
		pricing: draftRes.amountRes.computed?.pricing,
		currency: 'INR',
		status: 'created',
		provider: 'razorpay',
		membershipGroupId,
		selection: {
			...draftRes.normalizedSelection,
			...draftRes.amountRes.computed,
			publicSlot: draftRes.publicSlot,
		},
		memberDraft: {
			name: member?.name,
			phone: member?.phone,
			age: member?.age,
			gender: member?.gender,
		},
		familyMembersDraft: plan.type === 'family' ? draftRes.membersToCreate : [],
	})

	const receipt = `bf_${paymentDoc._id.toString()}`
	const order = await razorpay.orders.create({
		amount: amountPaise,
		currency: 'INR',
		receipt,
		notes: {
			paymentDbId: paymentDoc._id.toString(),
			planId: String(plan._id),
			membershipGroupId: membershipGroupId || '',
		},
	})

	paymentDoc.providerOrderId = order.id
	await paymentDoc.save()

	res.status(201).json({
		success: true,
		data: {
			keyId: process.env.RAZORPAY_KEY_ID,
			orderId: order.id,
			amountPaise,
			currency: 'INR',
			paymentDbId: paymentDoc._id,
			plan: normalizePlanForClient(plan),
		},
	})
})

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
	const razorpay = getRazorpayClient()

	const {
		razorpay_order_id: providerOrderId,
		razorpay_payment_id: providerPaymentId,
		razorpay_signature: providerSignature,
	} = req.body

	if (!providerOrderId || !providerPaymentId || !providerSignature) {
		return res.status(400).json({ success: false, message: 'Missing Razorpay verification fields' })
	}

	const signBody = `${providerOrderId}|${providerPaymentId}`
	const expectedSignature = crypto
		.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
		.update(signBody)
		.digest('hex')

	if (expectedSignature !== providerSignature) {
		return res.status(400).json({ success: false, message: 'Invalid payment signature' })
	}

	const paymentInfo = await razorpay.payments.fetch(providerPaymentId)
	if (!paymentInfo) return res.status(400).json({ success: false, message: 'Payment not found on Razorpay' })
	if (paymentInfo.order_id !== providerOrderId) {
		return res.status(400).json({ success: false, message: 'Order mismatch' })
	}
	if (paymentInfo.status !== 'captured') {
		return res.status(409).json({ success: false, message: `Payment not captured yet (${paymentInfo.status})` })
	}

	const paymentDoc = await Payment.findOne({ providerOrderId })
	if (!paymentDoc) return res.status(404).json({ success: false, message: 'Local payment not found' })

	const expectedPaise = toPaise(paymentDoc.amount)
	if (!expectedPaise || Number(paymentInfo.amount) !== expectedPaise) {
		return res.status(400).json({ success: false, message: 'Amount mismatch' })
	}

	const out = await finalizePaymentAndCreateMembers({
		paymentDoc,
		providerPaymentId,
		providerSignature,
	})

	res.json({ success: true, data: out })
})

export const razorpayWebhook = asyncHandler(async (req, res) => {
	const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
	if (!webhookSecret) return res.status(500).send('Webhook secret not configured')
	const signature = req.headers['x-razorpay-signature']
	if (!signature) return res.status(400).send('Missing signature')
	if (!req.rawBody) return res.status(400).send('Missing rawBody (server misconfigured)')

	const expected = crypto
		.createHmac('sha256', webhookSecret)
		.update(req.rawBody)
		.digest('hex')

	if (expected !== signature) return res.status(400).send('Invalid signature')

	const event = req.body
	const eventType = String(event?.event || '')
	if (eventType === 'payment.captured') {
		const entity = event?.payload?.payment?.entity
		const providerOrderId = entity?.order_id
		const providerPaymentId = entity?.id
		if (providerOrderId && providerPaymentId) {
			const paymentDoc = await Payment.findOne({ providerOrderId })
			if (paymentDoc && paymentDoc.status !== 'paid') {
				const expectedPaise = toPaise(paymentDoc.amount)
				if (expectedPaise && Number(entity?.amount) === expectedPaise) {
					try {
						await finalizePaymentAndCreateMembers({ paymentDoc, providerPaymentId })
					} catch {
						// swallow to keep webhook 200; retries can happen
					}
				}
			}
		}
	}

	res.status(200).send('ok')
})

export const listMembers = asyncHandler(async (req, res) => {
	const { q, status, planType, page, limit, sort, order } = req.query

	const filter = {}
	if (status && ['active', 'expired'].includes(String(status))) {
		filter.status = String(status)
	}
	if (planType && String(planType).trim()) {
		filter.planType = String(planType).trim()
	}

	if (q && String(q).trim()) {
		const rx = new RegExp(escapeRegExp(String(q).trim()), 'i')
		filter.$or = [{ name: rx }, { phone: rx }, { membershipGroupId: rx }]
	}

	const pageNum = clampInt(page, { min: 1, max: 100000, fallback: 1 })
	const limitNum = clampInt(limit, { min: 1, max: 100, fallback: 25 })
	const skip = (pageNum - 1) * limitNum

	const sortField = ['createdAt', 'expiryDate', 'joinDate', 'name'].includes(String(sort))
		? String(sort)
		: 'createdAt'
	const sortDir = String(order).toLowerCase() === 'asc' ? 1 : -1
	const sortObj = { [sortField]: sortDir }

	const [total, members] = await Promise.all([
		Member.countDocuments(filter),
		Member.find(filter)
			.populate('planId', 'planName type basePrice')
			.sort(sortObj)
			.skip(skip)
			.limit(limitNum),
	])

	// Compute visit counts (unique attendance days) for the current page.
	// IMPORTANT: This is used only as an upward backfill. We never decrease the stored
	// attendanceDaysCount, so purging attendance history does not reduce member counts.
	const memberIds = members.map((m) => m._id)
	const tz = mongoTzFromOffsetMinutes(BUSINESS_TZ_OFFSET_MINUTES)
	const countsAgg = memberIds.length
		? await Attendance.aggregate([
			{ $match: { memberId: { $in: memberIds }, result: 'accepted' } },
			{
				$project: {
					memberId: 1,
					dayKey: {
						$ifNull: [
							'$date',
							{ $dateToString: { format: '%Y-%m-%d', date: '$scannedAt', timezone: tz } },
						],
					},
				},
			},
			{ $group: { _id: { memberId: '$memberId', dayKey: '$dayKey' } } },
			{ $group: { _id: '$_id.memberId', count: { $sum: 1 } } },
		])
		: []

	const countMap = new Map(countsAgg.map((r) => [String(r._id), Number(r.count || 0)]))

	// Upward-only sync stored counts (best effort) so it's available as a persistent field.
	const bulk = []
	for (const m of members) {
		const computed = countMap.get(String(m._id)) || 0
		const stored = Math.max(0, Number(m.attendanceDaysCount || 0))
		const next = Math.max(stored, computed)
		if (stored !== next) {
			bulk.push({
				updateOne: {
					filter: { _id: m._id },
					update: { $set: { attendanceDaysCount: next } },
				},
			})
		}
	}
	if (bulk.length) {
		try {
			await Member.bulkWrite(bulk, { ordered: false })
		} catch {
			// ignore sync errors
		}
	}

	const items = members.map((m) => {
		const plan = m.planId && typeof m.planId === 'object' ? m.planId : null
		const computedStatus = computeMemberStatus({ expiryDate: m.expiryDate, planType: m.planType, publicSlot: m.publicSlot })
		const computed = countMap.get(String(m._id)) || 0
		const stored = Math.max(0, Number(m.attendanceDaysCount || 0))
		const computedVisits = Math.max(stored, computed)
		return {
			_id: m._id,
			name: m.name,
			phone: m.phone,
			age: m.age,
			gender: m.gender,
			planType: m.planType,
			plan: plan
				? {
						_id: plan._id,
						planName: plan.planName,
						type: plan.type,
						basePrice: plan.basePrice,
				  }
				: null,
			category: m.category,
			membershipGroupId: m.membershipGroupId,
			joinDate: m.joinDate,
			expiryDate: m.expiryDate,
			status: computedStatus,
			attendanceDaysCount: computedVisits,
			publicSlot: m.publicSlot,
			qrCode: m.qrCode,
			qrPayload: m.qrPayload,
			createdAt: m.createdAt,
			updatedAt: m.updatedAt,
		}
	})

	res.json({
		success: true,
		data: {
			items,
			total,
			page: pageNum,
			limit: limitNum,
		},
	})
})

export const deleteMember = asyncHandler(async (req, res) => {
	const { id } = req.params
	if (!id) return res.status(400).json({ success: false, message: 'id is required' })

	const deleted = await Member.findByIdAndDelete(id)
	if (!deleted) {
		return res.status(404).json({ success: false, message: 'Member not found' })
	}

	res.json({ success: true, message: 'Member deleted' })
})

export const bulkDeleteMembersByIds = asyncHandler(async (req, res) => {
	const ids = req.body?.ids
	if (!Array.isArray(ids) || ids.length === 0) {
		return res.status(400).json({ success: false, message: 'ids (array) is required' })
	}
	if (ids.length > 500) {
		return res.status(400).json({ success: false, message: 'Too many ids (max 500 per request)' })
	}

	const normalizedIds = ids
		.map((x) => (x == null ? '' : String(x).trim()))
		.filter(Boolean)

	if (!normalizedIds.length) {
		return res.status(400).json({ success: false, message: 'No valid ids provided' })
	}

	const out = await Member.deleteMany({ _id: { $in: normalizedIds } })
	res.json({ success: true, message: 'Members deleted', data: { deletedCount: Number(out?.deletedCount || 0) } })
})
