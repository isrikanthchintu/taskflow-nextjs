# Tech Stack Decisions — u3-code-formatting

| Decision | Choice | Rationale |
|---|---|---|
| Formatter | Prettier (core package only, no plugins) | Explicitly affirmed by the person (Q6, `team.md` Code Style: "Prettier (or an equivalent formatter) is added and enforced going forward"). Core Prettier alone reproduces the existing observed conventions (2-space indentation, double-quoted strings, trailing commas in multi-line structures) with no plugin needed (`NFR5.2`). |

No database, framework, additional library, or infrastructure tool decision
applies to this unit — `u3-code-formatting`'s boundaries are the Prettier
config file and `package.json` script entries only (`unit-of-work.md`).
Prettier is added as a `devDependency` only (`NFR5.1`), matching inception's
`NFR2` ("no new production dependency").
