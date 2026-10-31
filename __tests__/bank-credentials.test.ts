/**
 * lib/server/bank-credentials.ts: at-rest encryption for Bank.accessToken and
 * Bank.fundingSourceUrl (ADR-016 §3).
 */
import {
	CREDENTIAL_PREFIX,
	decryptBankRow,
	decryptCredential,
	encryptBankRow,
	encryptCredential,
	isEncryptedCredential,
} from '@/lib/server/bank-credentials'

const accessToken = 'access-sandbox-1234-abcd'
const fundingSourceUrl =
	'https://api-sandbox.dwolla.com/funding-sources/5cfcdc41-10f6-4a45-b11d-7ac89893d985'

describe('encryptCredential / decryptCredential', () => {
	it('round-trips a Plaid access token and a Dwolla funding source URL', () => {
		expect(decryptCredential(encryptCredential(accessToken))).toBe(accessToken)
		expect(decryptCredential(encryptCredential(fundingSourceUrl))).toBe(
			fundingSourceUrl,
		)
	})

	it('prefixes the ciphertext and never contains the plaintext', () => {
		const encrypted = encryptCredential(accessToken)
		expect(encrypted.startsWith(CREDENTIAL_PREFIX)).toBe(true)
		expect(encrypted).not.toContain(accessToken)
		expect(isEncryptedCredential(encrypted)).toBe(true)
	})

	it('does not double-encrypt an already-encrypted value', () => {
		const encrypted = encryptCredential(accessToken)
		expect(encryptCredential(encrypted)).toBe(encrypted)
	})

	it('passes legacy plaintext through on read (rows written before encryption)', () => {
		expect(isEncryptedCredential(accessToken)).toBe(false)
		expect(decryptCredential(accessToken)).toBe(accessToken)
		expect(decryptCredential(fundingSourceUrl)).toBe(fundingSourceUrl)
	})

	it('throws on a tampered credential instead of returning garbage', () => {
		const encrypted = encryptCredential(accessToken)
		const raw = Buffer.from(
			encrypted.slice(CREDENTIAL_PREFIX.length),
			'base64url',
		)
		raw[raw.length - 1] ^= 0xff // flip a ciphertext byte
		const tampered = CREDENTIAL_PREFIX + raw.toString('base64url')
		expect(() => decryptCredential(tampered)).toThrow()
	})
})

describe('encryptBankRow / decryptBankRow', () => {
	const row = {
		$id: 'bank-1',
		userId: 'user-1',
		accountId: 'plaid-account-1',
		shareableId: 'shareable-1',
		accessToken,
		fundingSourceUrl,
	}

	it('encrypts only the two credential fields', () => {
		const encrypted = encryptBankRow(row)
		expect(isEncryptedCredential(encrypted.accessToken)).toBe(true)
		expect(isEncryptedCredential(encrypted.fundingSourceUrl)).toBe(true)
		expect(encrypted).toMatchObject({
			$id: row.$id,
			userId: row.userId,
			accountId: row.accountId,
			shareableId: row.shareableId,
		})
	})

	it('round-trips a full row and does not mutate the input', () => {
		const copy = { ...row }
		expect(decryptBankRow(encryptBankRow(row))).toEqual(row)
		expect(row).toEqual(copy)
	})

	it('decrypts a row mixing an encrypted and a legacy plaintext field', () => {
		const mixed = { ...row, accessToken: encryptCredential(accessToken) }
		expect(decryptBankRow(mixed)).toEqual(row)
	})

	it('passes a missing row through so "no row" checks still fail closed', () => {
		expect(decryptBankRow(null)).toBeNull()
		expect(decryptBankRow(undefined)).toBeUndefined()
		expect(encryptBankRow(null)).toBeNull()
	})

	it('leaves missing or empty credentials alone', () => {
		const noFundingSource = { ...row, fundingSourceUrl: '' }
		expect(encryptBankRow(noFundingSource).fundingSourceUrl).toBe('')

		const { fundingSourceUrl: _omit, ...withoutField } = row
		expect(encryptBankRow(withoutField)).not.toHaveProperty('fundingSourceUrl')
	})
})
