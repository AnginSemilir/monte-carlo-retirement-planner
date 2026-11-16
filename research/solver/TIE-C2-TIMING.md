# TIE-C2's speed exception, timed cleanly (D108; EXPLORATORY, seed 7001)

The plan and its rule, committed with the build before any unit of the run. The build was tried only by a smoke at tiny
settings, one couple at 6 points and 100 paths beside the share rules' run, which decides nothing. The maintainer, on
TIE-C2's read (16 Nov, night): "Clean timing decides (Recommended)". A change to this file after this commit is a dated
amendment, made before the launch and before any unit runs.

## Why

TIE-C2 passed, and its rule took LOOKHOLD, the forward look with the hold (`results-tie-c2.txt`). D105 keeps one exception
for the maintainer: an arm taken that adds more than a quarter to a couple's path comes back as a trade. The read measured
that at `x1.219`, the median over the twelve couples of LOOKHOLD's engine time a path against the candidate's (CANDS).

The reviewer at the read showed that measure tilted by the order the arms ran in (`reviews/2026-11-16-read-tie-c2.md`,
finding 1; `results-tie-c2-beside.txt` section A):
- each unit ran its four arms in one process, CANDS first;
- on the quiet units, HOLD, which makes CANDS's every move, timed `x0.987` of CANDS, and TIE4 `x0.968`;
- with that effect undone, the readings were `x1.236` to `x1.260`, so the bar sat inside the timing's own error.

This timing removes the order effect. Its median then settles the exception, as D108 rules.

## What runs

- **The couples:** TIE-C2's twelve (`audit-tie-c2.mjs` COUPLES), one unit each, one at a time.
- **Each couple's tables:** solved once by the unit, as TIE-C2's audit solved them: the couples' candidate (af001697ce1b),
  45 points, the pots' share, arm A's MPAA ages. Each person's table is checked against TIE-C2's own digest of it before
  any timing. Each person's solve is then written as the app's cache record (`src/solverCache.js` `cacheOf`).
- **Four timing processes a couple, each fresh**, run one after another, alternating the two arms:
  - CANDS, LOOKHOLD, LOOKHOLD, CANDS on the even couples (0, 2, ...), and LOOKHOLD, CANDS, CANDS, LOOKHOLD on the odd
    ones, so each arm runs first and last equally often over the twelve.
  - Each process restores the two tables from their records, as the page restores a stored solve (`solveForApp`'s
    `restore`), and checks them against TIE-C2's digests.
  - It then builds the couple with its arm's options (`audit-tie-c2.mjs` OPTS: CANDS none; LOOKHOLD `tieJoint: 1e-4`,
    `tieLook: true`, `holdPast: 2`).
  - It runs the first 50 paths of seed 7001 untimed, to warm the code, then times the first 500 paths of seed 7001,
    TIE-C2's own.
  - The time is the process's CPU time over those 500 paths (user and system, `process.cpuUsage`). The wall clock is
    taken beside it.
  - Each path's outcome (survival, the failure year, the pot, lifetime tax, spending delivered) is checked against
    TIE-C2's stored arrays for that arm, byte for byte.
- **The machine:** quiet. The batch runs after the share rules' registered run ends, through the launcher, one couple at a
  time (JOBS 1), and the session runs no solve or batch beside it. Each process records the load average at its start and
  end.

## The measure

For each couple: LOOKHOLD's CPU time over the 500 paths, summed over its two processes, against CANDS's summed over its two.
The measure is the median of that ratio over the twelve couples.

## The gate (read before the rule)

The timing decides nothing unless all of these hold:
1. every couple's unit is in, with its four processes;
2. one code stamp and one audit stamp, launched through the launcher (`fair-gate.mjs` `requireFairLogs`);
3. each couple's tables are TIE-C2's in every process, by digest;
4. each arm's outcomes are TIE-C2's for that arm on every timed path, byte for byte, in both of its processes;
5. each arm's options read back as named;
6. the timing repeats: over the twelve couples, the median of each arm's second process's CPU time against its first is
   within `x0.99` to `x1.01`.

A gate that fails is reported to the maintainer with its figures, and nothing is decided.

## The rule

- **The median at or under `x1.25`:** LOOKHOLD becomes the couples' default, by D105 as D108 rules. The change of default is
  made with the reviewer on it before it is committed (`src/solverSettings.js` `APP_COUPLE`, the decided-defaults block,
  `couple-default.test.mjs`).
- **Over `x1.25`:** the trade comes back to the maintainer, with the figures.

## Beside the rule, deciding nothing

- each couple's ratio by CPU time and by wall clock, and each arm's two processes against each other;
- by cohort, the younger eight and the library's four;
- the load averages each process recorded;
- the read's own ratios beside this timing's, couple by couple.

## What it cannot show

- It times the engine in Node. The page runs the same engine in the browser's workers, where the ratio is taken to carry.
- It times paths, not the whole of a couple's solve in the page. The tables are the same in both arms.
- Twelve couples, one seed and one estate weight, as the read.

## Cost and time box

- **The build:** the audit, its batch and its reducer with their planted checks, and a smoke at tiny settings. Half a day.
- **The run:** about two hours, as estimated: one couple at a time, a solve and four timing processes each. One couple at a
  time is slower than the hour first estimated on four cores, but it keeps the machine quiet.
- **The read:** an hour, then the change of default or the trade.

## Launch

After the share rules' registered run ends and the cores are free:
`JOBS=1 PREDICTION="none:EXPLORATORY: TIE-C2's speed exception timed cleanly (TIE-C2-TIMING.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-tie-c2-timing.sh`.
It runs as a harness-tracked task, relaunched under `RESUME=1` after a restart.
