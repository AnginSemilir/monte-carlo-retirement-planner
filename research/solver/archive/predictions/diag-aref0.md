# Prediction: diag-aref0

- **Run:** `research/solver/batch-aref0.sh` - results/diagaref0/case0.txt and its file (audit-aref0.mjs at DP grid scale 1, 1,000 simulations a checked state, one job), read by `reduce-aref0.mjs` in the real tree (its gate, then NODE-AX's own gate over the files it read) into results-aref0.txt
- **Kind:** measurement
- **Written:** 15 Oct, before the registered run (its time is its registering commit's, git log); the deep review after NODE-AX (deep-review-log.md 15 Oct 01:48 UK) and PLAN.md's AREF row (Step 0 first, GO only on its registered lines)
- **Seen before registration (declared):** the build check (runs.log 15 Oct 07:37 UK, PREDICTION=none, declared "no figure read"; its log kept whole as results-aref0-buildcheck.txt) printed, at DP grid scale 4 (40 by 11, 32 draws) and 200 simulations a checked state, the calibration lines (p, the realised bridge share and today's read, by world and p-bin), the DP's check lines and the flatness counts; Claude saw them. On those lines, by awk over the kept log: c in [0.9, 1] at 7572 of 39108 supported band nodes in world 0 (0.1936), 7905 of 36312 in world 1 (0.2177), 6906 of 34977 in world 2 (0.1974); realised less p in the top p-bin 0.0335, 0.0246 and 0.0262. Item 2 reads only NODE-AX's records (the realised bit against today's read), which the DP's scale does not touch, so its value was fixed by NODE-AX's files before this was written. So every item is previewed and none can be scored: Step 0 is registered as a measurement, read by the lines reduce-aref0.mjs fixed before the build check's run printed any line (e73d662 at 15 Oct 07:27 UK; the launcher took its snapshot from 3deb7f7 before its smoke run, and the run itself began at 07:37 UK, runs.log; the plan-auditor's MINOR 1 of 08:54 UK; one planted case added since, in a1cf293, no item line changed), and nothing goes to the scorecard.
- **Seeds:** 7002 tuning (the dpTook simulations; NODE-AX's BN records were run on 7002's paths). No held-out seed is touched.
- **Unmasking:** none: a measurement on NODE-AX's saved records and tables; it removes no error and changes no arm
- **Plan section:** PLAN.md "AREF" (Step 0)

## Question

At the registered DP scale, is the adaptive floor-bills chance p (backward induction over accessible money and its ISA share, the policy's own floor-level moves, the joint choice on the mixture's weights) calibrated against the realised bridge outcome at NODE-AX's BN records, does today's read under-read that outcome, and is the saved tables' S within [0.9, 1] of p at their supported band nodes - the three lines AREF's arms are run on only if all hold (GO)?

## Derivation

- **The mechanism** (the deep review after NODE-AX, its premise at risk 1, NOT CHECKED there): the adaptive reference removes the bridge-years grid residual "up to c's smooth part" only if the policy at the cliff pays the floor and takes the DP's orders and tiers, so that c = S / p sits near 1 across a cell. Where the policy departs from the floor-bills rule (N2-CPART, 0.09 in the review's map), c falls below 1 unevenly and a matched reference removes only part of the residual.
- **What the records give:** the build check's lines above (scale 4). The DP's own check at scale 4 put p above its simulation by up to 0.04 in the lower bins (world 0: 0.4776 against 0.4391 in bin 2; results-aref0-buildcheck.txt), inside its tolerance; at scale 1 p moves by a few hundredths, which moves c by a few per cent and the flat share by some nodes at the window's edges, not by the 0.6 that separates the preview from item 3's HELD line.
- **Item 2** (the known positive): NODE-AX's read under-read the realised bridge (results-nodeax.txt), and its records are what item 2 reads; the review's map does not say by how much within the band in each world.

## Prediction

Item 3 FALSIFIED: c in [0.9, 1] at about a fifth of the supported band nodes in worlds 0 and 1, far under 0.6; so NO GO. Item 1 not HELD: the top bin's realised share sits near 0.03 above p, at or past the margin. Item 2 HELD in world 0; world 1's under-read is smaller and may leave it INCONCLUSIVE.

## Falsified if

A measurement settles nothing; it is read against this description, not falsified. A flat share over 0.6 in either world at scale 1 (three times the preview) is logged in the register with the DP's scale as its first suspect.

## Fair-test table

One read (the adaptive chance over NODE-AX's BN records and tables); no arms compared.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing; the records are NODE-AX's, read as saved |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - one read, no rival |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 31 | Paired or not, and the standard error used | path-clustered | path-clustered | N/A - one read; each bin's mean is clustered by path, nothing is paired |
| 33 | For timings: what else the machine was running | n/a | n/a | N/A - no timing is read |

- **All other rows: SAME**

## Decision fed

GO (items 1, 2 and 3 HELD by reduce-aref0.mjs's lines): AREF's arms are designed and registered (the research-only `readerRef: 'adaptive'`, BN-off, AN and AO on S360 and S364), under escalation trigger 3 (a run over 2 hours). NO GO with item 3 FALSIFIED: the arms are not run; premise 1 is recorded as failing on the saved tables, the residual's share that a matched reference cannot reach is put to the next deep review with N2-CPART (the policy's departures from the floor-bills rule) raised, and NODE-AX's open register items stay open on it. NO GO with item 3 not FALSIFIED (INCONCLUSIVE, or HELD with item 1 or 2 not): the arms wait on the next deep review's reading of which line failed; nothing is run on it alone.

## Provenance

- The design: the deep review after NODE-AX (deep-review-log.md 15 Oct 01:48 UK) and its adoption (PLAN.md's 15 Oct 01:58 row; the plan-auditor's PASS of 15 Oct 02:15 UK).
- The build: audit-aref0.mjs (self-checks gridTook, recTook, dpTook; plants drift, choice, grid, notax), reduce-aref0.mjs (its gate, NODE-AX's gate behind it, 49 planted cases, EDGES), mutate-reduce-aref0.py (37 of 37 caught, results-mutation-history.txt 07:27 UTC on blob 07de59618931), buildcheck-aref0.sh, preflight-aref0.sh, batch-aref0.sh.

## Point and interval

80% intervals, the author's: c in [0.9, 1] share 0.20 (0.10 to 0.40) in world 0 and 0.22 (0.10 to 0.40) in world 1; realised less p in the top bin 0.03 (0.01 to 0.05) in world 0; today's under-read in the band 0.04 (0.02 to 0.07) in world 0 and 0.025 (0.005 to 0.05) in world 1.

## Budget line

One process: the 4-point solve that gives the menu (553 s at the build check), the DP at 16 times the grid nodes and 4 times the draws (1 s at scale 4, so about 1 to 2 minutes), the checked states' simulations at 5 times the build check's and the band nodes of three worlds' tables: about 15 to 25 minutes.

## Changes after seeing results

None.
