// Parses a date value into a Date object, returns null if invalid
/**
 * What it is: Date/time formatting helpers.
 * Non-tech note: Converts dates into human-readable text (like “05 Mar 2026”).
 */

const toDate = value => {
    if (!value) return null
    const d = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(d.getTime())) return null
    return d
};

// Formats a date value as a localized time string (e.g. '02:30 PM')
export const formatTime = (value, { seconds = false, locale = 'en-US' } = {}) => {
    const d = toDate(value)
    if (!d) return ''
    return d.toLocaleTimeString(locale, {
		hour: '2-digit',
		minute: '2-digit',
		...(seconds ? { second: '2-digit' } : {}),
		hour12: true,
	})
};

// Formats a date value as a localized date+time string (e.g. '05 Mar 2026, 02:30 PM')
export const formatDateTime = (
    value,
    {
		year = 'numeric',
		month = 'short',
		day = '2-digit',
		hour = '2-digit',
		minute = '2-digit',
		second,
	} = {},
    { locale = 'en-US' } = {}
) => {
    const d = toDate(value)
    if (!d) return ''
    return d.toLocaleString(locale, {
		year,
		month,
		day,
		hour,
		minute,
		...(second ? { second } : {}),
		hour12: true,
	})
};

// Converts 24-hour time string 'HH:MM' to 12-hour format (e.g. '14:30' -> '2:30 PM')
export const formatHHmmTo12Hour = value => {
    if (!value) return ''
    const s = String(value).trim()
    const match = /^(\d{1,2}):(\d{2})$/.exec(s)
    if (!match) return s

    const hours24 = Number.parseInt(match[1], 10)
    const minutes = match[2]
    if (!Number.isFinite(hours24) || hours24 < 0 || hours24 > 23) return s

    const period = hours24 >= 12 ? 'PM' : 'AM'
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
    return `${hours12}:${minutes} ${period}`
};
