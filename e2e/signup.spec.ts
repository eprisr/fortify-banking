import { expect, test } from '@playwright/test'
import { deleteTestUser } from './support/appwrite-admin'

test('sign up creates a real account and reaches the bank-connection step', async ({
	page,
}) => {
	const email = `e2e-${Date.now()}@fortifybank.test`

	try {
		await page.goto('/signup')

		await page.getByLabel('First Name*').fill('Jane')
		await page.getByLabel('Last Name*').fill('Doe')
		await page.getByLabel('Email*').fill(email)
		await page.getByLabel('Password*').fill('E2eTest123!')
		await page.getByRole('checkbox').check()

		await page.getByRole('button', { name: 'Continue' }).click()

		await expect(page.getByText('Step 2 of 2')).toBeVisible()
		await expect(
			page.getByRole('button', { name: 'Connect my bank now' }),
		).toBeVisible()
	} finally {
		await deleteTestUser(email)
	}
})
