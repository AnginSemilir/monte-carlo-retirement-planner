# COPY-X: does the copied corner's flat-copied c carry S370's bridge over-read, and does extrapolating it remove it? (detail for PLAN.md's COPY-X row and its 19 Oct 04:13 ledger row)

Proposed by the deep review after STEP-O182 (deep-review-log.md 19 Oct 03:55 UK) as the one decisive test; adopted under the
maintainer's standing go-ahead, the hand-over of 18 Oct and the decision of 18 Oct 17:19 (PLAN.md: 7u-F runs after the
material gaps, each fix with its own development test on the tuning seeds first). It is the root-cause step of the
reader-at-the-bridge family (O180, O182, O185, O186, PR1, PR17, PR25).

## Why

STEP-O182 (results-o182.txt): under SN the copied corners' residual R carries 0.6959 of S370's world-0 over-read at years 1
and 5, and scaling it (SNR) removes year 1's part but not year 5's (2.0813 to 1.7015). Its split filed the copied corners'
p x c inside the reference's part, so it measured their R alone. The deep review's read-only scripts (grade C) put year 5's
remainder on the copied added nodes' flat c: the next year's table falls along the share row from the node below to the
added node, and a flat copy cannot see the fall. The same flat copy at C's top node (a = 1) carries C's step-year residual at
years 3 and 7. So it is one error in two forms, the copy's c (PR1) and its R where p is above nil (PR25), and moving the
nodes moves it to the year before a copied node becomes supported. A run that splits the copied corners' c out of the
reference's part, and an arm that replaces the flat copy, decide it; the saved files cannot.

## The jobs (the review's design; set at registration)

S370 at the product's 30 points under the candidate as it stands (the plan reference), seed 7002 (the tuning seed), the first
4,000 paths a world, AN's ledger with each bridge-year read split four ways (the supported corners' p x c, the copied corners'
p x c, the supported corners' I[R] and the copied corners' I[R]), the visited states saved:

- C: the candidate, on the new code with the option off; it reproduces results/diago182's C bit for bit (the option inert off).
- SNR: STEP-O182's SNR (NODES_SN, eight share nodes: the uniform six with 0.9 and 0.95 added in the top cell; `readerSplit:
  'ru'`), the option off; it reproduces results/diago182's SNR bit for bit.
- CX: C with each share-row copy's c extrapolated linearly from the two supported nodes below it, clipped to [0, the source's
  c], and R = S - p c at that c (research only, false in every product path; a planted unit test shows the rule acting only
  at copied nodes and inert off).
- SNRX: SNR with the same rule.

## The items (the review's; the registration sets the rules)

1. SNRX removes at least half of SNR's world-0 year-5 residual, path by path (O186-CFLAT).
2. CX removes at least half of C's world-0 bridge residual GB (8.1473 in results-o182.txt): the copy's c carries the
   step-year part without new nodes (S370-COPY's mechanism).
3. The better arm's world-0 table less runs is at most half of C's (9.0487): the over-read itself.
4. No material harm against C, per world, by RULES.md section 8's rule as written (a policy change), SNRX against SNR
   splitting any harm.

Registered with two declared departures (predictions/diag-copyx.md, Departures): item 3 reads CX against C (SNRX starts from
SNR's gap, near the bar already, so the better arm's reading could not fall), and item 4 reads each arm against its own
control, CX against C and SNRX against SNR (SNRX against C carries SN's world-2 losses, which STEP-O182 read, so that leg
could not read no harm, and a harm there would not be the copy rule's). The review's readings are reported beside.

Reported: the residual by year in every world and arm (WHOLE), the four-way split, GA and T. The review's log-odds-wealth
read of world 1's years is not built (its form needs the read's per-axis weights, which the probe does not hand over):
deferred to the blend's own test (O185; predictions/diag-copyx.md, "Reported, not items").

## Breadth afterwards (the review's)

On whichever arm holds (CX alone if item 2 holds, having fewer parts), on PMAP's step households and the gap households, each
world's table less runs and residual by year printed beside the mixture, a no-harm item per world. The world-1 guard: a
world's table less runs more than a point below C's is read beside the log-odds-wealth read; the part that read explains is
the blend unmasked (O183, PR17), not the fix's harm.

## STOP until COPY-X reads

The SN-with-SNR breadth test; any share-node or copy default; more share points; any wealth-axis or blend fix (fixing it
first would expose more of the copy's error); a reference default; scoring S370-COPY; 7u-F (held by the 17:19 rule).
