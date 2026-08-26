import { z } from 'zod'
import { nameField, freeTextField, passwordField } from '../utils'

// Trimmed + lowercased so a mobile keyboard's autocapitalize-first-letter
// behavior can't turn a correct email into a mismatched credential.
export const emailField = z.email('A valid email is required').trim().toLowerCase()

const MAX_TRANSFER_AMOUNT = 1_000_000

export const transferAmountField = z
	.string()
	.transform((value) => value.replace(/[$,\s]/g, ''))
	.pipe(
		z.string().regex(/^\d+(\.\d{1,2})?$/, {
			error: 'Enter a valid dollar amount',
		}),
	)
	.transform(Number)
	.refine((amount) => amount > 0, { error: 'Amount must be greater than $0' })
	.refine((amount) => amount <= MAX_TRANSFER_AMOUNT, {
		error: `Amount can't exceed $${MAX_TRANSFER_AMOUNT.toLocaleString()}`,
	})

export const signUpServerSchema = z.object({
	firstName: nameField('First name'),
	lastName: nameField('Last name'),
	email: emailField,
	password: passwordField,
})

export const transferServerSchema = z.object({
	senderBankDocumentId: z.string().min(1, { error: 'Select a bank account' }),
	receiverShareableId: z
		.string()
		.min(1, { error: 'Enter the recipient sharable ID' }),
	amount: transferAmountField,
	recipientName: nameField('Recipient name'),
	recipientEmail: emailField,
	note: freeTextField(500).optional(),
})

/** First validation-error message from a failed safeParse, for ActionResponse.error. */
export const firstIssueMessage = (error: z.ZodError) =>
	error.issues[0]?.message ?? 'Invalid input'
