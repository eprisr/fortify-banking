/**
 * user.actions.ts — enableMFA, disableMFA, generateRecoveryCodes.
 *
 * enableMFA calls getLoggedInUser() internally (to resolve the users-table
 * row's own $id for resolveNotificationsByType — see the comment at its
 * call site: that $id is NOT the same as the Appwrite Auth account's $id,
 * and using the wrong one was a real bug caught after a real signup).
 * getLoggedInUser needs cookies() + createSessionClient().account.get() +
 * createAdminClient().table.listRows() (getUserInfo), same as
 * notification.actions.test.ts's signIn() helper.
 **/
jest.mock('next/headers', () => ({ cookies: jest.fn() }))

jest.mock('@/lib/server/appwrite', () => ({
	createAdminClient: jest.fn(),
	createSessionClient: jest.fn(),
}))

jest.mock('@/lib/actions/notification.actions', () => ({
	notify: jest.fn(),
	resolveNotificationsByType: jest.fn(),
}))

// jest.setup.tsx globally jest.mocks this module (for the component test
// suite's benefit) — undo that here so the real actions run.
jest.unmock('@/lib/actions/user.actions')

import { cookies } from 'next/headers'
import {
	disableMFA,
	enableMFA,
	generateRecoveryCodes,
} from '@/lib/actions/user.actions'
import { createAdminClient, createSessionClient } from '@/lib/server/appwrite'
import { resolveNotificationsByType } from '@/lib/actions/notification.actions'

const mockCookies = cookies as unknown as jest.Mock
const mockCreateAdminClient = createAdminClient as jest.Mock
const mockCreateSessionClient = createSessionClient as jest.Mock
const mockResolveNotificationsByType = resolveNotificationsByType as jest.Mock

// The users-table row for the signed-in user — its own $id ('row-1') is
// what enableMFA should pass to resolveNotificationsByType, not the auth
// account's $id ('auth-1').
const userRow = { $id: 'row-1', userId: 'auth-1' }

beforeEach(() => {
	jest.clearAllMocks()
	mockResolveNotificationsByType.mockResolvedValue({ success: true, data: null })
	mockCookies.mockResolvedValue({ get: jest.fn().mockReturnValue(undefined) })
	mockCreateAdminClient.mockResolvedValue({
		table: {
			listRows: jest.fn().mockResolvedValue({ rows: [userRow], total: 1 }),
		},
	})
})

describe('enableMFA', () => {
	it("turns MFA on and resolves the notification using the user row's own $id, not the auth account's $id", async () => {
		const updateMFA = jest.fn().mockResolvedValue({})
		const get = jest.fn().mockResolvedValue({ $id: 'auth-1' })
		mockCreateSessionClient.mockResolvedValue({ account: { updateMFA, get } })

		const result = await enableMFA()

		expect(result).toEqual({ success: true, data: null })
		expect(updateMFA).toHaveBeenCalledWith({ mfa: true })
		expect(mockResolveNotificationsByType).toHaveBeenCalledWith({
			userId: 'row-1',
			type: 'security_mfa',
		})
	})

	it('reports failure when updateMFA rejects', async () => {
		mockCreateSessionClient.mockResolvedValue({
			account: {
				updateMFA: jest.fn().mockRejectedValue(new Error('network error')),
				get: jest.fn().mockResolvedValue({ $id: 'auth-1' }),
			},
		})

		const result = await enableMFA()

		expect(result).toEqual({
			success: false,
			error: 'Failed to enable multi-factor authentication',
		})
		expect(mockResolveNotificationsByType).not.toHaveBeenCalled()
	})

	it('still reports success if resolving the notification fails — MFA is already on by then', async () => {
		const updateMFA = jest.fn().mockResolvedValue({})
		const get = jest.fn().mockRejectedValue(new Error('session hiccup'))
		mockCreateSessionClient.mockResolvedValue({ account: { updateMFA, get } })

		const result = await enableMFA()

		expect(result).toEqual({ success: true, data: null })
	})
})

describe('disableMFA', () => {
	it('turns MFA off', async () => {
		const updateMFA = jest.fn().mockResolvedValue({})
		mockCreateSessionClient.mockResolvedValue({ account: { updateMFA } })

		const result = await disableMFA()

		expect(result).toEqual({ success: true, data: null })
		expect(updateMFA).toHaveBeenCalledWith({ mfa: false })
	})

	it('reports failure when updateMFA rejects', async () => {
		mockCreateSessionClient.mockResolvedValue({
			account: {
				updateMFA: jest.fn().mockRejectedValue(new Error('network error')),
			},
		})

		const result = await disableMFA()

		expect(result).toEqual({
			success: false,
			error: 'Failed to disable multi-factor authentication',
		})
	})
})

describe('generateRecoveryCodes', () => {
	it('returns freshly created codes on a first-ever call', async () => {
		const codes = { recoveryCodes: ['aaa', 'bbb'] }
		mockCreateSessionClient.mockResolvedValue({
			account: {
				createMFARecoveryCodes: jest.fn().mockResolvedValue(codes),
			},
		})

		const result = await generateRecoveryCodes()

		expect(result).toEqual({
			success: true,
			challengeRequired: false,
			data: codes,
		})
	})

	it('regenerates instead of failing forever once codes already exist', async () => {
		const regenerated = { recoveryCodes: ['ccc', 'ddd'] }
		mockCreateSessionClient.mockResolvedValue({
			account: {
				createMFARecoveryCodes: jest
					.fn()
					.mockRejectedValue({ type: 'user_recovery_codes_already_exists' }),
				updateMFARecoveryCodes: jest.fn().mockResolvedValue(regenerated),
			},
		})

		const result = await generateRecoveryCodes()

		expect(result).toEqual({
			success: true,
			challengeRequired: false,
			data: regenerated,
		})
	})

	it('reports challengeRequired when regenerating needs a fresh MFA challenge', async () => {
		mockCreateSessionClient.mockResolvedValue({
			account: {
				createMFARecoveryCodes: jest
					.fn()
					.mockRejectedValue({ type: 'user_recovery_codes_already_exists' }),
				updateMFARecoveryCodes: jest
					.fn()
					.mockRejectedValue({ type: 'user_challenge_required' }),
			},
		})

		const result = await generateRecoveryCodes()

		expect(result).toEqual({ success: true, challengeRequired: true })
	})

	it('fails cleanly if the regenerate call also fails', async () => {
		mockCreateSessionClient.mockResolvedValue({
			account: {
				createMFARecoveryCodes: jest
					.fn()
					.mockRejectedValue({ type: 'user_recovery_codes_already_exists' }),
				updateMFARecoveryCodes: jest
					.fn()
					.mockRejectedValue(new Error('still broken')),
			},
		})

		const result = await generateRecoveryCodes()

		expect(result).toEqual({
			success: false,
			error: 'Failed to generate recovery codes',
		})
	})

	it('does not attempt to regenerate for an unrelated error', async () => {
		const updateMFARecoveryCodes = jest.fn()
		mockCreateSessionClient.mockResolvedValue({
			account: {
				createMFARecoveryCodes: jest
					.fn()
					.mockRejectedValue(new Error('network error')),
				updateMFARecoveryCodes,
			},
		})

		const result = await generateRecoveryCodes()

		expect(result).toEqual({
			success: false,
			error: 'Failed to generate recovery codes',
		})
		expect(updateMFARecoveryCodes).not.toHaveBeenCalled()
	})
})
