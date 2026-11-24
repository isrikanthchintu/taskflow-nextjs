# Rough Mockups & Concept Visualization — Questions

## Q1. [Design] Where does the board live on the existing page?

The app today is one route: a sidebar, a top bar, a welcome row, a stats
row, then a "Your tasks" panel showing a flat, filterable list.

A. Replace the "Your tasks" panel's contents with the board; sidebar, top bar, and welcome row stay as they are
B. Replace the whole page content area (including the welcome row) with the board
C. Not yet defined — propose what fits best
X. Other (please specify)

[Answer]: A. Replace the "Your tasks" panel's contents with the board; sidebar, top bar, and welcome row stay as they are

## Q2. [Design] Are the board's columns exactly the three existing task statuses?

The app's `Task` type already has three statuses: `todo`, `in-progress`, `done`.

A. Yes — three columns, in that order: To do, In progress, Done
B. No — different columns are needed
X. Other (please specify)

[Answer]: A. Yes — three columns, in that order: To do, In progress, Done

## Q3. [Design] What's the core happy-path flow for this screen?

A. User opens the board, sees existing tasks already placed in their status column, drags a card to a different column, and the status change is saved immediately
B. The above, plus creating a new task (via the existing "New task" button/modal) and seeing it appear in the To do column
C. Both A and B
X. Other (please specify)

[Answer]: A. User opens the board, sees existing tasks already placed in their status column, drags a card to a different column, and the status change is saved immediately

## Q4. [Design] What happens to the current stats row (Total/To do/In progress/Completed cards) and the search box + filter tabs, now that columns show status directly?

A. Keep the stats row above the board as-is; drop the filter tabs (redundant with columns) but keep the search box to find a card
B. Keep the stats row and search box; drop only the filter tabs
C. Drop the stats row, filter tabs, and search box entirely — the board is the whole view
D. Not yet defined — propose what fits best
X. Other (please specify)

[Answer]: A. Keep the stats row above the board as-is; drop the filter tabs (redundant with columns) but keep the search box to find a card

## Q5. [Design] Should the board reuse the app's existing visual style as-is?

A. Yes — same sidebar, top bar, color tokens, icon set (lucide-react), and card/button styling; only the "Your tasks" panel's layout changes to columns
B. No — some visual restyling is wanted
X. Other (please specify)

[Answer]: A. Yes — same sidebar, top bar, color tokens, icon set (lucide-react), and card/button styling; only the "Your tasks" panel's layout changes to columns

## Q6. [Design] What device/viewport support does this v1 need?

A. Desktop-first only, matching the app's current behavior — no specific tablet/mobile layout work
B. Desktop-first, but the board should still be usable on a narrower screen (e.g. horizontal scroll between columns)
X. Other (please specify)

[Answer]: A. Desktop-first only, matching the app's current behavior — no specific tablet/mobile layout work

## Q7. [Design] Does moving a card between columns need a non-drag (keyboard/button) alternative for this v1?

Per accessibility guidance, drag-and-drop should generally have a non-drag
alternative (WCAG keyboard operability), though this project's depth and
scope are intentionally light for v1.

A. Yes — keep a non-drag way to change a card's status (e.g. keep the existing click-to-advance behavior, or a per-card status menu), alongside dragging
B. No — drag-and-drop only for this v1; a non-drag alternative can be a later follow-up
X. Other (please specify)

[Answer]: A. Yes — keep a non-drag way to change a card's status (e.g. keep the existing click-to-advance behavior, or a per-card status menu), alongside dragging

## Consolidated Summary Confirmation

- Looks correct
- Request changes

[Answer]: Looks correct
