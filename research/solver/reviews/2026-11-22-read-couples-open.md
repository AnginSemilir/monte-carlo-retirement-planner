# Review at the read: the guard's own units, the registered test (`registrations/couples-open.md`, seed 7026)

**Subject:** the registered read and its write-up. The read is `results-couples-open.txt`, written by
`REG=1 node research/solver/reduce-couples-open.mjs --registered` at 23:37 UK on 22 Nov. The write-up is
`reports/2026-11-22-couples-open-read.md` as it stood at 23:54 UTC, after the coordinator's two corrections (lines 65 to 66,
and the MPAA bullet at lines 82 to 86).

**What I read** (git blobs, first 12):
- the registration `registrations/couples-open.md` d157f9f720f9;
- the write-up b50191577dfb and the results file be3ee4820ba9;
- `reduce-couples-open.mjs` 6a4a5735fe55, `audit-couples-open.mjs` 8ccaa3118266, `couples-open-panel.mjs` d39c677d4f37 and
  `batch-couples-open.sh` c4f7c5df9c75;
- the functions they import: `reduce-share-rules.mjs` b46fa5187e99 `harmExact`, `reduce-couples.mjs` cae05c5a8e75 `harmOf`,
  `reduce-phase4.mjs` ac319aad1f44 `byPath`, `survivalItem` and `spendingItem`, `reduce-household-hsp.mjs` 153cbfeebc48
  `keptSpend`, `reduce-household.mjs` 2a762db28f98 `cells`, and `fair-gate.mjs` c6b3e87e1643 `requireFairLogs`;
- `run-from-snapshot.sh` cf7ab99bb4ec and `src/couplesSwitch.js` b33f855de049 `coupleSolverOn`;
- `research/engine.mjs` l.1789 to 1806, `incomeFloor` (built, not tracked);
- the panel and paths files: `couples-open-registered-panel.json` 2842b623a332 and `couples-open-paths.json` 503a06846969;
- the results files: the panel's d2d3e7e33230, the sizing's b851d4da1b5c, the rehearsal's 09809867d079 and the addendum's
  0f8c68f51ab3;
- the rehearsal's write-up 3fb5df48c255 and the design review's second look f201c810d5dd;
- the launch log, the launcher's snapshot `/tmp/solver-snap-73eiSu`, the 44 records and 44 unit logs in
  `results/couples-open-run`, and the main tree's reflog.

**What I ran** (none of it decides anything):
- **The read again**, into the scratchpad. It is byte for byte the results file (19,668 bytes, `cmp`).
- **`reduce-couples-open.mjs --planted`:** `PLANTED: ALL PASS (12)`, with all 21 of the gate's refusals firing.
- **An independent recomputation** from the 44 records' arrays, using none of the reducer's helpers. It covers every unit's
  two survivals, lost and saved paths, spending on the paths both keep and over all paths, the mean and capped pot, and
  lifetime tax in percent and pounds. It also covers the four classes' pooled survival intervals. All are as printed.
- **A direct paired interval on the kept paths.** It agrees in sign with every M1 naming (S037-S75 `-0.1471` to `-0.0590`,
  as printed).
- **The snapshot against the launch commit.** Each of the 2,834 files of 1632296f's `src/`, `research/` (results left out)
  and `package.json` has the same blob in the snapshot. Its two extra files are the gitignored built `research/engine.mjs`
  and `research/simplePlan.mjs`; the built engine is byte for byte the main tree's.

Verdict: FAIL

The read stands. The gate is fair, the registered rule ran as registered, every figure in the write-up is the read's own,
and the outcome follows. The FAIL is one claim in the write-up (finding 1), a one-sentence fix.

## What holds

1. **The gate, as the registration sets it out.**
   - **The stamps.** All 44 unit logs carry `stamp: code 36e4d2a860b2 audit f9b56fb0b6a1 prediction
     research/solver/registrations/couples-open.md sha d157f9f720f94ac95e8a205eff19e13f03cd0e74`. That sha is
     `git hash-object` of the registration now, and `requireFairLogs` passed.
   - **The records.** Each of the 44 records is in mode `registered`, at seed 7026, 25,000 paths (`couples-open-paths.json`
     N 25000), 45 points, W 0.02 and Node v22.23.4. Each carries APP `ef459a5c8ccb` and ROUTE `35ee3a2dc6ad`, the
     registration's hashes. Each runs ROUTE on `solvedContext` on the household route, with the guard off for its
     variant's reason (G8Y75's `uneven`, as `WANT` has it).
   - **No restart.** The launch log has no `unit N exited` line. No unit log holds `resumed` or `starts again`, and `parts/`
     is empty.
   - **The tree.** The launcher ran from the main tree with no uncommitted file (its snapshot line has no "uncommitted
     file(s)"). The main tree's HEAD stayed at 1632296f until 23:39:48 UTC (reflog), after the read at 23:37:35. So the run
     and the read were on one tree at the launch commit, as the registration's launch line asks.
   - **What differs between the arms.** Each arm's engine inputs hash the same on the 33 units where the MPAA ages agree, and
     differ on exactly the 11 where they differ (the records' `inputs`). So the arms differ only in the policy and in the
     MPAA ages the registration puts on ROUTE's context.
2. **The rule.**
   - Parts 1 to 3 ran on each class's own units: `harmExact` on ROUTE against APP in whole paths, `survivalItem` by path, and
     `keptSpend`'s point against `-0.05%`. M1 by unit (net paths above nought and `keptSpend`'s upper end below nought) and
     the registered OUTCOME line follow from it.
   - **The power.** The largest realised discordance is `3,769` of `25,000` (S037-G12 and G12R). Its upper bound is about
     15.5%, under the registration's `16.30%`. By hand, S037-G12's threshold is 0.25 + 1.645 x 0.249 = 0.66 points, the
     printed 165 paths.
3. **The write-up's figures.** Every figure and range in it is printed in `results-couples-open.txt`, the panel's or the
     sizing's, and every count checks:
     - at most 6 paths lost, thresholds 147 to 165, saves 2,551 to 3,769;
     - both arms' survival ranges, M1's nine units and their ranges, and the other 33 units' ranges;
     - lifetime tax lower on 40 of 44 and higher on the four named, the MPAA ages' 33 and 11, and the times;
     - the pilot's 8 of S037's 11 (`results-couples-open-sizing.txt` line 48);
     - S037-G12R as S037-G12's plan: the same income (Myself, from 68, `£15,000`, other taxable), target 33,300 and table
       digest.
4. **The corrected MPAA bullet** is right on the code and the records. `mpaaOf` reads each context's owners' `mpaaAge`,
   and a blank is `NaN`, none set (`src/App.jsx` l.1783).
5. **The read goes to the maintainer first**, by the registration's M1 clause (an OPENS with units named), and the
   write-up says so (lines 37 to 39 and 109 to 110).

## Findings

1. **BLOCKING. The causal claim corrected at line 65 still stands at the write-up's close.** Line 124 reads: "one of them
   (S037) trades spending for survival. Whether another couple of S037's kind would make the same trade is not shown."
   - **The claim.** To trade spending for survival is to give the spending up to buy the survival. The read shows no such
     link, and line 70 says "The read does not show why."
   - **S037's own records go against it** (`results-couples-open.txt` lines 8, 50 and 68). Two of its units keep as many
     more paths as the named units do while spending more on the paths both keep:
     - S037-Y75: `+0.5293%`, 3,695 paths net. That is more paths than two named units keep (Y90's 3,356, Y100's 3,392).
     - S037-G12P: `+2.3500%`, 3,207 paths net.
   - **Where the named units spend less, they leave a larger capped pot**, `£67,514` to `£187,386` a path. So what is not
     spent is at least partly in the estate, and the read cannot separate that from survival.
   - **Fix.** State the co-occurrence, as lines 65 and 66 now do. For example: "one of them (S037) keeps far more paths while
     spending less on the paths both keep on nine of its eleven units; whether another couple of S037's kind would show the
     same is not shown."
   - **Line 65 too.** Its clause "spends less on the paths both keep, by a tenth of a percent to two and a half percent" is
     said of S037 but is the nine named units' range. It should say nine of its eleven units: Y75 and G12P spend more, as
     lines 61 to 63 already say.

2. **MINOR. Line 69's "The dress rehearsal showed the same pattern on S025's units" cites a write-up, not a results file
   (CHECKLIST 6).** The rehearsal's results also show the pattern more weakly on the household route, where the read's
   classes run.
   - **The records.** See `results-couples-open-rehearsal.txt` lines 7 to 9, 23, 24, 35 and 43 to 45, and the addendum's
     line 8. On S025's ten household-route units, ROUTE keeps far more paths and leaves a larger pot on every one.
   - **But on the paths both keep it spends less on five:** E95 `-0.1195%`, E100 `-0.2341%`, S75 `-0.3243%`, G8 `-0.8892%`
     and G8Y75 `-1.3855%`.
   - **It spends more or the same on the other five:** Y75 `+1.5257%`, Y90 `+1.3604%`, Y100 `+0.2300%`, G12 `+0.0262%` and
     the addendum's G12P `+2.5398%`.
   - **No interval.** The rehearsal printed none for these, so none was shown beyond noise. The addendum's M1 line (its
     line 44) names only S025's today's-route units.
   - **The report's count.** "Seven of S025's eleven" (its line 48) includes RY75 and RWY75, which are on today's route.
   - **Fix.** Cite the results file and say what it shows: five of S025's ten household-route units lower on the paths both
     keep, with no interval printed.

3. **MINOR. Two descriptions give the plans as typed, not as run.**
   - **(a) The rent (line 20).** G's "the first person's `£15,000` a year of rent from now" is the start as typed:
     - The engine counts an income from its owner's retirement at the earliest (`research/engine.mjs` l.1789 to 1806,
       `incomeFloor`).
     - So the rent on S199-G12R (typed from 55) and S279-G12R (typed from 45) runs from their retirement at 60, in plan
       years 5 and 15.
     - It runs from now only on S119 (61, retired at 60). S037-G12R's rent runs from 68 and is the DB pension's plan.
     - The design review's second look records the same (What holds 1, MINOR 1), and lines 87 to 89 are right.
     - Line 20 should say "from retirement at the earliest (from now on S119)". As it stands it contradicts the inference
       list's "other taxable income paid before the household can draw a pension" (line 119).
   - **(b) The ages (line 23).** "68/65, 61/58, 55/52 and 45/42 at the start" are the ages "as the library holds it", in the
     panel file's words. The S and G units start at other ages (`results-couples-open-registered-panel.txt`):
     - S75 at 68/68, 61/61, 55/55 and 45/45;
     - G12 at 68/56, 61/49, 55/43 and 45/33.

4. **MINOR. The inference list names Y's case at a wide gap but not E's.** The registration's list, and so the write-up's,
   names "Y at an age gap over three years without other income" but not the same case for E.
   - **What E's opening reaches.** With E open (`ELDER_UP_TO` to all of it), a couple more than three years apart without
     other taxable income whose elder holds more than 90% runs the solver. The guard reads `holds` before the gap with
     income, which it checks only where the holdings hold (`src/couplesSwitch.js` l.119 to 129).
   - **What E read.** Every E unit sits at its couple's three-year library gap: 68/65, 61/58, 55/52 and 45/42 (the panel
     file).
   - **Fix.** The D-line's inference list should add it.
   - **The younger cohort.** The write-up also folds the registration's "the younger cohort (the dress rehearsal and its
     addendum alone)" into its item on retiring before 58. The D-line should keep it as its own line, as the registration
     does.
