// Sample data shown in place of a real Plaid connection when a signed-up
// user chooses "I'll do this later" instead of linking a bank at signup.
// Swapped out automatically the moment they connect a real bank.

export const DEMO_ACCOUNTS: Account[] = [
	{
		id: 'demo-account-checking',
		availableBalance: 4231.89,
		currentBalance: 4231.89,
		officialName: 'Fortify Everyday Checking',
		mask: '4821',
		institutionId: 'demo_institution',
		name: 'Everyday Checking',
		type: 'depository',
		subtype: 'checking',
		appwriteItemId: 'demo-bank-checking',
		shareableId: 'ZGVtby1hY2NvdW50LWNoZWNraW5n',
	},
	{
		id: 'demo-account-savings',
		availableBalance: 18650.42,
		currentBalance: 18650.42,
		officialName: 'Fortify High-Yield Savings',
		mask: '7790',
		institutionId: 'demo_institution',
		name: 'High-Yield Savings',
		type: 'depository',
		subtype: 'savings',
		appwriteItemId: 'demo-bank-savings',
		shareableId: 'ZGVtby1hY2NvdW50LXNhdmluZ3M=',
	},
]

const pad = (n: number) => String(n).padStart(2, '0')

type RecurringItem = {
	day: number
	name: string
	category: string
	paymentChannel: string
	image: string
	type: 'debit' | 'credit'
	amount: number
}

const CHECKING_ITEMS: RecurringItem[] = [
	{
		day: 1,
		name: 'Payroll Direct Deposit',
		category: 'Payment',
		paymentChannel: 'other',
		image: '/icons/money-send.svg',
		type: 'credit',
		amount: 2400,
	},
	{
		day: 3,
		name: 'Rent Payment',
		category: 'Transfer',
		paymentChannel: 'online',
		image: '/icons/bank-transfer.svg',
		type: 'debit',
		amount: 1850,
	},
	{
		day: 5,
		name: 'Monthly Maintenance Fee',
		category: 'Bank Fees',
		paymentChannel: 'other',
		image: '/icons/bank-interest.svg',
		type: 'debit',
		amount: 5,
	},
	{
		day: 8,
		name: 'Whole Foods Market',
		category: 'Food and Drink',
		paymentChannel: 'in store',
		image: '/icons/a-coffee.svg',
		type: 'debit',
		amount: 64.32,
	},
	{
		day: 11,
		name: 'Netflix',
		category: 'Payment',
		paymentChannel: 'online',
		image: '/icons/monitor.svg',
		type: 'debit',
		amount: 15.49,
	},
	{
		day: 15,
		name: 'Uber',
		category: 'Travel',
		paymentChannel: 'online',
		image: '/icons/bank-exchange.svg',
		type: 'debit',
		amount: 18.4,
	},
	{
		day: 19,
		name: 'Shell Gas Station',
		category: 'Travel',
		paymentChannel: 'in store',
		image: '/icons/dollar.svg',
		type: 'debit',
		amount: 41.2,
	},
	{
		day: 22,
		name: 'Amazon',
		category: 'Shops',
		paymentChannel: 'online',
		image: '/icons/shopping-bag.svg',
		type: 'debit',
		amount: 58.21,
	},
	{
		day: 26,
		name: 'Blue Bottle Coffee',
		category: 'Food and Drink',
		paymentChannel: 'in store',
		image: '/icons/a-coffee.svg',
		type: 'debit',
		amount: 6.75,
	},
]

const SAVINGS_ITEMS: RecurringItem[] = [
	{
		day: 1,
		name: 'Interest Payment',
		category: 'Payment',
		paymentChannel: 'other',
		image: '/icons/money-send.svg',
		type: 'credit',
		amount: 14.85,
	},
	{
		day: 2,
		name: 'Monthly Service Fee',
		category: 'Bank Fees',
		paymentChannel: 'other',
		image: '/icons/bank-interest.svg',
		type: 'debit',
		amount: 2,
	},
	{
		day: 15,
		name: 'Transfer from Checking',
		category: 'Transfer',
		paymentChannel: 'online',
		image: '/icons/bank-transfer.svg',
		type: 'credit',
		amount: 500,
	},
]

const DEMO_APPWRITE_ITEM_IDS = new Set(
	DEMO_ACCOUNTS.map((account) => account.appwriteItemId),
)

export const isDemoAppwriteItemId = (appwriteItemId?: string) =>
	Boolean(appwriteItemId && DEMO_APPWRITE_ITEM_IDS.has(appwriteItemId))

// Deterministic jitter so amounts vary month to month without using Math.random
// (keeps the demo dataset stable across page reloads).
const jitter = (base: number, seed: number) => {
	const delta = ((seed * 37) % 11) - 5
	return Math.max(1, Math.round((base + delta * (base > 100 ? 4 : 0.4)) * 100) / 100)
}

export const getDemoTransactions = (accountId: string): Transaction[] => {
	const items = accountId === DEMO_ACCOUNTS[1].id ? SAVINGS_ITEMS : CHECKING_ITEMS
	const today = new Date()
	const transactions: Transaction[] = []

	for (let monthsAgo = 13; monthsAgo >= 0; monthsAgo--) {
		const monthDate = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1)
		const year = monthDate.getFullYear()
		const month = monthDate.getMonth() + 1
		const maxDay = monthsAgo === 0 ? today.getDate() : new Date(year, month, 0).getDate()

		items.forEach((item, index) => {
			// Skip the quarterly savings transfer in non-matching months.
			if (item.name === 'Transfer from Checking' && monthsAgo % 3 !== 0) return

			const day = Math.min(item.day, maxDay)
			const date = `${year}-${pad(month)}-${pad(day)}`
			const amount = jitter(item.amount, monthsAgo + index)

			transactions.push({
				id: `demo-tx-${accountId}-${year}${pad(month)}-${index}`,
				$id: `demo-tx-${accountId}-${year}${pad(month)}-${index}`,
				name: item.name,
				paymentChannel: item.paymentChannel,
				type: item.type,
				accountId,
				amount,
				pending: false,
				category: item.category,
				date,
				image: item.image,
				$createdAt: `${date}T12:00:00.000Z`,
				channel: item.paymentChannel,
				senderBankId: '',
				receiverBankId: '',
			})
		})
	}

	return transactions
}
