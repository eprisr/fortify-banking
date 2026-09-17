# Fortify Banking — Roadmap

**Status:** Draft v1
**Last updated:** 2026-09-17

---

## How to read this

Same status vocabulary as the landing page and case study, so there's one shared language across product, docs, and marketing:

- 🟢 **Live** — built, tested, real (not simulated)
- 🟡 **In progress** — actively being built
- ⚪ **Planned** — scoped, not started

**A stage is not "done" because its page exists.** A stage is done when every sub-feature listed under it is Live, functioning end-to-end — that's the one bar, not a separate "ready" gate and a separate "done" gate. The page shell is infrastructure — necessary, but it's the container, not the content. Settings is the clearest example: the route/layout/nav can be 🟢 while everything it's meant to hold is still ⚪.

---

## Stage 1 — Settings (foundation) — ✅ done

**Depends on:** nothing. This is why it's first.

| Sub-feature | Status | Done means |
|---|---|---|
| Route, layout, nav | 🟢 Live | Settings is reachable and has a place for everything below |
| MFA setup | 🟢 Live | User can enroll in MFA from Settings, independent of anything else — no Dwolla/Plaid dependency. Email OTP + recovery-code challenge flow, per [ADR-008](decisions/ADR-008-Plaid-oAuth-MFA.md). Per-device MFA skip was explored and rejected — Appwrite gates MFA at the session level with no bypass ([ADR-011](decisions/ADR-011_Device-Trust-MFA.md)); the session cookie now persists across browser restarts instead, so re-challenges only happen on genuinely new sessions ([ADR-012](decisions/ADR-012_Persistent-Session-Cookie.md)) |
| Verified Customer / KYC entry point | ⚪ Planned | A link/card exists in Settings, but the actual verification flow ships with Stage 1.5 (moved from Stage 3, see below) — it's triggered from multiple places (Settings, first transfer to another user, first top-up attempt), built once |
| ADR-007 risk check | 🟢 Live | MFA enrollment touches auth data — every query goes through a server action, none reaches the client directly. Traced the full surface (enrollment, re-enrollment, sign-in's challenge, the Settings toggle row) and found one real gap: `completeMfaChallenge()` was returning the full user profile (ssn/dob/address) to two callers that never used it — fixed as part of [ADR-013](decisions/ADR-013_MFA-Reenrollment.md) |

**Stage done when:** MFA setup is functional. The KYC entry point can stay a placeholder here — its real implementation is tracked under Stage 1.5 (moved from Stage 3, see [ADR-014](decisions/ADR-014_Transfer-Rebuild.md)), not duplicated. **This bar is now met** — MFA shipped and the ADR-007 check found and fixed a real issue rather than coming back clean by default.

---

## Stage 1.5 — Transfers (fix + overhaul)

**Depends on:** nothing. **Blocks:** Stage 2 — bill pay extends `PaymentTransferForm`, so it can't safely start until this form actually works and reflects the current design system.

Existing, but not actually done — `PaymentTransferForm`, `Contacts`, and `Confirmation` predate the design system overhaul and currently have functional bugs. This was incorrectly treated as shipped in earlier planning; this stage exists to correct that.

**Scope amended 2026-09-17 ([ADR-014](decisions/ADR-014_Transfer-Rebuild.md)):** the Dwolla audit found that no two organically-signed-up users can transfer to each other — every customer is created `unverified` and nothing upgrades that. Fixing this requires the KYC/verification flow, so Stage 3's "Verification flow (KYC)" sub-feature is pulled forward into this stage rather than duplicated later. Stage 3 keeps the top-up/withdrawal work, still gated on Checkout.com credentials.

| Sub-feature | Status | Done means |
|---|---|---|
| Bug fixes | ⚪ Planned | Every transfer path (own accounts, to others) completes end-to-end with no known bugs — specifics TBD as they're logged |
| Verification flow (KYC) | ⚪ Planned | *(moved from Stage 3)* Real CIP data collection (name, DOB, address, SSN), upgrades a Dwolla customer from `unverified` to `verified` — required before a P2P transfer to another user can complete at all |
| Design system migration | ⚪ Planned | Matches current tokens (Ink/Paper/Cloud/Plum/Gold/Sage/Terracotta, current type scale) rather than the pre-overhaul styling it still carries |
| Test coverage | ⚪ Planned | Jest/RTL/MSW + Playwright, same bar as the rest of the app — likely absent or stale given the component predates current conventions |
| ADR-007 risk check | ⚪ Planned | This is the exact flow ADR-007 originally found leaking data on — re-verify the fix still holds after any changes here, don't assume it's untouched. The Stage 1 check just proved this kind of audit finds real things, not just checkbox-fills it. Also covers the new KYC data path and the new recipient-search-by-email surface |

**Stage done when:** both transfer paths (self-transfer and P2P to another user) work reliably end-to-end and visually match the rest of the app, with test coverage at parity with everything built since.

---

## Stage 2 — Bill pay

**Depends on:** Stage 1.5 (bill pay extends `PaymentTransferForm` directly — building on a broken, un-migrated form means redoing this work twice).

| Sub-feature | Status | Done means |
|---|---|---|
| Biller payee type | ⚪ Planned | Extends `PaymentTransferForm` (or forks from it) to support paying a biller, not just a linked account or contact |
| Bill pay confirmation | ⚪ Planned | Matches the existing no-back-button confirmation pattern |
| Test coverage | ⚪ Planned | Jest/RTL/MSW unit coverage + a Playwright e2e path, same bar as existing transfer flows |
| ADR-007 risk check | ⚪ Planned | New payee/biller data — confirm no client-side call bypasses a server action to reach raw account or payee records |

**Stage done when:** a user can select a biller, enter an amount, confirm, and see it reflected in transaction history — with the same test coverage the rest of the app has.

---

## Stage 3 — Top-up, withdrawal

**Depends on:** Stage 1 (Settings must exist to house the verification entry point) and Stage 1.5 (Verified Customer status, per the amendment below).

**Verification flow (KYC) moved to Stage 1.5** ([ADR-014](decisions/ADR-014_Transfer-Rebuild.md), 2026-09-17) — P2P transfer can't work without it, so it shipped earlier rather than being duplicated here. This stage now just consumes the Verified Customer status that Stage 1.5 produces; it no longer builds the verification flow itself.

| Sub-feature | Status | Done means |
|---|---|---|
| Top-up — ACH pull | ⚪ Planned | Real transfer from linked bank into Dwolla Balance |
| Top-up — card funded | ⚪ Planned | Real, via Checkout.com, per the Definition of Done |
| Withdrawal — ACH out | ⚪ Planned | Real transfer from Dwolla Balance to linked bank |
| Withdrawal — Push-to-Card | ⚪ Planned | Real, instant, via Dwolla's native feature — no new vendor |
| Test coverage | ⚪ Planned | Same bar as above |
| ADR-007 risk check | ⚪ Planned | Highest-sensitivity stage — top-up/withdrawal touch Dwolla Balance and funding-source data. Confirm every new query on account or funding-source data routes through a server action |

**Stage done when:** a Verified user (status produced by Stage 1.5) can successfully complete both top-up paths and both withdrawal paths — each producing a real balance change.

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

## Blog cadence

One post per stage, published when that stage closes — same checkpoint as the changelog entry, not a separate thing to remember. Titles are working drafts, not locked.

| Stage | Working title | Angle |
|---|---|---|
| 1 — Settings | *Building Fortify: Settings, and the Two Decisions It Was Blocking* | Why a page can be "built" and a feature not "done" — the KYC-deferral and contextual-MFA decisions finally landing somewhere. Now that this stage is closed, this post has its ending: the ADR-007 check that found a real leak, not a clean pass |
| 1.5 — Transfers fix + overhaul | *Building Fortify: Fixing What I Started With* | Honest post about revisiting "done" work that wasn't — the gap between a component existing and a component actually working, and why it matters enough to stop and fix before building on top of it |
| 2 — Bill pay | *Building Fortify: Bill Pay* | Extending an existing form vs. forking a new one — the actual call made, and why |
| 3 — Top-up, withdrawal | *Building Fortify: Money In, Money Out* | The Dwolla Balance model, why Checkout.com over Stripe, Push-to-Card as a "free" upgrade — this is the richest stage, split into two posts if it runs long rather than cramming it |
| 4 — Forecasting | *Building Fortify: Know Before Friday* | The flagship post. The spreadsheet origin, the recurring-rule-plus-exceptions model, why manual beat auto-detected. Likely the strongest piece — give it room, consider two parts (data model, then the UI) rather than rushing one |
| 5 — Currency exchange | *(folds into the MVP wrap-up post below rather than standing alone — too small on its own)* | — |
| MVP complete | *Shipping the MVP: What's Real, What's Simulated, and Why* | Closes the loop on the Definition of Done — the stack boundary, what got built vs. documented, and why that line was drawn deliberately instead of apologized for |

The Stage 4 post is the one to protect if time gets tight elsewhere, same reasoning as the roadmap's Maya-journey note — it's the post that actually explains why the project exists.

---

## Maya's user journey, mapped to the roadmap

Walking through the app as the persona, in order, to sanity-check that the stages actually serve her, not just fill out a feature list.

1. **Discovery.** Maya finds Fortify, reads the landing page. Sees what's live vs. in progress — no surprises later.
2. **Guest exploration.** Tries the dashboard via guest mode before handing over any real information. *(Live — Guest Mode, ADR-006.)*
3. **Sign-up and account linking.** Creates an account, links her bank via Plaid. No KYC friction here — that's deferred by design. *(Live.)*
4. **Everyday check-in.** Opens the app the way she always did with her old bank app — checks the balance, glances at spending by category. *(Live.)*
5. **First transfer.** Moves money to savings, or pays a friend back — the latter now hits a verification prompt the first time, since Dwolla won't move money between two unverified users. *(Stage 1.5 — exists, but broken and pre-overhaul; not actually live yet despite earlier planning treating it as done. KYC verification moved here per ADR-014.)*
6. **Paying rent.** Uses bill pay instead of leaving the app. *(Stage 2.)*
7. **Wants to add a cushion.** Tries to top up before a big expense — already Verified from the transfer flow, so no repeat KYC friction here, straight to tops up. *(Stage 3 — this is the moment the Settings/KYC/top-up decisions all connect.)*
8. **Needs cash same-day.** Withdraws via push-to-card instead of waiting on a standard transfer. *(Stage 3.)*
9. **The Thursday-night anxiety moment.** Checks the forecast instead of doing mental math. Sees Friday's paycheck will cover what's scheduled, with room to spare — or doesn't, and adjusts before it's a problem. *(Stage 4 — this is the actual product thesis. Everything before this stage is infrastructure for this moment.)*
10. **Edge case.** A friend visiting from abroad — she explores currency exchange once, sees it's a demo, understands why. *(Stage 5 — intentionally the least-visited step in her journey, which is why it's last.)*

Step 9 is the one to protect. If time pressure ever forces a cut, everything except Stage 4 is replaceable without breaking the story Fortify tells about itself. Stage 4 isn't.

---

## Open items being tracked

The risk-watch and ready-vs-done questions are resolved — folded into the stages above rather than sitting here as separate suggestions. Two remain genuinely open:

1. **Changelog.** One line per stage shipped, date + link to its blog post/ADR. Source the content from git history — `git log` for the raw commit trail since the last entry, or Claude Code, since it sits directly in the local repo with terminal access and can draft the entry from actual commits/diffs at the point a stage closes, rather than reconstructing it from memory later.
2. **Usage instrumentation.** Deliberately deferred — planned for launch once the major features (transfer, forecasting, etc.) are complete, not before.