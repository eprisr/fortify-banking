export const primaryShadeMap: Record<number, string> = {
	0: 'bg-primary-700',
	1: 'bg-primary-600',
	2: 'bg-primary-500',
	3: 'bg-primary-400',
	4: 'bg-primary-300',
}

export const marqueeList: string[] = [
	'Bank-grade security',
	'Real-time sync',
	'Plaid-powered',
	'Spending Insights',
	'Cash flow tracking',
	'256-bit encryption',
	'Read-only access',
	'Zero data selling',
]

export const marqueeItems: string[] = [...marqueeList, ...marqueeList]

interface Feature {
	title: string
	content: string
}

export const features: Feature[] = [
	{
		title: 'Spending insights',
		content:
			'Every transaction categorized automatically. See your top spending categories, month-over-month trends, and where your money actually goes — no spreadsheets.',
	},
	{
		title: 'All accounts, one place',
		content:
			' Connect checking, savings, and credit in seconds via Plaid. Your full financial picture — balances, net worth, available credit — updated in real time. ',
	},
	{
		title: 'Smart alerts',
		content:
			'Get notified the moment unusual activity hits your account. Large transactions, low balance warnings, and spending nudges — before they become problems.',
	},
	{
		title: 'Transfers & bill pay',
		content:
			"Move money between accounts or pay bills directly from Vaultly — powered by Dwolla's ACH network. Fast, secure, a few taps away.",
	},
	{
		title: 'Cash flow tracking',
		content:
			'Month-by-month income vs. expenses. Spot surplus months at a glance, catch deficits early, understand your trend line before it becomes a problem.',
	},
	{
		title: 'Built to protect you',
		content:
			'Read-only access means we can see your data, never touch your money. All data encrypted at rest and in transit. Your credentials never touch our servers.',
	},
]

interface Works {
	title: string
	content: string
}

export const works: Works[] = [
	{
		title: 'Create your account',
		content:
			' Sign up with your name and email in under a minute. No credit card, no commitments.',
	},
	{
		title: 'Connect your bank',
		content:
			' Link your bank securely via Plaid. Read-only access — we can see your data, never touch your money.',
	},
	{
		title: 'See your full picture',
		content:
			' Your dashboard comes to life instantly — balances, spending trends, and transactions in one clean view.',
	},
]
