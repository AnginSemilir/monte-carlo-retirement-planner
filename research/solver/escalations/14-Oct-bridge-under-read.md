# Escalation brief: value tables that under-read survival in the years before pension access

**Triggers:** 1 (two decisive tests in a row, each designed by a deep review for this family, ended with their primary
items INCONCLUSIVE: REF-2 and NODE-1) and 3 (the next planned run, NODE-AX, is over 2 hours' wall with its derivation's
'else' row at 0.95). **Run:** the maintainer's, in a deep-research window; after an hour without an answer, the agent
fallback (research/solver/escalation.md). Written for a reader who has not seen the project: every figure below is from
the project's own result files, named in section 9 for a reader with the repository.

## 1. The system

A retirement planner for UK single-person households solves a yearly decision problem by backward induction over a
discretised state, then runs the solved policy forward on simulated market paths.
- **The state (the "total-wealth coordinates"):** total wealth W on a log axis (60 points in the research runs here);
  the pension's share a = pension / W on a linear axis (6 points: 0, 0.2, ..., 1); the ISA's share b = ISA / (W - pension)
  (6 points); small buckets for unrealised gains (3) and the tax-free lump sum used (3); the year; and, in the research
  candidate, the tier pair held (three "layers").
- **The markets:** three worlds (poor, average, good), weights 1/6, 2/3, 1/6, each with log-normal yearly returns, the
  next year's value integrated by 5-node Gauss-Hermite quadrature.
- **Each year's move:** a spending level, a withdrawal order over the pots (cash, the taxable account "GIA", the ISA, the
  pension once accessible) and a risk tier pair. One move is chosen for all three worlds ("joint worlds"), on the
  mixture-weighted score.
- **Survival:** paying every year's floor spending until the plan's end and ending above a minimum pot. The table stores
  survival in log-odds per node and reads it at an off-node state by multilinear interpolation of the log-odds.
- **The forward run:** at each year the chooser re-scores every move at the path's exact state, reading next year's table
  at the five quadrature returns, and takes the best; the run's survival is what the tables are judged against.

**The bridge.** Before the pension can be drawn (age 57 here), only the accessible money A = ISA + taxable account (cash
and GIA) pays the bills. In those "bridge years" the survival table is read by **the bridge reader**, not by plain
interpolation: survival S at each node is split as S_i = p(A_i) x c_i + R_i, where p(A) is a closed-form reference chance
that accessible money A pays every remaining pre-access bill; c_i = clip(S_i / p_i, 0, 1) where p_i >= 0.5 (else copied
along the share row from the nearest supported node); R_i = S_i - p_i c_i. At an off-node query the read is
p(A_query) x blend(c) + blend(R), so the sharp cliff in A is carried by p exactly and only c and R are interpolated.
- **The reference p** (the default): the accessible money as one log-normal mix of its pots at their opening weights,
  paying the bills' discounted sum (moment-matched). **ORDER** (research option `readerRef: 'order'`): the money split at
  the opening weights, drawn pot by pot in the better of the menu's withdrawal orders, simulated and tabulated.

## 2. The problem

At bridge-year states the tables under-read the policy's own simulated survival. On S360 (a tuning-set household: pension
153,000, ISA 14,400, GIA 3,600, cash 9,000; pension share 0.85; an 8-year bridge at a floor of about 4,000 a year), the own
opening's table against its runs, 4,000 paths a world, seed 7002, 60 wealth points:

| arm | world 0 (poor) | world 1 | world 2 (good) |
|---|---|---|---|
| default reference, 6 share nodes (BASE) | -12.6088 | -12.6293 | -7.1558 |
| ORDER, 6 share nodes (BO) | -4.9991 | -4.9116 | -3.5434 |
| ORDER, 15 share nodes dense about 0.85 (BN) | -2.1707 | -1.8647 | -0.8732 |

(points of survival, table less runs; the runs' exact 95% half-width is about 1.7 points). A table that reads a household
5 or 12 points too low steers its choices (a de-risked opening, a lower spend) and misreports the plan. The same family
(the reference's pessimism with the reader at the bridge) covers S364 (a near-dead household whose under-read the
proportional mix carries in full: NE-REF) and a 95% share household (the default reference's year-0 read at the initial
state 82.6409 against runs of 95.7584; ORDER's 95.6140). A sister family (UR) holds an under-read on S224 with no bridge
year at all, which 120 wealth points and 15 return nodes did not move.

## 3. The record, in order

- **NE-REF** (13 Oct; S364, near-dead): the reference's proportional mix carries all of S364's log gap under the residual
  scaling RS (MIX 2.9332 of G 2.7723 in world 1, 2.1270 of 2.0418 in world 2); drawn pot by pot at the opening weights
  (ORDER's form) carries most of it (MIXO 2.5088, 1.8206), the state's own pots the rest (MIXS 0.4245, 0.3064); the engine
  beyond the reference nothing. Grade B, one run.
- **REF-2** (13 Oct; designed by the deep review after NE-REF): all three items INCONCLUSIVE. Under ORDER, RS still deepens
  S360's world-0 under-read by 0.9042 points (1.2586 under the default). At S360's year-1 states ORDER at the opening
  weights is within GAP 0.0293, -0.0109, -0.0201 (log) of the engine's own bridge payment under the better fixed move, yet
  the tables under-read by about 5 points. An item on the 95% share household never reached its mechanism.
- **Step 0** (a read-only decomposition after REF-2; grade C, unregistered): ln(runs) - ln(table) = POLICY + SAMPLE + GAP -
  COPY exactly; under ORDER on S360 POLICY carries it - the policy pays 205, 207 and 223 bridges (of 4,000 a world) that
  the better fixed move loses and loses 3, 0 and 0 (about 5.05, 5.18 and 5.58 points); 194, 189 and 187 are paid by
  neither fixed order. On S364 the same gain is 0.04 and 0.08 points: there the reference carries the gap.
- **The deep review after REF-2** concluded: at S360's share (0.85, inside the cell from 0.8 to 1.0) the read takes c and R
  from the covered node at 0.8 and the dead node at 1.0, so the table is the reference's chance at the query; the policy's
  re-optimisation within the bridge (a one-step-lookahead rollout on p) is what the tables miss. Ranked O152-NODE 0.55
  (the share cell), O152-MODEL 0.25 (the solve reads the base move's value even at a node).
- **NODE-1** (14 Oct; designed by that review): 15 share nodes lift S360's table by 2.9784 of a gap of 5.1491 in world 0
  and 3.2969 of 5.1616 in world 1 - shares 0.5784 (0.4390 to 0.8384) and 0.6387 (0.4746 to 0.9756) - item 1 INCONCLUSIVE
  (HELD needed a bottom of 0.5, FALSIFIED a top of 0.25). The option is inert off (bit for bit). The dense solve took
  11,562 s against 3,899 s on one core.
- **The deep review after NODE-1** (14 Oct 06:33 UK; scratch arithmetic on approximated rates, grade C): the cliff in A
  narrows over the bridge (5-95% width about 11.7k in year 0 to 1.1k in year 6), so the late years still sit inside one
  share cell even at 0.025 spacing (a cell about 4.4k to 4.9k of money), and carrying R unmasks the wealth axis there.
  Ranked: N2-SHARE 0.42 (the late cells), N2-B 0.12 (the ISA-share axis), N2-MODEL 0.12, N2-W 0.10 (wealth), N2-QUAD 0.07,
  N2-NOISE 0.05, other 0.12.

## 4. The planned run that triggered this (NODE-AX)

Built and preflighted (not registered): re-solve BN and BO as NODE-1's, and on each simulated path telescope exactly
OWN - survived = sum_t T_t + sum_t G_t, where G_t = (the table read at the year's state) - (the one-step value of the move
the policy takes there) and T_t = that one-step value - (next year's table read at the realised next state) (quadrature
error plus path noise). In the bridge years G_t is split into the cash read, the wealth, pension-share and ISA-share
terms (each axis read alone in the reader's form from exact backups at its two nodes) and the rest. Self-checks pass
(the backup at grid nodes reproduces the stored table to 1e-9; the two-point reader form reproduces the real read; the
identity closes on every path). Items: the pension share's part of BN's bridge residual (HELD at a bottom of 0.5 in
worlds 0 and 1, FALSIFIED at a top of 0.25); its years 3 to 6; BO's share term exceeding BN's by 2.5 points (the known
positive); a clearance that the one-axis terms add (the rest at most half).
- **Why it fires trigger 3:** the only record of the per-path spread of these terms is the preflight at 4 wealth points,
  where cells are enormous: per-path standard deviation about 8 points for the bridge residual and the share term,
  12.4 for BO less BN (correlation of the share term with the residual 0.53). At that spread, 2,000 paths a world put the
  'else' row at 0.95 (the share term's interval about +/-0.2, the known positive held 0.34); 8,000 paths, 0.78. The
  60-point spread is likely far smaller, but no record of it exists without the 3.2-hour dense solve.
- **The cost:** BN about 3.50 h (the dense solve and the ledger), BO about 1.35 h, on two cores.

## 5. The code (file:line, quoted)

- The reader's read: src/solver/grid.js:419 "const v = pr * cc + rr;" with c and R blended from the cell's corners
  (l.417-418), p at the query's accessible money (l.411 "const acc = g.readerAcc ? g.readerAcc(s) : s[1] + s[2]").
- The split: src/solver/reader.js:97 "c[i] = Math.min(1, Math.max(0, S[i] / p[i]));" at a supported node (p >= 0.5);
  reader.js:134 "R[i] = S[i] - p[i] * c[i];".
- The default reference: src/solver/solve.js:666-669, the mix's spread at the opening weights ("const v = wi * vi + wg *
  vg + wc * vc;"); ORDER: solve.js:671 "if (opts.readerRef === 'order') {" and reader.js orderChance.
- The share axis: src/solver/grid.js:124 "axes.a = linAxis(COV ? n2 - 1 : n2); if (SN) axes.a = nodesAxis(SN);" (the
  explicit list added for NODE-1, research only).
- The one-step value: src/solver/solve.js scoreMoves (l.1463 onward): flow, the switch charge, then the next year's table
  read at five quadrature returns in the layer of the tiers moved to; in a "step year" (one bill left) an exact step
  integration (stepExpect).
- The forward chooser: solve.js chooseAction (l.1343): the mixture of the three worlds' scores at the exact state.
- The sheltered cash: grid.js toVec sets out[6] = -1, "a cell reads the year's typical value" (the run's states carry the
  real value; at the preflight's nodes a value of 0 moved no backup).

## 6. Ruled out, and by what (grades: A arithmetic or code, B a registered result, C a measurement or scratch, D judged)

- The engine beyond the reference on S364: nothing (NE-REF, B).
- The proportional mix as the whole of S360's gap: ORDER removes most of the default's under-read (12.6 to 5.0 points;
  REF-2, B) but not the rest.
- A fixed-move reference (ORDER or the state's-own-pots reference REF-S) carrying S360's remainder: the remainder is the
  policy's re-optimisation within the bridge (Step 0, C).
- Quadrature at year 1 (five nodes against a fine integral: ratios 0.998 to 1.001; REF-2, B).
- The share option altering anything when off (NODE-1 item 2, A).
- RS (residual scaling) as a fix: it scales away real policy gain (deep reviews, C); it stays out of any panel.

## 7. The constraints

- The regimen: every run is registered before launch (prediction, falsifier, decision rule with exact tests and three
  outcomes, a decision table with an 'else' row, derived credences); figures are read only by the registered rule; an
  independent plan auditor reviews each change.
- No product decision here: the candidate's settings stay; no share-axis or wealth-axis default; a research option must
  be bit-identical when off. One tuning seed (7002) for research; a held-out seed is reserved for the panel.
- Solve time: the dense 15-node solve costs about 3 times the 6-node one (11,562 s against 3,899 s on one core); the
  product's own solve must stay within its gate (minutes, not hours). Four cores; runs over 2 hours with an 'else' row of
  0.6 or more need this review first.

## 8. The asks

1. **Mechanisms the record has missed.** Why would 15 share nodes, dense about the household's own share, close only
   about 60% of a 5-point under-read? Is the under-read the familiar downward bias of interpolating a maximum (the value
   of an off-node state exceeds the interpolation of node optima where the policy re-optimises), and is there a standard
   correction (e.g. interpolating in a transformed coordinate that follows the cliff, endogenous grid points, upper
   envelopes, or carrying the policy's gain as a shift in money as in the endogenous grid method)?
2. **Methods and literature** on value-function interpolation near a sharp survival cliff in a borrowing-constrained
   life-cycle model with a liquidity bridge (accessible money must cover several years before a locked pot opens):
   adaptive or cliff-tracking grids, Smolyak or sparse grids, monotone or shape-preserving interpolation, Monte Carlo
   value correction, and how the literature measures interpolation bias against forward simulation.
3. **The root causes, ranked with credences,** among: the share cells in the late bridge years (the cliff narrowing
   below a cell); the wealth axis unmasked; the ISA-share axis; the forward chooser's re-optimisation at exact states that
   no node backup can hold (a model-level gap); the quadrature at the late cliffs; something else.
4. **The one decisive test,** with held, falsified and inconclusive lines and its cost on four cores, that can settle the
   leading cause with an 'else' row under 0.6 - including whether NODE-AX's ledger is worth running and, if so, how
   (paths, which terms, a cheaper record of the per-path spread first), or a different design.
5. **Under trigger 3: what would leave NODE-AX wasted** (an additive split that does not add; a known positive the split
   cannot see; a spread too wide for any affordable path count).

## 9. The files (for a reader with the repository)

research/solver/: results-neref.txt, results-ref2.txt, results-ref2-reported.txt, results-policy-gap.txt,
results-node1.txt, results-derive-node1.txt, results-derive-nodeax.txt (the derivation at the 4-point spread);
predictions/diag-ref2.md, diag-node1.md; audit-nodeax.mjs, reduce-nodeax.mjs (the planned ledger); deep-review-log.md (13
Oct 18:36, 13 Oct 23:45 and 14 Oct 06:33 UK receipts); PLAN.md rows O36, O150-O155, PR20, NODE-1, NODE-AX, REF-S.
