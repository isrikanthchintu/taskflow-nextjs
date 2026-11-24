# Code Generation Plan

## Summary

- Builds: custom lists, richer cards, filters and sort, theme settings, archive and templates, several boards, export and import, shortcuts, list limits, swimlanes and rules, all in the existing browser-only app
- Touches: `src/types`, `src/lib` (storage, board logic, theme presets), `src/hooks`, `src/components`, `src/app` (new `/settings` and `/archive` pages), `src/theme.ts`
- Tests: about 25 new and updated test files, roughly 150 tests (Standard strategy, 5 to 8 per component), run with `pnpm jest <exact files>`
- Adds: 1 data-model element no requirement asks for, `List.done`; see Assumptions

## Scope of This Build

All three releases from scope-document.md are planned, in dependency order: Release 1 (steps 3 to 19), Release 2 (steps 20 and 21), Release 3 (steps 22 and 23). Steps are grouped by release so you can ask to build only Release 1 now and the rest later; say so at the approval question and I will cut steps 20 to 23. No new package is added: the command menu, shortcuts and board logic are built with the existing Material UI and plain TypeScript (market-research Q3 chose libraries "when they fit"; none is needed).

Requirement IDs are from requirements.md. Rules from `aidlc/spaces/default/memory` apply: TypeScript strict, `@/` imports, no code comments, an SSR check before any `window` or `localStorage` use, localStorage as the only data store, Prettier before done.

## Testing Contract

```json
{
  "version": 1,
  "methodology": "test-after",
  "source": "team",
  "ordering": "implement each applicable testable layer (storage, hook, component), then write and run that layer's tests once the piece works, matching how the existing application was built.",
  "scope": "bugfix",
  "test_strategy": "standard",
  "project_type": "brownfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop`, `classic` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    },
    {
      "layer": "team",
      "text": "- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer (storage, hook,\n  component), then write and run that layer's tests once the piece works,\n  matching how the existing application was built.\n- **Coverage**: no strict coverage target — new and existing tests must\n  stay green, but there is no 80% line-coverage floor for this project.\n  This is intentionally lighter than the org-level default for `mvp`/\n  `enterprise`/`feature`/`infra` scopes, affirmed given the project's\n  prototype/demo framing (Q4).\n- Any new tests introduced through AI-DLC work must exercise the\n  localStorage-backed persistence path (`src/lib/task-storage.ts`,\n  `src/hooks/use-tasks.ts`, key `\"taskflow.tasks.v1\"`) rather than assume a\n  database or API layer exists — none does today."
    }
  ],
  "obligations": {
    "strategy": "standard",
    "strategy_volume": [
      "Five to eight tests per component.",
      "Unit tests plus integration tests for key boundaries.",
      "Add E2E, performance, or security tests when requirements demand them."
    ],
    "scope_floor": [
      "Include a targeted regression for the bug or vulnerability.",
      "Keep the existing test suite green."
    ],
    "combination_rule": "Apply every selected-strategy obligation and every scope-floor obligation; neither replaces the other, and a targeted scope regression may add the narrowest necessary test type beyond the strategy default."
  },
  "plan_profile": {
    "methodology": "test-after",
    "runner_step": "Verify the existing test runner/configuration and record the exact unit-scoped command.",
    "runner_ready_before_first_test": true,
    "testable_layers": [
      "Data model / database behavior",
      "Repository / data access",
      "Business logic",
      "API / endpoint",
      "Frontend behavior"
    ],
    "steps": [
      "Project structure and production configuration skeleton.",
      "Verify the existing test runner/configuration and record the exact unit-scoped command.",
      "Data model / database behavior - implement.",
      "Data model / database behavior - write and run its tests after implementation.",
      "Repository / data access - implement.",
      "Repository / data access - write and run its tests after implementation.",
      "Business logic - implement.",
      "Business logic - write and run its tests after implementation.",
      "API / endpoint - implement.",
      "API / endpoint - write and run its tests after implementation.",
      "Frontend behavior - implement.",
      "Frontend behavior - write and run its tests after implementation.",
      "Environment/build configuration.",
      "Documentation and traceability."
    ]
  },
  "input_sha256": "sha256:9870c3e3880d9fb0e92e7132699df06e2deec1a933e2d8e05c716a23383dbf1a",
  "contract_sha256": "sha256:96bad4b4eda0e01823194b140cc62a38ecf77d386d2acbddafc723d1c21bf83a"
}
```

## Assumptions

- `List.done` (boolean) is added in step 3. Requirements FR3.3 needs a designated "done" list to stop overdue showing on finished cards, but no requirement names a field for it. The migrated "Completed" list is flagged done; any other list defaults to not done; the list menu offers "Mark as done list"; with none flagged, overdue is never suppressed.

## Decisions Where Requirements Are Silent

These come from the review of requirements.md and the design review. They are choices made in the plan for you to accept or change when you approve it.

- The old `taskflow.tasks.v1` key is read once and never deleted or changed. The new key `taskflow.data.v2` is written only when it is absent. If both exist, v2 wins and v1 is ignored, so a second load or second tab cannot duplicate cards (answers the open question on FR1.2).
- Card limit (200) counts active cards across all boards; archived cards and templates do not count. List limit (10) counts active lists on a board. Board limit (5) counts active boards and applies from the first release, although only one board exists until Release 2.
- While a sort or group is on, reordering cards inside a list is off; moving a card to another list still works.
- Filters, sort and group live in memory only and reset on reload. Theme, boards, lists and cards are saved.
- When stored data is unreadable, the app shows the FR1.3 message and keeps saving switched off so the stored data is never overwritten. It adds no download button and no help link.
- A second tab is told with an "Updated in another tab" status message when the other tab saves; the data re-read replaces the screen, and the last tab to save wins for the whole data.
- "Due soon" means due today or tomorrow, undo lasts 10 seconds and ends on reload or board switch, and count pills show Total plus one pill per active list (assumptions A1, A2 and the design).
- Rules run only on user actions; a rule's own action never runs another rule (FR11.2).

## Steps

### Project structure and configuration

- [x] Step 1: Create the folders and routes the build needs: `src/app/settings/page.tsx`, `src/app/archive/page.tsx`. Make no change to `package.json`, `tsconfig.json`, `jest.config.ts` or the lint and Prettier configs. (FR5, FR2.4, FR6.1)
- [x] Step 2: Verify the existing Jest setup runs (`jest.config.ts`, `jest.setup.ts`) and record the exact unit-scoped command in `unit-test-instructions.md`. (Testing Contract: runner readiness)

### Data model (Release 1 foundation)

- [x] Step 3: Add `src/types/board.ts` with these named types, each tied to a requirement:
  - `AppData` { `version`, `activeBoardId`, `boards`, `settings` } (FR1.1, FR7.2)
  - `Board` { `id`, `name`, `backgroundId`, `lists`, `cards`, `labels`, `templates`, `rules`, `archived`, `createdAt` } (FR7.3, FR5.3, FR7.4)
  - `List` { `id`, `name`, `done`, `limit`, `archived` } (FR2.1 to FR2.4, FR10.1; `done` per Assumptions)
  - `Card` { `id`, `listId`, `title`, `description`, `priority`, `dueDate`, `labelIds`, `checklists`, `archived`, `createdAt` }, keeping the existing `Task` fields (FR3.4, FR6.1)
  - `Label` { `id`, `name`, `color` } (FR3.1)
  - `Checklist` { `id`, `title`, `items` } and `ChecklistItem` { `id`, `text`, `checked` } (FR3.2)
  - `CardTemplate` { `id`, `title`, `description`, `priority`, `labelIds`, `checklists` } (FR6.4)
  - `Rule` { `id`, `name`, `enabled`, `trigger`, `action` } with trigger kinds `card-enters-list` and `checklist-complete` and action kinds `move-to-list`, `add-label`, `set-priority` (FR11.1)
  - `Settings` { `mode`, `accentId`, `density`, `corners` } (FR5.1, FR5.2, FR5.4)
  - The existing `src/types/task.ts` stays as the v1 shape the converter reads.
- [x] Step 4: Add `src/lib/board-schema.ts` with `createDefaultData`, `validateAppData` and `emptyBoard`; it checks shape and returns a typed result or a reason. (FR1.3, FR1.1)
- [x] Step 5: Write and run `src/lib/board-schema.test.ts` (factories, valid and invalid shapes, defaults, label and checklist shapes). (FR1.3)

### Storage (repository layer)

- [x] Step 6: Add `src/lib/board-storage.ts` with `readAppData`, `writeAppData`, `convertV1`, each with the SSR check, using key `taskflow.data.v2`. `readAppData` returns `ok`, `missing`, or `unreadable`; v1 is converted once into a default board with To do, In progress and Completed (Completed flagged done) keeping order and fields; v2 present means v1 is not read; `writeAppData` returns `ok`, `full` or `unavailable` and never clears earlier data on failure; it refuses to write while the state is `unreadable`. (FR1.1, FR1.2, FR1.3, FR1.4, NFR4)
- [x] Step 7: Write and run `src/lib/board-storage.test.ts` against jsdom localStorage: migration order and fields, idempotent second load, v2 wins over v1, damaged JSON is not overwritten, quota error keeps earlier data, SSR path with no `window`. (FR1.2, FR1.3, FR1.4)

### Business logic

- [x] Step 8: Add `src/lib/board-ops.ts`: pure functions for lists (add, rename, reorder, set limit, set done, archive and restore, delete archived), cards (add, update, move, reorder, archive and restore, duplicate, delete), labels, checklists and items, templates (save, create card from, delete), boards (create, rename, archive, restore, delete archived, switch), and `checkLimits` for 5 boards, 10 lists, 200 cards with a 90% warning flag. Blank names are refused; duplicate copy gets " (copy)" and unchecked items. (FR1.5, FR2.1 to FR2.6, FR3.1 to FR3.4, FR6.1 to FR6.4, FR7.1 to FR7.4)
- [x] Step 9: Add `src/lib/board-query.ts`: `dueState` (overdue, due soon, none, using the browser time zone and the done-list rule), `filterCards` (text, label, priority, due state, combined), `sortCards` (due date, priority, created, stable tie-break by created time then id), `groupCards` (by priority, label with multi-label and "No label", due state), `swimlanes`, and `listCounts`. (FR3.3, FR4.1 to FR4.4, FR10.2)
- [x] Step 10: Add `src/lib/board-rules.ts`: `runRules(board, event)` runs enabled rules for a user action, never re-runs rules for a rule's own action, and marks a rule broken when its list or label is missing or archived. (FR11.1 to FR11.3)
- [x] Step 11: Add `src/lib/board-transfer.ts`: `exportBoard` (single JSON with a format version) and `importBoard` (validates, always adds a new board named with " (imported)" on a name clash, rejects invalid or newer-version files with a plain message, respects limits, keeps text as plain text). (FR8.1 to FR8.4)
- [x] Step 12: Add `src/lib/theme-presets.ts`: six accent presets, eight board backgrounds (four solid, four gradient, default the current blue gradient), light and dark palettes, density and corner tokens, and `contrastRatio`. (FR5.1 to FR5.4, NFR3)
- [x] Step 13: Write and run `src/lib/board-ops.test.ts`, `src/lib/board-query.test.ts`, `src/lib/board-rules.test.ts`, `src/lib/board-transfer.test.ts` and `src/lib/theme-presets.test.ts`. The presets test computes the contrast ratio of every accent and background text pair and fails below 4.5 to 1, so NFR3's contrast target is checked by a test, not claimed. (FR1.5, FR2 to FR4, FR6, FR8, FR10.2, FR11, NFR3)

### Store and hook

- [x] Step 14: Add `src/hooks/use-board.ts`, an external store with `useSyncExternalStore` like the current `use-tasks.ts`, holding `AppData`, exposing the Step 8 operations, applying rules after user actions, keeping a 10-second undo entry that ends on reload or board switch, re-reading on the browser `storage` event and setting an "Updated in another tab" notice, and exposing `saveError` and `dataError`. It replaces `use-tasks.ts`; `src/hooks/use-tasks.ts` and its test are removed after their cases are ported. (FR1.1, FR6.2, FR7.2, FR11.2, NFR4)
- [x] Step 15: Write and run `src/hooks/use-board.test.ts` (load and migrate, mutate and persist, undo within and after 10 seconds, undo ends on board switch, two-tab update through a `storage` event, save failure keeps earlier data, rules do not loop) and port the cases from `src/hooks/use-tasks.test.ts`. (FR1, FR6.2, NFR4)

### Frontend (Release 1)

- [x] Step 16: Update `src/theme.ts` to `createAppTheme(settings)` and `src/theme-registry.tsx` to apply mode, accent, density and corners, with the saved theme applied before first paint (a small server-safe inline step in `src/app/layout.tsx` so there is no light-theme flash). (FR5.1 to FR5.5)
- [x] Step 17: Update `src/components/kanban-board.tsx` and `src/components/kanban-column.tsx` for custom lists, list reorder (drag and the Move left and Move right menu items), list count and menu, the "Add a list" tile, the empty-board state, sorted and grouped display with in-list drag off, and the existing `resolveDragOutcome` kept for cards. Add `src/components/list-menu.tsx`. (FR2.1 to FR2.3, FR2.6, FR4.2 to FR4.4)
- [x] Step 18: Update `src/components/task-card.tsx` for labels by name, checklist progress, due-state chip in words, and keep the existing controls and accessible names. Add `src/components/card-dialog.tsx` (replaces the edit dialog: fields, labels and a label manager to create, rename, recolor and delete labels, checklists with add, rename, check, reorder (with keyboard) and delete, template picker, duplicate, save as template, archive, delete). (FR3.1 to FR3.5, FR6.3, FR6.4)
- [x] Step 19: Add `src/components/filter-panel.tsx` (filters, sort, group; Filter button with the active count), `src/components/banner-stack.tsx` (unreadable data, failed save, 90% and 100% limit notices, "Updated in another tab"), `src/components/undo-snackbar.tsx`, `src/components/confirm-dialog.tsx` (names the count; default focus on Cancel). (FR1.3 to FR1.5, FR2.5, FR4.1, FR6.2, NFR4)
- [x] Step 20: Slim `src/components/task-dashboard.tsx` to compose the pieces; add `src/components/top-bar.tsx` (logo, board name, search, Filter, New task, gear, avatar) and the count pills per active list. Update the default route in `src/app/page.tsx` only if needed. (FR1, FR4.1)
- [x] Step 21: Add `src/components/settings-page.tsx` and `src/app/settings/page.tsx` (appearance groups, per-board background for the open board, live preview, "Back to board"). Add `src/components/archive-view.tsx` and `src/app/archive/page.tsx` (Lists, Cards tabs; Restore; Delete permanently with confirmation naming the count). (FR2.4, FR2.5, FR5.1 to FR5.5, FR6.1)
- [x] Step 22: Write and run the Release 1 component tests: `src/components/kanban-board.test.tsx`, `kanban-column.test.tsx`, `task-card.test.tsx`, `task-dashboard.test.tsx` (updated to the new store and behavior; the existing cases for create, status cycle, delete, search and edit stay as cases), and new `card-dialog.test.tsx`, `filter-panel.test.tsx`, `list-menu.test.tsx`, `banner-stack.test.tsx`, `top-bar.test.tsx`, `settings-page.test.tsx`, `archive-view.test.tsx`. (FR1 to FR6, NFR3)

### Frontend (Release 2)

- [x] Step 23: Add `src/components/boards-menu.tsx` (switch, New, Rename, Archive board, Archive link, limit message), `src/components/import-export-dialog.tsx` (export file, import confirmation and plain-words errors), `src/components/command-menu.tsx` (Ctrl+K and Cmd+K, filter by typing, Enter, Escape), `src/components/shortcut-help.tsx` ("?"), and `src/hooks/use-hotkeys.ts` (N new card, L new list, "/" search, B switch board; off while typing or a dialog is open). (FR7.1 to FR7.4, FR8.1 to FR8.4, FR9.1 to FR9.3)
- [x] Step 24: Write and run `boards-menu.test.tsx`, `import-export-dialog.test.tsx`, `command-menu.test.tsx`, `shortcut-help.test.tsx` and `src/hooks/use-hotkeys.test.ts`. (FR7 to FR9)

### Frontend (Release 3)

- [x] Step 25: Add the list limit field to the list menu and the over-limit header ("Over limit: 4 of 3", words plus icon, warn only), `src/components/swimlane-view.tsx` (bands by priority or label across all lists, off by default) and `src/components/rules-dialog.tsx` (create, name, enable, disable, delete rules; broken rule shown in words). (FR10.1, FR10.2, FR11.1 to FR11.3)
- [x] Step 26: Write and run `swimlane-view.test.tsx`, `rules-dialog.test.tsx` and add the over-limit case to `kanban-column.test.tsx`. (FR10, FR11)

### Quality, build and documentation

- [x] Step 27: Accessibility pass against accessibility-checklist.md: skip link, labels and landmarks, focus return, reduced-motion handling, keyboard methods for list and checklist-item reorder, live regions. Add a test for each keyboard-only path in the success scenario. (NFR3)
- [x] Step 28: Run Prettier on every changed file, then `pnpm typecheck` and `pnpm lint`; run the full Jest suite once to confirm nothing else broke. No change to CI, the README or other files that were already in the project, unless the build cannot work without it. (project rules)
- [ ] Step 29: Write `code-summary.md`, `source-manifest` is not written (zero-Unit work), and `traceability.json` from the sensor with a status and target for every FR and NFR in requirements.md. (traceability)
