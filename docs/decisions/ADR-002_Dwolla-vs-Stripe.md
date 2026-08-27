# ADR-002: Dwolla over Stripe for ACH Payment Processing

**Date:** June 3, 2026  
**Status:** Accepted  
**Author:** Epris R.

> Note: This decision was made during initial project setup and documented retroactively.

---

## Context

Dwolla came with the tutorial I used to get Fortify off the ground. Everyone defaults to Stripe. I almost did too, so I went looking for the actual reasoning behind the choice.

The use case is specific: bank-to-bank transfers. Every transfer in Fortify is the product, not a secondary capability. That distinction is what makes the tutorial's choice hold up.

It's also worth understanding upfront that the developer-accessible options for bank-to-bank ACH are narrower than most people expect. Services most people associate with this kind of money movement, Zelle, Venmo, and Cash App, aren't developer platforms. Zelle is a payment network operated by a consortium of major US banks, accessible only to licensed financial institutions through a proprietary partnership. Venmo and Cash App are closed consumer products with no public API. The realistic choices for a project like Fortify are Dwolla, Stripe ACH, and a small number of newer infrastructure providers like Moov.io or Modern Treasury.

---

## Decision

Keep Dwolla for ACH payment processing.

---

## Alternatives Considered

| Option                       | Pros                                                                                             | Cons                                                                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dwolla** _(chosen)_        | Purpose-built for ACH bank-to-bank transfers, clean data model, designed to work alongside Plaid | Smaller developer community, more complex setup, less name recognition                                                                                      |
| **Stripe**                   | Industry-leading DX, enormous community, ACH support available                                   | Card-first by design, ACH is a secondary capability built onto card rails                                                                                   |
| **PayPal / Braintree**       | Familiar to end users                                                                            | Even more card-focused than Stripe, lower developer experience                                                                                              |
| **Zelle / Venmo / Cash App** | Widely recognized, purpose-built for bank-to-bank movement                                       | Not accessible to developers. These are closed consumer platforms, not APIs. Zelle requires a direct institutional partnership with Early Warning Services. |

---

## Consequences

**Good:**

- Dwolla is built from the ground up for ACH. Its data model, customers, funding sources, transfers, maps directly to a banking application rather than being adapted from a card-payment framework.
- Dwolla and Plaid are designed to work together. Plaid verifies the bank account, Dwolla processes the transfer using those verified credentials. This is a standard pattern in production fintech, not a workaround.
- Building on Dwolla gives a more realistic picture of how fintech payment infrastructure actually works.
  **Bad / Trade-offs:**
- Dwolla's developer community is significantly smaller than Stripe's. Debugging means leaning heavily on official documentation.
- The initial setup is more involved than Stripe's streamlined integration.
- Card payments, subscriptions, or international transfers would require adding Stripe alongside Dwolla anyway.
  **Risks:**
- The gap between Dwolla's sandbox and production is steep: identity verification, bank account micro-deposits, and compliance requirements that sandbox skips entirely.

---

## References

- [Dwolla Documentation](https://developers.dwolla.com/docs)
- [Dwolla + Plaid Integration Guide](https://developers.dwolla.com/docs/balance/plaid)
- [Stripe ACH Documentation](https://stripe.com/docs/payments/ach-direct-debit)
