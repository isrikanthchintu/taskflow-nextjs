# Code Summary — u4-ci-pipeline

## Files created

- `.github/workflows/ci.yml` (new): the unit's sole deliverable. `on:` triggers
  only `push`/`pull_request` to `main` (`FR4.1`; never `pull_request_target`,
  `NFR5.3`); top-level `permissions: contents: read` (`NFR5.3`); one job
  (`ci`) on `runs-on: ubuntu-latest`; steps in order:
  `actions/checkout@v4`, `pnpm/action-setup@v4`,
  `actions/setup-node@v4` (`node-version: "lts/*"`, `cache: "pnpm"`), then
  `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`,
  `pnpm test` (`FR4.2`, `FR4.3`). No `--quiet`/output-suppressing flag on any
  gate command (`NFR4`). No comments of any kind in the file, per the
  project's standing no-comments rule.

## Key implementation decisions

- **`node-version: "lts/*"`** satisfies `FR4.3` ("current Node.js LTS
  version") by always resolving to whatever LTS release is current at
  workflow-run time, per `cicd-pipeline.md`/Assumption A2, rather than
  pinning a specific numeric version that would drift stale.
- **`cache: "pnpm"` on `actions/setup-node@v4`** is a build-pipeline
  performance addition (not a security requirement); it requires
  `pnpm/action-setup@v4` to run first in the step order, which it does.
- **Action pinning (`NFR5.2`)**: every `uses:` line carries an explicit
  major-version tag (`@v4`) — `actions/checkout@v4`, `pnpm/action-setup@v4`,
  `actions/setup-node@v4` — matching `security-design.md`'s accepted
  standard-pinning level (not a commit-SHA pin, which that design explicitly
  rejected as disproportionate for this no-secrets, `contents: read`-only
  workflow).
- **No `secrets.*` reference anywhere (`NFR5.1`)**: none of the four gate
  commands need one; confirmed by direct text search of the written file
  (see validation below), matching `security-design.md`'s design.
- **`NFR2` (no new production dependency)** is satisfied trivially by this
  unit: `ci.yml` adds no dependency of any kind (production or dev) — it
  only invokes `pnpm install` against the existing lockfile and runs
  existing `package.json` scripts.
- **`NFR4` (clear CI failure reporting)**: each gate command runs with its
  tool's default, unsuppressed output (ESLint, `tsc`, Jest all print
  file/line/reason on failure by default) — no `--quiet` or similar flag was
  added to any of the three gate commands, per `monitoring-design.md`.

## YAML validation (Step 2)

Parsed `.github/workflows/ci.yml` with `js-yaml`'s `load()` (resolved from
the existing `node_modules/.pnpm` dependency tree — no new dependency was
added to `package.json` or `pnpm-lock.yaml` to do this). The file parsed
without error into the expected nested structure (`on`, `permissions`,
`jobs.ci.steps`). A programmatic scan of the three `uses:` lines confirmed
each ends in an explicit `@v<N>` major-version tag, and a text search of the
whole file confirmed zero occurrences of `secrets.`.

## Four-command dry-run (Step 3)

**First run** of the exact chained command from `unit-test-instructions.md`,
in the same order the workflow runs it:

```bash
pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test
```

- `pnpm install --frozen-lockfile` → exit 0 ("Already up to date").
- `pnpm lint` (`eslint .`) → **exit 1.** All 57 errors and 55 warnings were
  in files outside this unit's boundary and outside the application source
  this intent is scoped to: the `.claude/` AI-DLC framework tooling (the
  large majority), `next-env.d.ts`, `eslint.config.mjs`, and one
  pre-existing warning in `src/hooks/use-tasks.ts`. This matched `u2`'s own
  documented finding of the identical pre-existing condition. This is the
  same condition that had already led to the Construction Verification
  Command being rescoped from `pnpm lint && pnpm typecheck` to
  `npx eslint src/ && pnpm typecheck` earlier in this intent — but the
  underlying `package.json` `lint` script itself had never been corrected to
  match, so the new CI workflow (which must call `pnpm lint` by name, per
  `FR4.2`) would have inherited the same always-fails condition.
- `pnpm typecheck` (`tsc --noEmit`) → exit 0, no output.
- `pnpm test` (`jest`) → exit 0, 3 suites / 15 tests passed.

**Presented this to the person** (the lint-scope mismatch is a real,
previously-identified condition this unit's `.github/workflows/ci.yml`
boundary alone could not fix): directed to scope `package.json`'s `lint`
script itself to `eslint src/` to match the already-approved Construction
Verification Command's scoping, since `FR4.2`'s own point — a working merge
gate — would otherwise never pass regardless of what a PR actually changes.

**`package.json` change** (made with the person's direction, under Guard
Policy `off`): `"lint": "eslint ."` → `"lint": "eslint src/"`. This is a
pre-existing script this unit's own boundary does not normally authorize
changing, but the work could not be built without it — `FR4.2` requires a
gate that actually evaluates PR changes, not one that always fails on
unrelated framework files.

**Re-run after the fix**, same chained command:
```bash
pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test
```
- `pnpm install --frozen-lockfile` → exit 0.
- `pnpm lint` (`eslint src/`) → exit 0 (one pre-existing warning only:
  `'TaskPriority' is defined but never used` in `src/hooks/use-tasks.ts`,
  the same one `u2-test-infrastructure` already documented and did not
  introduce).
- `pnpm typecheck` → exit 0.
- `pnpm test` → exit 0, 3 suites / 15 tests passed.

All four commands now exit 0 in sequence, meaning `.github/workflows/ci.yml`
will actually pass once pushed to GitHub (for the code as it stands today).

## Issues / concerns

None remaining. The lint-scope issue above was found, presented to the
person, and resolved within this stage before completion.

## Deviations from the plan

- `package.json`'s `lint` script was changed from `"eslint ."` to
  `"eslint src/"`, which is outside this unit's named boundary
  (`.github/workflows/ci.yml` only). Made with the person's explicit
  direction after the first dry-run surfaced that the workflow would
  otherwise always fail regardless of the PR under test; recorded here
  rather than silently expanding scope.
