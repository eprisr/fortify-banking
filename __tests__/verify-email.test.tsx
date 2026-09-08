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
	getUserInfo,
	verifyEmail,
} from '@/lib/actions/user.actions'

jest.mock('next/server', () => ({
	...jest.requireActual('next/server'),
	connection: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/actions/user.actions', () => ({
	getLoggedInUser: jest.fn(),
	completeEmailVerification: jest.fn(),
	getUserInfo: jest.fn(),
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

	it('shows the expired-link message once the link is past its expiry', async () => {
		;(getLoggedInUser as jest.Mock).mockResolvedValue({
			email: 'jane@example.com',
			verifiedEmail: false,
			userId: 'user-123',
		})

		const { getByText } = await renderVerificationPage({
			userId: 'user-123',
			secret: 'secret-abc',
			expire: '2000-01-01 00:00:00',
		})

		expect(getByText(/link expired/i)).toBeInTheDocument()
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
			expire: '2999-01-01 00:00:00',
		})

		expect(getByText(/email verified/i)).toBeInTheDocument()
	})

	// Code review finding: there is no session-independent state — a user
	// who opens the verification link on a different device/browser than
	// the one they signed up on (no matching session cookie) gets `null`
	// back from getLoggedInUser() and the page renders nothing at all.
	it('does not render a blank page when there is no logged-in session', async () => {
		;(getLoggedInUser as jest.Mock).mockResolvedValue(null)

		const { container } = await renderVerificationPage({
			userId: 'user-123',
			secret: 'secret-abc',
		})

		expect(container.textContent?.trim()).not.toBe('')
	})

	// Code review finding: the page only has two rendered states, expired or
	// successful — any other failure (mismatched/invalid secret, transient
	// error) falls into neither and renders a blank page with no way to
	// retry or get back to sign-in.
	it('does not render a blank page when verification fails for a reason other than expiry', async () => {
		;(getLoggedInUser as jest.Mock).mockResolvedValue({
			email: 'jane@example.com',
			verifiedEmail: false,
			userId: 'user-123',
		})
		;(completeEmailVerification as jest.Mock).mockResolvedValue({
			success: false,
			error: 'This link is invalid or has expired',
		})
		;(getUserInfo as jest.Mock).mockResolvedValue({ verifiedEmail: false })

		const { container } = await renderVerificationPage({
			userId: 'user-123',
			secret: 'bad-secret',
			expire: '2999-01-01 00:00:00',
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
