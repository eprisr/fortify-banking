import { expect, test } from '@playwright/test'
import {
	deleteTestUser,
	getTestBankRow,
	getTestUserRow,
} from './support/appwrite-admin'
import { createSandboxPublicToken } from './support/plaid-sandbox'
import { exchangePublicToken } from '@/lib/actions/user.actions'

async function signUpAndLinkBank(page: import('@playwright/test').Page) {
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
	// See connect-bank.spec.ts — revalidatePath throws when the action is
	// called directly from Node (no request-scoped context), after the
	// real work is already done. Tolerate only that specific error.
	if (!result.success) {
		expect(result.error).toMatch(/static generation store missing/)
	}

	const bank = await getTestBankRow(user.$id)
	if (!bank) throw new Error(`Test bank row not found for ${email}`)

	return { email, user, bank }
}

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
			{ timeout: 8000 }, // fail fast — known-bug
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
