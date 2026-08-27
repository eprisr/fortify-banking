# ADR-001: Appwrite as the Backend-as-a-Service Layer

**Date:** June 3, 2026  
**Status:** Accepted  
**Author:** Epris R.

> Note: This decision was made during initial project setup and documented retroactively.

---

## Context

Appwrite came with the tutorial I used to get Fortify off the ground. I don't like using a tool without understanding why it's the right one, so after the fact I went looking for the reasoning, specifically whether Appwrite held up against the more commonly recommended alternatives: Supabase, Firebase, and a custom stack built with Clerk, Prisma, and a hosted database.

For a project centered on fintech infrastructure, the goal was to keep auth, sessions, and application data handled cleanly so the more interesting problems, Plaid, Dwolla, and financial logic, could stay in focus.

---

## Decision

Keep Appwrite as the BaaS layer for authentication, session management, and the application database.

---

## Alternatives Considered

| Option                         | Pros                                                                                         | Cons                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Appwrite** _(chosen)_        | Self-hostable, clean SDK, no Google dependency, one platform for auth, database, and storage | Smaller ecosystem than Supabase, less SQL flexibility for complex queries      |
| **Supabase**                   | PostgreSQL foundation, large community, strong Next.js ecosystem support, excellent DX       | Requires manual effort to self-host                                            |
| **Firebase**                   | Mature, battle-tested, Google-scale infrastructure                                           | Strong vendor lock-in, NoSQL model gets unwieldy for relational financial data |
| **Clerk + Prisma + hosted DB** | Best-in-class for each individual concern, maximum control                                   | Significantly more boilerplate, three services to integrate and maintain       |

---

## Consequences

**Good:**

- Appwrite's self-hostability matters philosophically for a banking application. User identity and account data can stay on infrastructure you control.
- One SDK covers auth, database, and file storage, keeping the integration surface small.
- No dependency on Google infrastructure.
  **Bad / Trade-offs:**
- Supabase's PostgreSQL foundation would be stronger for complex financial queries as transaction data grows. Joins, aggregations, and reporting across transaction history are natural in SQL and less natural in Appwrite's document model.
- The Appwrite developer community is smaller. When something goes wrong, there's less to find on Stack Overflow.
  **Risks:**
- As query complexity increases, Appwrite's database may become a limiting factor. A migration toward a SQL-backed solution is worth planning for if that happens.

---

## References

- [Appwrite Documentation](https://appwrite.io/docs)
- [Appwrite Self-Hosting Guide](https://appwrite.io/docs/advanced/self-hosting)
