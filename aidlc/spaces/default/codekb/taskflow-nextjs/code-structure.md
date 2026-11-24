# Code Structure

## Repository Layout

Single package (no workspaces). Application source is `src/` (18 files, about 1,990 lines including tests).

```text
src/
  app/
    globals.css           Static/Asset - Tailwind directives plus legacy class styles
    layout.tsx            Configuration - RootLayout, metadata, ThemeRegistry
    page.tsx              Controller - HomePage renders TaskDashboard
  components/
    task-dashboard.tsx    UI container - top bar, summary, create/edit dialog
    kanban-board.tsx      UI container - DndContext, drag outcome logic, filtering
    kanban-column.tsx     UI - droppable sortable column
    task-card.tsx         UI - sortable card with controls
    *.test.tsx            Test - 4 component test files
  hooks/
    use-tasks.ts          Service/State - external store and task actions
    use-tasks.test.ts     Test
  lib/
    task-storage.ts       Repository - localStorage read/write
    task-storage.test.ts  Test
  types/
    task.ts               Model - Task, TaskStatus, TaskPriority
  theme.ts                Configuration - MUI theme
  theme-registry.tsx      Configuration - emotion cache and ThemeProvider
```

Root config: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `jest.config.ts`, `jest.setup.ts`, `eslint.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `.prettierrc.json`, `.prettierignore`, `.gitignore`, `.env.example`, `.github/workflows/ci.yml`, `README.md`.

## Module Responsibilities and Exports

| File | Exports |
|---|---|
| `src/types/task.ts` | `TaskStatus`, `TaskPriority`, `Task` |
| `src/lib/task-storage.ts` | `readTasks`, `writeTasks` |
| `src/hooks/use-tasks.ts` | `useTasks` |
| `src/components/kanban-board.tsx` | `KanbanBoard`, `resolveDragOutcome`, types `DragColumns`, `DragOutcome` |
| `src/components/kanban-column.tsx` | `KanbanColumn`, `columnDroppableId`, `COLUMN_WIDTH` |
| `src/components/task-card.tsx` | `TaskCard` |
| `src/components/task-dashboard.tsx` | `TaskDashboard` |
| `src/theme.ts` | `theme` |
| `src/theme-registry.tsx` | `ThemeRegistry` |
| `src/app/layout.tsx` | `RootLayout` (default), `metadata` |
| `src/app/page.tsx` | `HomePage` (default) |

## Code Patterns

- Client components marked `"use client"`; server layout and page remain server components.
- Module-level external store plus `useSyncExternalStore` (`subscribe`, `getSnapshot`, `getServerSnapshot`).
- Immutable updates via `setTasks(updater)`; identity-equal results skip writes.
- Pure helpers exported for testing (`resolveDragOutcome`).
- Record-typed lookup tables for labels and styles (`STATUS_LABELS`, `priorityStyle`, `nextStatus`).
- Styling through MUI `sx` props; `data-testid` attributes on board elements for tests.
- `@/*` path alias for internal imports; kebab-case file names, PascalCase components, camelCase functions.
- No code comments anywhere (project rule); Prettier: 2-space, double quotes, no trailing commas.

## Classification Summary

- Model: 1 (`task.ts`)
- Repository: 1 (`task-storage.ts`)
- Service/State: 1 (`use-tasks.ts`)
- UI components: 4
- Configuration: `theme.ts`, `theme-registry.tsx`, `layout.tsx`, `page.tsx`, config files
- Test: 6 files, 41 cases
- Static: `globals.css`

## Circular References

None found. Dependency direction is strictly `types -> lib -> hooks -> components -> app`.
