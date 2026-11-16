# Evidence — Practices Discovery (TaskFlow Next.js)

## What was inspected

Reverse-engineering artifacts (brownfield path, as produced by the prior
Reverse Engineering stage):

- `aidlc/spaces/default/codekb/taskflow-nextjs/code-structure.md`
- `aidlc/spaces/default/codekb/taskflow-nextjs/technology-stack.md`
- `aidlc/spaces/default/codekb/taskflow-nextjs/dependencies.md`
- `aidlc/spaces/default/codekb/taskflow-nextjs/code-quality-assessment.md`
- `aidlc/spaces/default/codekb/taskflow-nextjs/architecture.md`
- `aidlc/spaces/default/codekb/taskflow-nextjs/business-overview.md`

Directly re-read source-of-truth files to confirm the scan's claims and pull
exact script names/content:

- `package.json` (scripts: `dev`, `build`, `start`, `lint`, `typecheck`;
  dependencies and devDependencies)
- `README.md` (setup, usage, persistence explanation, "Next development
  steps")
- `.env.example` (single comment line: no env vars required)

Also confirmed directly: the repository root has no `.git` directory, no
`.github/` directory, and no CI/CD configuration file of any kind.

## What was inferred (with reasoning)

- **Testing methodology → test-after**: no test framework, no test files, no
  `test` script, and the README itself names "Add unit and component tests"
  as a still-open follow-up. This indicates tests were never written
  alongside the existing code, which is consistent with "test-after" (or
  "no formal practice yet") rather than any test-first discipline. Confidence:
  moderate — this is the best available inference, but it is not a confirmed
  team commitment and should be affirmed explicitly in the interview.
- **Code style conventions (naming, path aliasing, no comments)**: inferred
  directly from reading the 7 source files — consistent kebab-case file
  names, camelCase functions, PascalCase components/types, consistent `@/*`
  alias usage, zero inline comments. High confidence — this is observed,
  repeated, unbroken pattern across the entire (small) codebase, not a
  single-sample guess.
- **Architecture style (client-rendered, backend-free, layered)**: directly
  observed from the dependency graph and component wiring in
  `architecture.md`/`code-structure.md`. High confidence.
- **Single-contributor/small-team working style**: inferred loosely from the
  small, flat, non-monorepo structure and lack of any multi-contributor
  tooling (no CODEOWNERS, no PR templates). Low confidence — this is a weak
  inference from absence of evidence, not a positive signal, and is flagged
  as such in `team-practices.md` rather than stated as fact.

## What is genuinely unresolved / unknown — needs human input

- **Git/branching strategy**: this repository has **no `.git` directory at
  all** — there is no commit history, no branches, no merge history to
  inspect. Nothing about trunk-based vs. GitFlow vs. feature-branch, commit
  message conventions, or PR/review process can be determined from static
  evidence. The `team-practices.md` draft uses `main` as the integration
  branch only because it is the framework's own org-level default — this is
  explicitly flagged as a default to confirm, not an observed fact.
- **Deployment cadence, environment topology, and CI/CD**: there is no CI
  configuration (no `.github/workflows/`, no other CI system config), no
  Dockerfile, no infrastructure-as-code, and no hosting-provider config file
  of any kind. Nothing is knowable about how (or whether) this app has ever
  been deployed, what environments exist (dev/staging/prod), or what gates a
  deployment. This dimension is entirely open for the human interview.
- **Code review / PR conventions**: no evidence either way (no `.git`
  history, no `.github/` directory, no CODEOWNERS, no PR templates).
- **Coverage targets / quality gates**: no coverage tooling, no thresholds
  configured anywhere, no CI to enforce them. Whether this project should
  adopt the org-level 80% floor (for `mvp`/`enterprise`/`feature`/`infra`
  scopes) or something lighter, given its current prototype/demo framing, is
  an open question for the human.
- **Formatter**: no Prettier or other formatter is configured; observed
  formatting is consistent but unenforced by tooling. Whether the team wants
  to adopt one is open.

## Interview Decisions

Resolved via the human interview in `practices-discovery-questions.md`,
except Q7, which was pre-resolved from a standing developer preference and
not re-asked.

- **Q1 — Branching**: `main` as the single integration branch, with
  short-lived feature branches merged via pull request (simple trunk-based
  flow). Resolved by human interview.
- **Q2 — Walking skeleton**: treat the existing app as the already-proven
  skeleton — build directly from here, no separate skeleton checkpoint for
  this intent. Resolved by human interview.
- **Q3 — Testing methodology**: test-after, matching existing practice (no
  tests exist yet; add them as each piece works). Resolved by human
  interview.
- **Q4 — Coverage target**: no strict target — new/existing tests just need
  to stay green; no 80% floor. Lighter than the org default, affirmed given
  the project's prototype/demo framing. Resolved by human interview.
- **Q5 — Deployment scope**: basic CI pipeline only (lint/typecheck/test
  checks) — no hosting/deploy target for this intent. Resolved by human
  interview.
- **Q6 — Code formatting**: add Prettier (or similar) and enforce it going
  forward. Resolved by human interview.
- **Q7 — Comment style**: keep the no-comments style consistent with the
  rest of the code. Pre-resolved from a standing developer preference
  (never add comments to generated/edited code, in any language, regardless
  of task instructions) — not re-asked in the interview, only confirmed as
  already in effect.

## Constraint this intent must respect

This intent's goal is "Integrate AWS AI-DLC into this existing TaskFlow
Next.js application. Preserve the existing application code and localStorage
functionality." The reverse-engineering scan confirms the existing
localStorage-based persistence is implemented via `src/lib/task-storage.ts`
(the sole module touching `window.localStorage`) and consumed through
`src/hooks/use-tasks.ts`, under the fixed storage key `"taskflow.tasks.v1"`.
Every discovered/drafted practice in this stage treats that persistence
mechanism as existing, intentional behavior to preserve — not a gap to fill
with a database or backend API. See the "Forbidden" section of
`discovered-rules.md` and the "Deployment"/"Way of Working" notes in
`team-practices.md` for how this constraint is reflected.
