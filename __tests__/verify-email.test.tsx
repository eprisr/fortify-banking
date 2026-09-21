/**
 * Verify Email Flow Tests
 *
 * Covers: the /verify-email page (RSC) and the VerifyEmail component it
 * falls back to for an unverified user waiting on the email.
 */

import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import VerificationPage from '@/app/(onboarding)/verify-email/page'
import VerifyEmail from '@/components/auth/VerifyEmail'
import {
	completeEmailVerification,
	getLoggedInUser,
	verifyEmail,
} from '@/lib/actions/user.actions'

jest.mock('next/server', () => ({
	...jest.requireActual('next/server'),
	connection: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/actions/user.actions', () => ({
	getLoggedInUser: jest.fn(),
	completeEmailVerification: jest.fn(),
	verifyEmail: jest.fn().mockResolvedValue({ success: true, data: null }),
}))

async function renderVerificationPage(
	searchParams: Record<string, string> = {},
) {
	return render(
		await VerificationPage({ searchParams: Promise.resolve(searchParams) }),
	)
}

describe('/verify-email page', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	// Regression: Appwrite's verification redirect only ever appends userId
	// and secret — never an `expire` param — so an `expire` query param (stale
	// bookmark, hand-crafted URL, etc.) must not be treated as a signal. A
	// bad/expired secret is only knowable by actually calling
	// completeEmailVerification and letting Appwrite reject it.
	it('ignores a stray expire param and still attempts real verification', async () => {
		;(getLoggedInUser as jest.Mock).mockResolvedValue({
			email: 'jane@example.com',
			verifiedEmail: false,
			userId: 'user-123',
		})
		;(completeEmailVerification as jest.Mock).mockResolvedValue({
			success: false,
			error: 'This link is invalid or has expired',
		})

		const { getByText, queryByText } = await renderVerificationPage({
			userId: 'user-123',
			secret: 'secret-abc',
			expire: '2000-01-01 00:00:00',
		})

		expect(completeEmailVerification).toHaveBeenCalledWith({
			userId: 'user-123',
			secret: 'secret-abc',
		})
		expect(getByText(/link invalid/i)).toBeInTheDocument()
		expect(queryByText(/link expired/i)).not.toBeInTheDocument()
	})

	it('shows the success message once completeEmailVerification succeeds', async () => {
		;(getLoggedInUser as jest.Mock).mockResolvedValue({
			email: 'jane@example.com',
			verifiedEmail: false,
			userId: 'user-123',
		})
		;(completeEmailVerification as jest.Mock).mockResolvedValue({
			success: true,
			data: null,
		})

		const { getByText } = await renderVerificationPage({
			userId: 'user-123',
			secret: 'secret-abc',
		})

		expect(getByText(/email verified/i)).toBeInTheDocument()
	})

	// Fixed: completeEmailVerification now runs on the userId/secret from the
	// link itself rather than requiring a session in the clicking browser, so
	// a user who opens the link on a different device/browser than the one
	// they signed up on (no matching session cookie) can still complete it.
	it('completes verification via the link token even with no logged-in session', async () => {
		;(getLoggedInUser as jest.Mock).mockResolvedValue(null)
		;(completeEmailVerification as jest.Mock).mockResolvedValue({
			success: true,
			data: null,
		})

		const { getByText } = await renderVerificationPage({
			userId: 'user-123',
			secret: 'secret-abc',
		})

		expect(completeEmailVerification).toHaveBeenCalledWith({
			userId: 'user-123',
			secret: 'secret-abc',
		})
		expect(getByText(/email verified/i)).toBeInTheDocument()
	})

	it('shows a sign-in prompt (not blank) with no session and no link token', async () => {
		;(getLoggedInUser as jest.Mock).mockResolvedValue(null)

		const { getByText } = await renderVerificationPage()

		expect(getByText(/not signed in/i)).toBeInTheDocument()
		expect(completeEmailVerification).not.toHaveBeenCalled()
	})

	it('does not render a blank page when verification fails', async () => {
		;(getLoggedInUser as jest.Mock).mockResolvedValue({
			email: 'jane@example.com',
			verifiedEmail: false,
			userId: 'user-123',
		})
		;(completeEmailVerification as jest.Mock).mockResolvedValue({
			success: false,
			error: 'This link is invalid or has expired',
		})

		const { container } = await renderVerificationPage({
			userId: 'user-123',
			secret: 'bad-secret',
		})

		expect(container.textContent?.trim()).not.toBe('')
	})
})

describe('VerifyEmail', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		window.sessionStorage.clear()
	})

	// Code review finding: the mount-guard only stops a second call within
	// the same mount (React Strict Mode's dev-only double-invoke) — it does
	// nothing for a genuinely new mount, so refreshing or revisiting the
	// page sends a brand new verification email every time.
	it('does not send a new verification email on a later, separate mount', () => {
		const { unmount } = render(<VerifyEmail email="jane@example.com" />)
		unmount()
		render(<VerifyEmail email="jane@example.com" />)

		expect(verifyEmail).toHaveBeenCalledTimes(1)
	})
})
