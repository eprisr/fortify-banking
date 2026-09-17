# ADR-013: MFA Re-Enrollment Fix — Pre-Challenge Before Regenerating Recovery Codes

**Date:** 2026-09-17  
**Status:** Proposed  
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

*To be filled in after implementation.*

---

## References
- [ADR-008: Plaid OAuth and Appwrite MFA](ADR-008-plaid-oauth-mfa.md)
- [ADR-011: Device Trust for MFA (Rejected)](ADR-011-device-trust.md)
- [Appwrite MFA Documentation](https://appwrite.io/docs/products/auth/mfa)