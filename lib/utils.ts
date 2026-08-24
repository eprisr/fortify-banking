/* eslint-disable no-prototype-builtins */
import { type ClassValue, clsx } from 'clsx'
import qs from 'query-string'
import { twMerge } from 'tailwind-merge'
import { z } from 'zod'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export const handleError = (
	error: any,
	customMessage: string,
): ActionResponse<any> => {
	console.error(`${customMessage}:`, error)

	// Appwrite-specific error extraction
	const message = error?.response?.message || error?.message || customMessage

	return {
		success: false,
		error: message,
	}
}

// FORMAT DATE TIME
export const formatDateTime = (dateString: Date) => {
	const dateTimeOptions: Intl.DateTimeFormatOptions = {
		weekday: 'short', // abbreviated weekday name (e.g., 'Mon')
		month: 'short', // abbreviated month name (e.g., 'Oct')
		day: 'numeric', // numeric day of the month (e.g., '25')
		hour: 'numeric', // numeric hour (e.g., '8')
		minute: 'numeric', // numeric minute (e.g., '30')
		hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
	}

	const dateDayOptions: Intl.DateTimeFormatOptions = {
		weekday: 'short', // abbreviated weekday name (e.g., 'Mon')
		year: 'numeric', // numeric year (e.g., '2023')
		month: '2-digit', // abbreviated month name (e.g., 'Oct')
		day: '2-digit', // numeric day of the month (e.g., '25')
	}

	const dateOptions: Intl.DateTimeFormatOptions = {
		month: 'short', // abbreviated month name (e.g., 'Oct')
		year: 'numeric', // numeric year (e.g., '2023')
		day: 'numeric', // numeric day of the month (e.g., '25')
	}

	const timeOptions: Intl.DateTimeFormatOptions = {
		hour: 'numeric', // numeric hour (e.g., '8')
		minute: 'numeric', // numeric minute (e.g., '30')
		hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
	}

	const formattedDateTime: string = new Date(dateString).toLocaleString(
		'en-US',
		dateTimeOptions,
	)

	const formattedDateDay: string = new Date(dateString).toLocaleString(
		'en-US',
		dateDayOptions,
	)

	const formattedDate: string = new Date(dateString).toLocaleString(
		'en-US',
		dateOptions,
	)

	const formattedTime: string = new Date(dateString).toLocaleString(
		'en-US',
		timeOptions,
	)

	return {
		dateTime: formattedDateTime,
		dateDay: formattedDateDay,
		dateOnly: formattedDate,
		timeOnly: formattedTime,
	}
}

export function getCurrentMonthName(): string {
	return new Date().toLocaleString('default', { month: 'long' })
}

export function getTrailingMonthsYYYYMM(monthsBack = 13) {
	const months: string[] = []
	const today = new Date()

	for (let i = monthsBack; i >= 0; i--) {
		const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		months.push(`${year}-${month}-01`)
	}

	return months
}

export function formatAmount(amount: number): string {
	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
	})

	return formatter.format(amount)
}

export const parseStringify = (value: any) => JSON.parse(JSON.stringify(value))

export const removeSpecialCharacters = (value: string) => {
	return value.replace(/[^\w\s]/gi, '')
}

interface UrlQueryParams {
	params: string
	key: string
	value: string
}

export function formUrlQuery({ params, key, value }: UrlQueryParams) {
	const currentUrl = qs.parse(params)

	currentUrl[key] = value

	return qs.stringifyUrl(
		{
			url: window.location.pathname,
			query: currentUrl,
		},
		{ skipNull: true },
	)
}

export function getAccountTypeColors(type: AccountTypes) {
	switch (type) {
		case 'depository':
			return {
				bg: 'bg-blue-25',
				lightBg: 'bg-blue-100',
				title: 'text-blue-900',
				subText: 'text-blue-700',
			}

		case 'credit':
			return {
				bg: 'bg-success-25',
				lightBg: 'bg-success-100',
				title: 'text-success-900',
				subText: 'text-success-700',
			}

		default:
			return {
				bg: 'bg-green-25',
				lightBg: 'bg-green-100',
				title: 'text-green-900',
				subText: 'text-green-700',
			}
	}
}

export function countTransactionCategories(
	transactions: Transaction[],
): CategoryCount[] {
	const categoryCounts: { [category: string]: number } = {}
	let totalCount = 0

	// Iterate over each transaction
	transactions &&
		transactions.forEach((transaction) => {
			// Extract the category from the transaction
			const category = transaction.category

			// If the category exists in the categoryCounts object, increment its count
			if (categoryCounts.hasOwnProperty(category)) {
				categoryCounts[category]++
			} else {
				// Otherwise, initialize the count to 1
				categoryCounts[category] = 1
			}

			// Increment total count
			totalCount++
		})

	// Convert the categoryCounts object to an array of objects
	const aggregatedCategories: CategoryCount[] = Object.keys(categoryCounts).map(
		(category) => ({
			name: category,
			count: categoryCounts[category],
			totalCount,
		}),
	)

	// Sort the aggregatedCategories array by count in descending order
	aggregatedCategories.sort((a, b) => b.count - a.count)

	return aggregatedCategories
}

export function extractCustomerIdFromUrl(url: string) {
	// Split the URL string by '/'
	const parts = url.split('/')

	// Extract the last part, which represents the customer ID
	const customerId = parts[parts.length - 1]

	return customerId
}

export function encryptId(id: string) {
	return btoa(id)
}

export function decryptId(id: string) {
	return atob(id)
}

export const getTransactionStatus = (date: Date) => {
	const today = new Date()
	const twoDaysAgo = new Date(today)
	twoDaysAgo.setDate(today.getDate() - 2)

	return date > twoDaysAgo ? 'Processing' : 'Success'
}

interface SumByKeyOptions {
	strict?: boolean
}

export function sumTransTotalsByMonth<T extends Record<string, unknown>>(
	arr: T[],
	key: keyof T,
	valueKey: keyof T,
	{ strict = false }: SumByKeyOptions = {},
): Record<string, number> {
	if (!Array.isArray(arr)) {
		throw new TypeError('First argument must be an array')
	}

	return arr.reduce<Record<string, number>>((acc, obj) => {
		const isValid =
			obj && typeof obj === 'object' && key in obj && valueKey in obj
		if (!isValid) {
			if (strict)
				throw new TypeError(
					`Entry missing "${String(key)}" or "${String(valueKey)}": ${JSON.stringify(obj)}`,
				)
			return acc
		}

		const value = Number(obj[valueKey])
		if (Number.isNaN(value)) {
			if (strict)
				throw new TypeError(
					`Non-numeric value for "${String(valueKey)}": ${obj[valueKey]}`,
				)
			return acc
		}

		const groupKey = String(obj[key])
		acc[groupKey] = value > 0 ? (acc[groupKey] || 0) + value : acc[groupKey]
		return acc
	}, Object.create(null))
}

/********************************
 ************ SCHEMA ************
 ********************************/

export const transferFormSchema = () =>
	z.object({
		senderBank: z.string().min(4, 'Please select a valid bank account'),
		recipientName: z.string().min(1, 'Please enter the name of the recipient'),
		recipientEmail: z.email('Invalid email address'),
		sharableId: z.string().min(8, 'Please select a valid sharable Id'),
		amount: z.string().min(4, 'Amount is too short'),
		note: z.string().optional(),
	})

const emailField = z.email('A Valid Email is Required')

// Single source of truth for both the password's Zod validation and the
// live checklist rendered in the UI (see SignUpForm).
export const passwordRequirements: {
	label: string
	test: (password: string) => boolean
}[] = [
	{ label: 'At least 8 characters', test: (password) => password.length >= 8 },
	{
		label: 'Contains an uppercase letter',
		test: (password) => /[A-Z]/.test(password),
	},
	{ label: 'Contains a number', test: (password) => /[0-9]/.test(password) },
	{
		label: 'Contains a special character',
		test: (password) => /[^A-Za-z0-9]/.test(password),
	},
]

const passwordField = passwordRequirements.reduce(
	(schema, { label, test }) => schema.refine(test, { message: label }),
	z.string().max(64, { error: 'Less than 64 characters' }),
)

export const signinSchema = z.object({
	email: emailField,
	password: passwordField,
})

export const forgotPwSchema = z.object({
	email: emailField,
})

export const resetPwSchema = z
	.object({
		password: passwordField,
		confirmPassword: passwordField,
	})
	.superRefine(({ confirmPassword, password }, ctx) => {
		if (confirmPassword !== password) {
			ctx.addIssue({
				code: 'custom',
				message: 'Passwords must match',
				path: ['confirmPassword'],
			})
		}
	})

export const signupSchema = z.object({
	firstName: z.string().min(2, { error: 'First Name is Required' }),
	lastName: z.string().min(2, { error: 'Last Name is Required' }),
	email: emailField,
	password: passwordField,
})

export const waitlistSchema = z.object({
	email: emailField,
})

export const dwollaSchema = z.object({
	address1: z.string().min(5, { error: 'Address is Required' }).max(50),
	city: z.string().min(2, { error: 'City is Required' }).max(50),
	state: z
		.string()
		.min(2, { error: 'State is Required' })
		.max(2, { error: 'A Valid State is Required' }),
	postalCode: z
		.string()
		.min(3, { error: 'A Postal Code is Required' })
		.max(6, { error: 'A Valid Postal Code is Required' }),
	dateOfBirth: z.string().min(3, { error: 'A Birth Date is Required' }),
	ssn: z.string().min(4, { error: 'A SSN is Required' }),
})
