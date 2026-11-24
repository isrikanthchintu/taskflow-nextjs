## Summary

- Builds: a GitHub Actions CI workflow running lint, typecheck, and test on every push/PR to `main`
- Touches: new `.github/workflows/ci.yml` only
- Tests: none (no testable application layer — see "Why no test files" below); the workflow's own YAML is validated and its underlying commands dry-run locally instead

## Code Generation Plan — u4-ci-pipeline

This unit's **Boundaries** (`unit-of-work.md`) are `.github/workflows/ci.yml`
only. It does not modify any application source file.

- [x] **Step 1**: Create `.github/workflows/ci.yml`:
  - `on:` triggers `push` and `pull_request` to `main` only (`FR4.1`; never `pull_request_target`, `nfr-design/security-design.md` `NFR5.3`)
  - top-level `permissions: contents: read` (`NFR5.3`)
  - one job (`ci`) on `runs-on: ubuntu-latest` (`infrastructure-specification.md`)
  - steps, in order (`cicd-pipeline.md`'s Build Stages table): `actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v4` with `node-version: "lts/*"` (`FR4.3`, Assumption A2) and pnpm caching enabled via `cache: "pnpm"`, `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (`FR4.2`, Contract 1)
  - no `--quiet`/output-suppressing flag on any of the three gate commands (`monitoring-design.md`'s `NFR4` design)
- [x] **Step 2**: Validate the workflow YAML is well-formed (parse it, don't just eyeball it) and confirm every `uses:` action is pinned to an explicit major version (`NFR5.2`) and no step references `secrets.*` (`NFR5.1`).
- [x] **Step 3**: Run the scoped verification in `unit-test-instructions.md` — dry-run each of the workflow's four gate commands locally, in the same order the workflow runs them, and confirm each exits 0. First run: `pnpm lint` exited 1 on pre-existing AI-DLC framework findings outside this unit's boundary. Per the person's direction, corrected `package.json`'s `lint` script from `eslint .` to `eslint src/` (matching the already-approved Construction Verification Command's scoping) so the CI workflow is an actually-working merge gate; re-ran and all four commands exit 0 (see `code-summary.md`).
- [x] **Step 4**: Documentation and traceability — confirm `code-summary.md` and `traceability.json` are written.

## Why no test files

The Testing Contract's `testable_layers` (data model, repository/data
access, business logic, API/endpoint, frontend behavior) list the kinds of
code this project writes tests for. This unit adds no application source,
only a CI workflow configuration file — there is no application layer for
Jest/RTL to test. In place of application tests, Step 2 validates the YAML
itself and Step 3 runs a scoped verification confirming the exact commands
the workflow will run on GitHub's infrastructure all succeed locally.
Because GitHub Actions itself (the actual execution environment) cannot be
invoked from this local session, Step 3 cannot execute the workflow file
end-to-end on GitHub-hosted infrastructure — that will be validated the
first time this workflow runs there (Assumption A1: no GitHub remote exists
yet for this intent to push to).

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
