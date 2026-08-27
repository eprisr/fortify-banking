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
// component_fixes_deferred item 8 (amount sent as a number instead of a
// string, blocking every real submit) is fixed — this test now reaches the
// real transferFunds/Dwolla call.
//
// Both signUpAndLinkBank() calls pass distinctAccount: true (see
// plaid-sandbox.ts) so sender and receiver each get their own randomized
// sandbox checking account rather than colliding on the same fixed
// user_good fixture data. Worth keeping regardless, but it turned out NOT
// to be what was blocking this test: verified via a throwaway probe that
// the two accounts' Plaid account_ids and Dwolla funding-source URLs were
// already distinct even before this change, and the exact same Dwolla
// "Receiver cannot receive from sender" rejection persisted after it too.
//
// Still failing — real root cause found via Dwolla's docs, not a guess:
// every Dwolla customer this app creates is permanently `type: 'unverified'`
// (lib/actions/user.actions.ts) and Dwolla requires at least one party in
// any transfer to be a *verified* customer (or the Master Account) —
// unverified-to-unverified transfers are rejected outright, which is
// exactly this error. dwollaSchema (lib/utils.ts) exists for collecting
// the KYC fields a verify-upgrade would need, but nothing in the app ever
// calls it or upgrades a customer — there is currently no way for two
// organically signed-up users to ever transfer to each other, in Sandbox
// or real production. Tracked as its own item, separate from component_fixes_deferred item 8.
test("a transfer never puts either party's Plaid/Dwolla credentials on the wire", async ({
	page,
}) => {
	// Two full signup+link flows, each of which can spend up to ~4s in
	// waitForInitialTransactions' polling (see
	// user.actions.exchangePublicToken.test.ts): comfortably past the 30s
	// default under normal sandbox latency, not evidence of a hang.
	test.setTimeout(90000)

	const receiver = await signUpAndLinkBank(page, { distinctAccount: true })
	const sender = await signUpAndLinkBank(page, { distinctAccount: true }) // overwrites the browser session — fine, receiver's part is done

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
			{ timeout: 8000 }, // real Dwolla round-trip; generous margin over observed latency
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
