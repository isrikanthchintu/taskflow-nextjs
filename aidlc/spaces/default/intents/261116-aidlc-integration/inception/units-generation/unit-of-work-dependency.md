# Unit Dependency Graph

## Dependency Edges (prose)

- **U4 (`u4-ci-pipeline`) depends on U2 (`u2-test-infrastructure`)**: the CI workflow's `pnpm test` step only succeeds once U2 has added the `test` script to `package.json`. The workflow would not fail to exist without U2, but it would not functionally pass without it.
- **U1, U2, and U3 have no dependency on each other or on U4.** Each can be built, tested, and verified entirely with the existing project plus its own changes — none of the three reads, calls, or configures anything the others add.

This is a cycle-free DAG: U1, U2, U3 → (U4 depends on U2 only).

## Integration Points

None. These are independent tooling additions with no runtime APIs, shared data stores, or events between units. U4's only "integration" with another unit is referencing the npm script name U2 defines (`pnpm test`) inside the workflow file — a file-level reference, not a runtime API.

## Parallel Development Opportunities

`u1-git-repository`, `u2-test-infrastructure`, and `u3-code-formatting` have no dependency between them: all three can be built at the same time, each with its own copy of the project, with none of the others' work in it. `u4-ci-pipeline` must wait for `u2-test-infrastructure` to be in place (or at least for its `test` script to exist) before the workflow's test step is meaningful.

## Walking Skeleton Note

Per the affirmed team practice (`aidlc/spaces/default/memory/team.md`, `## Walking Skeleton`), this intent treats the existing TaskFlow application as the already-proven walking skeleton — no unit here needs to be shaped as a fresh integrated slice, since none of them changes the application's runtime behavior.

## Edge Block

```yaml
units:
  - name: u1-git-repository
    kind: packaging
    depends_on: []
  - name: u2-test-infrastructure
    kind: library
    depends_on: []
  - name: u3-code-formatting
    kind: packaging
    depends_on: []
  - name: u4-ci-pipeline
    kind: packaging
    depends_on: [u2-test-infrastructure]
```
