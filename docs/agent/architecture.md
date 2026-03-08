# Architecture

## Data Flow (Graph Query)

Client → Server (validates params, checks ETag) → Engine (3-tier cache: memory/Redis/file → compute if miss) → response flows back with ETag for client caching.

## Server (`server/`)

- **Framework**: Elysia.js on Bun, port 3000
- **Routes**: `src/routes/v1/` — `state-notation/` (graph, table, throws) + `config`
- **Auth**: better-auth (email/password, sessions, admin plugin) mounted at root; roles (admin/user), banning, impersonation
- **DB**: PostgreSQL via Drizzle ORM; schema in `src/db/schema/`; migrations in `drizzle/`
- **Config**: `drizzle.config.ts` for Drizzle Kit; env vars loaded via `bun --env-file=../.env`
- **Rate limiting**: `src/lib/rate-limit.ts`

## Web (`web/`)

- **Routing**: TanStack Router (file-based) — routes in `src/routes/`, pages in `src/pages/`
- **Data fetching**: TanStack React Query
- **Forms**: React Hook Form + Zod validation (`src/lib/schemas.ts`)
- **UI components**: Shadcn (Radix UI) in `src/components/ui/`
- **i18n**: Paraglide.js — messages in `messages/{locale}.json`, config in `project.inlang/settings.json`
- **State**: URL search params (no external state library)
- **Auth client**: `src/lib/auth-client.ts` (better-auth client)

## Engine (`engine/`)

- **Framework**: Axum on Tokio, port 8000
- **Auth**: API key via `X-API-Key` header (public: `/v1/health`, protected: `/v1/state-notation/*`)
- **Cargo workspace**: engine binary + `crates/juggling-tools` library crate (all computation logic lives in `juggling-tools::state_notation`)
- **3-tier cache** (`src/cache/`): memory (Moka), Redis, file-based
- **Shared state**: `AppState` defined in `src/main.rs`
- **Logging**: tracing with JSON subscriber; wide-event request middleware in `src/logging.rs`
