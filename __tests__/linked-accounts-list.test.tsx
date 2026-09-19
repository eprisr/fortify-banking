import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { LinkedAccountsList } from '@/components/accounts/LinkedAccountsList'

const checking: Account = {
	id: 'acc-1',
	availableBalance: 3469.52,
	currentBalance: 3469.52,
	officialName: 'Chase Total Checking',
	institutionId: 'ins_1',
	institutionName: 'Chase',
	mask: '9018',
	name: 'Everyday Checking',
	type: 'depository',
	subtype: 'checking',
	appwriteItemId: 'item-checking',
	shareableId: 'share-1',
	hasFundingSource: true,
}

const savings: Account = {
	...checking,
	id: 'acc-2',
	availableBalance: 18204.11,
	mask: '4432',
	name: 'High-Yield Savings',
	subtype: 'savings',
	appwriteItemId: 'item-savings',
	shareableId: 'share-2',
}

const credit: Account = {
	...checking,
	id: 'acc-3',
	availableBalance: 4830,
	currentBalance: 1170,
	creditLimit: 6000,
	mask: '1006',
	name: 'Signature Credit',
	type: 'credit',
	subtype: 'credit',
	institutionName: 'Amex',
	appwriteItemId: 'item-credit',
	shareableId: 'share-3',
}

const accounts = [checking, savings, credit]

describe('LinkedAccountsList', () => {
	it('expands the first account by default so the rows read as interactive, and collapses the rest', () => {
		render(<LinkedAccountsList accounts={accounts} />)

		expect(
			screen.getByText('Primary account · opened 2019'),
		).toBeInTheDocument()
		expect(screen.getByText('Available balance')).toBeInTheDocument()
		expect(screen.getByText('$3,469.52')).toBeInTheDocument()
		// The other two are still simple collapsed rows.
		expect(screen.getByText('High-Yield Savings')).toBeInTheDocument()
		expect(screen.getByText('Signature Credit')).toBeInTheDocument()
		expect(screen.queryByText('Total balance')).not.toBeInTheDocument()
	})

	it('shows the full card details for the default-expanded account', () => {
		render(<LinkedAccountsList accounts={accounts} />)

		expect(screen.getByText('Chase')).toBeInTheDocument()
		expect(
			screen.getByText('Direct deposit active · Visa debit'),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Statements' }),
		).toBeInTheDocument()
	})

	it('opens the account-options sheet from the kebab button without collapsing the card', async () => {
		render(<LinkedAccountsList accounts={accounts} />)

		await userEvent.click(
			screen.getByRole('button', { name: 'Account options' }),
		)

		expect(screen.getByText('Available balance')).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: /relink account/i }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: /rename account/i }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: /remove account/i }),
		).toBeInTheDocument()
	})

	it('closes the account-options sheet on Cancel', async () => {
		render(<LinkedAccountsList accounts={accounts} />)

		await userEvent.click(
			screen.getByRole('button', { name: 'Account options' }),
		)
		await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

		expect(
			screen.queryByRole('button', { name: /remove account/i }),
		).not.toBeInTheDocument()
		// The card itself is still expanded — only the sheet closed.
		expect(screen.getByText('Available balance')).toBeInTheDocument()
	})

	it('switching the selection collapses the previous card and expands the new one', async () => {
		render(<LinkedAccountsList accounts={accounts} />)

		expect(screen.getByText('Available balance')).toBeInTheDocument()

		await userEvent.click(screen.getByText('High-Yield Savings'))

		expect(screen.getByText('Total balance')).toBeInTheDocument()
		expect(screen.queryByText('Available balance')).not.toBeInTheDocument()
	})

	it('tapping the expanded card collapses it back to a row', async () => {
		render(<LinkedAccountsList accounts={accounts} />)

		expect(screen.getByText('Available balance')).toBeInTheDocument()

		await userEvent.click(screen.getByText('Everyday Checking'))

		expect(screen.queryByText('Available balance')).not.toBeInTheDocument()
	})

	it("shows the credit account's available-of-limit line only when expanded", async () => {
		render(<LinkedAccountsList accounts={accounts} />)

		await userEvent.click(screen.getByText('Signature Credit'))

		expect(
			screen.getByText('$4,830.00 available of $6,000.00 limit'),
		).toBeInTheDocument()
	})

	it('clicking a placeholder action button does not collapse the card', async () => {
		render(<LinkedAccountsList accounts={accounts} />)

		await userEvent.click(screen.getByRole('button', { name: 'Statements' }))

		expect(screen.getByText('Available balance')).toBeInTheDocument()
	})

	it('renders every row collapsed when there are no accounts to expand', () => {
		render(<LinkedAccountsList accounts={[]} />)

		expect(screen.queryByText('Available balance')).not.toBeInTheDocument()
	})
})
