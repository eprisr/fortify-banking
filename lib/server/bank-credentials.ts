import { decryptId, encryptId } from './encryption'

/**
 * At-rest encryption for the two per-row bank credentials (ADR-016 §3):
 * `Bank.accessToken` (Plaid) and `Bank.fundingSourceUrl` (Dwolla).
 *
 * Reuses the AES-256-GCM helpers from ADR-007 rather than a second mechanism.
 * Encrypted values carry a versioned prefix so they can't be confused with a
 * legacy plaintext value (Plaid tokens start with `access-`, Dwolla URLs with
 * `https://`), and so a future key rotation can introduce `enc:v2:`.
 *
 * Encryption happens only at the Appwrite boundary: rows are encrypted on
 * write and decrypted on read, so callers keep seeing plaintext.
 */
export const CREDENTIAL_PREFIX = 'enc:v1:'

export const CREDENTIAL_FIELDS = ['accessToken', 'fundingSourceUrl'] as const

export const isEncryptedCredential = (value: string) =>
	value.startsWith(CREDENTIAL_PREFIX)

/** Encrypts a credential. Already-encrypted values are returned unchanged. */
export function encryptCredential(value: string): string {
	if (isEncryptedCredential(value)) return value
	return CREDENTIAL_PREFIX + encryptId(value)
}

/**
 * Decrypts a credential. Legacy plaintext (rows written before encryption
 * shipped, until the backfill has run) is returned as-is. Throws if an
 * encrypted value fails authentication: a tampered or wrongly-keyed
 * credential must never be passed on to Plaid or Dwolla.
 */
export function decryptCredential(value: string): string {
	if (!isEncryptedCredential(value)) return value
	return decryptId(value.slice(CREDENTIAL_PREFIX.length))
}

// Accepts any row shape: Appwrite's DefaultRow has no named fields, and a row
// may be missing either credential (e.g. a bank with no Dwolla funding source).
// A null/undefined row passes through untouched, so callers' "no row came
// back" checks keep working (spreading null would turn it into a truthy {}).
const mapCredentials = <T extends object | null | undefined>(
	row: T,
	transform: (value: string) => string,
): T => {
	if (row == null) return row
	const next = { ...row } as Record<string, unknown>
	for (const field of CREDENTIAL_FIELDS) {
		const value = next[field]
		if (typeof value === 'string' && value.length > 0) {
			next[field] = transform(value)
		}
	}
	return next as unknown as T
}

/** Encrypts the credential fields of a Bank row before it's written. */
export const encryptBankRow = <T extends object | null | undefined>(row: T): T =>
	mapCredentials(row, encryptCredential)

/** Decrypts the credential fields of a Bank row after it's read. */
export const decryptBankRow = <T extends object | null | undefined>(row: T): T =>
	mapCredentials(row, decryptCredential)
