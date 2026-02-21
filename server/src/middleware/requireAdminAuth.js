import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'

const extractBearerToken = (value) => {
	if (!value) return null
	const s = String(value)
	const m = s.match(/^Bearer\s+(.+)$/i)
	return m ? m[1].trim() : null
}

const requireAdminAuth = async (req, res, next) => {
	const secret = process.env.JWT_SECRET
	if (!secret) {
		return res.status(500).json({ success: false, message: 'Server JWT secret is not configured (JWT_SECRET)' })
	}

	const token = extractBearerToken(req.header('Authorization'))
	if (!token) {
		return res.status(401).json({ success: false, message: 'Unauthorized (missing token)' })
	}

	try {
		const decoded = jwt.verify(token, secret)
		const adminDbId = decoded?.adminDbId || decoded?.adminId
		if (!decoded || decoded.typ !== 'admin' || !adminDbId) {
			return res.status(403).json({ success: false, message: 'Forbidden' })
		}

		const admin = await Admin.findById(adminDbId).lean()
		if (!admin || admin.isActive === false) {
			return res.status(401).json({ success: false, message: 'Unauthorized (admin disabled)' })
		}

		req.admin = {
			id: String(admin._id),
			adminId: admin.adminId || null,
			email: admin.email,
			role: admin.role || 'admin',
		}
		return next()
	} catch {
		return res.status(401).json({ success: false, message: 'Unauthorized (invalid token)' })
	}
}

export default requireAdminAuth
