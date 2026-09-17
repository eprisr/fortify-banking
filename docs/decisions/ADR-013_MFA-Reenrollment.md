# ADR-013: MFA Re-Enrollment Fix — Pre-Challenge Before Regenerating Recovery Codes

**Date:** 2026-09-17  
**Status:** Accepted  
**Author:** Epris R.

---

## Context

As noted in ADR-008's known out-of-scope items, a user who disables MFA cannot re-enable it because recovery codes cannot be regenerated. This ADR identifies the root cause and scopes the fix.

### Root cause, confirmed against Appwrite's source

`updateMFARecoveryCodes` sits behind a `mfaProtected` route group that requires the current session's `mfaUpdatedAt` to be within the last 30 minutes (`MFA_RECENT_DURATION = 1800`), rejecting with `user_challenge_required` otherwise. Once MFA is disabled, signing back in never sets `mfaUpdatedAt` because Appwrite only challenges MFA-enabled accounts. Any re-enable attempt hits a stale or empty `mfaUpdatedAt` and dead-ends.

`createMFARecoveryCodes` (first-time setup) has no such gate, so first-time enrollment is unaffected. This only breaks re-enable.

A key detail confirmed against Appwrite's `createMFAChallenge` source: it only requires a verified email for the Email factor, not `mfa: true` on the account. The challenge mechanism works even while MFA is currently off, which is what makes this fix possible.

---

## Decision

Before regenerating recovery codes on re-enable, walk the user through one real MFA challenge to freshen `mfaUpdatedAt`, using the same `requestMfaChallenge`/`completeMfaChallenge` mechanism already used at sign-in.

### New result type

`generateRecoveryCodes()` needs a third distinguishable outcome so the caller can react to the re-enable case without conflating it with a generic error:

```ts
type RecoveryCodesResult =
  | { success: true; data: Models.MfaRecoveryCodes }
  | { success: true; challengeRequired: true }
  | { success: false; error: string }
```

### Flow

1. `recovery-codes/page.tsx` calls `generateRecoveryCodes()` as today.
2. First-time setup (create succeeds) → unchanged, straight to "here are your codes."
3. Re-enable (create fails `already_exists`, update fails `user_challenge_required`) → return `{ success: true, challengeRequired: true }`.
4. Page renders a challenge step: request an email OTP via `requestMfaChallenge('email')`, show the existing `OtpInput` UI, complete it via `completeMfaChallenge`.
5. On success, call `generateRecoveryCodes()` again. `mfaUpdatedAt` is now fresh, `updateMFARecoveryCodes()` succeeds, and the page falls into the existing "here are your codes" step.

### Email-only, no factor switch

Unlike sign-in's MFA challenge, this one is email-only with no option to switch to a recovery code. Recovery codes being missing or exhausted is often exactly why someone is re-enabling MFA, making them a circular verification method here.

### Structural change

`recovery-codes/page.tsx` is currently a server component rendering one of two states. It needs to become a client component owning three states (codes-ready, challenge-pending, error), similar to how `AuthForm.tsx` already manages its `mfaChallenge` local state. Most of the pieces (`OtpInput`, `requestMfaChallenge`, `completeMfaChallenge`, `mfaChallengeSchema`) already exist and are reused, not rebuilt.

**Untouched:** first-time MFA setup, `enableMFA()`/`disableMFA()` themselves, and sign-in's own MFA challenge flow.

---

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|-------|
| **Pre-challenge before regenerating codes** *(chosen)* | Uses existing mechanisms, minimal new code, doesn't touch sign-in or MFA enable/disable flows | Page needs to convert from server to client component |
| **Allow recovery code as a fallback in the pre-challenge** | More options for the user | Circular — recovery codes being missing is the reason they're re-enrolling |
| **Admin API workaround to force-set `mfaUpdatedAt`** | No UI change | Appwrite has no such endpoint; not possible |

---

## Consequences (Expected)

**Good:**
- Re-enrollment works without touching anything that already works. First-time setup, `enableMFA()`, `disableMFA()`, and sign-in's MFA challenge are all untouched.
- All the heavy lifting (`OtpInput`, challenge actions, schema) is reused from the sign-in MFA implementation.
- The email-only restriction prevents the circular recovery-code-to-get-recovery-codes scenario.

**Bad / Trade-offs:**
- `recovery-codes/page.tsx` converts from a server component to a client component. A small structural change for a page that currently has no interactivity.

**Risks:**
- The fix depends on `createMFAChallenge` not requiring `mfa: true` on the account, confirmed against current Appwrite source. A future Appwrite update tightening that gate would break the fix.

---

## Consequences (Actual)

Implemented as scoped, with one structural deviation and two bugs found and fixed after the initial pass.

### Deviation from the plan: a new child component, not a converted page

The ADR's plan called for `recovery-codes/page.tsx` itself to become a client component. In practice, the page stayed a server component — it still owns the `verifiedEmail` gate and the initial `generateRecoveryCodes()` call — and a new `components/settings/RecoveryCodesFlow.tsx` client component was introduced underneath it, taking `initialResult` as a prop and owning the three states (codes-ready, challenge-pending, error) described in the ADR. Functionally equivalent to what was scoped, but keeps the server-only verified-email check simple rather than folding it into client state.

### `RecoveryCodesResult`'s actual shape

The ADR's draft type used `{ success: true; data: ... }` for the non-challenge success case. The implemented type adds an explicit `challengeRequired: false` discriminant on that variant:

```ts
type RecoveryCodesResult =
  | { success: true; challengeRequired: false; data: import('node-appwrite').Models.MfaRecoveryCodes }
  | { success: true; challengeRequired: true }
  | { success: false; error: string }
```

Needed for TypeScript to narrow cleanly between the two `success: true` variants — without it, accessing `.data` after checking `.success` alone doesn't type-narrow away the challenge-required case.

### Bug 1: RSC serialization crash

Passing the Appwrite SDK's raw `Models.MfaRecoveryCodes` response as `initialResult` from the server page to the new client component tripped React's Server Components boundary: *"Only plain objects, and a few built-ins, can be passed to Client Components from Server Components."* The SDK response isn't a plain object. Fixed by wrapping the returned `data` in `parseStringify()` inside `generateRecoveryCodes()` — the same `JSON.parse(JSON.stringify(...))` pattern already used everywhere else in `user.actions.ts` for exactly this reason, which this function had been missing since it predates the ADR's client-component boundary.

### Bug 2: a second MFA challenge, a second email

The `useEffect` requesting the email challenge on mount was guarded only by the `challengeId` state. Because that state updates asynchronously, an effect re-run before the update landed (a double-invoke, or a re-render racing the pending promise) fired a second `requestMfaChallenge('email')` — a second real Appwrite challenge, a second real email sent. The client ended up holding whichever `challengeId` resolved last, while the user could easily be looking at the *other* email's code, which then failed as invalid/expired against the newer challenge. Fixed with a `useRef` guard that flips synchronously on first fire, so only one challenge is ever requested regardless of how many times the effect body runs.

### Bug 3: `completeMfaChallenge()` leaking the full user profile

A data-exposure check run against this ADR's diff (per the `data-exposure-check` skill — the same lineage as ADR-007) found that `completeMfaChallenge()` returned the full `getUserInfo()` row on success, including `ssn`, `dateOfBirth`, and `address1/city/state/postalCode`. This predates ADR-013 — it's the same function sign-in's MFA challenge has always used — but neither caller has ever consumed `.data`: `AuthForm.tsx`'s `onMfaSubmit` only checks `.success` before a hard navigation (which re-fetches everything server-side anyway), and the new `RecoveryCodesFlow.tsx` does the same. ADR-013 doubled the exposed surface by adding a second call site to an already-over-returning function, which is what surfaced it.

Fixed by changing `completeMfaChallenge()`'s return type from `ActionResponse<User>` to `ActionResponse<null>` and dropping the `getUserInfo()` call entirely — one fewer DB read, and the PII never leaves the server for this path. This is a shared-function change: sign-in's MFA challenge UX is unaffected (it never used the data), but the action's contract changed for both callers, so "untouched" below refers to behavior, not to every line of code in the shared function.

### Untouched, as planned

First-time MFA setup, `enableMFA()`/`disableMFA()`, and sign-in's own MFA challenge *behavior* were not touched — only `completeMfaChallenge()`'s internals, per Bug 3 above.

### Test coverage

Two existing `generateRecoveryCodes()` assertions updated for the new response shape, one new test for the `challengeRequired` branch, and a new `__tests__/recovery-codes.test.tsx` (7 tests) covering `RecoveryCodesFlow.tsx` directly — including a regression test that forces a re-render mid-challenge-request and asserts `requestMfaChallenge` still only fires once (Bug 2), and an assertion that the challenge-completion mock carries no user-profile fields (Bug 3). The `completeMfaChallenge` test in `user.actions.signin.test.ts` now also asserts `createAdminClient` is never called, proving the profile is never even fetched, not just absent from the response. The component-test gap noted in the previous revision of this ADR is closed.

---

## References
- [ADR-008: Plaid OAuth and Appwrite MFA](ADR-008-plaid-oauth-mfa.md)
- [ADR-011: Device Trust for MFA (Rejected)](ADR-011-device-trust.md)
- [Appwrite MFA Documentation](https://appwrite.io/docs/products/auth/mfa)