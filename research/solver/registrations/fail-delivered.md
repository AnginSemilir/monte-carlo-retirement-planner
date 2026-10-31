# Registration: the failure year at what it can pay, on a held-out seed (CHECKLIST.md item 2; STATE.md D43)

The maintainer decided on 29 Oct (D43) that `failDelivered` is the candidate's default, on the external review's finding
(SPENDING-CURVE.md on review/external-2026-10-21 at 37fdbf7, sections 7, 9 and 10: EXPLORATORY, eight households, seed 7002,
1,000 paths). This run tests that finding once on a seed none of it has read, with the prediction the maintainer registered.
Read once, by `research/solver/reduce-curve.mjs --registered`, after its gate. Launched only as
`PREDICTION=research/solver/registrations/fail-delivered.md research/solver/run-from-snapshot.sh bash research/solver/batch-fail-delivered.sh`
(the batch names this registration's seed alone, as the launcher's seed scan requires).

- **Question:** On a held-out seed, does charging the year the money runs out at the level it can pay (`failDelivered`) leave
  every path's survival as it was, leave the lifetime spending delivered within a tenth of a percent, and remove the raise
  before ruin (a 110% year just before the money runs out), as the review found on seed 7002?
- **Arms:** CAND, Phase 4's candidate `fcd8096217b7` (`PHASE4_OPTS`: candidate.json less failDelivered), and CANDD, the
  candidate `d71f65ae871e` (candidate.json: the same with `failDelivered: true`); nothing else differs. Each through
  `solveCandidate` at 45 wealth points (D26), the estate weight 0.02, lambda 0.0223606797749979 (Phase 4's), on the plan arm
  A's policy routes (`solverPlanOf`, D37), its table executed by the engine (`audit-curve.mjs`: Phase 4's runPath, held to
  E.runTrial on the first 200 paths; runPolicy beside the engine on the first 1,000). The harness checks each unit ran what it
  says: failDelivered off on CAND and on on CANDD, the lambda, the tier state and the candidate's switch charge, a raise on the
  menu; the reducer's gate checks the same from each unit's record (its failDelivered and lambda, and one grid, menu, switch
  charge, raise weight and failure price across the units) and holds a household's two units to one inputs hash, target and
  retirement year.
- **Households:** the review's eight, of Phase 4's panel, named by the review before any of its runs (SPENDING-CURVE.md
  section 4): S030, S050, S090 and S368, retired at the start; S188, still working; S304F, S328F and S340F, retiring at 52. The
  prediction is the review's on these households, so the run keeps them; they were read before on seeds 7003 and 7018 (Phase 4)
  and 7002 (the tier test and the review), never on this seed.
- **Seed:** 7019, added to the seed registry for this registration alone (`check-prediction.mjs`, on the maintainer's unlock)
  and read by nothing before. Path i of a seed draws from seed + 7919 i, and 7019 differs from no other seed read here by a
  multiple of 7919, so it shares no path with them.
- **Paths:** 4,000 a unit (32,000 paired paths an arm). P1 and P3 are counts that a single path misses, so they need no power.
  P2: the review's own se for CANDD less CAND was about 0.001% at 1,000 paths (the design review of 29 Oct, finding 5), so
  the 0.1% band is about two hundred of them at 4,000: a true -0.007% reads held with chance indistinguishable from 1.
  The paths that run out under CAND were 2.5% on the review's seed (202 of 8,000), so about 800 here, against which P3 reads a
  true raise before ruin of half a percent as missed with chance above 0.98.
- **Primary metric:** scored by the engine, each household counted once: P1, the paths whose survival differs between CANDD
  and CAND (saved or lost); P2, the lifetime spending delivered, CANDD less CAND, in % of CAND's, its 95% interval by path; P3,
  of CANDD's paths that run out (a year's spending unmet), those whose year before was at 110% of target. Beside them, not
  deciding: the survival change with its interval; P1's paths by kind (running out, or meeting every year's spending and
  ending below the minimum pot); spending while alive (the review's Gompertz weights); CAND's share for P3 (the review's
  30.2%); a 110% year in any of the three years before ruin, under each arm (the design review's finding 3); each arm's
  pension and ISA equity share at years 1, 5, 10 and 20; and runPolicy beside the engine.
- **Expected before the run** (the design review of 29 Oct, finding 4): P1 may well miss on a few paths. On V2's settings
  (seed 99001, 2,000 paths, 30 points) the option lost one path on S008 and one on S330 and saved none, both paths meeting
  every year's spending and ending below the minimum pot; the backward pass also picks failing moves at some cells where a
  paying move exists (finding 3), though the chooser never takes one. The prediction stands as the maintainer registered it.
- **Decision rule:** P1 held if no path's survival differs; P2 held if the estimate lies within -0.1% to +0.1%; P3 held if
  none of CANDD's paths that run out has a 110% year before. All three held: HELD. Any other: MISSED, and HARM if the pooled
  survival change's 95% interval lies wholly below -0.1 points, the decided pooled margin (STATE.md's decided defaults,
  "margins"; the design review's finding 4: below zero alone would call four lost paths in 32,000 harm). One read, no looks
  before every unit is in.
- **Outcomes:** HELD: the review's finding stands on a held-out seed; D43's default stands, recorded in STATE.md. MISSED: the
  figures go to the maintainer; the default, decided before the run, stands unless the maintainer reverses it. HARM: the
  maintainer rules before Part C takes the default; until then Part C uses Phase 4's candidate (`fcd8096217b7`).
- **Budget:** 16 units, one a process, four at a time; about 14 minutes a unit (a solve of 8 to 13 minutes at 45 points, as
  gate 5 and Phase 4 measured, and the paths), so about an hour on four cores.
- **Design review:** research/solver/reviews/2026-10-29-fail-delivered-rereview.md, after the first, FAIL with two blocking
  findings since fixed (research/solver/reviews/2026-10-29-fail-delivered-design.md)
