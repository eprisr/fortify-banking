import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

export type LedgerDb = NodePgDatabase<typeof schema>

let db: LedgerDb | undefined

/**
 * The ledger database (Neon Postgres, ADR-016). Connects lazily on first use,
 * so importing this module never needs DATABASE_URL: the build and the rest
 * of the test suite run without a database.
 *
 * Uses node-postgres over Neon's pooled connection string. Neon's HTTP driver
 * is not used because it can't hold an interactive transaction, which every
 * ledger write needs.
 */
export function getLedgerDb(): LedgerDb {
	if (db) return db

	const connectionString = process.env.DATABASE_URL
	if (!connectionString) {
		throw new Error('DATABASE_URL is not set (ledger database, ADR-016)')
	}

	db = drizzle(new Pool({ connectionString, max: 5 }), { schema })
	return db
}
