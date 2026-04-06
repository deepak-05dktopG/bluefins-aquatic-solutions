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
        // Allow drawing remote images onto canvas without tainting it (when server sends CORS headers).
        // Needed so `canvas.toDataURL()` still works with online backgrounds.
        img.crossOrigin = 'anonymous'
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

// Extracts the last N characters of a member ID (used for filenames / compact display)
const safeIdSuffix = (id, length = 8) => {
    const s = id == null ? '' : String(id)
    const n = Number.isFinite(Number(length)) ? Math.max(1, Math.min(24, Number(length))) : 8
    return s.length > n ? s.slice(-n) : s
};

// Sanitize strings for safe filenames on Windows/macOS/Linux.
const toSafeFilenamePart = (value, fallback = 'NA') => {
    const raw = value == null ? '' : String(value)
    const base = raw
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '-')
        .replace(/\.+$/g, '')
        .replace(/-+/g, '-')

    // Remove ASCII control chars without triggering eslint(no-control-regex).
    const cleaned = Array.from(base).filter(ch => ch.charCodeAt(0) >= 32).join('')
    return cleaned || fallback
}

const toSafePhonePart = (value, fallback = 'NA') => {
    const raw = value == null ? '' : String(value)
    const digits = raw.replace(/\D+/g, '')
    return digits || fallback
}

// Formats a date as a readable string for the ID card (e.g. 'Mar 05, 2026')
const formatDate = value => {
    if (!value) return ''
    try {
        let isoString = value instanceof Date ? value.toISOString() : (typeof value === 'string' ? value : new Date(value).toISOString());
        if (!isoString || !isoString.includes('-')) return '';
        const datePart = isoString.split('T')[0];
        const [year, month, day] = datePart.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthName = months[parseInt(month, 10) - 1] || month;
        return `${monthName} ${day}, ${year}`;
    } catch (e) {
        return '';
    }
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

// Wrap text without truncating (no ellipsis). Breaks long tokens if needed.
const wrapTextLines = (ctx, text, maxWidth, maxLines = 2) => {
    const raw = text == null ? '' : String(text)
    const clean = raw.replace(/\s+/g, ' ').trim()
    if (!clean) return ['']

    const words = clean.split(' ')
    const lines = []
    let current = ''

    const push = () => {
        if (current) lines.push(current)
        current = ''
    }

    const pushBrokenToken = token => {
        let chunk = ''
        for (const ch of token) {
            const candidate = chunk + ch
            if (ctx.measureText(candidate).width <= maxWidth) chunk = candidate
            else {
                if (chunk) lines.push(chunk)
                chunk = ch
                if (lines.length >= maxLines) return
            }
        }
        if (chunk && lines.length < maxLines) lines.push(chunk)
    }

    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word
        if (ctx.measureText(candidate).width <= maxWidth) {
            current = candidate
            continue
        }

        if (!current) {
            pushBrokenToken(word)
            if (lines.length >= maxLines) return lines.slice(0, maxLines)
            continue
        }

        push()
        if (lines.length >= maxLines) return lines.slice(0, maxLines)
        current = word
    }

    push()
    return lines.length ? lines.slice(0, maxLines) : ['']
}

// (Intentional) No ellipsis helper: all text should be shown.

const ID_CARD_FONT_FAMILY = 'Outfit'
const ID_CARD_FONT_STACK = `'${ID_CARD_FONT_FAMILY}', 'Poppins', system-ui, -apple-system, Segoe UI, Roboto, Arial`

let idCardFontsReadyPromise
const ensureIdCardFontsLoaded = async () => {
    if (idCardFontsReadyPromise) return idCardFontsReadyPromise

    idCardFontsReadyPromise = (async () => {
        if (typeof document === 'undefined' || !document.fonts || !document.fonts.load) return

        const family = ID_CARD_FONT_FAMILY
        await Promise.all([
            document.fonts.load(`900 54px ${family}`),
            document.fonts.load(`900 42px ${family}`),
            document.fonts.load(`800 16px ${family}`),
            document.fonts.load(`700 28px ${family}`),
            document.fonts.load(`600 28px ${family}`),
            document.fonts.load(`600 12px ${family}`),
        ])

        await document.fonts.ready
    })()

    return idCardFontsReadyPromise
}

// Sets the canvas font with the specified weight, size, and family
const setFont = (
    ctx,
    { weight, size, family = ID_CARD_FONT_STACK }
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

// Generates a modern swimming academy member ID card as a PNG data URL (premium aquatic theme)
export const buildMemberIdCardPng = async (
    {
        name,
        memberId,
        qrDataUrl,
        planName,
        joinDate,
        expiryDate,
        logoSrc = '/assets/poolimages/idlogo.png',
        // Online swimming-themed background (free photo CDN). If it fails to load, we fall back to gradients.
        // Tip: If your deployment blocks CORS for remote images, download this image and serve it from /public instead.
        // Local background (fast + reliable + no CORS/network issues)
        backgroundSrc = '/assets/poolimages/chair-background-hotel-summer-sky.jpeg',
        academyName = 'KUBERALAXMI SPORTS ACADEMY',
        rightStripText: _rightStripText = 'MEMBER',
    }
) => {
    if (!memberId) throw new Error('Missing member id')
    if (!qrDataUrl) throw new Error('Missing QR')

    const canvas = document.createElement('canvas')
    // Match the reference card proportions (horizontal) for consistent layout.
    canvas.width = 1000
    canvas.height = 600
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')

    // Ensure Google Fonts are ready so the PNG export uses the modern typeface.
    await ensureIdCardFontsLoaded()

    // Palette tuned to the reference image
    const gold = '#C9A24B'
    const gold2 = '#D9B45C'

    const cardPad = 24
    const cardX = cardPad
    const cardY = cardPad
    const cardW = canvas.width - cardPad * 2
    const cardH = canvas.height - cardPad * 2
    const r = 28

    const drawCover = (img, x, y, w, h) => {
        const iw = img.naturalWidth || img.width
        const ih = img.naturalHeight || img.height
        const scale = Math.max(w / iw, h / ih)
        const sw = w / scale
        const sh = h / scale
        const sx = Math.max(0, (iw - sw) / 2)
        const sy = Math.max(0, (ih - sh) / 2)
        ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
    }

    // Shadow
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.38)'
    ctx.shadowBlur = 20
    ctx.shadowOffsetY = 10
    ctx.fillStyle = 'rgba(0,0,0,0.10)'
    roundedRect(ctx, cardX, cardY, cardW, cardH, r)
    ctx.fill()
    ctx.restore()

    // Clip to card
    ctx.save()
    roundedRect(ctx, cardX, cardY, cardW, cardH, r)
    ctx.clip()

    // Full background photo (pool)
    const bgImg = await tryLoadImage(backgroundSrc)
    if (bgImg) {
        drawCover(bgImg, cardX, cardY, cardW, cardH)
    } else {
        const fallback = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH)
        fallback.addColorStop(0, '#18B7B5')
        fallback.addColorStop(0.55, '#0E8BAE')
        fallback.addColorStop(1, '#0A6F9A')
        ctx.fillStyle = fallback
        ctx.fillRect(cardX, cardY, cardW, cardH)
    }

    // Teal overlay wash (to match the reference tint)
    const wash = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH)
    wash.addColorStop(0, 'rgba(15,166,173,0.18)')
    wash.addColorStop(0.55, 'rgba(15,166,173,0.10)')
    wash.addColorStop(1, 'rgba(8,35,57,0.22)')
    ctx.fillStyle = wash
    ctx.fillRect(cardX, cardY, cardW, cardH)

    // Gold outer frame
    ctx.save()
    ctx.strokeStyle = gold2
    ctx.lineWidth = 10
    roundedRect(ctx, cardX + 5, cardY + 5, cardW - 10, cardH - 10, r)
    ctx.stroke()
    ctx.restore()

    // Inner light frame
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'
    ctx.lineWidth = 3
    roundedRect(ctx, cardX + 14, cardY + 14, cardW - 28, cardH - 28, r - 6)
    ctx.stroke()
    ctx.restore()

    // Right MEMBER strip removed per requirement.

    // Header area with curved divider
    const innerLeft = cardX + 22
    const innerRight = cardX + cardW - 22
    const innerTop = cardY + 22
    const innerBottom = cardY + cardH - 22
    const innerW = innerRight - innerLeft

    // Split layout: right half reserved for QR panel (top-to-bottom).
    // Defined early so header text can be constrained to the left half.
    const splitX = innerLeft + Math.round(innerW * 0.50)

    const headerH = 170
    const headerBottomY = innerTop + headerH
    // Stronger multi-wave curve
    const curveLift = 36
    const curveDrop = 26

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(innerLeft, innerTop)
    ctx.lineTo(innerRight, innerTop)
    ctx.lineTo(innerRight, headerBottomY + curveDrop)
    // Two-wave bottom edge (right -> left)
    ctx.bezierCurveTo(
        innerLeft + innerW * 0.82,
        headerBottomY + curveLift,
        innerLeft + innerW * 0.70,
        headerBottomY - curveLift,
        innerLeft + innerW * 0.50,
        headerBottomY + Math.round(curveDrop * 0.55)
    )
    ctx.bezierCurveTo(
        innerLeft + innerW * 0.30,
        headerBottomY + curveLift,
        innerLeft + innerW * 0.18,
        headerBottomY - curveLift,
        innerLeft,
        headerBottomY + curveDrop
    )
    ctx.closePath()
    const hdr = ctx.createLinearGradient(innerLeft, innerTop, innerLeft, headerBottomY + 40)
    // Swimming pool blue header background
    hdr.addColorStop(0, 'rgba(8, 35, 57, 1)')
    hdr.addColorStop(0.55, 'rgba(8, 83, 140, 1)')
    hdr.addColorStop(1, 'rgba(10, 54, 120, 1)')
    ctx.fillStyle = hdr
    ctx.fill()
    ctx.restore()

    // Gold curved stroke
    ctx.save()
    ctx.beginPath()
    // Match stroke to the filled wave (left -> right)
    ctx.moveTo(innerLeft, headerBottomY + curveDrop)
    ctx.bezierCurveTo(
        innerLeft + innerW * 0.18,
        headerBottomY - curveLift,
        innerLeft + innerW * 0.30,
        headerBottomY + curveLift,
        innerLeft + innerW * 0.50,
        headerBottomY + Math.round(curveDrop * 0.55)
    )
    ctx.bezierCurveTo(
        innerLeft + innerW * 0.70,
        headerBottomY - curveLift,
        innerLeft + innerW * 0.82,
        headerBottomY + curveLift,
        innerRight,
        headerBottomY + curveDrop
    )
    ctx.strokeStyle = gold2
    ctx.lineWidth = 7
    ctx.stroke()
    ctx.restore()
    // Blue/teal header wavy band removed per requirement.

    // Logo (left) in a gold-ring circle
    const logo = await tryLoadImage(logoSrc)
    const logoR = 75
    const logoCx = innerLeft + logoR + 18
    const logoCy = innerTop + logoR + 2
    if (logo) {
        const clipR = logoR
        const size = clipR * 2
        const zoom = 1.25
        const drawSize = size * zoom
        ctx.save()
        ctx.beginPath()
        ctx.arc(logoCx, logoCy, clipR, 0, Math.PI * 2)
        ctx.clip()
        drawCover(
            logo,
            logoCx - drawSize / 2,
            logoCy - drawSize / 2,
            drawSize,
            drawSize
        )
        ctx.restore()
    }

    // Academy title (blue, two lines)
    const academyRaw = String(academyName || '').trim() || 'SWIMMING ACADEMY'
    const parts = academyRaw.split(/\s+/).filter(Boolean)
    const line1 = (parts[0] || academyRaw).toUpperCase()
    const line2 = (parts.length > 1 ? parts.slice(1).join(' ') : '').toUpperCase()

    const titleX = logoCx + logoR + 22
    const titleMaxW = Math.max(180, (splitX - 20) - titleX)
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.15)'
    ctx.shadowBlur = 2
    ctx.shadowOffsetY = 1
    // Gold title with white border
    ctx.fillStyle = gold;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 6;
    const s1 = fitTextSize({ ctx, text: line1, maxWidth: titleMaxW, weight: 900, start: 54, min: 22 });
    setFont(ctx, { weight: 900, size: s1 });
    ctx.strokeText(line1, titleX, innerTop + 76);
    ctx.fillText(line1, titleX, innerTop + 76);
    if (line2) {
        const s2 = fitTextSize({ ctx, text: line2, maxWidth: titleMaxW, weight: 900, start: 42, min: 18 });
        setFont(ctx, { weight: 900, size: s2 });
        // Wrap to 2 lines if needed instead of truncating.
        if (ctx.measureText(line2).width > titleMaxW) {
            const lines = wrapTextLines(ctx, line2, titleMaxW, 2);
            ctx.strokeText(lines[0] || '', titleX, innerTop + 118);
            ctx.fillText(lines[0] || '', titleX, innerTop + 118);
            if (lines[1]) {
                ctx.strokeText(lines[1], titleX, innerTop + 118 + Math.round(s2 * 1.05));
                ctx.fillText(lines[1], titleX, innerTop + 118 + Math.round(s2 * 1.05));
            }
        } else {
            ctx.strokeText(line2, titleX, innerTop + 118);
            ctx.fillText(line2, titleX, innerTop + 118);
        }
    }
    ctx.restore()

    // Profile photo area removed per requirement.

    // QR panel: shrink layout (all 4 sides) without changing the QR code size.
    const qrPad = 16
    const qrTopReserved = 56
    const qrBottomReserved = 34

    const qrBoxX0 = splitX + 2
    const qrBoxY0 = innerTop
    const qrBoxW0 = innerRight - qrBoxX0
    const qrBoxH0 = innerBottom - qrBoxY0

    // Current/target QR size based on the un-inset panel.
    const qrSizeTarget = Math.floor(
        Math.min(
            qrBoxW0 - qrPad * 2,
            qrBoxH0 - qrTopReserved - qrBottomReserved - qrPad * 2
        )
    )

    const desiredInsetX = 12
    const desiredInsetY = 12
    const maxInsetX = Math.max(0, Math.floor((qrBoxW0 - (qrSizeTarget + qrPad * 2)) / 2))
    const maxInsetY = Math.max(
        0,
        Math.floor(
            (qrBoxH0 - (qrSizeTarget + qrTopReserved + qrBottomReserved + qrPad * 2)) / 2
        )
    )
    const insetX = Math.min(desiredInsetX, maxInsetX)
    const insetY = Math.min(desiredInsetY, maxInsetY)

    const qrBoxX = qrBoxX0 + insetX
    const qrBoxY = qrBoxY0 + insetY
    const qrBoxW = qrBoxW0 - insetX * 2
    const qrBoxH = qrBoxH0 - insetY * 2

    // Body layout (left side)
    const bodyTop = headerBottomY + 56
    const bodyLeft = innerLeft
    const bodyRight = splitX - 2
    const leftTextW = bodyRight - bodyLeft

    // Member details background removed per requirement.

    // Member data (match sizes/colors)
    const joinedText = (formatDate(joinDate) || '—').toUpperCase()
    const expiryText = (formatDate(expiryDate) || '—').toUpperCase()
    const planText = String(planName || '—').toUpperCase()
    // Only last 8 characters as requested for the left-side details.
    const fullId = safeIdSuffix(memberId, 8).toUpperCase()
    // Full ID shown below the QR (small).
    const fullMemberId = String(memberId || '—').toUpperCase()
    const displayName = String(name || '—').toUpperCase()

    const labelColor = gold2
    const valueColor = 'rgba(255,255,255,0.96)'

    // Auto-fit: if content would overflow the left panel height, scale text/spacing down.
    const panelAvailableH = (innerBottom - bodyTop) - 28
    const leftX = bodyLeft + 20
    const linesToDraw = [
        { label: 'MEMBER NAME:', value: displayName, valueColorOverride: valueColor },
        { label: 'MEMBER ID:', value: fullId, valueColorOverride: valueColor },
        { label: 'PLAN:', value: planText, valueColorOverride: valueColor },
        { label: 'JOINED:', value: joinedText, valueColorOverride: valueColor },
        { label: 'EXPIRES:', value: expiryText, valueColorOverride: valueColor },
    ]

    const computeLabelW = labelMeasureSize => {
        ctx.save()
        setFont(ctx, { weight: 700, size: labelMeasureSize })
        const w = Math.max(
            ctx.measureText('MEMBER NAME:').width,
            ctx.measureText('MEMBER ID:').width,
            ctx.measureText('PLAN:').width,
            ctx.measureText('JOINED:').width,
            ctx.measureText('EXPIRES:').width
        )
        ctx.restore()
        return w
    }

    let scale = 1
    let detailLabelSize = 28
    let detailStart = 28
    let detailMin = 14
    let rowSpacing = 46
    let labelMeasureSize = 26
    let valueX = leftX + 220
    let maxValueW = 200

    for (let attempt = 0; attempt < 12; attempt += 1) {
        detailLabelSize = Math.max(20, Math.round(28 * scale))
        detailStart = Math.max(20, Math.round(28 * scale))
        detailMin = Math.max(12, Math.round(14 * scale))
        rowSpacing = Math.max(34, Math.round(46 * scale))
        labelMeasureSize = Math.max(18, Math.round(26 * scale))

        const labelW = computeLabelW(labelMeasureSize)
        valueX = leftX + Math.round(labelW) + 14
        maxValueW = Math.max(120, bodyLeft + leftTextW - 18 - valueX)

        let usedH = 40

        for (const { label, value } of linesToDraw) {
            const v = String(value || '')

            // Member name should stay the same size as other values.
            // If it doesn't fit, wrap to the next line rather than shrinking.
            if (label === 'MEMBER NAME:') {
                setFont(ctx, { weight: 600, size: detailStart })
                const vLines = ctx.measureText(v).width > maxValueW
                    ? wrapTextLines(ctx, v, maxValueW, 2).length
                    : 1
                if (vLines > 1) usedH += Math.round(detailStart * 1.2)
                usedH += rowSpacing
                continue
            }

            const testVSize = fitTextSize({ ctx, text: v, maxWidth: maxValueW, weight: 600, start: detailStart, min: detailMin })
            setFont(ctx, { weight: 600, size: testVSize })
            const vLines = (ctx.measureText(v).width > maxValueW && testVSize === detailMin)
                ? wrapTextLines(ctx, v, maxValueW, 2).length
                : 1
            if (vLines > 1) usedH += Math.round(testVSize * 1.2)
            usedH += rowSpacing
        }

        if (usedH <= panelAvailableH) break
        scale -= 0.04
        if (scale < 0.70) break
    }

    let ty = bodyTop + 40

    // Text shadow should be black (readability)
    const applyTextShadow = () => {
        ctx.shadowColor = 'rgba(0,0,0,0.92)'
        ctx.shadowBlur = 12
        ctx.shadowOffsetY = 3
    }

    const drawLine = ({ label, value, valueColorOverride = valueColor }) => {
        ctx.save()
        applyTextShadow()
        // All text gets a black border (stroke)
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        // Member name: bigger, always on its own line (label above, value below)
        if (label === 'MEMBER NAME:') {
            // Label (smaller, bold, left-aligned)
            ctx.fillStyle = labelColor;
            setFont(ctx, { weight: 700, size: detailLabelSize });
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(label, leftX, ty);
            ctx.fillText(label, leftX, ty);
            ty += Math.round(detailLabelSize * 1.1) + 16; // Larger gap for clear separation

            // Value (bigger, full width, always new line)
            const nameFontSize = Math.round(detailStart * 1.45);
            setFont(ctx, { weight: 800, size: nameFontSize });
            ctx.fillStyle = valueColorOverride;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;
            // Use full width (leftX to bodyRight) for wrapping and left alignment
            const nameMaxW = bodyRight - leftX;
            const lines = ctx.measureText(value).width > nameMaxW
                ? wrapTextLines(ctx, value, nameMaxW, 2)
                : [value];
            const lh = Math.round(nameFontSize * 1.18);
            for (let i = 0; i < lines.length; ++i) {
                ctx.strokeText(lines[i] || '', leftX, ty);
                ctx.fillText(lines[i] || '', leftX, ty);
                ty += lh;
            }
            ctx.restore();
            ty += rowSpacing - Math.round(nameFontSize * 0.5) - 12; // Reduce gap after name for even spacing
            return;
        }
        // Other details: label and value, both with black border
        ctx.fillStyle = labelColor;
        setFont(ctx, { weight: 700, size: detailLabelSize });
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(label, leftX, ty);
        ctx.fillText(label, leftX, ty);

        ctx.fillStyle = valueColorOverride;
        const vSize = fitTextSize({ ctx, text: value, maxWidth: maxValueW, weight: 600, start: detailStart, min: detailMin });
        setFont(ctx, { weight: 600, size: vSize });
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        if (ctx.measureText(value).width > maxValueW && vSize === detailMin) {
            const lines = wrapTextLines(ctx, value, maxValueW, 2);
            const lh = Math.round(vSize * 1.2);
            for (let i = 0; i < lines.length; ++i) {
                ctx.strokeText(lines[i] || '', valueX, ty);
                ctx.fillText(lines[i] || '', valueX, ty);
                ty += lh;
            }
        } else {
            ctx.strokeText(value, valueX, ty);
            ctx.fillText(value, valueX, ty);
        }
        ctx.restore();
        ty += rowSpacing;
    }

    for (const line of linesToDraw) drawLine(line)

    const qrImg = await loadImage(qrDataUrl)
    // Keep QR image size consistent even as the panel shrinks.
    const qrSize = Math.min(
        qrSizeTarget,
        Math.floor(
            Math.min(qrBoxW - qrPad * 2, qrBoxH - qrTopReserved - qrBottomReserved - qrPad * 2)
        )
    )

    // Tight QR frame: center it within the right-half area.
    // Transparent outside the yellow line (no big white panel).
    const scanX = qrBoxX + Math.floor(qrBoxW / 2)
    // Shrink white gap around QR (keep QR size unchanged)
    const frameOuterPad = 1
    const gapLabelToQr = 1
    const gapQrToId = 1

    const labelFontSize = 13
    const labelTopPad = 2
    const labelBottomPad = 1
    const labelBlockH = labelTopPad + labelFontSize + labelBottomPad

    const idFontSize = 10
    const idTopPad = 1
    const idBottomPad = 2
    const idBlockH = idTopPad + idFontSize + idBottomPad

    const frameW = qrSize + frameOuterPad * 2
    const frameH = labelBlockH + gapLabelToQr + qrSize + gapQrToId + idBlockH
    const frameX = qrBoxX + Math.floor((qrBoxW - frameW) / 2)
    const frameY = qrBoxY + Math.floor((qrBoxH - frameH) / 2)

    // White background ONLY inside the yellow border.
    ctx.save()
    ctx.fillStyle = 'rgba(255,255,255,0.98)'
    roundedRect(ctx, frameX, frameY, frameW, frameH, 18)
    ctx.fill()
    ctx.strokeStyle = gold2
    ctx.lineWidth = 6
    roundedRect(ctx, frameX, frameY, frameW, frameH, 18)
    ctx.stroke()
    ctx.restore()

    // Label INSIDE the yellow line
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.25)'
    ctx.shadowBlur = 2
    ctx.shadowOffsetY = 1
    ctx.fillStyle = 'rgba(10,10,10,0.82)'
    setFont(ctx, { weight: 800, size: labelFontSize })
    ctx.textAlign = 'center'
    ctx.fillText('SCAN FOR ATTENDANCE', scanX, frameY + labelTopPad + labelFontSize)
    ctx.restore()

    // QR under the label
    const qrDrawX = frameX + Math.floor((frameW - qrSize) / 2)
    const qrDrawY = frameY + labelBlockH + gapLabelToQr
    ctx.drawImage(qrImg, qrDrawX, qrDrawY, qrSize, qrSize)

    // Full member ID INSIDE the yellow line (below QR)
    const idBaselineY = frameY + frameH - idBottomPad
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.20)'
    ctx.shadowBlur = 2
    ctx.shadowOffsetY = 1
    ctx.fillStyle = 'rgba(10,10,10,0.82)'
    ctx.textAlign = 'center'
    const idMaxW = frameW - 12
    const idSize = fitTextSize({ ctx, text: fullMemberId, maxWidth: idMaxW, weight: 700, start: idFontSize, min: 10 })
    setFont(ctx, { weight: 700, size: idSize })
    ctx.fillText(fullMemberId, scanX, idBaselineY)
    ctx.restore()

    // Keep QR clear; no center overlay.

    // Branding footer (Subtle advertisement - drawn BEFORE restore so it's inside the card clip)
    ctx.save()
    ctx.textAlign = 'center'
    setFont(ctx, { weight: 400, size: 14 })
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.strokeStyle = 'rgba(0,0,0,0.60)'
    ctx.lineWidth = 3
    ctx.lineJoin = 'round'
    const footerY = cardY + cardH - 18
    ctx.strokeText('Scale your business online & automated: +91 90254 54148, +91 91509 18528', canvas.width / 2, footerY)
    ctx.fillText('Scale your business online & automated: +91 90254 54148, +91 91509 18528', canvas.width / 2, footerY)
    ctx.restore()

    // Finish clip
    ctx.restore()

    return canvas.toDataURL('image/png')
};

// Downloads the generated member ID card PNG to the user's device
export const downloadMemberIdCard = async ({ name, phone, mobileNumber, memberId, qrDataUrl, planName, joinDate, expiryDate }) => {
    const png = await buildMemberIdCardPng({ name, memberId, qrDataUrl, planName, joinDate, expiryDate })
    const last8 = safeIdSuffix(memberId, 8)
    const safeName = toSafeFilenamePart(name, 'MEMBER')
    const safePhone = toSafePhonePart(mobileNumber ?? phone, 'MOBILE')
    const filename = `${safeName}-${safePhone}-${last8}.png`
    downloadDataUrl(png, filename)
    return png
};
