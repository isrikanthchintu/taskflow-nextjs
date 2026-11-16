# Component Inventory

## RootLayout
- **File**: `src/app/layout.tsx`
- **Type**: Next.js App Router root layout (Server Component, default)
- **Responsibility**: Defines the outer `<html>`/`<body>` shell for every page, imports `globals.css`, and sets the document `<Metadata>` (title, description).
- **Dependencies**: `next` (`Metadata` type), `./globals.css`.
- **Dependents**: Implicitly wraps every route in `src/app/`; the only route today is `page.tsx`.

## HomePage
- **File**: `src/app/page.tsx`
- **Type**: Next.js route component (`/`), Server Component (no `"use client"` directive)
- **Responsibility**: Entry point for the `/` route; renders `TaskDashboard` with no props.
- **Dependencies**: `src/components/task-dashboard.tsx` (`TaskDashboard`).
- **Dependents**: None (leaf route).

## TaskDashboard
- **File**: `src/components/task-dashboard.tsx`
- **Type**: Client Component (`"use client"`)
- **Responsibility**: The entire application UI — sidebar navigation (static placeholder links), topbar, welcome header, stats grid, search/filter controls, task list, "create task" modal/form, and page footer. Owns local UI state (`filter`, `query`, `showForm`, and the create-task form fields) and derives `filteredTasks`/`counts` via `useMemo` from the data returned by `useTasks()`.
- **Dependencies**: `useTasks` (`src/hooks/use-tasks.ts`), `Task`/`TaskPriority`/`TaskStatus` types (`src/types/task.ts`), `lucide-react` icons.
- **Dependents**: `HomePage`.
- **Internal sub-components** (defined in the same file, not separately exported/importable):
  - **StatCard** — presentational card showing one summary metric (label, value, helper text, icon, color tone). Used four times for Total/To-do/In-progress/Completed.
  - **TaskRow** — presentational row for a single task: status-toggle circle, title/description, priority badge, status badge, formatted due date, delete button. Computes the "next status" cycle (`todo → in-progress → done → todo`) and calls `onStatusChange`/`onDelete` props passed down from `TaskDashboard`.

## useTasks (hook)
- **File**: `src/hooks/use-tasks.ts`
- **Type**: Custom React hook (client-only logic, used inside a `"use client"` component)
- **Responsibility**: Owns the canonical `tasks` array and `isReady` flag; loads/seeds data on mount; persists on every change; exposes `addTask`, `updateTask`, `deleteTask`, `setStatus` mutators. See `api-documentation.md` for the full contract.
- **Dependencies**: `readTasks`/`writeTasks` (`src/lib/task-storage.ts`), `Task`/`TaskPriority`/`TaskStatus` types.
- **Dependents**: `TaskDashboard` (sole consumer).
- **Internal data**: `starterTasks` — a hard-coded 4-item seed array used only when storage is empty on first load.

## task-storage module
- **File**: `src/lib/task-storage.ts`
- **Type**: Plain TypeScript module (no React), persistence utility
- **Responsibility**: Sole boundary to `window.localStorage`; exposes `readTasks()` and `writeTasks(tasks)`. See `api-documentation.md` for the full contract.
- **Dependencies**: `Task` type.
- **Dependents**: `useTasks` (sole consumer).

## task types module
- **File**: `src/types/task.ts`
- **Type**: Plain TypeScript type/interface definitions (no runtime code)
- **Responsibility**: Defines `TaskStatus`, `TaskPriority`, and the `Task` interface — the single shared data model for the whole app.
- **Dependencies**: None (leaf module).
- **Dependents**: `task-dashboard.tsx`, `use-tasks.ts`, `task-storage.ts`.

## globals.css
- **File**: `src/app/globals.css`
- **Type**: Global stylesheet
- **Responsibility**: Three `@tailwind` directives (base/components/utilities) followed by the app's entire hand-written visual design — layout (`.app-shell`, `.sidebar`, `.main-content`), stat cards, task list/rows, modal, and responsive breakpoints at 1000px/720px/390px.
- **Dependencies**: Tailwind/PostCSS build pipeline.
- **Dependents**: Loaded once by `RootLayout`; styles every class name referenced in `task-dashboard.tsx`.

## Component Relationship Summary

```text
RootLayout
  └─ HomePage (route "/")
       └─ TaskDashboard  ──uses──>  useTasks()  ──uses──>  task-storage.ts  ──persists to──>  localStorage
            ├─ StatCard (×4, inline sub-component)
            └─ TaskRow (×N, inline sub-component)
       (all of the above reference types/task.ts)
```

No class-based components, no context providers, no third-party state-management or data-fetching library (e.g., no React Query, SWR, Redux, Zustand) are present anywhere in the inventory — state management is entirely local `useState`/`useMemo`/`useEffect` within `useTasks` and `TaskDashboard`.
