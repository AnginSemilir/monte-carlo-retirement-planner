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
- **Spending**: a target c̄ per year, and a floor at 0.8·c̄. The plan runs to a terminal age (e.g. 95).
- **Failure**: a path fails in any year where the spending cannot be paid (unmet demand above £1), including before the
  pension can be touched. It also fails if it reaches the terminal age holding less than a **minimum pot of one year's
  target spending** (1 × c̄).
- **Returns**: each year a pot's growth factor is exp(ln(1+R) + V·z + S·ζ), where z ~ N(0,1) is drawn each year
  and ζ ~ N(0,1) once per path (a persistent shift in expected return). The tiers, as the tests ran them:

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
- a spending level ℓ from {1.2, 1.1, 1.0, 0.95, 0.9, 0.8} of the target c̄, capped at 1.1 by default;
- a withdrawal order across the wrappers;
- a risk tier, held jointly by pension and ISA: the plan's own tier, one or two below it, and optionally one above;
- how the tax-free lump sum is taken.

Changing tier needs a score gain above 0.001 (a hysteresis margin).

**State and grid:**
- s = (W, α, β, g, c), where:
  - W is total wealth;
  - α = pension / W;
  - β = ISA / (W − pension);
  - g is an unrealised-gain bucket (3 values);
  - c is the tax-free lump sum used so far (3 buckets).
- The W axis has 30 points: one at 0, then 29 geometric from 0.1·c̄ up to max(60, 6·W₀/c̄)·c̄, where W₀ is opening wealth.
  Neighbouring points are 27–31% apart.
- The α and β axes have 6 evenly spaced points each on [0, 1].
- 9,720 cells a year (30 × 6 × 6 × 3 × 3), for about 40 years.

**The value table** stores three numbers per cell and year, set out in section 4. Section 4 is the exact specification
of the recursion, the read and the bridge patch.

**How results are judged:** the solved plan is simulated forward through a tax-exact engine on 1,000–3,000 paired market
paths (each drawing its own ζ and yearly z). Each year it picks the best move at the exact, off-grid state. The
simulated survival is what a user is shown. Tests compare two versions on the same paths, with the standard error taken
from paths where they disagree.

**Cost:** one solve takes about 314 s on one core (30 points, three worlds); 1,000 simulated paths take about 69 s.

## 4. The mathematics

### 4.1 Notation

- Years t = 0, 1, …, T, where T is the last year before the terminal age.
- c̄ is the target spend a year; ℓ_min = 0.8 is the floor as a fraction of c̄; K = c̄ is the minimum end pot.
- W₀ is opening wealth.
- The pots at the start of year t are P (pension), I (ISA), G (taxable) and C (cash); W = P + I + G + C.
- Tier k has real return R_k, yearly volatility V_k and persistent shift S_k (section 2's table).
- A move is a = (ℓ, o, k, h):
  - ℓ, the spending level;
  - o, the draw order;
  - k, the tier, held by pension and ISA together;
  - h, the lump-sum and gain-harvest choice.
- The grid state is s = (W, α, β, g, c), with α = P/W and β = I/(W − P). g is the unrealised-gain bucket and c the
  lump-sum-used bucket; both are read at the nearest bucket.

### 4.2 One year

```
cash flow (exact, the engine's own rules):
  draw  ℓ·c̄ − Y_t  (guaranteed income Y_t, grossed up for income tax) from the pots in order o
  u_t(s,a)  = unmet demand in £        x_t(s,a) = the pots after drawing
  fail_t(s,a) = [ u_t(s,a) > 1 ]       (before pension access, P cannot be drawn)

growth over the year (one standard normal z shared by all pots that year):
  pot_j,t+1 = x_j · exp( ln(1 + R_kj) + V_kj · z + S_kj · ζ )       cash: R = 1.01%, V = 0
  ζ ~ N(0,1) is drawn once per path (a persistent shift of expected return)
```

### 4.3 Costs and credits

```
trim(ℓ)  = λ · (1 − ℓ)^γ               for ℓ < 1        γ = 2
raise(ℓ) = μ · sqrt(min(ℓ − 1, 0.2))    for ℓ > 1        μ = 0.003
F_t      = λ · (1 − ℓ_min)^γ · #{spending years k ≥ t}   (a failure at t: every remaining year charged at the floor)
estate   b(x) = min(x, 4·W₀)            weight w_B = 0.02 / W₀   (so w_B·b ≤ 0.08)
λ: the dislike of cuts, set per household (0.1 to 2 in these runs)
```

### 4.4 The recursion (one table per world; the world index is dropped)

Each cell holds (S_t, B_t, H_t): the probability of surviving, the expected estate credit, and the expected future trim
cost. Hats (Ŝ, B̂, Ĥ) are the interpolated reads of section 4.5.

```
for t < T, each cell s and each move a:
  if fail_t(s,a):   S^a = 0,  B^a = 0,  H^a = F_t
  else:
      s'_q = grow( x_t(s,a), z_q, ζ_world )                    q = 1..5
      S^a  = Σ_q w_q · Ŝ_{t+1}(s'_q)
      B^a  = Σ_q w_q · B̂_{t+1}(s'_q)
      H^a  = trim(ℓ) + Σ_q w_q · Ĥ_{t+1}(s'_q)  −  raise(ℓ) · S^a
  J^a = S^a + w_B · B^a − H^a

a*(s) = argmax_a J^a    (exact ties go to the larger B^a; a tier different from the tier held needs J above the
                         best move at the held tier by δ = 0.001)
(S_t, B_t, H_t)(s) = (S, B, H)^{a*}

final year t = T (no table read: exact at each node q):
  alive_q = [ W_T,q ≥ K ]
  S^a = Σ_q w_q · alive_q
  B^a = Σ_q w_q · alive_q · b(W_T,q − τ_d · P_T,q)      τ_d: the tax charged on a pension at death
  H^a = trim(ℓ) − raise(ℓ) · S^a

5-node Gauss-Hermite for N(0,1):
  z_q = 0, ±1.355626, ±2.856970        w_q = 0.533333, 0.222076, 0.011257
```

**Three worlds.** Tables k = 1, 2, 3 are solved with ζ held at (−√3, 0, +√3), weighted π = (1/6, 2/3, 1/6). The plan
used is:

```
a*(s) = argmax_a Σ_k π_k · J^a_k(s)
```

### 4.5 The grid and how it is read

```
W axis:  W_0 = 0;   W_i = 0.1·c̄ · r^(i−1),  i = 1..29,   r = (W_max / (0.1·c̄))^(1/28),
         W_max = c̄ · max(60, 6·W₀/c̄)                    (neighbours 27-31% apart in these households)
α, β axes: 0, 0.2, 0.4, 0.6, 0.8, 1.0

read at an off-grid state s:
  x = ln W;  find i with W_i ≤ W < W_(i+1);  θ_W = (x − ln W_i) / ln r        (below W_1: θ_W = W / W_1)
  θ_α, θ_β: linear within their cells
  8 corners j with trilinear weights ω_j = Π (θ or 1 − θ)
  logit Ŝ = Σ_j ω_j · logit( clamp(S_j, 1e-6, 1 − 1e-6) )
  B̂ = Σ_j ω_j · B_j        Ĥ = Σ_j ω_j · H_j
```

### 4.6 The bridge patch (F1 v2), applied only in retired years before pension access

```
1. Among the 8 corners, for each of the two W-sides: if some corners are "dead" (logit S ≤ −11.5) and some are not,
   drop the dead ones and renormalise the weights over the rest.
2. If any corner was dropped, cap the read:   logit Ŝ ← min( logit Ŝ, logit p ), where

     p = Φ( ( ln(A/Q) + m·τ ) / ( σ · f · sqrt(τ) ) )

     A = accessible money now (ISA + taxable + cash)
     Q = max over the remaining bridge years j of  Σ_{t'=t..j} ( need at the floor − money due in, year t' )
     τ = (bridge years left) / 2        (money spent evenly is invested about half the time)
     f = (A − min(A, cash buffer)) / A   (the invested part)
     m = f · (balance-weighted real return of ISA and taxable) + (1 − f) · (cash real return)
     σ = balance-weighted volatility of ISA and taxable
```

### 4.7 How the plan is judged

```
Forward simulation, per path: draw ζ ~ N(0,1) once and z_t ~ N(0,1) each year.
Each year, from the exact state, choose a*(s) as in 4.4, reading the tables with 4.5 (and 4.6).
Survival = the share of paths with no failure and W_T ≥ K.
Two versions are compared on the same paths:
  difference = (paths where only A survives − paths where only B survives) / N
  se = sqrt(number of paths where they disagree) / N
```

## 5. The cliffs

1. **End of plan.** In the final year the survival step sits exactly at W = minimum pot. Earlier, the step sits near the
   "funded" level: the floor spending still to come, plus the pot, minus guaranteed income, discounted. Its width in
   ln W is roughly V·√(years left). That's an upper estimate, since money spent early is exposed for less time.
2. **The pension bridge.** Before access age, only accessible money can pay. The step is at A ≈ Q (section 4.6), a line
   that runs across the pension-share axis α (A = W·(1 − α)), where there are only 6 points.
3. **Running out part-way.** The same shape as the first, without the pot.

**A first-order model of the end line** (a fixed reference plan: spend at the floor, one tier k, n = T − t + 1 years of
spending and growth left, since year T itself still draws and grows; at the start of year T the line is d_T + K·e^(−ρ),
not K):

```
W_T ≈ W_t · G_n − Σ_{i=0..n−1} d_{t+i} · G_{n−i}
      where d_u = ℓ_min·c̄ − Y_u (grossed up for tax)  and  G_m = exp( Σ over m years of (ln(1+R_k) + V_k·z + S_k·ζ) )

centre (the median path just reaches K):
  W*_t = K·e^(−nρ) + Σ_{i=0..n−1} d_{t+i} · e^(−iρ)          ρ = ln(1+R_k) + S_k·ζ_world

survival(W_t) ≈ Φ( ln(W_t / W*_t) / (V_k · sqrt(n_eff)) )
  n_eff ≤ n: a pound spent early is exposed for fewer years
```

The width table below uses n_eff = n. The model leaves out re-optimisation (a real plan cuts spending or changes tier
when behind), which moves both the centre and the width. That is why the grid needs more than a formula.

**The bridge line** in the same notation is where section 4.6's p = 0.5:

```
A*_t = Q_t · e^(−m·τ)       with width σ · f · sqrt(τ) in ln A
```

Here A = W·(1 − α), since everything outside the pension is accessible. So the line runs across the α axis, which has
6 points.

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

## 6. What we have measured

**Bridge (established).**
- With no patch, the table's opening survival was 43–98 points too low on bridge households. For example S126
  (pension £808k, accessible £143k, retired at 56, access at 58): the table read 56% against 99.6% simulated.
- F1 v2 brings most reads within 1.5 points, and raises survival by up to 22 points where the old read was blind.
- But it costs one case 0.8 ± 0.32 points (2.5 standard errors), and three others 0.3–0.4 points at about 2 standard
  errors. Those losses are unexplained.

**End of plan (tested in part; one test running).**
- M14b tested letting the plan move one tier above its own. With the plan held at Medium, this cost comfortable
  households survival:

  | Household | Survival without → with | Paths lost with the option | Of those, paths that bet | Ended just under the pot |
  |---|---|---|---|---|
  | S194 | 99.60 → 99.33% | 9 | 7 | 7 |
  | S162 | 99.83 → 99.63% | 7 | 3 | 7 |
  | S252 | 98.90 → 98.73% | 6 | 6 | 5 |

- Those paths finished with 0.86–0.94 years of target spending, against 1.03–1.06 without the option.
- On thin households the same bets mostly rescued paths that would have run out part-way (S330: 44 of 53 saved paths).
- **Tested (M14c):** at each position where the plan bet, the bet and the best alternative were simulated from that
  exact position on 500 fresh paths each (survival only):

  | Household | Bet minus stay (survival points) |
  |---|---|
  | S194 | −0.51 ± 0.11 |
  | S162 | +2.33 ± 0.47 |
  | S252 | −0.14 ± 0.13 |
  | S330 (control, betting helps) | +0.22 ± 0.10 |

  Pooled over the three, betting is within noise of staying: "the table misreads the end line" does not explain
  M14b's losses as a whole. On S194 the bets do lose survival when made, but the solver's score also counts cuts: at
  S194's dislike of cuts (λ = 2) a year at the floor costs as much as 8 survival points, and with the option S194 spends
  fewer years below target. So a table error and a deliberate trade are not yet told apart.
- **A newer lead, from outside review of this brief:** the final year's 5-node average is a staircase (section 4.4). For
  one pot in one year, at a pot 1.20–1.25 times the minimum, it prices Medium → Medium/High at 0.00 survival points
  where the exact cost is 2.0–3.4. The final year integrated exactly (the crossing shock) is built and is being tested
  on these households now, with and without the tier above, with each arm's cuts reported beside survival.

**Not a cliff effect.** On one household (S172) the option held a riskier tier every year and raised the median estate
by 65%, at a cost of 0.77 survival points. That is the estate term in the score doing what it was built for.

**Background.**
- The table's own survival numbers run 3–5 points optimistic in bad positions.
- More points everywhere converges slowly: numbers were still moving at 56 points, which costs about twice as much.
- Where the table's top two moves differ in simulated survival, it is a coin toss (8 better, 8 worse of 16).

## 7. What we want from you

1. **Cliff locations:** closed-form or cheap estimates of each cliff's centre and width, year by year. Include
   withdrawals, income tax on pension draws, the State Pension start, the three worlds, and flexible spending between
   the floor and the target.
2. **A representation:** a coordinate change, adaptive nodes, a different interpolant, a local boundary-fitted model,
   or something better, that resolves those cliffs. It must handle the bridge (in W and α) and the end line (in W)
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
