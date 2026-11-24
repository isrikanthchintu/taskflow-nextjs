# Code Quality Assessment

## Quick Ratings

| Dimension | Rating | Note |
|---|---|---|
| Naming clarity | good | Descriptive, consistent kebab/Pascal/camel conventions |
| Function size | fair | `TaskDashboard` is about 400 lines; board logic is split into small pure helpers |
| Error handling | fair | Storage read/write guarded; read does not validate items; write failure only logs |
| Test presence | good | Every source module except layout, page, theme has a test |
| Duplication | fair | Status label map duplicated in `kanban-board.tsx` and `task-card.tsx` |
| Dead code | poor | Large unused legacy block in `globals.css` |

## Testing

- Jest 29 with jsdom, React Testing Library, user-event; `next/jest` transform.
- 6 co-located test files, 41 cases: board 10 (rendering and `resolveDragOutcome`), column 4, card 6, dashboard 7, hook 9, storage 5.
- Storage tests cover round trip, empty, malformed JSON, and the no-`window` SSR path; hook tests cover seeding, load, add, status, delete, move, reorder, and write-back.
- No coverage configuration or thresholds (team posture: no coverage floor; tests must stay green).
- Drag-and-drop behaviour is tested through the pure `resolveDragOutcome`; real pointer or keyboard drag in `DndContext` is not exercised.

## Linting and Formatting

- ESLint 9 flat config with `next/core-web-vitals` and `next/typescript`; `pnpm lint` runs `eslint src/` only.
- Prettier configured (`.prettierrc.json`, `.prettierignore`) with `format` and `format:check` scripts; `format:check` is not part of CI.
- TypeScript strict mode, `pnpm typecheck`.
- No `eslint-disable` suppressions, no TODO/FIXME/HACK markers found in `src/`.

## CI/CD

`.github/workflows/ci.yml` runs on push and pull request to `main`: checkout, pnpm setup, Node LTS with pnpm cache, `pnpm install --frozen-lockfile`, lint, typecheck, test. Missing: build, format check, coverage, deploy. Permissions limited to `contents: read`.

## Documentation

- `README.md` exists but is stale: lists a status filter that no longer exists, lists only the old file tree, and lists "add edit-task support" and "add tests" as future work although both exist.
- No code comments by project rule; names carry intent.

## Technical Debt

1. Dead legacy CSS and unused Tailwind in `src/app/globals.css`, `tailwind.config.ts`.
2. `TaskDashboard` mixes layout, top bar, summary, and dialog form; candidate for extraction.
3. Stored data is cast to `Task[]` without validation or migration; key is versioned `v1`.
4. Two icon libraries (`lucide-react`, `@mui/icons-material`).
5. Duplicated status label maps.
6. Module-level mutable store state in `use-tasks.ts` (`snapshot`, `loadStarted`) reset on last unsubscribe; correct but subtle.
7. Hardcoded UI literals (avatar "JD", "MAKE IT HAPPEN", seeded 2026-11 dates, colour hex values throughout `sx`).
8. No delete confirmation or undo.
9. Lint script excludes root config files.
10. `README.md` and `.env.example` do not reflect the current app.

## Security Notes

No secrets, no network calls, no `dangerouslySetInnerHTML`; user text rendered through React escaping. Input lengths limited in the dialog (title 100, description 500). Data is unauthenticated browser-local storage by design.
