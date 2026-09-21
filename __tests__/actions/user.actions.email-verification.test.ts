/**
 * user.actions.ts — verifyEmail, completeEmailVerification.
 **/
jest.mock('@/lib/server/appwrite', () => ({
	createAdminClient: jest.fn(),
	createGuestClient: jest.fn(),
	createSessionClient: jest.fn(),
}))

// jest.setup.tsx globally jest.mocks this module (for the component test
// suite's benefit) — undo that here so the real actions run.
jest.unmock('@/lib/actions/user.actions')

import {
	completeEmailVerification,
	verifyEmail,
} from '@/lib/actions/user.actions'
import {
	createAdminClient,
	createGuestClient,
	createSessionClient,
} from '@/lib/server/appwrite'

const mockCreateSessionClient = createSessionClient as jest.Mock
const mockCreateAdminClient = createAdminClient as jest.Mock
const mockCreateGuestClient = createGuestClient as jest.Mock

describe('verifyEmail', () => {
	const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL

	afterEach(() => {
		process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl
	})

	// Regression: verifyEmail used to build its URL via raw string
	// concatenation instead of the siteUrl() helper every other action uses,
	// reintroducing the trailing-slash landmine siteUrl() exists to prevent.
	it('never produces a double slash even when the site URL env var has a trailing slash', async () => {
		process.env.NEXT_PUBLIC_SITE_URL = 'https://fortify.example/'
		const createEmailVerification = jest.fn().mockResolvedValue({})
		mockCreateSessionClient.mockResolvedValue({
			account: { createEmailVerification },
		})

		await verifyEmail()

		expect(createEmailVerification).toHaveBeenCalledWith({
			url: 'https://fortify.example/verify-email',
		})
	})

	it('maps a rejected request to a safe message', async () => {
		mockCreateSessionClient.mockResolvedValue({
			account: {
				createEmailVerification: jest
					.fn()
					.mockRejectedValue({ type: 'user_not_found' }),
			},
		})

		const result = await verifyEmail()

		expect(result).toEqual({
			success: false,
			error: 'No account found with that information',
		})
	})
})

describe('completeEmailVerification', () => {
	// Uses createGuestClient — no session, no API key. The userId/secret pair
	// from the emailed link is the credential, and this Appwrite endpoint is
	// scoped to the "public" role: an API-key-authenticated (createAdminClient)
	// call gets the "applications" role instead and is rejected with "missing
	// scopes ([public])", regardless of whether the secret itself is valid.
	// The browser completing the link is often not the one that's logged in
	// (a different device, or a mail app's in-app browser with its own cookie
	// jar), same as resetPw — so createSessionClient isn't right either.
	it('verifies a valid secret without requiring an active session or API key', async () => {
		const updateEmailVerification = jest.fn().mockResolvedValue({})
		mockCreateGuestClient.mockResolvedValue({
			account: { updateEmailVerification },
		})

		const result = await completeEmailVerification({
			userId: 'user-123',
			secret: 'good-secret',
		})

		expect(result).toEqual({ success: true, data: null })
		expect(updateEmailVerification).toHaveBeenCalledWith({
			userId: 'user-123',
			secret: 'good-secret',
		})
		expect(mockCreateSessionClient).not.toHaveBeenCalled()
		expect(mockCreateAdminClient).not.toHaveBeenCalled()
	})

	// Code review finding: the catch block returns the raw Error/exception
	// object as `error`, violating the ActionResponse<T> contract every other
	// action in this file honors (`error` must be a string).
	it('returns a string error, not the raw exception, on a rejected secret', async () => {
		mockCreateGuestClient.mockResolvedValue({
			account: {
				updateEmailVerification: jest
					.fn()
					.mockRejectedValue({ type: 'user_invalid_token' }),
			},
		})

		const result = await completeEmailVerification({
			userId: 'user-123',
			secret: 'bad-secret',
		})

		expect(result.success).toBe(false)
		expect(typeof result.error).toBe('string')
	})
})
