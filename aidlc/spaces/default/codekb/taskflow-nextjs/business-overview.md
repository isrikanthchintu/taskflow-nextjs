# Business Overview

## Purpose

TaskFlow is a single-user task-management web application presented as a Trello-style kanban board. It is a learning and prototype project: the README states it is intentionally backend-free and that tasks live in the browser's `localStorage`.

## Business Domain

Personal task and workflow tracking. The single domain entity is a Task with a title, description, status, priority, due date, and creation timestamp (`src/types/task.ts`).

## Key Functionality

- Kanban board with three fixed columns: To do, In progress, Completed (`src/components/kanban-board.tsx`).
- Create a task from the top bar "New task" button or from a column's "Add a card" button, which pre-selects that column's status.
- Edit a task's title, description, priority, and due date by clicking its card (status is not editable in the dialog).
- Delete a task from its card.
- Move a task between columns and reorder within a column by drag and drop (pointer or keyboard), or advance its status through the fixed cycle todo -> in-progress -> done -> todo with the circular status control.
- Search tasks by title or description (case-insensitive); column counts stay unfiltered.
- Summary pills: Total tasks, To do, In progress, Completed.
- Four seeded starter tasks on first launch when storage is empty.

## Users and Stakeholders

- End user: one person on one browser; no accounts, roles, or sharing.
- Developer owner: Srikanth P (git user), working in the active space `default`.

## Business Constraints

- Persistence is `localStorage` only (key `taskflow.tasks.v1`); the README presents this as an explicit trade-off and says a production multi-user app would need an authenticated API and database.
- No authentication, no backend, no server-side persistence.

## Transactions

Create task, edit task, delete task, change status (cycle or drag), reorder within column, search. Each is a client-side state change written through to `localStorage`. See the Interaction Diagrams in `architecture.md`.

## Observations

- The README is out of date: it still lists a status filter and a project structure that omit the board components.
- Business behaviour is verified by 41 Jest test cases across six files.
