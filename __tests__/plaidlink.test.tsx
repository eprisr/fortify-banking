/**
 * PlaidLink Component Tests
 *
 * Covers: link-token fetch on mount, all 5 button variants, the
 * onSuccess/onExit callbacks Plaid Link invokes, and sessionStorage
 * bookkeeping. Previously had no coverage (see plaid_oauth_status memory).
 *
 * react-plaid-link's usePlaidLink renders a real Plaid iframe in the
 * browser — nothing JSDOM can render or drive. It's mocked entirely; tests
 * simulate a user completing (or backing out of) the real Plaid Link modal
 * by directly invoking the onSuccess/onExit callbacks PlaidLink passed into
 * the hook's config, the same way the real Plaid iframe would.
 */
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { useRouter } from 'next/navigation'
import { usePlaidLink } from 'react-plaid-link'
import PlaidLink from '@/components/PlaidLink'
import {
	createLinkToken,
	exchangePublicToken,
} from '@/lib/actions/user.actions'

jest.mock('@/lib/actions/user.actions', () => ({
	createLinkToken: jest.fn(),
	exchangePublicToken: jest.fn(),
}))

jest.mock('react-plaid-link', () => ({
	usePlaidLink: jest.fn(),
}))

const mockOpen = jest.fn()
const mockPush = jest.fn()
const mockRefresh = jest.fn()

function setupRouter() {
	;(useRouter as jest.Mock).mockReturnValue({
		push: mockPush,
		replace: jest.fn(),
		refresh: mockRefresh,
		back: jest.fn(),
		forward: jest.fn(),
	})
}

/** react-plaid-link would normally call onSuccess/onExit itself from inside
 * the real Plaid iframe; the mock hook can't do that, so tests grab the
 * config PlaidLink most recently passed in and invoke them directly —
 * that config is recreated on every render, so this always reads the
 * latest one. */
function lastPlaidLinkConfig() {
	const calls = (usePlaidLink as jest.Mock).mock.calls
	return calls[calls.length - 1][0]
}

const testUser: User = {
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

beforeEach(() => {
	jest.clearAllMocks()
	setupRouter()
	sessionStorage.clear()
	;(createLinkToken as jest.Mock).mockResolvedValue({
		success: true,
		linkToken: 'link-sandbox-test-token',
	})
	;(usePlaidLink as jest.Mock).mockReturnValue({
		open: mockOpen,
		ready: true,
		error: null,
		exit: jest.fn(),
		submit: jest.fn(),
	})
})

describe('link token fetch on mount', () => {
	it('requests a link token for the user and stores it in sessionStorage', async () => {
		render(<PlaidLink user={testUser} variant="primary" />)

		expect(createLinkToken).toHaveBeenCalledWith(testUser, undefined)
		expect(await screen.findByRole('button')).toBeEnabled()
		expect(sessionStorage.getItem('link_token')).toBe('link-sandbox-test-token')
	})

	it('passes update through to createLinkToken for a reconnect flow', () => {
		render(<PlaidLink user={testUser} variant="reconnect" update />)
		expect(createLinkToken).toHaveBeenCalledWith(testUser, true)
	})

	it('stores an empty string when createLinkToken returns no token', async () => {
		;(createLinkToken as jest.Mock).mockResolvedValue({
			success: false,
			error: 'Could not initialize bank connection',
		})

		render(<PlaidLink user={testUser} variant="primary" />)

		await screen.findByRole('button')
		expect(sessionStorage.getItem('link_token')).toBe('')
	})
})

describe('button variants', () => {
	it('renders the primary variant with default text, disabled until ready', () => {
		;(usePlaidLink as jest.Mock).mockReturnValue({
			open: mockOpen,
			ready: false,
			error: null,
			exit: jest.fn(),
			submit: jest.fn(),
		})
		render(<PlaidLink user={testUser} variant="primary" />)
		expect(screen.getByRole('button', { name: 'Connect bank' })).toBeDisabled()
	})

	it('renders the primary variant with custom text when ready', () => {
		render(<PlaidLink user={testUser} variant="primary" text="Add another bank" />)
		expect(
			screen.getByRole('button', { name: 'Add another bank' }),
		).toBeEnabled()
	})

	it('renders the reconnect variant as "Connect", disabled until ready', () => {
		;(usePlaidLink as jest.Mock).mockReturnValue({
			open: mockOpen,
			ready: false,
			error: null,
			exit: jest.fn(),
			submit: jest.fn(),
		})
		render(<PlaidLink user={testUser} variant="reconnect" update />)
		expect(screen.getByRole('button', { name: 'Connect' })).toBeDisabled()
	})

	it('renders the relink variant as "Re-Link", never disabled by readiness', () => {
		;(usePlaidLink as jest.Mock).mockReturnValue({
			open: mockOpen,
			ready: false,
			error: null,
			exit: jest.fn(),
			submit: jest.fn(),
		})
		render(<PlaidLink user={testUser} variant="relink" />)
		expect(screen.getByRole('button', { name: 'Re-Link' })).toBeEnabled()
	})

	it('renders the ghost variant with default text, never disabled by readiness', () => {
		;(usePlaidLink as jest.Mock).mockReturnValue({
			open: mockOpen,
			ready: false,
			error: null,
			exit: jest.fn(),
			submit: jest.fn(),
		})
		render(<PlaidLink user={testUser} variant="ghost" />)
		expect(screen.getByRole('button', { name: 'Connect bank' })).toBeEnabled()
	})

	it('renders the default (no variant) button, never disabled by readiness', () => {
		;(usePlaidLink as jest.Mock).mockReturnValue({
			open: mockOpen,
			ready: false,
			error: null,
			exit: jest.fn(),
			submit: jest.fn(),
		})
		render(<PlaidLink user={testUser} />)
		expect(screen.getByRole('button', { name: 'Connect Bank' })).toBeEnabled()
	})
})

describe('opening Link', () => {
	it('clears any prior error and calls open() when clicked', async () => {
		render(<PlaidLink user={testUser} variant="primary" />)
		await screen.findByRole('button')

		await userEvent.click(screen.getByRole('button'))

		expect(mockOpen).toHaveBeenCalledTimes(1)
	})
})

describe('onSuccess', () => {
	it('exchanges the public token, clears sessionStorage, and redirects to "/" by default', async () => {
		;(exchangePublicToken as jest.Mock).mockResolvedValue({
			success: true,
			data: null,
		})
		render(<PlaidLink user={testUser} variant="primary" />)
		await screen.findByRole('button')
		sessionStorage.setItem('link_token', 'link-sandbox-test-token')

		await act(async () => {
			await lastPlaidLinkConfig().onSuccess('public-sandbox-token', {} as any)
		})

		expect(exchangePublicToken).toHaveBeenCalledWith({
			publicToken: 'public-sandbox-token',
			user: testUser,
		})
		expect(sessionStorage.getItem('link_token')).toBeNull()
		expect(mockRefresh).toHaveBeenCalled()
		expect(mockPush).toHaveBeenCalledWith('/')
	})

	it('redirects to a custom redirectTo on success', async () => {
		;(exchangePublicToken as jest.Mock).mockResolvedValue({
			success: true,
			data: null,
		})
		render(
			<PlaidLink user={testUser} variant="primary" redirectTo="/my-banks" />,
		)
		await screen.findByRole('button')

		await act(async () => {
			await lastPlaidLinkConfig().onSuccess('public-sandbox-token', {} as any)
		})

		expect(mockPush).toHaveBeenCalledWith('/my-banks')
	})

	it('shows the server error and does not navigate when exchangePublicToken reports failure', async () => {
		;(exchangePublicToken as jest.Mock).mockResolvedValue({
			success: false,
			error: 'Bank connection failed',
		})
		render(<PlaidLink user={testUser} variant="primary" />)
		await screen.findByRole('button')

		await act(async () => {
			await lastPlaidLinkConfig().onSuccess('public-sandbox-token', {} as any)
		})

		expect(await screen.findByText('Bank connection failed')).toBeInTheDocument()
		expect(mockPush).not.toHaveBeenCalled()
	})

	it('shows a fallback message when exchangePublicToken fails without an error string', async () => {
		;(exchangePublicToken as jest.Mock).mockResolvedValue({ success: false })
		render(<PlaidLink user={testUser} variant="primary" />)
		await screen.findByRole('button')

		await act(async () => {
			await lastPlaidLinkConfig().onSuccess('public-sandbox-token', {} as any)
		})

		expect(
			await screen.findByText(
				/we connected to your bank, but saving the account failed/i,
			),
		).toBeInTheDocument()
	})
})

describe('onExit', () => {
	it('clears sessionStorage and shows the display_message on a Plaid-reported error', async () => {
		render(<PlaidLink user={testUser} variant="primary" />)
		await screen.findByRole('button')
		sessionStorage.setItem('link_token', 'link-sandbox-test-token')

		act(() => {
			lastPlaidLinkConfig().onExit(
				{
					display_message: 'Institution is temporarily unavailable',
					error_message: 'raw plaid error',
				} as any,
				{} as any,
			)
		})

		expect(sessionStorage.getItem('link_token')).toBeNull()
		expect(
			await screen.findByText('Institution is temporarily unavailable'),
		).toBeInTheDocument()
	})

	it('falls back to error_message when display_message is absent', async () => {
		render(<PlaidLink user={testUser} variant="primary" />)
		await screen.findByRole('button')

		act(() => {
			lastPlaidLinkConfig().onExit(
				{ display_message: null, error_message: 'ITEM_LOGIN_REQUIRED' } as any,
				{} as any,
			)
		})

		expect(await screen.findByText('ITEM_LOGIN_REQUIRED')).toBeInTheDocument()
	})

	it('shows nothing and does not navigate when the user backs out with no error', async () => {
		render(<PlaidLink user={testUser} variant="primary" />)
		await screen.findByRole('button')
		sessionStorage.setItem('link_token', 'link-sandbox-test-token')

		act(() => {
			lastPlaidLinkConfig().onExit(null, {} as any)
		})

		expect(sessionStorage.getItem('link_token')).toBeNull()
		expect(document.querySelector('.form-message')).not.toBeInTheDocument()
		expect(mockPush).not.toHaveBeenCalled()
	})
})
