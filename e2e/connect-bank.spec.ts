import { expect, test } from '@playwright/test'
import { deleteTestUser, getTestUserRow } from './support/appwrite-admin'
import { createSandboxPublicToken } from './support/plaid-sandbox'
import { exchangePublicToken } from '@/lib/actions/user.actions'

test('connecting a bank (via Plaid sandbox, bypassing Link UI) reaches a real dashboard', async ({
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

		const user = await getTestUserRow(email)
		expect(user).not.toBeNull()

		const publicToken = await createSandboxPublicToken()
		const result = await exchangePublicToken({ publicToken, user: user! })

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
		// Monkey-patching next/cache's export didn't intercept the call
		// user.actions.ts makes (tried and confirmed), so this tolerates
		// only that one specific, expected error rather than masking others.
		if (!result.success) {
			expect(result.error).toMatch(/static generation store missing/)
		}

		await page.goto('/')

		// account.name ("Plaid Checking"), not institutionName — BankCard
		// also renders institutionName, but bank.actions.ts's getAccounts has
		// a known bug reading the wrong Plaid field for it (always
		// undefined; see component_fixes_deferred), so asserting on the
		// institution name here would fail for an unrelated reason.
		await expect(page.getByText('Plaid Checking')).toBeVisible()
		await expect(
			page.getByText("You're viewing sample data"),
		).not.toBeVisible()
	} finally {
		await deleteTestUser(email)
	}
})
