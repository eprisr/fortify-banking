import { expect, test } from '@playwright/test'
import { deleteTestUser } from './support/appwrite-admin'
import { signUpAndLinkBank } from './support/test-user'

// Security regression for the fix documented in security_hardening_backlog
// item 2: PaymentTransferForm used to call getBank/getBankByAccountId
// directly, which — because Bank.userId is a relationship Appwrite
// auto-expands — put both parties' Plaid accessToken, Dwolla
// fundingSourceUrl, and the receiver's full User document straight into
// the browser's network response for every transfer. transferFunds now
// does that lookup server-side and returns only {success, error}. This
// asserts the real network response of a real transfer never contains
// those values again.
//
// Currently failing on purpose: PaymentTransferForm's amount field sends a
// number to a schema that requires a string, so react-hook-form's
// validation blocks every real submit — confirmed via this test itself, not
// a guess. See component_fixes_deferred memory item 8. Once that's fixed,
// this test starts actually exercising the PII-leak assertions below rather
// than failing on the submit step.
test("a transfer never puts either party's Plaid/Dwolla credentials on the wire", async ({
	page,
}) => {
	// Two full signup+link flows, each of which can spend up to ~4s in
	// waitForInitialTransactions' polling (see
	// user.actions.exchangePublicToken.test.ts): comfortably past the 30s
	// default under normal sandbox latency, not evidence of a hang.
	test.setTimeout(90000)

	const receiver = await signUpAndLinkBank(page)
	const sender = await signUpAndLinkBank(page) // overwrites the browser session — fine, receiver's part is done

	try {
		await page.goto('/payment-transfer')

		await page.getByRole('combobox').first().click()
		await page.getByRole('option', { name: /plaid checking/i }).click()

		await page.getByPlaceholder('J Doe').fill('Jane Receiver')
		await page.getByPlaceholder(/johndoe@email/i).fill('receiver@example.com')
		await page.getByPlaceholder(/fdewkl/i).fill(receiver.bank.shareableId)
		await page.getByPlaceholder(/ex: 5\.00/i).fill('12.34')
		await page
			.getByPlaceholder(/write a short note/i)
			.fill('security regression test transfer')

		const responsePromise = page.waitForResponse(
			(res) =>
				res.request().method() === 'POST' &&
				res.url().includes('/payment-transfer'),
			{ timeout: 8000 }, // fail fast — known-bug, see comment above
		)
		await page.getByRole('button', { name: /transfer funds/i }).click()
		const response = await responsePromise
		const body = await response.text()

		const secrets: Record<string, string> = {
			"sender's Plaid accessToken": sender.bank.accessToken,
			"sender's Dwolla fundingSourceUrl": sender.bank.fundingSourceUrl,
			"receiver's Plaid accessToken": receiver.bank.accessToken,
			"receiver's Dwolla fundingSourceUrl": receiver.bank.fundingSourceUrl,
			"receiver's dwollaCustomerId": receiver.user.dwollaCustomerId,
			"receiver's dwollaCustomerUrl": receiver.user.dwollaCustomerUrl,
		}
		for (const [label, secret] of Object.entries(secrets)) {
			expect(body, `${label} leaked into the transfer response`).not.toContain(
				secret,
			)
		}
	} finally {
		await deleteTestUser(sender.email)
		await deleteTestUser(receiver.email)
	}
})
