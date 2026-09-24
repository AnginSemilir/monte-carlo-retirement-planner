# Brief: the retirement solver's table blurs the cliffs

*Self-contained: you will not have the code, so everything needed is written out here. 24 Sep 2026. Measured figures
come from runs of the real system; anything not yet measured is marked as a hypothesis.*

## 1. The task in one paragraph

A dynamic-programming solver plans a UK retiree's spending, withdrawals and investment risk year by year. Its value
table sits on a coarse grid. Some rules make the chance of the money lasting jump sharply at a line ("a cliff"), and
where the grid is coarser than the jump, the table reads positions near the line wrongly. That makes the plan choose
moves that score well in the table but do worse when simulated. We want a way to represent the value function near
these cliffs accurately, at no more than 20% extra run time, and a test design to prove it.

## 2. The household and the rules (one person; all money in today's pounds, inflation 2.5% removed)

- **Wrappers**, each held at a risk tier:
  - a defined-contribution **pension**: it can only be touched from its access age (e.g. 58). 25% of each withdrawal is
    tax-free, up to a lifetime total of £268,275; the rest is taxed as income.
  - an **ISA**: tax-free.
  - a **taxable account**: gains taxed as capital gains; the unrealised gain is tracked.
  - **cash**: at the Cash tier.
- **Guaranteed income**: the State Pension from its age (e.g. £8,200 a year from 68), plus any other income. Income tax
  (rest of UK) has a personal allowance of £12,570, 20% to £50,270, 40% to £125,140 and 45% above, with the allowance
  tapered from £100,000; Scotland has its own bands.
- **Spending**: a target T per year, and a floor at 0.8T. The plan runs to a terminal age (e.g. 95).
- **Failure**: a path fails in any year where the spending cannot be paid (unmet demand above £1), including before the
  pension can be touched. It also fails if it reaches the terminal age holding less than a **minimum pot of one year's
  target spending** (1 x T).
- **Returns**: each year a pot's growth factor is exp(ln(1+R) + V·z_year + S·z_path), where z_year ~ N(0,1) each year
  and z_path ~ N(0,1) is drawn once per path (a persistent shift in expected return). The tiers, as the tests ran them:

  | Tier | Real return R | Yearly volatility V | Persistent shift S |
  |---|---|---|---|
  | High | 4.79% | 17.1% | 2.14% |
  | Medium/High | 4.24% | 13.42% | 1.69% |
  | Medium | 3.69% | 9.93% | 1.31% |
  | Medium/Low | 3.14% | 6.89% | 1.03% |
  | Low | 2.60% | 5.19% | 0.97% |
  | Cash | 1.01% | 0% | 1.57% |

## 3. The solver

**Moves (actions), chosen at the start of each year:**
- a spending level ℓ from {1.2, 1.1, 1.0, 0.95, 0.9, 0.8} of T, capped at 1.1 by default;
- a withdrawal order across the wrappers;
- a risk tier, held jointly by pension and ISA: the plan's own tier, one or two below it, and optionally one above;
- how the tax-free lump sum is taken.

Changing tier needs a score gain above 0.001 (a hysteresis margin).

**State and grid:**
- s = (W, a, b, g, c), where:
  - W is total wealth;
  - a = pension / W;
  - b = ISA / (W − pension);
  - g is an unrealised-gain bucket (3 values);
  - c is the tax-free lump sum used so far (3 buckets).
- The W axis has 30 points: one at 0, then 29 geometric from 0.1·T up to max(60, 6·W₀/T)·T, where W₀ is opening wealth.
  Neighbouring points are 27–31% apart.
- The a and b axes have 6 evenly spaced points each on [0, 1].
- 9,720 cells a year (30 × 6 × 6 × 3 × 3), for about 40 years.

**What each cell stores:**
- S, the probability of surviving, stored as log-odds (clamped at 10⁻⁶ and 1 − 10⁻⁶);
- B, the expected estate credit;
- H, the expected future cost of spending below target.

**Backward induction, for each cell and move:**
1. Apply the year: take ℓ·T minus guaranteed income, grossed up for tax, from the wrappers in the chosen order.
2. If the move fails this year: S = 0, B = 0, and H = F_t. F_t is the charge for a year with no money, λ·(1 − 0.8)², summed
   over the remaining spending years.
3. Otherwise, grow the post-withdrawal pots at the move's tiers over 5 Gauss-Hermite nodes in z_year, and read next
   year's table at each resulting state:
   - S = Σ w_q S_{t+1}(s′_q);
   - B = Σ w_q B_{t+1}(s′_q);
   - H = λ(1 − ℓ)² for ℓ < 1, plus Σ w_q H_{t+1}(s′_q).
   - A raise (ℓ > 1) adds 0.003·√(ℓ − 1)·S to the score.
4. Score = S + 0.02·B − H (plus the raise credit). The cell keeps the best move; ties must be exact.
5. **Final year:** S = 1 if the grown total is at least the minimum pot, and 0 otherwise. This is evaluated exactly at
   each quadrature node, not read from a table. B = the estate credit of wealth net of the tax charged on a pension at
   death.

λ, the dislike of cuts, is set per household and ranges from 0.1 to 2 in these runs.

**Reading the table off-grid:**
- Trilinear interpolation over (ln W, a, b): linear in ln W between points, and linear in W below the first non-zero
  point.
- The nearest bucket for g and c.
- S is blended in log-odds; B and H linearly.

**Three worlds:** three tables are solved, each with z_path held at −√3, 0 or +√3 for the whole horizon. A move's score
at a position is the three tables' scores weighted 1/6, 2/3 and 1/6.

**The bridge patch (F1 v2), now the provisional default:**
- In a retired year before pension access, the survival read is capped by
  p = Φ((ln(acc/req) + m·τ) / (σ·f·√τ)), where:
  - acc is the accessible money (ISA + taxable + cash);
  - req is the most the bridge still needs at the floor, net of money due to arrive, across its remaining years;
  - τ is half the bridge years left;
  - f is the invested share of acc (not the cash buffer);
  - σ is the balance-weighted volatility of the accessible pots;
  - m = f·(their balance-weighted real return) + (1 − f)·(cash real return).
- If the table's interpolated read is above p, p is used.

**How results are judged:** the solved plan is simulated forward through a tax-exact engine on 1,000–3,000 paired market
paths (each drawing its own z_path and yearly z). Each year it picks the best move at the exact, off-grid state. The
simulated survival is what a user is shown. Tests compare two versions on the same paths, with the standard error taken
from paths where they disagree.

**Cost:** one solve takes about 314 s on one core (30 points, three worlds); 1,000 simulated paths take about 69 s.

## 4. The cliffs

1. **End of plan.** In the final year the survival step sits exactly at W = minimum pot. Earlier, the step sits near the
   "funded" level: the floor spending still to come, plus the pot, minus guaranteed income, discounted. Its width in
   ln W is roughly V·√(years left). That's an upper estimate, since money spent early is exposed for less time.
2. **The pension bridge.** Before access age, only accessible money can pay. The step is at acc ≈ req, a line that runs
   across the pension-share axis a (accessible ≈ W·(1 − a) in these coordinates), where there are only 6 points.
3. **Running out part-way.** The same shape as the first, without the pot.

**The end-of-plan cliff against the real grid.** Width is 1 standard deviation, in units of the grid gap, computed with
the solver's own grid code:

| Household (grid gap) | Tier | 1 year left | 2 | 4 | 8 | 16 |
|---|---|---|---|---|---|---|
| S194 (27%) | Low | 0.22 | 0.31 | 0.43 | 0.61 | 0.86 |
| S194 (27%) | Medium | 0.41 | 0.58 | 0.83 | 1.17 | 1.65 |
| S194 (27%) | High | 0.71 | 1.01 | 1.42 | 2.01 | 2.85 |
| S162 (31%) | Medium | 0.37 | 0.52 | 0.73 | 1.04 | 1.47 |

At the Medium tier, the whole cliff is narrower than one grid gap for the last 6–7 years. At the Low tier it is
narrower for more than 16 years. The table therefore interpolates straight across a step there.

## 5. What we have measured

**Bridge (established).**
- With no patch, the table's opening survival was 43–98 points too low on bridge households. For example S126
  (pension £808k, accessible £143k, retired at 56, access at 58): the table read 56% against 99.6% simulated.
- F1 v2 brings most reads within 1.5 points, and raises survival by up to 22 points where the old read was blind.
- But it costs one case 0.8 ± 0.32 points (2.5 standard errors), and three others 0.3–0.4 points at about 2 standard
  errors. Those losses are unexplained.

**End of plan (hypothesis, under test).**
- M14b tested letting the plan move one tier above its own. With the plan held at Medium, this cost comfortable
  households survival:

  | Household | Survival without → with | Paths lost to the bets | Of those, ended just under the pot |
  |---|---|---|---|
  | S194 | 99.60 → 99.33% | 9 | 7 |
  | S162 | 99.83 → 99.63% | 7 | 7 |
  | S252 | 98.90 → 98.73% | 6 | 5 |

- Those paths finished with 0.86–0.94 years of target spending, against 1.03–1.06 without the option. The bets were
  placed 4–10 years before the end.
- On thin households the same bets mostly rescued paths that would have run out part-way (S330: 44 of 53 saved paths).
- On a test solve, the table's score margin at such bets was about 0.001, a tenth of a survival point.
- **Hypothesis:** the table misreads positions near the end-of-plan line, where the grid is coarser than the cliff. A
  test running now compares, at each position where the plan bet, the bet against the best alternative, simulated
  from that exact position.

**Not a cliff effect.** On one household (S172) the option held a riskier tier every year and raised the median estate
by 65%, at a cost of 0.77 survival points. That is the estate term in the score doing what it was built for.

**Background.**
- The table's own survival numbers run 3–5 points optimistic in bad positions.
- More points everywhere converges slowly: numbers were still moving at 56 points, which costs about twice as much.
- Where the table's top two moves differ in simulated survival, it is a coin toss (8 better, 8 worse of 16).

## 6. What we want from you

1. **Cliff locations:** closed-form or cheap estimates of each cliff's centre and width, year by year. Include
   withdrawals, income tax on pension draws, the State Pension start, the three worlds, and flexible spending between
   the floor and the target.
2. **A representation:** a coordinate change, adaptive nodes, a different interpolant, a local boundary-fitted model,
   or something better, that resolves those cliffs. It must handle the bridge (in W and a) and the end line (in W)
   together.
3. **The mechanism:** why it would stop the plan choosing moves whose table score is higher but whose simulated
   survival is lower (the risk-tier bets above).
4. **A test design:**
   - criteria fixed before any run;
   - judged only by forward simulation, paired against today's solver;
   - cases: bridge households, the risk-tier households, and a control where betting genuinely helps;
   - measures: the table-versus-simulation gap near the cliffs, and no case losing survival beyond two paired standard
     errors.

**Hard constraints:**
- At most 20% more run time than one solve today.
- The year's cash flows stay exact to the pound against the engine; only how the table is stored and read may change.
- A result counts only when simulated, never from the table's own numbers.
