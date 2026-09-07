/**
 * user.actions.ts — enableMFA, disableMFA, generateRecoveryCodes.
 **/
jest.mock('@/lib/server/appwrite', () => ({
	createAdminClient: jest.fn(),
	createSessionClient: jest.fn(),
}))

// jest.setup.tsx globally jest.mocks this module (for the component test
// suite's benefit) — undo that here so the real actions run.
jest.unmock('@/lib/actions/user.actions')

import {
	disableMFA,
	enableMFA,
	generateRecoveryCodes,
} from '@/lib/actions/user.actions'
import { createAdminClient, createSessionClient } from '@/lib/server/appwrite'

const mockCreateSessionClient = createSessionClient as jest.Mock
const mockCreateAdminClient = createAdminClient as jest.Mock

function mockAppwriteClients({
	updateMFA,
	get,
	listRows,
	updateRow,
}: {
	updateMFA: jest.Mock
	get: jest.Mock
	listRows?: jest.Mock
	updateRow?: jest.Mock
}) {
	mockCreateSessionClient.mockResolvedValue({
		account: { updateMFA, get },
	})
	mockCreateAdminClient.mockResolvedValue({
		table: {
			listRows:
				listRows ??
				jest.fn().mockResolvedValue({ rows: [{ $id: 'row-1' }] }),
			updateRow: updateRow ?? jest.fn().mockResolvedValue({}),
		},
	})
}

describe('enableMFA', () => {
	it('turns MFA on and mirrors it onto the user row', async () => {
		const updateRow = jest.fn().mockResolvedValue({})
		mockAppwriteClients({
			updateMFA: jest.fn().mockResolvedValue({}),
			get: jest.fn().mockResolvedValue({ mfa: true }),
			updateRow,
		})

		const result = await enableMFA('user-123')

		expect(result).toEqual({ success: true, data: null })
		expect(updateRow).toHaveBeenCalledWith(
			expect.objectContaining({
				rowId: 'row-1',
				data: { mfa: true },
			}),
		)
	})

	it('reports failure and never touches the DB row when updateMFA itself rejects', async () => {
		const updateRow = jest.fn()
		mockAppwriteClients({
			updateMFA: jest.fn().mockRejectedValue(new Error('network error')),
			get: jest.fn(),
			updateRow,
		})

		const result = await enableMFA('user-123')

		expect(result).toEqual({
			success: false,
			error: 'Failed to enable multi-factor authentication',
		})
		expect(updateRow).not.toHaveBeenCalled()
	})

	// Code review finding: enableMFA/disableMFA can desync Appwrite's real MFA
	// flag from our cached `mfa` DB field. If account.updateMFA(...) already
	// succeeded, the account is genuinely enrolled in MFA regardless of what
	// happens next — a later read/mirror failure should not be reported to
	// the caller as "failed to enable MFA".
	it('still reports success once updateMFA succeeds, even if verifying/mirroring it afterward fails', async () => {
		mockAppwriteClients({
			updateMFA: jest.fn().mockResolvedValue({}),
			get: jest.fn().mockRejectedValue(new Error('network blip')),
		})

		const result = await enableMFA('user-123')

		expect(result.success).toBe(true)
	})
})

describe('disableMFA', () => {
	it('turns MFA off and mirrors it onto the user row', async () => {
		const updateRow = jest.fn().mockResolvedValue({})
		mockAppwriteClients({
			updateMFA: jest.fn().mockResolvedValue({}),
			get: jest.fn().mockResolvedValue({ mfa: false }),
			updateRow,
		})

		const result = await disableMFA('user-123')

		expect(result).toEqual({ success: true, data: null })
		expect(updateRow).toHaveBeenCalledWith(
			expect.objectContaining({
				rowId: 'row-1',
				data: { mfa: false },
			}),
		)
	})

	it('reports failure and never touches the DB row when updateMFA itself rejects', async () => {
		const updateRow = jest.fn()
		mockAppwriteClients({
			updateMFA: jest.fn().mockRejectedValue(new Error('network error')),
			get: jest.fn(),
			updateRow,
		})

		const result = await disableMFA('user-123')

		expect(result).toEqual({
			success: false,
			error: 'Failed to disable multi-factor authentication',
		})
		expect(updateRow).not.toHaveBeenCalled()
	})

	it('still reports success once updateMFA succeeds, even if verifying/mirroring it afterward fails', async () => {
		mockAppwriteClients({
			updateMFA: jest.fn().mockResolvedValue({}),
			get: jest.fn().mockRejectedValue(new Error('network blip')),
		})

		const result = await disableMFA('user-123')

		expect(result.success).toBe(true)
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

		expect(result).toEqual({ success: true, data: codes })
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

		expect(result).toEqual({ success: true, data: regenerated })
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
