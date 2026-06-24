# ADR-005: Refactoring the Auth Flow

**Date:** 2026-06-24 _(documented at the start of implementation — see note in Context)_  
**Status:** Proposed  
**Author:** eprisr

---

## Context

_Note: This ADR was written as work on the refactor was already starting, rather than before. The Context and Decision sections reflect the plan going in; Consequences should be revisited once the changes are in place to capture what actually happened._

The current auth implementation works, users can register, log in, link a bank account, and reach the dashboard. But three problems have surfaced as the project has grown:

1. **The demo experience is poor.** Registration asks for a full name, address, date of birth, and the last four of a Social Security number, all at once, in a single long form with no indication that the SSN field is fictional. This mirrors real Plaid/Dwolla identity requirements but creates unnecessary friction and hesitation for anyone exploring the project.

2. **The code structure has outgrown its original shape.** All four auth states (signup, signin, forgot-password, reset-password) live in a single `AuthForm` component. Each state has grown in complexity since the component was first written, and they no longer belong together.

3. **There's no fallback when something goes wrong.** If a session times out or an account becomes disconnected, the user hits a dead end and has to start over. There's also no way to browse the app without going through full registration and bank linking.

None of these are urgent in the sense of broken functionality, the app works for a fresh session end to end. But they're the kind of structural debt that gets harder to unwind the longer a project grows around them.

---

## Decision

Refactor the auth flow in three parts:

1. **Split `AuthForm` into separate components** by responsibility: signup, signin, forgot-password, and reset-password each get their own component rather than sharing one file with conditional logic.

2. **Rebuild signup as a multi-step flow** with sandbox-appropriate dummy data pre-filled, so a first-time visitor isn't presented with a single intimidating form asking for sensitive-looking information with no context.

3. **Add a guest mode** with realistic dummy dashboard data, available both as an explicit "continue as guest" option and as a fallback when an account's bank data is disconnected or a session has expired.

---

## Alternatives Considered

| Option                                                                                   | Pros                                                                                                | Cons                                                                                                                                 |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Split components + multi-step signup + guest mode** _(chosen)_                         | Addresses all three known problems directly; improves both code maintainability and demo experience | More upfront work than a partial fix; touches several parts of the app at once                                                       |
| **Leave `AuthForm` as one component, just add guest mode**                               | Smaller, faster change                                                                              | Doesn't address the underlying code structure problem; guest mode logic would have to bolt onto an already-strained component        |
| **Full auth rewrite using a form library (e.g., React Hook Form with a wizard pattern)** | Could solve multi-step state management more elegantly out of the box                               | Adds a new dependency and a learning curve for a problem that's solvable with the current toolset; bigger scope than the actual need |

The middle option was tempting as the lowest-effort fix, but it would leave the root cause — one component carrying too much logic — untouched. The third option was more tooling than the problem actually requires right now.

---

## Consequences (Expected)

**Good:**

- Each auth state becomes independently testable and easier to reason about.
- A multi-step signup with pre-filled sandbox data should lower the friction of exploring the app, especially for anyone who isn't a developer evaluating the project.
- Guest mode solves both the "session disconnected" dead end and gives anyone browsing the project a way to see the dashboard without going through identity collection.

**Bad / Trade-offs:**

- Guest mode introduces a second data path through the dashboard (real linked-account data and dummy guest data) which means dashboard components need to handle both without diverging into two separate codebases.
- Splitting `AuthForm` means more files and more explicit prop-passing or shared state management between the new components, where before everything had implicit access to the same local state.

**Risks:**

- It's possible the multi-step signup adds friction of its own if not scoped carefully, more screens isn't automatically better than one long form. Worth watching once it's built.

---

## Consequences (Actual)

_To be filled in after implementation._

---

## References

- [ADR-001: Appwrite over Supabase and Firebase](ADR-001-appwrite-vs-supabase-firebase.md)
- Repository: [github.com/eprisr/fortify-banking](https://github.com/eprisr/fortify-banking)
