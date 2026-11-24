<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-11-23T13:37:24Z — mapped FR1.3/NFR6 (lossless load of existing tasks) to the `Task` entity rather than to `KanbanBoard`, since the claim is about the stored data shape being unchanged, not about rendering logic.

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
- 2026-11-23T13:37:24Z — did not add a separate `Component-boundary options` block in `components.md` for the UI decomposition (Q3), since the trade-off was already presented and resolved in the questions file and is captured in ADR-003's Alternatives Rejected; avoided duplicating the same trade-off in two places.

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-11-23T13:37:24Z — all 5 questions landed on the recommended option (array-position ordering, @dnd-kit, Board/Column/Card decomposition, extend useTasks, reorder-against-full-list); no contradictions or ambiguity to resolve.

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
- 2026-11-23T13:37:24Z — the architecture reviewer (advisory, READY) flagged a Major gap: NFR3 requires a keyboard-operable equivalent for drag interactions, but the design only gives `TaskCard` a keyboard control for column-change (FR5), not for in-column reordering. `requirements.md`'s FR5 only describes column-change, while NFR3 also covers reordering — this is a contradiction in the upstream requirements that Functional Design (or a requirements revision) needs to resolve with a concrete keyboard-reorder interaction.
