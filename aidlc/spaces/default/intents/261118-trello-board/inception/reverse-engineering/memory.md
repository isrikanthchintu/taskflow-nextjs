<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
2026-11-19T10:33:00Z — existing codekb store reported UNVERIFIED (no stored fingerprint); human chose Full rescan, so the whole repo was rebuilt from scratch rather than merged.

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
2026-11-19T10:33:00Z — `codekb-scope-diff --compare` did not auto-delete the `scope-draft.md` scratch file as its own output describes; removed it by hand after reading the verdict (COVERS).

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
2026-11-19T10:33:00Z — current app is a filterable task list, not a Kanban board, and no drag-and-drop library exists today; whether to add one or hand-roll HTML5 DnD has no existing team/project rule and should be decided explicitly at domain-design/units-generation, not silently.
2026-11-19T10:33:00Z — `task-dashboard.tsx` already mixes multiple UI responsibilities (183 lines, two inline sub-components); worth flagging for decomposition before Kanban columns/drag-and-drop are added.
