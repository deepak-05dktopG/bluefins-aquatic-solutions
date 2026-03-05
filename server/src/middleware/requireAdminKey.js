/**
 * Purpose: Do Safe Equal
 * Plain English: What this function is used for.
 */
/**
 * What it is: Security middleware for protected endpoints (admin API key check).
 * Non-tech note: Blocks sensitive APIs unless the correct secret key is provided.
 */

const safeEqual = (a, b) => {
    const sa = a == null ? '' : String(a)
    const sb = b == null ? '' : String(b)
    if (sa.length !== sb.length) return false
    let ok = 0
    for (let i = 0; i < sa.length; i++) ok |= sa.charCodeAt(i) ^ sb.charCodeAt(i)
    return ok === 0
};

/**
 * Purpose: Do Require Admin Key
 * Plain English: What this function is used for.
 */
const requireAdminKey = (req, res, next) => {
    const expected = process.env.ADMIN_API_KEY
    if (!expected) {
		return res.status(500).json({ success: false, message: 'Server admin key is not configured (ADMIN_API_KEY)' })
	}
    const provided = req.header('x-admin-key')
    if (!provided || !safeEqual(provided, expected)) {
		return res.status(401).json({ success: false, message: 'Unauthorized (invalid admin key)' })
	}
    return next()
};

export default requireAdminKey
