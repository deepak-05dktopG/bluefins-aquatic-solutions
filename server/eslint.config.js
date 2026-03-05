/**
 * What it is: Backend linting rules (ESLint config).
 * Non-tech note: Helps keep server code consistent and catch mistakes.
 */

import js from '@eslint/js'
import globals from 'globals'
import unusedImports from 'eslint-plugin-unused-imports'

export default [
	{
		ignores: ['**/node_modules/**', '**/dist/**', '**/build/**'],
	},
	js.configs.recommended,
	{
		files: ['src/**/*.js'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.node,
				...globals.es2021,
			},
		},
		plugins: {
			'unused-imports': unusedImports,
		},
		rules: {
			'unused-imports/no-unused-imports': 'error',
			'unused-imports/no-unused-vars': [
				'warn',
				{
					vars: 'all',
					varsIgnorePattern: '^_',
					args: 'after-used',
					argsIgnorePattern: '^_',
				},
			],
			'no-unused-vars': 'off',
		},
	},
]
