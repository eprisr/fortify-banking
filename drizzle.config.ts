import { loadEnvConfig } from '@next/env'
import { defineConfig } from 'drizzle-kit'

loadEnvConfig(process.cwd())

// Migrations use the direct (unpooled) Neon connection when it exists;
// schema changes can misbehave through a connection pooler.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

export default defineConfig({
	dialect: 'postgresql',
	schema: './lib/server/ledger/schema.ts',
	out: './drizzle',
	dbCredentials: { url: url ?? '' },
	strict: true,
	verbose: true,
})
