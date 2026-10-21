# Prediction: measure-e3pclsc

- **Run:** `research/solver/batch-e3pclsc.sh` - results/diage3pclsc/case0-9.txt (audit-e3pclsc.mjs: 9 households and S180's split), read by `reduce-e3pclsc.mjs` into results-e3pclsc.txt
- **Kind:** measurement
- **Written:** 7 Oct, before the run (its time is its registering commit's, git log). The maintainer's decision of 6 Oct 23:04 UK (PLAN.md's ledger: 'Do the lump sum work before phase 4 anyway'); the design is the deep review of 7 Oct 00:01 UK (deep-review-log.md, section 3: what the panel check must include to be decisive).
- **Seeds:** 7002 tuning: the forward comparison's 2,000 paths, the same in both arms; no held-out seed is touched
- **Unmasking:** none: an identity check; e3pcls is required to change nothing, so there is no error it could remove or unmask
- **Plan section:** PLAN.md "E3-PCLS" (the schedule) and the E3 paragraph

## Question

Is every table of the research candidate (candidate.mjs, e3 on) bit for bit the same with E3's lump-sum half (solve.js `e3pcls`) on and off at 30 points, on a household for each way the last pension inflow year is set (none, work, a dated deposit, a staged transfer), with the reader's counters, the metadata and 2,000 forward paths the same, the split solve the same at 4 and 2 parts, and each part of the inflow rule shown to matter by a plant?

## Derivation

- **What the records give:** research/tests/solver-e3pcls.test.mjs at 4 points (22 checks, on the merged code, results-solver-e3pcls-4pts.txt): every table the same on S124 (no inflow), S194, S180 (work), S126 (a dated deposit) and S126 with a staged deposit (transfer); the boundary plant and each clause's plant break identity; the split four ways equals the unsplit on S180. The deep review of 7 Oct 00:01 UK read the rule against fast.js and model.js: every way money enters a pension (contributions while working, dated deposits, staged transfers) is in it, and the allowance is read only behind a pension-above-zero guard (fast.js l.399, l.409, l.535), grade A from the code.
- **Why it should hold at 30 points:** the copies are cells whose pension is exactly zero (share a = 0 or no wealth), past the last inflow year; from such a cell the year's flow and every later read stay at a = 0, where the allowance is never read; the bucket round trip is exact for 0, 0.5 and 1. The finer grid changes how many cells copy, not why.
- **The saving:** the deep review's arithmetic over grid.js's axes: at 30 x 6 x 6 the lump-sum copies are about 14% of the cells e3 leaves evaluated in a copied year, about 10 to 16% of the moves at the median household; the 4-point test's 18 to 26% is a grid effect (the zero-wealth row is a quarter of the rows at 4 points, a thirtieth at 30).
- No derivation script: no figure is computed before the run beyond the deep review's arithmetic.

## Prediction

EXACT on all nine households and both splits; every plant breaks identity; the moves evaluated about 10 to 16% fewer at the median.

## Falsified if

A measurement settles nothing; it is read against its condition: EXACT (every household's tables, metadata, reader counters and forward paths the same, e3pcls evaluating fewer moves, both splits equal to the unsplit, every plant caught), NOT EXACT (any of them differs; each named), or PLANT NOT CAUGHT (a plant differs in 0 values: that clause is untested, the run void for it).

## Fair-test table

One comparison on each household, in one process: OFF (the candidate, e3pcls off) against ON (the same with e3pcls on).

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | 2,000 paths of seed 7002 | the same | SAME - the forward comparison only; no statistic is read from them |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - lambda held, no landing |
| 17 | The grid: points, shares, gain buckets | OFF: 30 points, every lump-sum bucket solved | ON: 30 points, an empty pension's buckets copied past lastPenIn | TESTED - the thing the identity tests; the grid itself held equal by the gate |
| 26 | Which rivals, and each one's rule and parameters | none | none | N/A - no rival |
| 27 | How a fixed arm's withdrawal order is picked | none | none | N/A - no fixed arm |
| 29 | The statistic and its definition | every table array, the metadata but e3pcls and the move count and time, the reader's counters, and each forward path's survival, spend years, years at target, tier years, tier changes and net | the same | SAME - compared value by value with Object.is |
| 31 | Paired or not, and the standard error used | identity | identity | N/A - an identity, no standard error |
| 33 | For timings: what else the machine was running | four units at once | the same | N/A - no timing is read (the times are printed, not judged) |

- **All other rows: SAME**

## Decision fed

- **EXACT:** E3's lump-sum half is exact under the candidate on the panel's clause types (grade A on these nine, B elsewhere); its research-default decision goes to the maintainer with the measured saving (the 30 Sep 09:49 mechanism that made the gain half a default once its check passed), and Phase 4's re-timing of gate 5 and the two-core figure use it if adopted.
- **NOT EXACT:** e3pcls stays off; the households and parts that differ go in the register with an owner and a gate, and the inflow rule or the copy is re-derived before any re-run.
- **PLANT NOT CAUGHT:** the run is void for the uncaught clause and re-run after its plant is mended; nothing is adopted.

## Provenance

- **The design:** the deep review of 7 Oct 00:01 UK (section 3); E3c's and E3-CAND's identity checks (audit-e3c.mjs, audit-e3cand.mjs) for the comparison.
- **Two departures from that design (declared; neither weakens the reading, the plan-auditor on 4a6bbdf460):** the forward comparison runs 2,000 paths, not 8,000 - it is an identity, read path by path, and the forward run reads only the solve's tables, which are compared in full; and the reader is compared by its counters (meta.reader), not its p, c and R arrays - those are built only from the compared survival tables and the reader's chance, which e3pcls does not touch (solve.js's reader build; readerTax is off in the candidate).
- **The build:** solve.js `e3pcls` (lastPenIn, its setBy, the boundary and per-clause plants `e3pclsPlant`), research/tests/solver-e3pcls.test.mjs; audit-e3pclsc.mjs, reduce-e3pclsc.mjs (stamps; the gate refuses a comparison on nothing, an e3pcls that copied nothing, a household whose lastPenIn another clause set, and a missing or unregistered plant; 20 planted cases and an EDGES line), batch-e3pclsc.sh, preflight-e3pclsc.sh.

## Point and interval

- **Households EXACT:** 9 of 9 (80% interval 9 to 9), the author's.
- **The moves evaluated, fewer with e3pcls, at the median household:** 13% (80% interval 10% to 16%), the deep review's arithmetic.

## Budget line

From E3-CAND (results-e3cand.txt) and the sizing pass (results-sizing.txt): the candidate's solve about 1,000 to 1,100 s with e3, the forward run 126.8 s per 1,000 paths. Per household: two solves and two 2,000-path runs, about 2,600 s; the plants at 8 points about 60 s each; S180's split unit about 3,300 core-seconds. About 7.5 core-hours, about 2 hours four at once; each unit stopped at 4 hours.

## Changes after seeing results

None.
