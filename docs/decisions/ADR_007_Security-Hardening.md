# ADR-007: Security Hardening Pass

**Date:** 2026-08-25  
**Status:** Accepted  
**Author:** Epris R.

---

## Context

A security audit ahead of the Plaid OAuth and 2FA work surfaced three categories of concern in the original proposal. The "broader wire audit" item turned out to be the most severe finding of the pass, uncovering a critical cross-user PII and credential leak that wasn't anticipated going in. Four issues were fixed in total across four commits on the `security-hardening` branch.

All four trace back to the same root cause: the server/client boundary being treated as trusted when it isn't. Next.js server actions look like local function calls in the code, but they're HTTP endpoints. Anything a client sends can be sent by anyone, and anything a server action returns is visible on the wire.

---

## Decision

Complete a focused security hardening pass before implementing Plaid OAuth or 2FA. No new features until this is done.

---

## The Four Issues

### 1. Recovery token leaking to the client (Critical, commit 0dc954c)

`forgotPw`, `resetPw`, and `resendRecoveryLink` returned `{ data: parseStringify(res) }`, forwarding Appwrite's raw `Models.Token`, including the plaintext recovery `secret`, into the server action response payload. Because Next.js serializes server action returns to the browser, the token was visible in the Network/RSC panel. Anyone who called `forgotPw({ email: "victim@x.com" })` could read the reset token directly from the response and complete a password reset without the victim ever opening their email.

**Fix:** Narrowed all three actions to `Promise<ActionResponse<null>>`. A caller audit confirmed nothing ever read `.data` on these responses, so the fix is a pure exposure removal with no behavior change.

_Files:_ `lib/actions/user.actions.ts`

---

### 2. Cross-user PII and credential leak on every bank transfer (Critical, commit a229a9d)

This was the unanticipated finding from the broader wire audit. `PaymentTransferForm.tsx`, a client component, called `getBank` and `getBankByAccountId` directly. Those functions returned raw Appwrite bank rows, which include each party's Plaid `accessToken`, Dwolla `fundingSourceUrl`, and, because the `Bank` table's `userId` is a relationship attribute Appwrite auto-expands, the receiver's full `User` document: SSN, date of birth, home address, and email.

Every transfer shipped the recipient's SSN/DOB/address plus both parties' bank credentials into the sender's browser in the plain network response. An attacker only needed a target's shareable account ID, not even a completed transfer, to harvest their PII.

**Fix:** Added a `transferFunds` server action that performs the entire sender/receiver lookup, Dwolla transfer, and transaction-record flow server-side, returning only `{ success, error }`. The client no longer touches a bank or user row at all. `getBank` and `getBankByAccountId` marked server-only; verified via grep that no client component imports them.

_Files:_ `lib/actions/user.actions.ts`, `components/PaymentTransferForm.tsx`, `types/index.d.ts`  
_Tests:_ `__tests__/transfer.test.tsx` rewritten around the new action (39/39 passing).

---

### 3. Shareable account ID used base64 encoding, not encryption (High, commit 2913dde)

`encryptId`/`decryptId`, used to obfuscate the Plaid account ID handed out as a shareable ID for receiving transfers, were literally `btoa`/`atob`. Base64 is an encoding, not encryption, and is trivially reversible by anyone who saw a shareable ID.

**Fix:** Replaced with AES-256-GCM in a new server-only module, `lib/server/encryption.ts`, with the key sourced from `ACCOUNT_ID_ENCRYPTION_KEY`. The GCM auth tag catches tampering. Decryption now happens exclusively inside `transferFunds`, the server action from item 2. The client forwards the encrypted ID unchanged and never decrypts it.

_Files:_ `lib/server/encryption.ts` (new), `lib/actions/user.actions.ts`, `components/PaymentTransferForm.tsx`  
_Tests:_ `__tests__/encryption.test.ts`, round-trip, non-determinism, tamper detection, and missing-key handling (6/6 passing).

---

### 4. No server-side input validation (High, commit 1fdf18e)

Every Zod schema was wired up client-only via `zodResolver` in React Hook Form. A Next.js server action is a real HTTP endpoint, so a direct POST to `signUp` or `transferFunds` bypassed every validation rule. The `transferFunds` amount field reached Dwolla with no validation at all: no positivity check, no format check, no upper bound.

A secondary issue was found in the same pass: `signUp` built its Appwrite row via `...userData`, a blind object spread. Extra JSON properties in a raw POST, such as a forged `dwollaCustomerId`, would have been written straight into the row.

**Fix:** Added shared validation primitives, `nameField()` with a Unicode-letter allowlist and `freeTextField()` with trim, control-character stripping, and a length cap, used by both client schemas and a new server-only module, `lib/server/validation.ts`. `transferAmountField` normalizes the UI's currency-formatted string into a validated positive decimal of no more than $1,000,000 with two decimal places before it reaches Dwolla. `safeParse` wired into `signUp`, `transferFunds`, `resetPw`, and `forgotPw`. `signUp` now writes only the four explicitly validated fields, closing the mass-assignment hole.

_Files:_ `lib/utils.ts`, `lib/server/validation.ts` (new), `lib/actions/user.actions.ts`  
_Tests:_ `__tests__/validation.test.ts`, 16 cases including HTML-payload rejection, weak-password rejection, amount edge cases, and mass-assignment field stripping.

---

## Alternatives Considered

| Option                                         | Pros                                                                                      | Cons                                                                                      |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Fix now, before Plaid OAuth/2FA** _(chosen)_ | Security debt doesn't compound into more complex flows, easier to audit a smaller surface | Delays feature work                                                                       |
| **Fix alongside Plaid OAuth/2FA**              | No delay                                                                                  | Issues get harder to isolate when the surface is growing                                  |
| **Fix later**                                  | None                                                                                      | Items 1 and 2 are critical issues that shouldn't exist in any state resembling production |

---

## Consequences (Expected)

**Good:**

- The `secret` leak closed before any further auth work builds on top of it.
- Narrow DTOs per action make future audits faster and the data contract between server and client explicit.
- The sanitization pass sets a consistent baseline before Dwolla payment flows introduce additional free-text fields.

**Bad / Trade-offs:**

- Every `parseStringify()` call needed individual review. Thorough work, not quick work.

**Risks:**

- The network capture to confirm item 1 was a required first step before fixing. Confirmed: `secret` was populated in practice.

---

## Consequences (Actual)

The original proposal scoped three items. Four were fixed. The "broader wire audit" item, scoped as item 3 in the proposal, turned out to be the most severe finding of the pass, uncovering the cross-user PII leak in item 2 above. Item 3 in the actual work, the base64 encoding issue, was a follow-on from fixing item 2 and wasn't anticipated at all in the original proposal.

Three rules that emerged from the fixes, applicable beyond this codebase:

1. **Client-side validation is UX, not security.** It has to be re-run at the server action, or it doesn't exist.
2. **Return narrow DTOs, not SDK objects.** `parseStringify(sdkResponse)` is convenient and dangerous. SDK models carry more than the UI needs, including fields that were never meant to leave the server.
3. **Validation, sanitization, and output encoding are three different jobs.** Validation allowlists structured fields. Sanitization normalizes free text. Output encoding, React's automatic escaping, is the actual XSS defense at render time. Conflating them is how gaps like item 4 happen.

Test coverage held throughout. The full Jest suite plus `tsc --noEmit` confirmed zero regressions after each commit: the same 30 pre-existing test failures and 21 pre-existing type errors, all unrelated to this work, appeared identically before and after each change.

---

## References

- [Appwrite Models.Token documentation](https://appwrite.io/docs/references/cloud/models/token)
- [ADR-001: Appwrite over Supabase and Firebase](ADR-001-appwrite-vs-supabase-firebase.md)
- Security backlog surfaced during reset-pw resend work, 2026-08-24
