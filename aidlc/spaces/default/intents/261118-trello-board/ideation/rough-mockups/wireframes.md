# Wireframes — Trello-Style Task Board v1

Low-fidelity structural wireframes for the one screen this intent changes:
the existing single route's "Your tasks" panel, replacing its flat list with
a three-column Kanban board (Q1, Q2).

This follows directly from `../intent-capture/intent-statement.md` (a
Trello-style, single-board, fixed-column redesign for one user), the Must
Have items in `../scope-definition/scope-document.md` and
`../scope-definition/intent-backlog.md` (board + drag-and-drop land first;
richer card details and in-place editing are deferred past v1), and this
stage's own confirmed answers (Q1–Q7).

## Information Architecture

- Sidebar, top bar, and welcome row are unchanged (Q1, Q5).
- The stats row (Total / To do / In progress / Completed) stays above the
  board; the search box stays; the filter tabs are removed, since the three
  columns already separate tasks by status (Q4).
- "Your tasks" panel becomes "Task board": three fixed columns, in order —
  To do, In progress, Done (Q2) — each a scrollable list of cards.
- Accessibility note: heading level `h2` ("Task board", same level the
  current "Your tasks" heading uses); primary landmark is the existing
  `<section>` tasks panel (treated as the board's main region, nested inside
  the page's `<main>`); keyboard entry point is the existing tab order into
  the panel, landing on the search box, then into the first column's cards.

## Screen: Task Board

### Success / Populated State

```
+------------------------------------------------------------------+
| Your tasks                                    [ Search tasks... ] |
+------------------------------------------------------------------+
| To do (5)        | In progress (4)    | Done (3)                 |
| +--------------+ | +----------------+ | +----------------+      |
| | Write report | | | Fix login bug  | | | Ship v1        |      |
| | High  Nov 20 | | | Med   Nov 18   | | | Low   Nov 10   |      |
| +--------------+ | +----------------+ | +----------------+      |
| +--------------+ | +----------------+ |                          |
| | Review PR    | | | Deploy staging | |                          |
| | Med   Nov 22 | | | High  Nov 19   | |                          |
| +--------------+ | +----------------+ |                          |
+------------------------------------------------------------------+
```
<!-- Text fallback: three side-by-side columns labelled "To do (5)", "In progress (4)", "Done (3)", each holding stacked cards; each card shows a title, priority badge, and due date, the same fields the current task row already shows. -->

Each card keeps the existing per-task controls from the current task row —
the status-cycle button and the delete button — so a card's status can still
be changed without dragging (Q7), and dragging a card into a different
column's list area changes and saves its status (Q3).

### Loading State

The three column headers render immediately (To do / In progress / Done);
each column body shows a skeleton placeholder (2-3 gray card-shaped blocks)
until tasks are read from storage, replacing today's single
"Loading your tasks..." message with one skeleton per column.

### Empty State (no tasks at all)

```
+------------------------------------------------------------------+
| Your tasks                                    [ Search tasks... ] |
+------------------------------------------------------------------+
| To do (0)        | In progress (0)    | Done (0)                 |
|                   |                     |                          |
|  No tasks yet.    |  Nothing in         |  Nothing completed       |
|  Create your      |  progress yet.      |  yet.                    |
|  first task.       |                     |                          |
|  [ Create a task ] |                     |                          |
+------------------------------------------------------------------+
```
<!-- Text fallback: all three columns show zero counts; the To do column carries the primary "Create a task" call-to-action (mirroring the existing empty-state pattern), the other two columns show a short explanatory line with no action, since they empty out as a side effect of work moving rather than something to create directly. -->

### Error State (status change does not save)

If dragging (or using the non-drag status control) fails to persist, the
card visibly returns to its original column and an inline message appears
near the board (not a raw error code): "Couldn't save that change. Try
again." Existing data already on the board is never lost by a failed move,
per the project's error-handling guardrail.

### Partial / Edge State

- A column with zero cards shows its own short empty message ("Nothing in
  progress yet.") inline in that column, not a blank gap, so an empty column
  reads as empty by design rather than broken (Q2).
- A very long task title truncates within the fixed card width (as the
  current task row's title already does visually), with the full title still
  available via the existing title text itself (no new truncation mechanism
  introduced).
- A column with many cards scrolls that column's own list vertically; the
  column header (name and count) stays visible while its body scrolls.

## Assumptions & Open Questions

None — every element above traces to a confirmed answer in
`rough-mockups-questions.md`, or carries forward unchanged from the existing
`src/components/task-dashboard.tsx` layout (Q1, Q5).
