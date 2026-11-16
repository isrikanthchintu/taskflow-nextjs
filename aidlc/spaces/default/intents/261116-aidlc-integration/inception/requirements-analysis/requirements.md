# Requirements — AI-DLC Integration for TaskFlow Next.js

## Intent Analysis

The initial request asked to "integrate AWS AI-DLC" into this existing TaskFlow Next.js application while preserving the existing application code and localStorage functionality, and to propose a plan for approval before any changes. The AI-DLC process scaffolding was already present in the repository when this workflow began. Through the Requirements Analysis interview, the person clarified that AI-DLC's own process setup is not itself a software requirement — what this piece of work must actually produce is development tooling the team now needs, resolved to:

1. A git repository for this project (none exists today).
2. A baseline automated test suite covering the existing application's behavior, so future changes have a regression safety net.
3. A CI pipeline (GitHub Actions) that runs lint, typecheck, and test on every change.
4. Code formatting (Prettier) matching the project's existing conventions.

No change to TaskFlow's existing features, UI, or behavior is in scope. The existing localStorage-based persistence (`src/lib/task-storage.ts` + `src/hooks/use-tasks.ts`, storage key `taskflow.tasks.v1`) must continue to work exactly as it does today — this is the central preservation constraint named in the original request and reaffirmed in Practices Discovery (`## Mandated`/`## Forbidden`, `aidlc/spaces/default/memory/project.md`).

## Functional Requirements

### FR1. Git repository initialization

- **FR1.1**: Initialize a git repository at the project root with a `.gitignore` covering `node_modules/`, `.next/`, build outputs, environment files, and OS/editor artifacts, plus the AI-DLC workspace's own per-user and per-clone runtime files named under "Git Integration" in `.claude/CLAUDE.md` (`aidlc/active-space`, `aidlc/spaces/*/intents/active-intent`, `aidlc/.aidlc-clone-id`, `aidlc/.aidlc-sessions/`, `**/aidlc/spaces/*/intents/**/.aidlc-engine/`, `aidlc/spaces/*/intents/*/runtime-graph.json`, `aidlc/spaces/*/intents/*/.aidlc-*`), so the first commit does not sweep in per-clone AI-DLC state alongside the application code.
- **FR1.2**: Make an initial commit capturing the existing application exactly as it stands today, before any tooling changes are added, so there is a clean rollback point.

### FR2. Test framework setup

- **FR2.1**: Add Jest and React Testing Library as development dependencies, configured for this project's stack (Next.js App Router, TypeScript, path alias `@/*`).
- **FR2.2**: Add a `test` script to `package.json` that runs the full suite once and exits non-interactively (CI-compatible — no watch mode).

### FR3. Baseline automated test coverage for existing behavior

- **FR3.1**: Unit tests for `src/lib/task-storage.ts` covering: a normal read/write round trip; reading when storage is empty (returns `[]`); reading malformed/non-array JSON (returns `[]`, does not throw); and the SSR guard (`readTasks`/`writeTasks` do not touch `window`/`localStorage` when `window` is undefined).
- **FR3.2**: Unit tests for `src/hooks/use-tasks.ts` covering: seeding `starterTasks` when storage is empty on first mount; loading stored tasks when storage is populated; and that `addTask`, `setStatus`, and `deleteTask` each update state and trigger a write to storage once `isReady` is true.
- **FR3.3**: Component tests for `TaskDashboard` covering: creating a task via the "New task" form; cycling a task's status by clicking its status control; deleting a task; filtering the list by the search box; filtering the list by status tab; and that the four dashboard stat cards (total, to-do, in-progress, completed) update correctly after a create, status-change, and delete — confirming each behaves exactly as documented in `aidlc/spaces/default/codekb/taskflow-nextjs/business-overview.md`.

### FR4. CI pipeline

- **FR4.1**: Add a GitHub Actions workflow (`.github/workflows/ci.yml`) that triggers on `push` and `pull_request` targeting `main`.
- **FR4.2**: The workflow installs dependencies with pnpm, then runs `pnpm lint`, `pnpm typecheck`, and `pnpm test`, failing the workflow run if any step fails.
- **FR4.3**: The workflow runs on a current Node.js LTS version.

### FR5. Code formatting

- **FR5.1**: Add a Prettier configuration matching the project's existing observed conventions (2-space indentation, double-quoted strings, trailing commas in multi-line structures).
- **FR5.2**: Add a `format` script (and a `format:check` script) to `package.json`. The format check is a local/dev-time tool; it is not added as a required CI gate, since the affirmed CI scope (FR4.2) names only lint, typecheck, and test.

## Non-Functional Requirements

- **NFR1**: Zero behavior change. Every existing user-facing behavior (task creation, status cycling, deletion, dashboard stat counts, search, status filtering, responsive layout, and localStorage persistence under key `taskflow.tasks.v1`) must remain identical after this work, verified by FR3's test suite passing (including the stat-card assertion in FR3.3) and a manual smoke check of the running app.
- **NFR2**: No new production dependency. Jest, React Testing Library, and Prettier are development dependencies only; nothing in FR1–FR5 adds a runtime dependency, a backend, a database, or a network call to the shipped application (ties to the Forbidden rules already affirmed in `aidlc/spaces/default/memory/project.md`).
- **NFR3**: Test suite performance. The full test suite (FR3) gives fast feedback in CI; this intent imposes no fixed timeout, since no specific duration target was confirmed with the person (see Assumption A5).
- **NFR4**: Clear CI failure reporting. When any CI step (lint, typecheck, test) fails, the workflow run output names the failing step and the specific file/line or test name, so a failure is diagnosable from the GitHub Actions log alone.

## Constraints

- No existing application source file's behavior may be altered — only test files, configuration, and tooling files may be added or changed (FR1–FR5 are strictly additive).
- No database, backend API, or server-side persistence layer may be introduced (affirmed Forbidden rule, `aidlc/spaces/default/memory/project.md`).
- The project's existing package manager, pnpm, must be used for all new tooling (matches `pnpm-lock.yaml` already in the repo).
- TypeScript `strict: true` and the existing ESLint configuration (`eslint.config.mjs`) remain unchanged and continue to pass.
- No git history exists yet; git must be initialized fresh as part of this work (FR1).

## Assumptions

- **A1**: GitHub Actions is the CI platform, per the person's answer — this assumes the project will eventually be hosted on GitHub. This work initializes git locally (FR1) and adds the workflow file (FR4) but does not create a remote GitHub repository or push to one; that requires the person's own GitHub account/credentials and is outside this agent's reach. Owner: person, to be done when ready to host on GitHub.
- **A2**: CI runs on the current Node.js LTS version (not pinned to an exact version by the person); if a specific version is later required, the workflow file is a one-line change.
- **A3**: No coverage threshold is enforced in CI, matching the affirmed testing posture ("no strict target — tests just need to stay green").
- **A4**: The existing `starterTasks` hard-coded seed array is treated as intended production behavior (first-run demo data), not a test fixture to remove or change.
- **A5**: No specific CI test-suite duration target was raised or confirmed in this stage's interview; NFR3 is left qualitative rather than carrying an invented number. If the person wants a hard timeout later, it is a one-line addition to the CI workflow.

## Out of Scope

- Any new TaskFlow feature or UI change, including finishing the existing inactive `updateTask`/edit-task flow, wiring the sort button, or wiring the sidebar nav links — explicitly deferred by the person.
- Any hosting or deployment pipeline/target — explicitly out of scope per the affirmed Deployment practice (CI only, no deploy).
- Any backend, database, or API layer — forbidden per affirmed practices.
- Multi-user support or authentication — outside the documented product boundary (`business-overview.md`).
- Visual or design changes to the existing UI.

## Open Questions

None remaining — every ambiguity raised in this stage's interview was resolved (see `requirements-analysis-questions.md`).
