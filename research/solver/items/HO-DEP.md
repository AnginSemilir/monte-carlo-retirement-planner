# HO-DEP: the fixed adaptive reference against the order reference on deposit households (detail for PLAN.md's AREF row and its 18 Oct 09:43 ledger row)

Proposed by the deep review after FOOT-S366 (deep-review-log.md 18 Oct 09:43 UK); adopted under the maintainer's standing
go-ahead, with the maintainer's decision of 18 Oct that a reference change's harm is read by the mixture only.

## Why

FOOT-S366 read R1 on S366, where after the fix the adaptive reference makes the order reference's every move: S366 cannot tell
the two apart. The case for the fixed reference rests on S360 and S364 (no inflow) and on no deposit household read against the
order reference. On S362, FOOT-S366's reported lines show the fix trading runs across worlds against the unfixed reference
(O179), with no order-reference control.

## The jobs (seed 7004, the first 4,000 paths a world; the slim design, the deep-reviewer's consult of 18 Oct 11:27 UK)

- S362 at 30 points: K1F (the adaptive reference, the RS split, the fix; it reproduces FOOT-S366's saved K1F on every array
  both carry, the only end-to-end check of the new audit's copied ledger) and K2 (the order reference, O179's control). K1
  (the unfixed reference) is dropped: R1 runs every later test with the fix, so the unfixed reference is no candidate; O179's
  whole-score leg stays unread and O179 stays open (the consult's Q1).
- One more deposit-mid household, HOUSE2 (not S362 or S366): A (the adaptive reference, the RS split, the fix) and O (the
  order reference), at 30 points, the product's grid (PRODUCT_BASELINE points 30), as S362's (the consult's Q2: the
  reference's effect grows with cell width, so both households at the same points).
- Every job saves each path's whole score (survival, the capped estate at the run's estate weight, the dislike of cuts, the
  raise credit: reduce-7t.mjs scorePaths over the run's trace, sized T + 1, held to runPolicy's own counters).
- HOUSE2 is chosen before registration in two steps (PREDICTION="none:..."): the screen, the 13 candidates under the order
  reference at 15 points, 400 paths a world, names the four whose world-0 survival lies in [20, 80], nearest 50 (AX-HO's reach
  lesson; the consult's Q3: a 4-point screen misplaces world-0 survival by 10 to 15 points); the reach, A and O on each of
  the four at 30 points on paths 4,000 to 4,399 (disjoint from the batch's 4,000, so it previews none of the batch's runs; its
  tables are the batch's, the solve not depending on the paths), names the household where the two move differently on the
  most MIX3-weighted path-years among those whose O world-0 survival stays in the band at 30 points.

## The items (as registered, predictions/diag-hodep.md; HOUSE2 is S370, the reach's choice)

1. No material harm, A against O on S370, by the mixture (survival and whole score), each world's line reported.
2. No material harm, K1F against K2 on S362, by the mixture (survival and whole score), K1F's GB by year and world beside
   K2's (O179's control).
3. The accuracy contrast on S362 (the consult of 11:27 UK, Q5a, read on S362 alone by the consult of 15:09 UK): HELD when K2's
   table-less-runs lies wholly beyond 1 point at the mixture and K1F's within 1 (DEP-ADVCAL); FALSIFIED when the two tables lie
   within 0.5 of each other in every world and the fixed does not read truer (DEP-NONE); the pattern 'worse' its own row
   (DEP-WORSE). S370's contrast reported: there the tables sit 1.04 apart in world 0 with neither within a point of its runs.

The first draft's item 3 (A's table within 1.5 points of its runs on HOUSE2) was dropped by the consult of 15:09 UK: the reach's
records decided it (both references over-read S370's world 0 by about 13 points on runs that agree but for a few paths, O180;
results-hodep-s370.txt), and its row blamed the adaptive reference for an error the order reference shares.

HO-DEP settles the DEP causes on S362 and O179-FIXOWN (with the corner test at S362's cells); O179-TRADE, O179-SECOND and O180
stay open. Its finding is scoped to deposit households whose bridge is at risk: on S394, S382 and S406 the two references are
identical to the bit in every world (results-hodep-reach.txt), and the screen's other candidates bridge every path under the
order reference at 15 points (results-hodep-screen.txt and its case logs; whether A equals O on them NOT CHECKED).

## The rule's steps before HO-DEP relies on it (the plan-auditor's MINOR 2 of its FAIL on the 09:43 row)

- RULES.md section 8 amended: a reference change's per-household test is the mixture of the per-world intervals, not the
  per-world exact conditional McNemar alone, by the maintainer's decision of 18 Oct (PLAN.md's 18 Oct 09:43 row).
- stats.mjs: mixtureChange and mixtureOutcome (survival), mixtureMean (the whole score), at the weights MIX3W; the margin
  marginRel at the control's mixture survival.
- The maintainer's rule of 29 Sep ("every new test reads survival by both") carried over: each world's interval is the
  unconditional one held at least as far out as the exact conditional bound at each end, before the worlds are combined.
- The combined interval's rate at a true weighted loss at the margin measured by simulation before HO-DEP registers
  (sim-mixture.mjs, results-sim-mixture.txt), and the interval's level set from it: at 95% the rule read "no material harm"
  3.67% to 4.21% of the time on S362-like cells, against the 2.5% stated, so it reads the interval at 98% (MIX_LEVEL), which
  holds 1.78% to 2.27% there, 0.95% to 0.98% at mid survival and 0.03% to 0.39% at high survival.
- The whole score (mixtureMean, a normal interval on each world's paired mean, combined at the weights, at the same 98%):
  its margin marginRel at the control's mixture survival, in points, as the survival read's; its rate at a true weighted loss
  at the margin 1.80% to 2.02% on S362-like discordance with a continuous part of sd 0.3 points a path
  (results-sim-mixture.txt), the plan-auditor's MINOR 2 of the re-audit's PASS.

## Its gate

The design-reviewed corner test, research/tests/adaptive-corner.test.mjs: the reference's p against simulate() under S362's
K1F settings at four slices (A0, bridge years 1 to 3 at no accessible money; CLIFF, years 1 to 3's step in p by bisection,
read either side outside the lattice's smear; SMOOTH, years 1 and 2's crossings, reported, not bound; Y4, year 4, S362's
inflow year, from A 0 to either side of the unfixed top), on two fixtures (base, and top: an inflow raised to reach O178's
case), with the plants foot (in A0), drift (in CLIFF or Y4) and top (in Y4) each caught in its own slice; declared GATE-READY by the deep-reviewer for blob 12f8d78e97dd
(deep-review-log.md 18 Oct 12:06 UK, CHECKLIST item 6). The gate is met when that blob's run prints every verdict PASS.

## STOP until HO-DEP reads

A reference default; 7u-F with the adaptive reference; more S366 jobs for the reference question; a copy or split change aimed
at S362's GB; a single-world harm read of a reference change; FOOT-S366's item 4 cited as no-harm where the references differ.

The STOP list stands after HO-DEP's read until the deep review after it is adopted (the decision table's 'else' row).

## READ 18 Oct 18:17 (PLAN.md's 18 Oct 18:17 row; results-hodep.txt; Brier 0.118 over 3, results-scorecard-hodep.txt)

Items 1 and 2 HELD, item 3 INCONCLUSIVE: the decision table's 'else'. The fixed adaptive reference loses no material survival or
whole score against the order reference by the mixture on S370 (survival -0.0292, -0.1406 to 0.0819) or S362 (-0.1208,
-0.3442 to 0.1167); on S362 K1F's table less runs at the mixture is -0.7947 against K2's -1.7831, the fixed about a point
truer (0.9883) but K2's interval not wholly beyond a point. Reported: S362's world lines repeat O179's trade against the order
reference; K2's GB on S362 swings by year (world 0's year 3 -7.2840, year 4 3.5368); S370's world-0 over-read under both
references holds at 4,000 paths (O180). Next: the deep review reads the unsettled item and the reported lines; nothing built;
no default.
