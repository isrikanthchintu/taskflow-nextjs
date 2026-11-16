# Business Overview

## Domain

TaskFlow is a personal task-management (to-do list) application. It targets a single user organizing their own work items — there is no team, organization, or multi-user collaboration model in the current codebase.

## Purpose

TaskFlow gives an individual a focused dashboard to capture, track, and triage their personal tasks without any account creation, server, or database. It is explicitly positioned (per `README.md`) as a learning/prototype project — "intentionally backend-free" — rather than a production multi-user product in its current form.

## Key Functionality

- **Task creation**: A "New task" action opens a modal form to capture a task title (required), an optional description, a priority (low/medium/high), and an optional due date. On submit, a new task is created with status `todo` and a creation timestamp.
- **Status progression**: Each task moves through a three-stage lifecycle — `todo` → `in-progress` → `done` → back to `todo` — advanced by clicking the circular status control on the task row (a single click cycles to the next status).
- **Task deletion**: Each task row has a delete control that removes it immediately (no confirmation step, no undo).
- **Dashboard summary**: Four stat cards summarize the user's workload at a glance — total tasks, to-do count, in-progress count, and completed count.
- **Search**: A text box filters the visible task list by matching the query (case-insensitive substring) against task title or description.
- **Status filtering**: Filter tabs ("All tasks", "To do", "In progress", "Completed") narrow the visible list to one status, each labeled with a live count.
- **Responsive layout**: The dashboard adapts across desktop, tablet, and mobile breakpoints (sidebar collapses, grid columns reflow, form layout stacks) via hand-written CSS media queries.
- **Persistent-per-device memory**: Once created, tasks survive page reloads on the same browser/device because they are written to that browser's `localStorage` — see `architecture.md` for the full persistence flow. Data does not sync across devices or browsers and is lost if the user clears site data.

## Who Uses It / Value Delivered

A single end user (no login, no identity model — the UI shows a static "Jordan Davis / Personal workspace" placeholder profile, not a real authenticated account) gets:
- A always-available personal task board that requires no sign-up and works entirely offline/client-side after the page loads.
- At-a-glance visibility into how much work is outstanding, in progress, and done.
- Fast capture and triage (priority, due date, search, filter) without backend latency, since every operation is synchronous, in-memory React state backed by `localStorage`.

## Explicit Non-Goals (as documented)

The project's own README names its boundaries directly: it is not a secure or shared database, it is not suitable for multi-user or multi-device use, and production use would require replacing the storage layer with an authenticated API and real database. These are business-relevant constraints that any extension of TaskFlow should treat as the current ground truth, not assumptions.
