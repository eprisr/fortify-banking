'use server'

import {
	ACHClass,
	CountryCode,
	TransferAuthorizationCreateRequest,
	TransferCreateRequest,
	TransferNetwork,
	TransferType,
} from 'plaid'

import { plaidClient } from '../plaid'
import { parseStringify } from '../utils'

import { getTransactionsByBankId } from './transaction.actions'
import {
	getBanks,
	getBank,
	createLinkToken,
	getLoggedInUser,
} from './user.actions'
import { DEMO_ACCOUNTS, getDemoTransactions } from '../demo-data'

// Get multiple bank accounts
export const getAccounts = async ({ userId }: getAccountsProps) => {
	if (!userId) {
		const totalCurrentBalance = DEMO_ACCOUNTS.reduce(
			(total, account) => total + account.currentBalance,
			0,
		)
		return parseStringify({
			data: DEMO_ACCOUNTS,
			totalBanks: DEMO_ACCOUNTS.length,
			totalCurrentBalance,
			needsReconnect: [],
		})
	}

	try {
		// get banks from db
		const banks = await getBanks({ userId })

		// No real bank linked yet — show sample data until they connect one.
		if (!banks?.data?.length) {
			const totalCurrentBalance = DEMO_ACCOUNTS.reduce(
				(total, account) => total + account.currentBalance,
				0,
			)
			return parseStringify({
				data: DEMO_ACCOUNTS,
				totalBanks: DEMO_ACCOUNTS.length,
				totalCurrentBalance,
				needsReconnect: [],
			})
		}

		const accountsPromises = banks?.data.map(async (bank: Bank) => {
			try {
				// 1. Check if token exists before calling Plaid
				if (!bank.accessToken) {
					console.warn(`Bank ${bank.$id} has no access token. Skipping.`)
					return null
				}

				// get each account info from plaid
				const accountsResponse = await plaidClient.accountsGet({
					access_token: bank.accessToken,
				})

				const accountData = accountsResponse.data.accounts.find(
					(account) => account.account_id === bank.accountId,
				)

				if (!accountData) {
					console.warn(
						`Bank ${bank.$id}'s linked account (${bank.accountId}) was not found in this item's current accounts. Skipping.`,
					)
					return null
				}

				// get institution info from plaid
				const institution = await getInstitution({
					institutionId: accountsResponse.data.item.institution_id!,
				})

				const account = {
					id: accountData.account_id,
					availableBalance: accountData.balances.available!,
					currentBalance: accountData.balances.current!,
					creditLimit: accountData.balances.limit,
					institutionId: institution.institution_id,
					institutionName: institution.institution_name,
					name: accountData.name,
					officialName: accountData.official_name,
					mask: accountData.mask!,
					type: accountData.type as string,
					subtype: accountData.subtype! as string,
					appwriteItemId: bank.$id,
					shareableId: bank.shareableId,
				}

				return account
			} catch (error: any) {
				// 2. Catch individual bank errors so they don't crash the whole Promise.all
				console.error(
					`Failed to fetch account for bank ${bank.$id}:`,
					JSON.stringify(error.response?.data, null, 2),
				)
				if (error.response?.data?.error_code === 'ITEM_LOGIN_REQUIRED') {
					return { updateMode: true as const, appwriteItemId: bank.$id }
				}
				return null
			}
		})

		// 3. Wait for all, then split into real accounts vs. banks that need
		// reconnecting, so neither pollutes the other's totals or downstream
		// array indexing.
		const results = await Promise.all(accountsPromises || [])
		const accounts: any[] = []
		const needsReconnect: string[] = []
		for (const result of results) {
			if (!result) continue
			if (typeof result === 'object' && 'updateMode' in result) {
				needsReconnect.push(result.appwriteItemId)
			} else {
				accounts.push(result)
			}
		}

		const totalBanks = accounts.length
		const totalCurrentBalance = accounts.reduce((total, account) => {
			return total + account.currentBalance
		}, 0)

		return parseStringify({
			data: accounts,
			totalBanks,
			totalCurrentBalance,
			needsReconnect,
		})
	} catch (error: any) {
		console.error('An error occurred while getting the accounts:', error)
		if (error.response?.data?.error_code === 'ITEM_LOGIN_REQUIRED') {
			return 'UPDATE_MODE'
		}
	}
}

// Get one bank account
export const getAccount = async ({ appwriteItemId }: getAccountProps) => {
	const demoAccount = DEMO_ACCOUNTS.find(
		(account) => account.appwriteItemId === appwriteItemId,
	)
	if (demoAccount) {
		return parseStringify({
			data: demoAccount,
			transactions: getDemoTransactions(demoAccount.id),
		})
	}

	try {
		// get bank from db
		const bank = await getBank({ documentId: appwriteItemId })

		// get account info from plaid
		const accountsResponse = await plaidClient.accountsGet({
			access_token: bank.accessToken,
		})
		const accountData = accountsResponse.data.accounts.find(
			(account) => account.account_id === bank.accountId,
		)

		if (!accountData) {
			throw new Error(
				`Linked account ${bank.accountId} was not found in this item's current accounts`,
			)
		}

		// get transfer transactions from appwrite
		const transferTransactionsData = await getTransactionsByBankId({
			bankId: bank.$id,
		})

		const transferTransactions = transferTransactionsData.documents.map(
			(transferData: Transaction) => ({
				id: transferData.$id,
				name: transferData.name!,
				amount: transferData.amount!,
				date: transferData.$createdAt,
				paymentChannel: transferData.channel,
				category: transferData.category,
				type: transferData.senderBankId === bank.$id ? 'debit' : 'credit',
			}),
		)

		// get institution info from plaid
		const institution = await getInstitution({
			institutionId: accountsResponse.data.item.institution_id!,
		})

		const transactions = await getTransactions({
			accessToken: bank?.accessToken,
		})

		const account = {
			id: accountData.account_id,
			availableBalance: accountData.balances.available!,
			currentBalance: accountData.balances.current!,
			institutionId: institution.institution_id,
			name: accountData.name,
			officialName: accountData.official_name,
			mask: accountData.mask!,
			type: accountData.type as string,
			subtype: accountData.subtype! as string,
			appwriteItemId: bank.$id,
		}

		// sort transactions by date such that the most recent transaction is first
		const allTransactions = [...transactions, ...transferTransactions].sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
		)

		return parseStringify({
			data: account,
			transactions: allTransactions,
		})
	} catch (error) {
		console.error('An error occurred while getting the account:', error)
	}
}

// Get bank info
export const getInstitution = async ({
	institutionId,
}: getInstitutionProps) => {
	try {
		const institutionResponse = await plaidClient.institutionsGetById({
			institution_id: institutionId,
			country_codes: ['US'] as CountryCode[],
		})

		const intitution = institutionResponse.data.institution

		return parseStringify(intitution)
	} catch (error) {
		console.error('An error occurred while getting the institution:', error)
		throw error
	}
}

// Get transactions
export const getTransactions = async ({
	accessToken,
}: getTransactionsProps) => {
	let hasMore = true
	let cursor: string | undefined
	const transactions: any[] = []

	try {
		// Iterate through each page of new transaction updates for item
		while (hasMore) {
			const response = await plaidClient.transactionsSync({
				access_token: accessToken,
				cursor,
			})

			const data = response.data

			transactions.push(
				...data.added.map((transaction) => ({
					id: transaction.transaction_id,
					name: transaction.name,
					paymentChannel: transaction.payment_channel,
					type: transaction.amount > 0 ? 'debit' : 'credit',
					accountId: transaction.account_id,
					amount: transaction.amount,
					pending: transaction.pending,
					category: transaction.category ? transaction.category[0] : '',
					date: transaction.date,
					image: transaction.logo_url,
				})),
			)

			hasMore = data.has_more
			cursor = data.next_cursor
		}

		return parseStringify(transactions)
	} catch (error) {
		console.error('An error occurred while getting the transactions:', error)
		return parseStringify(transactions)
	}
}

// Create Transfer
export const createTransfer = async () => {
	const transferAuthRequest: TransferAuthorizationCreateRequest = {
		access_token: 'access-sandbox-cddd20c1-5ba8-4193-89f9-3a0b91034c25',
		account_id: 'Zl8GWV1jqdTgjoKnxQn1HBxxVBanm5FxZpnQk',
		funding_account_id: '442d857f-fe69-4de2-a550-0c19dc4af467',
		type: 'credit' as TransferType,
		network: 'ach' as TransferNetwork,
		amount: '10.00',
		ach_class: 'ppd' as ACHClass,
		user: {
			legal_name: 'Anne Charleston',
		},
	}
	try {
		const transferAuthResponse =
			await plaidClient.transferAuthorizationCreate(transferAuthRequest)
		const authorizationId = transferAuthResponse.data.authorization.id

		const transferCreateRequest: TransferCreateRequest = {
			access_token: 'access-sandbox-cddd20c1-5ba8-4193-89f9-3a0b91034c25',
			account_id: 'Zl8GWV1jqdTgjoKnxQn1HBxxVBanm5FxZpnQk',
			description: 'payment',
			authorization_id: authorizationId,
		}

		const responseCreateResponse = await plaidClient.transferCreate(
			transferCreateRequest,
		)

		const transfer = responseCreateResponse.data.transfer
		return parseStringify(transfer)
	} catch (error) {
		console.error(
			'An error occurred while creating transfer authorization:',
			error,
		)
	}
}
