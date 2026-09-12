/**
 * user.actions.ts — signIn, completeMfaChallenge.
 **/
jest.mock('@/lib/server/appwrite', () => ({
	createAdminClient: jest.fn(),
	createSessionClient: jest.fn(),
}))

jest.mock('next/headers', () => ({
	cookies: jest.fn().mockResolvedValue({
		set: jest.fn(),
		delete: jest.fn(),
		get: jest.fn(),
	}),
}))

// jest.setup.tsx globally jest.mocks this module (for the component test
// suite's benefit) — undo that here so the real signIn runs.
jest.unmock('@/lib/actions/user.actions')

import { AuthenticationFactor } from 'node-appwrite'
import { cookies } from 'next/headers'
import {
	completeMfaChallenge,
	hasRealSession,
	requestMfaChallenge,
	signIn,
} from '@/lib/actions/user.actions'
import { createAdminClient, createSessionClient } from '@/lib/server/appwrite'

const mockCreateAdminClient = createAdminClient as jest.Mock
const mockCreateSessionClient = createSessionClient as jest.Mock

function mockSignInRejectsWith(error: { type: string; message: string }) {
	mockCreateAdminClient.mockResolvedValue({
		account: {
			createEmailPasswordSession: jest.fn().mockRejectedValue(error),
		},
	})
}

describe('signIn', () => {
	it('shows "Incorrect email or password" for a too-short/malformed password (general_argument_invalid), not Appwrite\'s raw wording', async () => {
		mockSignInRejectsWith({
			type: 'general_argument_invalid',
			message:
				'Invalid `password` param: Password must be between 8 and 256 characters long.',
		})

		const result = await signIn({ email: 'jane@example.com', password: 'x' })

		expect(result).toEqual({
			success: false,
			error: 'Incorrect email or password',
		})
	})

	it('still maps a genuine invalid-credentials rejection to the same message', async () => {
		mockSignInRejectsWith({
			type: 'user_invalid_credentials',
			message: 'Invalid credentials. Please check the email and password.',
		})

		const result = await signIn({
			email: 'jane@example.com',
			password: 'GoodPass1!',
		})

		expect(result).toEqual({
			success: false,
			error: 'Incorrect email or password',
		})
	})

	it('does not override an unrelated Appwrite error type', async () => {
		mockSignInRejectsWith({
			type: 'user_blocked',
			message: 'The current user has been blocked.',
		})

		const result = await signIn({
			email: 'jane@example.com',
			password: 'GoodPass1!',
		})

		expect(result).toEqual({
			success: false,
			error: 'This account has been blocked. Please contact support.',
		})
	})

	it('logs in directly when the account has no MFA enrolled', async () => {
		mockCreateAdminClient.mockResolvedValue({
			account: {
				createEmailPasswordSession: jest
					.fn()
					.mockResolvedValue({ secret: 'session-secret', userId: 'user-123' }),
			},
			table: {
				listRows: jest
					.fn()
					.mockResolvedValue({ rows: [{ $id: 'row-1', userId: 'user-123' }] }),
			},
		})
		mockCreateSessionClient.mockResolvedValue({
			account: { get: jest.fn().mockResolvedValue({ $id: 'user-123' }) },
		})

		const result = await signIn({
			email: 'jane@example.com',
			password: 'GoodPass1!',
		})

		expect(result).toEqual({
			success: true,
			mfaRequired: false,
			data: { $id: 'row-1', userId: 'user-123' },
		})
	})

	it('reports an MFA challenge instead of failing outright when the account requires a second factor', async () => {
		mockCreateAdminClient.mockResolvedValue({
			account: {
				createEmailPasswordSession: jest
					.fn()
					.mockResolvedValue({ secret: 'session-secret', userId: 'user-123' }),
			},
		})
		const createMFAChallenge = jest
			.fn()
			.mockResolvedValue({ $id: 'challenge-1' })
		mockCreateSessionClient.mockResolvedValue({
			account: {
				get: jest
					.fn()
					.mockRejectedValue({ type: 'user_more_factors_required' }),
				createMFAChallenge,
			},
		})

		const result = await signIn({
			email: 'jane@example.com',
			password: 'GoodPass1!',
		})

		expect(result).toEqual({
			success: true,
			mfaRequired: true,
			challengeId: 'challenge-1',
		})
		expect(createMFAChallenge).toHaveBeenCalledWith({
			factor: AuthenticationFactor.Email,
		})
	})

	it('fails normally when account.get() rejects for a reason other than MFA', async () => {
		mockCreateAdminClient.mockResolvedValue({
			account: {
				createEmailPasswordSession: jest
					.fn()
					.mockResolvedValue({ secret: 'session-secret', userId: 'user-123' }),
			},
		})
		mockCreateSessionClient.mockResolvedValue({
			account: {
				get: jest.fn().mockRejectedValue({ type: 'user_blocked' }),
				createMFAChallenge: jest.fn(),
			},
		})

		const result = await signIn({
			email: 'jane@example.com',
			password: 'GoodPass1!',
		})

		expect(result).toEqual({
			success: false,
			error: 'This account has been blocked. Please contact support.',
		})
	})
})

describe('completeMfaChallenge', () => {
	it('finishes authenticating on a valid recovery code', async () => {
		mockCreateSessionClient.mockResolvedValue({
			account: {
				updateMFAChallenge: jest.fn().mockResolvedValue({
					userId: 'user-123',
					secret: 'upgraded-session-secret',
				}),
			},
		})
		mockCreateAdminClient.mockResolvedValue({
			table: {
				listRows: jest
					.fn()
					.mockResolvedValue({ rows: [{ $id: 'row-1', userId: 'user-123' }] }),
			},
		})

		const result = await completeMfaChallenge({
			challengeId: 'challenge-1',
			code: 'aaaa1111',
		})

		const { set } = await cookies()
		expect(set).toHaveBeenCalledWith(
			'appwrite-session',
			'upgraded-session-secret',
			expect.objectContaining({ httpOnly: true, secure: true }),
		)

		expect(result).toEqual({
			success: true,
			data: { $id: 'row-1', userId: 'user-123' },
		})
	})

	it('falls back to a clear message for an unrecognized rejection type', async () => {
		mockCreateSessionClient.mockResolvedValue({
			account: {
				updateMFAChallenge: jest
					.fn()
					.mockRejectedValue({ type: 'some_unmapped_error_type' }),
			},
		})

		const result = await completeMfaChallenge({
			challengeId: 'challenge-1',
			code: 'wrong-code',
		})

		expect(result).toEqual({
			success: false,
			error: 'Invalid or expired code',
		})
	})
})

describe('requestMfaChallenge', () => {
	it("starts a recovery-code challenge when the account can't reach its email", async () => {
		const createMFAChallenge = jest
			.fn()
			.mockResolvedValue({ $id: 'challenge-2' })
		mockCreateSessionClient.mockResolvedValue({
			account: { createMFAChallenge },
		})

		const result = await requestMfaChallenge('recoverycode')

		expect(result).toEqual({
			success: true,
			data: { challengeId: 'challenge-2' },
		})
		expect(createMFAChallenge).toHaveBeenCalledWith({
			factor: AuthenticationFactor.Recoverycode,
		})
	})

	it('can switch back to an email challenge', async () => {
		const createMFAChallenge = jest
			.fn()
			.mockResolvedValue({ $id: 'challenge-3' })
		mockCreateSessionClient.mockResolvedValue({
			account: { createMFAChallenge },
		})

		const result = await requestMfaChallenge('email')

		expect(result).toEqual({
			success: true,
			data: { challengeId: 'challenge-3' },
		})
		expect(createMFAChallenge).toHaveBeenCalledWith({
			factor: AuthenticationFactor.Email,
		})
	})
})

describe('hasRealSession', () => {
	it('returns true when account.get() succeeds', async () => {
		mockCreateSessionClient.mockResolvedValue({
			account: { get: jest.fn().mockResolvedValue({ $id: 'user-123' }) },
		})

		expect(await hasRealSession()).toBe(true)
	})

	it('returns false when there is no session', async () => {
		mockCreateSessionClient.mockRejectedValue(new Error('No session'))

		expect(await hasRealSession()).toBe(false)
	})

	it('returns false when MFA is still pending', async () => {
		mockCreateSessionClient.mockResolvedValue({
			account: {
				get: jest
					.fn()
					.mockRejectedValue({ type: 'user_more_factors_required' }),
			},
		})

		expect(await hasRealSession()).toBe(false)
	})
})
