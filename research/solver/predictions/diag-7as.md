# Prediction: diag-7as

- **Run:** `research/solver/batch-7as.sh` - results/diag7as/case0-8.txt and traces (audit-7as.mjs, 9 jobs, one process a job), read beside P's records (results/diagP, through P's own gate); reduced by `reduce-7as.mjs` in the real tree into results-7as.txt
- **Kind:** test
- **Written:** 3 Oct, before the run (its time is its registering commit's, git log); designed by the maintainer's decision for the charge (PLAN.md the 3 Oct 18:51 row: the value 0.001 PROVISIONAL until swept, and S194's bad-world slice split before 7u and before any larger charge, O50) and the deep review after 7aq's flag (a larger charge is not registered as the decision's consequence without that split); amended before launch after the plan-auditor's FAIL of 3 Oct 20:06 UK (its BLOCKING 1: the OPEN2 dose-response cannot split O50, so the world-aware chooser is added as the separating arm, item 3, and item 2 attributes nothing; its MINORs 2 and 4: the legs against the margin reported, and how this read stands with the deep review after 7aq's STOP list); and again after its FAIL of 3 Oct 20:14 UK (BLOCKING 1: the world-aware chooser read alone cannot split O50, an informed chooser barely switching in the bad world; item 3 is now the contrast at the same charge, path by path, and the records' own contrast at 0.001 is derived first; MINORs 2-4: WA's half-width by script, the directions of item 3's branches, the reducer's docstring)
- **Seeds:** 7002 tuning (P's paths: the first 8,000 of P's 16,000 across all worlds, and P's 16,000 at world 0's node on S194). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan. No held-out seed is touched.
- **Unmasking:** the charge replaced the stored margin in the research candidate (the maintainer, 3 Oct): the margin's later holds were the known error (O67's grade-A hold code), and removing them unmasked the world-blind chooser re-risking in the bad world (O50: S194's node loss under P, whole -0.261). O50's two parts are the margin's removal and the world-blind chooser. O50 records that the world-aware chooser 'cannot split O50 alone' (it barely switches in the bad world, so it pays little charge whatever the cause); item 3 therefore reads it as a contrast at the same charge, path by path: the slice under OPEN2 (the charge less the margin) against the same move under the world-aware chooser - if WA's move is a small part of the slice, the slice is the world-blind chooser's, and a larger charge that shrinks it (item 2) would be masking that error again (RULES.md section 9). The contrast's stated limit: it assumes the charge's own cost to a chooser does not depend on whether the chooser knows the world. Item 2 is a dose-response only (both readings predict a smaller slice at a larger charge); item 1 reads whether the charge's size moves anything across all worlds.
- **Plan section:** PLAN.md "7as"

## Question

Does the switch charge's value matter between 0.0005 and 0.002 across all worlds on P's three units? At S194's bad node, does doubling the charge shrink the slice from the de-risked opening (O50's loss, -0.261 by the whole score at 0.001), and does the charge cost a world-aware chooser anything - so whether the slice is the world-blind chooser's (what the margin masked) or the charge's own?

## Derivation

- **What the records give** (derive-7as.mjs, results-derive-7as.txt, from results-P.txt): S194's slice at world 0's node, OPEN2 against OPEN2 at the margin 1e-3 on 16,000 paths: margin 0 (no charge) 44/126, survival -0.513 (-0.672 to -0.353); the charge 0.001 18/59, -0.256 (-0.364 to -0.149), the whole score -0.261 (-0.395 to -0.131). The straight line through the two survival points reaches 0.001 at the charge 0.002 and -0.385 at 0.0005 (two points, not a model: a hold's protection would flatten as the charge passes the year-0 gap's scale).
- **Item 2's band** (results-derive-7as.txt): at P's half-width (0.132) HELD needs a whole score above about -0.118; FALSIFIED below about -0.382.
- **Across all worlds** (results-derive-7as.txt): P against the margin moved the whole score -0.007, +0.086 and -0.000 on bridge 4, S194 and S126, with half-widths 0.044, 0.070 and 0.032 at 16,000 paths (about 0.063, 0.098 and 0.045 at 8,000). A leg reads FLAT when its whole score lies within about 0.15 to 0.21 of 0 at 8,000, so FLAT is expected where the charge's size moves less than P's switch from the margin did.
- **The world-aware chooser** (results-derive-7as.txt, from results-P.txt): at S194's node it survives 93.85 at the margin, 93.84 at margin 0 and 93.80 at the charge 0.001 - the same within the node's noise, where the world-blind chooser moves 91.96, 91.44 and 91.70: the deep review after P read the node loss as the world-blind chooser's (grade C). Its paired legs, from P's traces (results-derive-7as.txt section 1c): WA at 0.001 against the margin -0.019 (-0.108 to 0.068), half-width 0.088; at margin 0 -0.039 (-0.167 to 0.089).
- **What the records already say about the split** (results-derive-7as.txt section 1c; grade C - computed after the plan-auditor's receipt of 3 Oct 20:14 UK had shown WA's leg at 0.001, so post hoc): at P's charge, path by path on 16,000 node paths, the slice -0.261 a path, WA's move -0.019, WA's share of the slice 0.07; by item 3's own rule the HELD side's p is 0.039 alone, 0.079 after Holm over the two directions - INCONCLUSIVE. The split at P's charge points to the world-blind chooser but is not settled by the records.
- **The mechanism** (grade A, the code): the charge enters both passes (solve.js switchCharge: in the backward pass's h and the forward chooser), so a larger charge raises the price of every switch the tables value and the chooser makes; at the node the chooser re-risks less (P's churn: S194's moves to a riskier tier in years 6-25 0.17 a path at 0.001 against 1.41 at margin 0, results-P.txt).
- **Claude's choices, before any run:** the charges 0.0005 and 0.002 (half and double the decided value); 8,000 paths across all worlds (P's power at half the paths, results-derive-7as.txt); the node on S194 alone (item 2 is S194's slice; P's node rules OPEN0 and WA not run); P's 0.001 records reused, its solves re-run for identity.

## Prediction

Item 1 HELD: every leg FLAT - the charge's value between 0.0005 and 0.002 moves neither survival (no material harm either way) nor the whole score (inside +/-0.25) across all worlds on any unit. Item 2 HELD: at 0.002 S194's node slice against the margin has its whole-score lower end above -0.25. Item 3 INCONCLUSIVE: at 0.002 the slice is small (item 2) and the contrast cannot split what is left - the split at P's charge (the derivation) stays the record's best reading, grade C.

## Falsified if

Item 1: any leg CHANGES - harm either way by the exact rule with Holm, or a whole score wholly beyond -0.25 or +0.25. Item 2: OPEN2 at 0.002 against OPEN2 at 1e-3 at the node has its whole-score upper end below -0.25. Item 3 (predicted INCONCLUSIVE, so either other outcome misses): HELD (WA's move a third of the slice or less, by the test) or FALSIFIED (two thirds or more).

## Fair-test table

Arm A is P's TS+J at the charge 0.001 (margin 0) on each unit (P's records; its solves re-run for identity); arm B the same solve at the charge 0.0005 or 0.002. Item 2's reference is P's OPEN2 at the margin 1e-3 at S194's node. Every arm runs P's paths.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held |
| 19 | The switch margin and switching cost | item 1: margin 0, charge 0.001; items 2 and 3: the margin 1e-3, no charge (P's) | margin 0, charge 0.0005 or 0.002 | TESTED - item 1 the charge's value alone; items 2 and 3 the margin and the charge together (the margin's removal and the charge's addition are not separated there; item 3 holds the chooser world-aware to split O50, not the two settings); the gate holds every ran line to P's but the charge |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | P's records (its code id) | this run (the code as it stands) | ACCEPTED - P's records pass P's own gate; P's 0.001 solves are re-run here (ident:P) and the gate holds their table, ran line, gap and opening, joint, moves, price and world lines to P's, so the solver is P's at P's settings; P's traces are held to P's logs |
| 33 | For timings: what else the machine was running | n/a | n/a | N/A - no timing is read |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **The data:** every core job's TS+J trace across all worlds (8,000 paths) against P's TS+J at 0.001 on its first 8,000 paths, paired by path; S194's OPEN2 node traces (16,000 paths) against P's OPEN2 at 1e-3, paired.
- **Item 1 (primary; single look):** six legs (three units, two charges). Survival both ways by the exact conditional McNemar (one-sided, Holm over the six legs a direction) at the unit's margin (stats.mjs marginFor P's survival across all worlds: 0.25 at 95% or more), and the guarded unconditional interval (regimen item 1); the whole score by reduce-7aa.mjs wholeLeg at 0.05. A leg is FLAT when both ways read no material harm, the guarded interval lies inside minus to plus the margin and the whole score's interval inside -0.25 to +0.25; it CHANGES when either way reads harm or the whole score's interval lies wholly beyond -0.25 or +0.25; else INCONCLUSIVE. HELD when all six are FLAT; FALSIFIED when any CHANGES; else INCONCLUSIVE.
- **Item 2 (single look; a dose-response that attributes nothing by itself):** OPEN2 at 0.002 against OPEN2 at 1e-3 at S194's node, the whole score by wholeLeg at 0.05: HELD when the lower end is above -0.25; FALSIFIED when the upper end is below -0.25; else INCONCLUSIVE.
- **Item 3 (single look; the split, a contrast at the same charge):** at S194's node, each path's whole score (reduce-7aa.mjs wholePaths) under OPEN2 at 0.002 less under OPEN2 at 1e-3 (o) and under WA at 0.002 less under WA at 1e-3 (a), paired by path. The premise: a slice - Fisher's paired randomization test (reduce-7ar.mjs flipP, B 20,000) of mean(-o) above 0 under 0.05; without it INCONCLUSIVE (NO SLICE). HELD (the slice is the world-blind chooser's) when the test of mean(a - o/3) above 0 is under 0.05 after Holm over the two directions; FALSIFIED (the charge's own: WA loses two thirds of the slice or more) when the test of mean(2o/3 - a) above 0 is; else INCONCLUSIVE. A WA that gains while OPEN2 loses reads on the HELD side (the charge helps an informed chooser; it cannot be the slice's cause). The same contrast at 0.0005 and at 0.001 (P's; the derivation) is reported.
- **Reported, not items:** every unit's TS+J at each charge against TS+J at the margin 1e-3 across all worlds (P's 1e-3 traces, first 8,000 paths: so 'flat' is read against the bundle too); S194's node slice by charge (0, 0.0005, 0.001, 0.002) against OPEN2 at 1e-3, by survival and the whole score, with TS+J beside it; every leg's cells and intervals; each job's table, gap and opening by charge.
- **NOT SETTLED:** any gate fails (the stamps of 7as; P's own gate; a job missing, twice, not done or unregistered; a ran line not P's but for the charge; a joint line's margin, charge, death charge, scale or cap; an identity job's lines not P's; a missing line, node or all-world count off, a node line on bridge 4 or S126; a trace missing or off its log).
- **Declared choices, not derived:** the charges 0.0005 and 0.002; MW 0.25 (P's); 8,000 paths across all worlds; item 3 at 0.002 only (0.0005 and 0.001 reported); the third and two thirds (7ar's).
- **This read and the deep review after 7aq's STOP list** ('any opening rule or charge value from 30x5 knife edges'): every item reads outcomes - survival and the whole score along simulated paths - not year-0 gaps; a value chosen here is chosen on outcomes, and a 30x5 opening that flips with the charge (pre-mortem 4) is reported, not read. The STOP item's concern (a value set on a knife edge of a gap) does not bind an outcome read, but the read is still one grid and one seed (grade B at most), and 7an's split arms read the grid's part.

## Decision fed

- **Item 3 HELD** (WA's move a third of the slice or less at 0.002): the slice is the world-blind chooser's - what removing the margin unmasked (O50's reading; grade B at one node, one seed, S194 alone) - and whatever item 2 reads, a larger charge that shrinks the slice is masking that error again (RULES.md section 9 rules 1-2): no larger charge is offered as protection of the slice; the fix is the chooser's world-blindness (family 2: learning, O31), designed separately. The charge's value is chosen on item 1 alone.
- **Item 3 FALSIFIED** (WA loses two thirds of the slice or more: the charge's own cost, on an informed chooser too): the slice is the charge's, not the world-blind chooser's; a larger charge costs more there, so it is not offered as protection either; the slice's size goes to the maintainer with items 1 and 2 before 7u, and O50 stays open.
- **Item 3 INCONCLUSIVE or NO SLICE** (the prediction): the split is not made by this run; the records' split at P's charge (the derivation: WA's share 0.07, INCONCLUSIVE, grade C) is the best reading; no larger charge is offered as protection of the slice in any branch, and O50 stays open with that reading.
- **Item 1 HELD:** the value does not matter across all worlds between 0.0005 and 0.002 (against 0.001; against the margin reported): 0.001 stays and its PROVISIONAL label lifts for the sweep (grade B), the choice of another value within the flat range the maintainer's, on item 1's grounds alone.
- **Item 1 FALSIFIED:** the value matters across all worlds: the legs that change and their direction go to the maintainer before 7u registers; 0.001 stays PROVISIONAL.
- **Item 1 INCONCLUSIVE:** 0.001 stays PROVISIONAL; a second look at 16,000 paths across all worlds on the open legs is the next step if the maintainer wants the label lifted before 7u.
- **Item 2, in every branch:** reported as the dose-response it is (attributing nothing by itself), read with item 3.
- **In every branch:** no product change (SWITCH_MARGIN unchanged until after Phase 4), no 7u, no seed 7013.

## Provenance

- The design: the maintainer's decision for the charge (PLAN.md the 3 Oct 18:51 row); O50; the deep review after 7aq (deep-review-log.md 3 Oct 18:17 UK: the flag on a larger charge); P's records and read (results-P.txt; predictions/diag-p.md).
- The build: audit-7as.mjs (P's diagP core job, copied from audit-s126.mjs so the registered script stays as it ran, at the charges 0.0005 and 0.002 and P's 0.001 for identity; the node on S194 alone with TS+J, OPEN2 and the world-aware chooser); reduce-7as.mjs (P's records through P's gate; planted 41, OUTCOMES REACHED on all three items, an EDGES line; mutations 35 of 35, results-reduce-7as-mutations.txt); preflight-7as.sh and preflight-parse-7as.mjs; derive-7as.mjs; batch-7as.sh.
- The records: results-P.txt and its runs (results/diagP), through P's own gate and its chain.

## Derivation script

- `derive: research/solver/derive-7as.mjs > research/solver/results-derive-7as.txt sha256 bf600d02b50158e5`
  (S194's slice by setting and the line through it; the world-aware chooser at the node; the split at P's charge from P's traces; P's legs across all worlds and their half-widths; the time).

## Point and interval

80% intervals, the author's:
- Item 1: the largest whole-score move of the six legs 0.08 (0.02 to 0.25); legs FLAT 6 of 6 (4 to 6).
- Item 2: OPEN2 at 0.002 against OPEN2 at 1e-3, the whole score -0.08 (-0.25 to +0.05).
- Item 3: WA's share of the slice at 0.002 0.1 (-0.5 to 0.6), the slice -0.08 a path (-0.25 to +0.05).

## Credence

The author's probability that each item reads as predicted: 1 (HELD), 0.55; 2 (HELD), 0.45; 3 (INCONCLUSIVE), 0.65. Item 1: P's whole move from the margin to the charge was at most 0.086 across all worlds, and halving or doubling the charge is a smaller change than removing the margin; S194, the unit that moved, is the likeliest INCONCLUSIVE. Item 2: the line through two points reaches 0 at 0.002, but a hold's protection need not be linear in the charge, and at P's half-width a point between about -0.12 and -0.38 reads INCONCLUSIVE. Item 3: at P's charge, where the slice is -0.261, the records' contrast reads INCONCLUSIVE (WA's share 0.07, the HELD side's p 0.079 after Holm, results-derive-7as.txt); at 0.002 the slice is predicted near 0 (item 2), so the premise may fail (NO SLICE) or the contrast have less to work with.

## Power

- **Item 1** (results-derive-7as.txt): at 8,000 paths the whole score's half-width is about 0.063, 0.098 and 0.045 on bridge 4, S194 and S126, so a leg reads FLAT when its point is within about 0.19, 0.15 and 0.21 of 0. Survival: P against the margin had 5, 14 and 0 discordant paths of 16,000 (results-P.txt item 5), so the exact intervals sit well inside the 0.25 margin unless the charge's size moves far more paths.
- **Item 2:** 16,000 node paths, P's half-width 0.132: HELD at a point above about -0.118, FALSIFIED below about -0.382.
- **Item 3:** the same 16,000 paths; at P's charge the contrast's HELD side reached p 0.039 alone with a slice of 0.261 (results-derive-7as.txt section 1c), so at 0.002, with a slice predicted near 0.08, the item has little power: INCONCLUSIVE or NO SLICE is the likely read, as predicted. WA's paired half-width, from P's traces, 0.088 at 0.001 and 0.128 at margin 0 (by script).
- **Time** (results-derive-7as.txt): P's measured seconds scaled to 7as's runs and by today's host against the host 7am measured P's solves on: 7.33 core-hours, 2.04 hours on four cores (with the world-aware chooser's node runs); P's own host is unrecorded (NOT CHECKED).

## Budget line

The charge's sweep and S194's slice, before 7u registers (the maintainer's decision, 3 Oct): about 7.3 core-hours, about 2.0 hours on four cores, after 7ar.

## Pre-mortem

- **Most likely:** item 1 HELD; item 2 INCONCLUSIVE (the slice smaller at 0.002 but its interval still reaching below -0.25).
- **Second:** item 1 INCONCLUSIVE on S194 at 0.002 (a larger charge holds the de-risked opening longer in the good worlds, and the whole score's rest moves by more than 0.15).
- **Third:** NOT SETTLED - an identity solve is not P's. The code id has changed since P ran (the allowance axis's pclsInterp option, default off, and the reader's research options); a difference would say a default path moved, and P's records could not be reused.
- **Item 3 cannot read:** the slice at 0.002 too small for the premise (NO SLICE) - the split then rests on the records' contrast at P's charge, grade C.
- **Fourth:** S194's opening moves off the de-risked pair at 0.002 (a larger charge prices the year-0 switch too), so TS+J and OPEN2 part at the node; item 2 reads OPEN2 regardless, and TS+J is reported beside it.
- **The smoke run:** smoke.sh (locked) does not run audit-7as.mjs; the preflight through the launcher (preflight-7as.sh: all 9 jobs at 4 points and 100 paths, read by preflight-parse-7as.mjs through the reducer's own parse, gate, traces and reading, with planted faults) stands in.

## Changes after seeing results

None.
