# Prediction: confirm-7u

- **Run:** `research/solver/batch-7u.sh` - results/diag7u/case0-219.txt and the traces (audit-7u.mjs, 220 units: CAND and SHIP on panel-7u.mjs's 55 households at the estate weights 0.02 and 0.01), read by `reduce-7u.mjs` into results-7u.txt
- **Kind:** test
- **Written:** 8 Oct, before the run (its time is its registering commit's, git log). The maintainer authorised the wider confirmation (26 Sep 20:10 UK: "a further wider test run that would confirm whether we can take forward anything useful discovered to the default model"; the bundle authorised 29 Sep 07:49 UK) and, on 8 Oct 19:56 UK ('Go ahead', PLAN.md's ledger), released 7u to register now with NS-COND beside or after it (the release is Claude's reading of that answer, open to reversal). Its gates and design lists: items/7u.md.
- **Seeds:** 7013, held out for 7u (RULES.md section 8 item 9): 8,000 paths a unit, the same paths in both arms and at both weights. The tuning seed 7002 ran the preflight only (results/diag7u-preflight, 20 paths at 4 points); nothing before the run touched 7013.
- **Unmasking:** as 7aj's and 7aw's (predictions/diag-7aj.md, diag-7aw.md): the comparison removes several known errors at once - (a) the bridge misread under off (the reader; O32), the per-world tables' misvaluation of a held tier (the tier state with one move for every world; O41), Q's year-1 error (bridgeStep 'exact') and the snapped allowance axis (pclsInterp); (b) the shipping default's behaviours they drive, its own misread tables among them (SHIP's year-0 table error is -70 points or worse on eleven of the 25 in 7aj's record; derive-7u.mjs section 1 names them at each weight); (c) no separating arm: 7u runs CAND and SHIP only, so any harm it finds is NOT SETTLED as any one part's until a decomposition on the harmed households (the candidate's parts added one at a time against SHIP at the harm's weight) reads it; that decomposition is the registered consequence of a harm, before anything goes to the maintainer.
- **Mechanism:** none: the test attributes nothing - it reads whether the candidate does material harm against the shipping default on a held-out seed and a wider panel, at both estate weights, by the registered rule, with no cause named for any outcome.
- **Plan section:** PLAN.md "7u", items/7u.md, the whole-score rule (PLAN-HISTORY.md, the 29 Sep 09:08 and 22:12 rows)

## Question

On the held-out seed 7013 and a panel wider than the tuning panel (7e's 25 and 30 library households chosen by a rule that never looks at the solver), does the research candidate (candidate.mjs, e3pcls on, as Phase 4 runs it) do material harm against the shipping default at the estate weight 0.02 or 0.01 - by survival (items 1 and 5), the whole score (2 and 6), spending while both arms spend (3 and 7), or pooled over the households with no expected gain (4 and 8)?

## Derivation

- **The nearest records** (results-derive-7u.txt section 1): 7aj at 0.01 (results-7aj.txt) and 7aw at 0.02 (results-7aw.txt), the same candidate (e3pcls off) against the same SHIP on 7e's 25, the same blend-median tiers, 8,000 paths of the tuning seed 7002: both read 1, 2 and 3 HELD.
- **The carrying rule** (RULES.md section 9 rule 5; CARRY's read; items/7u.md 8 Oct): each weight takes its own record and nothing crosses a weight. 7u changes the seed, so each record is carried by its own unpaired sampling interval for a new seed, never CARRY's paired band (derive-7u.mjs: Poisson counts at a Jeffreys-gamma rate from the record, which doubles the variance as two independent seeds do; normal draws at sqrt(2) times the record's standard error for the whole score and spending).
- **The broad 30 are a carry across households** (CARRY's question; items/7u.md 8 Oct item 1): no record of them at either weight. Each draw gives each broad household the record of one of the 25's no-gain households at that weight (17 at each), at random. Declared, wide, grade D: the ordinary library households are assumed to look like the 25's ordinary ones; the four long-bridge and four early-bridge broad households are where the candidate acts, and the ONEB story puts a harm on one of them (S364).
- **The gain set** (panel-7u.mjs gainOf; the deep review of 7 Oct 11:42 UK, change 2): named from each weight's own record before 7013 is read - a household whose record change is at least 0.5 points (MARGINS.low). At 0.02: share 0.90, share 0.95, wealth x0.5, S360, S128, S130, S370, bridge 4+cost; at 0.01: share 0.95, bridge 1, wealth x0.5, S360, S128, S130, S370, bridge 4+cost. The floor is over the other 47 at each weight, the broad 30 among them. Declared weakness: households with no discordant path add paths and no losses, so the pooled change is diluted toward 0 (the floors over the 25 alone and the broad 30 alone are reported beside it).
- **e3pcls** (the research default since 7 Oct; items/7u.md 8 Oct item 2): 7aj's and 7aw's CAND ran it off. It is exact at its pin (E3-PCLS-C EXACT; e3pcls-pin.mjs, pin e59c46df851784bd): every table bit for bit the same with it on, so the records' CAND is 7u's CAND solve where the pin holds. The preflight printed the pin at the snapshot (fingerprint e59c46df851784bd over 11 files; pin e59c46df851784bd (8 Oct, 07:28 UK, research/tests/solver-e3pcls.test.mjs blob c75f5d8ac501): MATCHES); solveCandidate refuses e3pcls on a stale pin, so a unit that ran is a unit on a matching pin.
- **CARRY-DIFF** (results-derive-7u.txt section 6; carry-diff.mjs): results-derive-7u.txt section 6, each record's logs against 7u's preflight logs, matched by household and arm at the record's weight: on the 25 every setting is the same but differs grid; differs paths; differs pts; only new e3pcls. Of these the points, the paths and the grid are the preflight's (4 points, 20 paths) and not the run's (30 points, 8000 paths, as the records), and e3pcls is printed only by 7u (exact at its pin, above). The seed reads the same because the preflight ran on the records' tuning seed 7002; the run's seed is 7013, the held-out seed, the one registered difference the diff cannot show. The broad 30 are in the new panel only (a carry across households, above). Nothing else differs.
- **What 7u cannot say** (items/7u.md 8 Oct items 4 to 6): the contrast of 0.01 against 0.02 reads the weight and the switch charge's relative size together (PR11), so no weight decision (PR8) comes from 7u until CHARGE-RATIO reads; a whole score at one weight is never scaled to the other (O123: the candidate re-optimises for the weight); each arm's own change between the weights is printed (reduce-7u.mjs), as half of the nineteen's drift in CARRY was the shipping default's.
- **The checks, each failed on a planted fault first:** reduce-7u.mjs's 81 planted checks (`node research/solver/reduce-7u.mjs --planted`: "planted (81): all read as they should"; every outcome of all eight items reached; EDGES: a unit with no ran line, a ran line with no e3pcls field, a tier above in one arm only, a year holding more paths alive than the year before, SHIP's survival exactly at 95, a household with no discordant path, every discordant path lost and none saved, a household the guard alone decides, a whole-score lower end exactly at minus the margin, the spending mean exactly at -1%, a path with no year both arms spend), among them a plant for each of the five checks 7aj's and 7aw's mutation run found missing (results-reduce-7aj-7aw-mutations.txt); its mutation run 70 of 70 (results-reduce-7u-mutations.txt); the preflight (preflight-7u.sh in the main lane on the tuning seed 7002 (runs.log 09 Oct 01:59 UK; its output results-7u-preflight.txt): A, the e3pcls pin fingerprint e59c46df851784bd over 11 files; pin e59c46df851784bd (8 Oct, 07:28 UK, research/tests/solver-e3pcls.test.mjs blob c75f5d8ac501): MATCHES; B, the gate passed on 220 units at 4 points and 20 paths of the tuning seed 7002 (the stamp check skipped: NOT-LAUNCHED); C, S370-cand-candidate@w0.02.json.gz: IDENTICAL logged and unlogged (sim 70 and 70); S370-ship-product@w0.02.json.gz: IDENTICAL logged and unlogged (sim 65 and 65); D, the gate refused the plant (e3pcls is true, the prediction names false): 1 lines naming it; the gate refused the plant (e3pcls is false, the prediction names true): 1 lines naming it; the gate refused the plant (access lines, not 1): 1 lines naming it).
- **The table against the simulation by stage** (the deep review of 7 Oct 11:42 UK, change 4; items/7u.md 8 Oct item 3): on share 0.95, S360, S370, S130, bridge 4+cost and S128, both arms and weights, the chooser's expected survival for its own move against the realised survival of the paths alive, by year, grouped into the bridge, after access and the last 15 years, each slice's path-years counted; a +5 bias planted in the bridge years moves the bridge slice by 5.00 and the others by 0.00 (the planted set). Reported, deciding nothing.

## Prediction

- **Items 1 and 5 HELD:** no household reads harm at either weight, and every one of the 55 passes both intervals.
- **Items 2 and 6 HELD:** every whole-score lower end above minus its margin at both weights.
- **Items 3 and 7 HELD:** no household's spending more than 5% lower, the panel mean not more than 1% lower, at both weights.
- **Items 4 and 8 HELD:** the pooled floor over the 47 no-gain households above minus 0.1 points at both weights.

## Falsified if

- **Items 1 and 5 FALSIFIED:** any household reads harm by the exact rule (Holm over 55, the point loss at least its margin) at that weight. INCONCLUSIVE when none does but one fails either interval.
- **Items 2 and 6 FALSIFIED:** any household's whole-score upper end below minus its margin. INCONCLUSIVE otherwise when not every lower end is above it.
- **Items 3 and 7 FALSIFIED:** any household's upper end below -5%, or the mean's below -1%. INCONCLUSIVE otherwise when not HELD.
- **Items 4 and 8 FALSIFIED:** the floor's upper end below -0.1 points. INCONCLUSIVE otherwise when its lower end is not above -0.1.

## Fair-test table

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen | 7e's 25 (7af's 16, then 7ag's 9) and the broad 30 (select-7u-broad.mjs: the library's singles less every id an earlier run touched and the FIRE bases, 30 taken evenly; results-7u-broad.txt, BROAD sha256 eb5344ebe6849da1) | the same | SAME - both arms on every household; the broad 30 by a rule that never looks at the solver; never Phase 4's held-out panel (its rule excludes every id under results/). Declared (PLAN.md O129): the selector also read gzipped payloads, so its pool was 48 where its rule meant 98 and the rule as meant would share 12 of the 30 (results-scan-touched.txt); none of the 30 is touched under any scan, the extra exclusions fall at random with respect to the solver, and the panel was frozen before any 7u output |
| 5 | The held-out paths: seed and count, the same paths for every arm | 7013, 8,000 | the same | SAME - paired by path, the same paths at both weights; the held-out seed of RULES.md section 8 item 9 |
| 9 | The engine's return, volatility and charge assumptions, and the engine build | the candidate's plan: O60's blend-median tiers (candidatePlan) | the same plan | SAME - both arms solve and run forward on it; the gate holds every unit's tier reals to the blend column |
| 12 | The estate preference | 0.02 and 0.01, each read on its own | the same | SAME within each comparison - the whole-score rule's two settings (the maintainer, 29 Sep 09:08 UK), each unit's own weight held by the gate; the two weights are never compared as arms (PR11) |
| 13 | The risk tier chosen, consent to change it, risk above | SHIP: per-world tables, the 'auto' rule | CAND: the tier state with one move for every world, the 'auto' rule | TESTED - part of the candidate; the 'auto' rule's decision is each arm's own, reported |
| 15 | The tax-free lump sum rule | SHIP: the snapped allowance axis | CAND: the interpolated axis (pclsInterp) | TESTED - part of the candidate |
| 17 | The grid: points, shares, gain buckets | SHIP: 30 points, e3 and e3pcls off | CAND: 30 points, e3 and e3pcls on | TESTED in part - e3 and e3pcls are part of the candidate's settings, exact under it (E3-CAND, E3-PCLS-C; the pin printed by the preflight); 7aj and 7aw, the records, ran CAND with e3pcls off (EXACT at the pin e59c46df851784bd); the grid itself (total30x6x6) the same, held by the gate |
| 19 | The switch margin and switching cost | SHIP: the stored margin 0.001, no charge | CAND: margin 0, the charge 0.001 in both passes | TESTED - part of the candidate |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | SHIP: no bridge read; the final year exact | CAND: the bridge reader with Q's step (bridgeStep exact); the final year exact | TESTED - part of the candidate |
| 26 | Which rivals, and each one's rule and parameters | none | none | N/A - no rival |
| 27 | How a fixed arm's withdrawal order is picked | none | none | N/A - no fixed arm |
| 31 | Paired or not, and the standard error used | paired by path | the same | SAME - McNemar's exact test and the guarded unconditional interval (items 1 and 5), the paired whole-score interval (2 and 6), the paired relative spending change (3 and 7), the pooled unconditional interval (4 and 8) |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Margins** (stats.mjs marginFor, RULES.md section 8 item 2, pinned by plan-defaults.test.mjs): per household and weight, 0.25 points where SHIP's own survival in the run is 95% or more, else 0.5; the pooled margin 0.1 (MARGINS.pooled).
- **Items 1 and 5 (primary; single look):** per household at the weight, CAND against SHIP paired on the same 8,000 paths: the exact one-sided McNemar p for harm, Holm over the 55, stats.mjs outcome() at the margin; AND the guarded unconditional interval (survivalChangeU, guarded) at 95%. A household passes when outcome() reads no material harm and the guarded interval's lower end is above minus the margin. HELD when all 55 pass; FALSIFIED when any reads harm; else INCONCLUSIVE.
- **Items 2 and 6 (primary; single look):** per household the whole score of CAND against SHIP (reduce-7aa.mjs wholeLeg, at 0.05, the unit's weight, each household's scale, cap, lambda and floor from its logs). HELD when every lower end is above minus the margin; FALSIFIED when any upper end is below it; else INCONCLUSIVE.
- **Items 3 and 7 (primary; single look):** spending while both spend (reduce-7af.mjs spendBoth and spendChange; the panel mean's interval from the per-path mean of the households' relative differences). HELD when every household's lower end is above -5% and the mean's above -1%; FALSIFIED when any household's upper end is below -5% or the mean's below -1%; else INCONCLUSIVE.
- **Items 4 and 8 (primary; single look):** the paired cells summed over the 47 households outside the weight's gain set (stats.mjs pooledSummed), read by its unconditional interval: HELD when its lower end is above -0.1 points; FALSIFIED when its upper end is below -0.1; else INCONCLUSIVE.
- **Reported, not items:** every unit's table, survival, table error, year-0 gap and opening, risk-above decision, years below target, tier changes and estate; SHIP's year-0 table errors of -70 or worse; each arm's own change between the weights; the floors over the 25's no-gain households, the broad 30 and all 55; the table against the simulation by stage on the six; spending with a failed path's years counted 0. Each item's realised point on a REALISED line.
- **NOT SETTLED**, if any gate fails (reduce-7u.mjs's header): the stamps; a unit missing, repeated or not done, or missing its solve, ran, gap, joint or run line; a ran line off the registered settings (points, paths, seed 7013, lambda, the unit's weight, the tiers, the arm's own settings, e3pcls among them) or carrying a readerRef, coverage, holdTier or death tax; within a household and weight the two ran lines differing beyond the arm's settings, or the scale or cap differing; a pension death charge; a world line; the six's stage lines incomplete, or stage lines elsewhere; a trace off its log; a record off its hash.
- **Declared choices, not derived:** the margins (the regimen's, by SHIP's survival in the run); the gain line (0.5 points); the spending lines -5% and -1% (7af's); the single look; no multiplicity adjustment across weights or on items 2, 3, 4, 6, 7 and 8 (each household's or the floor's 95% interval read alone, as 7aj and 7aw read them); item 1's and 5's harm side carries Holm over 55.

## Decision table

| outcomes | action | credence |
|---|---|---|
| all eight HELD | 7u closes; the candidate goes forward to Phase 4 on one held-out pass (grade B, RULES.md section 8 item 8: a default from it needs a second held-out seed or panel, or the maintainer's explicit acceptance of the grade-B risk, put to the maintainer with the result) | 0.57 |
| any FALSIFIED | a decomposition first (Unmasking (c)): the harmed households get the candidate's parts added one at a time against SHIP at the harm's weight, registered as its own test; then the harm, with the part it follows, goes to the maintainer before Phase 4 | 0.12 |
| an INCONCLUSIVE, none FALSIFIED | the unsettled households are named; a follow-up on them alone at 16,000 paths of a fresh held-out seed is registered before Phase 4 reads the candidate as doing no harm there | 0.31 |

- **Waiver:** none needed: the chance the action changes is 0.43 (one less 0.57), above a quarter

## Decision fed

- **All HELD:** 7u closes; the candidate is carried to Phase 4 with the grade-B qualifier, the replication question put to the maintainer; 7q, 8d, 8f, 7an, O67's step and the table fix follow (the 6 Oct 15:45 order), each fix they bring re-entering through its own confirmation on a fresh held-out seed; no weight decision until CHARGE-RATIO reads.
- **Any FALSIFIED:** the harm is NOT SETTLED as any one part's (no separating arm); a decomposition on the harmed households is registered and run, then the harm and the part it follows go to the maintainer; Phase 4 does not read the candidate until they answer.
- **INCONCLUSIVE (none FALSIFIED):** the unsettled households get the follow-up above; nothing goes to the maintainer unless it reads harm.
- **In every branch:** no product change; the candidate's settings are not changed here; a fix NS-COND designs re-enters through its own confirmation on a fresh held-out seed (PLAN.md's 8 Oct 19:56 row). NS-COND read before this registration (PLAN.md's 9 Oct 01:24 row: 1 INCONCLUSIVE, 2 HELD, 3 INCONCLUSIVE): its branch named a conditioned read for S370's cells, which the deep review after NS-COND stops until NS-PROP reads, and none is built, so the bundle 7u reads is the one registered here and the 19:56 row's reopening trigger is not met (items/7u.md, 9 Oct).

## Provenance

- **The design:** PLAN.md's 7u row and items/7u.md: its gates (all met or released: 7ag, P, O36, O52, gate 5 and E2, 7aj, 7aw, CARRY, O55's gate, NSB released by the maintainer's 8 Oct 19:56 decision) and its design lists - the deep review of 7 Oct 11:42 UK (power from each weight's own counts, the pooled floor over the no-gain households, the 0.02 leg read by 7aw, the table by stage, S128, S370, S130, share 0.95, S360 and bridge 4+cost in the pre-mortem), the deep review of 8 Oct 05:58 UK (e3pcls printed and gated per arm, the broad 30 a carry across households, the stage table with its slices and a planted bias, never scaling 0.01 to 0.02, the households above the estate cap and the switch charge's size in the pre-mortem), and the deep review of 8 Oct 09:32 UK (each record by its own unpaired interval; e3pcls on with the pin; a late slice; both directions in the pre-mortem; PR11 in the Decision fed; each arm's own change between weights; a mutation run; the households with SHIP's year-0 table error -70 or worse named).
- **The build:** panel-7u.mjs, audit-7u.mjs, reduce-7u.mjs and mutate-reduce-7u.py (e01efd7); select-7u-broad.mjs and results-7u-broad.txt (53e80b0); preflight-7u.sh and the judgement (f5e779d); derive-7u.mjs (5b1cd81; its budget section's log labels fixed in this registration, before its output was first produced in full); batch-7u.sh (this registration). The pre-work its gates asked for: the mutation runs of reduce-7aj, reduce-7aw and reduce-e3pclsc, carry-diff.mjs, the scorecard's interval index and RULES.md's power rule (49c458d).
- **Seen before registration (declared):** 7aj's and 7aw's results in full; CARRY's (results-carry.txt); NS-COND's (results-nscond.txt), which reads XAS's unit, not the candidate's; the preflight's lines (the gate, the identity check and the plants; its reading printed figures from 20 paths at 4 points of the tuning seed, not read); this test's derivation output (results-derive-7u.txt), and two dry runs of derive-7u.mjs before the preflight finished (sections 1 to 5, the records alone, the same as the registered output's; section 6 refused on the partial logs, and a carry-diff of the first 53 units at 0.02 printed settings only, no figure). The first preflight (runs.log 8 Oct 21:19 UK) was stopped at the background time limit with 174 of 220 units written, unread, and its folder cleared by the second (items/7u.md, 9 Oct).

## Derivation script

- `derive: research/solver/derive-7u.mjs > research/solver/results-derive-7u.txt sha256 0401521dbf39ad9a`
  (the records at each weight, the power under four stories through reduce-7u.mjs's own items(), the derived credences, the decision table's rows, the points and 80% intervals, carry-diff against the preflight's logs, the budget)

## Point and interval

- **Item 1:** 1.035, points, the mean survival change over the 55 at 0.02 under SAME (results-derive-7u.txt section 5); 80% interval 0.999 to 1.075 (the SAME draws' 10th to 90th percentile: each record's own unpaired sampling for a new seed and the broad 30's carry; the derived interval, not the author's)
- **Item 2:** -0.034, the least household whole-score point at 0.02 under SAME (results-derive-7u.txt section 5); 80% interval -0.109 to 0.015 (the SAME draws' 10th to 90th percentile: each record's own unpaired sampling for a new seed and the broad 30's carry; the derived interval, not the author's)
- **Item 3:** -1.524, %, the least household spending change at 0.02 under SAME (results-derive-7u.txt section 5); 80% interval -1.585 to -1.463 (the SAME draws' 10th to 90th percentile: each record's own unpaired sampling for a new seed and the broad 30's carry; the derived interval, not the author's)
- **Item 4:** 0.162, points, the floor's pooled change at 0.02 under SAME (results-derive-7u.txt section 5); 80% interval 0.132 to 0.193 (the SAME draws' 10th to 90th percentile: each record's own unpaired sampling for a new seed and the broad 30's carry; the derived interval, not the author's)
- **Item 5:** 1.054, points, the mean survival change over the 55 at 0.01 under SAME (results-derive-7u.txt section 5); 80% interval 1.018 to 1.092 (the SAME draws' 10th to 90th percentile: each record's own unpaired sampling for a new seed and the broad 30's carry; the derived interval, not the author's)
- **Item 6:** -0.073, the least household whole-score point at 0.01 under SAME (results-derive-7u.txt section 5); 80% interval -0.121 to -0.035 (the SAME draws' 10th to 90th percentile: each record's own unpaired sampling for a new seed and the broad 30's carry; the derived interval, not the author's)
- **Item 7:** -1.413, %, the least household spending change at 0.01 under SAME (results-derive-7u.txt section 5); 80% interval -1.471 to -1.353 (the SAME draws' 10th to 90th percentile: each record's own unpaired sampling for a new seed and the broad 30's carry; the derived interval, not the author's)
- **Item 8:** 0.176, points, the floor's pooled change at 0.01 under SAME (results-derive-7u.txt section 5); 80% interval 0.147 to 0.204 (the SAME draws' 10th to 90th percentile: each record's own unpaired sampling for a new seed and the broad 30's carry; the derived interval, not the author's)

## Power

From results-derive-7u.txt section 2 (2,000 draws a story at each weight through reduce-7u.mjs's own items(); the outcome shares HELD/INCONCLUSIVE/FALSIFIED for items 1 to 8):

```
  SAME   1: 0.837/0.159/0.004  2: 0.894/0.105/0.000  3: 1.000/0.000/0.000  4: 1.000/0.000/0.000  5: 0.970/0.030/0.001  6: 0.930/0.070/0.000  7: 1.000/0.000/0.000  8: 1.000/0.000/0.000
  DRIFT  1: 0.003/0.772/0.225  2: 0.485/0.515/0.000  3: 1.000/0.000/0.000  4: 1.000/0.000/0.000  5: 0.052/0.913/0.035  6: 0.419/0.581/0.001  7: 1.000/0.000/0.000  8: 1.000/0.000/0.000
  ONE    1: 0.000/0.000/1.000  2: 0.000/0.113/0.887  3: 1.000/0.000/0.000  4: 1.000/0.000/0.000  5: 0.000/0.000/1.000  6: 0.000/0.004/0.996  7: 1.000/0.000/0.000  8: 1.000/0.000/0.000
  ONEB   1: 0.079/0.316/0.605  2: 0.356/0.399/0.245  3: 1.000/0.000/0.000  4: 1.000/0.000/0.000  5: 0.097/0.305/0.598  6: 0.334/0.339/0.328  7: 1.000/0.000/0.000  8: 1.000/0.000/0.000
```

SAME is each weight's own record carried to a new seed by its unpaired interval, the broad 30 drawn from the 25's no-gain households (grade D); DRIFT a 0.1-point loss everywhere; ONE a 0.5-point loss on wealth x2; ONEB a 0.5-point loss on the broad S364. Items 3, 4, 7 and 8 read HELD under every story: the stories carry no spending or floor harm large enough to reach their lines, so their HELD is expected, not informative.

## Budget line

From results-derive-7u.txt section 7, each unit's measured solve plus 8,000 paths forward in the records' own logs (7aj's at 0.01, 7aw's at 0.02), a broad unit at its arm's median (assumed, grade D):

- CAND at 0.01: the 25 18.41 core-hours (median unit 0.745); the broad 30 at that median 22.36
- SHIP at 0.01: the 25 14.45 core-hours (median unit 0.537); the broad 30 at that median 16.12
- CAND at 0.02: the 25 17.61 core-hours (median unit 0.706); the broad 30 at that median 21.18
- SHIP at 0.02: the 25 7.71 core-hours (median unit 0.311); the broad 30 at that median 9.33
- in all 127.1 core-hours, about 31.8 h on four cores four units at once (e3pcls on in CAND saves moves, E3-PCLS-C's median 12.4% fewer evaluated; the stage logging adds a move's score per path-year on 24 units: neither counted)

Each unit may run 6 hours (the batch's timeout 21600); the batch is resumable. Revised when the first units land.

## Credence

- **Base rate, item 1:** 0.83 (NOHARM, results-scorecard.txt KIND BASE RATES)
- **Base rate, item 2:** 0.83 (NOHARM)
- **Base rate, item 3:** 0.83 (NOHARM)
- **Base rate, item 4:** 0.83 (NOHARM)
- **Base rate, item 5:** 0.83 (NOHARM)
- **Base rate, item 6:** 0.83 (NOHARM)
- **Base rate, item 7:** 0.83 (NOHARM)
- **Base rate, item 8:** 0.83 (NOHARM)
- **Item 1:** HELD 0.70, INCONCLUSIVE 0.19, FALSIFIED 0.11 (derived, results-derive-7u.txt section 3: SAME at the NOHARM base rate, DRIFT, ONE and ONEB a third each of the rest, through section 2's power)
- **Item 2:** HELD 0.79, INCONCLUSIVE 0.15, FALSIFIED 0.06 (derived, results-derive-7u.txt section 3: SAME at the NOHARM base rate, DRIFT, ONE and ONEB a third each of the rest, through section 2's power)
- **Item 3:** HELD 0.98, INCONCLUSIVE 0.01, FALSIFIED 0.01 (derived 1.00, 0.00, 0.00, results-derive-7u.txt section 3, capped at 0.98 as 7aj's and 7aw's were: no story reaches the item's lines, and a derived certainty is a model's, not the world's)
- **Item 4:** HELD 0.98, INCONCLUSIVE 0.01, FALSIFIED 0.01 (derived 1.00, 0.00, 0.00, results-derive-7u.txt section 3, capped at 0.98 as 7aj's and 7aw's were: no story reaches the item's lines, and a derived certainty is a model's, not the world's)
- **Item 5:** HELD 0.81, INCONCLUSIVE 0.09, FALSIFIED 0.09 (derived, results-derive-7u.txt section 3: SAME at the NOHARM base rate, DRIFT, ONE and ONEB a third each of the rest, through section 2's power)
- **Item 6:** HELD 0.81, INCONCLUSIVE 0.11, FALSIFIED 0.08 (derived, results-derive-7u.txt section 3: SAME at the NOHARM base rate, DRIFT, ONE and ONEB a third each of the rest, through section 2's power)
- **Item 7:** HELD 0.98, INCONCLUSIVE 0.01, FALSIFIED 0.01 (derived 1.00, 0.00, 0.00, results-derive-7u.txt section 3, capped at 0.98 as 7aj's and 7aw's were: no story reaches the item's lines, and a derived certainty is a model's, not the world's)
- **Item 8:** HELD 0.98, INCONCLUSIVE 0.01, FALSIFIED 0.01 (derived 1.00, 0.00, 0.00, results-derive-7u.txt section 3, capped at 0.98 as 7aj's and 7aw's were: no story reaches the item's lines, and a derived certainty is a model's, not the world's)
- **Judged before derived:** the author's judgement was committed in drafts/confirm-7u.md (f5e779d) before derive-7u.mjs was written or run; the lines below are that judgement, verbatim. This file is committed before the derivation's output (results-derive-7u.txt), so the judged-order check reads them in order (the review backlog's row on check-prediction, the route where the output is not yet committed).
- **Judged, item 1:** HELD 0.68, INCONCLUSIVE 0.22, FALSIFIED 0.10
- **Judged, item 2:** HELD 0.70, INCONCLUSIVE 0.20, FALSIFIED 0.10
- **Judged, item 3:** HELD 0.88, INCONCLUSIVE 0.08, FALSIFIED 0.04
- **Judged, item 4:** HELD 0.88, INCONCLUSIVE 0.08, FALSIFIED 0.04
- **Judged, item 5:** HELD 0.68, INCONCLUSIVE 0.22, FALSIFIED 0.10
- **Judged, item 6:** HELD 0.75, INCONCLUSIVE 0.17, FALSIFIED 0.08
- **Judged, item 7:** HELD 0.88, INCONCLUSIVE 0.08, FALSIFIED 0.04
- **Judged, item 8:** HELD 0.88, INCONCLUSIVE 0.08, FALSIFIED 0.04
- **Kinds:** 1 NOHARM, 2 NOHARM, 3 NOHARM, 4 NOHARM, 5 NOHARM, 6 NOHARM, 7 NOHARM, 8 NOHARM

## Pre-mortem

- **First: S128** (the deep review of 7 Oct 11:42 UK), the 25's largest churn (227 saved/148 lost at 0.01, 220/151 at 0.02 in the records) and an optimistic table error under the candidate: a new seed redraws its discordant paths, and its guarded lower end can fall past -0.5 - items 1 or 5 INCONCLUSIVE on S128 with nothing broken.
- **Second: a broad household** (the carry across households, grade D): no record of any of the 30 at either weight; the long-bridge four (S364, S380, S394, S408) and the early-bridge four (S144, S150, S156, S176) are where the candidate acts, unseen. A harm there is ONEB's story.
- **Third: the five 0.5-margin households of the 25** (S370, S130, share 0.95, S360, S128) and bridge 4+cost: their gains carry the panel's mean and could shrink on a new seed; S370's bridge-stage and after-access signs net (the deep review's calibration note).
- **Fourth: both directions at 0.02** (items/7u.md 8 Oct item 4): the de-risk toward the estate cap on households above it (O124: S120 and the others it names; among the broad 30 the wealthy S190, S214, S262 and S394), paid in the whole score's rest; and the late re-risk below it, about 0.025 a household of the candidate's survival gain on low-churn households (O125). Item 2 INCONCLUSIVE on a wealthy broad household is the likeliest form.
- **Fifth: SHIP's misread tables** (section 9 rule 3): on every household where SHIP's year-0 table error is -70 points or worse in the records (derive-7u.mjs section 1), its policy can move with any setting, so the pair's difference there carries SHIP's own instability.
- **Sixth: the bridge years' non-survival reads in both arms (NSL-PROP, PLAN.md PR12; the deep review after NS-COND, deep-review-log.md 9 Oct 02:09 UK):** the candidate's bridgeRead 'reader' and bridgeStep 'exact' leave the bequest and shortfall blends unchanged (grid.js l.385-389, solve.js l.256), so in both arms a bridge year whose next year touches a share-axis dead corner reads the bequest low and the shortfall high, and the backward pass carries that into every earlier bridge year (present by the code, grade A; its size on the candidate NOT CHECKED, grade D). Both arms carry it, so the pair's difference carries it only where the arms' states differ; its direction is to under-value the estate on bridge households, and the estate weight 0.02 doubles the bequest's pull, so the 0.02 leg on bridge 4, S370 and S126 and the long-bridge broad four is where it would show. The stage table's bridge slice (table against simulation) is where it is read; it is not separated from the candidate's own effect here.
- **Near the switch line:** several year-0 gaps sit close to the 0.001 margin in the records (bridge 4+cost, S172, S366, bridge 6); a new seed does not move the tables, but the broad 30's gaps are unseen. The switch charge's fixed size (0.001, PR11) makes the 0.01 leg's charge relatively larger than the 0.02 leg's.
- **The gate:** the 'auto' rule's second solve changes a ran-line field in one arm beyond tiersAbove on a broad household where no record shows it: NOT SETTLED on a design point the preflight at 4 points might not reach; or a broad unit exceeds the batch's 6-hour limit at 30 points (the batch is resumable and re-runs it).

## Changes after seeing results

None.
