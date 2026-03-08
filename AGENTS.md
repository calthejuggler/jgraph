# Agent Guide

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

Juggling Tools is a full-stack application for computing and exploring siteswap juggling patterns. It's a monorepo with three services:

- **web/** — React frontend (Vite + TanStack Router + Tailwind CSS 4)
- **server/** — Elysia.js backend API (Bun runtime)
- **engine/** — Rust graph computation engine (Axum + Tokio)

Infrastructure: PostgreSQL, Redis, Caddy (production web server).

## Development Commands

```bash
# Start everything (infrastructure + all services with hot reload)
bun run dev

# Infrastructure only (PostgreSQL + Redis via Docker)
bun run dev:infra
bun run dev:infra:down

# Individual services
bun run dev:web          # Vite dev server on :5173
bun run dev:server       # Elysia on :3000 (--watch)
bun run dev:engine       # Rust engine on :8000 (cargo-watch)

# Database (Drizzle ORM)
bun run db:push          # Push schema changes to DB
bun run db:generate      # Generate migration files
bun run db:migrate       # Run migrations
bun run db:seed          # Seed the database
bun run db:studio        # Visual DB explorer

# Linting & Formatting
bun run lint             # ESLint check (web + server + scripts)
bun run lint:fix         # Auto-fix lint errors
bun run format           # Format all files with Prettier
bun run format:check     # Check formatting (CI mode)
bun run typecheck        # TypeScript type-check (web)
```

Environment: copy `.env.example` to `.env` and fill in secrets before running.

## Architecture

### Data Flow (Graph Query)

Client → Server (validates params, checks ETag) → Engine (3-tier cache: memory/Redis/file → compute if miss) → response flows back with ETag for client caching.

### Server (`server/`)

- **Framework**: Elysia.js on Bun, port 3000
- **Routes**: `src/routes/v1/` — `state-notation/` (graph, table, throws) + `config`
- **Auth**: better-auth (email/password, sessions, admin plugin) mounted at root; roles (admin/user), banning, impersonation
- **DB**: PostgreSQL via Drizzle ORM; schema in `src/db/schema/`; migrations in `drizzle/` and auto-run on startup
- **Config**: `drizzle.config.ts` for Drizzle Kit; env vars loaded via `bun --env-file=../.env`
- **Rate limiting**: `src/lib/rate-limit.ts`

### Web (`web/`)

- **Framework**: React 19 with React Compiler (babel plugin)
- **Routing**: TanStack Router (file-based) — routes in `src/routes/`, pages in `src/pages/`
- **`_authed.tsx`**: Protected route layout wrapper; `__root.tsx`: global layout with devtools
- **Pages**: graphs (index), siteswap builder, admin panel (user management)
- **Data fetching**: TanStack React Query
- **Forms**: React Hook Form + Zod validation (`src/lib/schemas.ts`)
- **UI components**: Shadcn (Radix UI) in `src/components/ui/`
- **i18n**: Paraglide.js — messages in `messages/{locale}.json`, config in `project.inlang/settings.json`, runtime in `src/paraglide/`
- **State**: URL search params (no external state library)
- **Auth client**: `src/lib/auth-client.ts` (better-auth client)

### Engine (`engine/`)

- **Framework**: Axum on Tokio, port 8000
- **Auth**: API key via `X-API-Key` header (public: `/v1/health`, protected: `/v1/state-notation/*`)
- **Cargo workspace**: engine binary + `crates/juggling-tools` library crate (all computation logic lives in `juggling-tools::state_notation`)
- **3-tier cache** (`src/cache/`): memory (Moka), Redis, file-based
- **Shared state**: `AppState` defined in `src/main.rs`
- **Logging**: tracing with JSON subscriber; wide-event request middleware in `src/logging.rs`

### Docker

- `compose.dev.yml`: PostgreSQL + Redis only (for local dev)
- `compose.yml`: Full production stack (all 5 services, two networks: `public` + `internal`)

## Code Style

### Rust (Engine)

- **Write idiomatic Rust** — always self-review Rust code for idiomatic patterns before presenting. This includes iterator chains over imperative loops, proper use of `Option`/`Result` combinators, clean module import paths (`crate::` re-exports over `super::super::`), appropriate use of ownership/borrowing, etc.
- **Doc comments for library consumers** — doc comments should describe what a type or function _is_ and _does_, not who calls it. Avoid coupling docs to specific internal callers (e.g. "used by X and Y"). Keep them useful to any consumer of the public API.

## Key Patterns

- **Bun** is the JS runtime and package manager — use `bun install`, `bun run`, not npm/node
- **Simulator tests** — `bun run test:simulator` runs unit tests for `@juggling-tools/simulator` (Bun's built-in test runner). Server and web have placeholder test scripts only.
- **Environment variables** are loaded from root `.env` file (server uses `--env-file=../.env`)
- **Drizzle migrations** run automatically on server startup (`src/db/index.ts`)
- **Route file naming**: TanStack Router uses `_` prefix for layout routes, `__root.tsx` for root layout
- **Engine gracefully degrades** without Redis (falls back to memory + file cache)
- **Pre-commit hooks** (lefthook) auto-format and lint staged files on commit
- **Cache versioning**: When the engine response schema changes, bump `SCHEMA_VERSION` in the root `.env` file (single source of truth). Both the engine and server read this env var at startup — it invalidates all three cache tiers (engine memory/Redis/file via the cache key) and browser HTTP cache (via the ETag). The frontend `_v` query param is a static one-time cache bust and does not need bumping.

## Test Quality (Mandatory When Tests Change)

**If your changes include new or modified test files, you MUST review every changed test against these criteria before finishing. This applies to all languages (TypeScript, JavaScript, Rust).**

### Criteria

1. **Tests behaviour, not implementation** — Tests describe *what* the code does from a user/caller perspective, not *how* it does it internally. Red flags: asserting on internal state, mocking private functions, testing the order of internal calls, or tests that break when you refactor without changing behaviour.
2. **Asserts something important** — Every test must protect against a real bug or regression. If deleting the test wouldn't make you nervous, it probably shouldn't exist. Remove trivial tests (e.g. "renders without crashing" with no further assertions, "returns default value" when that's obvious from types).
3. **Doesn't test external libraries** — Don't assert that React renders a component, that Zod validates a schema, etc. Trust the library; test *your* logic that uses it. Integration-point tests are fine when the assertion is on *your* code's behaviour.
4. **One concept per test** — Each test should have a single reason to fail. Split tests that assert multiple unrelated things. Test names should clearly state the behaviour being verified.
5. **No snapshots unless justified** — Prefer explicit assertions. Only keep snapshots for genuinely complex output where hand-written assertions would be worse.
6. **Follows project conventions:**
   - **TS/JS:** Bun test runner, `describe`/`it` blocks, `testing-library` queries (getByRole, getByText) over test IDs for UI tests. No `eslint-disable` / `@ts-expect-error` overrides.
   - **Rust:** `#[cfg(test)] mod tests` blocks, `#[test]` functions. `assert_eq!` over `assert!(a == b)`. Plain English function names (e.g. `fn rejects_negative_num_objects()`), no `test_` prefix. No `#[allow(...)]` overrides.
7. **No AI-ish patterns** — No over-commenting, no `// Arrange / Act / Assert` markers, no unnecessary variables that just name an obvious literal.

### Process

1. Evaluate every changed/added test against all 7 criteria.
2. Fix or delete failing tests (ensure important behaviour is still covered).
3. Run the relevant test suite(s) to confirm all tests pass.
4. Repeat until a full pass produces no changes (max 3 iterations).

## Before Finishing (Mandatory Review)

**Before completing any task where you used Edit, Write, or NotebookEdit tools, you MUST run the following review process on all uncommitted changes (staged + unstaged). Do not stop or present your work as done until this is complete.**

1. Run these review skills on all uncommitted changes:
   - `/code-review:code-review`
   - `/logging-best-practices`
2. Work locally — there is no PR.
3. For each issue raised, verify it's a real problem before fixing. In particular, when reviewing React code, follow the react.dev "You Might Not Need an Effect" guidelines — do not introduce `useEffect` as a fix unless it's genuinely the right solution.
4. Fix valid issues only. Re-run all reviews after fixes. Repeat until a full pass produces no changes (max 6 iterations).
5. Scan all changes (original + yours) for:
   - AI-ish comments — remove them. Code should be self-documenting; only keep comments a human developer would write.
   - Tool overrides (`eslint-disable`, `@ts-expect-error`, `@ts-ignore`, `// @ts-nocheck`, etc.) — try to fix the underlying code so the override isn't needed. Only keep an override if there's genuinely no clean alternative.
6. Run `/simplify` on all uncommitted changes.
