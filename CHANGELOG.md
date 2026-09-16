# Changelog

All notable milestones in Fortify Banking's development, newest first. This file was backfilled on 2026-09-16 from the full git history; entries before that date are reconstructed, not written in real time.

## 2026-09-14 — Email verification and Appwrite MFA

Added optional email-based MFA, prompted right after a user links a bank account rather than at signup, plus email verification and recovery codes. The work surfaced eight bugs along the way, most critically that `signIn()` never handled Appwrite's `user_more_factors_required` response, so any MFA-enabled account silently failed to log in. Appwrite Auth is now the sole source of truth for verification and MFA status; the database no longer mirrors those fields.

[ADR-008](docs/decisions/ADR-008-Plaid-oAuth-MFA.md)

## 2026-08-31 — Guest mode

Added a way to browse the dashboard without signing up, doubling as the fallback when a session disconnects. Includes a strict no-login demo path and a fix for a guest identity that wasn't persisting correctly.

[ADR-006](docs/decisions/ADR-006_Guest-Mode.md) · [Blog post](https://www.eprisr.com/blog/Guest-Mode)

## 2026-08-27 — Bug-fix pass: transfers, routing, and error leaks

Fixed issues the new test coverage turned up: a schema mismatch that meant no real transfer could ever submit, a Dwolla institution name that was never actually populated, and an unhandled Appwrite exception leaking raw error internals to the sign-in UI. Also cleaned up duplicate back-navigation on the auth pages and fixed the unauthenticated root route rendering blank instead of redirecting.

## 2026-08-27 — Playwright end-to-end suite and expanded Jest coverage

Installed and configured Playwright for real end-to-end journeys (signup, bank connection, Plaid sandbox, reconnect flow), alongside new Jest coverage for the bank, Dwolla, and user server actions using MSW-mocked handlers.

## 2026-08-26 — Plaid OAuth alongside credential-based linking

Added Plaid's OAuth flow as an option next to the existing Plaid Link credential flow, so a user at a supporting bank authenticates directly on the bank's own site instead of through Plaid's interface.

[ADR-008](docs/decisions/ADR-008-Plaid-oAuth-MFA.md)

## 2026-08-26 — Marketing landing page

Built a public marketing site ahead of the authenticated app: hero, feature marquee, how-it-works, security, and CTA sections, plus a footer, using Sora and DM Sans.

## 2026-08-25 — Security hardening pass

A focused audit before starting Plaid OAuth and MFA work, all four findings tracing back to the same root cause: treating the server/client boundary as trusted when it isn't. Fixed a plaintext password-reset token leaking into the server action response, a critical cross-user PII and credential leak on every bank transfer (recipient SSN, DOB, address, and both parties' bank credentials were shipping to the sender's browser), a shareable account ID using base64 encoding instead of real encryption, and missing server-side input validation.

[ADR-007](docs/decisions/ADR-007_Security-Hardening.md)

## 2026-08-24 — Design system overhaul

Reworked the app's visual system: new ink/paper/plum color palette, typography, and shadows applied across auth, dashboard, and banking views. Reset-password and welcome pages were deliberately left on the old purple palette pending a later pass.

[Blog post](https://www.eprisr.com/blog/Designing-a-System)

## 2026-08-23 — Migrate off the Appwrite React SDK

Uninstalled `@appwrite/react` and its dependencies, and improved error handling across the user, bank, and Dwolla server actions.

## 2026-07-14 — Regression test suite: auth, home, navbar, and transfers

Added test coverage for sign-in, forgot password, reset password, home, quicklinks, navbar, and the transfer flow.

## 2026-07-04 — Mobile-first dashboard UI overhaul

Reworked the dashboard's spacing, navigation, buttons, and the monthly spending chart for mobile.

## 2026-06-29 — Dashboard features: monthly spending, recent transactions, demo data

Added a monthly spending card and a proper recent transactions view, plus demo data so the dashboard can be explored without a live bank connection.

## 2026-06-25 — Auth flow refactor: multistep signup

Split signup into a multistep form with its own progress bar and decoupled Dwolla customer creation from the signup step itself. Phase 1 of the planned refactor; guest mode was scoped as phase 2.

[ADR-005](docs/decisions/ADR-005_Auth-Refactor.md) · [Blog post: The Reality of Auth](https://www.eprisr.com/blog/Reality-of-Auth) · [Blog post: A Fresh Look at Authentication](https://www.eprisr.com/blog/A-Fresh-Look-at-Authentication)

## 2026-03-02 — Resume development: Next.js 16 upgrade and test infrastructure

Upgraded to Next.js 16 and fixed the resulting breakage (async APIs, cookies, Zod errors). Installed Jest and React Testing Library and wrote the first tests, covering the login flow, home, and payment transfer.

[ADR-004](docs/decisions/ADR-004_Testing-Strategy.md)

## 2024-09-17 — Initial build: Next.js banking app on Appwrite, Plaid, and Dwolla

Built the original app from a tutorial base: Appwrite for auth and application data, Plaid for bank linking, and Dwolla for ACH transfers, kept as two separate services rather than one that does both. Covered signup, sign-in, password recovery, bank account linking, transfers, and a transaction history view.

[ADR-001](docs/decisions/ADR-001_Appwrite-vs-Supabase-Firebase.md) · [ADR-002](docs/decisions/ADR-002_Dwolla-vs-Stripe.md) · [ADR-003](docs/decisions/ADR-003_Plaid-Dwolla-Pattern.md) · [Blog post](https://www.eprisr.com/blog/Why-this-Stack)
