import '../config/env.js'
import bcrypt from 'bcryptjs'
import connectDB from '../config/db.js'
import Admin from '../models/Admin.js'

const parseArgs = (argv) => {
	const out = {}
	for (let i = 0; i < argv.length; i++) {
		const arg = String(argv[i] || '')
		if (!arg.startsWith('--')) continue

		const eqIdx = arg.indexOf('=')
		if (eqIdx > -1) {
			const key = arg.slice(2, eqIdx)
			const value = arg.slice(eqIdx + 1)
			out[key] = value === '' ? true : value
			continue
		}

		const key = arg.slice(2)
		const next = argv[i + 1]
		if (!next || String(next).startsWith('--')) {
			out[key] = true
			continue
		}
		out[key] = next
		i++
	}
	return out
}

const normalize = (value) => String(value || '').trim()

const normalizeLower = (value) => normalize(value).toLowerCase()

const isValidRole = (role) => ['admin', 'superadmin'].includes(role)

const isValidEmail = (email) => {
	if (!email) return false
	return email.includes('@')
}

const isValidAdminId = (adminId) => {
	if (!adminId) return false
	// Keep it simple: allow a-z, 0-9, dot, underscore, dash, and @ (email-like ids)
	return /^[a-z0-9._@-]+$/.test(adminId)
}

const promptHidden = async (question) => {
	if (!process.stdin.isTTY) return ''
	process.stdout.write(question)

	return await new Promise((resolve) => {
		const stdin = process.stdin
		const onData = (buf) => {
			const str = buf.toString('utf8')
			// Enter
			if (str === '\r' || str === '\n' || str === '\r\n') {
				process.stdout.write('\n')
				stdin.off('data', onData)
				try {
					stdin.setRawMode(false)
				} catch {
					// ignore
				}
				stdin.pause()
				resolve(collected)
				return
			}

			// Ctrl+C
			if (str === '\u0003') {
				process.stdout.write('\n')
				process.exit(130)
			}

			// Backspace
			if (str === '\b' || str === '\x7f') {
				collected = collected.slice(0, -1)
				return
			}

			collected += str
		}

		let collected = ''
		stdin.resume()
		try {
			stdin.setRawMode(true)
		} catch {
			// ignore
		}
		stdin.on('data', onData)
	})
}

const main = async () => {
	const args = parseArgs(process.argv.slice(2))
	if (args.help || args.h) {
		printHelp()
		process.exit(0)
	}

	let email = normalizeLower(args.email)
	let adminId = normalizeLower(args.id || args.adminId)
	let role = normalizeLower(args.role) || 'admin'
	const update = Boolean(args.update)

	// Accept --id as optional, but default adminId to email
	if (!email && adminId && adminId.includes('@')) email = adminId
	if (!email) {
		console.error('Missing required flag: --email')
		printHelp()
		process.exit(1)
	}
	if (!adminId) adminId = email

	if (!isValidRole(role)) {
		console.error('Invalid --role. Use admin or superadmin.')
		process.exit(1)
	}

	if (!isValidEmail(email)) {
		console.error('Invalid --email. Provide a valid email.')
		process.exit(1)
	}

	if (!isValidAdminId(adminId)) {
		console.error('Invalid --id. Use only letters/numbers/dot/underscore/dash (no spaces).')
		process.exit(1)
	}

	let password = normalize(args.password)
	if (!password && process.stdin.isTTY) {
		password = normalize(await promptHidden('Admin password (hidden): '))
	}
	if (!password) {
		console.error('Missing --password (or run in an interactive terminal to be prompted).')
		process.exit(1)
	}
	if (password.length < 8) {
		console.error('Password too short. Use at least 8 characters.')
		process.exit(1)
	}

	await connectDB()

	// Ensure indexes match schema (esp. sparse unique indexes)
	try {
		await Admin.syncIndexes()
	} catch {
		// ignore
	}

	const existing = await Admin.findOne({ $or: [{ email }, { adminId }] })
	if (existing && !update) {
		console.error(`Admin already exists for ${email}. Use --update to reset password/role.`)
		process.exit(2)
	}

	const passwordHash = await bcrypt.hash(password, 10)
	if (existing) {
		existing.adminId = adminId
		existing.email = email
		existing.passwordHash = passwordHash
		existing.role = role
		existing.isActive = true
		await existing.save()
		console.log(`✅ Updated admin: ${email} (${role})`)
		process.exit(0)
	}

	const doc = { adminId, email, passwordHash, role, isActive: true }
	await Admin.create(doc)
	console.log(`✅ Created admin: ${email} (${role})`)
	process.exit(0)
}

main().catch((e) => {
	console.error('❌ Failed to create admin:', e?.message || e)
	process.exit(1)
})
