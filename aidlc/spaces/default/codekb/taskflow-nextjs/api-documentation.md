# API Documentation

## External API Surface

**None.** The application has no server-side API routes, no `app/api/` directory, no Route Handlers, no Server Actions (`"use server"`), and no outbound network calls to any external service. This is a fully client-side, backend-free application — confirmed by a full scan of `src/app/` (only `layout.tsx`, `page.tsx`, and `globals.css` exist there) and by the absence of `fetch`/`axios`/any HTTP client in the dependency list or source.

The only route in the app is the implicit Next.js App Router root route:

| Route | File | Description |
|---|---|---|
| `GET /` | `src/app/page.tsx` | Renders `TaskDashboard`; the entire application UI lives behind this one route |

## Internal API Surface (module-level contracts)

Since there is no network boundary, the meaningful "API" of this codebase is the set of exported functions/hooks that form the contract between layers.

### `src/lib/task-storage.ts` — persistence boundary

```ts
function readTasks(): Task[]
```
- **Behavior**: Returns `[]` immediately if called during SSR (`typeof window === "undefined"`). Otherwise reads `localStorage.getItem("taskflow.tasks.v1")`, `JSON.parse`s it, and returns the result only if it is an array; returns `[]` on missing key, parse error, or non-array value.
- **Errors**: Never throws — all failure paths (missing key, malformed JSON, wrong shape) are caught and normalized to `[]`.
- **Auth/Rate limiting**: Not applicable (no network, no auth).

```ts
function writeTasks(tasks: Task[]): void
```
- **Behavior**: No-ops during SSR. Otherwise serializes `tasks` with `JSON.stringify` and calls `localStorage.setItem("taskflow.tasks.v1", ...)`.
- **Errors**: Wrapped in try/catch; failures (e.g., quota exceeded, serialization error) are logged via `console.error` and swallowed — the function never throws and callers get no failure signal.
- **Auth/Rate limiting**: Not applicable.

### `src/hooks/use-tasks.ts` — the application's de facto data API

```ts
function useTasks(): {
  tasks: Task[];
  isReady: boolean;
  addTask(input: Pick<Task, "title" | "description" | "priority" | "dueDate">): void;
  updateTask(id: string, updates: Partial<Omit<Task, "id" | "createdAt">>): void;
  deleteTask(id: string): void;
  setStatus(id: string, status: TaskStatus): void;
}
```
- **`tasks`**: Current in-memory task list (synced to `localStorage` by the hook's internal effect).
- **`isReady`**: `false` until the initial `readTasks()`/seed resolves in a `useEffect` after mount; the UI uses this to show a loading state and to avoid persisting before the initial load completes.
- **`addTask(input)`**: Builds a full `Task` by assigning `id: crypto.randomUUID()`, `status: "todo"`, and `createdAt: new Date().toISOString()` around the caller-supplied `title`/`description`/`priority`/`dueDate`, then prepends it to `tasks`. No validation is performed inside the hook (the caller, `TaskDashboard`, trims and checks `title` before calling).
- **`updateTask(id, updates)`**: Merges `updates` into the task matching `id` (shallow object spread); no-ops (silently) if `id` is not found. Exported but **not currently called from `TaskDashboard`** — no edit-task UI exists yet.
- **`deleteTask(id)`**: Removes the task matching `id` from `tasks`.
- **`setStatus(id, status)`**: Convenience wrapper calling `updateTask(id, { status })`.
- **Errors**: None of these functions validate or throw; invalid `id` values are simply no-ops (filter/map find nothing to change).
- **Auth/Rate limiting**: Not applicable — this is in-process React state, not a network call.

### `src/types/task.ts` — shared data contract

```ts
type TaskStatus = "todo" | "in-progress" | "done";
type TaskPriority = "low" | "medium" | "high";

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;   // "YYYY-MM-DD" or "" (empty string) if unset
  createdAt: string; // ISO-8601 timestamp
}
```
This is the single canonical shape persisted to `localStorage` (as a JSON array of these objects) and passed between every layer of the app.

## Summary

There is no REST, GraphQL, gRPC, or other network-facing contract to document for this application in its current form. The "API" that matters for any future evolution is the `useTasks()` hook contract and the `readTasks`/`writeTasks` persistence functions — these are the seams a later architecture stage would use to introduce a real backend without rewriting the UI layer.
