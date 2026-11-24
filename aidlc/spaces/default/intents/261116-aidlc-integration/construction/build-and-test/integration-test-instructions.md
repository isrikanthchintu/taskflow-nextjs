# Integration Test Instructions

Standard strategy calls for integration tests at key cross-unit boundaries.
This project has exactly two: the hook↔storage↔component integration inside
`u2-test-infrastructure`'s own test suite, and the `u4-ci-pipeline`↔`u2`
contract boundary (`contract-summary.md` Contract 1). Both are already
covered by existing artifacts — no new test file is warranted, consistent
with `u2`'s own testing approach of exercising the real `localStorage` path
rather than mocking it.

## Boundary 1 — Hook ↔ Storage ↔ Component (inside `u2-test-infrastructure`)

`src/components/task-dashboard.test.tsx` and `src/hooks/use-tasks.test.ts`
already integration-test this boundary: they render the real
`TaskDashboard` component against the real `useTasks` hook and `jsdom`'s
real `localStorage` — no mock substitutes any layer. Creating, cycling
status, deleting, and filtering a task each exercise the full
UI→hook→storage round trip in one test.

**Framework/setup**: same as `u2-test-infrastructure`'s own
`unit-test-instructions.md` (Jest + `next/jest`, `jsdom` environment,
`@testing-library/react`).

**How to run**:
```bash
pnpm exec jest src/hooks/use-tasks.test.ts src/components/task-dashboard.test.tsx
```

**Coverage target**: behavioral — every test case listed in
`requirements.md` `FR3.2`/`FR3.3` passing (10 of the 15 total tests).

## Boundary 2 — `u4-ci-pipeline` ↔ `u2-test-infrastructure` (Contract 1)

`contract-summary.md` Contract 1 requires `u4-ci-pipeline`'s workflow to
invoke the script exactly as `pnpm test`, never a different name or direct
runner invocation. This is verified by direct inspection plus a live run:

**How to run**:
```bash
grep -n "pnpm test" .github/workflows/ci.yml
pnpm test
```

**Expected result**: the grep finds exactly one `run: pnpm test` line in
`.github/workflows/ci.yml`, and `pnpm test` exits 0 (3 suites, 15 tests
passing — `u2`'s complete suite, since the script name is not
file-filtered).

## Test Data Management

No test data setup is required beyond what each unit's own test files
already seed — `jsdom`'s `localStorage` is cleared in `beforeEach` by each
existing test file, and no shared fixture file exists across units.

## Environment Setup

No environment variables, services, or containers are required — confirmed
by `technology-stack.md`'s `## Explicitly Absent` and this intent's own
`NFR2` (no new production dependency, no network call).
