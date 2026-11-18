# Review at the read: step 5, the shapes the library lacks (`SHAPES.md`; D120; amendment 1, D125 to D127)

Subject: the read once by `reduce-shapes.mjs` (`results-shapes.txt`, committed in bd1405cd) and its write-up
(`reports/2026-11-17-shapes-read.md`), with `shapes-beside.mjs` and `results-shapes-beside.txt` beside it (2f9dbb1c).
EXPLORATORY, seed 7002, 4,000 paths a unit, 45 points. 28 units launched 17 Nov 17:19 UK from 7ba13e93 (audit
`260916d007cd`), 26 run to their end; units 20 (S147-db@penA100) and 27 (S061-dbpart@penA100) refused by the settings
check as launched and run again 20:26 UK from 29091fa3 on the amended files (audit `decd98612d68`). Read at HEAD
65db8e23 (2f9dbb1c plus AXIS.md and REFUSALS.md; the read's four files the same as at 2f9dbb1c), branch work-i58m0x, the
tree clean.

## What I read

- Git blobs at HEAD: `results-shapes.txt` 191e20c963, `reports/2026-11-17-shapes-read.md` 8d6490a936,
  `shapes-beside.mjs` 136fa58e95, `results-shapes-beside.txt` 5883240971, `SHAPES.md` 2b64cc9c83 (the rule and
  amendment 1), `reduce-shapes.mjs` 3494965832, `audit-shapes.mjs` 94180a00e4, `batch-shapes.sh` 1221368709,
  `shapes-panel.mjs` af92d5e2e7, `shapes-panel.json` 1aefb679e6, `fair-gate.mjs` c6b3e87e16, `reduce-household.mjs`
  2a762db28f, `stats.mjs` 7cf309da01, `src/couplesSwitch.js` 84f2038f79, `src/solverCouple.js` 538a2732be,
  `src/solverClient.js` a57e8ba4b7 (the couple's route), `runs.log` 9eb79d0a4d.
- `PRESCRIPTIVE-PLAN.md` steps 4 to 6 at f1f44727 and its `results-coverage.txt`; `HOUSEHOLD.md` section 5 as amended
  for step 4; `results-household.txt` (the lead test); the two reviews of amendment 1.
- The run: `results/shapes-launch-1.log`, `-2.log`; every unit's `.json.gz` and `caseN.txt` in `results/shapes-7002/`,
  and `case20-refused.txt`, `case27-refused.txt`; the two launch snapshots the launcher kept
  (`/tmp/solver-snap-bL0QaI` from 7ba13e93, `/tmp/solver-snap-S6PLoC` from 29091fa3). I did not open
  `results/joint-wide-7002-stopped/`, and read, printed or estimated no held-out seed.

Verdict: PASS

No finding is BLOCKING; two MINOR. The read reproduces byte for byte, every figure in it and in the write-up is the
unit files' (recomputed by my own code), the outcome follows from the rule as committed, and the write-up gives no
cause. The write-up's account of the app's guard holds: the guard is read on each plan as entered, the three couples
named are handed to the solver, and K2 here is what the page's own route gives them, path for path. The two MINORs are
what a reader needs and is not told: where the pooled gain lies, and the trade inside the guard recommendation.

## What I checked, and how

1. **The rule's files, and the two launches.**
   - The audit stamp hashed from the git blobs of the 19 stamped files at each commit: 7ba13e93 `260916d007cd` (the 26
     units' stamp); 29091fa3, d9d6152f, bd1405cd, 2f9dbb1c and HEAD all `decd98612d68` (the two units' stamp). The
     amendment's working commits give other stamps (31c43368 `d97b3e32482d`, 4aef99dd `f7f9d11f6125`, df7f5b7b
     `8ee21112bee6`) and no unit carries one. So nothing stamped changed between the re-run's launch and the read.
   - The kept snapshots print the same: `stampFilesHash()` `260916d007cd` and `decd98612d68`, `code-id.mjs`
     `603eeb595679` in both and in the tree now. Neither launch log carries the launcher's uncommitted-files warning.
   - Outside the stamp, the reducer imports `reduce-household.mjs` (the same file in both snapshots and now) and
     `fair-gate.mjs` (changed once, f902905b, D126's allowed versions, before the re-run).
   - The launches as the logs give them: launch 1, 28 to run, "unit 20 exited 3", "unit 27 exited 3", done 19:57 UK;
     launch 2 from 29091fa3, "moved case20.txt aside", "moved case27.txt aside", "2 to run", done 20:41 UK; both lines in
     `runs.log`. Each refused log is three lines: the stamp, the unit, the refusal. The audit refuses after the solve and
     before the first arm, so neither unit had an outcome before the re-run.
   - The amended check on all 28: `shapesLineProblems` on each unit's logged settings lines, with the couple's floor
     over its target and the share's floor from the plan as the solvers are handed it. All 28 pass, so the 26 run on the
     old check meet the amended one too, and the two checks agree on every unit run as launched. The refused logs'
     levels (`0.799985`, `0.80002`) are the re-run logs' own.
   - The re-run's arms against the 26: the same code, seed, paths, points and split, each in its unit's order (unit 20
     APP, K2, HS, CEIL; unit 27 CEIL, APP, K2, HS). The audit's diff 7ba13e93 to 29091fa3 touches only the settings
     check and its planted functions; the reducer's only the gate on two stamps, its planted checks and its record.
   - The read's time: `results-shapes.txt` was written 20:41:32 UTC, 16 seconds after unit 20's log ended. I found
     nothing showing an earlier look at an outcome, a negative the record cannot prove.
   - Run now: `node research/solver/reduce-shapes.mjs` gives `results-shapes.txt` byte for byte (exit 0, THE GATE:
     fair), and the file is unchanged since bd1405cd. `--planted` ALL PASS (11). `audit-shapes.mjs --planted` ALL PASS
     (9). `research/tests/fair-gate-allowed.test.mjs` ALL PASS (5 checks, 2 plants). `batch-shapes-units.test.mjs` ALL
     PASS (5 checks, 4 plants). `node research/solver/shapes-beside.mjs` gives `results-shapes-beside.txt` byte for
     byte.
2. **Every figure, from the unit files.** My own script decodes each arm's arrays, counts the discordant paths, and
   calls `stats.mjs` `survivalChange` only for the interval. Spending on the kept paths is taken by its own loop as
   HOUSEHOLD.md section 5 part 3 defines it.
   - Part 1: +5.865 (+5.812 to +5.913), 6,776 saved and 207 lost of 112,000.
   - Part 2: no unit wholly below -0.3.
   - Part 3: +2.9081% (+2.8931 to +2.9230).
   - Part 6: S337F@even -2.84, S147-db@gap12 +2.47, S061-dbpart@gap12 +4.05. HS and CEIL read one forecast on every
     unit.
   - Every by-shape figure: survival, spending, below the bar, and the CEIL less HS means (gap12 +1.675).
   - By unit: survival in each arm; HS less K2 with its saved and lost; CEIL less HS; HS less APP; K2 less APP.
   - Each "without its largest unit" figure.
   - All the same as `results-shapes.txt`, `results-shapes-beside.txt` and the write-up, to the digit. Each unit records
     code `603eeb595679`, seed 7002, 4,000 paths, 45 points, split `even`, its stamp as amended, and elder2nd mirrored.
3. **The outcome.**
   - SHAPES.md's rule and outcomes are the plan's step 5's, and its parts are step 4's as `reduce-shapes.mjs` codes them.
   - Parts 1 and 3 hold pooled, no unit lies below the bar, and gap12's CEIL less HS mean is +1.675, over 1: A SHAPE TO
     PLACE.
   - The write-up claims no cause. "That rests on two units" and "+0.883 without S061-dbpart@gap12" are the
     decomposition by unit that the beside prints. Every pooled figure in the plain words has its "without".
4. **The app's guard.**
   - **The guard's reading.** `shapes-beside.mjs` calls `coupleSolverOn` on `readShapesPanel()`'s plan: the shape's
     plan as entered at its landed target, not the solver's plan or the mirror. Read again by account owner as well as
     by the id suffix the guard uses: the same share on all 28. Every account with a balance has an id ending `_self`
     or `_part`, and no id disagrees with its owner. Every horizon fits.
   - **The three named couples** hold exactly 0.600 with the first person the elder (56/48, 56/44, 61/49), so the band
     hands them to the solver (at a shade over 0.6 the elder's clause would). The guard keeps S337F@penB90 (0.35),
     S061-dbpart@penB90 (0.175) and S061-dbpart@penA100 (0.94) off: 25 on, as the write-up says.
   - **K2 against the page's own route.** The route is `couplePlans` on `APP_COUPLE`'s share rule, `solveForApp` at the
     app's candidate (the single's tie-break on each person's table) with the partner's age, and `assembleCouple` with
     `appJoint()`, as `couple-joint-identity.mjs` builds it.
     - I ran it on S147-db@gap8, S147-db@gap12 and S061-dbpart@gap12, on the first 400 paths of seed 7002. It gave
       the stored K2 arm on every path: survival, failure year, pot, lifetime tax and spending, byte for byte (0 of 400
       differ on each).
     - It did the same on each plan as entered, with its own policy and MPAA ages.
     - Through the mirror, as `startSolve` hands an elder entered second, it did the same on S061-dbpart@elder2nd and
       S147-db@elder2nd (0 of 400).
     - `src/` and `research/engine.mjs` are the same on origin/main (074a45d8) as here.
     - So "under the opt-in, those couples are given K2 today" holds for the app on `main`, at its defaults (the dial
       at 1, the speed mode off), on the plan as entered.
5. **What a reader is told about the two units run again.** It is enough: the same code, seed, paths, points, order
   and split, and the one difference in the check. Item 1's check of all 28 against the amended check supports it.

## Findings

1. **MINOR. The guard recommendation is put without its trade, and "The harm is confined to these shapes" says more
   than 25 units on one seed show** (report lines 46 to 47, 119 to 127).
   - On these units the harm goes with the age gap and a DB pension together, not with the gap alone. My figures, from
     the unit files on `survivalChange`, paired by path:
     - K2 less APP over the eight gap8 and gap12 units: +1.397 (+1.030 to +1.762).
     - Over the four without a DB pension (S149, S337F): +10.744 (+10.698 to +10.744), each unit +9.750 to +11.525.
     - Over the four with one: -7.950 (-8.325 to -7.550). S061-dbpart@gap8 gains, +6.200 (+5.839 to +6.408).
   - A guard on the age gap, as recommended, would also take K2's gain of about ten points from the gap couples
     without one.
   - The recommendation follows the guard's own precedent: untested holdings keep the app's rules. Nothing in the
     figures contradicts it, and it is the maintainer's. But the maintainer section should say the trade beside it,
     and scope the "confined" sentence to these 25 units on this seed.
2. **MINOR. Where the pooled gain lies is not said** (report lines 21 to 26).
   - "+5.865 ... on these shapes", and "+4.990" without its largest unit, read as a shape effect. HS less K2 by base,
     my figures:
     - S149 +0.925 (+0.828 to +1.006); S337F +1.089 (+0.967 to +1.197).
     - S147-db +7.536 (+7.451 to +7.599); S061-dbpart +13.911 (+13.786 to +14.014).
     - The 14 units of the two bases without a DB pension: +1.007 (+0.931 to +1.076). The 14 of the two with one:
       +10.723 (+10.651 to +10.785).
   - The by-shape "without" rows show an S061-dbpart unit as the largest on six of seven shapes, but the plain words do
     not say it.
   - It is also far from step 4's read on the same bases as entered (`results-household.txt`):
     - HS5 less K2 there: S149 +0.275, S337F +0.375, S147-db +9.325, S061-dbpart +1.525.
     - K2 on S061-dbpart there: 98.15%. Here K2 survives 66.40% to 96.67% on its seven shapes, with APP at 85.92% to
       87.88%.
   - Item 4's identities show the audit builds K2 as the page does (on the five units run), so the shortfall is the
     couples' default's own; nothing here says why.
   - One line in the plain words would carry it: most of the pooled gain lies on the two DB bases' units, where K2
     survives well short of HS (and on several, of APP); on the two other bases the household plan gains about a
     point.

Not findings, for the record:
- One sentence calls CEIL less HS the household plan's distance "below its own table's forecast". The figure and its
  name beside it are right; part 6's forecast is a different figure.
- The reducer's header prints the first unit file's audit stamp alone; the next line gives both stamps with their
  units.
