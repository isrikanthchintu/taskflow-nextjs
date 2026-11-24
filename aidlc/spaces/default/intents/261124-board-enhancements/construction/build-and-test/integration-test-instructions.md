# Integration Test Instructions

Standard strategy: integration tests cover the key boundaries. All of them run in Node with the jsdom DOM emulator, never in a real browser, so they are integration evidence and not end-to-end evidence.

## Boundaries Covered

| Boundary | Test file | What it exercises |
|----------|-----------|-------------------|
| Storage with the store | `src/hooks/use-board.test.ts` | Load, convert old data, mutate, persist, undo, cross-tab `storage` event, failed save |
| Store with the dashboard | `src/components/task-dashboard.test.tsx` | Create, move, delete, search and edit cards through the real store and localStorage |
| Whole success scenario | `src/components/accessibility.test.tsx` | Keyboard-only run: create a board, add and rename lists, add a card with a label, checklist and due date, move it, filter, change the theme, reload |
| Import and export with the store | `src/components/import-export-dialog.test.tsx`, `src/lib/board-transfer.test.ts` | Export a board, import it as a new board, reject invalid files |
| Settings with the theme | `src/components/settings-page.test.tsx` | Theme choices persist across a remount |

## How to Run

```
pnpm jest src/hooks/use-board.test.ts src/components/task-dashboard.test.tsx src/components/accessibility.test.tsx src/components/import-export-dialog.test.tsx src/components/settings-page.test.tsx
```

## Environment and Data

- jsdom provides `localStorage`; each test clears it first and builds boards with the factories in `src/lib/board-schema.ts` and `src/test-utils.tsx`.
- Fake timers drive the 10-second undo and due-date tests; "today" is fixed with a mocked clock.
- No network, database or server is involved.

## Not Covered Here (needs a real browser)

- Native download of an exported file, drag and drop with a real pointer, and the first-paint theme (the FR5.5 gap) behave differently in a real browser engine. Run these by hand in Chrome, Edge and Firefox, or add a Playwright run, before treating them as verified.
