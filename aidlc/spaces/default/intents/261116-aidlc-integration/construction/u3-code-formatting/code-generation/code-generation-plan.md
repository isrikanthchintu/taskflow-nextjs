## Summary

- Builds: a Prettier configuration matching this project's existing observed conventions, plus `format`/`format:check` scripts
- Touches: `package.json` (new devDependency + 2 scripts), new `.prettierrc.json`, new `.prettierignore`
- Tests: none (no testable application layer — see "Why no test files" below); one scripted verification command instead

## Code Generation Plan — u3-code-formatting

This unit's **Boundaries** (`unit-of-work.md`) are the Prettier config file and `package.json` script entries only. Running the formatter against existing files, if done, must not change their observable behavior (formatting only) — this plan does not run a repo-wide reformat, since the config is calibrated to the project's already-observed conventions and a broad rewrite is not named by any requirement.

- [x] **Step 1**: Add `prettier` to `package.json` under `devDependencies` only (`FR5.1`, `NFR5.1`/`tech-stack-decisions.md`).
- [x] **Step 2**: Create `.prettierrc.json` with the three settings `nfr-design/security-design.md` names — `tabWidth: 2`, `singleQuote: false`, `trailingComma: "none"` — and no `plugins` entry (`FR5.1`, `NFR5.2`). `trailingComma` was corrected from the originally-planned `"all"` to `"none"` after Step 5's first run showed the codebase's real convention omits the comma after the last element; recorded as a correction in `nfr-design/security-design.md` under Guard Policy `off`.
- [x] **Step 3**: Create `.prettierignore` covering build/dependency artifacts and the AI-DLC workspace's own per-user/per-clone runtime files, mirroring the categories already excluded in `.gitignore` (`node_modules/`, `.next/`, the AI-DLC workspace patterns), so a format run never rewrites a generated or workspace-state file. Widened after Step 5's first run to also exclude the AI-DLC framework tree (`.claude/`, `aidlc/`, `.mcp.json` — never part of this project's own observed conventions) and tool-generated files (`pnpm-lock.yaml`, `next-env.d.ts`), per the person's direction at the Step 5 finding.
- [x] **Step 4**: Add `format` (`"prettier --write ."`) and `format:check` (`"prettier --check ."`) scripts to `package.json` (`FR5.2`). Neither is added to the CI workflow or any other required gate — `FR5.2` keeps the format check a local/dev-time tool only.
- [x] **Step 5**: Run the scoped verification command in `unit-test-instructions.md` (`pnpm format:check`). First run exited 1 (397 files) — investigated rather than ran `pnpm format`, per the person's direction fixed the `.prettierignore` scope and `trailingComma` value (see Steps 2-3), re-ran: exits 1 on 7 files (`src/app/globals.css`, `src/app/layout.tsx`, `src/components/task-dashboard.tsx`, `src/components/task-dashboard.test.tsx`, `src/hooks/use-tasks.ts`, `src/hooks/use-tasks.test.ts`, `src/lib/task-storage.test.ts`) — a `printWidth`-default line-wrap difference on 6 files and a hand-minified `globals.css` Prettier's CSS formatter would fully expand, both accepted as minor by the person's direction rather than fixed.
- [x] **Step 6**: Documentation and traceability — confirm `code-summary.md` and `traceability.json` are written.

## Why no test files

The Testing Contract's `testable_layers` (data model, repository/data access, business logic, API/endpoint, frontend behavior) list the kinds of code this project writes tests for. This unit touches none of them — it adds no application source, only a formatter configuration and `package.json` script entries. In place of application tests, Step 5 runs a scripted verification command (in `unit-test-instructions.md`) that checks the configuration against the real codebase programmatically.

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
