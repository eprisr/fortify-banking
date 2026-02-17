# Fortify Banking

A secure and modern banking application. This project serves as a deep dive into secure data handling, real-time transaction tracking, and scalable frontend architecture.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)

## Key Features

- **Secure Authentication**: Robust user login, registration system, and session management to ensure user data remains private.
- **Real-time Dashboard**: View account balances and recent activities instantly.
- **Transaction Management**: Easy-to-use interface for transferring funds and viewing history.
- **Responsive Design**: Optimized for both desktop and mobile devices.

## Tech Stack

- **Framework & Language**: Next.js, TypeScript, Node.js
- **FinTech Infrastructure**: Plaid (Account Linking), Dwolla (Payment Processing)
- **Backend & Database**: Appwrite
- **Validation & Safety**: Zod (Schema Validation), Decimal Precision Logic
- **UI & Styling**: Tailwind CSS, Material UI (MUI), Shadcn/UI
- **Testing**: Jest, React Testing Library, Mock Service Worker (MSW)

## Architecture and Principles

This application follows a modern, component-based architecture using React and Next.js. Key principles include:

- **Security**: Prioritizing data protection and secure transactions.
- **Performance**: Utilizing Server-Side Rendering (SSR) and Static Site Generation (SSG) where appropriate for fast load times.
- **Scalability**: Built with modular code to support future growth and feature additions.

## Getting Started

**1. Clone the repository**

```bash
git clone [https://github.com/eprisr/your-repo-name.git](https://github.com/eprisr/your-repo-name.git)
```

**2. Install dependencies**

```
npm install
```

**3. Configure environment variables**
Create a .env file in the root directory and add your API keys (see .env.example).

**4. Run the development server**

```
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
