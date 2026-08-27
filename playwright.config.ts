import { defineConfig, devices } from '@playwright/test'

// E2E hits the real dev server against real Plaid/Dwolla/Appwrite sandbox
// APIs — no MSW here. .env(.local) already has working sandbox creds.
export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: 'html',
	use: {
		baseURL: 'http://localhost:3000',
		trace: 'on-first-retry',
	},
	projects: [
		{ name: 'setup', testMatch: /.*\.setup\.ts/ },
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
			dependencies: ['setup'],
		},
	],
	// Production build, not `npm run dev` — confirmed dev mode's React
	// StrictMode double-invocation causes real, observable duplicate-render
	// artifacts here (Plaid Link's script embedding itself twice; a form
	// rendering two of the same field with different ids). Run `npm run
	// build` before `npm run test:e2e`.
	webServer: {
		command: 'npm run start',
		url: 'http://localhost:3000',
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
})
