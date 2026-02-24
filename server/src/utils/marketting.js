import Marketting from '../models/Marketting.js'

const normalizeText = (value) => (value == null ? '' : String(value)).trim()

const normalizeWhatsApp10 = (value) => {
	const raw = normalizeText(value)
	if (!raw) return ''
	const digits = raw.replace(/\D/g, '')
	if (!digits) return ''
	if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
	if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
	if (digits.length > 10) return digits.slice(-10)
	return digits
}

const isValidWhatsApp10 = (value) => /^\d{10}$/.test(String(value || ''))

export const upsertMarkettingLead = async ({ customerName, whatsappNumber, source } = {}) => {
	const normalizedNumber = normalizeWhatsApp10(whatsappNumber)
	if (!isValidWhatsApp10(normalizedNumber)) return null

	const name = normalizeText(customerName)
	const src = normalizeText(source)

	const update = {
		$setOnInsert: { whatsappNumber: normalizedNumber },
		...(src ? { $addToSet: { sources: src } } : {}),
		...(name ? { $set: { customerName: name } } : {}),
	}

	return Marketting.findOneAndUpdate(
		{ whatsappNumber: normalizedNumber },
		update,
		{ upsert: true, new: true, setDefaultsOnInsert: true }
	)
}
