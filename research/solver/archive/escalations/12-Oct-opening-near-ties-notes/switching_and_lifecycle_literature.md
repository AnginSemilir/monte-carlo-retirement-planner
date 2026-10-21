# Switching costs, hysteresis and sticky risk choices: literature for the opening-tier near-tie

Searched 15:46-16:10 BST, 12 Oct 2026. Labels: **[Lit]** a published result, with author, year, venue and source; **[Derived]** my own derivation; **[Judgement]** my own judgement. Brief items refer to research/solver/escalations/12-Oct-opening-near-ties.md. Pages I could not read:
- Ly Vath & Pham's arXiv full text (HTTP 429, rate limited);
- the Rogers (2004) PDF on phildybvig.com and the Bayraktar & Young page on ar5iv (permission prompts went unanswered);
- the SIAM page for Brekke & Øksendal (robots.txt).

## 1. Consistent switching cost versus naive execution margin: which is right, and what does the naive approach cost? (question b)

### Takeaway
The theory puts the friction inside the Bellman equation. The values for each regime then satisfy V_i ≥ V_j − c_ij, so being in the wrong regime never costs more than one switch. The product does something else: it solves tables as if switching were free and applies a margin only when the forward chooser runs. That is the "one-step" heuristic of Brown & Smith (2011), and they show it "trade[s] too little" because it counts a trade's benefit for only one period. Heuristics that scale the cost by how long a position persists, or that optimise with the cost over a horizon, come within about 0.1 to 0.3 points of certainty-equivalent return of an upper bound. Ignoring costs altogether costs 0.8% to 16.9% of wealth (Balduzzi & Lynch 1999).

### Cited Findings
- **[Lit] The optimal-switching inequality.** Optimal-switching value functions solve obstacle (quasi-variational) systems with the operator ℳv(x,i) = max_{j≠i}(v(x,j) − H(x,i,j)). Switching out of regime i is optimal exactly where v(x,i) = v(x,j) − H(x,i,j); elsewhere v(x,i) is larger. Hence v_i ≥ max_j(v_j − H_ij) everywhere. Source: Bayraktar & Egami (2010), Mathematics of Operations Research, DOI 10.1287/moor.1090.0432, Sec. 2.3 eqs 2.36-2.37 and Sec. 2.4 eq. 2.42 — [ar5iv](https://ar5iv.arxiv.org/html/0707.0100).
- **[Lit] The finite-horizon, multi-regime version.** The obstacle system contains min{φ_i − max_{j≠i}(φ_j − ℓ_ij), …} = 0, which implies φ_i ≥ max_{j≠i}(φ_j − ℓ_ij). Source: Djehiche, Hamadène & Popier, "A finite horizon optimal multiple switching problem", arXiv 0707.2663 (published version not checked here) — [ar5iv](https://ar5iv.labs.arxiv.org/html/0707.2663).
- **[Lit] Why a positive round-trip cost creates a no-switch region.** Bayraktar & Egami assume the round-trip cost H(x,0,1) + H(x,1,0) > 0 (eq. 2.5) and use it to show that the two switching regions are disjoint (Remark 2.3). Their continuation regions "do not necessarily have to be connected" (Sec. 1) — [ar5iv](https://ar5iv.arxiv.org/html/0707.0100).
- **[Lit] Brown & Smith (2011), Management Science (DOI 10.1287/mnsc.1110.1377), Sec. 3, compare four heuristics:**
  - *cost-blind:* follow the frictionless policy;
  - *one-step:* use "the value function from the frictionless model as an approximate continuation value" and charge costs only in the current period;
  - *modified one-step:* divide the costs by min(6, periods left), because "the benefit of adjusting the asset positions lasts approximately six months";
  - *rolling buy-and-hold:* optimise with costs over a horizon h.

  [PDF](https://jimsmith.host.dartmouth.edu/wp-content/uploads/2022/04/Dynamic_Portfolio_Optimization_with_Transaction_Costs.pdf)
- **[Lit] Brown & Smith's results.**
  - "We would expect these one-step strategies to trade too little because they underestimate the benefits of moving toward the optimal position without transaction costs" (Sec. 3.2).
  - The modified one-step and rolling heuristics "consistently outperform the cost-blind strategy and the (unmodified) one-step strategy" (Table 2).
  - In Table 2's first row (γ = 10), the unmodified one-step strategy earns about 5.98% certainty-equivalent annual return, against about 6.57% for the modified one-step and an upper bound of about 6.73%. These figures are approximate because the extraction lost decimal points.
  - The best heuristic's gap to the dual bound is 0.09% to 0.29% (average 0.19%) with 3 assets, and averages 0.14% with 10 assets. Gaps are in points of annualised certainty-equivalent return.
  - Cost-blind strategies "perform substantially worse". The authors conclude there is "relatively little room for improvement".

  [PDF](https://jimsmith.host.dartmouth.edu/wp-content/uploads/2022/04/Dynamic_Portfolio_Optimization_with_Transaction_Costs.pdf); [abstract](https://optimization-online.org/2010/08/2703/)
- **[Lit] Balduzzi & Lynch (1999), JFE 52(1):47-78.** Ignoring realistic fixed and proportional transaction costs costs 0.8% to 16.9% of wealth. Transaction costs always increase the utility cost of myopia — [abstract](https://academicnewsletter.sufe.edu.cn/info/357992); [IDEAS](https://ideas.repec.org/a/eee/jfinec/v52y1999i1p47-78.html).
- **[Lit] Gârleanu & Pedersen (2013), JF 68(6):2309-2340.**
  - The optimal policy is to "aim in front of the target" and "trade partially towards the current aim". The aim is a weighted average of the current Markowitz portfolio and the expected future ones.
  - Table II (commodity futures), net Sharpe ratios: frictionless Markowitz −9.84 (0.83 gross); optimal dynamic 0.58; best static strategy (partial trading toward the current Markowitz portfolio) about 0.46.
  - The authors report a net Sharpe ratio "about 20% better than that of the best strategy among all the static strategies". The static portfolio "does not account for the future benefits of the position".

  [NBER w15205](https://www.nber.org/papers/w15205); [accepted manuscript](https://research-api.cbs.dk/ws/portalfiles/portal/60191441/lasse_heje_pedersen_et_al_dynamic_trading_acceptedmanuscript.pdf)
- **[Lit] Constantinides (1986), JPE 94(4):842-862.** Investors accommodate large transaction costs by "drastically reducing the frequency and volume of trade". Costs have only a second-order effect on liquidity premia because derived utility is nearly flat around the optimal proportions. A single-period model of any one period length does not reproduce this — [IDEAS](https://ideas.repec.org/a/ucp/jpolec/v94y1986i4p842-62.html).
- **[Lit] Finite horizons change the policy.**
  - Liu & Loewenstein (2002), RFS 15(3):805-835: the policy is "horizon dependent" and "largely buy and hold". It "might be optimal ... not to buy any stock, even when the risk premium is positive" — [IDEAS](https://ideas.repec.org/a/oup/rfinst/v15y2002i3p805-835.html).
  - Lynch & Balduzzi (2000), Journal of Finance (venue from memory): no-trade regions widen as the investor nears the terminal date, and realistic costs barely move the region's midpoint — [NYU archive](https://archive.nyu.edu/handle/2451/27003).

### Inferences
- **[Derived] Why the product's margin produces decade-long holds.**
  - The forward chooser switches only if Q⁰_j − Q⁰_i > m = 0.001, where Q⁰ uses frictionless continuation values.
  - Q⁰ assumes free re-optimisation from next year, so Q⁰_j − Q⁰_i measures about one year's exposure difference. The margin is a lump cost set against a one-year flow of benefit.
  - A wrong tier is therefore held while each year's one-year gain stays below m, and the cumulative loss can be many multiples of m.
  - This is Brown & Smith's under-trading, in discrete form. It fits the brief's figures: 0.03 to 0.04 switches per 40-year path, and the forward run holding where its nearest stored cell leaves on 21% of held path-years against 6% the other way (item 5).
- **[Derived] What the consistent candidate (tier state, cost c in both passes) guarantees.**
  - At every state and year, |V_0 − V_2| ≤ c for start-of-year values.
  - The year-0 openings compare Q_j = E[V_j(next state under tier j)], so Q_0 − Q_2 = [E V_0(X′_0) − E V_0(X′_2)] + E[V_0 − V_2](X′_2). That is one year's exposure effect plus a term within ±c.
  - So a wrong opening costs at most one year of exposure plus one switch, not decades of hold.
- **[Derived] Switching rules compared.**
  - The consistent rule switches when (one-year effect) > c − E[V_0 − V_2]. When the target tier will stay preferred, V_2 ≈ V_0 − c, and the hurdle falls to about zero: the cost is paid once and its benefit lasts.
  - The naive rule needs a one-year effect above m every time. It is therefore much stickier exactly when the optimal tier differs persistently.
- **[Derived] A realised paired difference far above one year's effect plus c is a diagnostic.** S360's figures (497 lost, 9 saved of 8,000) give a net −6.1 points of survival, with a paired standard error of √506/8000 ≈ 0.28 points, so about 22 standard errors. A consistent, accurately solved model cannot produce that from an opening alone. It points to the hold, or to error in the tables.
- **[Judgement] The mechanism also fits brief item 6.** Tables that price a de-risk as one year of exposure will under-price a de-risk that is then held. Here the tables price it at 0.6 of the realised gain, and removing the hold (margin 0) raises that to 0.74. This is consistent with the mechanism, not a test of it.
- **[Judgement] The literature's cheap repair, if frictionless tables are kept,** is Brown & Smith's: scale the margin by the expected holding period, or make the hurdle depend on the horizon. Liu & Loewenstein and Lynch & Balduzzi show the band should widen near the end. A margin held constant for 40 years matches neither.

### Gaps
- I found no paper testing frictionless tables plus an execution margin on discrete risk tiers in a decumulation model. Brown & Smith (continuous holdings, proportional costs, 12 to 48 periods) is the closest analogue.
- The published magnitudes are in certainty-equivalent return points, percent of wealth or Sharpe ratios. None is in survival probability.
- I could not read Ly Vath & Pham (2007, SIAM) or check the volume and page numbers of Brekke & Øksendal (1994, SIAM J. Control Optim., DOI 10.1137/S0363012992229835) or Hamadène & Jeanblanc (2007, Math. Oper. Res., DOI 10.1287/moor.1060.0228).

## 2. Is near-indifference near the optimum real, and how costly is a wrong pick? (question a)

### Takeaway
Flatness near the optimum is real and generic:
- utility losses are second order in the deviation;
- mean-variance proxies nearly reach the expected-utility optimum;
- the best deterministic glide path barely beats a constant mix.

A survival objective adds two further flat zones, near-doomed and funded. Forsyth (2022) meets exactly this: at high wealth "the control only weakly effects the objective function". He resolves it with an explicit ε = 10⁻⁶ tie-break that left summary statistics unchanged to four digits. A wrong pick between adjacent tiers costs little per year if it can be revised. The harm grows with how long it is held.

### Cited Findings
- **[Lit] Akerlof & Yellen (1985), QJE 100(Supplement):823-838.** "The individual loss to agents with inertial price-wage behavior is second-order in terms of the parameter ... while the effect on real economic variables is first-order" — [IDEAS](https://ideas.repec.org/a/oup/qjecon/v100y1985isupplementp823-838..html).
- **[Lit] Dixit (1991), RES 58(1):141-151.** Hysteresis is important "even for small irreversibility". In the menu-cost model it is about two orders of magnitude larger than under the Akerlof-Yellen or Mankiw assumptions — [IDEAS](https://ideas.repec.org/a/oup/restud/v58y1991i1p141-151..html).
- **[Lit] Mean-variance choice is nearly optimal.** Levy & Markowitz (1979) found that an expected-utility maximiser who knows only means and variances "can typically do very well". Kroll, Levy & Markowitz (1984), JF 39(1):47-61, ask the same question over the whole set of feasible portfolios; their numbers were not retrieved — [HUJI abstract](https://cris.huji.ac.il/en/publications/meanvariance-versus-direct-utility-maximization/). Simaan (2014), EJOR 234(2):382-391, reports in-sample results that "agree with earlier studies" that mean-variance choice comes very close to expected-utility optimality — [IDEAS](https://ideas.repec.org/a/eee/ejores/v234y2014i2p382-391.html).
- **[Lit] Forsyth & Vetzal (2019), Applied Mathematical Finance 26(1):1-37.**
  - The optimal deterministic glide path gives "only a very slight improvement" over a constant proportion; its standard deviation is about 0.98 times the constant-proportion value.
  - For a lump sum with continuous rebalancing, no glide path beats constant proportion on mean-variance grounds (Prop. 3.1).
  - Adaptive, wealth-dependent strategies "significantly outperform": median about 776 against about 630, and P(W_T < 500) about 0.12 against about 0.27 (Table 6.4).

  [PDF](https://cs.uwaterloo.ca/~paforsyt/adaptive_vs_det.pdf); [IDEAS](https://ideas.repec.org/a/taf/apmtfi/v26y2019i1p1-37.html)
- **[Lit] Forsyth (2022), NAAJ 26(2):227-251, Sec. 7.1.3.**
  - The problem is ill-posed where "the control only weakly effects the objective function", at high wealth near the horizon.
  - The fix adds ε·W_T with ε = +10⁻⁶, "forcing the strategy to invest in stocks when Wt is very large".
  - It "gave the same results as ε = 0 for the summary statistics, to four digits" and gave "more smooth heat maps".

  [arXiv 2008.06598](https://www.arxiv.org/pdf/2008.06598)
- **[Lit] Lifecycle fund welfare.**
  - Gomes, Kotlikoff & Viceira (2008), AER 98(2):297-303: life-cycle funds matched to risk tolerance and horizon have "small welfare costs"; mismatched choices can have "substantial welfare costs" — [NBER w13966](https://nber.org/papers/w13966).
  - Duarte, Fonseca, Goodman & Parker (2021, NBER w29559): moving to optimal, heterogeneous portfolios gains up to 3.5% to 3.7% of average consumption — [NBER](https://www.nber.org/papers/w29559).

### Inferences
- **[Derived] Arithmetic of a discrete menu.**
  - With CRRA utility and lognormal returns, the certainty-equivalent loss from holding risky share w instead of w* is about (γσ²/2)(w − w*)² a year (Merton's quadratic approximation).
  - For adjacent tiers a and b, Δ apart with midpoint m, the yearly gap is L(b) − L(a) = γσ²Δ(m − w*). It is zero when the optimum sits midway and linear in the optimum's distance from the midpoint. The best tier loses at most (γσ²/2)(Δ/2)² a year.
  - Illustration with γ = 4, σ = 16% and Δ = 0.2: the best tier loses at most about 5 bp a year. The wrong neighbour loses up to about 20 bp a year when the optimum sits on a tier.
  - So a year-0 gap near zero means "optimum near the midpoint", and either pick costs about the same per year.
- **[Derived] Flat zones of a survival objective.**
  - Near-doomed: survival is about 0 under every tier. Funded: about 1 under every sustainable tier.
  - In both zones the tie is real and is decided by the small terms (estate 0.01 to 0.02, raise credit, cut aversion). The planner's estate weight plays the role of Forsyth's ε·W_T, at about 10⁴ times its size.
  - Only at-the-money households have first-order stakes in the tier.
- **[Derived] Telling a real flat objective from an artefact cheaply.**
  - If flatness is real, the paired Monte Carlo difference between two openings, each followed by the same consistent policy, is also small: within one year's effect plus c.
  - If it is an artefact, that difference has a definite sign that disagrees with the tables.
  - Resolution: with 8,000 paths the paired standard error is √(saved + lost)/8000, about 0.28 points at 500 discordant paths and about 0.05 points at 16. Gaps of order 0.1 points are resolvable only when few paths are discordant.
- **[Judgement] Hold duration sets the cost of a wrong pick,** not the size of the year-0 gap. Product: up to decades in the wrong tier. Consistent model: one year plus at most c.

### Gaps
- I could not retrieve the exact expected-utility shortfalls in Kroll, Levy & Markowitz (paywalled).
- I found no paper quantifying the flatness of survival-probability objectives across discrete tiers. The two flat zones are derived.

## 3. The band of inaction: its width, how far regime values can differ inside it, and chattering at zero cost

### Takeaway
Switching costs create a band in which inaction is optimal. For small costs the band is much wider than the cost itself:
- In diffusion models its width scales with the cube root of the cost. I derive this here; it matches the ε^(1/3) no-trade region in transaction-cost theory, which is in the literature.
- The loss against a frictionless policy is of order ε^(2/3).
- Inside the band, the two regimes' values differ by at most the switching cost.
- At zero cost the band collapses to a point and switches are unbounded (chattering). This matches the brief's margin-0 run: about 10 switches a path, half reversed within three years.

### Cited Findings
- **[Lit] Dixit (1989), JPE 97(3):620-638.** The entry trigger is above variable cost plus interest on the entry cost; the exit trigger is below variable cost minus interest on the exit cost. The gap is hysteresis, "significant even with small sunk costs" — [IDEAS (WP version)](https://ideas.repec.org/p/fth/prinec/91.html).
- **[Lit] The band widens with variance.** "As shown in Dixit (1989a) and Dixit and Pindyck (1994, pp. 213–229), the claim value and the width of the hysteresis zone are increasing in the variance" (Martzoukos 2001, RQFA 16:251-267) — [PDF](https://ucyweb.ucy.ac.cy/hermes/documents/goto/hermes/01-24Hysteresis.pdf).
- **[Lit] Transaction-cost asymptotics.**
  - Deviation from the target exposure is of order ε^(1/3), and no-trade regions typically scale with ε^(1/3) (Shreve & Soner 1994, Appendix B).
  - The cost's effect on the objective is "second order", about ε^(2/3) (Rogers 2004; Gerhold et al.; Kallsen & Muhle-Karbe).
  - Source: Mayerhofer (2024), arXiv 2407.07100, Secs 1 and 4 — [arXiv](https://arxiv.org/pdf/2407.07100).
  - Janeček & Shreve (2004), Finance & Stochastics 8(2):181-206, expand the value function in powers of λ^(1/3) — [IDEAS](https://ideas.repec.org/a/spr/finsto/v8y2004i2p181-206.html).
- **[Lit] Holden & Holden (2011), "Optimal Rebalancing of Portfolios with Transaction Costs".**
  - With proportional costs, rebalance to the band boundary. With flat costs, rebalance to an interior point, "never a full rebalance".
  - Band size depends on "the importance of the transaction costs relative to" staying near the optimum, and "depends heavily on the properties of the stochastic processes".

  [NR note](https://publ.nr.no/publications.nr.no/1503320049/rebalance-HLHolde-2013.pdf)

### Inferences
- **[Derived] The cube-root law.**
  - Set-up: two regimes whose flow payoff difference is a(x − x*) near the frictionless switch point x*; state volatility σ; cost c each way; discounting and drift ignored locally.
  - G = V₁ − V₀ satisfies (σ²/2)G″ = −a(x − x*), with value matching G(x* ± b) = ±c and smooth pasting G′(x* ± b) = 0.
  - This gives (4a/3σ²)b³ = 2c, so the band half-width is b = (3σ²c/2a)^(1/3), and |G| ≤ c inside the band.
  - Consequence: cutting c 1,000-fold narrows the band only 10-fold.
- **[Derived] Frequency and loss.** Switches occur about σ²/b² times per unit time, which scales as c^(−2/3). The loss against frictionless is of order c^(2/3), the same as the transaction-cost law.
- **[Derived] Chattering at zero cost.** At c = 0 the band is the single point x*. Brownian paths re-cross a level infinitely often immediately after hitting it, so switches are unbounded. In annual time with noisy tables, the expected outcome is frequent switches that reverse, which is the brief's margin-0 result.
- **[Judgement] Treat c as a regulariser, not a real fee.** It buys stability at a bounded price: at most c in value per decision, and of order c^(2/3) overall. The consistent model's band at c = 0.001 can be wide in wealth terms, but its holds are optimal and their cost is bounded by c. The product's holds are not of this kind (section 1).

### Gaps
- No accessible page confirmed that Dixit (1991, RES) states the cube-root law, so the scaling above is my derivation, supported by the ε^(1/3) transaction-cost result.
- I could not read the primary texts of Davis & Norman (1990), Shreve & Soner (1994) or Rogers (2004); their results are cited through Mayerhofer.
- I found no primary quotation on chattering at zero cost. The Brekke & Øksendal, Hamadène & Jeanblanc and Carmona & Ludkovski abstracts were not retrieved.

## 4. Predictions: a near-doomed versus a funded household's opening tier, and a de-risked opening held for decades (brief item 7)

### Takeaway
Goal-reaching theory says a household below its target should take risk and one above it should lock in. A survival objective is flat at both extremes. The decumulation glide-path literature mostly says de-risking around retirement pays only if risk is restored later: the rising glide path, or Kitces's "bond tent". Estrada's historical study across 19 countries disagrees. A de-risked opening that a margin then holds for decades gives up the re-risk leg and becomes a static low-equity path. Pfau & Kitces's grid ranks that worse than a rising path, at a cost to the estate and to late-life survival.

### Cited Findings
- **[Lit] Browne (1999), Advances in Applied Probability 31(2):551-577.** Maximising the probability of reaching a goal by a deadline is equivalent to "simply buying a European digital option". In the single-stock case the policy does not depend on the drift — [Cambridge](https://www.cambridge.org/core/journals/advances-in-applied-probability/article/abs/reaching-goals-by-a-deadline-digital-options-and-continuoustime-active-portfolio-management/73CD9DEE7FCCD733988A72AFCE62573A).
- **[Lit] Young (2004), NAAJ 8(4):106-126,** derives the risky amount at each wealth level that minimises the probability of lifetime ruin. I did not retrieve the shape of the rule — [IDEAS](https://ideas.repec.org/a/taf/uaajxx/v8y2004i4p106-126.html).
- **[Lit] Funded versus behind in Forsyth & Vetzal (2019).** Once wealth exceeds the path needed to reach the target, the surplus goes to bonds (Sec. 4.2, eqs 4.12-4.13). Behind target, the quadratic-shortfall strategy keeps a substantial equity share — [PDF](https://cs.uwaterloo.ca/~paforsyt/adaptive_vs_det.pdf).
- **[Lit] Forsyth (2022) on constant weights.**
  - Constant-weight strategies (equity 0.0 to 0.8, withdrawals of 40) give expected shortfall from −288.6 to −630.6, and "none ... meets our criteria of an ES > −$200,000" (Sec. 10, Table 10.1) — [arXiv](https://www.arxiv.org/pdf/2008.06598).
  - In his slides, Bengen's 4% rule on 50/50 gives ES ≈ −$300K against ≈ −$17K for the optimal strategy (bootstrap). The optimal strategy's withdrawals vary and average about $51K, so the comparison is not like for like — [slides](https://cs.uwaterloo.ca/%7Epaforsyt/Forsyth_CAIMS_June16_2022.pdf).
- **[Lit] Forsyth, Vetzal & Westmacott (2019), NAAJ 23(3):447-468.** In bootstrap tests on 91 years of data, target-based approaches "appear to be superior to strategies that directly attempt to minimize risk measures" — [IDEAS](https://ideas.repec.org/a/taf/uaajxx/v23y2019i3p447-468.html).
- **[Lit] Pfau & Kitces (2014), Journal of Financial Planning 27(1):38-45.**
  - They test 121 glide paths.
  - The best success rates come from starts of 20% to 40% equity rising to 60% to 80%; the single best is 30% rising to 80%.
  - 30% rising to 60% beats a static 60%, and a declining 60% to 30% does worse.
  - Static allocations "generally fare worse" than conservative rising paths.
  - The lifetime optimum looks "more like the letter U".

  [FPA](https://www.financialplanningassociation.org/article/journal/JAN14-reducing-retirement-risk-rising-equity-glide-path)
- **[Lit] Kitces, "bond tent" (blog, undated).** A V-shaped equity glidepath, with a "retirement red zone" running from the final decade before retirement into the first half of retirement — [Kitces](https://www.kitces.com/blog/managing-portfolio-size-effect-with-bond-tent-in-retirement-red-zone/).
- **[Lit] Contradicted by Estrada** (SSRN 2015; published in the Journal of Investing in 2016, venue from memory). With data from 19 countries over 1900-2009, 4% withdrawals and 30-year retirements, declining equity paths generally had lower failure rates and higher terminal wealth than rising ones. Static 60/40 and 100% stocks were "simple and very effective" — [CXO Advisory summary (secondary)](https://cxoadvisory.com/equity-premium/global-stocks-bonds-glidepath-during-retirement).

### Inferences
- **[Derived] Predictions by funding level under a survival objective.**
  - *Near-doomed:* risk raises the chance of escape (the convex part of a digital payoff), so de-risking is the wrong sign. Gaps are small in absolute terms because survival is small, so expect near-ties. Expect openings in the plan's tier, or one riskier.
  - *Funded:* survival is flat across sustainable tiers. The estate term decides and favours risk, as Forsyth's ε > 0 forces stocks. A de-risk there is chosen by noise or by cut aversion.
  - *At the money:* the optimum depends on wealth, and true near-ties occur where the optimum crosses the midpoint between tiers.
  - Brief item 9 fits a threshold objective: 47% to 67% of lost paths end just under the end pot.
- **[Derived] Item 7.** A de-risked opening is worth something only together with the option to re-risk later (bond tent, rising path). A margin that blocks the re-risk turns it into a static low-equity path. Both Pfau & Kitces's grid and Forsyth's constant-weight table show such paths doing badly over 30-year horizons. Predicted cost: a lower estate and more late-life shortfall. A consistent model either re-risks when the lifetime gain exceeds c, or does not open de-risked.
- **[Judgement] The literature does not settle whether early de-risking is optimal at all.** Pfau & Kitces (simulated) say yes; Estrada (historical) says no. Do not import a bond-tent prior; let the consistent model price the re-risk.

### Gaps
- The retrieved text does not describe how Forsyth's (2022) optimal allocation varies with wealth and time.
- I did not retrieve the shape of Young's (2004) policy.
- Pfau & Kitces's numerical failure rates are in image tables I could not read.

## 5. How published lifecycle and decumulation models handle discrete, sticky or rarely revised risk choices (question c)

### Takeaway
- **Free yearly re-optimisation:** mainstream lifecycle models and Forsyth's decumulation models re-optimise the risky share each year, on a discretised allocation grid, with no switching friction.
- **Stickiness inside the optimisation:** where models include it, it comes from costs inside the Bellman equation: one-time entry or per-period participation costs, transaction costs, and information costs.
- **Glide paths:** these are pre-committed schedules, and the best of them barely beat a constant mix.
- **Household data:** strong inertia; most people never change their allocation.
- **Practice:** rebalancing uses bands optimised with the cost, and trades to the band edge.

### Cited Findings
- **[Lit] Cocco, Gomes & Maenhout (2005), RFS 18(2):491-533.** Ignoring labour income has "large utility costs"; ignoring only its risk costs about an order of magnitude less — [IDEAS](https://ideas.repec.org/a/oup/rfinst/v18y2005i2p491-533.html). Survey: Gomes (2020), Annual Review of Financial Economics 12:277-304 — [IDEAS](https://ideas.repec.org/a/anr/refeco/v12y2020p277-304.html).
- **[Lit] Participation costs.**
  - Gomes & Michaelides (2005; JF venue from memory) combine Epstein-Zin preferences, a fixed stock-market entry cost and moderate heterogeneity in risk aversion. Marginal stockholders are more risk averse — [LSE](https://researchonline.lse.ac.uk/id/eprint/5361).
  - Vissing-Jørgensen (2002, NBER WP 8884): "a per period stock market participation cost of just 50 dollars" explains the choices of half of non-participants. Fixed costs imply "structural state dependence" in participation — [NBER](https://www.nber.org/papers/w8884).
- **[Lit] Abel, Eberly & Panageas (2013), Econometrica 81(4):1455-1481.**
  - With both information and transaction costs, the optimal policy is generally state-dependent.
  - If the fixed transaction cost is small enough, a time-dependent rule emerges with probability 1, with constant intervals between observations.
  - If it is large, the policy stays state-dependent indefinitely.

  [Econometric Society](https://econometricsociety.org/publications/econometrica/2013/07/01/optimal-inattention-stock-market-information-costs-and). Their earlier paper is AER 97(2):244-249 (2007) — [LSE](https://researchonline.lse.ac.uk/id/eprint/44491).
- **[Lit] Household inertia.**
  - Calvet, Campbell & Sodini (2009), QJE 124(1):301-348: households offset about half of idiosyncratic passive changes in the risky share, and about one sixth for directly held assets — [NBER](https://www.nber.org/papers/w14177).
  - Brunnermeier & Nagel (2008), AER 98(3):713-736: the risky share "is not affected by wealth changes"; households "rebalance only very slowly" — [IDEAS](https://ideas.repec.org/a/aea/aecrev/v98y2008i3p713-36.html).
  - Bilias, Georgarakos & Haliassos (2010), JMCB 42(4):715-742: "considerable portfolio inertia"; downturns encouraged "staying out, rather than getting out" — [IDEAS](https://ideas.repec.org/p/cpr/ceprdp/7239.html).
- **[Lit] Rarely revised allocations.**
  - Ameriks & Zeldes (2004 draft), TIAA-CREF over ten years: 47% made no change to flow allocations, 73% no change to asset allocations, and 44% no change at all — [PDF](https://business.columbia.edu/sites/default/files-efs/pubfiles/16/Ameriks_Zeldes_age_Sept_2004d.pdf).
  - Mitchell et al. (2006): 80% of 401(k) participants made no trades in two years, and 11% made one — [MRDRC](https://mrdrc.isr.umich.edu/publication/the-inattentive-participant-portfolio-trading-behavior-in-401k-plans-2/).
  - Agnew, Balduzzi & Sundén (2003), AER 93(1):193-215: "inertia in asset allocations" — [IDEAS](https://ideas.repec.org/a/aea/aecrev/v93y2003i1p193-215.html).
- **[Lit] How decumulation optimal control is discretised.**
  - Forsyth (2022): controls on an equally spaced grid with exhaustive search; p ∈ [0,1] with no shorting or leverage; yearly rebalancing; withdrawal controls "quasi-bang-bang" — [arXiv](https://www.arxiv.org/pdf/2008.06598).
  - Forsyth & Vetzal (2019): "infrequent rebalancing does not reduce efficiency to a large degree" — [PDF](https://cs.uwaterloo.ca/~paforsyt/adaptive_vs_det.pdf).
- **[Lit] Rebalancing practice.**
  - Sun et al. (2006), JPM 32(2):33-43: dynamic programming beats monthly, quarterly, annual and 5%-band rebalancing — [MSR](https://microsoft.com/en-us/research/?p=808408).
  - Holden & Holden: Donohue & Yip (2003) report typical cost savings of 50%; optimal rebalancing cuts costs to a quarter of monthly — [NR](https://publ.nr.no/publications.nr.no/1503320049/rebalance-HLHolde-2013.pdf).
  - NBIM (2018): a 6-point band cuts costs about 60%; trading to the band edge saves about 1 bp against trading back to target — [NBIM](https://www.nbim.no/contentassets/8cb41f89dce345f5a6a295238f7872fb/no-trade-band-rebalancing-rules-expected-returns-and-transaction-costs.pdf).

### Inferences
- **[Judgement] No model I found holds a discrete risk tier by an execution margin.** The models that represent persistent risk choices put the friction in the value function. Their policies are bands that widen with the horizon, not permanent holds. The research candidate (tier state, charge in both passes) is the standard form.
- **[Judgement] Inertia describes behaviour; it does not show that holding is optimal.** Abel, Eberly & Panageas and the participation-cost models explain it with costs inside the optimisation. If users revise rarely, model that explicitly (a tier state with a cost, or a fixed review interval) rather than with a margin.
- **[Derived] Forsyth's set-up mirrors the planner's:** a discretised control set, exhaustive search, annual rebalancing. He breaks ties in flat regions with an explicit tiny regulariser, not a margin.

### Gaps
- I did not retrieve the primary texts of Masters (2003) or Donohue & Yip (2003); they are summarised here via Holden & Holden and NBIM.
- I did not retrieve the inattention-interval lengths in Abel, Eberly & Panageas (2007).
- I found no decumulation paper that models sticky discrete tiers with a switching cost.
