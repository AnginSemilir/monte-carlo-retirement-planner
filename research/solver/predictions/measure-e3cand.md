# Prediction: measure-e3cand

- **Run:** `research/solver/batch-e3cand.sh` - results/diage3cand/case0-1.txt (audit-e3cand.mjs, share 0.95 and S130), read by `reduce-e3cand.mjs` into results-e3cand.txt
- **Kind:** measurement
- **Written:** 6 Oct, before the run (its time is its registering commit's, git log). The design is the deep review after E2X (deep-review-log.md 6 Oct 22:01 UK): e3's identity under the full candidate is the one premise of 7aj to test first; candidate.mjs's own note names this run as what would close it.
- **Seeds:** none: no forward run - the check compares the solved tables; the product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan in both arms alike
- **Unmasking:** none: an identity check; e3 is required to change nothing, so there is no error it could remove or unmask
- **Plan section:** PLAN.md "E3-CAND" (the schedule), "7aj", candidate.mjs's note on e3

## Question

Is every table of the research candidate (candidate.mjs, as Phase 4, 7aj and 7u run it) bit for bit the same with e3 on and off, at the candidate's 30 points, on share 0.95 (where Q's step acts) and S130 (where the interpolated allowance axis acts)?

## Derivation

- **What the records give:** E3c (results-e3c.txt; the 5 Oct row) showed e3 exact on 7e's 25 households under SHIP, PRODUCT and TS+J with the reader, at 8 points; it did not run Q's step (bridgeStep 'exact'), the charge (switchCharge 0.001, margin 0) or the interpolated allowance axis (pclsInterp). E2X (results-e2x.txt) compared the candidate split and unsplit, both with e3 on, so it says nothing of e3. research/tests/candidate.test.mjs's smoke solve runs them together but compares nothing with e3 off.
- **Why the identity should hold:** e3 copies a cell only where the taxable pot is exactly empty and the gain bucket is non-zero, from the zero-gain twin of the same cell, whose state is the same once the pot is empty; Q's step, the charge and the interpolated axis change how a cell's value is computed, not which cells share a state. The one way it could fail: a setting that reads the gain bucket of an empty-pot cell (the deep review's 7AJ-E3, credence 0.05).
- No derivation script: no figure is computed before the run.

## Prediction

EXACT on both households; the plant breaks identity.

## Falsified if

A measurement settles nothing; it is read against its condition: EXACT (both households 0 values differ with the same moves evaluated, the plant caught), NOT EXACT (either differs, each named), or PLANT NOT CAUGHT (the run is void).

## Fair-test table

One comparison on each household, in one process: OFF (the candidate with e3 off) against ON (the candidate as it stands).

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | none | none | N/A - no forward run; the tables are compared |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - lambda held, no landing |
| 17 | The grid: points, shares, gain buckets | OFF: 30 points, every cell solved | ON: 30 points, the empty-pot cells of the non-zero gain buckets copied (e3) | TESTED - the thing the identity tests; the grid itself held equal by the gate |
| 26 | Which rivals, and each one's rule and parameters | none | none | N/A - no rival |
| 27 | How a fixed arm's withdrawal order is picked | none | none | N/A - no fixed arm |
| 29 | The statistic and its definition | every table array (survival, estate, resilience, policy, shortfall; every world and tier-state layer) | the same | SAME - compared value by value with Object.is |
| 31 | Paired or not, and the standard error used | identity | identity | N/A - an identity, no standard error |
| 33 | For timings: what else the machine was running | both households at once | the same | N/A - no timing is read (the times are printed, not judged) |

- **All other rows: SAME**

## Decision fed

- **EXACT:** e3's exactness under the candidate is grade A on these two households (the households where Q's step and the interpolated axis act), and candidate.mjs's 'NOT CHECKED' note is replaced by this run; 7aj's fair-test row 17 cites it; 7aj launches.
- **NOT EXACT:** e3 is taken out of the candidate (CANDIDATE_OPTS) until the cause is found, the households that differ go in the register with an owner and a gate, and 7aj is re-registered without e3 before it launches (its budget rises by e3's saving).
- **PLANT NOT CAUGHT:** the run is void and re-run after the plant is mended; 7aj waits.

## Provenance

- **The design:** the deep review after E2X (deep-review-log.md 6 Oct 22:01 UK, Q2); candidate.mjs's note on e3 (E3c's scope); E3c's identity check (audit-e3c.mjs, reduce-e3c.mjs) for its comparison and plant (e3PlantedWrongTwin).
- **The build:** audit-e3cand.mjs, reduce-e3cand.mjs (stamps; gate, which refuses a comparison on no arrays and an e3 that copied no cell; the verdict; 16 planted cases and an EDGES line), batch-e3cand.sh.

## Point and interval

- **Households EXACT:** 2 of 2 (80% interval 2 to 2), the author's.

## Budget line

From the sizing pass (results-sizing.txt): the candidate's solve 1068 s at the median, the largest 1230 s; e3 off adds its saving back (E3c: 17 to 22% of a solve). Per household about 1,070 s on and 1,300 s off, plus the plant at 8 points (about 100 s); both households at once: about 2.6 core-hours of wall over two cores, about 40 minutes.

## Changes after seeing results

None.
