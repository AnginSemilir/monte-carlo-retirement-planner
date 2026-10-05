# Prediction: measure-pause

- **Run:** `research/solver/batch-pause.sh` - results/diagpause/case0-3.txt (audit-pause.mjs, four parts of two arms), read by `reduce-pause.mjs` into results-pause.txt
- **Kind:** measurement
- **Written:** 6 Oct, before the run (its time is its registering commit's, git log). The design is O103's gate ("where each arm pauses, measured before any next run is designed: the steepest point of each arm's read over the used allowance on S130 against its flat years, all eight arms, from the gated files and tables"), scheduled first by the deep review after XAS-R (deep-review-log.md 5 Oct 23:18 UK: "O103's measurement now"), under the maintainer's standing go-ahead of 4 Oct ("I go ahead with your recommendations ... until I say stop").
- **Seeds:** 7005 (EDGE-SPLIT's), the first 1,000 of its 6,000 paths (research/engine.mjs pathsForSeed builds each path from the seed and its own index alone, so they are EDGE-SPLIT's first 1,000). No held-out seed is touched.
- **Unmasking:** none: a measurement. It changes no arm and reads no outcome; it reads the shape of each arm's own read over the used allowance at the states where the arm pauses.
- **Plan section:** PLAN.md O103 (the register), and the schedule's PAUSE row; FORCE's design follows it

## Question

EDGE-SPLIT's arms pause in different places (results-edge.txt, REPORTED: S130's flat years with the pension live, a path's mean by the used share u's band [0.15, 0.25) / [0.25, 0.6) / [0.6, 0.75)): SNAP and S-LO 0.00 / 0.00 / 6.86, S-HI and S-INT 0.00 / 6.95 / 0.00, PCLSI 0.00 / 0.00 / 0.00, P-LO 0.00 / 0.00 / 8.65, P-HI 6.08 / 0.00 / 0.00, HYB 6.08 / 0.00 / 0.04. The deep review's reading (grade D, O103): each arm pauses just below the first steep point of its own read over u - the snapped edge it keeps (0.75 for SNAP, S-LO and P-LO; 0.25 for P-HI and HYB), and for S-HI and S-INT, which pause in the middle band on SNAP's tables, SNAP's middle node valued under the snapped read.

Where, at each arm's flat years, does its own read fall most steeply as u rises, and does that point lie just above where the arm pauses?

## Derivation

**From the code (grade A):**
- The allowance axis has three buckets, u = 0, 0.5 and 1 (grid.js pcls). The snapped read (SNAP's forward read, HYB's) takes the nearest bucket: a value piecewise flat in u with steps at 0.25 and 0.75. The interpolated read (PCLSI) is linear between buckets. pclsSeg 'lo' interpolates at or below the middle bucket and snaps above it (a step at 0.75 kept); 'hi' interpolates at or above it and snaps below (a step at 0.25 kept) (grid.js, pclsSeg and the segment test at the file's end).
- The chooser's score of a move at year t reads the next year's tables at the move's own u (this year's u plus this year's tax-free draw), so a step in the read at u' shows in the chooser's score over this year's u at or below u'.
- So the measure is the chooser's score of its best move (chooseAction over the mixture) at each flat year's own state with st[4] set to u x lsa, for u = 0, 0.05, ..., 1, every other coordinate and the held tiers as the run held them. The self-check (the score through the same setter at the state's own u equals the chooser's score of the move it took) refuses a sweep that moves anything but u.

**What the run checks before any figure:**
- each arm's u, pension pot and other pots, every year of the first 1,000 paths, equal EDGE-SPLIT's file for the arm (HYB: HYB's own HYB arm), those files first passing their own gate: the arms re-run are EDGE-SPLIT's;
- the self-check on every flat year, run on more than nothing;
- the scale plant (PAUSE_PLANT=scale: the setter writes u, not u x lsa) refused by the self-check in the preflight, and a log carrying a plant refused by the gate.

No derivation script: no figure is computed before the run.

## Prediction

The deep review's reading, the author's credence 0.5 that it holds on all five of SNAP, S-LO, P-LO, P-HI and HYB:
- **SNAP, S-LO and P-LO** pause in [0.6, 0.75) with the steepest fall ahead within 0.1 above u (at the 0.725 midpoint, the step to 0.75) on most of their flat years in that band.
- **P-HI and HYB** pause in [0.15, 0.25) with the steepest fall ahead at the 0.225 midpoint on most of theirs.
- **S-HI and S-INT** pause in [0.25, 0.6); the reading puts their steepest fall ahead near SNAP's middle node (0.5), credence 0.35 - the least sure part, since S-INT interpolates everywhere and still pauses there.
- **PCLSI** has few flat years in the three bands (EDGE-SPLIT: 0.00 a path); its flat years, where it has them, carry no single steep point.

## Falsified if

A measurement settles nothing. It is read against this description, and each of these is logged in the register:
- under a third of the flat years in the arm's main pause band with the steepest fall ahead within 0.1 above u, on any of P-LO, P-HI or HYB (the reading wrong for the arms that keep one snapped edge);
- the steepest fall ahead of S-HI's and S-INT's pauses away from 0.5 (outside [0.4, 0.6]) on most of their flat years (the middle-node part wrong);
- the identity failing: the arms re-run would not be EDGE-SPLIT's, which refuses the run at the gate.

## Fair-test table

One set of arms (EDGE-SPLIT's, and HYB's HYB arm), measured on their own states; no comparison is tested.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - lambda held, no landing |
| 12 | The paths | EDGE-SPLIT's first 1,000 (seed 7005) | the same | SAME - and held to EDGE-SPLIT's files year for year by the identity |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - no rival |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 31 | Paired or not, and the standard error used | counts, shares and medians | the same | N/A - no comparison carries a standard error |
| 33 | For timings: what else the machine was running | n/a | n/a | N/A - no timing is read |

- **All other rows: SAME**

## Decision fed

FORCE's design (the deep review of 5 Oct 16:36 UK; O103): where each arm's read falls steeply says where a forced taxable draw up to the personal allowance would meet the pause. If the reading holds, FORCE is registered as designed, its arms read per pause band; if it fails on the one-edge arms, the pause is not the read's step, and FORCE's mechanism line is rewritten before it registers. No default, no product change.

## Provenance

- **The design:** O103's gate (the plan-auditor's FAIL of 5 Oct 16:35 UK and the deep review of 16:36 UK); scheduled first by the deep review after XAS-R (5 Oct 23:18 UK).
- **The build:**
  - audit-pause.mjs: audit-edge.mjs's plan, solve and forward run copied (e3 off, the identity's condition), HYB's arm added (PCLSI's tables, the snapped read); the pension-live years' states and held tiers kept; the sweep at every flat year with u under 0.99 (a spent allowance cannot pause); the self-check; the scale plant;
  - reduce-pause.mjs: stamps; a plant refused; the gate (every arm once and done at EDGE-SPLIT's unit, one access line, one pathsum, the self-check passed on every flat year and run on more than nothing); the files against the logs; THE IDENTITY against EDGE-SPLIT's and HYB's files through their own gates; the reading; 15 planted cases and an EDGES line;
  - batch-pause.sh, preflight-pause.sh.

## Point and interval

80% intervals, the author's:
- **The share of flat years in the main pause band with the steepest fall ahead within 0.1 above u:** SNAP, S-LO, P-LO, P-HI and HYB each 0.7 (0.4 to 0.95); S-HI and S-INT 0.5 (0.2 to 0.9).
- **Flat years a path (u under 0.99), all bands:** within 2 of EDGE-SPLIT's band totals plus the years at u under 0.15.

## Budget line

Two 30-point solves (EDGE-SPLIT's: SNAP's 618 s and PCLSI's 389 s on S130; results/diagedge/case0.txt), one per part; eight forward runs on 1,000 paths (EDGE-SPLIT's 6,000 took 638 to 1,019 s); the sweep, 22 chooser calls a flat year (the build check at 4 points: about 2.3 ms a call, 467 flat years on 20 paths). About 4 core-hours, about an hour on four cores; the preflight's timing revises it before launch.

## Changes after seeing results

None.
