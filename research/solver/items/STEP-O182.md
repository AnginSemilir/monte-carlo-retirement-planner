# STEP-O182: does a copied corner's residual R, carried unscaled into queries of higher chance, carry SN's over-read at S370's years 1 and 5? (detail for PLAN.md's STEP-O182 row and its 18 Oct 23:10 ledger row)

Proposed by the deep review after STEP-S370 (deep-review-log.md 18 Oct 22:45 UK) as the one decisive test; adopted under
the maintainer's standing go-ahead and the decision of 18 Oct 17:19 (PLAN.md: 7u-F runs after the material gaps, each fix
with its own development test on the tuning seeds first). It is the second step on O180, the largest open gap.

## Why

STEP-S370 (results-steps370.txt): explicit top-cell share nodes (SN) remove 0.9663 of world 0's step-year residual on S370,
but the world-0 table's over-read does not fall (9.0487 under C, 10.3428 under SN): it moves to years 1 and 5 (O182). The
deep review reads the move with a decomposition (RULES.md section 9). The step-year copy's part was removed, not moved. The
new over-read is mostly a new error the added nodes make: at years 1 and 5, with three bills left before the inflow or
access, the new nodes 0.9 and 0.95 are unsupported in the richest wealth rows, take c from the node below and keep a
residual R = S - p c, which the read carries unscaled into queries whose chance is near 1 (src/solver/grid.js:418; PR25).
C's copied top node carries no R (S = p = 0 at a = 1), which is why C never showed it. Its evidence is grade C: read-only
scripts over the saved tables, the year-1 states judged, year 5 not read at its states. A run that saves the visited states
and splits each read decides it; the saved files cannot.

## The jobs (the review's design; set at registration)

S370 at the product's 30 points under the candidate as it stands (the plan reference), seed 7002 (the tuning seed), the first
4,000 paths a world, AN's ledger (the residual by year and layer), each bridge-year read split through READER_PROBE into
p x I[c], the supported corners' I[R] and the copied corners' I[R], the visited states saved:

- C: the candidate, on the new code with the option off; it reproduces STEP-S370's C residual by year (the option inert off).
- SN: C with explicit share nodes NODES_SN = [0, 0.2, 0.4, 0.6, 0.8, 0.9, 0.95, 1] (eight in all: the uniform six with two,
  0.9 and 0.95, added in the top cell; the count from the array, the review backlog's row of 18 Oct 22:33 UK), option off;
  it reproduces STEP-S370's SN residual by year.
- SNR: SN with each corner's R scaled by (1 - p_q)/(1 - p_i) where the query's chance p_q exceeds the corner's p_i (research
  only, false in every product path; the mirror of NE-EDGE's RS arm, grid.js:417). A planted unit test shows the scaling
  acts where p_q > p_i and nowhere else, and is inert off.

## The items (the review's; the registration sets the rules)

1. Under SN the copied corners' I[R] carries at least half of world 0's Y1 + Y5, path by path (O182-RESID).
2. SNR removes at least half of SN's world-0 Y1 + Y5.
3. SNR's world-0 table less runs is at most half of C's (9.0487 in STEP-S370; this run's own C read) - the question
   S370-COPY's receipt asked, the over-read itself.
4. SNR against C: no material harm, survival and whole score, by RULES.md section 8's rule as written (a policy change).

Reported: the residual by year in every world and arm (WHOLE), GA and T, the copy counts, the reads' split by world.

## Decision fed (set at registration)

Items 2 and 3 HELD: a breadth test carries SN with SNR's rule on PMAP's other step households and the gap households, with
the residual by year printed. Item 1 FALSIFIED: O182-RESID not the carrier; the review's next-ranked carriers (OTHER, YB)
first. Item 3 FALSIFIED with item 2 HELD: the over-read has a further carrier; a decomposition before any breadth test.

## STOP until STEP-O182 reads

The SN-alone breadth test; more share points or a share-node default as a fix; a separate fix for the year-before copy; a
reference default (an adaptive reference is a rival remedy for R, untested); scoring S370-COPY from STEP-S370; 7u-F (held by
the 17:19 rule).
