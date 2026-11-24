# Cross-Unit Traceability

Generated from `aidlc engine sensor-traceability --stage build-and-test`.
Verdict: **PASS** — every requirement and acceptance criterion traced; zero
uncovered elements.

## Coverage

| ID | Covered | Built in |
|---|---|---|
| FR1.1 | Yes | `u1-git-repository`: `.gitignore` |
| FR1.2 | Yes | `u1-git-repository`: `.gitignore` |
| FR2.1 | Yes | `u2-test-infrastructure`: `jest.config.ts` |
| FR2.2 | Yes | `u2-test-infrastructure`: `package.json` |
| FR3.1 | Yes | `u2-test-infrastructure`: `src/lib/task-storage.test.ts` |
| FR3.2 | Yes | `u2-test-infrastructure`: `src/hooks/use-tasks.test.ts` |
| FR3.3 | Yes | `u2-test-infrastructure`: `src/components/task-dashboard.test.tsx` |
| FR4.1 | Yes | `u4-ci-pipeline`: `.github/workflows/ci.yml` |
| FR4.2 | Yes | `u4-ci-pipeline`: `.github/workflows/ci.yml` |
| FR4.3 | Yes | `u4-ci-pipeline`: `.github/workflows/ci.yml` |
| FR5.1 | Yes | `u3-code-formatting`: `.prettierrc.json` |
| FR5.2 | Yes | `u3-code-formatting`: `package.json` |
| NFR1 | Yes | `u2-test-infrastructure`: `src/components/task-dashboard.test.tsx` |
| NFR2 | Yes | `u1-git-repository`: `.gitignore`; `u2-test-infrastructure`: `package.json`; `u3-code-formatting`: `package.json`; `u4-ci-pipeline`: `.github/workflows/ci.yml` |
| NFR3 | Yes (N/A) | `u2-test-infrastructure`: left qualitative per `requirements.md` Assumption A5 — no fixed duration target confirmed; the applicable check is the scoped test command's 15/15 passing run |
| NFR4 | Yes (built; live verification Unverified — see `test-results.md`) | `u4-ci-pipeline`: `.github/workflows/ci.yml` |

## Uncovered Elements

None.

## Owning Units / Files Summary

- `u1-git-repository` — `FR1.1`, `FR1.2`; contributes to `NFR2`.
- `u2-test-infrastructure` — `FR2.1`, `FR2.2`, `FR3.1`-`FR3.3`, `NFR1`,
  `NFR3`; contributes to `NFR2`.
- `u3-code-formatting` — `FR5.1`, `FR5.2`; contributes to `NFR2`.
- `u4-ci-pipeline` — `FR4.1`-`FR4.3`, `NFR4`; contributes to `NFR2`.

Every unit's own `NFR5.x` security requirements (dev-only dependencies, no
plugin/secrets/pinning issues) were verified at that unit's own Code
Generation stage and checkpoint; this is a tool-level, per-unit coverage
check rather than a cross-unit requirement, so it is not duplicated in the
table above (see each unit's own `code-generation/traceability.json`).
