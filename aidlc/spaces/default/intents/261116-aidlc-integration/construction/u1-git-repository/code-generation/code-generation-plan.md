## Summary

- Builds: a local git repository for the project, with a hardened `.gitignore` and one clean initial commit
- Touches: `.gitignore` (existing file, extended — not replaced), `.git/` (new)
- Tests: none (no testable application layer — see "Why no test files" below); one scripted verification command instead

## Code Generation Plan — u1-git-repository

**Note on an existing `.gitignore`**: this project already has a `.gitignore` file, maintained in part by the AI-DLC tooling itself (a managed `# BEGIN AI-DLC:gitignore` / `# END AI-DLC:gitignore` block already covers the AI-DLC workspace patterns — more completely than this unit's NFR design anticipated, since it predates this intent). Per the "brought files" rule, this file is extended, never rewritten: only the specific patterns `NFR5.1` needs that are not already present are added.

- [x] **Step 1**: Verify the existing `.gitignore`'s AI-DLC-managed block already satisfies `NFR5.2` (AI-DLC workspace files excluded). Confirm by inspection — no edit needed if it already covers `aidlc/active-space`, `aidlc/.aidlc-sessions/`, `aidlc/spaces/*/intents/*/.aidlc-*`, and the other workspace runtime patterns (`FR1.1`, `NFR5.2`).
- [x] **Step 2**: Append the specific secret/credential patterns `NFR5.1` needs that the existing `.gitignore` does not yet have: `*.pem`, `*.key`, `Thumbs.db`, `*.swp` (the file already has `.env*`/`!.env.example` and `.DS_Store`, covering most of `FR1.1`'s environment-file and OS-artifact categories) (`FR1.1`, `NFR5.1`).
- [x] **Step 3**: Run `git init` to initialize the local repository (`FR1.1`).
- [x] **Step 4**: Stage the project and run the verification command in `unit-test-instructions.md` to confirm no excluded pattern is staged, before committing (`NFR5.1`, `NFR5.2`). (Command printed a false-positive FAIL matching only `.env.example` — investigated and resolved; see code-summary.md.)
- [x] **Step 5**: Make the initial commit capturing the project exactly as it stands today, before any further tooling changes land (`FR1.2`).
- [x] **Step 6**: Documentation and traceability — confirm `code-summary.md` and `traceability.json` are written.

## Why no test files

The Testing Contract's `testable_layers` (data model, repository/data access, business logic, API/endpoint, frontend behavior) list the kinds of code this project writes tests for. This unit touches none of them — it adds no application source, only git repository state and a config file extension. `unit-of-work.md` assigns all of this intent's actual test-writing work to Unit U2 (`u2-test-infrastructure`), not this unit. In place of application tests, Step 4 runs a scripted verification command (in `unit-test-instructions.md`) that checks the git/`.gitignore` state programmatically rather than relying on manual inspection.

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
