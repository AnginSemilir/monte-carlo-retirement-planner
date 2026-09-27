# Prediction: diag-7x

- **Run:** `research/solver/batch-7x.sh` - results/diag7x/case0-19.txt and every unit's trace (audit-s126.mjs diag7x); reduced by `reduce-7x.mjs` into results-7x.txt
- **Kind:** test
- **Written:** 27 Sept, 20:37 UK, before the run (new-prediction.mjs's stamp); first registered in 6e8d2a0. REVISED before any launch for the review of 27 Sep 20:49 UK (review-log.md, FAIL: one BLOCKING, three MINOR): under a hold the bridge reader's reference stays at the plan's tiers (solve.js; readerRef 'held' kept only to size that premise), so a held table differs from the free one in its menu alone, and the gate requires it; the opening switch's cost bounded; the run time re-estimated; the derivation script's header corrected. The maintainer, 27 Sep: "agree - do option A, run 7x", on the deep review after 7w (deep-review-log.md, 27 Sep 20:17 UK; PLAN.md 7x)
- **Seen before registration:** no 7x output. The solver option's own test (research/tests/solver-hold.test.mjs, S004 at 10 points, and S126 with a four-year bridge at 6 points) printed S004's held and free tables' opening survival and whether the reader's reference moves S126's tables; neither is a 7x unit's figure and nothing here rests on them. The preflight (a measurement through the launcher, 4 points, 20 paths) passed its parse check; only its verdict line was read. The sizes in the Power section are 7v's traces, read and published at 7v's read (results-7v.txt, results-derive-7x.txt)
- **Seeds:** 7002 tuning (8,000 paths, 7v's; the first 1,000 of them for each world run, the path's long-run shift set to the world's node; the same paths for every unit). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan; on these cases it never draws a path (no tier above within reach, as 7v's gate confirmed; 7x's gate requires the same joint-line decision). The held-out seed reserved to 7u is not used
- **Unmasking:** holding one tier for the whole plan removes a suspected error of the solver's own, FS: the tables are solved as if switching were free (the backward pass holds no tier; fast.js's SWITCH_COST note, solve.js's chooser), so the value of keeping the plan's tier now includes a later de-risk at no cost, and the opening de-risk looks worth little. The baseline behaviour it drives: the free tables' year-0 gaps on S126 (8.0241e-4, reader) and S194 (7.5604e-4, off) sit inside the product's margin, so the chooser keeps the plan's tier, while opening in tier 2 realised 37 saved, 0 lost and 35 saved, 10 lost of 8,000 (results-derive-7x.txt, from 7v). The separating items: five worlds against three (item 2) tell W, the missing deep tail, from FS; share 0.95 (item 3) tells Q, the five-point average at the bridge's last year, which no hold removes; S360 under off (item 4) tells a table that reads the sign of the de-risk from one that cannot (off's flat misread, O33). The bridge reader's reference is held at the plan's tiers in both arms (the review of 27 Sep 20:49 UK, BLOCKING 1: read at the held tier it would remove a second suspected premise, the reference never at the move's own tiers, which the deep review after 7w listed; research/tests/solver-hold.test.mjs G shows that reference moves the read on a four-year bridge), so on every case the two arms differ in the menu alone. The reader's own pessimism (O36) is not removed by either arm; the per-world lines report each held table against its own world run
- **Plan section:** PLAN.md "7x"

## Question

The deep review after 7w (deep-review-log.md, 27 Sep 20:17 UK) found one signature across both register families: on every
case measured, the free tables' year-0 gap for de-risking is 5 to 100 times smaller than what de-risking realises, S194
included, which has no bridge. It ranked the causes FS (free-switching tables under a forward hold) above Q, W (three worlds
missing the deep tail), C and N, and proposed one test to separate FS from W.

**Is the de-risk's undervaluing free switching (FS) or the three worlds (W)?** Held-for-life tables have no future
switching to credit, so under FS their difference between the plan's tier and the de-risked tier matches what holding each
realises; under W they undervalue it still, the rest sits below -sqrt 3, and five worlds recover part of it.

**At the product's settings but for lambda**, as 7v and 7w: solvePlan's own entry, 30 points, 5 return points, the 'auto'
risk-above rule, lambda held at 0.0223606797749979, the final year exact; the tier held by the new research option
`holdTier` (solve.js; research/tests/solver-hold.test.mjs). **A within-sample diagnosis on 7v's paths**, grade C.

## Derivation

What the code and the records say before any run:
- **What a held table values.** With `holdTier`, every move on the menu carries one tier pair, so the backward pass has no
  tier choice at any year: the table at the opening state values holding that pair for life, with every withdrawal move and
  spend level still chosen. Free switching can only add value to a table (research/tests/solver-hold.test.mjs D: the free
  table's opening score is at least each held table's in every world, shown failing when swapped). The forward run of a held
  table switches once at year 0 (from the plan's tier, paying the 0.25% switching cost on the slice moved, which the table
  does not charge) and never again (the test's C). That cost (0.25% of the slice moved; the equity share moved, about 0.4
  of the pension and ISA, so about 0.1% of them, once) lowers dS and so raises R, towards FS. A bound on S126 (grade C):
  survival fell from 99.8 at its wealth to 95.7 at half of it under off at 16 points (results-7s.txt; results-7e.txt, wealth
  x0.5), about 0.08 points a 1% cut if linear, so about 0.008 points for 0.1% - under 2% of S126's dS (0.4625). Not sized on
  the other cases (NOT CHECKED); share 0.95's year-1 step may be more sensitive.
- **What each cause predicts.** FS: the free tables undervalue the de-risk because keeping the plan's tier is credited with a
  free later de-risk; held tables lose that credit, so dT (2/2 less 0/0, the tables) matches dS (the same, realised on the
  same paths) within 1.5 times, and five worlds change dT little. W: the held tables still see only part of dS, because the
  paths below -sqrt 3 fail where no world of the table lives (O34); dT/dS stays below 0.5 and rises by 1.5 times or more
  with five worlds (whose lowest node is -2.857). Q (share 0.95): the five-point average cannot see the year-1 step whatever
  tier is held (7w), so dT/dS stays small there under either.
- **The prior tests of the same mechanisms** (RULES.md section 9 rule 7), each with its verdict:
  - **Phase 6's margin tests** (results-p6-tiers-margin.txt; cited in predictions/diag-7v.md): the switching cost and
    margin cut churn by two thirds at the same edge; "above 0.001 the margin blocks the first de-risking step, not the
    flips". They measured the forward hold, never a held table.
  - **The M15 diagnostic** (PLAN.md O30, C5): tier families sit within a fraction of the margin in the free tables - the
    free-switching premise's visible symptom, not a test of it.
  - **7h** (results-quadref.txt): five worlds against three with the tier above on S194 moved survival -0.03 +/- 0.06
    (within two se) and S330 +0.27 +/- 0.12 (beyond). Against W as a large effect on S194.
  - **7t item 4** (results-7t.txt): five worlds did not cure the reader's harm on S126 or bridge 4 (READER5 against READER,
    no material gain on both; FALSIFIED). Against W as the reader's harm; it read the forward run, not the tables' value.
  - **7t item 5L** (results-7t.txt): five worlds with the one-pot learner cured it on both (HELD) - the learner, not the
    worlds, did the work (7t item 4).
  - No earlier test solved a held-for-life table: that is what 7x adds.
- **The sizes** (derive-7x.mjs, results-derive-7x.txt, grade C): opening in tier 2 against the plan's tier on 7v's 8,000
  paths - S126 37 saved and 0 lost (dS 0.4625), S194 35 and 10 (0.3125), share 0.95 199 and 0 (2.4875), S360 9 and 497
  (-6.1000). The margins (marginFor): 0.25, 0.25, 0.5 and 0.5.

## Prediction

Twenty units: S126 and bridge 4 with the reader, share 0.95 with the reader, S194 and S360 with the bridge read off, each
solved holding 0/0 and holding 2/2 for the whole plan, in three worlds and in five, and run forward on the same 8,000 paths
of seed 7002 (and on 1,000 a world). dT is the held tables' difference at the opening state (2/2 less 0/0, the mixture's
year-0 survival, points); dS the realised one on the same paths (paired); R = dT / dS. Items (reduce-7x.mjs items()):
1. **FS:** on S126 (reader) and S194 (off), in three worlds, the realised gain is material and R lies within [1/1.5, 1.5] on
   both (HELD). FALSIFIED: the gain material and R below 0.5 on both.
2. **W:** on the same two cases, dT in five worlds is at least 1.5 times dT in three, on both. FALSIFIED: at most 1.2 times
   on both - the prediction (7t item 4, 7h).
3. **The Q control:** on share 0.95 (reader), in three worlds, the realised gain is material and R is below 0.5 (HELD).
   FALSIFIED: R within [1/1.5, 1.5].
4. **The sign control:** on S360 (off), in three worlds, dT has dS's sign, each at least 0.1 points and dS material (HELD).
   FALSIFIED: the opposite sign on the same terms. The prediction: INCONCLUSIVE - off's table reads S360 near zero at any tier
   (O33: 0.8 against 34.4 in 7i), so dT is expected under 0.1 points.

Reported, not items: every unit's opening table survival and its aggregate survival; each world's table against its own
world run; survival on the paths whose long-run shift lies below -sqrt 3; pension years below the plan's tier and tier
changes a path; bridge 4's quantities (its free gap already sits above the product's margin, 7v); each case's dT, dS and R
in both world counts.

## Falsified if

FS is FALSIFIED when, on S126 and S194 in three worlds, the held tables still see less than half the realised gain (item 1):
the undervaluing does not come from crediting free later switching. W is FALSIFIED when five worlds raise dT by at most 1.2
times on both (item 2). Item 3 FALSIFIED says the held tables see the whole of share 0.95's gain, so Q (7w) was not what hid
it - 7w's read is then re-opened. Item 4 FALSIFIED says the held tables read the de-risk's sign wrongly on S360. INCONCLUSIVE
is never a negative: the suspect stays open.

## Fair-test table

Arm A and arm B as the batch script sets them: for items 1, 3 and 4, the same case and world count held at 0/0 (A) and at
2/2 (B); for item 2, the same case and held pairs in three worlds (A) and in five (B).

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | S126, bridge 4 and share 0.95 with the reader (the reader's harm, its control, Q's case), S194 and S360 with the bridge read off (a no-bridge case with the same signature, and the sign control): chosen on purpose by the deep review from 7v and 7w; a diagnosis of those cases, nothing generalised | the same cases | SAME |
| 2 | Changes the test makes to a household's inputs | bridge 4 and share 0.95 are 7c's variants of S126 (audit-s126.mjs F1_VARIANTS) | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | 8,000 paths of seed 7002 (7v's), and the first 1,000 of them a world with the shift set to the world's node | the same paths, paired, for every unit | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held and the solver runs against itself |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | three worlds (items 1, 3, 4; item 2's arm A) | five worlds (item 2's arm B) | TESTED in item 2 alone (W's variable); SAME within items 1, 3 and 4 |
| 8 | How each year's return is averaged (quadrature points) | 5 (the product's) | 5 | SAME |
| 13 | The risk tier chosen, consent to change it, risk above | one tier pair held for the whole plan: the plan's (0/0) in items 1, 3 and 4; the 'auto' rule (no tier above within reach: the joint line's "off: no tier above the plan", required by the gate) | the freed opening's pair (2/2: pension and ISA two tiers down) held for the whole plan | TESTED - the held tier, in items 1, 3 and 4 (the free menu is not run: 7v and 7w are its records); SAME between item 2's arms |
| 17 | The grid: points, shares, gain buckets | 30 points (the product's), the default shares and gain buckets | the same | SAME |
| 19 | The switch margin and switching cost | the product's 0.001 and switching cost: with one tier on the menu the margin never acts; the cost is charged once, at the opening switch to 2/2 | the same | SAME (the margin inert under a hold; the one opening switch is arm B's own, as the freed opening's was in 7w) |
| 20 | The dislike of cuts: lambda (held or landed) and the trim curve's exponent (together, c) | 7t's, 7v's and 7w's 0.0223606797749979, exponent 2 | the same | SAME |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | bridgeRead 'reader' on S126, bridge 4 and share 0.95, off on S194 and S360; the final year exact; the reader's reference at the plan's tiers (solve.js holdTier's default, the hold line's `ref plan`, required by the gate) | the same: the reference at the plan's tiers under the 2/2 hold too | SAME within every read (each item compares a case with itself; the reference does not move with the held tier) |
| 25 | How it lands: bisection steps, level search | no landing; the full level scan | the same | SAME |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself, no rival arm |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm in this run |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | one process a unit, every unit from the same snapshot and stamp (requireFairLogs) | the same | SAME |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | the table's opening survival (dT, the thing FS and W are about, read as the table's reading) against simulated survival (dS: the floor paid every year and the minimum pot at the end) | the same | SAME |
| 30 | The reducer and its version | reduce-7x.mjs: requireFairLogs over the logs' stamps, then its own gate on every unit's case, solve, ran, joint, hold, world, run and done lines, and every trace's count, seed, arm, stamp and survival (within 0.00005); INCOMPLETE unless all twenty units are done; 28 planted checks, 30 planted faults each caught (mutate-reduce-7x.py, results-reduce-7x-mutations.txt) | the same | SAME |
| 31 | Paired or not, and the standard error used | paired on the same paths; the regimen's exact rule (reduce-7v.mjs gainFamily and harmFamily), Holm within each item, the exact 95% interval against the case's margin, the unconditional one beside; the ratios by their registered bounds | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | dS is simulated; dT is the table's reading, read as that (it is what the test is about), never as survival | the same | SAME |
| 33 | For timings: what else the machine was running | the solve and run seconds are printed, not read | the same | N/A - no timing is read: twenty processes share four cores, four at a time |
- **All other rows: SAME**

## Decision rule (registered before launch)

- **The families** (reduce-7v.mjs gainFamily and harmFamily, single look, level 0.05), as 7v and 7w: a gain leg reads **gain**
  when it saves more than it loses and the exact one-sided p for a gain under Holm over the item's legs is below 0.05; a harm
  leg **harm** when it loses more than it saves, its exact p under Holm is below 0.05 and the point loss is at least the
  margin. The margin is the case's: stats.mjs marginFor() of its 0/0-held run's survival in three worlds.
- **The ratios:** item 1 HELD when both legs gain and R lies within [1/1.5, 1.5] on both, FALSIFIED when both gain and R is
  below 0.5 on both, else INCONCLUSIVE; item 2 HELD when dT(5 worlds)/dT(3 worlds) is at least 1.5 on both, FALSIFIED at most
  1.2 on both (undefined where the three-world dT is not positive), else INCONCLUSIVE; item 3 HELD when the leg gains and R is
  below 0.5, FALSIFIED when it gains and R lies within [1/1.5, 1.5]; item 4 HELD when the leg is material (harm or gain),
  |dT| and |dS| are each at least 0.1 points and their signs agree, FALSIFIED on the same terms with opposite signs.
- **NOT SETTLED:** the fair-test gate fails.
- **The registered reading decides; the unconditional one is printed beside it,** marked where they disagree.
- **Declared choices, not derived:** 1.5 and 0.5 (the deep review's), 1.2 (item 2's flat line), 0.1 points (item 4's floor:
  about 8 paths of 8,000); 1,000 paths a world (7v's).

## Decision fed

- **FS HELD (item 1), W FALSIFIED (item 2):** free switching in the tables is the undervaluing's cause on these cases; the
  next build is the held tier in the solved state (PLAN.md's held-tier build: the tier held as part of the state, the
  switching cost priced in the backward pass), registered with its own test on 7e's panel before any default moves; the
  switch margin's role is then re-derived (it stands in for the cost the tables do not price). Q's fix stays behind it
  (7w: share 0.95's gain is recovered by the opening alone).
- **W HELD (item 2), FS FALSIFIED (item 1):** the world quadrature is fixed first (more or deeper worlds), before any change
  to the chooser; the held-tier build waits.
- **Both HELD or both INCONCLUSIVE, or item 1 INCONCLUSIVE:** neither build is proposed on it; the per-world and deep-tail
  lines are read for which part of dS the held tables miss, and a sized follow-up is put to the maintainer.
- **Item 3 HELD:** Q stands apart from FS, as 7w found; **FALSIFIED:** the held tables see share 0.95's gain, so 7w's Q is
  re-opened against FS. **INCONCLUSIVE:** reported beside.
- **Item 4 HELD or INCONCLUSIVE:** off's misread is as O33 says; **FALSIFIED:** the held tables read the de-risk's sign wrongly
  on S360, a new register item.
- Until 7x is read and the maintainer decides: no 7u, no SWITCH_MARGIN change, no held-tier build, no Q fix, the freed
  opening in no default and never under off, the learner not a candidate, seed 7013 unused.

## Provenance

- The option: solve.js `holdTier` (research only; the menu's one tier pair from the household's joint menu; a pair not on it
  refused; with the reader, the bridge read at the held tier) and its test research/tests/solver-hold.test.mjs (18 checks,
  A-G, two planted); research/tests/solver-joint.test.mjs and reader-solve.test.mjs pass on the changed solver.
- The mode: audit-s126.mjs diag7x; measureV2 passes `holdTier` and prints it on the ran line only when set (no other mode's
  ran line changes). The batch batch-7x.sh; the preflight preflight-7x.sh with preflight-parse-7x.mjs.
- 7v's figures and traces: results-7v.txt, results/diag7v. 7w's: results-7w.txt. 7t's: results-7t.txt. 7h's:
  results-quadref.txt. The deep review after 7w: deep-review-log.md, 27 Sep 20:17 UK. The register: O30-O36 (PLAN.md).

## Derivation script

- `derive: research/solver/derive-7x.mjs > research/solver/results-derive-7x.txt sha256 bf98977ea62da8e3`
  (7v's sizes on 7x's own paths through 7v's gate; items 1, 3 and 4 drawn as Poisson counts under each story with a
  background of 0.5 and 5 paths each way, read by the reducer's rules).

## Point and interval

80% intervals, the author's; points of survival:
- Item 1: S126 dT 0.35 (0.1 to 0.6) against dS 0.45 (0.3 to 0.6), R 0.8 (0.2 to 1.4); S194 dT 0.3 (0.05 to 0.6) against dS
  0.4 (0.2 to 0.6), R 0.75 (0.15 to 1.5).
- Item 2: dT(5)/dT(3) 1.05 (0.8 to 1.6) on each.
- Item 3: share 0.95 dT 0.1 (0 to 0.6) against dS 2.4 (2.0 to 2.8), R 0.04 (0 to 0.3).
- Item 4: S360 dT -0.05 (-0.5 to 0.1) against dS -6 (-7 to -4).

## Credence

The author's probability that each item reads as predicted: 1 (HELD), 0.45; 2 (FALSIFIED), 0.55; 3 (HELD), 0.75; 4
(INCONCLUSIVE), 0.55. The cumulative scorecard stands at 0.221 (results-scorecard.txt) and 7w's calls were underconfident
where 7v's were over, so none is given above 0.75. Scored by scorecard.mjs.

## Power

From results-derive-7x.txt (20,000 draws a story; backgrounds of 0.5 and 5 paths each way):
- **Item 1:** under FS with the held tables seeing the whole realised gain, HELD 0.848 and 0.802 (the rest INCONCLUSIVE); a
  fifth low, 0.667 and 0.615; under W (the tables see 0.3 of it), FALSIFIED 0.913 and 0.888; between (0.6), mostly
  INCONCLUSIVE (0.875 and 0.867). S194's size is the weaker leg (35 saved, 10 lost at margin 0, which churns).
- **Item 3:** under Q (the tables see 0.05 of the gain) HELD 1.000; with Q absent FALSIFIED 1.000.
- **Item 4:** the tables losing a point as the run does, HELD 1.000; the tables flat, INCONCLUSIVE 1.000; the tables gaining,
  FALSIFIED 1.000.
- **Item 2** reads tables alone: no path power.
- **What it cannot see:** a ratio between 0.5 and 1/1.5 (item 1 then INCONCLUSIVE); an error the hold shares with the free
  tables, such as the reader's own pessimism (O36): the reference is the same in both arms, but whether O36 moves dT is NOT
  CHECKED (the per-world lines report each held table against its own world run).
- **Time:** not measured for a held solve. From 7v (results-7v.txt): 30-point three-world solves 232 to 380 s with the full
  tier menu (a held menu has a third of the moves), a traced forward run about 63 s a thousand paths; five worlds about 5/3 of
  three (the review of 27 Sep 20:49 UK, MINOR 3: the first estimate left that factor off the five-world units). So a
  three-world unit about 13 to 18 minutes and a five-world unit about 25 to 33, twenty units four at a time: about 95 to 130
  minutes, plus the smoke run and the launcher's re-run of derive-7x.mjs (about 2 minutes).

## Budget line

The undervaluing costs S126 37 and S194 25 net paths of 8,000 at the product's margin (0.46 and 0.31 points; results-
derive-7x.txt), and it decides which build comes next: the held tier in the solved state, or the world quadrature. 7x
removes no error itself.

## Pre-mortem

- **Most likely:** FS holds on S126 and falls short on S194, or both land between 0.5 and 1/1.5: item 1 INCONCLUSIVE, with
  W flat (item 2 FALSIFIED) - the held tables then carry most of the gap, and the per-world lines say where the rest is.
- **Second:** the held tables' level is off (O36's pessimism, or the opening switch's cost the table does not charge) and
  moves dT on one case; the per-world table-against-run lines show it.
- **Third:** S194's realised gain under a hold differs from 7v's margin-0 size (margin 0 churns), shrinking item 1's power.
- **Fourth:** the held solve costs more than assumed and the batch runs past two and a half hours; nothing is read from the time.
- **The smoke run:** smoke.sh (locked) does not run diag7x; the preflight through the launcher (all twenty units, every line
  through the reducer's parse and gate, every trace's name) and the solver option's own test cover it.
- **Least likely:** the gate fails; the run is then NOT SETTLED.

## Changes after seeing results

None.
