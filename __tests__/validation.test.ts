/**
 * lib/server/validation.ts — the server-side re-validation that runs inside
 * signUp/transferFunds regardless of what the client form already checked.
 */

import {
	transferAmountField,
	signUpServerSchema,
	transferServerSchema,
	firstIssueMessage,
} from '@/lib/server/validation'
import { nameField, freeTextField } from '@/lib/utils'

describe('nameField', () => {
	const schema = nameField('Name')

	it('accepts ordinary names', () => {
		expect(schema.parse('Jane Doe')).toBe('Jane Doe')
	})

	it('accepts names with apostrophes and hyphens', () => {
		expect(schema.parse("O'Brien-Smith")).toBe("O'Brien-Smith")
	})

	it('accepts accented / non-Latin letters', () => {
		expect(schema.parse('José')).toBe('José')
		expect(schema.parse('田中')).toBe('田中')
	})

	it('trims surrounding whitespace', () => {
		expect(schema.parse('  Jane  ')).toBe('Jane')
	})

	it('rejects an HTML/script payload', () => {
		expect(schema.safeParse('<script>alert(1)</script>').success).toBe(false)
	})

	it('rejects digits', () => {
		expect(schema.safeParse('Jane123').success).toBe(false)
	})

	it('rejects an empty string', () => {
		expect(schema.safeParse('').success).toBe(false)
	})

	it('rejects a string past the max length', () => {
		expect(nameField('Name', 5).safeParse('Alexandria').success).toBe(false)
	})
})

describe('freeTextField', () => {
	const schema = freeTextField(20)

	it('trims and passes ordinary text through', () => {
		expect(schema.parse('  Happy birthday!  ')).toBe('Happy birthday!')
	})

	it('strips control characters', () => {
		expect(schema.parse('Rent\x00 payment')).toBe('Rent payment')
	})

	it('rejects text past the max length', () => {
		expect(schema.safeParse('a'.repeat(21)).success).toBe(false)
	})
})

describe('transferAmountField', () => {
	it('normalizes a currency-formatted string to a number', () => {
		expect(transferAmountField.parse('$1,000.00')).toBe(1000)
	})

	it('accepts a plain decimal string', () => {
		expect(transferAmountField.parse('9.99')).toBe(9.99)
	})

	it('rejects zero', () => {
		expect(transferAmountField.safeParse('0').success).toBe(false)
	})

	it('rejects a negative amount', () => {
		expect(transferAmountField.safeParse('-50').success).toBe(false)
	})

	it('rejects more than 2 decimal places', () => {
		expect(transferAmountField.safeParse('10.999').success).toBe(false)
	})

	it('rejects non-numeric garbage', () => {
		expect(transferAmountField.safeParse('not-a-number').success).toBe(false)
	})

	it('rejects an amount over the cap', () => {
		expect(transferAmountField.safeParse('1000001').success).toBe(false)
	})
})

describe('signUpServerSchema', () => {
	const valid = {
		firstName: 'Jane',
		lastName: 'Doe',
		email: 'jane@example.com',
		password: 'Sup3r$ecret',
	}

	it('accepts valid signup details', () => {
		expect(signUpServerSchema.safeParse(valid).success).toBe(true)
	})

	it('rejects an HTML payload in firstName', () => {
		const result = signUpServerSchema.safeParse({
			...valid,
			firstName: '<img src=x onerror=alert(1)>',
		})
		expect(result.success).toBe(false)
	})

	it('rejects a weak password', () => {
		const result = signUpServerSchema.safeParse({ ...valid, password: 'weak' })
		expect(result.success).toBe(false)
	})

	it('ignores extra, unexpected fields rather than persisting them', () => {
		const result = signUpServerSchema.safeParse({
			...valid,
			role: 'admin',
			dwollaCustomerId: 'attacker-controlled',
		})
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data).not.toHaveProperty('role')
			expect(result.data).not.toHaveProperty('dwollaCustomerId')
		}
	})
})

describe('transferServerSchema', () => {
	const valid = {
		senderBankDocumentId: 'bank-1',
		receiverShareableId: 'encrypted-payload',
		amount: '$25.00',
		recipientName: 'Jane Doe',
		recipientEmail: 'jane@example.com',
		note: 'Rent',
	}

	it('accepts valid transfer details and normalizes the amount', () => {
		const result = transferServerSchema.safeParse(valid)
		expect(result.success).toBe(true)
		if (result.success) expect(result.data.amount).toBe(25)
	})

	it('allows an omitted note', () => {
		const { note, ...withoutNote } = valid
		expect(transferServerSchema.safeParse(withoutNote).success).toBe(true)
	})

	it('rejects a garbage amount', () => {
		expect(
			transferServerSchema.safeParse({ ...valid, amount: 'a lot' }).success,
		).toBe(false)
	})

	it('rejects an HTML payload in recipientName', () => {
		expect(
			transferServerSchema.safeParse({
				...valid,
				recipientName: '<script>alert(1)</script>',
			}).success,
		).toBe(false)
	})
})

describe('firstIssueMessage', () => {
	it('returns the first zod issue message', () => {
		const result = signUpServerSchema.safeParse({})
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(firstIssueMessage(result.error)).toEqual(expect.any(String))
		}
	})
})
