# Prediction: diag-7as

- **Run:** `research/solver/batch-7as.sh` - results/diag7as/case0-8.txt and traces (audit-7as.mjs, 9 jobs, one process a job), read beside P's records (results/diagP, through P's own gate); reduced by `reduce-7as.mjs` in the real tree into results-7as.txt
- **Kind:** test
- **Written:** 3 Oct, before the run (its time is its registering commit's, git log); designed by the maintainer's decision for the charge (PLAN.md the 3 Oct 18:51 row: the value 0.001 PROVISIONAL until swept, and S194's bad-world slice split before 7u and before any larger charge, O50) and the deep review after 7aq's flag (a larger charge is not registered as the decision's consequence without that split)
- **Seeds:** 7002 tuning (P's paths: the first 8,000 of P's 16,000 across all worlds, and P's 16,000 at world 0's node on S194). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan. No held-out seed is touched.
- **Unmasking:** the charge replaced the stored margin in the research candidate (the maintainer, 3 Oct): the margin's later holds were the known error (O67's grade-A hold code), and removing them unmasked the world-blind chooser re-risking in the bad world (O50: S194's node loss under P, whole -0.261). Item 2 is the decomposition: whether a larger charge buys that slice back at the node (the hold's protection, which the margin gave) or whether a loss stays (what P costs there, the mixture's trade); item 1 reads whether the charge's size moves anything across all worlds.
- **Plan section:** PLAN.md "7as"

## Question

Does the switch charge's value matter between 0.0005 and 0.002 across all worlds on P's three units, and does doubling it to 0.002 remove S194's bad-world slice at the node (O50's loss from the de-risked opening, -0.261 by the whole score at 0.001)?

## Derivation

- **What the records give** (derive-7as.mjs, results-derive-7as.txt, from results-P.txt): S194's slice at world 0's node, OPEN2 against OPEN2 at the margin 1e-3 on 16,000 paths: margin 0 (no charge) 44/126, survival -0.513 (-0.672 to -0.353); the charge 0.001 18/59, -0.256 (-0.364 to -0.149), the whole score -0.261 (-0.395 to -0.131). The straight line through the two survival points reaches 0.001 at the charge 0.002 and -0.385 at 0.0005 (two points, not a model: a hold's protection would flatten as the charge passes the year-0 gap's scale).
- **Item 2's band** (results-derive-7as.txt): at P's half-width (0.132) HELD needs a whole score above about -0.118; FALSIFIED below about -0.382.
- **Across all worlds** (results-derive-7as.txt): P against the margin moved the whole score -0.007, +0.086 and -0.000 on bridge 4, S194 and S126, with half-widths 0.044, 0.070 and 0.032 at 16,000 paths (about 0.063, 0.098 and 0.045 at 8,000). A leg reads FLAT when its whole score lies within about 0.15 to 0.21 of 0 at 8,000, so FLAT is expected where the charge's size moves less than P's switch from the margin did.
- **The mechanism** (grade A, the code): the charge enters both passes (solve.js switchCharge: in the backward pass's h and the forward chooser), so a larger charge raises the price of every switch the tables value and the chooser makes; at the node the chooser re-risks less (P's churn: S194's moves to a riskier tier in years 6-25 0.17 a path at 0.001 against 1.41 at margin 0, results-P.txt).
- **Claude's choices, before any run:** the charges 0.0005 and 0.002 (half and double the decided value); 8,000 paths across all worlds (P's power at half the paths, results-derive-7as.txt); the node on S194 alone (item 2 is S194's slice; P's node rules OPEN0 and WA not run); P's 0.001 records reused, its solves re-run for identity.

## Prediction

Item 1 HELD: every leg FLAT - the charge's value between 0.0005 and 0.002 moves neither survival (no material harm either way) nor the whole score (inside +/-0.25) across all worlds on any unit. Item 2 HELD: at 0.002 S194's node slice against the margin has its whole-score lower end above -0.25.

## Falsified if

Item 1: any leg CHANGES - harm either way by the exact rule with Holm, or a whole score wholly beyond -0.25 or +0.25. Item 2: OPEN2 at 0.002 against OPEN2 at 1e-3 at the node has its whole-score upper end below -0.25.

## Fair-test table

Arm A is P's TS+J at the charge 0.001 (margin 0) on each unit (P's records; its solves re-run for identity); arm B the same solve at the charge 0.0005 or 0.002. Item 2's reference is P's OPEN2 at the margin 1e-3 at S194's node. Every arm runs P's paths.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held |
| 19 | The switch margin and switching cost | margin 0, charge 0.001 (item 2's reference: the margin 1e-3, no charge) | margin 0, charge 0.0005 or 0.002 | TESTED - the charge's value alone; the gate holds every ran line to P's but the charge |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | P's records (its code id) | this run (the code as it stands) | ACCEPTED - P's records pass P's own gate; P's 0.001 solves are re-run here (ident:P) and the gate holds their table, ran line, gap and opening, joint, moves, price and world lines to P's, so the solver is P's at P's settings; P's traces are held to P's logs |
| 33 | For timings: what else the machine was running | n/a | n/a | N/A - no timing is read |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **The data:** every core job's TS+J trace across all worlds (8,000 paths) against P's TS+J at 0.001 on its first 8,000 paths, paired by path; S194's OPEN2 node traces (16,000 paths) against P's OPEN2 at 1e-3, paired.
- **Item 1 (primary; single look):** six legs (three units, two charges). Survival both ways by the exact conditional McNemar (one-sided, Holm over the six legs a direction) at the unit's margin (stats.mjs marginFor P's survival across all worlds: 0.25 at 95% or more), and the guarded unconditional interval (regimen item 1); the whole score by reduce-7aa.mjs wholeLeg at 0.05. A leg is FLAT when both ways read no material harm, the guarded interval lies inside minus to plus the margin and the whole score's interval inside -0.25 to +0.25; it CHANGES when either way reads harm or the whole score's interval lies wholly beyond -0.25 or +0.25; else INCONCLUSIVE. HELD when all six are FLAT; FALSIFIED when any CHANGES; else INCONCLUSIVE.
- **Item 2 (single look):** OPEN2 at 0.002 against OPEN2 at 1e-3 at S194's node, the whole score by wholeLeg at 0.05: HELD when the lower end is above -0.25; FALSIFIED when the upper end is below -0.25; else INCONCLUSIVE.
- **Reported, not items:** S194's node slice by charge (0, 0.0005, 0.001, 0.002) against OPEN2 at 1e-3, by survival and the whole score, with TS+J beside it; every leg's cells and intervals; each job's table, gap and opening by charge.
- **NOT SETTLED:** any gate fails (the stamps of 7as; P's own gate; a job missing, twice, not done or unregistered; a ran line not P's but for the charge; a joint line's margin, charge, death charge, scale or cap; an identity job's lines not P's; a missing line, node or all-world count off, a node line on bridge 4 or S126; a trace missing or off its log).
- **Declared choices, not derived:** the charges 0.0005 and 0.002; MW 0.25 (P's); 8,000 paths across all worlds.

## Decision fed

- **Item 1 HELD and item 2 HELD:** the value does not matter across all worlds between 0.0005 and 0.002, and twice the charge buys S194's node slice back: the slice is the hold's protection (what the margin masked), recovered at no material cost across all worlds. Put to the maintainer with this record: keep 0.001 or move to 0.002 (both flat across all worlds; 0.002 protects the bad world's de-risked opening); the PROVISIONAL label lifts either way (grade B: three units, one seed).
- **Item 1 HELD, item 2 FALSIFIED:** the value does not matter across all worlds, and a material slice stays at twice the charge: what P costs at the node, the mixture's trade (O50's reading, bought back across all worlds, results-P.txt item 4); 0.001 stays, its PROVISIONAL label lifted (swept, flat); no larger charge is registered as a fix of the slice.
- **Item 1 HELD, item 2 INCONCLUSIVE:** 0.001 stays, the label lifted for the sweep; the slice's split reported as it reads, O50 open.
- **Item 1 FALSIFIED:** the value matters across all worlds: the legs that change and their direction go to the maintainer before 7u registers; 0.001 stays PROVISIONAL.
- **Item 1 INCONCLUSIVE:** 0.001 stays PROVISIONAL; a second look at 16,000 paths across all worlds on the open legs is the next step if the maintainer wants the label lifted before 7u.
- **In every branch:** no product change (SWITCH_MARGIN unchanged until after Phase 4), no 7u, no seed 7013.

## Provenance

- The design: the maintainer's decision for the charge (PLAN.md the 3 Oct 18:51 row); O50; the deep review after 7aq (deep-review-log.md 3 Oct 18:17 UK: the flag on a larger charge); P's records and read (results-P.txt; predictions/diag-p.md).
- The build: audit-7as.mjs (P's diagP core job, copied from audit-s126.mjs so the registered script stays as it ran, at the charges 0.0005 and 0.002 and P's 0.001 for identity; the node on S194 alone with TS+J and OPEN2); reduce-7as.mjs (P's records through P's gate; planted 33, OUTCOMES REACHED on both items, an EDGES line; mutations 29 of 29, results-reduce-7as-mutations.txt); preflight-7as.sh and preflight-parse-7as.mjs; derive-7as.mjs; batch-7as.sh.
- The records: results-P.txt and its runs (results/diagP), through P's own gate and its chain.

## Derivation script

- `derive: research/solver/derive-7as.mjs > research/solver/results-derive-7as.txt sha256 443551a436ee33a0`
  (S194's slice by setting and the line through it; P's legs across all worlds and their half-widths; the time).

## Point and interval

80% intervals, the author's:
- Item 1: the largest whole-score move of the six legs 0.08 (0.02 to 0.25); legs FLAT 6 of 6 (4 to 6).
- Item 2: OPEN2 at 0.002 against OPEN2 at 1e-3, the whole score -0.08 (-0.25 to +0.05).

## Credence

The author's probability that each item reads as predicted: 1 (HELD), 0.55; 2 (HELD), 0.45. Item 1: P's whole move from the margin to the charge was at most 0.086 across all worlds, and halving or doubling the charge is a smaller change than removing the margin; S194, the unit that moved, is the likeliest INCONCLUSIVE. Item 2: the line through two points reaches 0 at 0.002, but a hold's protection need not be linear in the charge, and at P's half-width a point between about -0.12 and -0.38 reads INCONCLUSIVE.

## Power

- **Item 1** (results-derive-7as.txt): at 8,000 paths the whole score's half-width is about 0.063, 0.098 and 0.045 on bridge 4, S194 and S126, so a leg reads FLAT when its point is within about 0.19, 0.15 and 0.21 of 0. Survival: P against the margin had 5, 14 and 0 discordant paths of 16,000 (results-P.txt item 5), so the exact intervals sit well inside the 0.25 margin unless the charge's size moves far more paths.
- **Item 2:** 16,000 node paths, P's half-width 0.132: HELD at a point above about -0.118, FALSIFIED below about -0.382.
- **Time** (results-derive-7as.txt): P's measured seconds scaled to 7as's runs and by today's host against the host 7am measured P's solves on: 6.37 core-hours, 1.76 hours on four cores; P's own host is unrecorded (NOT CHECKED).

## Budget line

The charge's sweep and S194's slice, before 7u registers (the maintainer's decision, 3 Oct): about 6.4 core-hours, about 1.8 hours on four cores, after 7ar.

## Pre-mortem

- **Most likely:** item 1 HELD; item 2 INCONCLUSIVE (the slice smaller at 0.002 but its interval still reaching below -0.25).
- **Second:** item 1 INCONCLUSIVE on S194 at 0.002 (a larger charge holds the de-risked opening longer in the good worlds, and the whole score's rest moves by more than 0.15).
- **Third:** NOT SETTLED - an identity solve is not P's. The code id has changed since P ran (the allowance axis's pclsInterp option, default off, and the reader's research options); a difference would say a default path moved, and P's records could not be reused.
- **Fourth:** S194's opening moves off the de-risked pair at 0.002 (a larger charge prices the year-0 switch too), so TS+J and OPEN2 part at the node; item 2 reads OPEN2 regardless, and TS+J is reported beside it.
- **The smoke run:** smoke.sh (locked) does not run audit-7as.mjs; the preflight through the launcher (preflight-7as.sh: all 9 jobs at 4 points and 100 paths, read by preflight-parse-7as.mjs through the reducer's own parse, gate, traces and reading, with planted faults) stands in.

## Changes after seeing results

None.
