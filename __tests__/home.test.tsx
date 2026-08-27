/**
 * Home Page Tests
 *
 * Covers: rendering with connected accounts, demo accounts, UPDATE_MODE,
 * unauthenticated users, and edge cases.
 *
 * MSW is not used here because all data fetching goes through Next.js
 * server actions that are mocked via jest.mock. MSW would be needed for
 * direct fetch/axios calls from the component.
 *
 * Home is an async React Server Component — it is awaited before being
 * passed to RTL's render(), which is the correct pattern for testing RSCs
 * in a Jest environment.
 *
 * Previously, `accountsData[0].id` was read without a guard (app/(root)/page.tsx)
 * to detect demo accounts, which threw whenever accountsData was empty or
 * `accounts` was the 'UPDATE_MODE' sentinel string — most commonly hit when a
 * linked bank's Plaid item enters ITEM_LOGIN_REQUIRED and getAccounts filters
 * it out. That's now guarded (optional chaining on every accountsData/accounts
 * access), so these states render the "Your session expired" relink prompt
 * instead of crashing. The "Known bug" describe block below now documents
 * that fixed behavior.
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Home from '@/app/(root)/page'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import { getAccounts, getAccount } from '@/lib/actions/bank.actions'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock('@/components/Navbar', () => () => <nav data-testid="navbar" />)

jest.mock(
	'@/components/PlaidLink',
	() =>
		({ variant, update }: { variant?: string; update?: boolean }) => (
			<div
				data-testid={`plaid-link-${variant}`}
				data-update={String(!!update)}
			/>
		),
)

jest.mock(
	'@/components/AccountBox',
	() =>
		function MockAccountBox({ totalBanks }: { totalBanks: number }) {
			return <div data-testid="account-box" data-total-banks={totalBanks} />
		},
)

jest.mock('@/components/QuickLinks', () => () => (
	<div data-testid="quick-links" />
))

jest.mock(
	'@/components/MonthSpend',
	() =>
		function MockMonthSpend({ transactions }: { transactions?: unknown[] }) {
			return (
				<div
					data-testid="month-spend"
					data-transaction-count={transactions?.length ?? 'undefined'}
				/>
			)
		},
)

jest.mock('@/components/RecentTransactions', () => ({
	RecentTransactions: function MockRecentTransactions({
		transactions,
	}: {
		transactions?: unknown[]
	}) {
		return (
			<div
				data-testid="recent-transactions"
				data-transaction-count={transactions?.length ?? 'undefined'}
			/>
		)
	},
}))

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
	institutionName: 'ins',
	name: 'Chase Checking',
	type: 'depository',
	subtype: 'checking',
	appwriteItemId: 'item-1',
	shareableId: 'share-1',
}

// Mirrors lib/demo-data.ts DEMO_ACCOUNTS[0] — real getAccounts falls back to
// data shaped like this (id containing "demo") when no bank is linked.
const demoAccount: Account = {
	id: 'demo-account-checking',
	availableBalance: 4231.89,
	currentBalance: 4231.89,
	officialName: 'Fortify Everyday Checking',
	mask: '4821',
	institutionId: 'demo_institution',
	institutionName: 'ins',
	name: 'Everyday Checking',
	type: 'depository',
	subtype: 'checking',
	appwriteItemId: 'demo-bank-checking',
	shareableId: 'ZGVtby1hY2NvdW50LWNoZWNraW5n',
}

const mockTransactions = [
	{ id: 'tx-1', date: '2026-07-01', amount: 42, type: 'debit' },
	{ id: 'tx-2', date: '2026-07-02', amount: 100, type: 'credit' },
]

const mockAccountsData = {
	data: [mockAccount],
	totalBanks: 1,
	totalCurrentBalance: 1200,
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/** Awaits the async RSC then renders it. */
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
	beforeEach(() => {
		jest.clearAllMocks()
		;(getAccount as jest.Mock).mockResolvedValue({
			transactions: mockTransactions,
		})
	})

	// =========================================================================
	describe('Authenticated user with a real connected bank', () => {
		// =========================================================================

		beforeEach(() => {
			;(getLoggedInUser as jest.Mock).mockResolvedValue(mockUser)
			;(getAccounts as jest.Mock).mockResolvedValue(mockAccountsData)
		})

		it('renders the Navbar', async () => {
			await renderHome()
			expect(screen.getByTestId('navbar')).toBeInTheDocument()
		})

		it('renders the AccountBox with the correct totalBanks', async () => {
			await renderHome()
			expect(screen.getByTestId('account-box')).toHaveAttribute(
				'data-total-banks',
				'1',
			)
		})

		it('renders the QuickLinks grid', async () => {
			await renderHome()
			expect(screen.getByTestId('quick-links')).toBeInTheDocument()
		})

		it('passes the fetched transactions to MonthSpend and RecentTransactions', async () => {
			await renderHome()
			expect(screen.getByTestId('month-spend')).toHaveAttribute(
				'data-transaction-count',
				'2',
			)
			expect(screen.getByTestId('recent-transactions')).toHaveAttribute(
				'data-transaction-count',
				'2',
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

		it('calls getAccount with the first account’s appwriteItemId', async () => {
			await renderHome()
			expect(getAccount).toHaveBeenCalledWith({
				appwriteItemId: mockAccount.appwriteItemId,
			})
		})

		it('calls getAccount with the "id" search param when provided', async () => {
			await renderHome({ id: 'item-from-url' })
			expect(getAccount).toHaveBeenCalledWith({
				appwriteItemId: 'item-from-url',
			})
		})

		it('does not show the "Your session expired" message', async () => {
			await renderHome()
			expect(
				screen.queryByText(/your session expired/i),
			).not.toBeInTheDocument()
		})

		it('does not render any PlaidLink variant', async () => {
			await renderHome()
			expect(
				screen.queryByTestId('plaid-link-reconnect'),
			).not.toBeInTheDocument()
			expect(screen.queryByTestId('plaid-link-relink')).not.toBeInTheDocument()
			expect(screen.queryByTestId('plaid-link-primary')).not.toBeInTheDocument()
		})
	})

	// =========================================================================
	describe('Demo account (id contains "demo", totalBanks > 0)', () => {
		// =========================================================================

		beforeEach(() => {
			;(getLoggedInUser as jest.Mock).mockResolvedValue(mockUser)
			;(getAccounts as jest.Mock).mockResolvedValue({
				data: [demoAccount],
				totalBanks: 1,
				totalCurrentBalance: demoAccount.currentBalance,
			})
		})

		it('renders the reconnect PlaidLink prompting the user to connect a bank', async () => {
			await renderHome()
			expect(screen.getByTestId('plaid-link-reconnect')).toBeInTheDocument()
		})

		it('renders the primary "Connect bank" PlaidLink', async () => {
			await renderHome()
			expect(screen.getByTestId('plaid-link-reconnect')).toBeInTheDocument()
		})

		it('does not render the relink PlaidLink or "Your session expired" message', async () => {
			await renderHome()
			expect(screen.queryByTestId('plaid-link-relink')).not.toBeInTheDocument()
			expect(
				screen.queryByText(/your session expired/i),
			).not.toBeInTheDocument()
		})

		it('still renders the AccountBox', async () => {
			await renderHome()
			expect(screen.getByTestId('account-box')).toBeInTheDocument()
		})
	})

	// =========================================================================
	describe('Unauthenticated user (getLoggedInUser returns null)', () => {
		// =========================================================================

		// Currently failing: Home is `if (!loggedIn) return null`
		// (app/(root)/page.tsx) — it bails out before ever reaching
		// getAccounts, and there's no middleware.ts redirecting
		// unauthenticated visitors elsewhere, so an unauthenticated hit on
		// "/" renders a fully blank page instead of the demo-data view these
		// tests expect. See component_fixes_deferred memory, queued for a
		// separate branch. Left asserting the intended behavior rather than
		// the current gap so the failure keeps tracking the issue.
		beforeEach(() => {
			;(getLoggedInUser as jest.Mock).mockResolvedValue(null)
			;(getAccounts as jest.Mock).mockResolvedValue({
				data: [demoAccount],
				totalBanks: 1,
				totalCurrentBalance: demoAccount.currentBalance,
			})
		})

		it('renders without crashing', async () => {
			await expect(renderHome()).resolves.not.toThrow()
		})

		it('renders the Navbar', async () => {
			await renderHome()
			expect(screen.getByTestId('navbar')).toBeInTheDocument()
		})

		it('calls getAccounts with an undefined userId', async () => {
			await renderHome()
			expect(getAccounts).toHaveBeenCalledWith({ userId: undefined })
		})
	})

	// =========================================================================
	describe('Fixed: accountsData access is guarded against empty/sentinel results', () => {
		// =========================================================================

		it('renders the relink prompt instead of throwing when totalBanks is 0 and data is an empty array', async () => {
			;(getLoggedInUser as jest.Mock).mockResolvedValue(mockUser)
			;(getAccounts as jest.Mock).mockResolvedValue({
				data: [],
				totalBanks: 0,
				totalCurrentBalance: 0,
			})

			await expect(renderHome()).resolves.not.toThrow()
			expect(
				screen.getByText('Bank connection needs attention'),
			).toBeInTheDocument()
			expect(screen.getByTestId('plaid-link-reconnect')).toBeInTheDocument()
			// Nothing to look up — getAccount shouldn't be called just to fail.
			expect(getAccount).not.toHaveBeenCalled()
		})

		it('does not throw when getAccounts returns the "UPDATE_MODE" sentinel', async () => {
			;(getLoggedInUser as jest.Mock).mockResolvedValue(mockUser)
			;(getAccounts as jest.Mock).mockResolvedValue('UPDATE_MODE')

			await expect(renderHome()).resolves.not.toThrow()
			expect(
				screen.getByText('Bank connection needs attention'),
			).toBeInTheDocument()
			expect(getAccount).not.toHaveBeenCalled()
		})

		it('does not throw when accounts is undefined', async () => {
			;(getLoggedInUser as jest.Mock).mockResolvedValue(mockUser)
			;(getAccounts as jest.Mock).mockResolvedValue(undefined)

			await expect(renderHome()).resolves.not.toThrow()
			expect(getAccount).not.toHaveBeenCalled()
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
					{
						...mockAccount,
						id: 'acc-2',
						mask: '0002',
						appwriteItemId: 'item-2',
					},
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

		it('passes an empty transaction count when getAccount resolves without transactions', async () => {
			;(getLoggedInUser as jest.Mock).mockResolvedValue(mockUser)
			;(getAccounts as jest.Mock).mockResolvedValue(mockAccountsData)
			;(getAccount as jest.Mock).mockResolvedValue(undefined)

			await renderHome()

			expect(screen.getByTestId('month-spend')).toHaveAttribute(
				'data-transaction-count',
				'undefined',
			)
		})
	})
})
