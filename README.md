# TaskFlow — Next.js + TypeScript sample app

A responsive task-management dashboard built with the Next.js App Router. It is intentionally backend-free: tasks are stored in the browser's `localStorage`.

## Features

- Dashboard summary for total, to-do, in-progress, and completed tasks
- Create tasks with description, priority, and due date
- Move tasks through the status flow by clicking the circular status control
- Delete tasks
- Search by task title or description
- Filter by task status
- Responsive layout for desktop and mobile
- TypeScript types and reusable task hook

## Repository layout

```text
frontend/   Next.js app (UI, localStorage mode, optional API mode)
backend/    NestJS + MongoDB REST API (see backend/README.md)
```

Run all frontend commands from the `frontend/` folder.

## Requirements

- Node.js 20.9 or later
- pnpm (`npm install -g pnpm`, or `corepack enable`)

## Run in VS Code

1. Extract the ZIP file.
2. Open the `taskflow-nextjs` folder in VS Code (`File → Open Folder`).
3. Open the integrated terminal (`Terminal → New Terminal`).
4. Install dependencies:

   ```bash
   cd frontend
   pnpm install
   ```

5. Start the development server:

   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

## Useful commands

```bash
pnpm dev       # Start local development
pnpm typecheck # Run TypeScript checks
pnpm lint      # Run ESLint
pnpm build     # Create a production build
pnpm start     # Run the production build
```

## Project structure

```text
frontend/src/
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
```

## How persistence works

`useTasks` loads the task collection from `localStorage` after the component mounts. Changes are written back automatically. The first launch seeds a small set of example tasks.

This is suitable for a learning project or local prototype. `localStorage` is specific to the browser and device, can be cleared by the user, and is not shared across users or devices. It is not a secure database. For a production multi-user application, replace the storage module with an authenticated API and database.

## Next development steps

1. Add edit-task support and task detail view.
2. Add unit and component tests.
3. Add authentication and a backend when multi-device sync is needed.
4. Integrate the AWS AI-DLC workflow overlay from the separate setup package.
