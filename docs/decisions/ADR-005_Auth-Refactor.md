# ADR-005: Refactoring the Auth Flow

**Date:** 2026-06-24 _(documented at the start of implementation — see note in Context)_  
**Status:** Accepted — Phase 1 (signup refactor) complete; Phase 2 (guest mode) in progress  
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

Implementation happened across two branches: `login-flow-ui-updates` and `signup-multistep`. Here's how the three planned changes actually played out.

### 1. Splitting `AuthForm`

This landed differently than originally scoped. The plan called for four separate components (signup, signin, forgot-password, reset-password) each fully independent. What actually happened was a partial split: **signup** was pulled out entirely into its own `SignUpForm` component, while signin, forgot-password, and reset-password still share `AuthForm`. That's a reasonable middle ground, signup was by far the most complex and fastest-growing of the four states, so extracting it first delivered most of the maintainability benefit without requiring a full rewrite of the simpler states in the same pass.

A few things came out of this that weren't explicitly planned:

- An **auth form config file** was added to hold shared types, default values, and other reusable variables, a layer the original ADR didn't call out but that became necessary once logic was split across files.
- **Auth middleware** was introduced to fetch user and account data in one place, rather than re-fetching it separately on every page that needed it. This wasn't in the original scope either; it emerged from noticing the same fetch logic duplicated across pages once the refactor was underway.
- Some **login flow copy** was cleaned up as a smaller, unplanned side effect of working through that part of the code.

### 2. Multi-step signup

This is where most of the effort went, and it shifted in scope a few times along the way.

The signup fields were split into two steps rather than the three originally pictured, with a Zod schema broken apart to validate each step independently and rejoined for final submission. Along the way, a few UX additions got added that weren't in the original plan: a **visual password validation checklist**, a **progress bar**, and removal of the image header that had been taking up space on the signup screen, all aimed at making the multi-step form feel lighter than the single long form it replaced.

A genuinely unplanned decision came up partway through: **when to create the Dwolla account.** The original assumption was that Dwolla setup would happen later, decoupled from signup. Partway through building the steps, that got reconsidered: Dwolla account creation was moved to happen at the same time as Plaid account creation, which changed what had been planned as "step three" into "step two." This is exactly the kind of mid-build decision the original ADR couldn't have anticipated, since it only became obvious once the steps were actually being wired together.

An unrelated detour: a **ShadCN theming issue** surfaced on buttons partway through, components no longer looked right out of the box, likely from an earlier change to project setup or variables. Fixing that took a separate pass before the step work could continue.

The components were eventually organized into a dedicated folder for the signup flow, which wasn't called out in the original plan but followed naturally from how many new files the step-splitting produced.

### 3. Guest mode / fallback handling

This is the least complete part of the three. What exists now: after signup, a user is offered a choice: link a bank account now, or do it later.

- Choosing **"now"** currently routes to the existing dashboard without actually prompting the Plaid connection; that wiring isn't finished yet.
- Choosing **"later"** routes to a confirmation screen acknowledging the account was created, with messaging that dummy data is coming, but since the dummy dashboard doesn't exist yet, this path also currently falls through to the existing dashboard.
  In other words, the branching logic for the choice exists, but neither path yet does what it's ultimately supposed to do. The guest-mode dashboard with realistic dummy data (the part of the original plan meant to solve the "session disconnected" dead end) hasn't been built.

### Summary: Plan vs. Reality

| Planned                                           | What Actually Happened                                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Full 4-way `AuthForm` split                       | Signup extracted; signin/forgot/reset still combined                                                   |
| Multi-step signup, scope unspecified              | 2 steps, plus password checklist, progress bar, and header removal                                     |
| Guest mode with dummy data as a built-in fallback | Branching UI exists; both paths currently fall through to the real dashboard; dummy data not yet built |
| _(not planned)_                                   | Auth middleware for shared user/account fetching                                                       |
| _(not planned)_                                   | Shared auth form config file                                                                           |
| _(not planned)_                                   | Dwolla account creation moved to coincide with Plaid linking, reordering the steps                     |
| _(not planned)_                                   | ShadCN theming fix required mid-refactor                                                               |

The biggest gap between plan and reality is sequencing: the work that turned out to matter most for code health (middleware, the config file) wasn't anticipated going in, while the piece the original ADR leaned on most heavily as the payoff (guest mode) is the piece still unfinished.

---

## References

- [ADR-001: Appwrite over Supabase and Firebase](ADR-001-appwrite-vs-supabase-firebase.md)
- Repository: [github.com/eprisr/fortify-banking](https://github.com/eprisr/fortify-banking)
