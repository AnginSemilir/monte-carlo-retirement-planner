# RTAX: the reader's reference with this year's tax - design note before the build (4 Oct)

Written on the maintainer's decision of 4 Oct ("Many fail - fix the tax in the reader first"), after COV's flow-at-edge
print (results-covflow.txt: 846 of 5508 step-year edge cells fail every move, the unmet equal to the year's tax). RTAX is
family 3's root-cause step; COV-B-STEP waits on it (RULES.md section 9 rule 5). The PLAN.md row is the one source for its
status; this file holds the design.

## The error (anchored in the code)

- The reference's bills are `B.needY[j] - B.inY[j]` (solve.js l.634; grid.js l.504-505): spending net of guaranteed
  income, no tax. referenceChance (reader.js l.52-66) reads support as accessible money at or above d0 - tol.
- The flow's year pays savings tax, dividend tax (fast.js l.405-407, through netGuaranteed) and capital gains tax on
  what it realises (l.527-543), and fails at unmet > 1 (solve.js l.783, l.864). So the reference calls a position
  supported (p = 1) where every move fails by the tax: its solved S is the clamp, c = S/p is 0, and the copy rule
  (reader.js l.116) carries that 0 to every node above it on the share row.
- Where: low ISA share, high unrealised gain (results-covflow.txt). Up to 2497 on a bill of 83200 at the edge (3%).
- Today's reads: the reference's own edge is d0 - tol whatever the tax, so in those cells the reader is optimistic
  between the true (taxed) edge and d0 - tol (p = 1 where the year fails), and the dead edge node's c = 0 is copied up.

## The fix proposed: read the chance at accessible money net of this year's tax

- **A tax table per reader year.** At each node i of a reader year t, tau_i = the least tax (taxPaid + cgtPaid, fast.js
  l.559, c.last) any floor-level move pays when flowed from the node (the floor level is the level the reference's bills
  use: bridgeTable at Math.min(...levelOf)). World-free: the cell loop's flow is the centre world's (solve.js l.778), and
  so is this. Built once a year, before the year's reader tables, by the same flows the cell loop runs.
- **Support and the split.** p_i = chance(A_i - tau_i), A_i = W(1 - a) at the node; c_i and R_i as now from p_i. The
  node-reproduction identity p_i c_i + R_i = S_i holds unchanged.
- **The read.** readValues' reader branch reads tau with the same corner weights as c and R (I[tau]), and the chance
  at s[1] + s[2] - I[tau]. One more table read a reader-year read, nothing else.
- **Scope: this year's tax only.** The later bills (spread years) still carry no tax; they are O81's channel (the spread
  reads' pessimism) and would move in the other direction. Stated as the fix's limit, registered with an owner.
- **Behind `readerTax`, research only, default off.** Off is bit-identical (the golden tests and the reader tests).

## Why this form

- It is the reference's own error, fixed in the reference: the reader's chance is a statement about whether this
  year's bill can be paid from accessible money, and the bill the flow pays includes the tax.
- Least tax over the floor moves matches what decides death at a node (every move failing): a node is supported when
  some floor move pays the year. A reference move's tax (ai0's order) would call a node dead that another order saves.
- Interpolating tau keeps the read cheap and smooth; tau is piecewise linear in the state (allowances, bands), so the
  interpolation error is a straddle of its own, measured below rather than assumed small.

## Tests before the build is used, each with its planted fault

1. readerTax off: bit-identical (golden and reader tests).
2. tau at a node equals a direct flow's least floor-move tax (planted: tau from the most-taxed move).
3. Node reproduction p_i c_i + R_i = S_i with readerTax on (planted: p from untaxed A).
4. In a step year, no node with p_i = 1 fails every floor move (the flow-at-edge print's condition, made a test: on
   results-covflow.txt's dead cells, now p_i = 0) (planted: tau = 0).
5. A household with no taxable pot (all ISA): readerTax on equals off to the bit (tau = 0 everywhere).
6. The interpolation error: at mid-cell positions on S130's step year, I[tau] against a direct flow's tax, printed as a
   measurement (the largest gap), not a test.

## The test after the build (registered separately): RTAX-STEP

PMAP's unit (READER/TS+J/W0.02/PCLSI, 6 share points, 30 points) against the same with readerTax, on S130, S370,
bridge 4 and S126, bridge 0 the identity control (no reader year, so bit-identical); seed and paths PMAP's. Reads:
paired survival per household (exact McNemar, Holm, the household's margin) as the harm item; the step reads' p and c
before and after by cell, the count of supported nodes that fail every floor move (0 expected), copiedTop; decisions
changed; the fixed-policy re-read separating the tables' effect from the chooser's. Direction expected: pessimistic at
low-ISA, high-gain positions (the optimism removed), so a survival fall there is the fix exposing a known error, not
harm, until a decomposition splits it (RULES.md section 9).

## What would make it wrong

- The least floor-move tax understating the tax of the move the chooser actually takes (the chooser may prefer a level
  above the floor): the support is a floor statement, as the bills are.
- tau's interpolation across a band edge (CGT allowance) leaving a straddle as large as the error removed: test 6.
- The later-bill tax mattering more than this year's in spread years: out of scope, owner named.

## The deep review of the design (deep-review-log.md, 4 Oct 21:04 UK, level HIGH): four blocking, the design revised

Its answers: the floor level is right (every dead cell is a cell whose floor moves all fail: 240/240, 63/63,
results-covflow.txt); tau is tier-free (tier variants reuse the base move's flow, solve.js l.866-870; the switch cost
is charged after the fail test, l.889) and world-free (solve.js l.369, l.282-286). The fixes, each now the design:

- **tau's definition (BLOCKING 2).** Not taxPaid + cgtPaid: taxPaid includes income tax on guaranteed income
  (fast.js l.559) that the bills already net off (grid.js l.504). tau_i = max(0, A_i - d0 - L_i), L_i the best over the
  floor moves of (accessible money after the flow less unmet). On this menu it equals the least tax; it is immune to the
  income-tax double count and to menus whose moves skip a pot.
- **tau at failing nodes (BLOCKING 1).** A failing node's own tau is the drain tax, falling to 0 at a = 1, so a linear
  read across the edge's cell understates the tax at the edge. Instead: along each share row (ip, it, ig, ic) the edge
  is found by bisection on a (the best floor move just paying), its tau_edge taken there, and every failing node of the
  row carries tau_edge (flat on the dead side). The same pass gives tauMax_j, the largest row-edge tax over a wealth
  row, for COV-B (below).
- **The gain snap.** PMAP's unit runs gainInterp off, and capital gains tax is proportional to the gain: the tau read
  brackets the gain axis on its own (its own gain weight, whatever gainInterp), and test 6 measures what is left.
- **Scope: step years only.** In a step year there are no later bills (the last bridge year, or later bills that are
  net inflows), so the fix is complete there; in spread years it would be a half-fix beside O81's pessimism. readerTax
  acts in step years; tax on later bills is its own option (registered, off, not in this build). "Would move in the other
  direction" is NOT CHECKED.
- **COV-B after RTAX.** B's node at the untaxed edge is dead on the taxed rows. The node goes at d0 - tol/2 + tauMax_j,
  one a wealth row (the product structure kept), supported on every share row; the flat span left to each row's true
  edge is at most tauMax_j / W_j. Its support test: the flow-at-edge print re-run at the new node, 0 dead expected.
- **Throws.** readerTax with bridgeStep 'exact' (stepAtOf puts the step at the untaxed bills[0] - 1, solve.js l.266)
  and with readerAcc (grid.js l.362). The tau pass flows every node itself, so e3's copies and the ternary level search
  do not reach it (stated, and test 7 pins it).

## The tests, revised (each with its planted fault, the fault in the build only)

1. readerTax off: bit-identical (golden and reader tests).
2. tau against a hand-worked case: one taxable account, a known gain and dividend yield, computed in the test without
   the build's helper (planted: tau from taxPaid + cgtPaid, which includes income tax).
3. No supported node (p >= 0.5) where every floor move fails, and its converse, no unsupported node where a floor move
   pays; on the four households and on one with taxable guaranteed income in the bridge (planted: income tax in tau;
   tau = 0).
4. Node reproduction p_i c_i + R_i = S_i with readerTax on (planted in the build: p from untaxed A at the split only).
5. An all-ISA household with reader years: on equals off to the bit (planted: a non-zero tau floor).
6. Two-sided misclassification, a registered bar: at off-node positions (the top share cell included) and off-bucket
   gains on the four households, the read's p (>= 0.5 or not) against the floor flows' pass or fail at that state;
   today's reader and readerTax side by side. Bar: readerTax misclassifies under a tenth of today's off-node cases
   and no more than 1% of the positions.
7. e3 on and the ternary level search on: the tau table equal to theirs off (planted: tau taken from the cell loop).

## RTAX-STEP, revised

Step years only (readerTax acts nowhere else); the control an all-ISA household with reader years (tau 0: a check
that does something), bridge 0 kept as the no-reader identity. Read as non-inferiority on paired survival (exact,
Holm, the household's margin) plus the mechanism prints: supported nodes failing every floor move before and after
(0 after), alive-but-unsupported nodes before and after, step-read p and c by cell, decisions changed, the fixed-policy
re-read. COV-B-STEP carries the efficacy read. O81's readerRef 'order' unit (S370 PCLSI) runs beside it: O81's gate is before any step-read fix is read, and RTAX is the first. Sized before it is registered (on the 6-share grid only the band about
tau wide moves; the harm read may be underpowered).

## Before the build: the misclassification print (test 6 as a measurement, no solve)

The review's deciding test: flows at a few thousand off-node states across the four households, today's reader against
readerTax's tau (prototyped in the script, not the solver), a few minutes a household on the light lane. It decides
whether the revised tau removes the optimism or leaves a straddle as large as the error.
