// Constant-time string comparison to prevent timing attacks on API key validation
const safeEqual = (a, b) => {
    const sa = a == null ? '' : String(a)
    const sb = b == null ? '' : String(b)
    if (sa.length !== sb.length) return false
    let ok = 0
    for (let i = 0; i < sa.length; i++) ok |= sa.charCodeAt(i) ^ sb.charCodeAt(i)
    return ok === 0
};

// Validates the x-admin-key header against the server's ADMIN_API_KEY
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
