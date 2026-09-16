# Fortify Banking — Roadmap

**Status:** Draft v1
**Last updated:** 2026-08-31

---

## How to read this

Same status vocabulary as the landing page and case study, so there's one shared language across product, docs, and marketing:

- 🟢 **Live** — built, tested, real (not simulated)
- 🟡 **In progress** — actively being built
- ⚪ **Planned** — scoped, not started

**A stage is not "done" because its page exists.** A stage is done when every sub-feature listed under it is Live, functioning end-to-end — that's the one bar, not a separate "ready" gate and a separate "done" gate. The page shell is infrastructure — necessary, but it's the container, not the content. Settings is the clearest example: the route/layout/nav can be 🟢 while everything it's meant to hold is still ⚪.

---

## Stage 1 — Settings (foundation)

**Depends on:** nothing. This is why it's first.

| Sub-feature | Status | Done means |
|---|---|---|
| Route, layout, nav | 🟢 Live | Settings is reachable and has a place for everything below |
| MFA setup | ⚪ Planned | User can enroll in MFA from Settings, independent of anything else — no Dwolla/Plaid dependency, can ship anytime |
| Verified Customer / KYC entry point | ⚪ Planned | A link/card exists in Settings, but the actual verification flow ships with Stage 3 — it's triggered from two places (Settings and first top-up attempt), built once |
| ADR-007 risk check | ⚪ Planned | MFA enrollment touches auth data — confirm every query goes through a server action, none reaches the client directly |

**Stage done when:** MFA setup is functional. The KYC entry point can stay a placeholder here — its real implementation is tracked under Stage 3, not duplicated.

---

## Stage 2 — Bill pay

**Depends on:** Stage 1 not required, but logically follows since it's the fastest remaining Phase 1 gap.

| Sub-feature | Status | Done means |
|---|---|---|
| Biller payee type | ⚪ Planned | Extends `PaymentTransferForm` (or forks from it) to support paying a biller, not just a linked account or contact |
| Bill pay confirmation | ⚪ Planned | Matches the existing no-back-button confirmation pattern |
| Test coverage | ⚪ Planned | Jest/RTL/MSW unit coverage + a Playwright e2e path, same bar as existing transfer flows |
| ADR-007 risk check | ⚪ Planned | New payee/biller data — confirm no client-side call bypasses a server action to reach raw account or payee records |

**Stage done when:** a user can select a biller, enter an amount, confirm, and see it reflected in transaction history — with the same test coverage the rest of the app has.

---

## Stage 3 — Top-up, withdrawal, verification

**Depends on:** Stage 1 (Settings must exist to house the verification entry point). Build these three together — they share the Verified Customer dependency.

| Sub-feature | Status | Done means |
|---|---|---|
| Verification flow (KYC) | ⚪ Planned | Real CIP data collection (name, DOB, address, SSN), triggered from Settings or first top-up attempt, results in Verified Customer status with Dwolla |
| Top-up — ACH pull | ⚪ Planned | Real transfer from linked bank into Dwolla Balance |
| Top-up — card funded | ⚪ Planned | Real, via Checkout.com, per the Definition of Done |
| Withdrawal — ACH out | ⚪ Planned | Real transfer from Dwolla Balance to linked bank |
| Withdrawal — Push-to-Card | ⚪ Planned | Real, instant, via Dwolla's native feature — no new vendor |
| Test coverage | ⚪ Planned | Same bar as above, plus explicit tests for the unverified→verified state transition |
| ADR-007 risk check | ⚪ Planned | Highest-sensitivity stage — verification records carry SSN/DOB/address. Confirm every new query on user, account, or verification data routes through a server action |

**Stage done when:** an unverified user can trigger verification from either entry point, become Verified, and successfully complete both top-up paths and both withdrawal paths — each producing a real balance change.

**Prerequisite before this stage can start:** Checkout.com sandbox credentials. This is a real blocker, not a formality — flagged back when the stack decisions were made.

---

## Stage 4 — Forecasting (the differentiator)

**Depends on:** ideally after Stage 2–3, since realistic transaction/balance data makes the forecast meaningful. Could start in parallel if mock data is good enough, but the honest version needs real activity to project against.

| Sub-feature | Status | Done means |
|---|---|---|
| `RecurringItemForm` | ⚪ Planned | User can manually add a recurring income/expense: name, frequency, amount, start/end date |
| `RecurringItemException` | ⚪ Planned | User can override a single occurrence's date/amount, or skip it, without editing the rule |
| `ForecastChart` | ⚪ Planned | Projects balance forward, highlights the danger point if it dips below threshold |
| `UpcomingBills` | ⚪ Planned | Lists known bills between now and next paycheck |
| Test coverage | ⚪ Planned | Especially the semi-monthly date-boundary logic — the one most likely to silently break |
| ADR-007 risk check | ⚪ Planned | Recurring items are tied to accounts — confirm no new query exposes another user's account or recurring-item data through relationship auto-expansion |

**Stage done when:** Maya can add her real recurring items, see a believable forward-projected balance, and get a clear signal before a low point catches her off guard. This is the feature the whole positioning statement rests on — it should get the most scrutiny before being called done, not the least.

---

## Stage 5 — Currency exchange (simulated)

**Depends on:** nothing functionally, can slot in anytime, lowest priority by design.

| Sub-feature | Status | Done means |
|---|---|---|
| `CurrencyExchangeForm` | ⚪ Planned | Simulated conversion with realistic mock rates, clearly labeled as a demo — not wired to Airwallex, per the Definition of Done |

**Stage done when:** the flow is complete and the simulated nature is honestly labeled in the UI itself, not just in the docs — same status-badge honesty principle as everywhere else.

---

## Maya's user journey, mapped to the roadmap

Walking through the app as the persona, in order, to sanity-check that the stages actually serve her, not just fill out a feature list.

1. **Discovery.** Maya finds Fortify, reads the landing page. Sees what's live vs. in progress — no surprises later.
2. **Guest exploration.** Tries the dashboard via guest mode before handing over any real information. *(Live — Guest Mode, ADR-006.)*
3. **Sign-up and account linking.** Creates an account, links her bank via Plaid. No KYC friction here — that's deferred by design. *(Live.)*
4. **Everyday check-in.** Opens the app the way she always did with her old bank app — checks the balance, glances at spending by category. *(Live.)*
5. **First transfer.** Moves money to savings, or pays a friend back. *(Live — `PaymentTransferForm`.)*
6. **Paying rent.** Uses bill pay instead of leaving the app. *(Stage 2.)*
7. **Wants to add a cushion.** Tries to top up before a big expense, hits the verification prompt, completes it in under a minute, tops up. *(Stage 3 — this is the moment the Settings/KYC/top-up decisions all connect.)*
8. **Needs cash same-day.** Withdraws via push-to-card instead of waiting on a standard transfer. *(Stage 3.)*
9. **The Thursday-night anxiety moment.** Checks the forecast instead of doing mental math. Sees Friday's paycheck will cover what's scheduled, with room to spare — or doesn't, and adjusts before it's a problem. *(Stage 4 — this is the actual product thesis. Everything before this stage is infrastructure for this moment.)*
10. **Edge case.** A friend visiting from abroad — she explores currency exchange once, sees it's a demo, understands why. *(Stage 5 — intentionally the least-visited step in her journey, which is why it's last.)*

Step 9 is the one to protect. If time pressure ever forces a cut, everything except Stage 4 is replaceable without breaking the story Fortify tells about itself. Stage 4 isn't.

---

## Open items being tracked

The risk-watch and ready-vs-done questions are resolved — folded into the stages above rather than sitting here as separate suggestions. Two remain genuinely open:

1. **Changelog.** One line per stage shipped, date + link to its blog post/ADR. Source the content from git history — `git log` for the raw commit trail since the last entry, or Claude Code, since it sits directly in the local repo with terminal access and can draft the entry from actual commits/diffs at the point a stage closes, rather than reconstructing it from memory later.
2. **Usage instrumentation.** Deliberately deferred — planned for launch once the major features (transfer, forecasting, etc.) are complete, not before.
