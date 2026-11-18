# The windfall and savings factorials on today's candidate (B7; D129; EXPLORATORY)

Written 18 Nov (evening), and committed before either runs. The maintainer's ruling (D129): "Add the windfall and
savings tests to the end": the research queue's last two items (B7 in D51), run after the decomposition and the guard
test. EXPLORATORY on the tuning seed, deciding nothing: no default, gate or candidate changes on either read.

## What each tests

- **The windfall split** (`WINDFALL-SPLIT.md`, D37): the year's move also chooses where that year's Auto deposit lands
  (the plan's routing; the pension then the ISA; the ISA; all taxable). `windfallSplit: true`, off in code.
- **The savings split** (`SAVINGS-SPLIT.md`, D38 (4)): a working year's move also chooses where that year's saving goes
  (the plan's; the pension first; the ISA first). `saveSplit: true`, off in code.

Both were built on 1 Nov, on the candidate then (d71f65ae871e), and their runs were designed on it. This document carries
them to the candidate as it stands.

## What changes from their designs

1. **The candidate:** 17ff82379838, as it stands (`candidate.json`), not d71f65ae871e. Since then it has taken the sweep
   to the ISA and the solve on anchors (D73) and the tie-break above the estate cap (D95).
2. **The menu each arm takes:** the candidate's own for the household. That is anchors where the solve can take them
   (`coarseWhereFits`, as `solveCandidate` asks), and the whole menu where it cannot. Both arms of a household take the
   same menu; each unit records which, and the gate refuses a household whose arms part.
   - On anchors the copies' skip is not exact: outside the deposit or working years, a solve with the copies on the menu
     is not bit for bit the solve without them (31 of `3,048,192` table entries on S026; the D73 reviewer's MINOR 4,
     `reviews/2026-11-12-default-d73-2.md`). So on anchors a split arm also differs, slightly, outside its own years.
3. **The verdict,** in GAIN-BUCKET's corrected form (its read's review of 3 Nov, finding 1: a verdict reads survival
   and spending both):
   - survival: the panel's mean change, each household counted once, beyond `1.96` se; and each household's exact
     one-sided test each way, Holm over the households at `5%`;
   - lifetime spending delivered: the panel's mean change beyond `1.96` se; and on each household a seeded sign-flip
     test of the mean each way, Holm over the households at `5%`.
4. **Paths:** the windfall factorial at `8,000` paths, as `WINDFALL-SPLIT.md` designed it; the savings factorial at
   `4,000` paths, as B7 decided it (`SAVINGS-SPLIT.md`).

Unchanged from their designs:
- the households: the windfall split on Phase 4's 17 households with a dated Auto deposit; the savings split on Phase 4's
  working households with pension or ISA contributions;
- seed 7002, estate weight `0.02`, `45` points;
- each arm held to `E.runTrial` on its first `200` paths, and `runPolicy` beside the engine;
- the split each arm's policy chose, and the pots after.

## The outcome of each, the first that holds

1. **A GAIN AND A HARM:** something up beyond noise and something down beyond noise, in either measure.
2. **A HARM:** something down beyond noise, in survival or spending, on the panel or a household.
3. **A GAIN:** something up beyond noise, in survival or spending, on the panel or a household.
4. **NO EFFECT** beyond noise.

## What each outcome leads to (B7)

- **A harm** goes to the maintainer at once, with every effect beside it.
- **A gain** goes to the maintainer as a proposal for a registered test (v2), with every effect beside it.
- **No effect:** the split is closed as measured.

Nothing changes in the candidate or the app on any outcome.

## Box

- Half a day to bring the two audits and reducers to today's candidate (with their planted checks) and to smoke them.
- The runs, at low priority when the cores are free. The windfall factorial is about `10` core-hours on the old
  candidate's times, the savings factorial about `13`. The first pair's times are checked against those, and a cost more
  than a quarter over comes back first.
- An hour to read each.

The reads go to the maintainer with the `reviewer` agent at each read.

## Amendment 1 (18 Nov, evening, before either runs; found by the windfall audit's smoke)

Phase 4's panel was landed on 28 Oct. On the code as it stands, arm A picks another policy than at that landing on 10 of
the 17 windfall households and 9 of the 27 saving households (`results-b7-labels.txt`, `b7-labels.mjs`), the engine having
moved since (item 3's year in HMRC's order, the harvest ceiling, the capital gains bill's fix). Both audits refused such a
household.
- They now take arm A's pick as it stands. It names the plan both arms solve, so a windfall is routed alike in both (D37).
- Each unit records the landing's pick beside it, and the gate holds a household's two arms to one pick.
- The targets stay the landing's, so arm A no longer survives exactly 85% on them.
- The factorials compare the two candidate arms with each other, never with arm A, so this moves nothing they compare.

## Amendment 2 (18 Nov, evening, before either runs; found by the windfall audit's smoke)

Both factorials run at `4,000` paths: B7's queue size, as GAIN-BUCKET ran, where `WINDFALL-SPLIT.md` gave the windfall
`8,000`.
- The smoke (S026 and S090, 4 points, 100 paths, three other runs on the machine) timed CANDW's engine at `316` and `455`
  ms a path against CANDD's `113` and `116`: the split's copies make the chooser three to four times as costly a path.
- At `8,000` paths that puts the windfall factorial near `19` core-hours, against the `10` its design estimated.
- At `4,000` it is near `10`.
- Nothing has run, and no figure has been seen.
