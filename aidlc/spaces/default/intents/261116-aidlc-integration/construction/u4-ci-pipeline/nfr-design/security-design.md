# Security Design — u4-ci-pipeline

Technical approach satisfying `NFR5.1`-`NFR5.3` from
`nfr-requirements/security-requirements.md`.

## Design

1. **`NFR5.1` — no secrets.** `.github/workflows/ci.yml` references no
   `secrets.*` context and defines no literal credential-shaped string. The
   `env:`/`with:` blocks for each step carry only non-secret values (Node.js
   version, pnpm version). Should a future change need a real secret, the
   workflow would reference it as `${{ secrets.NAME }}`, backed by a
   repository secret configured outside this workflow file — there is
   nothing to design beyond this absence, since no step in `FR4.2`'s
   lint/typecheck/test sequence needs one.

2. **`NFR5.2` — pinned actions.** Every `uses:` entry pins an explicit major
   version:
   ```yaml
   - uses: actions/checkout@v4
   - uses: pnpm/action-setup@v4
   - uses: actions/setup-node@v4
     with:
       node-version: "lts/*"
   ```
   `pnpm/action-setup@v4` and `actions/setup-node@v4` are both first-party
   or widely-trusted actions already pinned to a major version tag, which
   GitHub itself re-points to the latest compatible release under that
   major — this is the standard, low-maintenance pinning level (not a full
   commit-SHA pin, which this project's low-risk, no-secrets workflow does
   not need).

3. **`NFR5.3` — least-privilege trigger and permissions.** The workflow's
   `on:` block triggers only on `push`/`pull_request` to `main` (`FR4.1`) —
   never `pull_request_target`. A top-level `permissions:` block is added
   explicitly, rather than relying on the repository's own ambient
   default:
   ```yaml
   permissions:
     contents: read
   ```
   `contents: read` is sufficient for every step this workflow runs
   (checkout, install, lint, typecheck, test) — none of them pushes a
   commit, creates a release, or opens a PR comment, so no broader scope is
   requested.

## Threat Considered and Rejected

- **Caching `node_modules`/pnpm store across runs** was considered (a
  performance optimization, not security) and left out of this design:
  it is an `infrastructure-design`/build-pipeline concern, not a security
  requirement, and is out of this document's scope.
- **A commit-SHA pin for every action** (stronger than a major-version tag)
  was considered and rejected as disproportionate: this workflow has no
  secrets and `contents: read` only, so the blast radius of a compromised
  action here is limited to the workflow's own log output and Node process,
  not the repository or any credential. The one residual risk accepted by
  this choice: a compromised action under a floating major tag could still
  exfiltrate the checked-out source code itself (which `contents: read`
  permits reading, by design) to an external destination during the job —
  this project's source is not secret, so that risk is accepted rather than
  mitigated with a stronger pin.

## Traceability

`NFR5.1`-`NFR5.3` are each fully addressed by one design decision above: an
absence (no secrets context used), a pinning convention, and an explicit
least-privilege `permissions:` block.
