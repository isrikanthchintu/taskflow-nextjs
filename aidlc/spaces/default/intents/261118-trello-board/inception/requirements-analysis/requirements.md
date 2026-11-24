# Requirements — Trello-Style Task Board

## Intent Analysis

The person wants to evolve TaskFlow's current flat, list-style task dashboard
into a single-board, Trello-style Kanban board: fixed status columns holding
draggable cards, so the state of their work is visible at a glance and moving
a task forward feels like a natural drag gesture instead of a field toggle
(`intent-statement.md`'s Problem Statement and Success Metrics). The
underlying goal is twofold: a more useful personal tool, and a more
realistic, portfolio-worthy UI to showcase (`intent-statement.md`'s
Initiative Trigger). This is a UI/interaction evolution of the existing
application, not a rebuild — the existing single-user, backend-free,
`localStorage`-only architecture is preserved exactly as it is today (per
both `intent-statement.md`'s Initial Scope Signal and `scope-document.md`'s
Out of Scope list); only the board's presentation and interaction model
change, within the Must Have v1 boundary `scope-document.md` sets.

## Functional Requirements

### FR1. Board columns and layout

- **FR1.1** — The board displays exactly three fixed columns — To do, In
  progress, Done — mapping 1:1 onto the existing three `TaskStatus` values
  (`todo`, `in-progress`, `done`), in that fixed left-to-right order. The
  person cannot add, rename, reorder, or delete columns.
- **FR1.2** — Each column header shows its label and a live count of the
  cards currently in it, reusing the existing per-status counts already
  computed today (`counts.todo`, `counts.active`, `counts.done`).
- **FR1.3** — Every task already stored in `localStorage` renders as a card
  in the column matching its current `status` the first time the board
  loads after this change. No separate migration step or stored-data
  transform is needed, because `status` already determines the column and
  the stored task shape is unchanged.

### FR2. Card rendering

- **FR2.1** — Each card shows the same fields as today's task row: title,
  description preview (or "No description added" when empty), priority
  badge, and due date (or "No due date" when unset) — the existing per-field
  formatting (`formatDate`, priority badge styling) carries over unchanged.
- **FR2.2** — A card for a task in the Done column reflects its completed
  state the same way today's row does (e.g. the completed-title styling);
  the separate status-badge text shown on today's row is not repeated on the
  card, since the column itself now conveys status.
- **FR2.3** — Each card keeps a delete control with the same immediate,
  no-confirmation deletion behavior as today's delete button.

### FR3. Drag-and-drop between columns

- **FR3.1** — Dragging a card from one column and dropping it in a
  different column sets that task's `status` to the status the drop-target
  column represents, and the change is written to `localStorage`
  immediately via the existing write-back-on-change mechanism (no explicit
  "Save" action).
- **FR3.2** — Dropping a card back into its own column, with no column
  change, leaves its status unchanged.
- **FR3.3** — A drag that ends outside any valid column or card-drop target
  is treated as cancelled: the card stays in its original column and
  position, with no partial or corrupted state written.

### FR4. In-column reordering

- **FR4.1** — Dragging a card to a new position within its own column
  reorders the cards in that column; the new order persists across page
  reloads, using the same `localStorage` persistence model as task data.
- **FR4.2** — Reordering a card within a column never changes its status.
- **FR4.3** — A newly created task (FR7.1) is added to the To do column in
  the same relative position today's `addTask` already uses (prepended,
  i.e. newest first), before any manual reordering is applied.

### FR5. Keyboard-accessible alternative to drag-and-drop

- **FR5.1** — Each card keeps a keyboard-operable control, equivalent to
  today's status-cycle button, that lets a person move it to a different
  column without dragging.
- **FR5.2** — Because the three columns map 1:1 onto the three existing
  statuses (FR1.1), the existing fixed-cycle behavior (todo → in-progress →
  done → todo) continues to work unchanged as that non-drag way to advance a
  card to its next column.

### FR6. Search

- **FR6.1** — Free-text search continues to filter which cards are visible,
  matching against title and description (case-insensitive, same matching
  rule as today), applied independently within each column: a column shows
  only its own matching cards, and a column with no matches shows an empty
  state.
- **FR6.2** — The existing status-filter tabs (All tasks / To do / In
  progress / Completed) are removed from the board view, since the columns
  themselves now group cards by status.

### FR7. Creating and editing cards

- **FR7.1** — The existing "New task" button continues to open the same
  create-task form; a newly created task is always created with status
  `todo` (unchanged business rule) and therefore appears in the To do
  column.
- **FR7.2** — Clicking an existing card opens the same form used today,
  pre-filled with that task's current field values, for editing. No
  inline/on-card editing is introduced in this version.
- **FR7.3** — Editing a task's fields through that form does not move its
  card to a different column: the existing form has no status field, so
  editing a task never changes its status.

### FR8. Summary stat cards

- **FR8.1** — The four existing summary stat cards (Total tasks, To do, In
  progress, Completed) remain above the board exactly as they are today,
  computed the same way, and are unaffected by drag-and-drop or reordering.

### FR9. Responsive and scale behavior

- **FR9.1** — A column containing more cards than fit its available height
  scrolls vertically within that column; the column's header and the other
  columns remain visible.
- **FR9.2** — On narrow/mobile viewports, the three columns are presented in
  a horizontally scrollable row rather than stacking vertically, consistent
  with the app's existing responsive behavior at tablet/mobile breakpoints.

## Non-Functional Requirements

- **NFR1** — Every drag-and-drop move, reorder, create, edit, and delete
  must be written to `localStorage` through the existing write-back-on-change
  mechanism, with no explicit "Save" step, matching today's persistence
  behavior.
- **NFR2** — The feature must be implemented entirely client-side on top of
  the existing `localStorage`-only persistence model (`task-storage.ts`, key
  `taskflow.tasks.v1`); no new network call, API route, or server action may
  be introduced.
- **NFR3** — Every drag-and-drop interaction (column change, reordering)
  must have a keyboard-operable equivalent (FR5); drag handles and valid
  drop targets must expose a visible focus/hover affordance.
- **NFR4** — The board must remain usable at the same breakpoints the
  existing dashboard already supports (tablet and mobile), per FR9.
- **NFR5** — An interrupted or invalid drag-and-drop operation (e.g. the
  page is navigated away from mid-drag, or the drop target is invalid) must
  never corrupt the stored task list; the last successfully written state
  always remains the one that loads on the next visit.
- **NFR6** — Tasks already present in a person's `localStorage` from the
  current, pre-Kanban version of the app must continue to load and render
  correctly in the new column structure, with no existing task data lost or
  requiring re-entry.

## Constraints

- The existing `localStorage`-only persistence model
  (`src/lib/task-storage.ts` + `src/hooks/use-tasks.ts`, key
  `taskflow.tasks.v1`) must be preserved; no database, backend API, or
  server-side persistence layer may be introduced (project rules; scope
  document Out of Scope).
- Single board, single user: no multi-board support and no real-time
  multi-user collaboration or cross-device/account sharing (scope document
  Out of Scope).
- Columns are fixed: no user-created, renamed, reordered, or deleted columns
  (FR1.1, confirmed at Q1).
- All application source is TypeScript (`.ts`/`.tsx`) with `strict: true`,
  using the `@/*` path alias for internal imports, and with no code comments
  added anywhere — existing project-level mandates that apply to this change
  like any other.

## Assumptions

- In-column reordering (FR4) requires a persisted ordering concept per task
  that does not exist in the current data model — today's implicit order is
  just array position in the stored list. How that is represented (a new
  explicit field such as an `order`/`position` value, vs. continuing to rely
  on and rewrite array position within each status group) is left to Domain
  Design, since both satisfy FR4 as written here.
- A drag that ends on an invalid target is treated as a fully cancelled
  operation with no state change (FR3.3) — this default follows the
  corner-checklist guidance for interrupted multi-step writes and was not a
  question the person needed to decide, since any reasonable Kanban board
  behaves this way.
- The exact visual form of the keyboard-accessible alternative in FR5 (reuse
  the existing round status-cycle button as-is vs. restyle it for the new
  card layout) is left to Design/Functional Design; the person confirmed an
  accessible alternative must exist (Q3) but was not asked to pick its exact
  look.
- Which concrete drag-and-drop implementation to use (a library vs. a
  hand-rolled HTML5 Drag and Drop implementation) is a technical choice with
  no existing team/project rule (flagged during Reverse Engineering) and is
  deferred to Domain Design/architecture, since it does not change any
  requirement written here.

## Out of Scope

- Real-time multi-user collaboration or shared boards across
  devices/accounts (scope document).
- Multiple, separate boards — this is one board (scope document).
- A database, backend API, or server-side persistence layer (scope
  document).
- User-created, renamed, reordered, or deleted columns (FR1.1; Q1).
- Richer card details as new fields (labels, expanded description/due-date
  editing beyond what already exists) (scope document).
- In-place/inline editing of a card's fields directly on the board; editing
  continues through the existing form (FR7.2; Q6).

## Open Questions

- Domain Design should settle the concrete representation of per-card order
  within a column (new `order` field vs. array-position rewrite) — see
  Assumptions.
- Domain Design/Functional Design should settle the exact drag-and-drop
  implementation approach (library vs. hand-rolled) — see Assumptions.
- Functional Design should settle the exact presentation of the
  keyboard-accessible, non-drag column-change control on the new card layout
  — see Assumptions.
