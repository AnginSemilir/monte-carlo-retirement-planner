# Review before use, second round: amendment 1 to step 5, the shapes the library lacks (`SHAPES.md`; D125 to D127)

Subject: the fix in df7f5b7b. It answers the first round (`reviews/2026-11-17-shapes-amendment-1.md`: FAIL, two BLOCKING,
four MINOR) together with the maintainer's D127: unit 27 runs again with unit 20 in one launch, and step 5's run box is
extended.

The run is EXPLORATORY (PRESCRIPTIVE-PLAN.md step 5, D120), launched 17 Nov 17:19 UK from 7ba13e93 (code 603eeb595679,
audit 260916d007cd). Its batch ended at 19:57 UK: 26 units ran to their end, and units 20 and 27 were refused by the
settings check.

Verdict: PASS

No finding is BLOCKING; one new MINOR. Every finding of the first round is answered, each new check is shown failing on
its plant, and both refused units pass the amended check through the audit's own main at a smoke's settings.

The amendment may now be used: the re-run of units 20 and 27 through the launcher, then the read once. The dry run on
the files at df7f5b7b prints audit `8ee21112bee6` and `todo: 20 27`.

## What was read and run

- **Files.** Main tree at df7f5b7b, clean. Git blobs:
  - `research/solver/SHAPES.md` 3fb08815defc (the amendment section whole);
  - `audit-shapes.mjs` 94180a00e4ae, `reduce-shapes.mjs` 34949658325e, `batch-shapes.sh` 122136870944;
  - `fair-gate.mjs` c6b3e87e1643 (unchanged since f902905b);
  - `research/tests/batch-shapes-units.test.mjs` a7eb320167b4, `research/tests/fair-gate-allowed.test.mjs` da345d964e71,
    `results-fair-gate-allowed.txt` 3a102b28f2d4;
  - `STATE.md` 6b33ad0fb983 (D127), `DECISIONS-PENDING.md` c054e2e5fd46;
  - `git diff 4aef99dd df7f5b7b` whole.
- **Of the run's folder.** The two refusals: `case20.txt` and `case27.txt`, three lines each. The stamp line of every
  unit's log, and whether each holds its done line (the batch's own test, nothing printed). The unit files' names, not
  their contents. `parts/` is empty. No unit file opened.
- **Run, one process at a time:**
  - `audit-shapes.mjs --planted` and `--planted-wiring`;
  - `reduce-shapes.mjs --planted`;
  - `fair-gate-allowed.test.mjs`, `fair-gate.test.mjs` and `batch-shapes-units.test.mjs`;
  - `reduce-household.mjs` against `results-household.txt`;
  - `batch-shapes.sh` dry runs, on the run's folder and on a scratch folder;
  - the audit's main on units 20 and 27 at a smoke's settings (6 points, 2 paths, its folder in a scratch directory, no
    figure printed);
  - two planted faults in a scratch copy of `audit-shapes.mjs`, run under `--planted-wiring`;
  - `protected-changes.mjs 7ba13e93..HEAD`.

## The first round's findings, against the fix

1. **BLOCKING 1 (the household hold could not fail): answered.**
   - **The wiring.** `unitLineProblems(k2, house, hp)` holds the household table's lowest level to `k2.m.ctx.floorFrac`,
     the couple's model, a source the household table does not set. The audit's main calls it at line 203, and it is
     the only call there.
   - **`--planted-wiring` passes.** It printed `PLANTED (WIRING): ALL PASS (5)` in 40 s. On unit 20 at 6 points it
     refuses the household table solved on a floor of 75% and the first person's table so. Beside them it prints the
     first form, blind: `the first form of the hold (the household table's own model) on the planted household table:
     no problem`. The plants `nolevelhold` and `noselfhold` each fail their case alone.
   - **It catches the two ways back.** In a scratch copy:
     - with the household hold returned to `house.hm.ctx.floorFrac`, its case 2 fails;
     - with the first person's hold taken from that table's own model (`k2.tables.self.m.ctx.floorFrac`), its case 3
       fails.

     Each gave `PLANTED (WIRING): 2 FAILED`.
2. **BLOCKING 2 (unit 27 without a ruling): answered by D127.** D127 is "Yes, run 20 and 27". The amendment cites it;
   `AMEND.rerun` names `S147-db@penA100` and `S061-dbpart@penA100`. `case27.txt`'s refusal carries the levels alone:
   "household: levels 1,1.1,0.95,0.9,0.8, the first person's 1,1.1,0.95,0.9,0.80002". That is the class the first round
   placed from the unit's plans.
3. **MINOR 3 (the first person's lowest level held to nothing): answered.**
   - The level is held to `shareFloorFrac(hp, k2.share)`, which is `round(F x share) / round(T x share)` from the
     couple's plan.
   - The arithmetic is the cut's: `couple.js` `scale` is `Math.round(Number(v) * share)`, and the engine's floor is
     `floorSpend / targetSpend`. Both ratios are rounded to six places after `min(1, x)`, as `productLevels` rounds them.
   - `--planted` printed `PLANTED: ALL PASS (9)`, with `noselfhold` failing its case alone.
4. **MINOR 4 (the read's record on one stamp): answered.** Read in the code: after `THE GATE: fair`, and outside a smoke,
   the read prints both stamps, the count of units on the launch's, the two units on the amended files', and the
   refused logs found. The amended stamp it prints is the one the gate has just held those units to.
5. **MINOR 5 (the batch's re-run path): answered.**
   - **The test.** `node research/tests/batch-shapes-units.test.mjs` printed `ALL PASS: 5 checks and 4 plants` in
     2.5 minutes, each plant failing its check alone. It leaves no plant file behind.
   - **On the run's folder.** `RESUME=1 UNITS_ONLY="20 27" TODO_ONLY=1` printed
     `stamp: code 603eeb595679 audit 8ee21112bee6` and `todo: 20 27`. `RESUME=1` without `UNITS_ONLY` is refused: "logs
     on another stamp than these files' (28 of them)".
6. **MINOR 6 (the fair-test gate's test): answered.**
   - Check 4's logs are now on both listed versions of two codes, so the one-code rule alone refuses them.
   - `fair-gate-allowed.test.mjs` printed `ALL PASS: 5 checks and 2 plants`: `acceptall` fails check 3, and
     `manycodes` fails check 4.
   - `fair-gate.test.mjs` printed `51 passed`.
   - `protected-changes.mjs 7ba13e93..HEAD` lists `fair-gate.mjs` alone, in f902905b.

## Finding

1. **MINOR. The batch moves aside any named unit's log on another stamp, a completed unit's too.**
   - **The rule.** `batch-shapes.sh` moves `case<k>.txt` to `case<k>-refused.txt` whenever its stamp is not these files',
     and does not look for the unit's done line.
   - **Shown on a scratch folder** like the test's, with 26 done logs and two refusals.
     `RESUME=1 UNITS_ONLY="20 21" MOVE_ONLY=1` printed `moved case21.txt aside to case21-refused.txt`, and that file ends
     `done unit 21 secs 100`.
   - **What a mistyped name would do.** It would file a launched unit's log as a refusal and run that unit again over
     its unit file. The read would then refuse the unit (not in `AMEND.rerun`), so no figure is at risk; the cost is the
     launch's record and the time to restore it.
   - **The remedy.** Move only a log without its unit's done line, and stop otherwise. Until then, the dry run that
     prints `todo: 20 27` is the check before the launch.

## Checked and sound: the re-run and the read as they will be made

- **Both units pass the amended check through the audit's own main.** Units 20 and 27 ran with `SH_PTS=6 SH_N=2` and
  `SH_OUT` in a scratch directory, and each printed its stamp `audit 8ee21112bee6`.
  - Each passed the settings check and ran its four arms, in its unit's order, with the options the reducer wants.
  - `runPath` agreed with `E.runTrial` on its paths, and each ended `done unit`.
  - At 45 points the run will also apply `wantProblems` and the minimum-pot check. Both passed on these two units at the
    launch: each refusal names only the levels.
- **The launched units.**
  - 26 units hold their done line under the launch's stamp, and 26 unit files are in the folder (names only).
  - `parts/` is empty, so the re-run starts each unit afresh.
  - `case20.txt` and `case27.txt` are still in place for the batch to move aside.
- **Nothing the arms compute has moved.**
  - The code id is 603eeb595679. Since 7ba13e93, `src/` and every stamped file the arms run on are unchanged: the
    household plan, the couples' audits, the panels, `results-household.txt`, the statistics and the candidate.
  - The audit's changes since the launch are the check and its planted modes alone.
  - `node research/solver/reduce-household.mjs` printed `results-household.txt` byte for byte.
- **Fairness between the two checks.**
  - The old check admitted the 26 by holding the first person's lowest level equal to the household's. The amended check
    holds the household's to the couple's floor, which the household plan keeps, and the first person's to their share's,
    which the cut makes. So on every unit both of its holds are true unless the cut or the household plan is at fault:
    from their plans for units 20 and 24 to 27, and through the main for 20 and 27.
  - The two checks therefore admit the same units, except the two the old one refused for the rounding. Every unit of
    the panel is read, and nothing is selected.
  - The check computes nothing; the paths, points, orders and split are the launch's, and the plans' valuation date is
    fixed.

## Conditions of use (not findings; the amendment states the first)

- Nothing in `STAMP_FILES`, `SHAPES.md` among them, changes between the launch and the read. A note of this verdict in
  `SHAPES.md` therefore goes in before the launch, and the dry run is repeated to read the stamp the launch will carry.
- Launch from a clean tree. After a restart, relaunch only with `RESUME=1 UNITS_ONLY="20 27"`; the batch now refuses
  `RESUME=1` alone.

## Not read

- No unit file or `parts/` of `results/shapes-7002/`, and no unit log line beyond the stamp lines and the two refusals.
- No figure of step 5. The smoke runs printed none, and their scratch folder was not opened.
- No held-out seed: arm A's policy search ran on its own seed 7001, as the audit does.
- `results/joint-wide-7002-stopped/` not opened.
