# Units of Work

| Unit ID | Directory |
|---|---|
| U1 | `u1-git-repository` |
| U2 | `u2-test-infrastructure` |
| U3 | `u3-code-formatting` |
| U4 | `u4-ci-pipeline` |

## U1 — Git Repository Setup

- **Directory**: `u1-git-repository`
- **Description**: Initializes git for the project with a `.gitignore` covering build/dependency artifacts, environment files, OS/editor artifacts, and the AI-DLC workspace's own per-user/per-clone runtime files, then makes an initial commit of the project exactly as it stands today.
- **Boundaries**: owns `.git/` initialization and `.gitignore` only. Does not touch any application source file.
- **Requirements covered**: FR1 (FR1.1, FR1.2)
- **Responsibilities**: a working local git repository with one clean initial commit that is a safe rollback point before any tooling changes land.
- **Deployment model**: none — local repository state only.
- **Relative complexity**: S
- **Unit kind**: `packaging`
- **Implementation notes / constraints**: must not stage or commit anything the `.gitignore` excludes; must not alter any existing application file's content. No GitHub remote is created (Assumption A1 in `requirements.md` — that is the person's own step).

## U2 — Test Infrastructure & Baseline Coverage

- **Directory**: `u2-test-infrastructure`
- **Description**: Adds Jest and React Testing Library as dev dependencies, a CI-friendly `test` script, and the baseline test suite covering the existing app's storage, hook, and dashboard behavior.
- **Boundaries**: owns new test files and Jest configuration only. Does not modify any existing application source file's behavior (test-only additions).
- **Requirements covered**: FR2 (FR2.1, FR2.2), FR3 (FR3.1, FR3.2, FR3.3)
- **Responsibilities**: a runnable, passing test suite exercising `task-storage.ts`, `use-tasks.ts`, and `TaskDashboard`, including the localStorage persistence path and the dashboard stat counts.
- **Deployment model**: none — development/CI-time tooling only.
- **Relative complexity**: M
- **Unit kind**: `library`
- **Implementation notes / constraints**: tests must exercise the real `localStorage`-backed persistence path (team practice, Testing Posture), not a mocked substitute, consistent with test-after methodology (write/run each layer's tests once that layer's test file is in place).

## U3 — Code Formatting

- **Directory**: `u3-code-formatting`
- **Description**: Adds a Prettier configuration matching the project's existing observed formatting conventions, plus `format`/`format:check` scripts.
- **Boundaries**: owns the Prettier config file and `package.json` script entries only. Running the formatter against existing files, if done, must not change their observable behavior (formatting only).
- **Requirements covered**: FR5 (FR5.1, FR5.2)
- **Responsibilities**: a Prettier configuration developers can run locally; not wired into CI as a required gate (per FR5.2 / the affirmed CI scope).
- **Deployment model**: none — local/dev-time tooling only.
- **Relative complexity**: S
- **Unit kind**: `packaging`
- **Implementation notes / constraints**: config must match observed conventions (2-space indent, double quotes, trailing commas) so a first format run produces a minimal diff.

## U4 — CI Pipeline

- **Directory**: `u4-ci-pipeline`
- **Description**: Adds a GitHub Actions workflow running lint, typecheck, and test on push/PR to `main`.
- **Boundaries**: owns `.github/workflows/ci.yml` only.
- **Requirements covered**: FR4 (FR4.1, FR4.2, FR4.3)
- **Responsibilities**: a CI workflow definition that, once pushed to a GitHub-hosted remote (outside this intent's reach per Assumption A1), runs `pnpm lint`, `pnpm typecheck`, and `pnpm test` and fails the run on any failure.
- **Deployment model**: none — CI configuration only, no hosting/deploy target (affirmed Deployment practice).
- **Relative complexity**: S
- **Unit kind**: `packaging`
- **Implementation notes / constraints**: the `pnpm test` step in the workflow only makes sense once U2's `test` script exists — see `unit-of-work-dependency.md`.
