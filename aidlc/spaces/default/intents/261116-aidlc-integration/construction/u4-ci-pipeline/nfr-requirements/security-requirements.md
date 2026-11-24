# Security Requirements — u4-ci-pipeline

This unit's `kind` (`packaging`) excludes it from performance, scalability,
reliability, and observability requirements (`nfr-requirements.md`'s
`produces_kinds`, restricted to `service`/`ui` units). Security is the most
relevant NFR category here: this unit adds the project's first CI/CD
configuration file, and a GitHub Actions workflow is exactly the place
future secrets, write permissions, and third-party code get introduced —
even though none of that exists in this intent's scope today.

Inception's `requirements.md` enumerated `NFR1`-`NFR4`; `NFR4` ("clear CI
failure reporting") is already this unit's own requirement
(`unit-of-work-story-map.md`). The three requirements below are filed as
**`NFR5`** — a new NFR category identified during Construction, unit-local
to this document, following the same numbering convention
`u1-git-repository`, `u2-test-infrastructure`, and `u3-code-formatting`
each used for their own `NFR5`.

## NFR5.1 — No secrets required or hardcoded

- **Requirement**: the workflow (`FR4.1`-`FR4.3`) must not require, read, or
  reference any secret, credential, or API key — matching
  `technology-stack.md`'s confirmation that this project has none today.
  Should a future change need one, it must be added through GitHub Actions'
  own encrypted Secrets store (referenced as `${{ secrets.NAME }}`), never
  hardcoded in the workflow YAML.
- **Verification**: inspect the generated `.github/workflows/ci.yml` for any
  literal credential-shaped string or an `env:`/`with:` value that is not a
  `${{ secrets.* }}` reference; none should exist.

## NFR5.2 — Third-party actions are pinned

- **Requirement**: every third-party GitHub Action the workflow uses (for
  example `actions/checkout`, a pnpm setup action) must be pinned to an
  explicit major version tag (e.g. `@v4`) at minimum, never an unpinned
  branch or `@latest`-style floating reference. An unpinned action can
  change behavior — or be compromised upstream — without this workflow
  file changing, which is a supply-chain risk a one-line version pin
  removes at no cost.
- **Verification**: inspect every `uses:` line in the workflow; each must
  carry an explicit version reference.

## NFR5.3 — Least-privilege trigger and permissions

- **Requirement**: the workflow must trigger only on `pull_request` and
  `push` to `main` (`FR4.1`, as already specified) — never
  `pull_request_target`, which runs with the base repository's secrets and
  write-level `GITHUB_TOKEN` against a fork's untrusted code, a well-known
  GitHub Actions security anti-pattern. Since this workflow needs no
  secrets and makes no write back to the repository (it only runs lint,
  typecheck, and test — `FR4.2`), the workflow must add an explicit
  `permissions: contents: read` block rather than relying on an assumed
  default — the `GITHUB_TOKEN`'s actual default scope when no
  `permissions:` key is set is governed by the repository/organization's
  own "Workflow permissions" setting, which can be read-write, not
  something this workflow file controls or can assume.
- **Verification**: inspect the workflow's `on:` triggers and
  `permissions:` block; confirm no `pull_request_target` trigger and an
  explicit `contents: read` (or narrower) permission, not an assumed
  default.

## Traceability

- `NFR5.1`-`NFR5.3` are new, unit-local security requirements under a new
  category (`NFR5`) identified at Construction time — Inception's
  `NFR1`-`NFR4` did not anticipate this level of CI/CD-specific hygiene.
- Inception's `NFR1` (zero behavior change) and `NFR3` (test suite
  performance) are not this unit's concern: `NFR1` applies to units that
  change existing application behavior, and this unit adds only a new,
  previously-absent workflow file; `NFR3` is `u2-test-infrastructure`'s own
  requirement for the test suite's performance, which this unit merely
  invokes by name (`contract-summary.md` Contract 1) without owning or
  redesigning it. Both are omitted deliberately, the same way `NFR4` is
  explicitly deferred rather than silently dropped.
  `NFR4` (clear CI failure reporting) remains this unit's own inception-level
  requirement and is unrelated to these three.
