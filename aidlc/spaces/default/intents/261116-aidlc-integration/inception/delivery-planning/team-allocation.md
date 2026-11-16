# Team Allocation

Team Formation did not run for this scope (classic skips it) — every Bolt is built by the developer agent (AI-only), with the person approving at each checkpoint.

| Bolt | Mob | Notes |
|---|---|---|
| Bolt 1 — Foundation | aidlc-developer-agent | Builds U1, U2, U3 serially (unit-major, Construction Checkpoints enabled by default) |
| Bolt 2 — CI Pipeline | aidlc-developer-agent | Builds U4 after Bolt 1's U2 is complete |

No Program Board is needed — a single AI builder means no cross-team coordination surface.
