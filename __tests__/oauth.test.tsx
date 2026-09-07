/**
 * OAuth (Plaid Link resume) Page Tests
 *
 * Covers: app/(root)/(with-nav)/oauth/page.tsx — the page Plaid redirects back to
 * mid-flow for an OAuth-based institution. It resumes the Link session
 * started by PlaidLink.tsx (same link_token, carried via sessionStorage)
 * using the redirect URI's oauth_state_id, then auto-reopens Link. No
 * automated coverage previously existed (see plaid_oauth_status memory).
 *
 * Same reasoning as plaidlink.test.tsx for mocking react-plaid-link
 * entirely: usePlaidLink drives a real Plaid iframe that JSDOM can't
 * render, so tests simulate Plaid's callbacks by invoking the config this
 * page passed into the hook directly.
 */
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { useRouter } from 'next/navigation'
import { usePlaidLink } from 'react-plaid-link'
import OAuthLink from '@/app/(root)/(with-nav)/oauth/page'
import {
	exchangePublicToken,
	getLoggedInUser,
} from '@/lib/actions/user.actions'

jest.mock('@/lib/actions/user.actions', () => ({
	exchangePublicToken: jest.fn(),
	getLoggedInUser: jest.fn(),
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
	;(getLoggedInUser as jest.Mock).mockResolvedValue(testUser)
	;(usePlaidLink as jest.Mock).mockReturnValue({
		open: mockOpen,
		ready: true,
		error: null,
		exit: jest.fn(),
		submit: jest.fn(),
	})
})

describe('resuming the Link session', () => {
	it('reads the stored link_token and the current URL into the hook config', async () => {
		sessionStorage.setItem('link_token', 'link-sandbox-test-token')

		render(<OAuthLink />)

		await waitFor(() => expect(getLoggedInUser).toHaveBeenCalled())
		expect(lastPlaidLinkConfig()).toMatchObject({
			token: 'link-sandbox-test-token',
			receivedRedirectUri: window.location.href,
		})
	})

	it('auto-reopens Link once ready, the user, token, and redirect URI are all available', async () => {
		sessionStorage.setItem('link_token', 'link-sandbox-test-token')

		render(<OAuthLink />)

		await waitFor(() => expect(mockOpen).toHaveBeenCalledTimes(1))
	})

	it('does not auto-open when there is no stored link_token', async () => {
		render(<OAuthLink />)

		await waitFor(() => expect(getLoggedInUser).toHaveBeenCalled())
		expect(mockOpen).not.toHaveBeenCalled()
	})

	it('does not auto-open when there is no logged-in user', async () => {
		;(getLoggedInUser as jest.Mock).mockResolvedValue(null)
		sessionStorage.setItem('link_token', 'link-sandbox-test-token')

		render(<OAuthLink />)

		await waitFor(() => expect(getLoggedInUser).toHaveBeenCalled())
		expect(mockOpen).not.toHaveBeenCalled()
	})

	it('does not auto-open while not ready', async () => {
		;(usePlaidLink as jest.Mock).mockReturnValue({
			open: mockOpen,
			ready: false,
			error: null,
			exit: jest.fn(),
			submit: jest.fn(),
		})
		sessionStorage.setItem('link_token', 'link-sandbox-test-token')

		render(<OAuthLink />)

		await waitFor(() => expect(getLoggedInUser).toHaveBeenCalled())
		expect(mockOpen).not.toHaveBeenCalled()
	})
})

describe('renders nothing while resolving and no error', () => {
	it('renders an empty fragment', async () => {
		const { container } = render(<OAuthLink />)
		await waitFor(() => expect(getLoggedInUser).toHaveBeenCalled())
		expect(container).toBeEmptyDOMElement()
	})
})

describe('onSuccess', () => {
	it('shows a generic error and never calls exchangePublicToken if there is no user yet', async () => {
		;(getLoggedInUser as jest.Mock).mockResolvedValue(null)
		render(<OAuthLink />)
		await waitFor(() => expect(getLoggedInUser).toHaveBeenCalled())

		await act(async () => {
			await lastPlaidLinkConfig().onSuccess('public-sandbox-token', {} as any)
		})

		expect(exchangePublicToken).not.toHaveBeenCalled()
		expect(
			await screen.findByText(/something went wrong\. please try again\./i),
		).toBeInTheDocument()
	})

	it('exchanges the public token and redirects to "/" on success', async () => {
		;(exchangePublicToken as jest.Mock).mockResolvedValue({
			success: true,
			data: null,
		})
		render(<OAuthLink />)
		await waitFor(() => expect(getLoggedInUser).toHaveBeenCalled())
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

	it('shows the "Bank connection failed" screen when exchangePublicToken reports failure', async () => {
		;(exchangePublicToken as jest.Mock).mockResolvedValue({
			success: false,
			error: 'Could not save your bank account',
		})
		render(<OAuthLink />)
		await waitFor(() => expect(getLoggedInUser).toHaveBeenCalled())

		await act(async () => {
			await lastPlaidLinkConfig().onSuccess('public-sandbox-token', {} as any)
		})

		expect(
			await screen.findByRole('heading', { name: /bank connection failed/i }),
		).toBeInTheDocument()
		expect(
			screen.getByText('Could not save your bank account'),
		).toBeInTheDocument()
		expect(mockPush).not.toHaveBeenCalled()
	})
})

describe('onExit', () => {
	it('shows the error screen and does not redirect on a Plaid-reported error', async () => {
		render(<OAuthLink />)
		await waitFor(() => expect(getLoggedInUser).toHaveBeenCalled())

		act(() => {
			lastPlaidLinkConfig().onExit(
				{
					display_message: 'Institution is temporarily unavailable',
					error_message: 'raw plaid error',
				} as any,
				{} as any,
			)
		})

		expect(
			await screen.findByText('Institution is temporarily unavailable'),
		).toBeInTheDocument()
		expect(mockPush).not.toHaveBeenCalled()
	})

	it('clears sessionStorage and redirects to "/" when the user backs out deliberately', async () => {
		render(<OAuthLink />)
		await waitFor(() => expect(getLoggedInUser).toHaveBeenCalled())
		sessionStorage.setItem('link_token', 'link-sandbox-test-token')

		act(() => {
			lastPlaidLinkConfig().onExit(null, {} as any)
		})

		expect(sessionStorage.getItem('link_token')).toBeNull()
		expect(mockPush).toHaveBeenCalledWith('/')
	})

	it('"Return to dashboard" on the error screen navigates home', async () => {
		render(<OAuthLink />)
		await waitFor(() => expect(getLoggedInUser).toHaveBeenCalled())

		act(() => {
			lastPlaidLinkConfig().onExit(
				{ display_message: 'Failed', error_message: null } as any,
				{} as any,
			)
		})
		await screen.findByText('Failed')

		await userEvent.click(
			screen.getByRole('button', { name: /return to dashboard/i }),
		)

		expect(mockPush).toHaveBeenCalledWith('/')
	})
})
