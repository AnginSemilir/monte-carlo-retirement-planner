# A wider joint move for couples (D111 (2); EXPLORATORY, seed 7002)

The plan and its rule, committed with the build before any launch. The maintainer, 16 Nov (night), on the day's report:
"Go with your recommendations" (D111). The recommendation was a wider joint move for couples, tested on today's split:
each person's top four and top six moves against today's two, on today's default (with LOOKHOLD), EXPLORATORY on a panel at
seed 7002, its rule committed first, with survival, spending and the pot beside the solve and path times; no new solver
code; a gain comes back to the maintainer as a trade of survival against time. A change to this file after this commit is a
dated amendment, made before the launch and before any unit runs.

## In plain words

Each year, a couple's move is chosen in two steps:
- each person's own table ranks that person's moves, and the joint move keeps each person's top two (`couple.js`
  `rankFor`; `solveCouple`'s `topK`, two unless set);
- the joint move then tries every pairing of those moves, at each split of the year's drawing between the two and at the
  spending level each move brings, and keeps the pairing that the two tables together value best (`chooseJoint`). The tie
  rule and the hold (LOOKHOLD, D109) then act on it.

Each person's table plans a part of the household's spending that the household never lives alone (the deep review of the
share rules' read). So the move the household would value best can sit outside a person's own top two.

The share replay (D110) offered each person's top six moves instead, on the paths the fixed share rules lost. That kept more
of them than any other single change: `+0.4835` of them pooled, and `0.35` or more on eight of the ten comparisons
(`results-share-replay.txt`). But those were shares moved off today's. This test asks the same of today's split, the
couples' default, and what the wider move costs in time.

Nothing is built. The width is an option the couple's solve already takes; only the joint move reads it, and no table does.
So every arm takes the same tables.

## Units

Twenty-eight, chosen so that the width meets each kind of couple the default solves:
- **TIE-C2's twelve** (`couples-panel-d4b.json`, at their landed targets; each 60/40, so each on the half share):
  - the younger cohort's eight, retiring at 52: S327F, S329F, S331F, S333F, S335F, S337F, S341F, S343F;
  - the library's four: S149, S167, S205, S223.
  LOOKHOLD was measured on these.
- **The share rules' eight couples** (`share-rules-panel.json`, at their landed targets), twice each:
  - each couple's 90/10 unit, the elder holding 90% of the pots, so on the pots' share at 0.9: S023-90, S061-90, S109-90,
    S147-90, S191-90, S227-90, S271-90, S377-90;
  - each couple's feature unit, at 60/40 and so on the half share, with a DB pension of the first person's (db) or of the
    partner's (dbpart), or the partner's state pension at 60% of the first person's (sppart): S023-db, S061-dbpart,
    S109-sppart, S147-db, S191-dbpart, S227-sppart, S271-db, S377-dbpart.
  These are the couples on which the replay found the wider set helping, at other shares.

The seed is 7002, the tuning seed. No outcome of a wider joint move on seed 7002 has been seen. The pilot timed three of
these units on seed 99001 and printed no outcome.

## The arms

Each unit is solved once, as the app solves a couple:
- the route of TIE-C2's audit and the share rules': `audit-couples.mjs` `solverPlan('CANDC', ...)`, then each person by
  `solveForApp` at 45 points with the partner's age, without the single's tie-break;
- `solveCouple` on `APP_COUPLE`'s share rule (`'pots'`) with its joint move (`appJoint`: `tieJoint` 1e-4, `tieLook`,
  `holdPast` 2);
- the page's own route gives a couple the same tables and paths (`results-couple-joint-identity.txt`).

Every arm takes those tables. Each person's table digest is recorded before the first arm and after the last.

The arms, each run by the engine on the same 4,000 paths of seed 7002, at arm A's MPAA ages:
1. **K2:** the couples' default as it stands, each person's top two moves.
2. **K4:** each person's top four.
3. **K6:** each person's top six.

Stored for each path and arm: survival, the failure year, the pot left, the estate, lifetime tax, spending delivered and
unmet spending. Each arm's first 200 paths are held to the engine's own run (`E.runTrial`); a path that differs stops the
unit.

**The time:**
- Each arm's paths are timed by the process's CPU time (user and system), after three untimed paths, with the wall clock
  beside.
- The arms' order turns by unit: unit k runs them from arm k mod 3 (K2, K4, K6; then K4, K6, K2; then K6, K2, K4). So each
  arm runs first on a third of the units. TIE-C2's timing was tilted because one arm always ran first.
- Four units run at once, at low priority.

**The replays** (the first 100 paths of each unit, in the exact model):
- **Along K2's own path,** at each decision before the last year, K4's and K6's chooser at K2's state:
  - each person's top two moves lead their top four and six, so a wider set holds every pairing K2's does. Its best score,
    before the tie rule and the hold, cannot be lower. A decision where it is lower, or where nothing funds a year that
    K2's move funds, is a bug in the audit or the chooser: a STOP;
  - counted: the decisions where the wider set scores higher, where it funds a year K2's cannot, and where it picks another
    move (at another spending level, another split, another tier pair).
- **Along each wider arm's own path:** the decisions where its pick differs from K2's at the same state.

## How it is read

`reduce-joint-wide.mjs`, once. Its gate requires:
- the launch logs fair (`fair-gate.mjs` `requireFairLogs`: launched through the launcher, one code and one audit);
- every unit in every arm, with seed 7002, 4,000 paths and 45 points in each;
- the couples' candidate (af001697ce1b) and the couples' default joint move, read back;
- each arm's width read back from the field the chooser reads (`cp.topK`), with the joint move's options;
- each person's tables the same before the first arm and after the last;
- the arms timed in the order the design turns them;
- the replays in.

For K4 and K6 against K2, on the twenty-eight units, every comparison paired on the same paths:
- **survival:** by unit and pooled (`survivalChangeU`, `pooledSummed`);
- **spending delivered:** by unit and pooled, the change in its sum over the paths in percent, with its paired standard
  error;
- **the capped pot** (the pot up to the household's cap, as the solver scores it): by unit and pooled;
- **the pot left on the typical path:** each path's own change in percent, over the paths where both arms leave a pot,
  averaged by unit; pooled, the units' figures averaged, with its 95% interval. The average pound is beside;
- **lifetime tax:** pooled means;
- **a path's time:** by unit, the arm's CPU time against K2's; the median over the units.

## The rule

For each of K4 and K6 against K2:
1. pooled survival's 95% interval has its lower end above -0.1 points;
2. no unit's interval lies wholly below -0.3 points;
3. pooled spending delivered is not lower by more than 0.05%;
4. the capped pot is not lower by more than 0.1% pooled, nor by more than 0.5% on any unit;
5. the replays: no decision where the wider best scores below K2's at K2's state, and none where nothing funds a year that
   K2's move funds. One is a bug: STOP.

**Its gain,** in the product's order (survival first, then spending, then the estate):
- **in survival:** pooled survival higher beyond noise (its interval's lower end above nought);
- otherwise **in spending:** survival not lower beyond noise (its interval's upper end at or above nought), and pooled
  spending delivered higher beyond noise;
- otherwise **in the pot:** neither survival nor spending lower beyond noise, and the pooled typical-path pot higher beyond
  noise.

**The outcomes:**
- **STOP:** part 5 fails on either arm. It is reported as a bug, and nothing else is read.
- **A GAIN:** an arm holds parts 1 to 4 and has a gain. Each such arm goes to the maintainer as the trade it is: its gain
  beside its median time a path, with the page's wait as an inference. By D111 nothing changes in the app without a
  ruling. A width taken would be a change of default, with the reviewer on it.
- **NO GAIN:** no arm has a gain, and one holds parts 1 to 4. Closed: the joint move stays at two, and D111 (3)'s speed work
  follows on it.
- **FAILS:** neither arm holds parts 1 to 4. Closed and reported, and likewise.

**Beside the rule, deciding nothing:**
- K6 against K4, by the same parts;
- the figures by group (the younger, the library's, the 90/10 and the feature units) and by unit;
- pooled lifetime tax, and the paths ending a tenth lower or higher;
- the replays' counts, unit by unit;
- each arm's time a path, by its place in the order, and the solve's time a couple (one solve for every arm);
- the page's wait on a first solve, as an inference from one couple's split in the browser (`results-tie-c2-beside.txt`).

## What it cannot show

- It covers twenty-eight units, one seed and one estate weight. Twenty units are on the half share; only the eight 90/10
  units are on another share (0.9).
- The time is the engine's in Node, four units at once. The page runs the same engine in the browser's workers, where the
  ratio is taken to carry.
- Each person's table is solved without knowing the joint move's width. A table solved with the wider move in mind is not
  built.
- It does not try widths other than four and six, or a width that differs by person.

## The pilot (seed 99001, deciding nothing)

`joint-wide-pilot.mjs`, its output whole in `results-joint-wide-pilot.txt`. Three units were solved, and each width's paths
timed by CPU in two rounds in opposite orders; no outcome was printed. A path took:
- S327F (younger, 60 years): K2 210 ms; K4 x1.57; K6 x2.64;
- S149 (library, 39 years): K2 119 ms; K4 x1.37; K6 x2.14;
- S023-90 (27 years): K2 79 ms; K4 x1.46; K6 x2.12.

The joint move scores 20 pairings a decision at K2, 80 at K4 and 180 at K6.

**Said before the launch:** the smoke runs two units (S327F and S023-90) end to end through the read, at 6 points and 40
paths of seed 7002, after this rule was written; it began before this commit. It prints each arm's figures on those 40
paths. They are not the run's configuration and decide nothing, and the rule is not changed after them.

## Cost and time box

- **The build:** the audit, its batch and its read with its planted checks, and a smoke at tiny settings. Half a day, done
  with this commit.
- **The run:** about 24 core-hours by the pilot, about six to seven hours on four free cores. Each unit takes one solve,
  three runs of 4,000 paths and the replays. The three widths together take about 1.1 s a path for a younger couple and
  0.4 to 0.5 s for the others.
- **The read and its report:** half a day, the reviewer at the read first.

## Launch

On frozen code, through the launcher, once the build's checks pass and the cores are free:
`PREDICTION="none:EXPLORATORY: a wider joint move for couples (JOINT-WIDE.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-joint-wide.sh`.
It runs as a harness-tracked task, relaunched under `RESUME=1` after a restart.

## Amendment, 16 Nov (night), before the launch and before any unit of the run

- **The smoke:** its read first refused. The two units were under two audit stamps, because this file was edited between
  them, and the gate caught that. The first unit was run again on the committed files, and the read then ran end to end on
  both (S327F and S023-90, at 6 points and 40 paths of seed 7002). Its replays found no wider best below K2's. No part of
  the rule changed.
- **The read's line on the timing's order effect** now gives each wider arm's time against K2's by the arm each unit
  started from, in place of a mean that mixed the arms' own speeds. It is beside the rule and decides nothing.

## Amendment 2, 17 Nov (night), after two container restarts, before any outcome of the run is read

- **What happened:** two container restarts stopped the run, at about 23:44 and 01:12 UK, each losing the units in flight.
  - The first window finished none. The second finished two, S327F and S333F.
  - Of the run's files, only the stamp lines, the done lines and the files' sizes were looked at. No figure of the run was
    printed or read.
  - The units are set aside unread (`results/joint-wide-7002-stopped`).
- **Not the run's own doing:** one younger couple at full settings peaks at about 1.6 GB, so four at once use about 6.4 GB of
  the container's 15 GB (`joint-wide-pilot.mjs` on S329F, seed 99001, no outcome printed). The longest units take one and a
  half to two hours, longer than the gaps between the restarts.
- **The change, in how the run is carried out only:**
  - each arm's paths run in chunks of 1,000, and each chunk is saved as it ends;
  - a unit run again after a restart solves its tables again, then takes an arm's saved chunks only when they are this
    unit's as solved now: the stamps, the seed, the paths, the chunk, each person's table digest and the arm's options. It
    goes on from the next path, so a restart loses at most a chunk of each arm in flight;
  - each chunk records its CPU time, the CPU model and the process it ran in;
  - the read's gate also checks that each arm's chunks cover its paths in order, and that its time is their sum.
- **The time measure:** the median over the units whose three arms ran in one process, so that no unit's ratio mixes
  processes or machines across a restart. The median over all units is printed beside. Nothing else in the rule changes.
- **Its check (CHECKLIST 5):** `joint-wide-resume.mjs`, its output in `results-joint-wide-resume.txt`. The run is not
  launched until it has shown both of these:
  - a unit stopped part-way and run again must give the straight run's unit to the bit (each arm's arrays, the digests and
    the replays), in two cases: small chunks (60 paths in chunks of 20), and an arm resumed past the 200 paths the audit
    holds to the engine's own run (230 paths in chunks of 205), where only the comparison can catch a lost path;
  - its plant, a path skipped on resuming, must fail both cases.
- At a smoke's settings the audit now prints no outcome.
- The audit's stamp changes, so every unit runs again from an empty folder, S327F and S333F included.
