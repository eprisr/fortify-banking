/**
 * user.actions.ts — transferFunds only.
 *
 * transferFunds calls getBank/getBankByAccountId, which are defined in the
 * *same* module. jest.mock's partial-mock pattern
 * (`{ ...jest.requireActual(...), getBank: jest.fn() }`) can't intercept
 * that — same-module calls resolve to the local function binding at compile
 * time, not the exported object, so the mock is invisible to transferFunds
 * (verified empirically before writing this file). Instead this mocks one
 * level lower, at createAdminClient (@/lib/server/appwrite) — a genuine
 * cross-module import — so getBank/getBankByAccountId/decryptId/
 * transferFunds all run for real, against a fake Appwrite table. Only
 * createTransaction (transaction.actions.ts, a different module) and Dwolla
 * (via MSW) are stubbed at the edges.
 */
import '../../test/msw/setup'
import { HttpResponse, http } from 'msw'
import { server } from '../../test/msw/server'
import { DWOLLA_BASE } from '../../test/msw/handlers/dwolla'
import { encryptId } from '@/lib/server/encryption'

jest.mock('next/headers', () => ({ cookies: jest.fn() }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

jest.mock('@/lib/server/appwrite', () => ({
	createAdminClient: jest.fn(),
	createSessionClient: jest.fn(),
}))

jest.mock('@/lib/actions/transaction.actions', () => ({
	createTransaction: jest.fn(),
}))

// jest.setup.tsx globally jest.mocks this module (for the component test
// suite's benefit) — undo that here so the real transferFunds runs.
jest.unmock('@/lib/actions/user.actions')

import { cookies } from 'next/headers'
import { transferFunds } from '@/lib/actions/user.actions'
import { createAdminClient, createSessionClient } from '@/lib/server/appwrite'
import { createTransaction } from '@/lib/actions/transaction.actions'

const mockCookies = cookies as unknown as jest.Mock
const mockCreateAdminClient = createAdminClient as jest.Mock
const mockCreateSessionClient = createSessionClient as jest.Mock
const mockCreateTransaction = createTransaction as jest.Mock

const senderBankRow = {
	$id: 'bank-sender-1',
	accountId: 'plaid-account-sender',
	bankId: 'item-sender',
	accessToken: 'access-sandbox-sender',
	fundingSourceUrl: `${DWOLLA_BASE}/funding-sources/sender-fs`,
	userId: 'user-sender',
	shareableId: 'irrelevant-here',
}

const receiverBankRow = {
	$id: 'bank-receiver-1',
	accountId: 'plaid-account-receiver',
	bankId: 'item-receiver',
	accessToken: 'access-sandbox-receiver',
	fundingSourceUrl: `${DWOLLA_BASE}/funding-sources/receiver-fs`,
	userId: 'user-receiver',
	shareableId: 'irrelevant-here',
}

// The caller's own session — by default this is the sender, since that's
// who's allowed to move money out of senderBankRow. Tests that want a
// mismatched caller (the ownership-check case) override $id/userId.
const loggedInUserRow = {
	$id: senderBankRow.userId,
	userId: senderBankRow.userId,
	email: 'jane@example.com',
	firstName: 'Jane',
	lastName: 'Doe',
	dwollaCustomerUrl: `${DWOLLA_BASE}/customers/customer-sender`,
	dwollaCustomerId: 'customer-sender',
}

function mockTable({
	sender = senderBankRow,
	receiver = receiverBankRow,
	loggedInUser = loggedInUserRow,
}: {
	sender?: typeof senderBankRow | null
	receiver?: typeof receiverBankRow | null
	loggedInUser?: typeof loggedInUserRow
} = {}) {
	const listRows = jest.fn(async ({ tableId, queries }: any) => {
		const query = String(queries?.[0] ?? '')
		if (tableId === process.env.APPWRITE_USER_COLLECTION_ID) {
			return { rows: [loggedInUser], total: 1 }
		}
		if (query.includes('"attribute":"$id"')) {
			return { rows: sender ? [sender] : [], total: sender ? 1 : 0 }
		}
		if (query.includes('"attribute":"accountId"')) {
			return { rows: receiver ? [receiver] : [], total: receiver ? 1 : 0 }
		}
		throw new Error(`Unexpected listRows call: ${tableId} ${query}`)
	})

	mockCookies.mockResolvedValue({ get: jest.fn().mockReturnValue(undefined) })
	mockCreateSessionClient.mockResolvedValue({
		account: {
			get: jest.fn().mockResolvedValue({
				$id: loggedInUser.$id,
				emailVerification: true,
				mfa: false,
			}),
		},
	})
	mockCreateAdminClient.mockResolvedValue({ table: { listRows } })
	return listRows
}

const validParams = () => ({
	senderBankDocumentId: senderBankRow.$id,
	receiverShareableId: encryptId(receiverBankRow.accountId),
	amount: '25.00',
	recipientName: 'Jane Doe',
	recipientEmail: 'jane@example.com',
})

beforeEach(() => {
	mockCreateTransaction.mockResolvedValue({ $id: 'transaction-1' })
})

describe('transferFunds — happy path', () => {
	it('moves money via Dwolla and records the transaction', async () => {
		mockTable()

		const result = await transferFunds(validParams())

		expect(result).toEqual({ success: true, data: null })
		expect(mockCreateTransaction).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'Jane Doe',
				email: 'jane@example.com',
				amount: '25.00',
				senderId: 'user-sender',
				senderBankId: senderBankRow.$id,
				receiverId: 'user-receiver',
				receiverBankId: receiverBankRow.$id,
			}),
		)
	})

	it('accepts an optional note and forwards it to the transaction record', async () => {
		mockTable()

		const result = await transferFunds({ ...validParams(), note: 'Rent' })

		expect(result).toEqual({ success: true, data: null })
		expect(mockCreateTransaction).toHaveBeenCalledWith(
			expect.objectContaining({ note: 'Rent' }),
		)
	})

	it('completes with no note at all (note is genuinely optional)', async () => {
		mockTable()

		const result = await transferFunds(validParams())

		expect(result).toEqual({ success: true, data: null })
		expect(mockCreateTransaction).toHaveBeenCalledWith(
			expect.objectContaining({ note: undefined }),
		)
	})
})

describe('transferFunds — validation', () => {
	it('rejects an invalid amount before touching Dwolla or Appwrite', async () => {
		const result = await transferFunds({ ...validParams(), amount: '0.00' })

		expect(result.success).toBe(false)
		expect(mockCreateAdminClient).not.toHaveBeenCalled()
	})

	it('rejects an amount over the $1,000,000 cap', async () => {
		const result = await transferFunds({
			...validParams(),
			amount: '1000000.01',
		})

		expect(result.success).toBe(false)
	})
})

describe('transferFunds — lookup failures', () => {
	it('fails when the sender bank document does not exist', async () => {
		mockTable({ sender: null })

		const result = await transferFunds(validParams())

		expect(result.success).toBe(false)
		expect(mockCreateTransaction).not.toHaveBeenCalled()
	})

	it('fails when the receiver shareableId does not resolve to a bank', async () => {
		mockTable({ receiver: null })

		const result = await transferFunds(validParams())

		expect(result).toEqual({ success: false, error: 'Bank not found' })
		expect(mockCreateTransaction).not.toHaveBeenCalled()
	})
})

describe('transferFunds — downstream failures', () => {
	it('fails without recording a transaction when the Dwolla transfer itself fails', async () => {
		mockTable()
		server.use(
			http.post(`${DWOLLA_BASE}/transfers`, () =>
				HttpResponse.json({ message: 'insufficient funds' }, { status: 400 }),
			),
		)

		const result = await transferFunds(validParams())

		expect(result).toEqual({
			success: false,
			error: 'Failed to create transfer',
		})
		expect(mockCreateTransaction).not.toHaveBeenCalled()
	})

	it('reports failure when the Dwolla transfer succeeds but recording the transaction fails', async () => {
		mockTable()
		mockCreateTransaction.mockResolvedValue(undefined)

		const result = await transferFunds(validParams())

		expect(result).toEqual({
			success: false,
			error: 'Failed to record transaction',
		})
	})
})

// =============================================================================
// Self-transfer (moving money between the caller's own accounts) was
// originally spec'd here as a dedicated action with its own ownership check.
// Revisited under ADR-014: transferFunds already lets a caller send to any
// shareableId they possess — that's what P2P transfer is — so a self-transfer
// is just the case where sender and receiver resolve to the same userId. The
// UI (AccountPicker) is what restricts the "to" list to the caller's own
// other accounts, but the receiver side never needed a server-side ownership
// check — sending to someone else's shareableId is the whole point of P2P.
//
// The *sender* side is a different story: see "transferFunds —
// authorization" below. An earlier version of this comment reasoned that
// Dwolla's own funding-source/verified-customer requirements were the real
// security boundary there too — that was wrong. Dwolla has no way to know
// which Appwrite user "owns" a funding source from our side; it trusts
// whatever funding-source URL our server sends it. Nothing stopped
// transferFunds from moving money out of a bank that didn't belong to the
// caller until the ownership check below was added (risk-check pass,
// 2026-09-19).
// =============================================================================
describe('transferFunds — self-transfer (same user, two accounts)', () => {
	it('moves money when the sender and receiver bank both belong to the same user', async () => {
		const sameUserReceiver = {
			...receiverBankRow,
			userId: senderBankRow.userId,
		}
		mockTable({ receiver: sameUserReceiver })

		const result = await transferFunds(validParams())

		expect(result).toEqual({ success: true, data: null })
		expect(mockCreateTransaction).toHaveBeenCalledWith(
			expect.objectContaining({
				senderId: senderBankRow.userId,
				receiverId: senderBankRow.userId,
				senderBankId: senderBankRow.$id,
				receiverBankId: sameUserReceiver.$id,
			}),
		)
	})
})

describe('transferFunds — authorization', () => {
	it("rejects a sender bank that doesn't belong to the caller", async () => {
		// The signed-in caller is a different user than the one who owns
		// senderBankRow — e.g. an attacker who obtained/guessed another
		// user's bank document ID and tried to use it as their funding
		// source.
		mockTable({
			loggedInUser: {
				...loggedInUserRow,
				$id: 'user-attacker',
				userId: 'user-attacker',
			},
		})

		const result = await transferFunds(validParams())

		expect(result).toEqual({ success: false, error: 'Bank not found' })
		expect(mockCreateTransaction).not.toHaveBeenCalled()
	})
})

describe('transferFunds — verification-tiered limit', () => {
	it('rejects an unverified sender over the unverified limit', async () => {
		mockTable()
		server.use(
			http.get(`${DWOLLA_BASE}/customers/:customerId`, () =>
				HttpResponse.json({ status: 'unverified' }),
			),
		)

		const result = await transferFunds({ ...validParams(), amount: '5000.01' })

		expect(result).toEqual({
			success: false,
			error: 'This exceeds your $5,000 weekly limit',
		})
		expect(mockCreateTransaction).not.toHaveBeenCalled()
	})

	it('allows a verified sender above the unverified limit but within the verified cap', async () => {
		mockTable()
		// Default MSW handler already returns status: 'verified'.

		const result = await transferFunds({ ...validParams(), amount: '7500.00' })

		expect(result).toEqual({ success: true, data: null })
	})

	it('rejects a verified sender over the verified per-transfer limit', async () => {
		mockTable()

		const result = await transferFunds({ ...validParams(), amount: '10000.01' })

		expect(result).toEqual({
			success: false,
			error: 'This exceeds your $10,000 per-transfer limit',
		})
		expect(mockCreateTransaction).not.toHaveBeenCalled()
	})
})
