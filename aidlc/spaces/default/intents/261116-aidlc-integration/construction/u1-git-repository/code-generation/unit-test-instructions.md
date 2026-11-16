# Unit Test Instructions — u1-git-repository

## Why no Jest/RTL tests

This unit adds no application source — only a `.gitignore` extension and git repository initialization. None of the project's testable layers (data model, repository, business logic, API, frontend — see the rendered Testing Contract) apply. The project's actual test framework (Jest + React Testing Library) does not exist yet at this point in the build; it is Unit U2's own deliverable (`FR2.1`).

## Scoped verification command

In place of an application test suite, this unit's acceptance check is a scripted shell verification, run from the project root after `git init` and staging (plan Step 4), before the initial commit:

```bash
git diff --cached --name-only | grep -Ei '\.env($|\.)|\.pem$|\.key$|^aidlc/active-space$|aidlc/\.aidlc-sessions/|\.aidlc-engine/' && echo "FAIL: excluded pattern staged" || echo "PASS: no excluded pattern staged"
```

This is scoped to this unit only (it inspects only the staging area this unit's own `git add` created) and is runnable with no setup beyond `git` itself.

## Expected coverage

Not applicable — no application code, so no line-coverage figure. The verification command above is pass/fail, not a coverage metric.

## Mocking / test data

Not applicable.
