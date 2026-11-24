# Intent Statement — Trello-Style Task Board

## Problem Statement

TaskFlow's current dashboard shows every task as a flat list, which hides
where each task sits in its workflow at a glance, and changing a task's
status is a manual field toggle rather than a natural drag gesture [desc]
[Q1].

## Target Customer

The board is for a single person — there are no other active users who
manage tasks day to day; any outside audience only views the board rather
than editing it [Q2].

## Success Metrics

This update succeeds when tasks can be dragged between status columns (for
example To Do / In Progress / Done) and the move persists [Q3]. The first
version should also support multiple columns representing task status/stage,
drag-and-drop of cards between and within columns, and richer card details
such as description, due date, and labels [Q5].

## Initiative Trigger

The change is driven by wanting a more realistic, portfolio-worthy UI to
showcase, moving the app from a plain list-style dashboard toward a
genuine Kanban-style board [Q4].

## Initial Scope Signal

- **Workflow-selected scope** (chosen before this stage): `feature` [scope].
- **User-confirmed product boundary**: real-time multi-user collaboration or
  shared boards across devices/accounts are explicitly out of this first
  version [Q7]. The project's existing constraint of using the browser's
  localStorage instead of a database or backend API continues to apply and
  is not being revisited by this intent [memory:M1]. Existing tasks already
  saved in the browser should be migrated into the new column structure
  rather than discarded [Q6].

## Assumptions & Open Questions

- This first version targets a single board (no support for multiple, separate boards) and fixed columns (not user-created, renamed, reordered, or deleted) — inferred from the success criteria and capability list neither naming multi-board support nor editable columns as a goal. [assumption]
