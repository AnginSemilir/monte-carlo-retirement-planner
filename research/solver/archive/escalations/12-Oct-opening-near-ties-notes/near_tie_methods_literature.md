# Choosing among near-tied openings in an approximate DP: a posteriori bounds, remedies, defaults and communication

> **Labels:** [L] literature (cited inline); [D] my derivation; [J] my judgement. S126/S360 figures are from the escalation brief and recomputed here.
>
> **Ranked bottom line** [J]:
> 1. Judge openings by Q^π, the value of the actual forward chooser simulated from each opening on common random numbers (CRN), not by the table gap. The tables price a continuation the chooser does not follow (free switching; per-world choices), so a small table gap does not bound the realised loss (§1, §2).
> 2. Default to the plan's tier, and switch only when a paired rollout shows the alternative better by a margin with confidence (status quo plus a one-sided test). This gives a probabilistic no-harm guarantee against today's product, with no new solve (§3, §4).
> 3. 8,000 pairs resolve about 0.15 to 0.54 percentage points (pp). That catches S360 and S126-scale harms (z of about −22 and +6), but 1e-4 to 1e-3 gaps need about 40k to 47M pairs, so declare them near-ties (§3).
> 4. Second line:
>    - **Smoothing** removes argmax flips, but it is a new product action and biases values (§6).
>    - **Minimax regret over grids** needs a solve per variant, which gate 5 forbids at runtime (§7).
>    - **Sup-norm a posteriori bounds** are computable but too loose at a 40-year horizon (§1).
> 5. Say "equivalent" only when an equivalence test passes; otherwise say "can't tell". Use fixed-denominator frequencies and test comprehension (Consumer Duty) (§8).

## 1. A posteriori bounds: which are computable here, and how to measure the tables' resolution

### Takeaway
Greedy-loss bounds become computable through off-grid Bellman residuals. Over 40 years, though, they add up to far more than 1e-3, and they bound loss only against the tables' own model. The usable resolution measures are empirical:
- table versus simulated forward-chooser value, per opening;
- the grid-to-grid spread of the year-0 gap;
- local residuals along paths.

Information-relaxation dual bounds work as an offline audit.

### Cited Findings
- [L] Singh & Yee (1994, Machine Learning 16:227–233) — [PDF](https://www.cis.upenn.edu/~mkearns/teaching/cis620/papers/SinghYee.pdf):
  - If |V* − Ṽ| ≤ ε, the policy greedy on Ṽ loses at most 2γε/(1−γ); the same holds for Q.
  - Since ε needs V*, they use the computable bound ε ≤ ψ/(1−γ), with ψ the maximum one-step backup residual (Porteus).
  - They credit Bertsekas (1987).
- [L] Williams & Baird (1993, NU-CCS-93-14) give a *tight* bound on the greedy policy's sub-optimality from the max-norm Bellman residual (state value minus the one-step lookahead along the seemingly best action); there is a Q-version — [abstract](https://mailman.srv.cs.cmu.edu/pipermail/connectionists/1993-November/015233.html).
- [L] Performance-difference lemma (Kakade & Langford 2002, ICML — [listing](https://mlanthology.org/icml/2002/kakade2002icml-approximately/)): V^{π̃}(s0) − V^π(s0) = E_{τ∼π̃}[Σ_t γ^t A^π(s_t,a_t)], by telescoping. Statement as in [MIT 6.7950 notes](https://web.mit.edu/6.7950/www/recitations/R8-2022fa.pdf); I could not read the original.
- [L] Santos & Vigo-Aguiar (1998, Econometrica 66(2):409–426): in discretised DP, the computed value function converges quadratically in the mesh size. A second quantity converges linearly; the text was garbled, and it is probably the policy — [IDEAS](https://ideas.repec.org/a/ecm/emetrp/v66y1998i2p409-426.html).
- [L] Santos (1998, UC3M WP 98-48): value error O(ε²) and policy error O(ε) in the Euler residual ε. The bounds use only observable data but are "usually very conservative" — [PDF](https://e-archivo.uc3m.es/bitstream/10016/4157/1/we984817.pdf).
- [L] Stachurski (2008, Computational Economics 31(2):141–160) gives error bounds for policies from fitted value iteration with nonexpansive approximators — [IDEAS](https://ideas.repec.org/a/kap/compec/v31y2008i2p141-160.html).
- [L] Brown, Smith & Sun (2010, Operations Research) — [PDF](https://jimsmith.host.dartmouth.edu/wp-content/uploads/2022/04/Information_Relaxations_and_Duality_in_Stochastic_Dynamic_Programs.pdf):
  - Relax non-anticipativity and penalise using future information. Any dual-feasible penalty gives an upper bound.
  - Strong duality: "there is always a dual feasible penalty that yields no gap", namely the one built from the true value function. Penalties from an approximate value function are the practical choice.
  - A heuristic's simulated value plus the dual bound certifies its gap.
  - Under perfect information, each path needs one deterministic inner problem. Inventory heuristics came within 2%.
- [L] Haugh, Kogan & Wang (2006, Operations Research 54(3):405–418) build an upper bound from the portfolio policy being evaluated. If it is close to the policy's utility, the policy's loss is guaranteed small; constraints are allowed — [IDEAS](https://ideas.repec.org/a/inm/oropre/v54y2006i3p405-418.html).
- [L] Brown & Smith (2011, Management Science 57(10):1752–1770) study portfolio choice *with transaction costs*. Simple heuristics, checked against dual bounds, are often "very close to the upper bound" — [IDEAS](https://ideas.repec.org/a/inm/ormnsc/v57y2011i10p1752-1770.html).

### Inferences
- [D] **Finite horizon.** With ε_t = sup|Q̂_t − Q*_t|, each year's greedy sacrifice is at most 2ε_t, so by the performance-difference lemma the total loss ≤ 2Σ_t ε_t.
- [D] **Residual bound.** At grid nodes the residual is zero by construction. Off the grid, r_t = sup_s|V̂_t(s) − (TV̂_{t+1})(s)| is the backup's interpolation error, computable at test points (cell midpoints, simulated states).
  - T is a sup-norm non-expansion, so ||V̂_t − V*_t|| ≤ Σ_{k≥t} r_k and loss ≤ 2Σ_tΣ_{k>t} r_k.
  - A uniform residual r over 40 years gives about 1,560·r, so certifying 1e-3 needs r ≈ 6e-7. **Sup-norm bounds cannot resolve these gaps on a 30-point grid.**
  - Sampled test points make this an estimate, not a proof. It also holds only for the 5-node quadrature model.
- [D] **What these bounds compare against.** All of them bound loss against the optimum of the model the tables solve (free switching, and per-world choices in the product). They do not bound the forward chooser with its margin.
- [D] **A test of table accuracy along held paths.** If the stored values were the true optimal Q-values of the problem the forward run simulates, a chooser that is greedy apart from its margin would lose less than 0.001 per held year: at most 0.04 over a ≤40-year plan.
  - S360's de-risked opening (the table's choice) loses 497 and saves 9 of 8,000 paths: −6.1 pp, SE 0.27 pp, 95% bound −5.6 pp.
  - That exceeds the ceiling, if the whole score tracks survival. So the tables are materially wrong along held paths, and this is not Monte Carlo noise.
- [D] **Per-world tables are an upper bound.** If the stored values are per-world optima averaged with weights 1/6, 2/3 and 1/6, they are a "wait-and-see" relaxation, Σ_w p_w max ≥ max Σ_w p_w: an upper bound without the Brown–Smith–Sun penalty. The excess differs by action, so it biases the opening gap. This fits the brief's finding that removing per-world choice recovers 21 of 25 lost paths.
- [J] **Resolution measures, most useful first:**
  1. **Per-opening table-versus-rollout bias.** Δ_a = Q̂(s0,a) − Q̂^π_sim(s0,a); the action-dependent part |Δ_a − Δ_b|, with its CRN confidence interval, is the product's real resolution.
  2. **Grid-family spread of the year-0 gap.** Across 30x5, 60x5, 30x15 and 40 points; the brief's −14% and +28% moves and its flips are this measure.
  3. **Local off-grid residuals** at s0 and along paths.
  4. **Per-opening dual bound, offline.** With the solver's own continuation values as the penalty, each path's inner problem is a deterministic 40-stage DP on the grid.
- [J] Do not Richardson-extrapolate. Tier kinks (§6) break the smooth quadratic order, so use the spread.

### Gaps
- Bertsekas & Tsitsiklis (1996) ([listing](https://cs.utexas.edu/~shivaram/readings/b2hd-BertsekasTsitsiklis1996.html)) and Rust's (1996) handbook chapter ([IDEAS](https://ideas.repec.org/h/eee/hecchp/1-14.html)) were not read (paywalled); the form of Stachurski's bound was not seen.
- I found no dual-bound work with survival-indicator payoffs.

## 2. The action gap: wrong-choice frequency, its cost, and whether a small gap guarantees a small loss

### Takeaway
Against the *optimal* continuation, yes: a wrong greedy choice needs an error of at least half the gap and costs at most the gap. But when the chooser holds a tier the tables assumed it could leave, a tiny table gap can hide a large loss. S360 shows this: +0.33 points in the tables, −6.1 pp realised.

### Cited Findings
- [L] Farahmand (2011, NeurIPS 24) — [paper](https://papers.nips.cc/paper_files/paper/2011/file/013d407166ec4fa56eb1e1f8cbe183b9-Paper.pdf):
  - The action gap is g(x) = |Q*(x,1) − Q*(x,2)|.
  - If P(0 < g ≤ t) ≤ c·t^ζ, the greedy loss is O(||Q̂ − Q*||^{1+ζ}); ζ = 0 means no assumption.
  - A wrong choice needs an error of at least gap/2 and costs at most the gap. When the gap is negligible, "the performance loss of not choosing the optimal action is small as well".
  - Proved for two actions, discounted only.
- [L] Bellemare et al. (arXiv 1512.04860, the AAAI-16 paper) give gap-increasing, optimality-preserving operators. A larger gap "mitigates the undesirable effects of approximation and estimation errors on the induced greedy policies"; the operators also apply to discretised continuous problems — [arXiv](https://arxiv.org/abs/1512.04860).

### Inferences
- [D] **K actions.** If |Q̂ − Q*| ≤ ε, then Q*(a*) − Q*(â) ≤ 2ε, and a wrong pick needs a true gap of at most 2ε.
- [D] **Frequency and cost.** With table-gap noise of scale ρ, P(wrong) ≈ Φ(−g/ρ): 16% at g = ρ, 31% at g = ρ/2, 50% as g → 0. The expected Q*-loss is at most 0.17ρ. So openings are coin-flips, but cheap ones *if* the continuation were optimal.
- [D] **When the guarantee breaks.** With a margin only in the forward pass, the opening fixes which tier is held. The realised difference Q^π(s0,a) − Q^π(s0,b) adds up decades of deviation from the table-greedy policy. The gap theory protects only if:
  1. both passes use the same switching rule, as the candidate's charge in both passes does; and
  2. the tables embed no choices the chooser cannot make (per-world).
- [J] Report g/ρ, and treat g/ρ < 2 as unresolved.

### Gaps
- I found no finite-horizon or multi-action version of Farahmand's result, and no study of wrong-choice frequency in interpolated-grid DP.

## 3. Rollout re-ranking on CRN, ranking and selection, and the optimizer's curse

### Takeaway
Re-ranking the top 2–3 openings by simulating the actual forward chooser from each (a one-step rollout at the root) needs no new solve. It improves the opening exactly if the values are exact. Under noise, wrap it in a selection rule: keep the plan's tier unless a paired CRN comparison shows the alternative better with confidence. 8,000 pairs resolve about 0.15 to 0.54 pp: enough for S360 or S126-scale harms, not for gaps of 1e-4 to 1e-3.

### Cited Findings
- [L] The rollout policy "is guaranteed to improve the performance of the base policy" (deterministic setting, under sequential consistency). "Fortified" rollout keeps the best known path unless a better one is found, so it is never worse than the base. Formalised by Bertsekas, Tsitsiklis & Wu (1997, J. Heuristics 3:245–262) — [Bertsekas survey](https://www.mit.edu/~dimitrib/Rollouts_Survey.pdf).
- [L] Rollout is "a single policy iteration", evaluated "by on-line simulation", and applies to stochastic and finite-horizon problems. The slides are silent on noise and CRN — [Bertsekas 2024 lecture](https://web.mit.edu/dimitrib/www/RLTopics_2024_Lect5.pdf).
- [L] Tesauro & Galperin (NIPS 9, 1997): Monte Carlo rollouts of a base policy cut backgammon error rates "by as much as a factor of 5 or more" — [NeurIPS](https://proceedings.neurips.cc/paper/1996/hash/996009f2374006606f4c0b0fda878af1-Abstract.html).
- [L] Nelson & Matejcik (1995, Management Science 41(12):1935–1945) use CRN to cut sample sizes for indifference-zone selection with multiple comparisons. One procedure is Bonferroni-conservative; the other is exact under a specific dependence structure — [IDEAS](https://ideas.repec.org/a/inm/ormnsc/v41y1995i12p1935-1945.html).
- [L] KN procedure (Kim & Nelson 2001, ACM TOMACS 11(3):251–273; [listing](https://www.cs.utexas.edu/~shivaram/readings/b2hd-KimNelson2001.html)), as described by [Tsai & Nelson 2008](https://transportation.tech.northwestern.edu/docs/research/core-topics/logistics-and-supply-chain-management/Nelson_FullySequentialSelection.pdf):
  - fully sequential; allows unknown, unequal variances and CRN;
  - eliminates through a triangular continuation region set by δ, h² and n0;
  - probability of correct selection ≥ 1−α if the best exceeds the second by δ;
  - far fewer samples than two-stage procedures (89 against 158 per system in one example).
- [L] Eckman & Henderson (2018) — [paper](https://eckman.engr.tamu.edu/wp-content/uploads/sites/233/2020/01/PGS-overview-paper.pdf):
  - A correct-selection guarantee in the preference zone says nothing inside the indifference zone. A procedure meeting it can pick a good system with probability near 0 when the top two tie.
  - KN's published proofs of a "good selection" guarantee (within δ of the best) are incorrect.
  - Rinott-type and Nelson–Matejcik CRN procedures (under shift invariance) do give it.
  - Systems that survive a search tend to sit inside the indifference zone.
- [L] Bayesian alternatives:
  - Chick & Inoue (2001, Operations Research 49(5):732–743) minimise expected opportunity cost with unknown variances and compare favourably with indifference-zone procedures — [IDEAS](https://ideas.repec.org/a/inm/oropre/v49y2001i5p732-743.html).
  - Branke, Chick & Schmidt (2007, Management Science 53(12):1916–1932): the most efficient procedures use a Bayesian model with adaptive stopping — [IDEAS](https://ideas.repec.org/a/inm/ormnsc/v53y2007i12p1916-1932.html).
  - OCBA (Chen, Lin, Yücesan & Chick 2000, DEDS 10:251–270) puts more budget on "critical" alternatives — [OCBA page](https://mason.gmu.edu/~cchen9/ocba.html).
- [L] Optimizer's curse (Smith & Winkler 2006, Management Science 52(3):311–322) — [PDF](https://www.gwern.net/doc/statistics/decision/2006-smith.pdf):
  - Picking the highest of several unbiased estimates gives expected disappointment: 85% of the estimates' standard deviation for 3 alternatives, 154% for 10. It is worst when true values are close.
  - Positive correlation among estimates reduces it.
  - Bayesian shrinkage removes it on average, and can change the choice.
- [L] McNemar sample sizes use the Connor (1987) or Miettinen (1968) approximations on the discordant proportions — [SAS PROC POWER](https://support.sas.com/documentation/cdl/en/statug/63962/HTML/default/statug_power_sect009.htm).
- [L] L'Ecuyer, Simard, Chen & Kelton (2002, Operations Research 50(6):1073–1075): random-number streams and substreams "facilitate synchronization for variance-reduction purposes" — [abstract](https://academicnewsletter.sufe.edu.cn/info/385031).

### Inferences
- [D] **Root-only guarantee.** Let π be the product's forward chooser, margin and node snaps included. Choosing the a that maximises Q^π(s0,a), over candidates that include π's own opening, gives V ≥ V^π(s0) exactly. No consistency condition is needed, because only year 0 changes. Q^π must come from simulating that same chooser.
- [D] **Fortified rule.** Let b be the plan's tier. Switch to a only if the one-sided (1−α) lower confidence bound on Q^π(a) − Q^π(b) exceeds δ ≥ 0, with Holm correction over the K−1 alternatives.
  - Then P(worse than b) ≤ α.
  - When b is kept, the loss is at most δ plus the CI half-width.
  - This mirrors the project's held / falsified / inconclusive tests.
- [D] **Resolution.** Var(p̂_a − p̂_b) ≈ (ψ − Δ²)/N, where ψ is the discordance rate.
  - S360: ψ = 6.3%, Δ = −6.1 pp, SE 0.27 pp, z ≈ −22.
  - S126: 40/0 gives +0.50 pp (z ≈ 6.3); 47/0 gives +0.59 pp (z ≈ 6.9).
  - 95% half-width at N = 8,000: 0.15, 0.22, 0.31 and 0.54 pp at ψ = 0.5%, 1%, 2% and 6%.
- [D] **Pairs needed** (Connor approximation, two-sided 5%, 80% power):

  | Gap Δ | ψ = 0.5% | ψ = 1% | ψ = 2% | ψ = 6% |
  |---|---|---|---|---|
  | 1e-3 | 39k | 78k | 157k | 471k |
  | 5e-4 | 157k | 314k | 628k | 1.9M |
  | 1e-4 | 3.9M | 7.8M | 15.7M | 47M |

  Simulation can certify "small" or flag "large", but it cannot rank true near-ties.
- [D] **Determinism.** Fixed seeds, with one substream per path, give identical returns in every arm and a bit-reproducible choice.
  - But the estimate is a step function of the inputs, as paths cross the end pot one at a time. So the rule is still non-smooth (it does not cure brief item 4); it moves the knife edge to the confidence threshold.
  - Hysteresis on the test limits flip-flopping: switch only if the lower bound exceeds δ, and revert only if the upper bound falls below 0.
- [D] **Reporting.** Selecting and reporting on the same paths inflates the reported survival. CRN shrinks this (Smith & Winkler); report from an independent seed.
- [J] **Sampling.** Stratify paths by world at 1/6, 2/3 and 1/6 to remove world-mix noise.
- [J] **Cost.** K × N × 40 path-years per household, with K = 2–3. No solve, so it sits outside gate 5's budget but adds runtime.
- [J] **Failure modes.**
  - Rollout fixes the opening only relative to the chooser it simulates. If the holds or per-world tables are the problem, it only partly compensates.
  - Calibrate δ and α on held-out seeds.
  - Indifference-zone guarantees are silent exactly at near-ties, so report "near-tie" when the CI straddles ±δ.

### Gaps
- I found no source on how Monte Carlo noise weakens rollout guarantees in stochastic DP.
- Not fetched: the Kim & Nelson (2006) handbook chapter, Bechhofer (1954), and Chen et al. (2000).

## 4. Status-quo default, inertia under ambiguity and lexicographic tie-breaking

### Takeaway
Decision theory supports keeping the status quo unless an alternative wins under every admissible model (Bewley; Ortoleva). Lexicographic preferences with slack formalise "survival first within a tolerance, then a secondary rule". Most users adopt defaults and read them as advice. So the default should be the defensible option: the user's own tier, unless an alternative is robustly better.

### Cited Findings
- [L] Bewley (2002 [Cowles DP 807, 1986], Decisions in Economics and Finance 25:79–110): with a set Π of priors, x beats y only if it does so under every prior; otherwise they are incomparable. Inertia: "There is a status quo with which he stays unless an alternative is preferred"; a program changes "only if the new program dominates the old one" — [PDF](https://faculty.econ.ucdavis.edu/faculty/nehring/teaching/econ203/readings/bewley-knightian-decision-theory.pdf).
- [L] Ortoleva (2010, Games and Economic Behavior 69(2):411–424): the agent leaves the status quo only if an alternative is better under all priors in a set, and a status quo raises uncertainty aversion — [IDEAS](https://ideas.repec.org/a/eee/gamebe/v69y2010i2p411-424.html). The comparison model is Gilboa & Schmeidler's (1989) maxmin expected utility — [IDEAS](https://ideas.repec.org/p/hal/journl/hal-00753237.html).
- [L] Wray, Zilberstein & Mouaddib (2015, AAAI-29): lexicographic MDPs with conditional preferences "with slack" — [AAAI](https://ojs.aaai.org/index.php/AAAI/article/view/9647).
- [L] Samuelson & Zeckhauser (1988, Journal of Risk and Uncertainty 1:7–59): people disproportionately keep the status quo, in experiments and in faculty health and retirement plan choices — [IDEAS](https://ideas.repec.org/a/kap/jrisku/v1y1988i1p7-59.html).
- [L] Madrian & Shea (2001, QJE 116(4):1149–1187) — [NBER](https://www.nber.org/papers/w7682); [PDF](https://www.nber.org/papers/w7682.pdf):
  - participation 86% under auto-enrolment against 37% before;
  - 71% of auto-enrolled participants kept both the default rate and the default fund;
  - attributed to inertia and to reading the default as advice.
- [L] McKenzie, Liersch & Finkelstein (2006, Psychological Science 17(5)): people "perceive the default as indicating the recommended course of action" — [APS](https://www.psychologicalscience.org/journals/psychological-science/j.1467-9280.2006.01721.x/).
- [L] FCA PS19/21: drawdown consumers should "only invest mainly in cash if they take an active decision to do so" — [FCA](https://www.fca.org.uk/publications/policy-statements/ps19-21-retirement-outcomes-review-feedback-cp19-5). The 2023 review cites earlier "path of least resistance" behaviour and providers "defaulting" consumers into cash — [FCA PIR](https://www.fca.org.uk/publications/multi-firm-reviews/investment-pathways-post-implementation-review).

### Inferences
- [D] **Unanimity rule.** Treat the model variants (grids, seeds, blend method) as Bewley's priors: leave the plan's tier only if the alternative wins by at least δ under every variant. This fails safe under resolution noise. Grid variants are offline only (gate 5); seed and rollout variants are cheap.
- [D] **Lexicographic rule.** Rank by score first, and within δ of the best choose the plan's tier. With δ ≥ the resolution ρ, the loss is at most δ + ρ in the units the gap is measured in.
- [J] **Why default to the plan's tier:**
  1. It is the user's own choice.
  2. Because defaults stick and read as advice, a model-driven de-risk on a near-tie would move most users on noise.
  3. Near-tie openings lose badly in both directions (S360, S126).
  4. The FCA treats unchosen drift into cash as a harm risk.
- [J] **Failure mode.** The tables under-price the bad world's de-risk (brief item 6: about 0.6 of its realised gain), so a pure status-quo rule leans toward staying risky. The rollout test (§3) corrects this, because it measures realised value.

### Gaps
- I found no literature on default risk levels in digital retirement tools. Gilboa–Schmeidler and the definition of slack in Wray et al. were not read in full.

## 5. Action elimination: a principled near-tie set

### Takeaway
If each opening's value is bracketed, openings that cannot be optimal can be eliminated; the rest form the near-tie set. Sup-norm table bounds leave almost every opening in. Rollout confidence intervals or dual bounds can make the set informative.

### Cited Findings
- [L] MacQueen (1967, Operations Research 15(3):559–561): upper and lower bounds on the optimal return identify suboptimal actions, which are removed permanently. Built into DP, it cut computation by at least 75% — [IDEAS](https://ideas.repec.org/a/inm/oropre/v15y1967i3p559-561.html).
- [L] Puterman & Shin (1982, Operations Research 30(2):301–318) give action elimination for (modified) policy iteration — [IDEAS](https://ideas.repec.org/a/inm/oropre/v30y1982i2p301-318.html). Textbook: Puterman (1994) — [listing](https://www.ellibs.com/book/9780470317723/markov-decision-processes-discrete-stochastic-dynamic-programming).
- [L] Even-Dar, Mannor & Mansour (2006, JMLR 7:1079–1105) eliminate actions using confidence intervals on Q, with stopping conditions for approximate optimality with high probability; about O((n/ε²) log(1/δ)) samples find an ε-optimal arm — [JMLR](https://jmlr.org/papers/v7/evendar06a.html).
- [L] Fard & Pineau (2011, JAIR 40): "non-deterministic policies" offer a set of actions whose worst-case value is at least (1−ε)V* everywhere, so any user pick stays near optimal; the motivation is medical choice among near-equivalent treatments — [arXiv](https://arxiv.org/abs/1401.3871). Tang et al. (2020, ICML, PMLR 119:9387–9396) give set-valued policies capturing "near-equivalent actions" for human-in-the-loop choice — [PMLR](https://proceedings.mlr.press/v119/tang20c.html).

### Inferences
- [D] **Near-tie set.** N = {a : U(a) ≥ max_b L(b)}. Brackets can come from:
  1. the table ± the residual bound (too wide);
  2. simultaneous rollout confidence intervals on Q^π, with CRN and Holm (practical);
  3. a dual upper bound U(a), which certifies that a is suboptimal for *any* non-anticipative policy.
- [D] Brackets on Q* and on Q^π answer different questions; for the shipping product, Q^π is the one that matters.
- [J] When N has more than one member, hand it to the default rule (§4) and the user message (§8). Fard & Pineau's ε-guarantee is the formal basis for "any of these is within ε".

### Gaps
- Puterman (1994) §6.7 was not checked directly.

## 6. Smoothing and regularising the choice

### Takeaway
Logit (entropy-regularised) choice makes choice probabilities smooth in the values, and so continuous in the inputs. It also smooths discrete-choice kinks in value functions. The cost is a bias of at most σ·log K per stage. A deterministic version requires a blended allocation, which is a new product action. Interpolation kinks and nearest-node snaps remain.

### Cited Findings
- [L] Iskhakov, Jørgensen, Rust & Schjerning (2017, Quantitative Economics 8(2):317–365): discrete choices "can lead to kinks in the value functions and discontinuities in the optimal policy rules". Extreme-value taste shocks act, in numerical work, as noise that smooths the kinks. Tested on a life-cycle model with discrete retirement — [Econometric Society](https://econometricsociety.org/publications/quantitative-economics/2017/07/01/The-endogenous-grid-method-for-discretecontinuous-dynamic-choice-models-with-or-without-taste-shocks); [IDEAS](https://ideas.repec.org/a/wly/quante/v8y2017i2p317-365.html).
- [L] Rust (1987, Econometrica 55(5)) is the origin of logit dynamic discrete choice — [Econometric Society](https://www.econometricsociety.org/publications/econometrica/1987/09/01/optimal-replacement-gmc-bus-engines-empirical-model-harold) (not fetched).
- [L] Geist, Scherrer & Pietquin (2019, ICML) give a theory of regularised MDPs (entropy, KL) via regularised Bellman operators and the Legendre–Fenchel transform, with error propagation — [arXiv](https://arxiv.org/abs/1901.11275).

### Inferences
- [D] **Bias bound.** The soft backup is V^σ_t = σ log Σ_a exp(Q^σ_t/σ). Since max ≤ log-sum-exp ≤ max + σ log K:
  - V*_t ≤ V^σ_t ≤ V*_t + (T−t)σ log K;
  - the soft policy loses at most Tσ log K;
  - worst cases at K = 9 and T = 40 are 8.8e-3 at σ = 1e-4 and 8.8e-2 at σ = 1e-3;
  - the realised bias concentrates at near-ties, so it is much smaller.
- [D] **Logit shares.** For gap/σ of 1, 2 and 3, the better action gets 73%, 88% and 95%. With σ at the resolution, near-ties give about 50/50 blends.
- [D] **Continuity.** Softmax is smooth and Q̂ is continuous (piecewise-linear interpolation), so choice probabilities are continuous in the inputs and argmax flips vanish. Interpolation kinks and node snaps remain: smoothing fixes only the argmax part of brief item 4.
- [D/J] **Deterministic options:**
  - **(a) Blend.** Weight each tier by its logit probability; adjacent tiers give an intermediate equity share. Continuous, but its value is not the weighted average of the tier values, and survival is not concave in risk, so rollout-test it. It is a new product action, and under a switch charge it needs bands to avoid yearly rebalancing.
  - **(b) Seeded randomisation.** Reproducible but discontinuous, so no benefit.
  - **(c) Smooth the backward pass only** (Iskhakov et al.). Fewer kinks in the tables, at a bias of at most Tσ log K; the forward choice still flips.

### Gaps
- Geist et al.'s exact bias statement and Iskhakov et al.'s σ → 0 results were not read; the bound above is my derivation.

## 7. Minimax regret and robust choice across model variants (no learning)

### Takeaway
Minimax regret across grids gives an opening robust to discretisation artefacts. But it costs a solve per variant, it is menu-dependent, and across return worlds it changes the objective. Rectangular robust MDPs let "nature" re-pick the world every year, which is too pessimistic for a persistent world. Use these offline, or as a tie-breaker inside the near-tie set.

### Cited Findings
- [L] Minimax regret "was originally introduced by Savage's (1951) reading of Wald (1950)". Stoye (2009, J. Econometrics) finds minimax-regret rules often randomise at ties, and that minimax regret "is menu dependent" — [preprint](https://stoye.economics.cornell.edu/docs/stoye-joe2009-pre.pdf).
- [L] Manski (2004, Econometrica 72(4):1221–1246) judges treatment rules by maximum regret — [IDEAS](https://ideas.repec.org/a/ecm/emetrp/v72y2004i4p1221-1246.html).
- [L] Regan & Boutilier (2009, UAI) compute minimax-regret MDP policies under reward uncertainty — [PMLR](https://proceedings.mlr.press/r7/regan09a.html).
- [L] Iyengar (2005, Mathematics of Operations Research 30:257–280): robust DP needs a "rectangularity property" and is equivalent to a zero-sum game — [abstract](https://academicnewsletter.sufe.edu.cn/info/401298). Nilim & El Ghaoui (2005, Operations Research 53(5):780–798): optimal policies "may be very sensitive" to transition probabilities; robust DP comes at "practically no extra computing cost", finite sets of matrices included — [IDEAS](https://ideas.repec.org/a/inm/oropre/v53y2005i5p780-798.html).
- [L] Steimle, Kaufman & Denton (2021, IISE Transactions 53(10):1124–1139): multi-model MDPs choose one policy maximising weighted performance across models; the problem is NP-hard — [IDEAS](https://ideas.repec.org/a/taf/uiiexx/v53y2021i10p1124-1139.html).

### Inferences
- [D] **Across grids.** R_m(a) = max_b Q_m(s0,b) − Q_m(s0,a); pick the a with the smallest max_m R_m(a).
  - Example: one opening wins by 8e-4 on 30x5 but loses by 5e-4 on 60x5; the other never loses by more than 3e-4. Minimax regret picks the second.
  - A 60-point solve already exceeds gate 5, so this is offline only.
- [J] **Across worlds, without learning.** The candidate's "joint worlds" is already a weighted multi-model MDP. Minimax regret over worlds would drop the 1/6, 2/3, 1/6 weights and tilt toward protecting the poor world. That is a new objective, not a tie-breaker, so use it only inside the near-tie set.
- [J] **Rectangular robust DP** lets the world change every year, which is too pessimistic and alters the whole policy.
- [J] **Menu dependence.** Adding a tier option can flip the 0/0 versus 2/2 pick, so fix the menu before testing.

### Gaps
- Xu & Mannor (2009) was not found, Savage (1951) is cited through Stoye, and the dynamic consistency of regret was not researched.

## 8. Communicating near-ties to users

### Takeaway
People handle numeric uncertainty with little loss of trust; verbal hedges cost more. Good practice:
- fixed-denominator frequencies;
- explicit comparisons;
- humility about the model's limits;
- user testing.

The Consumer Duty requires communication that enables "effective, timely and properly informed decisions", is balanced on risks and benefits, and is tested. Say "equivalent" only when an equivalence test passes.

### Cited Findings
- [L] Spiegelhalter, Pearson & Short (2011, Science 333:1393–1400) — [PDF](https://www.stat.berkeley.edu/users/aldous/157/Papers/spiegelhalter_visualizing.pdf):
  - "Use multiple formats".
  - Use fixed-denominator frequencies and show both framings.
  - Make comparisons explicit.
  - Assume low numeracy.
  - Avoid false precision: "the more attractive a depiction is made, the more people may believe it represents the whole truth".
  - For deeper uncertainty, use "a language of caution and humility".
  - "assess the needs of the audience, experiment, and test".
- [L] van der Bles et al. (2019, Royal Society Open Science 6:181870) — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC6549952):
  - Separates direct from indirect uncertainty (evidence quality) and lists nine levels of expression, from a full distribution to denial.
  - Verbal terms vary: the IPCC's "very likely" was read as about 65–75%.
  - "stating uncertainty does not necessarily undermine trust".
- [L] van der Bles et al. (2020, PNAS 117) ran five experiments (n = 5,780, including a BBC field test). Uncertainty lowered trust only slightly, "mostly for verbal uncertainty communication" — [Cambridge repository](https://www.repository.cam.ac.uk/handle/1810/304699).
- [L] FCA FG22/5 (July 2022) — [FG22/5](https://fca.org.uk/publication/finalised-guidance/fg22-5.pdf):
  - "effective, timely and properly informed decisions" (1.9);
  - present information "in an even-handed way that properly explains the benefits and risks" (5.13);
  - "testing communications where appropriate" (5.34).
- [L] FCA consumer-understanding good practice (March 2026) — [FCA](https://www.fca.org.uk/publications/good-and-poor-practice/consumer-understanding-good-practice-areas-improvement):
  - "give risks equal prominence to benefits";
  - layered information and "positive friction";
  - test before and after changes (one firm targets at least 80% correct recall);
  - an absence of complaints is not proof of clarity.
- [L] Investment pathways review: several reports from providers' independent governance committees asked for "more specific information on risk", and variation in how risk is explained "could affect take-up and consumer understanding" — [PIR](https://www.fca.org.uk/publications/multi-firm-reviews/investment-pathways-post-implementation-review).
- [L] Targeted support (PS25/22, from April 2026): "ready-made suggestions" for consumer segments, between guidance and advice. Separate pension-projection proposals would let consumers adjust risk levels in simulations, under the Duty — [HSF Kramer](https://www.hsfkramer.com/notes/pensions/2025-posts/fca-pushes-ahead-with-targeted-support).
- [L] Equivalence (two one-sided tests, TOST): declare equivalence when the 90% CI lies inside pre-set bounds — [Lakens, APS Observer 2017](https://www.psychologicalscience.org/observer/equivalence-testing-with-toster).

### Inferences
- [J] **Three message states, driven by the paired rollout, not the table gap:**
  1. **Clear.** The CI excludes ±δ: give the recommendation and the size of the difference.
  2. **Equivalent.** The 90% CI lies inside ±δ: "These two risk levels give the same result within the model's precision: about 912 in 1,000 similar plans last to the end with either. We have kept your chosen level."
  3. **Inconclusive.** "The model cannot reliably tell these apart. We have kept your chosen level." Do not call this a tie.
- [J] **Presentation:**
  - Use per-1,000 figures rounded to the resolution, never 0.1 pp.
  - Show both framings, plus what else differs: the typical end pot, the bad-markets end pot, and volatility.
  - Give risks equal prominence, and test recall before launch.
- [J] Prefer numbers to verbal ties. Say that the kept level is the user's own choice, since defaults read as advice. The set-valued framing (§5) leaves volatility comfort, which the model does not see, to the user.

### Gaps
- I found no study on communicating near-equivalent risk levels in retirement tools.
- FG22/5 chapter 8 was not extracted (the fetch stopped at paragraph 5.44).
