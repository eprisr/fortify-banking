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

import { transferFunds } from '@/lib/actions/user.actions'
import { createAdminClient } from '@/lib/server/appwrite'
import { createTransaction } from '@/lib/actions/transaction.actions'

const mockCreateAdminClient = createAdminClient as jest.Mock
const mockCreateTransaction = createTransaction as jest.Mock

const senderBankRow = {
	$id: 'bank-sender-1',
	accountId: 'plaid-account-sender',
	bankId: 'item-sender',
	accessToken: 'access-sandbox-sender',
	fundingSourceUrl: `${DWOLLA_BASE}/funding-sources/sender-fs`,
	userId: { $id: 'user-sender' },
	shareableId: 'irrelevant-here',
}

const receiverBankRow = {
	$id: 'bank-receiver-1',
	accountId: 'plaid-account-receiver',
	bankId: 'item-receiver',
	accessToken: 'access-sandbox-receiver',
	fundingSourceUrl: `${DWOLLA_BASE}/funding-sources/receiver-fs`,
	userId: { $id: 'user-receiver' },
	shareableId: 'irrelevant-here',
}

/** listRows is called sender-lookup-first, then receiver-lookup, matching
 * transferFunds' own call order (getBank, then getBankByAccountId). */
function mockTable({
	sender = senderBankRow,
	receiver = receiverBankRow,
}: {
	sender?: typeof senderBankRow | null
	receiver?: typeof receiverBankRow | null
} = {}) {
	const listRows = jest
		.fn()
		.mockResolvedValueOnce({ rows: sender ? [sender] : [], total: sender ? 1 : 0 })
		.mockResolvedValueOnce({
			rows: receiver ? [receiver] : [],
			total: receiver ? 1 : 0,
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
// NOT YET BUILT — spec for a dedicated same-owner "move money between my
// accounts" flow (same bank or across the user's own different linked
// banks). Decided 2026-08-26: this should be its own action, not just
// reusing transferFunds with a self-chosen shareableId, because:
//   - no recipientName/recipientEmail should be required — both accounts
//     belong to the same logged-in user, so those are redundant UI/params.
//   - it needs a server-side ownership check transferFunds has no reason to
//     have: reject if the two bank documents don't both belong to the
//     caller's own userId. Without that check, this would be a new way to
//     move money into an arbitrary bank document by ID.
//   - identify both accounts by their own bank document IDs directly
//     (like senderBankDocumentId today), not by encrypting/decrypting a
//     shareableId — there's no need to obscure an ID from yourself.
// It.todo() rather than real assertions, since none of this exists yet —
// there's nothing to import and run against, only a spec to track. See
// component_fixes_deferred memory for where this is queued.
// =============================================================================
describe('moveFundsBetweenOwnAccounts (not yet built)', () => {
	it.todo(
		'moves funds between two of the caller\'s own accounts at the same bank/institution',
	)
	it.todo(
		"moves funds between two of the caller's own accounts at different institutions",
	)
	it.todo('does not require recipientName or recipientEmail')
	it.todo('supports an optional note, same as transferFunds')
	it.todo(
		'rejects when the receiver bank document does not belong to the caller (ownership check)',
	)
	it.todo(
		'rejects when senderBankDocumentId and receiverBankDocumentId are the same account',
	)
	it.todo(
		'records a transaction with senderId === receiverId but distinct senderBankId/receiverBankId',
	)
	it.todo(
		'validates the amount with the same rules as transferFunds (positive, ≤ $1,000,000, ≤2dp) — confirm this cap should apply the same way to self-transfers, or if it should differ',
	)
})
