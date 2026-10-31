/**
 * One-off backfill (ADR-016 §3): encrypts the plaintext Plaid/Dwolla
 * credentials (`accessToken`, `fundingSourceUrl`) on existing Bank rows.
 *
 * New rows are already encrypted on write, and reads accept legacy plaintext,
 * so the app works before, during and after this runs. Run it once per
 * environment (dev, preview, production).
 *
 *   Dry run (default, writes nothing):
 *     doppler run -- npm run backfill:bank-credentials
 *   Apply:
 *     doppler run -- npm run backfill:bank-credentials -- --apply
 *
 * Safe to re-run: already-encrypted values are skipped. Never prints
 * credential values, only row IDs and counts.
 *
 * Use the same ACCOUNT_ID_ENCRYPTION_KEY the app runs with in that
 * environment, or the app won't be able to decrypt what this writes.
 */
import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { Client, Query, TablesDB } from 'node-appwrite'
import {
	CREDENTIAL_FIELDS,
	decryptCredential,
	encryptCredential,
	isEncryptedCredential,
} from '../lib/server/bank-credentials'

const PAGE_SIZE = 100
const apply = process.argv.includes('--apply')

const required = [
	'NEXT_PUBLIC_APPWRITE_ENDPOINT',
	'NEXT_PUBLIC_APPWRITE_PROJECT_ID',
	'APPWRITE_KEY',
	'APPWRITE_DATABASE_ID',
	'APPWRITE_BANK_COLLECTION_ID',
	'ACCOUNT_ID_ENCRYPTION_KEY',
] as const

async function main() {
	const missing = required.filter((name) => !process.env[name])
	if (missing.length) {
		throw new Error(`Missing env vars: ${missing.join(', ')}`)
	}
	const env = process.env as unknown as Record<(typeof required)[number], string>

	const table = new TablesDB(
		new Client()
			.setEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
			.setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
			.setKey(env.APPWRITE_KEY),
	)
	const databaseId = env.APPWRITE_DATABASE_ID
	const tableId = env.APPWRITE_BANK_COLLECTION_ID

	console.log(
		`${apply ? 'APPLY' : 'DRY RUN'}: encrypting bank credentials in ${env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}/${databaseId}/${tableId}`,
	)

	let cursor: string | undefined
	let scanned = 0
	let alreadyEncrypted = 0
	let toEncrypt = 0
	let written = 0
	let longest = 0
	const failures: string[] = []

	for (;;) {
		const page = await table.listRows({
			databaseId,
			tableId,
			queries: [
				Query.limit(PAGE_SIZE),
				...(cursor ? [Query.cursorAfter(cursor)] : []),
			],
		})
		if (page.rows.length === 0) break

		for (const row of page.rows as Record<string, unknown>[]) {
			scanned++
			const rowId = String(row.$id)
			const data: Record<string, string> = {}

			for (const field of CREDENTIAL_FIELDS) {
				const value = row[field]
				if (typeof value !== 'string' || value.length === 0) continue
				if (isEncryptedCredential(value)) {
					alreadyEncrypted++
					continue
				}

				const encrypted = encryptCredential(value)
				// Never write a value we can't read back.
				if (decryptCredential(encrypted) !== value) {
					throw new Error(`Round-trip check failed on row ${rowId}`)
				}
				longest = Math.max(longest, encrypted.length)
				data[field] = encrypted
			}

			const fields = Object.keys(data)
			if (fields.length === 0) continue
			toEncrypt += fields.length
			console.log(`  ${rowId}: ${fields.join(', ')}`)

			if (apply) {
				try {
					await table.updateRow({ databaseId, tableId, rowId, data })
					written += fields.length
				} catch (error) {
					failures.push(rowId)
					console.error(
						`  ! ${rowId} failed: ${error instanceof Error ? error.message : error}`,
					)
				}
			}
		}

		cursor = String(page.rows[page.rows.length - 1].$id)
		if (page.rows.length < PAGE_SIZE) break
	}

	console.log(`\nRows scanned:              ${scanned}`)
	console.log(`Fields already encrypted:  ${alreadyEncrypted}`)
	console.log(`Fields needing encryption: ${toEncrypt}`)
	if (toEncrypt > 0) {
		console.log(
			`Longest encrypted value:   ${longest} chars (both Appwrite columns must allow at least this)`,
		)
	}
	if (apply) {
		console.log(`Fields written:            ${written}`)
		if (failures.length) {
			console.log(`Rows that failed:          ${failures.join(', ')}`)
			process.exitCode = 1
		}
	} else if (toEncrypt > 0) {
		console.log('\nNothing was written. Re-run with --apply to encrypt.')
	}
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})
