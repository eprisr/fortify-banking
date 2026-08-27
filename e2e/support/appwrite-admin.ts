// Playwright's test runner is plain Node — it doesn't get .env(.local)
// loaded the way `next dev` (spawned separately, via webServer) does, so
// this loads it the same way Next itself would before anything below reads
// process.env.
import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/server/appwrite'

const {
	APPWRITE_DATABASE_ID: DATABASE_ID,
	APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
	APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
} = process.env

export async function getTestUserRow(email: string): Promise<User | null> {
	const { table } = await createAdminClient()
	const rows = await table.listRows({
		databaseId: DATABASE_ID!,
		tableId: USER_COLLECTION_ID!,
		queries: [Query.equal('email', [email])],
	})
	return (rows.rows[0] as unknown as User) ?? null
}

/**
 * Sandbox-only cleanup — the matching Dwolla customer/funding source are
 * left behind. Dwolla sandbox resources can't be hard-deleted (only
 * deactivated), and a handful accumulating in sandbox is harmless, unlike
 * stale Appwrite accounts which could collide with a future signup on the
 * same email. */
export async function deleteTestUser(email: string) {
	const { user, table } = await createAdminClient()

	const matches = await user.list({ queries: [Query.equal('email', [email])] })
	const authUser = matches.users[0]
	if (!authUser) return

	const rows = await table.listRows({
		databaseId: DATABASE_ID!,
		tableId: USER_COLLECTION_ID!,
		queries: [Query.equal('userId', [authUser.$id])],
	})
	for (const row of rows.rows) {
		const bankRows = await table.listRows({
			databaseId: DATABASE_ID!,
			tableId: BANK_COLLECTION_ID!,
			queries: [Query.equal('userId', [row.$id])],
		})
		for (const bankRow of bankRows.rows) {
			await table.deleteRow({
				databaseId: DATABASE_ID!,
				tableId: BANK_COLLECTION_ID!,
				rowId: bankRow.$id,
			})
		}

		await table.deleteRow({
			databaseId: DATABASE_ID!,
			tableId: USER_COLLECTION_ID!,
			rowId: row.$id,
		})
	}

	await user.delete({ userId: authUser.$id })
}
