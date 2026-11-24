# Unit Test Instructions — u1-kanban-board

## Test Framework Setup

Already configured, no changes needed: Jest 29 (`jest-environment-jsdom`), `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`. Test files live beside the source they test (`*.test.ts` / `*.test.tsx`), matching the existing project convention.

## Exact Unit-Scoped Test Command

Run this Unit's test files only, by exact path (never the bare project-wide `pnpm test`):

```bash
pnpm test -- src/hooks/use-tasks.test.ts src/components/task-card.test.tsx src/components/kanban-column.test.tsx src/components/kanban-board.test.tsx src/components/task-dashboard.test.tsx
```

This must be runnable before the first test-after cycle begins (Step 2 of the plan verifies it against the 3 pre-existing test files, before any new file is added).

## Expected Coverage Targets

Per `team.md`'s affirmed Testing Posture, this project has **no 80% line-coverage floor** (an explicit, intentional override of the org default for `feature` scope, affirmed given the project's prototype/demo framing). The target this Unit meets instead:

- Standard test-strategy volume: 5-8 tests per new/changed component.
- Unit tests plus integration-level coverage at the key `TaskDashboard` <-> `KanbanBoard`/`useTasks` boundary.
- Every existing test (`task-storage.test.ts`, the retained parts of `use-tasks.test.ts` and `task-dashboard.test.tsx`) stays green.
- No E2E, performance, or security test types — no NFR in `requirements.md` calls for them.

Build and Test checks these obligations on the assembled project's full suite; this Unit's own scoped run above checks only this Unit's files.

## Mocking / Stubbing Guidance

- `localStorage` mocking: reuse the existing pattern already present in `use-tasks.test.ts` / `task-storage.test.ts` (a simple in-memory mock object) — do not introduce a new mocking library.
- Drag-and-drop: do NOT attempt to simulate real pointer/keyboard drag gestures through the adopted library's `DndContext` in jsdom — that library's internal gesture handling is not designed to be driven by synthetic jsdom events and such tests are brittle. Instead, test `KanbanBoard`'s drag-result decision as a plain, exported (or test-accessible) pure function that takes a drag's source/target column and index and returns `{ action: "move" | "reorder" | "noop", ... }`; call that function directly in `kanban-board.test.tsx` with constructed inputs. This isolates the business decision (what `requirements.md` actually specifies) from the library's own internals (which are the library's responsibility to test, not this Unit's).
- `crypto.randomUUID()`: already relied on by existing `addTask` tests; no new mocking needed for Step 3/4's additions since `moveTask`/`reorderTask` do not create new tasks.

## Test Data Management

- Reuse the existing inline task fixtures pattern already present in `use-tasks.test.ts` and `task-dashboard.test.tsx` (small literal `Task` objects per test) — no new fixtures file or test-data library is introduced, consistent with the existing project's scale and conventions.
