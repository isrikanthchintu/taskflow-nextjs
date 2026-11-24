# Build and Test — Integration Test Instructions (Standard strategy)

## Key Boundary

This intent has a single Unit (`u1-kanban-board`), so there is no
cross-unit boundary to test. The key boundary the Standard strategy asks
for is intra-app: **`TaskDashboard` <-> `KanbanBoard` <-> `useTasks`**
(UI composition calling into the single state-owning hook, which in turn
calls `task-storage`).

## Where These Tests Already Live

Code Generation already wrote this boundary's integration coverage as
part of the per-Unit Testing Contract obligation ("Unit tests plus
integration tests for key boundaries") — this stage does not duplicate
them, it runs and reports on them:

- `src/components/task-dashboard.test.tsx` — exercises create, delete,
  search, and the new edit-modal flow through the real `useTasks` hook
  (not mocked), confirming `TaskDashboard` and `useTasks` stay in sync.
- `src/components/kanban-board.test.tsx` — exercises grouping/filtering
  against the real counts/task data shape, and the `resolveDragOutcome`
  pure function's move/reorder/no-op decisions against `useTasks`'s actual
  `moveTask`/`reorderTask` index semantics.
- `src/hooks/use-tasks.test.ts` — confirms `moveTask`/`reorderTask` persist
  through the real write-back effect into (mocked) `task-storage`.

## How to Run

```bash
pnpm test -- src/components/task-dashboard.test.tsx src/components/kanban-board.test.tsx src/hooks/use-tasks.test.ts
```

## Test Framework

Jest 29 + `jest-environment-jsdom` + Testing Library (already configured,
unchanged by this intent).

## Expected Coverage

Per `team.md`'s affirmed Testing Posture, no 80% line-coverage floor
applies to this project. The obligation these tests meet is qualitative:
every key boundary interaction (create/edit/delete/search/drag outcome)
has at least one test exercising it end-to-end through the real hook,
not a mock of it.

## Test Data / Environment

Same as the per-Unit tests: inline `Task` fixture literals, the existing
in-memory `localStorage` mock pattern. No separate integration environment,
container, or service is needed — everything under test runs in-process.
