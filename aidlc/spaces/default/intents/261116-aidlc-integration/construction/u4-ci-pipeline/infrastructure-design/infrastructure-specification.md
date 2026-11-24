# Infrastructure Specification — u4-ci-pipeline

## Deployment

| Facet | Choice | Rationale |
|---|---|---|
| Compute model | GitHub-hosted runner, `ubuntu-latest` | Standard, zero-maintenance runner for a lint/typecheck/test-only workflow; no self-hosted runner is justified for this project's scale. |
| Networking topology | None — no VPC, no ingress/egress configuration | The workflow only checks out the repository and runs local commands (`pnpm install`, lint, typecheck, test); it makes no inbound or outbound network call beyond the pnpm package registry during install. |
| Storage strategy | None persisted across runs | Each run is ephemeral; no artifact is uploaded or retained beyond GitHub Actions' own default log retention. No caching is configured (left as a future optimization, not required by any NFR). |
| Environments | None (no dev/staging/prod) | `team.md`'s Deployment practice and `requirements.md`'s Out of Scope confirm this intent is CI-only, with no hosting or deployment target. |
| IaC approach | The workflow YAML itself (`.github/workflows/ci.yml`), written in Code Generation | A single GitHub Actions workflow file is the complete "infrastructure as code" for this unit — no CDK/Terraform/CloudFormation applies to a CI-only, no-deploy workflow. |
| Resource sizing | GitHub's current default standard `ubuntu-latest` runner sizing | Sufficient for `pnpm install` + lint + typecheck + 15 Jest tests on a small Next.js app; no larger runner is justified. |

## Infrastructure Services

| Service | Role | Configuration | Notes |
|---|---|---|---|
| GitHub Actions runner | CI compute | `ubuntu-latest`, `permissions: contents: read` (`nfr-design/security-design.md`) | Ephemeral per run; no persistent state, no managed service to provision or monitor beyond GitHub's own platform. |

## Shared Infrastructure

Not applicable — no infrastructure resource is shared between this unit and
any other unit. The only cross-unit relationship is `contract-summary.md`'s
Contract 1 (this unit invokes `u2-test-infrastructure`'s `test` script by
name), which is a build-time interface, not a shared infrastructure
resource.
