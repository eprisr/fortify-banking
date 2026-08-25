# ADR-005: Refactoring the Auth Flow

**Date:** 2026-08/25 _(documented retroactively)_  
**Status:** Accepted — core implementation complete; navigation access scope still being determined
**Author:** Epris R.

---

## Context

Two separate problems pointed to the same solution.

The first was a demo experience problem. Fortify's signup flow requires a significant amount of personal information — name, address, date of birth, last four of a Social Security number — because Plaid and Dwolla require it even in sandbox mode. Asking for all of that, then immediately asking the user to link a bank account, is a lot to put in front of someone exploring the project for the first time. There needed to be a path through the app that didn't require full onboarding to see what the dashboard actually does.

The second was a session handling problem. When an Appwrite session expires, the application loses its reference to the user's linked account data and surfaces an error state rather than handling the disconnection gracefully. A guest mode with a realistic fallback dashboard solves both: it's the "link later" path after signup and the graceful degradation path when a session disconnects.

---

## Decision

Implement a guest mode that:

- Is offered explicitly at the end of signup as a "link later" option alongside "link now"
- Shows a realistic-looking dashboard populated with hardcoded dummy data — balance, transactions, and spending categories
- States explicitly on the signup confirmation screen that the user is in guest mode
- Displays a persistent top banner throughout the app prompting the user to connect their bank account
- Triggers the full Plaid linking flow when the user clicks that banner

---

## Alternatives Considered

### For dummy data storage

| Option                                         | Pros                                                                                     | Cons                                                                                   |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Hardcoded constants / JSON file** _(chosen)_ | Predictable; easy to control what the dashboard looks like; no additional infrastructure | Static — can't simulate dynamic behavior like new transactions appearing               |
| **Dynamically generated data**                 | Could simulate more realistic behavior over time                                         | Adds complexity for a demo context where predictability is more valuable than dynamism |
| **Separate mock database**                     | Most realistic simulation                                                                | Significant overhead for what is essentially a preview experience                      |

In a demo context, predictable and realistic-looking beats dynamically accurate. The goal is for a first-time visitor to understand what the app does — not to simulate a live account.

### For the UX pattern

| Option                                               | Pros                                                                         | Cons                                                                               |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Confirmation page + persistent banner** _(chosen)_ | Explicit at the point of decision; non-blocking but always visible afterward | Banner requires careful styling to stay informative without becoming annoying      |
| **Modal or interstitial on every visit**             | Hard to miss                                                                 | Disruptive; would feel punitive for someone deliberately choosing to explore first |
| **No explicit indication**                           | Cleaner UI                                                                   | Confusing — user might not realize the data isn't real                             |

The banner pattern is used by enough financial apps (Plaid's own demos included) that it reads immediately as "something is pending" without requiring the user to stop and deal with it.

---

## Consequences

**Good:**

- The app is now fully explorable without requiring Plaid and Dwolla sandbox credentials or going through the full identity collection flow.
- The persistent banner keeps the path to a real connected account visible without blocking the experience. The Plaid flow is one tap away at any point.
- The same dashboard components work for both real and guest data, avoiding a forked codebase for two versions of the same screen.
  **Bad / Trade-offs:**
- Hardcoded dummy data needs to look realistic — a $12 balance and two transactions doesn't tell a useful story about what the app does. The data needs enough variety to demonstrate spending categories, transaction history, and balance display meaningfully.
- The two-data-path architecture — real Plaid data vs. dummy constants — adds conditional logic to dashboard components that didn't exist before. That complexity needs to stay contained and not bleed into components that don't need to know which mode they're in.
  **Risks:**
- Navigation access in guest mode hasn't been fully scoped. Some pages — transfers, account settings — reference real account data and may not degrade gracefully with dummy data. That boundary needs to be defined and enforced, either by locking those pages or by extending the dummy data to cover them.

---

## References

- [ADR-005: Auth refactor](ADR-005-auth-refactor.md) — guest mode was first scoped as part of the auth refactor and deferred
- [Plaid Link documentation](https://plaid.com/docs/link/)
