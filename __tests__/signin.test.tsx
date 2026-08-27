/**
 * Sign In Flow Tests
 *
 * Covers: SignIn page (RSC), AuthForm (signin mode) rendering, validation,
 * submission success/error, and edge cases.
 *
 * MSW is not used here because all external calls go through Next.js server
 * actions that are mocked via jest.mock. MSW would be needed for direct
 * fetch/axios calls from the component.
 *
 * SignIn is an async server component (it awaits next/server's connection())
 * so it must be awaited before being passed to RTL's render()
 */

import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { useRouter } from 'next/navigation'
import AuthForm from '@/components/AuthForm'
import SignInPage from '@/app/(auth)/signin/page'
import { signIn } from '@/lib/actions/user.actions'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

// connection() requires a real Next.js request-scoped AsyncLocalStorage
// context that only exists inside an actual request lifecycle; it throws
// when invoked directly from a Jest test.
jest.mock('next/server', () => ({
	...jest.requireActual('next/server'),
	connection: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/actions/user.actions', () => ({
	signIn: jest.fn(),
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

async function renderSignInPage() {
	return render(await SignInPage())
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

		it('renders the title in sign-in mode', async () => {
			await renderSignInPage()
			expect(screen.getByText('Welcome back')).toBeInTheDocument()
			expect(screen.getByText(/Good to see/g)).toBeInTheDocument()
		})

		it('renders the AuthForm in sign-in mode', async () => {
			await renderSignInPage()
			expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
			expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
			expect(
				screen.queryByPlaceholderText('First Name'),
			).not.toBeInTheDocument()
		})

		// Regression for component_fixes_deferred item 2: this page used to
		// import (and, at some point in its history, render) Navbar, which
		// would add its own Link-based back-nav here too. Sign-in is the
		// entry point of the auth flow — there's nothing to go "back" to,
		// so it should have no back-navigation control at all (AuthForm
		// itself already suppresses its own chevron for type="signin").
		it('renders no back-navigation control', async () => {
			await renderSignInPage()
			expect(
				screen.queryByRole('button', { name: /go back/i }),
			).not.toBeInTheDocument()
			expect(screen.queryByTestId('navbar')).not.toBeInTheDocument()
		})
	})

	// =========================================================================
	describe('AuthForm — Rendering', () => {
		// =========================================================================

		beforeEach(() => render(<AuthForm type="signin" />))

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

		it('renders a "Forgot password?" link pointing to /forgot-password', () => {
			const link = screen.getByRole('link', { name: /forgot your password/i })
			expect(link).toBeInTheDocument()
			expect(link).toHaveAttribute('href', '/forgot-password')
		})

		it('renders a "Create account" footer link pointing to /signup', () => {
			expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
			const link = screen.getByRole('link', { name: /sign up/i })
			expect(link).toBeInTheDocument()
			expect(link).toHaveAttribute('href', '/signup')
		})

		it('does not render sign-up-only or reset-only fields', () => {
			expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument()
			expect(screen.queryByLabelText(/last name/i)).not.toBeInTheDocument()
			expect(
				screen.queryByLabelText(/confirm password/i),
			).not.toBeInTheDocument()
		})

		it('does not show a server error message on initial render', () => {
			expect(document.querySelector('.form-message')).not.toBeInTheDocument()
		})

		it('submit button is disabled on initial render', () => {
			expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled()
		})

		it('submit button is enabled on valid email type and dirty password', async () => {
			await userEvent.type(
				screen.getByLabelText('Email*'),
				'janedoe@example.com',
			)
			await userEvent.type(screen.getByLabelText('Password*'), 'ValidPW1!')
			expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled()
		})

		it('show/hide button toggles and properly shows/hides password', async () => {
			expect(screen.getByText(/show/i)).toBeInTheDocument()

			await userEvent.type(screen.getByLabelText('Password*'), 'ValidPW1!')
			const pwInput = await screen.findByDisplayValue(/ValidPW1!/)

			expect(pwInput).toHaveAttribute('type', 'password')

			await userEvent.click(screen.getByText(/show/i))
			expect(pwInput).toHaveAttribute('type', 'text')
			expect(screen.getByText(/hide/i)).toBeInTheDocument()
		})
	})

	// =========================================================================
	describe('AuthForm — Validation (client-side, blocks submission)', () => {
		// =========================================================================

		beforeEach(() => render(<AuthForm type="signin" />))

		it('does not call signIn when email and password are empty', async () => {
			await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
			await screen.findByLabelText(/email/i)
			expect(signIn).not.toHaveBeenCalled()
		})

		it('marks the email input as invalid after a failed submission', async () => {
			;(signIn as jest.Mock).mockResolvedValueOnce({
				success: false,
				error: 'Invalid credentials. Please check the email and password.',
			})
			await userEvent.type(
				screen.getByLabelText('Email*'),
				'janedoe@example.com',
			)
			await userEvent.type(screen.getByLabelText('Password*'), 'ValidPW1!')
			await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
			expect(await screen.findByLabelText(/email/i)).toHaveAttribute(
				'aria-invalid',
				'true',
			)
		})

		it('does not display validation error text for email or password (known bug)', async () => {
			await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
			await new Promise((resolve) => setTimeout(resolve, 0))
			expect(screen.queryByText(/required/i)).not.toBeInTheDocument()
			expect(screen.queryByText(/valid email/i)).not.toBeInTheDocument()
		})

		it('does not call signIn for an invalid email format', async () => {
			await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email')
			await userEvent.type(screen.getByLabelText(/password/i), 'GoodPass1!')
			await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
			await new Promise((resolve) => setTimeout(resolve, 0))
			expect(signIn).not.toHaveBeenCalled()
		})

		it('still calls signIn for a password shorter than 8 characters, and shows the server error', async () => {
			;(signIn as jest.Mock).mockResolvedValueOnce({
				success: false,
				error: 'Invalid credentials. Please check the email and password.',
			})
			await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com')
			await userEvent.type(screen.getByLabelText(/password/i), 'Sh0rt!')
			await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
			expect(signIn).toHaveBeenCalled()
			expect(
				await screen.findByText(
					/Invalid credentials. Please check the email and password./i,
				),
			).toBeInTheDocument()
		})

		it('still calls signIn for a password over 64 characters, and shows the server error', async () => {
			;(signIn as jest.Mock).mockResolvedValueOnce({
				success: false,
				error: 'Invalid credentials. Please check the email and password.',
			})
			await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com')
			await userEvent.type(
				screen.getByLabelText(/password/i),
				'Aa1!'.repeat(17), // 68 chars
			)
			await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
			expect(signIn).toHaveBeenCalled()
			expect(
				await screen.findByText(
					/Invalid credentials. Please check the email and password./i,
				),
			).toBeInTheDocument()
		})

		it('still calls signIn for a password missing an uppercase letter, number, or special character, and shows the server error', async () => {
			;(signIn as jest.Mock).mockResolvedValueOnce({
				success: false,
				error: 'Invalid credentials. Please check the email and password.',
			})
			await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com')
			await userEvent.type(screen.getByLabelText(/password/i), 'lowercaseonly')
			await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
			expect(signIn).toHaveBeenCalled()
			expect(
				await screen.findByText(
					/Invalid credentials. Please check the email and password./i,
				),
			).toBeInTheDocument()
		})
	})

	// =========================================================================
	describe('AuthForm — Successful sign in', () => {
		// =========================================================================

		it('calls signIn with the entered credentials', async () => {
			;(signIn as jest.Mock).mockResolvedValueOnce({
				success: true,
				data: { $id: 'user-123', firstName: 'Jane' },
			})
			render(<AuthForm type="signin" />)

			await fillAndSubmit('jane@example.com', 'SecurePass1!')

			await screen.findByLabelText(/email/i)
			expect(signIn).toHaveBeenCalledWith({
				email: 'jane@example.com',
				password: 'SecurePass1!',
			})
		})

		it('redirects to "/" after a successful sign in', async () => {
			;(signIn as jest.Mock).mockResolvedValueOnce({
				success: true,
				data: { $id: 'user-123' },
			})
			render(<AuthForm type="signin" />)

			await fillAndSubmit('jane@example.com', 'SecurePass1!')

			await new Promise((resolve) => setTimeout(resolve, 0))
			expect(mockPush).toHaveBeenCalledWith('/')
		})

		it('shows loading while the request is in-flight', async () => {
			// A manually-resolved promise (rather than setTimeout) so the test
			// can settle it before finishing — a real pending timer would fire
			// later in real time and could call mockPush during a later test.
			let resolveSignIn!: (value: unknown) => void
			;(signIn as jest.Mock).mockImplementation(
				() => new Promise((resolve) => (resolveSignIn = resolve)),
			)
			render(<AuthForm type="signin" />)

			await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com')
			await userEvent.type(screen.getByLabelText(/password/i), 'SecurePass1!')
			await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

			expect(screen.getByText(/signing in/i)).toBeInTheDocument()
			expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()

			await act(async () => {
				resolveSignIn({ success: true, data: { $id: 'user-123' } })
			})
		})

		it('re-enables the submit button after a successful sign in', async () => {
			;(signIn as jest.Mock).mockResolvedValueOnce({
				success: true,
				data: { $id: 'user-123' },
			})
			render(<AuthForm type="signin" />)

			await fillAndSubmit('jane@example.com', 'SecurePass1!')

			expect(
				await screen.findByRole('button', { name: /sign in/i }),
			).toBeEnabled()
		})
	})

	// =========================================================================
	describe('AuthForm — Error handling', () => {
		// =========================================================================

		it('displays the error message returned from signIn', async () => {
			;(signIn as jest.Mock).mockResolvedValueOnce({
				success: false,
				error: 'Invalid credentials',
			})
			render(<AuthForm type="signin" />)

			await fillAndSubmit('bad@example.com', 'WrongPass1!')

			expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()
		})

		it('does not redirect when signIn reports failure', async () => {
			;(signIn as jest.Mock).mockResolvedValueOnce({
				success: false,
				error: 'Invalid credentials',
			})
			render(<AuthForm type="signin" />)

			await fillAndSubmit('bad@example.com', 'WrongPass1!')

			await screen.findByText('Invalid credentials')
			expect(mockPush).not.toHaveBeenCalled()
		})

		it('displays an error when signIn rejects with an unexpected exception', async () => {
			;(signIn as jest.Mock).mockRejectedValueOnce(new Error('Network failure'))
			render(<AuthForm type="signin" />)

			await fillAndSubmit('jane@example.com', 'SecurePass1!')

			expect(await screen.findByText('Network failure')).toBeInTheDocument()
		})

		it('re-enables the submit button after a failed sign in', async () => {
			;(signIn as jest.Mock).mockResolvedValueOnce({
				success: false,
				error: 'Invalid credentials',
			})
			render(<AuthForm type="signin" />)

			await fillAndSubmit('bad@example.com', 'WrongPass1!')

			await screen.findByText('Invalid credentials')
			expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled()
		})
	})

	// =========================================================================
	describe('AuthForm — Edge cases', () => {
		// =========================================================================

		it('allows resubmission after a failed attempt', async () => {
			;(signIn as jest.Mock)
				.mockResolvedValueOnce({ success: false, error: 'Bad credentials' })
				.mockResolvedValueOnce({ success: true, data: { $id: 'user-123' } })

			render(<AuthForm type="signin" />)

			await fillAndSubmit('jane@example.com', 'SecurePass1!')
			await screen.findByText('Bad credentials')

			await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
			await new Promise((resolve) => setTimeout(resolve, 0))
			expect(mockPush).toHaveBeenCalledWith('/')
		})

		it('calls signIn exactly once per submit', async () => {
			;(signIn as jest.Mock).mockResolvedValueOnce({
				success: true,
				data: { $id: 'user-123' },
			})
			render(<AuthForm type="signin" />)

			await fillAndSubmit('jane@example.com', 'SecurePass1!')

			await new Promise((resolve) => setTimeout(resolve, 0))
			expect(signIn).toHaveBeenCalledTimes(1)
		})
	})
})
