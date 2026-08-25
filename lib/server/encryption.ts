import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96-bit nonce, the size GCM is designed for
const AUTH_TAG_LENGTH = 16

function getKey(): Buffer {
	const secret = process.env.ACCOUNT_ID_ENCRYPTION_KEY
	if (!secret) {
		throw new Error('ACCOUNT_ID_ENCRYPTION_KEY is not set')
	}

	const key = Buffer.from(secret, 'base64')
	if (key.length !== 32) {
		throw new Error(
			"ACCOUNT_ID_ENCRYPTION_KEY must decode to 32 bytes — generate one with `node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"`",
		)
	}

	return key
}

/** Encrypts `id`, returning a single URL-safe string (iv + authTag + ciphertext). */
export function encryptId(id: string): string {
	const iv = randomBytes(IV_LENGTH)
	const cipher = createCipheriv(ALGORITHM, getKey(), iv)
	const ciphertext = Buffer.concat([cipher.update(id, 'utf8'), cipher.final()])
	const authTag = cipher.getAuthTag()

	return Buffer.concat([iv, authTag, ciphertext]).toString('base64url')
}

/** Reverses `encryptId`. Throws if `payload` is malformed or was tampered with. */
export function decryptId(payload: string): string {
	const raw = Buffer.from(payload, 'base64url')
	const iv = raw.subarray(0, IV_LENGTH)
	const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
	const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

	const decipher = createDecipheriv(ALGORITHM, getKey(), iv)
	decipher.setAuthTag(authTag)

	return Buffer.concat([
		decipher.update(ciphertext),
		decipher.final(),
	]).toString('utf8')
}
