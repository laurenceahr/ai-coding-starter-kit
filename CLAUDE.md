# AI Coding Starter Kit

> A Next.js template with an AI-powered development workflow using specialized skills for Requirements, Architecture, Frontend, Backend, QA, and Deployment.

## Tech Stack

- **Framework:** Next.js 16 (App Router), TypeScript
- **Styling:** Tailwind CSS + shadcn/ui (copy-paste components)
- **Backend:** PostgreSQL (Sevalla) + NextAuth.js + S3-kompatibles Object Storage (Sevalla)
- **Deployment:** Sevalla (Application Hosting)
- **Validation:** Zod + react-hook-form
- **State:** React useState / Context API

## Auth & Database Patterns

- **Auth:** NextAuth.js with Credentials provider (`src/lib/auth.ts`), JWT strategy, 7-day session
- **DB:** PostgreSQL via `pg` Pool (`src/lib/db.ts`) — use parameterized `query(sql, params)` helper
- **Session check (server):** `getServerSession(authOptions)` from `next-auth`
- **Session check (client):** `useSession()` from `next-auth/react`
- **Session check (middleware):** `getToken()` from `next-auth/jwt`
- **Single-user system:** Only one account allowed — registration blocked after first user
- **API token encryption:** pgcrypto `pgp_sym_encrypt` with `TOKEN_ENCRYPTION_KEY` env var
- **UI language:** German — all user-facing text in German (NFA-504)

## Environment Variables

See `.env.local.example` for all required vars:
- `DATABASE_URL` — Sevalla PostgreSQL connection string
- `NEXTAUTH_URL` — App URL (http://localhost:3000 locally)
- `NEXTAUTH_SECRET` — NextAuth session encryption secret
- `TOKEN_ENCRYPTION_KEY` — pgcrypto key for API token storage

## Project Structure

```
src/
  app/              Pages (Next.js App Router)
  components/
    ui/             shadcn/ui components (NEVER recreate these)
  hooks/            Custom React hooks
  lib/              Utilities (db.ts, auth.ts, utils.ts)
features/           Feature specifications (PROJ-X-name.md)
  INDEX.md          Feature status overview
docs/
  PRD.md            Product Requirements Document
  production/       Production guides (Sentry, security, performance)
```

## Development Workflow

1. `/requirements` - Create feature spec from idea
2. `/architecture` - Design tech architecture (PM-friendly, no code)
3. `/frontend` - Build UI components (shadcn/ui first!)
4. `/backend` - Build APIs, database, server-side logic
5. `/qa` - Test against acceptance criteria + security audit
6. `/deploy` - Deploy to Sevalla + production-ready checks

## Feature Tracking

All features tracked in `features/INDEX.md`. Every skill reads it at start and updates it when done. Feature specs live in `features/PROJ-X-name.md`.

## Key Conventions

- **Feature IDs:** PROJ-1, PROJ-2, etc. (sequential)
- **Commits:** `feat(PROJ-X): description`, `fix(PROJ-X): description`
- **Single Responsibility:** One feature per spec file
- **shadcn/ui first:** NEVER create custom versions of installed shadcn components
- **Human-in-the-loop:** All workflows have user approval checkpoints
- **Tests:** Unit tests co-located next to source files (`useHook.test.ts` next to `useHook.ts`). E2E tests in `tests/`.

## Build & Test Commands

```bash
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run start        # Production server
npm test             # Vitest unit/integration tests
npm run test:e2e     # Playwright E2E tests
npm run test:all     # Both test suites
```

## Product Context

@docs/PRD.md

## Feature Overview

@features/INDEX.md
