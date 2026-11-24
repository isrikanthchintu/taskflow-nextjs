# Requirements Analysis — Questions

## Q1. [Product] Columns and existing task statuses

The intent statement says the first version supports "multiple columns
representing task status/stage," and the scope document fixes the columns
(not user-created, renamed, reordered, or deleted). The existing `Task` type
already has exactly three status values (`todo`, `in-progress`, `done`).
Should the board's three columns map 1:1 onto these existing statuses (To
do / In progress / Done), with no new status value introduced, or do you
want a different fixed column set?

A. Map the three columns exactly onto the existing three statuses (no new status value)
B. Use a different fixed set of columns (please specify the columns and how they relate to the existing status field)
X. Other (please specify)
[Answer]: A. Map the three columns exactly onto the existing three statuses (no new status value)

## Q2. [Product] Reordering cards within a column

Dragging a card between columns is in scope (it changes status). Should
dragging a card within the same column also let the person reorder it (for
example, to set their own priority order within "To do"), or is only
cross-column movement in scope for this first version?

A. In-column reordering is also in scope for v1 (dragging within a column changes its order)
B. Only cross-column movement is in scope; within a column, keep today's existing order (e.g., newest first)
X. Other (please specify)
[Answer]: A. In-column reordering is also in scope for v1 (dragging within a column changes its order)

## Q3. [Design] Keyboard-accessible alternative to drag-and-drop

Native drag-and-drop is not usable from the keyboard alone. The app
currently has a click-to-cycle status button (todo → in-progress → done →
todo) as a keyboard-accessible way to change a task's status. Should that
control (or an equivalent accessible alternative, such as a per-card
"move to..." menu) remain available on the board so a card's status can
still be changed without dragging, or is keyboard/non-drag access
explicitly out of scope for this first version?

A. Keep an accessible non-drag alternative (e.g., keep or adapt the existing status-cycle control, or add a "move to..." menu)
B. Drag-and-drop only for this first version; a non-drag alternative is explicitly deferred
X. Other (please specify)
[Answer]: A. Keep an accessible non-drag alternative (e.g., keep or adapt the existing status-cycle control, or add a "move to..." menu)

## Q4. [Product] Card content on the board

Richer card details (description, due date, labels as new/expanded fields)
are explicitly deferred per the scope document. Should each card on the
board show the same fields the current task list row already shows (title,
description preview, priority badge, status, due date), or a reduced subset
(e.g., just title and priority)?

A. Same fields as today's task row (title, description preview, priority, due date)
B. A reduced subset (please specify which fields to keep)
X. Other (please specify)
[Answer]: A. Same fields as today's task row (title, description preview, priority, due date)

## Q5. [Product] Search and status-filter tabs on the board view

Today's dashboard has a free-text search box and status-filter tabs (All
tasks / To do / In progress / Completed) above the task list. On a Kanban
board, the columns already group tasks by status, so the status-filter tabs
would be redundant with the columns themselves. Should the search box
still filter which cards are visible within each column, and should the
status-filter tabs be removed (since columns now serve that purpose)?

[Answer]:
A. Keep search (filtering cards within columns); remove the status-filter tabs since columns now show status
B. Keep both search and the status-filter tabs as they are today, alongside the columns
C. Remove both search and the status-filter tabs for this first version
X. Other (please specify)
[Answer]: A. Keep search (filtering cards within columns); remove the status-filter tabs since columns now show status

## Q6. [Product] Creating and editing cards

The scope document defers in-place editing of a card's details from the
board itself, saying editing continues through the existing task
form/flow. To confirm the exact behavior: should the existing "New task"
button keep creating a task into the "To do" column by default (new tasks
always start as `todo`, matching current behavior), and should clicking an
existing card open the same create/edit form used today (pre-filled). so
rather than any inline editing on the card itself?

[Answer]:
A. Yes — "New task" still creates into To do by default, and clicking a card opens the existing form to edit it (no inline editing)
B. Something different (please specify)
X. Other (please specify)
[Answer]: A. Yes — "New task" still creates into To do by default, and clicking a card opens the existing form to edit it (no inline editing)

## Q7. [Product] Summary stat cards above the board

Should the four existing summary stat cards (Total tasks, To do, In
progress, Completed) stay above the board exactly as they are today, or do
you want them changed or removed now that the columns themselves show
per-status groupings?

[Answer]:
A. Keep the four stat cards above the board, unchanged
B. Remove or change them (please specify)
X. Other (please specify)
[Answer]: A. Keep the four stat cards above the board, unchanged

## Q8. [Quality] Board behavior with many cards and on small screens

The current layout is responsive (sidebar collapses, layout reflows at
tablet/mobile breakpoints). A multi-column board needs its own behavior for
(a) a column with many cards (e.g., does it scroll vertically within a
fixed-height column, or does the whole page grow?) and (b) narrow/mobile
screens (e.g., do the three columns scroll horizontally side-by-side, or
stack vertically one above another)?

[Answer]:
A. Each column scrolls vertically with its own fixed height when it has many cards; on mobile, columns scroll horizontally side-by-side
B. The whole page grows with column content; on mobile, columns stack vertically one above another
X. Other (please specify)
[Answer]: A. Each column scrolls vertically with its own fixed height when it has many cards; on mobile, columns scroll horizontally side-by-side

## Consolidated Summary Confirmation

- Q1: The three board columns map exactly onto the existing three task statuses (To do / In progress / Done) — no new status value.
- Q2: Dragging a card within the same column also reorders it (in-column reordering is in scope for v1), not just cross-column moves.
- Q3: An accessible non-drag alternative to changing a card's column/status stays on the board (not drag-and-drop-only).
- Q4: Each card shows the same fields as today's task row — title, description preview, priority, due date.
- Q5: The search box stays and still filters cards within columns; the status-filter tabs are removed (the columns now serve that purpose).
- Q6: "New task" still creates into the To do column by default; clicking an existing card opens the same create/edit form, pre-filled (no inline editing on the card).
- Q7: The four summary stat cards (Total, To do, In progress, Completed) stay above the board, unchanged.
- Q8: Each column scrolls vertically within its own fixed height when it has many cards; on mobile/narrow screens, the columns scroll horizontally side-by-side.

Does this all look correct before I generate the artifact?

[Answer]: Looks correct
