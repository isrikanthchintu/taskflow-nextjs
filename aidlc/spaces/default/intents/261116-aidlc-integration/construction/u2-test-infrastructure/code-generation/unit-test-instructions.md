# Unit Test Instructions — u2-test-infrastructure

## Test framework setup

- **Runner**: Jest, via Next.js's `next/jest` integration (`tech-stack-decisions.md`) — resolves the `@/*` path alias and SWC transform from `tsconfig.json` with no separate Babel config.
- **Environment**: `jest-environment-jsdom` as the default (`testEnvironment: "jsdom"` in `jest.config.ts`), giving `window`/`localStorage` to the hook and component tests. The one `src/lib/task-storage.test.ts` SSR-guard case overrides this per-file with `/** @jest-environment node */` to prove no `window` access occurs when `window` is undefined.
- **Component testing**: `@testing-library/react` + `@testing-library/jest-dom` (DOM matchers, via `jest.setup.ts`) + `@testing-library/user-event` (realistic click/type/filter interactions).
- **Types**: `@types/jest` for typed Jest globals under `strict: true`.

## Scoped test command

Run only this unit's test files — never the bare `pnpm test` (which would also pick up any other unit's future test files):

```bash
pnpm exec jest src/lib/task-storage.test.ts src/hooks/use-tasks.test.ts src/components/task-dashboard.test.tsx
```

This is the exact command Code Generation and Build and Test run for this unit. It is runnable with no setup beyond `pnpm install` (Step 1 of the plan) having completed.

## Expected coverage

No fixed line-coverage percentage is enforced (`team.md` Testing Posture: "no strict coverage target"; `requirements.md` `NFR3`/Assumption A5). The floor is behavioral: every test case `FR3.1`-`FR3.3` lists in `requirements.md`, 15 tests total across the 3 files (5 each), all passing.

## Mocking / stubbing guidance

**Do not mock `localStorage` or the hook.** The team's affirmed testing posture requires new tests to exercise the real `localStorage`-backed persistence path, not a mocked substitute (`team.md` Testing Posture; `nfr-design/security-design.md` `NFR5.2`). `jsdom`'s built-in `localStorage` (in-memory, real Web Storage API semantics) is sufficient and is NOT mocked with `jest.mock` or a custom stub. `task-dashboard.test.tsx` renders the real `TaskDashboard` component with the real `useTasks` hook — no shallow rendering, no hook mock — so the create/status-cycle/delete/filter assertions exercise the actual hook↔storage integration path.

Clear `localStorage` between test cases (e.g. in `beforeEach`, `window.localStorage.clear()`) so each test starts from a known empty state rather than leaking state from a previous test in the same file.

## Test data

Fixture task titles follow the existing `starterTasks` seed's style — short, obviously synthetic, demo-shaped strings (e.g. "Draft proposal", "Review pull request") — never anything resembling a credential, API key, or personal data (`nfr-requirements/security-requirements.md` `NFR5.3`).
