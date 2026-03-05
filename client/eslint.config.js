import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import unusedImports from 'eslint-plugin-unused-imports'

export default [
	{
		ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/public/**'],
	},
	js.configs.recommended,
	{
		files: ['src/**/*.{js,jsx}'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
			globals: {
				...globals.browser,
				...globals.es2021,
			},
		},
		settings: {
			react: { version: 'detect' },
		},
		plugins: {
			react,
			'react-hooks': reactHooks,
			'unused-imports': unusedImports,
		},
		rules: {
			// Focus on safe cleanups (unused imports/vars).
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

			// React
			'react/react-in-jsx-scope': 'off',
			'react/jsx-uses-react': 'off',
			'react/jsx-uses-vars': 'error',
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
		},
	},
]
