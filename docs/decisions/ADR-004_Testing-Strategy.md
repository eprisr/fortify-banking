# ADR-004: Testing Strategy — Jest, React Testing Library, and MSW

**Date:** June 3, 2026
**Status:** Accepted  
**Author:** Epris R.

> Note: This decision was made during initial project setup and documented retroactively. The testing infrastructure is in place; coverage is currently thin and actively being expanded.

---

## Context

A fintech application has a specific testing challenge that most web apps don't: the most important logic (authentication flows, account linking, fund transfers) depends almost entirely on external services. Calling Plaid, Dwolla, and Appwrite in a test suite isn't realistic. Real API calls are slow, stateful, and require live credentials. Any meaningful test coverage requires a strategy for mocking those service boundaries in a way that's realistic without being brittle.

That constraint shaped the tool choices more than anything else. The goal wasn't just run some tests. It was to set up infrastructure that could grow into meaningful coverage of auth flows, financial logic, and UI behavior without becoming a maintenance burden as the application evolves.

---

## Decision

Use **Jest** as the test runner, **React Testing Library (RTL)** for component testing, and **Mock Service Worker (MSW)** for API mocking.

---

## Alternatives Considered

### Test Runner: Jest vs. Vitest

| Option              | Pros                                                                                                  | Cons                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Jest** _(chosen)_ | Battle-tested; enormous ecosystem; official Next.js configuration guide; excellent TypeScript support | Slower than Vitest; CommonJS-first, which can require configuration for ESM packages |
| **Vitest**          | Significantly faster; ESM-native; compatible with Vite tooling                                        | Next.js + Vitest setup is less documented; ecosystem still maturing relative to Jest |

Vitest is a compelling option and growing fast — particularly for projects already using Vite. Next.js, however, has official Jest configuration guidance and a larger body of community examples. For a project where the testing infrastructure was being set up from scratch, Jest's stability and documentation coverage made it the lower-friction choice.

---

### Component Testing: React Testing Library vs. Enzyme

| Option                               | Pros                                                                                                                                    | Cons                                                                                                           |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **React Testing Library** _(chosen)_ | Tests from the user's perspective; encourages behavior-over-implementation testing; actively maintained; the current community standard | Requires a mental shift away from testing component internals                                                  |
| **Enzyme**                           | Familiar to developers from older React projects; allows direct testing of component state and props                                    | Largely deprecated; poor support for React 18+; encourages testing implementation details rather than behavior |

RTL's core philosophy: test what the user sees and interacts with, not how the component manages its internal state, is particularly well-suited to a banking application. The question is whether the correct balance renders on screen, not whether a component's `balance` state variable is set correctly. That distinction matters when you're dealing with financial data that users are making decisions based on.

Enzyme is largely deprecated as of React 18 and is not a realistic option for new projects.

---

### API Mocking: MSW vs. jest.mock()

| Option                        | Pros                                                                                                                       | Cons                                                                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **MSW** _(chosen)_            | Intercepts at the network level; more realistic than module-level mocking; works in both test environments and the browser | Additional setup; requires a service worker configuration                                                                     |
| **jest.mock()**               | Built into Jest; no additional dependencies; straightforward for simple cases                                              | Mocks at the module level, not the network level; tightly coupled to implementation; breaks if the underlying library changes |
| **axios-mock-adapter / nock** | Useful for specific HTTP clients                                                                                           | Library-specific; not portable if the HTTP client changes                                                                     |

This is the most consequential tool choice in the stack and the one worth understanding carefully.

`jest.mock()` works by replacing a JavaScript module; for example, mocking the entire `fetch` function or a specific API client. The test never actually makes a network call. This works, but it has a significant downside: the mock is coupled to the implementation rather than the behavior. If you refactor a component to use a different HTTP client, or restructure how an API call is made, the mocks break even if the actual behavior hasn't changed.

MSW works differently. It intercepts requests at the network level — the actual fetch call is made, hits a mock service worker, and gets a controlled response back. The component or function being tested has no idea it's talking to a mock. This has two meaningful advantages for Fortify specifically:

1. **Realism.** The full request path is exercised — headers, request shape, response parsing — not just the module boundary. A Plaid API mock written in MSW behaves like Plaid responding, not like a mocked function returning a hardcoded object.
2. **Portability.** MSW handlers can be shared between the test environment and the browser. The same mock definitions used in Jest tests can run in the browser during local development, giving you consistent behavior without hitting real sandboxes.

For a project built around multiple external financial APIs, MSW's network-level approach gives the test suite a more realistic foundation to grow into.

---

## Consequences

**Good:**

- The infrastructure is in place to write meaningful tests without touching real Plaid, Dwolla, or Appwrite APIs.
- RTL's behavior-first philosophy keeps tests focused on what users experience — account balances render correctly, transfer flows complete, error states surface — rather than internal component mechanics.
- MSW handlers can double as development mocks, reducing dependency on live sandbox credentials during local development.

**Bad / Trade-offs:**

- Coverage is currently thin. The testing setup exists and the architecture is sound, but the actual test suite needs significant expansion — particularly around authentication flows, Plaid linking, and financial transaction logic.
- There is currently no end-to-end (E2E) testing layer. Jest and RTL cover unit and integration tests, but there are no browser-level tests (Cypress or Playwright) verifying complete user journeys across pages. This is a known gap.

**Risks:**

- The gap between infrastructure and coverage is real. A well-configured testing setup with low coverage can create a false sense of confidence. Priority areas for expanding coverage are: auth flows, Plaid account linking, Dwolla transfer logic, and protected route behavior.
- The absence of E2E tests means multi-page flows — for example, a user linking a bank account and then initiating a transfer — aren't verified end-to-end. This is the highest-risk untested area and a candidate for early Playwright coverage.

---

## What's Next

The immediate priority is writing tests that cover the application's highest-stakes logic:

- **Authentication** - registration, login, session expiry, and protected route redirects
- **Plaid linking flow** - mocked with MSW handlers that simulate Plaid's sandbox responses
- **Transfer logic** - unit tests for the financial calculation and validation layer
- **E2E coverage** - evaluating Playwright for full user journey tests across the Next.js app router

---

## References

- [Next.js Testing Guide (Jest)](https://nextjs.org/docs/app/building-your-application/testing/jest)
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/docs/)
- [MSW vs. jest.mock() — when to use each](https://mswjs.io/docs/faq)
