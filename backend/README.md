# TaskFlow Board Platform API (TICKET-004)

NestJS + MongoDB (Mongoose) backend. Lives beside the Next.js app; the frontend and its `localStorage` persistence are unchanged.

## Setup

```bash
cd backend
cp .env.example .env
pnpm install
docker compose --env-file .env up -d
pnpm start:dev
```

All passwords, URIs and secrets are read from `backend/.env` (git-ignored). `.env.example` lists every variable.
The compose file creates a replica-set MongoDB (needed for transactions) with a root user and a least-privilege app user on the new `taskflow_board` database.

Docs: `http://localhost:4000/api/v1/docs` (Swagger/OpenAPI).

## Scripts

| Script | What it does |
|---|---|
| `pnpm start:dev` | run with reload |
| `pnpm build` / `pnpm start` | compile and run `dist/` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | unit + e2e tests |

Tests use `MONGO_TEST_URI` if set (a replica set you control), otherwise start an in-memory replica set.

## Implemented in this slice

Auth (register, login, `/me`), workspaces and members, boards (CRUD, close/reopen, star, views, recent, starred, copy, members, activity), lists, cards (CRUD, move with `expectedVersion`, complete, archive/restore, members, watchers, activity), fractional position keys with rebalance, rich-text sanitizer, transactional activity + outbox + notification fan-out, structured errors.

## Follow-up work (rest of TICKET-004)

Labels, checklists, attachments (storage + signature checks), comments and reactions, notifications and preferences endpoints, search, realtime publisher (outbox consumer), board watchers, mentions.

## Decisions and open items

- No User/Organisation existed in the repo, so minimal ones were added; registering creates an organisation.
- Workspace delete returns 409 `WORKSPACE_NOT_EMPTY` while boards exist; list delete returns 409 `LIST_NOT_EMPTY` while cards exist (cascade rules need product confirmation).
- Board visibility: `private` (members only), `workspace` (workspace members), `public` (any authenticated user, read-only).
- Inaccessible and missing private resources both return 404.
