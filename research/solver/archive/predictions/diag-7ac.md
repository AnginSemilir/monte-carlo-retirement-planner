# Prediction: diag-7ac

- **Run:** `research/solver/batch-7ac.sh` - results/diag7ac/case0-3.txt and every run's trace (audit-s126.mjs diag7ac), read beside 7aa's (results/diag7aa); reduced by `reduce-7ac.mjs` into results-7ac.txt
- **Kind:** test
- **Written:** 28 Sept, 12:17 UK, before the run; after 7aa was read (11:18 UK) and the deep review after it (11:44 UK), which designed this test; while 7ab runs (launched 12:16 UK, runs.log), no 7ab figure seen
- **Seeds:** 7002 tuning (8,000 paths, 7aa's own; the same paths for every unit and for 7aa's). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan; on these cases it draws no path (7aa's gate: "off: no tier above the plan"). No held-out seed is touched. **Disclosed (RULES.md Known limits item 18):** one light-lane measurement ran this test's mode before this prediction existed - runs.log 28 Sep 12:15 UK, "7ac build check - one tiny diag7ac unit (4 points, 20 paths, 10 a world)" on seed 7002's first 20 paths (results/diag7ac-try). Its lines were read only to see that the mode prints them; at 4 points its tables open in the plan's tier (TS+J's gap 0), so nothing registered here can be read from it.
- **Unmasking:** items 1 and 2 remove no known error: OPEN0 is the decomposition arm the deep review after 7aa named, not a fix - it puts the product's opening (the plan's tier in year 0) back into TS+J's own tables, so OPEN0 against TS+J is the opening's share of TS+J's gain (RULES.md section 9's decomposition) and no item reads OPEN0 as a candidate; a harm by OPEN0 against TS+J is the opening's value, not an error. Item 3 does remove one: OPEN0 against TS, with the opening held alike (both open in the plan's tier on S126 and S194 at W0.02: TS's gaps 7.9487e-4 and 9.6876e-4, under the margin, results-7aa-gaps.txt), is TS+J's one choice for every world against the per-world tier choice (O41, the known error diag-7aa.md's Unmasking field names; 7aa's item 2). The baseline behaviour it drives is O42: at W0.02 TS loses 9 and 16 of the product's survivors (results-derive-7ac.txt) and holds 1/1 on 961 of S194's paths in year 1 (results-7aa.txt). The separating arm is the opening held alike, so OPEN0 against TS reads the continuation alone. Removing the per-world rule may unmask an error in the joint rule's continuation from the plan's tier: so a FALSIFIED item 3 is read in three branches by the same pooled cells read for a loss (reduce-7ac.mjs, a harm family of its own at the pooled margin): no material harm - the opening carried 7aa's item 5; a loss - the joint rule's continuation does worse than the per-world rule's from the same opening, a possible unmasked error: a register item and a diagnosis, never "the opening carried it"; the loss read inconclusive - neither settled (the plan-auditor's review of this registration, 28 Sep 12:36 UK, BLOCKING 1).
- **Plan section:** PLAN.md "7ac"

## Question

On the four units where 7aa's TS+J opens tier 2 and the product the plan's tier (S126 with the reader at W0 and W0.02, bridge 4 with the reader at W0, S194 under off at W0.02), does TS+J's gain over the product come from its year-0 opening - so every table, TS+J's included, under-prices one year's exposure (the deep review's cause 1) - or from its tables' continuation after the opening (cause 2)? And at the pot's default weight, does the per-world rule's continuation cost the tier state survival on the paths the product survives (O42's split)?

## Derivation

- **What TS+J gained, and where it starts** (7aa, read 11:18 UK; results-derive-7ac.txt through reduce-7aa.mjs's gates): against the product, 40 saved and 0 lost on S126 at W0, 38/1 on bridge 4 at W0, 47/0 on S126 at W0.02, 45/3 on S194 at W0.02; every one of those changed paths first differs at the year-0 tier (results-7aa-paths.txt), and TS+J opens tier 2 there while the product opens the plan's tier (results-7aa-gaps.txt). That places where the difference starts, not what carries it.
- **Cause 1 (the opening carries it):** the deep review's slices of S194 at W0.02 (grade C, deep-review-log.md 11:44 UK) find the product de-risking most of TS+J's saved paths within two years to the same tier, the loss about one year's exposure; the realised whole score of opening apart is about 4 to 7 times the de-risking arm's own year-0 gap (the ledger's 11:44 row). If so OPEN0 - TS+J's tables, the year-0 move held in the plan's tier - loses about what the product loses: items 1 and 2 HELD.
- **Cause 2 (the continuation carries it):** TS+J's chosen layer is calibrated by world at the opening (7aa's world lines: its bad world's table less run -0.119 and -0.088 on S126, -0.875 on S194 at W0.02, -0.215 on bridge 4 at W0; results-7aa.txt). If its plan's-tier layer is as good, OPEN0 de-risks the bad-start paths at year 1 and keeps most of TS+J's gain: items 1 and 2 FALSIFIED.
- **Item 3:** at W0.02 on the product's survivors TS loses 9 (S126) and 16 (S194), and TS+J against TS is 9/0 and 15/2 (results-derive-7ac.txt). TS opens in the plan's tier on both (its gaps 7.9487e-4 and 9.6876e-4, under the margin; results-7aa-gaps.txt) as OPEN0 does, so OPEN0 against TS compares TS+J's continuation with the tier state's: the per-world rule's (O41). Either cause predicts OPEN0 keeps most of those paths.
- **The world lines, reported:** each world table's own price of the opening at the true year-0 position against the survival TS+J and OPEN0 realise in that world; the mixture's price must equal the gap (the reducer's gate). Cause 1 predicts the realised bad-world difference well above the price.
- **Prior tests of the same mechanism** (RULES.md section 9 rule 7): 7w item 4 (the freed opening against margin 0: the opening alone buys by survival what margin 0 buys, HELD) and O43 (by the whole score, margin 0's later switching buys estate the opening alone does not); 7aa itself (the gain, HELD at both weights).

## Prediction

1. **W0, the opening carries TS+J's gain:** on S126 (reader) and bridge 4 (reader), OPEN0 harms against TS+J by survival.
2. **W0.02, by the whole score within the survival limit:** on S126 (reader) and S194 (off), OPEN0 loses against TS+J.
3. **W0.02, O42's split:** pooled over S126 and S194 on the paths the product survives, OPEN0 gains against TS.

## Falsified if

Item 1: no material harm on both legs (read by both intervals). Item 2: no material loss on both legs. Item 3: no material
gain (the pooled interval's upper end below 0.1 points). INCONCLUSIVE is never a negative: the suspect stays open.

## Fair-test table

Arm A is TS+J (7aa's joint tier state, run again on 7ac's code and required identical to 7aa's) for items 1 and 2, TS (7aa's
per-world tier state) for item 3; arm B is OPEN0 (TS+J's own solve, the year-0 move held in the plan's tier) - the same
case, estate weight, bridge read, solve settings, lambda and paths. The estate weight is a stratum: each unit's own.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | the four units of 7aa where TS+J opens tier 2 at 1e-3 and the product the plan's tier (results-7aa-gaps.txt): S126 (reader) at W0 and W0.02, bridge 4 (reader) at W0, S194 (off) at W0.02 - chosen on purpose from the records, a diagnosis, nothing generalised | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | 8,000 paths of seed 7002 (7aa's runs) | the same paths, paired | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held and the solver runs against itself |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | TS+J: three worlds, the tier state, one move for every world; TS (item 3): three worlds, the tier state, each world's tables solving its own tier choice | OPEN0: TS+J's tables | SAME against TS+J (items 1 and 2); TESTED against TS (item 3: the per-world rule, with the opening alike - row 19) |
| 12 | The estate preference | the estate weight 0 or 0.02 (linear, capped at the case's cap), as the unit names it | the same weight in every leg | SAME within every leg; items 1 (W0) and 2 (W0.02) read each weight's own units (O45: gaps and openings are drawn from each weight's own records) |
| 13 | The risk tier chosen, consent to change it, risk above | the product's 'auto' rule ("off: no tier above the plan", required by both gates); the tier free each year | the same | SAME |
| 19 | The switch margin and switching cost | TS+J: 0.001 every year, the cost 0.25% of the slice traded in the backward pass and forward; TS (item 3): 0.001, opening in the plan's tier on both of item 3's cases (gaps under the margin) | OPEN0: an unbounded margin in year 0 (the best move keeping the plan's pension and ISA tiers, solve.js chooseAction), 0.001 after; the cost as TS+J's | TESTED against TS+J - the year-0 opening is the thing tested (items 1 and 2); SAME in effect against TS (both open in the plan's tier; the reducer's gate requires every OPEN0 path to keep it) |
| 20 | The dislike of cuts: lambda (held or landed) and the trim curve's exponent (together, c) | 7t's to 7aa's 0.0223606797749979, exponent 2 | the same | SAME |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | the reader on READER cases, off on OFF cases; the final year exact; no block trim; Q's fix off; the reader's reference the plan's | the same | SAME |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself, no rival arm |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm in this run |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | TS+J, TS and PRODUCT: 7aa's snapshot (code eb7b84680587, runs.log 08:17 UK); TS+J also re-run on 7ac's snapshot | OPEN0: 7ac's snapshot | ACCEPTED - the code between 7aa's launch (debc722) and 7ac's changes research scripts only (audit-s126.mjs's diag7ab and diag7ac modes, a7dc0d9; experiment.mjs's band guard, select mode only) and nothing the solver runs: src/ unchanged (git diff debc722..HEAD -- src, empty) and research/engine.mjs, a gitignored build, byte-identical (cmp) to the copy in 7aa's snapshot (/tmp/solver-snap-fHd8G9); the reducer's identity gate requires 7ac's TS+J trace to equal 7aa's on every path, every unit, byte for byte (survival, level, tier, wealth, tax, failure year), and its table, year-0 gap, scale, cap, world lines' TS+J survival and run survival to equal 7aa's; the preflight checks the same identity against 7aa's preflight |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | survival: the floor paid every year and the minimum pot at the end, simulated; the whole score: reduce-7t.mjs's (survival, the capped estate at the unit's own weight, the dislike of cuts, the raise credit), realised on the paths | the same | SAME |
| 30 | The reducer and its version | reduce-7ac.mjs: requireFairLogs over both runs' stamps, 7aa's own gate (reduce-7aa.mjs) and traces, 7ac's gate against 7aa's TS+J and PRODUCT units, the identity, every trace's count, seed, arm, stamp and survival; INCONCLUSIVE unless all four units are done; 47 planted checks, 45 planted faults each caught (mutate-reduce-7ac.py, results-reduce-7ac-mutations.txt; four checks and five faults added for item 3's loss read after the plan-auditor's review of 12:36 UK, before any 7ac unit ran) | the same | SAME |
| 31 | Paired or not, and the standard error used | paired on the same paths; survival by the regimen's exact rule (reduce-7v.mjs harmFamily and gainFamily), Holm within each item, the exact 95% interval against the case's margin, no material harm needing the unconditional interval to agree (reduce-7ab.mjs bothReads); the whole score by reduce-7aa.mjs's rule read for a loss (reduce-7ab.mjs lossRead); item 3 on the product's survivors (reduce-7aa.mjs cellsWhere), pooled; the unconditional interval printed beside every survival leg | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | survival and the whole score are realised on the paths; the tables, gaps and prices are the solver's reading, never the result | the same | SAME |
| 33 | For timings: what else the machine was running | the solve and run seconds are printed, not read | the same | N/A - no timing is read |
- **All other rows: SAME**

## Decision rule (registered before launch)

- **Survival** (items 1 and 3; reduce-7v.mjs harmFamily and gainFamily, single look, level 0.05, Holm over each item's legs):
  the margin is marginFor() of the case's PRODUCT survival (7aa's) at the leg's own weight (0.25 at 95% or more, else 0.5).
  **Item 1** HELD when both legs read harm; FALSIFIED when both read no material harm, read by both intervals (reduce-7ab.mjs
  bothReads: the exact reading's no material harm stands only if the unconditional interval's lower end is above minus the
  margin too); else INCONCLUSIVE. **Item 3** pooled over S126 and S194 at W0.02 on the paths PRODUCT survives
  (reduce-7aa.mjs cellsWhere), OPEN0 against TS, at the pooled margin 0.1 (stats.mjs MARGINS.pooled): HELD on a gain (saved
  more than lost, the exact one-sided p below 0.05), FALSIFIED on no material gain (the exact interval's upper end below
  0.1), else INCONCLUSIVE.
- **The whole score** (item 2; reduce-7aa.mjs wholeLeg: the survival part unconditional and guarded, the rest by its normal
  interval, each at half the leg's rate, added; the leg's rate 0.05 over the two legs, Bonferroni), read for a loss
  (reduce-7ab.mjs lossRead): LOSS when survival reads harm (the exact McNemar under Holm over the two legs, the point loss at
  least the margin) or the whole interval's upper end is below 0 with the point loss at least the margin; NO MATERIAL LOSS
  when the whole interval's lower end is above minus the margin and survival's unconditional lower end is above minus the
  margin; else inconclusive. Item 2 HELD when both legs read a loss, FALSIFIED when both read no material loss, else
  INCONCLUSIVE. The exact survival part is printed beside.
- **NOT SETTLED:** either gate fails, or the identity fails on any unit.
- **The registered reading decides; the unconditional one is printed beside it,** marked where they disagree.
- **Declared choices, not derived:** the four units (7aa's openings apart); item 1 at W0 and item 2 at W0.02, each on that
  weight's units; both intervals for item 1's no material harm; the loss read's threshold (the case's margin); Bonferroni
  for item 2; the pooled margin for item 3.

## Decision fed

- **Items 1 and 2 HELD (cause 1):** TS+J's gain on these units is its opening: every table, TS+J's included, under-prices one
  year's exposure near the end-pot cliff (grade B for the split on these four units, one seed; the residual's mechanism grade
  C). Both opening candidates - TS+J (its opening by O44's narrow gap) and the freed opening (margin 0 in year 0, O37's catch)
  - open de-risked without pricing it right. To the maintainer: the residual's root cause as the next test, sized (the grid
  and interpolation near the end-pot cliff, or the plan's-tier layer's bad-world overrating; the world lines' price against
  realised say which to look at first); the combined fix stays held; with 7ab's reading, the choice between TS+J and the freed
  opening as an interim opening rule. Nothing to a default.
- **Items 1 and 2 FALSIFIED (cause 2):** TS+J's tables price the continuation right: from the plan's tier they recover TS+J's
  gain later, so the opening is not what carries it (grade B). TS+J is the candidate whose tables are right, O44's knife edge
  matters less, and the combined fix (TS+J with Q's fix) is unpaused and goes to the maintainer as the next build.
- **Item 1 and item 2 opposite (one HELD, one FALSIFIED):** the opening carries the gain at one weight only: to the
  maintainer as a lever-dependent result (O45's pot-weight mechanism), grade C.
- **Item 3 HELD:** the per-world rule's continuation costs the tier state survival on the product's survivors at W0.02 (O42's
  reading b, grade B for the split on two cases). **Item 3 FALSIFIED**, in the branch reduce-7ac.mjs prints from the same
  pooled cells read for a loss (a harm family of its own at the pooled margin 0.1): **without a loss** (no material harm) -
  the opening, not the continuation, carried 7aa's item 5: O42 re-read; **by a loss** (harm: OPEN0 loses to TS on the
  product's survivors) - the joint rule's continuation from the plan's tier does worse than the per-world rule's, a possible
  error the removal of O41 unmasks: a register item with an owner and a gate, and a diagnosis (where the lost paths first
  differ, by the traces) before any reading of the opening; not "the opening carried it", and TS+J's standing from items 1
  and 2 is held until it is diagnosed; **with a loss not ruled out** (the loss read inconclusive) - neither reading settled:
  a register item and a sized follow-up to the maintainer.
- **Otherwise (INCONCLUSIVE):** a sized follow-up to the maintainer; nothing else rests on it.
- In every branch the world lines are reported, not items: a bad-world difference realised well above the table's price
  supports cause 1's mechanism (grade C).

## Provenance

- Item 3's branch power: derive-7ac-branch.mjs (results-derive-7ac-branch.txt), after the plan-auditor's MINOR 1 of 12:49 UK.
- The build: audit-s126.mjs diag7ac (a7dc0d9: 7aa's TS+J unit again, run forward twice - TS+J and OPEN0 - with each world's
  price and both arms' world runs), reduce-7ac.mjs with mutate-reduce-7ac.py, derive-7ac.mjs, batch-7ac.sh, preflight-7ac.sh
  with preflight-parse-7ac.mjs (the identity against 7aa's preflight).
- The records: results-7aa.txt, results-7aa-gaps.txt, results-7aa-paths.txt, results-derive-7ac.txt; the deep review after
  7aa (deep-review-log.md, 28 Sep 11:44 UK); 7aa's run (results/diag7aa, read only through reduce-7aa.mjs's gate).

## Derivation script

- `derive: research/solver/derive-7ac.mjs > research/solver/results-derive-7ac.txt sha256 36c65f640b4cbc29`
  (7aa's four units through reduce-7aa.mjs's gates: TS+J against PRODUCT, the margins, the product's failures, the rest of
  TS+J's whole score at W0.02, and TS's and TS+J's cells on the product's survivors; each item drawn as Poisson counts with a
  background of 0.5, 5 and 15 paths each way, item 2's rest as a normal mean at its recorded error, read by reduce-7ac.mjs's
  rule).

## Point and interval

80% intervals, the author's, of 8,000 paths (OPEN0 saved less lost against the named arm) or as named:
- Item 1 (W0, against TS+J): S126 -35 (-45 to -5); bridge 4 -30 (-42 to -5).
- Item 2 (W0.02, against TS+J, the whole score in points): S126 -0.55 (-0.85 to -0.05); S194 -0.55 (-0.85 to -0.05).
- Item 3 (W0.02, against TS on the product's survivors, pooled): +22 (+5 to +30).

## Credence

The author's probability that each item reads as predicted: 1 (HELD), 0.60; 2 (HELD), 0.60; 3 (HELD), 0.75. The deep review
ranks cause 1 first on S194's year-1 de-risk; against it, TS+J's chosen layer is calibrated by world. The scorecard stands at
0.217 over 78 items against its 0.20 target (results-scorecard.txt), and 7aa scored 0.260; item 3 is predicted by both causes,
so it alone is given 0.75.

## Power

From results-derive-7ac.txt (20,000 draws a story; backgrounds 0.5, 5 and 15 paths each way):
- **Item 1:** cause 1 (OPEN0 as the product) HELD 0.998, 0.994 and 0.977; cause 2 (OPEN0 as TS+J) FALSIFIED 1.000, 0.999 and
  0.867; half of TS+J's gain lost HELD about 0.21 to 0.23, otherwise mostly INCONCLUSIVE; cause 1 on S126 only INCONCLUSIVE
  1.000.
- **Item 2:** cause 1 HELD 1.000 at every background; half HELD 0.909, 0.852 and 0.688; cause 2 FALSIFIED 1.000, 0.924 and
  0.409 (at 15 paths each way mostly inconclusive).
- **Item 3:** OPEN0 as the product on its survivors HELD 1.000, 0.983 and 0.838; as TS+J HELD 0.997, 0.941 and 0.737; as TS
  (the opening carried 7aa's item 5) FALSIFIED 0.999, 0.951 and 0.503.
- **Item 3's branches** (added before launch for the plan-auditor's MINOR 1 of 28 Sep 12:49 UK; derive-7ac-branch.mjs over
  results-derive-7ac.txt, its hash checked against the derive line below and its guard shown refusing a planted copy with one
  size changed; results-derive-7ac-branch.txt sha256 5a0e29303c6b1848; the same stories and draws as item 3's, read as
  reduce-7ac.mjs reads the item and its branch): OPEN0 as TS lands in the no-loss branch - the reading "the opening carried
  7aa's item 5" - 0.999, 0.908 and 0.048 at 0.5, 5 and 15 paths each way, and in "a loss not ruled out" 0.000, 0.040 and
  0.427 (by a loss 0.000, 0.000 and 0.021). OPEN0 losing to TS what TS loses to the product there (9 and 16) lands in the
  loss branch 0.972, 0.924 and 0.839 (a loss not ruled out 0.019, 0.076 and 0.154). So at 15 paths each way a FALSIFIED item 3
  mostly reads "a loss not ruled out" whatever the truth: at about 60 discordant paths the exact interval is about +/-0.10
  (the plan-auditor's check, stats.mjs survivalChange: 30 saved and 30 lost read -0.1002 to 0.1002), so the loss read cannot
  come out as no material harm. That branch settles nothing (a register item and a sized follow-up), and it is
  read against these figures. At the backgrounds 7aa suggests (TS+J against TS lost 0 and 2, results-derive-7ac.txt), 0.5 to 5
  paths each way, the branches' power is 0.9 or more.
- **Time:** from 7aa's TS+J units on these four (results/diag7aa's case logs): 737 to 838 s a solve and 633 to 650 s a run
  of 8,000 paths; a unit is one solve, two runs and six world runs of 1,000 paths (each world, both arms), about 40 to 45
  minutes; four units four at a time, plus the smoke run and the launcher's re-run of derive-7ac.mjs (over two minutes).
  The launcher runs one main-lane batch at a time, so the batch follows 7ab's. Each process is stopped at 4 hours.

## Budget line

The maintainer approved 7ac at 11:59 UK on the deep review's recommendation: the one test that decides whether TS+J prices
the opening right, on which the combined fix and TS+J's move to 7u wait; about 45 minutes of runs after 7ab.

## Pre-mortem

- **Most likely:** cause 1 on S194 at W0.02 (the product de-risks there within two years) and a smaller effect on S126, whose
  product de-risks the saved paths later: item 2 HELD, item 1 HELD or INCONCLUSIVE.
- **Second:** TS+J's plan's-tier layer de-risks the bad-start paths at year 1 (cause 2), recovering most of the gain: items 1
  and 2 FALSIFIED or INCONCLUSIVE.
- **Third:** the identity fails (7ac's TS+J trace not 7aa's): the run is NOT SETTLED and the difference is found before
  anything is read.
- **Fourth:** OPEN0's hold does not bind on some path (no move keeping the plan's tiers is feasible in year 0): the gate
  refuses (held0 not 8,000) and the run is NOT SETTLED.
- **The smoke run:** smoke.sh (locked) does not run diag7ac; the preflight through the launcher (all four units at 4 points,
  every line through the reducer's parse and gate against 7aa's preflight, every trace's name, the identity) covers it.

## Changes after seeing results

None.
