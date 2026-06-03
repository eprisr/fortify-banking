# Fortify Banking

> A full-stack fintech application wiring together real banking infrastructure (Plaid, Dwolla, and Appwrite) to explore what it actually takes to move money securely on the web.

[![UI - iBank by Seju](https://img.shields.io/badge/Figma-iBank_by_Seju-blue?logo=figma&logoColor=white)](https://www.figma.com/community/file/1322236579213422290) [![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Next.js](https://img.shields.io/badge/Next.js-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

<!-- Replace with an actual screenshot or screen recording -->
<!-- ![Fortify Banking Dashboard](public/screenshot.png) -->

## What This Is

Most web apps deal with user accounts and data. A banking application deals with all of that plus real money movement, bank-grade authentication, decimal precision where floating-point errors have consequences, and integrations with financial institutions that don't tolerate loose error handling.

Fortify is a full-stack banking application built to work through those problems hands-on. It's connected to real fintech infrastructure: Plaid for bank account linking, Dwolla for ACH payment processing, and Appwrite for identity and data management. The goal wasn't to ship a product; it was to understand, at an implementation level, how these systems fit together and where the hard parts actually live.

---

## Features

- **Secure Authentication** - Registration, login, and session management via Appwrite, with protected routes throughout
- **Bank Account Linking** - OAuth-based institution connectivity via Plaid, with real account and balance data in sandbox
- **Real-Time Dashboard** - Live account balances and recent transactions pulled from linked accounts
- **Fund Transfers** - Peer-to-peer transfer workflow built on Dwolla's ACH infrastructure _(in progress)_
- **Type-Safe Financial Logic** - Explicit decimal precision handling with TypeScript and Zod to prevent floating-point errors on currency values
- **Error Monitoring** - End-to-end observability across client, server, and edge runtimes with Sentry
- **Responsive UI** - Optimized for desktop and mobile using Tailwind CSS and shadcn/ui

---

## Tech Stack

| Layer           | Technology                         | Purpose                                            |
| --------------- | ---------------------------------- | -------------------------------------------------- |
| Framework       | Next.js (App Router)               | Full-stack React with SSR, SSG, and edge support   |
| Language        | TypeScript                         | End-to-end type safety                             |
| Auth & Database | Appwrite                           | User management, sessions, and application data    |
| Bank Linking    | Plaid                              | Secure OAuth handshake with financial institutions |
| Payments        | Dwolla                             | ACH transfer processing                            |
| Validation      | Zod                                | Runtime schema validation at data boundaries       |
| Styling         | Tailwind CSS + shadcn/ui           | Utility-first styling with accessible components   |
| Testing         | Jest + React Testing Library + MSW | Unit, integration, and API-level mocking           |
| Monitoring      | Sentry                             | Error tracking across all Next.js runtimes         |

---

## Architecture

Fortify is built on Next.js's App Router, which gives explicit control over where code runs: browser, server, or edge. That distinction matters more in a fintech context than in most web apps.

### Server-first by default

Sensitive operations (fetching balances, validating sessions, calling Plaid and Dwolla) happen server-side. API keys stay out of the browser, and response data is shaped before it reaches the client. Next.js Server Components make this the path of least resistance rather than something you have to fight for.

### Three services, one responsibility each

The external service layer is deliberately separated:

- **Appwrite** owns identity and application data - user records, sessions, and the transaction ledger.
- **Plaid** owns the bank connection - the OAuth flow, institution credentials, and account verification. It never touches money movement directly.
- **Dwolla** owns the actual transfer - ACH processing using account credentials that Plaid has already verified.

Keeping these boundaries clean means each service does one thing well and failures stay isolated.

### Zod at every data boundary

TypeScript provides compile-time safety, but financial data crosses runtime boundaries: API responses, form submissions, external webhook payloads. Zod validates the shape and type of that data at those boundaries, so the application fails loudly and early rather than silently passing a malformed value into a ledger calculation.

Currency values are handled with explicit decimal precision logic rather than native JavaScript floats. `0.1 + 0.2` is not a banking number.

### Sentry across all runtimes

Next.js runs code in three distinct environments: the browser, the Node.js server, and the edge runtime (used for middleware). Sentry is configured separately for each. This means an authentication failure at the edge, a server-side Plaid API error, and a client-side rendering bug all land in the right context rather than a single undifferentiated error log.

---

## Getting Started

### Prerequisites

You'll need accounts with the following services — all offer free sandbox/developer tiers:

- [Appwrite](https://appwrite.io) - auth and database
- [Plaid](https://plaid.com/docs/sandbox/) - use Sandbox mode for local development
- [Dwolla](https://developers.dwolla.com/) - Sandbox available
- [Sentry](https://sentry.io) - error monitoring

### Setup

**1. Clone the repository**

```bash
git clone https://github.com/eprisr/fortify-banking.git
cd fortify-banking
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your credentials for each service. The `.env.example` file documents every required key.

**4. Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Tests

```bash
npm test
```

Tests use Jest and React Testing Library. API calls are mocked with Mock Service Worker (MSW), so no live credentials are needed to run the test suite.

---

## Roadmap

### Completed

- Core dashboard UI (based on [iBank Figma spec by Seju](https://www.figma.com/community/file/1322236579213422290))
- Bank account linking via Plaid
- User authentication and session management via Appwrite
- Type-safe financial logic with TypeScript and Zod
- End-to-end error monitoring with Sentry

### In Progress

- P2P fund transfers via Dwolla ACH
- Account settings and profile management
- Transaction notifications and alerts

### Planned

- Savings and credit card management modules
- Bill pay and mobile prepaid support
- Real-time exchange rate tracking
- Branch and ATM locator via geolocation
- Full-stack simulated withdrawal workflow with ledger updates and toast notifications

---

## License

MIT - see [LICENSE](LICENSE) for details.
