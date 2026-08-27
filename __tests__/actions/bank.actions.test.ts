import '../../test/msw/setup'
import { HttpResponse, http } from 'msw'
import { server } from '../../test/msw/server'
import { PLAID_BASE } from '../../test/msw/handlers/plaid'
import {
	getAccounts,
	getAccount,
	getInstitution,
	getTransactions,
	createTransfer,
} from '@/lib/actions/bank.actions'
import { getBanks, getBank } from '@/lib/actions/user.actions'
import { getTransactionsByBankId } from '@/lib/actions/transaction.actions'

jest.mock('@/lib/actions/user.actions', () => ({
	getBanks: jest.fn(),
	getBank: jest.fn(),
	createLinkToken: jest.fn(),
	getLoggedInUser: jest.fn(),
}))

jest.mock('@/lib/actions/transaction.actions', () => ({
	getTransactionsByBankId: jest.fn(),
}))

const mockGetBanks = getBanks as jest.Mock
const mockGetBank = getBank as jest.Mock
const mockGetTransactionsByBankId = getTransactionsByBankId as jest.Mock

const testBank: Bank = {
	$id: 'bank-doc-1',
	accountId: 'plaid-account-1',
	bankId: 'item-1',
	accessToken: 'access-sandbox-1',
	fundingSourceUrl: 'https://api-sandbox.dwolla.com/funding-sources/fs-1',
	userId: 'user-1',
	shareableId: 'shareable-1',
}

describe('getAccounts', () => {
	it('returns demo accounts when there is no userId', async () => {
		const result = await getAccounts({ userId: '' })
		expect(result.totalBanks).toBeGreaterThan(0)
		expect(mockGetBanks).not.toHaveBeenCalled()
	})

	it('returns demo accounts when the user has no linked banks', async () => {
		mockGetBanks.mockResolvedValue({ success: true, data: [] })

		const result = await getAccounts({ userId: 'user-1' })

		expect(result.totalBanks).toBeGreaterThan(0)
	})

	it('fetches each linked bank from Plaid and totals the balances', async () => {
		mockGetBanks.mockResolvedValue({ success: true, data: [testBank] })

		const result = await getAccounts({ userId: 'user-1' })

		expect(result.totalBanks).toBe(1)
		expect(result.data[0]).toMatchObject({
			id: 'plaid-account-1',
			currentBalance: 1000,
			institutionId: 'ins_109508',
			appwriteItemId: 'bank-doc-1',
			institutionName: 'First Platypus Bank',
		})
	})

	it('skips a bank with no access token instead of calling Plaid for it', async () => {
		mockGetBanks.mockResolvedValue({
			success: true,
			data: [{ ...testBank, accessToken: '' }],
		})

		const result = await getAccounts({ userId: 'user-1' })

		expect(result.totalBanks).toBe(0)
		expect(result.data).toEqual([])
	})

	it('drops a bank into UPDATE_MODE when Plaid reports ITEM_LOGIN_REQUIRED, without crashing the rest', async () => {
		const staleBank = {
			...testBank,
			$id: 'bank-doc-stale',
			accessToken: 'access-sandbox-stale',
		}
		const healthyBank = {
			...testBank,
			$id: 'bank-doc-healthy',
			accessToken: 'access-sandbox-healthy',
		}
		mockGetBanks.mockResolvedValue({
			success: true,
			data: [staleBank, healthyBank],
		})

		// Keyed by access_token (not call order) since Promise.all fires both
		// banks' requests concurrently — order of arrival isn't guaranteed.
		server.use(
			http.post(`${PLAID_BASE}/accounts/get`, async ({ request }) => {
				const body = (await request.json()) as { access_token: string }
				if (body.access_token === 'access-sandbox-stale') {
					return HttpResponse.json(
						{
							error_code: 'ITEM_LOGIN_REQUIRED',
							error_message: 'the login details of this item have changed',
						},
						{ status: 400 },
					)
				}
				return HttpResponse.json({
					accounts: [
						{
							account_id: 'plaid-account-1',
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
				})
			}),
		)

		const result = await getAccounts({ userId: 'user-1' })

		// The stale bank's 'UPDATE_MODE' sentinel and the null from a skipped
		// bank are both filtered out — only the healthy account counts.
		expect(result.totalBanks).toBe(1)
		expect(result.data).toHaveLength(1)
	})

	it("matches the bank's linked accountId instead of assuming accounts[0]", async () => {
		mockGetBanks.mockResolvedValue({ success: true, data: [testBank] })

		server.use(
			http.post(`${PLAID_BASE}/accounts/get`, () =>
				HttpResponse.json({
					accounts: [
						{
							account_id: 'plaid-account-other',
							balances: { available: 100, current: 200, limit: null },
							mask: '9999',
							name: 'Plaid Savings',
							official_name: 'Plaid Silver Standard Savings',
							subtype: 'savings',
							type: 'depository',
						},
						{
							// testBank.accountId — the account actually linked — is
							// second in the array, not first.
							account_id: 'plaid-account-1',
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

		const result = await getAccounts({ userId: 'user-1' })

		expect(result.data[0].id).toBe('plaid-account-1')
		expect(result.data[0].currentBalance).toBe(1000)
	})

	it("skips a bank whose linked accountId is no longer among the item's accounts", async () => {
		mockGetBanks.mockResolvedValue({
			success: true,
			data: [{ ...testBank, accountId: 'plaid-account-removed' }],
		})

		const result = await getAccounts({ userId: 'user-1' })

		expect(result.totalBanks).toBe(0)
		expect(result.data).toEqual([])
	})
})

describe('getAccount', () => {
	it('fetches the account, its Plaid transactions, and its transfer transactions', async () => {
		mockGetBank.mockResolvedValue(testBank)
		mockGetTransactionsByBankId.mockResolvedValue({
			total: 1,
			documents: [
				{
					$id: 'txn-1',
					name: 'Transfer to Jane',
					amount: 20,
					$createdAt: '2026-01-01T00:00:00.000Z',
					channel: 'online',
					category: 'Transfer',
					senderBankId: 'bank-doc-1',
					receiverBankId: 'other-bank',
				},
			],
		})

		const result = await getAccount({ appwriteItemId: 'bank-doc-1' })

		expect(result.data).toMatchObject({
			id: 'plaid-account-1',
			institutionId: 'ins_109508',
			appwriteItemId: 'bank-doc-1',
		})
		// One Plaid-synced transaction (none, by default handler) plus the one
		// transfer transaction from Appwrite.
		expect(result.transactions).toHaveLength(1)
		expect(result.transactions[0].type).toBe('debit')
	})

	it("matches the bank's linked accountId instead of assuming accounts[0]", async () => {
		mockGetBank.mockResolvedValue(testBank)
		mockGetTransactionsByBankId.mockResolvedValue({ total: 0, documents: [] })

		server.use(
			http.post(`${PLAID_BASE}/accounts/get`, () =>
				HttpResponse.json({
					accounts: [
						{
							account_id: 'plaid-account-other',
							balances: { available: 100, current: 200, limit: null },
							mask: '9999',
							name: 'Plaid Savings',
							official_name: 'Plaid Silver Standard Savings',
							subtype: 'savings',
							type: 'depository',
						},
						{
							account_id: 'plaid-account-1',
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

		const result = await getAccount({ appwriteItemId: 'bank-doc-1' })

		expect(result.data.id).toBe('plaid-account-1')
		expect(result.data.currentBalance).toBe(1000)
	})

	it("returns undefined instead of throwing when the linked accountId is no longer among the item's accounts", async () => {
		mockGetBank.mockResolvedValue({
			...testBank,
			accountId: 'plaid-account-removed',
		})
		mockGetTransactionsByBankId.mockResolvedValue({ total: 0, documents: [] })

		const result = await getAccount({ appwriteItemId: 'bank-doc-1' })

		expect(result).toBeUndefined()
	})
})

describe('getInstitution', () => {
	it("returns the institution's details", async () => {
		const result = await getInstitution({ institutionId: 'ins_109508' })
		expect(result).toMatchObject({
			institution_id: 'ins_109508',
			name: 'First Platypus Bank',
		})
	})

	it('rethrows when Plaid fails to find the institution', async () => {
		server.use(
			http.post(`${PLAID_BASE}/institutions/get_by_id`, () =>
				HttpResponse.json(
					{ error_code: 'INSTITUTION_NOT_FOUND' },
					{ status: 400 },
				),
			),
		)

		await expect(
			getInstitution({ institutionId: 'does-not-exist' }),
		).rejects.toBeTruthy()
	})
})

describe('getTransactions', () => {
	it('pages through transactionsSync until has_more is false', async () => {
		let call = 0
		server.use(
			http.post(`${PLAID_BASE}/transactions/sync`, () => {
				call += 1
				if (call === 1) {
					return HttpResponse.json({
						added: [
							{
								transaction_id: 'txn-a',
								name: 'Coffee',
								payment_channel: 'in store',
								account_id: 'plaid-account-1',
								amount: 4.5,
								pending: false,
								category: ['Food and Drink'],
								date: '2026-01-01',
								logo_url: null,
							},
						],
						modified: [],
						removed: [],
						next_cursor: 'cursor-2',
						has_more: true,
						request_id: 'req-1',
					})
				}
				return HttpResponse.json({
					added: [
						{
							transaction_id: 'txn-b',
							name: 'Groceries',
							payment_channel: 'in store',
							account_id: 'plaid-account-1',
							amount: 62.1,
							pending: false,
							category: ['Food and Drink'],
							date: '2026-01-02',
							logo_url: null,
						},
					],
					modified: [],
					removed: [],
					next_cursor: 'cursor-3',
					has_more: false,
					request_id: 'req-2',
				})
			}),
		)

		const result = await getTransactions({ accessToken: 'access-sandbox-1' })

		expect(result).toHaveLength(2)
		expect(result.map((t: any) => t.id)).toEqual(['txn-a', 'txn-b'])
		expect(result[0].type).toBe('debit') // positive amount => debit per bank.actions.ts
	})

	it('returns whatever was collected so far instead of throwing on a sync error', async () => {
		server.use(
			http.post(`${PLAID_BASE}/transactions/sync`, () =>
				HttpResponse.json(
					{ error_code: 'INTERNAL_SERVER_ERROR' },
					{ status: 500 },
				),
			),
		)

		const result = await getTransactions({ accessToken: 'access-sandbox-1' })
		expect(result).toEqual([])
	})
})

describe('createTransfer', () => {
	it('authorizes then creates a Plaid transfer', async () => {
		const result = await createTransfer()
		expect(result).toMatchObject({ id: 'transfer-123', status: 'pending' })
	})

	it('returns undefined and does not throw when authorization fails', async () => {
		server.use(
			http.post(`${PLAID_BASE}/transfer/authorization/create`, () =>
				HttpResponse.json(
					{ error_code: 'TRANSFER_LIMIT_REACHED' },
					{ status: 400 },
				),
			),
		)

		const result = await createTransfer()
		expect(result).toBeUndefined()
	})
})
