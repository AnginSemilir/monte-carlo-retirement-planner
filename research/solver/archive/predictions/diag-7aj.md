# Prediction: diag-7aj

- **Run:** `research/solver/batch-7aj.sh` - results/diag7aj/case0-49.txt and the traces (audit-7aj.mjs, 50 units: CAND and SHIP on 7e's 25 households at the estate weight 0.01), read by `reduce-7aj.mjs` into results-7aj.txt
- **Kind:** test
- **Written:** 6 Oct, before the run (its time is its registering commit's, git log). The design is PLAN.md's 7aj row (the deep review of 29 Sep 21:08 UK: the adopted whole-score rule reads 0.02 and 0.01, and 7af and 7ag ran 0.02 only; its legs CAND and SHIP, the maintainer having kept the order reference out on 4 Oct, the 08:17 row), with the candidate as one settings object (the maintainer, 6 Oct, the 12:08 row) as CAND. The maintainer, 6 Oct, the session: 'ok, carry on with 7aj while it runs'. The judged credences were committed first as drafts/diag-7aj.md, the derivation's output after this file.
- **Seeds:** 7002 tuning: 8,000 paths a household, the same in both arms; 7u's held-out seed is not touched, so the candidate's first reading at 0.01 is not on it (the 7aj row's reason to run before 7u registers).
- **Unmasking:** the comparison removes several known errors at once, as 7af's and 7ag's did: (a) the errors - the bridge misread under off (the reader replaces it; O32), the per-world tables' misvaluation of a held tier (the tier state with one move for every world; O41), Q's year-1 error (bridgeStep 'exact', the 30 Sep 18:50 row) and the snapped allowance axis (pclsInterp, ADOPT-PI); (b) the shipping default's behaviours they drive - under off S126's pension held two tiers down, and SHIP's own table on S360 at 0.9429 against 34.30 simulated (results-7af.txt); the shipping default's own misread tables, which its openings rest on - share 0.90 1.4878, S126 61.3644 and bridge 1 87.9382 against 99.29 to 99.81 simulated (results-7af.txt) - and the blend tiers move them: 7ai raised SHIP's table on S126 by +9.8147 and on bridge 1 by +4.5578 (results-7ai-tables.txt) and moved two of the bundle's openings, bridge 0 and S194, from 2/2 to 0/0 (results-7ai.txt), so SHIP here is not 7af's SHIP; the reducer prints every unit's table, simulation and table error and both arms' openings, to be set beside 7af's and 7ai's in the write-up; (c) no separating arm: 7aj runs CAND and SHIP only (7af's and 7ag's PRODR split the reader from the tier state; nothing here splits the candidate's later parts). So any harm 7aj finds is graded C for attribution, and its registered consequence is a diagnosis before a decision: the harmed households get a decomposition (the candidate's parts added one at a time against SHIP on those households) before anything goes to the maintainer.
- **Mechanism:** none: the test attributes nothing - it reads whether the candidate does material harm against the shipping default at the estate weight 0.01, by the registered rule, with no cause named for any outcome.
- **Plan section:** PLAN.md "7aj", "7u", the whole-score rule (PLAN-HISTORY.md, the 29 Sep 09:08 and 22:12 rows), "O60"

## Question

At the product's lowest reachable estate weight, 0.01, does the research candidate (candidate.mjs, as Phase 4 and 7u run it) do material harm against the shipping default on 7e's 25 households - by survival (the exact rule and the guarded unconditional interval, item 1), by the whole score (item 2), or by spending while both arms spend (item 3)?

## Derivation

- **The nearest records** (results-derive-7aj.txt section 1): 7af and 7ag ran CAND against SHIP on the same 25 households at 0.02, the bundle of 29 Sep (READER/TS+J) as CAND. Every household read no material harm by both survival intervals (the closest, wealth x2: 0 saved/5 lost of 8,000, unconditional -0.147 to -0.007 against the 0.25 margin), every whole-score lower end sat above -0.03 (S122 -0.016, S168 -0.028), and spending's worst household was S370 at -1.40%.
- **What has changed since:** the weight (0.02 to 0.01): on 7ah's six the bundle's own survival moved 0.09 points or less between the two (results-7ah.txt), and 7aa's PRODUCT moved from 0 to 0.02 by -0.09 to +5.70 points (S360 under off, 28.60 to 34.30; results-7aa.txt), in SHIP's favour as the weight rises; the candidate: Q's step, the charge with margin 0, e3, the interpolated allowance axis and O60's tiers, each tested apart (7as, E3c, ADOPT-PI, 7ai) but never together against SHIP on the panel. The stories in results-derive-7aj.txt carry these as declared departures (SAME, DRIFT, ONE), not measurements. SAME rests on 7af's and 7ag's records, run on the product's tiers; 7ai, the only record of either arm on the blend tiers, ran solves and openings, not forward runs, so it cannot carry a story (RULES.md section 9, rule 7: a premise from another world, declared). The derivation halves the whole of the whole score's 'rest' with the weight, though the cut and raise terms in it do not scale with the weight (the deep review of 6 Oct 22:01 UK): below materiality, every lower end at 0.02 above -0.03 against margins of 0.25 to 0.5.
- **The panel's breadth (O73):** 13 of the 25 households are S126 re-weighted, re-aged or re-scaled (the share ladder, the bridge ladder, the two wealth scales and bridge 4+cost). They are read as separate households because each moves the pension's share, the bridge or the wealth, the levers the candidate's parts act on, so each is a distinct test of a part; Holm over 25 is conservative for finding harm. But 'no harm on 25' is not 25 independent plans: it is 12 library plans and 13 variants of one, and the write-up says so.
- **The checks, each failed on a planted fault first:** reduce-7aj.mjs's planted checks (every outcome of the three items reached; EDGES), the preflight's plant (one SHIP unit's interpolated allowance axis switched on in a copy of the logs, which the gate must refuse).

## Prediction

- **Item 1 HELD:** no household reads harm, and every one passes both intervals; most gain (the bundle's gains at 0.02 on share 0.95, S360, S370 and bridge 4+cost are large).
- **Item 2 HELD:** every whole-score lower end above minus the margin.
- **Item 3 HELD:** no household's spending more than 5% lower, the mean not more than 1% lower.

## Falsified if

- **Item 1 FALSIFIED:** any household reads harm by the exact rule (Holm over 25, the point loss at least its margin). INCONCLUSIVE when none does but one fails either interval.
- **Item 2 FALSIFIED:** any household's whole-score upper end below minus its margin. INCONCLUSIVE otherwise when not every lower end is above it.
- **Item 3 FALSIFIED:** any household's upper end below -5%, or the mean's below -1%. INCONCLUSIVE otherwise when not HELD.

## Fair-test table

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen | 7e's 25 (7af's 16 in its order, then 7ag's 9) | the same | SAME - the tuning panel 7af and 7ag read at 0.02, chosen by 7e's rule; never the held-out panel |
| 9 | The engine's return, volatility and charge assumptions, and the engine build | the candidate's plan: O60's blend-median tiers (candidatePlan) | the same plan | SAME - the research world since the maintainer's decision of 30 Sep 18:50 UK (O60: the research switches to the blend medians before 7u, the product's tiers after Phase 4); both arms solve and run forward on it, so only the solver's settings differ; the gate holds every unit's tier reals to results-o60.txt's blend column |
| 12 | The estate preference | 0.01 | 0.01 | SAME - the whole-score rule's second setting (the maintainer, 29 Sep 09:08 UK); the gate holds it on every unit |
| 13 | The risk tier chosen, consent to change it, risk above | SHIP: per-world tables, the 'auto' rule | CAND: the tier state with one move for every world, the 'auto' rule | TESTED - part of the candidate; the 'auto' rule's decision is each arm's own, reported |
| 15 | The tax-free lump sum rule | SHIP: the snapped allowance axis | CAND: the interpolated axis (pclsInterp) | TESTED - part of the candidate (the maintainer, 6 Oct 11:08 row) |
| 17 | The grid: points, shares, gain buckets | SHIP: 30 points, e3 off | CAND: 30 points, e3 on | TESTED in part - e3 is part of the candidate's settings, and its exactness under the full candidate (Q's step, the charge, the interpolated axis) is E3-CAND's: EXACT on share 0.95 and S130 at 30 points (results-e3cand.txt; predictions/measure-e3cand.md; E3c's scope left those settings out); the grid itself (total30x6x6) is the same, held by the gate |
| 19 | The switch margin and switching cost | SHIP: the stored margin 0.001, no charge | CAND: margin 0, the charge 0.001 in both passes | TESTED - part of the candidate (3 Oct 18:51 UK) |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | SHIP: no bridge read; the final year exact | CAND: the bridge reader with Q's step (bridgeStep exact); the final year exact | TESTED - part of the candidate |
| 26 | Which rivals, and each one's rule and parameters | none | none | N/A - no rival |
| 27 | How a fixed arm's withdrawal order is picked | none | none | N/A - no fixed arm |
| 31 | Paired or not, and the standard error used | paired by path | the same | SAME - McNemar's exact test and the guarded unconditional interval (item 1), the paired whole-score interval (item 2), the paired relative spending change (item 3) |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Margins, fixed now** (reduce-7aj.mjs MARGIN): 0.5 points on share 0.95, S360, S128, S130 and S370 (SHIP's survival below 94% in results-7af.txt and results-7ag.txt: 73.33, 34.30, 68.71, 82.57, 70.09); 0.25 on the other twenty (S124, at 94.26 within a point of the 95% line, at the stricter 0.25 as 7ag fixed it).
- **Item 1 (primary; single look):** per household, CAND against SHIP paired on the same 8,000 paths: the exact one-sided McNemar p for harm, Holm over the 25, stats.mjs outcome() at the margin; AND the guarded unconditional interval (survivalChangeU, guarded) at 95%. A household passes when outcome() reads no material harm and the guarded interval's lower end is above minus the margin. HELD when all 25 pass; FALSIFIED when any reads harm; else INCONCLUSIVE.
- **Item 2 (primary; single look):** per household the whole score of CAND against SHIP (reduce-7aa.mjs wholeLeg, at 0.05, the estate weight 0.01, each household's scale, cap, lambda and floor from its logs). HELD when every lower end is above minus the margin; FALSIFIED when any upper end is below it; else INCONCLUSIVE.
- **Item 3 (primary; single look):** spending while both spend (reduce-7af.mjs spendBoth and spendChange; the panel mean's interval from the per-path mean of the households' relative differences). HELD when every household's lower end is above -5% and the mean's above -1%; FALSIFIED when any household's upper end is below -5% or the mean's below -1%; else INCONCLUSIVE.
- **Reported, not items:** every unit's table, survival, year-0 gap and opening, risk-above decision, years below target, tier changes and estate; the pooled floor (pooledSummed over the 25, 7u's pooled gate, here reported only); spending with a failed path's years counted 0.
- **NOT SETTLED**, if any gate fails: the stamps; a unit missing, repeated or not done; a ran line off the registered settings (points, paths, seed, lambda, the estate weight 0.01, the tiers, the arm's own settings); within a household the two ran lines differing beyond the arm's settings, or the scale or cap differing; a pension death charge; a trace off its log.
- **Declared choices, not derived:** the margins (stats.mjs, decided, fixed from the records as above); the spending lines -5% and -1% (7af's); the single look; no multiplicity adjustment on items 2 and 3 (each household's 95% interval read alone, as 7af, 7ag and 7ah read them): their harm side needs a household's whole interval past the line, not a point, which bounds the false-harm rate per household at 2.5% where the true change sits exactly at the line and far below it where it sits above (under DRIFT, item 2 reads FALSIFIED 0.000 over 2,000 draws, results-derive-7aj.txt section 2); item 1's harm side carries Holm over 25.

## Decision table

| outcomes | action | credence |
|---|---|---|
| all three HELD | 7aj closes; the whole-score rule's second setting is read on the tuning seed with no harm, and 7u registers with the candidate at both weights as designed | 0.82 |
| any FALSIFIED | a diagnosis first (Unmasking (c)): the harmed households get a decomposition, the candidate's parts added one at a time against SHIP at 0.01, registered as its own test; then the harm, with the part it follows, goes to the maintainer before 7u registers | 0.10 |
| an INCONCLUSIVE, none FALSIFIED | the unsettled households are named in 7u's prediction as its pre-mortem's first risks, and 7u's power at 0.01 is re-derived for them before it registers | 0.08 |

- **Waiver:** the chance the action changes is 0.18 (one less 0.82), under a quarter. The test is run anyway because it is the deep review's named gap before 7u (29 Sep 21:08 UK) and its only alternative is reading the candidate at 0.01 for the first time on 7u's held-out seed, which a harm found there would spend (a 7u re-run, about 24.9 h, results-sizing.txt); the derived 0.10 for a harm is the price of that seed, against about 5.7 h here.

## Decision fed

- **All HELD:** 7aj leaves the schedule and 7u's gates; the whole-score rule has read the candidate at both settings on the tuning seed, no harm on the 25.
- **Any FALSIFIED:** the harm is graded C for attribution (no separating arm); a decomposition on the harmed households (the candidate's parts one at a time against SHIP at 0.01) is registered and run, then the harm and the part it follows go to the maintainer; 7u does not register until they answer.
- **INCONCLUSIVE (none FALSIFIED):** 7u registers after its power at 0.01 is re-derived for the unsettled households; nothing goes to the maintainer.
- **In every branch:** no product change; the candidate's settings are not changed here.

## Provenance

- **The design:** PLAN.md's 7aj row (the deep review of 29 Sep 21:08 UK; its legs set by the maintainer's answer of 4 Oct, the 08:17 row); the whole-score rule (the maintainer, 29 Sep 09:08 and 22:12 UK); the candidate (candidate.mjs, the 6 Oct 12:08 row); O60's research world (30 Sep 18:50 UK).
- **The build:** audit-7aj.mjs (a separate script: the households' builders copied from audit-s126.mjs diag7af and diag7ag, 7aa's line format), reduce-7aj.mjs (the gate, the three items, the planted checks with EDGES and every item's outcomes reached), derive-7aj.mjs, batch-7aj.sh, preflight-7aj.sh.
- **Seen before registration (declared):** 7af's, 7ag's, 7ah's and 7aa's results; E2X's first three households' times (their solve times set the budget line).

## Derivation script

- `derive: research/solver/derive-7aj.mjs > research/solver/results-derive-7aj.txt sha256 3d7812133f607450`
  (the records, the power under three stories through reduce-7aj.mjs's own items(), the derived credences and the decision table's rows; run after the judged credences were committed in drafts/diag-7aj.md)

## Point and interval

- **Item 1:** 1.79 points, the panel's mean survival change CAND less SHIP under SAME (results-derive-7aj.txt section 5; median +0.16, least -0.06 on wealth x2); 80% interval 1.6 to 1.9 for the same mean (the author's: DRIFT lowers it by 0.1, ONE by 0.02, and the sampling spread of a mean over 25 households of 8,000 paths is a few hundredths)
- **Item 2:** 0.003, the whole score's least household point under SAME (section 5: the survival part plus half the rest at 0.02); 80% interval -0.10 to +0.05 for the same least point (the author's: DRIFT lowers every household's survival part by 0.1, and the least point's own sampling spread is a few hundredths; ONE, which would put it near -0.4 on wealth x2, lies outside at its 0.095)
- **Item 3:** -1.40%, spending's least household (S370, section 5, as at 0.02); 80% interval -2.0% to -1.0% for the same least household (the author's: DRIFT lowers it by 0.5%; at 0.01 SHIP's weaker estate pull may move S370 either way)

## Credence

- **Base rate, item 1:** 0.81 (NOHARM, results-scorecard.txt KIND BASE RATES: 28 of 34)
- **Base rate, item 2:** 0.81 (NOHARM, as item 1)
- **Base rate, item 3:** 0.81 (NOHARM, as item 1)
- **Item 1:** HELD 0.82, INCONCLUSIVE 0.08, FALSIFIED 0.10 (derived, results-derive-7aj.txt section 3: SAME at the NOHARM base rate 0.81, DRIFT and ONE 0.095 each, a declared even split, through section 2's power)
- **Item 2:** HELD 0.90, INCONCLUSIVE 0.02, FALSIFIED 0.08 (derived, as item 1)
- **Item 3:** HELD 0.98, INCONCLUSIVE 0.01, FALSIFIED 0.01 (derived 1.00, 0.00, 0.00, as item 1, capped at 0.98: no story reaches item 3's lines (section 2), and a derived certainty is a model's, not the world's (the deep review of 6 Oct 22:01 UK). Item 3's HELD is not cited as evidence of no spending harm: one 0.01 step of the estate weight moves an arm's spending by 0.02% to 1.0%, and S370 would need 3.6 more points, or the panel mean 1.15, to reach its lines)
- **Judged, item 1:** HELD 0.75, INCONCLUSIVE 0.18, FALSIFIED 0.07 (survival at the estate weight 0.01, the candidate against the shipping default on 7e's 25, the exact rule with Holm and the guarded unconditional interval: at 0.02 the bundle passed both on all 25 (results-7af.txt, results-7ag.txt; the closest, wealth x2's 0 saved/5 lost, unconditional -0.147 against the 0.25 margin); between 0.02 and 0.01 the bundle's own survival moved 0.09 points or less on 7ah's six (results-7ah.txt); the candidate adds Q's step, the charge, e3, the interpolated allowance axis and the blend tiers since 7af, each tested apart but never together on the panel, so a household near the line (wealth x2, S124, S128) may read inconclusive, and a part's harm somewhere is possible)
- **Judged, item 2:** HELD 0.82, INCONCLUSIVE 0.13, FALSIFIED 0.05 (the whole score at 0.01: at 0.02 every household's lower end sat above -0.03 (S122 -0.016, S168 -0.028); at 0.01 the estate's part weighs half, so the rest's gain shrinks toward the survival part, which item 1 expects at no harm)
- **Judged, item 3:** HELD 0.85, INCONCLUSIVE 0.10, FALSIFIED 0.05 (spending while both spend: at 0.02 the worst household was S370 at -1.40% and the mean was positive; the 5% line is far, the 1% mean line further)
- **Kinds:** 1 NOHARM, 2 NOHARM, 3 NOHARM

## Power

From results-derive-7aj.txt section 2 (2,000 draws a story through reduce-7aj.mjs's own items()): item 1 reads HELD 0.995 under SAME, INCONCLUSIVE 0.778 under DRIFT (a 0.1-point loss on every household, below every margin, pushes the guarded interval's lower end past minus the margin on the households with few discordant paths) and FALSIFIED 1.000 under ONE (a 0.5-point loss on wealth x2). Item 2 separates SAME (HELD 1.000) from ONE (FALSIFIED 0.862) but not from DRIFT (HELD 0.969). Item 3 reads HELD under every story (1.000): the stories carry no spending cost large enough to reach its lines, so item 3 has no power against them - it guards against a spending cost none of the records suggest, and its HELD is expected, not informative. The stories are declared departures from the bundle's records at 0.02, not measurements of the candidate at 0.01 (grade D as a forecast).

## Budget line

From the sizing pass (results-sizing.txt, four at once): the candidate's solve 1068 s and forward run 126.8 s per 1,000 paths (about 1,014 s at 8,000), the product's 355 s and 103.3 s per 1,000 (about 826 s); E2X's one-at-a-time CAND solves 996.5 to 1260.4 s agree (results-e2x.txt). Fifty units, four at once: about 22.7 core-hours, about 5.7 hours (the sizing pass's own 7aj figure); each unit stopped at 5 hours. 7af's forward runs (551 and 503 s at 8,000 paths, the bundle) are not the candidate's and are not used.

## Pre-mortem

- **First:** a household near its line (wealth x2 at 0 saved/5 lost at 0.02, or S124 and S128 with many discordant paths both ways) reads INCONCLUSIVE by the guarded interval while the exact rule reads no material harm, and item 1 lands INCONCLUSIVE on a household where nothing changed.
- **Second:** one of the candidate's later parts (Q's step, the charge, the interpolated axis, the blend tiers) costs survival on a household the bundle helped at 0.02, so a household that gained there now loses beyond its margin: item 1 FALSIFIED on a cause this test does not split.
- **Third:** at 0.01 the shipping default's estate pull weakens and it spends more, so the candidate's relative spending falls on the households where SHIP was held back by the estate at 0.02 (S370's -1.40% grows), and item 3 reads INCONCLUSIVE by the mean.
- **Fourth:** the gate refuses a unit on a ran-line field the 'auto' rule's second solve changes in one arm only, beyond tiersAbove (which the within-household comparison leaves out by design, a planted case): NOT SETTLED on a design point the preflight at 4 points might not reach.

## Changes after seeing results

None.
