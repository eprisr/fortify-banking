'use server'

import { AuthenticationFactor, ID, Query } from 'node-appwrite'
import {
	createAdminClient,
	createGuestClient,
	createSessionClient,
} from '../server/appwrite'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
	dwollaSchema,
	extractCustomerIdFromUrl,
	firstDwollaErrorMessage,
	handleError,
	parseStringify,
	passwordField,
	siteUrl,
	TRANSFER_LIMITS,
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
	CreditAccountSubtype,
	DepositoryAccountSubtype,
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
	deactivateDwollaCustomer,
	getDwollaCustomer,
	updateDwollaCustomer,
} from './dwolla.actions'
import { createTransaction } from './transaction.actions'
import { DEMO_MODE_COOKIE, DEMO_USER, isDemoUserId } from '../demo-data'

const {
	APPWRITE_DATABASE_ID: DATABASE_ID,
	APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
	APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
	APPWRITE_TRANSACTION_COLLECTION_ID: TRANSACTION_COLLECTION_ID,
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
}: SignInProps): Promise<SignInResult> => {
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
			secure: process.env.NODE_ENV === 'production',
			expires: new Date(session.expire),
		})
		cookieStore.delete(DEMO_MODE_COOKIE)

		const { account: sessionAccount } = await createSessionClient()

		try {
			await sessionAccount.get()
		} catch (mfaError: any) {
			if (mfaError.type !== 'user_more_factors_required') throw mfaError

			const challenge = await sessionAccount.createMFAChallenge({
				factor: AuthenticationFactor.Email,
			})

			return { success: true, mfaRequired: true, challengeId: challenge.$id }
		}

		const user = await getUserInfo({ userId: session.userId })

		return { success: true, mfaRequired: false, data: parseStringify(user) }
	} catch (error: any) {
		return handleError(error, 'An error occurred while signing in', {
			general_argument_invalid: 'Incorrect email or password',
		}) as SignInResult
	}
}

export const completeMfaChallenge = async ({
	challengeId,
	code,
}: {
	challengeId: string
	code: string
}): Promise<ActionResponse<null>> => {
	try {
		const { account } = await createSessionClient()

		await account.updateMFAChallenge({
			challengeId,
			otp: code,
		})

		return { success: true, data: null }
	} catch (error: any) {
		return handleError(error, 'Invalid or expired code')
	}
}

// Switches the pending mid-signin challenge to a different factor — right
// now just "lost access to your email, use a recovery code instead" (and
// back). Operates on the same incomplete session signIn already started;
// no re-authentication needed.
export const requestMfaChallenge = async (
	factor: 'email' | 'recoverycode',
): Promise<ActionResponse<{ challengeId: string }>> => {
	try {
		const { account } = await createSessionClient()

		const challenge = await account.createMFAChallenge({
			factor:
				factor === 'email'
					? AuthenticationFactor.Email
					: AuthenticationFactor.Recoverycode,
		})

		return { success: true, data: { challengeId: challenge.$id } }
	} catch (error: any) {
		return handleError(error, 'Failed to send a new code')
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
		const { account } = await createGuestClient()

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
	let newDwollaCustomerUrl: string | null = null

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

		newDwollaCustomerUrl = dwollaCustomerUrl

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
			secure: process.env.NODE_ENV === 'production',
			expires: new Date(session.expire),
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

		if (newDwollaCustomerUrl) {
			await deactivateDwollaCustomer(newDwollaCustomerUrl)
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
		const { account } = await createGuestClient()

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
		if (!user) return null

		return parseStringify({
			...user,
			verifiedEmail: res.emailVerification,
			mfa: res.mfa,
		})
	} catch (error) {
		console.error('getLoggedInUser failed: ', error)
		return null
	}
}

export async function hasRealSession() {
	try {
		const { account } = await createSessionClient()
		const res = await account.get()
		return Boolean(await getUserInfo({ userId: res.$id }))
	} catch {
		return false
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

export const enterDemoMode = async () => {
	const cookieStore = await cookies()
	cookieStore.set(DEMO_MODE_COOKIE, '1', {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: process.env.NODE_ENV === 'production',
	})
	redirect('/')
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
			account_filters: {
				depository: { account_subtypes: [DepositoryAccountSubtype.All] },
				credit: { account_subtypes: [CreditAccountSubtype.All] },
			},
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

		const eligibleAccounts = accountsResponse.data.accounts.filter(
			(account) =>
				account.type === AccountType.Depository ||
				account.type === AccountType.Credit,
		)

		if (eligibleAccounts.length === 0) {
			throw new Error(
				accountsResponse.data.accounts.length === 0
					? 'No accounts were returned for this bank connection'
					: 'No eligible checking, savings, or credit card account was found for this bank connection',
			)
		}

		for (const accountData of eligibleAccounts) {
			let fundingSourceUrl: string | undefined
			try {
				const req: ProcessorTokenCreateRequest = {
					access_token: accessToken,
					account_id: accountData.account_id,
					processor: 'dwolla' as ProcessorTokenCreateRequestProcessorEnum,
				}
				const processorTokenResponse =
					await plaidClient.processorTokenCreate(req)
				fundingSourceUrl =
					(await addFundingSource({
						dwollaCustomerId: user.dwollaCustomerId,
						processorToken: processorTokenResponse.data.processor_token,
						bankName: accountData.name,
					})) ?? undefined
			} catch (error) {
				console.warn(
					`No Dwolla funding source for account ${accountData.account_id} (${accountData.type}/${accountData.subtype}) — linking for display only:`,
					error,
				)
			}

			const bankAccount = await createBankAccount({
				userId: user.$id,
				bankId: itemId,
				accountId: accountData.account_id,
				accessToken,
				fundingSourceUrl,
				shareableId: encryptId(accountData.account_id),
			})

			if (!bankAccount) throw new Error('Failed to save bank account')
		}

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

export const findRecipientByEmail = async (
	email: string,
): Promise<ActionResponse<Recipient>> => {
	const parsed = emailField.safeParse(email)
	if (!parsed.success) {
		return { success: false, error: firstIssueMessage(parsed.error) }
	}

	try {
		const loggedIn = await getLoggedInUser()
		if (!loggedIn) throw new Error('Not signed in')
		if (parsed.data === loggedIn.email) {
			return {
				success: false,
				error: "That's your own email — pick one of your own accounts instead",
			}
		}

		const { table } = await createAdminClient()
		const users = await table.listRows({
			databaseId: DATABASE_ID!,
			tableId: USER_COLLECTION_ID!,
			queries: [Query.equal('email', [parsed.data])],
		})

		const recipient = users.rows[0]
		if (!recipient) {
			return { success: false, error: 'No matching recipient found' }
		}

		const banks = await getBanks({ userId: recipient.$id })
		const bank = banks.success ? banks.data?.[0] : null
		if (!bank) {
			return { success: false, error: 'No matching recipient found' }
		}

		return {
			success: true,
			data: {
				name: `${recipient.firstName} ${recipient.lastName}`,
				shareableId: bank.shareableId,
			},
		}
	} catch (error: any) {
		console.error('Find Recipient Error: ', error)
		return { success: false, error: 'Failed to search for recipient' }
	}
}

export const getRecentRecipients = async (): Promise<
	ActionResponse<RecentRecipient[]>
> => {
	try {
		const loggedIn = await getLoggedInUser()
		if (!loggedIn) throw new Error('Not signed in')
		if (isDemoUserId(loggedIn.$id)) {
			return { success: true, data: [] }
		}

		const { table } = await createAdminClient()
		const transactions = await table.listRows({
			databaseId: DATABASE_ID!,
			tableId: TRANSACTION_COLLECTION_ID!,
			queries: [
				Query.equal('senderId', [loggedIn.$id]),
				Query.orderDesc('$createdAt'),
				Query.limit(50),
			],
		})

		const seenReceivers = new Set<string>()
		const recipients: RecentRecipient[] = []

		for (const txn of transactions.rows) {
			if (txn.receiverId === loggedIn.$id) continue
			if (seenReceivers.has(txn.receiverId)) continue
			seenReceivers.add(txn.receiverId)

			const bank = await getBank({ documentId: txn.receiverBankId }).catch(
				() => null,
			)
			if (!bank) continue

			recipients.push({
				name: txn.name,
				email: txn.email,
				shareableId: bank.shareableId,
			})
			if (recipients.length >= 6) break
		}

		return { success: true, data: recipients }
	} catch (error: any) {
		console.error('Get Recent Recipients Error: ', error)
		return { success: false, error: 'Failed to load recent recipients' }
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
		const loggedIn = await getLoggedInUser()
		if (!loggedIn) throw new Error('Not signed in')

		const verification = await getVerificationStatus()
		const verified =
			verification.success && verification.data.status === 'verified'
		const limit = verified
			? TRANSFER_LIMITS.verified
			: TRANSFER_LIMITS.unverified
		if (amount > limit) {
			return {
				success: false,
				error: `This exceeds your $${limit.toLocaleString()} ${verified ? 'per-transfer' : 'weekly'} limit`,
			}
		}

		const senderBank = await getBank({ documentId: senderBankDocumentId })
		if (senderBank.userId !== loggedIn.$id) {
			return { success: false, error: 'Bank not found' }
		}

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
			senderId: senderBank.userId,
			senderBankId: senderBank.$id,
			receiverId: receiverBank.userId,
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

export const getVerificationStatus = async (): Promise<
	ActionResponse<{ status: DwollaCustomerStatus }>
> => {
	try {
		const loggedIn = await getLoggedInUser()
		if (!loggedIn) throw new Error('Not signed in')
		if (isDemoUserId(loggedIn.$id)) {
			return { success: true, data: { status: 'unverified' } }
		}

		const customer = await getDwollaCustomer(loggedIn.dwollaCustomerUrl)
		if (!customer) throw new Error('Could not reach the payment provider')

		return { success: true, data: { status: customer.status } }
	} catch (error: any) {
		console.error('Get Verification Status Error: ', error)
		return {
			success: false,
			error: error?.message || 'Failed to check verification status',
		}
	}
}

export const verifyIdentity = async (
	params: VerifyIdentityParams,
): Promise<ActionResponse<{ status: DwollaCustomerStatus }>> => {
	const parsed = dwollaSchema.safeParse(params)
	if (!parsed.success) {
		return { success: false, error: firstIssueMessage(parsed.error) }
	}

	try {
		const loggedIn = await getLoggedInUser()
		if (!loggedIn) throw new Error('Not signed in')
		if (isDemoUserId(loggedIn.$id)) {
			return {
				success: false,
				error: 'Verification is not available in demo mode',
			}
		}

		const updated = await updateDwollaCustomer({
			customerUrl: loggedIn.dwollaCustomerUrl,
			firstName: loggedIn.firstName,
			lastName: loggedIn.lastName,
			email: loggedIn.email,
			...parsed.data,
		})

		revalidatePath('/payment-transfer')

		return { success: true, data: { status: updated.status } }
	} catch (error: any) {
		console.error('Verify Identity Error: ', error, error?.body?._embedded)
		return { success: false, error: firstDwollaErrorMessage(error) }
	}
}

export const generateRecoveryCodes = async (): Promise<RecoveryCodesResult> => {
	try {
		const { account } = await createSessionClient()

		const res = await account.createMFARecoveryCodes()

		return {
			success: true,
			challengeRequired: false,
			data: parseStringify(res),
		}
	} catch (error: any) {
		if (error.type === 'user_recovery_codes_already_exists') {
			// Codes can only ever be *created* once — every later visit (a
			// mid-setup refresh, or coming back after disabling 2FA to set it
			// up again) has to regenerate instead, or this dead-ends forever.
			try {
				const { account } = await createSessionClient()
				const res = await account.updateMFARecoveryCodes()

				return {
					success: true,
					challengeRequired: false,
					data: parseStringify(res),
				}
			} catch (regenerateError: any) {
				// Regenerating is gated behind Appwrite's `mfaProtected` route
				// group, which requires the *current session* to have passed an
				// MFA challenge within the last 30 minutes. Re-enabling after a
				// disable never triggers one (Appwrite only challenges
				// MFA-enabled accounts at sign-in) — the caller has to run the
				// user through one explicitly before retrying.
				if (regenerateError.type === 'user_challenge_required') {
					return { success: true, challengeRequired: true }
				}

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
