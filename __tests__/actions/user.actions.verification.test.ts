/**
 * user.actions.ts — getVerificationStatus, verifyIdentity, findRecipientByEmail.
 *
 * Same approach as user.actions.transfer.test.ts: mock one layer below
 * (createAdminClient/createSessionClient for Appwrite, dwolla.actions for
 * Dwolla) so the real getLoggedInUser/getUserInfo/getBanks orchestration
 * runs, rather than mocking user.actions.ts itself.
 */
jest.mock('next/headers', () => ({ cookies: jest.fn() }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

jest.mock('@/lib/server/appwrite', () => ({
	createAdminClient: jest.fn(),
	createSessionClient: jest.fn(),
}))

jest.mock('@/lib/actions/dwolla.actions', () => ({
	getDwollaCustomer: jest.fn(),
	updateDwollaCustomer: jest.fn(),
}))

jest.unmock('@/lib/actions/user.actions')

import { cookies } from 'next/headers'
import {
	findRecipientByEmail,
	getVerificationStatus,
	verifyIdentity,
} from '@/lib/actions/user.actions'
import { createAdminClient, createSessionClient } from '@/lib/server/appwrite'
import { getDwollaCustomer, updateDwollaCustomer } from '@/lib/actions/dwolla.actions'

const mockCookies = cookies as unknown as jest.Mock
const mockCreateAdminClient = createAdminClient as jest.Mock
const mockCreateSessionClient = createSessionClient as jest.Mock
const mockGetDwollaCustomer = getDwollaCustomer as jest.Mock
const mockUpdateDwollaCustomer = updateDwollaCustomer as jest.Mock

const loggedInUserRow = {
	$id: 'user-123',
	userId: 'user-123',
	email: 'jane@example.com',
	firstName: 'Jane',
	lastName: 'Doe',
	dwollaCustomerUrl: 'https://api-sandbox.dwolla.com/customers/customer-123',
	dwollaCustomerId: 'customer-123',
}

const validKyc = {
	address1: '99-99 33rd St',
	city: 'Jackson Heights',
	state: 'NY',
	postalCode: '11372',
	dateOfBirth: '1990-01-01',
	ssn: '1234',
}

/** Sets up a signed-in (non-demo) user backed by a fake Appwrite table. */
function signIn({ listRows }: { listRows: jest.Mock }) {
	mockCookies.mockResolvedValue({ get: jest.fn().mockReturnValue(undefined) })
	mockCreateSessionClient.mockResolvedValue({
		account: { get: jest.fn().mockResolvedValue({ $id: 'user-123', emailVerification: true, mfa: false }) },
	})
	mockCreateAdminClient.mockResolvedValue({ table: { listRows } })
}

function signInAsDemo() {
	mockCookies.mockResolvedValue({ get: jest.fn().mockReturnValue('1') })
}

beforeEach(() => {
	jest.clearAllMocks()
})

describe('getVerificationStatus', () => {
	it("returns 'unverified' without calling Dwolla in demo mode", async () => {
		signInAsDemo()

		const result = await getVerificationStatus()

		expect(result).toEqual({ success: true, data: { status: 'unverified' } })
		expect(mockGetDwollaCustomer).not.toHaveBeenCalled()
	})

	it("returns the live Dwolla status for a real user", async () => {
		const listRows = jest
			.fn()
			.mockResolvedValueOnce({ rows: [loggedInUserRow], total: 1 })
		signIn({ listRows })
		mockGetDwollaCustomer.mockResolvedValue({ status: 'verified' })

		const result = await getVerificationStatus()

		expect(mockGetDwollaCustomer).toHaveBeenCalledWith(loggedInUserRow.dwollaCustomerUrl)
		expect(result).toEqual({ success: true, data: { status: 'verified' } })
	})

	it('fails when Dwolla cannot be reached', async () => {
		const listRows = jest
			.fn()
			.mockResolvedValueOnce({ rows: [loggedInUserRow], total: 1 })
		signIn({ listRows })
		mockGetDwollaCustomer.mockResolvedValue(undefined)

		const result = await getVerificationStatus()

		expect(result.success).toBe(false)
	})

	it('fails when not signed in', async () => {
		const listRows = jest.fn().mockResolvedValueOnce({ rows: [], total: 0 })
		signIn({ listRows })

		const result = await getVerificationStatus()

		expect(result.success).toBe(false)
	})
})

describe('verifyIdentity', () => {
	it('rejects invalid input before touching Dwolla', async () => {
		const result = await verifyIdentity({ ...validKyc, ssn: 'not-digits' })

		expect(result.success).toBe(false)
		expect(mockUpdateDwollaCustomer).not.toHaveBeenCalled()
	})

	it('is not available in demo mode', async () => {
		signInAsDemo()

		const result = await verifyIdentity(validKyc)

		expect(result).toEqual({
			success: false,
			error: 'Verification is not available in demo mode',
		})
		expect(mockUpdateDwollaCustomer).not.toHaveBeenCalled()
	})

	it("submits the caller's own name/email plus the KYC fields to Dwolla", async () => {
		const listRows = jest
			.fn()
			.mockResolvedValueOnce({ rows: [loggedInUserRow], total: 1 })
		signIn({ listRows })
		mockUpdateDwollaCustomer.mockResolvedValue({ status: 'verified' })

		const result = await verifyIdentity(validKyc)

		expect(mockUpdateDwollaCustomer).toHaveBeenCalledWith(
			expect.objectContaining({
				customerUrl: loggedInUserRow.dwollaCustomerUrl,
				firstName: 'Jane',
				lastName: 'Doe',
				email: 'jane@example.com',
				address1: validKyc.address1,
				ssn: '1234',
			}),
		)
		expect(result).toEqual({ success: true, data: { status: 'verified' } })
	})

	it("surfaces Dwolla's real error message on failure", async () => {
		const listRows = jest
			.fn()
			.mockResolvedValueOnce({ rows: [loggedInUserRow], total: 1 })
		signIn({ listRows })
		mockUpdateDwollaCustomer.mockRejectedValue({
			body: { _embedded: { errors: [{ message: 'Invalid SSN' }] } },
		})

		const result = await verifyIdentity(validKyc)

		expect(result).toEqual({ success: false, error: 'Invalid SSN' })
	})

	it('reports a retry status without treating it as a failure', async () => {
		const listRows = jest
			.fn()
			.mockResolvedValueOnce({ rows: [loggedInUserRow], total: 1 })
		signIn({ listRows })
		mockUpdateDwollaCustomer.mockResolvedValue({ status: 'retry' })

		const result = await verifyIdentity(validKyc)

		expect(result).toEqual({ success: true, data: { status: 'retry' } })
	})
})

describe('findRecipientByEmail', () => {
	it('rejects an invalid email before querying Appwrite', async () => {
		const result = await findRecipientByEmail('not-an-email')
		expect(result.success).toBe(false)
		expect(mockCreateAdminClient).not.toHaveBeenCalled()
	})

	it("rejects the caller's own email", async () => {
		const listRows = jest
			.fn()
			.mockResolvedValueOnce({ rows: [loggedInUserRow], total: 1 })
		signIn({ listRows })

		const result = await findRecipientByEmail(loggedInUserRow.email)

		expect(result.success).toBe(false)
	})

	it('returns a generic error when no user matches the email', async () => {
		const listRows = jest
			.fn()
			.mockResolvedValueOnce({ rows: [loggedInUserRow], total: 1 }) // getLoggedInUser
			.mockResolvedValueOnce({ rows: [], total: 0 }) // recipient lookup by email
		signIn({ listRows })

		const result = await findRecipientByEmail('nobody@example.com')

		expect(result).toEqual({ success: false, error: 'No matching recipient found' })
	})

	it('returns a generic error when the matched user has no linked bank', async () => {
		const recipientRow = { $id: 'user-456', firstName: 'Jordan', lastName: 'Lee' }
		const listRows = jest
			.fn()
			.mockResolvedValueOnce({ rows: [loggedInUserRow], total: 1 }) // getLoggedInUser
			.mockResolvedValueOnce({ rows: [recipientRow], total: 1 }) // recipient lookup by email
			.mockResolvedValueOnce({ rows: [], total: 0 }) // getBanks for recipient
		signIn({ listRows })

		const result = await findRecipientByEmail('jordan@example.com')

		expect(result).toEqual({ success: false, error: 'No matching recipient found' })
	})

	it('returns only the name and shareableId for a valid recipient', async () => {
		const recipientRow = { $id: 'user-456', firstName: 'Jordan', lastName: 'Lee' }
		const recipientBank = { $id: 'bank-456', shareableId: 'recv-share-1' }
		const listRows = jest
			.fn()
			.mockResolvedValueOnce({ rows: [loggedInUserRow], total: 1 }) // getLoggedInUser
			.mockResolvedValueOnce({ rows: [recipientRow], total: 1 }) // recipient lookup by email
			.mockResolvedValueOnce({ rows: [recipientBank], total: 1 }) // getBanks for recipient
		signIn({ listRows })

		const result = await findRecipientByEmail('jordan@example.com')

		expect(result).toEqual({
			success: true,
			data: { name: 'Jordan Lee', shareableId: 'recv-share-1' },
		})
	})
})
