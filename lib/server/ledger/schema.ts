/**
 * Shadow ledger schema (ADR-015, ADR-016 §2). Double-entry and append-only.
 *
 * - Amounts are integer cents (bigint), never floats. Signed: a positive
 *   posting is a debit, a negative posting is a credit.
 * - Postings in one journal entry must sum to zero. Postgres enforces this at
 *   commit, along with append-only rules, in the hand-written migration
 *   `drizzle/0001_ledger_integrity.sql`. App code checks too, but the
 *   database is the guarantee.
 * - There is no stored balance anywhere. A balance is SUM(postings).
 * - This is Fortify's record of what it understood happened, never the
 *   number a user is shown as spendable. Dwolla and Plaid stay authoritative
 *   (ADR-015).
 */
import { sql } from 'drizzle-orm'
import {
	bigint,
	check,
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core'

export const LEDGER_ACCOUNT_KINDS = [
	'user_bank', // a user's linked bank account (Appwrite Bank row)
	'user_balance', // a user's Dwolla Balance
	'clearing', // internal: money in flight between accounts
	'fees', // internal: fees charged or paid
] as const
export type LedgerAccountKind = (typeof LEDGER_ACCOUNT_KINDS)[number]

export const accounts = pgTable(
	'accounts',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		kind: text('kind').$type<LedgerAccountKind>().notNull(),
		name: text('name').notNull(),
		// References back to Appwrite rather than duplicating their data.
		appwriteUserId: text('appwrite_user_id'),
		appwriteBankId: text('appwrite_bank_id'),
		// Stable key for internal accounts, e.g. 'clearing:dwolla'.
		code: text('code'),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		check(
			'accounts_kind_check',
			sql`${t.kind} in ('user_bank', 'user_balance', 'clearing', 'fees')`,
		),
		// User-owned accounts point at a user; internal accounts have a code.
		check(
			'accounts_owner_check',
			sql`(${t.kind} in ('user_bank', 'user_balance') and ${t.appwriteUserId} is not null)
				or (${t.kind} in ('clearing', 'fees') and ${t.code} is not null)`,
		),
		// One ledger account per linked bank, and per internal code.
		uniqueIndex('accounts_appwrite_bank_id_key')
			.on(t.appwriteBankId)
			.where(sql`${t.appwriteBankId} is not null`),
		uniqueIndex('accounts_code_key')
			.on(t.code)
			.where(sql`${t.code} is not null`),
		index('accounts_appwrite_user_id_idx').on(t.appwriteUserId),
	],
)

export const journalEntries = pgTable('journal_entries', {
	id: uuid('id').primaryKey().defaultRandom(),
	description: text('description').notNull(),
	occurredAt: timestamp('occurred_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
	// ADR-017 adds `status` and a unique `idempotency_key` here.
})

export const postings = pgTable(
	'postings',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		journalEntryId: uuid('journal_entry_id')
			.notNull()
			.references(() => journalEntries.id, { onDelete: 'restrict' }),
		accountId: uuid('account_id')
			.notNull()
			.references(() => accounts.id, { onDelete: 'restrict' }),
		// mode 'number' is exact up to 2^53 cents (~$90 trillion).
		amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		check('postings_amount_nonzero', sql`${t.amountCents} <> 0`),
		index('postings_journal_entry_id_idx').on(t.journalEntryId),
		index('postings_account_id_idx').on(t.accountId),
	],
)
