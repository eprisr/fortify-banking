# ADR-015: Ledger vs. Balance Authority

**Date:** 2026-09-24
**Status:** Accepted
**Author:** Epris R.

---

## Context

`docs/security-backlog.md` (2026-09-21, "Approved for build") scopes a dedicated PostgreSQL double-entry ledger as Phase 1 of the Stage 1.5 financial-core work, but leaves one question explicitly open and explicitly blocking: whether that ledger is the *source of truth* for user balances, or a *shadow ledger* mirroring Dwolla for audit purposes. The backlog doc is right to call this out as a prerequisite — the isolation work in Phase 1 (ADR-016), the state machine in Phase 2 (ADR-017), and the reconciliation job in Phase 4 (ADR-019) all read differently depending on the answer. Building the schema before deciding this risks building the wrong thing.

Fortify is not a licensed money transmitter and holds no independent authority to move or custody funds. It uses Dwolla specifically because Dwolla holds that authority — every ACH transfer, every balance, every regulatory obligation around holding customer money runs through Dwolla's license, not Fortify's. That fact constrains the answer before any technical trade-off gets weighed: Fortify's own database cannot be the legal or financial source of truth for money it never custodies.

---

## Decision

**Dwolla remains the single authoritative source for actual fund balances and transfer state.** The new PostgreSQL ledger is a shadow ledger — an internal, double-entry record of what Fortify's own systems understood to have happened, built for the application's own needs, checked against Dwolla's settlement data rather than competing with it.

This is not "Postgres is decorative." The shadow ledger has a real, specific job:

1. **It's a queryable ledger; Dwolla's API is a balance and a transfer list.** Dwolla doesn't expose a double-entry, account-structured history sliceable by category or date range. Stage 4 (Forecasting) needs exactly that shape of data, queried fast and locally — not a live Dwolla call per forecast calculation, which is both slow and the wrong data shape entirely.
2. **It's what Phase 4's reconciliation actually reconciles against.** "Nightly reconciliation" only means something if there are two independent records being compared. The ledger is "what we recorded in real time, from webhooks and API responses," checked nightly against Dwolla's settlement reports — drift between the two is the signal that catches a missed webhook, an unrecorded return, or a fee.
3. **It's where Phase 2's state machine and idempotency keys live.** "Did we already process this webhook," "did this client retry double-submit," "what state is this transfer in" — this is Fortify's own application-level bookkeeping. Dwolla doesn't track it on Fortify's behalf; it has to be recorded somewhere durable regardless of who owns the dollar figure.
4. **It's a durable audit trail independent of a third party's retention.** If Dwolla's API or dashboard is ever unavailable, or the processor changes, Fortify still has its own append-only record of every transaction it initiated.

### What this does not change

Live account balances shown to the user (checking/savings/credit via Plaid, Dwolla Balance via Dwolla's own balance endpoint) continue to be sourced from those providers directly, same as today — this ADR governs the *internal* ledger built in Phase 1 onward, not a replacement for how currently-displayed balances are fetched. The shadow ledger's postings describe Fortify-initiated transfers and their state, not a general mirror of every external account.

---

## Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Shadow ledger, Dwolla authoritative** *(chosen)* | Matches Fortify's actual legal/custodial position — it was never the money transmitter. No risk of Postgres and Dwolla disagreeing about what a user can actually withdraw. Still gets a real double-entry ledger for forecasting, state tracking, and audit. | Requires disciplined reconciliation (Phase 4) to keep the shadow ledger honest — an unreconciled shadow ledger is just a log nobody trusts. |
| **Postgres is the source of truth** | Matches how licensed money transmitters or bank-charter-backed platforms (Unit, Synapse-era BaaS stacks) architect it — full internal control over transaction semantics, holds, and corrections independent of the rail underneath. | Fortify isn't a licensed money transmitter; claiming internal authority over balances it doesn't legally custody creates a phantom-balance risk if Postgres and Dwolla ever diverge (a missed webhook, an out-of-band Dwolla action) — exactly the class of bug this entire security-backlog effort exists to prevent, not introduce. |

---

## Consequences (Expected)

**Good:**

- Phase 1 (ADR-016) now has an unambiguous mandate: build the ledger schema as a shadow of Dwolla-confirmed events, not as an independently-authoritative balance store. No design-time ambiguity about what a "correct" balance write looks like.
- Phase 4's reconciliation job has a real purpose from day one — it's not bolted on after the fact to a ledger that was already treated as ground truth.
- Keeps Fortify honest about what it actually is: a well-built application layer on top of a licensed rail, not a shadow bank. That's the more defensible engineering story, not a lesser one.

**Bad / Trade-offs:**

- Every balance-affecting feature needs to be clear about which number it's reading — a UI bug that reads the shadow ledger where it should read Dwolla live (or vice versa) is now a real category of mistake to guard against in code review, going forward.
- The shadow ledger only stays valuable if reconciliation (Phase 4) actually ships and actually runs — an unreconciled shadow ledger degrades into an unverified log over time.

**Risks:**

- None identified that change the decision; the phantom-balance risk under the rejected alternative was assessed as strictly worse than the reconciliation-discipline burden under this one.

---

## References

- `docs/security-backlog.md` — the architecture backlog this ADR unblocks
- [ADR-002: Dwolla over Stripe](ADR-002_Dwolla-vs-Stripe.md) — the original choice to build on Dwolla's licensed rail rather than a lower-level processor
- [ADR-003: Plaid + Dwolla pattern](ADR-003_Plaid-Dwolla-Pattern.md)
- `docs/PRD.md` §10 — Open Questions/Risks, where this question was originally logged
