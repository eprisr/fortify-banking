# ADR-008: Plaid OAuth and Appwrite MFA

**Date:** 2026-08-27  
**Status:** Proposed — Plaid OAuth implementation complete, MFA enrollment flow in progress  
**Author:** Epris R

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

*To be filled in after implementation.*

---

## References
- [Appwrite MFA Documentation](https://appwrite.io/docs/products/auth/mfa)
- [Plaid OAuth Guide](https://plaid.com/docs/link/oauth/)
- [ADR-003: Separating bank linking from payment processing](ADR-003-plaid-dwolla-pattern.md)
- [ADR-007: Security hardening pass](ADR-007-security-hardening.md)
