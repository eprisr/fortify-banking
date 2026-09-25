# Fortify Banking — Product Requirements Document

**Status:** Draft v1
**Owner:** Epris Richardson
**Last updated:** 2026-09-21

---

## 1. Positioning

Fortify is a cash flow app that makes financial clarity feel like a premium experience, not a utility.

**Reference points:** the approachability of Ally, the everyday-money focus of SoFi, filtered through the visual restraint and confidence of a Goldman Sachs-grade brand. The goal isn't to look expensive for its own sake — it's to make the *user* feel like their financial life deserves that level of care, regardless of their account balance. Financial freedom made to feel attainable, not aspirational-only.

**One-line pitch:** Fortify shows you not just where your money is, but where it's headed.

**Why not just use Rocket Money, Monarch, or YNAB?** These are insight overlays — read-only connections to accounts held elsewhere, telling you things about money they can't touch. Their money-movement is narrow (e.g. Rocket Money's Smart Savings auto-transfers into a separate goal account) and their "bill" features are negotiation and cancellation, not payment execution. The gap this leaves: insight always ends at a notification, because the app isn't where the money lives.

Fortify closes that gap by being Dwolla-backed rather than read-only. The forecast isn't just a chart warning about Thursday — it's the same surface where a transfer to cover it happens. Insight and action live in one place, one tap apart, instead of two separate apps. This is also a values contrast, not just a technical one: the category leans on upsells (credit monitoring, debt products, pay-what-you-want pricing) that work against calm clarity — directly at odds with Fortify's "financial freedom made attainable" positioning.

---

## 2. Target User

**Single primary persona — Maya, 29.** Deliberately one persona, not a segmented set: it keeps scope honest, and every feature decision can be checked against one real anxiety instead of averaged across several.

- Marketing coordinator, W-2 income, direct deposit every two weeks. Not underbanked, not high earning — comfortably ordinary. This is the "every economic class" framing from the positioning made concrete.
- Checks her balance defensively before non-routine purchases — not because she's broke, but because she doesn't trust the number to account for what's about to happen.
- Her real fear isn't "will I go negative" — it's a forgotten subscription or annual fee colliding with something she already knew about (rent), unnoticed until it's too late.
- Has savings, but doesn't actively track it against upcoming obligations — it sits as a vague cushion she hopes is enough.
- **Trust, for her, means a number she doesn't have to double-check against her own mental math.**

This maps directly onto the forecasting/runway feature (§4) — Maya is exactly who's asking "can I afford this before Friday." Use this as the filter for future feature decisions: if it doesn't reduce Maya's mental math, it's probably not v1.

*A secondary persona (e.g. a surplus-optimizing saver) is explicitly out of scope for v1 — noted here so it's a deliberate exclusion, not an oversight, if it comes up later.*

---

## 3. Problem Statement

Most banking apps show *what happened* (transaction history) or *what's true right now* (balance). Almost none show *what's about to happen*. Users are left doing the math in their head — "can I afford this before Friday's paycheck?" — which is exactly the anxiety a high-end product should remove.

---

## 4. Primary Differentiator: Cash Flow Forecasting / Runway

This is the feature Fortify should be known for. It's what separates "another banking UI" from "a product with a point of view."

**Core concept:** Instead of just a balance, show a projected trajectory — where the balance is headed over the next 7/14/30 days based on known recurring income and expenses, surfaced as a simple, confident visual (not a spreadsheet).

**Data model (rule + exception, not flat transactions):**
- `RecurringItem`: name, type (income/expense), frequency (weekly, bi-weekly, semi-monthly, four-weekly, monthly, bi-monthly, quarterly, half-yearly, yearly), amount, start date, end date, active flag, and which account it's tied to.
- `RecurringException`: links to a `RecurringItem`, the specific occurrence date it overrides, and an optional replacement date/amount/skip flag — for one-off deviations (a bill that shifts a few days, a paycheck that varies) without altering the underlying rule.
- Occurrence generation walks forward from start date using frequency-specific date math (semi-monthly in particular needs explicit first-half/second-half-of-month handling, not naive `+15 days`), then applies any matching exception.

**Account scope:** the forecast blends checking, savings, credit, and Dwolla Balance into one projected line — every schedule-driven account the user has linked, not checking alone. Investment accounts are excluded from the forecast calculation entirely, since they're market-driven rather than schedule-driven and blending them in would misrepresent what the forecast is actually predicting. If an investment account is linked, it shows as a separate net-worth figure, never folded into the runway number.

**V1 scope for this feature:**
- **Manually defined recurring items**, not auto-detected from transaction history — user enters name, frequency, amount, start/end date, and account directly (mirrors the spreadsheet model that already solved this reliably). This is a meaningfully simpler and more trustworthy v1 than pattern-detection.
- **Multi-account aggregation** across checking, savings, credit, and Balance, per the account scope above — this is v1, not a later phase.
- Project balance forward on a simple line, with a highlighted "danger point" if it's projected to dip below a user-set (or smart-default) threshold
- Surface upcoming known bills between now and the next paycheck, so a low point isn't a surprise
- Support per-occurrence exceptions (date/amount override, or skip) so one irregular bill doesn't require editing the whole recurring rule

**Explicitly NOT v1:**
- Auto-detection of recurring items from transaction history (candidate for a later "smart suggestion" layer once manual entry is solid)
- "What-if" scenario modeling (e.g., "what if I spend $200 today")
- Forecasting for investment/market-driven balances (they're shown, never projected)

This feature is intentionally the hardest thing on the roadmap and should be scheduled *after* the transactional MVP is solid — it depends on having real (or realistic mock) transaction data to detect patterns against.

---

## 5. Feature Set & Phasing

Ranked by the priority you set, grouped into what's real (Dwolla-backed) vs. simulated (documented future integration).

### Phase 1 — MVP (real, Dwolla-backed)
| Feature | Notes |
|---|---|
| Transfers between own accounts | Same-bank or cross-bank via linked funding sources |
| Transfers to others | Requires recipient to be an onboarded Dwolla customer with a linked account. Also requires the *sender* to be a Verified Customer — Dwolla won't move money between two unverified customers, so P2P transfer is what actually forces verification earlier than originally planned (see §7). |
| Bill pay | Functionally a transfer to a biller's linked account |

### Phase 2 — Real, but needs its own design/data thinking
| Feature | Notes |
|---|---|
| Account top-ups | Two paths, both real: (a) ACH pull from an external linked bank — Dwolla-backed, same mechanism as transfers; (b) card-funded top-up via **Checkout.com** — real, not simulated, since Dwolla already routes through Checkout.com for Push to Card, so this is one vendor relationship covering both directions rather than a second integration. |
| Withdrawals | Three paths, one better than originally scoped: (a) ACH-out to a linked external bank — real, Dwolla-backed; (b) **instant payout to debit card via Dwolla's native Push to Card — real, no new vendor required, upgrade this to Phase 1/2 real scope**; (c) ATM cash withdrawal — needs card issuing infra (Marqeta/Unit/Lithic), still out of scope. **Recommend building (a) and (b) as real, documenting (c) only.** |

### Phase 3 — Simulated, documented as future integration
| Feature | Production path (documented in ADR, not built) |
|---|---|
| Currency exchange | **Airwallex** — self-serve sandbox (instant signup, no partnership required), full API/Postman/MCP dev tooling. Wise Platform and Currencycloud both require a sales/partnership relationship before sandbox access is granted, making them impractical for this project. |

---

---

## 6. Definition of Done (MVP)

"Done" for this project means: the MVP, built as far as the current stack — including Checkout.com — genuinely allows. Not full production scope, and not blocked on anything that would require a real business/partnership relationship to access (Wise, Currencycloud, card issuing).

**Real (built, not simulated):**
- Phase 1 — transfers between own accounts, transfers to others, bill pay
- Phase 2 — account top-ups (both ACH pull and card-funded via Checkout.com) and withdrawals (both ACH-out and Push-to-Card)
- Forecasting — manual recurring items + exceptions across checking, savings, credit, and Balance, projected balance, danger-point highlight, upcoming bills
- Settings — contextual Verified Customer/KYC, contextual MFA
- **Financial core architecture** — an isolated PostgreSQL double-entry ledger (a shadow ledger — Dwolla stays authoritative for actual fund balances, per [ADR-015](decisions/ADR-015_Ledger-vs-Balance-Authority.md)), idempotency keys and a deterministic transaction state machine, decoupled queue workers (Redis/BullMQ) for external events, Plaid Signal risk scoring ahead of every ACH debit, nightly reconciliation against Dwolla/Checkout settlement reports, and secrets (Plaid/Dwolla credentials, keys) moved out of Appwrite into a dedicated secrets manager. Full detail in `docs/security-backlog.md`; folded into Stage 1.5 on the roadmap rather than a separate stage, since transfers are what this architecture actually governs.

**Simulated / documented only — the actual stack boundary, not a scope cut:**
- Currency exchange — Airwallex named as the production path, not built, since it's the one feature with no natural pairing to the existing Dwolla-centered stack (unlike Checkout.com, which already threads through Push-to-Card)
- ATM cash withdrawal — needs card issuing (Marqeta/Unit/Lithic), out of scope entirely, not even simulated

**Also required to call this done:**
- Case study page live
- Deployed and linked (already true)

This is the finish line. Storybook/style guide, auto-detected recurring items, "what-if" scenario modeling, and anything else marked "Explicitly NOT v1" elsewhere in this document stay as documented roadmap, not blockers to done.

## 7. Account & Money Movement Model

**Decision: Fortify uses the Dwolla Balance (wallet) model, not pure pass-through ACH.**

This is required by the feature set — top-ups and Push-to-Card withdrawals both depend on it:

- Plaid verifies and reads external bank accounts (read-only, never holds money).
- Dwolla moves money. For simple account-to-account and bill-pay transfers, it can go bank-to-bank directly with no balance involved.
- **Push-to-Card requires a pre-funded source to pay out instantly** — pulling straight from a linked bank would mean waiting on standard ACH clearing (1–3 days) first, defeating the "instant" value. So the balance acts as a settled, ready-to-disburse holding area.
- Money flow: **Top-up** (ACH pull from linked bank → Dwolla Balance) → balance settles → **Push-to-Card** (instant payout from Balance → debit card).

**Consequence:** only Verified Customers (Personal or Business) can hold a Dwolla Balance — Unverified Customers cannot. This means Fortify's onboarding must collect real CIP/KYC data (legal name, DOB, SSN, address) rather than the minimal unverified-customer flow, since the wallet + instant-withdrawal features depend on verified status. This should be reflected in the sign-up flow design and documented as its own ADR, since it's a meaningfully bigger onboarding lift than a pass-through-only model would need.

**Verification trigger, updated (ADR-014):** verification isn't only a top-up-time prompt. The transfer-flow audit found that Dwolla creates every customer `unverified` by default and nothing upgrades that on its own — which means two organically-signed-up users can never complete a P2P transfer to each other without it. So verification is now triggered from three places, built once: Settings, first P2P transfer attempt, and first top-up attempt. This pulled the verification build earlier in the roadmap (into the transfers fix/overhaul stage) rather than leaving it gated behind top-up, since P2P transfer is Phase 1 and top-up is Phase 2.

**Resolved 2026-09-24 ([ADR-015](decisions/ADR-015_Ledger-vs-Balance-Authority.md)):** a new PostgreSQL double-entry ledger is being built alongside the Dwolla Balance model (see `docs/security-backlog.md`) — it's a shadow ledger, not the source of truth. Dwolla stays authoritative for actual balances; Postgres is Fortify's own queryable record of what it understood to have happened, feeding forecasting/state-tracking/audit and checked against Dwolla by reconciliation. "The balance" shown anywhere in the app still means Dwolla's/Plaid's number, not a Postgres-computed one.

## 8. What "High-End" Means Operationally

Ties back to the existing design system so this doesn't stay abstract:

- No decorative filler — every visual element (the forecast line, category bars) carries real information, nothing is there just to look premium
- Confidence over cleverness — the forecast should read as a calm, authoritative statement, not a flashy chart. DM Mono for all numerals reinforces this.
- Friction removed at the moments of anxiety — bill pay, low-balance warnings, and the forecast view are where "high-end" has to show up in *usefulness*, not just visual polish

---

## 9. Non-Goals (v1)

- Multi-currency accounts or real FX settlement
- Card issuing / physical or virtual card products
- Issuing, underwriting, or managing credit or lending products — this doesn't block *displaying* an externally-held credit account's balance if linked via Plaid, since that's aggregation, not lending
- Multi-user/shared accounts
- Real regulatory compliance (KYC/AML is handled at the level Appwrite + Dwolla's sandbox requires for demo purposes, not production-grade)

---

## 10. Open Questions / Risks

- **Recurring-transaction detection** for the forecasting feature needs either a real pattern-matching approach or believable seeded mock data — decide before starting Phase 1's data model, since transaction schema should support this from day one even if the detection logic comes later.
- **Recipient-to-recipient transfers** assume the recipient is already a Dwolla customer — worth deciding early whether "transfers to others" in the demo means another Fortify user, or an external payee, since that changes the onboarding flow you need to mock.

**Resolved:** **Ledger vs. Balance authority** ([ADR-015](decisions/ADR-015_Ledger-vs-Balance-Authority.md), 2026-09-24) — the new PostgreSQL double-entry ledger (§6, `docs/security-backlog.md`) is a shadow ledger, not the source of truth for user balances. Dwolla remains authoritative; Fortify holds no money-transmission license and never custodies funds independently of it.

**Resolved:** Verified Customer / CIP-KYC onboarding is deferred, not part of sign-up. It lives as an option in Settings, and is also triggered contextually the first time a user attempts a P2P transfer or a top-up — clicking either prompts identity verification to unlock the feature if not already verified (updated per ADR-014 — P2P was added as a trigger once the audit showed unverified customers can't transfer to each other at all). This mirrors the existing MFA pattern (contextual setup at point of need, not front-loaded at sign-up) and keeps the sign-up mockups already built as-is, with no new step required.

**Resolved:** Single primary persona (Maya, §2) rather than multiple. Keeps scope honest and gives a concrete filter for feature decisions.

**Resolved:** Recurring items are manually defined (rule + per-occurrence exception model, §4), not auto-detected from transaction history, for v1. Informed by an existing personal budgeting spreadsheet workflow that solved the same rollover/irregular-date problem this way — validated by real use, not just a design guess.

**Resolved:** Forecasting covers checking, savings, credit, and Balance (§4) — not checking-only as earlier drafts of this document scoped it. Investment accounts are excluded from the calculation and shown as a separate net-worth figure only.