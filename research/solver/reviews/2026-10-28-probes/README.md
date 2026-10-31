# The probes behind Phase 4's two reviews (28 Oct; EXPLORATORY)

Copied from the session's scratchpad so that readers of the reviews can see them, their absolute paths made relative
and nothing else changed; nothing here is a test or part of any read.

- `read/`: the reviewer at the read (`reviews/2026-10-28-read-phase4.md`): `indep.mjs` (the independent recomputation of
  A1, A2 and S1), `logs.mjs` (provenance), `fixbr.mjs` (MINOR 1), `levels.mjs`, `below.mjs`, `failyear.mjs` (MINOR 2: the
  spend levels, the years at the floor, the raise before failure), `minpot.mjs` (MINOR 4), `unmet.mjs` (MINOR 3).
- `deep/`: the deep review (`reviews/2026-10-28-deep-phase4.md`): `probe.mjs` and `probe2.mjs` (section 2: the raise
  before ruin and the first year's cut, on S090 and S328F, seeds 7002 and 99002; their outputs `probe-*.txt`,
  `probe2-*.txt`), `split.mjs` (section 6: SHIP with and without tier changes on eight households, 1,000 paths of 7002;
  `split-*.txt`), `traj.mjs` (section 1: where the gain comes from), `consent.mjs` (the consent blocker, since fixed: D39),
  `fails.mjs`, `after.mjs`, `shipnc.mjs`, `timing.mjs`.

Two things to know before running any of them:
1. Run them from the repository root: their imports are relative to this folder, their file paths to the root (the
   absolute paths of the session's checkout replaced, as the hygiene test requires).
2. The `read/` scripts and `deep/traj.mjs` read Phase 4's raw units in `research/solver/results/diagp4`, which stay outside
   git (D17). To regenerate units like them on a seed that is not held out, use the Phase 4 audit's pilot mode, e.g.
   `P4_PILOT=1 P4_ONLY=S090 node research/solver/audit-phase4.mjs 2000 part 0/1 7002` (never 7003 or 7018), or the tier
   test's audit (`audit-tiers.mjs`, seed 7002). The `deep/probe*.mjs` and `split.mjs` scripts solve for themselves.
