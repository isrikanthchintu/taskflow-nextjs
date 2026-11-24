# Security Requirements — u2-test-infrastructure

This unit's `kind` (`library`) excludes it from performance, scalability,
reliability, and observability requirements (`nfr-requirements.md`'s
`produces_kinds`, restricted to `service`/`ui` units). Security is still
relevant: this unit adds new dev dependencies (Jest, React Testing Library)
and a test script that `u4-ci-pipeline` will invoke unattended, so the test
script's own blast radius and dependency hygiene matter even though nothing
here runs in production.

Inception's `requirements.md` enumerated `NFR1`-`NFR4`; none of them covers
dependency/test-execution hygiene, because Inception could not anticipate
this level of operational detail. The three requirements below are filed as
**`NFR5`** — a new NFR category identified during Construction, not a
sub-item of any existing inception NFR (unit-local to this document, the same
convention `u1-git-repository/nfr-requirements/security-requirements.md`
used for its own `NFR5`).

## NFR5.1 — New dependencies stay dev-only

- **Requirement**: Jest, React Testing Library, and every supporting package
  this unit adds (`jest-environment-jsdom`, `@testing-library/jest-dom`,
  `@testing-library/user-event`, `@types/jest`, and the Next.js Jest
  integration) must be added as `devDependencies` only. This restates
  inception's `NFR2` ("no new production dependency") at this unit's own
  level of detail; `tech-stack-decisions.md` below records the specific
  packages this requirement constrains.
- **Verification**: after Code Generation, inspect `package.json` and
  confirm every package this unit adds appears under `devDependencies`,
  never `dependencies`.

## NFR5.2 — The test script runs with no secrets or network access

- **Requirement**: `pnpm test` (FR2.2) must run to completion using only
  what is already in the working tree and the `jsdom` test environment — no
  environment variable, API key, or network call. This project's own
  `technology-stack.md` confirms no backend, database, or network dependency
  exists today (`## Explicitly Absent`), and `contract-summary.md`'s
  Contract 1 commits `u4-ci-pipeline` to invoking this script exactly as
  `pnpm test` in CI, where no secrets are configured. A test suite that
  silently depended on an unset environment variable or an outbound call
  would fail unpredictably in CI rather than failing clearly, undermining
  `NFR4` (clear CI failure reporting) even though `NFR4` itself belongs to
  `u4-ci-pipeline`.
- **Verification**: review the added test files for `process.env` reads and
  for any `fetch`/`http`/network client usage; none should appear outside
  the existing `task-storage.ts`/`use-tasks.ts` code already covered by
  `NFR2`'s "no network call" guarantee.

## NFR5.3 — No real-looking credentials or PII in test fixtures

- **Requirement**: Any task data used as test fixtures must be obviously
  synthetic — following the existing `starterTasks` seed's style (plain demo
  task titles) — and must never resemble a real credential, API key, email
  address, or other personal data, even as placeholder content in a test
  assertion.
- **Verification**: review new test files for fixture data and confirm none
  of it reads as a real secret or PII value.

## Traceability

- `NFR5.1`-`NFR5.3` are new, unit-local security requirements under a new
  category (`NFR5`) identified at Construction time — Inception's
  `NFR1`-`NFR4` did not anticipate this level of dependency/test-execution
  hygiene. `NFR5.1` restates inception's `NFR2` at this unit's level of
  detail and is also covered by `tech-stack-decisions.md`; `NFR5.2` draws on
  `NFR4`'s intent (clear CI failure reporting) without taking on `NFR4`
  itself, which remains `u4-ci-pipeline`'s responsibility.
