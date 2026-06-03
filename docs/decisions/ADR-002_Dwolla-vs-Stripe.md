# ADR-002: Dwolla over Stripe for ACH Payment Processing

**Date:** June 3, 2026  
**Status:** Accepted  
**Author:** Epris R.

> Note: This decision was made during initial project setup and documented retroactively.

---

## Context

Fortify needed a payment processing layer to handle bank-to-bank fund transfers between users. Stripe is the default answer for almost any payment problem on the web; it's well-documented, universally understood, and capable of ACH transfers. The question was whether "capable of ACH" was the same as "built for ACH."

The use case here is specific: account-to-account transfers, not card charges. A user links their bank account and sends money to another user's linked account. There are no cards involved at any point. That distinction shaped the decision.

It's worth noting upfront that the developer-accessible options for bank-to-bank transfers are narrower than most people expect. Consumer apps like Zelle, Venmo, and Cash App are familiar reference points for this kind of money movement, but none of them offer a public API that developers can integrate. Zelle, for example, is a real-time payment network operated by a consortium of major US banks (Chase, Bank of America, Wells Fargo, and others). Accessing it requires a direct partnership with Early Warning Services, the entity that runs the network, which is only available to licensed financial institutions. Venmo and Cash App have the same limitation from the other direction, they're closed consumer platforms, not developer infrastructure. The realistic choices for a project like Fortify are effectively Dwolla, Stripe ACH, and a small number of newer fintech infrastructure providers like Moov.io or Modern Treasury.

---

## Decision

Use **Dwolla** for ACH payment processing rather than Stripe.

---

## Alternatives Considered

| Option                       | Pros                                                                                                                                | Cons                                                                                                                                                                                                                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dwolla** _(chosen)_        | Purpose-built for ACH bank-to-bank transfers; clean separation of concerns with Plaid; mirrors real fintech infrastructure patterns | Smaller developer community; more complex initial setup; less name recognition                                                                                                                                                                                          |
| **Stripe**                   | Industry-leading DX; enormous community; excellent documentation; ACH support available                                             | Card-first by design; ACH is a secondary capability, not the primary use case; fee structure less favorable for high-volume bank transfers                                                                                                                              |
| **PayPal / Braintree**       | Familiar to end users; handles ACH                                                                                                  | Even more card-focused than Stripe; lower developer experience quality; adds PayPal brand friction                                                                                                                                                                      |
| **Zelle / Venmo / Cash App** | Widely recognized by end users; purpose-built for bank-to-bank transfers                                                            | **Not accessible to developers.** These are closed consumer platforms, not developer APIs. Zelle requires a direct partnership with Early Warning Services and is only available to licensed financial institutions. Venmo and Cash App have no public integration API. |

---

## Consequences

**Good:**

- Dwolla is designed from the ground up for ACH transfers. Its data model (funding sources, transfers, customers) maps naturally to a banking application's mental model rather than being adapted from a card-payment model.
- Dwolla and Plaid are designed to work together. Plaid verifies and links the bank account; Dwolla processes the transfer using those verified credentials. This pairing is a standard pattern in production fintech systems, not a workaround.
- Building on Dwolla provides a more realistic picture of how fintech payment infrastructure actually works, which was a primary goal of the project.

**Bad / Trade-offs:**

- Dwolla's developer community is significantly smaller than Stripe's. Debugging unfamiliar behavior means leaning on official documentation rather than community resources.
- The initial setup is more involved — creating Dwolla customers, funding sources, and managing the verification workflow requires more steps than Stripe's streamlined integration.
- If the project's payment needs ever expand to include card charging, subscriptions, or international payments, Stripe would need to be added alongside Dwolla anyway.

**Risks:**

- Dwolla's Sandbox environment closely mirrors production behavior, but the gap between sandbox and production (identity verification, bank account micro-deposits) is steeper than Stripe's. Real-world deployment would require additional compliance and verification work.

---

## References

- [Dwolla Documentation](https://developers.dwolla.com/docs)
- [Dwolla + Plaid Integration Guide](https://developers.dwolla.com/docs/balance/plaid)
- [Stripe ACH Documentation](https://stripe.com/docs/payments/ach-direct-debit)
