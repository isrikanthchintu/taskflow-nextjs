# Build Instructions

## Dependency Installation

```bash
pnpm install --frozen-lockfile
```

No environment variables, config files, or local services are required —
`technology-stack.md`'s `## Explicitly Absent` confirms no database, API,
or network dependency exists in this project, and this intent added none
(`NFR2`, verified below).

## Build Commands

```bash
pnpm build
```

Runs `next build`: compiles the Next.js App Router project, runs Next.js's
own ESLint/type pass during the build, and generates the static production
output.

## Build Verification

- `pnpm build` must exit 0 and report `✓ Compiled successfully`.
- `pnpm typecheck` (`tsc --noEmit`) must exit 0 with no output.
- `pnpm lint` (`eslint src/`, corrected in `u4-ci-pipeline`'s Code
  Generation) must exit 0 — a pre-existing warning
  (`'TaskPriority' is defined but never used` in `src/hooks/use-tasks.ts`)
  is acceptable; any error is not.

No infrastructure-as-code exists in this intent's scope (no CDK, Terraform,
or CloudFormation unit was built), so no IaC-specific static check applies.

## Troubleshooting Common Build Issues

- **`tsc --noEmit` fails after a dependency change**: re-run
  `pnpm install --frozen-lockfile` first; a stale `node_modules` from an
  interrupted install is the most common cause in this project.
- **`next build`'s own lint pass reports more than the pre-existing
  warning**: check that no new `.ts`/`.tsx` file was added outside
  `src/lib/`, `src/hooks/`, `src/components/`, since `eslint src/` (and
  Next.js's own build-time lint) only scans `src/`.
- **`pnpm format:check` reports more files than the 7 already known**
  (`src/app/globals.css`, `src/app/layout.tsx`,
  `src/components/task-dashboard.tsx`,
  `src/components/task-dashboard.test.tsx`, `src/hooks/use-tasks.ts`,
  `src/hooks/use-tasks.test.ts`, `src/lib/task-storage.test.ts`) — those 7
  are an accepted, human-confirmed gap (`u3-code-formatting`'s
  `code-summary.md`); any file beyond that list is a new regression to
  investigate, not to silently accept.
