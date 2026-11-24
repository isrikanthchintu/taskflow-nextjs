# Domain Design — Architecture Decision Records

## ADR-001: Keep per-card order implicit via array position

**Status**: Accepted
**Date**: 2026-11-23

**Context**
FR4 requires in-column reordering to persist across reloads. Today's
`Task[]` array has no explicit order field; a task's position in that
array has never been meaningful to the application beyond "newest first on
create" (FR4.3). NFR6 requires every task already in storage to render
correctly in the new column structure with no migration step and no lost
data. `requirements.md`'s Assumptions left the representation choice to
this stage (Q1).

**Decision**
Keep ordering implicit: a task's position within its column is its
relative position among same-status tasks in the single stored array.
Reordering (`reorderTask`) splices the task to a new index among
same-status tasks only, leaving tasks of other statuses untouched (FR4.2).
No new field is added to `Task`.

**Consequences**
- Positive: zero schema change, and NFR6 is satisfied automatically —
  every existing task's current array position is its current column
  position, so nothing needs to be backfilled or migrated.
- Positive: one fewer piece of state to keep consistent with `status`
  (an explicit `order` field could drift from reality if a bug updates one
  without the other).
- Negative: computing "index within this status group" requires filtering
  the full array by status whenever a reorder happens, rather than reading
  an `order` value directly — an O(n) scan per reorder, acceptable at this
  app's scale (a personal task list, not a multi-user dataset).

**Alternatives Rejected**
- **Explicit `order`/`position` field**: adds a field to `Task`, backfilled
  from current array position on first load, then maintained explicitly on
  every reorder/move. Rejected because it adds a migration step and a
  second source of truth for ordering with no benefit at this scale — the
  array-position approach already satisfies FR4 and NFR6 without it.

---

## ADR-002: Adopt @dnd-kit for drag-and-drop

**Status**: Accepted
**Date**: 2026-11-23

**Context**
No drag-and-drop primitive exists in the codebase today (flagged during
Reverse Engineering). FR3 and FR4 require drag-and-drop between columns and
within a column; NFR3 requires every such interaction to have a
keyboard-operable equivalent with visible focus/hover affordances; NFR2
keeps the feature entirely client-side, so a UI library dependency (not a
backend/network dependency) is within bounds.

**Decision**
Use `@dnd-kit/core` and `@dnd-kit/sortable` as the drag-and-drop
implementation, owned by `KanbanBoard` (see `components.md`).

**Consequences**
- Positive: `@dnd-kit` ships built-in keyboard sensors, directly reducing
  the custom work needed to satisfy NFR3/FR5's keyboard-operable
  requirement.
- Positive: actively maintained, accessible by design, tree-shakeable, no
  server component — consistent with NFR2.
- Negative: adds a new runtime dependency (two packages) to a project that
  currently has none beyond the Next.js/React/Tailwind baseline.

**Alternatives Rejected**
- **Hand-rolled HTML5 Drag and Drop API**: zero new dependency, but the
  native API has no keyboard-equivalent story built in — satisfying NFR3
  would mean designing and testing a parallel keyboard interaction model
  from scratch, which is strictly more work and more risk than adopting a
  library that already solves it.

---

## ADR-003: Decompose TaskDashboard into KanbanBoard, KanbanColumn, and TaskCard

**Status**: Accepted
**Date**: 2026-11-23

**Context**
`architecture.md` (Reverse Engineering) flags `task-dashboard.tsx` — 183
lines owning layout chrome, stats, filters, the task list, and the
create-task modal — as something to decompose before adding Kanban/DnD
behavior, since that behavior is new capability rather than a tweak to
existing logic.

**Decision**
Introduce `KanbanBoard` (3-column layout + drag-and-drop session),
`KanbanColumn` (one column's header/count/card list), and `TaskCard`
(replaces `TaskRow`'s rendering), extracted from `TaskDashboard`. The
existing `TaskDashboard` keeps the stat cards, search box, and create-task
modal, and becomes the page-level shell that composes `KanbanBoard`.

**Consequences**
- Positive: matches the architecture improvement note; each new component
  has one nameable responsibility and can be tested in isolation (board
  layout/DnD, column rendering, card rendering, independently).
- Positive: `TaskDashboard` shrinks back toward a single, reviewable
  concern (page composition) instead of growing further as Kanban behavior
  is added.
- Negative: four new files instead of one, and `TaskRow`'s existing tests
  need to be re-targeted at `TaskCard`.

**Alternatives Rejected**
- **Keep the existing monolithic structure**: add drag handlers and column
  grouping inline inside `TaskDashboard`/`TaskRow`. Rejected because it
  compounds the already-flagged decomposition debt rather than resolving
  it, and makes column/card/board concerns harder to test in isolation.

---

## ADR-004: Extend useTasks with moveTask and reorderTask

**Status**: Accepted
**Date**: 2026-11-23

**Context**
`architecture.md` identifies `useTasks()` as "the single state-owning
boundary" for the whole app today — `TaskDashboard` never touches
`localStorage` directly, and every existing mutation
(`addTask`/`updateTask`/`deleteTask`/`setStatus`) goes through the hook.

**Decision**
Add `moveTask(id, newStatus)` and `reorderTask(id, newIndex)` to the
existing `useTasks` hook, called by `KanbanBoard` after a completed drag
and by `TaskCard` for its non-drag status-cycle control.

**Consequences**
- Positive: preserves the existing single state-owning boundary — there is
  still exactly one place in the codebase that can mutate `Task[]` and
  trigger the write-back-to-`localStorage` effect (NFR1).
- Positive: `KanbanBoard` and `TaskCard` stay presentation/interaction
  components with no direct persistence knowledge, matching the existing
  separation of concerns.
- Neutral: `useTasks` grows by two methods; still a single, cohesive hook
  at this app's scale.

**Alternatives Rejected**
- **Separate board-specific hook/service**: would compute the new
  arrangement itself and call into `useTasks` only for the final write.
  Rejected because it introduces a second place that reasons about task
  state transitions, increasing the risk the two drift out of sync with no
  offsetting benefit at this app's scale.

---

## ADR-005: Reorder against the full unfiltered list when a search filter narrows a column

**Status**: Accepted
**Date**: 2026-11-23

**Context**
FR6.1 filters each column's visible cards independently by the search
query. FR4 lets a card be dragged to a new position within its column.
Neither requirement says what a drop position means when the person is
only seeing a filtered subset of that column's cards — this gap was not
covered by Requirements Analysis and was raised fresh at this stage (Q5).

**Decision**
Reordering stays available while a search filters a column. The dropped
card's new position is computed against the full, unfiltered task list for
that column, using the drop target's nearest visible neighbors to find the
insertion point — hidden, non-matching cards keep their relative position.

**Consequences**
- Positive: one consistent reorder behavior; no special "disabled while
  searching" state the person needs to learn or that needs separate UI
  treatment.
- Negative: slightly more computation per drop (locating the nearest
  visible neighbors' positions in the full list rather than the filtered
  one), negligible at this app's scale.

**Alternatives Rejected**
- **Disable reordering while filtered**: only allow drag-and-drop
  reordering within a column when it shows every one of its cards (no
  active search). Rejected because it adds a mode the person has to
  discover and understand (why did dragging stop working?), for a
  correctness problem that the full-list computation solves directly.
