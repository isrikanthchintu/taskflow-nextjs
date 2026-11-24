# Build and Test — Build Instructions

## Dependency Installation

```bash
pnpm install
```

Installs the one new runtime dependency pair this intent added:
`@dnd-kit/core` and `@dnd-kit/sortable` (ADR-002), alongside the project's
existing dependencies. No other dependency changed.

## Environment Setup

None needed. This is a client-only, `localStorage`-backed app (NFR2) — no
environment variables, no config files, no local services. `.env.example`
confirms: "This demo uses browser localStorage and does not require
environment variables."

## Build Commands

```bash
pnpm build
```

Runs `next build` — compiles, type-checks, and statically generates the
single route (`/`).

## Build Verification Steps

1. `pnpm lint` — ESLint over `src/`.
2. `pnpm typecheck` — `tsc --noEmit`.
3. `pnpm build` — confirms the production build compiles and generates the
   static page with no unresolved imports or broken references.

## Troubleshooting Common Build Issues

- **`@dnd-kit/*` not found**: run `pnpm install` — the lockfile already
  pins the resolved versions (`@dnd-kit/core@6.3.1`,
  `@dnd-kit/sortable@8.0.0`).
- **Stale `.next/` build cache after pulling changes**: delete `.next/` and
  re-run `pnpm build`; this project does not commit build output.
- **Type errors on `Task`/`TaskStatus`**: the entity shape is unchanged
  (ADR-001) — a type error here indicates a local edit diverged from
  `src/types/task.ts`, not a dependency issue.
