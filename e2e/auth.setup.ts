import path from 'path'
import { test as setup } from '@playwright/test'

const authFile = path.join(__dirname, '.auth/user.json')

// Fixed on purpose (not timestamped, unlike signup.spec.ts's throwaway
// accounts) — one real account, created once and reused across every
// future run, not recreated per run. Override via env if needed.
const EMAIL = process.env.E2E_TEST_EMAIL ?? 'e2e-shared@fortifybank.test'
const PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'E2eShared123!'

setup('authenticate once, reused by every other test via storageState', async ({
	page,
}) => {
	await page.goto('/signin')
	await page.getByLabel('Email*').fill(EMAIL)
	await page.getByLabel('Password*').fill(PASSWORD)
	await page.getByRole('button', { name: 'Sign in' }).click()

	const signedIn = await page
		.waitForURL('/', { timeout: 5000 })
		.then(() => true)
		.catch(() => false)

	// First time this has ever run — the shared account doesn't exist yet.
	// Create it once; signUp leaves us signed in as a result.
	if (!signedIn) {
		await page.goto('/signup')
		await page.getByLabel('First Name*').fill('Playwright')
		await page.getByLabel('Last Name*').fill('Shared')
		await page.getByLabel('Email*').fill(EMAIL)
		await page.getByLabel('Password*').fill(PASSWORD)
		await page.getByRole('checkbox').check()
		await page.getByRole('button', { name: 'Continue' }).click()
		await page.getByText('Step 2 of 2').waitFor()
	}

	await page.context().storageState({ path: authFile })
})
