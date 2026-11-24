# API Documentation

## External APIs

None. The application exposes no HTTP, REST, GraphQL, gRPC, route-handler, or server-action surface, and calls no external service. Only one route exists, `/` (`src/app/page.tsx`).

## Persistent Data Contract

- Storage: browser `window.localStorage`
- Key: `taskflow.tasks.v1`
- Value: JSON array of `Task`

```ts
type TaskStatus = "todo" | "in-progress" | "done";
type TaskPriority = "low" | "medium" | "high";
interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdAt: string;
}
```

`dueDate` is an HTML date string (`YYYY-MM-DD`) or empty; `createdAt` is an ISO timestamp. Array order is the display order within each status.

## Internal Module API

### `src/lib/task-storage.ts`

- `readTasks(): Task[]` - returns `[]` on the server, when empty, on invalid JSON, or when the parsed value is not an array. No per-item validation.
- `writeTasks(tasks: Task[]): void` - no-op on the server; `console.error` if `setItem` throws.

### `src/hooks/use-tasks.ts` - `useTasks()`

Returns `{ tasks, isReady, addTask, updateTask, deleteTask, setStatus, moveTask, reorderTask }`.

| Member | Signature | Behaviour |
|---|---|---|
| `tasks` | `Task[]` | Shared snapshot; empty until ready |
| `isReady` | `boolean` | True after first load from storage |
| `addTask` | `(input: Pick<Task,"title"\|"description"\|"priority"\|"dueDate"> & { status?: TaskStatus }) => void` | Prepends task with `crypto.randomUUID()` id, default status `todo`, `createdAt` now |
| `updateTask` | `(id, updates: Partial<Omit<Task,"id"\|"createdAt">>) => void` | Merges fields |
| `deleteTask` | `(id) => void` | Removes task |
| `setStatus` | `(id, status) => void` | Changes status in place |
| `moveTask` | `(id, status) => void` | Changes status and re-inserts after the last task of the target status; no-op if same status |
| `reorderTask` | `(id, newIndex) => void` | Reorders within the task's status group; index clamped; other statuses keep positions |

Every mutation writes to storage only once `isReady`.

### `src/components/kanban-board.tsx`

- `resolveDragOutcome({ activeId, overId, sourceStatus, fullColumns, visibleColumns }): DragOutcome` where `DragOutcome` is `{kind:"move",id,status} | {kind:"reorder",id,newIndex} | {kind:"none"}`.
- `DragColumns = Record<TaskStatus, string[]>`.

### `src/components/kanban-column.tsx`

- `columnDroppableId(status): string` returns `column-<status>`.
- `COLUMN_WIDTH = 284`.

## Component Props

- `KanbanBoard({ tasks, searchQuery, onEditTask, onAddCard? })`
- `KanbanColumn({ status, label, count, tasks, onEditTask, onAddCard? })`
- `TaskCard({ task, onEditTask })`

## Test Hooks (data-testid)

`kanban-column-<status>`, `kanban-column-<status>-count`, `task-card-<id>`, `task-card-<id>-drag-handle`, `task-card-<id>-cycle`, `task-card-<id>-delete`.

## Authentication, Rate Limiting

Not applicable.
