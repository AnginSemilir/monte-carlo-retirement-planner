# Brief: the solver's table blurs the cliffs

*A self-contained problem statement for a fresh reader (24 Sep 2026). Figures come from committed results files, named
in brackets; anything not yet measured is marked as a hypothesis.*

## The system

A UK retirement planner chooses, year by year, how a retired household spends and invests. The solver is a
**backward-induction dynamic programme**:

- **State**, per year t (about 40 years):
  - total wealth W on a log-spaced axis of 30 points, from 0.1 to max(60, 6 x opening wealth) years of target spending;
  - the pension's share and the ISA's share of W, 6 points each;
  - small discrete buckets for unrealised gains (3) and the tax-free lump sum used (3).
  - Neighbouring wealth points are 26-33% apart.
- **Moves**:
  - a spending level (1.2, 1.1, 1.0, 0.95, 0.9, or the floor of 0.8 of target);
  - a withdrawal order across pension, ISA and taxable account;
  - a risk tier, held jointly on pension and ISA: the plan's tier, one or two below, and optionally one above.
- **Returns**: lognormal per tier, averaged each year with 5 quadrature nodes. There are three market "worlds"
  (return shifts); each gets its own table, and a move is scored by weighting the three.
  | Tier | Real return | Volatility |
  |---|---|---|
  | High | 4.44% | 15.5% |
  | Medium/High | 3.72% | 11.5% |
  | Medium | 3.0% | 8% |
  | Medium/Low | 2.28% | 5.5% |
  | Low | 1.56% | 3% |
- **Score** of a position (what the backward induction maximises):
  - the probability of surviving, the main term;
  - plus a small estate credit, weight 0.02 (capped in these runs; log-shaped above the minimum pot under the
    estate slider);
  - plus a small credit for spending above target;
  - minus a cost for spending below target, lambda x (1 - level)^2 a year;
  - minus that same cost at the floor for every year with no money.
- **The table**: the value of every grid cell is stored each year. Survival is stored and interpolated in **log-odds**,
  clamped away from 0 and 1; the other terms linearly. At each position, the plan picks the move with the best
  interpolated score.
- **Judged by simulation, never by the table.** The solved plan is run forward through a tax-exact engine on thousands
  of paired market paths. The survival reported to a user is this simulated figure. The table's own survival read is
  known to run 3-5 points optimistic in bad positions (finding M16).
- **Cost**: one solve takes about 314 s (30 points, three worlds, one core), and 1,000 forward paths about 69 s
  (results-part-e-measured.txt).

## The problem

Hard rules make survival nearly a **step function** of the state in places ("cliffs"). The grid is coarser than those
steps, so the table reads positions near a cliff badly: both the survival it predicts, and which move it prefers.

### The bridge cliff (established)

- Before pension access age, only accessible money (ISA, taxable account and cash) can be spent. A household with a large
  pension but too little accessible money fails in the bridge years.
- The line runs across the pension-share axis (accessible = W x (1 - pension share)), where there are only 6 points.
- **With no special handling, the table's opening survival was 43 to 98 points too low** on bridge households, for
  example S126: table 56.4% against 99.6% simulated (results-f1v2.txt).
- **F1 v2**, now the provisional default, patches this with an analytic cap. It uses a lognormal chance that accessible
  money covers the remaining bridge need, counting money that arrives mid-bridge and growth.
  - Reads come within about 1.5 points on most cases, and survival rises by up to 22 points.
  - But one case loses 0.8 +/- 0.32 survival points, and three more lose 0.3-0.4 at about 2 standard errors.
  - Those losses are unexplained (results-f1v2.txt).

### The end-of-plan line (hypothesis, under test)

- In the final year a path survives only if it ends with at least a minimum pot (one year of target spending).
- In earlier years the transition is centred near the "funded" level: remaining spending at the floor, plus the pot,
  minus guaranteed income, discounted. In log wealth its width is roughly the tier's volatility x sqrt(years left).
- **That is narrower than one grid gap until about 8 years before the end** (Medium tier: 0.34 of a gap 1 year out, 0.68
  at 4 years, 0.96 at 8). It is narrower still at lower tiers; and richer households have a coarser grid, so the same cliff spans even
  less of a gap.
- Evidence it matters (results-m14b.txt, results-m14b-why.txt):
  - Allowing one tier above the plan costs comfortable households 0.2-0.8 survival points.
  - Their lost paths mostly **end just under the line** (0.86-0.94 years of target, against 1.03-1.11 without the
    option).
  - The bets that cause them are placed 4-10 years before the end, and on a test solve the table's margins at such
    bets were about 0.001 (a tenth of a survival point).
  - Whether the table actually prefers bets that simulate worse is being tested now (M14c).

### Not everything is the cliff

- On one household the option raised the median estate by 65% at a cost of 0.77 survival points. That trade is the
  score's estate term working as designed, not blurring.

## What has been tried or is known

| Approach | What we know |
|---|---|
| More points, uniformly | Converges slowly: the table's numbers were still moving at 56 points (about twice the cost of 30). Plans are stable; the numbers are not. |
| Exact evaluation in the final year | On in the product. |
| Log-odds interpolation | On by default. |
| An analytic bridge read (F1 v1, then v2) | A patch on top of the table: it helps, with some cost (above). |
| Coverage coordinate for the bridge (F2, designed, not built) | Measure accessible money in "bridge years of need" and put a grid node at coverage = 1. |
| Near-tie tie-breaking | The table's top two moves are a coin toss where they differ: 8 better, 8 worse (the step-2b ranking check). |

## The ask

Propose a way to represent the value function near these cliffs accurately at bounded cost. In particular:

1. **Where the cliffs are.** Closed-form or cheap estimates of each cliff's centre and width, year by year:
   - the end-of-plan line, the bridge, and running out part-way;
   - including withdrawals, UK income tax on pension draws, State Pension from a known age, three return worlds, and
     flexible spending (between the floor and the target).
2. **How to use that.** A coordinate change, adaptive nodes, a different interpolant, a boundary-fitted local model, or
   something else. Say how it handles the two cliffs at once: the bridge in (wealth, pension share), the end line in
   wealth.
3. **Why it would fix the bets.** An argument that it would stop a plan choosing moves that raise its table score while
   lowering simulated survival (the risk-tier bets above).
4. **A test design.**
   - Each proposal is judged by forward simulation, paired against today's solver on the same paths.
   - It must pass on the known cases: bridge households, the risk-tier households, a control where betting genuinely
     helps.
   - Criteria stated before any run: the table-versus-simulation gap near cliffs; no case losing survival beyond two
     paired standard errors.

**Hard constraints:**
- At most 20% more run time than today's solve.
- The reduced model stays exact to the pound against the engine away from the cliffs.
- Nothing is judged by the table's own numbers.
