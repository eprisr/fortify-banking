# ADR-011: Device Trust — "Remember This Device" for MFA

**Date:** 2026-09-16  
**Status:** Rejected  
**Author:** Epris R.

---

## Context

As documented in ADR-008, Appwrite challenges MFA on every login for MFA-enabled accounts. The original proposal intended MFA to trigger only on new devices or sessions, but no device-trust mechanism was built in that pass. This ADR scopes the fix.

### Root cause, confirmed against the SDK

`node-appwrite`'s `Session` model has an `mfaUpdatedAt` field representing the most recent date a session passed MFA challenge, but it's scoped to that session only. `signIn()` calls `account.createEmailPasswordSession()` on every login, which mints a brand-new session each time. There is no field or endpoint that carries "this device already passed MFA" across separate logins. Appwrite has no first-party device-trust primitive; a "remember this device" mechanism has to be built at the app layer.

---

## Decision

Implement an opt-in trusted-device token using Appwrite user `prefs` for storage.

### How it works

1. In `completeMfaChallenge()`, if the user opts in via a "remember this device" checkbox, generate a random opaque token, store its hash (never the raw value, consistent with the ADR-007 password-reset-token fix) alongside an expiry in the user's `prefs`, and set it as a second `httpOnly`, `secure`, `sameSite=strict` cookie separate from `appwrite-session`.
2. In `signIn()`, before calling `createMFAChallenge`, check for that cookie. If it's present and its hash matches an unexpired, unrevoked record for the signing-in user, skip the challenge and proceed straight to `getUserInfo`.
3. Invalidate all trusted-device records when a user disables MFA or changes their password. Expose a "Trusted devices" list in Settings alongside the existing `TwoFactorDisableControl` so individual devices can be revoked manually.

Expired entries are pruned on every read-modify-write cycle to prevent stale tokens accumulating in the `prefs` blob.

### Touch points

`signIn()` and `completeMfaChallenge()` in `lib/actions/user.actions.ts`; a new cookie alongside `appwrite-session` in `lib/server/appwrite.ts`; an opt-in checkbox in the MFA challenge branch of `AuthForm.tsx`; a new Settings section next to `TwoFactorDisableControl` if revocation ships in the same pass.

---

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|-------|
| **User `prefs`** *(chosen)* | No new Appwrite collection or environment variable; keeps auth-adjacent state inside Appwrite Auth, consistent with ADR-008's principle that Appwrite is the sole source of truth for MFA status | `updatePrefs` replaces the whole blob rather than merging, so every write is a read-modify-write |
| **New DB collection** | Simpler queries; straightforward expiry cleanup via scheduled delete | New infrastructure to provision; duplicates state Appwrite Auth already owns per user |

Appwrite caps `prefs` at 64kB per user. Each trusted-device entry (a SHA-256 hash, expiry timestamp, optional device label) is roughly 150–250 bytes as JSON. Nothing else in the codebase uses `prefs` today, so even dozens of remembered devices per user stays well within the cap.

---

## Consequences (Expected)

**Good:**
- Users who opt in to device trust skip the MFA challenge on returning logins from known devices, reducing friction without removing the security control entirely.
- Storing only the hash (never the raw token) means a `prefs` leak doesn't hand out working device-trust tokens, consistent with the pattern established in ADR-007.
- Revocation via Settings gives users visibility and control over which devices are trusted.

**Bad / Trade-offs:**
- The `prefs` read-modify-write is not atomic. Two near-simultaneous logins from different devices could race, and the losing write could be clobbered. The failure mode is benign: that device is simply re-challenged for MFA on its next login rather than silently trusted. Not a security gap, but worth noting.
- Every `signIn()` call now includes a `prefs` read before the MFA check, adding a round trip for all MFA-enabled users.

**Risks:**
- Default remember-duration (30 days assumed, unconfirmed).
- Whether the "remember this device" checkbox defaults on or off in the challenge UI is undecided.
- Whether the Settings "Trusted devices" revocation list ships in the same pass or as a fast-follow is undecided.

---

## Consequences (Actual)

**Rejected before implementation.** Checking Appwrite's own server source (`app/controllers/shared/api.php` in appwrite/appwrite) turned up a hard blocker: the MFA gate is a global route middleware, not something scoped to `account.get()`:

```php
$minimumFactors = ($mfaEnabled && $hasMoreFactors) ? 2 : 1;
if (! in_array('mfa', $route->getGroups())) {
    if ($session && count($session->getAttribute('factors', [])) < $minimumFactors) {
        throw new Exception(Exception::USER_MORE_FACTORS_REQUIRED);
    }
}
```

This runs on every route outside the `mfa` route group, keyed off a `factors` count stored **on the session object itself**. The only way that count increases is a real `updateMFAChallenge()` call against that exact session — there is no admin/API-key endpoint that marks an existing session as MFA-satisfied without it.

The Users-service prefs read/write (`Users.getPrefs(userId)`) this design leaned on is unaffected, since API-key calls have no `$session` in scope and the gate doesn't apply there. But that was never the problem. `signIn()`'s `session.secret` becomes the long-lived `appwrite-session` cookie every later request authenticates with via `createSessionClient()`. Detecting a trusted device and skipping `createMFAChallenge` would leave that session's `factors` count unchanged — Appwrite has no record that the challenge was "waived." Every subsequent session-scoped call on that cookie (`getLoggedInUser()`'s `account.get()` overlay, `hasRealSession()`, anything else) would keep throwing `user_more_factors_required` for the entire life of the session. The user would appear to sign in successfully and then be broken on the very next request.

The only way around this is an app-level session layer that stops trusting Appwrite's own session-completeness signal — e.g. the app issuing and validating its own signed session claim alongside the Appwrite session. That's a materially bigger change than this ADR scoped, and it directly undermines ADR-008's decision that Appwrite Auth is the sole source of truth for MFA status. Not pursued.

See [ADR-012](ADR-012_Persistent-Session-Cookie.md) for the lighter-weight fix that was pursued instead: rather than skip MFA on known devices, stop forcing *unnecessary* re-logins (and thus unnecessary MFA challenges) by making the session cookie survive a browser restart.

---

## References
- [ADR-008: Plaid OAuth and Appwrite MFA](ADR-008-plaid-oauth-mfa.md)
- [ADR-012: Persistent Session Cookie](ADR-012_Persistent-Session-Cookie.md)
- [Appwrite User Preferences Documentation](https://appwrite.io/docs/products/auth/preferences)
- [Appwrite MFA Documentation](https://appwrite.io/docs/products/auth/mfa)
- [appwrite/appwrite — app/controllers/shared/api.php](https://github.com/appwrite/appwrite/blob/main/app/controllers/shared/api.php)