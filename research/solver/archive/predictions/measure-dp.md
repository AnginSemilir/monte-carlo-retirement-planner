# Prediction: measure-dp

- **Run:** `research/solver/batch-dp.sh` - results/diagdp/case0-24.txt (audit-dp.mjs, one process a household), read by `reduce-dp.mjs` in the real tree into results-dp.txt
- **Kind:** measurement
- **Written:** 3 Oct, before the run (its time is its registering commit's, git log); the maintainer's answers of 1 Oct 06:45 UK (a product-level measurement of the draw pause: how many households, how long; no product change before Phase 4) and 1 Oct 10:37 UK (after 7aq, on the product's own settings, as dwell time and yearly growth at the wall against the years before it); O77's definition (the plan-auditor's BLOCKING 1 of 1 Oct 09:32 UK; the deep review after 7ap); run overnight on the maintainer's leave of 3 Oct 22:15 UK (the ledger's 22:14 row)
- **Seeds:** 7002 tuning (2,000 paths a household, the same paths for every household's run). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan. No held-out seed is touched.
- **Unmasking:** none: a measurement of today's shipping default; it removes no error and changes no arm
- **Plan section:** PLAN.md "O71" and "O77" (the draw-pause measurement)

## Question

On the shipping default (7af's SHIP unit: the product's settings, no bridge reader, lambda held, the estate weight 0.02, 30 points), how many of 7e's panel households (the Phase 4 panel, 25) have paths whose use of the lump sum allowance pauses below the wall - years spent at 0.6 to under 0.75 of the allowance with the use growing at under a quarter of its own pace in the years before (0.3 to under 0.6), after access - and for how long?

## Derivation

- **The mechanism** (O71, grade A for the code): the used-allowance axis has three buckets (0, 0.5, 1) read by nearest snap, so from 0.75 up the tables read the allowance as spent; just below, a further taxable pension draw moves the read across 0.75 and its value drops - so the chooser may hold the use just below the wall (the deep review after 7al; 7ap's draw-stall counts).
- **What the records give:** 7ap's strict stall count on the crossing households under TS+J with the reader (S370 808 of 16606 path-years at the wall, S130 748 of 59722; results-7ap.txt) and its floor on S194 that is not the snap's (O77: 83 of 176); no record has the used allowance under the shipping default, so the counts below are new.
- **The households:** 7e's panel, chosen by a rule that never looks at the solver; the library-wide count (210 single households, about 100 core-hours at the product's 30 points) is sized and left to the maintainer.

## Prediction

A pause shows on the households whose paths reach the wall band in numbers - the large-pension ones (S130, S370, S366, wealth x2 and the high-share built ones) - on under 10% of their paths, with a mean pausing dwell of 3 to 6 years; the households whose pensions cannot reach 0.6 of the allowance show none.

## Falsified if

A measurement settles nothing; it is read against this description, not falsified. A count far from it (pauses on none of the reaching households, or on more than a quarter of their paths) is logged in the register.

## Fair-test table

One arm (the shipping default) on every household; nothing compared.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing: lambda is held |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - one arm, no rival |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 31 | Paired or not, and the standard error used | counts | counts | N/A - a count per household; no comparison, no standard error |
| 33 | For timings: what else the machine was running | n/a | n/a | N/A - no timing is read |

- **All other rows: SAME**

## Decision fed

The count goes to the maintainer with the O71 record: how many panel households the shipping product gives a draw pause, and how long, as the maintainer asked; no product change before Phase 4 (the maintainer's answer). If pauses are common on the reaching households, the allowance axis's fix (7at's allowance part, under O71's condition) gains a product reason beside the tables' error; if they are rare or absent, the snap's cost is in the tables' claims (7ap) more than in the advice. Whether the library-wide count is worth its 100 core-hours is put to the maintainer with it.

## Provenance

- The design: the maintainer's answers of 1 Oct 06:45 and 10:37 UK; O71 and O77; 7af's SHIP unit (audit-s126.mjs measureV2, bridgeRead false, the estate weight 0.02).
- The build: audit-dp.mjs (audit-s126.mjs's variant() copied; the product's chooser through runPolicy's choose hook, recording the used allowance at every path-year alive), reduce-dp.mjs (stamps, gate, planted cases), batch-dp.sh, preflight-dp.sh and preflight-parse-dp.mjs.

## Point and interval

80% intervals, the author's: households with any pausing path 5 (2 to 10) of 25; the pausing share of the reaching paths on those households 5% (1% to 20%); the mean pausing dwell 4 years (2.5 to 7).

## Budget line

About 25 solves at the product's 30 points, each about 30 minutes with its forward run (7af's SHIP solves and 7ar's S130 OFF unit as measured): about 12 core-hours, about 3 hours on four cores, after 7at.

## Changes after seeing results

None.
