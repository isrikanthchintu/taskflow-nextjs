# Test Results

Run on 2026-11-24 on the assembled project, from the repository root.

## Build

| Command | Result |
|---------|--------|
| `pnpm build` | Success. Compiled, linted and type-checked; 6 static pages generated; routes `/`, `/_not-found`, `/archive`, `/settings` |
| `pnpm typecheck` | Passed, no errors |
| `pnpm lint` | Passed, no warnings |
| `pnpm prettier --check src` | Passed: all matched files use Prettier code style |

## Tests

Command: `pnpm jest --coverage` (the whole suite, run once as the assembled-project check).

| Measure | Result |
|---------|--------|
| Suites | 27 passed of 27 |
| Tests | 364 passed of 364, none failed, none skipped |

Per-layer commands in `unit-test-instructions.md` (storage, logic, hook, Release 1, 2 and 3 components) were run by the build with all tests passing; the final full run above includes them.

## Failure Found and Fixed In-Stage

- During this stage, the full suite under coverage failed once per run, three times in a row, in `src/components/accessibility.test.tsx` ("NFR3 NFR4 runs the whole success scenario by keyboard alone"): `Unable to find role="heading" and name "Next up"`. It passed when that file ran alone and passed in the earlier plain full run.
- Cause: a dialog was still closing, so the page behind it was hidden from the accessibility query; the wait for the heading allowed only one second, which is too short when the whole suite runs in parallel with coverage on. It is a test timing problem, not a product defect.
- Fix (in-stage, attempt 1 of 2): the heading query now waits up to 15 seconds. No assertion, threshold or coverage setting was changed or weakened. After the fix the full suite passed (27 of 27 suites, 364 of 364 tests).
- Residual risk: the suite takes about 70 to 90 seconds under coverage; a slower machine or CI runner may need the same care for other long keyboard scenarios.

## Coverage Report

From the same run (all measured source): statements 88.28%, branches 80.67%, functions 91.13%, lines 90.47%. No coverage floor applies to this project (team practice), so these figures are reported, not judged.

## Where Browser Behavior Was Checked

Every browser-facing test ran in Node with the jsdom DOM emulator. None ran in a real browser engine, so none counts as end-to-end or native-browser evidence.

## Target Verification Matrix

See `build-and-test-summary.md` for the full matrix with verdicts.

## Loop-Back Log

None. No loop-back was needed; Construction autonomy is not autonomous and the in-stage fix resolved the one failure.
