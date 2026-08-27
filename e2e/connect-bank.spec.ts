import { expect, test } from '@playwright/test'
import { deleteTestUser } from './support/appwrite-admin'
import { signUpAndLinkBank } from './support/test-user'

test('connecting a bank (via Plaid sandbox, bypassing Link UI) reaches a real dashboard', async ({
	page,
}) => {
	const { email } = await signUpAndLinkBank(page)

	try {
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
