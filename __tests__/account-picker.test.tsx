import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { AccountPicker } from '@/components/transfers/AccountPicker'
import { findRecipientByEmail } from '@/lib/actions/user.actions'

jest.mock('@/lib/actions/user.actions', () => ({
	findRecipientByEmail: jest.fn(),
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
}

const savingsAccount: Account = {
	...fromAccount,
	id: 'acc-2',
	appwriteItemId: 'item-2',
	name: 'High-Yield Savings',
	shareableId: 'share-2',
}

describe('AccountPicker — mode="from"', () => {
	const onChange = jest.fn()

	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('lists every account and has no "send to a person" section', async () => {
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
		expect(screen.queryByText(/send to a person/i)).not.toBeInTheDocument()
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

	beforeEach(() => {
		jest.clearAllMocks()
	})

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

	it('excludes the sender account from the list of own accounts', async () => {
		setup()
		await userEvent.click(screen.getByRole('button', { name: /choose recipient/i }))
		expect(screen.getByText('High-Yield Savings')).toBeInTheDocument()
		expect(screen.queryByText('Chase Checking')).not.toBeInTheDocument()
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

	it('finds a recipient by email and selects them', async () => {
		;(findRecipientByEmail as jest.Mock).mockResolvedValue({
			success: true,
			data: { name: 'Jordan Lee', shareableId: 'recv-1' },
		})
		setup()
		await userEvent.click(screen.getByRole('button', { name: /choose recipient/i }))
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
