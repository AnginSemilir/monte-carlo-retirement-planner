# Couples who hold their money unevenly: stage A (EXPLORATORY)

The review of 9 Nov, item 6, stage A (`research/reviews/2026-11-09/EXPERIMENTS-AND-PORTS.md` on
review/external-2026-10-21 at f77ca16c; D66). EXPLORATORY: it decides nothing by itself (CHECKLIST 1). Its read goes to
the maintainer as a report. Stage B (a research option, off) follows only if all three parts of the rule hold. The rule
below is committed before launch, with the audit, the batch and the reducer that read it.

## The question

`solveCouple` solves each person's table on half the household's spending (`share` 0.5) from their own pots. When one
person cannot fund half alone, their table reads ruin almost everywhere, and the rollout chooses blind. Does that fault
hold at the app's 45 points on couples other than the review's, and does solving each table on that person's share of
the pots (`share` from the pots, held to 0.05 to 0.95) remove it?

## The design

- **Code:** the working branch after item 2 (`COUPLE.fast`, exact), launched on frozen code through
  `run-from-snapshot.sh` with `PREDICTION="none:..."`.
- **The reproduction first** (the review's check that the branch still gives its figures): S091, re-held 90/10, the rules
  arm with guardrails, 45 points, `share` 0.5, 300 paths of seed 4242. The review printed 53.0% for the rollout against
  85.3% for the rules (0 saved, 97 lost: `results/out-share-S091.txt`). Reported as printed; a difference is said and
  reported, not chased.
- **Couples:** S007, S079, S127, S187, S391 and S267, one from each of the library's age patterns but the youngest, all
  in `held-out.mjs touchedAll`.
- **Who holds the money** (the household's total in every wrapper kept; only who holds it changes): as the library holds
  it (60/40); 65/35; 75/25; 90/10; the first person holding everything.
- **The share rule:** 0.5; the pot share (the first person's share of the household's pots, held to 0.05 to 0.95).
- **The rules arm:** the plan's own rules with guardrails on, the 80% floor and the 5-year lookahead (as D4's arm A sets
  them, without its policy search), the target landed by bisection so it survives about 85% on the unit's own paths.
- **The rollout:** each person's table by `solveForApp` at 45 points (the candidate's settings, told the other's age),
  the couple run by the engine under `withCouple`.
- **Paths:** 500 of seed 7002 a unit, the same paths for the rules arm and both share rules (paired).
- **A unit** is one couple at one holding: the target landed once, the rules arm run once, and the rollout under each
  share rule. 30 units, plus the reproduction.
- **Size:** two couple solves at 45 points a unit (about 10 minutes each on one core) and 1,500 paths. About 15
  core-hours.

## The decision rule

Write d for the rollout's survival less the rules arm's, in points, paired on the unit's paths. A couple's interval for d
is the paired interval of `stats.mjs` `survivalChangeU` (Newcombe's method 10) at 95%.

1. **The fault is real** if, at 90/10 under 0.5, d is below -5 on at least four of the six couples.
2. **The remedy works** if, under the pot share:
   - at every uneven holding (65/35, 75/25, 90/10, the first person holding everything), on every couple, d's 95%
     interval is not wholly below 0 (its upper end at 0 or above);
   - at each uneven holding, the six couples' mean d is within 3 points (the absolute difference at most 3) of their mean d
     as the library holds the money under 0.5.
3. **The band's edge is safe** if, at 65/35, the six couples' mean d under the pot share is within 3 points of their mean
   d as the library holds the money under 0.5.

Part 3 tests the same quantity as part 2's second test at 65/35. The review states it apart because stage B's rule keeps
0.5 inside 0.40 to 0.60 and takes the pot share outside it, so 65/35 is the holding just past the band's edge.

## The outcomes

- **Part 1 fails:** the review's finding did not hold at 45 points on other couples. Reported, and item 6 stops.
- **Part 1 holds, part 2 or 3 fails:** the guard alone (D66, M4), and a report of the couples and holdings that failed.
  A better remedy (one table for the couple, or a search over `share`) is a new design for the maintainer, not stage B.
- **All three hold:** stage B now (`shareRule: 'pots'`, a research option, off), and stage C after the re-run's read.

## The files

- `audit-share.mjs`: one unit a process, its log stamped, its paths' outcomes in `results/share-7002/`.
- `batch-share.sh`: the reproduction, then the 30 units, through the launcher.
- `reduce-share.mjs`: the stamps (`requireFairLogs`), then its own gate (every unit in; one code, audit, seed and count
  of paths; within a unit every arm on the same paths and plan, the share arms differing only in `share`), then the
  rule above. `--planted` reads planted units: the gate's refusals and each part of the rule each way.
