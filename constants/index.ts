import {
	BiCog,
	BiEnvelope,
	BiMobile,
	BiMoneyWithdraw,
	BiSearchAlt,
	BiSolidCreditCard,
	BiSolidHomeAlt2,
	BiSolidMap,
	BiSolidReceipt,
	BiSolidUserBadge,
	BiSolidWallet,
	BiTransferAlt,
} from 'react-icons/bi'
import { FaPiggyBank, FaReceipt } from 'react-icons/fa6'

export const navLinks = [
	{
		Icon: BiSolidHomeAlt2,
		route: '/',
		label: 'Home',
	},
	{
		Icon: BiSolidMap,
		route: '/my-banks',
		label: 'Accounts and Cards',
	},
	{
		Icon: BiSolidReceipt,
		route: '/transaction-history',
		label: 'Transaction History',
	},
	{
		Icon: BiTransferAlt,
		route: '/payment-transfer',
		label: 'Transfer Funds',
	},
]

export const homeLinks = [
	{
		Icon: BiSolidWallet,
		route: '/my-banks',
		label: 'Account and Card',
		color: '#3629B7',
	},
	{
		Icon: BiTransferAlt,
		route: '/payment-transfer',
		label: 'Transfer',
		color: '#FF4267',
	},
	{
		Icon: BiMoneyWithdraw,
		route: '#',
		label: 'Withdraw',
		color: '#0890FE',
	},
	{
		Icon: BiMobile,
		route: '#',
		label: 'Mobile prepaid',
		color: '#FFAF2A',
	},
	{
		Icon: BiSolidReceipt,
		route: '#',
		label: 'Pay the bill',
		color: '#52D5BA',
	},
	{
		Icon: FaPiggyBank,
		route: '#',
		label: 'Save online',
		color: '#5655B9',
	},
	{
		Icon: BiSolidCreditCard,
		route: '#',
		label: 'Credit card',
		color: '#FB6B18',
	},
	{
		Icon: FaReceipt,
		route: '/transaction-history',
		label: 'Transaction history',
		color: '#3629B7',
	},
	{
		Icon: BiSolidUserBadge,
		route: '#',
		label: 'Beneficiary',
		color: '#FF4267',
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
		route: '/search',
		label: 'Search',
	},
	{
		Icon: BiEnvelope,
		route: '/message',
		label: 'Message',
	},
	{
		Icon: BiCog,
		route: '/settings',
		label: 'Settings',
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
