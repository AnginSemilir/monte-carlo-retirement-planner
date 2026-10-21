# Opening risk-tier near-ties: mechanisms and discriminators

Labels: **(derived)** algebra, checked where possible. **(toy)** my toy model, not the product: one world, spending 1 a year, 40 withdrawals, success = pay every year and end at or above P = 1 year, the brief's medians, log-vol from the equity weights with assumed σ_e 0.16, σ_b 0.06, ρ 0.1, one common shock, linear interpolation in log wealth, plan tier 0.9, menu 0.9/0.7/0.5. **(record)** the brief or the repo at ff13828 ([brief][B], [solve.js][S]). **(literature)**, **(judgement)**. Scripts and outputs: `mechanisms/` (run1 to run5).

## Conclusions: ranked root causes (judgement) and candidate decisive tests

### Takeaway
The near-indifference is **both real and unresolved, and the two parts do different damage**. Real: under free-switching tables the year-0 gap is one year's effect. Under a consistent switching charge it is bounded by c plus one year's effect. Either way it is small by construction (derived). Unresolved: at 30 points the toy's differential table error is 30–50% of the gap, which the record's grid flips match. The harm in the product comes mainly from the **hold**: tables price one year, while the forward margin realises a lifetime. Under the consistent candidate, a wrong near-tie pick costs at most the true gap plus the table's differential error. The cheapest discriminator compares four numbers per household: the table gap, an exactly integrated one-step gap, the spread across node shifts, and paired common-random-number (CRN) rollouts at margin 0.001 and at margin 0. The rollouts cost no solves; the node shifts cost 5.

### Cited Findings
- Draft root causes, ranked by credence that each is the *dominant* cause of the brief's problem (harmful, grid-fragile year-0 openings). Credences sum to 1 (judgement):
  1. **The hold is inconsistent with the tables** (product: free-switching tables plus a forward-only margin). The tables price one year; the path realises about H_eff years. Explains items 1, 5 and 7, and the product side of item 6. **0.30**
  2. **The tables cannot resolve the differential (tier-to-tier) error.** Its source is max-then-interpolate linear tables whose node kinks are sampled by 5-node quadrature, giving an O(1/n) error at 30 points. Explains items 3 and 4, part of item 6, and the fragility behind item 2. **0.28**
  3. **Genuine one-year flatness** (bound c + δ1; the selection effect in item 2). Makes near-ties generic, but under a consistent model they are cheap. **0.12**
  4. **Per-world (clairvoyant) continuation in the product's tables** (the chooser averages three per-world tables, solve.js:1361-1369). An information relaxation that over-credits later fixes. Record: removing it recovers 21 of 25 lost paths. **0.10**
  5. **Auxiliary terms decide survival near-ties** (item 7). **0.07**
  6. **The end-pot cliff** (item 9; also feeds cause 2 through first-order interpolation error). **0.06**
  7. **Snaps on secondary axes or the bridge reader's reassembly.** **0.04**
  8. **Secondary criterion and menu order** (item 10; mostly affects tax, not tiers). **0.03**
- Evidence: for 1, Q1 ([run1b](mechanisms/run1b_output.txt)); for 2, Q4 ([run2](mechanisms/run2_output.txt)).
- **Design A, the resolution audit, which is also item 4's own test** (cheapest; must run before any opening rule is designed).
  - *Households:* S126, S194, S360, bridge 4 and share 0.95 as the tuning set; S380 and S224 as the unsettled pair.
  - *Arms per household:* the 30x5 baseline plus node shifts of ¼, ½ and ¾ cell plus 28 and 32 points (5 new solves). On each, read the year-0 gap g (best opening minus best plan-tier opening) three ways: (i) the product chooser; (ii) the year-0 re-score with the next-year interpolant integrated exactly against each world's normal; (iii) a half-step ladder of s = 1, ½, ¼ and ⅛ cell in both signs, fitted as E(s) = a·s² + b·|s| + J.
  - *Resolution:* ρ = max(SD of g across the 6 variants, |g_product − g_exact|).
  - *Lines:*
    - Artefact **held** if ρ ≥ |g| on ≥ 4 of the 5 tuning households, then confirmed on S380 and S224.
    - **Falsified** if ρ ≤ |g|/3 on ≥ 4 of the 5.
    - Otherwise **inconclusive**.
    - Item 4 sub-lines: "kink comb" held if the exactly integrated gap restores E ∝ s² (b and J within tolerance) on ≥ 4 of 5. "Snap" held if jumps J ≠ 0 persist under exact integration and move with the share or tax axis rather than with wealth.
  - *Cost:* 35 solves at 30 points. Re-scores and ladders cost no solves.
  - *What it changes:* if held, any |g| < ρ is a tie. The product keeps the plan's tier or re-ranks by rollouts, NE-GRID priority rises, and exact year-0 integration becomes a candidate change that costs no solves. If falsified, the openings are resolved and the harm must come from the hold or the per-world mismatch, so Design B decides.
- **Design B, the hold × resolution factorial with paired CRN rollouts** (decisive between "flat + hold harm" and "artefact").
  - *Households:* the same seven.
  - *Arms:* the top two openings forced at year 0, then: (i) the product chooser (free tables, margin 0.001); (ii) the candidate (tier state, joint worlds, charge in both passes); (iii) the product tables at margin 0. Each runs on 30x5 and on 60x5, or 120x5 once NE-GRID reads. A fixed-tier-for-life policy evaluation gives L, the lifetime gap.
  - *Predictions.*
    - The hold mechanism predicts that in (i) D tracks L, not g (|D − L| ≤ 0.3|L| and |D| ≥ 5|g|). In (ii) and (iii), |D − g| stays within 2 SE.
    - The artefact predicts that in (ii) and (iii), D disagrees with the 30x5 g beyond max(2 SE, ρ), and that g at 60x5 moves toward D.
  - *Lines:*
    - Hold **held** when, on ≥ 4 of 7, D in (i) differs from g by more than 0.001 toward L. Test with a one-sided exact McNemar test on discordant pairs, Holm over 7 households, AND equivalence to within 0.001 in (ii).
    - **Falsified** if D in (i) is within 0.001 of g on ≥ 4 of 7.
    - Otherwise **inconclusive**.
  - *Cost:* 14 new 60x5 solves (product and candidate × 7), about 2.5 times the cost of a 30x5 solve each (judgement). Add 14 fixed-tier policy evaluations, or 0 if done by rollout.
  - *Paths:* equivalence at 0.001 needs about 80,000 paired paths when the discordant share is 2% (below), across tuning and then held-out seeds.
  - *What it changes:* if the hold is held and the candidate is consistent, the product's harm is the margin, the fix is consistency (already the candidate), and near-ties under the candidate need only deterministic tie handling. If the artefact is held, no opening below ρ is trusted.
- **Design C, item-6 closure** (3 to 6 solves). On 7ac's units (S126, bridge 4, S194), run TS+J at margin 0 on (a) 30x5, (b) 60x5 and (c) 30x5 with an exactly integrated year-0 re-score, and read the poor world's price/realised ratio. Table error **held** if (b) or (c) raises it from 0.74 to ≥ 0.9 on 2 of 3. A structural mismatch is held if it stays ≤ 0.8 under both. Otherwise **inconclusive**. This decides whether the 26% residual is grid noise or a modelling inconsistency.

### Inferences
- Credences are about which cause *dominates*. The causes are not exclusive: causes 1 and 2 act together on S360-type harms (judgement).
- All three designs keep to the constraints: no mortality, annuities or regime belief; the maintainer's household is never used; outcomes are registered, with tuning households first and held-out seeds after. Design A is the test that item 4 requires before any opening rule is designed (judgement).

### Gaps
- None of the credences is calibrated on product runs. The product's interpolant (stored survival may be log-odds, `lsurv`, solve.js:1310) and its bridge reader were not read, by design.

## Q1. One-step versus lifetime: why the table gap is one year's effect, and why the margin freezes the tier

### Takeaway
With the continuation free to switch, Q_0(x,k) − Q_0(x,j) is exactly a one-year return difference pushed through V_1. With V_1′ ≈ 0.1 and |V_1″| ≈ 0.1 (per unit of log wealth), a near-saturated household gets gaps of about 1e-4. The margin compares this one-year gain with 0.001 *every year*, but holding is worth about H_eff years, so the tier freezes. The realised gap between openings is then the lifetime gap L, about 6 times g in the toy, and it can carry the opposite sign.

### Cited Findings
- **Free-switching gap (derived).** V_1 does not depend on k when switching is free. So Q_0(x,k) − Q_0(x,j) = E[V_1(y + r_k)] − E[V_1(y + r_j)], with y = log(x − spend). To second order this is V_1′·Δμ + ½V_1″·Δ(μ² + σ²). Tier 0→1: Δμ = −0.0030 and Δσ² = −0.0077. Tier 0→2: Δμ = −0.0076 and Δσ² = −0.0131. Log-medians are 0.0485, 0.0455 and 0.0409; log-vols are 0.145, 0.115 and 0.088 (assumed σ). So the gap(1 vs 0) ≈ −0.0030V′ + 0.0040|V″| and the gap(2 vs 0) ≈ −0.0076V′ + 0.0069|V″|. These are differences of near-equal terms, so near-cancellation is generic. At V′ = |V″| = 0.1 the gaps are +1e-4 and −7e-5, inside the brief's 1e-4 to 1e-3 range. [run1](mechanisms/run1_output.txt)
- **Check (toy, W0 = 24).** The expansion predicts gaps of 0.00440 and 0.00554, against the table's 0.00433 and 0.00575 (V_1′ = 0.936, V_1″ = −1.82). [run1](mechanisms/run1_output.txt)
- **Lifetime against one year (toy, fine grid).**

  | W0 | One-year table gaps (1 vs 0, 2 vs 0) | Fixed-for-life differences |
  |---|---|---|
  | 28 | +0.0057, +0.0090 | +0.0349, +0.0562 (about 6x) |
  | 24 | +0.0043, +0.0058 | +0.018, +0.008 |
  | 20 | −0.0006, −0.0035 | −0.022, −0.098 |

  At W0 = 24 the ranking flips: one year prefers 0.5 equity, a lifetime prefers 0.7. At W0 = 20 the lifetime differences are 28 to 37 times the table gaps. [run1](mechanisms/run1_output.txt)
- **Why the margin freezes (derived).** With free-switching tables, the gain from leaving the held tier at any state is a one-year gain g1(x). It never grows with how long the hold will last. A switch therefore needs g1(x_t) > 0.001 on the path. Because the record's g1 values are mostly 1e-4 to 1e-3, switches happen only where V is steep (near ruin), at the rare-event rate P(g1 > m). That matches the 0.03–0.04 switches a path [brief][B].
- **Freeze reproduced (toy).** The toy's gains run about 5 times the product's, so its margin was scaled up. At W0 = 28:

  | Margin | Switches a path | Realised gaps (1 vs 0, 2 vs 0) | Price/realised ratio |
  |---|---|---|---|
  | 0 | 1.2–2.3 | +0.0056, +0.0084 | 1.02, 1.06 |
  | 0.02 | 0.04–0.17 | +0.029, +0.070 | 0.19, 0.13 |
  | 0.05 | 0.002–0.017 | +0.033, +0.057 | 0.17, 0.16 |
  | ∞ (pure hold) | 0 | +0.034, +0.056 | 0.17, 0.16 |

  Under the pure hold the ratio is exactly the table gap over the lifetime gap. [run1b](mechanisms/run1b_output.txt)
- **Item 5 analogue (toy, margin 0.001, W0 = 24).** The free tables would leave the held tier while the margin holds on 18.1% of path-years; the brief records 21%. The best one-year gain over the held tier has a median of 0, a 90th percentile of 9e-5 and a 99th percentile of 6.5e-3. [run1](mechanisms/run1_output.txt)
- **S360 (record arithmetic).**
  - 497 lost against 9 saved out of 8,000 is a net −6.1 points, while the tables read +0.33.
  - The paired SE is √(506/8000)/√8000 ≈ 0.0028, so the realised value sits about 22 SE from the table.
  - The discrepancy is −18 times the table gap and of opposite sign, as in the toy's sign flip at intermediate margins (realised −0.0183 against table +0.0057). [run1b](mechanisms/run1b_output.txt)

### Inferences
- The mechanism explains:
  - item 1, since near-tie openings matter because they are held, and S360's sign reversal;
  - item 5, since the 21% against 6% asymmetry is the margin's hold on top of a symmetric nearest-node disagreement;
  - item 7's first half, since the margin blocks a late re-risk the tables want.
- It predicts item 6 *for the product's arms*: about 1/H_eff (0.13–0.19 in the toy) under the freeze, and about 1 at margin 0 (judgement on transfer from the toy).
- Item 6's 0.6 → 0.74 is measured in TS+J. The 7ac reducer reports "each world's table price of the opening against the survival TS+J and OPEN0 realise in that world, and their ratio" [reduce-7ac.mjs][R]. TS+J carries the tier in its state, so this mechanism does not apply there. Its residual is explained under Q2 (margin-rule jumps) and Q4 (table error) (judgement).

### Gaps
- H_eff for the product's households is unmeasured. It is L/g from one fixed-tier policy evaluation per household.

## Q2. Consistent switching cost: the bound, the knife edges (item 2), and the cost of a wrong pick

### Takeaway
With the tier in the state and a charge c in both passes, |V_t(x,h) − V_t(x,h′)| ≤ c. So a de-risked opening's net advantage is at most δ1, the one-year effect under the stay continuation. De-risked openings must sit in (c, c + δ1] in gross terms. Clustering just above the threshold is therefore forced by selection, not evidence of noise. With accurate tables, picking the wrong near-tied opening costs exactly the true gap, at most about c + δ1, roughly 1e-3.

### Cited Findings
- **Bound (derived).** V_t(x,h) = max_k [C_t(x,k) − c·1{k≠h}]. From h the household can copy h′'s choice for at most c extra, so V_t(·,h) ≥ V_t(·,h′) − c. In the toy the bound is attained: max|V_1(·,h) − V_1(·,0)| = 0.00100. [run1](mechanisms/run1_output.txt)
- **Opening gap (derived).** Let A = C_0(x,k) − C_0(x,plan) = E[V_1(yR_k, k)] − E[V_1(yR_plan, plan)]. This is at most E[V_1(yR_k, plan)] + c − E[V_1(yR_plan, plan)] = δ1 + c. So the de-risked opening's net gap is A − c ≤ δ1. Read another way: the opening compares "switch now" with "switch next year", which differ by one year's returns. Toy: net gaps 0.00328 ≤ δ1 0.00419 and 0.00525 ≤ δ1 0.00548. [run1](mechanisms/run1_output.txt)
- **Selection effect (derived).** De-risked openings occur only when A > c, and A ≤ c + δ1. So the relative excess (A − c)/c lies in (0, δ1/c]. Clustering within 10% is forced whenever δ1 < 1e-4. Item 2's "0.5% to 13% above" corresponds to δ1 up to about 1.3e-4 at c = 0.001.
- **Margin as a backward rule versus a charge (derived, toy).** A rule (switch only if gain > m, nothing deducted) makes V(·,h) jump by m where the gain crosses m. A charge gives max(C(h), max C − c), which is continuous with kinks only. On a 2,400-point grid, the largest one-cell step is 0.0046 under the rule against 0.0038 under the charge at m = 0.001, and 0.0132 against 0.0037 at m = 0.01. [run3](mechanisms/run3_output.txt)
- **Cost of a wrong pick (derived).** In a consistent model with exact tables, opening a and then acting optimally realises Q*_0(a). The loss from picking a2 is Q*_0(a*) − Q*_0(a2), which is ≤ c + δ1. Toy, consistent model: realised +0.0037 ± 0.0007 against table +0.0043, and +0.0056 ± 0.0010 against +0.0063 (within 1 SE). [run1](mechanisms/run1_output.txt)
- **Literature.**
  - "the derived utility is insensitive to deviations from the optimal portfolio proportions", and investors facing costs sharply cut how often they trade [Constantinides 1986](https://ideas.repec.org/a/ucp/jpolec/v94y1986i4p842-62.html).
  - "hysteresis is important even for small irreversibility" [Dixit 1991](https://ideas.repec.org/a/oup/restud/v58y1991i1p141-151..html).

### Inferences
- Item 2's two records (7 of 25 within 10% under TS+J with the rule; 1 of 18 under the charge) both fit the selection bound. The difference needs only different δ1 distributions (judgement). The rule's value jumps add interpolation error near switch boundaries that a charge avoids, which supports the charge (derived and judgement). They plausibly account for part of item 6's rise from 0.6 to 0.74 when the margin goes to 0 (judgement).

### Gaps
- δ1 per de-risked opening was not computed for the product. It takes one exact one-step evaluation each and no solves.

## Q3. Flatness between discrete tiers

### Takeaway
Near an interior optimum θ*, the gap between adjacent tiers is κΔ(θ_mid − θ*). That is at most ½κΔ², and zero when θ* sits at the midpoint. Each tier's loss against the continuous optimum is ½κ(θ − θ*)². Genuine near-ties are therefore expected and cheap, but only at the scale the objective is defined on. In the toy the one-year objective is about 15 times flatter than the lifetime one.

### Cited Findings
- **Gap formula (derived).** J(θ) ≈ J* − ½κ(θ − θ*)² gives J(θ_a) − J(θ_b) = κ(θ_b − θ_a)(θ_mid − θ*).
- **Toy (continuous equity weight, W0 = 28).**

  | Objective | Optimum w* | κ | ½κ(0.2)² | Values at 0.9/0.7/0.5 |
  |---|---|---|---|---|
  | Fixed for life | 0.47 | 1.16 | 0.023 | 0.820, 0.856, 0.876 |
  | One year (free continuation) | 0.37 | 0.075 | 0.0015 | 0.9042, 0.9099, 0.9131 |

  [run3](mechanisms/run3_output.txt)
- **Literature.** A near-rational consumption rule costs "less than 10 cents-$1 per quarter" [Cochrane 1989](https://ideas.repec.org/a/aea/aecrev/v79y1989i3p319-37.html). Utility is insensitive to deviations from optimal portfolio proportions [Constantinides 1986](https://ideas.repec.org/a/ucp/jpolec/v94y1986i4p842-62.html).

### Inferences
- "Flat" has two meanings that ask 1 conflates. One-year flatness is a scale effect present in every model, harmless only if the continuation is priced consistently. The lifetime objective is not flat between tiers (½κΔ² ≈ 2 points in the toy). So "any choice is fine" holds under a consistent model and fails under the product's hold (derived and toy).
- The one-year and lifetime optima differ (0.37 against 0.47). An opening chosen on one-year Q is systematically biased toward the one-year optimum when it is then held (toy).

### Gaps
- κ for real households is unknown. A three-point fixed-tier evaluation per household would measure it.

## Q4. Approximation error, resolution, and three cheap estimators

### Takeaway
The uniform Singh–Yee bound (2ε) is far too loose because table errors are mostly common-mode. The quantity that decides a pick is the **differential** error between moves. Operational resolution: ρ = the spread of the year-0 gap across admissible discretisations, combined with its distance from an exactly integrated one-step re-score and a refined reference. Toy: at 30 points the common-mode error is −0.087 and ε = 0.076, but the differential error is 0.0029, and the coarse tables still pick the right tier.

### Cited Findings
- **Literature.** Greedy loss ≤ 2γε/(1−γ) when |V* − Ṽ| ≤ ε. The Q-function version is 2ε/(1−γ). The paper does not treat finite horizons [Singh & Yee 1994](https://www.cis.upenn.edu/~mkearns/teaching/cis620/papers/SinghYee.pdf). The performance-difference decomposition is from [Kakade & Langford 2002](https://mlanthology.org/icml/2002/kakade2002icml-approximately/).
- **Finite-horizon form (derived).** Let e_t(x,a) = Q̂_t(x,a) − Q*_t(x,a), where |e_t| ≤ ε_{t+1} = sup over reachable next states of |V̂_{t+1} − V*_{t+1}|.
  - One-step loss of the greedy pick: Δ_t(x) = Q*(a*) − Q*(â) ≤ e(â) − e(a*) − ĝ ≤ 2ε_{t+1} − ĝ, where ĝ = Q̂(â) − Q̂(a*) ≥ 0.
  - For the whole policy: V*_0(x_0) − V^π̂_0(x_0) = E^π̂[Σ_{t=0}^{T−1} Δ_t(x_t)] ≤ 2Σ_{t=1}^{T} ε_t.
  - For a near-tie opening followed by π̂ in both arms: realised loss ≤ true gap + [e_0(â) − e_0(a*)] + the difference in downstream regret, which is ≤ true gap + 2ε_1 + 2Σ_{t≥2} ε_t.
  - Caveat: this holds only when the forward chooser is greedy on the same model the tables solve. For the product's margin hold, the "error" is the model mismatch of Q1, not ε.
- **Toy check.** sup|V̂_1 − V*_1| = 0.076, so 2ε = 0.15. The Q errors by tier are −0.0657, −0.0674 and −0.0686, so the differential error is 0.0029; the coarse pick equals the reference pick and the loss is 0. [run3](mechanisms/run3_output.txt)
- **Error scaling (toy).** Table minus reference at W0: n = 15 gives −0.181, n = 30 gives −0.087, n = 60 gives −0.027, n = 120 gives −0.0075. That is about 1/n at coarse grids, tending to 1/n² beyond 60. Survival realised by the chooser on those tables: 0.875, 0.911, 0.914 and 0.914 (reference 0.913). [run2](mechanisms/run2_output.txt) The product's own record shows 1/n: optimism at S070 of +21, +16, +13 and +9 at 12, 16, 20 and 28 points [solve.js:1372-1375][S]. Year-0 optimism is 2–3 points ([PLAN.md M16][P]).
- **Estimator 1: grid-perturbation dispersion (toy).** Across 30 points with shifts of 0, ¼, ½ and ¾ cell plus 28 and 32 points, the gap(1 vs 0) ranges 0.0016–0.0041 (SD 0.0012) and the gap(2 vs 0) ranges 0.0021–0.0061 (SD 0.0018). But the mean bias is −0.0028 and −0.0049, against references of 0.0057 and 0.0090. Dispersion is a **lower bound** on error, so pair it with a refined reference. Cost: 5 solves. [run2](mechanisms/run2_output.txt)
- **Estimator 2: paired CRN rollouts of the top two openings under the actual chooser (derived).** SE ≈ √(d/N) for discordant share d. 2 SE ≤ 1e-3 needs N ≈ 4d/1e-6: 20,000 paths at d = 0.5%, 80,000 at 2%, 252,000 at S360's 6.3%; 1e-4 needs 100 times as many. It measures the realised gap under the executed policy, hold included, at no solves; test with exact McNemar on discordant pairs. [run3](mechanisms/run3_output.txt)
- **Estimator 3: exact one-step gap at the true state from next year's tables (derived, toy).** Re-scoring year 0 with 20 nodes on each 30-point variant cut the SD across variants about five-fold (gap(1 vs 0) 0.0027–0.0033). Integrating the piecewise-linear interpolant exactly against the normal gives E[f(a+σZ)] = v_0 + Σ_j s_j[C(x_j) − C(x_{j+1})], with C(x) = (a−x)Φ((a−x)/σ) + σφ((a−x)/σ). That makes Q smooth in x_0 at a cost of O(n) per move and world. The bias remains: exact 0.0039–0.0048 against reference 0.0071–0.0090. Cost: no solves. [run2](mechanisms/run2_output.txt), [run5](mechanisms/run5_output.txt)
- **Quadrature alone is not the cause (toy).** Going from 5 to 20 nodes on a fine grid changes the gaps by only 2e-6 and 3e-5. [run2](mechanisms/run2_output.txt)

### Inferences
- The toy's 30-point differential error (30–50% of gaps of 6e-3 to 9e-3) matches the record's grid moves (−14%, +28%) and flips. At the brief's 1e-4 to 1e-3 gaps it probably exceeds the gap on several households, leaving the opening's sign unresolved (judgement; Design A measures it).
- Policy quality far exceeds value accuracy, so level optimism and good decisions coexist; state resolution for *gaps*, not values (derived and toy).

### Gaps
- The product's differential error has not been measured. The toy's sign of level error (pessimistic) differs from the product's (optimistic), probably because the product interpolates a transformed value (log-odds), which was not checked.

## Q5. Auxiliary terms: estate, raise credit, dislike of cuts (item 7)

### Takeaway
On one-year gaps the estate term is negligible: about 1e-5 in the toy. On lifetime holds it is 3e-4 to 6e-4 between adjacent tiers. A single 10% raise-year is worth 9.5e-4. These are all at or above the survival near-tie scale, so near-ties in survival are in practice decided by the auxiliary terms. Item 7's 36 of 220 implies an auxiliary spread of about 0.57 times the survival spread.

### Cited Findings
- **Product score (record).** survival + wB × bequest (the logfloor estate: estS·ln(1 + (net − P)/estS), with weight ≥ 0.01), plus the raise credit μ·√min(0.2, level − 1) with μ = 0.003, minus the cuts charge λ(1 − level)². Resilience weight is 0 in PRODUCT_BASELINE [solve.js:504-571, 1864, 1910][S].
- **Raise credit a raised year (derived from code).** 6.7e-4 at +5%, 9.5e-4 at +10%, 1.34e-3 at +20%. [run3](mechanisms/run3_output.txt)
- **Estate term (toy, λ = 0.01 / 0.02).** It shifts one-year gaps by ≤ 1.9e-5. The fixed-for-life estate difference between 0.7 and 0.9 is 2.9e-4 and 5.8e-4; between 0.5 and 0.9 it is 0.6e-4 and 1.1e-4. The concave log term makes higher-median, higher-dispersion tiers gain little. [run3](mechanisms/run3_output.txt)
- **Item 7 (derived).** For independent zero-mean normal survival and auxiliary components, P(sign flip) = (1/π)·arctan(σ_a/σ_s). The observed 36/220 = 0.164 (95% CI 0.117–0.219) gives σ_a/σ_s = 0.565 (0.386–0.823); a Monte Carlo check gives 0.1637. [run3](mechanisms/run3_output.txt)

### Inferences
- Under the hold, the realised whole-score verdict between near-tied openings is routinely set by the estate and by raises. A survival-only near-tie therefore says little about whole-score preference (judgement).
- Raises scale with good-path frequency, so riskier tiers earn more raise credit. This works against estate concavity and is a plausible source of the auxiliary spread (judgement).

### Gaps
- Raises and cuts were not modelled in the toy. The independence assumption behind arctan is untested.

## Q6. The end-pot cliff (item 9)

### Takeaway
The terminal indicator 1{W_T ≥ P} makes V_{T−1} a sigmoid: convex below the inflection (risk pays), concave above (de-risking pays). Tier gaps change sign along wealth, creating near-ties there, and the step makes interpolation error first order. In paired runs the riskier arm's lost paths are shifted copies of the safer arm's survivors, so their shortfalls are bounded by the arms' terminal difference.

### Cited Findings
- **Sign of the risk effect (derived).** With S = Φ((m(σ) − p)/σ) = Φ(z), dS/dσ = φ(z)(m′(σ) − z)/σ. Risk helps when z < m′ (median end wealth near or below the pot) and hurts above. The interior optimum z = m′ is a source of genuine second-order near-ties (Q3).
- **Shortfall bound (derived).** Under common random numbers, W_T^risky = W_T^safe·e^Δ. A path is lost by the risky arm iff P ≤ W_T^safe < P·e^{−Δ}, so its shortfall is P − W_T^risky < P(1 − e^Δ).
- **Toy, rigid spending.** Median shortfall is 0.45–0.49 P (the record says about ⅓). Only 8–13% of lost paths paid every year (the record says 47–67%). [run1](mechanisms/run1_output.txt), [run1b](mechanisms/run1b_output.txt)

### Inferences
- The product's high share of lost paths that paid every year plausibly reflects flexible spending: trims keep paths paying and push failure to the end-pot test (judgement).
- A loss of "a full survival point for ⅓ of a year's spending at the end" is the cliff converting a small terminal difference into a whole count. This is a feature of the objective, not of the tables (derived and judgement).
- The step also helps explain the product's first-order (1/n) table error (judgement; consistent with the toy's coarse-grid 1/n).

### Gaps
- No product run separates the cliff's effect on the gap. A cheap probe is the year-0 gap with P scaled by 0.9 and 1.1 (2 solves).

## Q7. Non-smoothness signatures in a half-step test (item 4)

### Takeaway
Write the even part as E(s) = g(x+s) + g(x−s) − 2g(x) and the odd part as O(s) = g(x+s) − g(x−s). Each mechanism has its own law as s halves. The brief's "ignores the input's sign and is not monotone in the step" cannot come from smooth curvature, from a single kink or from a single snap. It needs **several kinks or jumps inside one step**: the comb produced when quadrature points carry the next-year interpolant's node kinks through x_0. The toy reproduces it without snaps or a bridge reader.

### Cited Findings
- **Signatures (derived).**

  | Mechanism | Even part E(s) | Ratio E(s)/E(s/2) | Odd part | Grid-locked? |
  |---|---|---|---|---|
  | (a) Smooth or interpolation curvature | g″s² | 4 | 2g′s | No |
  | (b) Argmax kink exactly at x (after max-then-interpolate, slope jump Δ) | Δ\|s\| | 2 | — | — |
  | (b′) Kink at distance d | Zero for \|s\| < d, then ½Δ(\|s\| − d) | — | Equal to the even part (one-sided) | — |
  | (c) Nearest-node snap of size J at distance d | Zero for \|s\| < d, then constant J/2 | 1 once crossed | J/2 | Locked to the snapped axis |
  | (d) Bridge reader's reassembly | Like (c) if it snaps buckets, like (b′) if it splices pieces | — | — | Moves with the bridge axis; vanishes with the reader off |

  Linear interpolation itself (a′) adds a scallop with node kinks, period about one cell for log-additive dynamics.
- **Comb density (derived).** Each quadrature term crosses about one node per cell of x_0, giving about n_q kinks per tier per cell. With 5 nodes, 3 worlds and 2 tiers that is about 30 kinks per cell, of mixed sign. That makes E(s) irregular and non-monotone for s ≲ 1 cell.
- **Toy ratios (at three start points).**

  | Reading | Ratios E(s)/E(s/2) |
  |---|---|
  | Reference | 3.5, 3.9, 4.0 / 3.9, 4.2, 4.2 / 4.8, 4.2, 4.4 (smooth) |
  | 30x5 (5 nodes) | 0.7, 1.5, 3.1 / −0.4, 1.5, 2.1 / 15.9, 2.7, −2.9 |
  | 30 points, 20-node re-score | 6.1, 0.9, 1.2 / 2.6, 0.7, 1.7 / 2.4, −0.6, 1.4 |
  | 60 points, 5 nodes | 2.9, 1.1, 1.5 / 4.3, −0.7, 1.3 / 4.7, 0.5, 6.5 |
  | 30 points, exactly integrated | 2.5, 3.0, 3.7 / 2.4, 3.2, 3.8 / 11.6, −4.9, 2.3 |

  The irregular 30x5 pattern is the brief's signature; the 20-node re-score and 60 points still show it. Exact integration is smooth at two starts; the third has a tiny E(s) near an inflection and is ambiguous. [run4](mechanisms/run4_output.txt), [run5](mechanisms/run5_output.txt)

### Inferences
- Of the brief's ranked causes, the signature points to "interpolation and argmax kinks of the 30x5 solve" read through quadrature. It does not point to snaps, which would give a step-like E(s) that does not grow with the step, nor to curvature (judgement grounded in the derivation and the toy).
- The decisive item-4 test is Design A's ladder with an exactly integrated re-score:
  - if the comb disappears, the cause is kinks;
  - if jumps persist and move with the share or tax axis, the cause is snaps;
  - if they vanish with the bridge reader off, the cause is the reader.
- Fit E(s) = a s² + b|s| + J over at least 4 step sizes, rather than reading single ratios, which mislead near inflections (toy, start +0.00).

### Gaps
- The product's interpolant (possibly log-odds) and its snapped axes were not inspected. In a transformed space, exact integration needs high-order quadrature instead of the closed form.

## Q8. Ties decided by menu order (item 10)

### Takeaway
The chooser treats moves within eps = 1e-12 as tied and breaks the tie by the larger expected bequest. An optional tieMargin re-picks within its tolerance by least tax this year (solve.js:1382-1386, 1414-1423). Since any tolerance from 1e-10 rewrote tax on every path, every path has some year where differently taxed moves score within 1e-10. The objective is numerically flat in the withdrawal dimension, so the **secondary criterion, not the score, decides tax**.

### Cited Findings
- **Code facts.** eps defaults to 1e-12, with exact ties broken on bequest; tieMargin prefers "the move with the least tax this year" [solve.js:477, 1385, 1414-1423][S].
- **Why a tolerance rewrites every path (derived).** Raising the tolerance from 1e-12 to τ swaps the selection rule on the set {moves within τ of the best}. If that set holds more than one tax outcome in at least one year on each path, as happens where survival is saturated or where moves land on the same snapped cell, tax changes on every path. The score change is ≤ τ per year, so ≤ 40τ per path.
- **Deterministic secondary criterion (derived).** Use a lexicographic order with an explicit tolerance measured relative to the best score, as the code does. That relative form keeps it transitive. Apply the identical rule in both passes so the tables value the policy the chooser executes.
  - Proposed order: (1) score; (2) for tier changes within the resolution ρ, stay in the held tier and then the plan's tier; (3) for withdrawals, larger expected bequest net of death tax, then least tax this year; (4) fixed menu index.

### Inferences
- Item 10 is the same mechanism as the tier near-tie at a different scale: whatever breaks the tie decides. For tiers the tolerance should be ρ from Design A, not 1e-12 (judgement).

### Gaps
- Why withdrawal variants differ by less than 1e-10 even though the estate's slope is about 0.02/W0 per pound (about 4e-8 per £1 at W0 = £500k) was not traced. The candidates are snapped tax buckets or exactly offsetting death-charge terms.

## Q9. The cheapest discriminator: a real flat objective (the hold does the harm) against an artefact (the gap is noise)

### Takeaway
Read four numbers per household: g (the product's gap); g_exact (the exactly integrated one-step gap, no solves); ρ (the spread across node shifts, 5 solves); and D (paired CRN realised gaps at margin 0.001 and at margin 0, no solves). The hypotheses predict opposite patterns. Both can hold at once, and the 2×2 reading separates them.

### Cited Findings
- **Predictions (derived from Q1, Q2 and Q4; toy-checked where marked).**

  | Quantity | "Real flat + hold harm" | "Artefact" |
  |---|---|---|
  | **Paired realised gap** | At margin 0.001, D ≈ L ≫ \|g\|, possibly of opposite sign (toy: ratio 0.13–0.19, sign flip at an intermediate margin). At margin 0, and under the consistent candidate, D ≈ g within 2 SE (toy: ratios 1.02–1.13, candidate within 1 SE). | At margin 0 and under the candidate, D does not track g: sign(D) ≠ sign(g), or \|D − g\| > max(2 SE, ρ). |
  | **Table gap across grid variants** | Stable: ρ ≪ \|g\|, no sign flips. | ρ ≥ \|g\|, with sign flips (as in the record's item 3: share 0.95 goes 0/0, 2/2, 0/0). |
  | **Exact one-step gap** | g_exact ≈ g. | \|g_exact − g\| ≳ \|g\|. Toy: about 30% movement from the exact re-score alone. |

- **Cost.** The rollouts and exact re-scores are free of solves. Node shifts cost 5 solves per household. A 60x5 reference costs 1 more. At typical discordant shares (2%), resolving D to 1e-3 needs about 80,000 paired paths. [run3](mechanisms/run3_output.txt)

### Inferences
- The record already leans toward "both". Items 1 and 5 show the hold's signature. Items 3 and 4 show the artefact's signature. The 0.74 residual at margin 0 in TS+J (item 6) is an artefact-type mismatch of about a quarter of the realised effect, and refining the grid "does not cure" it. That points to a source that does not shrink with the wealth axis (the kink comb sampled by fixed quadrature, snapped axes) rather than to the wealth axis itself (judgement).
- Ask 5 (judgement): when |g| < ρ, keep the plan's tier. Under the hold an unresolved de-risk can cost lifetime points; staying costs at most one unresolved year. CRN re-ranking needs the actual chooser, the path budget above and a fixed seed (bit-for-bit), and spends gate-5 time on paths.

### Gaps
- The product's ρ, L and D for the seven households are unmeasured. Each design above estimates them.

[B]: /tmp/claude-0/-home-claude/714dfdc3-91ad-5eb2-8ca1-1210ca429c69/scratchpad/branch-ff13828/repo/research/solver/escalations/12-Oct-opening-near-ties.md
[S]: /tmp/claude-0/-home-claude/714dfdc3-91ad-5eb2-8ca1-1210ca429c69/scratchpad/branch-ff13828/repo/src/solver/solve.js
[P]: /tmp/claude-0/-home-claude/714dfdc3-91ad-5eb2-8ca1-1210ca429c69/scratchpad/branch-ff13828/repo/research/solver/PLAN.md
[R]: /tmp/claude-0/-home-claude/714dfdc3-91ad-5eb2-8ca1-1210ca429c69/scratchpad/branch-ff13828/repo/research/solver/reduce-7ac.mjs
