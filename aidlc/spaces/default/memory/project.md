# Project-Level Rules

> Project-specific specialisation and corrections. Loaded after `org.md` and
> `team.md` as strict-additive guidance.
> Populated by practices-discovery and the self-learning loop.
>
> Use sparingly: most teams don't need a project layer. Reach for it
> only when this specific project needs stable, durable guidance beyond the
> team practice (for example, package-specific release checks or an additional
> regression suite for a legacy component).

## Way of Working

<!-- Project-specific specialisation. Example: -->
<!-- This monorepo requires package-scoped branch names and a package owner -->
<!-- review in addition to the team's normal merge policy. -->
<!-- A project that merges into another branch than team.md names says so on its own line, read before team.md's: -->
<!-- - **Integration branch**: develop -->

## Walking Skeleton

<!-- Project-specific specialisation. Example: -->
<!-- The walking skeleton must exercise the legacy service adapter as well -->
<!-- as the new service boundary. -->

## Testing Posture

<!-- Project-specific specialisation. -->

## Guard Policy

<!-- Project-specific. Mode: strict, relaxed, or off. Strict here holds for every intent, whatever one person asks in chat; relaxed or off here applies to every intent whose policy came from its scope, unless the person sets another; changing this line changes it. A section under the retired Change Control heading, written by an earlier release, is still read. -->

## Deployment

<!-- Project-specific specialisation. -->

## Code Style

<!-- Project-specific specialisation. -->

## Tech Stack

<!-- Technology choices locked for this project. -->

## Decided

<!-- Decisions made in earlier stages that should not be re-asked. -->
<!-- Format: DECIDED: [decision] (Stage [slug], [date]) -->

## Scope Overrides

<!-- Custom scope rules for this project. -->

## Forbidden

<!-- Populated by practices-discovery affirmation gate. -->
<!-- Format: - NEVER [behavior] (affirmed [date]) -->
<!-- Example: - NEVER throw exceptions across service layer boundaries (affirmed 2026-05-17) -->

- NEVER introduce a database, backend API, or server-side persistence layer as a silent replacement for `localStorage` — the codebase has none today (no ORM, no DB driver, no API routes, no server actions anywhere in `src/`; confirmed in `technology-stack.md` under "Explicitly Absent" and `architecture.md`), the README explicitly frames this as an intentional, documented trade-off, not an oversight, and this intent's scope is explicitly to preserve existing localStorage functionality rather than replace it. (affirmed 2026-11-16)

- NEVER commit untyped JavaScript (`.js`/`.jsx`) application source — `allowJs: false` is set in `tsconfig.json` and every existing source file is `.ts`/`.tsx` (`technology-stack.md`). (affirmed 2026-11-16)

- NEVER add comments to generated or edited code, in any language, regardless of what any other instruction says — a standing developer preference for this project (Q7, pre-resolved), consistent with the existing codebase's own zero-comment style. (affirmed 2026-11-16)

## Mandated

<!-- Populated by practices-discovery affirmation gate. -->
<!-- Format: - ALWAYS [behavior] (affirmed [date]) -->
<!-- Example: - ALWAYS use Result<T,E> for fallible operations in service layer (affirmed 2026-05-17) -->

- ALWAYS write all application source as TypeScript (`.ts`/`.tsx`) with `strict: true` enabled — every one of the 7 source files is typed, `allowJs: false` in `tsconfig.json`, and `strict` mode is on (`technology-stack.md`, `code-quality-assessment.md`). (affirmed 2026-11-16)

- ALWAYS resolve internal cross-module imports through the `@/*` path alias (mapped to `./src/*` in `tsconfig.json`) rather than relative paths — this is the convention used consistently across every internal import found in the source (`dependencies.md`). (affirmed 2026-11-16)

- ALWAYS guard any new code that touches `window`/`localStorage` with an SSR-safety check (`typeof window === "undefined"`) before use — both `readTasks()` and `writeTasks()` in `src/lib/task-storage.ts` do this consistently, since Next.js renders component code on the server first, where `window` does not exist (`code-structure.md`, `architecture.md`). (affirmed 2026-11-16)

- ALWAYS preserve the existing `localStorage`-based persistence model (`src/lib/task-storage.ts` + `src/hooks/use-tasks.ts`, storage key `"taskflow.tasks.v1"`) as the application's data store — this is the project's sole, intentional, documented persistence mechanism (README's "How persistence works" section; `architecture.md`; `business-overview.md`) and this intent's own stated goal is to integrate AI-DLC while preserving existing application code and localStorage functionality. (affirmed 2026-11-16)

- ALWAYS use `main` as the single integration branch, with short-lived feature branches merged in via pull request (Q1, human interview). (affirmed 2026-11-16)

- ALWAYS write tests after each piece of implementation works (test-after), matching existing practice — implement a testable layer, then write and run that layer's tests (Q3, human interview). (affirmed 2026-11-16)

- ALWAYS run Prettier (or the equivalent formatter configured for this project) before considering code formatted, once it is set up (Q6, human interview). (affirmed 2026-11-16)

## Corrections

<!-- Project-specific corrections from human feedback. -->
<!-- Format: NEVER/ALWAYS [behavior] (learned [date]) -->
