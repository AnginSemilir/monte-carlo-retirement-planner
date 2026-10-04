# Prediction: measure-e3c

- **Run:** `research/solver/batch-e3c.sh` - results/diage3c/case0-24.txt (audit-e3c.mjs, one process a household), read by `reduce-e3c.mjs` into results-e3c.txt
- **Kind:** measurement
- **Written:** 4 Oct, before the run (its time is its registering commit's, git log); the decision of 30 Sep 09:49 UK (the ledger: E3's gain half becomes a research default once its identity check passes on every panel household, PRODUCT and TS+J with the reader); the maintainer's go-ahead of 4 Oct (recommendation 7, the ledger's 08:17 row; "carry on, i'll take your recommendations")
- **Seeds:** none: no forward run - the check compares the solved tables with e3 off and on; the product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan in both arms alike
- **Unmasking:** none: an identity check; e3 is required to change nothing, so there is no error it could remove or unmask
- **Plan section:** PLAN.md "E3c" (the schedule) and the E3 paragraph

## Question

E3's gain half copies a cell whose taxable pot is empty from its zero-gain twin instead of solving it. Is every table bit for bit the same with e3 on and off on every one of 7e's 25 panel households? Checked in the shipping mode DP and DPC run (SHIP), in solvePlan's defaults (PRODUCT) and in TS+J with the reader (TSJ), at a small grid. And does a planted copy from the wrong twin break identity, so that the check can fail?

## Derivation

- **What the records give** (research/tests/results-solver-e3-8pts.txt, research/tests/solver-e3.test.mjs):
  - At 8 points, every table is the same bit for bit with e3 on S126 (PRODUCT, READER/TS+J), S194 (PRODUCT, READER/PRODUCT) and S360 (READER/TS+J).
  - The copied cells are exactly the empty-pot cells of the non-zero gain buckets (21,120 on S126; 21,648 on S194; 24,288 on S360).
  - The planted wrong twin breaks identity (582,374 values differ).
- **Why it should hold everywhere** (code, solve.js l.765; the E3 paragraph): a cell with an empty taxable pot has no unrealised gain, so its gain bucket does not enter its values; the copy is an identity by construction. A household where it fails would be one where an empty-pot cell's gain bucket is read (a refill, as the lump-sum half's open question).
- **What is new:** 22 households, and the SHIP mode, have never been checked.
- No derivation script: no figure is computed before the run.

## Prediction

EXACT: every household in every mode differs in 0 values and copies exactly its empty-pot cells; the plant breaks identity. Solve time with e3 on is about 15% to 20% less (the records: 18.1%, 20.0%, 16.3%, 17.5%, 21.7% at 8 points beside other work).

## Falsified if

A measurement settles nothing; it is read as EXACT or NOT EXACT against the 30 Sep condition. NOT EXACT on any household keeps e3 off as a research default and goes in the register with the households and modes that differ. PLANT NOT CAUGHT voids the run.

## Fair-test table

e3 off (arm A) against e3 on (arm B), each household solved twice in the same process.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | none | none | N/A - no forward run; the tables are compared |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - lambda held, no landing |
| 17 | The grid: points, shares, gain buckets | 8 points; every cell solved | 8 points; empty-taxable-pot cells of the non-zero gain buckets copied from their zero-gain twin (e3) | TESTED - e3 is the one thing that differs |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - no rival |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | every table array (survival, estate, resilience, policy, shortfall; every world and tier-state layer) | the same | SAME - compared value by value with Object.is |
| 31 | Paired or not, and the standard error used | identity | identity | N/A - an identity, no standard error |
| 33 | For timings: what else the machine was running | four processes at once | the same | ACCEPTED - the solve times are reported beside each other in one process, not read as a quiet-machine saving |

- **All other rows: SAME**

## Decision fed

- **EXACT:** the 30 Sep 09:49 condition is met. In one commit (tier 2):
  - e3 becomes a research default only: PRODUCT_BASELINE gains an explicit e3: false pinned by plan-defaults.test.mjs, so solvePlan cannot turn it on;
  - the research scripts that build their own options pass e3: true, with a test that fails if one does not;
  - the decided-defaults block records it;
  - the product keeps e3 off (a product default is a separate decision).
  - Runs registered before that commit carry no e3 (their fair-test tables unchanged); runs after it carry e3 as a fair-test row against older records.
- **NOT EXACT:** e3 stays off. The households and modes that differ go in the register with an owner and a gate (the copy's premise fails there).
- **PLANT NOT CAUGHT:** the run is void and re-run after the plant is mended.

## Provenance

- **The design:** the decision of 30 Sep 09:49 UK (the E3 paragraph: the identity check on every panel household, PRODUCT and TS+J with the reader); the plan-auditor's BLOCKING 1 of 4 Oct 08:24 UK on the decision record (the check's two modes; SHIP added since DP and DPC run it); research/tests/solver-e3.test.mjs (the comparison and the plant).
- **The build:**
  - audit-e3c.mjs: DP's case construction; the test's comparison in three modes; the plant on S126;
  - reduce-e3c.mjs: stamps; gate; verdict; 15 planted cases and an EDGES line;
  - batch-e3c.sh, preflight-e3c.sh.

## Point and interval

80% intervals, the author's:
- **Households EXACT in every mode:** 25 of 25 (24 to 25).
- **The time saved with e3 on:** 18% (12% to 22%) in each mode.

## Budget line

Per household at 8 points (research/tests/results-solver-e3-8pts.txt):
- SHIP and PRODUCT: about 106 s each, off and on;
- TSJ: about 300 s (S360's 456 s);
- S126's plant: about 110 s more.

That is about 3.7 core-hours, about 1 hour on four cores. It runs after 7au (the cores).

## Changes after seeing results

None.
