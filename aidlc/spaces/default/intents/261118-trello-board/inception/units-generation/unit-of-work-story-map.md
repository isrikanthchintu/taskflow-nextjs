# Units Generation — Story Map

`stories.md` was not produced for this intent (User Stories is skipped in
the execution plan), so rows are keyed by `FR` as Requirements Analysis
recorded them, one row per requirement or sub-requirement.

## Coverage

| Requirement | Unit ID | Directory |
|---|---|---|
| FR1.1 | U1 | u1-kanban-board |
| FR1.2 | U1 | u1-kanban-board |
| FR1.3 | U1 | u1-kanban-board |
| FR2.1 | U1 | u1-kanban-board |
| FR2.2 | U1 | u1-kanban-board |
| FR2.3 | U1 | u1-kanban-board |
| FR3.1 | U1 | u1-kanban-board |
| FR3.2 | U1 | u1-kanban-board |
| FR3.3 | U1 | u1-kanban-board |
| FR4.1 | U1 | u1-kanban-board |
| FR4.2 | U1 | u1-kanban-board |
| FR4.3 | U1 | u1-kanban-board |
| FR5.1 | U1 | u1-kanban-board |
| FR5.2 | U1 | u1-kanban-board |
| FR6.1 | U1 | u1-kanban-board |
| FR6.2 | U1 | u1-kanban-board |
| FR7.1 | U1 | u1-kanban-board |
| FR7.2 | U1 | u1-kanban-board |
| FR7.3 | U1 | u1-kanban-board |
| FR8.1 | U1 | u1-kanban-board |
| FR9.1 | U1 | u1-kanban-board |
| FR9.2 | U1 | u1-kanban-board |

## Cross-Cutting Rows

None — every requirement is implemented entirely within the single Unit;
there is no row that spans multiple Units because there is only one.

## Implementation Order Within the Unit

Functional Design and Code Generation for `u1-kanban-board` should proceed
in an order that keeps the app working at every step, consistent with the
already-proven walking skeleton (`team.md`):

1. Extend `useTasks` with `moveTask`/`reorderTask` (FR3, FR4, FR4.3) — no
   UI changes yet; existing tests stay green.
2. Introduce `TaskCard` (replacing `TaskRow`'s rendering) with its fields,
   delete control, and keyboard-operable column-change control (FR2, FR5).
3. Introduce `KanbanColumn` (header, count, scroll, empty state) and
   `KanbanBoard` (3-column layout, search filtering, drag-and-drop session)
   (FR1, FR6.1, FR9).
4. Wire `TaskDashboard` to compose `KanbanBoard` in place of the flat task
   list, remove the status-filter tabs (FR6.2), and confirm the stat cards
   and create/edit modal are unaffected (FR7, FR8.1).

## Coverage Verification

- Every enumerated requirement ID (FR1.1 through FR9.2, 22 total) is
  assigned to U1.
- The one declared Unit has rows (U1 — all 22).
