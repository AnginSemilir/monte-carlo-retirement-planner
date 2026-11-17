# Review at the read: a wider joint move for couples (JOINT-WIDE, D111 (2); EXPLORATORY, seed 7002), read at a7aed0f6

Subject: the read committed at a7aed0f6. It covers:
- `results-joint-wide.txt`, the reducer's output whole (OUTCOME: FAILS);
- its write-up, `reports/2026-11-17-joint-wide-read.md`;
- STATE.md's COUPLE-SHARE row as `state.mjs` prints it;
- the result as `QUESTIONS-2026-11-17.md` section 1 carries it to the external review.

Read (blobs at a7aed0f6):
- the rule and its files: `JOINT-WIDE.md` b7b354fffcd2, `audit-joint-wide.mjs` 4ee60e220c59, `reduce-joint-wide.mjs`
  1a77cf6d8939, `batch-joint-wide.sh` 3e2250fb8a67; `joint-wide-resume.mjs` 6f9d02b4552a with
  `results-joint-wide-resume.txt` 309fc6475792; `results-joint-wide-pilot.txt` a50b8a1e61ad;
- the read: `results-joint-wide.txt` 01a90917adfa, `reports/2026-11-17-joint-wide-read.md` 627f995dad74,
  `QUESTIONS-2026-11-17.md` 737a6389c484, `STATE.md` 6d2fa7d5a2cc, `state.mjs` 54c84131e69e;
- the code the figures rest on: `src/solver/couple.js` 7a12a4340749 (`chooseJoint`, `rankFor`, `holdMove`, `lookPick`),
  `audit-phase4.mjs` 5ace83959b96 (`runPath`), `stats.mjs` 7cf309da0151 (`survivalChangeU`, `pooledSummed`,
  `survivalChange`); `results-share-rules.txt` 88ee84958c9b, for the write-up's comparison with it;
- the 28 units in `results/joint-wide-7002/` (each `<id>.json.gz` and `caseN.txt`), `results/joint-wide-launch-1.log` to
  `-4.log`, `runs.log`. Not opened: `results/joint-wide-7002-stopped/`.

Ran (no solve, no path, no batch):
- `node research/solver/reduce-joint-wide.mjs`: `results-joint-wide.txt` byte for byte, exit 0, the gate fair.
- `node research/solver/reduce-joint-wide.mjs --planted`: all 18 planted checks pass.
- `code-id.mjs` and `stampFilesHash()` at a7aed0f6: `603eeb595679` and `109137137d97`, the units' stamps.
- `check-state.mjs`: passes. `state.mjs` prints the COUPLE-SHARE row as committed.
- My own recomputation from the units' arrays and chunk records, written apart from the reducer. It uses `stats.mjs` only for
  the interval functions.
- Not run again: the resume check. A UI gate was running on the machine. I read its code and its committed output.

Verdict: FAIL

The outcome stands. FAILS is read by the rule as committed, and every figure in the results file reproduces from the
arrays. The FAIL is the write-up's: three of its claims are unsupported or contradicted by the run's own figures (findings 1
to 3), and two of them are carried into the handover to the external review. None of them changes the outcome. Each fix is
a change of words, with any new figure printed by a script beside the rule. The reducer is a stamped file and stays as it is.

## What holds

1. **The rule's files are unchanged since before the launch the units carry.**
   - Last changes: `JOINT-WIDE.md` at dd841b33 (17 Nov 01:26 UTC), `audit-joint-wide.mjs` and `reduce-joint-wide.mjs` at
     d1b4c7b2 (01:22), `batch-joint-wide.sh` at 6a38d399 (16 Nov 22:40).
   - The last launch's snapshot is f7e4c40f (01:43), launched 01:50 UK. UK time is UTC in November.
   - `git diff f7e4c40f a7aed0f6` touches no stamped file and nothing in `src/`.
   - All 28 logs' first lines carry `code 603eeb595679 audit 109137137d97`.
2. **The amendments came before the launches they govern.**
   - Amendment 1 (fb09fe25, 22:46 UTC) came before launch 1 (22:51 UK).
   - Amendment 2 (d1b4c7b2 and dd841b33, 01:22 and 01:26) and its check (f7e4c40f, 01:43) came before launch 3 (01:50),
     which started from an empty folder under the new audit stamp.
   - Amendment 2 changes the reducer only in the gate's chunk checks and the time measure (`git diff fb09fe25 d1b4c7b2`).
     The bars (`RULE`), the five parts, the gain and the outcomes are as committed at 6a38d399.
   - That the set-aside units were not read is a negative I cannot check. I did not open them.
3. **The gate's account of the restarts holds.**
   - Launch 4's log says "28 to run" at 02:21 under `RESUME=1`: no unit was done at the restart.
   - The four units then in flight resumed from their saved parts, each log printing it:
     - S327F: K2 whole and K4's first 1,000 paths from the first process;
     - S329F: K4's first 3,000;
     - S331F: K6's first 1,000;
     - S333F: K2 whole and K4's first 1,000.
   - Each resumed arm passed the audit's check against `E.runTrial` on its first 200 paths in the new process.
   - Every arm's chunks cover paths 0 to 4,000 in order and sum to its CPU time. All chunks ran on one CPU model.
   - Exactly those four units ran in more than one process, so the time medians are over the other 24, as amendment 2 says.
   - On every unit, each person's table digest is the same before the first arm and after the last.
   - `couple.js` `rankFor` scores afresh at each call and takes the first K, and each arm has its own `cp`. So no ranking
     cached at one width reaches another.
4. **Every figure in the results file reproduces from the arrays**, in my own code:
   - pooled survival: K4 cells 106,854 / 216 lost / 480 saved / 4,450, +0.236 (+0.190 to +0.282); K6 +0.454 (+0.402 to
     +0.506); K6 against K4 +0.218;
   - each unit's change and cells;
   - spending: -0.0416 (-0.0488 to -0.0343) and -0.1579 (-0.1669 to -0.1489);
   - the capped pot, pooled and by unit; the typical path and the average pound; lifetime tax; the counts of paths a tenth
     lower or higher;
   - the replays' counts;
   - the time: 129.8, 219.6 and 358.4 ms a path; x1.514 / x1.524 and x2.336 / x2.373 (K6 against K4 x1.550 / x1.559); the
     order-effect medians; the solve's 97 s;
   - the browser inference, x1.34 and x1.88.
   Every figure the write-up quotes from the results file matches it.
5. **The verdict follows from the rule.** Neither arm holds parts 1 to 4: K4 fails part 4 on five units, and K6 fails parts
   3 and 4. Part 5 holds on both: no decision of 124,031 scores below K2's, and none leaves a year unfunded. So the outcome
   is FAILS, not STOP.
6. **FAILS does not rest on noise.** From the arrays, with paired standard errors:
   - K4's capped pot is many standard errors past the 0.5% bar on three units: S109-sppart -5.020% (se 0.225), S377-dbpart
     -1.830% (0.125), S337F -1.113% (0.094). S109-90 and S061-dbpart are past it by less than two standard errors.
   - K6's spending interval lies wholly past its bar.
7. **The printed row and STATE's next action carry the read faithfully.** STATE's COUPLE-SHARE row is printed by `state.mjs`
   from the results file, with the outcome and both arms' survival and times. Closing the item is D111's ruling ("whose read
   closes this"). STATE's next action 3 carries the read correctly.

## Findings

1. **BLOCKING. A no-harm claim that the read's own unit interval contradicts.**
   - The claim: the report's first finding, "No couple's survival is lower beyond noise under either".
     `QUESTIONS-2026-11-17.md` section 1 carries it to the external review as "no unit lower beyond noise".
   - No script prints it. The reducer prints a unit's interval only where it lies wholly below -0.3 (part 2). The claim reads
     part 2's "none" as "none below nought".
   - From the arrays, by the interval the rule reads a unit with (`survivalChangeU`, part 2's statistic): S061-90 under K4
     is -0.225 points (-0.465 to -0.001). Its cells are 3,893 both survive, 14 lost, 5 saved, 88 both fail. That interval
     is wholly below nought.
   - By the exact paired test it is not below nought: `survivalChange` gives -0.388 to +0.011, and the two-sided p is 0.064.
   - Under K6 no unit is below nought. The lowest is S147-90 at -0.225 (-0.500 to +0.039).
   - It should say: one unit's interval lies wholly below nought, S061-90 under K4, -0.225 (-0.465 to -0.001; 14 lost, 5
     saved), inside part 2's bar of -0.3; none under K6. The handover should say the same. The figure should be printed by a
     script beside the rule.

2. **BLOCKING. The account of why the pot falls is a cause with no decomposition, and the run's own figures contradict it.**
   - The claims:
     - "But on other couples it spends the pot" (What it found);
     - "So the pot falls where a couple spends more or ends near its cap, and rises elsewhere" (Beside the rule);
     - "on S109-sppart spending rises and tax falls, so the wider move spends the pot sooner there, not on tax" (What the
       read cannot show, straight after "No decomposition was run");
     - "the wider move also spends the pot on others" (For the maintainer).
   - The signs, from the results file's lines by unit, K4 against K2:
     - two of the five units past the 0.5% bar spend less, not more: S109-90 (spending -0.2139%, capped pot -0.654%) and
       S061-dbpart (spending -0.5455%, capped pot -0.547%);
     - eleven units spend more, and five of them leave a higher capped pot: S147-90 (+0.0452%, +1.201%), S191-90
       (+0.2868%, +0.766%), S227-90 (+0.1938%, +0.105%), S271-90 (+0.5130%, +0.332%), S191-dbpart (+0.3407%, +0.366%).
   - "Ends near its cap" does not sort them either (from the arrays):
     - the units that most often end at their caps are the younger eight: 55% to 59% of K2's paths end at or above the
       household's cap, and their mean pot is 2.2 to 2.9 times it. Seven of the eight leave a higher capped pot under K4;
     - of the five units past the bar, only S337F ends there often (59%). The other four do so on 16% to 31% of paths.
   - The size, on the write-up's own example. From the arrays, a path, in today's money (the engine is real throughout):
     - S109-sppart's extra spending under K4 is +£2,236 over its whole 35-year plan. Its tax is -£958, its mean pot
       -£31,006 and its capped pot -£20,313. Its survival barely moves (-0.125).
     - For the extra spending to account for the pot's fall, it would have to grow about fourteen-fold. That means about
       7.8% a year above inflation for all 35 years, even if all of it were spent in the first year. The riskiest tier's
       median return is 4.97%.
     - So the extra spending does not account for the fall on S109-sppart. What does is not shown.
   - The report says itself that why the pot falls is not shown, and these four sentences then say why. They should say:
     the capped pot falls past the bar on five units under K4 and seven under K6; some of these couples spend more and others
     less; the cause is not shown, since no decomposition was run.
   - The handover is neutral on the pot and can stay as it is.

3. **BLOCKING. "The gain sits where the two tables misread the household most": a false premise, and a cause the run does
   not measure, carried to the external review.**
   - The claims:
     - the report's second finding: "The gain sits where the two tables misread the household most. S147-db, the couple on
       which the share rules swung most (MEANS +9.3 points), gains +5.150 points under K6";
     - For the maintainer: "where the two tables misread the household most, a wider move recovers a lot (S147-db +5.2
       points), which says the misread is real and large on some couples";
     - `QUESTIONS-2026-11-17.md` section 1: "the gain largest where the two tables misread the household most (S147-db
       +5.150 under K6, ...)".
   - The premise is wrong.
     - In the share rules' read the unit moved most was S061-dbpart, MEANS -12.381 (`results-share-rules.txt`; STATE's
       COUPLE-SHARE row prints the range -12.381 to +9.338).
     - S147-db's +9.338 is the largest gain there, not the largest swing.
     - S061-dbpart gains +0.450 here under either width.
   - The run measures no misread. The only proxy the write-up names is the size of the share rules' swing on the sixteen
     units the two runs share. The gain follows it only loosely:
     - the rank correlation is 0.56 under K4 and 0.59 under K6 (my computation from the two results files);
     - S061-90, which MEANS raised +2.225, loses -0.225 under K4.
   - One unit carries much of the pooled gain, and the reader is not told.
     - S147-db's 206 net paths are 41% of K6's 508.
     - Without S147-db, K6's pooled gain is +0.280 (+0.232 to +0.327) and K4's is +0.194 (+0.150 to +0.239). Both are still
       beyond noise.
   - It should say: the largest gain is S147-db's (+5.150 under K6, 206 saved, none lost; 41% of K6's pooled net paths), the
     unit whose survival MEANS raised most in the share rules' read (+9.338). S061-dbpart, which MEANS moved most (-12.381),
     gains +0.450. This run does not show whether the wider move recovers what the tables misread. The handover should say the
     same.

4. **MINOR. The replays in plain words.** The claim (Beside the rule): "the wider pick differs from K2's on a third to a half
   of decisions (...), mostly in the split".
   - How often the pick differs, pooled over the 28 units' replays:
     - K4's pick differs at 40,195 of 124,031 decisions along K2's path (32.4%), K6's at 51,979 (41.9%);
     - by unit, K4 ranges from 9.7% (S109-90) to 60.4% (S227-90), and K6 from 15.8% to 66.2%.
   - What differs:
     - the split differs in 45.7% (K4) and 48.2% (K6) of the differing picks, pooled, and in under half of them on 15 of
       the 28 units (S271-90: 194 of 2,728);
     - the counts by kind overlap. They also leave out picks that differ only in a person's own move (draw order, re-wrap,
       ceiling), which the replay does not count by kind.
   - It should give the pooled shares and the range, and say "mostly in the split" only of the units where it holds.

5. **MINOR. The typical-path pot "rises with width (K4 +5.385%, K6 +8.787% pooled, both beyond noise), led by the feature
   units".**
   - This is the rule's measure as committed, and it rises without S147-db too: the other 27 units average +3.2% (K4) and
     +3.9% (K6).
   - But S147-db alone contributes 2.285 of K4's 5.385 and 4.982 of K6's 8.787.
     - Its +139.489% under K6 comes almost entirely (131.97 points) from 347 paths that K2 fails while leaving under 1% of
       its mean pot. K6 saves 149 of them.
     - Its median path changes by +2.8%.
   - The middle unit's median path changes by +1.06% (K4) and +1.80% (K6).
   - Where the figure is used, say that it is led by S147-db, mostly through paths K2 fails.

6. **MINOR. Counts given without their bar.**
   - "the capped pot falls on seven couples" (K6): it is lower on ten units, and lower by more than 0.5% on seven.
   - "K6 against K4 ... the capped pot lower on five units": it is lower on twelve, and lower by more than 0.5% on five.
   - Add "by more than half a percent" to both.

7. **MINOR. "The order effect small".** The claim: "the order effect small (K4 x1.489 to x1.530, K6 x2.182 to x2.441 by
   which arm ran first)".
   - The three groups by first arm are different units (unit k mod 3), so this line cannot separate the order from the
     units.
   - K6's three medians span 12%.
   - It decides nothing (amendment 1). Say it cannot be read either way, or drop "small".
   - Likewise, the group lines' times ("the younger units (8): ... x1.96 a path", "x3.50") are medians over the four younger
     units that ran in one process, not all eight. If they are quoted, say four.
