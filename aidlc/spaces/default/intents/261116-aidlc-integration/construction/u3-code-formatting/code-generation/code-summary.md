# Code Summary — u3-code-formatting

## Files Created / Modified

- `package.json` (modified): added `prettier` under `devDependencies` only
  (`FR5.1`, `NFR5.1`); added `format` (`"prettier --write ."`) and
  `format:check` (`"prettier --check ."`) scripts (`FR5.2`). No other
  scripts, dependencies, or fields touched.
- `.prettierrc.json` (created, then corrected): `tabWidth: 2`,
  `singleQuote: false`, `trailingComma: "none"` — no `plugins` entry, no
  additional options (`FR5.1`, `NFR5.2`). `trailingComma` was corrected from
  `"all"` to `"none"` after the first `format:check` run (see below);
  recorded in `nfr-design/security-design.md` under Guard Policy `off`.
- `.prettierignore` (created, then widened): mirrors `.gitignore`'s
  categories — build/dependency artifacts (`node_modules`, `.next`, `out`),
  the OS/editor and env-file patterns already in `.gitignore`, and the full
  `# BEGIN AI-DLC:gitignore` / `# END AI-DLC:gitignore` block verbatim —
  plus, after the first `format:check` run, the AI-DLC framework tree
  (`.claude/`, `aidlc/`, `.mcp.json`) and tool-generated files
  (`pnpm-lock.yaml`, `next-env.d.ts`), per the person's direction.
- `pnpm-lock.yaml` (modified by `pnpm install`): added the `prettier`
  resolution entry under `devDependencies`. No other dependency changed.

## Key Decisions

- **Prettier version pin**: added `"prettier": "^3.4.2"` to
  `devDependencies`; `pnpm install` resolved `3.10.1` (latest 3.x, satisfies
  the caret range). No specific version was named by any upstream
  requirement or design doc, so the current stable 3.x major was used.
- **Initial `.prettierignore` scope, then widened**: the first pass limited
  the ignore list strictly to mirroring `.gitignore`'s categories, per
  Step 3's original wording. The first `format:check` run (below) showed
  this left 383 AI-DLC framework files and 2 tool-generated files in scope;
  the person, presented with the finding, directed widening
  `.prettierignore` to exclude them, which Step 3 was updated to reflect.
- **`trailingComma` corrected from `"all"` to `"none"`**: the first run also
  showed the approved `"all"` setting disagreed with the codebase's actual
  convention (no comma after the last element). The person, presented with
  the finding, directed the correction; `nfr-design/security-design.md`
  records it as a Guard-Policy-`off` correction to an already-reviewed
  design decision.
- **`printWidth` and `globals.css` left as accepted, minor diffs**: per the
  person's direction, these two remaining causes (below) were not fixed —
  neither is one of the three approved Prettier settings, and the person
  chose to accept them rather than expand the config further.

## `pnpm format:check` Result (Step 5)

- **First run** — exit `1`: `Code style issues found in 397 files.`
- **After the `.prettierignore` widening and `trailingComma` correction,
  re-run** — exit `1`: `Code style issues found in 7 files.` The remaining
  7 files are the `printWidth` and `globals.css` causes below (#3 and #4),
  both accepted by the person as minor, non-fixed diffs; no other file
  disagrees.

## Issues / Deviations

The first `pnpm format:check` run did not exit cleanly against the full
repository. Investigating the 397 flagged files showed the disagreement
fell into five distinct, separable root causes. Causes #1 and #2 were
fixed per the person's direction (see Key Decisions); causes #3-#5 remain,
of which #3 and #4 still fail `format:check` (#5's 2 files are now
excluded by the widened `.prettierignore`).

1. **383 of the 397 files are AI-DLC's own framework files**, not this
   project's application code: everything under `.claude/` (agents,
   skills, stages, hooks, tools, knowledge, `CLAUDE.md`) and `aidlc/`
   (space memory, intent records, codekb), plus `.mcp.json`. `FR5.1`'s
   "project's existing observed conventions" and `team.md`'s affirmation
   (2-space indentation, double-quoted strings, trailing commas) were
   both scoped to the application source (`src/app`, `src/components`,
   `src/hooks`, `src/lib`) — not to the AI-DLC framework's own markdown
   and TypeScript, which was authored under different conventions (e.g.
   single quotes, no trailing comma in many places). `.gitignore` does
   **not** exclude these paths wholesale (only a named per-user/per-clone
   runtime subset, mirrored verbatim into `.prettierignore` per Step 3),
   so they remain in `prettier --check .`'s scope and fail. Widening
   `.prettierignore` to exclude all of `.claude/`/`aidlc/` was not done
   here since Step 3 named mirroring `.gitignore`'s categories only, and
   that is a scope decision beyond this unit's boundaries.

2. **Trailing-comma convention mismatch** — the configured
   `trailingComma: "all"` adds a trailing comma after the *last* element
   of every multi-line object/array/argument list, but the project's
   actual existing application and config files consistently omit it
   (e.g. `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`,
   `eslint.config.mjs`, `jest.config.ts`, `src/hooks/use-tasks.ts`,
   `src/hooks/use-tasks.test.ts`, `src/lib/task-storage.test.ts`). The
   project's real observed convention for the *last* item appears closer
   to no-trailing-comma, which the three-setting config (fixed by
   `nfr-design/security-design.md`) does not express — `trailingComma`
   only offers `"all"`, `"es5"`, or `"none"` as whole-codebase modes, none
   of which reproduces "comma between items, no comma on the last one"
   exactly as `"all"` was specified.

3. **`printWidth` not configured** — Prettier's default (`80`) wraps
   several existing long lines (e.g. `src/app/layout.tsx`'s `description`
   field and `RootLayout` signature; `src/components/task-dashboard.tsx`'s
   multi-icon import line; several `await waitFor(...)` assertions in
   `src/components/task-dashboard.test.tsx`, `src/hooks/use-tasks.test.ts`,
   and `src/lib/task-storage.test.ts`) that the project's existing code
   left on one line past 80 columns. `printWidth` is not one of the three
   approved settings, so this was left at Prettier's default rather than
   added.

4. **`src/app/globals.css` is hand-minified**, not newline-per-declaration
   — Prettier's CSS formatter fully expands every rule/declaration onto
   its own line (a ~727-line reformat of a ~66-line file), regardless of
   `tabWidth`/`singleQuote`/`trailingComma`. This file's existing style
   (compact, one selector block per line) was never one of the three
   conventions `FR5.1`/`team.md` observed for formatting (those were
   stated for `.ts`/`.tsx` source), and no CSS-specific option exists
   among the three approved settings to reproduce a minified style.

5. **`pnpm-lock.yaml` and `next-env.d.ts` are tool-generated, not
   hand-authored** — `pnpm-lock.yaml` uses single-quoted YAML scalars
   (pnpm's own lockfile writer), which `singleQuote: false` rewrites to
   double quotes; `next-env.d.ts` is generated by Next.js with CRLF line
   endings and carries the comment "This file should not be edited",
   which Prettier's default `endOfLine: "lf"` would normalize. Neither
   file reflects an "observed convention" of this project's own authors;
   both are regenerated by their respective tools independently of
   Prettier.

**Resolved, per the person's direction:**
- #1 (383 AI-DLC framework files): `.prettierignore` widened to exclude
  `.claude/`, `aidlc/`, `.mcp.json`.
- #2 (trailing-comma mismatch): `.prettierrc.json`'s `trailingComma`
  corrected to `"none"`.
- #5 (2 tool-generated files): covered by the same `.prettierignore`
  widening (`pnpm-lock.yaml`, `next-env.d.ts` added explicitly).

**Accepted as-is, per the person's direction (still fail `format:check`,
7 files total):**
- #3 (`printWidth` default wraps 6 existing long lines in
  `src/app/layout.tsx`, `src/components/task-dashboard.tsx`,
  `src/components/task-dashboard.test.tsx`, `src/hooks/use-tasks.ts`,
  `src/hooks/use-tasks.test.ts`, `src/lib/task-storage.test.ts`):
  `printWidth` is not one of the three approved settings; left at
  Prettier's default.
- #4 (`src/app/globals.css` hand-minified; Prettier's CSS formatter would
  fully expand it): no CSS-specific option exists among the three approved
  settings to reproduce the minified style; left unconfigured.
