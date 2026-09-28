# Prediction: diag-7ad

- **Run:** `research/solver/batch-7ad.sh` - results/diag7ad/case0-6.txt and every node run's trace (audit-s126.mjs diag7ad), read beside 7aa's (results/diag7aa) and 7ac's (results/diag7ac); reduced by `reduce-7ad.mjs` into results-7ad.txt
- **Kind:** test
- **Written:** 28 Sept, 15:44 UK, before the run; after 7ac was read (14:25 UK), the deep review after it (14:47 UK), which designed this test, and the maintainer's go-ahead (15:01 UK)
- **Seeds:** 7002 tuning (8,000 paths, 7aa's and 7ac's own; the node runs use the first 4,000 of them with each path's long-run shift set to the world's node, the construction 7ac's world lines used on the first 1,000). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan; on these cases it draws no path (7aa's gate: "off: no tier above the plan"). No held-out seed is touched. **Disclosed (RULES.md Known limits item 18):** two light-lane measurements ran this test's mode before this prediction existed - runs.log 28 Sep 15:28 UK, "7ad build check - a tiny diag7ad job (4 points, 20 paths, 10 a node; bridge 4 at 15 return points)" (results/diag7ad-try), and the preflight (preflight-7ad.sh, launched with "none: 7ad preflight", every job at 4 wealth points and 20 paths). Their lines were read only to see that the mode prints them and that the reducer parses and gates them; at 4 points the build check's tables open in the plan's tier (gap 0, no price), so nothing registered here can be read from them.
- **Unmasking:** none: 7ad removes no known error and reads no arm as a candidate. It measures the tables' own price of the year-0 opening at three grids and the runs that realise it; a finer grid is a diagnosis here, not a fix (the refined tables are not proposed as a default by any branch below). OPEN0 against TS+J at the node is 7ac's decomposition arm, re-run on more paths at one world at a time.
- **Plan section:** PLAN.md "7ad"

## Question

On bridge 4 (reader, W0) and S194 (off, W0.02), where 7ac found TS+J's tables pricing its year-0 opening 2.5 to 3 times low (the mixture price 0.135 against 0.333 realised, 0.105 against 0.326; results-7ac.txt), is the bad world's price of the opening wrong for numerical reasons? Stage 1 (30 wealth points by 5 return points): at the bad world's node, where the table and the forward run share the model, does the table price the opening (its survival part) below what TS+J realises over OPEN0 on 4,000 paths? Stage 2 (tables first): does refining the wealth grid to 60 points raise TS+J's year-0 gap and close the bad world's mispricing, does the product's gap move with it, and do 15 return points move the gap less?

## Derivation

- **What 7ac found** (results-7ac.txt, grade A; the deep review after 7ac, deep-review-log.md 28 Sep 14:47 UK): TS+J's mixture price of its opening is right on S126 and 2.5 to 3.1 times low on bridge 4 and S194, below the realised intervals' lower ends (0.196 and 0.147), while the aggregate table reads its chosen policy within -0.11 to +0.06 of simulated; OPEN0's lost paths are end-pot near misses, TS+J ending at a median 85k against S194's 80k minimum pot and 33k against bridge 4's 29k.
- **Why a numerical cause is plausible** (results-cliff-grid.txt, a computation from inputs, grade B): the wealth axis's neighbours are 27% (S194) and 31% (S126, bridge 4's class) apart, and in the last one to two years the end-pot cliff is narrower than one grid gap for the low and medium tiers (S194: 1y 0.22 and 0.41 gaps, 2y 0.31 and 0.58). Doubling the points halves the gap. No record measures the gap or the price at another grid on these cases.
- **Why the node isolates it** (the deep review, (3); solve.js l.160-163, l.1313-1325, l.893-902; by construction, NOT CHECKED by a run): at a world node the table and the forward run share the model (flow, growth and return with the table's shift and volatility), and TS+J's joint layers store each world's value of the one world-blind move, so neither learning nor the three-world quadrature can bias the price there: an under-price at the node is within-world numerical error (the wealth grid, the return points, off-grid choices) or a bug.
- **The like-for-like price** (audit-s126.mjs diag7ad): at the true year-0 position, the mixture's BEST move (margin 0) and STAY move (its best keeping the held tiers, OPEN0's); each world's table's score of BEST less its score of STAY, the whole and the survival part apart (scoreMoves' new survival output, solve.js), their weighted sum the mixture's price (the reducer's gate). 7ac's world-0 lines were each world's own best less own stay, the whole score only (0.53 and 0.84 against 1.2 and 1.6 realised on 1,000 paths): suggestive, not like-for-like (the deep review, (3)).
- **The ranked causes** (the deep review, 14:47 UK): (1) the wealth grid's interpolation at the end-pot cliff; (2) the three-world quadrature missing the deep tail; (3) the 5 return points; (4) off-grid choices against the cells' margin decisions; (5) a tier-state bug. Item 1 splits (2), priced right at the node, from the within-world causes (1, 3, 4, 5); items 2 and 3 test (1); item 4 sets (1) against (3); "nothing moves 10%" points to (4) or (5).
- **Amended from the review's wording, before any run:** the review's cause-1 prediction reads "world 0's survival price rises by at least a third of its distance to the node's realised". The 60-point tables change TS+J's policy too, so the realised value at the node may move; item 2 reads the mispricing at each grid on that grid's own node run (the same 4,000 paths): the mispricing at 60x5 at most two thirds of that at 30x5. Where the realised does not move the two readings are the same. The review's stage 2 also lists "the plan's-tier layer's gap by year 0-5 on the bad node"; the schedule's 7ad row (the maintainer's go-ahead) does not, and it is not built: no item reads it.
- **Prior tests of the same mechanism** (RULES.md section 9 rule 7): 7w item 3 (S126's gap fell at 15 return points: cause 3's evidence against), 7x item 2 (five worlds did not move the de-risk's value: cause 2's evidence against), 7h and O22 (the return points), 6e stage 1 (the gain buckets and axis spacing moved nothing by more than 2%: results-p6e-screen.txt, on other households and the gain axis, not the wealth axis at the end-pot cliff).

## Prediction

1. **Stage 1, 30x5, the bad world:** on bridge 4 and S194, TS+J's like-for-like survival price of its opening at world 0 lies below the exact interval of the survival TS+J realises over OPEN0 at world 0's node (4,000 paths, paired).
2. **Stage 2, 60 wealth points:** on both units TS+J's year-0 gap at 60x5 is at least 1.2 times its 30x5 gap (bridge 4 1.3456e-3 to 1.6147e-3 or more; S194 1.0525e-3 to 1.2630e-3 or more) AND world 0's mispricing (the node's realised less the table's survival price, each grid its own) is positive at 30x5 and at most two thirds of it at 60x5.
3. **The product with it:** on both units the product's gap at 60x5 is at least 1.2 times its 30x5 gap (from 7aa's 8.0106e-4 on bridge 4 and 7.5604e-4 on S194 at 30x5; results-7aa-gaps.txt).
4. **15 return points move it less:** on both units TS+J's gap rises less at 30x15 than at 60x5 (each over 30x5).

## Falsified if

Item 1: the price inside or above the interval on both units (priced right at the node: cause 2). Item 2: TS+J's gap rises
less than 10% at 60x5 on both units. Item 3: the product's gap rises less than 10% on both. Item 4: the gap rises more at
30x15 than at 60x5 on both. INCONCLUSIVE is never a negative: the suspect stays open.

## Fair-test table

Item 1: arm A is OPEN0 (TS+J's own 30x5 tables, the year-0 move held in the plan's tier), arm B is TS+J (7aa's TS+J unit,
re-solved on 7ad's code and required identical at 30x5), on the same 4,000 node paths; the table's price beside. Items 2 to
4: arm A is the 30x5 solve (7aa's TS+J or PRODUCT unit), arm B the same solve at 60x5 or 30x15 - the grid is the thing
tested. The estate weight is a stratum: each unit's own.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | bridge 4 (reader, W0) and S194 (off, W0.02): the two units where 7ac found the opening under-priced (results-7ac.txt), chosen on purpose from the records, a diagnosis, nothing generalised; S126 (reader, W0) at 30x5 a control, reported only | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | item 1: the first 4,000 of seed 7002's 8,000 with the long-run shift at the node; the solves: seed 7002's 8,000 as 7aa's | the same paths, paired; at 60x5 and 30x15 the node runs on the same 4,000 | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held and the solver runs against itself |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | three worlds; TS+J the tier state and one move for every world, the product per-world tables; the node runs simulate one world (the shift at its node) | the same | SAME |
| 8 | How each year's return is averaged (quadrature points) | 5 | 5 (item 2, 3 and 1's node runs), 15 (item 4, 30x15) | TESTED at 30x15 (item 4); SAME elsewhere |
| 12 | The estate preference | the estate weight 0 (bridge 4, S126) or 0.02 (S194), linear, capped at the case's cap | the same weight | SAME within every unit |
| 13 | The risk tier chosen, consent to change it, risk above | the product's 'auto' rule ("off: no tier above the plan"); the tier free each year | the same | SAME |
| 17 | The grid: points, shares, gain buckets | 30 wealth points (total30x6x6) | 60 (item 2, 3: total60x6x6); 30 at 30x15 | TESTED at 60x5 (items 2 and 3); SAME elsewhere |
| 19 | The switch margin and switching cost | TS+J 0.001 every year; OPEN0 an unbounded margin in year 0 (the best move keeping the held tiers), 0.001 after; the cost 0.25% of the slice traded | the same at every grid | TESTED in item 1 (the year-0 opening, OPEN0 against TS+J: 7ac's decomposition); SAME across grids |
| 20 | The dislike of cuts: lambda (held or landed) and the trim curve's exponent (together, c) | 0.0223606797749979, exponent 2 | the same | SAME |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | the reader on READER units, off on S194; the final year exact; no block trim; Q's fix off; the reader's reference the plan's | the same | SAME |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself, no rival arm |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm in this run |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | 7aa's units (7aa's snapshot, code eb7b84680587) for the 30x5 references; 7ac's world lines (code 14b43b8dc37d) for the node runs' first 1,000 paths | 7ad's snapshot | ACCEPTED - the change since 7ac is solve.js scoreMoves' optional ninth parameter (each move's survival alone, written only when passed; no caller passes it but diag7ad) and audit-s126.mjs's diag7ad mode and measureV2's points option; the reducer's gate requires every 30x5 table, ran line and year-0 gap to equal 7aa's (TS+J and PRODUCT) and the 30x5 node runs' first 1,000 paths' survival to equal 7ac's world lines, both arms, every world; the preflight checks the same against 7aa's and 7ac's preflights; the solver's suites pass (solver-step 10/10, solver-tierstate 17/17, solver-quadnodes 8/8) |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | item 1: survival simulated (the floor paid every year and the minimum pot at the end) against the table's survival price in points; items 2 to 4: the table's year-0 gap (the margin at which the opening flips) and the mispricing | the same | SAME |
| 30 | The reducer and its version | reduce-7ad.mjs: requireFairLogs over 7aa's, 7ac's and 7ad's stamps, 7aa's and 7ac's own gates, 7ad's gate against both, every node trace's count, seed, arm, stamp and survival; INCONCLUSIVE (INCOMPLETE) unless all seven jobs are done; 62 planted checks, 61 planted faults each caught (mutate-reduce-7ad.py, results-reduce-7ad-mutations.txt) | the same | SAME |
| 31 | Paired or not, and the standard error used | item 1 paired on the same node paths, the exact interval (stats.mjs survivalChange) at 0.025 each (Bonferroni over the two units); items 2 to 4 the tables' own numbers, no sampling error | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | the node runs are simulated; the tables' gap and prices are the thing measured (a diagnosis of the tables), never read as survival | the same | SAME |
| 33 | For timings: what else the machine was running | the solve and run seconds are printed, not read | the same | N/A - no timing is read |
- **All other rows: SAME**

## Decision rule (registered before launch)

- **Item 1** (single look): for each unit, the exact interval (stats.mjs survivalChange, alpha 0.025: Bonferroni over the two
  units) of the survival TS+J realises over OPEN0 at world 0's node, 4,000 paired paths; the table's like-for-like survival
  price at world 0 (points) is "priced low" below the interval's lower end, "priced right" inside it, "priced high" above.
  HELD when priced low on both units; FALSIFIED when not priced low on either (priced right or high on both); else
  INCONCLUSIVE.
- **Item 2:** the gaps and prices are the tables' own numbers, read exactly. The mispricing at a grid is the node's realised
  (the exact interval's point, TS+J over OPEN0, at that grid's node run) less that grid's table price. HELD when on both
  units the 60x5 gap is at least 1.2 times the 30x5 gap AND the 30x5 mispricing is above 0 AND the 60x5 mispricing is at most
  two thirds of it; FALSIFIED when on both units the 60x5 gap is less than 1.1 times the 30x5 gap; else INCONCLUSIVE.
- **Item 3:** the product's gaps: HELD when at least 1.2 times on both; FALSIFIED when less than 1.1 times on both; else
  INCONCLUSIVE.
- **Item 4:** HELD when on both units the 30x15 gap's rise over 30x5 is below the 60x5 gap's; FALSIFIED when above on both;
  else INCONCLUSIVE.
- **Reported, not items:** every job's gap and each world's like-for-like price, whole and survival; every node run (saved
  and lost, the exact interval, the whole score by reduce-7aa.mjs wholeLeg at 0.05) beside its world's price; the S126
  control; whether 60x15 is warranted (both 60 points and 15 return points raise TS+J's gap by 10% or more on both units) -
  60x15 needs its own registration.
- **NOT SETTLED:** any gate fails (the stamps, 7aa's, 7ac's or 7ad's), or a 30x5 solve is not 7aa's.
- **Declared choices, not derived:** the thresholds 20% (HELD) and 10% (FALSIFIED), the third (the deep review's); alpha
  0.025 each for item 1; the mispricing at each grid's own node run (the amendment above); the two units and the control.

## Decision fed

- **Item 1 HELD** (priced low at the node): the under-price is within-world - numerical or a bug - and not the three-world
  quadrature (cause 2 excluded, grade B on two units, one seed). Then:
  - **items 2 and 3 HELD, item 4 HELD** (cause 1): the 30-point wealth grid under-prices the bad world's de-risk at the
    end-pot cliff, for TS+J and the product alike. To the maintainer: a grid fix (more points near the cliff, or a node at
    it: F2's design, f2-design.md) as the next build, re-tested on the product and TS+J before any default; the product's
    own opening may carry over the margin at the finer grid (item 3); 60x15 only if warranted. The pitfall sweep's C1
    (the minimum-pot cliff) is then found and gains this as its evidence.
  - **item 2 HELD, item 4 FALSIFIED** (15 return points move it more): cause 3, the return points: to the maintainer as the
    fix's direction.
  - **items 2 and 3 FALSIFIED** (nothing moves 10%) with item 1 HELD: a bug or structure (causes 4 or 5): a diagnosis of the
    off-grid choices and the tier state's backward pass at the node before any fix, and no grid build.
  - **otherwise**: a sized follow-up (60x15 if warranted) to the maintainer.
- **Item 1 FALSIFIED** (priced right at the node): the tables price the opening right within a world; the under-price is the
  three-world quadrature (cause 2) - five worlds or more nodes as the next test, sized, to the maintainer; items 2 to 4 read
  as the grid's own sensitivity, no grid build on them.
- **Item 1 INCONCLUSIVE:** split by unit as reported; a sized follow-up; nothing rests on it.
- **In every branch:** until 7ad is read no TS+J+Q build, no TS+J to 7u, no margin, opening or grid default change (the 14:47
  row's holds); nothing to a default from 7ad itself.

## Provenance

- The design: the deep review after 7ac (deep-review-log.md, 28 Sep 14:47 UK) as amended above; the maintainer's go-ahead
  (PLAN.md, the 15:01 row).
- The build: solve.js scoreMoves' optional survival output; audit-s126.mjs diag7ad (7aa's TS+J and PRODUCT units at a named
  grid, the moves, the like-for-like prices, the node runs); reduce-7ad.mjs with mutate-reduce-7ad.py; derive-7ad.mjs;
  batch-7ad.sh; preflight-7ad.sh with preflight-parse-7ad.mjs.
- The records: results-7ac.txt, results-7aa-gaps.txt, results-cliff-grid.txt, results-derive-7ad.txt; 7aa's and 7ac's runs
  (results/diag7aa, results/diag7ac, read only through their reducers' gates).

## Derivation script

- `derive: research/solver/derive-7ad.mjs > research/solver/results-derive-7ad.txt sha256 2d4ec57f399797a7`
  (7ac's world-0 lines through 7aa's and 7ac's gates: the first 1,000 paths' survival, TS+J and OPEN0, and the whole-score
  price; item 1 drawn as the first 1,000's net plus Poisson counts over the other 3,000 at a rate drawn from, or held at, the
  first 1,000's, with a background of 0.5, 5 and 15 paths each way, read by reduce-7ad.mjs's rule; item 2's mispricing half
  drawn with the 60x5 node run k = 10, 30 or 60 paths apart from the 30x5 one).

## Point and interval

80% intervals, the author's:
- Item 1 (world 0, 30x5): the node's realised TS+J over OPEN0, bridge 4 +1.2 points (+0.8 to +1.6), S194 +1.6 (+1.1 to
  +2.1); the survival price bridge 4 0.5 (0.25 to 1.0), S194 0.8 (0.4 to 1.3).
- Item 2: TS+J's gap at 60x5 over 30x5, bridge 4 x1.25 (x0.95 to x1.7), S194 x1.2 (x0.95 to x1.6).
- Item 3: the product's gap, x1.2 (x0.95 to x1.6) on both.
- Item 4: the 30x15 gap over 30x5, x1.05 (x0.9 to x1.25) on both.

## Credence

The author's probability that each item reads as predicted (HELD): 1, 0.65; 2, 0.40; 3, 0.45; 4, 0.55. The deep review ranks
the wealth grid first; against it, the grid has never been refined on these households and a doubling may move a
near-cliff price less than needed, and item 2 needs both halves. The scorecard stands at 0.219 over 86 items against its 0.20
target (results-scorecard-7ac.txt); 7ac scored 0.261.

## Power

From results-derive-7ad.txt (20,000 draws a story; backgrounds 0.5, 5 and 15 paths each way):
- **Item 1**, the rate drawn from the first 1,000: the survival price at 7ac's whole-score price HELD 0.921, 0.798 and 0.600;
  at half the realised HELD 0.900, 0.763 and 0.565; at 1.5 times the whole price HELD 0.474, 0.296 and 0.162; priced right
  (cause 2) FALSIFIED 0.550, 0.680 and 0.787 (HELD 0.068, 0.032, 0.014); priced right on bridge 4 only INCONCLUSIVE 0.73 to
  0.77. With the rate held at the first 1,000's: HELD 0.997, 0.950 and 0.730; priced right FALSIFIED 0.836, 0.923 and 0.965.
  So item 1 separates a price near 7ac's from the realised with power 0.6 to 0.95, and a price 1.5 times 7ac's mostly reads
  INCONCLUSIVE.
- **Item 2's mispricing half** (the gap half is exact): the mispricing falling by all of it reads 0.95 to 0.99; by half 0.47
  to 0.61; by a third 0.22 to 0.23; by none 0.000 to 0.018 (k = 10, 30, 60 paths apart). So a modest closing mostly reads
  INCONCLUSIVE; a false HELD from noise alone is under 2%.
- **Items 3 and 4, and item 2's gap half:** the tables' own numbers, power 1 against the thresholds; no record holds the gap at
  another grid, so their uncertainty is the credence alone.
- **Time:** from 7aa's measured solves at 30x5 under four-way load (TS+J 737 to 1,059 s, the product 267 to 359 s; results/
  diag7aa) and 7ac's runs (633 to 650 s for 8,000 paths, so about 320 s for 4,000): the return points scale a solve about 3
  times (the build check at 4 points: 193 s at 15 against 65 s at 5, results/diag7ad-try and results/diag7aa-preflight); 60
  points assumed twice 30 (no record; revised when the first 60x5 job lands). A 30x15 job about 70 minutes, a 60x5 job about
  50, a 30x5 job about 50 (three node pairs), the control about 45; seven jobs four at a time about 2 hours, plus the smoke
  run and the launcher's re-run of derive-7ad.mjs. Each process is stopped at 5 hours. The preflight's job times are
  printed beside.

## Budget line

The maintainer approved 7ad at 15:01 UK on the deep review's recommendation: it decides which fix to build (a numerical
under-pricing at the end-pot cliff, fixable by a finer grid, or a bug or structure) before the wider confirmation spends runs
on a candidate whose gain on two of three households rests on a price 2.5 to 3 times low; about 2 hours of runs, 6 core-hours.

## Pre-mortem

- **Most likely:** item 1 HELD (the node realises well above the price) and a partial move at 60 points - the gap up 10 to
  20%, the mispricing down less than a third: items 2 and 3 INCONCLUSIVE, pointing at 60x15 or a node at the cliff.
- **Second:** the grid is not the cause - nothing moves 10% (items 2 and 3 FALSIFIED) while item 1 HELD: off-grid choices or a
  tier-state bug.
- **Third:** the node realises less than 7ac's first 1,000 suggest (the 1,000 are noisy: 12 and 16 net paths) and the price
  sits inside the interval: item 1 FALSIFIED or INCONCLUSIVE by noise, not by cause 2 - read beside the first 1,000's figure.
- **Fourth:** a 30x5 solve is not 7aa's (the survival output changed the solve): NOT SETTLED, found before anything is read.
- **Fifth:** the refined grid moves the opening itself (TS+J's chosen move or the product's) so the like-for-like pair changes
  between grids: the gate requires BEST and STAY at each grid, and the price at each grid is of its own pair; read beside.
- **The smoke run:** smoke.sh (locked) does not run diag7ad; the preflight through the launcher (all seven jobs at 4 points,
  every line through the reducer's parse and gate against 7aa's and 7ac's preflights, every trace's name and stamp) covers it.

## Changes after seeing results

None.
