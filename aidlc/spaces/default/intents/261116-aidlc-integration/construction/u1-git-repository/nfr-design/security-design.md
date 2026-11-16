# Security Design — u1-git-repository

Technical approach satisfying `NFR5.1` and `NFR5.2` from `nfr-requirements/security-requirements.md`.

## Design

1. **`.gitignore` is authored before `git init` runs.** Writing the ignore rules first means `git status` never shows an excluded path as untracked, removing any chance of accidentally `git add`-ing it before the rule exists.
2. **`.gitignore` content** (satisfies `NFR5.1` and `NFR5.2`). `requirements.md` FR1.1 specifies categories — build/dependency artifacts, environment files, OS/editor artifacts — plus a verbatim AI-DLC workspace-pattern list; the lines below are a reasonable concrete implementation of those categories (not an item-for-item quote of FR1.1 beyond the AI-DLC workspace lines, which ARE verbatim). This is the complete, authoritative `.gitignore` content for Code Generation to write — not a trimmed illustrative example — because for a unit this small, the config file itself is the whole design:
   ```gitignore
   node_modules/
   .next/
   out/
   build/
   dist/
   *.env
   *.env.*
   .env
   .env.local
   *.pem
   *.key
   .DS_Store
   Thumbs.db
   *.swp
   aidlc/active-space
   aidlc/spaces/*/intents/active-intent
   aidlc/.aidlc-clone-id
   aidlc/.aidlc-sessions/
   **/aidlc/spaces/*/intents/**/.aidlc-engine/
   aidlc/spaces/*/intents/*/runtime-graph.json
   aidlc/spaces/*/intents/*/.aidlc-*
   ```
3. **Pre-commit verification step** (manual, this one time — no git hook is introduced, since none was requested and adding one would be scope beyond FR1): before running `git commit`, run `git status --short` and `git diff --cached --name-only`, and confirm the file list contains no `.env*`, `*.pem`, `*.key`, or `aidlc/active-space`/`aidlc/.aidlc-sessions`/`.aidlc-engine` path. This check is performed once, at Code Generation time for this unit, and is not a recurring CI gate (CI's scope per `requirements.md` FR4 is lint/typecheck/test only).

## Threat Considered and Rejected

- **A pre-commit git hook enforcing the ignore rules** was considered and rejected as out of scope: `requirements.md` names no such requirement, and introducing one would be an unrequested process change for a one-time initial commit.

## Traceability

`NFR5.1` and `NFR5.2` are both fully addressed by the `.gitignore` content and the one-time verification step above.
