/**
 * Sign Up Flow Tests
 *
 * Covers: SignUp page (RSC) and SignUpForm's 3-step wizard (account
 * creation, then optional email verification, then optional bank
 * connection). Previously had no coverage — StepTwo(old).tsx is confirmed
 * vestigial (per security_hardening_backlog), StepOne.tsx/StepTwo.tsx are
 * the live ones.
 *
 * SignUp is an async server component (it awaits next/server's
 * connection()), same pattern as SignIn/ResetPassword.
 *
 * Note: app/(onboarding)/signup/page.tsx imports Navbar but never renders
 * it — signup is the only auth page with no Navbar/back-link/page-title at
 * all. Unlike the redirect()-in-a-client-handler issue below, I don't have
 * evidence this is unintentional (a deliberately chrome-free onboarding
 * screen is a legitimate design choice), so it's not treated as a gap here
 * — flagged to the user instead of asserted against.
 *
 * VerifyEmail is mocked out the same way PlaidLink is — its own behavior
 * (sending the email on mount, resend cooldown, etc.) is covered by
 * VerifyEmail's own test file; here we only care that SignUpForm renders it
 * at the right step and reacts correctly to verification completing.
 */
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { useRouter } from 'next/navigation'
import SignUpForm from '@/components/SignUp/SignUpForm'
import SignUpPage from '@/app/(onboarding)/signup/page'
import { getLoggedInUser, signUp } from '@/lib/actions/user.actions'

jest.mock('next/server', () => ({
	...jest.requireActual('next/server'),
	connection: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/actions/user.actions', () => ({
	signUp: jest.fn(),
	getLoggedInUser: jest.fn(),
}))

jest.mock('@/components/PlaidLink', () => (props: any) => (
	<div data-testid="plaid-link" data-props={JSON.stringify(props)} />
))

jest.mock('@/components/auth/VerifyEmail', () => (props: any) => (
	<div data-testid="verify-email" data-props={JSON.stringify(props)} />
))

const mockPush = jest.fn()
const mockBack = jest.fn()

function setupRouter() {
	;(useRouter as jest.Mock).mockReturnValue({
		push: mockPush,
		replace: jest.fn(),
		refresh: jest.fn(),
		back: mockBack,
		forward: jest.fn(),
	})
}

const validUser: User = {
	$id: 'user-123',
	email: 'jane@example.com',
	userId: 'user-123',
	dwollaCustomerUrl: 'https://api-sandbox.dwolla.com/customers/customer-1',
	dwollaCustomerId: 'customer-1',
	firstName: 'Jane',
	lastName: 'Doe',
	name: 'Jane Doe',
	address1: '',
	city: '',
	state: '',
	postalCode: '',
	dateOfBirth: '',
	ssn: '',
}

async function fillStepOne() {
	await userEvent.type(screen.getByLabelText('First Name*'), 'Jane')
	await userEvent.type(screen.getByLabelText('Last Name*'), 'Doe')
	await userEvent.type(screen.getByLabelText('Email*'), 'jane@example.com')
	await userEvent.type(screen.getByLabelText('Password*'), 'ValidPW1!')
	await userEvent.click(screen.getByRole('checkbox'))
}

async function completeStepOne() {
	await fillStepOne()
	await userEvent.click(screen.getByRole('button', { name: /continue/i }))
}

beforeEach(() => {
	jest.clearAllMocks()
	setupRouter()
	;(getLoggedInUser as jest.Mock).mockResolvedValue({
		...validUser,
		verifiedEmail: false,
	})
})

describe('SignUp Page component', () => {
	it('renders the SignUpForm (step 1 fields)', async () => {
		render(await SignUpPage())
		expect(screen.getByLabelText('First Name*')).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: /continue/i }),
		).toBeInTheDocument()
	})

	it('renders no Navbar/back-link/page-title chrome', async () => {
		render(await SignUpPage())
		expect(screen.queryByTestId('navbar')).not.toBeInTheDocument()
		expect(document.querySelector('nav')).not.toBeInTheDocument()
	})
})

describe('SignUpForm — Step 1 rendering', () => {
	beforeEach(() => render(<SignUpForm />))

	it('renders the account-creation fields and terms checkbox', () => {
		expect(screen.getByLabelText('First Name*')).toBeInTheDocument()
		expect(screen.getByLabelText('Last Name*')).toBeInTheDocument()
		expect(screen.getByLabelText('Email*')).toBeInTheDocument()
		expect(screen.getByLabelText('Password*')).toBeInTheDocument()
		expect(screen.getByRole('checkbox')).toBeInTheDocument()
		expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
	})

	it('does not render later-step content', () => {
		expect(screen.queryByTestId('verify-email')).not.toBeInTheDocument()
		expect(screen.queryByTestId('plaid-link')).not.toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: /i'll do this later/i }),
		).not.toBeInTheDocument()
	})

	it('renders a "Sign In" footer link to /signin', () => {
		const link = screen.getByRole('link', { name: /sign in/i })
		expect(link).toHaveAttribute('href', '/signin')
	})

	it('Continue is disabled on initial render', () => {
		expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
	})

	it('Continue is enabled once every step-1 field is filled and terms are agreed to', async () => {
		await fillStepOne()
		expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled()
	})

	it('Continue stays disabled if the terms checkbox is never checked', async () => {
		await userEvent.type(screen.getByLabelText('First Name*'), 'Jane')
		await userEvent.type(screen.getByLabelText('Last Name*'), 'Doe')
		await userEvent.type(screen.getByLabelText('Email*'), 'jane@example.com')
		await userEvent.type(screen.getByLabelText('Password*'), 'ValidPW1!')
		expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
	})

	it('the back chevron calls router.back()', async () => {
		const [backButton] = screen.getAllByRole('button')
		await userEvent.click(backButton)
		expect(mockBack).toHaveBeenCalled()
	})
})

describe('SignUpForm — Step 1 validation message UX', () => {
	beforeEach(() => render(<SignUpForm />))

	it('shows a validation message for an empty required field only after it is blurred', async () => {
		const firstName = screen.getByLabelText('First Name*')

		await userEvent.type(firstName, 'J')
		await userEvent.clear(firstName)
		expect(screen.queryByText('First name is Required')).not.toBeInTheDocument()

		await userEvent.tab() // blur firstName, focus moves to lastName
		expect(
			await screen.findByText('First name is Required'),
		).toBeInTheDocument()
	})

	it('never shows a validation message on the password field', async () => {
		const passwordInput = screen.getByLabelText('Password*')
		await userEvent.type(passwordInput, 'weak')
		await userEvent.tab()

		expect(
			screen.queryByText(/password/i, { selector: 'p' }),
		).not.toBeInTheDocument()
	})
})

describe('SignUpForm — terms validation message', () => {
	// Unlike CustomInput-wrapped fields (firstName/lastName/email/password —
	// see the CustomInput FormMessage gap in component_fixes_deferred), the
	// terms checkbox renders its own <FormMessage/> directly in StepOne.tsx,
	// so its validation message does actually reach the DOM.
	it('shows the terms-agreement message after checking then unchecking the box', async () => {
		render(<SignUpForm />)
		const checkbox = screen.getByRole('checkbox')

		await userEvent.click(checkbox) // check
		await userEvent.click(checkbox) // uncheck — now dirty and invalid

		expect(
			await screen.findByText('You must agree to the Terms and Conditions'),
		).toBeInTheDocument()
	})
})

describe('SignUpForm — submitting step 1', () => {
	it('calls signUp with the four account fields, not agreeToTerms', async () => {
		;(signUp as jest.Mock).mockResolvedValue({ success: true, data: validUser })
		render(<SignUpForm />)

		await completeStepOne()

		await waitFor(() =>
			expect(signUp).toHaveBeenCalledWith({
				firstName: 'Jane',
				lastName: 'Doe',
				email: 'jane@example.com',
				password: 'ValidPW1!',
			}),
		)
	})

	it('advances to step 2 (email verification) on success, not straight to PlaidLink', async () => {
		;(signUp as jest.Mock).mockResolvedValue({ success: true, data: validUser })
		render(<SignUpForm />)

		await completeStepOne()

		expect(await screen.findByText('Step 2 of 3')).toBeInTheDocument()
		expect(screen.queryByLabelText('First Name*')).not.toBeInTheDocument()
		expect(screen.queryByTestId('plaid-link')).not.toBeInTheDocument()

		const verifyEmail = screen.getByTestId('verify-email')
		expect(JSON.parse(verifyEmail.dataset.props!)).toMatchObject({
			email: 'j•••••e@example.com',
		})
	})

	it('hides the "Sign In" footer once past step 1', async () => {
		;(signUp as jest.Mock).mockResolvedValue({ success: true, data: validUser })
		render(<SignUpForm />)

		await completeStepOne()

		await screen.findByText('Step 2 of 3')
		expect(
			screen.queryByRole('link', { name: /sign in/i }),
		).not.toBeInTheDocument()
	})

	it('shows the server error and stays on step 1 when signUp fails', async () => {
		;(signUp as jest.Mock).mockResolvedValue({
			success: false,
			error: 'Payment provider setup failed',
		})
		render(<SignUpForm />)

		await completeStepOne()

		expect(
			await screen.findByText('Payment provider setup failed'),
		).toBeInTheDocument()
		expect(screen.getByLabelText('First Name*')).toBeInTheDocument()
	})

	it('re-enables Continue after a failed submission', async () => {
		;(signUp as jest.Mock).mockResolvedValue({
			success: false,
			error: 'Payment provider setup failed',
		})
		render(<SignUpForm />)

		await completeStepOne()

		await screen.findByText('Payment provider setup failed')
		expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled()
	})
})

describe('SignUpForm — step 2 (email verification)', () => {
	async function renderAtStepTwo() {
		;(signUp as jest.Mock).mockResolvedValue({ success: true, data: validUser })
		render(<SignUpForm />)
		await completeStepOne()
		await screen.findByText('Step 2 of 3')
	}

	it('"Skip for now" advances to step 3 (bank connection) without verifying', async () => {
		await renderAtStepTwo()

		await userEvent.click(
			screen.getByRole('button', { name: /skip for now/i }),
		)

		expect(await screen.findByText('Step 3 of 3')).toBeInTheDocument()
		expect(screen.getByTestId('plaid-link')).toBeInTheDocument()
	})

	it('auto-advances to step 3 once polling finds verifiedEmail true', async () => {
		jest.useFakeTimers({ advanceTimers: true })
		try {
			;(getLoggedInUser as jest.Mock).mockResolvedValue({
				...validUser,
				verifiedEmail: false,
			})
			await renderAtStepTwo()

			;(getLoggedInUser as jest.Mock).mockResolvedValue({
				...validUser,
				verifiedEmail: true,
			})
			await act(async () => {
				jest.advanceTimersByTime(4000)
			})

			expect(await screen.findByText('Step 3 of 3')).toBeInTheDocument()
		} finally {
			jest.useRealTimers()
		}
	})

	it('does not advance while polling still finds verifiedEmail false', async () => {
		jest.useFakeTimers({ advanceTimers: true })
		try {
			await renderAtStepTwo()

			await act(async () => {
				jest.advanceTimersByTime(4000)
			})

			expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
		} finally {
			jest.useRealTimers()
		}
	})
})

describe('SignUpForm — step 3 (bank connection)', () => {
	async function renderAtStepThree() {
		;(signUp as jest.Mock).mockResolvedValue({ success: true, data: validUser })
		render(<SignUpForm />)
		await completeStepOne()
		await screen.findByText('Step 2 of 3')
		await userEvent.click(
			screen.getByRole('button', { name: /skip for now/i }),
		)
		await screen.findByText('Step 3 of 3')
	}

	it('renders PlaidLink with the created user', async () => {
		await renderAtStepThree()

		const plaidLink = screen.getByTestId('plaid-link')
		const props = JSON.parse(plaidLink.dataset.props!)
		expect(props).toMatchObject({
			user: validUser,
			variant: 'primary',
			text: 'Connect my bank now',
			redirectTo: '/confirmation?connected=true',
		})
	})

	it('"I\'ll do this later" navigates to /confirmation', async () => {
		await renderAtStepThree()

		await userEvent.click(
			screen.getByRole('button', { name: /i'll do this later/i }),
		)

		expect(mockPush).toHaveBeenCalledWith('/confirmation')
	})
})
