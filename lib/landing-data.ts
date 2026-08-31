import { FeatureStatus } from '@/lib/feature-status'

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

interface Card {
	title: string
	content: string
	image?: string
	imgAlt?: string
	status?: FeatureStatus
}

export const features: Card[] = [
	{
		title: 'Spending insights',
		content:
			'Every transaction categorized automatically. See your top spending categories, month-over-month trends, and where your money actually goes — no spreadsheets.',
		image: '/landing/fortify-feature-clarity.png',
		imgAlt: 'Snippet of "where your money went" and "monthly spending"',
		status: 'in-progress',
	},
	{
		title: 'All accounts, one place',
		content:
			' Connect checking, savings, and credit in seconds via Plaid. Your full financial picture — balances, net worth, available credit — updated in real time. ',
		image: '/landing/fortify-feature-accounts.png',
		imgAlt: 'Snippet of card imagery',
		status: 'live',
	},
	{
		title: 'Smart alerts',
		content:
			'Get notified the moment unusual activity hits your account. Large transactions, low balance warnings, and spending nudges — before they become problems.',
		image: '/landing/fortify-feature-alerts.png',
		imgAlt: 'Snippet of alert items',
		status: 'planned',
	},
	{
		title: 'Transfers & bill pay',
		content:
			"Move money between accounts or pay bills directly from Fortify — powered by Dwolla's ACH network. Fast, secure, a few taps away.",
		image: '/landing/fortify-feature-transfer.png',
		imgAlt: 'Snippet of transfer being completed to recipient',
		status: 'in-progress',
	},
	{
		title: 'Cash flow tracking',
		content:
			'Month-by-month income vs. expenses. Spot surplus months at a glance, catch deficits early, understand your trend line before it becomes a problem.',
		image: '/landing/fortify-feature-cashflow.png',
		imgAlt: 'Snippet of a cash flow line chart',
		status: 'in-progress',
	},
	{
		title: 'Built to protect you',
		content:
			"Every transfer runs through Dwolla's regulated ACH network, and your bank login is handled by Plaid, never stored on our servers. All data encrypted at rest and in transit.",
		image: '/landing/fortify-feature-security.png',
		imgAlt: 'Snippet of security features',
		status: 'live',
	},
]

export const works: Card[] = [
	{
		title: 'Create your account',
		content:
			'Sign up with your name and email in under a minute. No credit card, no commitments.',
	},
	{
		title: 'Connect your bank',
		content:
			'Link your bank securely via Plaid. We can see your data; moving money always requires your explicit action.',
	},
	{
		title: 'See your full picture',
		content:
			'Your dashboard comes to life instantly — balances, spending trends, and transactions in one clean view.',
	},
]

export const security: Card[] = [
	{
		title: '256-bit SSL encryption',
		content: 'All data is encrypted in transit and at rest.',
	},
	{
		title: 'Read-only bank access',
		content:
			"Secure by design. Money only moves with your explicit action, routed through Dwolla's regulated ACH network.",
	},
	{
		title: 'Zero data selling',
		content: 'Your financial data is never sold to third parties.',
	},
	{
		title: 'Plaid-powered',
		content:
			'Trusted bank connection infrastructure used by thousands of fintech apps.',
	},
	{
		title: 'Secure infrastructure',
		content:
			'Built on infrastructure that meets enterprise security standards.',
	},
	{
		title: 'Credentials never stored',
		content:
			'Your bank login is processed by Plaid, never touches our servers.',
	},
]
