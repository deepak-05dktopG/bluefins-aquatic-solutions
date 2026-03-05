import fs from 'fs'
import path from 'path'
import recast from 'recast'
import babelParser from 'recast/parsers/babel.js'

const PROJECT_ROOT = path.resolve(process.cwd(), '..', '..')

const EXCLUDE_DIR_PARTS = new Set([
	'node_modules',
	'dist',
	'build',
	'.git',
	'.next',
	'.vercel',
	'.netlify',
	'public', // keep assets clean; source is in src/
	'assets',
])

const EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs'])

const parser = babelParser

const isExcludedPath = (filePath) => {
	const parts = filePath.split(path.sep).filter(Boolean)
	return parts.some((p) => EXCLUDE_DIR_PARTS.has(p))
}

const walk = (dir) => {
	const out = []
	if (!fs.existsSync(dir)) return out
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name)
		if (isExcludedPath(full)) continue
		if (entry.isDirectory()) out.push(...walk(full))
		else if (entry.isFile()) {
			if (EXTENSIONS.has(path.extname(entry.name))) out.push(full)
		}
	}
	return out
}

const getCalleeName = (node) => {
	if (!node) return null
	if (node.type === 'Identifier') return node.name
	if (node.type === 'MemberExpression') {
		const prop = node.property
		if (node.computed) return null
		if (prop && prop.type === 'Identifier') return prop.name
	}
	return null
}

const humanizeName = (name) => {
	if (!name) return ''
	const spaced = name
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/[_-]+/g, ' ')
		.trim()
	return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

const guessPurposeFromName = (name) => {
	if (!name) return null
	const n = String(name)
	const lower = n.toLowerCase()
	if (lower.startsWith('get')) return `Get ${humanizeName(n.slice(3))}`
	if (lower.startsWith('set')) return `Set ${humanizeName(n.slice(3))}`
	if (lower.startsWith('is')) return `Check whether ${humanizeName(n.slice(2))}`
	if (lower.startsWith('has')) return `Check whether it has ${humanizeName(n.slice(3))}`
	if (lower.startsWith('create')) return `Create ${humanizeName(n.slice(6))}`
	if (lower.startsWith('build')) return `Build ${humanizeName(n.slice(5))}`
	if (lower.startsWith('format')) return `Format ${humanizeName(n.slice(6))}`
	if (lower.startsWith('parse')) return `Parse ${humanizeName(n.slice(5))}`
	if (lower.startsWith('validate')) return `Validate ${humanizeName(n.slice(8))}`
	if (lower.startsWith('send')) return `Send ${humanizeName(n.slice(4))}`
	if (lower.startsWith('fetch')) return `Fetch ${humanizeName(n.slice(5))} from server`;
	if (lower.startsWith('handle')) return `Handle ${humanizeName(n.slice(6))}`
	if (lower.startsWith('on')) return `Run when ${humanizeName(n.slice(2))} happens`
	if (lower.includes('cron')) return 'Run on a schedule (cron job)'
	return `Do ${humanizeName(n)}`
}

const makeJSDocInnerComment = (text) => {
	// Babel/Recast comment blocks do NOT include /* */
	const lines = String(text)
		.split('\n')
		.map((l) => l.trimEnd())
		.filter((l) => l.length > 0)
	return {
		type: 'CommentBlock',
		value: `*\n${lines.map((l) => ` * ${l}`).join('\n')}\n `,
	}
}

const commentContainsPurpose = (c) => String(c?.value || '').includes('Purpose:')

const hasPurposeComment = (node) => {
	if (!node) return false
	const body = node?.body
	const inner = body?.innerComments || []
	const leading = node?.leadingComments || []
	const nodeComments = node?.comments || []
	const all = [...nodeComments, ...leading, ...inner]
	return all.some(commentContainsPurpose)
}

const stripPurposeComments = (node) => {
	if (!node) return 0
	const before = Array.isArray(node.comments) ? node.comments.length : 0
	if (!before) return 0
	node.comments = node.comments.filter((c) => !commentContainsPurpose(c))
	return before - node.comments.length
}

const addLeadingPurposeComment = ({ targetNode, purposeText }) => {
	if (!targetNode) return false
	if (hasPurposeComment(targetNode)) return false

	const comment = makeJSDocInnerComment(
		`Purpose: ${purposeText}\nPlain English: What this function is used for.`
	)
	comment.leading = true
	comment.trailing = false

	// Recast prints from `node.comments`.
	targetNode.comments = targetNode.comments || []
	targetNode.comments.unshift(comment)
	return true
}

const readArgValue = (argv, name) => {
	const i = argv.indexOf(name)
	if (i === -1) return null
	return argv[i + 1] || null
}

const inferContextPurpose = (path) => {
	// Try to infer context for anonymous callbacks.
	const parent = path.parentPath?.node
	const grand = path.parentPath?.parentPath?.node

	// Callback passed into a function call
	if (parent?.type === 'CallExpression') {
		const calleeName = getCalleeName(parent.callee)
		if (calleeName === 'useEffect') return 'React effect callback (runs after render based on dependencies)'
		if (calleeName === 'useMemo') return 'React memo callback (computes a value and caches it)'
		if (calleeName === 'useCallback') return 'React callback memoizer (keeps function stable between renders)'
		if (calleeName === 'setTimeout') return 'Timer callback (runs once after a delay)'
		if (calleeName === 'setInterval') return 'Timer callback (runs repeatedly on an interval)'
		if (calleeName === 'addEventListener') return 'Event listener callback (runs when an event happens)'
		if (calleeName === 'Promise') return 'Promise executor (resolves or rejects a promise)'
	}

	// e.g. array.map(() => ...)
	if (parent?.type === 'MemberExpression' || grand?.type === 'CallExpression') {
		const call = parent?.type === 'CallExpression' ? parent : grand?.type === 'CallExpression' ? grand : null
		if (call?.callee?.type === 'MemberExpression') {
			const method = getCalleeName(call.callee)
			if (method === 'map') return 'Array mapping callback (converts each item to a new value)'
			if (method === 'filter') return 'Array filter callback (keeps items that match a condition)'
			if (method === 'reduce') return 'Array reduce callback (combines items into one result)'
			if (method === 'forEach') return 'Array loop callback (runs once for each item)'
			if (method === 'find') return 'Array search callback (finds the first matching item)'
			if (method === 'some') return 'Array check callback (true if any item matches)'
			if (method === 'every') return 'Array check callback (true if all items match)'
			if (method === 'sort') return 'Sort comparator callback (decides item ordering)'
			if (method === 'then') return 'Promise success handler (runs when async work succeeds)'
			if (method === 'catch') return 'Promise error handler (runs when async work fails)'
			if (method === 'finally') return 'Promise cleanup handler (runs at the end, success or failure)'
		}
	}

	return 'Helper callback used inside a larger operation'
}

const pickCommentTargetForFunctionPath = (p) => {
	const fnNode = p.node
	const parent = p.parentPath?.node
	const grandParent = p.parentPath?.parentPath?.node
	const greatGrandParent = p.parentPath?.parentPath?.parentPath?.node

	// const name = () => {}
	if (parent?.type === 'VariableDeclarator' && grandParent?.type === 'VariableDeclaration') {
		return grandParent
	}

	// export const name = () => {}
	if (grandParent?.type === 'VariableDeclaration' && greatGrandParent?.type === 'ExportNamedDeclaration') {
		return greatGrandParent
	}

	// { key: () => {} }
	if (parent?.type === 'ObjectProperty') {
		return parent
	}

	// obj.method = () => {}
	if (parent?.type === 'AssignmentExpression') {
		return parent
	}

	// Fallback: attach to function node itself.
	return fnNode
}

const addPurposeCommentsToFile = (filePath) => {
	const input = fs.readFileSync(filePath, 'utf8')
	let ast
	try {
		ast = recast.parse(input, { parser })
	} catch (e) {
		return { changed: false, error: `parse-failed: ${e?.message || e}` }
	}

	let changed = 0

	recast.types.visit(ast, {
		visitFunctionDeclaration(p) {
			const fnNode = p.node
			const name = fnNode.id?.name
			const purpose = guessPurposeFromName(name) || 'Function logic'
			if (addLeadingPurposeComment({ targetNode: fnNode, purposeText: purpose })) changed++
			this.traverse(p)
		},

		visitFunctionExpression(p) {
			const fnNode = p.node
			const parent = p.parentPath?.node
			let name = fnNode.id?.name || null

			// const foo = function() {}
			if (!name && parent?.type === 'VariableDeclarator' && parent.id?.type === 'Identifier') {
				name = parent.id.name
			}

			const purpose = guessPurposeFromName(name) || inferContextPurpose(p)
			const targetNode = pickCommentTargetForFunctionPath(p)
			// Migration: if an earlier buggy run attached Purpose to the function node, move it.
			if (targetNode !== fnNode && hasPurposeComment(fnNode) && !hasPurposeComment(targetNode)) {
				stripPurposeComments(fnNode)
			}
			if (addLeadingPurposeComment({ targetNode, purposeText: purpose })) changed++
			this.traverse(p)
		},

		visitArrowFunctionExpression(p) {
			const fnNode = p.node
			const parent = p.parentPath?.node

			let name = null
			// const foo = () => {}
			if (parent?.type === 'VariableDeclarator' && parent.id?.type === 'Identifier') {
				name = parent.id.name
			}
			// { foo: () => {} }
			if (!name && parent?.type === 'ObjectProperty') {
				if (parent.key?.type === 'Identifier') name = parent.key.name
				if (parent.key?.type === 'StringLiteral') name = parent.key.value
			}

			const purpose = guessPurposeFromName(name) || inferContextPurpose(p)
			const targetNode = pickCommentTargetForFunctionPath(p)
			// Migration: move inline Purpose comments off the arrow function where possible.
			if (targetNode !== fnNode && hasPurposeComment(fnNode) && !hasPurposeComment(targetNode)) {
				stripPurposeComments(fnNode)
			}
			if (addLeadingPurposeComment({ targetNode, purposeText: purpose })) changed++

			this.traverse(p)
		},

		visitObjectMethod(p) {
			const fnNode = p.node
			const name = fnNode.key?.type === 'Identifier' ? fnNode.key.name : null
			const purpose = guessPurposeFromName(name) || 'Object method logic'
			if (addLeadingPurposeComment({ targetNode: fnNode, purposeText: purpose })) changed++
			this.traverse(p)
		},

		visitClassMethod(p) {
			const fnNode = p.node
			const name = fnNode.key?.type === 'Identifier' ? fnNode.key.name : null
			const purpose = guessPurposeFromName(name) || 'Class method logic'
			if (addLeadingPurposeComment({ targetNode: fnNode, purposeText: purpose })) changed++
			this.traverse(p)
		},
	})

	if (!changed) return { changed: false, updatedFunctions: 0 }

	const output = recast.print(ast, { lineTerminator: '\n' }).code
	fs.writeFileSync(filePath, output, 'utf8')
	return { changed: true, updatedFunctions: changed }
}

const main = () => {
	const onlyFile = readArgValue(process.argv.slice(2), '--file')
	if (onlyFile) {
		const abs = path.isAbsolute(onlyFile) ? onlyFile : path.join(PROJECT_ROOT, onlyFile)
		const res = addPurposeCommentsToFile(abs)
		if (res?.error) {
			console.log(`❌ ${path.relative(PROJECT_ROOT, abs)} (${res.error})`)
			process.exitCode = 2
			return
		}
		console.log(`✅ ${path.relative(PROJECT_ROOT, abs)} updatedFunctions=${res.updatedFunctions || 0}`)
		return
	}

	const targets = [
		path.join(PROJECT_ROOT, 'client'),
		path.join(PROJECT_ROOT, 'server'),
	]

	const files = targets.flatMap((t) => walk(t)).filter((f) => !isExcludedPath(f))

	let touchedFiles = 0
	let updatedFunctions = 0
	const failures = []

	for (const file of files) {
		const res = addPurposeCommentsToFile(file)
		if (res?.error) {
			failures.push({ file, error: res.error })
			continue
		}
		if (res.changed) {
			touchedFiles++
			updatedFunctions += res.updatedFunctions || 0
		}
	}

	console.log(`✅ Done. Files updated: ${touchedFiles}/${files.length}`)
	console.log(`✅ Functions commented (estimated): ${updatedFunctions}`)
	if (failures.length) {
		console.log(`⚠️ Files skipped due to parse issues: ${failures.length}`)
		for (const f of failures.slice(0, 20)) console.log(` - ${path.relative(PROJECT_ROOT, f.file)} (${f.error})`)
		if (failures.length > 20) console.log(' - ...')
		process.exitCode = 2
	}
}

main()
