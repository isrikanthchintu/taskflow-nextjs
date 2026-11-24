# Monitoring Design — u4-ci-pipeline

This unit has no runtime service to observe (`infrastructure-specification.md`:
no deployment, no persistent compute) — "monitoring" here means making a CI
run's pass/fail state and failure cause legible from the GitHub Actions UI
alone, which is exactly `requirements.md` `NFR4`'s requirement.

## Metrics & KPIs

| Metric | Source | Threshold | Why it matters |
|---|---|---|---|
| Workflow run status (success/failure) | GitHub Actions' own run summary | Non-zero exit on any step = failure | The single pass/fail signal this intent needs; no custom metric pipeline is justified for a CI-only workflow. |
| Per-step duration | GitHub Actions' own run timeline | None set (`requirements.md` `NFR3`/Assumption A5: no fixed duration target) | Visible for free in the Actions UI; not something this design adds instrumentation for. |

## Alerts

| Alert | Condition | Severity | Routes to |
|---|---|---|---|
| Workflow failure notification | Any step exits non-zero | n/a (single severity — this is a demo/prototype project, not a paged service) | GitHub's own default: the committer/PR author via GitHub's notification settings. No custom alerting (PagerDuty, Slack webhook, etc.) is configured — none was requested and this project has no on-call rotation. |

## SLIs / SLOs

Not applicable. This unit has no running service with an availability or
latency target (`infrastructure-specification.md`); a CI workflow's only
"service level" is whether it accurately reports pass/fail, which `NFR4`
already covers below rather than as a numeric SLO.

## Logs & Tracing — satisfying `NFR4` (clear CI failure reporting)

No custom log aggregation or distributed tracing applies — GitHub Actions'
own per-step log viewer is the entire logging mechanism, and no tool runs
in a container or across services that would need correlation. `NFR4`'s
actual design is about NOT losing the diagnosable detail each tool already
produces:

- **Lint** (`pnpm lint` / `eslint`): ESLint's default reporter already
  prints the failing file path, line:column, and rule name per violation
  (confirmed in `u2-test-infrastructure`'s and `u3-code-formatting`'s own
  `code-summary.md` outputs, which show this exact format). The workflow
  must invoke it with no `--quiet`/`--format` flag that would suppress that
  detail, and must not redirect its output away from the step's own log.
- **Typecheck** (`pnpm typecheck` / `tsc --noEmit`): `tsc`'s default output
  already names the failing file, line:column, and error code. Same rule:
  no output suppression.
- **Test** (`pnpm test`, Contract 1's `test` script from
  `u2-test-infrastructure`): Jest's default reporter names the failing
  test file and test name, with the assertion diff. Same rule.

No step pipes a tool's output through a filter, a `2>&1 | tail`, or any
other transform that would drop detail — each tool's own default,
already-diagnosable output is what the GitHub Actions log shows, satisfying
`NFR4` with zero additional tooling.
