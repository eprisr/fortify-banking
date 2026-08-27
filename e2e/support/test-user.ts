import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { getTestBankRow, getTestUserRow } from './appwrite-admin'
import { createSandboxPublicToken } from './plaid-sandbox'
import { exchangePublicToken } from '@/lib/actions/user.actions'

/** Signs up a real, throwaway account through the real UI and links a real
 * sandbox bank to it (bypassing Plaid Link's UI — see plaid-sandbox.ts).
 * Leaves the browser authenticated as this user. Caller is responsible for
 * `deleteTestUser(result.email)` in a `finally`. */
export async function signUpAndLinkBank(page: Page) {
	const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@fortifybank.test`

	await page.goto('/signup')
	await page.getByLabel('First Name*').fill('Jane')
	await page.getByLabel('Last Name*').fill('Doe')
	await page.getByLabel('Email*').fill(email)
	await page.getByLabel('Password*').fill('E2eTest123!')
	await page.getByRole('checkbox').check()
	await page.getByRole('button', { name: 'Continue' }).click()
	await expect(page.getByText('Step 2 of 2')).toBeVisible()

	const user = await getTestUserRow(email)
	if (!user) throw new Error(`Test user row not found for ${email}`)

	const publicToken = await createSandboxPublicToken()
	const result = await exchangePublicToken({ publicToken, user })
	// exchangePublicToken's real work (Plaid exchange, Dwolla funding
	// source, Appwrite bank row) is already done by the time it calls
	// next/cache's revalidatePath('/') as its very last step — that call
	// needs Next's request-scoped render context, which only exists on a
	// real HTTP request. Calling the action directly from Node (the same
	// "bypass Link's UI" reasoning as plaid-sandbox.ts) has no such
	// context, so revalidatePath throws and this reports failure even
	// though linking the account genuinely succeeded — confirmed not a
	// real bug: the actual app always calls this via a real request
	// (PlaidLink.tsx's onSuccess), which does have that context.
	if (!result.success) {
		expect(result.error).toMatch(/static generation store missing/)
	}

	const bank = await getTestBankRow(user.$id)
	if (!bank) throw new Error(`Test bank row not found for ${email}`)

	return { email, user, bank }
}
