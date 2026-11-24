# Unit Test Instructions

## Test Framework

Jest with `ts-jest`-style Next.js setup already in the project (`jest.config.ts`, `jest.setup.ts`) and Testing Library with `@testing-library/user-event`. No new test dependency is added. Tests use jsdom `localStorage`, never a database or server, as the team practice requires.

## Strategy

Standard test strategy, test-after: implement each layer, then write and run its tests. Five to eight tests per component or module, plus integration tests at the key boundaries (storage with the hook, hook with the dashboard). No coverage floor applies (team practices); existing and new tests stay green.

## Commands

Every command lists exact files for this build; none runs the whole project suite. Build and Test runs the full suite once at the end.

Runner check (step 2):

```
pnpm jest src/lib/task-storage.test.ts
```

Data model and storage (steps 5 and 7):

```
pnpm jest src/lib/board-schema.test.ts src/lib/board-storage.test.ts
```

Business logic (step 13):

```
pnpm jest src/lib/board-ops.test.ts src/lib/board-query.test.ts src/lib/board-rules.test.ts src/lib/board-transfer.test.ts src/lib/theme-presets.test.ts
```

Hook (step 15):

```
pnpm jest src/hooks/use-board.test.ts
```

Release 1 components (step 22):

```
pnpm jest src/components/kanban-board.test.tsx src/components/kanban-column.test.tsx src/components/task-card.test.tsx src/components/task-dashboard.test.tsx src/components/card-dialog.test.tsx src/components/filter-panel.test.tsx src/components/list-menu.test.tsx src/components/banner-stack.test.tsx src/components/top-bar.test.tsx src/components/settings-page.test.tsx src/components/archive-view.test.tsx
```

Release 2 (step 24):

```
pnpm jest src/components/boards-menu.test.tsx src/components/import-export-dialog.test.tsx src/components/command-menu.test.tsx src/components/shortcut-help.test.tsx src/hooks/use-hotkeys.test.ts
```

Release 3 (step 26):

```
pnpm jest src/components/swimlane-view.test.tsx src/components/rules-dialog.test.tsx src/components/kanban-column.test.tsx
```

## Required Cases (by area)

- **Storage:** v1 converted once with order and fields kept; second load does not duplicate; v2 wins over v1; damaged data is left untouched and writes are refused; a quota error keeps earlier data; no `window` means no crash.
- **Board logic:** blank names refused; list and card limits refused with the limit named; archive and restore keep order; duplicate adds " (copy)" and clears checks; due state at yesterday, today, tomorrow and with a done list; sort tie-break is stable; a card with two labels appears under both groups; import never overwrites and rejects invalid files.
- **Rules:** a rule's action never triggers another rule; a rule pointing at an archived list is broken and does nothing.
- **Hook:** mutations persist; undo works within 10 seconds and ends on board switch; a `storage` event refreshes the data and sets the notice.
- **Components:** keyboard-only paths for the success scenario; empty states differ for "no cards yet" and "no matching cards"; delete confirmations name the count; theme choices persist across a remount.
- **Contrast:** every accent and background text pair meets 4.5 to 1.

## Mocking and Data

Use fake timers for the 10-second undo and the due-date tests; fix "today" with a mocked clock. Build test boards with factory helpers from `src/lib/board-schema.ts`. Clear `localStorage` in `beforeEach`. Do not mock `localStorage` away; the tests exercise the real persistence path.

## Expected Coverage Targets

No project-wide line-coverage floor (team practice, affirmed as lighter than the framework default). Every FR and NFR in requirements.md has at least one test that names its ID in the test title, so traceability can point to a test file.
