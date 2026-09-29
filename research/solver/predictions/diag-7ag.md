# Prediction: diag-7ag

- **Run:** `research/solver/batch-7ag.sh` - results/diag7ag/case0-27.txt and every unit's trace (audit-s126.mjs diag7ag); reduced by `reduce-7ag.mjs` into results-7ag.txt, item 3 paired with 7af's S126 units (results/diag7af, read through 7af's own gates)
- **Kind:** test
- **Written:** 29 Sept, 06:57 UK, before the run; after 7af was read (the ledger's 02:58 row) and the deep review after it (deep-review-log.md 29 Sep 03:07 UK), which named this test, and the plan-auditor's FAIL on the review's record (review-log.md, BLOCKING 1: S126's attribution left without an owner), which added item 3
- **Seeds:** 7002 tuning (16,000 paths for the nine households, every arm on the same paths; item 3's TSOFF on 8,000 paths, 7af's own, so it pairs with 7af's S126 units). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan (the gate requires its decision equal across a household's arms). No held-out seed is touched. **Disclosed (RULES.md Known limits item 18):** two measurements ran this test's mode, each under "none": a build check in the light lane before this prediction existed (runs.log, "7ag build check"; S124's and bridge 4+cost's candidate units and others at 4 points and 20 paths, in the scratchpad), and the preflight in the main lane (preflight-7ag.sh; results/preflight-7ag.log). Their lines are read only to see that the mode prints them and that the reducer parses, gates and reads them; 4 wealth points are not a registered grid and no survival, spending or gap line of either is read before 7ag is.
- **Unmasking:** the candidate bundle removes two known errors at once: the reader removes the off bridge misread (O11, O32; on 7af's panel SHIP's tables read far from its simulations: share 0.90 1.4878 against 99.29, results-7af.txt), the joint tier state the per-world tables' held-tier misvaluation (O41). On S126 the reader alone harms (0 saved/44 lost against SHIP, results-7af.txt) and the tier state on top gains 47/0 - whether that is the tier state repairing the reader's error or a gain of its own offsetting a harm the reader still carries is item 3, which TSOFF (TS+J with no bridge read) splits. On the nine, PRODR splits any harm between the reader and the tier state (reported, and the registered split where a household reads harm).
- **Plan section:** PLAN.md "7ag"

## Question

Does the candidate default - the bridge reader with the joint tier state (TS+J), at the product's settings and the 0.001 margin - stay safe against the default as it ships on the nine households of 7e's panel 7af did not run (S124, S128, S130, S366, S370, bridge 4+cost, S162, S172, S168), with the same spending? And on S126, where 7af's bundle is safe only as the sum of a reader harm and a tier-state gain, does the tier state repair the reader's error, or add a gain of its own beside it (which would make TS+J with off the better candidate there)?

## Derivation

- **The reader's own record on the nine** (7e, results-7e.txt; 1,000 paths of seed 7002, look 2 at 3,000): S124 28 lost/11 saved of 3,000 (-0.57, -0.92 to -0.12; inconclusive at 7e's 0.5 margin); S370 17 lost/65 saved of 1,000 (+4.80); bridge 4+cost 0/36 (+3.60); S366 0/1; S172 1/0; S128, S130, S162, S168 0/0. So the reader harms S124 as it harmed S126 (7e: S126 14 lost of 3,000), and the question on S124 is whether TS+J repairs it there too.
- **The bundle on S126, the one household where 7af shows the pattern** (results-7af.txt): the reader alone (PRODR against SHIP) 0/44 (-0.550); the tier state on top (CAND against PRODR) 47/0 (+0.588); the bundle against SHIP 3/0 (+0.037). The year-0 lines: SHIP opens de-risked (gap 9.9930e-3, opening 2,2), PRODR in the plan's tier (8.0241e-4, 0,2), CAND de-risked (1.0600e-3, 2,2). If TS+J under off opens as SHIP does and its continuation adds nothing of its own, TSOFF reads near SHIP and the 47/0 is the repair; the deep review after 7af (deep-review-log.md 29 Sep 03:07 UK, grade C) found OPEN0 (TS+J from the plan's tier, with the reader) against SHIP at 2 saved/4 lost on S126, so TS+J's continuation recovers from the plan's tier, which fits both readings.
- **The margins, fixed here** (the deep review: S124's is on the 95% line): from 7e's off survival over 1,000 paths of seed 7002 (results-7e-readgap.txt and the bridge7e logs): S124 95.1, S128 69.9, S130 84.3, S366 99.2, S370 73.1, bridge 4+cost 96.0, S162 99.2, S172 99.0, S168 100.0; 0.25 at 95% or more, 0.5 below; S124, on the line (7e read it at 0.5 at look 2 on its 3,000 paths), fixed at the stricter 0.25, its reading at 0.5 reported beside.
- **Paths:** 16,000 (the deep review's), because the thin households' churn may be large (7e's S370 differs on 82 of 1,000). The forward run costs about as much as a solve (7af: runs of 8,000 paths 503 to 551 s mean by arm, solves 255 to 728 s; results/diag7af), so 32,000 was not affordable this morning.
- **Spending** reads as 7af's item 2 (reduce-7af.mjs spendBoth, spendChange): 7af's households all read above -0.7% while both spend (results-7af.txt).

## Prediction

1. **No material harm on every household:** CAND against SHIP, paired on the same 16,000 paths, reads "no material harm" by the regimen's exact rule with Holm across the nine, at each household's registered margin.
2. **Spending while both spend:** no household's spending more than 5% lower under CAND, and the nine's mean not more than 1% lower, each by its 95% interval.
3. **S126's attribution: the repair.** TSOFF against SHIP on 7af's 8,000 paths reads inside -0.25 to +0.25 by its exact 95% interval: the tier state under off adds no gain of the margin's size, so the bundle's 47/0 over PRODR is the tier state undoing the reader's error.

## Falsified if

Item 1: harm on any household (the Holm-adjusted exact p below 0.05 and the point loss at least the household's margin).
Item 2: any household's spending interval wholly below -5%, or the mean's wholly below -1%.
Item 3: TSOFF against SHIP's exact lower end above +0.25 (a gain of its own the margin's size).
INCONCLUSIVE is never a negative.

## Fair-test table

Arm A is SHIP (OFF/PRODUCT/W0.02); arm B is CAND (READER/TS+J/W0.02); PRODR (READER/PRODUCT/W0.02) splits them on every household (reported). Item 3's arms: SHIP (7af's S126 unit) against TSOFF (OFF/TS+J/W0.02, this run).

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | the nine households of 7e's panel 7af did not run, in 7e's order (the deep review's list); item 3: S126 | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | seed 7002's 16,000; item 3: 7af's 8,000 | the same, paired; item 3: TSOFF on 8,000 of the same seed | SAME - item 3's pairing across runs rests on the paths being fixed by seed and count (7af's units equalled 7aa's path by path, results-7af.txt's gate) |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing: lambda is held |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | three worlds, per-world tables | three worlds, one move for every world (TS+J) | TESTED - part of the bundle (item 3: TSOFF has it, SHIP not: the thing item 3 measures) |
| 18 | The spending menu and the tier menu | the product's; the tiers free each year | the same menus; the tier held as part of the state | TESTED - part of the bundle, and item 3's thing |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | no bridge read; the final year exact | the bridge reader; the final year exact | TESTED - part of the bundle; item 3: SAME (both off) |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against its own default, no rival arm |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | 7ag's snapshot; item 3: 7af's S126 SHIP (7af's snapshot) | 7ag's snapshot | SAME for items 1 and 2 (one run). ACCEPTED for item 3 - 7af's SHIP and 7ag's TSOFF come from two snapshots of the same solver code (code id 4d91a3e1d649 in both stamps); audit-s126.mjs differs only by the diag7ag branch (the diag7af mode's panel, output folder and header chosen by the mode name, and bridge 4+cost added to its lookup); TSOFF's ran line, scale, cap and risk-above decision are gated equal to 7af's S126 solves once the tier state is taken out (reduce-7ag.mjs gate) |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | item 1 and 3: survival simulated; item 2: spending while both spend (7af's measure) | the same | SAME |
| 30 | The reducer and its version | reduce-7ag.mjs: requireFairLogs over 7ag's, 7af's and 7aa's stamps, 7aa's and 7af's gates, 7ag's gate, every trace; INCOMPLETE unless all 28 units are done; 60 planted checks, 53 planted faults each caught (mutate-reduce-7ag.py, results-reduce-7ag-mutations.txt); its reading run over the preflight's files | the same | SAME |
| 31 | Paired or not, and the standard error used | item 1 paired, exact one-sided McNemar with Holm across 9, exact interval (stats.mjs outcome), unconditional beside; item 2 paired per-path differences, normal 95%; item 3 paired, exact 95% interval (stats.mjs survivalChange) | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | simulated | simulated | SAME |
| 33 | For timings: what else the machine was running | printed, not read | the same | N/A - no timing is read |
- **All other rows: SAME**

## Decision rule (registered before launch)

- **Item 1** (single look at 0.05): for each household the paired cells of CAND against SHIP on 16,000 paths; the exact
  one-sided McNemar p for harm, Holm-adjusted across the nine; the household's margin as registered above (S124 0.25,
  S128 0.5, S130 0.5, S366 0.25, S370 0.5, bridge 4+cost 0.25, S162 0.25, S172 0.25, S168 0.25); stats.mjs outcome(). HELD
  when all nine read no material harm; FALSIFIED when any reads harm; else INCONCLUSIVE. S124's reading at 0.5 and the
  unconditional interval are printed beside, not read as the item.
- **Item 2:** 7af's rule on the nine: HELD when every household's lower end is above -5% AND the mean's above -1%;
  FALSIFIED when any household's upper end is below -5% OR the mean's below -1%; else INCONCLUSIVE.
- **Item 3:** TSOFF against SHIP on S126, paired on 7af's 8,000 paths, the exact 95% interval: HELD (the repair) when it
  lies inside -0.25 to +0.25; FALSIFIED (a gain of its own) when its lower end is above +0.25; else INCONCLUSIVE. CAND (7af's)
  against TSOFF - the reader on top of the tier state - reported beside.
- **Reported, not items:** every unit's table, survival, year-0 gap and opening (O44), estate, years below target, tier
  changes; the reader's and the tier state's parts on each household; the whole score of CAND against SHIP; for a
  household reading harm, the registered split (7af's rule).
- **NOT SETTLED:** any gate fails (the stamps of 7ag, 7af or 7aa; 7aa's, 7af's or 7ag's gate; a trace).
- **A household left inconclusive** is not re-read on more paths of this test: it goes to a separately registered test
  on fresh paths.
- **Declared choices, not derived:** the nine and their order (7e's); the margins as fixed above, S124's at the stricter;
  item 3's band of 0.25 (the regimen's margin at S126's survival); 5% and 1% for spending; alpha 0.05 single look.

## Decision fed

- **1 HELD, 2 HELD, 3 HELD:** the bundle's recommendation to the maintainer extends to all 25 of 7e's tuning panel
  (grade B, one seed); S126's attribution reads as the repair (grade B), so the bundle, not TS+J with off, stays the
  candidate and O51 closes. The other conditions stand: P, gate 5's budget, O36, O52, held-out confirmation, the tier-2
  steps.
- **3 FALSIFIED:** TS+J has a gain of its own on S126 beside a harm the reader still carries (CAND against TSOFF read
  beside): TS+J with off becomes a candidate beside the bundle; the choice between them goes to the maintainer with both
  options' records (the reader's large gains on share 0.95 and S360 against its masked harm on S126), and the reader's
  harm goes to its O36 or Q fix. O51 stays open with this answer.
- **3 INCONCLUSIVE:** the attribution stays grade C; O51 stays open; no final recommendation between the bundle and TS+J
  with off.
- **1 FALSIFIED:** by the registered split: the reader carries it (S124's pattern repeated without the repair): TS+J with
  off is the next test there; the tier state carries it: no TS+J in the default until P reads; both, or neither alone: a
  diagnosis of that household next.
- **1 INCONCLUSIVE:** the open households go to a registered test on fresh paths (seed 7002's paths beyond 16,000, or
  another tuning seed), sized from this run's churn; the recommendation holds at 16 households until it reads.
- **2 FALSIFIED:** the survivors spend less (trimming): the trade goes to the maintainer (O15), reported with the survival
  gained per point of spending lost.
- **In every branch:** nothing to a default from 7ag itself; no margin, grid or bridge-read default change; no 7u; no seed
  7013; no TS+J+Q build.

## Provenance

- The design: the deep review after 7af (deep-review-log.md, 29 Sep 03:07 UK) - the nine, 16,000 paths, Holm across 9,
  7af's items, S124's margin fixed at registration; item 3 from the plan-auditor's BLOCKING 1 on the review's record
  (review-log.md, 29 Sep), which named TS+J under off on S126 on 7af's paths. Claude's choices, before any run: S124 at the
  stricter margin; every margin fixed from 7e's off survival rather than this run's SHIP; OPEN0 (the review's optional
  arm) left out.
- The build: audit-s126.mjs diag7ag; reduce-7ag.mjs with mutate-reduce-7ag.py; derive-7ag.mjs; batch-7ag.sh;
  preflight-7ag.sh with preflight-parse-7ag.mjs.
- The records: results-7af.txt, results-7e.txt, results-7e-readgap.txt; 7af's runs (results/diag7af, through 7af's gates).

## Derivation script

- `derive: research/solver/derive-7ag.mjs > research/solver/results-derive-7ag.txt sha256 f8e9c4f1af456b8f`
  (item 1 drawn as Poisson counts per household at the records' churn and a planted true loss or gain, read by
  reduce-7ag.mjs items() at the registered margins; item 3 drawn at the repair and at a gain of its own, read by item3()).

## Point and interval

80% intervals, the author's:
- Item 1: the number of households reading no material harm, 8 (6 to 9); harm on any, probability 0.2 (S124 the likeliest).
- Item 2: the nine's mean spending change while both spend 0% (-1% to +1%).
- Item 3: TSOFF against SHIP on S126 +0.03 points (-0.1 to +0.4).

## Credence

The author's probability that each item reads as predicted (HELD): 1, 0.45; 2, 0.75; 3, 0.55. Item 1: on S126, the one
household where the reader harmed and TS+J ran, the bundle was safe; against it, S124 carries the reader's harm at a
0.25 margin, TS+J has never run on any of the nine, and the thin households may churn enough to leave one open (the Power
section). Item 2: every household of 7af read above -0.7%. Item 3: SHIP and CAND both open de-risked on S126 and differ
by 3 paths, so TS+J under off, which also reads no bridge, most likely opens as SHIP does; against it, TS+J's own
continuation gained on four of 7af's households with no reader change at all (share 0.50, 0.70, 0.90, bridge 1: 15/2 to
44/0, results-7af.txt), so a gain of its own on S126 is plausible. The scorecard stands at 0.225 over 95 items
(results-scorecard.txt).

## Power

From results-derive-7ag.txt (20,000 draws a story; the registered margins):
- **Item 1:** no household loses - HELD 1.000 at churn 12 and 50 a household, 0.057 at churn 300 on every household
  (INCONCLUSIVE 0.915, FALSIFIED 0.028), 0.000 at 1,300 (INCONCLUSIVE 0.956, FALSIFIED 0.044); at the records' own churn and
  gains (S124 104 lost/104 saved, S370 272/1,040, bridge 4+cost 8/576, 8/8 elsewhere) HELD 0.780, INCONCLUSIVE 0.216,
  FALSIFIED 0.003. S124 losing 0.57 points (7e's reader rate) at churn 208 - FALSIFIED 0.996; a household at 0.25 losing 0.4
  - FALSIFIED 0.989; losing 0.25 - FALSIFIED 0.519, INCONCLUSIVE 0.445; S128 (0.5) losing 0.75 at churn 300 - FALSIFIED
  0.976. So the design is conclusive against the losses that matter and at the records' churn, and mostly INCONCLUSIVE if
  every household churned hundreds of paths with no loss (the pre-mortem's first): the exact conditional interval widens
  with the discordant count. At churn 300 or more everywhere a false FALSIFIED runs 0.028 to 0.044 (the exact rule with
  Holm at its edge; disclosed).
- **Item 2:** reads by the size of any trim (7af's household standard errors under 0.04 points of a per cent at 8,000
  paths, results-7af.txt).
- **Item 3:** the repair (3 saved, 0 lost, churn 6) - HELD 1.000; a gain of its own (47 saved, 0 lost) - FALSIFIED 0.987,
  INCONCLUSIVE 0.013. Conclusive either way.

## Budget line

The maintainer asked for a default recommendation reached by conclusive tests (28 Sep 22:10 UK); the deep review after 7af
names this as the next step toward it, and item 3 settles the one attribution the recommendation's choice of candidate
rests on. From 7af's measured units (results/diag7af): CAND about 1,280 s at 8,000 paths, SHIP and PRODR about 760 s and
790 s; at 16,000 paths the run doubles: CAND about 1,830 s, SHIP about 1,260 s, PRODR about 1,310 s; 9 of each plus TSOFF
(about 1,280 s) is about 40,000 core-seconds, about 2.8 hours on four cores, plus the smoke run and the launcher's re-run
of derive-7ag.mjs. Each unit is stopped at 5 hours.

## Pre-mortem

- **Most likely:** item 1 INCONCLUSIVE - a thin household (S128, S130, S370) churns hundreds of paths and its exact
  interval reaches past the margin with no loss (the Power section's story A at 300) - no extension of the recommendation
  yet; the open households to a sized follow-up.
- **Second:** harm on S124 carried by the reader, with no repair there (the reader's 7e rate at the stricter 0.25 margin).
- **Third:** item 3 FALSIFIED - TS+J gains on its own on S126, so the reader's S126 harm is masked, not repaired: the
  maintainer's choice between two candidates.
- **Fourth:** a gate refuses (a trace, or TSOFF's settings not 7af's): NOT SETTLED, found before anything is read.
- **The smoke run:** smoke.sh (locked) does not run diag7ag; the preflight through the launcher (all 28 units at 4 points,
  parsed, gated, TSOFF against 7af's preflight S126 units, read to the outcome line) covers it.

## Changes after seeing results

None.
