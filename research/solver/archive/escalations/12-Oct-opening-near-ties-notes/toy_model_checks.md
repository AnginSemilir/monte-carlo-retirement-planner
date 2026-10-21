# Opening risk tier near ties: toy model checks (TOY RESULTS, 1-D backward-induction toy)

All numbers below are **toy results** from self-contained Python scripts in `toy/` (numpy 2.5, fixed seeds, paired common random numbers). They do not come from the product. Analytic statements are marked **(derived)**. The model and its parameters are in section 7.

Run log: started 15:47 BST. Experiments ran until 16:25, and every script runs in seconds to about 13 minutes.

Units: score gaps are in survival units, so 0.001 = 0.1 point. A "gap" is opening k minus opening 0 (the plan's tier, High). "Table" means the year-0 value re-scored at the household's true wealth off the year-1 tables. "Realised" means a forced opening in year 0, after which the forward chooser continues; it is reported as a paired Monte Carlo difference ± SE, stratified by world.

**Regime caveat (read first).** With the specified tiers (90/50/10% equity), the toy's one-year tier effects are about 1e-2 away from policy boundaries. That is roughly ten times the product's typical year-0 gaps. As a result, toy paths switch 2.5 to 3.2 times at margins of 0.001 or less, against 0.03 to 0.04 in the product. Even a "close tiers" variant (equity 0.90/0.84/0.78) switched 0.6 to 1.4 times per path. The toy's margin m = 0.01 (about 1.1 switches per path, with Medium openings at survival ≥ 0.8 mostly held for life) is therefore the closer analogue of the product's long hold. Both are reported. Sources: [results_exp12](toy/results_exp12.txt); [escalation brief](/tmp/claude-0/-home-claude/714dfdc3-91ad-5eb2-8ca1-1210ca429c69/scratchpad/branch-ff13828/repo/research/solver/escalations/12-Oct-opening-near-ties.md).

## 1. Does the product's table price only a one-year effect, while the hold makes the opening a multi-year (lifetime) choice? (Exp 1, 1b)

### Takeaway
Yes, by construction and in the toy. When the hold is short (m ≤ 0.001 here), the realised gap equals the one-year table gap: the ratio has a median of 0.96 wherever |table gap| ≥ 3e-3. When the hold is long (m = 0.01), table ties of 0 realise losses of 0.4 to 2.6 points for de-risked openings, and permanent holds would cost 4.7 to 28 points. The realised/table ratio is governed by how long the hold lasts.

### Cited Findings
**Table 1a (toy, fine grid, product mode). Near-tie households, N = 48,000 paths per world, seed 2024.** "static" is the gap if each opening were held for life (fixed-policy solve). "sw" is switches per path after year 0, for opening 0 / opening k.

| household | W0 | S | opening | table gap | static (life) | realised m=0.001 | sw | realised m=0.01 | sw |
|---|---|---|---|---|---|---|---|---|---|
| T35 High/Med tie | 20.10 | .684 | 1 | +0.00000 | −0.0469 | +0.0001 ± 0.0009 | 2.90/3.07 | **−0.0038 ± 0.0011** | 1.08/1.05 |
| T35 High/Med ×1.03 | 20.70 | .715 | 1 | +0.0016 | −0.0299 | +0.0010 ± 0.0009 | 2.97/2.94 | **−0.0024 ± 0.0011** | 1.13/0.96 |
| T35 High/Low tie | 22.63 | .799 | 2 | +0.00000 | −0.2606 | +0.0000 ± 0.0011 | 3.02/3.55 | **−0.0197 ± 0.0014** | 1.24/1.56 |
| T35 Med/Low tie | 26.87 | .921 | 2 | +0.0120 | −0.0144 | +0.0115 ± 0.0008 | 2.42/1.97 | +0.0093 ± 0.0010 | 1.26/0.66 |
| T40 High/Med tie | 21.33 | .687 | 1 | +0.00000 | −0.0475 | −0.0014 ± 0.0009 | 2.97/3.13 | **−0.0047 ± 0.0011** | 1.02/0.96 |
| T40 High/Low tie | 24.20 | .802 | 2 | +0.00000 | −0.2778 | −0.0010 ± 0.0010 | 3.09/3.57 | **−0.0257 ± 0.0014** | 1.17/1.51 |

Source: [results_exp1b](toy/results_exp1b.txt).

**Table 1b (toy). 21 households spread over table survival of 0.30 to 0.95** (T ∈ {30, 35, 40}), N = 8,000 per world, paired SE about 0.002.

| margin m | switches/path (mean) | ratio realised/table where \|table\| ≥ 3e-3 (n=36): median (IQR) | 6 pairs with \|table\| < 3e-3: mean \|real − table\| | sign flips |
|---|---|---|---|---|
| 0 | 3.21 | 0.96 (0.86–1.07) | 0.0018 | 3/6 |
| 3e-4 | 2.86 | 0.97 (0.85–1.08) | 0.0016 | 3/6 |
| 0.001 | 2.54 | 0.96 (0.83–1.06) | 0.0013 | 3/6 |
| 0.003 | 1.84 | 0.91 (0.69–1.07) | 0.0023 | 5/6 |
| 0.01 | 1.12 | 0.97 (0.64–1.37) | **0.0134** | 5/6 |

Source: [results_summary_extra](toy/results_summary_extra.txt).

- **(derived)** In product mode the tables assume free switching, so the year-1 value does not depend on the tier held. The year-0 table gap is therefore exactly a one-year effect: G(k) = Σ_j π_j (E_{j,k} − E_{j,0}) V_j(1, ·). Any longer consequence of the opening comes only from the forward chooser's hold. Source: [toy.py](toy/toy.py).
- At m = 0.01, near-ties from the Exp 1 sample show the same sign reversal as S360. T35-S80 opening Low: table +0.00008, realised −0.0194 (SE about 0.0026); half its paths still hold Low at year 6. T40-S70 opening Medium: table +0.00066, realised −0.0090. T30-S70: table +0.0011, realised −0.0063. At m = 0.001 the same openings realise −0.0015, +0.0003 and +0.0022 respectively, all within about 1 SE of the table. Source: [results_exp12](toy/results_exp12.txt).
- Hold length (median over all paths of the first-switch year, counted as T if a path never switches):
  - At m = 0.001, a clearly wrong forced opening is undone within 1 to 4 years. Openings are held for life only where they are optimal (Low at S = 0.95).
  - At m = 0.01, most paths never leave a Medium opening at S ≥ 0.8 or a Low opening at S ≥ 0.9 (median 30 to 40). Low openings at S = 0.8 switch at a median of year 5 to 8.

  Source: [results_exp12](toy/results_exp12.txt).
- **Per world** (T35 High/Med tie, m = 0.01). Table per-world gaps are −0.0039 (bad world), +0.0004 and +0.0024 (good world). The realised gaps are −0.0285 ± 0.0017, −0.0011 ± 0.0016 and +0.0100 ± 0.0012. So the per-world tables price only 0.14 to 0.24 of the realised per-world effect, and the large per-world effects mostly cancel in the weighted sum. In this toy the bad world is a low-survival world that favours risk, so its de-risk is a loss. That is the opposite sign to the brief's item 6. Source: [results_exp1b](toy/results_exp1b.txt).

### Inferences
- A table near-tie in product mode is a statement about one year only. The realised consequence of the opening scales with the hold length. Its sign is pulled toward the static (held-for-life) comparison, which for de-risked openings near ties is strongly negative (−3 to −28 points in Table 1a). The product's 0.03 to 0.04 switches per path put it close to permanent holds, so this toy suggests its realised opening gaps can be one to two orders of magnitude larger than the year-0 table gaps. (Judgement; magnitudes are not transferable.)
- Cheap discriminator: re-run the paired forced-opening comparison with the forward margin set to 0, so the hold is removed. If the realised gap collapses toward the table gap, as it does in the toy at m ≤ 0.001, then the hold, not the grid, drives the harm.

### Gaps
- The toy cannot reproduce the product's switching rate with the specified tiers, so the "lifetime" regime is only approximated by m = 0.01.
- Paired SE of about 0.002 at N = 8,000 cannot resolve near-tie realised gaps of order 1e-3. N = 48,000 (SE about 0.001) was used only for 8 cases.

## 2. Is the candidate (tier state, joint worlds, charge c in both passes) consistent, and is its gap ≤ c + a one-year effect? (Exp 2, 2b)

### Takeaway
On the fine grid, yes. The bound holds to within 2.4e-4 at c = 0.001 and exactly at c = 0.003 and 0.01, and table and realised gaps agree within Monte Carlo error (88 to 93% within 2 SE). On the 30-point grid the agreement is lost (8% within 2 SE) because of the grid bias in section 3.

### Cited Findings
**Table 2 (toy, fine grid, 21 households × 2 openings, N = 8,000 per world).**

| charge c | max(gross gap − (c + e1)) | bound violations > 1e-6 | mean \|realised − table\| net gap | within 2 SE | switches/path |
|---|---|---|---|---|---|
| 0.001 | +2.4e-4 | 4/42 | 0.0019 | 0.93 | 1.2–3.8 |
| 0.003 | −3.4e-5 | 0/42 | 0.0022 | 0.88 | 0.96–3.43 (mean 2.24) |
| 0.01 | −3.8e-5 | 0/42 | 0.0023 | 0.88 | 0.70–2.74 (mean 1.77) |

Sources: [results_exp12](toy/results_exp12.txt), [results_exp2b](toy/results_exp2b.txt).

- **(derived)** At grid nodes, the world-weighted value satisfies J(t,W,h) ≥ J(t,W,h′) − c, because any held tier can copy another's move at a cost of at most c more. Hence the gross year-0 gap of opening k over the plan's tier (before its own charge) satisfies ≤ c + e1(k), with e1(k) = Σ_j π_j (E_{j,k} − E_{j,0}) V_j(1, ·, held 0). Equivalently, the net gap is ≤ e1(k). The bound is only approximate: the expectation weights each world by its own return density rather than π, and values are interpolated off-node. That matches the small violations seen at c = 0.001. Source: [toy.py](toy/toy.py).
- Levels agree too. Opening 0 table vs realised score: 0.2980/0.2986, 0.6939/0.6971, 0.9318/0.9304, 0.5957/0.5921 (T30-S30, T30-S70, T30-S95, T35-S60). Source: [results_exp12](toy/results_exp12.txt).
- Coarse 30-point candidate (30 near-tie households, N = 24,000 per world): mean |realised − table| 0.0085, 8% within 2 SE, and 11/60 sign disagreements with |realised| > 2 SE. Source: [results_exp34](toy/results_exp34.txt).

### Inferences
- In the candidate's own (fine) tables the opening is not a lifetime choice: every opening's advantage is capped by about c + one year. A candidate near-tie is therefore a real flat spot, where any opening is nearly as good because later moves correct it at cost c, provided the grid resolves the one-year effect. The knife edges in the brief (item 2) are then expected, but they are cheap to get wrong only if the tables are accurate. The 30-point toy tables are not (section 3).

### Gaps
- The candidate's toy switch rates (1 to 4 per path) are far above the product's, so how long the candidate's holds last in the real solver is not represented.

## 3. How large are coarse-grid artefacts, and are they noise or bias? (Exp 3, 3b, 3c, 3d)

### Takeaway
In the toy, the 30-point grid's year-0 gaps carry a systematic, second-order bias of about +0.006 toward de-risking. It builds up over the backward recursion and is about four times the grid-to-grid spread under small perturbations. Shifted or ±2-point grids therefore rarely flip openings (1 to 3 of 30), yet the 30-point choice disagrees with the fine choice in 15 to 21 of 30 near-tie households.

### Cited Findings
**Table 3a (toy). Year-0 gap error against fine, by wealth points** (30 near-tie households × 2 gaps). "Flip" is the share of households whose plain-argmax opening differs from the fine grid's.

| points | product, log-odds: mean err / flip | product, linear-prob: mean err / flip | candidate, log-odds: mean err / flip |
|---|---|---|---|
| 20 | +1.25e-2 / .57 | – | +1.26e-2 / .73 |
| 30 | **+6.18e-3 / .50** | −2.96e-3 / .43 | **+6.33e-3 / .70** |
| 40 | +3.12e-3 / .43 | – | +3.11e-3 / .50 |
| 60 | +1.19e-3 / .30 | −1.22e-3 / .33 | +1.31e-3 / .30 |
| 90 | +5.6e-4 / .20 | – | +5.2e-4 / .10 |
| 120 | +2.9e-4 / .13 | −4.7e-4 / .17 | +2.8e-4 / .10 |
| 240 | +6.9e-5 / .10 | – | +5.7e-5 / .00 |

Sources: [results_exp3b](toy/results_exp3b.txt). A half-cell offset gives the same picture (+5.8e-3 at 30 points).

**Table 3b (toy). Where the bias comes from** (product, T = 35, 10 households). The variants use fine tables down to year t* and coarse steps below it.

| variant | mean err | mean \|err\| |
|---|---|---|
| fine year-1 values sampled at coarse nodes (last-step interpolation only) | +7.3e-4 | 9.5e-4 |
| 2 / 5 / 10 / 20 coarse steps | +1.0e-3 / +1.75e-3 / +2.95e-3 / +4.9e-3 | – |
| fully coarse (34 steps) | +6.6e-3 | 6.75e-3 |

Source: [results_exp3d](toy/results_exp3d.txt).

- **The perturbation family** (n ∈ {28, 30, 32} × offsets of 0, ¼ and ½ cell; 30 near-tie households):
  - The base-grid gap error has median |err| 6.3e-3 and 90th percentile 1.05e-2. The mean signed error is +6.2e-3 for the product and +6.3e-3 for the candidate, so nearly all errors have the same sign.
  - The grid-to-grid SD of a gap has a median of 1.7e-3 (product) and 1.9e-3 (candidate).
  - Plain-argmax openings flip across the family in 1/30 (product) and 3/30 (candidate) households; the 0.001-margin rule flips in 3/30 and 7/30.
  - The base-grid argmax differs from the fine grid's in 15/30 (product) and 21/30 (candidate).
  - The best alternative's gap moves by −39% to +53% across the family for the product (10th–90th percentile), and by −57% to +57% for the candidate. The brief reports −14% and +28%.

  Source: [results_exp34](toy/results_exp34.txt).
- **Spread households** (21, survival 0.30 to 0.95): mean signed error +2.9e-3 (product) and +3.1e-3 (candidate). Base argmax differs from fine in 3/21 and 6/21. Source: [results_exp4b](toy/results_exp4b.txt).
- **Two-grid (Richardson) estimate from a 30- and a 60-point solve:** mean |err| 8.2e-4 for both modes, against 1.2 to 1.3e-3 for 60 points alone. Flips against fine fall to 0.23 (product) and 0.03 (candidate). From 30 and 40 points the gain is small (|err| 2.8 to 3.1e-3). Source: [results_exp3c](toy/results_exp3c.txt).
- **Self-checks:** the fine grid (640 points) against 1,280 points has mean |err| 1.9e-5 for the product and 1.2e-4 for the candidate (max 6.6e-4). Quadrature with 9 Gauss–Hermite nodes against 5 moves gaps by a mean of 1.4e-4 (max 3.4e-4). Source: [results_exp3c](toy/results_exp3c.txt).

### Inferences
- In this toy, near-ties on the 30-point grid are mostly an artefact. The resolution bias (about 6e-3) exceeds the 0.001 margin six-fold, and its sign is set by the interpolation space: log-odds favours de-risking, linear-probability favours risk.
- Because it accumulates over the recursion, exact year-0 re-scoring or a finer year-1 table alone would remove only about 11% of it.
- Small grid perturbations at fixed resolution measure dispersion, not bias. A δ "estimated from the perturbation dispersion" would therefore be about 4× too small.
- Error falls roughly as Δ² (cell width squared), so about 40 points (the brief's judged solve-time limit) still leaves about 3e-3 in the toy. Below 1e-3 needs about 60 to 75 points, and below 3e-4 about 120.
- The brief's flips between 30 and 60 points are consistent with a resolution bias of this kind. Its sign in the product is unknown. (Judgement.)

### Gaps
- No analytic derivation of why log-odds interpolation biases toward de-risking. The toy only shows it is cumulative, second order and space-dependent.
- The product's other dimensions (pension share, 6 points; tax buckets) are not represented, so the toy says nothing about share-axis error.

## 4. Which opening rule performs best on the coarse grid? (Exp 4, 4b, 4c)

### Takeaway
Re-ranking the top two openings by paired rollouts of the actual forward chooser (rule c) is the only rule that removes the coarse grid's harm. At N = 8,000 paths per world its mean loss is 0.0001 to 0.0002 and its worst 0.0022 to 0.0023, with no household harmed by more than 0.5 point. In the long-hold pipeline (P2) it beats even the fine table, because the table also misprices the hold.

Thresholds δ ≤ 1e-3 and unanimity across perturbed grids barely help, because the coarse error is a bias common to all grids. Always keeping the plan's tier is the worst rule on average.

### Cited Findings
**Table 4a (toy). 30 near-tie households** (10 per horizon at the High/Medium and Medium/Low boundaries).
- Loss is the realised score of the best opening minus that of the rule's opening. It is measured under the pipeline's own coarse continuation, with N = 24,000 per world on evaluation seed 777; rollouts use seed 4242.
- The pipelines are P1 (product, m = 0.001), P2 (product, m = 0.01, the long-hold analogue) and C (candidate, c = 0.001).
- "Harm" is the number of households with loss > 0.005. "Flips" is the number of households whose choice changes across the 9 grids.

| rule | P1 mean / worst | P1 harm | P2 mean / worst | P2 harm | C mean / worst | C harm | flips P1/P2/C | cost (solves; rollout path-years) |
|---|---|---|---|---|---|---|---|---|
| (a) plain argmax | .0026 / .0085 | 6 | .0049 / .0238 | 11 | .0027 / .0075 | 5 | 1/1/3 | 1; 0 |
| (b) δ = 1e-4 or 3e-4 | same as (a) | 6 | same as (a) | 11 | same as (a) | 5 | 1/1/3–4 | 1; 0 |
| (b) δ = 1e-3 | .0026 / .0085 | 6 | .0049 / .0238 | 11 | .0025 / .0075 | 4 | 3/3/7 | 1; 0 |
| (b) δ = 2·SD(9 grids) | .0022 / .0085 | 4 | .0045 / .0238 | 9 | .0018 / .0075 | 2 | 10/10/14 | 9; 0 |
| (c) rollouts N = 1,000 | .0006 / .0046 | 0 | .0010 / .0084 | 3 | .0010 / .0075 | 1 | n/a | 1; 2×3k×T |
| (c) rollouts N = 4,000 | .0006 / .0035 | 0 | .0003 / .0040 | 0 | .0006 / .0047 | 0 | 19/12/21 | 1; 2×12k×T |
| **(c) rollouts N = 8,000** | **.0002 / .0023** | **0** | **.0002 / .0022** | **0** | **.0001 / .0022** | **0** | n/a | 1; 2×24k×T (1.7M at T=35) |
| (d) unanimity over 9 grids | .0024 / .0085 | 5 | .0047 / .0238 | 10 | .0022 / .0075 | 3 | 0/0/0 | 9; 0 |
| keep plan's tier | .0034 / .0133 | 9 | .0077 / .0268 | 10 | .0031 / .0136 | 9 | 0/0/0 | 0; 0 |
| fine-table argmax (reference) | .0005 / .0023 | 0 | .0010 / .0144 | 2 | .0002 / .0018 | 0 | – | fine solve |
| hybrid: (c) only if top-two gap < 3e-3 | .0016 / .0072 | 2 | .0024 / .0198 | 5 | .0018 / .0075 | 3 | n/a | rollouts on 23–30% |

Source: [results_exp34](toy/results_exp34.txt). The median paired SE of an opening difference is 1.4 to 1.6e-3. Rule (c) at N = 8,000 has no loss above 2 SE in any pipeline.

**Table 4b (toy). 21 spread households (survival 0.30 to 0.95), same pipelines.**

| rule | P1 mean / worst | P2 mean / worst | C mean / worst |
|---|---|---|---|
| (a) argmax = (b) all δ = (d) | .0012 / .0072 | .0030 / .0279 | .0011 / .0066 |
| (c) N = 8,000 | .00006 / .0013 | .00004 / .0005 | .0000 / .0000 |
| keep plan's tier | .0040 / .0154 | .0091 / .0303 | .0038 / .0164 |
| hybrid τ = 1e-2 (rollouts on 71%) | = (c) | = (c) | = (c) |

Source: [results_exp4b](toy/results_exp4b.txt). In this sample the coarse top-two gap is below 3e-3 in 52% (product) and 38% (candidate) of households, and below 1e-2 in 71% of both. Source: [results_summary_extra](toy/results_summary_extra.txt).

- **Seed dependence of rule (c).** Repeating the rollouts with seed 4243 changes the N = 8,000 choice in 5/30 (P1), 4/30 (P2) and 2/30 (C) households. Mean losses become 0.0003, 0.0006 and 0.0001, with worst 0.0046, 0.0044 and 0.0018. At N = 1,000 choices change in 8 to 12 of 30. Source: [results_exp4c](toy/results_exp4c.txt).
- The largest losses of plain argmax are de-risked-too-far openings at the Medium/Low boundary (it opens Low where Medium is best). P2 at T40 loses 0.024 there; P1 loses 0.0085. Source: [results_exp34](toy/results_exp34.txt).

### Inferences
- In this toy the coarse grid's ranking of near-tied openings is unreliable at the 1e-2 level. Only a method that measures the realised gap directly (rule c), or a much finer solve, fixes it.
- Rule c's instability across grids and seeds (re-choices among genuinely tied openings) is harmless in loss. With a fixed seed it is deterministic for a given grid. The product's bit-for-bit determinism rule is met if the seed is part of the solve.
- A gating threshold must be set from the resolution bias, not from the perturbation SD. Here τ = 1e-2 worked and τ = 3e-3 did not. Gating then triggers rollouts in about 70% of households in this toy, at about 1.7M path-years each. That is cheap next to a backward solve in this toy, but its cost in the product is unknown.
- "Keep the plan's tier" is a poor default in this toy, because the best opening is de-risked in 9 to 15 of 30 households.

### Gaps
- Losses are measured against the argmax of a noisy realised estimate, which biases them upward by O(SE). The ranking of rules is robust to this; small absolute losses are not.
- Rule (c) re-ranks only the top two openings. A third opening, or the spending-tier pairs in the product, were not tested.

## 5. With the estate term on, how often does the near-tie opening change, and what survival does each choice realise? (Exp 5)

### Takeaway
An estate weight of 0.01 to 0.02 changes the near-tie opening in 1 to 4 of 30 households, always toward the riskier tier. The survival cost or gain is within ±0.003, and none of the changes is significant at 2 SE.

### Cited Findings
**Table 5 (toy, fine grid, 30 near-tie households, N = 16,000 per world).** The estate utility is u(W_T) = 1 − exp(−W_T/10) if W_T ≥ 1, else 0; it is bounded, i.e. capped at 1.

| mode, rule | β = 0.01: openings changed | β = 0.02: openings changed | realised survival change (paired, own pipeline) | whole-score table gap of the estate choice |
|---|---|---|---|---|
| product, plain argmax | 3/30 | 3/30 | −0.0019 to +0.0018 (SE 0.0011–0.0015) | +8e-5 to +1.9e-4 |
| product, margin 0.001 at year 0 | 4/30 | 4/30 | −0.0028 to +0.0018 (SE 0.0011–0.0016) | −9e-4 to +1.9e-4 |
| candidate, net argmax | 1/30 | 3/30 | −0.0008 to −0.0003 (SE 0.0011–0.0012) | +1e-5 to +3.1e-4 |

Source: [results_exp5](toy/results_exp5.txt). The changes are Low→Medium at Medium/Low ties and Medium→High at High/Medium ties. Averaged over the 30 households, turning the estate term on changes survival by −0.0002 to +0.0001.

### Inferences
- The estate term shifts whole-score gaps by up to about 3e-4, the same order as near-tie gaps. It therefore decides some near-ties, and survival-only and whole-score verdicts will disagree on them; this is consistent in kind with the brief's 36 of 220. In the toy, the survival consequences are below what 16,000 paths per world can detect.

### Gaps
- The raise credit and the spending-cut term are absent from the toy, so the product's auxiliary-term interactions are not tested.

## 6. Non-smoothness: which signatures do kinks, interpolation and snapping produce? (Exp 6)

### Takeaway
The odd/even split separates the sources cleanly:
- **Smooth gap (fine grid):** odd part ∝ h, even part ∝ h².
- **Year-0 argmax at a tie:** even part ∝ |h| from the smallest h.
- **Coarse max-then-interpolate tables:** even part ≈ 0 until the first node crossing (h ≈ 1e-3 at 30 points), then a jump to about 1.5 to 3e-4 that is not monotone in h, and the slope changes sign.
- **Nearest-node snap:** odd = −even = half the jump, a constant once h passes the snap boundary.

The brief's "part that ignores the sign and is not monotone in the step" matches the coarse-table and snap signatures, not a smooth objective.

### Cited Findings
**Table 6 (toy, T = 35).** W0 → W0(1 ± h); odd = (g₊ − g₋)/2, even = (g₊ + g₋)/2 − g₀.

| source (variant, point) | odd/h | even at h = 1e-3 | even at h = 1e-2 | signature |
|---|---|---|---|---|
| fine product, High/Med tie | 0.0552–0.0558 for h ≤ 3e-3 | 1.9e-7 | 1.6e-5 | smooth (fitted power: even 2.0, odd 1.0) |
| coarse product, same point | −0.057 (h ≤ 3e-4), −0.009 (h = 3e-3), +0.025 (h = 1e-2) | 5.0e-6 | **3.0e-4** | even ≈ 0 until 1 node crossing, then a jump; not monotone |
| coarse fixed-policy table (no max) | 0.044–0.053 | −6e-7 | −4.1e-5 | interpolation kinks only, about 7× smaller |
| coarse candidate, same point | as coarse product | 5.0e-6 | 2.9e-4 | as coarse product |
| year-0 best gap max(q1,q2) − q0 at the coarse tie | 0.10 | 1.8e-5 | 1.5e-4 | even/h ≈ 0.017 constant from h = 1e-5: argmax kink |
| fine product best gap at the fine tie | 0.010–0.012 | 1.6e-5 | 1.2e-4 | even ∝ \|h\| (power 0.95): argmax kink |
| coarse + W0 snap, 0.003 above a snap boundary | 0 (h ≤ 1e-3) | 0 | odd = +4.53e-3, even = −4.53e-3 for all h ≥ 3e-3 | step |

Source: [results_exp6](toy/results_exp6.txt). Node crossings within ±h (quadrature points × worlds × tiers) number 1 at h = 1e-3 and 2 to 6 at 1e-2 on the coarse grid, against 9 and 88 on the fine grid.

- **(derived)** Signatures by source:
  - **Smooth g:** odd = g′h + O(h³) and even = ½g″h².
  - **Kink** with slope jump s at relative distance d: the even part gains ½s(h − d) for h > d, so it is linear in h beyond the onset and is zero before it.
  - **Step** J at distance d: odd and even each become ±J/2 for h > d, so |odd| = |even| and both are constant.
  - **Argmax at the point itself (d = 0):** even ∝ |h| from the smallest h.

### Inferences
- A cheap test of the brief's item 4 is to fit the even part at 3 to 4 values of h spanning 1e-5 to 1e-2. The pattern identifies the source:
  - linear from the smallest h means a decision kink at the household (a true near-tie of the year-0 max);
  - zero, then a jump, then non-monotone, means grid-node crossings in the tables;
  - a constant step with |odd| = |even| means a snap.
- In the toy, most coarse-grid non-smoothness comes from max-then-interpolate. The no-max table's even part is about 7× smaller.

### Gaps
- The share-axis nearest-node snap and the bridge reader's reassembly do not exist in the toy. The snap signature was produced by snapping wealth artificially.

## 7. Set-up, reproducibility, what a one-dimensional toy can and cannot show, and what was not done

### Takeaway
The toy reproduces the product's switching structure and grid type but not its magnitudes. The mechanisms, and the relative ranking of rules, are the transferable outputs; the numbers are not.

### Cited Findings
**Model.** Source: [toy.py](toy/toy.py).
- **Wealth and spending:** W is in years of spending (s = 1). Spending is paid at the start of each year. A path fails if W < 1 at a payment date or if W_T < 1 (end pot = one year's spending). T ∈ {30, 35, 40}.
- **Tiers:** equity weights 0.9, 0.5 and 0.1, with real medians 4.97%, 4.18% and 2.76% (log mean = ln(1 + median)). Volatility comes from σ_equity = 0.17, σ_bond = 0.06 and ρ = 0.1, giving σ = 15.4%, 9.3% and 5.8%.
- **Worlds:** the log mean shifts by z·τ·w_eq with τ = 0.015 (equity-mean uncertainty only), z = −√3, 0, +√3 and weights 1/6, 2/3, 1/6. High therefore moves ±2.3% a year.
- **Returns:** 5-node Gauss–Hermite quadrature in the backward pass. The forward simulation uses exact log-normal draws from two correlated equity/bond shocks, so tier returns on a path are correlated but not identical.
- **Product mode:** per-world free-switching tables. The forward chooser re-scores the three tiers at the true W with world weights π, and keeps the held tier unless the best beats it by more than m.
- **Candidate mode:** the held tier is a state. One joint move is chosen by the π-weighted score. The charge c applies in both passes with margin 0, and the year-0 opening from the plan's tier is charged.
- **Grids:**
  - fine: 640 log-spaced points from 0.1 to 100, clamp 1e-9;
  - coarse: 30 points from 0.1 to 60, clamp 1e-6;
  - survival is interpolated in log-odds and the estate/charge tables linearly, all in log W, max-then-interpolate, with flat extrapolation;
  - the terminal condition and the W < 1 ruin region are applied analytically.
- **Forward re-scoring:** pre-tabulated on a 12,001-point auxiliary axis (step 0.0005 in log W). A spot check at half that density gave errors of about 3e-6, and 1.6e-4 at year 30.
- **Seeds:** 1000+T (Exp 1–2), 2024 (1b), 777 for evaluation and 4242/4243 for rollouts (Exp 4), 555 (Exp 5).

**Scripts → results.**
- Exp 1–2: `exp12_fine_consistency.py` → `results_exp12.txt`
- Exp 1b: `exp1b_neartie_highN.py` → `results_exp1b.txt`
- Exp 2b: `exp2b_candidate_charge.py` → `results_exp2b.txt`
- Exp 3–4: `exp34_coarse_rules.py` (raw `exp34_raw.pkl`) → `analyse_exp34.py` → `results_exp34.txt`
- Exp 3b–3d: `exp3b_grid_convergence.py`, `exp3c_richardson.py`, `exp3d_bias_accumulation.py`
- Exp 4b/4c: `exp4b_spread_households.py`, `exp4c_rollout_seed.py`, analysed with `analyse_exp34.py` / `analyse_exp4c.py`
- Exp 5: `exp5_estate.py` → `analyse_exp5.py`
- Exp 6: `exp6_nonsmooth.py`
- Extras: `summary_extra.py`

**Runtimes (2 cores):**
- solves: fine about 0.15 s, coarse about 0.01 s;
- a forward run of 24,000 paths × 35 years: about 0.33 s;
- Exp 3–4: 13 min; all others 5 s to 7 min.

### Inferences
- **What the toy can show:**
  - the one-year pricing in product mode against the hold (derived and measured);
  - the candidate's bound and its consistency;
  - that grid error can be a cumulative, same-sign bias that small perturbations miss;
  - the relative performance of opening rules;
  - the odd/even signatures of the different non-smoothness sources.
- **What it cannot show:**
  - **Magnitudes:** the toy's survival curve is steep because spending is fixed, with no cuts, floor, state pension or mortality. Its one-year tier effects are therefore about 1e-2 against the product's about 1e-3, which changes switch rates and hold lengths.
  - **Missing dimensions:** pension share, bridge years, tax buckets and the raise credit are absent, as is blending tier returns at the median (brief item 8).
  - **Sign of the product's bias:** whether the product's 30×5 bias has the same sign and size, and whether its interpolation across the share axis adds or offsets it.

### Gaps
**Not done** (time spent on the core items instead):
- the optional spending floor;
- the stored-decision vs forward-chooser disagreement (brief item 5);
- end-pot near-miss shares (item 9);
- tie-breaking by menu order (item 10): the toy breaks ties by first maximum, i.e. the plan's tier first;
- a held-out confirmation of rule (c) with a different evaluation seed;
- rollouts over more than two openings;
- testing whether the coarse bias is reduced by interpolate-then-max or by monotone/shape-preserving interpolation;
- a candidate run with the forward margin set to 0 as a hold-removal check (only product margins were swept).

No literature was consulted; web searching was optional, and the methods literature belongs to other researchers.
