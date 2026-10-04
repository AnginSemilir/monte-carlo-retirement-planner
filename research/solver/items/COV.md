# COV: the coverage coordinate - design note before the build (4 Oct)

Written under item 2 of the process review's list (its report of 4 Oct 13:52 UK: build option A behind a research option
now; the maintainer's yes, 'Agree, do all'; the row registers it after 7an) and the pre-launch review's list of what COV's registration must carry (the 4 Oct 12:09
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
only in the last bill year. So:

- **A1: coverage on the world-free remaining need** N_t (the zero-growth bridge need from year t, F2's own definition,
  grid.js zeroGrowthNeed): c = (ISA + taxable and cash) / N_t, nodes dense around 1. One state per cell in every world.
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

## The build (behind `coverage`, research only, default off)

1. A1's axis in reader years: the share axis a replaced by c on fixed nodes (for example 0, 0.5, 0.9, 1, 1.1, 2 and the
   row's maximum), a cell with c N_t above W clipped to the row; after access and in years with no reader, unchanged.
2. toVec / locateVec / readValues / toState with the year; buildReaderTable reads the year's coordinate.
3. Unit tests: coverage off is bit-identical (the golden tests); a round trip toVec -> locateVec returns the node; in the
   last bill year a supported-position read touches no unsupported node; the access transition reads the post-access
   table in shares; the solve cost measured.
4. The registration carries: A1 or B with the reason (PMAP's figures); the normalizer; the joint-worlds treatment; the
   access transition; the unit tests; O81's unmasking read by step and spread, world and stage at fixed policy; the cost;
   the one-half threshold never swept.
