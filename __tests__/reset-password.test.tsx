/**
 * Reset Password Flow Tests
 *
 * Covers: ResetPassword page (RSC — expired link, success, and form states)
 * and AuthForm in 'reset-pw' mode. This flow previously had no test
 * coverage.
 *
 * Unlike the email/password fields (see signin.test.tsx's note on the
 * CustomInput FormMessage bug), confirmPassword is the one field name that
 * bug doesn't affect, so "Passwords must match" is expected to actually
 * render here.
 */

import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { useRouter } from 'next/navigation'
import AuthForm from '@/components/AuthForm'
import ResetPasswordPage from '@/app/(auth)/reset-pw/page'
import { resetPw } from '@/lib/actions/user.actions'

jest.mock('@/components/Navbar', () => () => <nav data-testid="navbar" />)

jest.mock('next/server', () => ({
	...jest.requireActual('next/server'),
	connection: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/actions/user.actions', () => ({
	signIn: jest.fn(),
	forgotPw: jest.fn(),
	resetPw: jest.fn(),
}))

const mockPush = jest.fn()

function setupRouter() {
	;(useRouter as jest.Mock).mockReturnValue({
		push: mockPush,
		replace: jest.fn(),
		refresh: jest.fn(),
		back: jest.fn(),
		forward: jest.fn(),
	})
}

async function renderResetPage(
	searchParams: Record<string, string> = {},
) {
	return render(await ResetPasswordPage({ searchParams: Promise.resolve(searchParams) }))
}

describe('Reset Password Flow', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		setupRouter()
	})

	// =========================================================================
	describe('ResetPassword Page — link states', () => {
		// =========================================================================

		it('shows the expired-link message when expire is in the past', async () => {
			await renderResetPage({
				userId: 'user-123',
				secret: 'secret-abc',
				expire: '2000-01-01 00:00:00',
			})
			expect(
				screen.getByText('This password link has expired.'),
			).toBeInTheDocument()
			expect(
				screen.getByRole('link', { name: /request a new link/i }),
			).toHaveAttribute('href', '/forgot-password')
		})

		it('shows the success message when success=true', async () => {
			await renderResetPage({ success: 'true' })
			expect(
				screen.getByText('Change password successfully!'),
			).toBeInTheDocument()
			expect(screen.getByRole('link', { name: /ok/i })).toHaveAttribute(
				'href',
				'/signin',
			)
		})

		it('renders the AuthForm when neither expired nor successful', async () => {
			await renderResetPage({ userId: 'user-123', secret: 'secret-abc' })
			expect(
				screen.getByRole('button', { name: /reset password/i }),
			).toBeInTheDocument()
		})

		it('renders the Navbar in every state', async () => {
			await renderResetPage({ success: 'true' })
			expect(screen.getByTestId('navbar')).toBeInTheDocument()
		})
	})

	// =========================================================================
	describe('AuthForm — reset-pw mode rendering', () => {
		// =========================================================================

		beforeEach(() =>
			render(
				<AuthForm
					type="reset-pw"
					resetParams={{ userId: 'user-123', secret: 'secret-abc' }}
				/>,
			),
		)

		it('renders password and confirm-password fields, not email', () => {
			expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
			expect(
				screen.getByLabelText(/confirm password/i),
			).toBeInTheDocument()
			expect(screen.queryByLabelText(/^email$/i)).not.toBeInTheDocument()
		})

		it('renders the "Reset Password" submit button', () => {
			expect(
				screen.getByRole('button', { name: /reset password/i }),
			).toBeInTheDocument()
		})
	})

	// =========================================================================
	describe('AuthForm — reset-pw mode validation', () => {
		// =========================================================================

		it('shows "Passwords must match" when confirmPassword differs from password', async () => {
			render(
				<AuthForm
					type="reset-pw"
					resetParams={{ userId: 'user-123', secret: 'secret-abc' }}
				/>,
			)

			await userEvent.type(screen.getByLabelText(/^password/i), 'GoodPass1!')
			await userEvent.type(
				screen.getByLabelText(/confirm password/i),
				'Mismatch1!',
			)
			await userEvent.click(
				screen.getByRole('button', { name: /reset password/i }),
			)

			expect(
				await screen.findByText('Passwords must match'),
			).toBeInTheDocument()
			expect(resetPw).not.toHaveBeenCalled()
		})
	})

	// =========================================================================
	describe('AuthForm — reset-pw mode submission', () => {
		// =========================================================================

		it('calls resetPw with userId, secret, and the new password', async () => {
			;(resetPw as jest.Mock).mockResolvedValueOnce({ success: true })
			render(
				<AuthForm
					type="reset-pw"
					resetParams={{ userId: 'user-123', secret: 'secret-abc' }}
				/>,
			)

			await userEvent.type(screen.getByLabelText(/^password/i), 'GoodPass1!')
			await userEvent.type(
				screen.getByLabelText(/confirm password/i),
				'GoodPass1!',
			)
			await userEvent.click(
				screen.getByRole('button', { name: /reset password/i }),
			)

			await act(async () => {})
			expect(resetPw).toHaveBeenCalledWith({
				userId: 'user-123',
				secret: 'secret-abc',
				password: 'GoodPass1!',
			})
		})

		it('redirects to the success query string after a successful reset', async () => {
			;(resetPw as jest.Mock).mockResolvedValueOnce({ success: true })
			render(
				<AuthForm
					type="reset-pw"
					resetParams={{ userId: 'user-123', secret: 'secret-abc' }}
				/>,
			)

			await userEvent.type(screen.getByLabelText(/^password/i), 'GoodPass1!')
			await userEvent.type(
				screen.getByLabelText(/confirm password/i),
				'GoodPass1!',
			)
			await userEvent.click(
				screen.getByRole('button', { name: /reset password/i }),
			)

			await act(async () => {})
			expect(mockPush).toHaveBeenCalledWith('?success=true')
		})

		it('shows the server error and does not redirect when resetPw fails', async () => {
			;(resetPw as jest.Mock).mockResolvedValueOnce({
				success: false,
				error: 'Failed to update password',
			})
			render(
				<AuthForm
					type="reset-pw"
					resetParams={{ userId: 'user-123', secret: 'secret-abc' }}
				/>,
			)

			await userEvent.type(screen.getByLabelText(/^password/i), 'GoodPass1!')
			await userEvent.type(
				screen.getByLabelText(/confirm password/i),
				'GoodPass1!',
			)
			await userEvent.click(
				screen.getByRole('button', { name: /reset password/i }),
			)

			expect(
				await screen.findByText('Failed to update password'),
			).toBeInTheDocument()
			expect(mockPush).not.toHaveBeenCalled()
		})
	})
})
