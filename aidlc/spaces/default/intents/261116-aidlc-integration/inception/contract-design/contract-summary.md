# Contract Summary

Derived from the unit definitions in `unit-of-work.md` and the dependency DAG in `unit-of-work-dependency.md` (Units Generation): `unit-of-work-dependency.md`'s single edge — U4 (`u4-ci-pipeline`) depends on U2 (`u2-test-infrastructure`) — is this system's only candidate contract boundary; `unit-of-work.md`'s four unit descriptions confirm no unit exposes a public/external API consumed outside the system (all four are local tooling, per their "Deployment model" fields), and `requirements.md` confirms zero new UI and zero new API surface in this intent's scope.

## Contracts Table

| # | Provider Unit | Consumer | Mechanism | Owner |
|---|---|---|---|---|
| 1 | U2 (`u2-test-infrastructure`) | U4 (`u4-ci-pipeline`) | Shared interface (stable npm script name) | U2 |

## Contract 1 — Test Script Interface

A build-time shared-interface contract, not a network protocol: U4's CI workflow invokes a script by name; U2 is the sole owner of that script's definition.

```yaml
shared-interface:
  name: test-script-interface
  version: "1.0"
  provider: u2-test-infrastructure
  consumer: u4-ci-pipeline
  interface:
    type: npm-script
    script_name: test
    package_file: package.json
  provider_guarantees:
    - the "test" script name is stable and will not be renamed without updating this contract
    - running "pnpm test" executes the complete test suite added in U2 (storage, hook, and component tests)
    - the script runs non-interactively (no watch mode) and exits non-zero on any test failure, zero on full success
  consumer_obligations:
    - u4-ci-pipeline's workflow MUST invoke the script exactly as "pnpm test", never a different script name or direct test-runner invocation
  failure_behavior:
    - a non-zero exit from "pnpm test" fails the CI workflow run (FR4.2); there is no retry, since test flakiness is out of scope for this intent
  out_of_scope:
    - no network call, no HTTP/async protocol, no payload shape — this is a local, build-time reference only
```

## Contract Ownership Rules

- U2 owns the `test` script's name and behavior. A breaking change (renaming the script, changing its exit-code semantics) requires updating this contract and U4's workflow in the same change.
- U4 owns nothing provided to another unit — it is a consumer only.
- No additive-change concern applies here (there is no payload schema to extend); the only compatibility surface is the script *name* itself, which is either present and correct or not.

## Open Questions

| Contract | Question | Blocks |
|---|---|---|
| — | None — the single contract was confirmed with no remaining ambiguity. | — |
