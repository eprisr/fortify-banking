# ADR-016: Financial Core Isolation

**Date:** 2026-09-25
**Status:** Accepted
**Author:** Epris R.

---

## Context

`docs/security-backlog.md` scopes Phase 1 as three related moves: separate Appwrite's role down to what it's actually good at, stand up an isolated ledger database, and get credentials out of general-purpose document storage. [ADR-015](ADR-015_Ledger-vs-Balance-Authority.md) settled *what the ledger is for* (a shadow ledger, not the authority on actual fund balances); this ADR settles *where it lives and how it's built*, plus the credential-isolation half of Phase 1.

Two concrete facts about the current architecture motivate this:

1. **Appwrite's document model isn't built for double-entry bookkeeping.** A transfer's debit and credit postings have to commit together or not at all, with row-level locking so two concurrent transfers touching the same account can't race. Appwrite gives strong per-document guarantees, not multi-row relational transactions across a ledger's `accounts`/`postings` tables the way Postgres does natively.
2. **Plaid and Dwolla credentials currently live as plaintext fields in Appwrite documents.** `Bank.accessToken` (Plaid) and `Bank.fundingSourceUrl` (Dwolla) are stored as plain strings, readable by anything with API-key-level access to the database — no different in kind from any other profile field, despite being the actual keys to move a user's money. `.env` holds the app-wide credentials (`APPWRITE_KEY`, `PLAID_SECRET`, `DWOLLA_KEY`/`DWOLLA_SECRET`, `ACCOUNT_ID_ENCRYPTION_KEY`) with no vault, rotation, or access-scoping beyond whatever the hosting platform's env-var storage provides.

---

## Decision

### 1. Role separation — scoped, not a rip-and-replace

Appwrite keeps serving what it already does well: authentication, session cookies, MFA, user profile fields, and (unused today, available later) Realtime. **Existing `Bank`/`Transaction`/`Notification` collections are not migrated out of Appwrite in this phase** — that would be a much larger, separate migration with its own risk profile, and nothing in Phase 1 requires it. What changes now is narrower and lower-risk: the two *secret* fields inside `Bank` (below), and where all *new* ledger writes go from this point forward — into Postgres, not further into Appwrite.

### 2. Isolated ledger database — Neon Postgres

Chosen over Supabase (bundles auth/storage/realtime features Appwrite already covers — unneeded surface for what this ledger needs) and self-hosting (real, ongoing ops burden — backups, patching, uptime — for a portfolio project, a different kind of commitment than anything built so far). Neon: serverless Postgres, branch-per-environment (a real isolated dev/preview database without hand-rolling one), connection pooling built in, generous free tier. Matches the project's existing pattern of managed SaaS infrastructure over self-hosting (same reasoning as Appwrite over self-hosted auth/DB, [ADR-001](ADR-001_Appwrite-vs-Supabase-Firebase.md)).

**Schema — double-entry, append-only:**

- **`accounts`** — one row per ledger account (a user's Fortify-side checking/savings/Balance representation, plus internal accounts like a clearing/suspense account or a fees account). Not the same table as Appwrite's `Bank` — this is the ledger's own chart of accounts, referencing back to an Appwrite `Bank`/`User` id rather than duplicating their data.
- **`journal_entries`** — one row per financial event (a transfer, a fee). Groups the postings that make up that event.
- **`postings`** — the actual double-entry lines: each references a `journal_entry` and an `account`, with a signed amount. Postings belonging to one `journal_entry` must sum to zero — this is enforced, not just conventional.
- **No stored balance column, anywhere.** A balance is `SUM(postings)` for a given account, computed on read. Per ADR-015, this computed number is what Fortify *believes* happened — never what's presented to a user as "can you withdraw this," which stays sourced from Dwolla/Plaid directly.
- All writes happen inside one SQL transaction per journal entry, with row-level locks (`SELECT ... FOR UPDATE`) on every account a posting touches, so concurrent transfers can't race past each other mid-write.

### 3. Credential isolation — Doppler, plus reusing the existing encryption pattern

The backlog's "never store Plaid/Dwolla credentials in Appwrite" goal actually covers two different problems that need two different fixes:

**App-wide secrets → Doppler.** `APPWRITE_KEY`, `PLAID_SECRET`, `DWOLLA_KEY`/`DWOLLA_SECRET`, `ACCOUNT_ID_ENCRYPTION_KEY`, and the new `DATABASE_URL` (Neon) — a small, fixed set of application-level credentials, exactly what Doppler is designed for. Chosen over AWS Secrets Manager: nothing else in this stack touches AWS (Appwrite Cloud, Dwolla, Plaid, Checkout.com, Vercel-style hosting) — introducing it here would mean bootstrapping an AWS account and IAM setup solely for this, versus Doppler's zero-infrastructure SaaS model and its direct Vercel integration for syncing secrets into the existing deploy pipeline without changing how it works.

**Per-row secrets → application-level encryption, not a secrets vault.** `Bank.accessToken` and `Bank.fundingSourceUrl` are not application secrets in the sense Doppler is built for — they're per-user, per-linked-bank *data* that happens to be sensitive, potentially many rows per user. A secrets manager storing a handful of named app-wide keys isn't the right shape for that. The actual fix: encrypt these two fields at rest before writing to Appwrite, using the exact AES-256-GCM pattern `lib/server/encryption.ts` already implements for `shareableId` ([ADR-007](ADR-007_Security-Hardening.md)) — extended to cover these fields too, with the encryption key itself sourced from Doppler rather than a plain `.env` value. This closes the real gap (plaintext credentials sitting in a general-purpose document store) by reusing tested code, rather than inventing a second isolation mechanism for a problem `encryptId`/`decryptId` already solves.

**Local/CI workflow:** `doppler run -- npm run dev` (and the equivalent for `build`/`start`/`test`) injects secrets as environment variables at process start. `process.env.X` reads in the codebase don't change — only where the value physically comes from does. This is deliberately a low-risk migration: it touches the config-loading boundary, not application logic.

---

## Alternatives Considered

| Decision point | Chosen | Rejected alternative | Why |
|---|---|---|---|
| Ledger host | Neon | Supabase | Bundles auth/storage/realtime Appwrite already covers — more surface than this decision needs |
| Ledger host | Neon | Self-hosted (Docker/VPS) | Real ongoing ops burden (backups, patching, uptime) with no matching benefit at this project's scale |
| Secrets manager | Doppler | AWS Secrets Manager | No other part of the stack touches AWS; would mean standing up a whole new cloud account/IAM setup for one feature |
| Per-row credential isolation | Extend existing AES-256-GCM `encryption.ts` | A per-field entry in the secrets manager | Doppler is shaped for a small fixed set of app-wide keys, not many-rows-per-user secrets; reusing tested, already-audited code beats a second, novel mechanism |

---

## Consequences (Expected)

**Good:**

- The ledger gets real ACID guarantees and row-level locking a document store can't natively provide — the actual correctness property Phase 2's state machine ([ADR-017](ADR-017_State-Machine-Idempotency.md)) depends on.
- Closes a real, currently-live gap: Plaid/Dwolla credentials are plaintext in Appwrite documents today. Fixing it via the established encryption pattern is a small, well-understood change, not new machinery.
- Doppler's Vercel integration means production secret rotation doesn't require a deploy-pipeline change — it's a supported, direct sync.

**Bad / Trade-offs:**

- Two new external dependencies (Neon, Doppler) that didn't exist before, each requiring their own account/access setup — a real onboarding cost for anyone else standing this project up, not just a config change.
- `Bank`/`Transaction`/`Notification` staying in Appwrite while the ledger lives in Postgres means two data stores to reason about for anything touching money — a real complexity cost accepted deliberately rather than by default, to avoid a much larger, riskier single migration.

**Risks:**

- Doppler and Neon are both new vendor relationships for this project; an outage or account issue on either is a new single point of failure that didn't exist when everything ran through Appwrite alone. Acceptable for a portfolio project's demonstration purposes; would need real SLA scrutiny before any production use with real funds.

---

## Consequences (Actual)

*To be filled in after implementation.* Provisioning Neon and Doppler requires account creation outside this session's reach — both need to exist, with connection details available, before the schema/migration code and the `encryption.ts` extension can actually be built and run.

---

## References

- [ADR-001: Appwrite over Supabase and Firebase](ADR-001_Appwrite-vs-Supabase-Firebase.md)
- [ADR-007: Security hardening pass](ADR-007_Security-Hardening.md) — the AES-256-GCM pattern this ADR extends
- [ADR-015: Ledger vs. Balance Authority](ADR-015_Ledger-vs-Balance-Authority.md)
- `docs/security-backlog.md` — Phase 1
- [Neon documentation](https://neon.tech/docs)
- [Doppler documentation](https://docs.doppler.com)
