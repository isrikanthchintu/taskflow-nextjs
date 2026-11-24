# Units Generation — Unit of Work

## Units

| Unit ID | Directory | Kind | Complexity |
|---|---|---|---|
| U1 | u1-kanban-board | ui | M |

### U1 — Kanban Board (`u1-kanban-board`)

**Description**: Evolves the existing flat, list-style TaskFlow dashboard
into a single-board, Trello-style Kanban board with fixed status columns,
draggable cards, in-column reordering, and a keyboard-accessible
non-drag alternative — entirely client-side, on top of the existing
`localStorage`-only persistence model.

**Boundaries**: Covers every component identified in Domain Design
(`components.md`): `TaskDashboard`, `KanbanBoard`, `KanbanColumn`,
`TaskCard`, `useTasks`, `task-storage`. There is no second Unit — the
whole feature lives inside the existing single-route, single-deployable
Next.js app, and no component here is called across a network boundary
(Q1, confirmed).

**Responsibilities** (what this Unit owns and delivers):
- Render the 3 fixed status columns (To do, In progress, Done) with live
  per-column counts (FR1.1, FR1.2) and correctly place every existing task
  on first load with no migration step (FR1.3, NFR6)
- Render each task as a card with its existing fields, delete control, and
  completed-state styling (FR2)
- Drag-and-drop between columns and within a column, backed by
  `@dnd-kit` (FR3, FR4, ADR-002)
- A keyboard-operable, non-drag column-change control (FR5)
- Per-column search filtering, with the old status-filter tabs removed
  (FR6)
- The existing create/edit task modal, unchanged in behaviour (FR7)
- The existing 4 summary stat cards, unaffected by drag/reorder (FR8.1)
- Responsive/scroll behaviour per column and across columns on narrow
  viewports (FR9)

**Deployment model**: Embedded — ships inside the existing single Next.js
build/deploy artifact; no separate pipeline or runtime (Q3, confirmed).

**Relative complexity estimate**: **M** — six components to add/extend, one
new runtime dependency (`@dnd-kit`), no new persistence layer or schema
change, no cross-unit integration to coordinate.

**Unit kind**: `ui` — a frontend surface inside the existing app; it
introduces no new deployable process, API, or standalone package (Q2,
confirmed).

**Implementation notes and constraints**:
- No new `localStorage` field or key — ordering stays implicit via array
  position (ADR-001); NFR6 is satisfied by construction, not by a
  migration step.
- `useTasks` remains the sole state-owning boundary; `moveTask` and
  `reorderTask` are additions to it, not a new state owner (ADR-004).
- No database, backend API, or server action may be introduced (project
  `## Forbidden`, NFR2).
- No code comments, per the project's standing convention.
- The architecture reviewer's open Major finding (R-00 from Domain
  Design's review) — no keyboard-operable equivalent is yet specified for
  in-column reordering — carries forward as an implementation constraint
  for whichever Construction stage designs the keyboard interaction in
  detail; it does not block this Unit's boundary, since it is a
  behavioural gap within the already-assigned `TaskCard`/`useTasks`
  components, not a new component or boundary question.
