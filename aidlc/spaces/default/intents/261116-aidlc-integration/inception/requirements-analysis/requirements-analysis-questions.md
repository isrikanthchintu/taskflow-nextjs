# Requirements Analysis — Questions

## Q1. [Product manager] What this piece of work actually delivers

Your original request was to "integrate AI-DLC" into this project and preserve the existing app and its localStorage behavior. The AI-DLC process scaffolding is already in place in this repo (that's what we're running right now). Concretely, what should this piece of work produce?

A. Process/tooling only: a CI pipeline (lint, typecheck, test) and a baseline automated test suite covering the existing app, with no change to TaskFlow's features, UI, or behavior
B. Process/tooling, plus specific feature work on TaskFlow itself (describe which features — e.g. finishing the edit-task flow, wiring up the sort button, the inactive sidebar nav links)
X. Other (please specify)

[Answer]: B. Process/tooling, plus specific feature work on TaskFlow itself — which features is asked as a follow-up (Q5), since Q4 ruled out the existing inactive placeholders (edit-task flow, sort button, nav links) as that work.

## Q2. [Release engineer] Git and CI platform

This repository has no git history yet. The affirmed practice is a basic CI pipeline (lint/typecheck/test) with no hosting/deploy target. To build that pipeline, AI-DLC needs to know:

A. Initialize git and scaffold GitHub Actions (`.github/workflows/ci.yml`) — assumes you'll host this on GitHub eventually
B. Initialize git only; hold off on CI workflow files until you've chosen a platform
C. A different CI platform (name it)
X. Other (please specify)

[Answer]: A. Initialize git and scaffold GitHub Actions (`.github/workflows/ci.yml`)

## Q3. [Quality engineer] Test framework

There is no test framework in this project yet. The affirmed testing posture is test-after, with tests required to exercise the existing localStorage-backed persistence path. Which test framework should be added?

A. Vitest + React Testing Library (fast, modern, pairs well with this Next.js setup)
B. Jest + React Testing Library (the traditional Next.js default)
X. Other (please specify)

[Answer]: B. Jest + React Testing Library

## Q4. [Product manager] Existing non-functional UI elements

The codebase scan found a few inactive pieces: the `updateTask` function exists in the hook but nothing in the UI calls it (no edit-task flow), and a sort icon button plus some sidebar nav links are visual-only placeholders with no behavior. Should any of these be finished as part of this intent, or are they explicitly out of scope for now?

A. Leave all of them exactly as they are today — out of scope for this intent
B. Finish some of them (say which)
X. Other (please specify)

[Answer]: A. Leave all of them exactly as they are today — out of scope for this intent

## Q5. [Product manager] Which specific feature(s)

Follow-up to Q1: you said this intent should include specific feature work on TaskFlow itself, beyond tooling — but Q4 confirmed the existing inactive placeholders (edit-task flow, sort button, nav links) are explicitly out of scope. What feature(s) would you like built?

[Answer]: Actually, tooling only — no new TaskFlow feature. This resolves the Q1/Q4 contradiction: Q1's "B" was reconsidered on reflection. This intent is CI pipeline + baseline test suite only, with zero changes to the app's existing features, UI, or behavior.
