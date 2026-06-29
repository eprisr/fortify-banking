'use server'

import { ID, Query } from 'node-appwrite'
import { createAdminClient, createSessionClient } from '../server/appwrite'
import { cookies } from 'next/headers'
import {
	encryptId,
	extractCustomerIdFromUrl,
	handleError,
	parseStringify,
} from '../utils'
import {
	CountryCode,
	ProcessorTokenCreateRequest,
	ProcessorTokenCreateRequestProcessorEnum,
	Products,
} from 'plaid'
import { plaidClient } from '../plaid'
import { revalidatePath } from 'next/cache'
import { addFundingSource, createDwollaCustomer } from './dwolla.actions'

const {
	APPWRITE_DATABASE_ID: DATABASE_ID,
	APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
	APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
} = process.env

export const getUserInfo = async ({ userId }: getUserInfoProps) => {
	try {
		const { table } = await createAdminClient()
		const user = await table.listRows({
			databaseId: DATABASE_ID!,
			tableId: USER_COLLECTION_ID!,
			queries: [Query.equal('userId', [userId])],
		})

		if (!user.rows[0]) return null
		return parseStringify(user.rows[0])
	} catch (error) {
		console.error('Get User Info Error: ', error)
		return null
	}
}

export const signIn = async ({
	email,
	password,
}: SignInProps): Promise<ActionResponse<User>> => {
	try {
		const { account } = await createAdminClient()

		const session = await account.createEmailPasswordSession({
			email,
			password,
		})

		if (!session) throw new Error('Authentication Failed')

		const cookieStore = await cookies()
		cookieStore.set('appwrite-session', session.secret, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: true,
		})

		const user = await getUserInfo({ userId: session.userId })

		return { success: true, data: parseStringify(user) }
	} catch (error: any) {
		return handleError(error, 'An error occurred while signing in')
	}
}

export const forgotPw = async ({
	email,
}: ForgotPwProps): Promise<ActionResponse<User>> => {
	try {
		const { account } = await createAdminClient()

		const res = await account.createRecovery({
			email: email,
			url: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-pw`,
		})

		return { success: true, data: parseStringify(res) }
	} catch (error: any) {
		console.error('An Error Occurred while Resetting Password: ', error)
		const message =
			error.type === 'user_not_found'
				? 'No account found with this email'
				: 'Failed to send recovery email'
		return { success: false, error: message }
	}
}

export const resetPw = async ({
	userId,
	secret,
	password,
}: ResetPwProps): Promise<ActionResponse<Account>> => {
	try {
		const { account } = await createAdminClient()

		const res = await account.updateRecovery({ userId, secret, password })

		return { success: true, data: parseStringify(res) }
	} catch (error: any) {
		return {
			success: false,
			error: error?.response?.message || 'Failed to update password',
		}
	}
}

export const signUp = async ({
	password,
	...userData
}: SignUpParams): Promise<ActionResponse<User>> => {
	const { email, firstName, lastName } = userData
	let newUserAccountId: string | null = null

	try {
		const { account, table } = await createAdminClient()

		const newUserAccount = await account.create({
			userId: ID.unique(),
			email,
			password,
			name: `${firstName} ${lastName}`,
		})

		if (!newUserAccount) throw new Error('Could not create auth account')

		newUserAccountId = newUserAccount.$id

		const dwollaCustomerUrl = await createDwollaCustomer({
			...userData,
			type: 'unverified',
		})

		if (!dwollaCustomerUrl) throw new Error('Payment provider setup failed')

		const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl)

		const newUser = await table.createRow({
			databaseId: DATABASE_ID!,
			tableId: USER_COLLECTION_ID!,
			rowId: ID.unique(),
			data: {
				...userData,
				userId: newUserAccount.$id,
				dwollaCustomerId,
				dwollaCustomerUrl,
			},
		})

		const session = await account.createEmailPasswordSession({
			email,
			password,
		})

		const cookieStore = await cookies()
		cookieStore.set('appwrite-session', session.secret, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: true,
		})

		return { success: true, data: parseStringify(newUser) }
	} catch (error: any) {
		if (newUserAccountId) {
			const { user } = await createAdminClient()
			await user.delete({ userId: newUserAccountId })
		}

		return handleError(error, 'An error occurred during sign up')
	}
}

export async function getLoggedInUser() {
	try {
		const { account } = await createSessionClient()
		const res = await account.get()

		const user = await getUserInfo({ userId: res.$id })

		return parseStringify(user)
	} catch (error) {
		return null
	}
}

export const logoutAccount = async () => {
	try {
		const { account } = await createSessionClient()
		const cookieStore = await cookies()
		cookieStore.delete('appwrite-session')
		await account.deleteSession({ sessionId: 'current' })
		return true
	} catch (error) {
		return false
	}
}

export const createLinkToken = async (
	user: User,
	update?: boolean,
	accessToken?: string,
) => {
	try {
		const tokenParams = {
			user: {
				client_user_id: user.$id,
			},
			client_name: `${user.firstName} ${user.lastName}`,
			products: ['auth'] as Products[],
			additional_consented_products: ['transactions', 'identity'] as Products[],
			language: 'en',
			country_codes: ['US'] as CountryCode[],
			...(update && { access_token: accessToken }),
		}

		const res = await plaidClient.linkTokenCreate(tokenParams)

		return { success: true, linkToken: res.data.link_token }
	} catch (error) {
		console.error('Create Link Token Error: ', error)
		return { success: false, error: 'Could not initialize bank connection' }
	}
}

export const createBankAccount = async ({
	userId,
	bankId,
	accountId,
	accessToken,
	fundingSourceUrl,
	shareableId,
}: CreateBankAccountProps) => {
	try {
		const { table } = await createAdminClient()

		const bankAccount = await table.createRow({
			databaseId: DATABASE_ID!,
			tableId: BANK_COLLECTION_ID!,
			rowId: ID.unique(),
			data: {
				userId,
				bankId,
				accountId,
				accessToken,
				fundingSourceUrl,
				shareableId,
			},
		})

		return parseStringify(bankAccount)
	} catch (error) {
		console.error('Appwrite createBankAccount failed:', error)
		return null
	}
}

// Plaid's initial transaction pull for a newly linked item completes
// asynchronously on their end, so the first transactionsSync call right
// after linking can legitimately come back empty. Poll briefly so the
// dashboard doesn't render with no transactions immediately after linking.
const waitForInitialTransactions = async (accessToken: string) => {
	const MAX_ATTEMPTS = 5
	const RETRY_DELAY_MS = 1000

	for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
		try {
			const response = await plaidClient.transactionsSync({
				access_token: accessToken,
			})
			if (response.data.added.length > 0) return
		} catch (error) {
			console.error('Error polling for initial transactions:', error)
			return
		}

		if (attempt < MAX_ATTEMPTS - 1) {
			await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
		}
	}
}

export const exchangePublicToken = async ({
	publicToken,
	user,
}: exchangePublicTokenProps) => {
	try {
		// Exchange public token for access token and item ID
		const res = await plaidClient.itemPublicTokenExchange({
			public_token: publicToken,
		})

		const { access_token: accessToken, item_id: itemId } = res.data

		// Get account information from Plaid using the access token
		const accountsResponse = await plaidClient.accountsGet({
			access_token: accessToken,
		})

		const accountData = accountsResponse.data.accounts[0]

		// Create a processor token for Dwolla using the access token and account ID
		const req: ProcessorTokenCreateRequest = {
			access_token: accessToken,
			account_id: accountData.account_id,
			processor: 'dwolla' as ProcessorTokenCreateRequestProcessorEnum,
		}

		const processorTokenResponse = await plaidClient.processorTokenCreate(req)
		const processorToken = processorTokenResponse.data.processor_token

		// Create a funding source URL for the account using the Dwolla customer ID, processor token, and bank name
		const fundingSourceUrl = await addFundingSource({
			dwollaCustomerId: user.dwollaCustomerId,
			processorToken,
			bankName: accountData.name,
		})

		if (!fundingSourceUrl) throw new Error('Failed to link funding source')

		await createBankAccount({
			userId: user.$id,
			bankId: itemId,
			accountId: accountData.account_id,
			accessToken,
			fundingSourceUrl,
			shareableId: encryptId(accountData.account_id),
		})

		await waitForInitialTransactions(accessToken)

		revalidatePath('/')

		return { success: true }
	} catch (error) {
		return handleError(error, 'Bank connection failed')
	}
}

export const getBanks = async ({ userId }: getBanksProps) => {
	try {
		const { table } = await createAdminClient()
		const banks = await table.listRows({
			databaseId: DATABASE_ID!,
			tableId: BANK_COLLECTION_ID!,
			queries: [Query.equal('userId', [userId])],
		})

		return { success: true, data: parseStringify(banks.rows) }
	} catch (error) {
		console.error('Get Banks Error: ', error)
		return { success: false, error: 'Failed to fetch bank accounts' }
	}
}

export const getBank = async ({ documentId }: getBankProps) => {
	try {
		const { table } = await createAdminClient()
		const bank = await table.listRows({
			databaseId: DATABASE_ID!,
			tableId: BANK_COLLECTION_ID!,
			queries: [Query.equal('$id', [documentId])],
		})

		return parseStringify(bank.rows[0])
	} catch (error) {
		console.error('Get Bank Error: ', error)
	}
}

export const getBankByAccountId = async ({
	accountId,
}: getBankByAccountIdProps) => {
	try {
		const { table } = await createAdminClient()
		const bank = await table.listRows({
			databaseId: DATABASE_ID!,
			tableId: BANK_COLLECTION_ID!,
			queries: [Query.equal('accountId', [accountId])],
		})

		if (bank.total !== 1) return { success: false, error: 'Bank not found' }

		return { success: true, data: parseStringify(bank.rows[0]) }
	} catch (error) {
		console.error('Get Bank Error: ', error)
		return { success: false, error: 'Internal server error' }
	}
}
