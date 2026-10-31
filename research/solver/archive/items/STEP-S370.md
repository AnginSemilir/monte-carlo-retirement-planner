# STEP-S370: does the step read's copy across the unsupported top share node carry S370's world-0 bridge over-read? (detail for PLAN.md's STEP-S370 row and its 18 Oct 18:42 ledger row)

Proposed by the deep review after HO-DEP (deep-review-log.md 18 Oct 18:40 UK) as the one decisive test; adopted under the
maintainer's standing go-ahead and the decision of 18 Oct 17:19 (PLAN.md: 7u-F runs after the material gaps, each fix with its
own development test on the tuning seeds first). The first gap it works is O180, the largest open one.

## Why

O180: under both references S370's world 0 reads about 11 to 12 points over its runs at 4,000 paths (HO-DEP's batch,
results-hodep.txt), most of it in the bridge years at S370's two step years 3 and 7, where every reference is the same 0/1
step at the bill. At six share points every S370 step read sits in the top share cell with about 0.65 of its weight on the
unsupported top node (results-pmap.txt). The review reads it as the step read's copy across that node (PR1, PR2, PR4), in the
candidate's own scope, and demotes PR19's clip. Its after-access part (GA) may be the 30-point wealth axis (PR21).

## The jobs (the review's design; set at registration)

S370 at the product's 30 points under the candidate as it stands (the plan reference), seed 7002 (the tuning seed), the first
4,000 paths a world, AN's ledger (the residual by year and layer):

- C: the candidate.
- SN: C with explicit share nodes in the top cell (shareNodes [0, 0.2, 0.4, 0.6, 0.8, 0.9, 0.95, 1], NODE-1's option; its
  compatibility with the candidate's other settings is NOT CHECKED: the preflight shows it, and shows it inert off).
- W60: C at 60 wealth points.

## The items (the review's; the registration sets the rules)

1. SN removes at least half of C's world-0 step-year residual (Y3 + Y7, path by path): HELD; under a quarter: FALSIFIED
   (SN does not remove it; S370-COPY left open, since the run does not print that SN cut the step reads' weight on the
   unsupported top node: the plan-auditor's BLOCKING 1 of 18 Oct 19:46 UK).
2. W60's removal of the same, three outcomes (S370-GRID).
3. SN against C: no material harm, survival and whole score, read by RULES.md section 8's rule as written for a policy
   change (the exact conditional McNemar per world with the guarded unconditional interval, Holm across worlds): the mixture
   rule of section 8 item 1 is for a reference change only, and SN changes the share nodes (the plan-auditor's MINOR 2 of
   18 Oct 18:48 UK); extending the mixture to a grid change would be the maintainer's decision.
4. SN's world-0 table less runs against C's, by world.

Reported: GA and T by world in all three arms (the wealth axis's share of O180 and of O133's after-access lines), the step
reads' copied top nodes (copiedTop, a count of nodes, not a weight), the solve times (SN's eight share nodes against six). About 1.6 h wall on four cores (the review's
estimate, grade D). If S370-COPY holds, the fix's breadth test follows on PMAP's other step households and the gap households
before 7u-F.

## STOP until STEP-S370 reads

A reference default; any fix aimed at PR19's clip; new wealth-axis work on O139 or O133 (W60 reads the axis's share first);
citing O180 as the reference's error; 7u-F (held by the 17:19 rule).

## READ 18 Oct 22:12 (PLAN.md's 18 Oct 22:12 row; results-steps370.txt; Brier 0.165 over 4, results-scorecard-steps370.txt)

Item 1 HELD, item 2 FALSIFIED, item 3 INCONCLUSIVE, item 4 FALSIFIED: the decision table's R1. SN removes 0.9663 (0.9636 to
0.9690) of C's world-0 step-year residual (mean 10.5633 points); W60 removes none (-0.0107): the step read's copy across the
unsupported top node carries the residual at years 3 and 7 (item 1's comparative credit to S370-COPY over GRID and CLIP,
grade B for S370; S370-COPY stays open for the over-read until the deep review reads O182 with a decomposition: the
plan-auditor's BLOCKING 1 of 18 Oct 22:17 UK). But the world-0 table's over-read does not
fall (9.0487 under C, 10.3428 under SN): SN moves the residual to years 1 and 5 (O182). W60 cuts the after-access part GA in
worlds 0 and 1, but raises world 1's GB (-0.0706 to 2.9273) and its table less runs (1.1402 to 2.5104). Next: the deep review reads the displacement (RULES.md section 9) before R1's breadth test is built (holding the breadth
test is a departure from R1's registered action, which section 9 requires); the STOP
list above stands until it reads.

## Backlog: SN's node count (the plan-auditor's BACKLOG 2 on PLAN.md b199018bea, 18 Oct)

The array governs: NODES_SN = [0, 0.2, 0.4, 0.6, 0.8, 0.9, 0.95, 1] (audit-steps370.mjs, reduce-steps370.mjs), the uniform
six with two nodes (0.9 and 0.95) added in the top cell, as the deep review of 18 Oct 18:40 UK set it and the fair-test gate
checks it. The comments that say "three more" in the top cell are wrong: predictions/diag-steps370.md line 56,
audit-steps370.mjs lines 9 and 38, reduce-steps370.mjs line 5. They are frozen (the registered prediction; the reducer's
blob fd53b17c081a as launched) and are not edited; nothing rests on them. Owner: Claude. Gate: before NODES_SN or the
steps370 scripts are reused or quoted in a new row, the new file states the count from the array.
