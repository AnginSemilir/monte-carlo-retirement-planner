# FOOT-S366: the adaptive reference's floor at no accessible money, fixed and tested (detail for PLAN.md's AREF row and its 18 Oct 01:41 ledger row)

Proposed by the deep review after AX-HO (deep-review-log.md 18 Oct 01:41 UK); adopted under the maintainer's standing go-ahead
and hand-over of 17 Oct.

## The defect (O177; grade B, the code and AX-HO's saved tables)

S366's bridge year 4 is its inflow year: an inheritance pays more than the year's bill, so the bill is negative. The adaptive
reference's readV returns p 0 at no accessible money whatever the year's inflow (src/solver/adaptive.js:86
"if (!(A > 0)) return 0;", and :88 below the lattice's floor, which is log(max(100, 0.5 d0)), 100 whenever the bill is
negative). The top share node (no accessible money) reads p 0 in year 4 though the inheritance pays the year; under the
support line it is unsupported, copies c from its neighbour and keeps R = S (reader.js), so a query in the top share cell
reads S plus its weight times c, survival counted twice and clamped near 1: an over-read bounded by one less the survival,
2.0889 points in S366's world 0 (results-axho.txt) and near nothing in worlds 1 and 2. The order reference sends a negative
bill to cash and reads S366 at its runs. The RS split scales a corner's R only where the corner's p exceeds the query's, and
here the corner's p is 0, so the default split reads the same. The reach: 15 of the 60 bridge households, every deposit-mid
one at its year 4 (S362, S366, S370, S374, S378, S382, S386, S390, S394, S398, S402, S406, S410, S414, S418).

Same pattern searched: one latent fault (O178): the lattice's top, log(3 rem + d0) (adaptive.js:78), is NaN or below the
floor when an inflow exceeds its year's bill plus three times the later bills, and readV then indexes a negative cell; no
library household reaches it. referenceChance, orderChance, clearStep, astar and simulate handle A = 0 or a negative bill.

## The fix (a research-only option, off by default)

- An A = 0 node in each bridge year before the last, valued by the same backward step through the flow as the lattice's.
- readV interpolating between that node and the lattice's first point, in place of returning 0.
- The lattice's top at log(3 rem + max(d0, 0)), which removes the NaN case.
- Inert where no inflow covers its year's bill: shown bit for bit on S360 and S364 at 4 points, with a plant.

## The jobs

- J1F (the adaptive reference, the RS split and the fix) and J1D (the adaptive reference and the default split) on S366, seed
  7004, 60 points, 4,000 paths a world, each paired with AX-HO's saved J1 and J2 on the same paths (that reuse fair-tested).
- S362, a held-out deposit household: J1 against J1F at 30 points, on the spare cores.

## The items (the review's; the registration sets the rules)

- J1F's world-0 year-4 residual within half a point, and its table at its own opening against its runs within 1.5 points.
- J1D against J1: equal within half a point if the floor is the cause (the review's credence that the default split reads the
  same over-read, by the code: high).
- J1F against J2: no material harm, with the moves differing.
- Reported: the reader probe's sum over unsupported corners at year 4 against J1's per-path year-4 residual.

Cost: AX-HO's 60-point ledger jobs ran 64 to 70 minutes; the review's estimate about 1.2 h wall plus the build.

## After it reads, before a default goes to the maintainer (the review's list)

- A held-out deposit household outside the fix: another of the 14, not S362, which FOOT-S366 itself runs (the plan-auditor's MINOR 2 of 18 Oct 02:01 UK).
- Gate 5: each E2 part builds its own reference (solve.js:605-607), so the build is serial wall time (NOT CHECKED by a run).
- A design-reviewed test file: p against simulate() at the reader's own grid corners, including A = 0 in an inflow year, the
  NaN top planted.
- The 7u-F panel with deposit households and a read item by world.

## STOP until FOOT-S366 reads

A reference default put to the maintainer; R3's decomposition run alone; adaptive-reference tests on S360 or S364 only
(neither has an inflow); 7u-F with the adaptive reference; refTook, the simulated column or the engine leg cited as covering
grid corners (they sample path records only); a change to the copy or split construct; gate-5 work on the build.
