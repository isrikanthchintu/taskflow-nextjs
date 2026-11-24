# Security Design — u3-code-formatting

Technical approach satisfying `NFR5.1` and `NFR5.2` from
`nfr-requirements/security-requirements.md`.

## Design

1. **`NFR5.1` — dependency placement.** `package.json`'s `devDependencies`
   key is the only place Code Generation adds `prettier`. There is no
   runtime mechanism beyond this placement rule — for a unit this small, the
   package manifest entry itself is the whole design.

2. **`NFR5.2` — no plugin surface.** The Prettier configuration file
   (`.prettierrc` or `prettier.config.ts`) carries no `plugins` array entry,
   and `package.json` lists no `prettier-plugin-*` package. The configured
   options are limited to the ones that reproduce the project's already
   observed conventions:
   ```json
   {
     "tabWidth": 2,
     "singleQuote": false,
     "trailingComma": "none"
   }
   ```
   This is the complete, authoritative configuration for Code Generation to
   write — not a trimmed illustrative example — because for a unit this
   small, the config file is the whole design. No plugin is configured
   because none of the three options above needs one; a plugin would be
   added surface with no corresponding formatting need.

   **Correction (made during Code Generation, recorded here under Guard
   Policy `off`):** `trailingComma` was originally specified as `"all"`,
   read from `requirements.md` FR5.1's "trailing commas in multi-line
   structures." Running `pnpm format:check` against the real codebase during
   Code Generation showed every existing multi-line array/object/argument
   list omits the comma after its *last* element — `"all"` (and `"es5"`,
   which behaves identically for objects/arrays) would have added one
   everywhere, producing a real formatting diff, not matching the observed
   convention. `"none"` is the Prettier option that actually reproduces the
   codebase's real pattern; this correction is the config value Code
   Generation wrote.

   **Known residual gap (accepted, not fixed):** the three settings above
   do not cover every observed convention. `printWidth` (left at Prettier's
   default) wraps 6 existing long lines differently than authored, and
   `src/app/globals.css`'s hand-minified style is not reproduced by any of
   the three settings — Prettier's CSS formatter would fully expand it.
   Both were surfaced at Code Generation's `pnpm format:check` run and
   accepted as a minor, unfixed gap rather than expanding this config
   (`code-generation/code-summary.md` has the full file list and reasoning).

## Threat Considered and Rejected

- **A Tailwind class-sorting or import-sorting Prettier plugin** was
  considered and rejected: `technology-stack.md` confirms Tailwind utility
  classes are not used inline in this codebase's markup
  (`code-structure.md`), so a class-sorting plugin would have nothing to
  sort; an import-sorting plugin was not requested (`requirements.md` FR5
  asks only for the three observed conventions above) and would add
  format-time code execution with no corresponding requirement.
- **A pre-commit hook running Prettier automatically** was considered and
  rejected as out of scope: `requirements.md` FR5.2 explicitly keeps the
  format check a local/dev-time tool, not a required gate, so an
  automatically-triggered hook would be an unrequested process change.

## Traceability

`NFR5.1` and `NFR5.2` are both fully addressed by the `devDependencies`
placement rule and the plugin-free configuration above.
