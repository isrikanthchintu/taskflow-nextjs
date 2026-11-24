<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-11-23T13:50:30Z — asked no clarifying questions for this stage: Construction's own guidance makes questions exceptional, not routine, and every design gap left open after Domain Design is resolvable from decisions already made (ADR-001 through ADR-005) without needing further human/business input.
- 2026-11-23T13:50:30Z — resolved Domain Design's open Major reviewer finding (no keyboard-operable equivalent for in-column reordering, NFR3) using the already-adopted `@dnd-kit` library (ADR-002): its `KeyboardSensor` lets a focused card be picked up with Space/Enter and moved with Arrow keys within and across the fixed columns, which is itself a keyboard-operable drag — this is additional to, not a replacement for, `TaskCard`'s dedicated non-drag status-cycle control (FR5.1), which remains the keyboard-operable equivalent specifically for column changes. No new component or library is introduced; this only specifies behaviour already implied by adopting `@dnd-kit`.
- 2026-11-23T13:50:30Z — kind `ui` (Units Generation Q2) means `entities.md` and `rules.md` do not apply to this Unit per the stage's `produces_kinds` mapping; `functional-spec.md` is self-contained per the stage's own UI-only-unit carve-out.

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
- 2026-11-23T14:00:32Z — after the READY adversarial review (iteration 1) still surfaced 2 Major findings I agreed were real, fixed both directly rather than carrying them forward as accepted risk (Guard Policy is off for this intent, so the review freeze stands aside for a self-initiated correction): (1) corrected the column header's live count to reuse the existing unfiltered per-status counts (FR1.2), not a filtered count, in both functional-spec.md and frontend-components.md; (2) removed named drag-and-drop library API surface (DndContext/PointerSensor/KeyboardSensor/SortableContext/useSortable/onDragEnd) from the design prose to stay technology-agnostic per the stage's own constraint, reserving those names for Code Generation. Also addressed the Minor finding by qualifying W2/W5 so cross-column keyboard dragging is never assumed to work out of the box — W4's dedicated control is what NFR3 relies on for column changes.

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
