# Prediction: diag-7aw

- **Run:** `research/solver/batch-7aw.sh` - results/diag7aw/case0-49.txt and the traces (audit-7aw.mjs, 50 units: CAND and SHIP on 7e's 25 households at the estate weight 0.02), read by `reduce-7aw.mjs` into results-7aw.txt
- **Kind:** test
- **Written:** 7 Oct, 14:12 UK, before the run. The maintainer's decision of 7 Oct 13:22 UK (PLAN.md's ledger; the session: 'Go with (a), and run the 0.02 leg first'): the full candidate is read against SHIP at 0.02 on the tuning seed before 7u registers. The design is 7aj's (predictions/diag-7aj.md) with the estate weight 0.02; the deep review of 7 Oct 11:42 UK (deep-review-log.md) named the gap: no record of the candidate in the blend world at 0.02, 7af and 7ag being another bundle on the product's tiers.
- **Seeds:** 7002 tuning: 8,000 paths a household, the same in both arms and the same paths 7aj ran; 7u's held-out seed is not touched.
- **Unmasking:** as 7aj's (predictions/diag-7aj.md): the comparison removes several known errors at once - (a) the bridge misread under off (the reader; O32), the per-world tables' misvaluation of a held tier (the tier state with one move for every world; O41), Q's year-1 error (bridgeStep 'exact') and the snapped allowance axis (pclsInterp, ADOPT-PI); (b) the shipping default's behaviours they drive, its own misread tables among them (7aj at 0.01: SHIP's table error -70.52 on S128, results-7aj.txt); (c) no separating arm: 7aw runs CAND and SHIP only, so any harm it finds is NOT SETTLED as any one part's until a decomposition on the harmed households (the candidate's parts added one at a time against SHIP at 0.02) reads it; that decomposition is the registered consequence of a harm, before anything goes to the maintainer.
- **Mechanism:** none: the test attributes nothing - it reads whether the candidate does material harm against the shipping default at the estate weight 0.02, by the registered rule, with no cause named for any outcome.
- **Plan section:** PLAN.md "7aw", "7u", "O121", the whole-score rule (PLAN-HISTORY.md, the 29 Sep 09:08 and 22:12 rows)

## Question

At the product's default estate weight, 0.02, in the blend-median world, does the research candidate (candidate.mjs, as Phase 4 and 7u run it) do material harm against the shipping default on 7e's 25 households - by survival (the exact rule and the guarded unconditional interval, item 1), by the whole score (item 2), or by spending while both arms spend (item 3)?

## Derivation

- **The nearest record** (results-derive-7aw.txt section 1): 7aj ran the same candidate against the same SHIP on the same 25 households, the same blend-median tiers and the same 8,000 paths of seed 7002, at 0.01 (results-7aj.txt: 1 HELD, 2 HELD, 3 HELD). Every household passed both survival intervals (the closest, wealth x2: 0 saved/1 lost, unconditional -0.071 to 0.037 against the 0.25 margin); the whole score's least point was S120's -0.008 (unconditional -0.076 to 0.060); spending's least household S370 at -1.412%.
- **What differs: the weight only**, 0.01 to 0.02. A declared premise from a neighbouring setting (RULES.md section 9, rule 6: grade D until tested; the plan-auditor's MINOR 7 on the 13:22 row): 7aj's per-household counts are carried to 0.02 as SAME, though O121 showed a change of setting moves the per-household gains by more than the derivation then allowed (7aj's mean +2.107 against +1.789 derived, results-derive-7aj.txt, results-7aj.txt). Here the candidate and the world are the same and only the weight moves, but the forecast stays grade D, as the deep review graded 7aj's like carry. What the weight does, from the records: 7ah, the direct test of the weight on candidate-like arms (no material harm between 0.02 and 0.01 on its six), read S360's survival unchanged under READER (45.94 at both) and ORDER (45.96 against 45.99; results-7ah.txt); 7aa's PRODUCT rose from 0 to 0.02 (S360 under off, 28.60 to 34.30) but TS and TS+J rose alike (to 34.21 and 34.25; results-7aa.txt), so 7aa shows no edge for SHIP. The weight's step from 0.01 to 0.02 is expected to move survival little in either arm; SHIP gaining on the five 0.5-margin households is the pre-mortem's second risk, not the forecast.
- **Against O45's principle (a test's power and intervals drawn at one weight do not carry to the other; PLAN.md O45), declared:** no record of the candidate in the blend world at 0.02 exists to draw from - 7aw makes it - so its power and intervals are carried from 0.01 and are a member of the family O38, O45 and O121 (a derivation carrying records from another setting misses its 80% interval; its root-cause step CARRY follows 7aw's launch). The power, the credences and the 80% intervals rest on the carry, and the margin split is a declared choice from 7aj's 0.01 record; the exact tests' error rates do not.
- **The whole score at 0.02:** the derivation takes the survival part plus twice the rest (the estate's term scales with the weight; the cut and raise terms in the rest do not - declared). The rest is at most 0.25 except on share 0.95 (+2.116), S360 (+1.293) and bridge 4+cost (+0.515), all far above harm; where the whole score is near its line (S120, wealth x2, S168) the rest is within 0.03, so the doubling moves the harm side by under 0.03.
- **Not used (the deep review's STOP list):** 7af's and 7ag's records, another bundle on the product's tiers.
- **The panel's breadth (O73):** 13 of the 25 are S126 re-weighted, re-aged or re-scaled; 'no harm on 25' is 12 library plans and 13 variants of one, as 7aj's write-up said.
- **The checks, each failed on a planted fault first:** reduce-7aw.mjs's 52 planted checks (`node research/solver/reduce-7aw.mjs --planted`: "planted (52): all read as they should"; every outcome of the three items reached; EDGES: a tier above in one arm only, a household with no discordant path, every discordant path lost and none saved, a whole-score lower end exactly at minus the margin, the spending mean exactly at -1%, a path with no year both arms spend), among them the gate refusing the estate weight 0.01 on every unit of a household; the preflight's plant (one SHIP unit's interpolated allowance axis switched on in a copy of the logs, which the gate must refuse).

## Prediction

- **Item 1 HELD:** no household reads harm, and every one passes both intervals; the large gains of 7aj (share 0.95, S360, S370, S130, bridge 4+cost, S128) remain, perhaps smaller.
- **Item 2 HELD:** every whole-score lower end above minus the margin.
- **Item 3 HELD:** no household's spending more than 5% lower, the mean not more than 1% lower.

## Falsified if

- **Item 1 FALSIFIED:** any household reads harm by the exact rule (Holm over 25, the point loss at least its margin). INCONCLUSIVE when none does but one fails either interval.
- **Item 2 FALSIFIED:** any household's whole-score upper end below minus its margin. INCONCLUSIVE otherwise when not every lower end is above it.
- **Item 3 FALSIFIED:** any household's upper end below -5%, or the mean's below -1%. INCONCLUSIVE otherwise when not HELD.

## Fair-test table

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen | 7e's 25 (7af's 16 in its order, then 7ag's 9) | the same | SAME - the tuning panel 7aj read at 0.01, chosen by 7e's rule; never the held-out panel |
| 9 | The engine's return, volatility and charge assumptions, and the engine build | the candidate's plan: O60's blend-median tiers (candidatePlan) | the same plan | SAME - the research world since the maintainer's decision of 30 Sep 18:50 UK (O60); both arms solve and run forward on it, so only the solver's settings differ; the gate holds every unit's tier reals to the blend column |
| 12 | The estate preference | 0.02 | 0.02 | SAME - the whole-score rule's first setting, the product's default (the maintainer, 29 Sep 09:08 UK); the gate holds it on every unit and refuses 0.01 (a planted case) |
| 13 | The risk tier chosen, consent to change it, risk above | SHIP: per-world tables, the 'auto' rule | CAND: the tier state with one move for every world, the 'auto' rule | TESTED - part of the candidate; the 'auto' rule's decision is each arm's own, reported |
| 15 | The tax-free lump sum rule | SHIP: the snapped allowance axis | CAND: the interpolated axis (pclsInterp) | TESTED - part of the candidate |
| 17 | The grid: points, shares, gain buckets | SHIP: 30 points, e3 off | CAND: 30 points, e3 on | TESTED in part - e3 is part of the candidate's settings, its exactness under the full candidate E3-CAND's (EXACT on share 0.95 and S130 at 30 points, results-e3cand.txt); the grid itself (total30x6x6) the same, held by the gate |
| 19 | The switch margin and switching cost | SHIP: the stored margin 0.001, no charge | CAND: margin 0, the charge 0.001 in both passes | TESTED - part of the candidate |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | SHIP: no bridge read; the final year exact | CAND: the bridge reader with Q's step (bridgeStep exact); the final year exact | TESTED - part of the candidate |
| 26 | Which rivals, and each one's rule and parameters | none | none | N/A - no rival |
| 27 | How a fixed arm's withdrawal order is picked | none | none | N/A - no fixed arm |
| 31 | Paired or not, and the standard error used | paired by path | the same | SAME - McNemar's exact test and the guarded unconditional interval (item 1), the paired whole-score interval (item 2), the paired relative spending change (item 3) |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Margins, fixed now** (reduce-7aw.mjs MARGIN): 0.5 points on share 0.95, S360, S128, S130 and S370 (SHIP's survival below 94% in 7aj's record, the same world at 0.01: 74.30, 37.17, 72.20, 86.15, 73.21, results-7aj.txt); 0.25 on the other twenty (the next, S124, at 95.92).
- **Item 1 (primary; single look):** per household, CAND against SHIP paired on the same 8,000 paths: the exact one-sided McNemar p for harm, Holm over the 25, stats.mjs outcome() at the margin; AND the guarded unconditional interval (survivalChangeU, guarded) at 95%. A household passes when outcome() reads no material harm and the guarded interval's lower end is above minus the margin. HELD when all 25 pass; FALSIFIED when any reads harm; else INCONCLUSIVE.
- **Item 2 (primary; single look):** per household the whole score of CAND against SHIP (reduce-7aa.mjs wholeLeg, at 0.05, the estate weight 0.02, each household's scale, cap, lambda and floor from its logs). HELD when every lower end is above minus the margin; FALSIFIED when any upper end is below it; else INCONCLUSIVE.
- **Item 3 (primary; single look):** spending while both spend (reduce-7af.mjs spendBoth and spendChange; the panel mean's interval from the per-path mean of the households' relative differences). HELD when every household's lower end is above -5% and the mean's above -1%; FALSIFIED when any household's upper end is below -5% or the mean's below -1%; else INCONCLUSIVE.
- **Reported, not items:** every unit's table, survival, table error, year-0 gap and opening, risk-above decision, years below target, tier changes and estate; the pooled floor (pooledSummed over the 25, 7u's pooled gate, here reported only); spending with a failed path's years counted 0.
- **NOT SETTLED**, if any gate fails: the stamps; a unit missing, repeated or not done; a ran line off the registered settings (points, paths, seed, lambda, the estate weight 0.02, the tiers, the arm's own settings); within a household the two ran lines differing beyond the arm's settings, or the scale or cap differing; a pension death charge; a trace off its log.
- **Declared choices, not derived:** the margins (fixed from 7aj's record as above); the spending lines -5% and -1% (7af's); the single look; no multiplicity adjustment on items 2 and 3 (each household's 95% interval read alone, as 7aj read them): their harm side needs a household's whole interval past the line, which bounds the false-harm rate per household at 2.5% where the true change sits exactly at the line (under DRIFT, item 2 reads FALSIFIED 0.000 over 2,000 draws, results-derive-7aw.txt section 2); item 1's harm side carries Holm over 25.

## Decision table

| outcomes | action | credence |
|---|---|---|
| all three HELD | 7aw closes; the whole-score rule has read the candidate at both settings in the blend world on the tuning seed with no harm, and 7aw leaves 7u's gates | 0.86 |
| any FALSIFIED | a decomposition first (Unmasking (c)): the harmed households get the candidate's parts added one at a time against SHIP at 0.02, registered as its own test; then the harm, with the part it follows, goes to the maintainer before 7u registers | 0.09 |
| an INCONCLUSIVE, none FALSIFIED | the unsettled households are named in 7u's prediction as its pre-mortem's first risks, and 7u's power at 0.02 is derived for them from 7aw's counts before it registers | 0.05 |

- **Waiver:** the chance the action changes is 0.14 (one less 0.86), under a quarter. The test is run anyway by the maintainer's decision of 7 Oct 13:22 UK ('run the 0.02 leg first'), and because its only alternative is reading the candidate at 0.02 in the blend world for the first time on 7u's held-out seed, which a harm found there would spend (a 7u re-run, about 24.9 h, results-sizing.txt), against about 8.2 h here.

## Decision fed

- **All HELD:** 7aw leaves the schedule and 7u's gates; 7u's power at 0.02 is derived from 7aw's per-household counts (the deep review of 11:42 UK, change 1).
- **Any FALSIFIED:** the harm is NOT SETTLED as any one part's (no separating arm); a decomposition on the harmed households is registered and run, then the harm and the part it follows go to the maintainer; 7u does not register until they answer.
- **INCONCLUSIVE (none FALSIFIED):** 7u registers after its power at 0.02 is derived for the unsettled households from 7aw's counts; nothing goes to the maintainer.
- **In every branch:** no product change; the candidate's settings are not changed here.

## Provenance

- **The design:** PLAN.md's 7aw row (the maintainer, 7 Oct 13:22 UK; the deep review of 7 Oct 11:42 UK, change 3); 7aj's design (predictions/diag-7aj.md); the whole-score rule (the maintainer, 29 Sep 09:08 and 22:12 UK); the candidate (candidate.mjs); O60's research world (30 Sep 18:50 UK).
- **The build:** audit-7aw.mjs, reduce-7aw.mjs, batch-7aw.sh, preflight-7aw.sh and derive-7aw.mjs, each 7aj's with the weight 0.02 (e834a6e); the margin set taken from 7aj's record.
- **Seen before registration (declared):** 7aj's results in full (results-7aj.txt, results-compare-7aj.txt); the deep review of 11:42 UK; this test's derivation output (results-derive-7aw.txt, committed in e834a6e before this file - so no judged credences are given: see Credence).

## Derivation script

- `derive: research/solver/derive-7aw.mjs > research/solver/results-derive-7aw.txt sha256 ff1673dbbcf3ad60`
  (7aj's record, the power under three stories through reduce-7aw.mjs's own items(), the derived credences and the decision table's rows)

## Point and interval

- **Item 1:** 2.11 points, the panel's mean survival change CAND less SHIP under SAME (results-derive-7aw.txt section 5: 2.107, median 0.362, least -0.013 on wealth x2); 80% interval 1.6 to 2.3 for the same mean (the author's: 7ah moved S360 by 0.05 points or less between the weights, but a cut to CAND's gains on the five 0.5-margin households, which carry most of the mean, is not ruled out; DRIFT lowers it by 0.1)
- **Item 2:** -0.016, the whole score's least household point under SAME (section 5: the survival part plus twice the rest); 80% interval -0.12 to +0.03 for the same least point (the author's: DRIFT lowers every household's survival part by 0.1; the least point's own sampling spread is a few hundredths)
- **Item 3:** -1.41%, spending's least household (S370, section 5, as at 0.01); 80% interval -2.2% to -0.9% for the same least household (the author's: DRIFT lowers it by 0.5%; at 0.02 SHIP's stronger estate pull may hold its spending back further, moving S370 either way)

## Power

From results-derive-7aw.txt section 2 (2,000 draws a story through reduce-7aw.mjs's own items()): item 1 reads HELD 1.000 under SAME, INCONCLUSIVE 0.533 under DRIFT (a 0.1-point loss on every household, below every margin, pushes the guarded interval's lower end past minus the margin on households with few discordant paths) and FALSIFIED 1.000 under ONE (a 0.5-point loss on wealth x2). Item 2 separates SAME (HELD 0.999) from ONE (FALSIFIED 1.000) but not from DRIFT (HELD 0.954). Item 3 reads HELD under every story (1.000): the stories carry no spending cost large enough to reach its lines, so its HELD is expected, not informative. The stories are declared departures from 7aj's record at 0.01, one setting moved (grade C as a forecast).

## Budget line

From 7aj's measured units on the same code and paths (results-time-7aj.txt): CAND 18.41 and SHIP 14.45 core-hours, 32.86 in all, about 8.2 hours four at once; each unit stopped at 5 hours (the batch's timeout 18000). The weight does not change the grid or the paths, so the units' times carry.

## Credence

- **Base rate, item 1:** 0.82 (NOHARM, results-scorecard.txt KIND BASE RATES: 31 of 37)
- **Base rate, item 2:** 0.82 (NOHARM, as item 1)
- **Base rate, item 3:** 0.82 (NOHARM, as item 1)
- **Item 1:** HELD 0.86, INCONCLUSIVE 0.05, FALSIFIED 0.09 (derived, results-derive-7aw.txt section 3: SAME at the NOHARM base rate 0.82, DRIFT and ONE 0.09 each, a declared even split, through section 2's power)
- **Item 2:** HELD 0.90, INCONCLUSIVE 0.01, FALSIFIED 0.09 (derived, as item 1)
- **Item 3:** HELD 0.98, INCONCLUSIVE 0.01, FALSIFIED 0.01 (derived 1.00, 0.00, 0.00, as item 1, capped at 0.98 as 7aj's was: no story reaches item 3's lines, and a derived certainty is a model's, not the world's)
- **Judged:** none - the derivation's output (results-derive-7aw.txt) was committed in e834a6e before any judgement was written, so a judgement now would be written after seeing it and would tell the decisive check nothing (check-prediction.mjs's judged-before-derived rule). The slip is the author's: the build was committed with the output; recorded for 7aw's close in lessons.md.
- **Kinds:** 1 NOHARM, 2 NOHARM, 3 NOHARM

## Pre-mortem

- **First:** S128, the panel's largest optimistic table error under the candidate (+2.59 at 0.01) and its largest churn (227 saved/148 lost), swings at 0.02: SHIP's estate pull changes which paths it saves, and the guarded interval's lower end falls toward -0.5 - item 1 INCONCLUSIVE on S128 with nothing broken.
- **Second:** on the five 0.5-margin households (share 0.95, S360, S370, S130, S128) SHIP gains at 0.02 more than the candidate (7aa saw PRODUCT, TS and TS+J rise alike from 0 to 0.02; nothing has measured SHIP and CAND apart between 0.01 and 0.02), shrinking CAND's gain; a household where the candidate's part acts weakly (S370, whose bridge-stage and after-access signs net, the deep review's calibration note) loses beyond its margin.
- **Third:** wealth x2, S120 or S168, with almost no discordant paths, read INCONCLUSIVE on item 1 or 2 from a handful of paths lost at 0.02 (one lost path at 0.01 put wealth x2's unconditional lower end at -0.071).
- **Fourth:** the 'auto' rule's second solve changes a ran-line field in one arm beyond tiersAbove at 0.02 where it did not at 0.01: NOT SETTLED on a design point the preflight at 4 points might not reach.

## Changes after seeing results

None.
