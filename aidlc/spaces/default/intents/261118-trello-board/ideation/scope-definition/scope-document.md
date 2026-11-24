# Scope Document — Trello-Style Task Board v1

This scope is built directly on the intent captured in
`aidlc/spaces/default/intents/261118-trello-board/ideation/intent-capture/intent-statement.md`:
a single-board, fixed-column Kanban redesign of TaskFlow's existing flat task
list, for a single user, with no backend/database change.

## In Scope (Must Have — v1)

- A board with fixed status columns, showing existing tasks as cards (Q1).
- Dragging a card into another column changes its status, and the change is
  saved (Q1), matching the intent statement's Success Metrics.
- Existing tasks already saved in the browser are migrated into the new
  column structure rather than discarded (per the intent statement's Initial
  Scope Signal).

## Deferred (Should Have / Could Have — after v1)

- Richer card details: description, due date, labels (Q2).
- In-place editing of a card's details from the board itself; editing
  continues through the existing task form/flow for now (Q1, Q2).

## Out of Scope (confirmed at Intent Capture, not revisited here)

- Real-time multi-user collaboration or shared boards across devices/accounts.
- Multiple separate boards — this is one board.
- A database, backend API, or server-side persistence layer — localStorage
  remains the only data store.

## Build Sequencing

Value-first (Q3): the column/data model is built before drag-and-drop is
layered on top of it (Q5), so there is a working board to drag against from
the start. Card-detail polish is explicitly later, after the core board and
drag-and-drop are working end-to-end.

## Timeline

No hard deadline — this is a personal project with no fixed date (Q4).

## Value Stream

| From | To | Customer Outcome |
|---|---|---|
| Flat task list | Kanban board with fixed columns | See where every task stands at a glance |
| Manual status toggle | Drag a card between columns | A natural, direct way to move work forward |
| List-style UI | Portfolio-worthy Kanban UI | A more realistic, showcase-ready interface |

## Assumptions & Open Questions

None beyond what Intent Capture already recorded and the person accepted.
