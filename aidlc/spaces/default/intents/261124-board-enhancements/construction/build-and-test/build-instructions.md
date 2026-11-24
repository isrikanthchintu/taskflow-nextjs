# Build Instructions

## Prerequisites

- Node.js compatible with Next.js 15 and pnpm (the repository's `pnpm-lock.yaml` is the lock file).
- No environment variables are needed. `.env.example` exists and nothing in this build reads it.
- No local service, database or server is needed: all data lives in the browser's localStorage.

## Install

```
pnpm install
```

## Build Commands

| Purpose | Command |
|---------|---------|
| Type check | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Format check | `pnpm prettier --check src` |
| Production build | `pnpm build` |
| Run locally | `pnpm dev` |
| Run the production build | `pnpm start` |

## Build Verification

After `pnpm build`, the route table should list four static routes: `/`, `/_not-found`, `/archive` and `/settings`. A build that compiles but lists fewer routes means a page file is missing.

## Troubleshooting

- **Type errors after pulling:** run `pnpm install`, then `pnpm typecheck`; the board types are in `src/types/board.ts`.
- **A saved theme looks wrong after an upgrade:** settings are stored in the browser; clear the `taskflow.data.v2` key only if you accept losing the data it holds. The old `taskflow.tasks.v1` key is never touched by the app.
- **Prettier reports a file:** run `pnpm prettier --write <file>`; the project's formatting rules live in `.prettierrc.json`.
- **Jest tests time out on a slow machine:** the keyboard-only accessibility suite is the slowest; run it alone with `pnpm jest src/components/accessibility.test.tsx`.
