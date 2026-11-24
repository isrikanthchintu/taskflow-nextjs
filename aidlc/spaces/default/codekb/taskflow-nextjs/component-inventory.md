# Component Inventory

## TaskDashboard

- **File**: `src/components/task-dashboard.tsx` (404 lines, plus internal `StatPill`)
- **Responsibility**: Page shell with top bar (logo, search, "New task", avatar), "My Tasks" heading, summary pills, loading state, `KanbanBoard`, and the create/edit task dialog (MUI `Dialog`). Owns search query and form state.
- **Depends on**: `useTasks` (`tasks`, `isReady`, `addTask`, `updateTask`), `KanbanBoard`, MUI, lucide-react, `Task` types.

## KanbanBoard

- **File**: `src/components/kanban-board.tsx`
- **Responsibility**: `DndContext` with `PointerSensor` (distance 4) and `KeyboardSensor`; derives full and visible columns and unfiltered counts; resolves drops via `resolveDragOutcome`; renders three `KanbanColumn` and a `DragOverlay`.
- **Depends on**: `useTasks` (`moveTask`, `reorderTask`), `KanbanColumn`, `columnDroppableId`, `@dnd-kit/core`, `@dnd-kit/sortable`, MUI.

## KanbanColumn

- **File**: `src/components/kanban-column.tsx`
- **Responsibility**: One status column: header with label and count, droppable body with `SortableContext`, empty-state text "No matching cards", optional "Add a card" button. Highlights when a drag is over it.
- **Depends on**: `TaskCard`, `useDroppable`, `SortableContext`, MUI, lucide-react.

## TaskCard

- **File**: `src/components/task-card.tsx`
- **Responsibility**: Sortable card showing priority badge, title (struck through when done), clamped description, due date, drag handle, status cycle control, and delete control. Card click opens edit; controls marked `data-no-edit`.
- **Depends on**: `useTasks` (`deleteTask`, `moveTask`), `useSortable`, MUI and MUI icons.

## useTasks

- **File**: `src/hooks/use-tasks.ts`
- **Responsibility**: Module-level external task store with seeding, load-once, and mutation actions; persists through `task-storage`.
- **Depends on**: `readTasks`, `writeTasks`, `Task` types, React `useSyncExternalStore`, `useEffect`.

## task-storage

- **File**: `src/lib/task-storage.ts`
- **Responsibility**: SSR-safe `localStorage` read and write of the task array under `taskflow.tasks.v1`.
- **Depends on**: `Task` type.

## Task types

- **File**: `src/types/task.ts`
- **Responsibility**: `Task`, `TaskStatus`, `TaskPriority`.
- **Depends on**: nothing.

## ThemeRegistry

- **File**: `src/theme-registry.tsx`
- **Responsibility**: Client wrapper providing `AppRouterCacheProvider`, `ThemeProvider`, and `CssBaseline`.
- **Depends on**: `theme`, `@mui/material-nextjs`.

## theme

- **File**: `src/theme.ts`
- **Responsibility**: MUI theme: Trello-blue palette, shape, typography, button, paper, chip, dialog defaults.
- **Depends on**: `@mui/material/styles`.

## RootLayout and HomePage

- **Files**: `src/app/layout.tsx`, `src/app/page.tsx`
- **Responsibility**: HTML shell, metadata, global CSS import, theme wrapper; the single route rendering `TaskDashboard`.
- **Depends on**: `ThemeRegistry`, `TaskDashboard`, `globals.css`.

## Test Suites

| File | Cases |
|---|---|
| `src/components/kanban-board.test.tsx` | 10 |
| `src/components/kanban-column.test.tsx` | 4 |
| `src/components/task-card.test.tsx` | 6 |
| `src/components/task-dashboard.test.tsx` | 7 |
| `src/hooks/use-tasks.test.ts` | 9 |
| `src/lib/task-storage.test.ts` | 5 |
