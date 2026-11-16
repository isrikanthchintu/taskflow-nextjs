# Security Requirements — u1-git-repository

This unit's own `kind` (`packaging`) excludes it from performance, scalability, reliability, and observability requirements (`nfr-requirements.md`'s `produces_kinds`, restricted to `service`/`ui` units). Security is the one NFR category that genuinely applies: initializing version control is where secrets or unwanted files most easily end up committed permanently.

Inception's `requirements.md` enumerated `NFR1`-`NFR4`; none of them covers git/secrets hygiene, because Inception could not anticipate this level of operational detail. The two requirements below are filed as **`NFR5`** — a new NFR category identified during Construction, not a sub-item of any existing inception NFR (in particular, not of `NFR2`, whose unrelated "no new production dependency" is satisfied separately by `tech-stack-decisions.md`).

## NFR5.1 — No secret or credential ever committed

- **Requirement**: The initial commit (FR1.2) must not include any `.env*` file, credential, API key, or other secret. This project's own `.env.example` confirms no environment variables are required today, so the working tree should contain none to accidentally commit — but the `.gitignore` (FR1.1) must still exclude any `.env*` pattern as a standing safeguard for future secrets.
- **Verification**: before the initial commit, run `git status` and `git diff --cached --stat` and visually confirm no `.env*`, `*.pem`, `*.key`, or credential-shaped file is staged.

## NFR5.2 — AI-DLC's own workspace state never committed

- **Requirement**: The `.gitignore` (FR1.1) must exclude every per-user/per-clone AI-DLC runtime path named in `.claude/CLAUDE.md`'s "Git Integration" section (`aidlc/active-space`, `aidlc/spaces/*/intents/active-intent`, `aidlc/.aidlc-clone-id`, `aidlc/.aidlc-sessions/`, `**/aidlc/spaces/*/intents/**/.aidlc-engine/`, `aidlc/spaces/*/intents/*/runtime-graph.json`, `aidlc/spaces/*/intents/*/.aidlc-*`). This was already identified as R-01 in the Requirements Analysis review and fixed in `requirements.md` FR1.1 — this requirement restates it as a security/hygiene NFR so it is independently verified at Code Generation time, not just documented.
- **Verification**: same as NFR5.1 — inspect staged files before commit; none of the excluded patterns should appear.

## Traceability

- `NFR5.1` and `NFR5.2` are new, unit-local security requirements under a new category (`NFR5`) identified at Construction time — Inception's `NFR1`-`NFR4` did not anticipate this level of git-hygiene operational detail. Inception's `NFR2` ("no new production dependency") is satisfied separately by `tech-stack-decisions.md` and is unrelated to `NFR5`.
