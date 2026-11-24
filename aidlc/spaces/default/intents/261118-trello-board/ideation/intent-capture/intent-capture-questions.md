# Intent Capture & Framing — Questions

## Sources

- [desc] Initial description: "I want to update the UI and functionality of this project to be like Trello (a Kanban-style task board with drag-and-drop columns/cards), building on the existing TaskFlow Next.js app."
- [scope] Workflow-selected scope: `feature`.
- [memory:M1] `aidlc/spaces/default/memory/project.md#Forbidden`: "NEVER introduce a database, backend API, or server-side persistence layer as a silent replacement for `localStorage` — the codebase has none today (no ORM, no DB driver, no API routes, no server actions anywhere in `src/`; confirmed in `technology-stack.md` under \"Explicitly Absent\" and `architecture.md`), the README explicitly frames this as an intentional, documented trade-off, not an oversight, and this intent's scope is explicitly to preserve existing localStorage functionality rather than replace it. (affirmed 2026-11-16)"

## Q1. [Product] What's the core problem with the current dashboard that this update solves?

A. The flat list view hides task status/stage; a Kanban board shows workflow at a glance
B. Changing a task's status is clunky right now (e.g. toggling a field) instead of a natural drag gesture
C. Both A and B
D. Not yet defined — figure it out from what "Trello-style" implies
X. Other (please specify)

[Answer]: A. The flat list view hides task status/stage; a Kanban board shows workflow at a glance

## Q2. [Product] Who is this board for?

A. Just me (personal/demo use)
B. Me, plus people I show it to (e.g. a portfolio audience), but no one else actively manages tasks
C. Multiple people will actually use and edit the board day to day
X. Other (please specify)

[Answer]: A. Just me (personal/demo use)

## Q3. [Product] What does success look like for this update?

A. Tasks can be dragged between status columns (e.g. To Do / In Progress / Done) and the move persists
B. The above, plus richer cards (description, due date, labels/tags)
C. The above, plus multiple lists/columns that can be created, renamed, and reordered
D. Not yet defined — happy to have this proposed
X. Other (please specify)

[Answer]: A. Tasks can be dragged between status columns (e.g. To Do / In Progress / Done) and the move persists

## Q4. [Product] What's prompting this change now?

A. Wanting a more realistic, portfolio-worthy UI to showcase
B. The current list UI is limiting as the number of tasks grows
C. Learning/practicing building a Kanban-style UI (drag-and-drop, etc.)
D. Not yet defined
X. Other (please specify)

[Answer]: A. Wanting a more realistic, portfolio-worthy UI to showcase

## Q5. [Product] Which Trello-style capabilities matter most for this first version? (select all that apply)

A. Multiple columns (lists) representing task status/stage
B. Drag-and-drop of cards between and within columns
C. Card details (description, due date, labels)
D. Creating, renaming, reordering, and deleting columns themselves
X. Other (please specify)

[Answer]: A, B, C

## Q6. [Product] Should the tasks currently saved in the browser carry over into the new board layout?

A. Yes — migrate existing tasks into the new column structure automatically
B. No — a fresh start is fine; existing data can be cleared
C. Not yet defined
X. Other (please specify)

[Answer]: A. Yes — migrate existing tasks into the new column structure automatically

## Q7. [Product] What should this first version explicitly leave out?

This project intentionally has no backend or database — all data stays in the
browser's localStorage ([memory:M1]) — so this question is about what else is
out of scope, not whether to keep that constraint.

A. Real-time multi-user collaboration or shared boards across devices/accounts
B. Multiple separate boards (just one board for now)
C. Both A and B
D. Not yet defined
X. Other (please specify)

[Answer]: A. Real-time multi-user collaboration or shared boards across devices/accounts

## Consolidated Summary Confirmation

- Looks correct
- Request changes

[Answer]: Looks correct

## Assumption Confirmation

The following assumption was made while drafting the intent statement:

- This first version targets a single board (no support for multiple,
  separate boards) and fixed columns (not user-created, renamed, reordered,
  or deleted) — inferred from the success criteria and capability list
  neither naming multi-board support nor editable columns as a goal.

A. Accept assumptions
B. Convert to follow-up questions

[Answer]: A. Accept assumptions
