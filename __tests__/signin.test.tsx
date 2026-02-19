/**
 * Sign In Flow Tests
 *
 * Covers: SignIn page, AuthForm (signin mode) rendering, validation,
 * submission success/error, and edge cases.
 *
 * MSW is not used here because all external calls go through Next.js server
 * actions that are mocked via jest.mock. MSW would be needed for direct
 * fetch/axios calls from the component.
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { useRouter } from 'next/navigation'
import AuthForm from '@/components/AuthForm'
import SignInPage from '@/app/(auth)/signin/page'
import { signIn } from '@/lib/actions/user.actions'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock('@/components/Navbar', () => () => <nav data-testid="navbar" />)
jest.mock('@/components/PlaidLink', () => () => <div data-testid="plaid-link" />)

jest.mock('@/lib/actions/user.actions', () => ({
	signIn: jest.fn(),
	signUp: jest.fn(),
	getUserInfo: jest.fn(),
	forgotPw: jest.fn(),
	resetPw: jest.fn(),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

async function fillAndSubmit(email: string, password: string) {
	await userEvent.type(screen.getByLabelText(/email/i), email)
	await userEvent.type(screen.getByLabelText(/password/i), password)
	await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('Sign In Flow', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		setupRouter()
	})

	// =========================================================================
	describe('SignIn Page component', () => {
		// =========================================================================

		it('renders the Navbar', () => {
			render(<SignInPage />)
			expect(screen.getByTestId('navbar')).toBeInTheDocument()
		})

		it('renders the AuthForm in sign-in mode', () => {
			render(<SignInPage />)
			expect(screen.getByText('Welcome Back')).toBeInTheDocument()
		})
	})

	// =========================================================================
	describe('AuthForm — Rendering', () => {
		// =========================================================================

		beforeEach(() => render(<AuthForm type="signin" />))

		it('renders the "Welcome Back" heading', () => {
			expect(screen.getByText('Welcome Back')).toBeInTheDocument()
		})

		it('renders the subtitle', () => {
			expect(
				screen.getByText('Hello there, sign in to continue'),
			).toBeInTheDocument()
		})

		it('renders an email input', () => {
			expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
		})

		it('renders a password input', () => {
			expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
		})

		it('renders the Sign In submit button', () => {
			expect(
				screen.getByRole('button', { name: /sign in/i }),
			).toBeInTheDocument()
		})

		it('renders a "Forgot your password?" link pointing to /forgot-password', () => {
			const link = screen.getByRole('link', { name: /forgot your password/i })
			expect(link).toBeInTheDocument()
			expect(link).toHaveAttribute('href', '/forgot-password')
		})

		it('renders a "Sign Up" footer link pointing to /signup', () => {
			const link = screen.getByRole('link', { name: /sign up/i })
			expect(link).toBeInTheDocument()
			expect(link).toHaveAttribute('href', '/signup')
		})

		it('does not render sign-up-only fields', () => {
			expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument()
			expect(screen.queryByLabelText(/last name/i)).not.toBeInTheDocument()
			expect(screen.queryByLabelText(/address/i)).not.toBeInTheDocument()
			expect(screen.queryByLabelText(/city/i)).not.toBeInTheDocument()
			expect(screen.queryByLabelText(/ssn/i)).not.toBeInTheDocument()
		})

		it('does not show an error message on initial render', () => {
			expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
		})

		it('submit button is enabled on initial render', () => {
			expect(
				screen.getByRole('button', { name: /sign in/i }),
			).toBeEnabled()
		})
	})

	// =========================================================================
	describe('AuthForm — Validation', () => {
		// =========================================================================

		beforeEach(() => render(<AuthForm type="signin" />))

		it('shows a validation error when email is empty', async () => {
			await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
			expect(
				await screen.findByText(/a valid email is required/i),
			).toBeInTheDocument()
		})

		it('shows a validation error for an invalid email format', async () => {
			await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email')
			await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
			expect(
				await screen.findByText(/a valid email is required/i),
			).toBeInTheDocument()
		})

		it('shows a validation error when password is empty', async () => {
			await userEvent.type(
				screen.getByLabelText(/email/i),
				'test@example.com',
			)
			await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
			expect(
				await screen.findByText(/password is required/i),
			).toBeInTheDocument()
		})

		it('shows a validation error for a password shorter than 8 characters', async () => {
			await userEvent.type(
				screen.getByLabelText(/email/i),
				'test@example.com',
			)
			await userEvent.type(screen.getByLabelText(/password/i), 'Short1')
			await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
			expect(
				await screen.findByText(
					/password must be a minimum of 8 characters/i,
				),
			).toBeInTheDocument()
		})

		it('does not call signIn when form fields are invalid', async () => {
			await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
			await screen.findByText(/a valid email is required/i)
			expect(signIn).not.toHaveBeenCalled()
		})
	})

	// =========================================================================
	describe('AuthForm — Successful sign in', () => {
		// =========================================================================

		it('calls signIn with the entered credentials', async () => {
			;(signIn as jest.Mock).mockResolvedValueOnce({
				$id: 'user-123',
				firstName: 'Jane',
			})
			render(<AuthForm type="signin" />)

			await fillAndSubmit('jane@example.com', 'SecurePass1')

			await waitFor(() =>
				expect(signIn).toHaveBeenCalledWith({
					email: 'jane@example.com',
					password: 'SecurePass1',
				}),
			)
		})

		it('redirects to "/" after a successful sign in', async () => {
			;(signIn as jest.Mock).mockResolvedValueOnce({
				$id: 'user-123',
				firstName: 'Jane',
			})
			render(<AuthForm type="signin" />)

			await fillAndSubmit('jane@example.com', 'SecurePass1')

			await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'))
		})

		it('shows a loading spinner while the request is in-flight', async () => {
			;(signIn as jest.Mock).mockImplementation(
				() =>
					new Promise(resolve =>
						setTimeout(() => resolve({ $id: 'user-123' }), 300),
					),
			)
			render(<AuthForm type="signin" />)

			await userEvent.type(
				screen.getByLabelText(/email/i),
				'jane@example.com',
			)
			await userEvent.type(
				screen.getByLabelText(/password/i),
				'SecurePass1',
			)
			await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

			expect(screen.getByText(/loading/i)).toBeInTheDocument()
			expect(
				screen.getByRole('button', { name: /loading/i }),
			).toBeDisabled()
		})

		it('re-enables the submit button after a successful sign in', async () => {
			;(signIn as jest.Mock).mockResolvedValueOnce({ $id: 'user-123' })
			render(<AuthForm type="signin" />)

			await fillAndSubmit('jane@example.com', 'SecurePass1')

			await waitFor(() =>
				expect(
					screen.getByRole('button', { name: /sign in/i }),
				).toBeEnabled(),
			)
		})
	})

	// =========================================================================
	describe('AuthForm — Error handling', () => {
		// =========================================================================

		it('displays the error message returned from signIn', async () => {
			;(signIn as jest.Mock).mockResolvedValueOnce({
				error: 'Invalid credentials',
			})
			render(<AuthForm type="signin" />)

			await fillAndSubmit('bad@example.com', 'WrongPass1')

			expect(
				await screen.findByText('Invalid credentials'),
			).toBeInTheDocument()
		})

		it('does not redirect when signIn returns an error', async () => {
			;(signIn as jest.Mock).mockResolvedValueOnce({
				error: 'Invalid credentials',
			})
			render(<AuthForm type="signin" />)

			await fillAndSubmit('bad@example.com', 'WrongPass1')

			await screen.findByText('Invalid credentials')
			expect(mockPush).not.toHaveBeenCalled()
		})

		it('displays an error when signIn throws an unexpected exception', async () => {
			;(signIn as jest.Mock).mockRejectedValueOnce(
				new Error('Network failure'),
			)
			render(<AuthForm type="signin" />)

			await fillAndSubmit('jane@example.com', 'SecurePass1')

			expect(
				await screen.findByText('Network failure'),
			).toBeInTheDocument()
		})

		it('re-enables the submit button after a failed sign in', async () => {
			;(signIn as jest.Mock).mockResolvedValueOnce({
				error: 'Invalid credentials',
			})
			render(<AuthForm type="signin" />)

			await fillAndSubmit('bad@example.com', 'WrongPass1')

			await screen.findByText('Invalid credentials')
			expect(
				screen.getByRole('button', { name: /sign in/i }),
			).toBeEnabled()
		})
	})

	// =========================================================================
	describe('AuthForm — Edge cases', () => {
		// =========================================================================

		it('does not redirect when signIn returns null', async () => {
			;(signIn as jest.Mock).mockResolvedValueOnce(null)
			render(<AuthForm type="signin" />)

			await fillAndSubmit('jane@example.com', 'SecurePass1')

			await waitFor(() => expect(signIn).toHaveBeenCalled())
			expect(mockPush).not.toHaveBeenCalled()
		})

		it('does not redirect when signIn returns undefined', async () => {
			;(signIn as jest.Mock).mockResolvedValueOnce(undefined)
			render(<AuthForm type="signin" />)

			await fillAndSubmit('jane@example.com', 'SecurePass1')

			await waitFor(() => expect(signIn).toHaveBeenCalled())
			expect(mockPush).not.toHaveBeenCalled()
		})

		it('allows resubmission after a failed attempt', async () => {
			;(signIn as jest.Mock)
				.mockResolvedValueOnce({ error: 'Bad credentials' })
				.mockResolvedValueOnce({ $id: 'user-123', firstName: 'Jane' })

			render(<AuthForm type="signin" />)

			await fillAndSubmit('jane@example.com', 'SecurePass1')
			await screen.findByText('Bad credentials')

			await userEvent.click(
				screen.getByRole('button', { name: /sign in/i }),
			)
			await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'))
		})

		it('calls signIn exactly once per submit', async () => {
			;(signIn as jest.Mock).mockResolvedValueOnce({ $id: 'user-123' })
			render(<AuthForm type="signin" />)

			await fillAndSubmit('jane@example.com', 'SecurePass1')

			await waitFor(() => expect(signIn).toHaveBeenCalledTimes(1))
		})

		it('trims a trailing dot from an otherwise valid email and rejects it', async () => {
			render(<AuthForm type="signin" />)
			await userEvent.type(
				screen.getByLabelText(/email/i),
				'jane@example.',
			)
			await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
			expect(
				await screen.findByText(/a valid email is required/i),
			).toBeInTheDocument()
			expect(signIn).not.toHaveBeenCalled()
		})

		it('rejects a password of exactly 256 characters (above max)', async () => {
			const longPassword = 'A'.repeat(257)
			render(<AuthForm type="signin" />)
			await userEvent.type(
				screen.getByLabelText(/email/i),
				'jane@example.com',
			)
			await userEvent.type(
				screen.getByLabelText(/password/i),
				longPassword,
			)
			await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
			expect(
				await screen.findByText(/password must be less than 256 characters/i),
			).toBeInTheDocument()
		})
	})
})
