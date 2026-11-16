# Team-Level Rules

> This team's affirmed practices and corrections. Loaded after `org.md` as
> strict-additive guidance.
> Populated by the practices-discovery affirmation gate. Edit at the gate,
> not directly.

## Way of Working

- **Integration branch**: main
- Short-lived feature branches merged into `main` via pull request — a
  simple trunk-based flow. This repository had no `.git` history at the
  time of discovery, so this is a newly affirmed convention (Q1), not an
  observed one, and now applies to all work going forward.
- The single-package, single-route structure (`src/app`, `src/components`,
  `src/hooks`, `src/lib`, `src/types`) and the layered acyclic dependency
  graph (`types → lib → hooks → components → app`) remain the project's
  working code shape.

## Walking Skeleton

- This brownfield app already has a working, end-to-end integrated slice:
  a single route rendering `TaskDashboard`, backed by `useTasks()` and the
  `localStorage`-backed `task-storage.ts` module. Per the affirmed decision
  (Q2), AI-DLC treats this existing flow as the already-proven walking
  skeleton for this intent — build directly on it, with no separate
  skeleton checkpoint required.
- Preserving the existing localStorage-based flow (seed → read → render →
  mutate → write-on-change, key `taskflow.tasks.v1`) remains the baseline
  to verify against for any future change that would otherwise trigger a
  skeleton ceremony.

## Testing Posture

- **Methodology**: test-after
- **Ordering**: implement each applicable testable layer (storage, hook,
  component), then write and run that layer's tests once the piece works,
  matching how the existing application was built.
- **Coverage**: no strict coverage target — new and existing tests must
  stay green, but there is no 80% line-coverage floor for this project.
  This is intentionally lighter than the org-level default for `mvp`/
  `enterprise`/`feature`/`infra` scopes, affirmed given the project's
  prototype/demo framing (Q4).
- Any new tests introduced through AI-DLC work must exercise the
  localStorage-backed persistence path (`src/lib/task-storage.ts`,
  `src/hooks/use-tasks.ts`, key `"taskflow.tasks.v1"`) rather than assume a
  database or API layer exists — none does today.

## Guard Policy

<!-- Affirmed by the team. Mode: strict, relaxed, or off. Strict here holds for every intent, whatever one person asks in chat; relaxed or off here applies to every intent whose policy came from its scope, unless project.md or the person sets another; changing this line changes it. A section under the retired Change Control heading, written by an earlier release, is still read. -->

## Deployment

- **CI**: a basic CI pipeline covering lint, typecheck, and test checks is
  in scope for this intent (Q5). No hosting or deployment target is set up
  as part of this intent — this remains a local-development/CI-only
  integration for now.
- `package.json` confirms the available local commands: `pnpm dev` (local
  dev server), `pnpm build` (production build), `pnpm start` (run the
  production build), `pnpm lint`, `pnpm typecheck` — these back the new CI
  checks directly.
- The AI-DLC integration must continue to **preserve** the existing
  localStorage-only persistence model; it must not introduce a database,
  backend API, or server-side persistence layer as part of this intent's
  scope.

## Code Style

- **Formatter**: Prettier (or an equivalent formatter) is added and
  enforced going forward (Q6). Existing observed formatting conventions
  (2-space indentation, double-quoted strings, trailing commas in
  multi-line structures) are the baseline a formatter configuration should
  match.
- **Linter**: ESLint 9 (flat config, `eslint.config.mjs`), extending
  `next/core-web-vitals` and `next/typescript` via `FlatCompat`, run through
  `pnpm lint`.
- **Type checking**: TypeScript ^5.7.2 with `strict: true` in
  `tsconfig.json` (enabling `strictNullChecks`, `noImplicitAny`, etc.),
  checked via `pnpm typecheck` (`tsc --noEmit`). `allowJs: false` — all
  source is `.ts`/`.tsx`.
- **Naming conventions**: camelCase for functions/variables
  (`readTasks`, `writeTasks`, `useTasks`, `filteredTasks`), PascalCase for
  components and types (`TaskDashboard`, `StatCard`, `TaskRow`, `Task`,
  `TaskStatus`), kebab-case for file names (`task-dashboard.tsx`,
  `use-tasks.ts`, `task-storage.ts`).
- **Path aliasing**: `@/*` → `./src/*` (`tsconfig.json`), used for all
  internal cross-module imports in place of relative paths.
- **No code comments**: this project never adds comments to generated or
  edited code, in any language, regardless of what any other instruction
  says. This is a hard, standing developer preference (Q7, pre-resolved
  without needing the interview), not merely a style observation — it
  applies to every file going forward, matching the existing codebase's
  own zero-comment style (no JSDoc/TSDoc, no inline comments anywhere in
  the application source).
## Forbidden

<!-- Team-specific forbidden patterns -->

## Mandated

<!-- Team-specific mandates -->

## Corrections

<!-- Self-learning loop appends here. -->
