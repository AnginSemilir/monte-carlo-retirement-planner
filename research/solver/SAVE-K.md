# Test K: the employees' split at income tax relief alone (EXPLORATORY)

D137 (4), on the deep review of the savings split's v2 (`reviews/2026-11-21-deep-save-v2.md`, section 3). EXPLORATORY:
on its own it changes no default, gate or candidate. D137 names this run and rules its three outcomes in advance. This
file, the audit (`save-k.mjs`), the batch (`batch-save-k.sh`) and the read (`reduce-save-k.mjs`, with its planted checks)
are committed before any unit runs.

## The question

The v2 read (registered, seed 7025, PASS) found the split's gain mostly the employees': `87.3%` of it from 30 of the 40
households. The deep review's leading cause is the price the engine puts on an employee's pension pound. That price is
salary sacrifice relieved of employee NIC, uncapped and in every year. Only the split's arm reads it, since a working
single's take-home is not computed while working.

How much of the employees' gain is left when that pound is priced at income tax relief alone? That is the law's price for
an employee who does not sacrifice salary, and for a sacrificer above £2,000 a year from April 2029.

## The lever

Each employee's plan has `demographics.employmentSelf` set to `'self-employed'`, and nothing else is changed.

For a working single with no employer NIC passed through (all 40 of the panel), the deep review finds that this flag
reaches a run only through the split's price:
- the take-home is not computed while working (`App.jsx` 2357; `model.js` 333);
- the taxable pay's pass-through factor is 1 either way (`App.jsx` 1436 to 1440);
- the split's routes are the one other reader (`App.jsx` 3567).

The identity arm tests that claim on every employee, and the control tests the machinery.

## Arms

Every arm runs on anchors (the menu the candidate ships with), at estate weight `0.02` and 45 points, on the read's code.
Each one is solved and run as the registered audit solved and ran CANDDA and CANDSA (`audit-save-v2.mjs`, whose functions
the audit takes from the read's tree):
- **CANDSA-T:** the split on anchors (the registered CANDSA's configuration, bf1cac401c13), on the flipped plan, over
  seed 7025's first `4,000` paths. Recorded as v2's audit records them:
  - every path's survival, failure year, pot, estate, lifetime tax, spending delivered and unmet;
  - each year's spending level;
  - on `runPolicy`'s first `1,000` paths, each working year's save and tier pair, and the pots at the top of the first
    retired year.
- **CANDDA-T, the identity:** the candidate (the registered CANDDA's configuration, 17ff82379838) on the flipped plan.
  - Its table digest must be the registered CANDDA's.
  - Its settings line must be the registered CANDDA's, byte for byte.
  - On the first `500` paths, every array must be the registered CANDDA's path for path: survival, spending delivered, pot
    and lifetime tax, and the failure year, estate and unmet too.
- **The control:** S280, self-employed, so the flip changes nothing. Its CANDSA-T must be the registered CANDSA: the table
  digest, the settings line, and every array on all `4,000` paths.

**Any difference in the identity or the control is a STOP.** It means the flag reaches more than the price, and nothing is
read.

Also checked in each unit before any path, a failure a STOP:
- arm A's pick on the plan as entered is the landing's (the solver plan takes arm A's policy, as registered);
- the flipped plan's inputs hash is the registered arms' once the flag is set back, so the flip moves nothing else that is
  hashed;
- each arm's horizon, retirement year and working years with a save to choose are the registered arms';
- each arm passes the registered audit's checks of its solve (`armProblems`) and of its settings line on anchors
  (`settingsProblems`);
- each arm's first `200` paths are held to `E.runTrial`, and the tables are unchanged while its paths run.

## Households

The 30 employees of `save-v2-panel.json` (the 40 less the 10 self-employed), and S280 as the control. The groups, frozen
here, are set by each plan's salary against its region's higher-rate threshold (the read checks each salary against them):
- **the three that save ISA first most:** S300F, S302F, S336F (each £29,500);
- **the 13 basic-rate employees outside them** (£29,500 to £37,500; rUK at 20%, Scotland at its 21% rate): S312F, S324F,
  S348F, S180, S182, S192, S218, S230, S242, S254, S264, S266, S276;
- **the 14 higher-rate employees** (£67,500 to £85,000): S318F, S330F, S342F, S354F, S186, S198, S212, S222, S234, S248,
  S258, S270, S282, S296.

## Seed, paths and code

- **Paths.** Seed 7025's first `4,000` paths (path i is drawn from 7025 + 7919 i alone, `pathsForSeed`). These are the
  paths the registered CANDDA and CANDSA ran on anchors, already read by the registered read (21 Nov, 07:14 UK).
- **Code.** The read's code, 71fb4271c681, from the launch worktree at a83cd90b (`/home/user/sv2-launch`), with no edit in
  its code. The registered units are read from its results (`results/save-v2-run`).
- **How it runs.** Directly, as a tracked task: the launcher refuses a reserved seed outside its registration (D110's form,
  D137 (4)).

## The read (`reduce-save-k.mjs`, read once)

**The gate first:**
- every unit is there: the 30 employees and the control;
- one stamp: the tree's code, this test's files, one Node;
- seed 7025, `4,000` paths, 45 points, estate weight `0.02`;
- each unit's identity or control holds as above;
- each employee's CANDSA-T is at the registered CANDSA's configuration and settings line.

**K, the share of the gain left at that price:** (CANDSA-T less CANDDA) over (CANDSA less CANDDA).
- Both are pooled survival by path over the 30 employees: each path's change averaged over the households
  (`reduce-phase4.mjs` `survivalItem`). CANDDA and CANDSA are the registered arrays, on the same `4,000` paths.
- Its 95% interval is by the delta method on the two paired changes: their per-path series, their variances and their
  covariance.
- The read refuses a denominator at or below nought.

**Beside K, deciding nothing:**
- K for each group (the 13 basic-rate, the 14 higher-rate, the three), each with its interval;
- the higher-rate group's K less the basic-rate group's, its interval by the delta method;
- CANDSA-T less CANDDA, pooled, with its interval, and CANDSA-T less CANDSA;
- by household, CANDSA-T less CANDDA beside CANDSA less CANDDA;
- the share of the working-year decisions from 2029 that take the pension first, under CANDSA and CANDSA-T (`runPolicy`'s
  first `1,000` paths);
- the mean tier step below the plan's tiers in the last five working years, under CANDDA, CANDSA and CANDSA-T;
- the kind of failure (running out, or every year paid and the pot ending below the minimum) of the paths saved and lost
  against CANDDA, under CANDSA and CANDSA-T;
- the times.

**What the cause predicts** (the deep review): the basic-rate group keeps about half or less, the higher-rate group about
nine-tenths, and the three more than all; pooled, K is about `0.7`. If the plans' shape is the cause instead, every group
keeps nine-tenths or more.

## Outcomes, ruled in advance (D137 (4))

The bars are compared on the point estimates, and a value at a bar counts as reaching it.
- **K and the basic-rate group's K both at least `0.85`: THE CAUSE FAILS.**
  - The change of default goes ahead as the PASS has it, with ISA first held back for an employee (D137 (4)).
  - Its D-line says the gain holds on income tax relief alone, so the 2029 cap and the non-sacrificer are measured, not
    inferred.
- **Otherwise, K at least `0.33` with CANDSA-T's gain over CANDDA beyond noise** (its pooled interval's lower end above
  nought): **THE CAUSE HOLDS IN SIZE.**
  - The change of default goes with the law's price in the split's two routes (D134 (3)'s cap brought forward for
    `saveSplitRoutes`), with its test.
  - Its D-line gives both figures. Whether the app asks how an employee pays in goes to the maintainer.
  - The cause's signature, the basic-rate group's K below the higher-rate group's beyond its noise, is printed; without
    it, the read says so.
- **K under `0.33`, or CANDSA-T's gain over CANDDA not beyond noise: THE GAIN IS MOSTLY THE PRICE.**
  - The change of default is held for employees and comes back to the maintainer.
  - The self-employed's part may go alone, on the maintainer's word.

## Cost and box

- **Run:** about 5.5 core-hours (the deep review's estimate): CANDSA-T with its paths beside about 4.9; the identity's
  solves and `500` paths, and the control, about 0.6. Under two hours on four free cores.
- **Box:** the build half a day from 21 Nov 18:00 UK; the read half a day from the run's end. When a box runs out, stop and
  report.
