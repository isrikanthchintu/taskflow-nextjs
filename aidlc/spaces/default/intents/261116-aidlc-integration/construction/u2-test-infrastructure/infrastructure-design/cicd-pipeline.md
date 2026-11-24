# CI/CD Pipeline — u2-test-infrastructure

No `infrastructure-specification.md` or `monitoring-design.md` applies to
this unit: its `kind` is `library`, and the stage's `produces_kinds`
restricts those two artifacts to `service`/`ui`/`packaging` units. This unit
has no deployment target, no infrastructure service, and nothing to
monitor at runtime (`logical-components.md`, `nfr-design`). `cicd-pipeline`
and `traceability` are the two artifacts that apply to every unit kind,
including `library`, and this unit genuinely has a pipeline touchpoint: it
is Contract 1's provider in `contract-summary.md` — `u4-ci-pipeline` invokes
the `test` script this unit defines.

## This Unit's Pipeline Touchpoint

This unit does not design or own the CI/CD pipeline itself — that is
`u4-ci-pipeline`'s responsibility (`unit-of-work.md`: U4's boundaries are
the GitHub Actions workflow file). What this unit owns is the **Test
stage's content and contract**, which U4's pipeline will invoke by name:

| Pipeline stage | Owner | What runs | Exit behavior |
|---|---|---|---|
| Lint | u4-ci-pipeline | `pnpm lint` | Non-zero exit fails the workflow (FR4.2) |
| Typecheck | u4-ci-pipeline | `pnpm typecheck` | Non-zero exit fails the workflow (FR4.2) |
| **Test** (this unit's contribution) | **u2-test-infrastructure** | `pnpm test` — the full Jest suite added by this unit (storage, hook, dashboard), run non-interactively (FR2.2) | Non-zero exit on any test failure fails the workflow run (`contract-summary.md` Contract 1's `failure_behavior`); zero exit on full success |

Stage order (Lint → Typecheck → Test) follows `requirements.md` FR4.2
verbatim; this unit does not change that order, since sequencing the
pipeline is `u4-ci-pipeline`'s boundary, not this unit's.

## Deployment Strategy

Not applicable. No deployment target exists for this unit or for the
project as a whole in this intent's scope (`requirements.md` Out of Scope;
`team.md` Deployment: "CI-only integration for now"). There is no
blue-green, canary, rolling, or recreate strategy to select.

## Rollback Procedure

Not applicable — nothing is deployed. A failing test blocks the CI workflow
run (via the exit-code contract above); there is no running instance to
roll back.

## Environment Promotion

Not applicable. This unit produces no artifact that is promoted between
environments; `pnpm test` runs identically wherever it is invoked
(developer machine or CI runner), per `NFR5.2`'s "no secrets or network
access" design (`nfr-design/security-design.md`).

## Secrets Management in CI/CD

None required. `NFR5.2` (`nfr-requirements/security-requirements.md`) and
its design (`nfr-design/security-design.md`) establish that the test suite
reads no environment variable and makes no network call, so `u4-ci-pipeline`
needs to configure no secret, credential, or connection string for this
unit's Test stage to run.

## Traceability

This unit's three NFR5 requirements are the only upstream IDs this stage's
design decisions address infrastructure-wise: `NFR5.1` (dev-only
dependencies) and `NFR5.3` (no credential-shaped fixtures) require no
infrastructure at all, since both are satisfied entirely by `package.json`
placement and fixture-authoring convention, with nothing for a CI/CD
pipeline to provision. `NFR5.2` (no secrets/network in the test run) is the
one requirement with a genuine CI/CD-facing consequence — it is why
`u4-ci-pipeline` needs no secrets configuration for this unit's Test stage,
captured in "Secrets Management in CI/CD" above.
