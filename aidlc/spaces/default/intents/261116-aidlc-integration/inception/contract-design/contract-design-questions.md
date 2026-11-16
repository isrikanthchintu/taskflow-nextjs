# Contract Design — Questions

The dependency DAG from Units Generation has exactly one inter-unit edge (u4-ci-pipeline → u2-test-infrastructure), and no unit exposes a public/external API consumed outside the system. This stage still applies (there is one inter-unit boundary), but the boundary itself is a simple build-time reference, not a runtime API — so this is one confirming question rather than a full set.

## Q1. [Architect] The one boundary in this system

**Proposed contract**: U4's CI workflow references the npm script name `test`, which U2 is responsible for adding to `package.json`. This is a shared-interface agreement (a stable script name), not a network API — no HTTP/event protocol, no payload shape, no timeout/retry behavior, since nothing calls across a network boundary. The agreement is: U2 owns the `test` script's name and guarantees it runs the full suite non-interactively and exits non-zero on failure (per FR2.2); U4 is the consumer and must not invent a different script name.

No public/external API exists anywhere in this intent's scope (confirmed in requirements.md: zero new UI, zero new API surface).

A. Accept this as the one contract (shared script-name interface, U2 owns, U4 consumes)
B. Something else needs a contract too (say what)
X. Other (please specify)

[Answer]: A. Accept this as the one contract (shared script-name interface, U2 owns, U4 consumes) — confirmed on follow-up: no additional contracts are required. U2 owns the `test` script and guarantees it executes the complete test suite; U4 references this script in its CI workflow; no HTTP API, network protocol, or runtime communication is required between these units.
