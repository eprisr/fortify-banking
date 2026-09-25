# ADR-017: Transaction State Machine, Idempotency & Async Processing

**Date:** 2026-09-25
**Status:** Accepted
**Author:** Epris R.

---

## Context

Phase 2 of `docs/security-backlog.md`, building directly on [ADR-016](ADR-016_Financial-Core-Isolation.md)'s `journal_entries`/`postings` schema. Two concrete problems motivate it:

1. **A known, already-documented gap.** [ADR-014](ADR-014_Transfer-Rebuild.md)'s own "Consequences (Actual)" flagged this directly: `transferFunds` isn't idempotent across its two side effects (the real Dwolla transfer, then the transaction record write). If the Dwolla call succeeds but the record write fails, a naive retry re-calls `createDwollaTransfer` and can create a second real transfer. That ADR fixed the bug that was breaking every transfer; it explicitly didn't fix this — this ADR is what actually closes it.
2. **Dwolla transfers are asynchronous in reality, not just in name.** A transfer's Dwolla status changes over time (pending → processed/failed/cancelled) via webhooks, not synchronously when the create call returns. Treating a transfer as "done" the moment the API returns 201 misrepresents what's actually happened on the ACH rail — the money hasn't cleared yet.

---

## Decision

### State machine

- `journal_entries` gains a `status` column: `initiated → pending_clearing → settled | returned | failed`.
- Valid transitions are an explicit (from, to) lookup, checked in the same transaction as the write. No backward or skipped transitions — a `settled` entry cannot move back to `pending_clearing`.
- Every transition appends a row to a new **`journal_entry_transitions`** table (entry id, from, to, reason, timestamp) — append-only, matching the ledger's own philosophy, so "why did this change state" is always answerable without reconstructing it from application logs.
- `initiated → pending_clearing` happens synchronously right after Dwolla's transfer-create call returns a transfer URL. `pending_clearing → settled/returned/failed` is driven by Dwolla's webhook events, processed asynchronously (below) — not by the original request/response cycle.

### Idempotency

- Every client-initiated money-movement action generates a UUID idempotency key **on the client**, once per logical submission attempt — a retry of the same attempt reuses the key; a genuinely new transfer gets a new one.
- The server stores it as a **unique column on `journal_entries`**. The write path is an atomic upsert: attempt insert, and on a unique-constraint conflict, fetch and return the *existing* record instead of creating a new one or calling Dwolla a second time. This has to be a database constraint, not an application-level check-then-insert — two near-simultaneous retries can both pass a plain check before either has written anything.
- This is the concrete fix for the ADR-014 gap: a retry after a successful-Dwolla-call-but-failed-write now finds the existing `initiated`/`pending_clearing` entry by idempotency key and completes the write, rather than re-calling `createDwollaTransfer`.

### Async processing — Upstash (Redis + QStash)

- The Dwolla webhook handler becomes thin: verify the signature, enqueue via QStash, return 200 immediately. QStash retries delivery with backoff on failure, so a transient error in processing logic doesn't lose the event.
- The actual processing — applying the state transition, writing the transition audit row — happens in a Next.js API route that QStash calls. No separate persistent worker process to host: QStash's HTTP-delivery model *is* the worker, which fits this app's existing serverless hosting shape instead of fighting it.
- The same Upstash Redis instance backs [ADR-018](ADR-018_Fraud-Risk-Layer.md)'s velocity-limit counters — one vendor relationship covering both phases.

---

## Alternatives Considered

| Decision point | Chosen | Rejected | Why |
|---|---|---|---|
| Queue/worker model | Upstash QStash | Redis + BullMQ (as the backlog doc originally named) | BullMQ needs an always-on Node worker polling the queue — a second hosting model (a VM, or a Railway/Render/Fly.io service) next to the serverless Next.js app. QStash delivers via HTTP to an existing API route, no separate process to operate |
| Idempotency enforcement | DB unique constraint + upsert-or-fetch | Application-level check-then-insert | A plain check-then-insert has a race window two near-simultaneous retries can both pass through before either writes; only a DB constraint is atomic |
| State history | Append-only `journal_entry_transitions` table | A mutable `status` column with no history | Matches the ledger's append-only philosophy; makes "why did this change" answerable without log spelunking |

---

## Consequences (Expected)

**Good:**

- Closes the ADR-014 idempotency gap for real, not just as a documented risk.
- Webhook handlers stay thin and reliable — signature verification and a queue write, nothing that can time out or half-fail mid-request.
- One Upstash account serves both this ADR and ADR-018's rate limiting.

**Bad / Trade-offs:**

- The client (the transfer form, and any future money-movement form) now has to generate and persist an idempotency key per submission attempt — a real, if small, change to existing form state management.
- A third external vendor relationship (after Neon, Doppler) before any of Phase 1 is even provisioned.

**Risks:**

- None beyond the general new-vendor risk already logged in ADR-016.

---

## Consequences (Actual)

*To be filled in after implementation.* Depends on ADR-016's ledger existing first — `journal_entries` needs to exist before it can gain a `status` column — and on an Upstash account and QStash endpoint being provisioned.

---

## References

- [ADR-014: Transfer Rebuild](ADR-014_Transfer-Rebuild.md) — the idempotency gap this ADR closes
- [ADR-015: Ledger vs. Balance Authority](ADR-015_Ledger-vs-Balance-Authority.md)
- [ADR-016: Financial Core Isolation](ADR-016_Financial-Core-Isolation.md)
- `docs/security-backlog.md` — Phase 2
- [Dwolla webhooks](https://developers.dwolla.com/docs/balance/webhooks)
- [Upstash QStash documentation](https://upstash.com/docs/qstash)
