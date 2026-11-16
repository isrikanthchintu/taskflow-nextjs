# Bolt Plan

A Bolt is one build pass over a piece of the work, ending in something that runs. This intent is split into 2 Bolts, bundling the four units `unit-of-work.md` defines (U1-U4) according to the single dependency edge `unit-of-work-dependency.md` records.

## Bolt 1 — Foundation

- **Units**: U1 (`u1-git-repository`), U2 (`u2-test-infrastructure`), U3 (`u3-code-formatting`)
- **Walking skeleton**: No. The existing TaskFlow app is already treated as the proven end-to-end slice (affirmed team practice, `## Walking Skeleton` in `aidlc/spaces/default/memory/team.md`) — none of this Bolt's units change runtime behavior, so no separate skeleton checkpoint applies.
- **Definition of Done**:
  - A local git repository exists with a `.gitignore` covering build/dependency artifacts, environment files, OS/editor artifacts, and AI-DLC's own per-user/per-clone runtime files, and one clean initial commit of the project as it stood before this intent began.
  - Jest and React Testing Library are installed and configured; `pnpm test` runs the full suite non-interactively and exits non-zero on failure.
  - The baseline test suite (storage, hook, dashboard component, including the stat-card counts) passes against the unmodified application.
  - Prettier is configured to match the project's existing formatting conventions; `format` and `format:check` scripts exist.
- **Confidence hypothesis**: The existing app's behavior is fully captured by an automated regression suite that passes locally with zero application code changes — this proves the test suite is trustworthy before anything else builds on top of it.
- **Expected demo**: Run `pnpm test` and show every test passing; show `git log` with the one clean initial commit; run `pnpm format:check` and show it passes against the newly-formatted baseline.

## Bolt 2 — CI Pipeline

- **Units**: U4 (`u4-ci-pipeline`)
- **Walking skeleton**: No (same rationale as Bolt 1).
- **Definition of Done**: `.github/workflows/ci.yml` exists, triggers on push/PR to `main`, installs dependencies with pnpm, and runs `pnpm lint`, `pnpm typecheck`, and `pnpm test` as steps that fail the run on any failure, on a current Node.js LTS version.
- **Confidence hypothesis**: A CI definition exists that is correctly wired to the project's real scripts (`lint`, `typecheck`, `test` — the last added by Bolt 1) and would, once pushed to a GitHub-hosted remote, enforce them on every change. Pushing to a remote and observing a real CI run is outside this intent's reach (Assumption A1 in `requirements.md` — creating a GitHub remote is the person's own step), so this Bolt's confidence hypothesis is about the workflow's correctness, not an observed CI run.
- **Expected demo**: Show the workflow file content and confirm each referenced script (`pnpm lint`, `pnpm typecheck`, `pnpm test`) exists and runs successfully when invoked locally exactly as the workflow invokes it.

## Dependency Note

Bolt 2 depends on Bolt 1 completing U2 specifically (not all of Bolt 1) — see `risk-and-sequencing-rationale.md` for why both units are still bundled with U1/U3 rather than split further.
