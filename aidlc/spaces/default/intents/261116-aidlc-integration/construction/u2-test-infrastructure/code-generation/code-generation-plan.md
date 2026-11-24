## Summary

- Builds: a Jest + React Testing Library test suite covering `task-storage.ts`, `use-tasks.ts`, and `TaskDashboard`, wired up via a new `test` script
- Touches: `package.json` (new devDependencies + `test` script), new `jest.config.ts` + `jest.setup.ts`, three new colocated test files under `src/lib/`, `src/hooks/`, `src/components/`
- Tests: 15 new tests across 3 components (storage: 5, hook: 5, dashboard: 5) — Standard strategy, exercising the real `localStorage`-backed path, no mocks

## Code Generation Plan — u2-test-infrastructure

This unit's **Boundaries** (`unit-of-work.md`) are new test files and Jest configuration only — it does not modify any existing application source file's behavior. Every step below is additive; no existing `.ts`/`.tsx` file's logic changes.

- [x] **Step 1**: Project structure and production configuration skeleton — add `jest`, `jest-environment-jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, and `@types/jest` to `package.json` under `devDependencies` only (`FR2.1`, `NFR5.1`/`tech-stack-decisions.md`). Create `jest.config.ts` using `next/jest` (resolves the `@/*` alias and SWC transform automatically from `tsconfig.json`) with `testEnvironment: "jsdom"` as the default, and `jest.setup.ts` importing `@testing-library/jest-dom` for the DOM matchers (`nfr-design/security-design.md`).
- [x] **Step 2**: Verify the test runner — add the `test` script (`"test": "jest"`, non-interactive, no watch mode per `FR2.2`) to `package.json` and confirm `pnpm test` runs cleanly with zero test files (passes trivially / "no tests found" is acceptable at this checkpoint). Record this exact command in `unit-test-instructions.md` before writing the first test (`plan_profile.runner_ready_before_first_test`).
- [x] **Step 3**: Repository / data access — write and run tests for `src/lib/task-storage.ts` at `src/lib/task-storage.test.ts` (`FR3.1`): a normal write-then-read round trip; reading when storage is empty returns `[]`; reading malformed/non-array JSON returns `[]` without throwing; `readTasks` makes no `window`/`localStorage` access when `window` is `undefined` (`/** @jest-environment node */` override, `NFR5.2`); `writeTasks` makes no `window`/`localStorage` access when `window` is `undefined` (same override). 5 tests.
- [x] **Step 4**: Business logic — write and run tests for `src/hooks/use-tasks.ts` at `src/hooks/use-tasks.test.ts` (`FR3.2`): seeds `starterTasks` into storage when storage is empty on first mount; loads already-stored tasks when storage is populated on mount; `addTask` updates state and writes to storage once `isReady` is `true`; `setStatus` updates state and writes to storage once `isReady` is `true`; `deleteTask` updates state and writes to storage once `isReady` is `true`. Uses `jsdom`'s real `localStorage` (not mocked), per the team's testing-posture rule and `NFR5.2`'s "no network/secrets" design — this also satisfies the Standard strategy's integration-test obligation for the hook↔storage boundary, since no mock substitutes the real read/write path. 5 tests.
- [x] **Step 5**: Frontend behavior — write and run tests for `TaskDashboard` at `src/components/task-dashboard.test.tsx` (`FR3.3`): creating a task via the "New task" form updates the list and the four stat cards (total, to-do, in-progress, completed); cycling a task's status via its status control updates the task and the stat cards; deleting a task updates the list and the stat cards; filtering the list by the search box; filtering the list by a status tab. Renders through the real `useTasks` hook and real `jsdom` `localStorage` (no mocked substitute), which also exercises the dashboard↔hook↔storage integration path end to end. 5 tests.
- [x] **Step 6**: Environment/build configuration — confirm `pnpm lint` and `pnpm typecheck` still pass with the new test files and `jest.config.ts`/`jest.setup.ts` in place (no existing-file behavior changed, so neither command's baseline should regress).
- [x] **Step 7**: Documentation and traceability — write `code-summary.md`, `source-manifest.json`, and `traceability.json`.

## Testable Layers Not Applicable

- **Data model / database behavior**: not applicable — this unit introduces no new data model; the existing `Task` type (`src/types/`) is untouched, and there is no database.
- **API / endpoint**: not applicable — the project has no API layer (`technology-stack.md` `## Explicitly Absent`), and this unit does not add one.

## Testing Contract

```json
{
  "version": 1,
  "methodology": "test-after",
  "source": "team",
  "ordering": "implement each applicable testable layer (storage, hook, component), then write and run that layer's tests once the piece works, matching how the existing application was built.",
  "scope": "classic",
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
      "Keep the existing test suite green.",
      "This scope adds no extra new-test floor beyond the selected test strategy."
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
  "input_sha256": "sha256:8ac37bc7604a2341d1cab1a53caaefe1799b505bc853976090e1549e5401114d",
  "contract_sha256": "sha256:ba32d3424928e784d2a54623391886bec683e6e46d577b0228a57c524e16b3ad"
}
```
