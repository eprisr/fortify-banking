# ADR-008: Plaid OAuth and Appwrite MFA

**Date:** 2026-08-27  
**Status:** Accepted  
**Author:** Epris R.

---

## Context

After the security hardening pass in ADR-007, two related improvements were scoped to strengthen how users authenticate and how bank accounts get linked. Both address the same underlying concern: reducing the amount of sensitive data Fortify handles directly.

---

## Decision

### 1. Add Plaid OAuth alongside the existing credential flow

Rather than replacing the non-OAuth Plaid flow, users are given a choice. OAuth redirects them to authenticate directly on their bank's website. The non-OAuth path keeps the existing Plaid Link credential flow for banks that don't support OAuth.

### 2. Add email-based MFA via Appwrite

MFA is optional but prompted immediately after a user links a bank account. At that point the risk profile changes, real financial data is now accessible, and the prompt is contextually appropriate. Guest users and users who haven't linked an account skip MFA entirely. Users who decline are reminded they can enable it later in account settings.

**On trigger conditions:** Ideally MFA is triggered only when a new device or session is detected rather than on every login. Whether Appwrite handles device detection automatically or requires custom implementation needs to be verified against the Appwrite MFA documentation before the enrollment flow is finalized.

**On terminology:** Appwrite refers to this as MFA. Since the current implementation uses email as the only second factor it is technically 2FA, but MFA is used throughout for consistency with Appwrite's own language and to leave room for additional factors later.

---

## Alternatives Considered

### Plaid OAuth

| Option | Pros | Cons |
|--------|------|-------|
| **OAuth alongside non-OAuth** *(chosen)* | Users at OAuth-supporting banks get a more secure flow, non-OAuth remains available for banks that don't support it | Two code paths to maintain |
| **OAuth only** | Simpler, one path | Excludes banks that don't support OAuth, limits institution coverage |
| **Non-OAuth only** | Already built, no additional work | Credentials pass through Plaid's interface rather than the bank's own site directly |

### MFA Enrollment

| Option | Pros | Cons |
|--------|------|-------|
| **Optional, prompted after bank linking** *(chosen)* | Contextually appropriate, balances security with demo usability, low friction for first-time visitors | Users can decline, reducing actual MFA adoption |
| **Mandatory for all users** | Maximum security | High friction in a demo context, unnecessary for users who haven't linked an account |
| **Opt-in only, no prompt** | Zero friction | Most users will never enable it |
| **Mandatory after bank linking** | Strong security posture for linked accounts | Blocks existing linked users who haven't enrolled, creates an awkward upgrade path |

---

## Consequences (Expected)

**Good:**
- OAuth reduces the data Fortify handles directly. With OAuth, credentials never leave the bank's own environment. With non-OAuth, they're handled by Plaid's interface. The distinction matters as the app moves closer to production behavior.
- Prompting for MFA after bank linking ties the security upgrade to the moment it becomes relevant rather than front-loading friction at signup.
- Email MFA via Appwrite requires no additional infrastructure beyond what's already in place.

**Bad / Trade-offs:**
- Two Plaid linking paths means two flows to test and maintain. The OAuth path introduces a redirect and callback that the non-OAuth path doesn't have.
- Optional MFA means adoption depends on user behavior. A prompt is not a guarantee.
- Email as a second factor is the weakest form of MFA. It's better than nothing, and it's the right starting point, but it relies on the user's email account not being compromised.

**Risks:**
- The device and session detection behavior in Appwrite's MFA implementation needs to be confirmed. If Appwrite triggers MFA on every login rather than on new devices only, the UX impact is significant and the implementation may need custom session tracking logic.
- The OAuth redirect and callback flow introduces a new failure mode: users who drop off mid-redirect or whose bank's OAuth implementation behaves unexpectedly. Needs thorough testing across institution types in sandbox.

---

## Consequences (Actual)

The MFA implementation was significantly more involved than scoped. The triggering incident that kicked off the work: `signIn()` never handled Appwrite's `user_more_factors_required` response at all, meaning any MFA-enabled account was completely unable to log in, silently bounced to `/welcome`. That was the root cause. Everything else built out from fixing it.

### Key architectural decisions made during implementation

**MFA challenge inside AuthForm, not a separate route.** Local component state swaps the rendered branch in place. A second `useForm()` instance owns the challenge-code field independently of the sign-in form.

**Two factors: email OTP as default, recovery code as fallback.** `requestMfaChallenge(factor)` and a client-side toggle switch between them without re-authenticating.

**Session cookie is set once, at `signIn()`, and never re-written.** `completeMfaChallenge()` deliberately does not re-set the cookie. Appwrite's SDK only populates `Session.secret` for API-key-authenticated requests, so a session-authenticated call always gets an empty string back. Re-writing the cookie at challenge completion would have corrupted a valid session immediately after a successful MFA check.

**Post-MFA navigation uses hard browser navigation, not `router.push`.** Eliminates ambiguity around Router Cache staleness on the freshly-authenticated session.

**Demo mode converted from a GET route to a Server Action.** The old `/demo` route set a cookie as a GET side-effect and was reachable via Next.js `<Link>` prefetch, which could silently enter demo mode. A Server Action closes that gap.

**`hasRealSession()` and `getLoggedInUser()` are distinct primitives.** `hasRealSession()` is used exclusively by the auth layout's "already logged in, bounce away from `/signin`" guard, so a demo-mode cookie is never mistaken for a real authenticated session. `getLoggedInUser()` returns `null`, not a partial object, when Appwrite auth succeeds but the profile row is missing.

**Appwrite Auth is the sole source of truth for `verifiedEmail` and MFA status.** The database row no longer mirrors these fields. `getLoggedInUser()` overlays live `account.get()` values onto the DB-sourced profile on every fetch.

**OTP entry is a real multi-box UI.** One `maxLength={1}` input per character, with auto-advance, backspace-to-previous, arrow-key nav, and paste distribution. Validation length and box count both derive from one `mfaLength` value computed from the active factor: 6 for email OTP, 8 for recovery code.

### On device detection

The original proposal noted that MFA ideally triggers only on new devices or sessions rather than every login. In practice, Appwrite triggers MFA on every login for MFA-enabled accounts. No custom session tracking was implemented to change this behavior. The fix is scoped in ADR-011.

### Bugs found during implementation

Eight bugs were found and fixed in the course of the MFA work, in the order they surfaced:

1. `signIn()` never handled `user_more_factors_required`, the root cause of the original incident.
2. `/demo` GET route vulnerable to `<Link>` prefetch silently entering demo mode.
3. Auth layout used `getLoggedInUser()` (demo-mode-aware) for its auth guard, yanking users off an in-progress MFA challenge back to `/welcome`.
4. React reconciliation bug: two `useForm()` branches at the same conditional-return fiber position with no `key`, causing React to reuse a stale fiber on the swap and silently break `Controller` registration for the code field.
5. `completeMfaChallenge()` re-writing `appwrite-session` with an empty string from `updateMFAChallenge()`'s response, corrupting a valid session immediately after a successful MFA check.
6. `getLoggedInUser()` returning a truthy-but-partial object when the DB profile row was missing, passing every auth guard then crashing downstream.
7. Navbar name fallback (`firstName + ' ' + lastName || 'Guest'`) could never fire — concatenating two `undefined`s yields the truthy string `"undefined undefined"`.
8. WebKit-only: a focused input's box-shadow ring clipped by the nearest `overflow: auto` ancestor. Fixed with `ring-inset` rather than restructuring the scroll hierarchy.

### Rejected alternatives

Disabling MFA server-side for affected accounts to unblock the original incident was raised and rejected. The fix was always building the actual challenge flow.

### Known out-of-scope items

- `sheet.tsx` has the same `data-open`/`data-closed` vs. Radix's actual `data-state` mismatch pattern, unfixed.
- No UX yet for an account that reaches "authenticated, no profile row." Currently bounces to `/welcome`, which is acceptable since the only known trigger is a manual DB deletion, not an app code path.
- MFA re-enrollment is broken: a user who disables MFA cannot re-enable it because recovery codes cannot be regenerated. The re-enrollment flow has no path to produce new codes.
- Device trust ("remember this device") not yet implemented. Appwrite challenges MFA on every login for enabled accounts. Fix scoped in ADR-011.

---

## References
- [Appwrite MFA Documentation](https://appwrite.io/docs/products/auth/mfa)
- [Plaid OAuth Guide](https://plaid.com/docs/link/oauth/)
- [ADR-003: Separating bank linking from payment processing](ADR-003-plaid-dwolla-pattern.md)
- [ADR-007: Security hardening pass](ADR-007-security-hardening.md)
- [ADR-011: Device trust for MFA](ADR-011-device-trust.md)