/**
 * Sign Up Flow Tests
 *
 * Covers: SignUp page (RSC) and SignUpForm's 2-step wizard (account
 * creation, then optional bank connection). Previously had no coverage —
 * StepTwo(old).tsx is confirmed vestigial (per security_hardening_backlog),
 * StepOne.tsx/StepTwo.tsx are the live ones.
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
 */
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { useRouter } from 'next/navigation'
import SignUpForm from '@/components/SignUp/SignUpForm'
import SignUpPage from '@/app/(onboarding)/signup/page'
import { signUp } from '@/lib/actions/user.actions'

jest.mock('next/server', () => ({
	...jest.requireActual('next/server'),
	connection: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/actions/user.actions', () => ({
	signUp: jest.fn(),
}))

jest.mock('@/components/PlaidLink', () => (props: any) => (
	<div data-testid="plaid-link" data-props={JSON.stringify(props)} />
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
})

describe('SignUp Page component', () => {
	it('renders the SignUpForm (step 1 fields)', async () => {
		render(await SignUpPage())
		expect(screen.getByLabelText('First Name*')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
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
		expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
	})

	it('does not render step 2 content', () => {
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

	it('advances to step 2 and renders PlaidLink with the created user on success', async () => {
		;(signUp as jest.Mock).mockResolvedValue({ success: true, data: validUser })
		render(<SignUpForm />)

		await completeStepOne()

		expect(await screen.findByText('Step 2 of 2')).toBeInTheDocument()
		expect(screen.queryByLabelText('First Name*')).not.toBeInTheDocument()
		const plaidLink = screen.getByTestId('plaid-link')
		const props = JSON.parse(plaidLink.dataset.props!)
		expect(props).toMatchObject({
			user: validUser,
			variant: 'primary',
			text: 'Connect my bank now',
			redirectTo: '/confirmation?connected=true',
		})
	})

	it('hides the "Sign In" footer once on step 2', async () => {
		;(signUp as jest.Mock).mockResolvedValue({ success: true, data: validUser })
		render(<SignUpForm />)

		await completeStepOne()

		await screen.findByText('Step 2 of 2')
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

describe('SignUpForm — step 2', () => {
	async function renderAtStepTwo() {
		;(signUp as jest.Mock).mockResolvedValue({ success: true, data: validUser })
		render(<SignUpForm />)
		await completeStepOne()
		await screen.findByText('Step 2 of 2')
	}

	// Currently failing: "I'll do this later" calls next/navigation's
	// redirect() from a plain onClick handler (SignUpForm.tsx). redirect()
	// works by throwing a special error that Next's App Router catches
	// during rendering via RedirectBoundary — but React error boundaries
	// don't catch errors thrown from event handlers, only from rendering,
	// so this throw is never caught and the user isn't navigated (verified
	// by reading next/navigation's redirect() source: it's an unconditional
	// throw, no fallback path). router.push (already in scope — used for
	// the back button above) is the correct tool here. See
	// component_fixes_deferred memory, queued for a separate branch.
	it('"I\'ll do this later" navigates to /confirmation', async () => {
		await renderAtStepTwo()

		await userEvent.click(
			screen.getByRole('button', { name: /i'll do this later/i }),
		)

		expect(mockPush).toHaveBeenCalledWith('/confirmation')
	})
})
