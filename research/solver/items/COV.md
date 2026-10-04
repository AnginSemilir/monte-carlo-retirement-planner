# COV: the coverage coordinate - design note before the build (4 Oct)

Written under item 2 of the process review's list (its report of 4 Oct 13:52 UK: build option A behind a research option
now; the maintainer's yes, 'Agree, do all'; the row registered it after 7an; since the maintainer's go-ahead of 4 Oct 18:49 UK COV-B-STEP registers before 7an as family 3's root-cause step, and 7an runs on its arm) and the pre-launch review's list of what COV's registration must carry (the 4 Oct 12:09
row). The PLAN.md row is the one source for COV's status; this file holds the design.

## The mechanism (anchored in the code)

- reader.js:61 `if (x < -tol) return 0;` - the reader's chance is zero when accessible money cannot pay the year's bill,
  so the top share node a = 1 (no accessible money) is unsupported in every year with a bill (premise PR2, grade A).
- reader.js:116 `c[i] = c[g.index(ip, lo, it, ig, ic)]` - an unsupported node takes the continuation of its nearest
  supported neighbour along the share row: the flat copy (premise PR1).
- grid.js:118 - six share nodes at i/5; a read in the top cell [0.8, 1] whose own edge lies in that cell carries weight
  1 - 5(1 - a) on the copied node.

## What the state already makes simple

Every table is read through readValues(g, ..., s, ..., yr) with the state s in money (the six-slot vector) and the year
of the table being read. So a coordinate that differs by year needs no mapping between years: each year's table is read
in its own coordinates, and the backward pass forms each cell's money state with toVec. The call sites are twelve
(grid.js toState; reader.js buildReaderTable; solve.js: the cell loop's toVec at l.773, readValues at l.256, 815, 906,
972, 1025, 1306, locateVec in value() at l.1102 and 1117, and l.1607). toVec and locateVec gain the year; readValues has it.

## The fork the reviews did not settle: joint worlds

Under TS+J the move at a cell is one for every world, so a cell must be one money state in every world. acc* - the
accessible money at which the reader's chance reaches one half - depends on the world in a year with later bills
(reader.js referenceChance takes the later bills' return moments), and equals d0 less the tolerance in a world-free way
only in the last bill year [corrected by the deep review after PMAP: at every step read - a year whose reference is a
pure step, S370's pre-inflow year 3 included - it is d0 less the tolerance in all three worlds (PR6); only spread reads
differ by world]. So:

- **A1: coverage on the world-free remaining need** N_t (the zero-growth bridge need from year t, F2's own definition,
  grid.js zeroGrowthNeed - WRONG, corrected by the deep review after PMAP, deep-review-log.md 4 Oct 18:35 UK: zeroGrowthNeed, grid.js l.597-611, is the whole-plan need to totalYears; the bridge need is bridgeTable v2's req[t], grid.js l.518-527, the worst zero-growth prefix net of inflows): c = (ISA + taxable and cash) / N_t, nodes dense around 1. One state per cell in every world.
  The reader's support boundary then sits at c = acc*_k / N_t in world k - on a node only where that ratio is 1 (the last
  bill year exactly; elsewhere within a spread PMAP measures as the histogram of own money over acc*).
- **A2: coverage on acc* per world**: the boundary on a node in every world, but one cell is a different money state in
  each world, which TS+J's joint move cannot use. Rejected unless joint worlds are dropped.
- **B: share nodes on each wealth row at a*(W_j)** (f2-design.md: just either side, two a row; or the one-node variant PMAP
  measures): the boundary on the grid exactly per row, with the wealth-direction straddle a*(W) - a*(W_j) left
  (PMAP's span and its exposure size it); per-W share axes break the product grid that locate and the trilinear read assume.

## What decides between them (PMAP, before the build's main part)

- The top-cell split: if the top node carries most of the weight, every option removes most of it.
- The histogram of own money over acc*: if step reads sit near 1 and acc*_k / N_t is near 1 in the bridge years that
  matter, A1 puts the boundary close to a node in every world; if spread, A1 leaves a straddle B would not.
- Option B's leftover span and exposure: small means B is near-exact per row.

## The build (behind `coverage`, research only, default off) [written for A1; the recommendation recorded below is B]

1. A1's axis in reader years: the share axis a replaced by c on fixed nodes (for example 0, 0.5, 0.9, 1, 1.1, 2 and the
   row's maximum), a cell with c N_t above W clipped to the row; after access and in years with no reader, unchanged.
2. toVec / locateVec / readValues / toState with the year; buildReaderTable reads the year's coordinate.
3. Unit tests: coverage off is bit-identical (the golden tests); a round trip toVec -> locateVec returns the node; in the
   last bill year a supported-position read touches no unsupported node; the access transition reads the post-access
   table in shares; the solve cost measured.
4. The registration carries: A1 or B with the reason (PMAP's figures); the normalizer; the joint-worlds treatment; the
   access transition; the unit tests; O81's unmasking read by step and spread, world and stage at fixed policy; the cost;
   the one-half threshold never swept.

## The deep review after PMAP (deep-review-log.md, 4 Oct 18:35 UK)

- Its recommendation: option B, one node a wealth row at the world-free step edge a = 1 - (d0 - tol)/W_j, added in step
  years only, behind a research option. At every step read of the four bridge households the reference is a pure
  world-free step (solve.js l.634, the bills `needY - inY`), so the edge does not depend on the world; PMAP's one-node
  variant leaves a mean weight of 0.0002 (results-pmap.txt). Spread years untouched (they would unmask O81's pessimism).
- A1 only on bridgeTable v2's req[t], never on zeroGrowthNeed. With per-world acc*, B has A2's joint-worlds problem in
  spread years; at step years the edge is world-free.
- Before the build: a no-solve print of acc*_k / req[t] by household, world and bridge year (sizes the spread years).
- Its decisive test, COV-B-STEP: PMAP's unit (READER/TS+J/W0.02/PCLSI, 6 points) against the same with the node, on S130,
  S126, bridge 4 and S370 with bridge 0 the identity control; the step read less the claim at t + 1 by world and year, the
  spread reads' residual at fixed policy, a fixed-policy re-read, decisions changed, paired survival (exact, Holm) as the
  harm item; about 3.8 core-hours an arm (PMAP's own unit on its five households: the solve and world lines' secs in
  results/diagpmap sum to 13,556 s). What separates the causes: the dead node's flat copy predicts S130's step read near 7av's 12-point read (grade C, NOT SETTLED: a reference to be replaced, and squared with O86's gate, at COV's
registration; S126 has no 12-point read, so its reference is set there too); a steepening continuation, an overshoot; O81, S370's aggregate bridge term turning negative; the
  chooser moving, a gap between the fixed-policy and re-solved reads. With it, O81's own test (its gate: before any
  step-read fix is read): S370 PCLSI with readerRef 'order', one more unit (the plan-auditor's MINOR 1 of 4 Oct 18:44 UK).
- What would make it wrong: the per-row locate breaking fast.js's flow, e3's identity or the cost; the spread channel
  needing a band of world-free nodes (A1 on req gives it in one build); c concave near the edge, so the chord from 0.8 to
  the edge over-corrects.
- Not read as harm: unsupported weight is exposure; at the 141 reads below their own edge the chance multiplies c out.

## The edge print (results-covedge.txt; audit-covedge.mjs, launched 4 Oct on the light lane under "none:", a measurement)

PMAP's unit at 4 wealth points on PMAP's five households (the reference chance depends on the bills and each world's rates,
not on the grid's resolution). Every reader year and world:
- **Step years** (one bill left, or the last bill before an inflow: S130 and S126 year 1, bridge 4 year 3, S370 years 3 and
  7): acc* = d0 - 1 = req in all three worlds, exactly - the edge is world-free (PR6, now measured).
- **Spread years**: acc* differs by world, the largest over the least 1.0276 to 1.0843, and sits below req at 0.9169 to
  0.9977 of it (growth before the later bills lowers the money needed now); S370 year 4 (an inflow year, req negative) has
  acc* 0.
- **Bridge 0**: no reader year (the identity control holds).

So B's step-year node is one node a row in every world, as the deep review proposed; in spread years a per-world edge
would be three nodes 3-8% apart (A2's problem under TS+J), while A1 on req puts its c = 1 node within 0.92 to 1.00 of
every world's edge. COV-B-STEP stays in step years; spread years are A1-on-req's if they are ever touched.

## The implementation (proposed 4 Oct, for a deep review before any solver code)

How B's step-year node goes into the grid. Three ways were weighed; the third is proposed.

- **Stretch the share axis per row** (keep six nodes, top node moved from a = 1 to the row's edge a*_j, the rest spread
  evenly below it). Rejected: it moves every supported node too (the resolution changes with the node, so the test would
  blame a combination, lessons.md's 7ak close), and it removes the region above the edge, so the 141 reads below their own
  edge would read the edge node's residual (about 0) clamped, where B blends towards the dead node's own survival.
- **Snap the first unsupported node onto the edge** (shape kept; only a dead node moves). Exactly B where the edge is below
  0.8, since every node above the edge copies the edge node (reader.js l.116). Rejected: PMAP puts the unsupported weight
  in the top cell [0.8, 1], where the only dead node to move is a = 1 itself, and moving it loses the dead region as above.
- **Proposed: insert the node, ni + 1 share slots, per-row nodes in step years.** With `coverage` on, the share axis has
  seven slots. In a step year t the nodes of wealth row j are 0, 0.2, ..., 0.8, 1 with a*_j(t) inserted in order (a*_j at
  or below 0, at or above 1, or on a node: the seventh slot repeats a = 1). In every other year the seventh slot repeats
  a = 1 and is never located into (a zero-width cell); the solve copies it rather than solving it. That is B exactly, the
  old nodes all kept.
  - **The edge**: a*_j(t) = 1 - (d0 - tol/2) / W_j, half the tolerance inside the band so W_j (1 - a*_j) rounds to a
    supported position (reader.js l.61: zero only below d0 - tol). A year is a step year when every world's reference
    chance is 1 at d0 - tol/2 and 0 at d0 - 2 tol (the edge print's own test, made exact); all worlds' d0 are equal (a
    TS+J cell is one money state). A year where they differ throws.
  - **Where it reaches**: toVec(g, ..., yr) reads the row's own node; locateVec and readValues locate a once per wealth
    corner (two locates, the two rows' own nodes) in a step year, the old single locate otherwise; buildReaderTable
    already walks every slot through toVec. The twelve call sites listed above pass the year (readValues has it).
  - **Cost**: step years are one or two a household (results-covedge.txt), so about 1/6 more cells in those years and
    the second locate there; memory 7/6 throughout. Measured in the preflight against PMAP's unit, not assumed.
  - **Unit tests before the build is used**: coverage off bit-identical (the golden tests); coverage on in a plan with
    no reader year bit-identical in values to off (the seventh slot never read); round trip toVec -> locateVec returns
    the node in every slot of a step year; in a step year the inserted node is supported in every world and no read at
    a supported position touches a node above the edge (the planted fault: the node placed at d0 - 2 tol, which must
    fail it); the access transition reads the next year's table in its own nodes; e3 and fast.js's flow refuse
    `coverage` until each is shown bit-identical with it (both off in PMAP's unit).
  - **What would make it wrong**: a wealth row whose edge falls between two rows' edges is still straddled along W
    (the bilinear read across the two rows' own nodes leaves the chord between two edges; PMAP's span sizes it); the
    copied seventh slot in non-step years changing a value through the backward pass (the second unit test pins it).
