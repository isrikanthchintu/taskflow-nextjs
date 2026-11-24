# Security Design — u2-test-infrastructure

Technical approach satisfying `NFR5.1`-`NFR5.3` from
`nfr-requirements/security-requirements.md`.

## Design

1. **`NFR5.1` — dependency placement.** `package.json`'s `devDependencies`
   key is the only place Code Generation adds `jest`,
   `jest-environment-jsdom`, `@testing-library/react`,
   `@testing-library/jest-dom`, `@testing-library/user-event`, and
   `@types/jest` (the packages `tech-stack-decisions.md` selected). None of
   them is added to `dependencies`. This is a placement rule, not a runtime
   mechanism — there is no code to design beyond where the package manager
   records the package.

2. **`NFR5.2` — a test environment that cannot reach a secret or the
   network.** The Jest configuration (via `next/jest`, per
   `tech-stack-decisions.md`) sets `testEnvironment: "jsdom"` as the
   default for every test file, giving `use-tasks.ts` and `TaskDashboard`
   tests a `window`/`localStorage` to exercise without any real browser or
   server process. `jsdom`'s `localStorage` is in-memory and per-test-file —
   it never touches a real filesystem, device, or network socket, so there
   is nothing for a test to inadvertently leak over. No global
   `setupFilesAfterEach`/`setupFiles` entry reads `process.env`: this
   project defines no environment variables today (`technology-stack.md`),
   and the test suite must not become the first thing in the repo that
   needs one. `src/lib/task-storage.ts`'s existing SSR guard
   (`typeof window === "undefined"`) is exercised by one dedicated test
   file carrying a `/** @jest-environment node */` docblock override
   (FR3.1's SSR-guard case) — pointing the environment at `node` for only
   that file, rather than adding a conditional branch inside a shared
   config, keeps the override local to the one test that needs it.

3. **`NFR5.3` — fixture data stays obviously synthetic.** New test fixtures
   (task titles, status values) follow the existing `starterTasks` seed's
   style — short, generic, demo-shaped task descriptions (e.g. "Draft
   proposal", "Review pull request") — the same pattern already present in
   `src/hooks/use-tasks.ts`. No fixture uses an email-shaped string, a
   token-shaped string, or any value resembling a real credential; this is
   a content convention for Code Generation to follow when authoring test
   data; there is no library or sanitizer to add; the project's
   `## Forbidden` rule against new runtime dependencies rules one out even
   if it were considered.

## Threat Considered and Rejected

- **A network-mocking library (e.g. MSW) as a defensive layer** was
  considered and rejected: `technology-stack.md`'s `## Explicitly Absent`
  confirms no network call exists in the code under test, so there is
  nothing to intercept. Adding one would introduce an unused dev dependency
  with no corresponding risk to mitigate.
- **A custom Jest `globalSetup`/`globalTeardown` hook to scrub environment
  variables** was considered and rejected: the project defines no
  environment variables to scrub (`technology-stack.md`), so the hook would
  have nothing to do; `NFR5.2` is satisfied by never reading `process.env`
  in the first place, which needs no runtime enforcement mechanism.

## Traceability

`NFR5.1`-`NFR5.3` are each fully addressed by one design decision above: a
placement rule, a test-environment configuration (with one documented
per-file override), and a fixture-authoring convention. None requires a new
runtime mechanism, consistent with this unit's `library` kind having no
production surface.
