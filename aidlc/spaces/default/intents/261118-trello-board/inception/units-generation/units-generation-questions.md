# Units Generation — Questions

## Q1. [Architect] How many Units should this feature be grouped into?

`components.md` identifies 6 components (`TaskDashboard`, `KanbanBoard`,
`KanbanColumn`, `TaskCard`, `useTasks`, `task-storage`), all inside the
existing single-route, single-deployable Next.js app, calling each other
directly (no network boundary between any of them).

- A. One Unit covering the whole Kanban board feature (all 6 components).
  There is no independent-deploy or independent-scale benefit to splitting
  a client-only app with direct in-process calls between components, and
  splitting would force an artificial boundary where `components.md`
  already defines clean in-app component boundaries. (Recommended.)
- B. Two Units: a "data/state layer" Unit (`useTasks`, `task-storage`) and a
  "board UI" Unit (`TaskDashboard`, `KanbanBoard`, `KanbanColumn`,
  `TaskCard`), with the UI Unit depending on the data Unit.
- X. Other (please specify)

[Answer]: A. One Unit covering the whole feature. (Recommended)

## Q2. [Architect] What Unit kind applies?

The Unit kind drives which Construction design-artifact matrix applies
(for example, a `service` owes infrastructure/scalability design that a
pure frontend change does not).

- A. `ui` — this Unit is a frontend surface inside the existing app; it
  introduces no new deployable process, API, or standalone
  package. (Recommended.)
- B. `service` — treat it as a deployed executable in its own right.
- X. Other (please specify)

[Answer]: A. ui. (Recommended)

## Q3. [Architect] What is the deployment model for this Unit?

- A. Embedded in the existing app's single build/deploy artifact — this
  feature ships as part of the same Next.js build that already exists;
  there is no separate deploy pipeline or runtime for it. (Recommended —
  matches `team.md`'s affirmed CI-only, no-hosting-target scope for this
  intent.)
- B. Standalone — deployed independently of the rest of the app.
- X. Other (please specify)

[Answer]: A. Embedded. (Recommended)

## Consolidated Summary Confirmation

- Looks correct
- Request changes

[Answer]: Looks correct
