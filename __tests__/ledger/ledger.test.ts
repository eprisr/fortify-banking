/**
 * @jest-environment node
 *
 * Shadow ledger (ADR-016 §2) against a real Postgres. Row locks, deferred
 * constraint triggers and append-only rules are exactly what a mock would
 * fake, so these run against the database itself.
 *
 * Needs TEST_DATABASE_URL pointing at a disposable database: every run drops
 * and rebuilds its schema from the real migrations in drizzle/. CI provides
 * one (a Postgres service in .github/workflows/ci.yml) and fails if it's
 * missing; locally the suite is skipped with a notice when it isn't set.
 */
import path from 'node:path'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import type { LedgerDb } from '@/lib/server/ledger/db'
import * as schema from '@/lib/server/ledger/schema'
import {
	assertBalanced,
	findOrCreateBankAccount,
	findOrCreateInternalAccount,
	getAccountBalanceCents,
	LedgerError,
	postJournalEntry,
} from '@/lib/server/ledger/ledger'

const url = process.env.TEST_DATABASE_URL

if (!url && process.env.CI) {
	throw new Error('TEST_DATABASE_URL must be set in CI for the ledger tests')
}
if (!url) {
	console.warn('Skipping ledger tests: TEST_DATABASE_URL is not set')
}

const describeDb = url ? describe : describe.skip

describeDb('shadow ledger (Postgres)', () => {
	let pool: Pool
	let db: LedgerDb
	let alice: string
	let bob: string
	let clearing: string

	beforeAll(async () => {
		pool = new Pool({ connectionString: url, max: 5 })
		db = drizzle(pool, { schema })
		await db.execute(sql`drop schema if exists public cascade`)
		await db.execute(sql`drop schema if exists drizzle cascade`)
		await db.execute(sql`create schema public`)
		await migrate(db, {
			migrationsFolder: path.join(process.cwd(), 'drizzle'),
		})

		alice = await findOrCreateBankAccount(db, {
			appwriteUserId: 'user-alice',
			appwriteBankId: 'bank-alice',
			name: 'Alice checking',
		})
		bob = await findOrCreateBankAccount(db, {
			appwriteUserId: 'user-bob',
			appwriteBankId: 'bank-bob',
			name: 'Bob checking',
		})
		clearing = await findOrCreateInternalAccount(db, {
			kind: 'clearing',
			code: 'clearing:dwolla',
			name: 'Dwolla clearing',
		})
	})

	afterAll(async () => {
		await pool?.end()
	})

	const transfer = (from: string, to: string, cents: number) =>
		postJournalEntry(db, {
			description: `Transfer ${cents}`,
			postings: [
				{ accountId: to, amountCents: cents },
				{ accountId: from, amountCents: -cents },
			],
		})

	describe('writes', () => {
		it('posts a balanced entry and derives balances from postings', async () => {
			const before = {
				alice: await getAccountBalanceCents(db, alice),
				bob: await getAccountBalanceCents(db, bob),
			}

			await transfer(alice, bob, 2500)

			expect(await getAccountBalanceCents(db, alice)).toBe(before.alice - 2500)
			expect(await getAccountBalanceCents(db, bob)).toBe(before.bob + 2500)
		})

		it('keeps every entry summing to zero across many writes', async () => {
			for (const cents of [1, 99, 10_000, 123_456]) {
				await transfer(bob, clearing, cents)
			}
			const { rows } = await db.execute<{ unbalanced: string }>(sql`
				select count(*) as unbalanced from (
					select journal_entry_id from postings
					group by journal_entry_id having sum(amount_cents) <> 0
				) t`)
			expect(Number(rows[0].unbalanced)).toBe(0)
		})

		it('returns 0 for an account with no postings', async () => {
			const fresh = await findOrCreateBankAccount(db, {
				appwriteUserId: 'user-carol',
				appwriteBankId: 'bank-carol',
				name: 'Carol savings',
			})
			expect(await getAccountBalanceCents(db, fresh)).toBe(0)
		})

		it('writes nothing when an account is unknown', async () => {
			const entriesBefore = await db.$count(schema.journalEntries)
			await expect(
				transfer(alice, '00000000-0000-0000-0000-000000000000', 100),
			).rejects.toThrow(LedgerError)
			expect(await db.$count(schema.journalEntries)).toBe(entriesBefore)
		})
	})

	describe('app-level validation (clear errors before the database)', () => {
		it.each([
			['fewer than two postings', [{ accountId: 'a', amountCents: 0 }]],
			[
				'postings that do not sum to zero',
				[
					{ accountId: 'a', amountCents: 100 },
					{ accountId: 'b', amountCents: -99 },
				],
			],
			[
				'fractional cents',
				[
					{ accountId: 'a', amountCents: 10.5 },
					{ accountId: 'b', amountCents: -10.5 },
				],
			],
			[
				'a zero posting',
				[
					{ accountId: 'a', amountCents: 0 },
					{ accountId: 'b', amountCents: 0 },
				],
			],
		])('rejects %s', (_label, postingsInput) => {
			expect(() =>
				assertBalanced({ description: 'x', postings: postingsInput }),
			).toThrow(LedgerError)
		})
	})

	describe('database-enforced integrity (holds even if app code is wrong)', () => {
		it('rejects an unbalanced entry at commit', async () => {
			await expect(
				db.transaction(async (tx) => {
					const [entry] = await tx
						.insert(schema.journalEntries)
						.values({ description: 'unbalanced' })
						.returning()
					await tx.insert(schema.postings).values([
						{ journalEntryId: entry.id, accountId: alice, amountCents: 100 },
						{ journalEntryId: entry.id, accountId: bob, amountCents: -99 },
					])
				}),
			).rejects.toMatchObject({ cause: { code: '23514' } })
		})

		it('rejects an entry with no postings at commit', async () => {
			await expect(
				db.insert(schema.journalEntries).values({ description: 'empty' }),
			).rejects.toMatchObject({ cause: { code: '23514' } })
		})

		it('rejects updating or deleting a posting', async () => {
			await transfer(alice, bob, 700)
			const [posting] = await db.select().from(schema.postings).limit(1)

			await expect(
				db.execute(
					sql`update postings set amount_cents = 1 where id = ${posting.id}`,
				),
			).rejects.toMatchObject({ cause: { code: '23001' } })
			await expect(
				db.execute(sql`delete from postings where id = ${posting.id}`),
			).rejects.toMatchObject({ cause: { code: '23001' } })
			await expect(db.execute(sql`truncate postings`)).rejects.toMatchObject({
				cause: { code: '23001' },
			})
		})

		it('rejects deleting a journal entry but allows updating it (ADR-017 status)', async () => {
			const id = await transfer(bob, alice, 300)

			await expect(
				db.execute(sql`delete from journal_entries where id = ${id}`),
			).rejects.toMatchObject({ cause: { code: '23001' } })
			await expect(
				db.execute(
					sql`update journal_entries set description = 'renamed' where id = ${id}`,
				),
			).resolves.toBeDefined()
		})

		it('rejects a zero-amount posting', async () => {
			await expect(
				db.execute(sql`
					insert into postings (journal_entry_id, account_id, amount_cents)
					values (gen_random_uuid(), ${alice}, 0)`),
			).rejects.toMatchObject({ cause: { code: '23514' } })
		})
	})

	describe('concurrency', () => {
		it('serializes writes behind a held account lock', async () => {
			const order: string[] = []
			let releaseLock!: () => void
			const lockHeld = new Promise<void>((resolve) => (releaseLock = resolve))
			let lockAcquired!: () => void
			const acquired = new Promise<void>((resolve) => (lockAcquired = resolve))

			// FOR NO KEY UPDATE conflicts with postJournalEntry's FOR UPDATE but
			// not with the FOR KEY SHARE lock a posting's foreign key takes, so
			// only postJournalEntry's own lock can make the waiter wait. (With
			// FOR UPDATE here, the FK check alone would block it and this test
			// would pass even if the ledger never locked anything.)
			const holder = db.transaction(async (tx) => {
				await tx.execute(
					sql`select id from accounts where id = ${alice} for no key update`,
				)
				lockAcquired()
				await lockHeld
				order.push('holder committed')
			})
			await acquired

			const waiter = transfer(alice, bob, 50).then(() =>
				order.push('waiter committed'),
			)
			await new Promise((r) => setTimeout(r, 200))
			const waiterWasBlocked = order.length === 0

			// Release before asserting, so a failure can't leave the lock held
			// and hang the suite.
			releaseLock()
			await Promise.all([holder, waiter])

			expect(waiterWasBlocked).toBe(true)
			expect(order).toEqual(['holder committed', 'waiter committed'])
		})

		it('does not deadlock or lose writes when entries cross the same accounts', async () => {
			const before = {
				alice: await getAccountBalanceCents(db, alice),
				bob: await getAccountBalanceCents(db, bob),
			}

			// Opposite directions lock the same two accounts. Sorted lock
			// order means they queue rather than deadlock.
			await Promise.all(
				Array.from({ length: 20 }, (_, i) =>
					i % 2 ? transfer(alice, bob, 10) : transfer(bob, alice, 7),
				),
			)

			expect(await getAccountBalanceCents(db, alice)).toBe(before.alice - 30)
			expect(await getAccountBalanceCents(db, bob)).toBe(before.bob + 30)
		})

		it('creates exactly one ledger account per bank under concurrent first use', async () => {
			const ids = await Promise.all(
				Array.from({ length: 8 }, () =>
					findOrCreateBankAccount(db, {
						appwriteUserId: 'user-dave',
						appwriteBankId: 'bank-dave',
						name: 'Dave checking',
					}),
				),
			)
			expect(new Set(ids).size).toBe(1)
		})
	})
})
