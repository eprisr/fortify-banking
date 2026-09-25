# ADR-018: Pre-Transaction Risk Controls (Fraud Layer)

**Date:** 2026-09-25
**Status:** Accepted
**Author:** Epris R.

---

## Context

Phase 3 of `docs/security-backlog.md`. Every ACH debit carries real return risk — NSF, unauthorized-return, closed-account codes (R01/R02/R10 among them) — that a naive "submit and hope" transfer flow has no defense against. This risk layer sits *before* [ADR-017](ADR-017_State-Machine-Idempotency.md)'s state machine even begins: a rejected attempt should never become an `initiated` journal entry at all, since nothing was actually set in motion.

Two tools close this, and neither requires standing up new infrastructure from scratch: Plaid Signal is already reachable from the existing Plaid integration, and Upstash Redis — provisioned in ADR-017 for QStash's backing store — is exactly the right shape for velocity counters.

---

## Decision

### Plaid Signal risk scoring

Every Dwolla ACH debit is scored via Plaid Signal before submission. *(Confirmed available in the current Plaid sandbox — no partnership gate, unlike Wise/Currencycloud.)* A score above the configured risk threshold rejects the attempt before any Dwolla call is made and before any `journal_entry` is created — there's nothing to roll back because nothing was started.

Rejected attempts are still recorded — in a lightweight **`risk_decisions`** table (user, attempted amount, score, decision, timestamp), separate from `journal_entries` since they never became real transactions. This preserves audit visibility into rejected patterns without polluting the ledger with entries for money that never moved.

### Velocity limits

Application-level limits, enforced per user (aggregated across every linked account they have — routing the same transfer pattern through multiple accounts to dodge a single-account limit is exactly the pattern these limits exist to catch):

- Hourly, daily, and rolling-30-day transfer volume caps.
- A cooling period on newly-verified accounts (no large P2P transfers in the first N days after Verified Customer status is granted).

Counters live in **Upstash Redis** (the same instance ADR-017 provisions for QStash) using a standard sliding-window/TTL counter pattern — Redis's atomic increment-and-expire is exactly the primitive this needs, and reusing the existing Upstash account avoids a fourth vendor relationship. Thresholds are hardcoded, documented constants for this project's scope — no admin-configurable limits system, since there's no operations team sizing them dynamically.

---

## Alternatives Considered

| Decision point | Chosen | Rejected | Why |
|---|---|---|---|
| Fraud/NSF scoring | Plaid Signal | Build in-house scoring | Already reachable with the existing Plaid integration and confirmed available in sandbox — no new vendor, no new contract, no model to build and maintain from scratch |
| Velocity counter storage | Upstash Redis | Postgres counters | Redis's atomic increment/expire is the right primitive for sliding-window rate limiting; Postgres would need extra logic to achieve the same atomicity. Also avoids a fourth vendor since Upstash is already provisioned in ADR-017 |
| Rejected-attempt handling | Logged to a dedicated `risk_decisions` table | Silently dropped, or logged only to application logs | A rejected attempt is a real fraud-signal data point worth keeping queryable, without treating it as a transaction that ever moved money |

---

## Consequences (Expected)

**Good:**

- Closes real ACH return risk before submission, not after a return arrives days later.
- Zero new vendor cost or integration for the scoring piece — it's an existing Plaid capability.
- Rejected-attempt visibility (`risk_decisions`) gives a real signal for tuning thresholds later, rather than flying blind.

**Bad / Trade-offs:**

- Hardcoded thresholds mean tuning them requires a code change and deploy, not a config toggle — an accepted trade-off given this project has no operations team to justify a dynamic limits system.
- Adds a Plaid Signal call to the critical path of every transfer attempt — a small latency cost in exchange for the risk reduction.

**Risks:**

- False positives (a legitimate transfer scored as high-risk) are a real UX cost or a real fraud loss, in opposite directions of the same trade-off — worth real threshold tuning once there's actual transfer volume to observe, not just a launch-day guess.

---

## Consequences (Actual)

*To be filled in after implementation.* Depends on ADR-017's Upstash Redis instance being provisioned first (shared counters), and doesn't block on ADR-016's ledger beyond needing `journal_entries` to not exist yet for rejected attempts, which is exactly the point of the separate `risk_decisions` table.

---

## References

- [ADR-016: Financial Core Isolation](ADR-016_Financial-Core-Isolation.md)
- [ADR-017: State Machine, Idempotency & Async Processing](ADR-017_State-Machine-Idempotency.md)
- `docs/security-backlog.md` — Phase 3
- [Plaid Signal documentation](https://plaid.com/docs/signal/)
