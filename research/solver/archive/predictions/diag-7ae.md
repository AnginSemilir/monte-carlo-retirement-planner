# Prediction: diag-7ae

- **Run:** `research/solver/batch-7ae.sh` - results/diag7ae/case0-2.txt and every node run's trace (audit-s126.mjs diag7ae), read beside 7aa's (results/diag7aa), 7ac's (results/diag7ac) and 7ad's (results/diag7ad); reduced by `reduce-7ae.mjs` into results-7ae.txt
- **Kind:** test
- **Written:** 28 Sept, 20:44 UK, before the run; after 7ad was read (18:43 UK), the deep review after it (19:09 UK), which designed this test, and the maintainer's go-ahead (the ledger's decision row); revised 21:12 UK after the plan-auditor's review (FAIL 21:07 UK, review-log.md: BLOCKING 1, item 2 could not tell the grid from the margin; BLOCKING 2, "which side moved" did not split the realised side), before any run
- **Seeds:** 7002 tuning (8,000 paths, 7aa's and 7ad's own; the node runs use all 8,000 with each path's long-run shift set to world 0's node, the first 4,000 of them 7ad's world-0 node paths). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan; on these cases it draws no path (7aa's gate: "off: no tier above the plan"). No held-out seed is touched. **Disclosed (RULES.md Known limits item 18):** two measurements ran this test's mode, each under "none": a build check in the light lane before this prediction existed (runs.log 28 Sep 20:30 UK, "7ae build check"; S126's job at 4 points, 20 paths, 20 at the node; results in the scratchpad, not the repository), and the preflight in the main lane as this prediction was written (runs.log 28 Sep, the "7ae preflight" line; preflight-7ae.sh, every job at 4 wealth points and 20 paths; results/preflight-7ae.log: PREFLIGHT PARSE PASSED - 15 size refusals and nothing else, the 1e-3 solves 7aa's preflight units', the 1e-3 node runs' first paths 7ad's preflight traces path by path, every decision log agreeing with its trace, the reading run to its outcome line, its lines counted, not printed). Their lines were read only to see that the mode prints them and that the reducer parses, gates and reads them; at 4 points the build check's tables open in the plan's tier at both margins (gap 0, no price) and its decision log showed every node path leaving the plan's tiers in year 1; 4 wealth points are not a registered grid, and no gap, price, node or log line of the preflight is read before 7ae is. After the build check, measureV2's ran line gained " switchMargin <m>" at its end when the option is passed (the 1e-3 ran line unchanged: the gate requires it equal to 7aa's).
- **Unmasking:** none as a fix: margin 0 is a diagnosis here, not a candidate default (no branch below proposes it as one). It removes the suspected error - the per-year switch margin's structure in the tier state (chained holds below the margin, decisions in bands) - that the deep review ranks first for the bad world's under-priced de-risk (O48) and O47's bursts; the baseline behaviour that error drives is the opening held in the plan's tier at 0.001 and its continuation holding where the table's valued continuation leaves. What tells the margin's structure from margin 0's own effect: item 1's registered attribution - each rule's paired change from 1e-3 to 0 on the same node paths (OPEN0 rising: the 0.001 continuation's holds; TS+J falling: margin 0's own switching under the cost, which attributes nothing to the 0.001 tables or continuation) and the price's rise; item 2 reads the forward-against-cell disagreement net of the grid's own (the reverse disagreement and margin 0's). Any fall in survival at margin 0 is reported, never read as the margin's harm or merit (no product arm is run).
- **Plan section:** PLAN.md "7ae"

## Question

At the bad world's node (world 0, z = -sqrt 3), where 7ad found the tables pricing the de-risked opening below the survival TS+J realises over OPEN0 on every unit (bridge 4 0.482 against +1.100, S194 0.849 against +1.125, S126 0.318 against +0.475; pooled 1.648 against 2.700, ratio 0.61; results-7ad-beside.txt section 4), is the per-year switch margin (0.001, in the tier state's backward pass and the forward chooser) the cause? Solved and run at switchMargin 0 (the switch cost kept), is the opening priced as it realises; and at 0.001, does the forward run hold the plan's tiers where the table's own cell leaves them?

## Derivation

- **What 7ad and its deep review found** (results-7ad.txt, grade A; results-7ad-beside.txt section 4, grade C; deep-review-log.md 28 Sep 19:09 UK): the wealth grid and the return points are out (60 wealth points and 15 return points move TS+J's gap -26% to +16%, both ways, while the bad node's price stays below its realised); 5 of 5 node readings sit below the realised point (price/realised 0.44 0.48 0.75 0.69 0.67), pooled at 30x5 z -3.37 with the paths' covariance (without bridge 4 ratio 0.73, z -1.89); on paths OPEN0 de-risks in year 1 the realised roughly equals the price (bridge 4 +0.475 against 0.482, S194 +1.025 against 0.849, S126 +0.400 against 0.318), and on bridge 4 at 30x5 the rest (+0.625, about all of its mispricing 0.618) sits on paths the forward continuation holds two years or more. At margin 0 every table opens de-risked (the gap lines' second tier, all 13).
- **Why the margin can do it** (solve.js l.56-57 SWITCH_MARGIN, l.887 and l.902 the tier state's hold in the backward pass, l.1144 the chooser's; a reading of the code, D; NOT CHECKED by a run): the backward pass stores, at each cell and held layer, the move whose mixture score is best, held back to the layer's own tiers when the best is within 0.001 of staying; the forward chooser applies the same rule at the true (off-grid) state. So near the margin the stored and the forward decisions can differ both ways, and a hold chains: each year's hold is judged against a value that assumes next year's stored move. The table's value of STAY (the opening held) then assumes the continuation the cells store; if the forward continuation holds where the cells leave, STAY is valued above what OPEN0 realises and the de-risk's price (BEST less STAY) falls below the realised - O48's sign. At margin 0 nothing is held back in either pass: the stored and the forward decisions differ only by the grid (the nearest cell against the interpolated state).
- **Against** (the review): bridge 4 at 60x5's year-1 part is still priced 0.67 of its realised; 7x's held-for-life tables, with no margin, also under-priced the de-risk at -sqrt 3 on the reader units by 0.68 and 1.01 points (1 to 2 se; the deep review after 7ad, deep-review-log.md 28 Sep 19:09 UK, its uncommitted script, grade C).
- **Prior tests of the same mechanism** (RULES.md section 9 rule 7): 7v (results-7v.txt, grade A) ran the reader at margin 0 against 0.001 on the product's per-world tables: at margin 0 one policy added nothing material over the reader (item 5 FALSIFIED), and bridge 4 was not harmed at 30 points (READER/1e-3 against the product 2 saved, 0 lost; PLAN.md 7u row); O30 (the second deep review, grade C): at 0.001 the chooser holds the opening tier for decades, 7t's OFF switching its pension tier 0.03 and 0.04 times a path on S126 and bridge 4, the reader 0.33 and 0.45; O47 (7ac's OPEN0 on 8,000 paths, results-7ad-beside.txt section 3): S194's yearly hazard of leaving the plan's tier alternates by year (about 49, 20, 68, 3, 65, 1, 70 per cent in years 1 to 7), consistent with one-year chained holds. None of these priced the opening against its realisation at a node, and none logged the forward decision against the cell's.
- **The ranked causes** (the review): (1) the per-year margin's structure in the tier state; (2) the reader's plan-tier reference (O36) for bridge 4's excess; (3) the unrefined share and gain axes; (4) the three-point quadrature; (5) a tier-state bug. Item 1 tests (1) pooled; item 3 sets bridge 4 apart (cause 2 predicts bridge 4 still low at margin 0 with the others right); item 2 tests (1)'s mechanism; "all three stay under 0.75" points to (3) or (5), then 30x12x12 tables and a layer-transition check.
- **The two ways a ratio can close** (derive-7ae.mjs, the realised-gain factor): at margin 0 the TS+J and OPEN0 runs both change, so the realised gain can move as well as the price. A ratio closing by the price rising says the 0.001 tables under-value the de-risk; by the realised falling through OPEN0 rising, that the 0.001 continuation holds where the table's valued continuation leaves (both cause 1's structure); through TS+J falling, margin 0's own switching, which attributes nothing (the registered attribution, Decision rule; the plan-auditor's MINOR 1 of 21:13 UK, fixed before any run).
- **Amended from the review's wording, before any run:** the review's "forward and cell decisions disagree in alternate years" becomes item 2's one-way share (years 1 to 7, pooled) net of the grid's own disagreement, with the share by year's parity reported, not registered - this narrows the review's chaining signature (the alternation) to a level, and the alternation is read as reported only; its "pooled price over realised 0.85 or more" is item 1 with the realised interval's lower end added (so noise alone cannot read HELD) and a registered attribution by side. Claude's choices, revised after the plan-auditor's review.

## Prediction

1. **At margin 0 the bad world's de-risk is priced as it realises:** over the three units pooled, Σ (world 0's like-for-like survival price of TS+J/M0's opening) / Σ (the survival TS+J/M0 realises over OPEN0/M0 at world 0's node, 8,000 paths each) is at least 0.85, with Σ price at or above the pooled realised 95% interval's lower end.
2. **At 0.001 the forward run holds where the cell leaves, beyond the grid's own disagreement:** on OPEN0's node runs at 0.001, years 1 to 7, pooled over the three units, the forward move holds the plan's tiers and the nearest cell's stored move for that layer leaves them on 10% or more of the path-years holding the plan's tiers, and that one-way share exceeds by 5 points or more both the reverse share (the forward leaves, the cell holds) and the same one-way share on OPEN0/M0 (where it holds 1,000 path-years or more).
3. **Bridge 4 priced right at margin 0:** its world-0 survival price at or above its node's exact 95% interval's lower end.

## Falsified if

Item 1: the pooled ratio below 0.75 AND Σ price below the realised interval's lower end (causes 3 or 5). Item 2: the net
excess below 2 points (the one-way disagreement no more than the grid's own). Item 3: bridge 4's price below its interval's lower end with the
ratio below 0.75 (with item 1 HELD: cause 2, the reader's reference, adds on bridge 4). INCONCLUSIVE is never a negative.

## Fair-test table

Arm A is the 0.001 solve and its runs (7aa's TS+J unit, re-solved on 7ae's code and required identical; OPEN0 and TS+J at
world 0's node, their first 4,000 paths required identical to 7ad's, path by path); arm B the same at switchMargin 0 in both
the backward pass and the chooser (TS+J/M0 and OPEN0/M0), on the same 8,000 node paths. Item 2 reads arm A alone (its log).
The estate weight is a stratum: each unit's own.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | bridge 4 (reader, W0), S194 (off, W0.02), S126 (reader, W0): 7ad's 30x5 units, where the bad node's under-price was found, chosen on purpose from the records, a diagnosis, nothing generalised | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | seed 7002's 8,000 with the long-run shift at world 0's node (the first 4,000 7ad's); the solves on seed 7002's 8,000 as 7aa's | the same paths, paired | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held and the solver runs against itself |
| 17 | The grid: points, shares, gain buckets | 30 wealth points (total30x6x6), 5 return points | the same | SAME |
| 19 | The switch margin and switching cost | 0.001 in the backward pass and the chooser every year (OPEN0: an unbounded margin in year 0, 0.001 after); the cost 0.25% of the slice traded | 0 in the backward pass and the chooser every year (OPEN0: unbounded in year 0, 0 after); the same cost | TESTED - the thing tested |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself, no rival arm |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm in this run |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | 7aa's units (code eb7b84680587) for the 0.001 solves; 7ad's node traces (code 1f057589c0cb) for the first 4,000 paths | 7ae's snapshot, both arms | ACCEPTED - the change since 7ad is solve.js nearestIndex exported (no behaviour change: the decision log reads the cell the solver's own stored-move rule reads), audit-s126.mjs measureV2's switchMargin option (passed to solvePlan only when set; the ran line gains " switchMargin <m>" at its end only then) and its diag7ae mode; the reducer's gate requires every 0.001 table, ran line and year-0 gap to equal 7aa's and the 0.001 node runs' first 4,000 paths' survival to equal 7ad's traces path by path, both rules; the preflight checks the same against 7aa's and 7ad's preflights; the solver's suites pass |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | items 1 and 3: survival simulated (the floor paid every year and the minimum pot at the end), TS+J over OPEN0, against the table's like-for-like survival price in points; item 2: a share of path-years from the forward run's decision log | the same | SAME |
| 30 | The reducer and its version | reduce-7ae.mjs: requireFairLogs over 7aa's, 7ac's, 7ad's and 7ae's stamps, 7aa's, 7ac's and 7ad's own gates, 7ae's gate against 7aa's and 7ad's, every node trace's count, seed, arm, stamp and survival and its decision log against the trace; INCONCLUSIVE (INCOMPLETE) unless all three jobs are done; 84 planted checks, 76 planted faults each caught (mutate-reduce-7ae.py, results-reduce-7ae-mutations.txt); its reading run over the preflight's files to the outcome line | the same | SAME |
| 31 | Paired or not, and the standard error used | item 1 paired on the same node paths, pooled over the three units: Σ realised with a 95% normal interval from the per-path sums over the three units (the units share their paths; declared, not exact - pooledFE's precedent, stats.mjs); item 3 the exact interval (stats.mjs survivalChange) at 0.05; item 2 a share of counts, no interval | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | the node runs are simulated; the tables' prices are the thing measured (a diagnosis of the tables), never read as survival | the same | SAME |
| 33 | For timings: what else the machine was running | the solve and run seconds are printed, not read | the same | N/A - no timing is read |
- **All other rows: SAME**

## Decision rule (registered before launch)

- **Item 1** (single look): Σ price is the sum over the three units of world 0's like-for-like survival price of TS+J/M0's
  opening (BEST against STAY, points); Σ realised the sum of TS+J/M0 over OPEN0/M0 at world 0's node (8,000 paired paths a
  unit, points), its 95% interval Σ realised ± 1.96 se, se from the per-path sums' variance over N (centred), the units'
  shared paths counted (reduce-7ae.mjs pooled). HELD when Σ price / Σ realised is at least 0.85 AND Σ price is at or above
  the interval's lower end; FALSIFIED when the ratio is below 0.75 AND Σ price is below the lower end; else INCONCLUSIVE, and
  INCONCLUSIVE when a unit's TS+J/M0 keeps the held tiers (its node run is then OPEN0's) or Σ realised is not above 0.
- **Item 2:** on OPEN0's node runs at 0.001, the decision log's path-years holding the plan's tiers at the year's start,
  years 1 to 7, pooled over the three units; the share where the forward move holds them and the nearest cell's stored move
  (tsLayers[j].pol[t][nearestIndex], the held layer j) leaves (the one-way share); the reverse share (the forward leaves, the
  cell holds) the same way; the grid's share the one-way share on OPEN0/M0 (no margin: the nearest cell against the
  interpolated state alone), counted only where OPEN0/M0 holds 1,000 path-years or more over the three units in years 1 to
  7. The net excess is the smaller of (one-way less reverse) and (one-way less the grid's share, where counted). HELD when the
  one-way share is 10% or more AND the net excess 5 points or more; FALSIFIED when the net excess is below 2 points; else
  INCONCLUSIVE (reduce-7ae.mjs items()).
- **Item 1's attribution** (registered, read when item 1 is HELD; reported otherwise): each rule's paired change from 1e-3 to
  0 on the same 8,000 node paths (TS+J/M0 against TS+J/1e-3, OPEN0/M0 against OPEN0/1e-3), pooled over the three units with
  its 95% interval as item 1's (reduce-7ae.mjs attribution(); per unit the exact interval at 0.05, reported). "The price
  rose": Σ price rose by at least a quarter of the 1e-3 pooled mispricing (Σ realised less Σ price at 1e-3). "OPEN0 rose":
  its pooled change's lower end above 0. "TS+J fell": its pooled change's upper end below 0. The reading: the price rose -
  the 0.001 tables under-value the de-risk; OPEN0 rose - the 0.001 continuation holds where the tables' valued one leaves;
  TS+J fell with neither - item 1 HELD attributes nothing to the 0.001 tables or continuation (grade C, no margin design
  on it); TS+J fell beside either - that attribution stands, TS+J's fall reported beside.
- **Item 3:** bridge 4's world-0 price at margin 0 against its node's exact interval (survivalChange at 0.05). HELD at or
  above the lower end; FALSIFIED below it with the ratio price / realised below 0.75; else INCONCLUSIVE (and INCONCLUSIVE
  if TS+J/M0 keeps the held tiers).
- **Reported, not items:** every unit's table, gap, price, realised (exact interval) and ratio at both margins; the pooled
  figure at 0.001 on 8,000 paths (7ad's reading on twice the paths); which side moved from 0.001 to 0 (Σ price, Σ
  realised); the decision log by year for both rules and both margins (both disagreements and the margin's own holds -
  whether they alternate by year, the review's wording); O47's first-leave share; the cause-2 signature (at margin 0 S194's
  ratio at least 0.85 with bridge 4's and S126's below 0.65).
- **NOT SETTLED:** any gate fails (the stamps, 7aa's, 7ac's, 7ad's or 7ae's), a 0.001 solve is not 7aa's, or the 0.001 node
  runs' first 4,000 paths are not 7ad's.
- **Declared choices, not derived:** the thresholds 0.85 (the review's) and 0.75 (its "all under 0.75"), 10%, 5 and 2
  points, 1,000 path-years, a quarter of the mispricing, the pooled normal interval, alpha 0.05 for item 3 (a single unit), the three units.

## Decision fed

- **Item 1 HELD** (priced as realised at margin 0), read by its registered attribution:
  - **the price rose and/or OPEN0 rose:** the per-year margin's structure is the cause of the bad world's under-priced
    de-risk (grade B on three units, one seed): the 0.001 tables under-value the de-risk (the price), the 0.001 continuation
    holds where the tables' valued one leaves (OPEN0), or both. To the maintainer, sized: a margin design in the tier state
    (the hold charged consistently in both passes, or margin 0 with the switch cost as the only friction) as the next build,
    tested on the product's households against the product before any default; with TS+J's fall beside, the design must
    also stop it.
  - **TS+J fell alone:** the ratio closed by margin 0's own switching; nothing is attributed to the 0.001 tables or
    continuation (grade C), no margin design is built on it, and the 1e-3 under-price stays open (causes 3 and 5 next, as
    below, beside O48).
  - **no side moved beyond its threshold:** reported; grade C; a sized follow-up.
  - **Item 2 beside it:** HELD - the forward holds where the cell leaves beyond the grid's own disagreement, the chaining the
    review names (grade C for the mechanism: one seed, the nearest cell as the reference); FALSIFIED - the forward and the
    cells disagree no more than the grid makes them, and the margin works through the valued continuation alone; neither
    names a fix on its own.
- **Item 1 FALSIFIED** (still under 0.75 at margin 0): not the margin; causes 3 or 5 next (the review): 30x12x12 tables for
  the share and gain axes and a layer-transition check of the tier state, sized, to the maintainer.
- **Item 1 INCONCLUSIVE:** a partial effect; read by unit and by side as reported; a sized follow-up (a second seed or more
  paths) before any build; nothing rests on it.
- **Item 3** beside item 1: HELD 1 with FALSIFIED 3 (bridge 4 still low) points at the reader's plan-tier reference (O36) on
  top of the margin: to O36's owner. The cause-2 signature (reported) the same.
- **In every branch:** nothing to a default from 7ae; until it is read the 19:09 row's holds stand (no grid refinement for
  this question, no five-world test, no TS+J-against-product claim not at equal openings, no single unit's node interval read
  as priced right, no TS+J to 7u, no TS+J+Q build, no margin, opening or grid default change).

## Provenance

- The design: the deep review after 7ad (deep-review-log.md, 28 Sep 19:09 UK) as amended above; the maintainer's go-ahead
  (PLAN.md, the ledger's decision row).
- The build: solve.js nearestIndex exported; audit-s126.mjs measureV2's switchMargin option and the diag7ae mode (the two
  margins, the moves, the like-for-like prices, the node runs, the forward-against-cell decision log); reduce-7ae.mjs with
  mutate-reduce-7ae.py; derive-7ae.mjs; batch-7ae.sh; preflight-7ae.sh with preflight-parse-7ae.mjs.
- The records: results-7ad.txt, results-7ad-beside.txt, results-derive-7ae.txt; 7aa's, 7ac's and 7ad's runs
  (results/diag7aa, results/diag7ac, results/diag7ad, read only through their reducers' gates).

## Derivation script

- `derive: research/solver/derive-7ae.mjs > research/solver/results-derive-7ae.txt sha256 b5a2e3e7d6f70970`
  (7ad's world-0 node runs at 30x5 through 7aa's, 7ac's and 7ad's gates: each path's TS+J-less-OPEN0 survival on the three
  units together; 8,000 path triples drawn with replacement, the margin-0 realised gain 1, 0.7 or 1.3 times 7ad's, the
  margin-0 prices set by story, each draw read by reduce-7ae.mjs's items()).

## Point and interval

80% intervals, the author's:
- Item 1: the pooled ratio at margin 0 0.80 (0.55 to 1.05); at 0.001 on 8,000 paths 0.62 (0.5 to 0.75).
- Item 2: the one-way share 8% (2% to 25%), the net excess 3 points (-2 to 15).
- Item 3: bridge 4's ratio at margin 0 0.70 (0.4 to 1.0).

## Credence

The author's probability that each item reads as predicted (HELD): 1, 0.40; 2, 0.30 (0.40 as first registered; lowered with the net-of-grid rule, before any run); 3, 0.35. The review ranks the margin
first, and the year-1 split and the margin-0 openings point at it; against it, 7x's held-for-life tables (no margin at all)
under-priced the de-risk at -sqrt 3 too, and item 1 needs the ratio to move from 0.61 to 0.85 with the interval behind it
(power 0.77 at a true 0.9). Item 2 has no prior record: O47's bursts say the forward holds in some years, not that the cell
leaves there, and the nearest cell's read disagrees with the interpolated state both ways at any margin (solve.js l.1084-1087). Item 3 carries bridge 4's excess (ratio 0.44) and the reader's reference. The scorecard stands at 0.222 over
90 items against its 0.20 target (results-scorecard.txt); 7ad scored 0.302.

## Power

From results-derive-7ae.txt (20,000 draws a story; the margin-0 realised gain 1, 0.7 and 1.3 times 7ad's):
- **Item 1:** priced as realised HELD 0.979, 0.990 and 0.944; priced at 0.9 of the realised HELD 0.766, 0.883 and 0.527;
  at 0.8 HELD 0.241, 0.494 and 0.077 (INCONCLUSIVE 0.56, 0.40, 0.62); the 0.001 ratio kept FALSIFIED 0.991, 0.906 and 1.000.
  **The 0.001 price kept with the realised falling to 0.7 times reads HELD 0.803**: a ratio can close by the realised alone -
  the Decision fed reads it by the registered attribution (OPEN0 rising: the margin's structure; TS+J falling alone: nothing attributed).
- **Item 3:** priced as realised HELD 0.909, 0.962 and 0.842; the 0.001 ratio kept FALSIFIED 1.000, 0.983 and 1.000; at 0.8
  mostly split (HELD 0.38, 0.67, 0.19).
- **Item 2:** thousands of path-years a unit (OPEN0 holds the plan's tiers on all 8,000 paths into year 1; on S194 about half
  leave in year 1, O47); no record holds the shares before this run, so its uncertainty is the credence; the 2-, 5- and 10-point thresholds sit many
  binomial se apart (a share near 10% on 10,000 path-years has an se near 0.3 points).
- **Time:** from 7ad's measured 30x5 jobs under four-way load (TS+J solves 761 to 836 s; a node pair on 4,000 paths 589 to
  686 s; results/diag7ad): a job is two solves (about 1,600 s) and two node pairs on 8,000 paths (about 1,300 s each) with
  the decision log's cell reads and, at 0.001, a margin-0 choice on every held path-year (assumed +30%: about 1,700 s each);
  about 85 minutes a job, three at a time about 1.5 hours, plus the smoke run and the launcher's re-run of derive-7ae.mjs
  (about 4 minutes). Each process is stopped at 5 hours. The preflight's solves at 4 points took 70 to 85 s a margin (7aa's preflight TS+J at 4 points 72 s), so margin 0 adds nothing material to a solve's time.

## Budget line

The maintainer approved 7ae on the deep review's recommendation (the ledger's decision row): it decides whether the per-year
margin is why the tables under-price the bad world's de-risk before any margin, opening or grid design is built and before
TS+J goes anywhere near 7u; about 1.5 hours of runs, 4.5 core-hours.

## Pre-mortem

- **Most likely:** a partial move - the ratio at margin 0 between 0.75 and 0.85 (item 1 INCONCLUSIVE), bridge 4 still low,
  the decision log showing holds against the cell in some years: the margin a part, not the whole.
- **Second:** the margin is not the cause - the ratio stays near 0.6 at margin 0 (item 1 FALSIFIED): the share and gain axes
  or a tier-state bug, as the review ranks next.
- **Third:** margin 0 changes the node runs more than the price (TS+J/M0 and OPEN0/M0 may both switch more: no record at margin 0 counts it), so the
  ratio closes by the realised falling: HELD by the realised - read by the registered attribution (OPEN0 rising is the
  margin's structure; TS+J falling alone attributes nothing).
- **Fourth:** a 0.001 solve is not 7aa's, or the first 4,000 node paths not 7ad's: NOT SETTLED, found before anything is read.
- **Fifth:** at margin 0 a unit's TS+J keeps the held tiers (the opening flips back): item 1 and, on bridge 4, item 3 read
  INCONCLUSIVE, reported by unit.
- **The smoke run:** smoke.sh (locked) does not run diag7ae; the preflight through the launcher (all three jobs at 4 points,
  every line through the reducer's parse and gate against 7aa's and 7ad's preflights, every trace's name, stamp, decision
  log and first paths) covers it.

## Changes after seeing results

- 29 Sept, after 7ae was read (the maintainer's "unlock enforcement" of 29 Sep, which let the stamp gate take a declared correction): two typed times corrected from the records - the Written line's revision 21:10 to 21:12 UK (commit 4aef99f) and the Derivation's plan-auditor MINOR 1 of 21:1x to 21:13 UK (review-log.md). Nothing else changed: no prediction, falsifier, decision rule, fair-test row or figure.
