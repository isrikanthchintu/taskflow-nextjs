# Cross-Unit Traceability

Verdict: **FAIL**. Two requirement IDs are not fully covered (FR5.5 and NFR5), so this is surfaced at the approval gate.

Source: `aidlc engine sensor-traceability --stage build-and-test`. This is zero-Unit work, so every row is owned by the single Code Generation stage (`construction/code-generation/`), not by a Unit.

## Uncovered Elements

| ID | Why uncovered |
|----|---------------|
| FR5.5 | Recorded as a GAP in Code Generation: the saved theme applies to the page background before first paint, but component colors briefly use the system mode, so a wrong-theme flash can show once on reload |
| NFR5 | Deferred: browser compatibility needs Chrome, Edge and Firefox runs; the tests run in jsdom only |

## Per-ID Coverage

| ID | Covered | Owning stage | Target file |
|----|---------|--------------|-------------|
| FR1.1 | yes | code-generation | src/lib/board-storage.ts |
| FR1.2 | yes | code-generation | src/lib/board-storage.ts |
| FR1.3 | yes | code-generation | src/lib/board-schema.ts |
| FR1.4 | yes | code-generation | src/lib/board-storage.ts |
| FR1.5 | yes | code-generation | src/lib/board-ops.ts |
| FR2.1 | yes | code-generation | src/lib/board-ops.ts |
| FR2.2 | yes | code-generation | src/lib/board-ops.ts |
| FR2.3 | yes | code-generation | src/components/kanban-board.tsx |
| FR2.4 | yes | code-generation | src/components/archive-view.tsx |
| FR2.5 | yes | code-generation | src/components/archive-view.tsx |
| FR2.6 | yes | code-generation | src/components/kanban-board.tsx |
| FR3.1 | yes | code-generation | src/components/card-dialog.tsx |
| FR3.2 | yes | code-generation | src/components/card-dialog.tsx |
| FR3.3 | yes | code-generation | src/lib/board-query.ts |
| FR3.4 | yes | code-generation | src/components/card-dialog.tsx |
| FR3.5 | yes | code-generation | src/components/task-card.tsx |
| FR4.1 | yes | code-generation | src/components/filter-panel.tsx |
| FR4.2 | yes | code-generation | src/lib/board-query.ts |
| FR4.3 | yes | code-generation | src/lib/board-query.ts |
| FR4.4 | yes | code-generation | src/components/kanban-column.tsx |
| FR5.1 | yes | code-generation | src/components/settings-page.tsx |
| FR5.2 | yes | code-generation | src/lib/theme-presets.ts |
| FR5.3 | yes | code-generation | src/components/settings-page.tsx |
| FR5.4 | yes | code-generation | src/theme.ts |
| FR5.5 | no | code-generation | src/app/layout.tsx (gap) |
| FR6.1 | yes | code-generation | src/components/archive-view.tsx |
| FR6.2 | yes | code-generation | src/components/undo-snackbar.tsx |
| FR6.3 | yes | code-generation | src/lib/board-ops.ts |
| FR6.4 | yes | code-generation | src/components/card-dialog.tsx |
| FR7.1 | yes | code-generation | src/components/boards-menu.tsx |
| FR7.2 | yes | code-generation | src/hooks/use-board.ts |
| FR7.3 | yes | code-generation | src/lib/board-ops.ts |
| FR7.4 | yes | code-generation | src/components/boards-menu.tsx |
| FR8.1 | yes | code-generation | src/lib/board-transfer.ts |
| FR8.2 | yes | code-generation | src/lib/board-transfer.ts |
| FR8.3 | yes | code-generation | src/lib/board-transfer.ts |
| FR8.4 | yes | code-generation | src/lib/board-transfer.ts |
| FR9.1 | yes | code-generation | src/components/command-menu.tsx |
| FR9.2 | yes | code-generation | src/components/shortcut-help.tsx |
| FR9.3 | yes | code-generation | src/hooks/use-hotkeys.ts |
| FR10.1 | yes | code-generation | src/components/kanban-column.tsx |
| FR10.2 | yes | code-generation | src/components/swimlane-view.tsx |
| FR11.1 | yes | code-generation | src/components/rules-dialog.tsx |
| FR11.2 | yes | code-generation | src/lib/board-rules.ts |
| FR11.3 | yes | code-generation | src/lib/board-rules.ts |
| NFR1 | yes | code-generation | src/lib/board-storage.ts |
| NFR2 | yes (logic only; screen timing Unverified, see T10) | code-generation | src/lib/board-ops.test.ts |
| NFR3 | yes (contrast and keyboard; scanner, screen reader and zoom Unverified, see T9) | code-generation | src/components/accessibility.test.tsx |
| NFR4 | yes | code-generation | src/hooks/use-board.ts |
| NFR5 | no | code-generation | none (deferred, see above) |
