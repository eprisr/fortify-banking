import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AccountsSummary } from '@/components/accounts/AccountsSummary'

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
	name: 'Signature Credit',
	type: 'credit',
	subtype: 'credit',
	appwriteItemId: 'item-credit',
	shareableId: 'share-3',
}

describe('AccountsSummary', () => {
	it('subtracts a credit statement balance as a liability instead of adding it', () => {
		render(<AccountsSummary accounts={[checking, savings, credit]} />)

		// 3469.52 + 18204.11 - 1170.00 = 20503.63
		expect(screen.getByText('$20,503.63')).toBeInTheDocument()
	})

	it('reports the connected-accounts count', () => {
		render(<AccountsSummary accounts={[checking, savings, credit]} />)

		expect(screen.getByText('All 3 accounts connected')).toBeInTheDocument()
	})

	it('adds depository balances directly when there is no credit account', () => {
		render(<AccountsSummary accounts={[checking, savings]} />)

		expect(screen.getByText('$21,673.63')).toBeInTheDocument()
		expect(screen.getByText('All 2 accounts connected')).toBeInTheDocument()
	})
})
