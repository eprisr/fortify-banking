/**
 * lib/server/encryption.ts — AES-256-GCM round-trip + tamper detection.
 *
 * ACCOUNT_ID_ENCRYPTION_KEY is loaded from .env by next/jest, so this uses
 * whatever key is configured for local dev (see jest.config.ts).
 */

import { encryptId, decryptId } from '@/lib/server/encryption'

describe('encryptId / decryptId', () => {
	it('round-trips a plaid account id', () => {
		const accountId = 'plaid-account-abc123'
		expect(decryptId(encryptId(accountId))).toBe(accountId)
	})

	it('produces a different ciphertext on every call (random iv)', () => {
		const accountId = 'plaid-account-abc123'
		expect(encryptId(accountId)).not.toBe(encryptId(accountId))
	})

	it('does not just re-encode the plaintext (unlike the old btoa impl)', () => {
		const accountId = 'plaid-account-abc123'
		const encrypted = encryptId(accountId)
		expect(encrypted).not.toBe(Buffer.from(accountId).toString('base64url'))
		expect(encrypted).not.toContain(accountId)
	})

	it('throws when the ciphertext has been tampered with', () => {
		const encrypted = encryptId('plaid-account-abc123')
		const tampered =
			encrypted.slice(0, -4) + (encrypted.slice(-4) === 'AAAA' ? 'BBBB' : 'AAAA')
		expect(() => decryptId(tampered)).toThrow()
	})

	it('throws on a malformed payload', () => {
		expect(() => decryptId('not-a-real-payload')).toThrow()
	})

	it('throws when ACCOUNT_ID_ENCRYPTION_KEY is missing', () => {
		const original = process.env.ACCOUNT_ID_ENCRYPTION_KEY
		delete process.env.ACCOUNT_ID_ENCRYPTION_KEY
		expect(() => encryptId('plaid-account-abc123')).toThrow(
			/ACCOUNT_ID_ENCRYPTION_KEY/,
		)
		process.env.ACCOUNT_ID_ENCRYPTION_KEY = original
	})
})
