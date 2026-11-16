# Delivery Planning — Questions

## Q1. [Delivery lead] Bolt sequencing

A Bolt is one build pass over a piece of the work, ending in something that runs. Given how small and low-risk this intent is (4 small units, one dependency edge), here's the proposed sequencing:

**Proposed plan**: 2 Bolts.
- **Bolt 1 — Foundation**: bundles U1 (git repository), U2 (test infrastructure), U3 (code formatting) — all independent of each other, can build in any order. Foundation-first: nothing here depends on anything else, and U2 unblocks Bolt 2.
- **Bolt 2 — CI Pipeline**: U4 only, since it needs U2's `test` script to exist first (the dependency edge from Units Generation).

No formal WSJF-style scoring is proposed — with only 2 Bolts and one real dependency, the DAG itself already determines the only sensible order; a scoring model would add ceremony without changing the outcome. Both Bolts build serially (Construction Checkpoints default: unit-major, serial) with AI-only execution (no team formation ran for this scope — aidlc-developer-agent builds every Bolt). Nothing outside this team blocks any Bolt (no external APIs, no data availability windows, no other team hand-off) — the one external step (pushing to a GitHub remote) is the person's own, already flagged as Assumption A1 in requirements.md and out of this intent's reach.

The main risk worth calling out early: the `.gitignore` must correctly exclude AI-DLC's own workspace files on the very first commit (U1) — getting this wrong is awkward to fix after the fact (git history would carry files that should never have been committed).

A. Accept this Bolt plan as proposed (2 Bolts, foundation-first, no formal scoring, AI-only)
B. Change it (say what)
X. Other (please specify)

[Answer]: A. Accept this Bolt plan as proposed (2 Bolts, foundation-first, no formal scoring, AI-only)
