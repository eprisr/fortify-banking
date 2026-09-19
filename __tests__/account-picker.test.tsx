import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { AccountPicker } from '@/components/transfers/AccountPicker'
import { findRecipientByEmail, getRecentRecipients } from '@/lib/actions/user.actions'

jest.mock('@/lib/actions/user.actions', () => ({
	findRecipientByEmail: jest.fn(),
	getRecentRecipients: jest.fn(),
}))

const fromAccount: Account = {
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

const savingsAccount: Account = {
	...fromAccount,
	id: 'acc-2',
	appwriteItemId: 'item-2',
	name: 'High-Yield Savings',
	shareableId: 'share-2',
}

beforeEach(() => {
	jest.clearAllMocks()
	;(getRecentRecipients as jest.Mock).mockResolvedValue({ success: true, data: [] })
})

describe('AccountPicker — mode="from"', () => {
	const onChange = jest.fn()

	it('lists every account and has no "People" section', async () => {
		render(
			<AccountPicker
				mode="from"
				label="Choose account"
				accounts={[fromAccount, savingsAccount]}
				value={null}
				onChange={onChange}
			/>,
		)
		await userEvent.click(screen.getByRole('button', { name: /choose account/i }))

		expect(screen.getByText('Chase Checking')).toBeInTheDocument()
		expect(screen.getByText('High-Yield Savings')).toBeInTheDocument()
		expect(screen.queryByText('People')).not.toBeInTheDocument()
		expect(getRecentRecipients).not.toHaveBeenCalled()
	})

	it('selects an account', async () => {
		render(
			<AccountPicker
				mode="from"
				label="Choose account"
				accounts={[fromAccount, savingsAccount]}
				value={null}
				onChange={onChange}
			/>,
		)
		await userEvent.click(screen.getByRole('button', { name: /choose account/i }))
		await userEvent.click(screen.getByText('Chase Checking'))

		expect(onChange).toHaveBeenCalledWith({ kind: 'account', account: fromAccount })
	})
})

describe('AccountPicker — mode="to"', () => {
	const onChange = jest.fn()

	function setup() {
		render(
			<AccountPicker
				mode="to"
				label="Choose recipient"
				accounts={[fromAccount, savingsAccount]}
				excludeAccountId={fromAccount.appwriteItemId}
				value={null}
				onChange={onChange}
			/>,
		)
	}

	it('shows the sender account but disabled, not hidden', async () => {
		setup()
		await userEvent.click(screen.getByRole('button', { name: /choose recipient/i }))

		expect(screen.getByText('High-Yield Savings')).toBeInTheDocument()
		const senderRow = screen.getByText('Chase Checking').closest('button')
		expect(senderRow).toBeDisabled()
	})

	it('selects one of the user’s own accounts', async () => {
		setup()
		await userEvent.click(screen.getByRole('button', { name: /choose recipient/i }))
		await userEvent.click(screen.getByText('High-Yield Savings'))
		expect(onChange).toHaveBeenCalledWith({
			kind: 'account',
			account: savingsAccount,
		})
	})

	it('does not select the disabled sender account when clicked', async () => {
		setup()
		await userEvent.click(screen.getByRole('button', { name: /choose recipient/i }))
		await userEvent.click(screen.getByText('Chase Checking'))
		expect(onChange).not.toHaveBeenCalled()
	})

	it('loads and displays recent recipients as quick-select avatars', async () => {
		;(getRecentRecipients as jest.Mock).mockResolvedValue({
			success: true,
			data: [
				{ name: 'Emma Ruiz', email: 'emma@example.com', shareableId: 'emma-share' },
				{ name: 'Justin Cole', email: 'justin@example.com', shareableId: 'justin-share' },
			],
		})
		setup()
		await userEvent.click(screen.getByRole('button', { name: /choose recipient/i }))

		expect(await screen.findByText('Emma')).toBeInTheDocument()
		expect(screen.getByText('Justin')).toBeInTheDocument()
	})

	it('selects a recent recipient directly, without opening the search panel', async () => {
		;(getRecentRecipients as jest.Mock).mockResolvedValue({
			success: true,
			data: [{ name: 'Emma Ruiz', email: 'emma@example.com', shareableId: 'emma-share' }],
		})
		setup()
		await userEvent.click(screen.getByRole('button', { name: /choose recipient/i }))
		await userEvent.click(await screen.findByText('Emma'))

		expect(onChange).toHaveBeenCalledWith({
			kind: 'recipient',
			recipient: { name: 'Emma Ruiz', shareableId: 'emma-share' },
			email: 'emma@example.com',
		})
	})

	it('opens the add-recipient panel only after clicking "Add new"', async () => {
		setup()
		await userEvent.click(screen.getByRole('button', { name: /choose recipient/i }))

		expect(screen.queryByPlaceholderText(/their email address/i)).not.toBeInTheDocument()
		await userEvent.click(screen.getByRole('button', { name: /add new/i }))
		expect(screen.getByPlaceholderText(/their email address/i)).toBeInTheDocument()
	})

	it('finds a recipient by email and selects them', async () => {
		;(findRecipientByEmail as jest.Mock).mockResolvedValue({
			success: true,
			data: { name: 'Jordan Lee', shareableId: 'recv-1' },
		})
		setup()
		await userEvent.click(screen.getByRole('button', { name: /choose recipient/i }))
		await userEvent.click(screen.getByRole('button', { name: /add new/i }))
		await userEvent.type(
			screen.getByPlaceholderText(/their email address/i),
			'jordan@example.com',
		)
		await userEvent.click(screen.getByRole('button', { name: /^find$/i }))

		expect(await screen.findByText('Jordan Lee')).toBeInTheDocument()
		await userEvent.click(screen.getByText('Jordan Lee'))

		expect(onChange).toHaveBeenCalledWith({
			kind: 'recipient',
			recipient: { name: 'Jordan Lee', shareableId: 'recv-1' },
			email: 'jordan@example.com',
		})
	})

	it('shows the server error when no recipient is found', async () => {
		;(findRecipientByEmail as jest.Mock).mockResolvedValue({
			success: false,
			error: 'No matching recipient found',
		})
		setup()
		await userEvent.click(screen.getByRole('button', { name: /choose recipient/i }))
		await userEvent.click(screen.getByRole('button', { name: /add new/i }))
		await userEvent.type(
			screen.getByPlaceholderText(/their email address/i),
			'nobody@example.com',
		)
		await userEvent.click(screen.getByRole('button', { name: /^find$/i }))

		expect(await screen.findByText('No matching recipient found')).toBeInTheDocument()
		expect(onChange).not.toHaveBeenCalled()
	})

	it('falls back to a manually entered shareable ID', async () => {
		setup()
		await userEvent.click(screen.getByRole('button', { name: /choose recipient/i }))
		await userEvent.click(screen.getByRole('button', { name: /add new/i }))
		await userEvent.click(
			screen.getByRole('button', { name: /have a shareable id/i }),
		)
		await userEvent.type(
			screen.getByPlaceholderText(/recipient's name/i),
			'Sam Rivera',
		)
		await userEvent.type(
			screen.getByPlaceholderText(/recipient's email/i),
			'sam@example.com',
		)
		await userEvent.type(
			screen.getByPlaceholderText(/recipient's shareable id/i),
			'manual-share-id',
		)
		await userEvent.click(
			screen.getByRole('button', { name: /use this recipient/i }),
		)

		await waitFor(() =>
			expect(onChange).toHaveBeenCalledWith({
				kind: 'recipient',
				recipient: { name: 'Sam Rivera', shareableId: 'manual-share-id' },
				email: 'sam@example.com',
			}),
		)
	})
})
