# Security Requirements — u3-code-formatting

This unit's `kind` (`packaging`) excludes it from performance, scalability,
reliability, and observability requirements (`nfr-requirements.md`'s
`produces_kinds`, restricted to `service`/`ui` units). Security is still
relevant in the same narrow sense it was for `u1-git-repository`: this unit
adds one new dev dependency (Prettier) and a config file that, if ever run
broadly, writes to files on disk.

Inception's `requirements.md` enumerated `NFR1`-`NFR4`; none of them covers
formatter/tooling hygiene. The two requirements below are filed as **`NFR5`**
— a new NFR category identified during Construction, unit-local to this
document (the same convention `u1-git-repository` and `u2-test-infrastructure`
each used for their own `NFR5`).

## NFR5.1 — Prettier stays dev-only

- **Requirement**: `prettier` must be added to `package.json`'s
  `devDependencies` only (`FR5.1`). This restates inception's `NFR2` ("no new
  production dependency") at this unit's level of detail.
- **Verification**: after Code Generation, inspect `package.json` and
  confirm `prettier` appears under `devDependencies`, never `dependencies`.

## NFR5.2 — No third-party Prettier plugins

- **Requirement**: the Prettier configuration must use only the core
  `prettier` package — no third-party plugin (e.g. a Tailwind class-sorting
  plugin, an import-sorting plugin). A Prettier plugin runs arbitrary code
  against every formatted file; since this project needs only the
  already-observed conventions (2-space indentation, double-quoted strings,
  trailing commas), there is no formatting need a plugin would serve, so
  adding one would be unrequested supply-chain surface with no corresponding
  benefit.
- **Verification**: inspect the Prettier config file and `package.json` for
  any `prettier-plugin-*` or plugin-array entry; none should be present.

## Traceability

- `NFR5.1` and `NFR5.2` are new, unit-local requirements under a new category
  (`NFR5`) identified at Construction time — Inception's `NFR1`-`NFR4` did not
  anticipate this level of formatter/tooling detail. `NFR5.1` restates
  inception's `NFR2` at this unit's level and is also covered by
  `tech-stack-decisions.md`.
