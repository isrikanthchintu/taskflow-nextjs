# Dependencies

## External Dependencies (runtime)

| Package | Version (package.json) | Purpose |
|---|---|---|
| `next` | ^15.5.0 | App framework: routing, dev/build/start, bundling |
| `react` | ^19.1.0 | UI library |
| `react-dom` | ^19.1.0 | DOM rendering for React |
| `lucide-react` | ^0.468.0 | Icon components used throughout the dashboard UI |

## External Dependencies (development)

| Package | Version (package.json) | Purpose |
|---|---|---|
| `typescript` | ^5.7.2 | Static typing, compiled via `tsc --noEmit` for type-checking only |
| `@types/node` | ^22.10.0 | Node.js type definitions |
| `@types/react` | ^19.0.0 | React type definitions |
| `@types/react-dom` | ^19.0.0 | React DOM type definitions |
| `eslint` | ^9.17.0 | Linting engine (flat config) |
| `eslint-config-next` | ^15.5.0 | Next.js recommended/core-web-vitals/typescript lint rule presets |
| `@eslint/eslintrc` | ^3.3.7 | `FlatCompat` shim to load the legacy-style Next.js configs under ESLint's flat config system |
| `tailwindcss` | ^3.4.17 | Utility-first CSS framework (directives only engaged; see `technology-stack.md`) |
| `postcss` | ^8.4.49 | CSS transform pipeline required by Tailwind |
| `autoprefixer` | ^10.6.2 | PostCSS plugin adding vendor prefixes |

No other packages appear in `package.json`. `pnpm-lock.yaml` additionally pins the full transitive dependency tree (not individually enumerated here — it is pnpm's standard lockfile output, not hand-authored dependency declarations).

## Version Conflicts / Advisories

None observed from manifest inspection alone (no build/install was run, per scan constraints). All direct dependencies are pinned to current-generation major versions (Next 15, React 19, TypeScript 5.7) with no stale major-version lag visible from the manifest. A proper security-advisory check would require running `pnpm audit` or an equivalent tool, which was not executed as part of this static scan.

## Internal (cross-module) Dependencies

Single-package repository — no internal package-to-package dependencies (no workspaces, no `packages/` directory). Internal *module* dependencies within `src/` are:

```text
src/types/task.ts            <- (no internal deps; leaf)
src/lib/task-storage.ts      <- src/types/task.ts
src/hooks/use-tasks.ts       <- src/lib/task-storage.ts, src/types/task.ts
src/components/task-dashboard.tsx
                              <- src/hooks/use-tasks.ts, src/types/task.ts
src/app/page.tsx             <- src/components/task-dashboard.tsx
src/app/layout.tsx           <- src/app/globals.css
```

This forms a clean, acyclic dependency chain: `types → lib → hooks → components → app`. No circular references were found anywhere in the 7-file source tree.

## Path Aliasing

`tsconfig.json` defines `"@/*": ["./src/*"]`, used throughout the source (e.g., `import { useTasks } from "@/hooks/use-tasks"`) so all internal cross-module imports resolve through this alias rather than relative paths.

## External Services

None. No outbound HTTP/network calls, no third-party API integrations, no cloud SDKs appear anywhere in the source or dependency manifest.
