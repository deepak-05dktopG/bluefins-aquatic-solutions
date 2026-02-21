import '../config/env.js'
import bcrypt from 'bcryptjs'
import connectDB from '../config/db.js'
import Admin from '../models/Admin.js'

// Developer-only seed.
// Edit these values in code, then run: `npm run seed-admin`
const ADMIN = {
	email: 'bluefinsaquaticsolutions@gmail.com',
	password: 'bluefins2025',
	role: 'admin', // 'admin' | 'superadmin'
}

const main = async () => {
	if (!ADMIN.email || !ADMIN.password) {
		throw new Error('Seed admin requires ADMIN.email and ADMIN.password')
	}
	if (!['admin', 'superadmin'].includes(ADMIN.role)) {
		throw new Error("Seed admin role must be 'admin' or 'superadmin'")
	}
	if (!String(ADMIN.email).includes('@')) {
		throw new Error('Seed admin email is invalid')
	}

	await connectDB()

	// Ensure indexes match schema (esp. sparse unique indexes)
	try {
		await Admin.syncIndexes()
	} catch {
		// ignore
	}

	const email = String(ADMIN.email).trim().toLowerCase()
	const adminId = email
	const passwordHash = await bcrypt.hash(String(ADMIN.password), 10)

	const update = {
		adminId,
		email,
		passwordHash,
		role: ADMIN.role,
		isActive: true,
	}

	await Admin.findOneAndUpdate({ $or: [{ email }, { adminId }] }, update, { upsert: true, new: true })

	console.log(`✅ Seeded admin: ${email} (${ADMIN.role})`)
	process.exit(0)
}

main().catch((e) => {
	console.error('❌ Failed to seed admin:', e?.message || e)
	process.exit(1)
})
