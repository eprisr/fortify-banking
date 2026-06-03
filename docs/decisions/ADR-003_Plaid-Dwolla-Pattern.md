# ADR-003: Separating Bank Linking (Plaid) from Payment Processing (Dwolla)

**Date:** June 3, 2026  
**Status:** Accepted  
**Author:** Epris R.

> Note: This decision was made during initial project setup and documented retroactively.

---

## Context

Handling money movement in a web application involves two distinct problems that are easy to conflate: connecting to a user's bank account, and moving money between accounts. These sound like one thing, but they involve different compliance requirements, different failure modes, and different service responsibilities.

The naive approach is to reach for a single service that does both, and several do, at least partially. The question was whether consolidating both responsibilities into one service was worth the trade-offs, or whether using purpose-built services for each concern was the better architecture.

---

## Decision

Use **Plaid** exclusively for bank account linking and verification, and **Dwolla** exclusively for ACH transfer processing. The two services are integrated but maintain strictly separate responsibilities: Plaid verifies, Dwolla moves.

---

## How This Works in Practice

```
User initiates bank link
  → Plaid OAuth flow (user authenticates with their bank directly)
  → Plaid returns verified account credentials
  → Credentials are passed to Dwolla as a verified funding source
  → Dwolla uses the funding source for ACH transfers

User initiates a transfer
  → Dwolla processes bank-to-bank ACH using the Plaid-verified source
  → Neither service handles what the other does
```

Plaid never touches money movement. Dwolla never handles bank authentication. Each service operates within its own domain.

---

## Alternatives Considered

| Option                        | Pros                                                                                                                               | Cons                                                                                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Plaid + Dwolla** _(chosen)_ | Clear separation of concerns; each service purpose-built for its role; mirrors production fintech patterns; failures stay isolated | Two services to manage; more integration complexity; more API credentials                                                                |
| **Stripe alone**              | Single service; simpler integration; better documentation                                                                          | ACH is secondary to card payments; bank linking experience is less robust than Plaid's; less realistic for a banking-focused application |
| **Plaid alone**               | One fewer integration; Plaid does have some payment capabilities                                                                   | Plaid's payment infrastructure is not its primary strength; less control over transfer logic                                             |

---

## Consequences

**Good:**

- Failures are isolated. A Plaid API outage affects account linking; it doesn't touch in-flight transfers. A Dwolla issue affects payments; it doesn't affect the ability to link accounts. This separation makes the system easier to reason about and debug.
- Each service is best-in-class for its responsibility. Plaid has the largest institution coverage and the most reliable OAuth linking experience. Dwolla has the cleanest ACH processing model for bank-to-bank transfers.
- This architecture mirrors how real fintech products are built. Identity verification, bank linking, and payment processing are treated as separate concerns in production systems — often with separate vendors. Building this way provides practical experience with that pattern.

**Bad / Trade-offs:**

- Two services means two sets of API credentials, two sandbox environments to configure, two documentation sources to navigate, and two potential failure points.
- The integration between Plaid and Dwolla — passing verified account tokens from one service to the other — adds a step that a single-service approach would eliminate. Debugging a failure in that handoff requires understanding both services simultaneously.

**Risks:**

- The gap between sandbox behavior and production for both services is non-trivial. Plaid's sandbox lets you link accounts instantly; production requires users to authenticate with their actual bank. Dwolla's sandbox skips identity verification steps that are mandatory in production. Any path to a production deployment would require significant additional compliance work on both sides.

---

## References

- [Plaid Documentation](https://plaid.com/docs/)
- [Dwolla + Plaid Integration Guide](https://developers.dwolla.com/docs/balance/plaid)
- [Plaid Institution Coverage](https://plaid.com/coverage/)
