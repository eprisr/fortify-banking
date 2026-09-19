/**
 * Payment Transfer Flow Tests
 *
 * Covers: Transfer page (RSC) and the rebuilt PaymentTransferForm
 * orchestration (entry → review → identity → success) per ADR-014.
 * AccountPicker and IdentityVerificationForm are mocked here — each has its
 * own dedicated test file — so these tests focus on step transitions and the
 * calls PaymentTransferForm itself makes.
 */

import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { useRouter } from 'next/navigation'
import PaymentTransferForm from '@/components/PaymentTransferForm'
import TransferPage from '@/app/(root)/(no-nav)/payment-transfer/page'
import {
	getLoggedInUser,
	getVerificationStatus,
	transferFunds,
} from '@/lib/actions/user.actions'
import { getAccounts } from '@/lib/actions/bank.actions'

jest.mock('@sentry/nextjs', () => ({ consoleIntegration: jest.fn() }))

jest.mock('@/components/transfers/AccountPicker', () => ({
	AccountPicker: ({ mode, accounts, excludeAccountId, onChange }: any) => (
		<div data-testid={`account-picker-${mode}`}>
			<select
				data-testid={`account-picker-${mode}-select`}
				defaultValue=""
				onChange={(e) => {
					const account = accounts?.find(
						(a: any) => a.appwriteItemId === e.target.value,
					)
					if (account) onChange({ kind: 'account', account })
				}}>
				<option value="">Choose account</option>
				{accounts
					?.filter((a: any) => a.appwriteItemId !== excludeAccountId)
					.map((a: any) => (
						<option key={a.appwriteItemId} value={a.appwriteItemId}>
							{a.name}
						</option>
					))}
			</select>
			{mode === 'to' && (
				<button
					type="button"
					data-testid="pick-recipient"
					onClick={() =>
						onChange({
							kind: 'recipient',
							recipient: { name: 'Jordan Lee', shareableId: 'recv-share-1' },
							email: 'jordan@example.com',
						})
					}>
					Pick Jordan Lee
				</button>
			)}
		</div>
	),
}))

jest.mock('@/components/PlaidLink', () => (props: any) => (
	<button type="button" data-testid="plaid-link" data-props={JSON.stringify(props)}>
		Connect bank
	</button>
))

jest.mock('@/components/transfers/IdentityVerificationForm', () => ({
	IdentityVerificationForm: ({ onVerified, onCancel }: any) => (
		<div data-testid="identity-step">
			<button type="button" data-testid="mock-verify" onClick={onVerified}>
				Mock verify
			</button>
			<button
				type="button"
				data-testid="mock-cancel-identity"
				onClick={onCancel}>
				Mock cancel
			</button>
		</div>
	),
}))

jest.mock('@/lib/actions/user.actions', () => ({
	getLoggedInUser: jest.fn(),
	transferFunds: jest.fn(),
	getVerificationStatus: jest.fn(),
}))

jest.mock('@/lib/actions/bank.actions', () => ({
	getAccounts: jest.fn(),
	getAccount: jest.fn(),
}))

const mockUser: User = {
	$id: 'user-123',
	email: 'janedoe@email.com',
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
	institutionId: 'ins_1',
	institutionName: 'Chase',
	mask: '0001',
	name: 'Chase Checking',
	type: 'depository',
	subtype: 'checking',
	appwriteItemId: 'item-1',
	shareableId: 'share-1',
	hasFundingSource: true,
}

const secondAccount: Account = {
	...mockAccount,
	id: 'acc-2',
	appwriteItemId: 'item-2',
	name: 'High-Yield Savings',
	shareableId: 'share-2',
}

const mockTransferSuccess = { success: true, data: null }

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

/** Flushes the pending getVerificationStatus() promise inside an act() boundary. */
async function flush() {
	await act(async () => {})
}

async function renderPage() {
	const jsx = await TransferPage()
	if (!jsx) return null
	const result = render(jsx)
	await flush()
	return result
}

async function typeAmount(digits: string) {
	await userEvent.type(screen.getByPlaceholderText('$0.00'), digits)
}

describe('Payment Transfer Flow', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		setupRouter()
		;(getVerificationStatus as jest.Mock).mockResolvedValue({
			success: true,
			data: { status: 'verified' },
		})
	})

	describe('Transfer Page — RSC', () => {
		beforeEach(() => {
			;(getLoggedInUser as jest.Mock).mockResolvedValue(mockUser)
			;(getAccounts as jest.Mock).mockResolvedValue({
				data: [mockAccount],
				totalBanks: 1,
				totalCurrentBalance: 1200,
			})
		})

		it('renders the header with a back button and the page title', async () => {
			await renderPage()
			expect(
				await screen.findByRole('heading', { name: /transfer/i }),
			).toBeInTheDocument()
			expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument()
		})

		it('renders the PaymentTransferForm', async () => {
			await renderPage()
			expect(
				await screen.findByRole('button', { name: /review transfer/i }),
			).toBeInTheDocument()
		})

		it('calls getAccounts with the logged-in user id', async () => {
			await renderPage()
			await flush()
			expect(getAccounts).toHaveBeenCalledWith({ userId: mockUser.$id })
		})

		it('does not throw when loggedIn is null', async () => {
			;(getLoggedInUser as jest.Mock).mockResolvedValue(null)
			await expect(renderPage()).resolves.not.toThrow()
			await flush()
		})
	})

	describe('Entry step', () => {
		beforeEach(async () => {
			render(
				<PaymentTransferForm
					accounts={[mockAccount, secondAccount]}
					currentUser={mockUser}
				/>,
			)
			await flush()
		})

		it('renders the bank selector, recipient picker, amount, and note fields', () => {
			expect(screen.getByTestId('account-picker-from-select')).toBeInTheDocument()
			expect(screen.getByTestId('account-picker-to-select')).toBeInTheDocument()
			expect(screen.getByPlaceholderText('$0.00')).toBeInTheDocument()
			expect(
				screen.getByPlaceholderText(/moving to savings/i),
			).toBeInTheDocument()
		})

		it('disables "Review transfer" until from, to, and a positive amount are set', async () => {
			const button = screen.getByRole('button', { name: /review transfer/i })
			expect(button).toBeDisabled()

			await userEvent.selectOptions(
				screen.getByTestId('account-picker-from-select'),
				'item-1',
			)
			expect(button).toBeDisabled()

			await userEvent.selectOptions(
				screen.getByTestId('account-picker-to-select'),
				'item-2',
			)
			expect(button).toBeDisabled()

			await typeAmount('1000')
			expect(button).toBeEnabled()
		})

		it('formats the amount as a currency string while typing', async () => {
			await typeAmount('500')
			expect(screen.getByPlaceholderText('$0.00')).toHaveValue('$5.00')
		})

		it('leaves the amount empty when only non-numeric characters are typed', async () => {
			await typeAmount('abc')
			expect(screen.getByPlaceholderText('$0.00')).toHaveValue('')
		})
	})

	it('shows the unverified weekly limit note for an unverified user', async () => {
		;(getVerificationStatus as jest.Mock).mockResolvedValue({
			success: true,
			data: { status: 'unverified' },
		})
		render(
			<PaymentTransferForm
				accounts={[mockAccount, secondAccount]}
				currentUser={mockUser}
			/>,
		)
		expect(
			await screen.findByText(/up to \$5,000.00 per week/i),
		).toBeInTheDocument()
	})

	it('shows the per-transfer limit note for a verified user', async () => {
		render(
			<PaymentTransferForm
				accounts={[mockAccount, secondAccount]}
				currentUser={mockUser}
			/>,
		)
		expect(
			await screen.findByText(/up to \$10,000.00 per transfer/i),
		).toBeInTheDocument()
	})

	describe('Needs bank link', () => {
		it('shows a reminder to link a bank instead of the transfer form', async () => {
			render(
				<PaymentTransferForm
					accounts={[mockAccount, secondAccount]}
					currentUser={mockUser}
					needsBankLink
				/>,
			)

			expect(
				screen.getByText(/link a bank to send money/i),
			).toBeInTheDocument()
			expect(screen.getByTestId('plaid-link')).toBeInTheDocument()
			expect(
				screen.queryByTestId('account-picker-from-select'),
			).not.toBeInTheDocument()
			expect(
				screen.queryByRole('button', { name: /review transfer/i }),
			).not.toBeInTheDocument()
		})

		it('passes the current user to PlaidLink', async () => {
			render(
				<PaymentTransferForm
					accounts={[mockAccount, secondAccount]}
					currentUser={mockUser}
					needsBankLink
				/>,
			)

			const plaidLink = screen.getByTestId('plaid-link')
			const props = JSON.parse(plaidLink.getAttribute('data-props') ?? '{}')
			expect(props.user).toEqual(mockUser)
		})
	})

	describe('Review step', () => {
		async function fillEntry() {
			await userEvent.selectOptions(
				screen.getByTestId('account-picker-from-select'),
				'item-1',
			)
			await userEvent.selectOptions(
				screen.getByTestId('account-picker-to-select'),
				'item-2',
			)
			await typeAmount('1000')
			await userEvent.click(
				screen.getByRole('button', { name: /review transfer/i }),
			)
		}

		beforeEach(async () => {
			render(
				<PaymentTransferForm
					accounts={[mockAccount, secondAccount]}
					currentUser={mockUser}
				/>,
			)
			await flush()
		})

		it('shows the amount, from, and to accounts', async () => {
			await fillEntry()
			expect(screen.getByText('$10.00')).toBeInTheDocument()
			expect(screen.getByText('Chase Checking')).toBeInTheDocument()
			expect(screen.getByText('High-Yield Savings')).toBeInTheDocument()
		})

		it('goes back to the entry step on "Edit"', async () => {
			await fillEntry()
			await userEvent.click(screen.getByRole('button', { name: /edit/i }))
			expect(screen.getByTestId('account-picker-from-select')).toBeInTheDocument()
		})

		it('submits the transfer directly for a self-transfer (no identity step)', async () => {
			;(transferFunds as jest.Mock).mockResolvedValue(mockTransferSuccess)
			await fillEntry()
			await userEvent.click(
				screen.getByRole('button', { name: /confirm & send/i }),
			)

			await waitFor(() =>
				expect(transferFunds).toHaveBeenCalledWith(
					expect.objectContaining({
						senderBankDocumentId: 'item-1',
						receiverShareableId: 'share-2',
						amount: '10.00',
						recipientName: 'High-Yield Savings',
						recipientEmail: mockUser.email,
					}),
				),
			)
			expect(screen.getByText(/transfer complete/i)).toBeInTheDocument()
		})

		it('shows the server error and stays on review when transferFunds fails', async () => {
			;(transferFunds as jest.Mock).mockResolvedValue({
				success: false,
				error: 'Transfer service unavailable',
			})
			await fillEntry()
			await userEvent.click(
				screen.getByRole('button', { name: /confirm & send/i }),
			)

			expect(
				await screen.findByText('Transfer service unavailable'),
			).toBeInTheDocument()
			expect(screen.queryByText(/transfer complete/i)).not.toBeInTheDocument()
		})
	})

	describe('Sending to another person', () => {
		function renderForm() {
			return render(
				<PaymentTransferForm
					accounts={[mockAccount, secondAccount]}
					currentUser={mockUser}
				/>,
			)
		}

		async function fillEntryForRecipient() {
			await userEvent.selectOptions(
				screen.getByTestId('account-picker-from-select'),
				'item-1',
			)
			await userEvent.click(screen.getByTestId('pick-recipient'))
			await typeAmount('1000')
			await userEvent.click(
				screen.getByRole('button', { name: /review transfer/i }),
			)
		}

		it('routes to the identity step when the recipient is unverified', async () => {
			;(getVerificationStatus as jest.Mock).mockResolvedValue({
				success: true,
				data: { status: 'unverified' },
			})
			renderForm()
			await flush()
			await fillEntryForRecipient()
			await userEvent.click(
				screen.getByRole('button', { name: /confirm & send/i }),
			)

			expect(await screen.findByTestId('identity-step')).toBeInTheDocument()
			expect(transferFunds).not.toHaveBeenCalled()
		})

		it('submits the transfer once identity verification completes', async () => {
			;(getVerificationStatus as jest.Mock).mockResolvedValue({
				success: true,
				data: { status: 'unverified' },
			})
			;(transferFunds as jest.Mock).mockResolvedValue(mockTransferSuccess)
			renderForm()
			await flush()
			await fillEntryForRecipient()
			await userEvent.click(
				screen.getByRole('button', { name: /confirm & send/i }),
			)
			await userEvent.click(await screen.findByTestId('mock-verify'))

			await waitFor(() =>
				expect(transferFunds).toHaveBeenCalledWith(
					expect.objectContaining({
						receiverShareableId: 'recv-share-1',
						recipientName: 'Jordan Lee',
						recipientEmail: 'jordan@example.com',
					}),
				),
			)
		})

		it('shows the transfer error on the identity step when it fails after verification succeeds', async () => {
			;(getVerificationStatus as jest.Mock).mockResolvedValue({
				success: true,
				data: { status: 'unverified' },
			})
			;(transferFunds as jest.Mock).mockResolvedValue({
				success: false,
				error: 'Failed to record transaction',
			})
			renderForm()
			await flush()
			await fillEntryForRecipient()
			await userEvent.click(
				screen.getByRole('button', { name: /confirm & send/i }),
			)
			await userEvent.click(await screen.findByTestId('mock-verify'))

			expect(
				await screen.findByText('Failed to record transaction'),
			).toBeInTheDocument()
			expect(screen.getByTestId('identity-step')).toBeInTheDocument()
		})

		it('treats the sender as verified after a successful identity check, without re-prompting', async () => {
			;(getVerificationStatus as jest.Mock).mockResolvedValue({
				success: true,
				data: { status: 'unverified' },
			})
			;(transferFunds as jest.Mock).mockResolvedValue({
				success: false,
				error: 'Failed to record transaction',
			})
			renderForm()
			await flush()
			await fillEntryForRecipient()
			await userEvent.click(
				screen.getByRole('button', { name: /confirm & send/i }),
			)
			await userEvent.click(await screen.findByTestId('mock-verify'))
			await screen.findByText('Failed to record transaction')

			;(transferFunds as jest.Mock).mockClear()
			;(transferFunds as jest.Mock).mockResolvedValue(mockTransferSuccess)
			await userEvent.click(screen.getByTestId('mock-cancel-identity'))
			await userEvent.click(
				screen.getByRole('button', { name: /confirm & send/i }),
			)

			await waitFor(() => expect(transferFunds).toHaveBeenCalledTimes(1))
			expect(screen.queryByTestId('identity-step')).not.toBeInTheDocument()
		})

		it('does not require identity verification once already verified', async () => {
			;(transferFunds as jest.Mock).mockResolvedValue(mockTransferSuccess)
			renderForm()
			await flush()
			await fillEntryForRecipient()
			await userEvent.click(
				screen.getByRole('button', { name: /confirm & send/i }),
			)

			await waitFor(() => expect(transferFunds).toHaveBeenCalled())
			expect(screen.queryByTestId('identity-step')).not.toBeInTheDocument()
		})

		it('returns to review when identity verification is cancelled', async () => {
			;(getVerificationStatus as jest.Mock).mockResolvedValue({
				success: true,
				data: { status: 'unverified' },
			})
			renderForm()
			await flush()
			await fillEntryForRecipient()
			await userEvent.click(
				screen.getByRole('button', { name: /confirm & send/i }),
			)
			await userEvent.click(await screen.findByTestId('mock-cancel-identity'))

			expect(
				await screen.findByRole('button', { name: /confirm & send/i }),
			).toBeInTheDocument()
			expect(transferFunds).not.toHaveBeenCalled()
		})
	})

	describe('Demo mode', () => {
		it('disables the confirm button and shows a demo notice', async () => {
			render(
				<PaymentTransferForm
					accounts={[mockAccount, secondAccount]}
					currentUser={mockUser}
					isDemo
				/>,
			)
			await userEvent.selectOptions(
				screen.getByTestId('account-picker-from-select'),
				'item-1',
			)
			await userEvent.selectOptions(
				screen.getByTestId('account-picker-to-select'),
				'item-2',
			)
			await typeAmount('1000')
			await userEvent.click(
				screen.getByRole('button', { name: /review transfer/i }),
			)

			expect(
				screen.getByRole('button', { name: /confirm & send/i }),
			).toBeDisabled()
			expect(
				screen.getByText(/aren.t available in demo mode/i),
			).toBeInTheDocument()
			expect(getVerificationStatus).not.toHaveBeenCalled()
		})
	})
})
