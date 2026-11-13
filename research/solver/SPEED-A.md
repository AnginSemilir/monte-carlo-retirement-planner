# The chooser's shortlist and the solve on anchors: stage A (EXPLORATORY)

The review of 9 Nov, items 7 and 10, stage A (`research/reviews/2026-11-09/EXPERIMENTS-AND-PORTS.md` on
review/external-2026-10-21 at c3fea94d; D66, D68). EXPLORATORY, seed 7002: it decides nothing by itself (CHECKLIST 1).
Each item's read goes whole to the maintainer; its stage B (the port) waits on a ruling naming this run. Both rules
below are committed before launch, with the audit, the batch and the reducer that read them.

## The question

Item 7: does the chooser scoring a shortlist (the moves the tables stored around the position, widened) instead of the
whole menu lose survival, spending or the pot left? Item 10: does the backward pass solving most cells on a shortlist
seeded by anchor cells that take the whole menu lose them, and is the solve at least 5 times as fast?

## The design

- **Code:** the working branch after items 3, 4 and 5 (the tables after item 3), with the review's two prototypes
  applied on a scratch tree, not committed to the branch: `prototype/shortlist.diff` (`SHORT`) and
  `prototype/solve-coarse.diff` (`COARSE`, `opts.coarse`), the latter's `researchFinish` line by hand. `solve()` 61,395
  bytes of V8's 61,440 with both (the review's figure). Both options off: the tables bit for bit the branch's
  (`solve-same.mjs`, S116 and S370 at 4 points). Item 10's port check against the review's two figures was made on
  f02e8741 (`results-anchors-precheck.txt`). Launched through `run-from-snapshot.sh` with `PREDICTION="none:..."`.
- **Households:** twelve. The review's eight (`audit-curve.mjs` `HOUSEHOLDS`) as Phase 4 landed them
  (`phase4-panel.mjs` readPanel); S224, S362, S366 and S370 as the library enters them. A household has a bridge year
  where its solve builds the bridge reference (`g.reader.adaptive` set).
- **Settings:** the app's solve, `solveForApp` at 45 points (the candidate's settings).
- **Arms, each scored by the engine on the same 16,000 paths of seed 7002 (paired):**
  - OFF: the solve as it is, the chooser on the whole menu.
  - Item 7, on OFF's tables, the review's eight: `structure`; `cells` with the check at 0.5 points (`cells-held@0.005`);
    `order` (read only if neither of the first two passes).
  - Item 10: ON, OFF with `coarse: { w: 2, a: 3, b: 3, g: 2, c: 2, src: 'NT', expand: 'LRVOH', climb: 3 }`
    (`w2a3b3g2c2-NT-LRVOH-h3`); on the households with a bridge year, REF (OFF with the bridge reference's lattice
    `{ na: 80, nb: 21, nz: 64, foot: true, stepAll: true }`) and ON+REF; on the review's eight, ON's tables run with
    each of item 7's widths (read only for a width that passes item 7's rule).
- **Also, item 7:** the replay on the first 100 of those paths: at each decision of the whole menu's own path, each
  width's choice at the same position, and the score it gives up (the review's `short.mjs`).
- **Times:** each unit times its solves in one process, back to back (OFF then ON; on a bridge household also REF and
  ON+REF), on one core, and records the bridge reference's seconds and a path's milliseconds under each arm. Then
  gate 5's own measurement (`batch-gate5.sh`, the machine running nothing else): the candidate as it is, then with ON,
  then with ON+REF, in the candidate's place (`GATE5_RESEARCH`).
- **Units:** three a household. A: OFF and ON solved and timed; OFF's paths; the widths and the replay (the eight).
  B: ON solved again (its tables' digest must equal unit A's); ON's paths; ON's tables with each width (the eight).
  R: whether the household has a bridge year (a 4-point probe, checked against unit A's 45-point solve); if it has,
  OFF, REF and ON+REF solved and timed, REF's and ON+REF's paths.
- **Size:** 36 units: about 16 core-hours; gate 5 three times, about three hours of a quiet machine.

## The read

For a comparison X against its base (OFF unless named), on the households it covers: d, each household's survival
under X less under the base, in points, paired on its 16,000 paths.

- **Pooled survival:** the mean of the households' d, its 95% interval from their paired variances (each household's
  variance of d from its discordant paths, summed, over the count of households squared; the normal interval).
- **A household's interval:** `stats.mjs` `survivalChangeU` (Newcombe's method 10).
- **Spending delivered:** each household's lifetime spending delivered as a share of its lifetime target, in points,
  X less base, averaged over the households.
- **The pot left:** the households' mean pot left at the end, averaged over households, X against base, in percent.

## Item 7's rule

A width passes if all four hold, the width against OFF on the review's eight:

1. the pooled survival's 95% interval has its lower end above -0.1 points;
2. no household's interval lies wholly below -0.3 (its upper end below -0.3);
3. the pooled spending delivered is within 0.05 points of target of OFF's (its absolute value at most 0.05);
4. the pooled mean pot left is within 0.5% of OFF's.

**Outcomes.** Both pass: the faster (by a path's milliseconds, pooled). One passes: that one. Neither: `order` read by
the same rule and reported, and the item stops. Each goes to the maintainer whole, with the replay's counts.

## Item 10's rule

ON passes if all five hold, ON against OFF, paired:

1. to 4. as item 7's, pooled over the twelve;
5. the solve at least 5 times as fast on one core on every household without a bridge year, by the units' own times
   (unit A's OFF over ON) and by gate 5's (the candidate on one core, as it is over with ON, on gate 5's households
   without a bridge year).

REF passes if 1 to 4 hold for REF against OFF and for ON+REF against OFF, on the households with a bridge year, and
ON+REF is at least 5 times as fast as OFF on each of them (unit R's times).

Where a width of item 7 passes: ON with that width against OFF, by 1 to 4 on the review's eight; the two ship together
only if it passes too.

**Outcomes.**
- **ON passes:** to the maintainer, for the ruling naming the run. Then stage B.
- **ON fails 1 to 4:** `w2a2b2g2c2-NT-LRVOH-h3` (every 2nd share point an anchor) once, by the same rule, in a batch of
  its own; if that fails too, report and stop.
- **ON passes 1 to 4 and fails 5:** the times reported; nothing is ported until the maintainer has seen them.
- **REF fails:** the bridge reference stays as it is; households with a bridge year then get ON alone, and the report
  says so.

## The files

- `audit-speed.mjs`: one unit a process, its log stamped, its arms' outcomes in `results/speed-7002/`.
- `batch-speed.sh`: the 36 units, through the launcher.
- `reduce-speed.mjs`: the stamps (`requireFairLogs`), then its gate (every unit in; one code, audit, seed and count of
  paths; within a household every arm on the same plan and paths, each arm's settings the base's but the option it
  tests; unit B's ON tables the same as unit A's; unit R's bridge probe agreeing with unit A's solve), then each rule.
  `--planted` reads planted units: the gate's refusals and each part of each rule each way.
