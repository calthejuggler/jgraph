# Agent Guide

Juggling Tools — monorepo for computing and exploring siteswap juggling patterns (web + server + engine).

## Essentials

- **Package manager**: Bun — use `bun install`, `bun run`, not npm/node
- **Pre-commit hooks**: lefthook auto-formats and lints staged files

```bash
bun run dev              # Start everything (infra + all services, hot reload)
bun run lint             # ESLint check (web + server + scripts)
bun run lint:fix         # Auto-fix lint errors
bun run format           # Prettier format
bun run format:check     # Check formatting (CI mode)
bun run typecheck        # TypeScript type-check (web)
bun run test:simulator   # Unit tests for @juggling-tools/simulator
```

Environment: copy `.env.example` to `.env` and fill in secrets before running.

## Services

| Service | Stack                                              | Port | Path      |
| ------- | -------------------------------------------------- | ---- | --------- |
| web     | React 19 + Vite + TanStack Router + Tailwind CSS 4 | 5173 | `web/`    |
| server  | Elysia.js + Bun + Drizzle ORM + PostgreSQL         | 3000 | `server/` |
| engine  | Rust + Axum + Tokio + Redis                        | 8000 | `engine/` |

## Detailed Docs

Read these when working in the relevant area:

- [Architecture](docs/agent/architecture.md) — data flow, service internals, key file paths
- [Testing](docs/agent/testing.md) — mandatory test quality criteria and review process
- [Rust Conventions](docs/agent/rust-conventions.md) — idiomatic Rust and doc comment style
- [Cache Versioning](docs/agent/caching.md) — `SCHEMA_VERSION` and cache invalidation

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
