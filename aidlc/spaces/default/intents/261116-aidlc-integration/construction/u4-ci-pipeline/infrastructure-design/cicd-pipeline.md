# CI/CD Pipeline — u4-ci-pipeline

This unit designs the pipeline itself — unlike `u2-test-infrastructure` and
`u3-code-formatting`, which only noted their own one touchpoint with a
pipeline owned elsewhere.

## Build Stages → Gate Mapping

| Stage | Command | Gate (fails the run on non-zero exit) |
|---|---|---|
| Checkout | `actions/checkout@v4` | n/a — setup step |
| Toolchain setup | `pnpm/action-setup@v4`, `actions/setup-node@v4` (`node-version: "lts/*"`, `FR4.3`/Assumption A2) | n/a — setup step |
| Install | `pnpm install --frozen-lockfile` | Yes — a missing/mismatched lockfile fails the run |
| Lint | `pnpm lint` | Yes (`FR4.2`) |
| Typecheck | `pnpm typecheck` | Yes (`FR4.2`) |
| Test | `pnpm test` (owned by `u2-test-infrastructure`, Contract 1) | Yes (`FR4.2`) |

A setup-step failure (e.g. an unresolvable pnpm or Node version) still
aborts the run with a non-zero exit, via GitHub Actions' own step-failure
semantics — "n/a — setup step" above means it is not one of `FR4.2`'s named
gates, not that a setup failure is ignored.

Stage order (install → lint → typecheck → test) follows `requirements.md`
`FR4.2`'s own ordering. `--frozen-lockfile` is used for the install step so
CI fails loudly on a `pnpm-lock.yaml` drift rather than silently installing
different versions than a developer's local install would.

## Deployment Strategy

Not applicable. No deployment stage exists in this workflow — `requirements.md`
Out of Scope and `team.md`'s Deployment practice both confirm this intent
is CI-validation-only, with no hosting or deploy target. There is no
blue-green, canary, rolling, or recreate strategy to select.

## Rollback Procedure

Not applicable — nothing is deployed, so there is nothing to roll back. A
failing CI run simply blocks the PR/push from being considered green; the
remedy is fixing the code, not reverting a release.

## Environment Promotion

Not applicable. There is one environment (the GitHub-hosted runner itself),
used identically for every trigger (`push` or `pull_request` to `main`) —
no staging/production promotion exists to design.

## Secrets Management in CI/CD

None required (`nfr-design/security-design.md` `NFR5.1`) — every step runs
with no `secrets.*` reference. Should a future unit need one, it would be
added as a GitHub repository secret and referenced via
`${{ secrets.NAME }}`, never hardcoded in this workflow file.

## Failure Reporting — `NFR4`

See `monitoring-design.md`'s "Logs & Tracing" section: each stage's gate
command is run with its tool's default (unsuppressed) output, which already
names the failing file, line, and reason — satisfying `requirements.md`
`NFR4` with no additional tooling.

## Traceability

- `NFR5.1`-`NFR5.3` (secrets, pinning, least-privilege) have no additional
  infrastructure consequence beyond what `nfr-design/security-design.md`
  already specifies in the workflow's own YAML — this document's Build
  Stages table and Secrets Management section simply carry those same
  decisions into the pipeline's concrete stage sequence.
- `NFR4` (clear CI failure reporting), left `Deferred` at `nfr-requirements`
  since no reliability/observability-requirements document applies to a
  packaging-kind unit, is fully addressed here: `monitoring-design.md`'s
  "Logs & Tracing" section is its concrete design.
