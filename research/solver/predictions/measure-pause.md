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
- The chooser's own score over u is not the read alone: when the best move leaves the held tiers and beats the best stay move by no more than the switch margin (0.001 here), the stay move and its score are returned (solve.js, chooseAction's stay rule), and the chosen move can change between grid points; either makes a fall of up to the margin in one step that is the chooser's, not the read's (the plan-auditor's BLOCKING 2 of 6 Oct on 1fde232).
- So the measure is THE FIXED MOVE: at each flat year's own state with st[4] set to u x lsa, for u = 0, 0.05, ..., 1, every other coordinate and the held tiers as the run held them, the mixture score of the move the run took that year (the read along one move). The envelope (the chooser's own move at each u) and how often the move changes are reported beside it. The self-check (at the state's own u, through the same setter, the chooser takes the run's move and both scores equal the run's) refuses a sweep that moves anything but u.

**What the run checks before any figure:**
- each arm's u, pension pot and other pots, every year of the first 1,000 paths, equal EDGE-SPLIT's file for the arm (HYB: HYB's own HYB arm), those files first passing their own gate: the arms re-run are EDGE-SPLIT's;
- the self-check on every flat year, run on more than nothing;
- the scale plant (PAUSE_PLANT=scale: the setter writes u, not u x lsa) caught by the audit's own self-check on both arms of the plant run (the preflight asserts repro below its count, the count above 0), and refused by the gate.

**The registered figures** (reduce-pause.mjs section 2, THE REGISTERED FIGURES; the plan-auditor's BLOCKING 1 of 6 Oct on 1fde232), on the fixed move, in each arm's MAIN PAUSE BAND - SNAP, S-LO and P-LO [0.6, 0.75); P-HI and HYB [0.15, 0.25); S-HI and S-INT [0.25, 0.6); PCLSI none (EDGE-SPLIT's flat years, results-edge.txt REPORTED). Of the band's flat years with a fall ahead of u (the steepest step above u negative; a year whose read is flat or rising ahead is counted apart, as 'no fall ahead', and in neither share): WITHIN, the share whose steepest fall ahead (the most negative step between grid points with its midpoint above u) lies 0.1 or less above u; MIDDLE, the share with that midpoint in [0.4, 0.6]. The envelope's figures are printed beside them and read nothing.

No derivation script: no figure is computed before the run.

## Prediction

The deep review's reading, the author's credence 0.5 that it holds on all five of SNAP, S-LO, P-LO, P-HI and HYB:
- **SNAP, S-LO and P-LO** pause in [0.6, 0.75) with the steepest fall ahead within 0.1 above u (at the 0.725 midpoint, the step to 0.75) on most of their flat years in that band.
- **P-HI and HYB** pause in [0.15, 0.25) with the steepest fall ahead at the 0.225 midpoint on most of theirs.
- **S-HI and S-INT** pause in [0.25, 0.6); the reading puts their steepest fall ahead near SNAP's middle node (0.5), credence 0.35 - the least sure part, since S-INT interpolates everywhere and still pauses there.
- **PCLSI** has few flat years in the three bands (EDGE-SPLIT: 0.00 a path); its flat years, where it has them, carry no single steep point.

## Falsified if

A measurement settles nothing. It is read against this description, and each of these is logged in the register:
- WITHIN under a third on any of P-LO, P-HI or HYB (the reading wrong for the arms that keep one snapped edge);
- MIDDLE at a half or under on S-HI or S-INT (the middle-node part wrong);
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
  - audit-pause.mjs: audit-edge.mjs's plan, solve and forward run copied (e3 off, the identity's condition), HYB's arm added (PCLSI's tables, the snapped read); the pension-live years' states, held tiers and moves kept; the sweep at every flat year with u under 0.99 (a spent allowance cannot pause): the fixed move's score, the envelope and the move change at each u; the self-check; the scale plant;
  - reduce-pause.mjs: stamps; a plant refused; the gate (every arm once and done at EDGE-SPLIT's unit, one access line, one pathsum, the self-check passed on every flat year and run on more than nothing); the files against the logs; THE IDENTITY against EDGE-SPLIT's and HYB's files through their own gates; the reading with the registered figures; 23 planted cases (among them a flat and a rising read counted apart, a stay-rule drop the envelope reads and the fixed move does not, and the reading's registered line itself) and an EDGES line;
  - batch-pause.sh, preflight-pause.sh.

## Point and interval

80% intervals, the author's:
- **WITHIN (the fixed move, the main pause band):** SNAP, S-LO, P-LO, P-HI and HYB each 0.7 (0.4 to 0.95).
- **MIDDLE on S-HI and S-INT:** 0.5 (0.2 to 0.9).
- **Flat years a path (u under 0.99), all bands:** within 2 of EDGE-SPLIT's band totals plus the years at u under 0.15.

## Budget line

Two 30-point solves (EDGE-SPLIT's: SNAP's 618 s and PCLSI's 389 s on S130; results/diagedge/case0.txt), one per part; eight forward runs on 1,000 paths (EDGE-SPLIT's 6,000 took 638 to 1,019 s); the sweep, 22 chooser calls a flat year (the build check at 4 points: about 2.3 ms a call, 467 flat years on 20 paths). About 4 core-hours, about an hour on four cores; the preflight's timing revises it before launch.

## Changes after seeing results

None: no result has been seen. Amended before launch on the plan-auditor's FAIL of 6 Oct on 1fde232: the measure is the fixed move's score, the envelope beside it (BLOCKING 2); the registered figures named and printed in each arm's main band, with planted cases (BLOCKING 1); the preflight asserts the self-check catches the plant (MINOR 3). After the plan-auditor's PASS on 3c21081, its MINOR 1: a year with no fall ahead is counted apart, not in WITHIN or MIDDLE (a planted case added; no result seen).
