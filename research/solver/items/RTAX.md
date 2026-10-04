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
