# Practices Discovery — Questions

## Q1. [Release engineer] Branching

Since this repository has no `.git` history yet, what should the main branch work merges into be, and how should branches/PRs work?

A. Use `main` as the single integration branch, with short-lived feature branches merged via PR (simple trunk-based flow)
B. Use `main` directly, no formal branching convention needed for now
X. Other (please specify)

[Answer]: A. Use `main` as the single integration branch, with short-lived feature branches merged via PR (simple trunk-based flow)

## Q2. [Release engineer] Walking skeleton

This app already has a complete, working, end-to-end flow (load tasks → display → edit/delete → persist to localStorage). A walking skeleton is a minimal slice built first to prove the pieces connect before deeper work starts. Should AI-DLC treat the existing app as that already-proven skeleton (build directly on it, no separate skeleton checkpoint), or build a fresh walking-skeleton checkpoint for this specific change first?

A. Treat the existing app as the proven skeleton already — build directly from here
B. Build a new walking-skeleton checkpoint for this change before deeper work
X. Other (please specify)

[Answer]: A. Treat the existing app as the proven skeleton already — build directly from here

## Q3. [Quality engineer] Testing methodology

This repo currently has zero tests. For the work this intent adds, should tests be written after each piece works (test-after, matching how the app was built so far), or should new code be written test-first (TDD)?

A. Test-after — write tests once each piece works, matching existing practice
B. TDD — write tests first for new code
X. Other (please specify)

[Answer]: A. Test-after — write tests once each piece works, matching existing practice

## Q4. [Quality engineer] Coverage target

Given this app is currently framed as a demo/prototype with no tests and no CI, what level of test coverage should the work in this intent meet?

A. No strict target — new/existing tests just need to stay green
B. Adopt an explicit target (e.g. 80% line coverage)
X. Other (please specify)

[Answer]: A. No strict target — new/existing tests just need to stay green

## Q5. [Release engineer] Deployment scope

There is no CI/CD, hosting config, or deployment pipeline in this repo today. For this piece of work, should AI-DLC set up a deployment pipeline, or is this a local-development-only integration for now?

A. Local development only — no deployment pipeline needed right now
B. Set up a basic CI pipeline (lint/typecheck/test) but no hosting/deploy target yet
C. Set up both CI and a deployment target
X. Other (please specify)

[Answer]: B. Set up a basic CI pipeline (lint/typecheck/test) but no hosting/deploy target yet

## Q6. [Developer] Code formatting

The code is consistently formatted (2-space indent, double quotes) but there's no Prettier or other formatter configured. Should AI-DLC add a formatter as part of this work, or leave formatting as it is today?

A. Add Prettier (or similar) and enforce it
B. Leave as-is, no formatter needed
X. Other (please specify)

[Answer]: A. Add Prettier (or similar) and enforce it

## Q7. [Developer] Comment style

The existing code has zero inline comments or doc comments anywhere — descriptive naming does the explaining instead. Should new code added for this intent follow that same no-comments style, or add comments where helpful?

A. Keep the no-comments style consistent with the rest of the code
B. Add comments where genuinely helpful, even though existing code has none
X. Other (please specify)

[Answer]: A. Keep the no-comments style consistent with the rest of the code — already established as a standing preference for this developer, applying to all code in this project regardless of task; not re-asked.
