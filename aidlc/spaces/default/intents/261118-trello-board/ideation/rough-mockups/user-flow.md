# User Flow — Trello-Style Task Board v1

## Primary Flow: Change a Task's Status by Dragging

```
Flow: Drag a card to a different column
Persona: The sole user of this personal TaskFlow workspace
Trigger: The user wants to move a task forward (or back) in its workflow
Steps:
  1. Task board -> user presses and holds a card -> card lifts with a visual drag preview
  2. Dragging over another column -> system highlights that column as the drop target
  3. User releases the card over the target column -> system updates the task's status and
     saves it to localStorage -> card now renders in the new column, old column's count
     decreases by one, new column's count increases by one
Success outcome: The card appears in its new column, and the status change survives a
  page reload (read back from localStorage), matching the success criteria confirmed at
  Intent Capture.
Error paths:
  - Save to localStorage fails -> card returns to its original column -> inline message:
    "Couldn't save that change. Try again." -> no data is lost
  - User drops the card outside any column's drop target -> card returns to its original
    position, no status change, no error message (not a failure, just a cancelled drag)
```

(Q3)

## Alternate Flow: Change a Task's Status Without Dragging

```
Flow: Change status via the card's existing status control (non-drag alternative)
Persona: The sole user of this personal TaskFlow workspace
Trigger: The user cannot or does not want to drag (keyboard use, accessibility, or
  personal preference)
Steps:
  1. Task board -> user activates a card's existing status control (the same
     status-cycle control the current task row already has) via click or keyboard
     (Enter/Space)
  2. System advances the task to its next status and saves it to localStorage
  3. Card moves from its current column to the column matching the new status
Success outcome: Same end state as the drag flow — the card is in its new column and the
  change is saved — reached without needing to drag.
Error paths:
  - Save fails -> status is not changed, same inline message as the drag flow's error path
```

(Q7)

## Unchanged Flow: Create a New Task

Creating a task continues to work exactly as it does today (the existing
"New task" button and modal, per `src/components/task-dashboard.tsx`); the
only change is where the new task appears once created — in the To do
column of the board instead of at the top of a flat list. This flow is
carried forward, not redesigned, and is not itself part of this intent's
confirmed scope (Scope Definition: in-place editing and other flow changes
are deferred past v1).
