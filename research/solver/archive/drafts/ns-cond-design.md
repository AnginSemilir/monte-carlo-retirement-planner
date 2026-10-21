# NS-COND: the design (draft, before registration)

The re-scope of NSB proposed by the deep review after NSB (deep-review-log.md 8 Oct 17:19 UK; items/NSB.md). This is
a working draft. The registered text will be predictions/diag-nscond.md, and nothing here is registered.

## The question

At BASE's reads that touch a share-axis dead node, what carries the live corners' bequest error? The answer decides
whether a dead-node rule for the non-survival reads helps, or unmasks a live over-read (S370 and bridge 4 at 4 points).
The ranked causes (the review's CAUSE CREDENCES): NSL-UNCOND 0.45, NSL-WEALTH 0.14, NSL-SHARE 0.14, NSL-OTHER 0.27.

## The read, decomposed (per read: arm a, world k, year t, the path's state)

The corners i of the read, with weights w_i summing to 1, store log-odds ls_i, bequest b_i and shortfall h_i. They fall
in three classes:
- DS: dead on the share axis (ls_i <= DEAD_LS, b_i = 0, and the share row holds a live node), weight wd;
- X0: dead off the share axis (ls_i <= DEAD_LS, b_i = 0, the row dead throughout), weight w0x;
- L: every other corner, the KEPT nodes (ls_i <= DEAD_LS, b_i > 0) among them, weight wL = 1 - wd - w0x.

The plain read is bR = sum w_i b_i = wL B_L, where B_L = sum_L w_i b_i / wL. With bE the one-step bequest at the arm's
own move:
- elive = B_L / bE - 1: the live corners' error, and the drop rule's read where w0x = 0;
- the identity eb/bE + wd = wL elive - w0x, which is why NSB's item 1 read the live corners (FLAG 1);
- rho = S_L / s1, where S_L = sum_L w_i expit(ls_i) / wL and s1 is the one-step survival at the arm's own move;
- the copy read: bC = sum w_i b'_i, with b' item 2's swapped arrays (each DS node takes its nearest live share
  neighbour's values), eC = bC / bE - 1;
- the conditioned read: bK = (B_L / S_L) x sR, where sR is the arm's own survival read at the state (the reader's,
  RD4[0]), eK = bK / bE - 1.

NSL-UNCOND says 1 + elive is about rho: the bequest read is E[estate x alive] at the live corners, so it carries their
survival, which is not the state's.

## The items (to be fixed at registration)

- Item 1 (NSL-UNCOND), per counting cell (as NSB's cells: BASE all years, BASE non-step, COV non-step, mean wd above
  0.1, reads with wL > 0 and bE > 0). Per path:
  - dR = mean(|elive| - |(1 + elive) / rho - 1|): positive where dividing by rho brings the live read nearer bE;
  - dK = mean(|eC| - |eK|): positive where the conditioned read beats the copy read.
  Fisher flip tests, one-sided, Holm over the cells. HELD: both show on every counting cell. FALSIFIED: on every
  counting cell where the mean |elive| exceeds a materiality floor, -dR shows (dividing by rho moves the read away).
  Otherwise INCONCLUSIVE.
- Item 2: the census of changed moves under the copy rule (NSB's), with the cells and S126's opening as before.
  Whether the drop rule needs a read-time hook in the chooser is an open build question.
- Item 3: unchanged from NSB.
- Reported, deciding nothing: NSL-WEALTH's sign (elive small and not tracked by rho), NSL-SHARE's (elive large and not
  tracked by rho), the census (FAIL, NEXT and KEPT by arm and year; KEPT's bequest over survival x the largest
  estate, O128), and each read's weight on kept corners beside elive.

## The checks (the review's structural answer, [T:c-preflight])

- Every table check runs right after the solves, before any item line is printed.
- DEADSTEP (refusing): every share-axis dead node a read touches is recomputed in one step at the node, using the
  chooser holding the layer's tier as in the nodes check:
  - NEXT (its chosen move survives the year): the recompute reproduces the stored survival, bequest and shortfall;
  - FAIL (every move fails): the node stores bequest 0 and the clamp, and its shortfall is the layer-year's one
    common failure cost.
  The plants: deadh moves one FAIL node's shortfall by 1e-3 of itself, and deadnext moves one NEXT node's survival by
  1%. Each must be refused inside its own slice, with effect over tolerance and tolerance over clean error printed,
  each at least 2.
- noAccessDead (refusing): some node with no accessible money is classed dead.
- The preflight: the census mode at the registered 30 points on all five households, with every refusing check's
  fault slice printed. A slice of 0 refuses the preflight.
- replicaNS, wdRead, restore, replica, rebuild, nodes and fine: as in NSB.
