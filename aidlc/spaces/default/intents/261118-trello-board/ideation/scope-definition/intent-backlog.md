# Intent Backlog — Trello-Style Task Board v1

Prioritized with MoSCoW, following on from `scope-document.md` and the intent
statement at `aidlc/spaces/default/intents/261118-trello-board/ideation/intent-capture/intent-statement.md`.

| Item | MoSCoW | Notes |
|---|---|---|
| Column/data model: single board, fixed status columns | Must | Foundation — built first per the Q5 dependency (data model before drag-and-drop) |
| Drag-and-drop between columns, persisted to localStorage | Must | The core value identified at Intent Capture (Q1, Q3) |
| Migrate existing saved tasks into the new column structure | Must | Confirmed at Intent Capture (Q6) — no data loss on upgrade |
| Richer card details (description, due date, labels) | Should | Deferred past v1 (Scope Definition Q2) |
| In-place card editing from the board | Could | Deferred past v1; existing edit flow continues to work (Scope Definition Q1, Q2) |
| Multiple separate boards | Won't (this round) | Out of scope per the intent statement |
| Real-time multi-user collaboration | Won't (this round) | Out of scope per the intent statement |

## Dependencies

- Drag-and-drop depends on the column/data model existing first (Scope
  Definition Q5).
- Card-detail polish (Should/Could items) depends on the Must-Have board and
  drag-and-drop landing first (Scope Definition Q3).

## Sequencing

1. Column/data model (single board, fixed columns), with existing tasks
   migrated in.
2. Drag-and-drop between columns, persisting status changes.
3. (Post-v1) Richer card details and in-place editing, if pursued later.
