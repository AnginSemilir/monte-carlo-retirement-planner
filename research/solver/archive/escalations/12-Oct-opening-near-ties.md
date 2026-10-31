# Escalation brief: a lifetime risk choice decided by near-ties

**Trigger:** 2, the maintainer asks (12 Oct, the session). **Run:** the maintainer's, in a deep-research window; after an
hour without an answer, the agent fallback (research/solver/escalation.md). Written for a reader who has not seen the
project: every figure below is from the project's own result files, named at the end for a reader with the repository.

## 1. The system

A retirement planner for UK single-person households solves a yearly decision problem by backward induction over a
discretised state:
- **The state:** total wealth on a log axis (30 points in the shipping product, 0.1 to about 60 years of spending); the
  pension's share of wealth (6 points); a few tax buckets (gains, the tax-free lump sum used); the year.
- **The markets:** a mixture of three worlds (poor, average, good), weights 1/6, 2/3 and 1/6, each with
  log-normal yearly returns integrated by 5-node Gauss-Hermite quadrature.
- **Each year's move:** a spending level, a withdrawal order, and a risk tier for the pension and for the ISA. The
  "tier pair" is either 0/0, the plan's own tiers (e.g. High Risk), or up to 2/2, two steps less risky (e.g. Medium).
- **The score:** in survival-equivalent units. Survival to the plan's end counts only with the end total at or above a
  minimum end pot (the plan's own, else one year's spending). Small extra terms: an estate weight of 0.01 to 0.02 on a
  bequest utility, a raise credit of 0.003, and a dislike of spending cuts. A score gap of 0.001 is a tenth of a
  percentage point of survival.
- **The run:** the forward chooser simulates each path year by year, re-scoring the moves at the path's true state off
  the stored value tables (interpolated between grid nodes).

**Switching between tiers.**
- **The shipping product:** solves the tables as if switching were free. Its forward chooser suppresses a tier change
  unless it beats the best stay-put move by a margin of 0.001 (SWITCH_MARGIN). Paths then switch tier about 0.03 to 0.04
  times in a 40-year plan.
- **The research candidate:**
  - adds the tier held to the state (the "tier state");
  - chooses one move for all three worlds ("joint worlds"; the product's tables pick per world);
  - charges each switch 0.001 in both the backward and forward passes (the "switch charge", with margin 0).

## 2. The problem

**What it is.** The year-0 move sets the opening tier, and the margin or charge then holds that tier for decades. So a
single year-0 comparison largely decides the household's lifetime investment risk. That comparison is routinely a
near-tie: the gap between the best opening and the best stay-in-the-plan's-tier opening is of order 1e-4 to 1e-3, at or
below what the tables can resolve.

**What the record shows** (one tuning seed unless said; "saved / lost" are paths one arm survives and the other does not,
out of 8,000 paired paths):
1. **Near-ties decide openings, and some lose badly.**
   - S126: gap 8.0e-4, inside the 0.001 margin. Lowering the margin to 3e-4 changes its opening and removes a harm.
   - S194: gap 7.6e-4. Share 0.95: 4.3e-5. S360: 5.6e-4. On S360, opening de-risked loses 497 paths and saves 9, while
     the tables read the de-risk as better by 0.33 points.
2. **Fixes move openings onto knife edges.**
   - The tier state with joint worlds opens de-risked on gaps 0.5% to 13% above the margin. 7 of 25 openings sat within
     10% of it.
   - With the switch charge in both passes, 1 of 18 de-risked openings sits within 10%.
3. **Openings flip with the grid.**
   - Bridge 4 and S194 flip between 30x5 and 60x5 or 30x15 (wealth points x share points).
   - Share 0.95 under the charge flips 0/0, 2/2, 0/0 across 30x5, 30x15 and 60x5.
   - The product's own gap moves -14% and +28% with the grid.
4. **The year-0 gap is non-smooth in the inputs.** A half-step test shows a part that ignores the input's sign and is not
   monotone in the step. Ranked causes: interpolation and argmax kinks of the 30x5 solve, the nearest-node snaps, and
   the bridge reader's reassembly (grade C).
5. **The forward chooser and the stored decisions disagree.**
   - At the 0.001 margin, the forward run holds where its nearest stored cell leaves on 21% of held path-years, against
     6% the other way.
   - With the switch charged in both passes, a net 6.5 points remain, attributed to the grid itself (one node, one
     seed).
6. **The bad world's de-risk is under-priced.** The tables price it at about 0.6 of the gain it realises at its node.
   Refining the grid does not cure this; margin 0 raises it to 0.74.
7. **The margin costs value both ways.** It blocks a late re-risk the tables want, which costs estate. Judged by survival
   alone and by the whole score, verdicts disagree on 36 of 220 past comparisons.
8. **The tier prices themselves shift.** Blending each tier's return at its median rather than linearly cuts the
   de-risk's charge from 1.10 to 0.79 points a year, and moves 2 of 14 openings.
9. **Many lost paths end just under the end pot.** Of the paths a riskier choice loses, 47% to 67% paid every year and
   ended below the minimum end pot, short by a median of about a third of it.
10. **A proposed unifying mechanism.** Moves whose scores differ by less than the tables resolve are decided by menu
    order or interpolation noise. In one probe, any tie tolerance from 1e-10 up rewrote the tax paid on every path.

## 3. What has been tried, and what it settled

- **The margin as a dial:**
  - margin 0: about 10 switches a path, half reversed within three years;
  - margin 3e-4: removes S126's harm;
  - margin 0 in year 0 only (the "freed opening"): harms S360 under the product's read (9 saved / 497 lost), and loses
    to the tier state with joint worlds on the whole score.
- **The tier state:**
  - alone: no gain to credit (falsified);
  - with joint worlds: gains (S126: 40 / 0 and 47 / 0 at the two estate weights), but on knife-edge gaps.
- **Decompositions:** removing the per-world tier choice, not the opening, recovers 21 of the tier state's 25 lost paths
  (grade B, two households). The switch charge's size is settled (held).
- **The bridge reader's step inside the chooser** is not the cause of S126's harm (grade B).
- **The panel test (10 Oct):** the candidate (tier state, joint worlds, charge) against the shipping product on 25
  households. 4 items held, 4 inconclusive. Three households (S224, S364, S380) are left unsettled, and their follow-up
  test is held: the wealth axis's size changes the candidate's policy.
- **The grid (running now):** a separate line of work, NE-GRID, is measuring the wealth axis. At 60 points the tables
  move materially from 30. A 120-point run, launched 12 Oct, reads tonight. A 120-point solve costs about 1.5 times a
  60-point one, and the product has a solve-time allowance ("gate 5") that a uniform 60 points already exceeds; about
  40 points fit (judged).

**Open:** no opening rule has been designed. The project's rules forbid designing one from a flip until the
non-smoothness (item 4) has its own test. The open register rows are O17, O24, O26, O30, O33, O37, O39, O41, O44, O46,
O47, O48, O49, O60, O67 and O100. All carry grade C causes; none is settled.

## 4. The constraints

- **Every change is a registered test.** Each has a written prediction, a derivation of its expected outcome, exact
  tests against a margin with Holm correction and three outcomes (held / falsified / inconclusive), tuning households
  first, held-out seeds after.
- **No product change without the maintainer's decision.**
- **Solve time:** the product's allowance (gate 5).
- **Determinism:** one household's solve must be reproducible bit for bit.

## 5. The asks

1. **Mechanisms the record has missed.** Is the near-indifference real (a flat objective, where any choice is fine
   and the harm comes from the hold) or an artefact (the tables' resolution, so the gap is noise)? How would one tell
   the two apart cheaply?
2. **Methods and literature** (cite what you rely on):
   - optimal switching and hysteresis with switching costs;
   - a posteriori error bounds for approximate dynamic programming;
   - choosing among near-tied actions under approximation error, such as re-ranking the top few openings by Monte
     Carlo rollouts on common random numbers, smoothing or regularising the choice, minimax regret, or a default that
     keeps the plan's tier;
   - how lifecycle portfolio or retirement decumulation models handle discrete, sticky risk choices.
3. **The root causes, ranked, with credences that sum to 1.**
4. **The one decisive test.** Its households (from S126, S194, S360, bridge 4, share 0.95, S380, S224), arms,
   held / falsified / inconclusive lines and cost in solves. Say what it would change.
5. **What the shipping product should do now** when its year-0 gap is below a stated resolution: keep the plan's tier,
   re-rank by simulation, tell the user it is a near-tie, or something else. Give the trade-offs.

Answer in prose with a short ranked summary first. Mark each claim as derived, from the literature, or a judgement.

## Files (for a reader with the repository)

- **Register rows:** research/solver/PLAN.md, rows O17 to O100 above.
- **Detail pages:** items/O24.md, items/O67.md, items/7u.md.
- **Code:**
  - src/solver/solve.js:57 "export const SWITCH_MARGIN = 0.001;"
  - solve.js:416-423, the switch charge;
  - solve.js:1385-1412, the forward chooser's margin and charge;
  - solve.js:1110 and 1118, the backward pass's charge and margin;
  - solve.js:1863, PRODUCT_BASELINE (points 30).
- **Results:** results-7v.txt, results-7w.txt, results-7x.txt, results-7y.txt, results-7aa.txt, results-7aa-gaps.txt,
  results-7ab.txt, results-7ac.txt, results-7ad.txt, results-7ad-beside.txt, results-7ae.txt, results-7af.txt,
  results-7ag.txt, results-P.txt, results-P-slices.txt, results-o41.txt, results-o60.txt, results-7ai.txt,
  results-7am.txt, results-7t-deep.txt, results-verdicts-whole.txt, results-probe-tailm.txt, results-7u.txt.
- **The deep reviews:** deep-review-log.md (27 Sep 02:07, 28 Sep 13:56, 14:47, 19:09 and 22:52, 30 Sep 18:03 and 19:56,
  5 Oct 09:27 UK).
