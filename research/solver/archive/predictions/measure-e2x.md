# Prediction: measure-e2x

- **Run:** `research/solver/batch-e2x.sh` - results/diage2x/case0-3.txt (audit-e2x.mjs, one household at a time), read by `reduce-e2x.mjs` into results-e2x.txt
- **Kind:** measurement
- **Written:** 6 Oct, before the run (its time is its registering commit's, git log). The maintainer's decisions of 6 Oct (the ledger's 12:51 row: 'Include e2 as counted in gate 5', '4 cores is fine'; E2 counts once built and shown exact, every table the same split and unsplit, as E3c showed for e3) and of 29 Sep 08:45 UK (gate 5's budget: at most 25% more solve time than today's product solve, the same household, settings and machine load)
- **Seeds:** none: no forward run - the check compares the solved tables and times the solves; the product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan in every arm alike
- **Unmasking:** none: an identity check and a timing; E2 is required to change nothing, so there is no error it could remove or unmask
- **Plan section:** PLAN.md E2X (the schedule) and Phase 4's condition 5

## Question

E2 splits one solve across four cores (research/solver/e2.mjs; solve.js's opts.e2). On the research candidate as Phase 4 runs it, is every table bit for bit the same split and unsplit, on SIZE's four households at the candidate's 30 points? And with the split counted, does the candidate's wall-clock solve meet gate 5: at most 1.25 times today's product solve on the same household and machine?

## Derivation

- **What the records give:**
  - research/tests/e2.test.mjs (at 4 points): every table bit for bit the same split four ways on S126 under the candidate, S194 under the product and S130 under COV (whose copied cells read other cells of their year), with the same moves evaluated and cells copied; a dropping part breaks identity; a failing part fails the split solve.
  - The same test's record (research/tests/results-e2-test.txt): S126's candidate at 4 points 88.391 s unsplit, 28.032 s split, x3.15; S194's product 40.401 s and 12.969 s, x3.12; S130's COV 40.289 s and 12.235 s, x3.29.
  - SIZE (results-sizing.txt, four at once): the candidate's solve 1068 s at the median against the product's 355 s, x3.01; gate 5 then needs E2 to speed the solve up x2.41 or more.
- **Why the identity should hold:** each cell's values are computed from the next year's tables alone, which every part reads complete after the barrier; a cell is solved by exactly one part (the first to claim it), with the same arithmetic as unsplit; the copied cells and the log-odds are made by part 0 alone after every part's cells, in the loop's own order; each part builds its own reader tables from the same shared values.
- **Why the speed-up should reach about x3.5 at 30 points:** at 4 points it was x3.12 to x3.29 (the record above) with each part repeating its setup and reader tables; at 30 points the cells are a larger share of the work.
- No derivation script: no figure is computed before the run beyond SIZE's, which results-sizing.txt holds.

## Prediction

E2: EXACT on all four households; the plant breaks identity. Gate 5: MET on all four, the split candidate at about x0.85 the product's wall-clock at the median.

## Falsified if

A measurement settles nothing; it is read against its two conditions:
- **E2:** EXACT, NOT EXACT (any household differs, or evaluates or copies a different count), or PLANT NOT CAUGHT (the run is void).
- **Gate 5:** MET (the split candidate at most x1.25 the product on every household), NOT MET (any household over, each named), or NOT READ (E2 not exact: an inexact split does not count).

## Fair-test table

Two comparisons on each household, all in one process, one household at a time: CAND (the candidate on one core) against SPLIT (the same solve across four cores) for the identity; PRODUCT (today's product solve) against SPLIT for gate 5's timing.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | none | none | N/A - no forward run; the tables are compared and the solves timed |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - lambda held, no landing |
| 13 | The risk tier chosen, consent to change it, risk above | PRODUCT: the product's tiers | SPLIT: the candidate's (the tier state, O60's blend medians) | TESTED - gate 5 compares the candidate as Phase 4 runs it with the product as it ships, by its definition; CAND and SPLIT SAME |
| 17 | The grid: points, shares, gain buckets | PRODUCT and CAND: 30 points, every cell solved on one core | SPLIT: 30 points, the cells shared across four cores | TESTED - the split is the thing the identity tests; PRODUCT's snapped allowance axis and no e3 against the candidate's are gate 5's definition |
| 19 | The switch margin and switching cost | PRODUCT: the stored margin | SPLIT: the charge 0.001, margin 0 | TESTED - gate 5's definition (the candidate against the product); CAND and SPLIT SAME |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | PRODUCT: no bridge read | SPLIT: the bridge reader with Q's step | TESTED - gate 5's definition; CAND and SPLIT SAME |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - no rival |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | every table array (survival, estate, resilience, policy, shortfall; every world and tier-state layer); wall-clock seconds | the same | SAME - compared value by value with Object.is; each solve timed from its call to its return |
| 31 | Paired or not, and the standard error used | identity; one timing each | identity; one timing each | N/A - an identity and single timings, no standard error |
| 33 | For timings: what else the machine was running | nothing else: one household at a time, the batch alone in the launcher's main lane | the same | SAME - the batch runs alone; each timing's 1-minute load at its start is printed beside it; before gate 5 is read, runs.log is checked for any job (the light lane included) launched while the batch ran - one found means gate 5 is reported, not read, and the batch is re-run alone |

- **All other rows: SAME**

## Decision fed

- **E2 EXACT and gate 5 MET:** E2 counts toward gate 5 and condition 5 is met for Phase 4 on these four (Phase 4 re-times it on its panel); E2-EXACT and GATE5 leave the schedule; 7u's gates in items/7u.md lose E2 and gate 5. E2 is used in research only where a run needs a solve's wall-clock, never where a batch already fills the cores.
- **E2 EXACT and gate 5 NOT MET:** condition 5 is not met; the households over and their ratios go to the maintainer, with the speed work that would close the gap (the forward check of the 'auto' rule and the reader tables are not split); 7u's other gates are unchanged, since gate 5 bounds the product, not the research.
- **NOT EXACT:** E2 does not count; the households that differ go in the register with an owner and a gate; gate 5 is not read.
- **PLANT NOT CAUGHT:** the run is void and re-run after the plant is mended.

## Provenance

- **The design:** the maintainer's decisions of 6 Oct (the 12:51 row) and 29 Sep 08:45 UK (condition 5); the sizing pass (the 6 Oct 15:30 row: E2-EXACT and GATE5, on SIZE's households); E3c's identity check (audit-e3c.mjs, reduce-e3c.mjs) for its comparison and plant.
- **The build:**
  - src/solver/solve.js: opts.e2 (shared tables, claimed cells, the barrier, part 0's copy pass and log-odds); absent, nothing changes - evidence: the plan-auditor's receipt on c60a545864 (review-log.md, 6 Oct 18:43 UK): HEAD's solve.js against this one at 4 points with opts.e2 absent, 0 values differ on S194's product, S130's COV and S126's candidate, the same moves evaluated and cells copied (grade A);
  - research/solver/e2.mjs and e2-worker.mjs: the split's driver and its worker;
  - research/tests/e2.test.mjs: the identity at 4 points on three modes, the dropping part and the failing part;
  - audit-e2x.mjs, reduce-e2x.mjs (stamps; gate; both verdicts; 19 planted cases and an EDGES line), batch-e2x.sh.

## Point and interval

80% intervals, the author's:
- **Households EXACT:** 4 of 4 (4 to 4).
- **SPLIT/PRODUCT at the median:** x0.85 (x0.70 to x1.10).
- **The split's speed-up at the median:** x3.5 (x3.0 to x3.8).
- **Gate 5:** MET, credence 0.75.

## Budget line

Per household at 30 points, one at a time, at SIZE's four-at-once times: PRODUCT about 355 s, CAND about 1068 s, SPLIT about 300 s; S126's plant at 4 points about 115 s more. 4 x (355 + 1068 + 300) + 115 = 7,007 s, about 1.9 hours, less on a quiet machine; nothing else runs beside it.

## Changes after seeing results

None.
