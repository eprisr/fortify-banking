import {
	Bell,
	CircleCheck,
	CircleQuestionMark,
	CreditCard,
	Landmark,
	Eye,
	Lock,
	MessageSquare,
	Settings,
	UserRound,
	Shield,
} from 'lucide-react'
import {
	BiCreditCard,
	BiDotsHorizontalRounded,
	BiEnvelope,
	BiMoneyWithdraw,
	BiSearchAlt,
	BiSolidHomeAlt2,
	BiSolidReceipt,
	BiTransferAlt,
} from 'react-icons/bi'

export const navLinks = [
	{
		Icon: CreditCard,
		route: '/',
		category: 'account',
		label: 'Linked Accounts',
		subText: '',
	},
	{
		Icon: Shield,
		route: '/settings',
		category: 'account',
		label: 'Security & Privacy',
		subText: 'Face ID ⋅ Pin ⋅ Data',
	},
	{
		Icon: UserRound,
		route: '/',
		category: 'account',
		label: 'My Information',
		subText: 'Name ⋅ Email ⋅ Phone',
	},
	// {
	// 	Icon: Bell,
	// 	route: '/',
	// 	category: 'preferences',
	// 	label: 'Notifcations',
	// 	subText: '',
	// },
	// {
	// 	Icon: Moon,
	// 	route: '/',
	// 	category: 'preferences',
	// 	label: 'Dark Mode',
	// 	subText: '',
	// },
	{
		Icon: CircleQuestionMark,
		route: '/',
		category: 'support',
		label: 'Help Center',
		subText: '',
	},
	{
		Icon: MessageSquare,
		route: '/',
		category: 'support',
		label: 'Send Feedback',
		subText: '',
	},
	{
		Icon: Landmark,
		route: '/',
		category: 'Other',
		label: 'ATMs',
		subText: '',
	},
]

export const quickLinks = [
	{
		Icon: BiTransferAlt,
		route: '#',
		label: 'Transfer',
		toastText: "Transfers aren't available yet.",
		demoToast: 'Transfers are not available in demo mode.',
	},
	{
		Icon: BiSolidReceipt,
		route: '#',
		label: 'Pay bill',
		toastText: "Bill pay isn't available yet.",
		demoToast: 'Bill pay is not available in demo mode.',
	},
	{
		Icon: BiMoneyWithdraw,
		route: '#',
		label: 'Withdraw',
		toastText: "Withdraws aren't available yet.",
		demoToast: 'Withdraws are not available in demo mode.',
	},
	{
		Icon: BiDotsHorizontalRounded,
		route: '#',
		label: 'More',
	},
]

export const mobileLinks = [
	{
		Icon: BiSolidHomeAlt2,
		route: '/',
		label: 'Home',
	},
	{
		Icon: BiSearchAlt,
		route: '#',
		label: 'Search',
	},
	{
		Icon: BiEnvelope,
		route: '#',
		label: 'Inbox',
	},
	{
		Icon: BiCreditCard,
		route: '#',
		label: 'Accounts',
	},
]

export const settings: SettingItem[] = [
	{
		Icon: CircleCheck,
		route: '/',
		category: 'sign-in',
		label: 'Face ID',
		subText: 'Use Face ID to sign in instead of your password',
		kind: 'toggle',
		key: 'faceId',
		// No `deps` yet — Face ID isn't wired to real state.
	},
	{
		Icon: Lock,
		route: '/',
		category: 'sign-in',
		label: 'App pin',
		subText: 'Not set',
		kind: 'link',
	},
	{
		Icon: Shield,
		route: '/recovery-codes',
		category: 'account protection',
		label: 'Two-factor authentication',
		subText: 'Required for transfers and other sensitive actions',
		kind: 'status',
		key: 'twoFactor',
		deps: 'mfa',
	},
	{
		Icon: Eye,
		route: '/',
		category: 'privacy',
		label: 'Data & Permissions',
		subText: 'Manage what Fortify can access',
		kind: 'link',
	},
]

// good_user / good_password - Bank of America
export const TEST_USER_ID = '6627ed3d00267aa6fa3e'

// custom_user -> Chase Bank
// export const TEST_ACCESS_TOKEN =
//   "access-sandbox-da44dac8-7d31-4f66-ab36-2238d63a3017";

// custom_user -> Chase Bank
export const TEST_ACCESS_TOKEN =
	'access-sandbox-229476cf-25bc-46d2-9ed5-fba9df7a5d63'

export const ITEMS = [
	{
		id: '6624c02e00367128945e', // appwrite item Id
		accessToken: 'access-sandbox-83fd9200-0165-4ef8-afde-65744b9d1548',
		itemId: 'VPMQJKG5vASvpX8B6JK3HmXkZlAyplhW3r9xm',
		userId: '6627ed3d00267aa6fa3e',
		accountId: 'X7LMJkE5vnskJBxwPeXaUWDBxAyZXwi9DNEWJ',
	},
	{
		id: '6627f07b00348f242ea9', // appwrite item Id
		accessToken: 'access-sandbox-74d49e15-fc3b-4d10-a5e7-be4ddae05b30',
		itemId: 'Wv7P6vNXRXiMkoKWPzeZS9Zm5JGWdXulLRNBq',
		userId: '6627ed3d00267aa6fa3e',
		accountId: 'x1GQb1lDrDHWX4BwkqQbI4qpQP1lL6tJ3VVo9',
	},
]

export const topCategoryStyles = {
	'Food and Drink': {
		bg: 'bg-blue-25',
		circleBg: 'bg-blue-100',
		text: {
			main: 'text-blue-900',
			count: 'text-blue-700',
		},
		progress: {
			bg: 'bg-blue-100',
			indicator: 'bg-blue-700',
		},
		icon: '/icons/monitor.svg',
	},
	Travel: {
		bg: 'bg-success-25',
		circleBg: 'bg-success-100',
		text: {
			main: 'text-success-900',
			count: 'text-success-700',
		},
		progress: {
			bg: 'bg-success-100',
			indicator: 'bg-success-700',
		},
		icon: '/icons/coins.svg',
	},
	default: {
		bg: 'bg-pink-25',
		circleBg: 'bg-pink-100',
		text: {
			main: 'text-pink-900',
			count: 'text-pink-700',
		},
		progress: {
			bg: 'bg-pink-100',
			indicator: 'bg-pink-700',
		},
		icon: '/icons/shopping-bag.svg',
	},
}

export const transactionCategoryStyles = {
	'Food and Drink': {
		borderColor: 'border-pink-600',
		backgroundColor: 'bg-pink-500',
		textColor: 'text-pink-700',
		chipBackgroundColor: 'bg-inherit',
	},
	Payment: {
		borderColor: 'border-success-600',
		backgroundColor: 'bg-green-600',
		textColor: 'text-success-700',
		chipBackgroundColor: 'bg-inherit',
	},
	'Bank Fees': {
		borderColor: 'border-success-600',
		backgroundColor: 'bg-green-600',
		textColor: 'text-success-700',
		chipBackgroundColor: 'bg-inherit',
	},
	Transfer: {
		borderColor: 'border-red-700',
		backgroundColor: 'bg-red-700',
		textColor: 'text-red-700',
		chipBackgroundColor: 'bg-inherit',
	},
	Processing: {
		borderColor: 'border-[#F2F4F7]',
		backgroundColor: 'bg-gray-500',
		textColor: 'text-[#344054]',
		chipBackgroundColor: 'bg-[#F2F4F7]',
	},
	Success: {
		borderColor: 'border-[#12B76A]',
		backgroundColor: 'bg-[#12B76A]',
		textColor: 'text-[#027A48]',
		chipBackgroundColor: 'bg-[#ECFDF3]',
	},
	default: {
		borderColor: '',
		backgroundColor: 'bg-blue-500',
		textColor: 'text-blue-700',
		chipBackgroundColor: 'bg-inherit',
	},
}
