# Units Generation — Decomposition Plan

The requirements (FR1–FR5) already decompose cleanly along feature lines, with mostly independent pieces — this plan proposes 4 small units and asks for your confirmation rather than asking separate questions for each planning topic, since the answers are already determined by what's in `requirements.md`.

## Q1. [Architect] Unit boundary strategy, granularity, and dependencies

**Proposed decomposition** (by feature, one unit per FR group):

| Unit | Covers | Kind | Depends on | Why |
|---|---|---|---|---|
| `u1-git-repository` | FR1 (git init, `.gitignore`, initial commit) | packaging | none | Purely structural; no code dependency on anything else |
| `u2-test-infrastructure` | FR2, FR3 (Jest/RTL setup, baseline tests) | library | none | Test tooling and tests don't need git initialized to build or pass |
| `u3-code-formatting` | FR5 (Prettier config + scripts) | packaging | none | Independent of git, tests, and CI |
| `u4-ci-pipeline` | FR4 (GitHub Actions workflow) | packaging | `u2-test-infrastructure` | The workflow's `pnpm test` step only works once the `test` script (added by U2) exists |

`u1`, `u2`, and `u3` have no dependency on each other and can be built in parallel; `u4` is the only unit with a real dependency (on `u2`).

**Integration points**: none — these are independent tooling additions with no APIs, shared data, or events between them; the only "integration" is U4 referencing scripts that U2 and the project's existing `package.json` already provide.

**Deployment model**: none of these units are deployed services — they are local tooling (git config, test suite, formatter config, CI workflow file) consistent with the "local-development/CI-only" scope already affirmed in Practices Discovery.

A. Accept this decomposition as proposed
B. Change it (say what: different grouping, different granularity, different dependencies)
X. Other (please specify)

[Answer]: A. Accept this decomposition as proposed
