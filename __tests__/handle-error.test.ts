/**
 * lib/utils.ts — handleError only.
 */
import { handleError } from '@/lib/utils'

describe('handleError', () => {
	it('maps a known Appwrite error type to safe copy, not the raw message', () => {
		const appwriteError = {
			type: 'general_argument_invalid',
			message:
				'Invalid `password` param: Password must be between 8 and 256 characters long.',
			code: 400,
			response: '{"message":"Invalid `password` param..."}',
		}

		const result = handleError(appwriteError, 'Failed to update password')

		expect(result.success).toBe(false)
		expect(result.error).not.toContain('password` param')
		expect(result.error).not.toBe(appwriteError.message)
	})

	it.each([
		['user_invalid_credentials', 'Incorrect email or password'],
		['user_password_mismatch', 'Passwords do not match'],
		['user_blocked', 'This account has been blocked. Please contact support.'],
		['user_not_found', 'No account found with that information'],
		['user_already_exists', 'An account with that email already exists'],
		['user_invalid_token', 'This link is invalid or has expired'],
		[
			'password_recently_used',
			"Please choose a password you haven't used recently",
		],
		[
			'password_personal_data',
			"Your password can't contain your name, email, or phone number",
		],
		[
			'general_argument_invalid',
			"That value doesn't meet the required format. Please check your entry and try again.",
		],
		[
			'general_rate_limit_exceeded',
			'Too many attempts. Please wait a moment and try again.',
		],
	])('maps Appwrite type %s to %j', (type, expected) => {
		const result = handleError(
			{ type, message: 'raw appwrite text' },
			'fallback',
		)
		expect(result).toEqual({ success: false, error: expected })
	})

	it('falls back to the caller-provided message for an unrecognized Appwrite error type', () => {
		const result = handleError(
			{
				type: 'some_future_appwrite_error_type',
				message: 'raw internal wording',
			},
			'Failed to update password',
		)

		expect(result).toEqual({
			success: false,
			error: 'Failed to update password',
		})
	})

	it('passes through the message of a plain app-thrown Error unchanged (no .type)', () => {
		const result = handleError(
			new Error(
				'No eligible checking or savings account was found for this bank connection',
			),
			'Bank connection failed',
		)

		expect(result).toEqual({
			success: false,
			error:
				'No eligible checking or savings account was found for this bank connection',
		})
	})

	it('falls back to the caller-provided message when the error has neither .type nor .message', () => {
		const result = handleError({}, 'Something went wrong')
		expect(result).toEqual({ success: false, error: 'Something went wrong' })
	})
})
