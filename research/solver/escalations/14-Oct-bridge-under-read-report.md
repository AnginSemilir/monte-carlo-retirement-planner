<!-- FALLBACK (research/solver/escalation.md): a general-purpose agent at the session's own model (the serving model unconfirmed: the tool reports none), maximum effort, read-only, ordinary web search (not a deep-research mode); launched 14 Oct after an hour with no report from the maintainer; saved verbatim from its hand-back. Outside evidence: grade C until a registered test repeats it. -->

# FALLBACK escalation review, 14 Oct: tables that under-read survival in the bridge years

Brief: `research/solver/escalations/14-Oct-bridge-under-read.md` (triggers 1 and 3; NODE-AX is held).

## What ran

- **The run:** the escalation rule's fallback (`research/solver/escalation.md`), a general-purpose agent. Model: the session's own; the serving model is unconfirmed, because the tool reports none. Effort: maximum. Search: ordinary web search, not a deep-research mode.
- **Read-only:** no file was created, edited or deleted, and no audit-*, batch or launcher was run.
- **Files read in full:** the brief and `escalation.md`; `src/solver/grid.js` and `reader.js`; `solve.js` l.100-262 and l.560-1600; the receipts of 13 Oct 18:36, 13 Oct 23:45 and 14 Oct 06:33 UK; `results-node1.txt`, `results-derive-node1.txt`, `results-derive-nodeax.txt`, `results-policy-gap.txt`, `results-ref2.txt`, `results-ref2-reported.txt`, `results-neref.txt`.
- **Logs and scripts read:** `results/diagnode1/case0-1.txt`; `results/nodeax-preflight/case0-1.txt`; `audit-nodeax.mjs`, `reduce-nodeax.mjs`, `derive-nodeax.mjs`; `audit-node1.mjs` (its timing lines); `candidate.mjs`, `research-opts.mjs`.
- **Plan and rules read:** PLAN.md rows O36, O145, O151-O155, PR20, REF-S, NODE-1, NODE-AX and NE-AXIS; RULES.md section 9.
- **Commands beyond reading:** `git log -- src/solver`, and one read-only `node -e` over the two committed preflight per-path files (its output is in 4.2).
- **Status:** this is outside evidence, grade C until a registered test repeats it. Every claim a recommendation rests on carries its file and line, to be re-checked before acting.

## Summary

1. **This is not the familiar bias of interpolating a maximum.** That bias reads high: a chord drawn over a convex envelope. The reader's own algebra gives the read error at a cell as **e_S − c·e_p**: the policy's interpolation error, less c times the reference's (grade A).
   - On S360 every path that pays the bridge survives, so c ≈ 1.
   - The error is negative in the band between the reference's cliff and the policy's own cliff, positive on either side of it, and zero only where survival is proportional to the reference.
   - No fixed-move reference can remove it. An adaptive reference can: the policy's own bridge chance, from a small backward induction in accessible money, ISA share and tier, with one move for all worlds. It would make the read exact (up to c's smooth part) at any share density. This is the main missed design.
2. **Causes, ranked:**

   | cause | credence |
   |---|---|
   | The late bridge years (4-6): the band is narrower than a 0.025 share cell | 0.45 |
   | An error in the reader's split in the early years | 0.12 |
   | The wealth axis | 0.10 |
   | The ISA share | 0.08 |
   | A model-level gap | 0.06 |
   | Noise | 0.05 |
   | Quadrature (more likely masking than causing) | 0.04 |
   | Other | 0.10 |

3. **NODE-AX as built is not worth running.** Its 0.95 else row comes from its design, not from the per-path spread:
   - Its primary item is an attributed share term. At the only record that term had the opposite sign to the residual.
   - Its cause map needs an additivity clearance that the record failed by 2.5 to 7 times, and a known positive whose line sits at its own expected value.
   - Its two-point read is not the reader in the cliff band, and the check of it never samples there.
   - Its quadrature term is buried in each path's 0/1 outcome noise.
   - Its tables are not saved, and its ledger is costed at about half what the preflight's timing implies.
4. **Re-cut, it is the decisive test.**
   - **Design:** the primary items are read by bridge year and are exact. The known positive is taken on the exact bridge residual at half of NODE-1's lift. A deterministic quadrature term is added, and the share attribution becomes a secondary, repaired item. The tables are saved.
   - **Paths:** 4,000 a world.
   - **No separate spread run is needed.** At the preflight's spread the late share's standard error is about 0.01 at 4,000 paths.
   - **Cost:** about 4.5 h wall on four cores as the audit runs (one job per core), or about 2-2.5 h with E2 and a path split.
   - **Else row:** about 0.3, or about 0.45 if the table insists on a year verdict.

## 0. The brief checked against the code and records

**What holds:**
- Every figure in sections 2-4 matches its file:
  - the tables less runs for BASE, BO and BN, and the 95% share household's 82.6409, 95.7584 and 95.6140;
  - NE-REF's MIX, MIXO and MIXS;
  - REF-2's 0.9042 and 1.2586, its GAP 0.0293, −0.0109 and −0.0201, and its quadrature ratios 0.9980, 1.0013 and 0.9992;
  - Step 0's 205/207/223, 3/0/0 and 194/189/187;
  - NODE-1's 2.9784 of 5.1491 and 3.2969 of 5.1616, with solve times of 11,562 s and 3,899 s;
  - the derivation's spreads and its else row of 0.95.
- The quoted lines are correct: grid.js l.124, l.247, l.411 and l.417-419; reader.js l.97 (inside the support-line condition) and l.134; solve.js l.667, l.671, l.1343 and l.1463.
- The solver code is unchanged since NODE-1. The last commit to src/solver is NODE-1's build (d891e0e), and NODE-AX's preflight is stamped with NODE-1's code id d297b820d217 (grade A). Item 0's reproduction risk is therefore low.

**What is incomplete or not as stated:**
- **"The two-point reader form reproduces the real read" holds only where both ends are supported.** readTook keeps a pair only if both ends' chance is at or above the support line (audit-nodeax.mjs l.161).
  - read2's rule for an unsupported end is to copy c from the other end of the axis being read, or to set c = 0 at both ends when neither is supported (l.130).
  - buildReaderTable's rule is different: it copies c along the share row from the nearest supported node at any distance, else from the nearest wealth row with support (reader.js l.105-133).
  - The two differ in the cliff band, and that case is never tested.
- **The tables are not saved.** PLAN.md's NODE-AX row says "the solved tables saved", but the audit writes only bits and per-path arrays (l.225).
- **The quadrature term is not what the review designed.** The 06:33 receipt asks for "the quadrature term (Q5 less fine)". The build records T = the one-step value less the next year's read at the realised state. T carries each path's 0/1 outcome: its per-path SD at the preflight was 35.5 and 47.2 points. Its mean therefore has a standard error of about a point a world at 2,000 paths.
- **The ledger is costed low.** The derivation takes the ledger at 1.2 times NODE-1's plain runs, which ran about 0.13 s each (1,714 s for about 13,000 runs). The preflight's own ledger took 43 s for 120 path-worlds, or 0.36 s each: about 2.7 times a plain run. The BN job is about 3.8 h at 2,000 paths, not 3.5 h (grade C).
- **The derivation's power analysis has three problems:**
  - It scales the 4-point spread up (×1, ×2, ×4), never down.
  - It applies the 4-point per-path SD (8-10 points, around a 4-point mean of −6) to a 60-point mean of −1.6 to −1.8.
  - **No item reaches FALSIFIED in any cell of its power table:** 0.00 throughout, even when the share term is 0.1 of GB. As derived, the test cannot falsify.

**A fact the brief does not state:** on S360, bridges paid equal survivors in all three worlds of both NODE-1 arms (grade A).
- BN, `case0.txt`: 1151/1151, 1956/1956, 2794/2794.
- BO, `case1.txt`: 1145/1145, 1946/1946, 2791/2791.

Post-access survival given a paid bridge is therefore about 1, and S is the bridge chance. At supported nodes c = min(1, S/p) (reader.js l.97), which is 1 wherever the policy beats the reference; Step 0 shows it does, by about 5 points (grade C). Nodes far from the opening's ISA share can have c below 1, because ORDER reads at the opening weights; that only adds terms to the algebra in 1.2.

## 1. Mechanisms the record has missed

### 1.1 The sign of "interpolating a maximum"

For any move values Q_a, the interpolation of node optima is at least the optimum of the interpolated move values:

> Σ_i w_i · max_a Q_a(x_i) ≥ max_a Σ_i w_i · Q_a(x_i)

If each Q_a is linear in the interpolation coordinate, the right side is the true value. Interpolating node optima then reads **high**: a chord over a convex envelope. The upper-envelope literature corrects exactly this, along with the misplaced switch point.

An off-node value exceeds the interpolation of node optima only where the move values are concave in the coordinate, as on the upper shoulder of a survival cliff. So re-optimisation does not by itself cause an under-read; curvature does (grade A).

The right frame for "the runs beat the table" is this. Suppose the table sits at or below its own one-step backup at every state the chooser visits (G_t ≤ 0). Then the greedy chooser realises at least the table's value, by the monotonicity of the Bellman operator; this is rollout's improvement property.

NODE-AX's identity, OWN − survived = ΣT + ΣG on every path, is exactly the temporal-difference decomposition of a Monte Carlo return. The under-read is the path sum of the table's Bellman residuals (grade A). The ledger is the right instrument; section 4 is about how it is cut.

### 1.2 What the p × c + R split does: the read error is e_S − c·e_p

The read is v = p(A_q)·Σ w_k c_k + Σ w_k R_k, with R_k = S_k − p_k·c_k (grid.js l.417-419; reader.js l.97 and l.134). With c constant over a cell's corners:

> v − S(x) = [Σ w_k S_k − S(x)] − c·[Σ w_k p_k − p(A_q)] = **e_S − c·e_p**

That is the policy's own interpolation error, less c times the reference's (grade A). For S360, c ≈ 1. Three consequences follow:

- **The split is exact only where S is proportional to p.** Any fixed-move reference whose cliff differs from the policy's leaves e_S − c·e_p. The 23:45 receipt's "no fixed-move reference can carry it" is right, and this is why.
- **The error has a band structure.** The policy's cliff sits left of ORDER's: it pays about 200 bridges a world that the better fixed move loses (`results-policy-gap.txt`, grade C).
  - Between the two cliffs, S is concave (above its inflection) and p is convex (below its), so e_S < 0 and e_p > 0. The read is low on both counts.
  - Above both cliffs, or below both, the two errors partly cancel and leave an over-read.
- **c's clip at 1 and the support line put kinks inside the band.** The clip (l.97) moves the whole gain into R exactly where S > p, and the 0.5 support line with its copied c adds a second kink.

So the split turns "a cliff narrower than a cell" into "a band narrower than a cell": the band between the reference's cliff and the policy's.

The preflight's cliff lines (`results/nodeax-preflight/case0.txt`) come from the solve's own ORDER reference, at the 4-point run's median states (grade C). They show:
- The cliff narrows from 9.5-11.4k of accessible money in year 1 to 1.1k in year 6, then becomes a step in year 7.
- A dense share cell spans 4.2-5.6k at those states.
- The cliff therefore spans about 2.6, 2.0, 1.5, 1.0, 0.65 and 0.21 dense cells in years 1-6.
- The median pension share drifts from 0.87 to 0.97.

NODE-1's list can resolve the band in years 1-3, and cannot in years 4-6.

### 1.3 Offset averaging: a caution about the size of the effect

Averaged over where the nodes fall relative to a state, linear interpolation returns the function convolved with a triangular kernel K whose half-width is one cell. Over the visited states, with density ρ, the net error is:

> ∫(ρ∗K − ρ)·f ≈ (h²/12)·∫ρ″·f, when ρ is smooth on the cell's scale (grade A).

A band narrower than a cell therefore leaves a large net under-read only in one of two cases:
1. **The visited states cluster on the band at the cell's scale.** This is plausible late in the bridge, where a share cell (4-5k) is about the paths' spread of accessible money.
2. **The band sits systematically relative to the nodes.** Its share location, 1 − A*/W, moves only about 0.005 per wealth row (A*/W ≈ 0.035 times the 14.2% wealth step). That is a fifth of a dense cell, so across the two or three wealth cells the late paths span, the offsets are not randomised.

Two implications (grade D):
- **Per-path G will have both signs**, over-reading where a corner lands in the band. Its spread can be wide while its mean is moderate.
- **The remainder may depend on exactly where the dense nodes fall.** A half-cell shift of the list would test this; it is simple to describe but costs another dense solve.

"The cliff spans under one cell" is therefore not the same as "the gain is lost". The ledger has to measure it.

### 1.4 Every tier layer reads the plan tier's reference

`chanceOf(k, t)` takes no layer, and the reader tables of every tier layer of world k are built against it (solve.js l.1242 and l.1258; grade A). In a de-risked layer, the layer's own bridge cliff is sharper than the plan tier's p and sits elsewhere. So c and R carry a sharper feature, and the band widens, in the layers a late-bridge policy is most likely to hold. The 18:36 receipt names this premise, but the N2 cause set does not carry it.

### 1.5 Quadrature masks the under-read rather than causing it

The backward pass picks the best of the menu's moves on 5-node estimates, and the chooser does the same. The pick is therefore biased toward moves whose five nodes happen to fall favourably against a narrow cliff (the winner's curse), and this raises the table.

Averaged uniformly over where a cliff falls, the 5-node error of a step integrates to zero, because Gauss-Hermite integrates linear functions exactly. Late-cliff quadrature should therefore move the gap upward and hide part of the under-read (grade D, argued). REF-2's ratios (grade B) cover only year 1.

### 1.6 Why 15 share nodes close only about 60%

My reading, in order:
1. **The late band:** in years 4-6 the band is narrower than a 0.025 cell (grade C for the cliff table; the band's own width is not measured).
2. **An early residual:** e_S − c·e_p is first order wherever the two cliffs' displacement is a sizeable fraction of a cell (grade A for the form, D for its size).
3. **The de-risked layers' mismatched reference** (1.4; grade A for the code, D for the size).
4. **The closed share's own interval:** 0.44-0.84 in world 0 (grade B). "60%" may be 80%.

### 1.7 Which standard corrections transfer

- **A coordinate that follows the cliff: yes, and it is the most direct.** Per year and per wealth row, place share nodes at fixed quantiles of the year's cliff in accessible money.
  - COV-B's per-row share nodes and their locate exist (grid.js l.275-295 and l.336-351; solve.js l.744 onward).
  - But coverage refuses e3 and `bridgeStep: 'exact'` (solve.js l.868), and the candidate carries both (RESEARCH_OPTS `e3: true`; CANDIDATE_OPTS `bridgeStep: 'exact'`). Those exclusions would have to be lifted, with identity tests.
- **Endogenous grid points: in part.** The placement of nodes where the problem's kink is transfers. The inversion step does not, because there is no first-order condition over a discrete menu.
- **Upper envelopes: no.** They correct the opposite error (1.1).
- **Carrying the gain as a money shift, S = c·p(A + δ) with δ interpolated: only where nodes resolve the band.** In years 4-6 almost every corner is saturated (S ≈ 0 or 1), and there δ is not identified. A shift therefore cannot recover a gain that no corner sees. The same holds for a shift in probit units.
- **Carrying the gain in p, with an adaptive reference: yes.** Because e_S − c·e_p vanishes when p is the policy's own bridge chance, compute that chance directly:
  - **Method:** a backward induction over accessible money A, ISA share b and the tier layer, at the floor's bills (`needY − inY`), across the menu's two draw orders and three tier pairs.
  - **One move for all three worlds,** chosen on the mixture, as the solve chooses (the TS+J branch, solve.js l.1124 onward). A per-world optimum would credit adaptivity the policy does not have, since it cannot learn its world.
  - **Storage and read:** tabulated per world, year and layer on a fine A grid, and read in probit along A and linearly along b. This is REF-S's design (PLAN.md REF-S), whose unit tests are the template.
  - **Cost:** thousands of states a year, against the solve's tens of thousands of cells times hundreds of moves; well under one per cent of a solve (grade D).
  - **What it removes:** the share-cell and wealth-cell band error in every year, the plan-tier mismatch in de-risked layers (1.4), and the reference's blindness to b. It needs no new nodes.

## 2. Methods and literature, and how each bears on this code

1. **Endogenous grids and upper envelopes.**
   - Sources: Carroll (2006); Fella (2014); Iskhakov, Jørgensen, Rust and Schjerning (2017, DC-EGM); Druedahl and Jørgensen (2017, multi-dimensional with non-convexities); Druedahl (2021); Dobrescu and Shanker (FUES, CEPAR 2023/04 and 2024/20); Ludwig and Schön (2018).
   - What they do: grid points are produced by inverting first-order conditions from a post-decision grid, so constraints and discrete switches fall exactly on nodes; upper envelopes discard the sub-optimal segments of choice-specific value functions.
   - Bearing: the planner's moves are discrete, so the inversion step is unavailable. The envelope corrects over-reads at choice switches (1.1), not this error. What transfers is placing nodes on the cliff each year (1.7).
2. **Transformed values and coordinates.**
   - Carroll's notes and the Econ-ARK (HARK) toolkit interpolate near-linear objects near the constraint (the consumption function, or an inverse transform of value), not a value function with extreme curvature there. The planner's log-odds read outside the bridge is the same idea (grid.js l.30-33).
   - Browne (1999): for a deadline goal with one risky asset and constant coefficients, the maximal success probability is Φ(Φ⁻¹(x·e^{rτ}/b) + θ√τ). That is linear in probit space in a coverage coordinate, while a fixed mix's is linear in probit space in log wealth.
   - The default reference is exactly probit-linear in ln(A − d0), up to the minimum over prefixes (reader.js l.37-44).
   - Bearing: interpolate Φ⁻¹(S) along a cliff-following coordinate, paired with the axis in 1.7. Alone, this cannot see a band that no node sees.
3. **Adaptive and sparse grids.**
   - Grüne and Semmler (2004) build local a-posteriori error estimates from the Bellman residual and refine where it is large.
   - Brumm and Scheidegger (2017) use adaptive sparse grids with local piecewise-linear bases, refining at steep gradients and non-differentiabilities.
   - Smolyak methods (Judd, Maliar, Maliar and Valero 2014) use global polynomials suited to smooth solutions; a cliff narrower than a cell is the wrong case for them (judgement).
   - Bearing: NODE-AX's G_t is Grüne's residual measured on the policy's own states. What this five-axis grid lacks is per-year adaptivity, not sparsity.
4. **Shape-preserving interpolation.**
   - Judd and Solnick (1994); Cai and Judd (2013).
   - Bearing: multilinear interpolation is already monotone and bounded. Higher-order shape-preserving splines reduce the O(h²) error where the function is resolved, but add nothing inside an unresolved band. Low priority.
5. **Interpolating the re-optimisation gain.**
   - Keane and Wolpin (1994) compute the expected maximum by simulation at a subset of states and fill in the rest by regression. As I recall the specification (this search did not confirm it), the regressors are functions of the gaps between the alternatives' values, that is the option value of re-choosing, rather than raw state coordinates.
   - Bearing: R is that option value. Expressing it against a distance-to-the-cliff variable rather than (log W, a, b) is the same idea; the adaptive reference is its exact form.
6. **Post-decision states.**
   - Powell (2011; cited from the book) tabulates value after the decision and before the shock. The maximisation is then done exactly at each state and never interpolated; the interpolated object is an expectation already smoothed by returns.
   - Bearing: the chooser already maximises exactly at the path's state; the table is a pre-decision maximum. A post-decision table, dense in accessible money at next year's cliff, would be the structural fix, with about the same number of reads. It is an architectural change: later, not now.
7. **Rollout and sub-solutions.**
   - Bertsekas's rollout survey; Bertsekas and Tsitsiklis (1996; cited from memory). A one-step lookahead on a base policy's values does at least as well as the base, and a greedy policy on a sub-solution (V ≤ TV) achieves at least V.
   - Bearing: "the runs beat the table" is that signature (1.1).
8. **Measuring interpolation bias against simulation.**
   - Santos and Vigo-Aguiar (1998) bound the value error through the Bellman residual; it is quadratic in the mesh for smooth problems, which these late cliffs are not at the cell's scale.
   - den Haan (2010) judges accuracy along simulated paths, where errors accumulate, not one step at a time.
   - Sutton (1988; cited from memory): a path's Monte Carlo return less its value equals the sum of its temporal-difference errors.
   - Bearing: NODE-AX's identity is that last form, the standard instrument. Its year split is the natural first reading.
9. **Retirement and ruin.**
   - Milevsky and Robinson (2000) moment-match the present value of spending to a reciprocal gamma, the same family of approximation as the default reference's moment-matched lognormal D. Huang, Milevsky and Wang (2004) ask how good such approximations are.
   - Young (2004) and Bayraktar and Young (2007): the strategy that minimises the probability of ruin takes the most risk when wealth is low. This is bold play, after Dubins and Savage (1965; cited from memory). The optimal survival curve's shape therefore differs from any fixed mix's.
   - Das, Ostrov, Radhakrishnan and Srivastav (2020) maximise the probability of reaching goals by backward induction over a wealth grid, with a portfolio menu and cash flows.
   - Bearing: the gain over a fixed reference is structural near the boundary, not a grid artefact. A low-dimensional DP in wealth is the field's standard way to carry it, which is the adaptive reference's form.

## 3. The root causes, ranked

Grades: A = code or arithmetic checked here; B = a registered result; C = a measurement or scratch figure; D = a judgement. The credences sum to 1. Each cause ends with its signature in the re-cut ledger (4.2).

**1. LATE-BAND (0.45).** In years 4-6 the band between the reference's cliff and the policy's is narrower than a 0.025 share cell, so the read falls back toward the plan-tier fixed-move reference.
- For:
  - The read error is e_S − c·e_p, with c ≈ 1 on S360 (A).
  - Bridges paid equal survivors (A).
  - The cliff spans 1.0, 0.65 and 0.21 dense cells in years 4-6 (C).
  - BO's single cell [0.8, 1] holds every bridge-year state, and its table is the reference at mid-cell (the 23:45 identity, B).
  - NODE-1's closed share is ordered by world, 0.58, 0.64 and 0.75: the poor world, where paths stay near the cliff longest, closes least (B).
  - At the 4-point record, years 3-6 hold 0.79 and 0.47 of the bridge residual, though the wealth cells dominate at that resolution (C).
- Against:
  - Offset averaging needs clustering or a systematic offset to give a large net bias (A for the identity, D for applying it).
  - The share of the gain made in years 4-6 is unmeasured (D).
  - In world 1 the 4-point late share was 0.47 (C).
- Signature: G concentrated in years 4-6, with the share-exact term removing most of it.

**2. EARLY-SPLIT (0.12).** The split's error in years the dense list does resolve, plus the plan-tier reference in de-risked layers.
- For:
  - The split is exact only when S is proportional to p (A).
  - Every layer reads the plan tier's p (A).
  - The policy pays about 190-200 bridges a world that neither fixed order pays, so its cliff differs from ORDER's in shape, not only in place (C).
- Against:
  - The cliff spans 1.5-2.6 cells in years 1-3, where a smooth error is second order (C).
  - NODE-1's 3-point lift most naturally reflects the early years being resolved (B).
- Signature: G in years 1-3, and larger G on paths holding a de-risked tier.

**3. W (0.10): the wealth axis, unmasked once R is carried.**
- For: the 14.2% wealth step is 1.1-2.2k of accessible money in years 4-6, as wide as those cliffs (C; grid.js l.98 and l.123).
- Against: there a dense share cell is 2-4 times the wealth step in money, and the bilinear read is dominated by the coarser direction (C).
- Signature: G in years 5-6 that the share-exact term does not remove, and a large one-axis wealth term.

**4. B (0.08): the ISA-share axis.**
- For:
  - ORDER reads at the opening weights (solve.js l.645-646; reader.js l.171) and ignores the state's ISA share (A).
  - The menu's two draw orders push b toward 0 or 1 across 0.2-wide cells (A).
- Against:
  - Late in the bridge one pot is left and S varies little with b (D).
  - b has the same six nodes in BN and BO, so NODE-1 says nothing about it (A).
- Signature: G spread across the years, a large one-axis b term, and G growing with |b − 0.53|.

**5. MODEL (0.06): something the exact-state chooser sees that no node backup can hold.**
- For:
  - S224 under-reads with no bridge year at 120 points (NE-GRID C, B).
  - The sheltered cash is read at the year's typical value at nodes (grid.js l.247, A).
- Against:
  - NODE-1 lifted the table 3 points through the share axis alone (B).
  - S360's survival is its bridge payment (A), so after-access dimensions cannot carry the gap.
  - The preflight's CASH term is about 0 (C).
- Signature: a small bridge residual, with the after-bridge residual or REST carrying the gap.

**6. NOISE (0.05): the remainder is smaller than it looks.**
- For: BN's gap intervals are −3.81 to −0.57 (world 0) and −3.65 to −0.08 (world 1), and the closed share's interval is 0.44-0.84 (B).
- Against: both intervals exclude zero (B).
- Signature: the bridge residual near −1, with T absorbing the runs' luck.

**7. QUAD (0.04): quadrature at the late cliffs.**
- For: the late spread years read a 1.1k cliff through five nodes (C).
- Against:
  - The year-1 ratios are 0.998-1.001 (B).
  - The winner's curse raises the table (D).
- Signature: a large, negative deterministic quadrature term in years 5-6.

**8. OTHER (0.10).** Examples:
- The step year's read ignores the year's tax. `readerTax` is off in the candidate, so the band [d0, d0 + tax] over-reads.
- ORDER's best-of-orders envelope is optimistic where the engine cannot follow the order.
- The gain bucket's snap.
- None of these is checked here (D).

## 4. The one decisive test

### 4.1 NODE-AX as built: not worth running

- **Its primary item is the attributed share term AA over GB.** At the only record (4 points, 40 paths), BN's AA/GB was −0.77 and −0.65 in worlds 0 and 1: the share term had the opposite sign to the residual. REST was 1.3 to 3.6 times GB across the arms and worlds.
- **The cause map can open nothing unless three conditions all hold** (`reduce-nodeax.mjs` l.151): item 0 HELD, item 3 HELD, and the clearance.
  - The clearance needs |REST| ≤ ½|GB|. The record failed it by 2.5 to 7.1 times.
  - Item 3's HELD line, −2.5 (l.41), sits at its own expected value of about −3 (NODE-1's lift of 2.98). The derivation gives it HELD 0.34.
- **As derived, no item can reach FALSIFIED.** Item 1 can be HELD only when the share term is about 0.9 of GB or more.
- **read2 is not the reader in the cliff band, and readTook never samples there** (section 0).
- **T cannot separate quadrature from outcome noise, and the tables are not saved.**

### 4.2 The re-cut, which is the decisive test

**Arms and settings:** as built. BN at 60 points with the 15-node list and BO at six shares, both under ORDER, on the candidate's unit with seed 7002. **Save the solved tables.**

**Paths:** 4,000 a world.
- These are NODE-1's paths, so item 0 checks every run, and item 1 keeps a margin in world 1, whose remainder (−1.86) is the smaller.
- 2,000 would serve if wall time matters more.
- The share-exact term runs on the first 1,000 paths.

**Terms per path,** added to X, B0, T, GB and GA:
- **G_t for each bridge year 1-7, saved per path.** The audit already computes it (`yr.G`) but keeps only sums across paths.
- **QF_t, a deterministic quadrature term:** the chosen move's 5-node one-step value less a fine one at the same state. Use bisection to the step and 12-point Gauss-Legendre on each side, as `stepExpect` does, or 40-point Gauss-Hermite in spread years.
- **A share-exact counterfactual in years 4-6:**
  - Read at the state with the share coordinate exact: the four wealth and ISA-share corners at the state's own share, each an exact backup.
  - Form c and R by the reader's own rule, copying c along the share row from the nearest supported node's backup.
  - Subtract the backup at the state.
- **Reported only:** the one-axis W, b and cash terms and REST, with read2 changed to the reader's copy rule.
- **Also reported:**
  - the per-year cliff against the cells, as built;
  - the share of late path-years with an end below the support line;
  - G by the tier pair held.

**Self-checks**, as built plus:
- readTook on pairs with one end supported and with no end supported, on each axis, with a planted fault (c = 0 at unsupported ends) that must fail it;
- QF near 0 at well-funded states;
- the fine integral checked on a planted step.

**Items.** Worlds 0 and 1 unless stated; intervals as the reducer forms them (z = 2.2414).

| item | quantity | HELD | FALSIFIED | otherwise |
|---|---|---|---|---|
| 0 (control) | as built | as built | as built | as built |
| 1 (the bridge grid) | BN's bridge residual GB | top ≤ −1 in both worlds | bottom ≥ −0.5 in both | INCONCLUSIVE |
| 2 (late years, exact) | F_L = mean(Σ_{t=4..6} G_t) / mean(GB), BN; scored only if item 1 is HELD | bottom ≥ 0.5 in both | top ≤ 0.25 in both | INCONCLUSIVE |
| 3 (known positive, exact) | BO's GB less BN's, world 0, paired by path (expected about −2.8: the two arms' OWN less runs differ by 2.83, B) | top ≤ −1.5 (half NODE-1's lift) | bottom ≥ −0.5 | INCONCLUSIVE |
| 4 (secondary: the share axis within years 4-6) | the share-exact term's part of BN's years 4-6 residual, first 1,000 paths; scored only if the extended readTook and its plant pass | bottom ≥ 0.5 | top ≤ 0.25 | INCONCLUSIVE |

**Decision table:**
- **R1, the bridge grid, late:** items 0, 1, 2 and 3 HELD. Build the adaptive reference (1.7) first; the cliff-tracking share axis is the alternative. Item 4 says whether the share axis or the wealth axis carries the late residual.
- **R2, the bridge grid, not late:** items 0, 1 and 3 HELD, item 2 FALSIFIED. Build the adaptive reference, which removes e_S − c·e_p in every year; not a denser list.
- **R3, the bridge grid, years mixed:** items 0, 1 and 3 HELD, item 2 INCONCLUSIVE. Build the adaptive reference, and record the year profile.
- **R4, not the bridge grid:** items 0 and 3 HELD, item 1 FALSIFIED. QF and GA split quadrature from the years after access. The next test is a quadrature or model test, and no grid fix follows.
- **Else.**

**The else row: about 0.3 (judged, D; plausibly 0.2-0.4).**

| input | value | basis |
|---|---|---|
| item 0 HELD | 0.97 | the solver code is unchanged since NODE-1 (A) |
| item 3 HELD | about 0.9 | expected about −2.8 against a line at −1.5 |
| item 1 HELD | about 0.74 | the grid causes, about 0.75 of the credence, put GB near −2 |
| item 1 FALSIFIED | about 0.1 | QUAD, MODEL and NOISE put GB near zero about half the time |

So the else row ≈ 1 − 0.97 × 0.9 × 0.84 ≈ 0.27.

If the table insists on a year verdict (R3 dropped), the else row rises to about 0.45. In that case, reading item 2 on world 0 alone, with world 1 reported, brings it back to about 0.38. The main risk to item 2 is a true late share between 0.25 and 0.5, not imprecision.

**Why no separate spread record is needed.** The year-based ratio's precision comes from the late part being part of the whole. From the committed preflight files (read-only):

```
node -e '…per path, in points: GB, GL (years 3-6, as the audit defines it), AA; F_L = mean(GL)/mean(GB); se = sd(GL − F_L·GB)/√4000/|mean GB|…'
BN/P60S15Q5 world 0 n 40 | GB mean -5.97 sd 9.83 | GL mean -4.74 sd 6.05 corr(GL,GB) 0.922 F_L 0.795 se@4000 0.009 | AA/GB -0.768 se@4000 0.035 | T sd 35.5
BN/P60S15Q5 world 1 n 40 | GB mean -6.83 sd 6.40 | GL mean -3.20 sd 4.62 corr(GL,GB) 0.796 F_L 0.469 se@4000 0.007 | AA/GB -0.646 se@4000 0.028 | T sd 47.2
```

- The late share's standard error is about 0.01 at 4,000 paths.
- If the residual shrinks to its 60-point size while the per-path spread stays at its 4-point size, the standard error is still under 0.04 at 2,000 paths (grade C).
- Re-derive the else row from these files, at spreads from ×0.5 to ×4. That is a derivation change, not a run.
- A 60-point spread record is needed only if the attributed share term stays the primary item. In that case run BO alone first.

**Cost on four cores** (grade D; the ledger re-costed from the preflight's own timing, grade C):

| job | solve | ledger, 4,000 paths a world | added terms | total on one core |
|---|---|---|---|---|
| BN | 11,562 s | ≈ 4,300 s | ≈ 400 s | ≈ 4.5 h |
| BO | 3,899 s | ≈ 3,500 s | ≈ 400 s | ≈ 2.2 h |

- **As the audit's parts run (one job per core):** about 4.5 h wall and about 6.7 core-hours. At 2,000 paths: about 3.9 h wall.
- **With E2 for the solves:** about 2-2.5 h wall. This requires two things first:
  - a 4-point run showing E2's tables are bit-identical with shareNodes and ORDER. The 06:33 receipt marks this NOT CHECKED, and the audit needs wiring for E2.
  - the ledgers split by path from the saved tables, which need about a gigabyte of disk for BN (D).
- Either way the run is over 2 h, so trigger 3 applies; the else row is what clears it.

### 4.3 A cheaper screen, if two hours is a hard limit

Run BO alone: about 1.6-2 h on one core at 2,000 paths. It can be registered and can falsify LATE without the dense solve.
- BO's single six-node cell holds every bridge-year state, so its G_t by year is the gain the reference misses, year by year.
- If BO's years 4-6 carry at most 0.4 points in world 0, the late years cannot carry BN's world-0 remainder, whose 95% top is −0.57 (`results-node1.txt`); this assumes finer cells read no worse (D). LATE is then FALSIFIED.
- It cannot confirm LATE, because BN's own early residual is invisible to it.
- It also gives the 60-point per-path spreads.

### 4.4 What follows, and not before the ledger reads (RULES.md section 9, rule 5)

- Design the adaptive reference now, with no run:
  - unit tests against a pot-level simulation of the same adaptive rule, with the joint-worlds choice and per-layer tables;
  - a research option, inert and bit-identical when off, behind the golden tests and the smoke run.
- Design the cliff-tracking share axis on COV-B's per-row machinery, with its e3 and `bridgeStep: 'exact'` exclusions lifted under identity tests.
- Read whichever fix the ledger chooses on S360, S364, S224 and the 95% share household.

## 5. What would leave NODE-AX wasted

1. **An additive split that does not add.**
   - At the only record, REST was 1.3-3.6 times GB, and the share term had the wrong sign.
   - A cross term is structural, not only a 4-point artefact, because the cliff runs along A = (1 − a)·W, diagonal to both axes (D).
   - read2 differs from the reader where an end is unsupported, which is exactly the cliff band. For S360, with c ≈ 1, the case that matters is both ends unsupported: read2 reads plain linear S there, while the reader reads blend(S) + c·(p(A_q) − blend(p)), which is lower in the convex tail.
   - The as-built cause map ties both causes to this clearance (l.151), so a failed clearance leaves everything open.
   - Re-cut: the primary items are exact sums by year. The attribution is secondary and validated.
2. **A known positive the split cannot see.** Item 3's line is at its own expected value (HELD 0.34), and it uses the attributed AA, which REST can absorb. Re-cut: take it on the exact GB, with the line at half the lift.
3. **A spread too wide for any affordable path count.** The as-built ratio has a weak correlation with GB (0.53 at the record), and the derivation never models a smaller spread. The year ratio does not have this problem: its correlation is 0.80-0.92, and its standard error is about 0.01 at 4,000 paths.
4. **A quadrature verdict the data cannot give.** T's standard error is about a point a world at 2,000 paths, so a 1-point quadrature row is out of reach. Re-cut: record QF.
5. **No saved tables.** Any INCONCLUSIVE outcome, or any later term, costs another 3.2-hour dense solve.
6. **A remainder outside the bridge grid,** sitting in the selection-inflated quadrature or after access. Item 1 is then INCONCLUSIVE by design unless a "not the bridge grid" row exists (R4).
7. **A late window that mixes in resolved years.** As built, "late" is years 3-6, but year 3 is at about 1.5 dense cells. Year 7 had its own residual entirely in REST at the record (−2.7 points in worlds 0 and 1, at 4 points).
8. **An under-costed budget.** The ledger is about twice the derivation's figure, which compounds the trigger-3 exposure.
9. **One household, one seed.** The ledger can say where S360's remainder lives. It cannot say that the same cause carries S224's no-bridge under-read (UR); NE-AXIS stays that family's own step.

## 6. Constraints respected

- No product default changes. The ledger is an audit, and the adaptive reference and any new axis are research options.
- Every option is inert and bit-identical when off, behind the golden tests and the smoke run.
- One tuning seed, 7002, with the held-out seed untouched.
- Every item has three outcomes, and each test is registered before launch.
- The run is over 2 h, with an else row of about 0.3 (about 0.45 if R3 is dropped), under the 0.6 bar.

## Sources

Found by this search:
- Iskhakov, Jørgensen, Rust and Schjerning (2017), Quantitative Economics 8(2), 317-365: [Econometric Society](https://econometricsociety.org/publications/quantitative-economics/2017/07/01/The-endogenous-grid-method-for-discretecontinuous-dynamic-choice-models-with-or-without-taste-shocks); [IDEAS](https://ideas.repec.org/a/wly/quante/v8y2017i2p317-365.html)
- Druedahl and Jørgensen (2017), JEDC 74, 87-107: [IDEAS](https://ideas.repec.org:443/a/eee/dyncon/v74y2017icp87-107.html); [working paper](https://www.economics.ku.dk/research/publications/wp/dp_2016/1609.pdf)
- Druedahl (2021), Computational Economics 58(3): [IDEAS](https://ideas.repec.org/a/kap/compec/v58y2021i3d10.1007_s10614-020-10045-x.html)
- Dobrescu and Shanker, FUES: [CEPAR](https://www.cepar.edu.au/publication/fast-upper-envelope-scan-method-discrete-continuous-dynamic-programming); [WP 2023/04](https://www.cepar.edu.au/sites/default/files/CEPAR_WORKING_PAPER_2023%3A04_fues_egm_v14.pdf)
- Fella (2014), Review of Economic Dynamics: [IDEAS](https://ideas.repec.org/a/red/issued/11-275.html)
- Carroll (2006), Economics Letters 91(3): [NBER technical working paper](https://nber.org/system/files/working_papers/t0309/t0309.pdf); [SolvingMicroDSOPs](https://www.econ2.jhu.edu/people/ccarroll/SolvingMicroDSOPs/SolvingMicroDSOPs.html)
- Ludwig and Schön (2018), Computational Economics 51(3): [SAFE](https://safe-frankfurt.de/de/publikationen/working-papers/details/publicationname/endogenous-grids-in-higher-dimensions-delaunay-interpolation-and-hybrid-methods.html)
- Brumm and Scheidegger (2017), Econometrica 85(5): [Econometric Society](https://econometricsociety.org/publications/econometrica/browse/2017/09/01/using-adaptive-sparse-grids-solve-high-dimensional-dynamic); [IDEAS](https://ideas.repec.org/a/wly/emetrp/v85y2017ip1575-1612.html)
- Grüne and Semmler (2004), JEDC 28(12): [PDF](https://epub.uni-bayreuth.de/5508/1/gruene_jedc_2004.pdf)
- Judd, Maliar, Maliar and Valero (2014), JEDC 44: [PDF](https://lmaliar.ws.gc.cuny.edu/files/2019/01/JEDC2014_JMMV.pdf)
- Judd and Solnick (1994): [PDF](https://web.stanford.edu/%7ejudd/papers/dpshape.pdf)
- Cai and Judd (2013), Mathematical Methods of Operations Research 77(3): [Springer](https://link.springer.com/doi/10.1007/s00186-012-0406-5)
- Keane and Wolpin (1994), Review of Economics and Statistics 76(4): [Minneapolis Fed](https://minneapolisfed.org/research/staff-reports/the-solution-and-estimation-of-discrete-choice-dynamic-programming-models-by-simulation-and-interpolation-monte-carlo-evidence)
- Santos and Vigo-Aguiar (1998), Econometrica 66(2): [IDEAS](https://ideas.repec.org/a/ecm/emetrp/v66y1998i2p409-426.html)
- den Haan (2010), JEDC 34(1): [UvA](https://dare.uva.nl/id/4b33838c-e944-43a5-b8cc-733fbab6b3f4)
- Powell, approximate dynamic programming and post-decision states: [Castle Lab](https://castle.princeton.edu/Papers/EORMS-ADP_Algorithms_Dec72009.pdf)
- Bertsekas, rollout survey: [MIT](https://www.mit.edu/~dimitrib/Rollouts_Survey.pdf)
- Browne (1999), Advances in Applied Probability 31(2), 551-577: [Cambridge](https://www.cambridge.org/core/journals/advances-in-applied-probability/article/abs/reaching-goals-by-a-deadline-digital-options-and-continuoustime-active-portfolio-management/73CD9DEE7FCCD733988A72AFCE62573A)
- Young (2004), North American Actuarial Journal 8(4): [IDEAS](https://ideas.repec.org/a/taf/uaajxx/v8y2004i4p106-126.html)
- Bayraktar and Young (2007): [arXiv](https://arxiv.org/pdf/math/0703850)
- Milevsky and Robinson (2000), North American Actuarial Journal 4(4): [IDEAS](https://ideas.repec.org/a/taf/uaajxx/v4y2000i4p112-124.html)
- Huang, Milevsky and Wang (2004), Insurance: Mathematics and Economics 34(3): [record](https://documentacion.fundacionmapfre.org/documentacion/publico/es/bib/85684.do)
- Das, Ostrov, Radhakrishnan and Srivastav (2020), Computational Management Science 17: [PDF](https://webpages.scu.edu/ftp/dostrov/publications/CMS.pdf); [IDEAS](https://ideas.repec.org/a/spr/comgts/v17y2020i4d10.1007_s10287-019-00351-7.html)

Cited from memory, not located in this search: Dubins and Savage (1965), *How to Gamble If You Must*; Sutton (1988), "Learning to predict by the methods of temporal differences", Machine Learning 3; Bertsekas and Tsitsiklis (1996), *Neuro-Dynamic Programming*; Powell (2011), *Approximate Dynamic Programming*, 2nd edition.
