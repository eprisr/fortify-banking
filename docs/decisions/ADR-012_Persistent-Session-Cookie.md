# ADR-012: Persistent Session Cookie

**Date:** 2026-09-16
**Status:** Accepted
**Author:** Epris R.

---

## Context

ADR-011 scoped a "remember this device" mechanism to reduce how often MFA-enabled users are challenged, then rejected it — Appwrite gates MFA at the session level with no supported way to mark a session as satisfied without a real challenge, so skipping the challenge for a "trusted" device would leave every later request on that session throwing `user_more_factors_required`.

Looking for a lighter-weight friction reducer surfaced a separate, real bug: `signIn()` and `signUp()` both set the `appwrite-session` cookie with no `expires`/`maxAge`:

```ts
cookieStore.set('appwrite-session', session.secret, {
	path: '/',
	httpOnly: true,
	sameSite: 'strict',
	secure: true,
})
```

With no explicit lifetime, this is a browser-session cookie — it's discarded whenever the browser (not just the tab) closes. Appwrite's own session, by contrast, defaults to a 365-day server-side lifetime (`session.expire`, configurable per project up to 31,536,000 seconds). So today, closing the browser silently ends a still-valid Appwrite session and forces a brand-new `createEmailPasswordSession()` on the next visit — which, for an MFA-enabled account, means a brand-new MFA challenge every time, on the same device, with no security benefit. This is very likely the dominant real-world driver of "MFA on every login," more so than genuinely new devices.

---

## Decision

Set the `appwrite-session` cookie's `expires` to match the actual `session.expire` timestamp Appwrite returns from `createEmailPasswordSession()`, instead of leaving it a browser-session cookie.

```ts
cookieStore.set('appwrite-session', session.secret, {
	path: '/',
	httpOnly: true,
	sameSite: 'strict',
	secure: true,
	expires: new Date(session.expire),
})
```

This is derived per-call from the session Appwrite actually issued, not a hardcoded duration — it stays correct regardless of the project's configured session-length policy, and never grants the cookie a longer life than the session it carries is actually valid for.

### Touch points

Both cookie-setting call sites in `lib/actions/user.actions.ts`: `signIn()` and `signUp()`. `completeMfaChallenge()` is unaffected — per ADR-008 it deliberately never rewrites this cookie. `logoutAccount()` already explicitly deletes the cookie and calls `account.deleteSession()`, so explicit logout is unaffected.

---

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Match `session.expire`** *(chosen)* | Cookie lifetime always tracks whatever the server actually considers valid; no duration to keep in sync manually | None significant |
| **Hardcode a `maxAge`** (e.g. 30 days) | Simple | Drifts from the project's actual session-length setting; could either expire the cookie while the server session is still valid (silent forced logout) or vice versa |
| **Leave as a session cookie (status quo)** | No change | Forces a full re-login, and for MFA-enabled accounts a full re-challenge, every time the browser closes — the exact friction this ADR is trying to reduce |

---

## Consequences (Expected)

**Good:**
- MFA-enabled users stop getting re-challenged simply for closing their browser. The challenge still fires on genuinely new sessions (new browser, cleared cookies, expired session, different device) — exactly the case where it's supposed to.
- No new infrastructure, no new storage, no change to how MFA itself is enforced. Zero risk of the `getLoggedInUser()`/`hasRealSession()` breakage that sank ADR-011.

**Bad / Trade-offs:**
- The cookie is now a longer-lived bearer credential on the client (up to the project's session-length policy, 365 days by default). This isn't a new capability — it matches a lifetime Appwrite's own session already grants server-side — but it does mean a stolen/exfiltrated cookie value stays usable for longer than it would have if the browser happened to be closed in the meantime. Anyone wanting a tighter bound should shorten the session-length policy in the Appwrite project console, which now actually governs the practical session lifetime rather than being routinely undercut by browser-close.

**Risks:**
- None identified. `httpOnly`/`secure`/`sameSite=strict` are unchanged; only the expiry changes.

---

## Consequences (Actual)

*To be filled in after implementation.*

---

## References
- [ADR-011: Device Trust — "Remember This Device" for MFA](ADR-011_Device-Trust-MFA.md)
- [ADR-008: Plaid OAuth and Appwrite MFA](ADR-008-plaid-oauth-mfa.md)
- [Appwrite Auth Security — session length](https://appwrite.io/docs/products/auth/security)
