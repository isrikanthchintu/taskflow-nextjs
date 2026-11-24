# Units Generation — Unit Dependency DAG

## Dependency DAG

A single Unit, `u1-kanban-board`, with no other Unit in this piece of work
to depend on (Q1, confirmed): all 6 Domain Design components live inside
the same single-deployable Next.js app with no network boundary between
them, so splitting them into separately-buildable Units would create an
artificial boundary `components.md` does not call for.

```yaml
units:
  - name: u1-kanban-board
    kind: ui
    depends_on: []
```

## Integration Points Between Units

None — there is only one Unit. Every integration point this feature
introduces (`KanbanBoard` <-> `KanbanColumn` <-> `TaskCard`,
`TaskDashboard`/`KanbanBoard`/`TaskCard` <-> `useTasks`, `useTasks` <->
`task-storage`) is an **intra-Unit** component boundary, already specified
in `components.md`'s `depends_on`/`dependents` edges — not a cross-Unit
contract. No Contract Design stage output is produced or needed for this
piece of work.

## Parallel Development Opportunities

None — a single Unit has nothing to parallelize against. All work on
`u1-kanban-board` is sequenced within Construction's own per-unit stages
(Functional Design, Code Generation, Build and Test) for this one Unit.

## Walking Skeleton

Not applicable to this decomposition: per `team.md`'s affirmed Walking
Skeleton stance, this brownfield app's existing end-to-end flow (seed ->
read -> render -> mutate -> write-on-change) is already the proven walking
skeleton, so no separate skeleton ceremony applies to this intent's single
Unit.
