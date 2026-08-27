/**
 * user.actions.ts — signIn only.
 **/
jest.mock('@/lib/server/appwrite', () => ({
	createAdminClient: jest.fn(),
	createSessionClient: jest.fn(),
}))

// jest.setup.tsx globally jest.mocks this module (for the component test
// suite's benefit) — undo that here so the real signIn runs.
jest.unmock('@/lib/actions/user.actions')

import { signIn } from '@/lib/actions/user.actions'
import { createAdminClient } from '@/lib/server/appwrite'

const mockCreateAdminClient = createAdminClient as jest.Mock

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
})
