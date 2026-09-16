# ADR-009: Appwrite Password Security over Zod for Password Validation

**Date:** 2026-08-27  
**Status:** Proposed  
**Author:** Epris R.

---

## Context

Password validation in Fortify was handled by Zod schemas wired client-side through React Hook Form. The security hardening pass in ADR-007 established that client-side validation is UX, not security, and that every sensitive action needs server-side validation too. For most fields this meant adding `safeParse` calls in server actions. For passwords specifically, Appwrite already provides a built-in password security feature that enforces rules server-side natively, making a parallel Zod implementation redundant.

---

## Decision

Use Appwrite's built-in password security feature as the authoritative validation layer for passwords. Phase out the Zod password validation schema.

Zod remains in place for all other field validation throughout the app.

---

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|-------|
| **Appwrite password security** *(chosen)* | Server-side by default, no duplication, Appwrite enforces rules at the account level | UI must align with Appwrite's actual requirements rather than custom Zod rules |
| **Keep Zod, add server-side `safeParse`** | Consistent with the pattern established in ADR-007 for other fields | Duplicates what Appwrite already does natively, two sources of truth for the same rules |
| **Keep Zod only** | No additional work | Client-side only, the same gap ADR-007 closed for other actions |

---

## Consequences

**Good:**
- Password rules are enforced at the Appwrite account level regardless of how a request reaches the server, no action-level wiring required.
- Removes duplication between Zod schema rules and what Appwrite would enforce anyway.
- Consistent with the broader principle from ADR-007: server-side validation is the security control, client-side is UX.

**Bad / Trade-offs:**
- The visual password validation checklist added during the auth refactor was built against the Zod schema rules. It needs to be updated to reflect Appwrite's actual password requirements so the UI feedback stays accurate.
- Less flexibility for custom password rules in the future. Any change to password requirements goes through Appwrite's configuration rather than a local schema.

**Risks:**
- If the visual checklist isn't updated alongside the schema change, it could show requirements that no longer match what Appwrite enforces, confusing users and making the form feel broken.

---

## Consequences (Actual)

*To be filled in after implementation.*

---

## References
- [Appwrite Password Security Documentation](https://appwrite.io/docs/products/auth/security)
- [ADR-007: Security hardening pass](ADR-007-security-hardening.md)