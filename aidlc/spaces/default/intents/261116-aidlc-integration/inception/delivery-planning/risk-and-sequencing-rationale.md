# Risk and Sequencing Rationale

## Heuristic Used

**Foundation-first** (not a formal WSJF/CD3 scoring model). With only 4 small units and a single real dependency edge (U4 → U2, from `unit-of-work-dependency.md`), the dependency DAG already determines nearly the whole order — a formal scoring model would add ceremony without changing the outcome, so none is applied (confirmed with the person in `delivery-planning-questions.md`, Q1).

## Why U1, U2, U3 Are Bundled into One Bolt

All three are independent of each other and of U4's prerequisite (U2), so there is no dependency reason to split them into separate Bolts. Bundling them keeps the Bolt count low for an intent this small (4 units total) while still respecting the DAG: nothing in Bolt 1 depends on anything outside Bolt 1.

## Why U4 Is Its Own Bolt

U4's CI workflow literally invokes `pnpm test`, which only exists once U2 adds it (`unit-of-work-dependency.md`'s one edge). Sequencing U4 after Bolt 1 (which includes U2) respects that dependency exactly — this is the DAG's own constraint, not a value judgment, and the plan does not deviate from the topological order it implies.

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| The `.gitignore` in U1 fails to exclude AI-DLC's own workspace runtime files, committing them into the first commit | Low | Medium | `requirements.md` FR1.1 names the exact pattern list (from `.claude/CLAUDE.md`'s Git Integration section) to include; the architecture review for Requirements Analysis already confirmed this list is complete |
| CI workflow (U4) references the wrong script name or a script that doesn't exist | Low | Low | The contract between U2 and U4 (`contract-summary.md`) pins the exact script name (`test`) as a formal agreement; U4's Definition of Done requires the referenced scripts to actually run successfully before the Bolt is considered done |
| The baseline test suite (U2) is written against mocked storage instead of the real localStorage path, silently failing to prove preservation of the existing behavior | Low | High | `requirements.md` FR3.1 and the affirmed Testing Posture both explicitly require tests to exercise the real localStorage-backed path, not a mock |

No Critical-severity risks: nothing in this intent touches application behavior, data, or external systems in a way that could cause an unrecoverable failure — every change is additive tooling, reversible by deleting the added files.
