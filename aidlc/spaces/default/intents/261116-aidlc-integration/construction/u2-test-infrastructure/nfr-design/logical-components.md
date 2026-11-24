# Logical Components — u2-test-infrastructure

This unit's `kind` is `library` (`unit-of-work.md`), so `logical-components.md`
applies (the stage's `produces_kinds` restricts it to `service`/`ui`/`library`
units, unlike the four design artifacts above it that are `service`/`ui`
only). This document is the bridge Infrastructure Design reads next.

## Component Inventory

| Component | Type | Deployment target | Failure domain | Blast radius |
|---|---|---|---|---|
| Test suite (`*.test.ts(x)` files under `src/`) | Build/dev-time code, not a runtime service | None — never shipped; runs only under `pnpm test` in a developer's machine or `u4-ci-pipeline`'s CI job | A failing test fails the Jest process/CI job that ran it; it has no running instance to fail in production | None at runtime — the component does not exist in the deployed application. At build/CI time, a failure's blast radius is the single `pnpm test` invocation; it cannot affect any other unit's CI step or a running TaskFlow session |
| Jest configuration (`jest.config.*`, Jest setup files) | Build/dev-time configuration | Same as above — consumed only by `pnpm test` | A misconfiguration fails every test in the same run (total, not partial) | Same as above — confined to the test run |

## Shared Resources

None. This unit introduces no shared data store, no shared process, and no
shared network resource — it owns only new files under `src/` (test files)
and configuration files at the project root (Jest config). It does not read
or write anything another unit owns, and nothing another unit owns depends
on it at runtime (only `u4-ci-pipeline` depends on it, and only on the
stable `test` npm-script *name*, per `contract-summary.md`'s Contract 1 —
not on any shared resource).

## Isolation Strategy

Each Jest worker process runs test files in isolation; `jsdom`'s
`localStorage` is created fresh per test file and discarded when the file's
tests finish, so no state leaks between test files or between runs. There is
no persistent component for Infrastructure Design to provision — no
container, no managed service, no network endpoint.

## Handoff to Infrastructure Design

This unit's logical components have no deployment target, no managed
infrastructure dependency, and no network-facing surface. Infrastructure
Design for this unit is expected to find nothing to design: the only
"infrastructure" this unit touches is the CI runner `u4-ci-pipeline` later
provisions, which is that unit's own concern, not this one's.
