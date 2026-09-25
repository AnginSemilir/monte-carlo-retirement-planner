# DRAFT - not registered. The bridge reader (7e's fifth arm): boundary template plus residual

**Status:** drafted 25 Sep 07:18 UK from the outside reviewer's second reply (`outside-review-reply-2.md`), after 7i
showed the bridge misread is the read across the share axis, not the averaging (results-bridgequad.txt). This is a
build design, not a test. 7e's prediction registers the test, and nothing below is a result.

## What the reviewer's claims were checked against (25 Sep 07:17 UK, a scratch calculation, no run)

- **The width table** (equal bills, zero drift, small v; widths in ln A for 1-4 payments left): recomputed from the moment
  recursion at v = 0.01. It gives 0.000v, 0.500v, 0.745v, 0.935v, matching.
- **The unit-template counterexample** (nodes 0.8 / 1.0 holding 0.4 / 0, query at 0.95 that can pay): with G = p, 0.85; with
  G = 0.4p, 0.40. Matching. So the template must carry a continuation value, not a bare probability.
- **The runtime allowance** (T(n) = C + nD with T(15) = 2.5 T(5)): 0.750 of a 5-point solve scales with the return
  points, and a 20% allowance is 0.267 of that loop. Matching. That makes 60-72 s on a 5-6 minute solve.
- **The S360 quantities:** its read rose 0.8 -> 2.4 while simulated survival rose 34.4 -> 36.4, and the gap barely moved
  (-33.6 -> -34.0) (results-bridgequad.txt). The plan's "the averaging changed the policy, not the read" was wrong and
  is withdrawn (O22).

## Where it sits in our code

- The grid is total wealth W (a log axis, 16 or 30 points), pension share a = pen / W (6 points, 0 to 1), ISA share b of
  the rest (6 points), gain bucket and lump-sum bucket (grid.js, `coords: 'total'`). Accessible money is A = W(1 - a) =
  s[1] + s[2] (ISA plus the taxable pot with its cash).
- A reference per bridge year partly exists in `bridgeTable` (grid.js). It computes, as LOCAL arrays not returned, `needY[t]`
  (the floor spending net of guaranteed income, plus one-off costs) and, in v2, the dated inflows `inY[t]`. It returns the
  cumulative `need[t]`, `years`, `cash[t]` (the buffer) and `sigma`, plus `req`, `mu` and `cashReal` in v2 only. sigma and
  mu are weighted by the FIRST person's ISA and taxable balances only (`owners[0]`). The reader needs the per-year bills,
  so bridgeTable must return `needY` and `inY` (a small change), and a couple needs its own treatment (O11).
- Survival is stored as log-odds per year (`lsurv[t]`) and read with the trilinear log-odds blend in `readValues`
  (grid.js), where F1 hooks in (`bridgeAdjust`). The reader hooks in at the same place, in place of F1, and leaves
  every other year's read untouched.

## The algorithm (the reviewer's, as adopted)

For each retired bridge year t, after year t's table is solved:
1. **The reference bridge chance at each node,** p_i = p_t(A_i), from the node's own accessible money. Today's bill d_0 is
   paid now, with no return before it. Later bills d_1..d_{h-1} are discounted through the accessible mix's returns. ln D
   is lognormal by the moment recursion m' = e^{-rho + v^2/2}(d + m), q' = e^{-2 rho + 2 v^2}(d^2 + 2dm + q), run backward
   over the future bills. Then p = Phi((ln(A - d_0) - mu_D) / sigma_D).
   - Exact special cases: one payment left means p = 1 if affordable (the engine's GBP 1 tolerance), else 0. Two
     payments left have the closed form.
   - A - d_0 <= 0 means p = 0.
   - With inflows inside the bridge, the requirement is the largest DISCOUNTED prefix (new: F1 v2's `req` is the largest
     UNDISCOUNTED cumulative shortfall).
   - Cash at zero yearly volatility within a world, the invested fraction counted once.
2. **The continuation value.** Where p_i >= 0.5, c_i = clip(S_i / p_i). Along each share row, c is extended to the
   unfunded side from the nearest supported node. A row with no support takes its neighbouring wealth rows. Wholly
   unsupported regions are counted, for diagnostics.
3. **The residual,** R_i = S_i - p_i c_i, stored in probability space.
4. **The read** at a position s in year t: p = p_t(A(s)) from its actual accessible money, never interpolated. Then
   S_hat = p x I[c] + I[R], with I the same corner weights as today's read but probability-linear. It is clamped to
   [CLAMP, 1 - CLAMP] and handed on as log-odds, so everything downstream is unchanged.

**One declared reference schedule** per solve: the bridge table's per-year bills and the accessible mix at the opening
balances. The query and the nodes use the same schedule, never the candidate move's own volatility.

**Bequest and the cut term:** unchanged in the first build, since the reviewer's first reply allowed B to keep its linear
read. The probes (below) measure whether B or H show the same misread. If they do, the same geometry is applied: B with
a zero bridge-failure value; H with its immediate-failure value F_t in the last bridge year, raise credits kept, and
negative values allowed.

## Its own checks, before 7e (planted, then the launcher's smoke line)

1. **The reference against Monte Carlo:** for a frozen reference path, p from the moments against the fraction of
   100,000 simulated paths that pay every bill. Checked on 1 to 6 bills, with and without an inflow. Exact at 1 and 2
   bills; the tolerance at 3 or more is stated before the check runs.
2. **Node reproduction:** the read at every grid node returns the stored S_i to rounding. A copy with the residual dropped
   must fail it.
3. **The counterexample:** 0.4 / 0 nodes, a query at 0.95 that can pay, must read 0.40 and not 0.85.
4. **Outside bridge years the read is bit for bit today's:** solve on a household with no bridge, and on bridge
   households compare every year from access on.
5. **Diagnostic probes (not anchors):** at chosen off-grid bridge states, the new read against a full Bellman evaluation
   on the solved next layer. This tests the representation's consistency, not true survival, and reports how far each
   differs and whether the best move's ranking changes.
6. **Timing:** the reader's added time on S126, bridge 6 and S366 at 16 points, beside 7e's 20% bar (at most 60-72 s on
   a 5-6 minute solve), measured when nothing else is running.

## 7e's design changes this implies (for its prediction)

- Five arms: off, F1 v1, F1 v2, F2, the reader. Every arm runs with the exact final year and 5 return points.
- **Tier eligibility and the market-world count are held fixed and identical across the arms** (the reviewer). The
  product default 'auto' decides per solve from the arm's own simulated survival, so it could allow the tier above in
  one arm and not another. 7e sets `riskAbove` explicitly (true, as 7c ran), and three worlds throughout.
- **The panel** as the reviewer asked: S126 and every known F1 loser (bridge 4, S366, share 0.78), S194, S162 and S252,
  S330 (betting helps), S172 (the trade-off control), ordinary well-funded, low-risk and cash-heavy cases, and cases on
  both sides of pension access and State Pension start. The registered panel is fixed in the prediction.
- **Reported:** survival, paired per household, with the rule that no household loses beyond two se, and the
  table-against-simulation gap. The near-front calibration and the probes are diagnostics.

## Not settled here

- **The build's size:** the reference and the continuation fit are new code in grid.js and the solve loop, with the
  cache per year and world (and per b-slice where the mix differs). A first estimate is half a day to build and test,
  not yet measured.
- **F2 is also unbuilt** (`f2-design.md`). Whether 7e waits for both builds or runs the reader against off, v1 and v2 first
  is a scheduling choice for the maintainer.
