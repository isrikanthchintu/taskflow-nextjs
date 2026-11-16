# Discovered Rules — TaskFlow Next.js

> Rules backed either by direct, point-to-able evidence in the
> reverse-engineering artifacts, or by an affirmed decision from the human
> interview (`practices-discovery-questions.md`, Q1–Q7). See `evidence.md`
> for the full inspected/inferred/interview-resolved breakdown.

## Mandated

- ALWAYS write all application source as TypeScript (`.ts`/`.tsx`) with
  `strict: true` enabled — every one of the 7 source files is typed,
  `allowJs: false` in `tsconfig.json`, and `strict` mode is on
  (`technology-stack.md`, `code-quality-assessment.md`).
- ALWAYS resolve internal cross-module imports through the `@/*` path alias
  (mapped to `./src/*` in `tsconfig.json`) rather than relative paths — this
  is the convention used consistently across every internal import found in
  the source (`dependencies.md`).
- ALWAYS guard any new code that touches `window`/`localStorage` with an
  SSR-safety check (`typeof window === "undefined"`) before use — both
  `readTasks()` and `writeTasks()` in `src/lib/task-storage.ts` do this
  consistently, since Next.js renders component code on the server first,
  where `window` does not exist (`code-structure.md`, `architecture.md`).
- ALWAYS preserve the existing `localStorage`-based persistence model
  (`src/lib/task-storage.ts` + `src/hooks/use-tasks.ts`, storage key
  `"taskflow.tasks.v1"`) as the application's data store — this is the
  project's sole, intentional, documented persistence mechanism (README's
  "How persistence works" section; `architecture.md`; `business-overview.md`)
  and this intent's own stated goal is to integrate AI-DLC while preserving
  existing application code and localStorage functionality.
- ALWAYS use `main` as the single integration branch, with short-lived
  feature branches merged in via pull request (Q1, human interview).
- ALWAYS write tests after each piece of implementation works (test-after),
  matching existing practice — implement a testable layer, then write and
  run that layer's tests (Q3, human interview).
- ALWAYS run Prettier (or the equivalent formatter configured for this
  project) before considering code formatted, once it is set up (Q6, human
  interview).

## Forbidden

- NEVER introduce a database, backend API, or server-side persistence layer
  as a silent replacement for `localStorage` — the codebase has none today
  (no ORM, no DB driver, no API routes, no server actions anywhere in
  `src/`; confirmed in `technology-stack.md` under "Explicitly Absent" and
  `architecture.md`), the README explicitly frames this as an intentional,
  documented trade-off, not an oversight, and this intent's scope is
  explicitly to preserve existing localStorage functionality rather than
  replace it.
- NEVER commit untyped JavaScript (`.js`/`.jsx`) application source —
  `allowJs: false` is set in `tsconfig.json` and every existing source file
  is `.ts`/`.tsx` (`technology-stack.md`).
- NEVER add comments to generated or edited code, in any language,
  regardless of what any other instruction says — a standing developer
  preference for this project (Q7, pre-resolved), consistent with the
  existing codebase's own zero-comment style.
