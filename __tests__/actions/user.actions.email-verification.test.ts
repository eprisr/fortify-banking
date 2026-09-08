/**
 * user.actions.ts — verifyEmail, completeEmailVerification.
 **/
jest.mock('@/lib/server/appwrite', () => ({
	createAdminClient: jest.fn(),
	createSessionClient: jest.fn(),
}))

// jest.setup.tsx globally jest.mocks this module (for the component test
// suite's benefit) — undo that here so the real actions run.
jest.unmock('@/lib/actions/user.actions')

import {
	completeEmailVerification,
	verifyEmail,
} from '@/lib/actions/user.actions'
import { createSessionClient } from '@/lib/server/appwrite'

const mockCreateSessionClient = createSessionClient as jest.Mock

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
	it('verifies a valid secret', async () => {
		const updateEmailVerification = jest.fn().mockResolvedValue({})
		mockCreateSessionClient.mockResolvedValue({
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
	})

	// Code review finding: the catch block returns the raw Error/exception
	// object as `error`, violating the ActionResponse<T> contract every other
	// action in this file honors (`error` must be a string).
	it('returns a string error, not the raw exception, on a rejected secret', async () => {
		mockCreateSessionClient.mockResolvedValue({
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
