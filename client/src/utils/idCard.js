// Loads an image from a URL and returns a Promise that resolves to the Image element
/**
 * What it is: ID card / QR related helpers (image loading + download).
 * Non-tech note: Used when the app needs to create or download a card/QR.
 */

const loadImage = src => {
    return new Promise(
    // Creates an HTML Image, resolves with it on load, rejects on error
    (resolve, reject) => {
        const img = new Image()
        // Resolve the promise when the image finishes loading
        img.onload = () => {
            return resolve(img);
        }
        // Reject the promise if the QR image fails to load
        img.onerror = () => {
            return reject(new Error('Failed to load QR image'));
        }
        img.src = src
    });
};

// Attempts to load an image, returns null instead of throwing on failure
const tryLoadImage = async src => {
    try {
		return await loadImage(src)
	} catch {
		return null
	}
};

// Triggers a browser file download from a data URL (used for ID card PNG)
const downloadDataUrl = (dataUrl, filename) => {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
};

// Extracts the last N characters of a member ID for display (e.g. 'BF-A3C2E9F1')
const safeIdSuffix = (id, length = 8) => {
    const s = id == null ? '' : String(id)
    const n = Number.isFinite(Number(length)) ? Math.max(1, Math.min(24, Number(length))) : 8
    return s.length > n ? s.slice(-n) : s
};

// Formats a date as a readable string for the ID card (e.g. 'Mar 05, 2026')
const formatDate = value => {
    if (!value) return ''
    const d = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
};

// Draws a rectangle with rounded corners on the canvas (card background/panels)
const roundedRect = (ctx, x, y, w, h, r) => {
    const rr = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + rr, y)
    ctx.arcTo(x + w, y, x + w, y + h, rr)
    ctx.arcTo(x + w, y + h, x, y + h, rr)
    ctx.arcTo(x, y + h, x, y, rr)
    ctx.arcTo(x, y, x + w, y, rr)
    ctx.closePath()
};

// Truncates text with '...' if it exceeds the maximum pixel width on the canvas
const ellipsizeToWidth = (ctx, text, maxWidth) => {
    const raw = text == null ? '' : String(text)
    if (!raw) return ''
    if (ctx.measureText(raw).width <= maxWidth) return raw
    const ellipsis = '…'
    let lo = 0
    let hi = raw.length
    while (lo < hi) {
		const mid = Math.floor((lo + hi) / 2)
		const candidate = raw.slice(0, mid) + ellipsis
		if (ctx.measureText(candidate).width <= maxWidth) lo = mid + 1
		else hi = mid
	}
    const cut = Math.max(0, lo - 1)
    return raw.slice(0, cut) + ellipsis
};

// Sets the canvas font with the specified weight, size, and family
const setFont = (
    ctx,
    { weight, size, family = 'system-ui, -apple-system, Segoe UI, Roboto, Arial' }
) => {
    ctx.font = `${weight} ${size}px ${family}`
};

// Finds the largest font size (down to min) where the text fits within maxWidth pixels
const fitTextSize = ({ ctx, text, maxWidth, weight, start, min }) => {
    let size = start
    for (; size >= min; size -= 1) {
		setFont(ctx, { weight, size })
		if (ctx.measureText(text).width <= maxWidth) return size
	}
    return min
};

// Wraps text into multiple lines that fit within maxWidth, ellipsizing the last line if needed
const wrapTextLines = ({ ctx, text, maxWidth, maxLines }) => {
    const raw = text == null ? '' : String(text).trim()
    if (!raw) return ['—']
    const words = raw.split(/\s+/).filter(Boolean)
    const lines = []
    let line = ''
    for (const w of words) {
		const next = line ? `${line} ${w}` : w
		if (ctx.measureText(next).width <= maxWidth) {
			line = next
			continue
		}
		if (line) lines.push(line)
		line = w
		if (lines.length >= maxLines - 1) break
	}
    if (lines.length < maxLines && line) lines.push(line)
    if (lines.length > maxLines) lines.length = maxLines
    if (lines.length === maxLines) {
		lines[maxLines - 1] = ellipsizeToWidth(ctx, lines[maxLines - 1], maxWidth)
	}
    return lines.length ? lines : ['—']
};

// Generates the Bluefins member ID card as a PNG data URL with name, QR code, plan, and dates
export const buildMemberIdCardPng = async (
    {
        name,
        memberId,
        qrDataUrl,
        planName,
        joinDate,
        expiryDate,
        logoSrc = '/assets/Logo.png',
    }
) => {
    if (!memberId) throw new Error('Missing member id')
    if (!qrDataUrl) throw new Error('Missing QR')

    const canvas = document.createElement('canvas')
    canvas.width = 1000
    canvas.height = 600
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')

    // Background
    const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    bg.addColorStop(0, '#070B16')
    bg.addColorStop(0.5, '#0A1022')
    bg.addColorStop(1, '#070B16')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Outer card
    const cardX = 26
    const cardY = 26
    const cardW = canvas.width - 52
    const cardH = canvas.height - 52
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    roundedRect(ctx, cardX, cardY, cardW, cardH, 26)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'
    ctx.lineWidth = 2
    ctx.stroke()

    // Inner main panel
    const panelX = 54
    const panelY = 78
    const panelW = canvas.width - 108
    const panelH = 468
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    roundedRect(ctx, panelX, panelY, panelW, panelH, 24)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.stroke()

    // Header branding
    const logo = await tryLoadImage(logoSrc)
    if (logo) {
		ctx.save()
		ctx.globalAlpha = 0.95
		ctx.drawImage(logo, 60, 40, 46, 46)
		ctx.restore()
	}
    ctx.fillStyle = '#00FFD4'
    ctx.font = '900 24px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    ctx.fillText('BLUEFINS', logo ? 116 : 60, 72)
    ctx.fillStyle = 'rgba(255,255,255,0.70)'
    ctx.font = '700 13px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    ctx.fillText('Aquatic Solutions • Member Card', logo ? 116 : 60, 94)

    // Split layout: left info + right QR (half card)
    const splitGap = 18
    const leftX = panelX + 18
    const leftY = panelY + 18
    const leftW = Math.floor((panelW - splitGap) / 2)
    const leftH = panelH - 36

    const rightX = leftX + leftW + splitGap
    const rightY = leftY
    const rightW = panelX + panelW - 18 - rightX
    const rightH = leftH

    // Left panel background
    const leftBg = ctx.createLinearGradient(leftX, leftY, leftX + leftW, leftY + leftH)
    leftBg.addColorStop(0, 'rgba(0, 255, 212, 0.10)')
    leftBg.addColorStop(0.6, 'rgba(0, 153, 255, 0.08)')
    leftBg.addColorStop(1, 'rgba(255, 255, 255, 0.06)')
    ctx.fillStyle = leftBg
    roundedRect(ctx, leftX, leftY, leftW, leftH, 20)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.stroke()

    // Right panel background (QR area)
    ctx.fillStyle = '#ffffff'
    roundedRect(ctx, rightX, rightY, rightW, rightH, 20)
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'
    ctx.stroke()

    // Fields
    const customerId = `BF-${safeIdSuffix(memberId, 8).toUpperCase()}`
    const joinedText = formatDate(joinDate) || '—'
    const expiryText = formatDate(expiryDate) || '—'
    const planText = String(planName || '—')
    const contentMaxW = leftW - 40

    ctx.fillStyle = 'rgba(255,255,255,0.82)'
    ctx.font = '800 12px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    ctx.fillText('MEMBER NAME', leftX + 20, leftY + 50)
    ctx.fillStyle = 'rgba(255,255,255,0.96)'
    const displayName = (name || 'Member').toUpperCase()
    const nameSize = fitTextSize({ ctx, text: displayName, maxWidth: contentMaxW, weight: 900, start: 26, min: 18 })
    setFont(ctx, { weight: 900, size: nameSize })
    ctx.fillText(ellipsizeToWidth(ctx, displayName, contentMaxW), leftX + 20, leftY + 86)

    ctx.fillStyle = 'rgba(255,255,255,0.82)'
    ctx.font = '800 12px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    ctx.fillText('MEMBER ID (LAST 8)', leftX + 20, leftY + 128)
    ctx.fillStyle = '#00FFD4'
    const idSize = fitTextSize({ ctx, text: customerId, maxWidth: contentMaxW, weight: 900, start: 28, min: 22 })
    setFont(ctx, { weight: 900, size: idSize })
    ctx.fillText(customerId, leftX + 20, leftY + 166)

    ctx.fillStyle = 'rgba(255,255,255,0.82)'
    ctx.font = '800 12px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    ctx.fillText('PLAN', leftX + 20, leftY + 210)
    ctx.fillStyle = 'rgba(255,255,255,0.94)'
    const planBaseSize = fitTextSize({ ctx, text: planText, maxWidth: contentMaxW, weight: 900, start: 18, min: 14 })
    setFont(ctx, { weight: 900, size: planBaseSize })
    const planLines = wrapTextLines({ ctx, text: planText, maxWidth: contentMaxW, maxLines: 2 })
    const planLineH = Math.round(planBaseSize * 1.25)
    ctx.fillText(planLines[0], leftX + 20, leftY + 236)
    if (planLines[1]) ctx.fillText(planLines[1], leftX + 20, leftY + 236 + planLineH)

    ctx.fillStyle = 'rgba(255,255,255,0.82)'
    ctx.font = '800 12px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    ctx.fillText('JOINED', leftX + 20, leftY + 304)
    ctx.fillStyle = 'rgba(255,255,255,0.94)'
    ctx.font = '900 16px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    ctx.fillText(joinedText, leftX + 20, leftY + 328)

    ctx.fillStyle = 'rgba(255,255,255,0.82)'
    ctx.font = '800 12px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    ctx.fillText('EXPIRES', leftX + 20, leftY + 370)
    ctx.fillStyle = 'rgba(255,255,255,0.94)'
    ctx.font = '900 16px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    ctx.fillText(expiryText, leftX + 20, leftY + 394)

    ctx.fillStyle = 'rgba(255,255,255,0.60)'
    ctx.font = '700 12px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    ctx.fillText('Scan QR for verification', leftX + 20, leftY + leftH - 24)

    // QR block (takes ~half the card)
    const qrImg = await loadImage(qrDataUrl)
    const qrPadding = 22
    const qrSize = Math.floor(Math.min(rightW, rightH) - qrPadding * 2)
    const qrX = rightX + Math.floor((rightW - qrSize) / 2)
    const qrY = rightY + Math.floor((rightH - qrSize) / 2)
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

    // Footer (full id)
    ctx.fillStyle = 'rgba(255,255,255,0.38)'
    ctx.font = '700 12px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    ctx.fillText(`Member ID: ${String(memberId)}`, cardX + 18, cardY + cardH - 14)

    return canvas.toDataURL('image/png')
};

// Downloads the generated Bluefins member ID card PNG to the user's device
export const downloadMemberIdCard = async ({ name, memberId, qrDataUrl, planName, joinDate, expiryDate }) => {
    const png = await buildMemberIdCardPng({ name, memberId, qrDataUrl, planName, joinDate, expiryDate })
    const filename = `bluefins-id-${safeIdSuffix(memberId, 8)}.png`
    downloadDataUrl(png, filename)
    return png
};
