import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
})

const eslintConfig = [
	// This recreates your "next/core-web-vitals" extension
	...compat.extends('next/core-web-vitals'),
	{
		// Ignores should be handled here instead of .eslintignore
		ignores: ['.next/*', 'node_modules/*', 'dist/*'],
	},
	{
		rules: {
			// Add any custom banking app overrides here
		},
	},
]

export default eslintConfig
