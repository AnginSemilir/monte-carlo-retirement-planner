# Review before use: amendment 1 to step 5, the shapes the library lacks (`SHAPES.md`; D125, D126)

Subject: the amendment the maintainer ruled in D125 and D126.
- D125: the settings check with the lowest spending level left out and the household table's held to the household's own
  floor over its target; unit 20 run again alone; the read on exactly two audit stamps; each amended file with its
  planted case.
- D126: the fair-test gate's allowed versions.

Reviewed on branch work-i58m0x at f902905b, and as revised during this review in 4aef99dd (unit 27 named), before any of
it is used. The run is EXPLORATORY (PRESCRIPTIVE-PLAN.md step 5, D120), launched 17 Nov 17:19 UK from 7ba13e93 (code
603eeb595679, audit 260916d007cd). Its batch ended 17 Nov 19:57 UK; only units 20 and 27 exited (the launch log).

Verdict: FAIL

Two BLOCKING, four MINOR.
- The first BLOCKING is the hold D125 rules: as wired it can never fail.
- The second is unit 27. It was refused by the same check: I found that from its plans before the batch ended, and
  4aef99dd confirms it. 4aef99dd puts it to run again on the amendment's own clause, which no ruling covers: D125 names
  unit 20 alone.

## What was read and run

- **Files.** Main tree, clean but for this file. Git blobs at f902905b:
  - the amendment: `research/solver/SHAPES.md` f082e593e83d (at 4aef99dd: 06adc9f91943), `audit-shapes.mjs`
    8aa676412497 (unchanged at 4aef99dd), `reduce-shapes.mjs` d9647f44a5c4 (at 4aef99dd: 4461627ff8df),
    `batch-shapes.sh` 658d070a5ab5;
  - the fair-test gate: `fair-gate.mjs` c6b3e87e1643, `research/tests/fair-gate-allowed.test.mjs` 242667321bea,
    `results-fair-gate-allowed.txt` 3eb6170102c7;
  - the record: `STATE.md` 987b7646d761 (D124 to D126), `DECISIONS-PENDING.md` e1d3b7c8f9d1 (the two STOP entries of
    17 Nov evening);
  - the code the check rests on: `audit-household.mjs` f40361acbe6c, `household.mjs` d8be81173511, `shapes-panel.mjs`
    af92d5e2e71a, `run-from-snapshot.sh` cf7ab99bb4ec, `reduce-household.mjs` 2a762db28f98, `results-household.txt`
    be4058929002, `audit-couples.mjs` f50aa99da601, `audit-couples-share.mjs` ac476126024d, `src/solver/couple.js`
    7a12a4340749, `src/solver/solve.js` b3c20b3e7f21, `src/solverSettings.js` 0684649ddee3, `src/solverApp.js`
    484d5c38e1ea;
  - the generated `research/engine.mjs` (not in git; covered by the code id);
  - the launch's `audit-shapes.mjs` at 7ba13e93, and `git diff 7ba13e93 HEAD` over every stamped file, `src/` and the
    tests.
- **Of the run's folder.** `results/shapes-launch-1.log` (the launcher's and the batch's lines; no outcome in it) and
  `results/shapes-7002/case20.txt` (its three lines: the stamp, the unit's line, the refusal). No unit file, no `parts/`,
  no other unit's log; `case27.txt` not opened. The process list, for which units ran.
- **Run,** one process at a time, at nice 10 and at most a smoke's settings:
  - `audit-shapes.mjs --planted`, `reduce-shapes.mjs --planted` (at f902905b and at 4aef99dd),
    `fair-gate-allowed.test.mjs` and `fair-gate.test.mjs`;
  - `reduce-household.mjs` against `results-household.txt`;
  - `batch-shapes.sh` with `TODO_ONLY=1`, on the run's folder and on a scratch folder;
  - `protected-changes.mjs 7ba13e93..HEAD`, the launcher's seed check, `code-id.mjs` and `--smoke`;
  - planted faults in scratch copies of `fair-gate.mjs` and `reduce-shapes.mjs`;
  - a probe (not committed). It builds a unit's plans as `audit-shapes.mjs` does: `solverPlanOf`, the pots' share,
    `singlePlanFor` and `householdPlanFor`, each through `prepareForSolve` and `appPlan` as `solveForApp` takes them. It
    prints each table's floor over its target. On unit 20 it also solves the three tables at 6 points on the light lattice,
    as the audit's smoke does, and one planted household table.

## Findings

1. **BLOCKING. The household table's lowest level is held to its own model's floor, so the hold cannot fail.**
   - **What the code does.** `audit-shapes.mjs` line 150 passes `house.hm.ctx.floorFrac` as "the household's own floor
     over its target". Line 91 refuses when the household table's lowest level is not that value rounded to six places.
   - **Why it cannot fail.** `house.hm` is the household table's own model (`household.mjs` line 211, `hm: H.m`). That
     table's levels are built from exactly that model's floor (`solve.js` lines 2763 and 2769:
     `productLevels(m.ctx.floorFrac)`, on the plan `solve()` prepares again at line 376). So for any household table the
     audit can build, the hold compares the table's lowest level with the floor that level was built from. It can fail
     only on a table with no floor, which `prepareForSolve` never leaves where there is a target (`src/solverSettings.js`
     line 228).
   - **Against the rulings.** In effect the lowest level is simply left out, which is wider than D125 rules. It is also
     not D124 (1)'s form, which D125 invokes. That check holds the household table's minimum pot to the couple's model,
     `k2.m.ctx.solvencyFloor` (line 150 here, `audit-household.mjs` line 216): a source the household table does not
     set.
   - **Shown on unit 20,** at 6 points on the light lattice, with a household table solved on a floor of 75% of its
     target. The household plan's `floorSpend` was set to `round(0.75 x targetSpend)` before `householdSolveOne`, as a
     fault in the household plan's floor would leave it:

         PLANT, the household table on a floor of 75%: levels 1,1.1,0.95,0.9,0.75; its model's floorFrac 0.75
           the check before the amendment: household: levels 1,1.1,0.95,0.9,0.75, the first person's 1,1.1,0.95,0.9,0.799985
           the amended check as wired (frac from h2.hm): no problem
           the amended check, frac from the couple's model (k2.m): household: its lowest spending level 0.75, not the household's own floor over its target 0.8

   - **The planted case misses it.** The `--planted` case "the household's lowest level not its own floor over its target
     is refused" hands the function a floor (0.8) that the audit's wiring cannot pair with a 0.75 line. It tests the
     function, not the check.
   - **The fix** is one argument, `k2.m.ctx.floorFrac`: the couple's plan as both solvers are handed it, whose spending
     `householdPlanFor` keeps (`household.mjs` line 135). It also needs a planted case through that source, for example
     this probe's plant at a smoke's settings.
   - **What the fix changes.** On every unit the two sources are the same number, since `householdPlanFor` keeps the
     couple's spending. Unit 20 printed `household table's model 0.8, the couple's model (k2.m) 0.8`, and units 24 to 27
     give the same from their plans. So the fix changes no unit's verdict; it makes the hold a hold. Nothing has run on
     the amended audit, so the change of stamp it brings costs nothing.

2. **BLOCKING. Unit 27 is to run again on the amendment's own clause, not on a ruling.**
   - **The refusal.** Unit 27 (S061-dbpart@penA100) exited 3 (launch log, line 23). I placed its cause from its plans
     alone, with no file of the run read, before the batch ended:
     - the couple's target is 20,800, its floor 16,640, its pots' share 0.94;
     - the first person's table is solved on 19,552 and 15,642, a floor of 0.8000205 and a lowest level of 0.80002;
     - the partner's is solved on 1,248 and 998, a floor of 0.7996795;
     - the household's floor is 0.8.

     The launched check compares the levels whole, so this follows from the plans and is not a chance result. That is
     unit 20's class, as 4aef99dd says. Units 24 to 26 could not part this way: shares 0.5, 0.5 and 0.175 give floors of
     9,800/12,250, 8,560/10,700 and 2,912/3,640, each exactly 0.8.
   - **The authority.** 4aef99dd names unit 27 in `AMEND.rerun` and in SHAPES.md point 2 "as the amendment provides".
     That is the sentence 31c43368 wrote after D125: "Any other unit the check refused for the same reason would be run
     again the same way, and named here before it runs". D125 rules "unit 20 run again alone"; the maintainer chose it
     among three options put for one refused unit. D115 is "If you find a reason it cannot be done as written, stop and
     tell me; do not substitute". The amendment's own clause is not a ruling, so running unit 27 again is wider than
     D125.
   - **The remedy.** Put unit 27 to the maintainer: the same class, the same remedy proposed, or the panel less it. Then
     cite the answer in the amendment before the re-run is launched. If the maintainer has already given that word, cite
     it and this finding is answered.
   - **Answered in 4aef99dd.** `AMEND.rerun` and SHAPES.md name both units before any re-run, and the planted checks still
     pass (`PLANTED: ALL PASS (11)`). `UNITS_ONLY="20 27" RESUME=1 TODO_ONLY=1` lists `todo: 20 27` on the files' stamp
     `f7f9d11f6125`. No other unit exited.
   - **Still to hold.** `reduce-shapes.mjs` and `SHAPES.md` are stamped files, as is `audit-shapes.mjs` (its line 60):
     - finding 1's fix moves the stamp again, so it must come before the launch;
     - after the launch, nothing in `STAMP_FILES`, `SHAPES.md` among them, may change before the read, or the gate
       refuses both re-run units as "not the amended files'";
     - the two refused logs are not yet moved aside (finding 5).

3. **MINOR. The first person's lowest level is now held to nothing.**
   - The amended check leaves it out and reads no other figure of the first person's floor, and `wantProblems` reads
     neither levels nor the minimum pot. So a person's table solved on a wrong floor would pass where the whole-levels
     comparison refused it, for example the cut's floor not scaled (`couple.js` line 173).
   - For units 20 and 27 the values are known from their plans (0.799985, 0.80002), so nothing in this run rides on it,
     and D125 asks no more.
   - Holding it to `round6(round(F x s) / round(T x s))`, from the couple's plan and `k2.share`, would keep the check's
     reach in one line.

4. **MINOR. The read's printed record does not say it is on two stamps.**
   - `reduce-shapes.mjs` line 163 prints one audit, `units[0].stamp.audit`, which is whichever unit file `readdirSync`
     lists first. Nothing in `results-shapes.txt` names the amended stamp, the units on it, why they ran again, or their
     refused logs.
   - That file is sent whole to the maintainer (D120). The gate's lines should print both stamps, each with its units,
     and the refused logs' names.

5. **MINOR. The batch's re-run path relies on the hand that launches it.** In `batch-shapes.sh`:
   - On the amended files, `RESUME=1` without `UNITS_ONLY` runs every unit. On a scratch folder it listed
     `todo: 0 1 2 ... 27`, and on the run's folder it would list all 28. A relaunch after a restart that dropped
     `UNITS_ONLY` would overwrite the 26 launched logs at once (line 30's `> $OUT/case{}.txt`), and each unit file as its
     unit ended.
   - The refused logs are moved aside by hand. Neither has been moved yet. If one is not moved, the same redirect
     overwrites the STOP's evidence.
   - A unit named twice is listed twice (`todo: 20 6 6`) and would run twice at once.
   - D125 asks each amended file for its planted case, and none is committed for this one.
   - A remedy: under `UNITS_ONLY`, the batch could move `case<k>.txt` to `case<k>-refused.txt` itself, refusing if one
     exists. It could also drop repeated names, and refuse `RESUME=1` without `UNITS_ONLY` while any log carries the
     launch's stamp. A `TODO_ONLY` case on a scratch folder could be its plant.

6. **MINOR. One check of `fair-gate-allowed.test.mjs` cannot fail, and the planted case's own failure is not
   recorded.**
   - Check 4 ("an allowed list naming two codes is refused") still passes with the one-code rule deleted. A scratch copy
     of `fair-gate.mjs` with that condition made `false` gave `ALL PASS: 5 checks`: the check's logs carry a version not
     in the list, which the other rule refuses.
   - `results-fair-gate-allowed.txt` shows the planted case (check 3) passing on the gate before the edit, which refused
     any two versions. So the record shows check 2 failing there, not the planted case.
   - The planted case does work: with the allowed filter made to accept every version, check 3 fails (`FAILED: 1 of 5`).
     Record that, and give check 4 logs on both listed versions.
   - Nothing in step 5's read rides on the one-code rule. The reducer builds both versions on one code (line 159), and
     its gate holds one code across the units (line 46).

## Checked and sound

- **The amended settings check, apart from findings 1 and 3.**
  - Its only loosening is the lowest level. Every other key is compared as before: the minimum pot is left out and held
    to the couple's (D124 (1)), and both tie-break checks are unchanged.
  - `node research/solver/audit-shapes.mjs --planted`: `PLANTED: ALL PASS (7)`, each plant failing the case it names.
  - The settings check is the audit's only change: `git diff 7ba13e93 HEAD -- research/solver/audit-shapes.mjs` shows
    the imports, the function, `--planted` and line 150.
- **The premise, reproduced.**
  - From unit 20's plans: the couple's target 36,900 and floor 29,520 (0.8), share 0.72; the first person's 26,568 and
    21,254 (0.7999849, level 0.799985); the partner's 10,332 and 8,266 (0.8000387, level 0.800039); the household's
    36,900 and 29,520 (0.8).
  - At 6 points on the light lattice (K2 20 s, the household table 7 s), the levels are
    `self 1,1.1,0.95,0.9,0.799985 | part 1,1.1,0.95,0.9,0.800039 | household 1,1.1,0.95,0.9,0.8`. The check before the
    amendment printed the problem `case20.txt` records, word for word. The amended check, from either source, printed
    none.
  - Each table's lowest level is its plan's own floor over its own target, rounded to six places (`solve.js`
    `productLevels`). A person's figures are `Math.round(x * share)` of the household's (`couple.js` line 151). Each
    rounding moves a figure by at most half a pound, so the ratio parts from the household's by at most about 0.9 over
    the person's target.
- **The gate on two stamps.**
  - Units not named must carry the launch's stamp, and units named the amended one. A third stamp is refused, and one
    code is still required.
  - `node research/solver/reduce-shapes.mjs --planted`: `PLANTED: ALL PASS (11)`, at f902905b and at 4aef99dd.
  - In a scratch copy, a gate accepting either stamp on any unit failed 2 of the 4 new checks, and a gate skipping the
    stamp check failed 3.
- **`fair-gate.mjs`.**
  - The edit is `checkLogStamps` and `requireFairLogs` alone, with a dated note.
  - Without a list, nothing changes: `node research/tests/fair-gate.test.mjs` gave `51 passed`.
  - `reduce-shapes.mjs` is the only caller that passes a list.
  - `node research/tests/fair-gate-allowed.test.mjs`: `ALL PASS: 5 checks`.
  - `protected-changes.mjs 7ba13e93..HEAD` lists `fair-gate.mjs` alone, in f902905b.
- **The lead test is untouched.** `node research/solver/reduce-household.mjs` printed `results-household.txt` byte for
  byte. `audit-household.mjs`, `household.mjs` and the lead test's other files have not changed since 7ba13e93.
- **The re-run as it would be launched.**
  - At f902905b, `SH_OUT=research/solver/results/shapes-7002 RESUME=1 UNITS_ONLY=20 TODO_ONLY=1 bash
    research/solver/batch-shapes.sh` printed `stamp: code 603eeb595679 audit d97b3e32482d` and `todo: 20`. At 4aef99dd,
    `UNITS_ONLY="20 27"` printed `audit f7f9d11f6125` and `todo: 20 27`. `UNITS_ONLY` without `RESUME` is refused.
  - The launcher's lock was held by the batch until it ended. The seed check passes (`seeds: 7002 (tuning)`).
  - The smoke stamp has moved (`cc3f96bb4c6a`, against the launch's `7424806ec925`), so `smoke.sh` runs once first.
  - The snapshot copies the working tree, which must be clean at the launch.
  - The read's fair-test gate reads only `case\d+.txt`, and the reducer only `*.json.gz`. A `case<k>-refused.txt` is
    seen by neither, and nothing else in the repository reads the folder.
- **Fairness between the units checked by the old check and those by the amended one.**
  - The check gates and computes nothing, and the audit's arms run the same code. The code id is unchanged
    (603eeb595679): `src/` and the engine have not changed since 7ba13e93.
  - The only stamped files changed are `audit-shapes.mjs`, `reduce-shapes.mjs`, `batch-shapes.sh` and `SHAPES.md`.
  - The re-run uses the launch's seed 7002, 4,000 paths and 45 points. Each unit keeps its arm order (`k % 4`), and HS
    takes the split 'even' from the unchanged `results-household.txt`.
  - Every unit's plan carries `valuationDate` 2026-01-01, so the day of the re-run moves nothing.
  - The rule reads no time, so units run two at a time rather than four moves no figure it reads.

## Not read

- No unit file or `parts/` of `results/shapes-7002/`, and no line of any unit's log but `case20.txt`'s three.
- No figure of step 5.
- No held-out seed. The probe ran arm A's policy search on its own seed 7001 inside `solverPlanOf`, as the audit does, and
  printed only plan figures and settings lines.
- `results/joint-wide-7002-stopped/` not opened.
