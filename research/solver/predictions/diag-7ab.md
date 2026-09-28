# Prediction: diag-7ab

- **Run:** `research/solver/batch-7ab.sh` - results/diag7ab/case0-9.txt and every run's trace (audit-s126.mjs diag7ab), read beside 7aa's (results/diag7aa); reduced by `reduce-7ab.mjs` into results-7ab.txt
- **Kind:** test
- **Written:** 28 Sept, 08:35 UK, before the run and before 7aa is read (7aa launched 08:17 UK, runs.log; no 7aa figure seen); revised before the run for the plan-auditor's MINOR 1 and 2 on the registration (review-log.md, 28 Sept, 08:49 UK: item 3 split into its S360-under-off leg and item 5, the other four legs; fair-test row 28's evidence), no result seen
- **Seeds:** 7002 tuning (8,000 paths, 7aa's own; the same paths for every unit and for 7aa's). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan; on these cases it draws no path (7y's and 7aa's gates: "off: no tier above the plan"). No held-out seed is touched.
- **Unmasking:** the freed opening (FREED) removes one known error from the product: the switch margin's accidental hold of the opening in the plan's tier (O30, O33), leaving free switching and the per-world tier choice in the tables. Removing the hold unmasks off's misread of S360 (O37: its tables favour the de-risk that loses, and only the 1e-3 margin keeps the plan's tier; at margin 0 the product opens S360 under off in tier 2, and 7v's openings in tier 2 there saved 9 and lost 497, results-7v.txt) and may unmask the reader's plan-tier reference on S360 (O36). So S360 under off and with the reader are harm legs attributed in advance at grade C to O37 and O36, never to the freed opening alone; items 1 and 2 (FREED against TS+J) separate the opening's share of TS+J's change from the rest (TS+J's later switching and its tables); a harm is not the freed opening's fault until a decomposition splits the blame (RULES.md section 9).
- **Plan section:** PLAN.md "7ab"

## Question

With the product's own tables and only the year-0 move freed from the switch margin (FREED, 7w's /1e-3+open: no solve beyond the product's), does the solver do as well as the joint tier state (TS+J, 7aa's, whose solves take about three times the product's) with the pot's weight off (0: survival) and on (0.02: the whole score within a survival limit) on S126 (reader) and S194 (off), and does it do no harm against the product on bridge 4 (reader), S360 (reader) and S360 (off)? The maintainer's end goal (the ledger 28 Sep 06:41) and question (07:54): is there an alternative to TS+J good enough without its solve time?

## Derivation

- **What the freed opening bought** (7w; results-derive-7ab.txt through reduce-7w.mjs's gates; grade C, reported beside 7w's items, the 27 Sep 20:07 row): against the product at 0.001 on 7w's 3,000 paths (7ab's first 3,000), 15 saved and 0 lost on S126 with the reader, 16 and 0 on S194 under off; scaled, 40.0 and 42.7 of 8,000; the rest of its whole score -0.170 +/- 0.025 and -0.068 +/- 0.020 at 0.02. 7w's registered item 4 read it against margin 0: no material harm on both, switching at most half as often (results-7w.txt).
- **What TS+J's tables say** (results-o41.txt; grade B for the printed tables): at the product's margin and the weight 0.02 TS+J opens in pension pair 2 on S126 and S194, where the freed opening opens too. If TS+J's gain is its opening, FREED matches it (items 1 and 2 HELD); if TS+J's later switching or its tables elsewhere carry value, TS+J beats FREED (items 1 or 2 FALSIFIED). The reducer prints the path-years the two hold different tiers, in year 0 and after.
- **What the tier state costs:** 7y's tier-state solves took 681 to 1,141 s against the product's 236 to 410 s under the same load (results/diag7y logs); FREED needs no solve beyond the product's.
- **The weight 0 has no record for FREED** (O43): item 4 is drawn at the 0.02 sizes (grade D).
- **Where it will harm:** S360 under off. The product's year-0 gap there is 5.5644e-4 at 0.02, opening in the plan's tier at 1e-3 and in tier 2 at 0 (results-7y.txt), and 7v's openings in tier 2 there lost 497 and saved 9 against the product (results-7v.txt; O37), so at margin 0 in year 0 FREED opens in tier 2 and loses about that: item 3 predicts that harm (HELD on harm), attributed in advance to O37 (grade C). S360 with the reader (O36) and bridge 4 (never run with the freed opening) are the open harm legs, item 5.
- **Prior tests of the same mechanism** (RULES.md section 9 rule 7): 7w item 4 HELD (above); 7v: a lower margin scores better by the whole score on S126, bridge 4 and S172 (O43) and harms S360 under off (O37).

## Prediction

1. **W0, as good as TS+J:** on S126 (reader) and S194 (off), FREED shows no material harm against TS+J by survival (read by both intervals).
2. **W0.02, as good as TS+J:** on S126 and S194, FREED shows no material loss against TS+J by the whole score within the survival limit.
3. **W0.02, O37 unmasked:** on S360 under off, FREED harms against PRODUCT by survival (O37; S360 under off at W0 printed beside, not an item).
4. **W0, the gain:** on S126 and S194, FREED gains against PRODUCT by survival.
5. **No harm elsewhere:** on bridge 4 (reader) and S360 (reader) at W0 and W0.02, FREED shows no material harm against PRODUCT by survival.

## Falsified if

Item 1: harm on either leg. Item 2: a loss on either leg. Item 3: no material harm on S360 under off at W0.02. Item 4: no
material gain on both. Item 5: harm on any of its four legs. INCONCLUSIVE is never a negative: the suspect stays open.

## Fair-test table

Arm A is TS+J (7aa's joint tier state) for items 1 and 2, PRODUCT for items 3, 4 and 5; arm B is FREED - the same case,
estate weight, bridge read, solve settings, lambda and paths. The estate weight is a stratum: 0 and 0.02, the same in both
arms of every leg.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | 7aa's five: S126 (reader) and S194 (off), the FS cases; bridge 4 (reader); S360 with the reader and under off, O36's and O37's harm legs - chosen on purpose from the records, a diagnosis, nothing generalised | the same | SAME |
| 2 | Changes the test makes to a household's inputs | bridge 4 is 7c's variant of S126 (audit-s126.mjs F1_VARIANTS) | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | 8,000 paths of seed 7002 (7aa's runs) | the same paths, paired | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held and the solver runs against itself |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | TS+J: three worlds, the tier state, one move for every world; PRODUCT: three worlds, each world's tables solving its own tier choice | FREED: the product's tables | TESTED against TS+J (TS+J's tables are half of what items 1 and 2 weigh against the opening alone); SAME against PRODUCT |
| 12 | The estate preference | the estate weight 0 or 0.02 (linear, capped at the case's cap), as the unit names it | the same weight in every leg | SAME within every leg; two strata by the maintainer's design (28 Sep) |
| 13 | The risk tier chosen, consent to change it, risk above | the product's 'auto' rule ("off: no tier above the plan", required by both gates); the tier free each year | the same | SAME |
| 19 | The switch margin and switching cost | TS+J: 0.001 and the cost 0.25% of the slice traded in the backward pass on the mixture-weighted score and forward; PRODUCT: 0.001 forward only | FREED: margin 0 in year 0 and 0.001 after, forward only, the cost as the product's | TESTED - the freed year-0 move is the thing tested against PRODUCT (items 3, 4 and 5) and, with row 7, against TS+J (items 1 and 2) |
| 20 | The dislike of cuts: lambda (held or landed) and the trim curve's exponent (together, c) | 7t's to 7aa's 0.0223606797749979, exponent 2 | the same | SAME |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | the reader on READER cases, off on OFF cases; the final year exact; no block trim; Q's fix off; the reader's reference the plan's | the same | SAME |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself, no rival arm |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm in this run |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | TS+J: 7aa's snapshot (code eb7b84680587, runs.log 08:17 UK); PRODUCT: 7ab's snapshot, re-run | FREED: 7ab's snapshot | ACCEPTED - the code between 7aa's launch (debc722) and 7ab's changes audit-s126.mjs (the new diag7ab mode) and experiment.mjs (the band guard, select mode only) and nothing the solver runs: src/, record.mjs and the scenarios unchanged (git diff debc722..HEAD, empty), and research/engine.mjs, a gitignored build, byte-identical (cmp) to the copy in 7aa's snapshot (/tmp/solver-snap-fHd8G9; the plan-auditor's check and Claude's, 28 Sep); the reducer's identity gate requires 7ab's PRODUCT trace to equal 7aa's on every path, every case and weight, byte for byte (survival, level, tier, wealth, tax, failure year), and its table, year-0 gap, scale and cap to equal 7aa's; the preflight checks the same identity against 7aa's preflight |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | survival: the floor paid every year and the minimum pot at the end, simulated; the whole score: reduce-7t.mjs's (survival, the capped estate at the unit's own weight, the dislike of cuts, the raise credit), realised on the paths | the same | SAME |
| 30 | The reducer and its version | reduce-7ab.mjs: requireFairLogs over both runs' stamps, 7aa's own gate (reduce-7aa.mjs) and traces, 7ab's gate against 7aa's PRODUCT units, the identity, every trace's count, seed, arm, stamp and survival; INCONCLUSIVE unless all forty units are done; 39 planted checks, 45 planted faults each caught (mutate-reduce-7ab.py, results-reduce-7ab-mutations.txt) | the same | SAME |
| 31 | Paired or not, and the standard error used | paired on the same paths; survival by the regimen's exact rule (reduce-7v.mjs harmFamily and gainFamily), Holm within each item, the exact 95% interval against the case's margin, no material harm needing the unconditional interval to agree (bothReads); the whole score by reduce-7aa.mjs's rule read for a loss; the unconditional interval printed beside every survival leg | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | survival and the whole score are realised on the paths; the tables and gaps are the solver's reading, never the result | the same | SAME |
| 33 | For timings: what else the machine was running | the solve and run seconds are printed, not read | the same | N/A - no timing is read |
- **All other rows: SAME**

## Decision rule (registered before launch)

- **Survival** (items 1, 3, 4 and 5; reduce-7v.mjs harmFamily and gainFamily, single look, level 0.05, Holm over each item's
  legs): the margin is marginFor() of the case's PRODUCT survival at the leg's own weight (0.25 at 95% or more, else 0.5).
  **No material harm is read by both intervals** (reduce-7ab.mjs bothReads): the regimen's exact reading stands, except that
  "no material harm" also needs the unconditional interval's lower end (stats.mjs survivalChangeU, guarded) above minus the
  margin; where it is not, the leg is inconclusive. A declared choice, stricter than the regimen alone (it can turn no
  material harm into inconclusive, never the reverse), because items 1 and 3 claim "no worse", where the exact interval's
  end is the point estimate with one-sided changes (stats.mjs survivalChange's comment; the plan-auditor on 7aa's item 4).
  **Item 1** HELD when both legs show no material harm, FALSIFIED when either reads harm, else INCONCLUSIVE. **Items 3 and 5**
  read one harm family against PRODUCT: bridge 4 (reader), S360 (reader) and S360 (off) at W0 and W0.02, six legs, Holm over
  the six. **Item 3** reads its S360-under-off leg at W0.02: HELD on harm (the harm predicted), FALSIFIED on no material harm,
  else INCONCLUSIVE; its W0 leg is printed beside, not an item. **Item 5** reads the four legs of bridge 4 and S360 with the
  reader: HELD when all four show no material harm, FALSIFIED when any reads harm, else INCONCLUSIVE. **Item 4** HELD when
  both legs gain, FALSIFIED when both show no material gain, else INCONCLUSIVE.
- **The whole score** (item 2; reduce-7aa.mjs wholeLeg: the survival part unconditional and guarded, the rest by its normal
  interval, each at half the leg's rate, added; the leg's rate 0.05 over the two legs, Bonferroni), read for a loss: NO
  MATERIAL LOSS when the whole interval's lower end is above minus the case's margin and survival's unconditional lower end is
  above minus the margin; LOSS when survival reads harm (the exact McNemar under Holm, the point loss at least the margin) or
  the whole interval's upper end is below 0 with the point loss at least the margin; else inconclusive. Item 2 HELD when both
  legs show no material loss, FALSIFIED when either is a loss, else INCONCLUSIVE. The exact survival part is printed beside.
- **NOT SETTLED:** either gate fails, or the identity fails on any case and weight.
- **The registered reading decides; the unconditional one is printed beside it,** marked where they disagree.
- **Declared choices, not derived:** the two weights (7aa's); both intervals for no material harm; the loss read's
  threshold (the case's margin, as the regimen's harm); Bonferroni for item 2; items 3 and 5 as legs of one family over both
  weights; item 3 at W0.02 alone (7v's and 7y's records are at 0.02).

## Decision fed

- **Items 1 to 5 HELD (the expected case: item 3 is the predicted harm on S360 under off):** FREED does as well as TS+J on
  the two FS cases at both settings with no solve beyond the product's, and gains against the product at W0; its harm is
  O37's, where the product's own tables misread (grade C, the same harm as 7v's openings in tier 2). To the maintainer: the
  freed opening as the cheap candidate for the opening, conditional on O37's fix (off's tables on S360) or on 7aa's reading of
  TS+J on the same leg; the decomposition that clears it: FREED on S360 under off with O37's misread fixed. Grade C (one seed,
  two cases). Nothing to a default: the wider confirmation (7u) comes first.
- **Item 5 FALSIFIED (harm on bridge 4 or S360 with the reader):** the freed opening harms beyond O37: not a candidate as it
  stands; a register row, the harm attributed at grade C (S360 with the reader to O36, bridge 4 to the opening itself) until
  a decomposition splits it.
- **Item 1 or 2 FALSIFIED (TS+J materially better than FREED):** TS+J's later switching or its tables carry value the
  opening alone does not: its solve time buys something (grade C; the path-years the two hold different tiers after year 0,
  printed, say where). TS+J stays the candidate if 7aa's items hold; the speed work (E2, E3) is what makes it affordable.
- **Items 1 and 2 HELD with 7aa's items 1 and 4 FALSIFIED:** neither gains against the product on these cases; item 4 then
  decides whether FREED gains on its own (7w's gain replicated at 8,000 paths and W0) or neither does.
- **Item 3 FALSIFIED (no material harm on S360 under off at W0.02):** the freed opening does not take off's losing de-risk
  there, against O37's record: O37 re-read (its gap, printed, says whether FREED opened in tier 2).
- **Item 4 FALSIFIED:** 7w's gain does not replicate at W0 on 8,000 paths: the freed opening is not a candidate at W0.
- **Otherwise (INCONCLUSIVE):** a sized follow-up to the maintainer; nothing else rests on it.

## Provenance

- The build: audit-s126.mjs diag7ab (7aa's PRODUCT unit again, run forward twice: PRODUCT and FREED with 7w's forward rule),
  reduce-7ab.mjs with mutate-reduce-7ab.py, batch-7ab.sh, preflight-7ab.sh with preflight-parse-7ab.mjs (the identity
  against 7aa's preflight, and the band guard's check: experiment.mjs select refusing an existing band, a planted copy
  without the guard not refusing).
- The records: results-7w.txt, results-o41.txt, results-7v.txt, results/diag7y (7y's product and timings),
  results-derive-7ab.txt; 7aa's run (results/diag7aa, read only through reduce-7aa.mjs's gate inside reduce-7ab.mjs).

## Derivation script

- `derive: research/solver/derive-7ab.mjs > research/solver/results-derive-7ab.txt sha256 4ce31c447f293f05`
  (7w's freed opening against the product on S126 and S194 through reduce-7w.mjs's gates, its cells scaled to 8,000; 7y's
  product at 0.02 through reduce-7y.mjs's gates for the margins and the paths failing in both; each item drawn as Poisson
  counts with a background of 0.5, 5 and 15 paths each way, item 2's rest as a normal mean at its recorded error, read by
  reduce-7ab.mjs's rule: bothReads, lossRead on reduce-7aa.mjs wholeFrom).

## Point and interval

80% intervals, the author's, of 8,000 paths (FREED saved less lost against the named arm) or as named:
- Item 1 (W0, against TS+J): S126 0 (-15 to +10); S194 0 (-20 to +10).
- Item 2 (W0.02, against TS+J, the whole score in points): S126 0.00 (-0.15 to +0.10); S194 0.00 (-0.20 to +0.10).
- Item 3 (against PRODUCT): S360 (off) -480 (-560 to -300) at 0.02; beside it, -300 (-560 to 0) at 0.
- Item 5 (against PRODUCT): bridge 4 0 (-15 to +10) at both weights; S360 (reader) 0 (-60 to +40) at both.
- Item 4 (W0, against PRODUCT): S126 +40 (+15 to +60); S194 +43 (+15 to +70).

## Credence

The author's probability that each item reads as predicted: 1 (HELD), 0.50; 2 (HELD), 0.45; 3 (HELD), 0.80; 4 (HELD), 0.60;
5 (HELD), 0.55. The scorecard stands at 0.214 over 72 items against its 0.20 target (results-scorecard.txt), and 7y, the
last test of the tables' opening, scored 0.252; item 3 rests on 7v's registered counts and O37, so it alone is given above
0.60.

## Power

From results-derive-7ab.txt (20,000 draws a story; backgrounds 0.5 and 5 paths each way, and 15 for items 1 and 2):
- **Item 1:** FREED as TS+J HELD 1.000, 0.999 and 0.869; TS+J saving 20 more on both (the margin) HELD 0.001 at every
  background (the rule's false "as good" at the margin); 40 more on S126 alone FALSIFIED 1.000, 0.999 and 0.994.
- **Item 2:** level HELD 1.000, 0.938 and 0.422 (at 15 paths each way mostly inconclusive); TS+J 20 more survivors (the
  margin) FALSIFIED 0.796, 0.797 and 0.777, HELD 0.000; survival level with the rest 0.25 below FALSIFIED 0.751, 0.750 and
  0.750.
- **Items 3 and 5** (one family): the expected case (S360 under off losing 480 at W0.02, the rest level) 3 HELD and 5 HELD
  1.000 and 0.999; all level 3 FALSIFIED and 5 HELD 1.000 and 0.999; S360 under off losing 80 at W0.02, 3 HELD and 5 HELD
  1.000 and 0.999; the expected with bridge 4 losing 30 at W0.02, 5 FALSIFIED 0.974 and 0.954; the expected with S360 (reader)
  losing 80 at W0, 5 FALSIFIED 1.000 at both.
- **Item 4:** as the freed opening HELD 1.000 at both; half of it 1.000 and 0.969; a quarter 0.878 and 0.462; doing nothing
  FALSIFIED 1.000 and 0.977.
- **Time:** from the records - 7y's product solves 236 to 410 s and its product runs of 8,000 paths 211 to 627 s
  (results/diag7y logs, four at a time); a unit is one solve and two runs, about 11 to 28 minutes; ten units four at a time,
  about 35 to 85 minutes, plus the smoke run and the launcher's re-run of derive-7ab.mjs (4 min 41 s measured). The launcher
  runs one experiment at a time, so the preflight and the batch follow 7aa's batch. Each process is stopped at 4 hours.

## Budget line

The maintainer asked for an alternative to TS+J good enough without its solve time. The freed opening is the product's own
tables with one move changed, measured on two cases in 7w; this run sets it beside TS+J on 7aa's own paths and cases, at both
settings, for about an hour.

## Pre-mortem

- **Most likely:** items 1 and 2 HELD on S194 and INCONCLUSIVE on S126, or the reverse (the two policies differing on more
  paths than 7w's background), items 3, 4 and 5 HELD (item 3 the predicted harm on S360 under off, O37).
- **Second:** TS+J's later switching carries a few tens of paths on S194 (its tier state holds de-risked tiers longer in the
  bad world): item 1 FALSIFIED on S194, the tier differences after year 0 large.
- **Third:** the identity fails (a difference between 7aa's and 7ab's code in what the product's solve or run touches): the
  run is NOT SETTLED and the diff is found before anything is read.
- **Fourth:** FREED harms bridge 4 (its opening, never run with the freed rule): item 5 FALSIFIED, a harm beyond O37.
- **The smoke run:** smoke.sh (locked) does not run diag7ab; the preflight through the launcher (all ten units, every line
  through the reducer's parse and gate against 7aa's preflight, every trace's name, the identity) covers it.
- **Least likely:** 7aa's batch fails its gate: then 7ab is NOT SETTLED too, and waits on 7aa's re-run.

## Changes after seeing results

None.
