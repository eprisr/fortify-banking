# Fortify Banking — Security & Architecture Backlog

**Status:** Approved for build, folded into Stage 1.5 on the roadmap
**Last updated:** 2026-09-21
**Referenced from:** `fortify-checklist.md`'s Security section

---

## Why this exists

A resilient financial architecture separates user identity from the transaction ledger, treats all external payment rails as fundamentally asynchronous, and assumes network drops and settlement discrepancies will occur. This document is the target architecture that gets Fortify from an MVP sandbox to something that behaves like a production financial system, and it's real build work, not a documented-only item like Airwallex.

**Open question, not yet decided:** how the new Postgres ledger relates to Dwolla's own Balance. Two real options, and this needs to be settled before Phase 1 is built since it changes what the ledger is actually for:

1. **Postgres is the source of truth** — Fortify computes and owns balances internally from ledger postings; Dwolla Balance becomes just the funding rail underneath it, not what the app displays or trusts.
2. **Postgres mirrors Dwolla for audit** — Dwolla Balance stays authoritative for actual funds; Postgres is an internal shadow ledger for reconciliation, dispute resolution, and catching drift, not the number shown to users.

This should get its own ADR before Phase 1 starts, since it determines whether the double-entry ledger is load-bearing or advisory.

---

## Phase 1 — Isolate the Financial Core (Data Architecture)

**→ ADR-015** *(numbering assumes ADR-014 is still the most recent in the repo — confirm before filing, since this session doesn't have a live view of `docs/decisions/`)*

- **Role separation.** Keep Appwrite dedicated to customer authentication, profile data, session handling, and frontend Realtime WebSocket subscriptions.
- **Isolated ledger database.** Deploy a dedicated PostgreSQL instance exclusively for the double-entry ledger. All financial writes must execute inside atomic SQL transactions with row-level locks, ensuring user balances remain strictly computed derivations of past postings rather than mutable numbers.
- **Secret management.** Never store Plaid access tokens, Dwolla OAuth credentials, or private keys inside Appwrite document collections. Keep them in an encrypted secrets manager (Doppler or AWS Secrets Manager), accessible only by trusted backend workers.

## Phase 2 — Deterministic State Machine and Event Management (Integration Architecture)

**→ ADR-016**

- **Strict state transition logic.** Model every transaction as an explicit finite state machine (`initiated`, `pending_clearing`, `settled`, `returned`, `failed`). Prevent any worker or process from applying backward or out-of-order state transitions.
- **Universal idempotency.** Generate unique idempotency keys for every client action and propagate them downstream to Dwolla transfer requests and Checkout charges. If a mobile client retries a network request mid-drop, the backend returns the existing transaction record rather than initiating a duplicate charge.
- **Decoupled queue workers.** Process external events via a dedicated queue (Redis with BullMQ) or scheduled polling workers. If webhooks stay at the network edge, keep their handlers thin: verify the cryptographic signature, write the payload to a persistent queue, and return an immediate HTTP 200.

## Phase 3 — Pre-Transaction Risk Controls (Fraud Layer)

**→ ADR-017**

- **Automated risk scoring.** Gate every Dwolla ACH debit behind Plaid Signal. Evaluate risk tiers and NSF probabilities programmatically, rejecting or holding high-risk transfers before submitting them to NACHA rails. *(Confirmed available in the existing Plaid sandbox — no partnership gate, unlike Wise/Currencycloud.)*
- **Platform velocity limits.** Enforce application-level velocity rules (hourly, daily, rolling 30-day) alongside new-account cooling periods to mitigate exposure to ACH return codes R01, R02, and R10.

## Phase 4 — Automated Reconciliation and Audit Trails (FinOps Layer)

**→ ADR-018**

- **Nightly report ingestion.** Schedule batch jobs to pull daily settlement and fee summaries via Dwolla and Checkout reporting APIs.
- **Multi-pass matching.** Reconcile gross customer payments against net bank deposits by isolating interchange and payment processing fees into explicit expense accounts.
- **Exception queues.** Route unmatched records, cutoff timing delays, and chargeback adjustments into an internal exception queue for operational review — automated systems never force balances to match artificially.

---

## Stack transition

| Architectural layer | Current MVP stack | Target architecture | Primary role & change |
|---|---|---|---|
| Ledger & accounting | Appwrite Databases | PostgreSQL | Offloads balance tracking from document storage to an immutable, append-only double-entry ledger with row-level locks and ACID guarantees |
| Auth & client sync | Appwrite (all-in-one) | Appwrite (scoped) | Retained strictly for user authentication, profile data, session management, and client WebSocket events via Appwrite Realtime |
| Async processing | Appwrite Functions | Redis + BullMQ (or background cron) | Replaces public HTTP webhooks with background polling or an edge queue sink, enforcing idempotency and safe state machine transitions |
| ACH rail | Dwolla | Dwolla | Unchanged for ACH payment initiation, but transfers are now gated by pre-flight risk checks and managed by state machine logic |
| Account linking | Plaid (Link & Auth) | Plaid (Link & Auth) | Unchanged for instant bank account credentialing and processor token generation |
| Risk & fraud | None | Plaid Signal | Added to the existing Plaid integration to score NSF probabilities and unauthorized return risk before submitting transfers to Dwolla |
| Card acquiring | Checkout.com | Checkout.com | Retained purely for processing incoming card transactions, card issuing stays out of scope |
| Financial reconciliation | None | Custom FinOps worker in PostgreSQL | Nightly batch jobs ingesting Dwolla and Checkout settlement files to run 3-way matching across ledger accounts, gross amounts, and net processor fees |
| Secret management | Local config / Appwrite vars | Doppler or AWS Secrets Manager | Isolates private keys, Plaid credentials, and Dwolla OAuth secrets away from frontend and general application containers |

### Key additions to provision

- **PostgreSQL** — houses the financial accounts, journal entries, and postings tables. Sole source of truth for user balances (pending the open question above), fully separated from Appwrite document collections.
- **Redis and BullMQ** — manages scheduled jobs, status polling, and retry logic, preventing dropped transfers or duplicate database writes during provider outages.
- **Plaid Signal** — adds predictive ACH return scoring without a new vendor, contract, or separate client SDK.
- **Secrets manager** — centralizes and encrypts access tokens, database connection strings, and webhook signing secrets outside application repositories.

### Scope adjustments to existing tools

- **Appwrite** — shifts from primary database for everything to client identity, authentication, and real-time frontend notifications only.
- **Dwolla** — remains the ACH rail, but every debit request is now preceded by a Plaid Signal check and recorded in the PostgreSQL ledger before execution.
- **Checkout.com** — stays focused strictly on payment acceptance, card issuing workflows deferred (unchanged from the existing Definition of Done).

### Deferred items

- **Specialized KYC and document verification** — left open, relying on Dwolla's baseline customer verification (the Stage 1.5 verification flow) until formal identity requirements are defined.
- **Card issuing infrastructure** — excluded from the roadmap, keeping spending mechanics focused on ACH transfers and direct disbursements. Consistent with the existing Definition of Done's ATM cash withdrawal exclusion.

---

## Roadmap and PRD touchpoints

- **Roadmap:** folded into Stage 1.5 (Transfers fix + overhaul) rather than a new stage — this infrastructure is what transfers actually run on, so fixing transfers without it would mean redoing the work once this lands anyway.
- **PRD:** this expands §6 (Definition of Done) and §7 (Account & Money Movement Model) beyond their current MVP-sandbox framing. Updated separately in `prd.md`.