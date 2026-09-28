# Prediction: diag-7af

- **Run:** `research/solver/batch-7af.sh` - results/diag7af/case0-45.txt and every unit's trace (audit-s126.mjs diag7af), read beside 7aa's (results/diag7aa, through 7aa's gate); reduced by `reduce-7af.mjs` into results-7af.txt
- **Kind:** test
- **Written:** 28 Sept, 23:07 UK, before the run; after 7ae was read (22:35 UK) and the deep review after it (22:52 UK), which designed this test under the maintainer's steer (22:10 UK: "aiming to get towards recommending a new default ... tests should think about how to get to conclusive answers") and his "Line up tasks until morning" (22:06 UK)
- **Seeds:** 7002 tuning (8,000 paths, 7aa's own; every arm on the same paths). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan (the gate requires its decision equal across a household's arms). No held-out seed is touched (7e ran its panel on its own held-out seed; this test does not). **Disclosed (RULES.md Known limits item 18):** two measurements ran this test's mode, each under "none": a build check in the light lane before this prediction existed (runs.log 28 Sep 23:05 UK, "7af build check"; S126's CAND unit at 4 points and 20 paths, in the scratchpad), and the preflight in the main lane as this prediction was written (preflight-7af.sh; results/preflight-7af.log). Their lines were read only to see that the mode prints them and that the reducer parses, gates and reads them; 4 wealth points are not a registered grid and no survival, spending or gap line of either is read before 7af is. derive-7af.mjs reads 7aa's own S360 units, which are 7af's CAND and SHIP on S360, through 7aa's gate (the records' one household with both arms; its figures are in the Power section).
- **Unmasking:** the candidate bundle removes two known errors at once. The reader removes the bridge misread under off (O11, O32: S360's 931 paths saved against 0 lost at the bad bridge, results-7v.txt); the joint tier state removes the per-world tables' held-tier misvaluation (O41; 7ac: its tables beat the product's 16/0 and 21/6 at equal openings, results-7ac.txt). The reader alone harmed S126 and bridge 4 (7e: 14 and 26 paths lost, results-7e.txt), and the deep review after 7ae finds TS+J is what makes the reader safe there (grade C). What tells a harm the bundle carries from one it unmasks: the PRODR arm (the product with the reader) on every bridge household - the reader's part (PRODR against SHIP) and the tier state's part (CAND against PRODR) are reported, and where a household reads harm the registered split names which carries it.
- **Plan section:** PLAN.md "7af"

## Question

Is the candidate default - the bridge reader with the joint tier state (TS+J), at the product's settings and the 0.001 margin - safe against the default as it ships (no bridge read, the product's per-world tables) on a panel of households chosen by rule, and does it deliver the same spending? This is the question a default recommendation for Phase 4 rests on (the deep review after 7ae: TS+J's gains on S126 and bridge 4 were measured against the product with the reader, not the shipping default; against the shipping default they are 3/0 and 6/2, results-7aa.txt and results-7v.txt, grade C).

## Derivation

- **What the records say of the bundle against the shipping default** (the deep review after 7ae, deep-review-log.md 28 Sep 22:52 UK; its figures from uncommitted scripts, grade C): S126 3 saved/0 lost, bridge 4 6/2, S194 45/3, S360 931/0 (+11.6 points; its spending NOT CHECKED - derive-7af.mjs now reads it: +24.9% spending, results-derive-7af.txt). The other twelve households have no record of either TS+J or the bundle.
- **The reader's own record on the panel** (7e, results-7e.txt; 16 points, 1,000 held-out paths, look 2 at 3,000 or 8,000): harm on S126 (14 lost of 3,000) and bridge 4 (26 lost, 1 saved, of 8,000); share 0.95 +18.2, S360 +12.5, wealth x0.5 +0.68; every other panel household 0 lost 0 saved of 1,000 but bridge 6 (1/1). So on most of the panel the reader changes nothing, and any change there is TS+J's.
- **TS+J's churn against the product** (results-7aa.txt, W0.02): 6 paths (bridge 4), 4 (S360 reader), 12 (S360 off) of 8,000 differ without a registered gain or loss. The power below sets the unknown households' churn from these.
- **The spending** (derive-7af.mjs over 7aa's S360 units): CAND delivers 24.9% more spending than SHIP on S360, se 0.77 points of a per cent at 8,000 paths - the spending item is decided by the size of any change, not by noise.
- **Why these households** (the review): 7e's panel in its registered order, the first twelve not already run by 7aa, then the four 7aa ran (S126, bridge 4, S360) and S194 (the review names it; an off-only household with no bridge, where the bundle's change is TS+J's alone). The rest of 7e's panel (S124, S128, S130, S366, S370, bridge 4+cost, S162, S172, S168) waits for a second session: the thin S128 and S130 (story B) are not in this panel, disclosed as the pre-mortem's third.

## Prediction

1. **No material harm on every household:** the candidate against the shipping default, paired on the same 8,000 paths, reads "no material harm" by the regimen's exact rule with Holm across the 16 households.
2. **Spending delivered:** no household's spending is more than 5% lower under the candidate, and the panel mean is not more than 1% lower, each by its 95% interval.

## Falsified if

Item 1: harm on any household (the Holm-adjusted exact p below 0.05 and the point loss at least the household's margin).
Item 2: any household's spending interval wholly below -5%, or the panel mean's wholly below -1%. INCONCLUSIVE is never a
negative.

## Fair-test table

Arm A is SHIP (OFF/PRODUCT/W0.02: no bridge read, the product's per-world tables, the shipping default at the estate weight
default); arm B is CAND (READER/TS+J/W0.02). The bundle is the thing tested: the bridge read and the tables' form both
differ, by design. PRODR (READER/PRODUCT/W0.02) splits them on bridge households, reported.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | 7e's panel in its registered order, the first 12 not run by 7aa, then S126, bridge 4, S360 and S194 (the deep review's list) | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | seed 7002's 8,000 | the same, paired | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing: lambda is held |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | three worlds, per-world tables | three worlds, one move for every world (TS+J) | TESTED - part of the bundle |
| 12 | The estate preference | 0.02 (the default), passed | the same | SAME |
| 13 | The risk tier chosen, consent to change it, risk above | the product's 'auto' rule | the same; the gate requires the decision equal within each household | SAME |
| 18 | The spending menu and the tier menu | the product's; the tiers free each year | the same menus; the tier held as part of the state (the tier state) | TESTED - part of the bundle |
| 19 | The switch margin and switching cost | 0.001; the cost 0.25% of the slice traded | the same | SAME |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | no bridge read; the final year exact | the bridge reader; the final year exact | TESTED - part of the bundle |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against its own default, no rival arm |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | 7af's snapshot | the same | SAME - both arms in one run; the change since 7ae is audit-s126.mjs's diag7af mode alone; every unit 7aa also ran (8) must equal 7aa's, its trace path by path (the reducer's gate) |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | item 1: survival simulated (the floor paid every year and the minimum pot at the end); item 2: spending delivered (the mean spend level over the spending years, a failed path's years 0) | the same | SAME |
| 30 | The reducer and its version | reduce-7af.mjs: requireFairLogs over 7af's and 7aa's stamps, 7aa's own gate, 7af's gate, every trace, the identity with 7aa; INCOMPLETE unless all 46 units are done; 52 planted checks, 43 planted faults each caught (mutate-reduce-7af.py, results-reduce-7af-mutations.txt); its reading run over the preflight's files | the same | SAME |
| 31 | Paired or not, and the standard error used | item 1 paired, the exact one-sided McNemar p with Holm across 16, the exact interval (stats.mjs outcome), the unconditional interval beside; item 2 paired per-path differences, a normal 95% interval | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | simulated | simulated | SAME |
| 33 | For timings: what else the machine was running | printed, not read | the same | N/A - no timing is read |
- **All other rows: SAME**

## Decision rule (registered before launch)

- **Item 1** (single look at 0.05): for each household the paired cells of CAND against SHIP on 8,000 paths (b lost, c
  saved); the exact one-sided McNemar p for harm, Holm-adjusted across the 16; the household's margin 0.25 points where
  SHIP simulates 95% or more, else 0.5 (the regimen's margins); stats.mjs outcome(): no material harm when the exact
  interval's lower end is above minus the margin; harm when the Holm-adjusted p is below 0.05 and the point loss is at
  least the margin; else inconclusive. HELD when all 16 read no material harm; FALSIFIED when any reads harm; else
  INCONCLUSIVE. The unconditional interval (survivalChangeU, guarded) is printed beside each and read by the maintainer's
  earlier rule (reported; it replaces the exact one only by the maintainer's decision).
- **Item 2:** each run's spending = the mean over paths of the mean spend level over the spending years (any year a path of
  either arm spends in; a failed path's later years 0); CAND's relative change against SHIP with a paired 95% interval
  (the per-path differences over SHIP's mean); the panel mean of the 16 relative changes with its 95% interval from the
  per-path means (the households share their paths). HELD when every household's lower end is above -5% AND the mean's
  above -1%; FALSIFIED when any household's upper end is below -5% OR the mean's upper end below -1%; else INCONCLUSIVE.
- **Reported, not items:** every unit's table, survival, year-0 gap and opening (O44's gate on tuning households), estate,
  years below target and tier changes; the reader's part and the tier state's part on each bridge household; the whole
  score of CAND against SHIP (reduce-7aa.mjs wholeLeg at 0.05); for a household reading harm, the registered split: the
  reader carries it where PRODR against SHIP loses the margin or more (point), the tier state where CAND against PRODR
  does, both where both, the tier state by construction on a household without a bridge.
- **NOT SETTLED:** any gate fails (the stamps, 7aa's or 7af's, a unit 7aa ran not equal to 7aa's).
- **A household left inconclusive** is not re-read on more paths of this test (no second look is registered): it goes to a
  separately registered test on fresh paths.
- **Declared choices, not derived:** the 16 households and their order; the margins (the regimen's); 5% and 1% for
  spending; alpha 0.05 single look; no second look.

## Decision fed

- **1 HELD and 2 HELD:** the bundle (the bridge reader with TS+J at 0.001, the estate weight 0.02) goes to the maintainer as
  the recommended candidate default for Phase 4's head-to-head, grade B on 16 tuning households at one seed, with the named
  risks: TS+J's solve time is 2.5 to 3 times the product's (7aa, B; gate 5's budget not yet sized); the rest of 7e's panel
  (nine households, the thin S128 and S130 among them) unrun; confirmation on the held-out panel (7u's kind, seed 7013) is
  the maintainer's to authorise. No default changes in code without the maintainer's decision.
- **1 FALSIFIED:** by the split - the reader carries the harm: TS+J with off is the next test (the reader waits for its O36
  or Q fix); the tier state carries it: no TS+J in the default; the margin design (P) or the root cause of family 1 first
  (the deep review's list); both: both. The harmed household's opening line is read beside (O44).
- **1 INCONCLUSIVE:** each household left open goes to a registered test on fresh paths (seed 7002's paths 8,000 to 15,999
  or another tuning seed), sized from this run's churn; no recommendation until it reads.
- **2 FALSIFIED:** the bundle delivers less spending where it saves survival: the trade is the maintainer's to price (the
  dislike-of-cuts setting, O15), reported with the survival gained per point of spending lost; no recommendation until then.
- **In every branch:** nothing to a default from 7af itself; no margin, grid or bridge-read default change; no 7u; no seed
  7013; no TS+J+Q build before the reader's cells are read (the deep review's holds).

## Provenance

- The design: the deep review after 7ae (deep-review-log.md, 28 Sep 22:52 UK), under the maintainer's steer (the ledger's
  22:10 row) and overnight instruction (22:06 row). Two narrowings, Claude's, before any run: a single look at 0.05 with no
  second look (a household left open goes to its own registered test, so no error is spent on a second look here); the
  reused households re-run in full rather than read from 7aa's files, their equality with 7aa's gated.
- The build: audit-s126.mjs diag7af; reduce-7af.mjs with mutate-reduce-7af.py; derive-7af.mjs; batch-7af.sh;
  preflight-7af.sh with preflight-parse-7af.mjs.
- The records: results-7aa.txt, results-7e.txt, results-7v.txt, results-derive-7af.txt; 7aa's runs (results/diag7aa,
  through 7aa's gate).

## Derivation script

- `derive: research/solver/derive-7af.mjs > research/solver/results-derive-7af.txt sha256 f49f5358439f91c6`
  (item 1 drawn as Poisson counts per household at the records' churn and a planted true loss, read by reduce-7af.mjs
  items(); item 2's size and standard error from 7aa's S360 units, through 7aa's gate).

## Point and interval

80% intervals, the author's:
- Item 1: the number of households reading no material harm, 15 (13 to 16); harm on any, probability 0.25.
- Item 2: the panel mean's spending change +2% (-0.5% to +5%), S360 its largest (+25%, derive-7af.mjs).

## Credence

The author's probability that each item reads as predicted (HELD): 1, 0.55; 2, 0.75. Item 1: on the four households with
records the bundle does not lose (3/0, 6/2, 45/3, 931/0), and on most of the rest the reader changes nothing; against it,
TS+J has never run on twelve of these households, its opening flips with the grid (7ad), and one harm or one household
left open among 16 is enough to lose HELD. Item 2: TS+J and the reader save paths, and saved paths spend; a household where
TS+J trims harder to survive would lower it. The scorecard stands at 0.227 over 93 items against its 0.20 target
(results-scorecard.txt); 7ae scored 0.357.

## Power

From results-derive-7af.txt (20,000 draws a story; the margin 0.25 on every household, conservative):
- **Item 1:** no household loses - HELD 1.000 at churn 6 and 12, 0.962 at churn 20, 0.027 at churn 50 (INCONCLUSIVE 0.944);
  one household loses 0.4 points - FALSIFIED 0.974 at churn 12, 0.954 at churn 20; loses 0.25 - FALSIFIED 0.531,
  INCONCLUSIVE 0.389; loses 0.2 - HELD 0.275, FALSIFIED 0.244, INCONCLUSIVE 0.481. So the design is conclusive (0.95 or more)
  under the leading stories at the records' churn (up to 12) and against a loss of 0.4; a loss near the margin, or churn
  near 50 paths a household, mostly reads INCONCLUSIVE (the pre-mortem's second).
- **Item 2:** S360's spending +24.9% with a standard error of 0.77 points of a per cent at 8,000 paths: a household's
  interval is about 1.5 points wide, so the 5% line is read by the change's size.
- **Time:** from 7aa's measured units at W0.02 under four-way load (results/diag7aa: TS+J solves 737 to 1,036 s, the
  product's 275 to 358 s; runs of 8,000 paths 632 to 686 s, S360's shorter): CAND about 1,600 s, SHIP and PRODR about 950 s
  each; 16 + 16 + 14 units about 54,000 core-seconds, about 3.7 hours on four cores, plus the smoke run and the launcher's
  re-run of derive-7af.mjs (about 5 minutes). Each unit is stopped at 5 hours. The preflight's unit times are printed beside.

## Budget line

The maintainer asked for a default recommendation reached by conclusive tests (22:10 UK) and for the night's queue (22:06
UK); the deep review after 7ae names this as the test that moves furthest toward it. About 3.7 hours, 15 core-hours.

## Pre-mortem

- **Most likely:** item 1 HELD on most households with one or two left INCONCLUSIVE (TS+J's churn on an unrun household above
  20 paths, or a small loss) - no recommendation yet, the open households to a sized follow-up.
- **Second:** a harm on a household where TS+J opens de-risked and the de-risk costs survival in the good world (O44's
  knife edge; 7ad's grid-flipped openings) - the split names the tier state; read with the opening line.
- **Third:** the panel misses the households most at risk (the thin S128 and S130, O5; S366 and S370 with 8-year bridges):
  a HELD here is grade B for these 16 only; the nine others are the next session's.
- **Fourth:** a unit 7aa ran is not equal to 7aa's (the code changed a solve): NOT SETTLED, found before anything is read.
- **Fifth:** spending falls on a household where the bundle saves survival by trimming (item 2 FALSIFIED with item 1 HELD):
  the trade goes to the maintainer.
- **The smoke run:** smoke.sh (locked) does not run diag7af; the preflight through the launcher (all 46 units at 4 points,
  parsed, gated, identity-checked against 7aa's preflight and read to the outcome line) covers it.

## Changes after seeing results

None.
