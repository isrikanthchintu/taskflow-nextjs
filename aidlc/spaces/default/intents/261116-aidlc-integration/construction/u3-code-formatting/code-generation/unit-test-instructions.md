# Unit Test Instructions — u3-code-formatting

## Why no Jest/RTL tests

This unit adds no application source — only a Prettier configuration,
a `.prettierignore`, and two `package.json` script entries. None of the
project's testable layers (data model, repository, business logic, API,
frontend) apply.

## Scoped verification command

In place of an application test suite, this unit's acceptance check runs
the formatter's own check mode against the whole tree (bounded by
`.prettierignore`), confirming the configuration matches the project's
actual existing formatting with zero diffs:

```bash
pnpm run format:check
```

This is scoped to this unit's own deliverable (the Prettier config and
scripts) and is runnable with no setup beyond `pnpm install` (plan Step 1)
having completed. A non-zero exit means the config disagrees with some
existing file's formatting — investigate the config in that case; it must
not be "fixed" by running `pnpm format` across files this unit does not
own without the person's say-so.

## Expected coverage

Not applicable — no application code, so no line-coverage figure. The
verification command above is pass/fail, not a coverage metric.

## Mocking / test data

Not applicable.
