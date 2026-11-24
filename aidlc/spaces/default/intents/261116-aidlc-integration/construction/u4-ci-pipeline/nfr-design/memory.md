<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-11-17T06:14:06Z — carried the nfr-requirements review's correction (explicit `permissions: contents: read` rather than an assumed default) directly into the design, since the requirement itself was corrected before this stage started.

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
<!-- none -->

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-11-17T06:14:06Z — chose major-version action pinning (`@v4`) over commit-SHA pinning: this workflow has no secrets and read-only permissions, so the stronger pin's maintenance cost isn't justified by the blast radius it would reduce.

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
<!-- none -->
