# Prediction: diag-7aa

- **Run:** `research/solver/batch-7aa.sh` - results/diag7aa/case0-29.txt and every run's trace (audit-s126.mjs diag7aa); reduced by `reduce-7aa.mjs` into results-7aa.txt
- **Kind:** test
- **Written:** 28 Sept, 07:00 UK, before the run; revised before the run for the plan-auditor's FAIL on its registration (review-log.md, 28 Sept, 07:21 UK: item 4's survival part now unconditional; item 5 read on the product's survivors at the pooled margin 0.1; the Decision fed regraded), no result seen
- **Seeds:** 7002 tuning (8,000 paths, 7v's to 7y's; the same paths for every unit; each world's line on the first 1,000 with the long-run shift set to the world's node). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan; on these cases it draws no path (7y's gate: "off: no tier above the plan" on every solve). No held-out seed is touched.
- **Unmasking:** TS+J removes two known errors together: free switching in the tables (FS: every tier valued as if the next year's could be changed for nothing) and the per-world tier choice (O41: each world's layer switching as if it knew its world, where the chooser applies the rule to the mixture). The baseline behaviour they drive: the product's opening held in the plan's tier by the margin's accidental hold (O30, O33), and the per-world tier state's extra risk in the bad world (O42). Removing them may unmask two errors the margin now hides: off's misread of S360 (O37: its tables favour the de-risk that loses, and only the 1e-3 margin keeps the plan's tier) and the reader's plan-tier reference in every layer (O36: on S360 with the reader it turns the de-risk's sign for held tables). So S360 under off and with the reader are harm legs attributed in advance at grade C to O37 and O36, never to TS+J alone; items 2 and 5 (TS+J against TS) separate the per-world rule's share from free switching's (item 5 on the paths the product survives, so the opening's saves, which fall on the paths the product fails, cannot carry it; where TS+J and TS open apart its opening and its later switching stay unseparated, grade C); a harm is not TS+J's fault until a decomposition splits the blame (RULES.md section 9).
- **Plan section:** PLAN.md "7aa"

## Question

With both free switching and the per-world tier choice removed from the tables (the joint tier state, TS+J: one table layer per tier pair, the switching cost charged in the backward pass, the switch margin applied to the mixture-weighted score as the chooser applies it, one move for every world), does the solver keep more plans funded than the product and the per-world tier state with the pot's weight off (0: survival first), and does it score better by its own whole score within a survival limit with the pot's weight on (0.02, the solver's default), without harm where the bridge is read or under off? Does removing the per-world rule account for O42's losses?

## Derivation

- **What the tables say** (results-o41.txt; grade B for the printed tables): at the product's margin and the weight 0.02, TS+J opens in pension pair 2 on S126 (reader) and S194 (off), where TS and the product open in the plan's tier; its year-0 gap is 1.334 and 1.086 times TS's (S194 a knife-edge, the tier state's gap just under the margin). On share 0.95 both open in the plan's tier. So TS+J de-risks the opening where the freed opening did.
- **What the freed opening bought** (7w; results-derive-7aa.txt through reduce-7w.mjs's gates; grade C as a proxy for TS+J): against the product at 0.001 on 7w's 3,000 paths, 15/0 on S126 and 16/0 on S194 (about 40 and 43 of 8,000), with the rest of the whole score -0.170 +/- 0.025 and -0.068 +/- 0.020 (the de-risk costs estate; survival more than pays it back by the whole score).
- **What the tier state lost** (7y; results-7y.txt): TS against PRODUCT 5/9 on S126, 2/16 on S194, 0/7 on bridge 4 at 0.02; pooled over six legs 16/49 (results-7y-whole.txt). If the per-world rule is O42's cause (the deep review's first reading), TS+J removes those losses (item 5, read on the paths the product survives: 32 of TS's losses there, 9, 16 and 7, against 7 saves on paths the product fails, which the opening's gain resembles and item 5 leaves out).
- **The weight 0 has no record** (every run so far is at 0.02; O43): with the pot's weight off a de-risk costs nothing in the objective, so the tables should favour it at least as much as at 0.02; the sizes at 0 are drawn as at 0.02, a declared assumption (grade D).
- **Where it could harm:** S360 under off (O37: its TS gap 5.6446e-4, both arms open in tier 2 at margin 0; a TS+J gap past 1e-3 would open it in tier 2, where 7v's OFF/3e-4 lost 497 paths and saved 9, results-7v.txt); S360 with the reader (O36: held tables' sign turned by the plan-tier reference, results-refs360.txt, +0.9950 against -16.0290); bridge 4 (the tier state switched 0.60 times a path against 0.04, results-7y.txt).
- **Prior tests of the same mechanism** (RULES.md section 9 rule 7): 7x item 1 HELD (held tables price the de-risk at 0.790 and 0.970 of its realised gain); 7t's J alone INCONCLUSIVE; 7v's P mechanism seen on S126 (grade C); 7y items 1 and 3 FALSIFIED (the per-world tier state alone: no gain, the gap moved 0.99 and 1.28 times); O41 NOT BOUNDED at the opening (results-o41.txt).

## Prediction

1. **W0, the gain:** on S126 (reader) and S194 (off), TS+J gains against PRODUCT by survival.
2. **W0, the per-world rule:** on both, TS+J gains against TS by survival.
3. **W0, no harm:** on bridge 4 (reader), S360 (reader) and S360 (off), TS+J shows no material harm against PRODUCT.
4. **W0.02, the whole score:** on S126 and S194, TS+J gains against PRODUCT by the whole score within the survival limit.
5. **W0.02, O42, TS's losses:** pooled over S126, S194 and bridge 4, on the paths PRODUCT survives at 0.02, TS+J survives more than TS (TS+J removes TS's losses).
6. **W0.02, no harm:** on bridge 4, S360 (reader) and S360 (off), TS+J shows no material harm against PRODUCT by survival.

## Falsified if

Item 1: no material gain on both. Item 2: no material gain on both. Item 3: harm on any. Item 4: no material gain or survival
harm on both. Item 5: no material gain (the pooled interval's upper end below 0.1 points, the regimen's pooled margin). Item
6: harm on any. INCONCLUSIVE is never a negative: the suspect stays open.

## Fair-test table

Arm A is PRODUCT (today's free-switching tables) or, for items 2 and 5, TS (the per-world tier state); arm B is TS+J (the joint
tier state) - the same case, estate weight, bridge read, solve settings, margin and paths. The estate weight is a stratum: 0
and 0.02, the same in both arms of every leg.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | S126 (reader) and S194 (off) - 7x's and 7y's FS cases; bridge 4 (reader) - O42's clearest leg; S360 with the reader and under off - O36's and O37's harm legs: chosen on purpose from the records, a diagnosis, nothing generalised | the same | SAME |
| 2 | Changes the test makes to a household's inputs | bridge 4 is 7c's variant of S126 (audit-s126.mjs F1_VARIANTS) | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | 8,000 paths of seed 7002 | the same paths, paired | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held and the solver runs against itself |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | three worlds, each world's tables solving its own tier choice (PRODUCT and TS) | three worlds, one move for every world (TS+J: jointWorlds with the tier state) | TESTED - the per-world rule (O41) is half of the thing tested; items 2 and 5 read it alone against TS |
| 12 | The estate preference | the estate weight 0 or 0.02 (linear, capped at the case's cap), as the unit names it | the same weight in every leg | SAME within every leg; two strata by the maintainer's design (28 Sep: survival decides with the pot off, the whole score within a survival limit with it on) |
| 13 | The risk tier chosen, consent to change it, risk above | the product's 'auto' rule (no tier above within reach: "off: no tier above the plan", required by the gate); the tier free each year | the same | SAME |
| 19 | The switch margin and switching cost | the margin 0.001 and the cost 0.25% of the slice traded, applied by the chooser forward only (PRODUCT), or in the backward pass per world (TS) | the same margin and cost, in the backward pass on the mixture-weighted score as the chooser applies them | TESTED - the other half of the thing tested (free switching) |
| 20 | The dislike of cuts: lambda (held or landed) and the trim curve's exponent (together, c) | 7t's to 7z's 0.0223606797749979, exponent 2 | the same | SAME |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | the reader on READER cases, off on OFF cases; the final year exact; no block trim; Q's fix off; the reader's reference the plan's | the same | SAME |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself, no rival arm |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm in this run |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | one process a unit, every unit from the same snapshot and stamp (requireFairLogs) | the same | SAME |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | survival: the floor paid every year and the minimum pot at the end, simulated; the whole score: reduce-7t.mjs's (survival, the capped estate at the unit's own weight, the dislike of cuts, the raise credit), realised on the paths | the same | SAME |
| 30 | The reducer and its version | reduce-7aa.mjs: requireFairLogs over the logs' stamps, then its own gate on every unit, ran, solve, gap, joint, world, run and done line and every trace's count, seed, arm, stamp and survival (within 0.00005); INCONCLUSIVE unless all thirty units are done; 62 planted checks (among them the whole rule's calibration at the margin), 55 planted faults each caught (mutate-reduce-7aa.py, results-reduce-7aa-mutations.txt) | the same | SAME |
| 31 | Paired or not, and the standard error used | paired on the same paths; survival by the regimen's exact rule (reduce-7v.mjs gainFamily and harmFamily), Holm within each item, the exact 95% interval against the case's margin; item 5 on the paths PRODUCT survives (reduce-7aa.mjs cellsWhere), pooled; the whole score by the rule in the Decision rule section (its survival part unconditional, the exact form printed beside); the unconditional interval printed beside every survival leg | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | survival and the whole score are realised on the paths; the tables and gaps are the solver's reading, never the result | the same | SAME |
| 33 | For timings: what else the machine was running | the solve and run seconds are printed, not read | the same | N/A - no timing is read |
- **All other rows: SAME**

## Decision rule (registered before launch)

- **Survival** (items 1, 2, 3, 5, 6; reduce-7v.mjs gainFamily and harmFamily, single look, level 0.05, Holm over each item's
  legs): the margin is marginFor() of the case's PRODUCT survival at the leg's own weight (0.25 at 95% or more, else 0.5);
  item 5 pools the three cases' cells on the paths PRODUCT survives at 0.02 (8,000 less the product's failures on each: 23,764
  in 7y, whose product failed 59, 142 and 35, results-derive-7aa.txt; TS+J against TS: saved where TS fails and TS+J survives) with the regimen's pooled margin 0.1 (stats.mjs
  MARGINS.pooled). **Items 1 and 2** HELD when both legs gain,
  FALSIFIED when both show no material gain, else INCONCLUSIVE. **Items 3 and 6** HELD when all three legs show no material
  harm, FALSIFIED when any reads harm, else INCONCLUSIVE. **Item 5** HELD on a gain, FALSIFIED on no material gain, else
  INCONCLUSIVE.
- **The whole score** (item 4; reduce-7aa.mjs wholeLeg and wholeFrom): per path reduce-7t.mjs's score at the run's own
  estate weight, paired; its change split into the survival part, read unconditionally (stats.mjs survivalChangeU with
  reduce-7v.mjs's one-sided guard: the plan's corrected form, drafts/whole-score-rule.md row 1), and the rest (estate, cuts
  and raises: the paired mean with its normal interval), each part's interval at half the leg's error rate, added. The
  leg's rate is 0.05 over the item's two legs (Bonferroni, at least as strict as Holm; Holm needs p-values the added interval
  does not give). A leg GAINS when the lower end is above 0 and survival shows no material harm by the unconditional
  interval (its lower end above minus the margin); NO MATERIAL GAIN when the upper end is below the case's margin; HARM when
  survival reads harm (the survival limit: harmFamily's exact McNemar under Holm over the two legs, the point loss at least
  the margin); else inconclusive. Item 4 HELD when both legs gain, FALSIFIED when both show no material gain or harm, else
  INCONCLUSIVE. **Its error rate is measured, not claimed:** the union bound holds only as far as each part holds its own,
  and neither is exact (the unconditional interval: results-sim-unconditional.txt; the rest: a normal interval), so the
  reducer's planted calibration puts a true whole change exactly at the margin on S126- and S194-like legs (the rest -0.170
  +/- 0.016 and -0.068 +/- 0.013, backgrounds 0.5 and 5): the rule reads no material gain 0.0005, 0.0050, 0.0025 and 0.0010
  of 2,000 draws each (S126-like at the backgrounds 0.5 and 5, then S194-like; the one-sided rate 0.0125), where the exact
  form first registered read 0.2620, 0.0495, 0.2345 and 0.0340 (results-reduce-7aa-planted.txt).
  The exact form is printed beside each item-4 leg and marked where it reads differently.
- **NOT SETTLED:** the fair-test gate fails.
- **The registered reading decides; the unconditional one is printed beside it,** marked where they disagree.
- **Declared choices, not derived:** the two weights (0 and the solver's default 0.02; the product's own lever's floor is
  0.01, PRODUCT_DEFAULTS.estateWeightMin, so 0 is a research setting); the whole score's margin equal to survival's (both in
  points of survival); Bonferroni for item 4; item 5's pooling over three cases and its reading on the product's survivors
  (its margin is the regimen's pooled 0.1).

## Decision fed

- **Items 1 and 4 HELD with 3 and 6 HELD:** removing free switching and the per-world rule together gains at both settings
  without harm where read: the first-ranked cause holds at grade B (one seed, five cases), O30's and O33's fix has a candidate
  (TS+J), and the combined fix (TS+J with Q's fix, the deep review's design: arms READER, READER+STEP, TS+J and TS+J+STEP,
  share 0.95-R and S360-R first, after the TS+J+STEP code path's test) goes to the maintainer as the next build. Nothing to a
  default: the wider confirmation (7u) comes first.
- **Item 1 HELD and item 4 not (or the reverse):** the gain depends on the lever: TS+J serves one setting; to the maintainer,
  with the possibility that it is lever-dependent rather than always on.
- **Item 2 FALSIFIED with item 1 HELD:** at the weight 0 the tier state alone carries the gain; O41 is not material there.
  What it says of O42 at 0.02 is item 5's to decide (below; the two read together, never one against the other).
- **Items 1 and 4 FALSIFIED:** TS+J does not gain: the first-ranked cause is weakened at grade C, not fallen (RULES.md
  section 9 rule 1: TS+J removes two known errors, so a no-gain is not the cause's failure until a decomposition splits it).
  The decomposition named: the opening against the later years (each arm's gap and opening line, the slices by long-run
  shift, the path-years TS+J holds a riskier or a safer tier than PRODUCT), which says whether TS+J de-risked the opening
  and later switching gave the gain back (the pre-mortem's second scenario) or never de-risked it. Premises at risk, each
  grade D: SWITCH_MARGIN and SWITCH_COST never swept in a backward pass (TS+J now charges them there; the 02:38 row); no
  learning (each world's layers solved as if the world were never learned). The next suspect is then the switch margin itself
  (lower margins score better by the whole score on S126, bridge 4 and S172, O43): a two-setting margin test to the
  maintainer.
- **Item 3 or 6 FALSIFIED:** harm where read: TS+J is not a candidate as it stands; a register row attributing the harm at
  grade C (S360 with the reader to O36's reference, S360 under off to O37's misread, bridge 4 to O42) until a decomposition
  splits the blame; no combined fix is designed before it is.
- **Item 5 HELD:** TS+J removes TS's losses at 0.02: O42 is the per-world rule's (the deep review's reading), not the pot's
  trade, at grade C: on a case where TS+J and TS open apart, its opening and its later switching are not separated (a safer
  opening could itself rescue a path TS loses later; a premise, grade D); the reducer prints each arm's opening, marked where
  the two open alike, and the decomposition that splits it is an arm with TS+J's tables held to TS's opening. With item 2
  FALSIFIED as well: the per-world rule costs survival only with the pot on, through the estate term.
- **Item 5 FALSIFIED:** TS+J keeps TS's losses at 0.02: the per-world rule is not what costs survival there; O42 reads as the
  pot's trade (reading a) or another cause, at grade C (the premises above), and O42 is re-read; with item 2 FALSIFIED as
  well, 7y's no gain at 0.02 was the pot's trade.
- **Item 5 INCONCLUSIVE:** O42 open; a sized follow-up.
- **Otherwise (INCONCLUSIVE):** a sized follow-up to the maintainer; nothing else rests on it.

## Provenance

- The build: solve.js tierState with jointWorlds (906a432; its test solver-tierstate.test.mjs, 17 checks, check G the joint
  endpoint and the mixture chooser agreeing at 2,601 of 2,601 nodes); the estate weight through solvePlan's `bequestWeight`
  (solve.js line 470). The mode: audit-s126.mjs diag7aa (measureV2 passes the estate weight and prints it on the ran line
  only when set). The batch batch-7aa.sh; the preflight preflight-7aa.sh with preflight-parse-7aa.mjs. The reducer
  reduce-7aa.mjs with mutate-reduce-7aa.py.
- The records: results-o41.txt, results-7y.txt, results-7y-whole.txt, results-7w.txt, results-7v.txt, results-refs360.txt,
  results-verdicts-whole.txt (O43), results-derive-7aa.txt.

## Derivation script

- `derive: research/solver/derive-7aa.mjs > research/solver/results-derive-7aa.txt sha256 2470bdb27b06d27a`
  (7w's freed opening against the product on S126 and S194 through reduce-7w.mjs's gates, its survival cells scaled to 8,000
  and the rest of its whole score; 7y's TS against PRODUCT through reduce-7y.mjs's gates; each item drawn as Poisson counts
  with a background of 0.5 and 5 paths each way, item 4's rest as a normal mean at its recorded error, read by reduce-7aa.mjs's
  rule: item 4's interval by its own wholeFrom, item 5 on the product's survivors at 0.1).

## Point and interval

80% intervals, the author's, of 8,000 paths (saved less lost) or as named:
- Item 1 (W0): S126 +30 (-20 to +60); S194 +30 (-30 to +70).
- Item 2 (W0): S126 +30 (-20 to +60); S194 +35 (-20 to +75).
- Item 3 (W0): bridge 4 0 (-30 to +20); S360 (reader) 0 (-400 to +200); S360 (off) -20 (-500 to +20).
- Item 4 (W0.02): the whole score S126 +0.3 (-0.2 to +0.6), S194 +0.4 (-0.2 to +0.7) points.
- Item 5 (W0.02): on the product's survivors, pooled +20 (-5 to +30) of about 23,764 (TS's 32 losses there in 7y the ceiling).
- Item 6 (W0.02): as item 3.

## Credence

The author's probability that each item reads as predicted: 1 (HELD), 0.50; 2 (HELD), 0.45; 3 (HELD), 0.45; 4 (HELD), 0.50;
5 (HELD), 0.50; 6 (HELD), 0.45. The scorecard stands at 0.214 over 72 items against its 0.20 target (results-scorecard.txt),
the last test of this mechanism (7y) scored 0.252, and the harm legs carry O36's and O37's known errors, so none is given
above 0.50.

## Power

From results-derive-7aa.txt (20,000 draws a story, backgrounds 0.5 and 5 paths each way):
- **Items 1 and 2** (the 0.02 sizes assumed at 0): at the freed opening's size HELD 1.000 at both; at half 1.000 and 0.970;
  at a quarter 0.877 and 0.472; TS+J doing nothing FALSIFIED 1.000 and 0.978.
- **Items 3 and 6:** all level HELD 1.000; bridge 4 losing 30 paths FALSIFIED 0.975 and 0.958; either S360 leg losing 80
  FALSIFIED 1.000.
- **Item 4** (the unconditional rule): as the freed opening, survival and the rest, HELD 0.948 and 0.850; its survival only
  HELD 1.000 and 0.999; half of both HELD 0.349 and 0.171; doing nothing FALSIFIED 1.000 and 0.932; a true whole change
  exactly at the margin on both legs FALSIFIED 0.000 at both (HELD 0.647 and 0.395).
- **Item 5** (the product's survivors, 0.1): removing TS's losses HELD 1.000 and 0.992; removing half of them HELD 0.989 and
  0.730; keeping them (TS+J as TS, or as the freed opening only: its saves fall on paths the product fails) FALSIFIED 0.995
  and 0.964; keeping them and losing 10 of its own FALSIFIED 1.000 at both.
- **Time:** from the records - 7y's fourteen units took 95 minutes on four cores (00:41 to 02:16 UK, runs.log and
  batch-7y.log); its tier-state solves 681 to 1,141 s at 30 points; o41's TS and TS+J solves 653 to 784 s; 7y's forward runs
  of 8,000 paths 596 to 751 s; each world line adds 1,000 paths (3,000 a unit, about three-eighths of a run). Assumed per
  unit: PRODUCT about 18 minutes, TS about 33, TS+J about 28; thirty units four at a time, the longest first, about 3 to 4
  hours, plus the smoke run and the launcher's re-run of derive-7aa.mjs (about 3 minutes). Each process is stopped at 4 hours.

## Budget line

The first-ranked cause of the product's lost opening (free switching with the per-world tier choice, the deep review on both
reads) is tested by removing both, at the two settings the maintainer's end goal names: survival first with the pot off,
and the whole score within a survival limit with the pot on. 7y removed one and gained nothing; O41's tables show the joint
version opening de-risked where the freed opening saved 40 and 43 paths of 8,000.

## Pre-mortem

- **Most likely:** items 1 and 4 HELD on S126 and INCONCLUSIVE on S194 (the knife-edge), so both items INCONCLUSIVE; item 2
  as item 1; item 5 HELD; S360 under off harmed at one weight (O37 unmasked: TS+J's gap past the margin) - item 3 or 6
  FALSIFIED, attributed to O37.
- **Second:** at the weight 0 the tables de-risk far more (no estate cost) and hold de-risked tiers longer, losing later
  switching's value: item 1 HELD but item 3 FALSIFIED on bridge 4.
- **Third:** TS+J opens apart from TS on S126 and S194 (O41) and item 5 HELD rests on those two: the opening and the later
  switching are not separated there (grade C); bridge 4, if the two open alike there, is the one clean case (its 7 losses in
  7y; the reducer prints each case's count and opening).
- **Fourth:** the time estimate is wrong by a factor of two and the batch runs past 4 hours on a unit: that unit is stopped,
  the run is INCOMPLETE and it is not read.
- **The smoke run:** smoke.sh (locked) does not run diag7aa; the preflight through the launcher (all thirty units, every line
  through the reducer's parse and gate, every trace's name) covers it.
- **Least likely:** the gate fails; the run is then NOT SETTLED.

## Changes after seeing results

None.
