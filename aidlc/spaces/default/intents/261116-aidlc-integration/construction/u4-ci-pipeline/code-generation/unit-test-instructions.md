# Unit Test Instructions — u4-ci-pipeline

## Why no Jest/RTL tests

This unit adds no application source — only `.github/workflows/ci.yml`.
None of the project's testable layers (data model, repository, business
logic, API, frontend) apply.

## Scoped verification command

GitHub Actions itself cannot be invoked from this local session, so this
unit's acceptance check dry-runs the exact four gate commands the workflow
file will run on GitHub's infrastructure, in the same order, confirming
each exits 0 locally:

```bash
pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test
```

This is scoped to this unit's own deliverable (reproducing the workflow's
own command sequence) and is runnable with no setup beyond a checked-out
working tree. A non-zero exit from any of the four means the workflow
would fail the same way once actually run on GitHub — investigate the
failing command directly; this unit's `.github/workflows/ci.yml` only
needs to invoke the commands correctly, not fix what they find.

## Expected coverage

Not applicable — no application code, so no line-coverage figure.

## Mocking / test data

Not applicable.
