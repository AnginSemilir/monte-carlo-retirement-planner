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
   (S370-COPY not).
2. W60's removal of the same, three outcomes (S370-GRID).
3. SN against C: no material harm, survival and whole score, read by RULES.md section 8's rule as written for a policy
   change (the exact conditional McNemar per world with the guarded unconditional interval, Holm across worlds): the mixture
   rule of section 8 item 1 is for a reference change only, and SN changes the share nodes (the plan-auditor's MINOR 2 of
   18 Oct 18:48 UK); extending the mixture to a grid change would be the maintainer's decision.
4. SN's world-0 table less runs against C's, by world.

Reported: GA and T by world in all three arms (the wealth axis's share of O180 and of O133's after-access lines), the step
reads' top-cell weight, the solve times (SN's eight share nodes against six). About 1.6 h wall on four cores (the review's
estimate, grade D). If S370-COPY holds, the fix's breadth test follows on PMAP's other step households and the gap households
before 7u-F.

## STOP until STEP-S370 reads

A reference default; any fix aimed at PR19's clip; new wealth-axis work on O139 or O133 (W60 reads the axis's share first);
citing O180 as the reference's error; 7u-F (held by the 17:19 rule).
