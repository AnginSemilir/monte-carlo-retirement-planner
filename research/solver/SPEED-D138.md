# The speed work after D138 (D137 (1)): P1's memo and the shortlist keyed on the year's own count of moves

Written 22 Nov, before any of it is built or run; the maintainer's ruling D137 (1): "exact speed work right after it as its
own change, P1's memo and the chooser's shortlist keyed on the year's own count of moves rather than on the menu holding
copies, each with its identity test (box half a day to a day)". EXPLORATORY where it measures; it changes no default.

## What D138 left

A working saver's solve carries the savings split's copies, so it sets the chooser's moves a year (`r.nAt`,
`src/solver/solve.js` `splitCounts`): in a year with a choice the copies are live, in every other year they are left out
and unchoosable (`movesAt`). Two speed cuts in the forward chooser turn off for the whole solve wherever `r.nAt` is set:

- **P1's memo** (`decisionRepeats`: the moves' repeats found once a decision, not once a world, step P1), exact, on in
  the app: its guard `if (r.nAt || ...)` returns before it starts;
- **the shortlist** (`CHOOSER.mask`, the speed mode's `chooserShortlist: 'order'`), an approximation the speed mode opts
  into: `... && !r.nAt ? shortMask(...) : null`.

So a working saver's path is about twice as long on anchors (`results-save-v2-beside.txt` A, the median `x2.10`), and
the speed mode does nothing on it, in its working years and in every year after.

## The change

1. **P1's memo in every year.** The guard's `r.nAt ||` is taken out. `decisionRepeats` already finds the repeats over
   the year's own moves (its loop to `movesAt(r, t)`), and `scoreWorldOnce` writes every move past the year's count as
   unchoosable, with a tax of nought, as `scoreMovesShared` does (`movesAt(r, t, SC, BQ, TX)`). A score is shared only
   between moves whose post-decision state, class and layer are equal, which fixes the score, so it stays exact in a
   year whose copies are live too.
2. **The shortlist where the year's moves are the base menu's.** The mask's `!r.nAt` becomes "the copies not live this
   year" (`movesAt(r, t)` below the menu's length). In such a year the chooser scores exactly a non-saver's menu, so the
   shortlist does there what the speed mode does for every household. In a year whose copies are live it keeps the whole
   menu, as now: no run has measured the shortlist over the copies.

No default moves: P1's memo is exact, and the shortlist acts only under the speed mode, an opt-in.

## Its tests, each with its plant (CHECKLIST 5)

- **P1 exact on a working saver:** `chooser-once.test.mjs` takes its CAND arm back on the candidate with the split
  (D138 re-based it without, its header saying until this work). On S224, with the share check on (`CHOOSER.check`),
  every world's score, tax and estate of every move at every decision the same as `scoreMoves`' to the bit, the repeats
  found once a decision at every decision, none falling back; its plant `oncerep` caught.
- **P1 in every year:** `save-default.test.mjs` check 11: S188 under the split (check 2's solve, the test's light
  settings), P1's memo used at decisions in its years whose copies are live and in the years after, each world's memo at
  none, and the engine's outcomes on 40 paths of seed 99001 the same with P1 on and off (`CHOOSER.once`) bit for bit. Its
  plant `oncenat` in `solve.js`: P1 off wherever the copies exist, as before.
- **The shortlist keyed on the year:** `shortlist-shown.test.mjs` takes its solves back on the candidate with the split
  (S328F, self-employed, fifteen working years), its guard tested as before; and `save-default.test.mjs` check 12: S184,
  self-employed (so both routes offered), at the test's light settings in the speed mode, on 20 paths of seed 99001, no
  counted decision on a shortlist in a year whose copies are live, and decisions on a shortlist in the years after. Its
  identity: after the last year whose copies are live, the menu to the plan's end is the base menu and each year's table
  is read back from the next, so the tables are those of the same plan solved without the split, and every decision there
  is that solve's own in the speed mode at the same position. Its plant `shortlive` in `solve.js`: the shortlist in a
  live year too.
- As built (22 Nov), two departures from the lines above as first written: check 11 on 40 paths, not 200 (its claim is
  bit for bit, which a few paths through every year test as well as many), and check 12 on S184, not S328F (a light
  solve of five working years where S328F's fifteen would add minutes to the test for the same claim; S328F's solves are
  `shortlist-shown`'s).

## The identity and the time

- **The identity** (`save-default-identity.mjs`): the app's route on this code against the registered CANDSA path for
  path, 1,000 paths of seed 7025, its four households, as D138 held it. P1 exact, so it must hold to the bit.
- **The time** (a guide, EXPLORATORY, one process at a time on quiet cores; `speed-d138-time.mjs`, as built): the
  identity's four households at the default, and S090 (no working year: the speed work changes nothing on its path, so
  its figures are the measure's noise), each solved at the app's points on the code before (the merged head, dd818097)
  and after, a path's CPU on 150 paths of the tuning seed 7002, the default and the speed mode taken in turn; the
  default's outcomes must be the same on both trees.

## What it does not do

- No shortlist over live copies, so a working saver's working years stay on the whole menu under the speed mode.
- The speed mode's words stay as they stand (D137 (1)); they were measured on households the split does not reach
  (SPEED-B), and in a working saver's years after work the shortlist now does for them what it does there.
