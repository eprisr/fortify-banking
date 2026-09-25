# ADR-019: Automated Reconciliation and Audit Trails (FinOps Layer)

**Date:** 2026-09-25
**Status:** Accepted
**Author:** Epris R.

---

## Context

Phase 4 of `docs/security-backlog.md`, and the piece that makes [ADR-015](ADR-015_Ledger-vs-Balance-Authority.md)'s whole premise real rather than aspirational. ADR-015 decided the Postgres ledger is a shadow of what Fortify *believes* happened, checked against Dwolla rather than trusted outright — but a shadow ledger nobody actually checks is just an unverified log. This ADR is that check.

Reconciliation only means something if there are two independent records to compare: the ledger's own view (written in real time from API responses and webhooks, per ADR-017) against Dwolla's and Checkout's actual settlement reports (the rail's own record of what cleared). A mismatch between the two — a missed webhook, an unrecorded return, an uncaptured fee — is exactly the signal this closes the loop on.

---

## Decision

### Nightly batch job

A scheduled job (Upstash's schedules, reusing the account provisioned in ADR-017, rather than introducing a fourth vendor for cron alone) pulls the prior day's settlement/transfer reports from Dwolla and, once Stage 3 wires it up, Checkout.com.

### Three-way matching

For every `settled` `journal_entry` in Postgres:
- Confirm a matching entry exists in the provider's settlement report with the same amount.
- Flag any provider-reported settlement with **no** corresponding `journal_entry` — a missed-webhook scenario. The missing entry is created retroactively *and* flagged as an exception, never silently backfilled without a trace — a ledger entry that appears with no record of how it arrived is worse than a gap that's visible.
- Isolate interchange and payment-processing fees into their own expense accounts (a new `account` type in ADR-016's chart of accounts) so gross customer amounts and net bank deposits reconcile as separate lines, not as a single fudged number.

### Exception queue

Unmatched records, timing-cutoff delays, and chargeback adjustments route into a **`reconciliation_exceptions`** table — never force-balanced automatically. For this project's actual scale, "review" means a query or a small admin view a developer checks, not a staffed operations workflow; the ADR is honest about that rather than describing tooling for a team that doesn't exist here.

---

## Alternatives Considered

| Decision point | Chosen | Rejected | Why |
|---|---|---|---|
| Reconciliation cadence | Nightly batch | Real-time, checked after every transfer | ACH settlement takes 1–3 business days — checking in real-time would just show "still pending" noise before anything has actually cleared. Nightly matches the actual settlement timing, not an idealized instant one |
| Scheduling | Upstash schedules | A dedicated cron service (e.g. a standalone cron host) | Reuses the Upstash account already provisioned in ADR-017 rather than a fourth vendor relationship for one nightly job |
| Unmatched records | Routed to an exception queue for manual review | Auto-corrected / force-balanced | Silently forcing numbers to match defeats the purpose of reconciling in the first place — a real discrepancy needs to stay visible until understood, not be papered over |

---

## Consequences (Expected)

**Good:**

- Makes the shadow-ledger decision (ADR-015) a checked fact instead of an assumption — drift gets caught within a day, not discovered months later during a dispute.
- Fee isolation gives a real, separately-auditable expense trail instead of a single blended number.
- No new vendor beyond what ADR-017 already introduces.

**Bad / Trade-offs:**

- A day of latency between a settlement discrepancy occurring and it being caught — accepted given ACH's own settlement timing already operates on a similar horizon.
- The exception queue is only as useful as someone actually looking at it; for a portfolio project, that's a manual, occasional check, not a monitored operational process — stated honestly rather than overstated.

**Risks:**

- None beyond the vendor risk already logged in ADR-016/017 for the shared Upstash account.

---

## Consequences (Actual)

*To be filled in after implementation.* Depends on ADR-016's ledger and ADR-017's state machine both existing first — there's nothing to reconcile until entries actually reach `settled`.

---

## References

- [ADR-015: Ledger vs. Balance Authority](ADR-015_Ledger-vs-Balance-Authority.md)
- [ADR-016: Financial Core Isolation](ADR-016_Financial-Core-Isolation.md)
- [ADR-017: State Machine, Idempotency & Async Processing](ADR-017_State-Machine-Idempotency.md)
- `docs/security-backlog.md` — Phase 4
- [Dwolla reporting](https://developers.dwolla.com/docs), [Checkout.com reporting](https://www.checkout.com/docs/reporting)
