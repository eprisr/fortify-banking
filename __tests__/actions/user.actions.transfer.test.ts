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
		.mockResolvedValueOnce({
			rows: sender ? [sender] : [],
			total: sender ? 1 : 0,
		})
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
// Self-transfer (moving money between the caller's own accounts) was
// originally spec'd here as a dedicated action with its own ownership check.
// Revisited under ADR-014: transferFunds already lets a caller send to any
// shareableId they possess — that's what P2P transfer is — so a self-transfer
// is just the case where sender and receiver resolve to the same userId.
// There's no separate hole to close with an ownership check; Dwolla's own
// funding-source/verified-customer requirements are the real security
// boundary, not who owns the Appwrite bank row. The UI (ToPicker) is what
// restricts the "to" list to the caller's own other accounts.
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
