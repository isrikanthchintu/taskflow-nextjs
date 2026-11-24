# Tech Stack Decisions — u4-ci-pipeline

| Decision | Choice | Rationale |
|---|---|---|
| CI platform | GitHub Actions | Explicitly affirmed by the person (Assumption A1, `requirements.md`); the project's eventual host is assumed to be GitHub. |
| Checkout action | `actions/checkout@v4` | The standard, first-party GitHub Action for checking out repository code; pinned to major version `v4` per `NFR5.2`. |
| Node.js / pnpm setup | `pnpm/action-setup` (pinned to a major version) + Node.js's current LTS via `actions/setup-node@v4` | `pnpm` is this project's package manager (`technology-stack.md`); `FR4.3` asks for a current Node.js LTS version (Assumption A2 — not pinned to an exact patch version). |

No new package, library, or dependency is added by this unit — it
contributes a workflow configuration file only (`unit-of-work.md`:
`u4-ci-pipeline`'s boundaries are `.github/workflows/ci.yml` only), so
inception's `NFR2` ("no new production dependency") is trivially satisfied:
there is no `package.json` entry for this unit to add at all, dev or
production.
