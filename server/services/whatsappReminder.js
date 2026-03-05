/**
 * What it is: WhatsApp membership expiry reminder service (scheduled job).
 * Non-tech note: Sends reminder messages to members before their plan expires.
 */

import cron from 'node-cron'
import Member from '../src/models/Member.js'

const TZ = 'Asia/Kolkata'
const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Purpose: Do Ymd In Time Zone
 * Plain English: What this function is used for.
 */
const ymdInTimeZone = (date, timeZone) => {
    const fmt = new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	})
    return fmt.format(date)
};

/**
 * Purpose: Do Day Index From Ymd
 * Plain English: What this function is used for.
 */
const dayIndexFromYmd = ymd => {
    const [y, m, d] = String(ymd).split('-').map(/**
     * Purpose: Array mapping callback (converts each item to a new value)
     * Plain English: What this function is used for.
     */
    x => {
        return Number(x);
    })
    if (!y || !m || !d) return null
    return Math.floor(Date.UTC(y, m - 1, d) / MS_PER_DAY)
};

/**
 * Purpose: Do Days Left In Time Zone
 * Plain English: What this function is used for.
 */
const daysLeftInTimeZone = (expiryDate, now, timeZone) => {
    if (!expiryDate) return null
    const nowYmd = ymdInTimeZone(now, timeZone)
    const expYmd = ymdInTimeZone(new Date(expiryDate), timeZone)
    const nowIdx = dayIndexFromYmd(nowYmd)
    const expIdx = dayIndexFromYmd(expYmd)
    if (nowIdx == null || expIdx == null) return null
    return expIdx - nowIdx
};

/**
 * Purpose: Do Normalize Whats App To
 * Plain English: What this function is used for.
 */
const normalizeWhatsAppTo = rawPhone => {
    const cc = String(process.env.WA_DEFAULT_COUNTRY_CODE || '91').trim()
    const digits = String(rawPhone || '').replace(/\D/g, '')
    if (!digits) return null

    if (digits.length === 10) return `${cc}${digits}`
    if (digits.length === 11 && digits.startsWith('0')) return `${cc}${digits.slice(1)}`
    if (digits.length >= 11 && digits.length <= 15) return digits
    return null
};

/**
 * Purpose: Build Renew Url
 * Plain English: What this function is used for.
 */
const buildRenewUrl = memberId => {
    const base = String(process.env.APP_BASE_URL || 'https://yourapp.com').replace(/\/+$/, '')
    return `${base}/pay?memberId=${encodeURIComponent(String(memberId))}`
};

/**
 * Purpose: Get Whats App Api Version
 * Plain English: What this function is used for.
 */
const getWhatsAppApiVersion = () => {
    // Backward compatible: some envs use WA_VERSION
    return String(process.env.WA_API_VERSION || process.env.WA_VERSION || 'v19.0').trim()
};

export /**
 * Purpose: Send Whats App Text
 * Plain English: What this function is used for.
 */
const sendWhatsAppText = async ({ to, body }) => {
    const phoneId = String(process.env.WA_PHONE_ID || '').trim()
    const token = String(process.env.WA_TOKEN || '').trim()
    const version = getWhatsAppApiVersion()

    if (!phoneId) throw new Error('Missing WA_PHONE_ID')
    if (!token) throw new Error('Missing WA_TOKEN')
    if (!to) throw new Error('Missing destination phone')
    if (!body) throw new Error('Missing message body')

    const url = `https://graph.facebook.com/${version}/${phoneId}/messages`
    const res = await fetch(url, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			messaging_product: 'whatsapp',
			to,
			type: 'text',
			text: { preview_url: false, body },
		}),
	})

    const json = await res.json().catch(/**
     * Purpose: Promise error handler (runs when async work fails)
     * Plain English: What this function is used for.
     */
    () => {
        return null;
    })
    if (!res.ok) {
		const msg = json?.error?.message || `WhatsApp API error (${res.status})`
		throw new Error(msg)
	}
    return json
};

export /**
 * Purpose: Send Whats App Template Message
 * Plain English: What this function is used for.
 */
const sendWhatsAppTemplateMessage = async ({ to, templateName, templateLang = 'en_US', bodyParams = [] } = {}) => {
    const phoneId = String(process.env.WA_PHONE_ID || '').trim()
    const token = String(process.env.WA_TOKEN || '').trim()
    const version = getWhatsAppApiVersion()

    const name = String(templateName || '').trim()
    const lang = String(templateLang || '').trim() || 'en_US'
    if (!name) throw new Error('Missing template name')
    if (!phoneId) throw new Error('Missing WA_PHONE_ID')
    if (!token) throw new Error('Missing WA_TOKEN')
    if (!to) throw new Error('Missing destination phone')

    const params = Array.isArray(bodyParams) ? bodyParams : []
    const url = `https://graph.facebook.com/${version}/${phoneId}/messages`
    const res = await fetch(url, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			messaging_product: 'whatsapp',
			to,
			type: 'template',
			template: {
				name,
				language: { code: lang },
				components: [
					{
						type: 'body',
						parameters: params.map(/**
                         * Purpose: Array mapping callback (converts each item to a new value)
                         * Plain English: What this function is used for.
                         */
                        p => {
                            return ({
                                type: 'text',
                                text: String(p ?? '')
                            });
                        }),
					},
				],
			},
		}),
	})

    const json = await res.json().catch(/**
     * Purpose: Promise error handler (runs when async work fails)
     * Plain English: What this function is used for.
     */
    () => {
        return null;
    })
    if (!res.ok) {
		const msg = json?.error?.message || `WhatsApp API error (${res.status})`
		throw new Error(msg)
	}
    return json
};

export /**
 * Purpose: Send Whats App Template
 * Plain English: What this function is used for.
 */
const sendWhatsAppTemplate = async ({ to, name, daysLeft, renewUrl }) => {
    const phoneId = String(process.env.WA_PHONE_ID || '').trim()
    const token = String(process.env.WA_TOKEN || '').trim()
    const version = getWhatsAppApiVersion()
    const templateName = String(process.env.WA_TEMPLATE_NAME || '').trim()
    const templateLang = String(process.env.WA_TEMPLATE_LANG || 'en_US').trim()

    if (!templateName) throw new Error('Missing WA_TEMPLATE_NAME')
    if (!phoneId) throw new Error('Missing WA_PHONE_ID')
    if (!token) throw new Error('Missing WA_TOKEN')
    if (!to) throw new Error('Missing destination phone')

    const url = `https://graph.facebook.com/${version}/${phoneId}/messages`
    const res = await fetch(url, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			messaging_product: 'whatsapp',
			to,
			type: 'template',
			template: {
				name: templateName,
				language: { code: templateLang },
				components: [
					{
						type: 'body',
						parameters: [
							{ type: 'text', text: String(name || '') },
							{ type: 'text', text: String(daysLeft) },
							{ type: 'text', text: String(renewUrl || '') },
						],
					},
				],
			},
		}),
	})

    const json = await res.json().catch(/**
     * Purpose: Promise error handler (runs when async work fails)
     * Plain English: What this function is used for.
     */
    () => {
        return null;
    })
    if (!res.ok) {
		const msg = json?.error?.message || `WhatsApp API error (${res.status})`
		throw new Error(msg)
	}
    return json
};

export /**
 * Purpose: Send Whats App Expiry Reminders
 * Plain English: What this function is used for.
 */
const sendWhatsAppExpiryReminders = async ({ now = new Date(), dryRun = false } = {}) => {
    const enabled = String(process.env.WA_REMINDERS_ENABLED || '').toLowerCase()
    if (enabled && enabled !== 'true' && enabled !== '1' && enabled !== 'yes') {
		return { ok: true, skipped: true, reason: 'WA_REMINDERS_ENABLED is off' }
	}

    const targetDays = [30, 15, 7, 3]
    const windowMax = new Date(now.getTime() + 31 * MS_PER_DAY)

    const members = await Member.find({
		status: 'active',
		expiryDate: { $gte: now, $lte: windowMax },
	}).select({ name: 1, phone: 1, expiryDate: 1 })

    let considered = 0
    let matched = 0
    let sent = 0
    let failed = 0

    for (const member of members) {
		considered += 1
		const daysLeft = daysLeftInTimeZone(member.expiryDate, now, TZ)
		if (!targetDays.includes(daysLeft)) continue
		matched += 1

		const to = normalizeWhatsAppTo(member.phone)
		if (!to) {
			failed += 1
			console.log(`⚠️ WhatsApp reminder skipped (bad phone): member=${member._id}`)
			continue
		}

		const name = String(member.name || '').trim() || 'there'
		const renewUrl = buildRenewUrl(member._id)
		const body = `Hi ${name}! ${daysLeft} days left. Renew: ${renewUrl}`
		const templateName = String(process.env.WA_TEMPLATE_NAME || '').trim()

		try {
			if (dryRun) {
				sent += 1
				console.log(`[DRY RUN] WhatsApp -> ${to}: ${body}`)
				continue
			}

			if (templateName) {
				await sendWhatsAppTemplate({ to, name, daysLeft, renewUrl })
			} else {
				await sendWhatsAppText({ to, body })
			}
			sent += 1
			console.log(`✅ WhatsApp reminder sent: member=${member._id} daysLeft=${daysLeft}`)
		} catch (e) {
			failed += 1
			console.log(`❌ WhatsApp send failed: member=${member._id} error=${e.message}`)
		}
	}

    return { ok: true, considered, matched, sent, failed }
};

export /**
 * Purpose: Run on a schedule (cron job)
 * Plain English: What this function is used for.
 */
const startWhatsAppExpiryReminderCron = () => {
    const schedule = String(process.env.WA_REMINDER_CRON || '0 2 * * *')
    const dryRun = String(process.env.WA_DRY_RUN || '').toLowerCase()
    const isDryRun = dryRun === 'true' || dryRun === '1' || dryRun === 'yes'

    cron.schedule(
		schedule,
		/**
         * Purpose: Helper callback used inside a larger operation
         * Plain English: What this function is used for.
         */
        async () => {
            try {
				console.log(`🕑 WhatsApp reminder cron triggered (${TZ})`) 
				const res = await sendWhatsAppExpiryReminders({ dryRun: isDryRun })
				if (res?.skipped) console.log(`ℹ️ WhatsApp reminders skipped: ${res.reason}`)
				else console.log(`📨 WhatsApp reminders done: sent=${res.sent} failed=${res.failed} matched=${res.matched}`)
			} catch (e) {
				console.log(`❌ WhatsApp reminder cron error: ${e.message}`)
			}
        },
		{ timezone: TZ }
	)

    console.log(`⏰ WhatsApp reminder cron scheduled: "${schedule}" (${TZ})`)
    if (isDryRun) console.log('ℹ️ WA_DRY_RUN is enabled (no messages will be sent)')
};
