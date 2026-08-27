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
} = process.env

/** Deletes the Appwrite auth user and user-collection row for `email`, if
 * they exist. No-ops if not found.
 *
 * Sandbox-only cleanup — the matching Dwolla customer is left behind.
 * Dwolla sandbox customers can't be hard-deleted (only deactivated), and a
 * handful accumulating in sandbox is harmless, unlike stale Appwrite
 * accounts which could collide with a future signup on the same email. */
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
		await table.deleteRow({
			databaseId: DATABASE_ID!,
			tableId: USER_COLLECTION_ID!,
			rowId: row.$id,
		})
	}

	await user.delete({ userId: authUser.$id })
}
