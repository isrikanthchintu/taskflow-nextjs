# Unit / Requirement Story Map

`stories.md` was not produced (User Stories was skipped — developer-tooling-only intent). Rows are keyed by `FR`/`NFR` ID; a requirement with sub-requirements is traced through its `FR{n}.{m}` IDs and needs no row of its own.

| ID | Unit | Directory |
|---|---|---|
| FR1.1 | U1 | `u1-git-repository` |
| FR1.2 | U1 | `u1-git-repository` |
| FR2.1 | U2 | `u2-test-infrastructure` |
| FR2.2 | U2 | `u2-test-infrastructure` |
| FR3.1 | U2 | `u2-test-infrastructure` |
| FR3.2 | U2 | `u2-test-infrastructure` |
| FR3.3 | U2 | `u2-test-infrastructure` |
| FR4.1 | U4 | `u4-ci-pipeline` |
| FR4.2 | U4 | `u4-ci-pipeline` |
| FR4.3 | U4 | `u4-ci-pipeline` |
| FR5.1 | U3 | `u3-code-formatting` |
| FR5.2 | U3 | `u3-code-formatting` |
| NFR1 | U2 | `u2-test-infrastructure` |
| NFR2 | U1; U2; U3; U4 | cross-cutting constraint on every unit (no new production dependency) |
| NFR3 | U2 | `u2-test-infrastructure` |
| NFR4 | U4 | `u4-ci-pipeline` |

## Cross-Cutting Rows

NFR2 ("no new production dependency") is not implemented by any single unit — it is a constraint every unit's own Functional Design must respect (all four units add development-time tooling only, never a production dependency).

## Implementation Order Within Each Unit

- **U1**: `.gitignore` first, then `git init`, then the initial commit (FR1.1 → FR1.2).
- **U2**: dependencies and `test` script first (FR2.1 → FR2.2), then storage tests, then hook tests, then component tests (FR3.1 → FR3.2 → FR3.3), per the affirmed test-after ordering (implement/verify each testable layer, then write and run that layer's tests).
- **U3**: Prettier config first, then the `format`/`format:check` scripts (FR5.1 → FR5.2).
- **U4**: the workflow trigger and install step first, then the lint/typecheck/test steps (FR4.1 → FR4.2 → FR4.3).

## Coverage Verification

Every FR/NFR sub-requirement ID from `requirements.md` has exactly one row above naming its implementing Unit (NFR2 names all four as a cross-cutting constraint); every one of the 4 units has at least one row naming it. No gaps.
