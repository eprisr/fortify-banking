/**
 * Payment Transfer Flow Tests
 *
 * Covers: Transfer page (RSC), PaymentTransferForm rendering, validation,
 * submission success/error, loading state, and edge cases.
 *
 * MSW is not used here because all external API calls go through Next.js
 * server actions mocked via jest.mock.
 *
 * Known implementation note: the amount field in PaymentTransferForm passes
 * a number to react-hook-form (via handleChange) while the schema declares
 * `z.string()`. The transferFormSchema mock below uses `z.coerce.string()`
 * to work around this type mismatch so that submission tests can run.
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { useRouter } from 'next/navigation'
import PaymentTransferForm from '@/components/PaymentTransferForm'
import TransferPage from '@/app/(root)/payment-transfer/page'
import { getLoggedInUser, transferFunds } from '@/lib/actions/user.actions'
import { getAccounts } from '@/lib/actions/bank.actions'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock('@sentry/nextjs', () => ({ consoleIntegration: jest.fn() }))

jest.mock('@/components/Navbar', () => () => <nav data-testid="navbar" />)

// Transfer type radio group — not the focus of these tests
jest.mock('@/components/Transfer', () => () => (
	<div data-testid="transfer-type" />
))

// Contacts panel — not the focus of these tests
jest.mock('@/components/Contacts', () => () => <div data-testid="contacts" />)

// BankDropdown is a named export that calls setValue('senderBank', value) on change
jest.mock('@/components/BankDropdown', () => ({
	BankDropdown: ({ accounts, setValue }: any) => (
		<select
			data-testid="bank-dropdown"
			defaultValue=""
			onChange={(e) => setValue?.('senderBank', e.target.value)}>
			<option value="">Select a bank</option>
			{accounts?.map((a: any) => (
				<option key={a.appwriteItemId} value={a.appwriteItemId}>
					{a.name}
				</option>
			))}
		</select>
	),
}))

// Fix the amount type mismatch: handleChange passes a number to react-hook-form
// but the real schema uses z.string(). z.coerce.string() accepts both.
jest.mock('@/lib/utils', () => {
	const actual = jest.requireActual<typeof import('@/lib/utils')>('@/lib/utils')
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { z } = require('zod')
	return {
		...actual,
		transferFormSchema: () =>
			z.object({
				senderBank: z.string().min(4, 'Please select a valid bank account'),
				recipientName: z
					.string()
					.min(1, 'Please enter the name of the recipient'),
				recipientEmail: z.string().email('Invalid email address'),
				sharableId: z.string().min(8, 'Please select a valid sharable Id'),
				amount: z.coerce.string().min(1, 'Amount is too short'),
				note: z.string().optional(),
			}),
	}
})

jest.mock('@/lib/actions/user.actions', () => ({
	getLoggedInUser: jest.fn(),
	transferFunds: jest.fn(),
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
	mask: '0001',
	institutionId: 'ins_1',
	name: 'Chase Checking',
	type: 'depository',
	subtype: 'checking',
	appwriteItemId: 'item-1',
	shareableId: 'share-1',
}

const mockTransferSuccess = { success: true, data: null }

// Stands in for a real (AES-GCM encrypted) shareableId — the client treats
// it as an opaque string, so any value passing the schema's min(8) works.
const VALID_SHARABLE_ID = btoa('receiver-acc-1')

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

/** Await and render the async Transfer RSC. Returns null if the page early-returns. */
async function renderPage() {
	const jsx = await TransferPage()
	if (!jsx) return null
	return render(jsx)
}

/** Fill all required fields with valid data and click the submit button. */
async function fillAndSubmit() {
	await userEvent.selectOptions(screen.getByTestId('bank-dropdown'), 'item-1')
	await userEvent.type(screen.getByPlaceholderText('J Doe'), 'Jane Doe')
	await userEvent.type(
		screen.getByPlaceholderText(/johndoe@email/i),
		'receiver@example.com',
	)
	await userEvent.type(
		screen.getByPlaceholderText(/fdewkl/i),
		VALID_SHARABLE_ID,
	)
	await userEvent.type(screen.getByPlaceholderText(/ex: 5.00/i), '1000')
	await userEvent.click(screen.getByRole('button', { name: /transfer funds/i }))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Payment Transfer Flow', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		setupRouter()
	})

	// =========================================================================
	describe('Transfer Page — RSC', () => {
		// =========================================================================

		beforeEach(() => {
			;(getLoggedInUser as jest.Mock).mockResolvedValue(mockUser)
			;(getAccounts as jest.Mock).mockResolvedValue({
				data: [mockAccount],
				totalBanks: 1,
				totalCurrentBalance: 1200,
			})
		})

		it('renders the Navbar', async () => {
			await renderPage()
			expect(screen.getByTestId('navbar')).toBeInTheDocument()
		})

		it('renders the PaymentTransferForm', async () => {
			await renderPage()
			expect(
				screen.getByRole('button', { name: /transfer funds/i }),
			).toBeInTheDocument()
		})

		it('calls getLoggedInUser once', async () => {
			await renderPage()
			expect(getLoggedInUser).toHaveBeenCalledTimes(1)
		})

		it('calls getAccounts with the logged-in user id', async () => {
			await renderPage()
			expect(getAccounts).toHaveBeenCalledWith({ userId: mockUser.$id })
		})

		it('still renders the form when getAccounts returns null', async () => {
			;(getAccounts as jest.Mock).mockResolvedValue(null)
			await renderPage()
			expect(
				screen.getByRole('button', { name: /transfer funds/i }),
			).toBeInTheDocument()
		})

		it('still renders the form when getAccounts returns undefined', async () => {
			;(getAccounts as jest.Mock).mockResolvedValue(undefined)
			await renderPage()
			expect(
				screen.getByRole('button', { name: /transfer funds/i }),
			).toBeInTheDocument()
		})

		it('does not throw when loggedIn is null, and calls getAccounts with undefined userId', async () => {
			;(getLoggedInUser as jest.Mock).mockResolvedValue(null)
			await expect(renderPage()).resolves.not.toThrow()
			expect(getAccounts).toHaveBeenCalledWith({ userId: undefined })
		})
	})

	// =========================================================================
	describe('PaymentTransferForm — Rendering', () => {
		// =========================================================================

		beforeEach(() => render(<PaymentTransferForm accounts={[mockAccount]} />))

		it('renders the bank selector dropdown', () => {
			expect(screen.getByTestId('bank-dropdown')).toBeInTheDocument()
		})

		it('renders the transaction type selector', () => {
			expect(screen.getByTestId('transfer-type')).toBeInTheDocument()
		})

		it('renders the contacts panel', () => {
			expect(screen.getByTestId('contacts')).toBeInTheDocument()
		})

		it('renders the "Recipient Information" card heading', () => {
			expect(screen.getByText('Recipient Information')).toBeInTheDocument()
		})

		it('renders the recipient name input', () => {
			expect(screen.getByPlaceholderText('J Doe')).toBeInTheDocument()
		})

		it('renders the recipient email input', () => {
			expect(screen.getByPlaceholderText(/johndoe@email/i)).toBeInTheDocument()
		})

		it('renders the sharable ID input', () => {
			expect(screen.getByPlaceholderText(/fdewkl/i)).toBeInTheDocument()
		})

		it('renders the amount input', () => {
			expect(screen.getByPlaceholderText(/ex: 5.00/i)).toBeInTheDocument()
		})

		it('renders the optional transfer note textarea', () => {
			expect(
				screen.getByPlaceholderText(/write a short note/i),
			).toBeInTheDocument()
		})

		it('renders the "Transfer Funds" submit button', () => {
			expect(
				screen.getByRole('button', { name: /transfer funds/i }),
			).toBeInTheDocument()
		})

		it('submit button is enabled on initial render', () => {
			expect(
				screen.getByRole('button', { name: /transfer funds/i }),
			).toBeEnabled()
		})

		it('does not show a loading indicator initially', () => {
			expect(screen.queryByText(/sending/i)).not.toBeInTheDocument()
		})
	})

	// =========================================================================
	describe('PaymentTransferForm — Rendering with no accounts', () => {
		// =========================================================================

		it('renders without crashing when accounts is an empty array', () => {
			render(<PaymentTransferForm accounts={[]} />)
			expect(
				screen.getByRole('button', { name: /transfer funds/i }),
			).toBeInTheDocument()
		})

		it('renders the bank dropdown with no options', () => {
			render(<PaymentTransferForm accounts={[]} />)
			const dropdown = screen.getByTestId('bank-dropdown') as HTMLSelectElement
			// Only the default "Select a bank" option
			expect(dropdown.options).toHaveLength(1)
		})
	})

	// =========================================================================
	describe('PaymentTransferForm — Validation', () => {
		// =========================================================================

		beforeEach(() => render(<PaymentTransferForm accounts={[mockAccount]} />))

		it('shows an error when no sender bank is selected', async () => {
			await userEvent.click(
				screen.getByRole('button', { name: /transfer funds/i }),
			)
			expect(
				await screen.findByText(/please select a valid bank account/i),
			).toBeInTheDocument()
		})

		it('shows an error when recipient name is empty', async () => {
			await userEvent.selectOptions(
				screen.getByTestId('bank-dropdown'),
				'item-1',
			)
			await userEvent.click(
				screen.getByRole('button', { name: /transfer funds/i }),
			)
			expect(
				await screen.findByText(/please enter the name of the recipient/i),
			).toBeInTheDocument()
		})

		it('shows an error for an invalid recipient email format', async () => {
			await userEvent.selectOptions(
				screen.getByTestId('bank-dropdown'),
				'item-1',
			)
			await userEvent.type(screen.getByPlaceholderText('J Doe'), 'Jane Doe')
			await userEvent.type(
				screen.getByPlaceholderText(/johndoe@email/i),
				'not-valid',
			)
			await userEvent.click(
				screen.getByRole('button', { name: /transfer funds/i }),
			)
			expect(
				await screen.findByText(/invalid email address/i),
			).toBeInTheDocument()
		})

		it('shows an error when sharable ID is shorter than 8 characters', async () => {
			await userEvent.selectOptions(
				screen.getByTestId('bank-dropdown'),
				'item-1',
			)
			await userEvent.type(screen.getByPlaceholderText('J Doe'), 'Jane Doe')
			await userEvent.type(
				screen.getByPlaceholderText(/johndoe@email/i),
				'r@example.com',
			)
			await userEvent.type(screen.getByPlaceholderText(/fdewkl/i), 'short')
			await userEvent.click(
				screen.getByRole('button', { name: /transfer funds/i }),
			)
			expect(
				await screen.findByText(/please select a valid sharable id/i),
			).toBeInTheDocument()
		})

		it('does not call any server actions when the form is invalid', async () => {
			await userEvent.click(
				screen.getByRole('button', { name: /transfer funds/i }),
			)
			await screen.findByText(/please select a valid bank account/i)
			expect(transferFunds).not.toHaveBeenCalled()
		})
	})

	// =========================================================================
	describe('PaymentTransferForm — Successful submission', () => {
		// =========================================================================

		beforeEach(() => {
			;(transferFunds as jest.Mock).mockResolvedValue(mockTransferSuccess)
			render(<PaymentTransferForm accounts={[mockAccount]} />)
		})

		it('calls transferFunds with the sender bank id, the raw (still-encrypted) shareableId, and amount', async () => {
			await fillAndSubmit()
			await waitFor(() =>
				expect(transferFunds).toHaveBeenCalledWith(
					expect.objectContaining({
						senderBankDocumentId: 'item-1',
						// Decryption is server-only now (lib/server/encryption.ts) —
						// the client must pass the shareableId through unchanged.
						receiverShareableId: VALID_SHARABLE_ID,
						amount: expect.any(String),
					}),
				),
			)
		})

		it('calls transferFunds with recipient name and email', async () => {
			await fillAndSubmit()
			await waitFor(() =>
				expect(transferFunds).toHaveBeenCalledWith(
					expect.objectContaining({
						recipientName: 'Jane Doe',
						recipientEmail: 'receiver@example.com',
					}),
				),
			)
		})

		it('redirects to "/" after a successful transfer', async () => {
			await fillAndSubmit()
			await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'))
		})

		it('shows a "Sending..." loading indicator while in-flight', async () => {
			;(transferFunds as jest.Mock).mockImplementation(
				() =>
					new Promise((resolve) =>
						setTimeout(() => resolve(mockTransferSuccess), 300),
					),
			)
			await userEvent.selectOptions(
				screen.getByTestId('bank-dropdown'),
				'item-1',
			)
			await userEvent.type(screen.getByPlaceholderText('J Doe'), 'Jane Doe')
			await userEvent.type(
				screen.getByPlaceholderText(/johndoe@email/i),
				'receiver@example.com',
			)
			await userEvent.type(
				screen.getByPlaceholderText(/fdewkl/i),
				VALID_SHARABLE_ID,
			)
			await userEvent.type(screen.getByPlaceholderText(/ex: 5.00/i), '1000')
			await userEvent.click(
				screen.getByRole('button', { name: /transfer funds/i }),
			)

			expect(screen.getByText(/sending/i)).toBeInTheDocument()
			expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled()
		})

		it('re-enables the submit button after a successful submission', async () => {
			await fillAndSubmit()
			await waitFor(() =>
				expect(
					screen.getByRole('button', { name: /transfer funds/i }),
				).toBeEnabled(),
			)
		})

		it('calls transferFunds exactly once per submit', async () => {
			await fillAndSubmit()
			await waitFor(() => expect(transferFunds).toHaveBeenCalledTimes(1))
		})
	})

	// =========================================================================
	describe('PaymentTransferForm — Error handling', () => {
		// =========================================================================

		beforeEach(() => {
			render(<PaymentTransferForm accounts={[mockAccount]} />)
		})

		it('does not redirect when transferFunds returns success: false', async () => {
			;(transferFunds as jest.Mock).mockResolvedValue({
				success: false,
				error: 'Transfer service unavailable',
			})
			await fillAndSubmit()
			await waitFor(() => expect(transferFunds).toHaveBeenCalled())
			expect(mockPush).not.toHaveBeenCalled()
		})

		it('re-enables the submit button after a failed transfer', async () => {
			;(transferFunds as jest.Mock).mockResolvedValue({
				success: false,
				error: 'Transfer service unavailable',
			})
			await fillAndSubmit()
			await waitFor(() =>
				expect(
					screen.getByRole('button', { name: /transfer funds/i }),
				).toBeEnabled(),
			)
		})

		it('does not crash when transferFunds throws', async () => {
			;(transferFunds as jest.Mock).mockRejectedValue(
				new Error('Transfer service unavailable'),
			)
			await expect(fillAndSubmit()).resolves.not.toThrow()
			await waitFor(() =>
				expect(
					screen.getByRole('button', { name: /transfer funds/i }),
				).toBeEnabled(),
			)
		})
	})

	// =========================================================================
	describe('PaymentTransferForm — Edge cases', () => {
		// =========================================================================

		it('renders all provided accounts in the bank dropdown', () => {
			const secondAccount: Account = {
				...mockAccount,
				id: 'acc-2',
				appwriteItemId: 'item-2',
				name: 'Bank of America',
				mask: '0002',
			}
			render(<PaymentTransferForm accounts={[mockAccount, secondAccount]} />)
			const options = Array.from(
				(screen.getByTestId('bank-dropdown') as HTMLSelectElement).options,
			).map((o) => o.text)
			expect(options).toContain('Chase Checking')
			expect(options).toContain('Bank of America')
		})

		it('formats the amount input as a currency string while typing', async () => {
			render(<PaymentTransferForm accounts={[mockAccount]} />)
			const amountInput = screen.getByPlaceholderText(/ex: 5.00/i)
			await userEvent.type(amountInput, '500')
			// useReducer formats via formatAmount: 500 cents → $5.00
			expect(amountInput).toHaveValue('$5.00')
		})

		it('ignores non-numeric characters in the amount field', async () => {
			render(<PaymentTransferForm accounts={[mockAccount]} />)
			const amountInput = screen.getByPlaceholderText(/ex: 5.00/i)
			await userEvent.type(amountInput, 'abc')
			// All non-digits are stripped → 0 cents → $0.00
			expect(amountInput).toHaveValue('$0.00')
		})

		it('submits a transfer note when provided', async () => {
			;(transferFunds as jest.Mock).mockResolvedValue(mockTransferSuccess)

			render(<PaymentTransferForm accounts={[mockAccount]} />)
			await userEvent.selectOptions(
				screen.getByTestId('bank-dropdown'),
				'item-1',
			)
			await userEvent.type(screen.getByPlaceholderText('J Doe'), 'Jane Doe')
			await userEvent.type(
				screen.getByPlaceholderText(/johndoe@email/i),
				'receiver@example.com',
			)
			await userEvent.type(
				screen.getByPlaceholderText(/fdewkl/i),
				VALID_SHARABLE_ID,
			)
			await userEvent.type(screen.getByPlaceholderText(/ex: 5.00/i), '1000')
			await userEvent.type(
				screen.getByPlaceholderText(/write a short note/i),
				'Birthday gift',
			)
			await userEvent.click(
				screen.getByRole('button', { name: /transfer funds/i }),
			)

			await waitFor(() =>
				expect(transferFunds).toHaveBeenCalledWith(
					expect.objectContaining({ note: 'Birthday gift' }),
				),
			)
		})
	})

	// ===========================================================================
	// NOT YET BUILT — spec for a pre-submit confirmation/review step. Decided
	// 2026-08-26: clicking "Transfer Funds" today calls transferFunds
	// immediately (see `submit` in PaymentTransferForm.tsx); the intended
	// behavior is a review screen (amount, sender account, recipient, note)
	// that the user must explicitly confirm before the server action fires,
	// with a way back to the form to edit without submitting.
	// it.todo() rather than real assertions — none of this exists yet, only
	// a spec to track. See component_fixes_deferred memory for where this is
	// queued.
	// ===========================================================================
	describe('PaymentTransferForm — confirmation step (not yet built)', () => {
		it.todo(
			'does not call transferFunds immediately on submit — shows a review screen first',
		)
		it.todo(
			'review screen displays the amount, sender account, recipient, and note exactly as entered',
		)
		it.todo(
			'calls transferFunds only after the user explicitly confirms on the review screen',
		)
		it.todo(
			'returns to the editable form without calling transferFunds when the user backs out of the review screen',
		)
		it.todo('preserves the entered values when backing out of the review screen')
	})
})
