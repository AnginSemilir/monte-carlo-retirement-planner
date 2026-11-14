# Review at the read: the solver choosing a couple's share, stage A (`SHARE-CHOOSE.md`; D102; EXPLORATORY, seed 7002), read 14 Nov

Subject: the read of D102's stage A, `results-share-choose.txt` (outcome THE FORECAST MISSES), the figures written after it
(`share-choose-beside.mjs`, `results-share-choose-beside.txt`, deciding nothing) and the write-up to the maintainer
(`reports/2026-11-14-share-choose-read.md`), against the rule committed in 4380aa81, the code and the stored arrays.

Read (blobs; the tree at f82fec86; the two results files, the beside script and the report untracked): `SHARE-CHOOSE.md`
a5575167, `audit-share-choose.mjs` 7106e04f, `reduce-share-choose.mjs` 9d53ead2, `batch-share-choose.sh` 8af2dbae,
`share-choose-beside.mjs` ec0c8783, `results-share-choose.txt` f9f06203, `results-share-choose-beside.txt` b7a76dec,
`reports/2026-11-14-share-choose-read.md` 166f012c; `audit-share-ensemble.mjs` cc56ad64 (`planOfUnit`),
`audit-couples-share.mjs` ac476126 (`settingsOf`, `COUPLES_CANDIDATE`), `stats.mjs` 7cf309da (`survivalChangeU`,
`pooledSummed`), `fair-gate.mjs` 4d4a2040, `run-from-snapshot.sh` cf7ab99b, `runs.log` l.367-368, `.githooks/pre-commit`;
`src/solver/couple.js` at the launch commit e1bb437b (`singlePlanFor` l.94-105, the joint score l.383 and l.515,
`shareBridge` l.520, `chooseJoint` l.625-679) and at HEAD 0eb988c1; `src/solver/solve.js` fb875426 (l.597-608); the deep
review of stage C 08e8a100 (l.164-239) and the share ensemble's read review 4adbe636; the 14 `case<k>.txt` logs and 14
`<id>.json.gz` units in `results/share-choose-7002/`; and the `ran` field alone of stage C's
`results/share-c-run/{S043-gain,S183-spa67,S389-gain,S265-spa67}-cands.json.gz` (a run already read). Nothing of
`results/other-order-7002/`, seed 7021, `d4-backup` or `d4b-backup` was opened; no solve or path was run.

Ran (read-only, one process at low priority beside OTHER-ORDER; my scripts in the session scratchpad's `sc/`):
`node reduce-share-choose.mjs` again (`cmp`-identical to the results file) and `--planted` (13 of 13 pass);
`node share-choose-beside.mjs` again (`cmp`-identical); `recompute.mjs`, my own decode of the arrays with its own Newcombe
interval; `fields.mjs` (each arm's T, floor, share and settings line); `vs-stagec.mjs` (settings lines against stage C's);
`kinds.mjs` (discordant paths by failure kind); `times.mjs`, `times2.mjs` (the stored clocks); `band.mjs`, `estate.mjs`,
`money.mjs`, `money2.mjs` (figures beside, below).

Verdict: FAIL

The read stands: made once by the rule as committed, the gate fair, every figure reproduced from the arrays, the outcome
THE FORECAST MISSES. The write-up fails on one figure the maintainer's choice turns on (finding 1); the rest are MINOR.

## What was checked and holds

- **Read once, by the rule as committed.** The fourteen `STAMP_FILES` have the same blob at 4380aa81 and in the tree (no
  commit since touches them); `stampFilesHash()` prints 13446e2e2128. Every unit's log opens `stamp: code b7cd77e5ebec audit
  13446e2e2128 prediction none` and holds its done line, with no error line; launched through the launcher (`runs.log`
  l.367, 17:37 UK, from 4380aa81). The last unit was written 21:51:34 UK, the results file 21:52:23, the beside script and its
  output 21:54:50 and 21:54:53, the report 21:56:40. Since the launch the code moved in `src/solver/couple.js` alone (D100's
  estate weight and D97 (2)'s tie rule, both off in code); the reducer's design (`sharesOf`, `shareFor`, `meansOf` on today's
  code) equals each unit's to the bit, or its gate would have refused. The reducer re-run is `cmp`-identical; `--planted`
  passes all 13 (each outcome, (i) by unit and cross-fitted, (iv), the said-first line, the means on the grid, the gate's
  refusals).
- **The gate is fair, and the arms differ only in the share.** Every arm of a unit has one T, one household floor and one
  `paths` array (audit l.107). The solver arms' settings lines (`settingsOf`, both people) differ only in each person's
  `minPot`, the share's cut of the floor, and on the means arm in the floor level's sixth place (0.799989 against 0.8, the
  target rounded at a share off the tenths). The four new units' lines at the pots' share are stage C's CANDS lines field for
  field; the ten repeat the ensemble's arms path for path in survival and estate (22 of 22, the reducer's last line), whose
  lines the ensemble's reviewer matched to stage C's. No unit's plan carries a `solver` field, so neither `tierCeilingPart`
  nor the speed mode reaches them. `runPath` agreed with `E.runTrial` on each arm's first 200 paths (the audit exits
  otherwise). The gate's candidate check tests a constant (the ensemble's reviewer, finding 7); the settings lines stand in.
- **The rule's arithmetic and outcome follow `SHARE-CHOOSE.md`.** (i) by unit: the reducer bars any share whose interval's
  lower end is above 0.5, where the document says the best share's; the same two units either way (S129-75, the best 0.75 at
  +2.950, lower end +2.451, with 0.7 and 0.8 over the bar too; S183-spa67, 0.6 at +2.675, lower end +2.182, with 0.5 over
  too). (i) pooled: each unit's best on one half scored against the pick on the other, both ways, 28 tables summed: +0.464
  (+0.396 to +0.534), its point over 0.2. (ii) as written. (iii)'s said-first condition is the document's: MEANS ahead by
  more than 0.2 with its lower end above 0 is the pick less MEANS below -0.2 with its upper end below 0 (-0.359 and -0.280;
  the interval is symmetric under swapping the arms). (iv): both light passes fail; the 6-point pass also fails its pooled
  bar (-0.241, below -0.2), which the write-up's table does not say. The verdict order is the document's; (i) decides it.
- **Recomputed from the arrays** with my own decode and interval: every unit's survival at every share (to rounding in the
  second place), every pick, (i)'s two units, (i) pooled +0.464 (+0.396 to +0.534), (ii) +1.089 (+0.970 to +1.211) with
  S129-75 and S183-spa67, (iii) -0.359 (-0.439 to -0.280), (iv) -0.145 (-0.184 to -0.106) and -0.241 (-0.284 to -0.200)
  with their units, Kendall's tau 0.657; the beside file's MEANS less the pots' share +1.448 (+1.331 to +1.568) and each
  unit's line; the simulation's pick +1.548 (+1.420 to +1.679), +0.081 (+0.003 to +0.159) and +0.498 (+0.418 to +0.580),
  with its picks.
- **The beside script is fair.** It reads the same 14 units and pairs on their stored 4,000 paths; it takes the means' arm as
  the reducer does (`U.arms[U.means.arm]`: the grid's arm where the rounded means fall on the grid, S265-90, S019-90 and
  S043-gain, the means arm otherwise); its simulation pick is the reducer's `bestOn` on paths 0 to 999 with the tie to the
  pots' share, scored on paths 1,000 to 3,999. Re-run, `cmp`-identical.
- **The write-up's figures**: every figure in its tables and bullets is in one of the two files and matches it, and the
  lead's two examples (S129-90 at 0.5; S183-spa67 at 0.6 and 0.7) are the file's.

## Findings

1. **BLOCKING. The pick by simulation is costed at its solves alone; with the paths it must simulate before it can choose,
   it costs more than twice that.**
   - What the times hold: `times.full[x]` is the clock around `solveAt` alone (audit l.124); a light time is the light
     solve and one `chooseJoint` (l.100-101); the engine's runs are timed apart, `engineSecs` (l.109, l.118); the reducer's
     ratios read `times` only (reducer l.104). So x4.93, x2.92 and x1.76 are solves, as the write-up's first section says.
   - A pick by simulation also runs every share's solved plan on 1,000 paths. The units store that cost: the engine's 4,000
     paths at the pots' share take x4.68 to x7.71 a full solve (median x5.37, `times.mjs`). The grid's solves plus 1,000 paths
     a share (each arm's `engineSecs` times 1000/4200, the audit's 200 `E.runTrial` checks taken out) come to a median x11.42
     one solve (x7.92 to x18.43; the paths alone x6.42; `band.mjs`). Crediting the chosen share's 1,000 paths to the
     headline's own run, x10.04 (x7.26 to x16.92; `times2.mjs`).
   - The write-up: "about five times a couple's solve today (x4.93, the solves alone)" (report l.28); "A choice by simulation
     also needs each split's simulated paths on top of these solves", unsized (l.93); and in the choice itself, "Against it:
     about five times a couple's solve today before any speed work. D103's target would need four-fifths of that cut"
     (l.123-124). By the run's own clocks the option costs ten to eleven times, and D103's x1.25 needs about nine-tenths cut
     (on the solves alone three-quarters, not four-fifths).
   - The clocks are a guide: four units at a time, and the builds of D100 and D97 (2) were committed beside the batch (18:11
     to 19:04 UK), the pre-commit hook running the fast tier. That holds for the x4.93 too; both come from the same clocks.
   - The fix is a figure: option 2's cost with its paths. Corrected, the time gap the recommendation rests on widens; the
     recommendation's direction does not change.

2. **MINOR. The share moves each person's minimum pot, and that is where S129-75's miss and both of the means' losses sit.**
   - `singlePlanFor` cuts the household's minimum pot by the share, with the spending (couple.js e1bb437b l.104). The
     settings lines show it: on S129-75 (the household's floor £1,080,000, 45% of its £2,400,000 of pots, £1,800,000 the
     first person's) the first person must end with £972,000 at 0.9 and £810,000 at 0.75, the second £108,000 and £270,000.
   - The discordant paths by kind (`kinds.mjs`): S129-75, the pick 0.9 against 0.75: 118 lost, 113 of them below the minimum
     pot in the plan's last year and 5 mid-plan, none saved. S183-spa67, 0.7 against 0.6: 94 lost mid-plan and 17 at the
     minimum pot, 4 saved at it. The means against today's: S129-90 (0.86 against 0.9), 55 lost and 17 saved, every one at the
     minimum pot in the last year; S129-75 (0.73 against 0.75), 11 lost and 2 saved, the same. Over every solver arm, 9,444
     of 18,484 failures are the last year's minimum pot; no other failure falls in the last year.
   - So "chose a split that ran out of money clearly more often" (report l.11-12) holds for S183-spa67; S129-75's lost paths
     end the plan below a £1,080,000 minimum pot. "Whether the means' split's two losses are real" (l.104-105) offers the
     solve's error for S129-75 and nothing for S129-90; both are the floor's cut (at 0.86 S129-90's second person must end
     with £151,200 on £240,000 of pots, against £108,000 at 0.9). The lead's own example is the floor too: S129-90's 0.018 at
     0.5 is a second person asked to end with £540,000 on £240,000 of pots.
   - The ensemble's reviewer asked that a write-up say the share moves the spending and the floor together, and that splitting
     each is a separate choice for the option's design (its finding 3). This one does not, and the option it recommends
     would cut the floor by the means' share as these arms did.

3. **MINOR. The forecast is not "the chance that each half lasts on its own"; the run kept only its total.**
   - At year 0 the forecast is the joint move's score: the product of the two tables' own survival chances, each to its own
     share of the floor (as if the halves were independent, where they share one market), plus the joint estate term, less
     this year's and the years ahead's cuts and any switch charge (couple.js e1bb437b l.383 and l.515, l.665). The estate term
     is `A.wB`, 0.02 over the first person's own opening pots (solve.js fb875426 l.604-606), times the two estates, each
     capped at four times its own person's opening pots (l.608). In a year where either table reads the bridge, the two are
     read with their accessible money shared (`shareBridge`, l.520), so not always each on its own money.
   - The registration says so ("plus the estate and cut terms"). The audit keeps the score alone (`forecastOf`, audit
     l.74), so the parts cannot be split. Seven units have a forecast above 1 (to 1.059400 on S015-db): the estate term is
     several hundredths, the size of the differences the forecast ranks.
   - A proxy, mine and a lead only (`estate.mjs`): the estate term at the engine's own estates (capped at four times the
     household's pots) moves little across shares; on S183-spa67, +0.009 from 0.6 to 0.7 against survival's -0.027. That
     fits the floor-and-own-money reading better than the estate term, and shows neither.
   - The lead stays a lead, but report l.100 ("So the forecast is the chance that each half lasts on its own") should say
     what the score holds.

4. **MINOR. Three-quarters of the means' gain over today's split is the band's removal; its own part rests on the ten units
   chosen for it.**
   - Every unit has an arm at 0.6, the pots' fraction on the eight 60/40 units where D99's 40%-to-60% band gives 0.5; on the
     other six the pots' fraction is the rule's share. So the pots' fraction without the band reads off the stored arms
     (`band.mjs`): less today's split +1.114 (+1.016 to +1.215) pooled; the means less it +0.334 (+0.253 to +0.416).
   - On the four plain couples, the only units new to the share, the means gain +0.881 (+0.687 to +1.083) over today's and
     equal the band's removal (S043-gain the same arm; S183-spa67 -0.025, S389-gain +0.100, S265-spa67 +0.025, each within
     noise), level with the simulation's pick (that pick less the means -0.125, -0.301 to +0.049; on the ten, +0.163, +0.079
     to +0.249).
   - The means' gain beyond the band is the ensemble's ten: S265-90 +2.800, S019-90 +1.225, S237-90 +0.675 and S129-90
     -0.950; the DB units +0.225 to +0.425; S211-75pdb -0.175 and S129-75 -0.225. The deep review chose those units for
     their gap between the pots and the means (08e8a100 l.172-185, l.209-214), and the ensemble had run them on these same
     paths (22 arms identical path for path). The 2.5% rate predates the ensemble (l.173), so nothing was tuned here, but on
     those units the means' fit is what led to the option, not a test of it.
   - The write-up says ten were picked "because the split matters there" (l.106-107). It does not say that most of the gain
     is any 60/40 couple at 0.6, nor that the means' own part was measured only where the means were expected to help. Its
     registered test needs units where the means and the band's removal part (the ensemble's reviewer, finding 2).

5. **MINOR. The write-up gives each option's survival alone; the gain is survival's, and the pot falls on half the couples.**
   - The means' share against today's, paired on the 4,000 paths (`money.mjs`): spending delivered up on 11 of 14, by 0.20%
     to 0.99%, and lower beyond noise on S211-db (-0.98%), S129-90 and S019-90; the mean pot left lower beyond noise on 7 of
     14, by up to £567,268 on S211-db (se £17,332), £509,667 on S129-db and £271,655 on S043-gain; lifetime tax higher on 6.
   - On the same last 3,000 paths for each design (`money2.mjs`): the mean pot lower beyond noise on 7 of 14 under the means,
     6 under the simulation's pick and 5 under the forecast's, its mean change over units -3.60%, -2.37% and -1.55%;
     spending's +0.32%, +0.05% and -0.18%.
   - The product question puts survival first, then spending and the estate, and the estate is the whole pot (D64). A
     recommendation to change how a couple's share is set gives both beside survival. The results file prints them for the
     forecast's pick alone, and the beside script for no option.

## What a fair write-up must say

- The outcome by the rule, THE FORECAST MISSES, with its figures, as it does.
- Option 2's cost with its paths: ten to eleven times a couple's solve today by the run's own clocks, a guide (finding 1).
- That the share cuts each person's minimum pot with the spending; that S129-75's miss is the floor at the plan's end (113
  of 118 paths) and S183-spa67's is mid-plan; that both of the means' losses are the floor at the end (finding 2).
- The forecast's terms as the code has them, the lead as a lead (finding 3).
- That most of the means' gain is a 60/40 couple at 0.6 (+1.114 of +1.448), that on the four new couples the means equal
  that and the simulation's pick, and that its gain beyond the band was measured only on units chosen for it (finding 4).
- What each option does to spending and the pot (finding 5).
