/**
 * Home Page Tests
 *
 * Covers: rendering with accounts, zero-bank state, UPDATE_MODE,
 * unauthenticated user, homeLinks grid, and edge cases.
 *
 * MSW is not used here because all data fetching goes through Next.js
 * server actions that are mocked via jest.mock. MSW would be needed for
 * direct fetch/axios calls from the component.
 *
 * Home is an async React Server Component — it is awaited before being
 * passed to RTL's render(), which is the correct pattern for testing RSCs
 * in a Jest environment.
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Home from '@/app/(root)/page'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import { getAccounts } from '@/lib/actions/bank.actions'
import { homeLinks } from '@/constants'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock('@/components/Navbar', () => () => <nav data-testid="navbar" />)

jest.mock('@/components/PlaidLink', () => ({ update }: { update?: boolean }) => (
	<div data-testid="plaid-link" data-update={String(!!update)} />
))

jest.mock('@/components/AccountBox', () =>
	function MockAccountBox({ totalBanks }: { totalBanks: number }) {
		return <div data-testid="account-box" data-total-banks={totalBanks} />
	},
)

jest.mock('@/lib/actions/user.actions', () => ({
	getLoggedInUser: jest.fn(),
}))

jest.mock('@/lib/actions/bank.actions', () => ({
	getAccounts: jest.fn(),
	getAccount: jest.fn(),
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockUser: User = {
	$id: 'user-123',
	email: 'jane@example.com',
	userId: 'user-123',
	dwollaCustomerUrl: 'https://api-sandbox.dwolla.com/customers/user-123',
	dwollaCustomerId: 'dwolla-123',
	firstName: 'Jane',
	lastName: 'Doe',
	name: 'Jane Doe',
	address1: '123 Main St',
	city: 'New York',
	state: 'NY',
	postalCode: '10001',
	dateOfBirth: '1990-01-01',
	ssn: '1234',
}

const mockAccount: Account = {
	id: 'acc-1',
	availableBalance: 1000,
	currentBalance: 1200,
	officialName: 'Chase Total Checking',
	mask: '0001',
	institutionId: 'ins_1',
	name: 'Chase Checking',
	type: 'depository',
	subtype: 'checking',
	appwriteItemId: 'item-1',
	shareableId: 'share-1',
}

// Matches the shape returned by bank.actions getAccounts
const mockAccountsData = {
	data: [mockAccount],
	totalBanks: 1,
	totalCurrentBalance: 1200,
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Awaits the async RSC then renders it. Accepts optional search params
 * to simulate Next.js searchParams prop.
 */
async function renderHome(searchParams: Record<string, string> = {}) {
	const jsx = await Home({
		params: Promise.resolve({}),
		searchParams: Promise.resolve(searchParams),
	})
	return render(jsx)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Home Page', () => {
	beforeAll(() => {
		// Suppress console.log from the debug statement in the Home component
		jest.spyOn(console, 'log').mockImplementation(() => {})
	})

	afterAll(() => {
		jest.restoreAllMocks()
	})

	beforeEach(() => {
		jest.clearAllMocks()
	})

	// =========================================================================
	describe('Authenticated user with connected banks', () => {
		// =========================================================================

		beforeEach(() => {
			;(getLoggedInUser as jest.Mock).mockResolvedValue(mockUser)
			;(getAccounts as jest.Mock).mockResolvedValue(mockAccountsData)
		})

		it('renders the Navbar', async () => {
			await renderHome()
			expect(screen.getByTestId('navbar')).toBeInTheDocument()
		})

		it('renders the AccountBox', async () => {
			await renderHome()
			expect(screen.getByTestId('account-box')).toBeInTheDocument()
		})

		it('passes the correct totalBanks to AccountBox', async () => {
			await renderHome()
			expect(screen.getByTestId('account-box')).toHaveAttribute(
				'data-total-banks',
				'1',
			)
		})

		it('calls getLoggedInUser exactly once', async () => {
			await renderHome()
			expect(getLoggedInUser).toHaveBeenCalledTimes(1)
		})

		it('calls getAccounts with the logged-in user id', async () => {
			await renderHome()
			expect(getAccounts).toHaveBeenCalledWith({ userId: mockUser.$id })
		})

		it('does not show the disconnected account message', async () => {
			await renderHome()
			expect(
				screen.queryByText(/disconnected from our app/i),
			).not.toBeInTheDocument()
		})

		it('does not render the PlaidLink reconnect button', async () => {
			await renderHome()
			expect(screen.queryByTestId('plaid-link')).not.toBeInTheDocument()
		})
	})

	// =========================================================================
	describe('No banks connected (totalBanks === 0)', () => {
		// =========================================================================

		beforeEach(() => {
			;(getLoggedInUser as jest.Mock).mockResolvedValue(mockUser)
			;(getAccounts as jest.Mock).mockResolvedValue({
				data: [],
				totalBanks: 0,
				totalCurrentBalance: 0,
			})
		})

		it('shows the disconnected account message', async () => {
			await renderHome()
			expect(
				screen.getByText(/disconnected from our app/i),
			).toBeInTheDocument()
		})

		it('renders PlaidLink in update mode', async () => {
			await renderHome()
			const plaidLink = screen.getByTestId('plaid-link')
			expect(plaidLink).toBeInTheDocument()
			expect(plaidLink).toHaveAttribute('data-update', 'true')
		})

		it('does not render AccountBox', async () => {
			await renderHome()
			expect(screen.queryByTestId('account-box')).not.toBeInTheDocument()
		})
	})

	// =========================================================================
	describe('UPDATE_MODE — bank token expired', () => {
		// =========================================================================

		beforeEach(() => {
			;(getLoggedInUser as jest.Mock).mockResolvedValue(mockUser)
			;(getAccounts as jest.Mock).mockResolvedValue('UPDATE_MODE')
		})

		it('shows the disconnected account message', async () => {
			await renderHome()
			expect(
				screen.getByText(/disconnected from our app/i),
			).toBeInTheDocument()
		})

		it('renders PlaidLink in update mode', async () => {
			await renderHome()
			const plaidLink = screen.getByTestId('plaid-link')
			expect(plaidLink).toBeInTheDocument()
			expect(plaidLink).toHaveAttribute('data-update', 'true')
		})

		it('does not render AccountBox', async () => {
			await renderHome()
			expect(screen.queryByTestId('account-box')).not.toBeInTheDocument()
		})
	})

	// =========================================================================
	describe('Unauthenticated user (getLoggedInUser returns null)', () => {
		// =========================================================================

		beforeEach(() => {
			;(getLoggedInUser as jest.Mock).mockResolvedValue(null)
			;(getAccounts as jest.Mock).mockResolvedValue({
				data: [],
				totalBanks: 0,
				totalCurrentBalance: 0,
			})
		})

		it('renders without crashing', async () => {
			await expect(renderHome()).resolves.not.toThrow()
		})

		it('renders the Navbar', async () => {
			await renderHome()
			expect(screen.getByTestId('navbar')).toBeInTheDocument()
		})

		it('calls getAccounts with undefined userId', async () => {
			await renderHome()
			expect(getAccounts).toHaveBeenCalledWith({ userId: undefined })
		})

		it('shows the disconnected account message (no banks for null user)', async () => {
			await renderHome()
			expect(
				screen.getByText(/disconnected from our app/i),
			).toBeInTheDocument()
		})
	})

	// =========================================================================
	describe('Edge case — getAccounts returns undefined', () => {
		// =========================================================================

		it('throws when accounts is undefined (accessing .totalBanks without optional chaining)', async () => {
			// Known bug: the Home component accesses `accounts.totalBanks` without
			// guarding against undefined, causing a crash when getAccounts fails.
			;(getLoggedInUser as jest.Mock).mockResolvedValue(mockUser)
			;(getAccounts as jest.Mock).mockResolvedValue(undefined)

			await expect(renderHome()).rejects.toThrow()
		})
	})

	// =========================================================================
	describe('homeLinks grid', () => {
		// =========================================================================

		beforeEach(async () => {
			;(getLoggedInUser as jest.Mock).mockResolvedValue(mockUser)
			;(getAccounts as jest.Mock).mockResolvedValue(mockAccountsData)
			await renderHome()
		})

		it('renders every homeLink label', () => {
			homeLinks.forEach(({ label }) => {
				expect(screen.getByText(label)).toBeInTheDocument()
			})
		})

		it('renders the correct number of link items', () => {
			expect(homeLinks).toHaveLength(9)
			homeLinks.forEach(({ label }) => {
				expect(screen.getByText(label)).toBeInTheDocument()
			})
		})

		it('renders active links with their correct route href', () => {
			homeLinks
				.filter(({ route }) => route !== '#')
				.forEach(({ route, label }) => {
					const link = screen.getByText(label).closest('a')
					expect(link).toHaveAttribute('href', route)
				})
		})

		it('renders disabled links with href="#"', () => {
			homeLinks
				.filter(({ route }) => route === '#')
				.forEach(({ label }) => {
					const link = screen.getByText(label).closest('a')
					expect(link).toHaveAttribute('href', '#')
				})
		})

		it('applies cursor-default class to disabled links', () => {
			homeLinks
				.filter(({ route }) => route === '#')
				.forEach(({ label }) => {
					const link = screen.getByText(label).closest('a')
					expect(link).toHaveClass('cursor-default')
				})
		})

		it('does not apply cursor-default to active links', () => {
			homeLinks
				.filter(({ route }) => route !== '#')
				.forEach(({ label }) => {
					const link = screen.getByText(label).closest('a')
					expect(link).not.toHaveClass('cursor-default')
				})
		})

		it('renders an "Account and Card" link to /my-banks', () => {
			expect(screen.getByText('Account and Card').closest('a')).toHaveAttribute(
				'href',
				'/my-banks',
			)
		})

		it('renders a "Transfer" link to /payment-transfer', () => {
			expect(screen.getByText('Transfer').closest('a')).toHaveAttribute(
				'href',
				'/payment-transfer',
			)
		})

		it('renders a "Transaction history" link to /transaction-history', () => {
			expect(
				screen.getByText('Transaction history').closest('a'),
			).toHaveAttribute('href', '/transaction-history')
		})
	})

	// =========================================================================
	describe('Edge cases', () => {
		// =========================================================================

		it('renders AccountBox correctly with multiple bank accounts', async () => {
			;(getLoggedInUser as jest.Mock).mockResolvedValue(mockUser)
			;(getAccounts as jest.Mock).mockResolvedValue({
				data: [
					mockAccount,
					{ ...mockAccount, id: 'acc-2', mask: '0002', appwriteItemId: 'item-2' },
				],
				totalBanks: 2,
				totalCurrentBalance: 2400,
			})

			await renderHome()

			expect(screen.getByTestId('account-box')).toHaveAttribute(
				'data-total-banks',
				'2',
			)
		})

		it('renders without crashing when an "id" search param is provided', async () => {
			;(getLoggedInUser as jest.Mock).mockResolvedValue(mockUser)
			;(getAccounts as jest.Mock).mockResolvedValue(mockAccountsData)

			await expect(renderHome({ id: 'item-1' })).resolves.not.toThrow()
		})

		it('renders the homeLinks grid even in UPDATE_MODE', async () => {
			;(getLoggedInUser as jest.Mock).mockResolvedValue(mockUser)
			;(getAccounts as jest.Mock).mockResolvedValue('UPDATE_MODE')

			await renderHome()

			homeLinks.forEach(({ label }) => {
				expect(screen.getByText(label)).toBeInTheDocument()
			})
		})

		it('renders the homeLinks grid when totalBanks is 0', async () => {
			;(getLoggedInUser as jest.Mock).mockResolvedValue(mockUser)
			;(getAccounts as jest.Mock).mockResolvedValue({
				data: [],
				totalBanks: 0,
				totalCurrentBalance: 0,
			})

			await renderHome()

			homeLinks.forEach(({ label }) => {
				expect(screen.getByText(label)).toBeInTheDocument()
			})
		})
	})
})
