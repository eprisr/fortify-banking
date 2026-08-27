/**
 * user.actions.ts — exchangePublicToken only.
 *
 * This is the function Plaid Link's onSuccess callback invokes once a user
 * finishes linking a bank: exchange the public token, pull account info,
 * mint a Dwolla processor token, link a Dwolla funding source, save the
 * bank row, then best-effort poll Plaid for the item's first transactions.
 * No automated coverage previously existed for this flow (see
 * plaid_oauth_status memory).
 *
 * Real code runs wherever the underlying HTTP is MSW-mockable: Plaid
 * (axios) and Dwolla (dwolla-v2/node-fetch, reached via the real
 * addFundingSource — a genuine cross-module import from dwolla.actions.ts,
 * so jest.mock isn't even needed there). createBankAccount is defined in
 * the *same* module as exchangePublicToken, so — same reasoning as
 * user.actions.transfer.test.ts — it's left real too, and mocked one level
 * down at createAdminClient instead.
 */
import '../../test/msw/setup'
import { HttpResponse, http } from 'msw'
import { server } from '../../test/msw/server'
import { PLAID_BASE } from '../../test/msw/handlers/plaid'
import { DWOLLA_BASE } from '../../test/msw/handlers/dwolla'
import { decryptId } from '@/lib/server/encryption'

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

jest.mock('@/lib/server/appwrite', () => ({
	createAdminClient: jest.fn(),
	createSessionClient: jest.fn(),
}))

// jest.setup.tsx globally jest.mocks this module (for the component test
// suite's benefit) — undo that here so the real exchangePublicToken runs.
jest.unmock('@/lib/actions/user.actions')

import { exchangePublicToken } from '@/lib/actions/user.actions'
import { createAdminClient } from '@/lib/server/appwrite'
import { revalidatePath } from 'next/cache'

const mockCreateAdminClient = createAdminClient as jest.Mock

const testUser: User = {
	$id: 'user-123',
	email: 'jane@example.com',
	userId: 'user-123',
	dwollaCustomerUrl: `${DWOLLA_BASE}/customers/dwolla-customer-1`,
	dwollaCustomerId: 'dwolla-customer-1',
	firstName: 'Jane',
	lastName: 'Doe',
	name: 'Jane Doe',
	address1: '',
	city: '',
	state: '',
	postalCode: '',
	dateOfBirth: '',
	ssn: '',
}

const validParams = () => ({ publicToken: 'public-sandbox-token', user: testUser })

/** Non-empty by default so waitForInitialTransactions' polling loop (see
 * user.actions.ts) exits on its first attempt instead of retrying with
 * real 1s delays between each of its 5 attempts. */
function mockTransactionsSyncFindsData() {
	server.use(
		http.post(`${PLAID_BASE}/transactions/sync`, () =>
			HttpResponse.json({
				added: [{ transaction_id: 'txn-1' }],
				modified: [],
				removed: [],
				next_cursor: 'cursor-1',
				has_more: false,
				request_id: 'req-transactions-sync',
			}),
		),
	)
}

function mockCreateRow(result: any = { $id: 'bank-doc-1' }) {
	const createRow = jest.fn().mockResolvedValue(result)
	mockCreateAdminClient.mockResolvedValue({ table: { createRow } })
	return createRow
}

beforeEach(() => {
	mockTransactionsSyncFindsData()
})

describe('exchangePublicToken — happy path', () => {
	it('links the account end to end and saves the bank row', async () => {
		const createRow = mockCreateRow()

		const result = await exchangePublicToken(validParams())

		expect(result).toEqual({ success: true, data: null })
		expect(createRow).toHaveBeenCalledTimes(1)
		const savedRow = createRow.mock.calls[0][0].data
		expect(savedRow).toMatchObject({
			userId: 'user-123',
			bankId: 'item-sandbox-test-id', // from the default Plaid exchange handler
			accountId: 'plaid-account-1', // from the default Plaid accounts/get handler
			accessToken: 'access-sandbox-test-token',
			fundingSourceUrl: `${DWOLLA_BASE}/funding-sources/funding-source-for-dwolla-customer-1`,
		})
		// shareableId is the account_id encrypted, not stored/passed in plaintext
		expect(savedRow.shareableId).not.toBe('plaid-account-1')
		expect(decryptId(savedRow.shareableId)).toBe('plaid-account-1')
	})

	it('revalidates the home page on success', async () => {
		mockCreateRow()

		await exchangePublicToken(validParams())

		expect(revalidatePath).toHaveBeenCalledWith('/')
	})

	it('picks the depository account even when it is not accounts[0]', async () => {
		server.use(
			http.post(`${PLAID_BASE}/accounts/get`, () =>
				HttpResponse.json({
					accounts: [
						{
							account_id: 'plaid-account-credit',
							balances: { available: null, current: 500, limit: 2000 },
							mask: '1111',
							name: 'Plaid Credit Card',
							official_name: 'Plaid Diamond Credit Card',
							subtype: 'credit card',
							type: 'credit',
						},
						{
							account_id: 'plaid-account-checking',
							balances: { available: 950.5, current: 1000, limit: null },
							mask: '0000',
							name: 'Plaid Checking',
							official_name: 'Plaid Gold Standard 0% Interest Checking',
							subtype: 'checking',
							type: 'depository',
						},
					],
					item: { institution_id: 'ins_109508' },
					request_id: 'req-accounts-get',
				}),
			),
		)
		const createRow = mockCreateRow()

		const result = await exchangePublicToken(validParams())

		expect(result).toEqual({ success: true, data: null })
		const savedRow = createRow.mock.calls[0][0].data
		expect(savedRow.accountId).toBe('plaid-account-checking')
	})
})

describe('exchangePublicToken — failures', () => {
	it('fails without touching Dwolla or Appwrite when the public token exchange fails', async () => {
		server.use(
			http.post(`${PLAID_BASE}/item/public_token/exchange`, () =>
				HttpResponse.json({ error_code: 'INVALID_PUBLIC_TOKEN' }, { status: 400 }),
			),
		)
		const createRow = mockCreateRow()

		const result = await exchangePublicToken(validParams())

		expect(result.success).toBe(false)
		expect(createRow).not.toHaveBeenCalled()
	})

	it('fails when Dwolla cannot link a funding source', async () => {
		server.use(
			http.post(`${DWOLLA_BASE}/on-demand-authorizations`, () =>
				HttpResponse.json({ message: 'server error' }, { status: 500 }),
			),
		)
		const createRow = mockCreateRow()

		const result = await exchangePublicToken(validParams())

		expect(result).toEqual({
			success: false,
			error: 'Failed to link funding source',
		})
		expect(createRow).not.toHaveBeenCalled()
	})

	it('fails when saving the bank row to Appwrite fails', async () => {
		mockCreateAdminClient.mockResolvedValue({
			table: { createRow: jest.fn().mockResolvedValue(null) },
		})

		const result = await exchangePublicToken(validParams())

		expect(result).toEqual({
			success: false,
			error: 'Failed to save bank account',
		})
	})

	it('fails with a clear message when Plaid returns no accounts at all', async () => {
		server.use(
			http.post(`${PLAID_BASE}/accounts/get`, () =>
				HttpResponse.json({
					accounts: [],
					item: { institution_id: 'ins_109508' },
					request_id: 'req-accounts-get',
				}),
			),
		)
		const createRow = mockCreateRow()

		const result = await exchangePublicToken(validParams())

		expect(result).toEqual({
			success: false,
			error: 'No accounts were returned for this bank connection',
		})
		expect(createRow).not.toHaveBeenCalled()
	})

	it('fails with a clear message when none of the returned accounts are depository', async () => {
		server.use(
			http.post(`${PLAID_BASE}/accounts/get`, () =>
				HttpResponse.json({
					accounts: [
						{
							account_id: 'plaid-account-credit',
							balances: { available: null, current: 500, limit: 2000 },
							mask: '1111',
							name: 'Plaid Credit Card',
							official_name: 'Plaid Diamond Credit Card',
							subtype: 'credit card',
							type: 'credit',
						},
					],
					item: { institution_id: 'ins_109508' },
					request_id: 'req-accounts-get',
				}),
			),
		)
		const createRow = mockCreateRow()

		const result = await exchangePublicToken(validParams())

		expect(result).toEqual({
			success: false,
			error:
				'No eligible checking or savings account was found for this bank connection',
		})
		expect(createRow).not.toHaveBeenCalled()
	})
})

describe('exchangePublicToken — initial-transactions polling', () => {
	// Real time, not fake timers: waitForInitialTransactions' setTimeout
	// delays interleave with real MSW/axios/undici network promises, and
	// faking global timers stalls that transport rather than fast-forwarding
	// it. This is the one test in the file that pays the real ~4s cost (4
	// delays between 5 attempts) for that realism.
	it(
		'polls transactionsSync up to 5 times and still succeeds if none ever arrive',
		async () => {
			let calls = 0
			server.use(
				http.post(`${PLAID_BASE}/transactions/sync`, () => {
					calls += 1
					return HttpResponse.json({
						added: [],
						modified: [],
						removed: [],
						next_cursor: 'cursor-1',
						has_more: false,
						request_id: 'req-transactions-sync',
					})
				}),
			)
			mockCreateRow()

			const result = await exchangePublicToken(validParams())

			expect(result).toEqual({ success: true, data: null })
			expect(calls).toBe(5)
		},
		10000,
	)
})
