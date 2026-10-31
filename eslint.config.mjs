import nextVitals from 'eslint-config-next/core-web-vitals'

// eslint-config-next 16 ships native flat config, so FlatCompat (and the
// @eslint/eslintrc and @eslint/js packages it needed) are no longer required.
const eslintConfig = [
	...nextVitals,
	{
		ignores: [
			'.next/**',
			'node_modules/**',
			'dist/**',
			'coverage/**',
			'playwright-report/**',
			'test-results/**',
			'mobile-www/**',
			'ios/**',
			'android/**',
			'next-env.d.ts',
		],
	},
	{
		rules: {
			// Add any custom banking app overrides here
		},
	},
	{
		// jest.mock factories return inline components; display names add nothing there.
		files: ['__tests__/**', 'jest.setup.tsx'],
		rules: {
			'react/display-name': 'off',
		},
	},
]

export default eslintConfig
