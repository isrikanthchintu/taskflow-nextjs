# Code Generation Plan — u1-kanban-board

## Summary

- Builds: the Trello-style Kanban board (3 fixed columns, drag-and-drop, in-column reorder, keyboard alternative, per-column search) on top of the existing TaskFlow app
- Touches: `src/hooks/use-tasks.ts` (extended), `src/components/task-dashboard.tsx` (rewritten to compose the board), 3 new files under `src/components/` (`kanban-board.tsx`, `kanban-column.tsx`, `task-card.tsx`), `package.json` (new dependency)
- Tests: ~27 tests across 5 test files (Standard strategy, 5-8 per component) — see Step 8/9

## Testing Contract (resolved — see `unit-test-instructions.md` for the full render)

- **Methodology**: test-after. **Ordering**: implement each applicable testable layer, then write and run that layer's tests (team.md, affirmed).
- **Applicable testable layers for this Unit**: Business logic (`useTasks`) and Frontend behavior (components). No Data model/database, Repository/data access, or API/endpoint layer applies — no entity/schema change, `task-storage.ts` is untouched, and this Unit introduces no network/API surface (NFR2).
- **Coverage note**: `team.md`'s affirmed Testing Posture explicitly sets no 80% line-coverage floor for this project ("intentionally lighter than the org-level default for mvp/enterprise/feature/infra scopes"), overriding the org scope default that would otherwise apply to `feature` scope. The obligation this plan actually meets is: Standard-strategy volume (5-8 tests/component, integration coverage at the key boundary) and keeping every existing + new test green, run in CI (team.md Deployment: lint/typecheck/test in CI) — not a specific line-coverage percentage.

## Steps

### Step 1: Add the drag-and-drop dependency

- [x] Add `@dnd-kit/core` and `@dnd-kit/sortable` to `package.json` `dependencies` (ADR-002 — Domain Design already chose this library; this step only adds the package). Run the project's package manager (`pnpm install`) to update the lockfile.

Traces to: ADR-002 (Domain Design), NFR2 (client-side only — no server dependency added).

### Step 2: Verify the existing test runner

- [x] Confirm `pnpm test` (Jest + `jest-environment-jsdom` + Testing Library, already configured) runs the existing 3 test files unchanged before any new code is written. Record the exact unit-scoped command in `unit-test-instructions.md` (already a required file of this step — see that file).

### Step 3: Business logic — implement (`useTasks`)

- [x] In `src/hooks/use-tasks.ts`, add `moveTask(id: string, status: TaskStatus)`: sets the task's `status` and relocates it to the end of its new status group within the single stored array (ADR-001 — no new field; array position is the order). Non-drag column changes (FR5.2) and drag-based column changes (FR3.1) both call this one method.
- [x] Add `reorderTask(id: string, newIndex: number)`: splices the task to `newIndex` counted among tasks of its OWN current status only, leaving tasks of other statuses at their existing array positions (FR4.1, FR4.2).
- [x] Both methods go through the existing `setTasks` state update, so the existing write-back-on-change effect persists them with no new effect or storage key (NFR1, NFR2).
- [x] Return `moveTask` and `reorderTask` alongside the existing returned methods.

Traces to: FR3.1, FR4.1, FR4.2, FR4.3, FR5.2, NFR1, ADR-001, ADR-004.

### Step 4: Business logic — tests (`use-tasks.test.ts`)

- [x] `moveTask` changes a task's status and the task ends up positioned after the other tasks already in its new status group.
- [x] `moveTask` to the task's OWN current status (drop on origin, FR3.2) leaves array order and status unchanged — i.e. calling it as a no-op has no observable effect (guards the FR3.2 behavior at the hook level; the no-call case itself is a `KanbanBoard` concern, tested in Step 6).
- [x] `reorderTask` moves a task to a new index among same-status tasks only; tasks of other statuses keep their relative array position (FR4.2).
- [x] A reordered or moved task's new array state is written to `task-storage` via the existing write-back effect (reuse the existing mock-storage test pattern already in this file).
- [x] Existing `addTask`/`updateTask`/`deleteTask`/`setStatus` tests remain green, unmodified.

Traces to: FR3.1, FR3.2, FR4.1, FR4.2, NFR1.

### Step 5: Frontend behavior — implement (components)

- [x] **`src/components/task-card.tsx` (new)**: extract the card rendering from today's `TaskRow` (in `task-dashboard.tsx`) — title, description preview or "No description added", priority badge, due date or "No due date", completed styling when `status === "done"` with no separate status-badge text (FR2.1, FR2.2). Keep the existing immediate no-confirmation delete control (FR2.3). Add a drag handle (via the drag-and-drop library's draggable/sortable hook) with a visible focus ring and hover affordance (NFR3). Keep a keyboard-operable status-cycle control as a separate element from the drag handle, reusing the existing `nextStatus` fixed-cycle lookup table (todo -> in-progress -> done -> todo) unchanged (FR5.1, FR5.2). Add a `data-testid` on the card root, the drag handle, the cycle control, and the delete button. Clicking the card outside those three controls calls a new `onEditTask(task)` prop.
- [x] **`src/components/kanban-column.tsx` (new)**: props `status`, `label`, `count` (the column's TOTAL per-status count, unfiltered — FR1.2, reusing the existing `counts.todo`/`counts.active`/`counts.done` computation, NOT the filtered list's length), `tasks` (already filtered + ordered, for rendering only), `onEditTask`. Renders the header (`label` + `count`, always visible even when `tasks` is empty), a vertically scrollable list of `TaskCard` that scrolls within the column while the header and other columns stay visible (FR9.1), wrapped in the library's drop-target/sortable-container primitive, or an empty-state message when `tasks.length === 0`. Add a `data-testid` on the column root and the count element.
- [x] **`src/components/kanban-board.tsx` (new)**: props `tasks` (full, unfiltered), `searchQuery`, `onEditTask`. Derive (via `useMemo`) each fixed status's TOTAL count (reusing the existing `counts` computation, unaffected by search) and each status's FILTERED, ordered task list (same case-insensitive title/description match as today's search, applied independently per status — FR6.1). Own the drag-and-drop session (the library's context + pointer and keyboard sensors, both activated from each `TaskCard`'s drag handle). On a completed drop: if the target column differs from the source, call `moveTask(id, newStatus)`; if it is the same column at a new index, call `reorderTask(id, newIndex)`, computed against that column's full unfiltered list using the drop target's nearest VISIBLE neighbors when the column is search-filtered (ADR-005); if the drop is on the origin position, or outside any valid column/card target, or cancelled (Escape), call neither (FR3.2, FR3.3, NFR5). Structure the move-vs-reorder-vs-no-op decision and the new-index computation as one pure function separate from the drag library's event wiring, so it is unit-testable without simulating real pointer/keyboard drag gestures. Render the 3 fixed `KanbanColumn`s in fixed order (To do, In progress, Done), each receiving its own `count`, filtered `tasks`, `label`, and `onEditTask`. Responsive: the 3 columns sit in a horizontally scrollable row at the app's existing mobile/tablet breakpoints (FR9.2).
- [x] **`src/components/task-dashboard.tsx` (modify in place — NOT a new file)**: remove `filter` state, the filter-tabs markup, and the old `task-list`/`TaskRow` rendering (FR6.2). Add `editingTask: Task | null` state. Render `KanbanBoard` in place of the removed task list, passing `tasks`, `query` (search), and an `onEditTask` that sets `editingTask` and opens the modal. Extend the existing create-task modal to also serve as the edit modal: when `editingTask` is set, prefill the form fields from it (FR7.2) and call `updateTask(editingTask.id, {...})` on submit instead of `addTask(...)`; the form has no status field, so this can never change a task's column (FR7.3). Reset `editingTask` to `null` and close the modal the same way the create flow already does. Keep the 4 stat cards, the search box, and the "New task" button exactly as they are (FR7.1, FR8.1) — only their data source/layout neighbor changes, not their own behavior.

Traces to: FR1.1, FR1.2, FR2.1, FR2.2, FR2.3, FR3.1, FR3.2, FR3.3, FR4.1, FR4.2, FR5.1, FR5.2, FR6.1, FR6.2, FR7.1, FR7.2, FR7.3, FR8.1, FR9.1, FR9.2, NFR3, NFR5.

### Step 6: Frontend behavior — tests

- [x] **`task-card.test.tsx` (new, ~5 tests)**: renders title/description/priority/due date; shows "No description added" and "No due date" fallbacks; applies completed styling and no status-badge text when done; delete button calls `onDelete`/`deleteTask`; the keyboard cycle control advances through the fixed cycle; clicking the card (outside its controls) calls `onEditTask`.
- [x] **`kanban-column.test.tsx` (new, ~4 tests)**: renders the label and the unfiltered `count` even when `tasks` is empty; renders one `TaskCard` per item in `tasks`; renders the empty-state message when `tasks` is empty; does not change `count` based on `tasks.length`.
- [x] **`kanban-board.test.tsx` (new, ~6-7 tests, covers the key KanbanBoard<->useTasks boundary)**: groups tasks into the 3 fixed status groups preserving relative array order; filters each group independently by search query (case-insensitive, title + description); a column with zero search matches still gets its real unfiltered count; the pure drag-result function (Step 5) resolves a cross-column drop to a `moveTask` call; resolves a same-column reorder drop to a `reorderTask` call with the correct index, including the filtered-column case (ADR-005, nearest visible neighbors); resolves a drop-on-origin or an invalid/cancelled drop to no call at all.
- [x] **`task-dashboard.test.tsx` (modify in place, ~6-7 tests — replaces the removed status-filter-tab tests, keeps/adapts the rest)**: creating a task still works and the new task appears in the To do column (FR7.1); deleting a task still works; searching still filters visible cards; clicking a card opens the edit modal prefilled with its fields (new — FR7.2); submitting the edit modal updates the task via `updateTask` and never changes its status (FR7.3); the 4 stat cards still render the existing unfiltered counts (FR8.1); the old status-filter-tab UI is confirmed absent (FR6.2). The existing tests that exercised the removed filter tabs are removed, since that UI no longer exists; every other existing behavior (create, delete, search, stat cards) keeps a green test, adapted to the new board markup where the old assertions queried `task-list`/`TaskRow`-specific structure.

Traces to: FR1.1, FR1.2, FR2.1, FR2.2, FR2.3, FR3.1, FR3.2, FR3.3, FR4.1, FR4.2, FR5.1, FR5.2, FR6.1, FR6.2, FR7.1, FR7.2, FR7.3, FR8.1, NFR3, NFR5.

### Step 7: Environment / build configuration

- [x] No new build/CI configuration is needed: `eslint.config.mjs`, `tsconfig.json`, and the Jest config already cover every new/changed path under `src/components/` and `src/hooks/`. Run `pnpm lint` and `pnpm typecheck` after Steps 3-6 to confirm the new files are clean under the existing configuration (no config changes).

### Step 8: Documentation and traceability

- [x] Handled by this stage's own required outputs, not an application-code step: `code-summary.md` (Step 5 of the Code Generation stage) and `traceability.json` (Step 5 of the Code Generation stage, generated via `aidlc engine sensor-traceability`). No comments are added to any generated or edited code file (project standing rule).

## Test Scope Note (Standard strategy)

5-8 tests per component (4 new/changed components: `useTasks` additions, `TaskCard`, `KanbanColumn`, `KanbanBoard`) plus the adapted `task-dashboard.test.tsx` integration coverage at the `TaskDashboard` <-> `KanbanBoard`/`useTasks` boundary — consistent with "Unit tests plus integration tests for key boundaries" (Standard strategy obligation). No E2E, performance, or security test types are added: no NFR in `requirements.md` calls for them.

## Testing Contract

```json
{
  "version": 1,
  "methodology": "test-after",
  "source": "team",
  "ordering": "implement each applicable testable layer (storage, hook, component), then write and run that layer's tests once the piece works, matching how the existing application was built.",
  "scope": "feature",
  "test_strategy": "standard",
  "project_type": "brownfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop`, `classic` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    },
    {
      "layer": "team",
      "text": "- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer (storage, hook,\n  component), then write and run that layer's tests once the piece works,\n  matching how the existing application was built.\n- **Coverage**: no strict coverage target — new and existing tests must\n  stay green, but there is no 80% line-coverage floor for this project.\n  This is intentionally lighter than the org-level default for `mvp`/\n  `enterprise`/`feature`/`infra` scopes, affirmed given the project's\n  prototype/demo framing (Q4).\n- Any new tests introduced through AI-DLC work must exercise the\n  localStorage-backed persistence path (`src/lib/task-storage.ts`,\n  `src/hooks/use-tasks.ts`, key `\"taskflow.tasks.v1\"`) rather than assume a\n  database or API layer exists — none does today."
    }
  ],
  "obligations": {
    "strategy": "standard",
    "strategy_volume": [
      "Five to eight tests per component.",
      "Unit tests plus integration tests for key boundaries.",
      "Add E2E, performance, or security tests when requirements demand them."
    ],
    "scope_floor": [
      "Meet an 80% line-coverage floor.",
      "Run the selected tests in CI before merge."
    ],
    "combination_rule": "Apply every selected-strategy obligation and every scope-floor obligation; neither replaces the other, and a targeted scope regression may add the narrowest necessary test type beyond the strategy default."
  },
  "plan_profile": {
    "methodology": "test-after",
    "runner_step": "Verify the existing test runner/configuration and record the exact unit-scoped command.",
    "runner_ready_before_first_test": true,
    "testable_layers": [
      "Data model / database behavior",
      "Repository / data access",
      "Business logic",
      "API / endpoint",
      "Frontend behavior"
    ],
    "steps": [
      "Project structure and production configuration skeleton.",
      "Verify the existing test runner/configuration and record the exact unit-scoped command.",
      "Data model / database behavior - implement.",
      "Data model / database behavior - write and run its tests after implementation.",
      "Repository / data access - implement.",
      "Repository / data access - write and run its tests after implementation.",
      "Business logic - implement.",
      "Business logic - write and run its tests after implementation.",
      "API / endpoint - implement.",
      "API / endpoint - write and run its tests after implementation.",
      "Frontend behavior - implement.",
      "Frontend behavior - write and run its tests after implementation.",
      "Environment/build configuration.",
      "Documentation and traceability."
    ]
  },
  "input_sha256": "sha256:2c05026e1451d021651a7827cdd841eca5ccaaf2bf96cf2020c9d928dad902b9",
  "contract_sha256": "sha256:0d7d2d54455a84123b40951b2ffc40f570a306f1c08f19f851cf738d28e8fafa"
}
```
