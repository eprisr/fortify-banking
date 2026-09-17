# ADR-014: Transfer Flow Rebuild

**Date:** 2026-09-17  
**Status:** Accepted (scope amended 2026-09-17 — see Amendment below)  
**Author:** Epris R

---

## Context

The transfer feature was built as part of the initial tutorial setup and has been broken end-to-end since. Several architectural changes introduced after that build are the likely cause: the security hardening pass in ADR-007 restructured how transfers work server-side, the auth refactor in ADR-005 changed session and user data handling, MFA in ADR-008 changed how sessions are validated, and the component folder restructure in ADR-010 moved files. Nothing in the transfer flow has been updated to account for any of these.

Separately, the tutorial implementation is over-engineered relative to what the PRD actually requires. The UI is definitely more complex than the feature needs. Whether the Dwolla backend logic is also over-engineered depends on what Dwolla actually requires for a basic P2P transfer, which hasn't been cross-checked against the tutorial's implementation yet.

The PRD minimum for this feature is P2P bank-to-bank transfer and transaction history. Nothing more.

### What the security hardening pass already established

ADR-007 introduced a `transferFunds` server action that handles the full sender/receiver lookup, Dwolla transfer, and transaction record server-side, returning only `{ success, error }` to the client. AES-256-GCM encrypted account IDs from ADR-007 are already in place. The security foundation for transfers exists; the wiring from the UI to that foundation is what's broken.

---

## Decision

Rebuild the transfer flow from the current broken state, scoped strictly to PRD minimum: P2P bank-to-bank transfer and transaction history. Start with a Dwolla sandbox audit to confirm what a basic P2P transfer actually requires before assuming the backend logic needs simplification. Then rebuild or simplify the UI to match.

### Approach

1. **Audit Dwolla's P2P requirements first.** Before touching code, confirm what the tutorial implemented on the backend against what Dwolla's sandbox actually needs for a customer-to-customer ACH transfer. Determine what was added by the tutorial beyond the minimum and what can be removed.

2. **Rebuild the UI to PRD scope.** The transfer form is over-engineered relative to what the feature needs. Simplify it to the minimum: sender account, recipient (via encrypted shareable ID), amount, and submit. No additional steps or fields beyond what the flow requires.

3. **Wire to the existing `transferFunds` server action.** The ADR-007 server action already handles the secure server-side flow. The rebuild connects the simplified UI to that action rather than rewriting the backend from scratch.

4. **Transaction history alongside transfer.** Both pieces ship together per PRD scope. Transaction history is data already being returned from Plaid; the work is rendering it correctly after the auth and session changes since the tutorial build.

---

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|-------|
| **Audit first, then rebuild to PRD scope** *(chosen)* | No over-building on the backend side, UI simplified to actual need, security foundation reused from ADR-007 | Requires Dwolla audit before scope is fully confirmed |
| **Fix the broken tutorial implementation in place** | Less rewriting | Preserves over-engineered UI, leaves open which of the post-tutorial changes actually broke what, harder to reason about |
| **Rewrite backend and UI both from scratch** | Clean slate | Throws away `transferFunds` and the ADR-007 security work that's already correct |

---

## Consequences (Expected)

**Good:**
- Starting from the ADR-007 security foundation means the rebuilt flow doesn't reintroduce the PII leak or the client-side bank data exposure that existed in the tutorial version.
- Scoping to PRD minimum keeps the feature from growing back into complexity it doesn't need.
- The Dwolla audit may reveal that the backend is already close to correct and only the UI needs work, shortening the rebuild significantly.

**Bad / Trade-offs:**
- The Dwolla audit adds a step before any code is written. If the backend logic also needs significant changes, the scope of the rebuild is larger than the UI work alone.

**Risks:**
- The `transferFunds` server action from ADR-007 was written to close the security gap, not to be the complete transfer implementation. It may need extension to cover edge cases the tutorial's original backend handled, such as insufficient funds responses, failed transfer states, or Dwolla webhook handling.
- Transaction history rendering depends on Plaid data that flows through the same auth and session changes that broke the tutorial build. Both pieces need to be verified as working together, not just independently.

---

## Amendment — Scope Expansion (2026-09-17)

The Dwolla audit called for in step 1 surfaced a blocker more fundamental than "the UI is over-engineered": every Dwolla customer is created with `type: 'unverified'` at signup (`lib/actions/user.actions.ts`), no code path ever upgrades a customer to verified, and Dwolla requires at least one verified party per transfer. Confirmed against a live Dwolla sandbox call in a prior session (2026-08-27) — this environment has no local Dwolla sandbox credentials to re-run the call, so the finding is carried forward rather than re-verified live, but the code-side half of it (no upgrade path exists) is independently confirmed by grep against current `main`. Practical effect: an unverified user can transfer between their own linked accounts, but two organically-signed-up users can never transfer to each other — not a UI bug, a missing backend capability.

Roadmap Stage 3 already scoped a "Verification flow (KYC)" sub-feature, gated behind Settings and first-top-up, deliberately kept out of this rebuild's original minimum. Given the blocker above, that dependency is pulled forward: **this rebuild now includes real KYC data collection and the Dwolla unverified→verified customer upgrade**, not just transfer UI/wiring. Rationale: shipping a "rebuilt" P2P transfer flow that still can't complete a transfer between two real users would repeat the exact mistake this ADR exists to correct (treating broken as done).

Revised scope, on top of the original three-part approach:

4. **KYC data collection + Dwolla customer upgrade.** Collect the fields Dwolla's customer-update endpoint requires to upgrade `unverified` → `verified` (`personal`): address, city, state, postal code, date of birth, SSN. The `dwollaSchema` in `lib/utils.ts` was already written for this shape and has been unused since it was added — reuse it rather than redefining. Handle Dwolla's non-`verified` outcomes (`document`/`retry`/`suspended`) rather than assuming every submission succeeds outright.
5. **Recipient search by email**, replacing raw shareable-ID paste as the primary UX (per the attached transfer-flow mockup), with a manual shareable-ID fallback retained for the case a lookup can't resolve. New server-side surface — reviewed under the ADR-007 pattern (server action returns only name + shareable ID, never raw account or Dwolla data).
6. **Per-transfer OTP is explicitly out of scope.** The mockup's MFA screen is redundant with existing session-level MFA (ADR-008) — this rebuild relies on the session already being challenged, and does not add a second per-transfer OTP step. If real time-of-transfer step-up auth is wanted later, that's a separate ADR, not a silent addition here.

This does not change the roadmap's Stage 3 top-up/withdrawal scope (Checkout.com-gated, still blocked) — only the KYC/verification sub-feature moves earlier, since transfer now depends on it too.

---

## Consequences (Actual)

*To be filled in after implementation.*

---

## References
- [ADR-002: Dwolla over Stripe](ADR-002-dwolla-vs-stripe.md)
- [ADR-003: Plaid + Dwolla pattern](ADR-003-plaid-dwolla-pattern.md)
- [ADR-007: Security hardening pass](ADR-007-security-hardening.md)
- [Dwolla P2P Transfer Documentation](https://developers.dwolla.com/docs/balance/send-money)