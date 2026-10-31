/**
 * Shadow ledger operations (ADR-015, ADR-016 §2).
 *
 * Every write is one SQL transaction that locks each touched account with
 * SELECT ... FOR UPDATE, always in ascending id order so two concurrent
 * entries over the same accounts queue instead of deadlocking. Postgres
 * re-checks balance and append-only rules at commit
 * (drizzle/0001_ledger_integrity.sql).
 *
 * Functions take the database as an argument so tests can pass their own;
 * app code passes getLedgerDb().
 */
import { asc, eq, inArray, sql, type SQL } from 'drizzle-orm'
import type { LedgerDb } from './db'
import {
	accounts,
	journalEntries,
	postings,
	type LedgerAccountKind,
} from './schema'

export type PostingInput = { accountId: string; amountCents: number }

export type JournalEntryInput = {
	description: string
	occurredAt?: Date
	postings: PostingInput[]
}

export class LedgerError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'LedgerError'
	}
}

/** Rejects an entry the database would reject, with a clearer message. */
export function assertBalanced(input: JournalEntryInput): void {
	if (!input.description.trim()) {
		throw new LedgerError('A journal entry needs a description')
	}
	if (input.postings.length < 2) {
		throw new LedgerError('A journal entry needs at least two postings')
	}
	for (const { amountCents } of input.postings) {
		if (!Number.isSafeInteger(amountCents) || amountCents === 0) {
			throw new LedgerError(
				`Posting amounts must be non-zero whole cents, got ${amountCents}`,
			)
		}
	}
	const total = input.postings.reduce((sum, p) => sum + p.amountCents, 0)
	if (total !== 0) {
		throw new LedgerError(`Postings must sum to zero, got ${total} cents`)
	}
}

/**
 * Writes one balanced journal entry and its postings atomically. Returns the
 * new entry's id.
 */
export async function postJournalEntry(
	db: LedgerDb,
	input: JournalEntryInput,
): Promise<string> {
	assertBalanced(input)
	const accountIds = [...new Set(input.postings.map((p) => p.accountId))].sort()

	return db.transaction(async (tx) => {
		const locked = await tx
			.select({ id: accounts.id })
			.from(accounts)
			.where(inArray(accounts.id, accountIds))
			.orderBy(asc(accounts.id))
			.for('update')

		if (locked.length !== accountIds.length) {
			const found = new Set(locked.map((a) => a.id))
			const missing = accountIds.filter((id) => !found.has(id))
			throw new LedgerError(`Unknown ledger account(s): ${missing.join(', ')}`)
		}

		const [entry] = await tx
			.insert(journalEntries)
			.values({
				description: input.description,
				...(input.occurredAt && { occurredAt: input.occurredAt }),
			})
			.returning({ id: journalEntries.id })

		await tx.insert(postings).values(
			input.postings.map((p) => ({
				journalEntryId: entry.id,
				accountId: p.accountId,
				amountCents: p.amountCents,
			})),
		)

		return entry.id
	})
}

/**
 * What the ledger believes an account holds, in cents: SUM of its postings.
 * Never shown to a user as spendable (ADR-015).
 */
export async function getAccountBalanceCents(
	db: LedgerDb,
	accountId: string,
): Promise<number> {
	const [row] = await db
		.select({
			total: sql<string>`coalesce(sum(${postings.amountCents}), 0)`,
		})
		.from(postings)
		.where(eq(postings.accountId, accountId))

	return Number(row.total)
}

/**
 * Returns the ledger account for a linked Appwrite bank, creating it on first
 * use. Safe under concurrency: the unique index on appwrite_bank_id decides
 * the winner and the loser reads the winner's row.
 */
export async function findOrCreateBankAccount(
	db: LedgerDb,
	input: { appwriteUserId: string; appwriteBankId: string; name: string },
): Promise<string> {
	const [inserted] = await db
		.insert(accounts)
		.values({ kind: 'user_bank', ...input })
		.onConflictDoNothing({
			target: accounts.appwriteBankId,
			where: sql`${accounts.appwriteBankId} is not null`,
		})
		.returning({ id: accounts.id })
	if (inserted) return inserted.id

	return selectOneId(db, eq(accounts.appwriteBankId, input.appwriteBankId))
}

/** Returns an internal account (clearing, fees) by code, creating it once. */
export async function findOrCreateInternalAccount(
	db: LedgerDb,
	input: {
		kind: Extract<LedgerAccountKind, 'clearing' | 'fees'>
		code: string
		name: string
	},
): Promise<string> {
	const [inserted] = await db
		.insert(accounts)
		.values(input)
		.onConflictDoNothing({
			target: accounts.code,
			where: sql`${accounts.code} is not null`,
		})
		.returning({ id: accounts.id })
	if (inserted) return inserted.id

	return selectOneId(db, eq(accounts.code, input.code))
}

async function selectOneId(db: LedgerDb, match: SQL): Promise<string> {
	const [existing] = await db
		.select({ id: accounts.id })
		.from(accounts)
		.where(match)
	if (!existing) throw new LedgerError('Ledger account could not be created')
	return existing.id
}
