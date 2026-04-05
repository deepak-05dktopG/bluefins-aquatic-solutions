/**
 * What it is: Membership + payments controller.
 * Non-tech note: Handles memberships, renewals, and payment-related actions.
 */

import crypto from 'crypto'
import qrcode from 'qrcode'
import asyncHandler from 'express-async-handler'
import Razorpay from 'razorpay'
import MembershipPlan from '../models/MembershipPlan.js'
import Member from '../models/Member.js'
import Payment from '../models/Payment.js'
import Attendance from '../models/Attendance.js'
import DailyTracker from '../models/DailyTracker.js'

const BUSINESS_TZ_OFFSET_MINUTES = Number.parseInt(process.env.BUSINESS_TZ_OFFSET_MINUTES || '330', 10)

// Returns the forced test payment amount (₹1 etc.) from env vars when test mode is enabled
const getForcedTestAmountInr = () => {
	const enabledRaw = process.env.ENABLE_TEST_MODE
	const enabled = String(enabledRaw || '').trim().toLowerCase()
	if (!(enabled === 'true' || enabled === '1' || enabled === 'yes')) return null

	const raw = process.env.FORCE_TEST_AMOUNT_INR
	if (raw == null || String(raw).trim() === '') return null
	const n = Number(raw)
	if (!Number.isFinite(n) || n <= 0) return null
	return Math.round((n + Number.EPSILON) * 100) / 100
};

/**
 * Returns the current date (YYYY-MM-DD) and time (HH:mm) adjusted to India timezone (UTC+5.5).
 */
const getIndiaNow = () => {
	const now = new Date()
	const offset = BUSINESS_TZ_OFFSET_MINUTES * 60 * 1000
	const india = new Date(now.getTime() + offset)
	return {
		date: india.toISOString().slice(0, 10),
		time: india.toISOString().slice(11, 16),
	}
}

// Overrides real pricing with the test amount when test mode is active
const applyForcedPricing = pricing => {
	const forced = getForcedTestAmountInr()
	if (forced == null) return pricing
	return {
		subtotal: forced,
		commission: 0,
		gst: 0,
		total: forced,
		config: { commissionPct: 0, commissionFlatInr: 0, gstPct: 0 },
	}
};

// Safely converts a value to a number, returning fallback if not finite
const toNumberOr = (value, fallback) => {
	const n = Number(value)
	return Number.isFinite(n) ? n : fallback
};

// Rounds a number to 2 decimal places (for currency calculations in INR)
const round2 = value => {
	const n = Number(value)
	if (!Number.isFinite(n)) return 0
	return Math.round((n + Number.EPSILON) * 100) / 100
};

// Reads Razorpay gateway commission and GST percentages from environment variables
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
};

// Calculates total payable amount including Razorpay commission and GST on the commission
const computePayablePricing = subtotalInr => {
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
};

// Returns pricing with zero commission/GST for offline (cash/counter) memberships
const computeOfflinePricing = subtotalInr => {
	const subtotal = round2(subtotalInr)
	return {
		subtotal,
		commission: 0,
		gst: 0,
		total: subtotal,
		config: { commissionPct: 0, commissionFlatInr: 0, gstPct: 0 },
	}
};

// Throws if RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET env vars are missing
const requireRazorpayConfig = () => {
	// IMPORTANT: do not initialize Razorpay client at import-time.
	// In ESM, controllers can be evaluated before dotenv.config() runs.
	if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
		const err = new Error('Razorpay is not configured (missing RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET)')
		err.statusCode = 500
		throw err
	}
};

// Creates a new Razorpay SDK client instance using env credentials
const getRazorpayClient = () => {
	requireRazorpayConfig()
	return new Razorpay({
		key_id: process.env.RAZORPAY_KEY_ID,
		key_secret: process.env.RAZORPAY_KEY_SECRET,
	})
};

// Converts INR amount to paise (₹1 = 100 paise) for Razorpay API
const toPaise = amountInInr => {
	const n = Number(amountInInr)
	if (!Number.isFinite(n)) return null
	const paise = Math.round(n * 100)
	return Number.isFinite(paise) && paise > 0 ? paise : null
};

// Converts timezone offset minutes (e.g. 330 for IST) to MongoDB timezone string (+05:30)
const mongoTzFromOffsetMinutes = minutes => {
	const sign = minutes >= 0 ? '+' : '-'
	const abs = Math.abs(minutes)
	const hh = String(Math.floor(abs / 60)).padStart(2, '0')
	const mm = String(abs % 60).padStart(2, '0')
	return `${sign}${hh}:${mm}`
};

// Escapes regex special characters in member search queries for safe MongoDB $regex usage
const escapeRegExp = value => {
	return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Safely parses an integer within min/max bounds (used for pagination page/limit)
const clampInt = (value, { min, max, fallback }) => {
	const n = Number.parseInt(value, 10)
	if (!Number.isFinite(n)) return fallback
	return Math.max(min, Math.min(max, n))
};

// Parses a date string (YYYY-MM-DD or DD/MM/YYYY) into year, month, day parts
const parseDateOnlyParts = value => {
	const s = value == null ? '' : String(value).trim()
	if (!s) return null

	// YYYY-MM-DD
	if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
		const [yy, mm, dd] = s.split('-').map(
			// Convert each date segment string to a number
			x => {
				return Number(x);
			})
		if (!Number.isFinite(yy) || !Number.isFinite(mm) || !Number.isFinite(dd)) return null
		return { y: yy, m: mm, d: dd }
	}

	// DD/MM/YYYY
	if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
		const [dd, mm, yy] = s.split('/').map(
			// Convert each date segment string to a number
			x => {
				return Number(x);
			})
		if (!Number.isFinite(yy) || !Number.isFinite(mm) || !Number.isFinite(dd)) return null
		return { y: yy, m: mm, d: dd }
	}

	return null
};

// Returns a Date object set to 23:59:59.999 UTC for the given year/month/day
const endOfUtcDayFromParts = parts => {
	if (!parts) return null
	const { y, m, d } = parts
	const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 23, 59, 59, 999))
	return Number.isNaN(dt.getTime()) ? null : dt
};

// Returns end-of-day (23:59:59.999 UTC) for a date value, used for membership expiry comparisons
const endOfUtcDayFromValue = value => {
	const parts = parseDateOnlyParts(value)
	if (parts) return endOfUtcDayFromParts(parts)
	const d = value instanceof Date ? value : new Date(value)
	if (Number.isNaN(d.getTime())) return null
	return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999))
};

// Determines if a member's subscription is 'active' or 'expired' based on expiry/public slot date
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
};

// Looks up per-category price (e.g. junior/senior) if the plan requires category-based pricing
const getCategoryPrice = (plan, category) => {
	const normalized = category ? String(category).toLowerCase() : ''
	const match = (plan.categoryPrices || []).find(
		// Find the price entry matching the selected category
		p => {
			return p.category === normalized;
		})
	return match ? match.price : null
};

// Calculates the membership amount based on plan type, quantity, category, and coaching add-ons
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
};

const ALLOWED_GENDERS = new Set(['male', 'female', 'other'])

// Trims whitespace from user input field values
const normalizeText = value => {
	return (value == null ? '' : String(value)).trim();
};

// Strips country code (91) and leading zero to normalize Indian phone numbers to 10 digits
const normalizePhone10 = value => {
	const raw = normalizeText(value)
	if (!raw) return ''
	const digits = raw.replace(/\D/g, '')
	if (!digits) return ''
	if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
	if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
	return digits
};

// Checks if a phone number is exactly 10 digits (Indian mobile number format)
const validatePhone10 = value => {
	return /^\d{10}$/.test(String(value || ''));
};

// Normalizes gender input to 'male', 'female', or 'other'; returns null if invalid
const normalizeGender = value => {
	const raw = normalizeText(value)
	if (!raw) return 'other'
	const g = raw.toLowerCase()
	return ALLOWED_GENDERS.has(g) ? g : null
};

// Validates and normalizes member age (must be 1-120), returns undefined if not provided
const normalizeAge = value => {
	if (value == null || value === '') return { ok: true, age: undefined }
	const n = Number(value)
	if (!Number.isFinite(n)) return { ok: false, message: 'Age must be a number' }
	if (n < 1 || n > 120) return { ok: false, message: 'Age must be between 1 and 120' }
	return { ok: true, age: Math.floor(n) }
};

// Validates and normalizes a single member's details (name, phone, age, gender) from form input
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
};

// Validates that a time string is in HH:MM 24-hour format (e.g. '14:30')
const isValidTimeHHMM = value => {
	const raw = normalizeText(value)
	if (!/^\d{2}:\d{2}$/.test(raw)) return false
	const [h, m] = raw.split(':').map(
		// Parse hour and minute strings to numbers
		v => {
			return Number(v);
		})
	return Number.isFinite(h) && Number.isFinite(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59
};

// Prepares an offline (cash) membership draft: validates member details, calculates pricing without gateway fees
const prepareOfflineMembershipDraft = ({ plan, member, selection, familyMembers, joinDateOverride, expiryDateOverride }) => {
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

	// Resolve join date — use admin override if provided and valid, else default to now
	const parseOverrideDate = (value) => {
		if (!value) return null
		const d = new Date(String(value).trim())
		return isNaN(d.getTime()) ? null : d
	}

	let joinDate = parseOverrideDate(joinDateOverride) || new Date()
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
		// Use admin-provided expiry if valid; otherwise compute from join + plan duration
		const overrideExpiry = parseOverrideDate(expiryDateOverride)
		if (overrideExpiry) {
			// Set to end of that day so active-check doesn't cut off mid-day
			overrideExpiry.setUTCHours(23, 59, 59, 999)
			expiryDate = overrideExpiry
		} else {
			const days = plan.durationInDays || 30
			expiryDate.setDate(expiryDate.getDate() + days - 1)  // -1 so the join day counts as day 1
			expiryDate.setUTCHours(23, 59, 59, 999)
		}
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
};


// Prepares an online (Razorpay) membership draft: validates member details, calculates pricing with commission/GST
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
};

// Creates Member documents in MongoDB and generates QR codes for each member's ID card
const createMembersForDraft = async (
	{ plan, amountRes, membersToCreate, joinDate, expiryDate, publicSlot, membershipGroupId }
) => {
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
};

// Marks payment as 'paid', creates member records, and generates QR codes after successful Razorpay payment
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
	paymentDoc.memberIds = createdMembers.map(
		// Collect created member IDs to link with the payment record
		x => {
			return x._id;
		})
	await paymentDoc.save()

	return { plan, payment: paymentDoc, members: createdMembers, member: createdMembers[0] || null }
};

// Validates and normalizes a public batch time slot (date, start/end times) for pool entry
const resolvePublicSlot = selection => {
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
		const [h, m] = startTime.split(':').map(
			// Parse hour and minute to numbers for computing the default end time
			v => {
				return Number(v);
			})
		if (!Number.isFinite(h) || !Number.isFinite(m)) return { ok: false, message: 'Invalid startTime format' }
		const endH = (h + 1) % 24
		const computedEnd = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
		return { ok: true, slot: { date: normalizedDate, startTime, endTime: computedEnd } }
	}

	return { ok: true, slot: { date: normalizedDate, startTime, endTime } }
};

// Infers plan type (public/family/yearly/monthly/summer) for legacy plans missing the 'type' field
const inferLegacyType = doc => {
	// Best-effort inference for older documents that may not have `type`.
	if (doc?.durationInMinutes || doc?.publicEntryWindow) return 'public'
	if (doc?.maxMembers && (doc?.durationInDays || 0) >= 300) return 'family'
	if ((doc?.durationInDays || 0) >= 300) return 'yearly'
	if ((doc?.durationInDays || 0) >= 28 && (doc?.durationInDays || 0) <= 31) return 'monthly'
	if ((doc?.durationInDays || 0) === 15) return 'summer'
	return 'monthly'
};

// Normalizes a plan document for the frontend with consistent field names and defaults
const normalizePlanForClient = planDoc => {
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
};

// Admin: Create a new membership plan
export const createPlan = asyncHandler(async (req, res) => {
	const plan = await MembershipPlan.create(req.body);
	res.json({ success: true, data: normalizePlanForClient(plan) });
});

// Admin: Update an existing membership plan
export const updatePlan = asyncHandler(async (req, res) => {
	const plan = await MembershipPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
	if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
	res.json({ success: true, data: normalizePlanForClient(plan) });
});

// Admin: Delete a membership plan
export const deletePlan = asyncHandler(async (req, res) => {
	const plan = await MembershipPlan.findByIdAndDelete(req.params.id);
	if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
	res.json({ success: true, message: 'Plan deleted successfully' });
});

// Returns all membership plans with pricing, charges config, and test mode info for the frontend
export const listPlans = asyncHandler(async (req, res) => {
	try {
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
	} catch (err) {
		console.error('Error in listPlans:', err);
		res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
	}
});

// Seeds the official Bluefins poster plans into the database (upserts to avoid duplicates)
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
			planName: 'Public Batch (Per Session)',
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
			basePrice: 3000,
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
			type: 'monthly',
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
			planName: 'Infant (Per Month)',
			type: 'monthly',
			categoryRequired: false,
			durationInDays: 30,
			basePrice: 4000,
			isRecurring: true,
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
			planName: 'One Month Coaching',
			type: 'monthly',
			categoryRequired: false,
			durationInDays: 30,
			basePrice: 4500,
			isRecurring: true,
			isActive: true,
		},
		{
			planName: '15 Days Coaching',
			type: 'summer',
			categoryRequired: false,
			durationInDays: 15,
			basePrice: 3000,
			isRecurring: false,
			isActive: true,
		},
		{
			planName: '15 Days Adult & Ladies Batch',
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

// Registers a paid membership (cash/direct): creates members and records payment immediately
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
		memberIds: createdMembers.map(
			// Collect created member IDs to link with the payment record
			x => {
				return x._id;
			}),
	})

	// Add to DailyTracker (use discounted/final price)
	try {
		const indiaNow = getIndiaNow();
		// Use the final price after discount (if available)
		const finalAmount = (payment.pricing && typeof payment.pricing.total === 'number')
			? payment.pricing.total
			: payment.amount;
		await DailyTracker.create({
			type: plan?.planName || plan?.name || 'Registration',
			name: member?.name || 'New Member',
			paymentType: (payment.provider || 'cash').toLowerCase(),
			amount: finalAmount,
			date: indiaNow.date,
			time: indiaNow.time,
			notes: `Plan: ${plan?.planName || plan?.name || ''}`,
			memberId: createdMembers[0]?._id,
			paymentId: payment._id,
		});
	} catch (e) { /* ignore tracker errors */ }
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

import { incrementCashBox } from './grocerCashBoxController.js';
// Registers an offline membership (admin counter): creates members with no gateway fees, records cash payment
export const registerOfflineMembership = asyncHandler(async (req, res) => {
	const { planId, member, selection, familyMembers, collectedBy, paymentMethod, discountAmt, paidAmount: paidAmountRaw, joinDate: joinDateOverride, expiryDate: expiryDateOverride } = req.body;
	if (!planId) return res.status(400).json({ success: false, message: 'planId is required' });
	if (!collectedBy || !String(collectedBy).trim()) {
		return res.status(400).json({ success: false, message: 'collectedBy (admin name) is required' });
	}
	// Only allow 'cash' or 'gpay' as payment methods
	const allowedMethods = ['cash', 'gpay'];
	const method = (paymentMethod || 'cash').toLowerCase();
	if (!allowedMethods.includes(method)) {
		return res.status(400).json({ success: false, message: 'Only cash or gpay are allowed as payment methods.' });
	}

	const plan = await MembershipPlan.findById(planId);
	if (!plan || plan.isActive === false) {
		return res.status(404).json({ success: false, message: 'Plan not found' });
	}


	// Parse discount amount (from frontend, default 0)
	const discountAmountInput = Number(discountAmt) || 0;

	// Prepare draft and apply discount logic (pass date overrides for backdating existing members)
	let draftRes = prepareOfflineMembershipDraft({ plan, member, selection, familyMembers, joinDateOverride, expiryDateOverride });
	if (!draftRes.ok) return res.status(400).json({ success: false, message: draftRes.message });

	// Apply discount to pricing if needed
	if (discountAmountInput > 0 && draftRes.amountRes && draftRes.amountRes.computed && draftRes.amountRes.computed.pricing) {
		const baseAmount = draftRes.amountRes.computed.pricing.subtotal ?? draftRes.amountRes.amount;
		const discountAmount = Math.min(baseAmount, Math.max(0, discountAmountInput));
		const totalAfterDiscount = Math.max(0, Math.round((baseAmount - discountAmount) * 100) / 100);
		draftRes.amountRes.computed.pricing.discountPct = undefined;
		draftRes.amountRes.computed.pricing.discountAmount = discountAmount;
		draftRes.amountRes.computed.pricing.total = totalAfterDiscount;
		draftRes.amountRes.amount = totalAfterDiscount;
	}

	const orderId = `${method}_${crypto.randomUUID().replaceAll('-', '')}`;
	const paymentId = `${method}_${Date.now()}`;

	// Calculate final amount (after discount)
	const finalAmount = (draftRes.amountRes.computed?.pricing?.total != null)
		? draftRes.amountRes.computed.pricing.total
		: draftRes.amountRes.amount;

	// Partial payment: how much was actually paid now
	const paidNow = (paidAmountRaw != null && !isNaN(Number(paidAmountRaw)))
		? Math.max(0, Math.min(Number(paidAmountRaw), finalAmount))
		: finalAmount;
	const pendingAmt = Math.max(0, Math.round((finalAmount - paidNow) * 100) / 100);
	const paymentStatusVal = pendingAmt <= 0 ? 'paid' : (paidNow <= 0 ? 'pending' : 'partial');

	const createdMembers = await createMembersForDraft({
		plan,
		amountRes: draftRes.amountRes,
		membersToCreate: draftRes.membersToCreate,
		joinDate: draftRes.joinDate,
		expiryDate: draftRes.expiryDate,
		publicSlot: draftRes.publicSlot,
		membershipGroupId: draftRes.membershipGroupId,
	});

	const payment = await Payment.create({
		planId: plan._id,
		orderId,
		paymentId,
		amount: draftRes.amountRes.amount,
		pricing: draftRes.amountRes.computed?.pricing,
		currency: 'INR',
		status: 'paid',
		provider: method,
		paymentMethod: method,
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
		memberIds: createdMembers.map(x => x._id),
	});

	// Stamp payment fields on all created members
	if (createdMembers.length > 0) {
		await Member.updateMany(
			{ _id: { $in: createdMembers.map(m => m._id) } },
			{ $set: { paidAmount: paidNow, pendingAmount: pendingAmt, paymentStatus: paymentStatusVal } }
		);
		createdMembers.forEach(m => {
			m.paidAmount = paidNow;
			m.pendingAmount = pendingAmt;
			m.paymentStatus = paymentStatusVal;
		});
	}

	// Add to DailyTracker — only log the amount actually collected now
	try {
		const indiaNow = getIndiaNow();
		const trackerDate = joinDateOverride ? String(joinDateOverride).slice(0, 10) : indiaNow.date;
		await DailyTracker.create({
			type: plan?.planName || plan?.name || 'Registration',
			name: member?.name || 'New Member',
			paymentType: (payment.provider || 'cash').toLowerCase(),
			amount: paidNow,
			date: trackerDate,
			time: indiaNow.time,
			notes: `Plan: ${plan?.planName || plan?.name || ''}${pendingAmt > 0 ? ` | Pending: ₹${pendingAmt}` : ''}`,
			memberId: createdMembers[0]?._id,
			paymentId: payment._id,
		});
		// Update GrocerCashBox for the amount collected now
		try {
			await incrementCashBox({
				amount: paidNow,
				paymentType: payment.provider,
				entryType: plan?.planName || plan?.name || 'Registration',
				entryCountDelta: 1,
				entryTotalDelta: paidNow
			});
		} catch (e) { /* ignore cash box errors */ }
	} catch (e) { /* ignore tracker errors */ }
	res.status(201).json({
		success: true,
		data: {
			plan,
			payment,
			members: createdMembers,
			member: createdMembers[0] || null,
		},
	})
});

// Creates a Razorpay order for a selected plan and stores the pending payment in the database
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

// Verifies Razorpay payment signature, confirms capture, and creates member records on success
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
	// Add to DailyTracker (online registration, use final amount if available)
	try {
		const indiaNow = getIndiaNow();
		const finalAmount = (paymentDoc.pricing && typeof paymentDoc.pricing.total === 'number')
			? paymentDoc.pricing.total
			: paymentDoc.amount;
		await DailyTracker.create({
			type: out?.plan?.planName || out?.plan?.name || 'Registration',
			name: paymentDoc?.memberDraft?.name || 'New Member',
			paymentType: (paymentDoc.provider || 'gpay').toLowerCase(),
			amount: finalAmount,
			date: indiaNow.date,
			time: indiaNow.time,
			notes: `Plan: ${out?.plan?.planName || out?.plan?.name || ''}`,
			memberId: out?.member?._id,
			paymentId: paymentDoc._id,
		});
	} catch (e) { /* ignore tracker errors */ }
	res.json({ success: true, data: out })
})

// Handles Razorpay webhook events (payment.captured) to finalize payments server-side
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

// Returns paginated, searchable member list with plan details and attendance counts for admin panel
export const listMembers = asyncHandler(async (req, res) => {
	const { q, status, paymentStatus, planType, planId, page, limit, sort, order } = req.query
	const filter = {}
	if (status) {
		if (['active', 'expired'].includes(String(status))) {
			filter.status = String(status)
		} else if (status === 'has-pending') {
			filter.pendingAmount = { $gt: 0 };
		} else if (status === 'paid') {
			filter.paymentStatus = 'paid';
		}
	}
	if (paymentStatus) {
		if (paymentStatus === 'has-pending') {
			filter.pendingAmount = { $gt: 0 };
		} else if (['paid', 'partial', 'pending'].includes(String(paymentStatus))) {
			filter.paymentStatus = String(paymentStatus);
		}
	}
	if (planType && String(planType).trim()) {
		filter.planType = String(planType).trim()
	}
	if (planId && String(planId).trim()) {
		filter.planId = String(planId).trim()
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
	const memberIds = members.map(
		// Extract member IDs for the attendance aggregation query
		m => {
			return m._id;
		})
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

	const countMap = new Map(countsAgg.map(
		// Build a memberId-to-visitCount lookup map from the aggregation result
		r => {
			return [String(r._id), Number(r.count || 0)];
		}))

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

	const items = members.map(
		// Build the enriched member response object with computed status and visit counts
		m => {
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
				paidAmount: m.paidAmount,
				pendingAmount: m.pendingAmount,
				paymentStatus: m.paymentStatus,
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

// Deletes a single member record by ID
export const deleteMember = asyncHandler(async (req, res) => {
	const { id } = req.params
	if (!id) return res.status(400).json({ success: false, message: 'id is required' })

	const deleted = await Member.findByIdAndDelete(id)
	if (!deleted) {
		return res.status(404).json({ success: false, message: 'Member not found' })
	}

	res.json({ success: true, message: 'Member deleted' })
})

// Updates an existing member's details directly from the Admin members list
export const updateMember = asyncHandler(async (req, res) => {
	const { id } = req.params;
	if (!id) return res.status(400).json({ success: false, message: 'Member ID is required' });

	const { name, phone, planId, joinDate, expiryDate, paidAmount, pendingAmount, paymentStatus } = req.body;

	const member = await Member.findById(id);
	if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

	// Validate inputs
	if (name !== undefined) member.name = normalizeText(name);
	if (phone !== undefined) {
		const normPhone = normalizePhone10(phone);
		if (normPhone && !validatePhone10(normPhone)) {
			return res.status(400).json({ success: false, message: 'Phone must be a valid 10-digit number' });
		}
		member.phone = normPhone;
	}

	// Update Plan if provided
	if (planId && String(planId) !== String(member.planId)) {
		const plan = await MembershipPlan.findById(planId);
		if (!plan) return res.status(404).json({ success: false, message: 'Target plan not found' });
		member.planId = plan._id;
		member.planType = plan.type;
	} else if (!member.planType && member.planId) {
		// Just in case it's a legacy record missing planType, infer it
		const plan = await MembershipPlan.findById(member.planId);
		if (plan) {
			member.planType = plan.type || inferLegacyType(plan);
		}
	}

	// Update dates if provided
	if (joinDate !== undefined && joinDate !== null) {
		const d = new Date(String(joinDate).trim());
		if (!isNaN(d.getTime())) {
			member.joinDate = d;
		}
	}

	if (expiryDate !== undefined && expiryDate !== null) {
		const d = new Date(String(expiryDate).trim());
		if (!isNaN(d.getTime())) {
			// For non-public plans we want expiry at 23:59:59.999 UTC
			if (member.planType !== 'public') {
				d.setUTCHours(23, 59, 59, 999);
			}
			// If expiry date changed, reset WhatsApp reminder flags for the new cycle
			if (member.expiryDate?.getTime() !== d.getTime()) {
				member.reminderSent7 = false;
				member.reminderSent3 = false;
				member.reminderSent1 = false;
			}
			member.expiryDate = d;
		}
	}

	// Update partial payment fields if provided
	if (paidAmount !== undefined && paidAmount !== '' && !isNaN(Number(paidAmount))) {
		member.paidAmount = Math.max(0, Number(paidAmount));
	}
	if (pendingAmount !== undefined && pendingAmount !== '' && !isNaN(Number(pendingAmount))) {
		member.pendingAmount = Math.max(0, Number(pendingAmount));
	}
	if (paymentStatus !== undefined && ['paid', 'partial', 'pending'].includes(paymentStatus)) {
		member.paymentStatus = paymentStatus;
	} else if (member.paidAmount != null) {
		// Auto-recalculate paymentStatus if not explicitly set
		if (member.pendingAmount <= 0) member.paymentStatus = 'paid';
		else if (member.paidAmount <= 0) member.paymentStatus = 'pending';
		else member.paymentStatus = 'partial';
	}

	// Recalculate status based on new dates
	const newStatus = computeMemberStatus({
		expiryDate: member.expiryDate,
		planType: member.planType,
		publicSlot: undefined // public slotted edits aren't specifically handled here beyond standard expiryDate UI
	});
	member.status = newStatus;

	await member.save();

	// Return the populated member back so the frontend can update its state
	const updated = await Member.findById(member._id).populate('planId', 'planName type categoryRequired');

	const mObj = updated.toObject();
	mObj.plan = mObj.planId ? { planName: mObj.planId.planName } : null; // map for frontend format match

	res.json({ success: true, message: 'Member updated', data: mObj });
});

// Deletes multiple members at once by an array of IDs (max 500 per request)
export const bulkDeleteMembersByIds = asyncHandler(async (req, res) => {
	const ids = req.body?.ids
	if (!Array.isArray(ids) || ids.length === 0) {
		return res.status(400).json({ success: false, message: 'ids (array) is required' })
	}
	if (ids.length > 500) {
		return res.status(400).json({ success: false, message: 'Too many ids (max 500 per request)' })
	}

	const normalizedIds = ids
		.map(
			// Convert each ID to a trimmed string
			x => {
				return (x == null ? '' : String(x).trim());
			})
		.filter(Boolean)

	if (!normalizedIds.length) {
		return res.status(400).json({ success: false, message: 'No valid ids provided' })
	}

	const out = await Member.deleteMany({ _id: { $in: normalizedIds } })
	res.json({ success: true, message: 'Members deleted', data: { deletedCount: Number(out?.deletedCount || 0) } })
})

// Publicly fetch limited member data for ID card generation (unauthenticated)
export const getPublicMemberData = asyncHandler(async (req, res) => {
	const { id } = req.params;
	if (!id) return res.status(400).json({ success: false, message: 'Member ID is required' });

	const member = await Member.findById(id).populate('planId', 'planName type categoryRequired categoryPrices');
	if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

	res.json({
		success: true,
		data: {
			_id: member._id,
			name: member.name,
			phone: member.phone,
			joinDate: member.joinDate,
			expiryDate: member.expiryDate,
			status: member.status,
			qrCode: member.qrCode,
			planName: member.planId ? member.planId.planName : 'Membership'
		}
	});
});
