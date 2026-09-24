/**
 * user.actions.ts — enableMFA, disableMFA, generateRecoveryCodes.
 **/
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

import {
	disableMFA,
	enableMFA,
	generateRecoveryCodes,
} from '@/lib/actions/user.actions'
import { createSessionClient } from '@/lib/server/appwrite'
import { resolveNotificationsByType } from '@/lib/actions/notification.actions'

const mockCreateSessionClient = createSessionClient as jest.Mock
const mockResolveNotificationsByType = resolveNotificationsByType as jest.Mock

beforeEach(() => {
	jest.clearAllMocks()
	mockResolveNotificationsByType.mockResolvedValue({ success: true, data: null })
})

describe('enableMFA', () => {
	it('turns MFA on and resolves the pending security notification', async () => {
		const updateMFA = jest.fn().mockResolvedValue({})
		const get = jest.fn().mockResolvedValue({ $id: 'user-1' })
		mockCreateSessionClient.mockResolvedValue({ account: { updateMFA, get } })

		const result = await enableMFA()

		expect(result).toEqual({ success: true, data: null })
		expect(updateMFA).toHaveBeenCalledWith({ mfa: true })
		expect(mockResolveNotificationsByType).toHaveBeenCalledWith({
			userId: 'user-1',
			type: 'security_mfa',
		})
	})

	it('reports failure when updateMFA rejects', async () => {
		mockCreateSessionClient.mockResolvedValue({
			account: {
				updateMFA: jest.fn().mockRejectedValue(new Error('network error')),
				get: jest.fn().mockResolvedValue({ $id: 'user-1' }),
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
