# Code Summary — u2-test-infrastructure

## Files created

- `jest.config.ts` — Jest configuration built with `next/jest` (resolves the `@/*` alias and SWC transform from `tsconfig.json` automatically), `testEnvironment: "jsdom"` as the default, `setupFilesAfterEnv` pointing at `jest.setup.ts`.
- `jest.setup.ts` — imports `@testing-library/jest-dom` for DOM matchers, and polyfills `crypto.randomUUID` via Node's `node:crypto` when it is missing from the Jest/jsdom global (see Deviations).
- `src/lib/task-storage.test.ts` — 5 tests for `readTasks`/`writeTasks` (`FR3.1`).
- `src/hooks/use-tasks.test.ts` — 5 tests for `useTasks` (`FR3.2`).
- `src/components/task-dashboard.test.tsx` — 5 tests for `TaskDashboard` (`FR3.3`).

## Files modified

- `package.json` — added `test: "jest"` script (`FR2.2`); added `jest`, `jest-environment-jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `@types/jest` to `devDependencies` (`FR2.1`/`NFR5.1`); added `ts-node` to `devDependencies` (see Deviations). No application source file's behavior changed; no production `dependencies` entry added (`NFR2`).

## Key implementation decisions

- **SSR-guard tests without a file-level environment override**: the plan called for `/** @jest-environment node */` to prove `readTasks`/`writeTasks` make no `window`/`localStorage` access when `window` is undefined. Jest's `@jest-environment` docblock pragma is file-scoped — it cannot apply to only some tests in a file — and the same file also needs real jsdom `localStorage` for its other 3 tests, and the scoped test command (`unit-test-instructions.md`) runs only this one file path. Instead, the "no window" tests `delete (globalThis as { window?: Window }).window` before the assertion and restore it in `afterEach`, which makes `typeof window === "undefined"` true for exactly those two tests without touching `localStorage` at all (nothing is mocked/stubbed) and keeps all 5 tests in the single required file. Functionally equivalent to the planned environment override; noted here as an implementation-detail deviation from the literal docblock syntax.
- **Stat-card assertions via DOM traversal, not new `data-testid`s**: `TaskDashboard`'s four stat cards (`StatCard`) are non-interactive display elements with no accessible query linking a label to its numeric value. Per the brief's guidance to add `data-testid` only to interactive elements lacking an accessible query, no test ids were added; tests instead scope to the `region` with `aria-label="Task summary"` (already present) and traverse to the sibling `.stat-value` node via `within()` + `closest()`. No source file was modified for this.
- **Real `localStorage`, no mocks**: every test file uses jsdom's built-in `localStorage`, cleared in `beforeEach` (`window.localStorage.clear()`); `useTasks` and `TaskDashboard` are never mocked, per the approved unit-test instructions.

## Test coverage summary

15 tests, all passing, run via the exact scoped command from `unit-test-instructions.md`:

```bash
pnpm exec jest src/lib/task-storage.test.ts src/hooks/use-tasks.test.ts src/components/task-dashboard.test.tsx
```

- `task-storage.test.ts` (5): write-then-read round trip; empty storage returns `[]`; malformed/non-array JSON returns `[]`; `readTasks` makes no `window` access when `window` is undefined; `writeTasks` makes no `window` access when `window` is undefined and does not throw.
- `use-tasks.test.ts` (5): seeds `starterTasks` on first mount when storage is empty; loads stored tasks on mount when storage is populated; `addTask` updates state and persists once ready; `setStatus` updates state and persists once ready; `deleteTask` updates state and persists once ready.
- `task-dashboard.test.tsx` (5): creating a task via the "New task" form updates the list and stat cards; cycling a task's status updates the task and stat cards; deleting a task updates the list and stat cards; filtering via the search box; filtering via a status tab.

Tests written but not executed: none.

## Deviations from the plan

- Added `ts-node` to `devDependencies` (not in the plan's explicit dependency list) because the plan requires `jest.config.ts` (a TypeScript config file), and Jest's `jest-config` loader requires `ts-node` to parse a `.ts` config file — without it, `pnpm test` fails immediately with "`ts-node` is required for the TypeScript configuration files." This is a necessary addition to make the plan's own named `jest.config.ts` runnable, not a new testable-layer or production dependency.
- Added a `crypto.randomUUID` polyfill in `jest.setup.ts` because the installed Jest/jsdom combination's Node global does not expose `crypto.randomUUID` by default, which `useTasks.addTask` calls directly; without it, `addTask` tests throw `TypeError: crypto.randomUUID is not a function`. The polyfill delegates to Node's own `node:crypto` module and only installs itself when the global is missing — it does not mock or stub any project module.
- The `/** @jest-environment node */` override named in the plan for 2 of `task-storage.test.ts`'s 5 tests was implemented as an equivalent `delete globalThis.window` / restore pattern within the same file instead of a separate file-level docblock, for the reason described under Key Implementation Decisions. No test case, assertion, or coverage described in the plan was dropped or weakened.

## Build and quality gates

- Scoped test command: 15/15 passing.
- `pnpm lint` (full repo): pre-existing errors/warnings only in `.claude/` framework tooling files and `next-env.d.ts` (none touched by this unit) plus one pre-existing warning in `src/hooks/use-tasks.ts` (a file this unit does not modify). Scoping lint to `src/`, `jest.config.ts`, and `jest.setup.ts` (`pnpm exec eslint src jest.config.ts jest.setup.ts`) shows 0 errors and 0 warnings in every file this unit created.
- `pnpm typecheck` (`tsc --noEmit`): passes cleanly, no output.
