# Code Structure

## Repository Layout

```text
taskflow-nextjs/            (repo root, unregistered project-root repo)
  src/
    app/
      globals.css
      layout.tsx
      page.tsx
    components/
      task-dashboard.tsx
    hooks/
      use-tasks.ts
    lib/
      task-storage.ts
    types/
      task.ts
  package.json
  pnpm-lock.yaml
  tsconfig.json
  next.config.ts
  eslint.config.mjs
  tailwind.config.ts
  postcss.config.mjs
  .env.example
  README.md
```

This is a single-package Next.js App Router project — no monorepo, no workspaces, no internal packages beyond the one `src/` tree. Total application source: 7 files.

## Module Organization

- **`src/app/`** — Next.js App Router entry points. `layout.tsx` is the root HTML shell (sets `<html lang="en">`, imports global CSS, defines page `<Metadata>`). `page.tsx` is the single route (`/`) and simply renders `TaskDashboard`. `globals.css` is the app's entire stylesheet (Tailwind directives plus a large block of hand-written plain CSS class rules for layout, components, and responsive breakpoints).
- **`src/components/`** — UI layer. One file, `task-dashboard.tsx`, containing the top-level `TaskDashboard` component plus two co-located presentational sub-components, `StatCard` and `TaskRow`.
- **`src/hooks/`** — State/logic layer. One file, `use-tasks.ts`, exporting the `useTasks()` custom hook that owns the task list state, loads/seeds it on mount, persists it on change, and exposes CRUD-style mutator functions.
- **`src/lib/`** — Persistence/utility layer. One file, `task-storage.ts`, exporting `readTasks()`/`writeTasks()` — the sole boundary that touches `window.localStorage`.
- **`src/types/`** — Shared type definitions. One file, `task.ts`, defining `TaskStatus`, `TaskPriority`, and the `Task` interface used across components, hook, and storage.

## File Classification

| File | Classification | Notes |
|---|---|---|
| `src/app/layout.tsx` | Configuration/Root shell | App Router root layout; no business logic |
| `src/app/page.tsx` | Controller/Route entry | Thin route component, delegates entirely to `TaskDashboard` |
| `src/app/globals.css` | Static/Asset | Stylesheet; Tailwind directives + hand-authored CSS |
| `src/components/task-dashboard.tsx` | Controller/UI (mixed with Service-like logic) | Top-level UI component; owns form state, filtering/search derivation (`useMemo`), and renders `StatCard`/`TaskRow` sub-components defined in the same file |
| `src/hooks/use-tasks.ts` | Service/UseCase | Encapsulates task state, seeding, persistence orchestration, and all mutation operations (add/update/delete/setStatus) |
| `src/lib/task-storage.ts` | Repository/DAO | Sole module reading/writing `localStorage`; the app's only persistence abstraction |
| `src/types/task.ts` | Model/Entity | Shared `Task`, `TaskStatus`, `TaskPriority` type definitions |
| `package.json` | Configuration | Scripts and dependency manifest |
| `tsconfig.json` | Configuration | TypeScript compiler options, `@/*` path alias to `src/*` |
| `next.config.ts` | Configuration | Next.js config (only `reactStrictMode: true` set) |
| `eslint.config.mjs` | Configuration | ESLint flat config, Next.js rule presets |
| `tailwind.config.ts` | Configuration | Tailwind content globs and (empty) theme extension |
| `postcss.config.mjs` | Configuration | PostCSS plugin pipeline (Tailwind + Autoprefixer) |
| `.env.example` | Configuration | Documents that no env vars are required |
| `README.md` | Documentation | Features, setup, structure, and persistence explanation |

No Controller/Handler (server-side), Middleware, Migration, or Test category files exist in this codebase — there are no server routes, no middleware, no database migrations, and no test files at all.

## Code Patterns

- **Custom hook as data layer**: `useTasks()` is the single source of truth for task state; `TaskDashboard` never manipulates `tasks` directly, only via the functions the hook returns.
- **Effect-gated persistence**: a `useEffect` with an `isReady` guard flag prevents premature overwrite of stored data before the initial read resolves — a deliberate pattern to avoid a classic "effect fires before data loads" bug in client-only storage apps.
- **SSR-safety guards**: both `readTasks` and `writeTasks` check `typeof window === "undefined"` before touching `localStorage`, since Next.js executes component code during server rendering where `window` does not exist.
- **Narrow, single-purpose repository module**: `task-storage.ts` exposes only two functions and no class/singleton — a minimal Repository-pattern implementation over Web Storage.
- **Derived state via `useMemo`**: filtering (`filteredTasks`) and counting (`counts`) are computed from `tasks`/`filter`/`query` rather than stored as separate state, avoiding state-synchronization bugs.
- **Co-located small presentational components**: `StatCard` and `TaskRow` are defined in the same file as their only consumer (`TaskDashboard`) rather than extracted to their own files — a size-appropriate choice for the current file count, flagged as a growth consideration in `code-quality-assessment.md`.
- **Inline Tailwind-adjacent plain CSS**: despite Tailwind being configured, the actual styling in `globals.css` is almost entirely hand-written semantic class rules (`.task-row`, `.stat-card`, etc.) rather than Tailwind utility classes used inline in JSX — Tailwind's own utilities are not used in the component markup at all (no `className="flex gap-2"` style usage found); only the three `@tailwind` directives engage the Tailwind pipeline.

## Dependency Graph (internal, file → file)

```text
src/app/layout.tsx       -> src/app/globals.css
src/app/page.tsx         -> src/components/task-dashboard.tsx
src/components/task-dashboard.tsx
                          -> src/hooks/use-tasks.ts
                          -> src/types/task.ts
                          -> lucide-react (external)
src/hooks/use-tasks.ts   -> src/lib/task-storage.ts
                          -> src/types/task.ts
src/lib/task-storage.ts  -> src/types/task.ts
src/types/task.ts        -> (no internal dependencies; leaf module)
```

No circular references were found — the dependency graph is a clean, acyclic layering: `types` ← `lib` ← `hooks` ← `components` ← `app`.
