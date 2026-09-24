# F2: making the table see the bridge cliff (design, not built)

Written 24 Sep 2026 alongside F1 v2 (PLAN.md schedule 7d; the F1 result section, "F1 is a patch on the read, not a fix to
the table"). No run rests on this. The choice between F1 v2 and F2 is made after the pitfall sweep (8d).

## The problem F2 fixes, and F1 does not

In a retired bridge year the household can spend only its accessible money (ISA, taxable account, cash) until pension
access. Whether it gets there is close to a step in the pension share `a`: below `a* = 1 - N/W` (N the floor need to
access, W total wealth) the accessible money covers the bridge; above it, it does not. The table holds survival on six
share nodes and blends between them in log-odds. When `a*` falls between two nodes and the upper node is dead, the blend
puts the cliff in the wrong place and reads a covered household as nearly dead (#106; S126 read 47.7 against 99.9
simulated).

F1 (v1 and v2) corrects the read after the fact, in one place: it drops the dead corners beside live ones and caps the read
by a closed-form chance the money lasts. The table itself still has the wrong shape, so:
- the moves are still chosen from that table in every year before the read is corrected (the policy is the table's);
- the cap is a lognormal approximation, coarse for long, lean bridges (S360: v2's cap, worked out from its inputs, reads
  about 27 against 44 simulated in the fold - results-f1-misses.txt; not yet solved);
- under the mixture the cap uses the centre world's growth in every world;
- any other hard limit that falls between grid nodes (the pitfall sweep's pattern) needs its own patch.

## Two ways to put the cliff on the grid

**A. A coverage coordinate in bridge years.** In a year before access, replace the share coordinate with coverage
`c = accessible money / remaining floor need` (the need net of dated inflows, as F1 v2's requirement counts it). The cliff
is then at `c = 1` for every wealth level, so one fixed node there puts it exactly on the grid: nodes on a log scale in
`c`, dense around 1 (for example 0.5, 0.8, 0.95, 1, 1.05, 1.25, 2, 4 and above). After access the coordinates are as today.
- For: the cliff is a node, not an interpolation; the blend on either side is smooth; no cap, no closed form.
- Against: the transition from a bridge year to the next needs the state mapped between coordinate systems (at access, from
  coverage back to shares), a new interpolation in the read, and the grid's size in bridge years changes. The largest
  change of the two: grid.js (coordinates, locate, read), fast.js (the flow is unchanged, only where states land), and
  the tests of both.

**B. A node at the cliff.** Keep the share coordinate, but in bridge years add, for each wealth node, share nodes just
either side of that node's `a*(W)`. The grid stops being a plain product of axes in those years (the share nodes depend
on W), so the read needs a per-W share axis.
- For: a smaller change to the transition (the coordinates are the same kind in every year).
- Against: the per-W axis complicates locate and the trilinear read; with a moving need (inflows, costs) `a*` moves each
  year, so the nodes must be rebuilt per year.

**Leaning A**, because the cliff sits at one fixed place in its coordinates, and the pitfall sweep may find the same
pattern elsewhere (a hard limit on a ratio), which a ratio coordinate handles the same way.

## How it would be tested (a prediction written before any run)

The same cases as the F1 v2 test (the twelve S126 variants, S120-S130, S360, S366, S370), off against F2 and against F1 v2,
paired on the same paths, on the step-6 defaults in the mixture. F2 is worth its cost only if it reads the class within
+/-5 without a cap, reads S360 materially closer than F1 v2 does, and costs no survival anywhere. Its effect on the moves
(not only the read) is measured by the years the pension sits below its tier and the simulated survival.

## Open questions

- Couples (O11): a couple can have two bridges. The couple solver gives each partner a single table (their own money,
  half the spending), so F1 reads each partner's own bridge - but the household can fund one partner's bridge from the
  other's money, which neither table sees. F2 would have to decide whose coverage the coordinate measures.
- The cost: the grid's size and the solve time in bridge years, measured on the first build before any batch.
