'use server'

import { ID, Query, type Models } from 'node-appwrite'
import { createAdminClient, createSessionClient } from '../server/appwrite'
import { cookies } from 'next/headers'
import {
	extractCustomerIdFromUrl,
	handleError,
	parseStringify,
	passwordField,
	siteUrl,
} from '../utils'
import { encryptId, decryptId } from '../server/encryption'
import {
	emailField,
	firstIssueMessage,
	signUpServerSchema,
	transferServerSchema,
} from '../server/validation'
import {
	AccountType,
	CountryCode,
	ProcessorTokenCreateRequest,
	ProcessorTokenCreateRequestProcessorEnum,
	Products,
} from 'plaid'
import { plaidClient } from '../plaid'
import { revalidatePath } from 'next/cache'
import {
	addFundingSource,
	createDwollaCustomer,
	createTransfer as createDwollaTransfer,
} from './dwolla.actions'
import { createTransaction } from './transaction.actions'
import { DEMO_MODE_COOKIE, DEMO_USER } from '../demo-data'

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
		cookieStore.delete(DEMO_MODE_COOKIE)

		const user = await getUserInfo({ userId: session.userId })

		return { success: true, data: parseStringify(user) }
	} catch (error: any) {
		return handleError(error, 'An error occurred while signing in', {
			general_argument_invalid: 'Incorrect email or password',
		})
	}
}

export const forgotPw = async ({
	email,
}: ForgotPwProps): Promise<ActionResponse<null>> => {
	const parsedEmail = emailField.safeParse(email)
	if (!parsedEmail.success) {
		return { success: false, error: firstIssueMessage(parsedEmail.error) }
	}

	try {
		const { account } = await createAdminClient()

		await account.createRecovery({
			email: parsedEmail.data,
			url: siteUrl('/reset-pw'),
		})

		return { success: true, data: null }
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
}: ResetPwProps): Promise<ActionResponse<null>> => {
	const parsedPassword = passwordField.safeParse(password)
	if (!parsedPassword.success) {
		return { success: false, error: firstIssueMessage(parsedPassword.error) }
	}

	try {
		const { account } = await createAdminClient()

		await account.updateRecovery({
			userId,
			secret,
			password: parsedPassword.data,
		})

		return { success: true, data: null }
	} catch (error: any) {
		return handleError(error, 'Failed to update password')
	}
}

export const resendRecoveryLink = async ({
	userId,
}: ResendRecoveryProps): Promise<ActionResponse<null>> => {
	try {
		const { account, user } = await createAdminClient()

		const target = await user.get({ userId })

		// See note in forgotPw — never return the recovery secret to the client.
		await account.createRecovery({
			email: target.email,
			url: siteUrl('/reset-pw'),
		})

		return { success: true, data: null }
	} catch (error: any) {
		console.error('An Error Occurred while Resending Recovery Link: ', error)
		return { success: false, error: 'Failed to resend recovery link' }
	}
}

export const signUp = async (
	params: SignUpParams,
): Promise<ActionResponse<User>> => {
	const parsed = signUpServerSchema.safeParse(params)
	if (!parsed.success) {
		return { success: false, error: firstIssueMessage(parsed.error) }
	}
	const { firstName, lastName, email, password } = parsed.data

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
			firstName,
			lastName,
			email,
			type: 'unverified',
		})

		if (!dwollaCustomerUrl) throw new Error('Payment provider setup failed')

		const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl)

		const newUser = await table.createRow({
			databaseId: DATABASE_ID!,
			tableId: USER_COLLECTION_ID!,
			rowId: ID.unique(),
			data: {
				firstName,
				lastName,
				email,
				userId: newUserAccount.$id,
				dwollaCustomerId,
				dwollaCustomerUrl,
				verifiedEmail: newUserAccount.emailVerification,
				mfa: newUserAccount.mfa,
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
		cookieStore.delete(DEMO_MODE_COOKIE)

		return { success: true, data: parseStringify(newUser) }
	} catch (error: any) {
		if (newUserAccountId) {
			try {
				const { user } = await createAdminClient()
				await user.delete({ userId: newUserAccountId })
			} catch (cleanupError) {
				console.error(
					`Failed to roll back orphaned auth account ${newUserAccountId}: `,
					cleanupError,
				)
			}
		}

		return handleError(error, 'An error occurred during sign up')
	}
}

export const verifyEmail = async (): Promise<ActionResponse<null>> => {
	try {
		const { account } = await createSessionClient()

		await account.createEmailVerification({
			url: siteUrl('/verify-email'),
		})

		return { success: true, data: null }
	} catch (error: any) {
		return handleError(error, 'Failed to verify email')
	}
}

export const completeEmailVerification = async ({
	userId,
	secret,
}: {
	userId: string
	secret: string
}): Promise<ActionResponse<null>> => {
	try {
		const { account } = await createSessionClient()

		await account.updateEmailVerification({
			userId: userId,
			secret: secret,
		})

		return { success: true, data: null }
	} catch (error: any) {
		return handleError(error, 'Failed to verify your email')
	}
}

export async function getLoggedInUser() {
	const cookieStore = await cookies()
	if (cookieStore.get(DEMO_MODE_COOKIE)) {
		return parseStringify(DEMO_USER)
	}

	try {
		const { account } = await createSessionClient()
		const res = await account.get()

		const user = await getUserInfo({ userId: res.$id })

		// `verifiedEmail`/`mfa` on our own row are unmaintained now — trust
		// the live Appwrite account values instead of a DB mirror nothing
		// writes to anymore.
		return parseStringify({
			...user,
			verifiedEmail: res.emailVerification,
			mfa: res.mfa,
		})
	} catch (error) {
		return null
	}
}

export const logoutAccount = async () => {
	const cookieStore = await cookies()

	if (cookieStore.get(DEMO_MODE_COOKIE)) {
		cookieStore.delete(DEMO_MODE_COOKIE)
		return true
	}

	try {
		const { account } = await createSessionClient()
		cookieStore.delete('appwrite-session')
		await account.deleteSession({ sessionId: 'current' })
		return true
	} catch (error) {
		console.error('Logout Error: ', error)
		return false
	}
}

export const createLinkToken = async (
	user: User,
	update?: boolean,
	appwriteItemId?: string,
) => {
	try {
		let accessToken: string | undefined
		if (update && appwriteItemId) {
			const bank = await getBank({ documentId: appwriteItemId })
			accessToken = bank.accessToken
		}

		const tokenParams = {
			user: {
				client_user_id: user.$id,
			},
			client_name: `${user.firstName} ${user.lastName}`,
			products: ['auth'] as Products[],
			additional_consented_products: ['transactions', 'identity'] as Products[],
			language: 'en',
			country_codes: ['US'] as CountryCode[],
			redirect_uri: siteUrl('/oauth'),
			...(accessToken && { access_token: accessToken }),
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
}: exchangePublicTokenProps): Promise<ActionResponse<null>> => {
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

		const accountData = accountsResponse.data.accounts.find(
			(account) => account.type === AccountType.Depository,
		)

		if (!accountData) {
			throw new Error(
				accountsResponse.data.accounts.length === 0
					? 'No accounts were returned for this bank connection'
					: 'No eligible checking or savings account was found for this bank connection',
			)
		}

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

		const bankAccount = await createBankAccount({
			userId: user.$id,
			bankId: itemId,
			accountId: accountData.account_id,
			accessToken,
			fundingSourceUrl,
			shareableId: encryptId(accountData.account_id),
		})

		if (!bankAccount) throw new Error('Failed to save bank account')

		await waitForInitialTransactions(accessToken)

		revalidatePath('/')

		return { success: true, data: null }
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

		if (!bank.rows[0]) throw new Error(`Bank not found: ${documentId}`)

		return parseStringify(bank.rows[0])
	} catch (error) {
		console.error('Get Bank Error: ', error)
		throw error
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

export const transferFunds = async (
	params: TransferFundsProps,
): Promise<ActionResponse<null>> => {
	const parsed = transferServerSchema.safeParse(params)
	if (!parsed.success) {
		return { success: false, error: firstIssueMessage(parsed.error) }
	}
	const {
		senderBankDocumentId,
		receiverShareableId,
		amount,
		recipientName,
		recipientEmail,
		note,
	} = parsed.data
	const normalizedAmount = amount.toFixed(2)

	try {
		const senderBank = await getBank({ documentId: senderBankDocumentId })

		const receiverAccountId = decryptId(receiverShareableId)
		const receiverBankResult = await getBankByAccountId({
			accountId: receiverAccountId,
		})
		if (!receiverBankResult.success) {
			return {
				success: false,
				error: receiverBankResult.error ?? 'Bank not found',
			}
		}
		const receiverBank = receiverBankResult.data

		const transfer = await createDwollaTransfer({
			sourceFundingSourceUrl: senderBank.fundingSourceUrl,
			destinationFundingSourceUrl: receiverBank.fundingSourceUrl,
			amount: normalizedAmount,
		})

		if (!transfer) throw new Error('Failed to create transfer')

		const newTransaction = await createTransaction({
			name: recipientName,
			email: recipientEmail,
			amount: normalizedAmount,
			senderId: senderBank.userId.$id,
			senderBankId: senderBank.$id,
			receiverId: receiverBank.userId.$id,
			receiverBankId: receiverBank.$id,
			note,
		})

		if (!newTransaction) throw new Error('Failed to record transaction')

		revalidatePath('/')

		return { success: true, data: null }
	} catch (error: any) {
		console.error('Transfer Funds Error: ', error)
		return {
			success: false,
			error: error?.message || 'Failed to complete transfer',
		}
	}
}

export const generateRecoveryCodes = async (): Promise<
	ActionResponse<Models.MfaRecoveryCodes>
> => {
	try {
		const { account } = await createSessionClient()

		const res = await account.createMFARecoveryCodes()

		return { success: true, data: res }
	} catch (error: any) {
		if (error.type === 'user_recovery_codes_already_exists') {
			// Codes can only ever be *created* once — every later visit (a
			// mid-setup refresh, or coming back after disabling 2FA to set it
			// up again) has to regenerate instead, or this dead-ends forever.
			try {
				const { account } = await createSessionClient()
				const res = await account.updateMFARecoveryCodes()

				return { success: true, data: res }
			} catch (regenerateError: any) {
				console.error(
					'An Error Occurred while regenerating recovery codes: ',
					regenerateError,
				)
				return { success: false, error: 'Failed to generate recovery codes' }
			}
		}

		console.error('An Error Occurred while generating recovery codes: ', error)
		return { success: false, error: 'Failed to generate recovery codes' }
	}
}

export const enableMFA = async (): Promise<ActionResponse<null>> => {
	try {
		const { account } = await createSessionClient()

		await account.updateMFA({ mfa: true })

		return { success: true, data: null }
	} catch (error: any) {
		console.error('An Error Occurred while Enabling MFA: ', error)
		return {
			success: false,
			error: 'Failed to enable multi-factor authentication',
		}
	}
}

export const disableMFA = async (): Promise<ActionResponse<null>> => {
	try {
		const { account } = await createSessionClient()

		await account.updateMFA({ mfa: false })

		return { success: true, data: null }
	} catch (error: any) {
		console.error('An Error Occurred while Disabling MFA: ', error)
		return {
			success: false,
			error: 'Failed to disable multi-factor authentication',
		}
	}
}
