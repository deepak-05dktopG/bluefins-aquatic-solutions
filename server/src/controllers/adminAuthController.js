import asyncHandler from 'express-async-handler'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import Admin from '../models/Admin.js'

const getJwtSecret = () => {
	const secret = process.env.JWT_SECRET
	if (!secret) {
		const err = new Error('Server JWT secret is not configured (JWT_SECRET)')
		err.statusCode = 500
		throw err
	}
	return secret
}

export const adminLogin = asyncHandler(async (req, res) => {
	const { password } = req.body || {}
	const identifier = req.body?.identifier ?? req.body?.adminId ?? req.body?.email

	if (!identifier || !password) {
		return res
			.status(400)
			.json({ success: false, message: 'Admin ID/email and password are required' })
	}

	const normalized = String(identifier).trim().toLowerCase()
	const admin = await Admin.findOne({ $or: [{ email: normalized }, { adminId: normalized }] }).lean()
	if (!admin || admin.isActive === false) {
		return res.status(401).json({ success: false, message: 'Invalid credentials' })
	}

	const ok = await bcrypt.compare(String(password), String(admin.passwordHash))
	if (!ok) {
		return res.status(401).json({ success: false, message: 'Invalid credentials' })
	}

	const token = jwt.sign(
		{
			role: admin.role || 'admin',
			email: admin.email,
			adminDbId: String(admin._id),
			typ: 'admin',
		},
		getJwtSecret(),
		{ expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '7d' }
	)

	return res.status(200).json({
		success: true,
		message: 'Login successful',
		data: {
			token,
			expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '7d',
			admin: {
				id: String(admin._id),
				adminId: admin.adminId || null,
				email: admin.email,
				role: admin.role || 'admin',
			},
		},
	})
})

export const adminMe = asyncHandler(async (req, res) => {
	return res.status(200).json({
		success: true,
		data: { admin: req.admin || null },
	})
})
