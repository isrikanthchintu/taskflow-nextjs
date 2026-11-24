# Domain Design — Questions

## Q1. [Architect] How should per-card order within a column be stored?

In-column reordering (FR4) needs a notion of order that survives page
reloads. Today's task list has no explicit order field — the stored array's
own position is the only ordering that exists, and it is never reordered
independently per status. `requirements.md`'s Assumptions leave this choice
to Domain Design.

- A. Keep ordering implicit: continue to store one flat task array in
  `localStorage`, and represent "order within a column" purely as each
  task's relative position in that array. Reordering splices/moves the
  dragged task to a new index among same-status tasks, leaving tasks of
  other statuses where they are. (Recommended — no schema change, no
  migration needed for NFR6 since every existing task's position is already
  preserved exactly as it is today.)
- B. Add an explicit numeric `order` (or `position`) field to the `Task`
  entity. On first load after this change, backfill it from each task's
  current array position within its status group, then maintain it
  explicitly on every reorder/move.
- X. Other (please specify)

[Answer]: A. Keep ordering implicit (array position). (Recommended)

## Q2. [Architect] Which drag-and-drop implementation should the board use?

No drag-and-drop primitive exists in the codebase today (flagged during
Reverse Engineering). NFR3 requires every drag-and-drop interaction to have
a keyboard-operable equivalent, and NFR2 keeps everything client-side with
no new backend/network dependency — a UI library dependency is not a
backend, so it stays within that constraint.

- A. Add a dedicated drag-and-drop library (for example `@dnd-kit/core` —
  accessible, tree-shakeable, ships built-in keyboard sensors that directly
  help satisfy NFR3/FR5, actively maintained, no server component).
  (Recommended.)
- B. Hand-roll it with the browser's native HTML5 Drag and Drop API — zero
  new dependency, but keyboard-equivalent behavior and drop-target
  affordances (NFR3) need to be built and tested from scratch.
- X. Other (please specify)

[Answer]: A. Add a dedicated drag-and-drop library (@dnd-kit/core). (Recommended)

## Q3. [Architect] How should the UI component boundaries change?

`architecture.md` already flags `task-dashboard.tsx` (183 lines: layout
chrome, stats, filters, task list, and the create-task modal all in one
file) as something to decompose before adding Kanban/drag-and-drop
behavior.

- A. Introduce new board-specific components — `KanbanBoard` (lays out the
  3 fixed columns), `KanbanColumn` (one column's header, count, and
  scrollable card list), and `TaskCard` (replaces `TaskRow`'s rendering,
  same fields) — extracted from the existing `TaskDashboard`, which keeps
  the stat cards, search box, and create-task modal and becomes the page
  shell that composes them. (Recommended — matches the architecture
  improvement note and keeps board/column/card independently testable.)
- B. Keep the existing single `TaskDashboard` + `TaskRow` structure and add
  drag handlers and column grouping inline, with minimal new components.
- X. Other (please specify)

[Answer]: A. Introduce new board-specific components (KanbanBoard, KanbanColumn, TaskCard). (Recommended)

## Q4. [Architect] Where should "move card to column" and "reorder within column" logic live?

`architecture.md` calls out `useTasks()` as "the single state-owning
boundary" for the whole app today (`TaskDashboard` never touches
`localStorage` directly).

- A. Extend the existing `useTasks` hook with new methods (for example
  `moveTask(id, newStatus)` and `reorderTask(id, newIndex)`), so it remains
  the single place that knows how task state changes and persists.
  (Recommended — preserves the existing architectural boundary rather than
  introducing a second state owner.)
- B. Introduce a separate board-specific hook/service that computes the new
  arrangement and calls into `useTasks` only for the final write.
- X. Other (please specify)

[Answer]: A. Extend the existing useTasks hook (moveTask, reorderTask). (Recommended)

## Q5. [Architect] How should in-column reordering behave while a search filter narrows that column's visible cards?

FR6.1 filters each column's visible cards independently by the search
query. FR4 lets a card be dragged to a new position within its column. The
requirements don't say what a drop position means when the person is only
seeing a filtered subset of that column's cards.

- A. Reordering stays available while filtered: the dropped card's new
  position is computed against the full, unfiltered task list for that
  column (using the drop target's nearest visible neighbors to find the
  insertion point), so the hidden, non-matching cards keep their relative
  position too. (Recommended — one consistent reorder behavior, no special
  "disabled while searching" state to explain to the person.)
- B. Disable drag-and-drop reordering within a column whenever a search
  query is active; dragging is only available when the column shows every
  one of its cards.
- X. Other (please specify)

[Answer]: A. Reorder against the full unfiltered list using nearest visible neighbors. (Recommended)

## Consolidated Summary Confirmation

- Looks correct
- Request changes

[Answer]: Looks correct
