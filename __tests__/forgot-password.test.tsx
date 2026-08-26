/**
 * Forgot Password Flow Tests
 *
 * Covers: ForgotPassword page (RSC) and AuthForm in 'forgot-pw' mode.
 */

import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { useRouter } from 'next/navigation'
import AuthForm from '@/components/AuthForm'
import ForgotPasswordPage from '@/app/(auth)/forgot-password/page'
import { forgotPw } from '@/lib/actions/user.actions'

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

describe('Forgot Password Flow', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		setupRouter()
	})

	// =========================================================================
	describe('ForgotPassword Page component', () => {
		// =========================================================================
		it('renders the title in forgot-pw mode', async () => {
			render(await ForgotPasswordPage())
			expect(screen.getByText(/reset your password/i)).toBeInTheDocument()
			expect(screen.getByText(/enter the email/i)).toBeInTheDocument()
		})

		it('renders AuthForm in forgot-pw mode (email field, "Send" button)', async () => {
			render(await ForgotPasswordPage())
			expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
			expect(
				screen.getByRole('button', { name: /^send$/i }),
			).toBeInTheDocument()
		})
	})

	// =========================================================================
	describe('AuthForm — forgot-pw mode rendering', () => {
		// =========================================================================

		beforeEach(() => render(<AuthForm type="forgot-pw" />))

		it('renders only the email field', () => {
			expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
			expect(screen.queryByLabelText(/^password$/i)).not.toBeInTheDocument()
			expect(
				screen.queryByLabelText(/confirm password/i),
			).not.toBeInTheDocument()
		})

		it('does not render a "Forgot password?" link (only signin mode has one)', () => {
			expect(
				screen.queryByRole('link', { name: /forgot password/i }),
			).not.toBeInTheDocument()
		})

		it('renders the "Send" submit button', () => {
			expect(
				screen.getByRole('button', { name: /^send$/i }),
			).toBeInTheDocument()
		})

		it('renders a footer link back to sign in', () => {
			expect(screen.getByText('Remembered your password?')).toBeInTheDocument()
			const link = screen.getByRole('link', { name: /sign in/i })
			expect(link).toHaveAttribute('href', '/signin')
		})
	})

	// =========================================================================
	describe('AuthForm — forgot-pw mode submission', () => {
		// =========================================================================

		it('calls forgotPw with the entered email', async () => {
			;(forgotPw as jest.Mock).mockResolvedValueOnce({ success: true })
			render(<AuthForm type="forgot-pw" />)

			await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com')
			await userEvent.click(screen.getByRole('button', { name: /^send$/i }))

			await act(async () => {})
			expect(forgotPw).toHaveBeenCalledWith({ email: 'jane@example.com' })
		})

		it('redirects to /signin after a successful request', async () => {
			;(forgotPw as jest.Mock).mockResolvedValueOnce({ success: true })
			render(<AuthForm type="forgot-pw" />)

			await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com')
			await userEvent.click(screen.getByRole('button', { name: /^send$/i }))

			await act(async () => {})
			expect(mockPush).toHaveBeenCalledWith('/signin')
		})

		it('does not call forgotPw when the email is empty', async () => {
			render(<AuthForm type="forgot-pw" />)
			await userEvent.click(screen.getByRole('button', { name: /^send$/i }))
			await act(async () => {})
			expect(forgotPw).not.toHaveBeenCalled()
		})

		it('shows the server error and does not redirect when forgotPw fails', async () => {
			;(forgotPw as jest.Mock).mockResolvedValueOnce({
				success: false,
				error: 'No account found with this email',
			})
			render(<AuthForm type="forgot-pw" />)

			await userEvent.type(screen.getByLabelText(/email/i), 'ghost@example.com')
			await userEvent.click(screen.getByRole('button', { name: /^send$/i }))

			expect(
				await screen.findByText('No account found with this email'),
			).toBeInTheDocument()
			expect(mockPush).not.toHaveBeenCalled()
		})
	})
})
