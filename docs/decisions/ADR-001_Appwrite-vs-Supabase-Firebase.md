# ADR-001: Appwrite as the Backend-as-a-Service Layer

**Date:** June 3, 2026  
**Status:** Accepted  
**Author:** Epris R.

> Note: This decision was made during initial project setup and documented retroactively.

---

## Context

Fortify needed a backend layer to handle three things: user authentication, session management, and application data storage. The options were either assembling a custom backend, or reaching for a Backend-as-a-Service (BaaS), a single platform that bundles auth, database, and storage under one SDK.

For a project focused on understanding fintech infrastructure, spending significant time building and maintaining a custom auth server would have been the wrong trade-off. The goal was to keep the identity and data layer clean, auditable, and out of the way, so the more interesting problems (Plaid, Dwolla, financial logic) could stay in focus.

The three realistic options were Appwrite, Supabase, and Firebase, with a fourth option of assembling a custom stack using Clerk, Prisma, and a hosted database.

---

## Decision

Use **Appwrite** as the BaaS layer for authentication, session management, and the application database.

---

## Alternatives Considered

| Option                           | Pros                                                                                          | Cons                                                                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Appwrite** _(chosen)_          | Self-hostable; clean SDK; no Google/AWS dependency; single platform for auth, DB, and storage | Smaller ecosystem than Supabase; less SQL flexibility for complex queries                                              |
| **Supabase**                     | PostgreSQL foundation; massive community; excellent DX; strong Next.js ecosystem support      | Hosted only unless self-hosting is managed manually; slightly heavier setup                                            |
| **Firebase**                     | Mature and battle-tested; real-time database capabilities; Google-scale infrastructure        | Strong vendor lock-in; NoSQL data model gets unwieldy for relational financial data; pricing unpredictability at scale |
| **Clerk + Prisma + PlanetScale** | Best-in-class for each individual concern; maximum control                                    | Significantly more boilerplate; three separate services to manage and integrate                                        |

---

## Consequences

**Good:**

- Appwrite's self-hostability is meaningful in a financial context. User identity and account data can stay on infrastructure you control — Not inherently necessary at the sandbox stage, but the right architectural philosophy for a banking application.
- One SDK covers auth, database, and file storage. This keeps the integration surface small and the codebase consistent.
- No dependency on Google infrastructure removess a category of vendor lock-in concern.

**Bad / Trade-offs:**

- Supabase's PostgreSQL foundation would be a stronger long-term choice for complex financial queries — joins, aggregations, and reporting across transaction history are natural in SQL and less natural in Appwrite's document model.
- The Appwrite developer community is smaller. When something goes wrong, Stack Overflow and community forums are thinner resources compared to Supabase or Firebase.

**Risks:**

- As the application grows and transaction data becomes more relational and complex, Appwrite's database may become a limiting factor. A migration to a SQL-backed solution (Supabase or a raw PostgreSQL instance) is worth planning for if query complexity increases significantly.

---

## References

- [Appwrite Documentation](https://appwrite.io/docs)
- [Supabase vs Appwrite comparison](https://appwrite.io/blog/post/appwrite-vs-supabase)
- [Appwrite Self-Hosting Guide](https://appwrite.io/docs/advanced/self-hosting)
