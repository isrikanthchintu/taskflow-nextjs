# Tech Stack Decisions — u2-test-infrastructure

All decisions below add `devDependencies` only (`NFR2`, restated as `NFR5.1`
in `security-requirements.md`) and target this project's existing stack —
Next.js ^15.5.0 App Router, React ^19.1.0, TypeScript ^5.7.2 with
`strict: true`, the `@/*` path alias, and the `pnpm` package manager
(`technology-stack.md`).

| Decision | Choice | Rationale |
|---|---|---|
| Test runner | Jest, via Next.js's built-in `next/jest` integration | FR2.1 names Jest explicitly. `next/jest` configures Jest's SWC-based transform and resolves the `@/*` path alias from `tsconfig.json` automatically, so no separate Babel config or manual `moduleNameMapper` entry is needed — the existing path-aliasing convention (`project.md` `## Mandated`) keeps working in tests with no duplicated configuration. |
| Component testing utility | `@testing-library/react` + `@testing-library/jest-dom` + `@testing-library/user-event` | FR2.1 names React Testing Library. `@testing-library/jest-dom` adds the DOM-specific matchers (`toBeInTheDocument`, etc.) FR3.3's component assertions need; `@testing-library/user-event` drives the click/type/filter interactions FR3.3 covers more realistically than `fireEvent`. |
| Test environment | `jest-environment-jsdom` (default for FR3.2/FR3.3), with the `@jest-environment node` docblock override on the FR3.1 SSR-guard test case | Jest 28+ requires `jest-environment-jsdom` as a separate package when a browser-like DOM (`window`, `localStorage`) is needed — required for the hook and component tests (FR3.2, FR3.3) and for the storage round-trip tests. FR3.1 additionally requires proving `readTasks`/`writeTasks` make no `window` access when `window` is undefined (the project's `## Mandated` SSR-safety rule) — the only way to exercise that branch is a `node` environment with no DOM, so that one test file overrides the environment per-file rather than globally. |
| Type definitions | `@types/jest` | TypeScript `strict: true` (project `## Mandated`) needs typed Jest globals (`describe`, `it`, `expect`) for the new test files to type-check under `pnpm typecheck`. |
| Mocking / network stubbing library | None added | `technology-stack.md`'s `## Explicitly Absent` confirms no backend, database, or network call exists in the application; `NFR5.2` requires the test suite to make no network call either, so there is nothing to mock. |
| Assertion library | Jest's built-in `expect`, extended by `@testing-library/jest-dom` | No separate assertion library (e.g. Chai) is justified; Jest's own matchers plus the DOM-specific extension cover FR3.1-FR3.3's assertions. |

No database, backend framework, or additional build tool is selected for
this unit — `u2-test-infrastructure`'s boundaries are new test files and
Jest configuration only (`unit-of-work.md`), and the project's `## Forbidden`
rule against introducing a database or backend API applies unchanged.
