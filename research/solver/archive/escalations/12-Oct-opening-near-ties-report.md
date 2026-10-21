<!-- FALLBACK report on escalations/12-Oct-opening-near-ties.md. What ran: an agent at the model family the maintainer
named (12 Oct, the session; not written here: no pushed file names a model), maximum effort, read-only repository access
and web search rather than a deep-research mode, the serving model unconfirmed; launched by the one-hour check-in of
12 Oct 16:17 UK, the maintainer having not answered. Saved verbatim from the agent's hand-back below this comment.
Outside evidence, grade C until a registered test repeats it (escalation.md). Checked by Claude before any use, 12 Oct:
- M1 (the product's part-year first year): CONFIRMED in the code - fast.js grow() multiplies year 0's return by
  yr.frac[0] = ctx.yf (fast.js:197, 641-642), the app's valuationDate defaults to today (App.jsx:439, 1126), and the
  research households are valued on 1 January (policy-study/scenarios.mjs:166). The solver's own backward pass at
  year 0 NOT CHECKED; the toy's sizes NOT CHECKED.
- The brief's error 1 (S126's 8.0e-4 is the reader arm's, the shipping read's gap 9.9930e-3): CONFIRMED,
  results-7v.txt l.78-79. The brief's other errors (its section 2.3) NOT CHECKED one by one; the brief stands as
  written, its errors recorded here.
- Everything else, including the literature citations and the proposed test OPEN-SWAP: NOT CHECKED; nothing acted on.
-->

# Outside review: the opening tier decided by near-ties (fallback run)

**Provenance.** This is the fallback run under research/solver/escalation.md. It had read-only access to the repository and used web search, not a deep-research mode. No solver, audit, batch or test was run, and no file was written. One self-contained toy dynamic programme was computed inline (node -e, importing nothing from the solver) to check three mechanism claims. Its outputs are tagged [derived: toy], and its magnitudes do not transfer to the solver.

Tags used: [record: file] for the project's own files; [derived] for my own argument or arithmetic; [literature]; [judgement].

---

## 1. Ranked summary

1. **Real or artefact?**
   - For the shipping product, the near-tie is real for the question its tables answer: this year's tier, with the future still free to switch.
   - It is an artefact for the decision the margin carries out, which is a lifetime hold.
   - For the candidate it is probably real and harmless, but this has not been measured across all three worlds.
2. **RC1, credence 0.38.** The opening is priced as one year's deviation and carried out as a hold of decades. Asked the lifetime question instead, the same kind of tables price the choice at 0.8 to 3.4 points, with the sign that is realised, wherever the reads are sound (results-7x.txt).
3. **RC2, credence 0.32.** The reads are systematically wrong at the survival cliffs. This makes gaps flat or gives them the wrong sign, and it carries the largest harms (share 0.95, S360). The main parts:
   - the shipping tables are 28 to 97 points wrong on 14 of 25 households;
   - the bridge step falls between quadrature nodes;
   - the end pot sits within one wealth cell;
   - the space the survival read is done in biases the tier difference.
4. **RC3, credence 0.12.** The world weights are fixed. The gap nets a bad-world gain weighted 1/6, which is priced about a quarter low even under the charge, against small terms of the opposite sign.
5. **RC4, credence 0.10.** Grid-phase aliasing and argmax kinks decide knife edges (O67, O47).
6. **RC5, credence 0.08.** Genuine plateaus, where survival is clamped and the estate is capped, so exact ties go to menu order.
7. **Missed by the record.** The product's first year is a part-year:
   - its valuation date defaults to today, and year-0 variance is pro-rated by yf², where yf is the fraction of the year left;
   - in the toy this removes or reverses the year-0 de-risk for valuations after about April;
   - every research household is valued on 1 January.
8. **Decisive test (OPEN-SWAP).** On the seven households, run each arm's own chooser forward from both openings on common paths. RC1 is confirmed if:
   - the candidate's knife-edge openings differ by less than the materiality margin; and
   - the shipping product's sub-margin openings differ materially.
   Cost: 14 solves and about 10 core-hours, plus up to 21 solves only if the candidate fails.
9. **Product now.**
   - Below a stated resolution, keep the plan's tier.
   - Label the choice a near-tie and show both openings' simulated outcomes.
   - Adopt a paired-rollout rule only after the test's item 4 and a confirmation on a fresh seed.

---

## 2. Mechanisms the record has missed (ask 1)

### 2.1 Real or artefact, and the cheapest way to tell

**The logic [derived].**
- In a backward induction whose stored values match the policy actually followed, the gap between two moves at a state is the expected loss from taking the worse one, given that continuation. This is the performance-difference identity (section 3.2).
- So a true near-tie is cheap by construction. Harm can enter in only two ways:
  - the continuation actually followed is not the one the tables valued (the hold); or
  - the gap itself is wrongly estimated (the read).
- "Real or artefact" therefore has to be asked of a specific question.

**For the shipping product, the record already answers it.**
- **What the gap measures.** The product's tables are solved as if switching were free: each world picks its own best move and no tier is held (solve.js:1189-1235). Its year-0 gap is therefore the value of one year's exposure with the future still free. The forward margin (solve.js:1401-1413) then holds the result: 0.03 to 0.04 switches a path on S126 and bridge 4 [record: code; results-7t-deep.txt].
- **What changing only the opening did.** Wherever the record changed only the opening, the consequence was material in both directions, on gaps of 4e-5 to 8e-4 [record: results-7v.txt; results-7w.txt item 4; results-7ab.txt]:
  - share 0.95: +12.3 points (983 paths saved, 0 lost, of 8,000);
  - S194: +0.5 points (42 saved, 2 lost);
  - S360: -6.1 points (9 saved, 497 lost).
- **Price against outcome.** The freed opening realised 4.6 to 10 times the price its own tables put on it [record: deep-review-log.md 28 Sep 13:56 UK].
- **The lifetime question, asked of the tables.** When asked to value one tier held for life (7x), the tables priced the choice close to what was realised [record: results-7x.txt items 1 and 3]:

  | Household | Table's price (points) | Realised (points) | Ratio |
  |---|---|---|---|
  | S126 | 0.82 | 1.04 | 0.79 |
  | S194 | 3.37 | 3.48 | 0.97 |
  | bridge 4 | 1.21 | 1.43 | 0.85 |

  Where the reads are sound, the tables do resolve the decision the margin actually makes. The brief leaves this out.
- **Where the reads are not sound, the gap is noise.**
  - The shipping tables' year-0 survival is 28.7 to 97.5 points wrong on 14 of the 25 tuning households; for example share 0.90 -97.49, S366 -96.10, bridge 4 -86.31, S360 -35.73, S126 -28.70 [record: results-7u.txt, the per-unit lines].
  - The held-for-life tables got S360's sign wrong: +0.33 against -12.86 realised [record: results-7x.txt item 4].
  - The shipping product's comfortable-looking S126 opening (gap 1.18e-2) comes from its own 44-point bridge misread [record: RULES.md section 9].
- **A free proof of table error that the record has not used [derived].**
  - With exact tables, a 0.001 margin can cost at most the sum of its holds: 39 decisions × 0.001 = 3.9 points. The probe prints exactly this bound (results-probe-tailm.txt).
  - Removing the margin on share 0.95 realised 12.3 points, which exceeds the bound.
  - So that table must be wrong by at least about 8 points along those paths, with no further run needed.

**For the candidate it is probably real and harmless, but this is not measured.**
- At world 0's node, opening de-risked beats opening in the plan's tier by +0.49, +0.78 and +0.29 points on bridge 4, S194 and S126.
- The plan's-tier opening then leaves in year 1 on 73% to 100% of node paths [record: results-P.txt node pairs and churn; results-P-slices.txt section 1].
- Weighted by the bad world's 1/6, that suggests 0.05 to 0.13 points across all worlds, below the 0.25 margin [derived; NOT CHECKED: the other two worlds were never run with both openings].

**The gap's numerical resolution has never been measured against a converged reference.**
- The record has only relative moves: -26% to +28% across 30x5, 60x5 and 30x15 (results-7ad.txt), and O67's half-step jitter [record].
- The toy used the product's axis rule:
  - a zero point plus 29 log points from 0.1 to 60 years of spending;
  - five-node Gauss-Hermite quadrature;
  - the log-odds read with its 1e-6 clamp, and the exact final year;
  - one person spending 1 a year for 30 years, with an end pot of 1;
  - High Risk at 4.79% median / 17.1% volatility against Medium Risk at 3.69% / 9.93%.
- Against a 3,000-point reference [derived: toy]:
  - The one-year tier gap was off by 0.1 to 0.5 survival points (1e-3 to 5e-3 in score units).
  - At its crossing it had the wrong sign at all four grid phases: exact -0.05, coarse +0.21 to +0.54.
  - The lifetime-held gap kept its sign everywhere, with 10% to 25% magnitude error.
- If the solver resolves at that order, no gap below about 1e-3 is resolved in sign. That is consistent with every flip in the record.

**The cheapest way to tell real from artefact, household by household:**
1. **Free:** the year-0 table error (table less simulation), which the product computes anyway. Where it exceeds the gap by orders of magnitude, the gap carries no information [derived].
2. **Zero solves, and decisive:**
   - Run the arm's own chooser forward from each of the two openings on common paths. runPolicy's `start`/`firstAi` hook already forces a first move (solve.js:1549-1571).
   - Read the paired difference against the regimen's materiality margin.
   - If it lies inside the margin, the near-tie is real and harmless whichever way it falls. If it is material, the gap is an artefact, either of the question (when the arm holds) or of the read.
   - The record has this for the product but not for the candidate across worlds.
3. **Free:** the margin bound above. If the margin's realised effect exceeds the sum of margins over the decisions, the tables are wrong.

### 2.2 Mechanisms the record has not examined

**M1. The product's first year is a part-year; the research's never is** [record: code].
- **What the code does.**
  - Every research household is valued on 1 January (research/policy-study/scenarios.mjs:166), so yf = 1.
  - The product defaults the valuation date to today (src/App.jsx:439, 1126) and pro-rates year 0 to the rest of the calendar year (App.jsx:993-999, 1566). The UI says so (App.jsx:13464).
  - fast.js pro-rates spending (fast.js:197, 201) and growth, by multiplying the whole year's random return by yf (fast.js:636-641).
- **Why it matters [derived].** Year 0's drift therefore scales with yf, and its variance with yf². A part-year of a random walk would scale the variance with yf. So the part-year understates risk relative to return, and the year-0 tier choice is biased toward risk.
- **Toy effect [derived: toy]:**

  | Case | yf = 1 | yf = 0.5 | yf = 0.25 |
  |---|---|---|---|
  | 94% survival | +1.10 | +0.14 | -0.05 |
  | 97% survival | +0.80 | +0.12 | -0.01 |
  | Bad world, 80% survival | +1.93 | +0.46 | +0.07 |

  (One-year de-risk gap, in survival points.)
- **Consequence.**
  - For a user valuing after about April, the year-0 de-risk vanishes or reverses.
  - The real opening is year 1's, from an off-grid state no opening test has examined.
  - The tier shown as "this year's action" changes with the calendar date of the valuation.
- **Not in the record.** Searches for yf, year fraction, part-year and valuation date across PLAN.md, deep-review-log.md, items/ and predictions/ find only a weighting in audit-7as.mjs:83 [record]. Every fair test has read the valuation date as SAME because every household fixes it, so no opening result has been checked against how the product is actually used.
- **Cheapest check.**
  - Run the shipping arm on S194 and share 0.95, valued 1 January, 1 July and 1 October: four new solves.
  - For a retired household only year 0's arrays change (fast.js:195-233), so the tables for t ≥ 1 must match bit for bit. That is a free identity gate.

**M2. The one-year and lifetime crossings sit in different places** [derived: toy].
- In the toy's middle world, the one-year gap crosses zero near 20 years of spending, and the lifetime-held gap near 22.
- At 22, the one-year question favours de-risking by 0.53 points, while holding the de-risk for life loses 0.52.
- Between the two crossings, a one-year sign carried out as a lifetime hold is wrong in sign, not merely late. That is sharper than the record's "procrastination" (deep-review-log.md 27 Sep 02:07 UK), which describes postponement only.

**M3. The space the survival read is done in biases the tier difference, not only the level** [derived; toy].
- **The mechanism.**
  - Averaged over grid offsets, a linear read is the truth convolved with a triangular kernel of variance h²/6, as the 12 Oct outside review notes (drafts/external-review-12oct.md). That acts like extra volatility, common to every tier, at every read.
  - The tier choice trades curvature (variance) against slope (drift). Smoothing shrinks the curvature near a cliff.
  - So a read done in probability space under-prices whichever tier the curvature favours: the de-risk above one half, and the riskier tier below one half. Either way it pulls gaps toward zero.
  - A log-odds read exaggerates curvature above one half.
- **Toy.** The probability read shrank the one-year de-risk gap by 26% to 85% at 80% to 94% survival. The log-odds read inflated it by 16% to 135% at 55% to 90%, and had the wrong sign at its crossing [derived: toy].
- **In the candidate.** Bridge years are read in probability (grid.js:407-417) and later years in log-odds (grid.js:419). So the bias in the tier difference changes sign over the life of the plan.
- **Fit with the record (weak).**
  - The reader households' bad-world de-risk is the more under-priced: S126 at 0.59 to 0.67, and bridge 4 at 0.44 to 0.78. S194, read in log-odds only, sits at 0.75 to 0.79 [record: results-7ae.txt, results-P.txt].
  - The mechanism reads O48 (de-risk under-priced above one half) and O142 (de-risk winning on the tables and losing on paths below one half) as one rule, seen from either side of one half.
  - The record has the sign rule for the level (O143) but not its consequence for the tier difference [record: PLAN.md O143]. Grade D until tested.

**M4. The opening's resolution is bounded by the bad world's price** [derived from record].
- The year-0 gap is a bad-world price weighted 1/6, netted against the other worlds. On bridge 4 (TS+J, 30x5), world 0 supplies 0.089 of the 0.135-point gap [record: results-7ad.txt].
- The bad world's under-price at the node is 0.06 to 0.21 points under the charge, and 0.21 to 0.59 under the stored margin [record: results-P.txt; results-7ae.txt].
- Weighted by 1/6, that is 1e-4 to 3.5e-4 and 3.5e-4 to 1e-3 in score units: the same size as the knife edges' distance to their threshold.
- Doubling the wealth axis barely shrinks it: bridge 4's world-0 mispricing went from +0.618 to +0.496 at 60x5 [record: results-7ad.txt item 2]. Uniform refinement alone will not settle openings.

**M5. Interpolating a maximum across a switching boundary over-values the layer that holds the option** [derived; NOT CHECKED].
- Each tier-state layer at t+1 is the maximum of two values: staying in the tier, and switching less the charge.
- A linear interpolant of a maximum is never below the maximum of the interpolants. In a cell containing the layer's switching boundary, it over-reads by up to about a quarter of the cell times the slope difference. That is a first-order error, not h².
- A knife edge at year 0 means the household is near its own boundary. So the stay move's next-year reads land near layer 0's boundary and are over-read, which under-prices the de-risk. Refinement removes this only at first order.
- It fits O48's persistence under refinement, and the asymmetry where the forward run holds while the cell leaves (O47, O49). Neither has been checked against it.
- **Check, zero solves:**
  - compute the Bellman residual at cell midpoints, by layer, in years 1 to 5: the interpolated layer value less the best move's score recomputed at that point by scoreMoves;
  - the mechanism predicts positive residuals concentrated in layer 0's boundary cells.

**M6. 7u's two unsettled households are opening disagreements** [record: results-7u.txt l.184-185, 200-201].
- **S224:** the shipping arm keeps the plan's tier on a gap of 8.04e-4. The candidate leaves one tier on 9.08e-6 above its charge, under 1% of the charge: the sharpest knife edge in the record.
- **S380:** the shipping arm leaves one tier on 3.27e-3, and the candidate stays (gap 0).
- More paths of a fresh seed (7u-F) cannot separate the opening from the continuation; an opening swap can. This is the rule the 5 Oct 09:27 UK deep review gave for S126 [derived; record: deep-review-log.md].

### 2.3 Errors and omissions in the brief

1. **S126's 8.0e-4 gap is the reader arm (READER/1e-3), not the shipping product.**
   - The shipping product opens S126 two tiers down on a gap of 9.993e-3 (results-7v.txt, "year-0 gap OFF 9.9930e-3 ... 2, 2, 2, 2").
   - It does so because of its own 44-point bridge misread (RULES.md section 9).
   - The harm "removed at 3e-4" is the reader's harm against the shipping product.
2. **"On S360 ... the tables read the de-risk as better by 0.33 points" joins two different tables.**
   - The 9 saved / 497 lost comes from the product's free-switch tables at a lower margin, whose year-0 gap is 5.56e-4 (0.056 points).
   - The 0.33 (0.3262) is the held-for-life tables' difference (7x item 4). Those tables read survival at 0.61% and 0.93%, against 41.06% and 28.20% simulated (results-7x.txt).
3. **"Opens de-risked on gaps 0.5% to 13% above the margin":**
   - the 0.55% belongs to the tier state alone (S126, W0);
   - the joint-worlds range in 7aa is 5.25% to 41.38% (results-7aa-gaps.txt);
   - 7af adds 2.67% (bridge 0) and 3.32% (bridge 1).
4. **"Margin 0: about 10 switches a path, half reversed" is 7t at 16 points** (results-7t-deep.txt). At the product's 30 points, 7v measured 5.00 and 4.76 switches a path, 32% reversed (results-7v.txt item 13 FALSIFIED).
5. **The 21% against 6% forward-against-cell figure is selection-biased after year 1.**
   - In year 1 it is 14.0% against 10.6%.
   - S194 and S126 disagree only the reverse way there (deep-review-log.md 28 Sep 22:52 UK).
6. **"A net 6.5 points remain, attributed to the grid itself" is out of date.**
   - The net is bridge 4's alone (14.6 points; S126 -0.2; S194 none) and follows the bridge's calendar.
   - Its attribution to the grid is grade C, with the reader's bridge read and the share axis carrying equal weight.
   - 7ak then found the pension-share snap turned 98.4% of the disagreements (PLAN.md O49; results-P-slices.txt section 1).
7. **The joint-worlds gains of "S126: 40/0 and 47/0" are measured against the reader at 1e-3, not the shipping default.** Against the shipping default, the joint-worlds tier state with the reader saves 3 and loses 0 on S126 at W0.02 (deep-review-log.md 28 Sep 22:52 UK, the rule 3 flag).
8. **Omissions:**
   - the held-for-life results (7x), which answer much of ask 1 for the product;
   - the outside review already received (drafts/external-review-12oct.md), which escalation.md requires a brief to list;
   - that S224 and S380 open differently under the two arms (M6).

---

## 3. Methods and literature (ask 2)

### 3.1 Optimal switching and hysteresis with switching costs

- **Dixit (1989), "Entry and exit decisions under uncertainty", *J. Political Economy* 97(3):620-638** [literature].
  - Sunk switching costs, priced into the value of each state, produce a hysteresis band, and the band is wide even for small costs.
  - *Here:* a hold should come out of the value function, as the candidate's charge in both passes does. It should not come from a decision rule the tables never see (SWITCH_MARGIN). The record's "procrastination" is the predicted failure of an unpriced band [derived].
- **Brekke & Øksendal (1994), *SIAM J. Control Optim.* 32(4):1021-1036 ([link](https://epubs.siam.org/doi/10.1137/S0363012992229835)); Dixit & Pindyck (1994), *Investment under Uncertainty*** [literature].
  - Optimal switching has regions separated by boundaries. Under regularity the values touch there, and smooth pasting holds.
  - *Here:* mislocating a consistent boundary costs only second order. A knife edge in a consistent model is cheap, and the decisive test checks this [derived].
- **Carmona & Ludkovski (2008), *Applied Math. Finance* 15(5-6):405-447 ([link](https://doi.org/10.1080/13504860802170507))** [literature].
  - Switching policies valued by Monte Carlo regression; switching boundaries characterised.
  - *Here:* simulation-based evaluation of a switching decision is standard practice. The opening rollout is a one-decision instance of it.
- **Portfolio choice with transaction costs** [literature]:
  - Davis & Norman (1990), *Math. Oper. Res.* 15(4):676-713.
  - Rogers (2004), "Why is the effect of proportional transaction costs O(δ^{2/3})?", in Yin & Zhang (eds.), *Mathematics of Finance*, AMS Contemp. Math. 351:303-308: the no-trade band's width scales as δ^{1/3} and the welfare loss as δ^{2/3}, because the value is quadratic near the optimal allocation.
  - Liu & Loewenstein (2002), *RFS* 15(3):805-835 ([link](https://ideas.repec.org/a/oup/rfinst/v15y2002i3p805-835.html)): with a finite horizon, policies depend on the horizon and are largely buy-and-hold.
  - Lynch & Balduzzi (2000), *J. Finance* 55(5):2285-2309 ([link](https://ideas.repec.org/a/bla/jfinan/v55y2000i5p2285-2309.html)): discrete-time, grid-based DP; no-trade regions are state-dependent and widen near the end.
  - *Here:*
    - near-ties in a risk choice are generic, because the objective is flat near the optimum [derived];
    - the right hold is a band that depends on state and age and comes out of the solve, as the charge's does;
    - a fixed 0.001 margin has the wrong shape, and O46's blocked late re-risk is the cost of that shape [derived].
- **Abel, Eberly & Panageas (2013), *Econometrica* 81(4):1455-1481 ([link](https://doi.org/10.3982/ECTA7624))** [literature].
  - With small fixed costs, the optimal rule becomes periodic review.
  - *Here:* the product's annual review is itself a hysteresis device. A year-0 near-tie is re-decided at the next review, which favours "keep, and review" over a lifetime commitment [judgement].
- **O'Donoghue & Rabin (1999), "Doing it now or later", *AER* 89(1):103-124** [literature].
  - Time-inconsistent agents chain one-period delays.
  - *Here:* an unpriced margin installs that inconsistency in the chooser; compare the bursts in O47 [derived].

### 3.2 A posteriori error bounds for approximate dynamic programming

- **Santos & Vigo-Aguiar (1998), *Econometrica* 66(2):409-426 ([link](https://ideas.repec.org/a/ecm/emetrp/v66y1998i2p409-426.html))** [literature].
  - Value error converges as O(h²), but policy error only as O(h).
  - *Here:* decisions converge an order slower than values, and near a flat argmax they need not converge at all. NE-GRID converging the table level will not certify openings [derived].
- **Williams & Baird (1993), Northeastern NU-CCS-93-14; Singh & Yee (1994), *Machine Learning* 16:227-233 ([link](https://doi.org/10.1007/BF00993308))** [literature].
  - A policy that picks the best move on value tables with error ε loses at most about 2γε/(1−γ); the Bellman-residual form is computable.
  - The finite-horizon analogue is a loss of at most 2 × (sum of ε_t) [derived].
  - *Here:* an opening is certified only if its gap exceeds twice the error of the two moves' scores. Otherwise it is a near-tie at the tables' resolution.
- **Kakade & Langford (2002), ICML, pp. 267-274 ([link](https://mlanthology.org/icml/2002/kakade2002icml-approximately/))**, the performance-difference lemma [literature].
  - A policy's loss is the expected sum of the gaps of its own actions along its own path.
  - *Here [derived]:*
    - one near-tie choice followed by a consistent continuation costs at most its true gap;
    - a hold below the margin costs at most the sum of margins in table units;
    - so a realised effect beyond that sum proves the tables are wrong (section 2.1).
- **Gordon (1995), ICML, "Stable function approximation in dynamic programming" ([link](https://mlanthology.org/icml/1995/gordon1995icml-stable))** [literature].
  - Linear interpolators are averagers, so errors from each step add rather than amplify.
  - *Here:* the Bellman residuals at off-grid points (M5's check), summed along the forward path, give an estimate of the error at the opening, for the price of scoreMoves calls [derived].
- **Information-relaxation duals** [literature]:
  - Brown, Smith & Sun (2010), *Oper. Res.* 58(4):785-801 ([link](https://doi.org/10.1287/opre.1090.0796));
  - Brown & Smith (2011), *Mgmt. Sci.* 57(10):1752-1770 ([link](https://doi.org/10.1287/mnsc.1110.1377)), on portfolios with transaction costs, where simple heuristic policies come close to the dual upper bound;
  - Haugh, Kogan & Wang (2006), *Oper. Res.* 54(3):405-418 ([link](https://doi.org/10.1287/opre.1060.0279)).
  - *Here:*
    - The product's per-world tables are themselves an information relaxation: each world plans as if it knew its world.
    - The gap between that clairvoyant value and a simulated policy bounds what any opening or learning rule could buy.
    - The world-aware oracle at the bad node (+0.9 to +2.1 points, results-P.txt) is its node-level instance [derived; record].

### 3.3 Choosing among near-tied actions under approximation error

- **Rollout** [literature]:
  - Bertsekas, Tsitsiklis & Wu (1997), *J. Heuristics* 3:245-262 ([link](https://www.mit.edu/~jnt/Papers/J066-97-rollout.pdf));
  - Tesauro & Galperin (1997), *NIPS* 9:1068-1074 ([link](https://proceedings.neurips.cc/paper/1996/hash/996009f2374006606f4c0b0fda878af1-Abstract.html)).
  - Rolling a choice forward with the base policy's own continuation is no worse than the base policy in expectation.
  - *Here [derived; record: results-7v.txt, results-7ab.txt]:*
    - Re-ranking the top two openings by simulating the product's own chooser on common paths evaluates the choice as it will be carried out, hold included.
    - In-sample it picks the realised better opening on S194, share 0.95, S360 and the reader's S126.
    - Keeping the plan's tier fails two of those; freeing the opening fails S360.
    - It costs two forward passes and no solve.
- **Ranking and selection with common random numbers** [literature]:
  - Nelson & Matejcik (1995), *Mgmt. Sci.* 41(12):1935-1945 ([link](https://doi.org/10.1287/mnsc.41.12.1935));
  - Kim & Nelson (2001), *ACM TOMACS* 11(3):251-273.
  - *Here:* set the indifference zone to the regimen's materiality margin; any opening inside it is acceptable. A fully sequential paired procedure stops early on S360-sized differences, and runs to a cap on true near-ties, which then default to the plan's tier [derived].
- **The optimizer's curse: Smith & Winkler (2006), *Mgmt. Sci.* 52(3):311-322 ([link](https://doi.org/10.1287/mnsc.1050.0451))** [literature].
  - *Here [derived]:*
    - never report the selected opening's outcome on the paths used to select it;
    - the chooser's best-stay and best-leave are each maxima over 100+ moves, so both are inflated, by amounts that need not be equal.
- **Smoothing the choice** [literature]:
  - Iskhakov, Jørgensen, Rust & Schjerning (2017), *Quant. Econ.* 8(2):317-365 ([link](https://doi.org/10.3982/QE643)): taste shocks smooth the kinks that discrete choices put into value functions;
  - Rust (1987), *Econometrica* 55(5):999-1033.
  - *Here:*
    - A small log-sum-exp over the tier layers would remove the argmax kinks behind O67 and M5, and stay deterministic.
    - It changes the objective, so it is a design, not a fix, and it does nothing for RC1 or RC2 [derived; judgement].
- **An explicit tie-breaker in the objective** [literature]:
  - Forsyth and co-authors add ε·W_T with |ε| ≪ 1, because where shortfall is negligible the allocation barely moves the objective and is ill-posed. The sign of ε chooses bonds or stocks.
  - Sources: Forsyth & Li (2025), arXiv:2502.16364 ([link](https://arxiv.org/abs/2502.16364)); Chen, Shirazi, Forsyth & Li, *J. Computational Finance* (2025), arXiv:2306.10582 ([link](https://arxiv.org/abs/2306.10582)); Forsyth, Vetzal & Westmacott (2021), *ASTIN Bulletin* 51(3):905-938 ([link](https://ideas.repec.org/a/cup/astinb/v51y2021i3p905-938_8.html)).
  - *Here:* published practice for flat regions is a declared tie-breaker, not numerical noise or menu order. "Keep the plan's tier on a near-tie" is the same device [derived].
- **Minimax regret** [literature]: Savage (1951), *JASA* 46:55-67; Manski (2004), *Econometrica* 72(4):1221-1246 ([link](https://doi.org/10.1111/j.1468-0262.2004.00530.x)).
  - *Here:* minimax regret across the three worlds always protects the bad world. That is right for comfortable households and wrong where poor-world survival is below one half (O142). Not recommended [derived; judgement].

### 3.4 Lifecycle and decumulation models with discrete, sticky risk choices

- **Forsyth et al. (above)** [literature]: allocation solved on grids; bang-bang optimal controls; a stabilisation term in flat regions. *Here:* the closest published analogue, which handles flatness with an explicit ε, not a decision margin.
- **Pfau & Kitces (2014), *J. Financial Planning*, January ([link](https://www.financialplanningassociation.org/article/journal/JAN14-reducing-retirement-risk-rising-equity-glide-path))** [literature].
  - Equity glide paths that rise through retirement can reduce both the chance and the size of failure.
  - *Here:* de-risking early and re-risking later is a published optimum shape. O46's blocked late re-risk is a cost of the margin's symmetric hold [derived].
- **Cocco, Gomes & Maenhout (2005), *RFS* 18(2):491-533; Gomes & Michaelides (2005), *J. Finance* 60(2):869-904** [literature]. Grid-based lifecycle DP with discretised allocations; participation costs make allocation decisions sticky.
- **Agnew, Balduzzi & Sundén (2003), *AER* 93(1):193-215 ([link](https://doi.org/10.1257/000282803321455223))** [literature].
  - Retirement savers hold extreme allocations and rarely trade.
  - *Here:* a product that flips a user's risk on a near-tie, then flips it back at the next review, will be ignored or distrusted. Stability has value beyond the score [judgement].
- **Barberis (2000), *J. Finance* 55(1):225-264 ([link](https://doi.org/10.1111/0022-1082.00205))** [literature].
  - Parameter uncertainty and learning change long-horizon allocations.
  - *Here:* RC3. The learner's gain is already in the record (results-7v.txt item 6: 10/0 and 22/0) [record].

---

## 4. Root causes, ranked (ask 3)

Each credence is my credence that the cause is the principal one behind the problem as the brief states it: a lifetime risk choice decided by a gap the tables cannot or do not resolve, with some choices losing badly. The five are treated as exclusive for the ranking, though they act together. The sum is 1.00.

**RC1 (0.38). One year priced, a lifetime carried out.**
The product's year-0 gap is the value of one year's exposure with the future free. The margin turns it into a hold of decades. The candidate prices the hold, but still stores the margin's holds (TS+J) or holds more off-grid than the cells do.

*For:*
- Held-for-life tables price the choice at 0.8 to 3.4 points, with ratios of 0.79 to 0.97 where the reads are sound (results-7x.txt).
- The opening's realised value is 4.6 to 10 times its table price (deep-review-log.md 28 Sep 13:56 UK).
- Every table opens de-risked at margin 0, at every grid (results-7ad.txt; results-7ae.txt).
- With the charge in both passes, the clustering at the threshold falls from 7 of 25 openings within 10% to 1 of 18 (results-P-slices.txt section 4).
- Under the charge, the plan's-tier opening leaves in year 1 on 73% to 100% of node paths (results-P.txt; results-P-slices.txt).
- The toy's crossings differ (M2).

*Against:*
- Even under the charge, the bad-world de-risk is priced at only 0.74 of what it realises (results-P.txt).
- Share 0.95 still flips with the grid under the charge (O63).
- Off-grid holds remain on bridge 4 (O49).

**RC2 (0.32). Systematic read error at the cliffs.**
The parts:
- bridge-year misreads in the shipping tables;
- the bridge step falling between quadrature nodes;
- the end pot sitting within one wealth cell;
- the read's space biasing the tier difference (M3);
- interpolated maxima at switching boundaries (M5).

*For:*
- The shipping tables are 28 to 97 points wrong on 14 of 25 households (results-7u.txt).
- S360's lifetime sign is wrong (results-7x.txt item 4).
- Share 0.95's reader gap rises 13.7-fold at 15 quadrature nodes (results-7w.txt item 1).
- The bad world is under-priced at 0.44 to 0.79 of its realised gain, and refinement does not cure it (O48; results-7ad.txt).
- A de-risk wins on the tables and loses on the paths below one half (O142).
- Lost paths end a third of a pot short, where neighbouring wealth nodes are 27% to 31% apart (O26; results-cliff-grid.txt via deep-review-log.md 28 Sep 13:56 UK).
- Doubling the wealth axis closes S380's read gap, and both reads then keep the plan's tier (NE-GRID B1, items/NEGRID.md).
- This cause carries the largest harms: share 0.95 and S360.

*Against:*
- The candidate's year-0 tables are within 1 point on 20 of 25 households (results-7u.txt).
- Held-for-life tables resolve the lifetime choice on 3 of 5 households.

**RC3 (0.12). Fixed world weights, no learning.**
The gap is a bad-world gain weighted 1/6, netted against small terms of the opposite sign in the other worlds (results-7ad.txt). The weights never move with the evidence a path shows.

*For:*
- The learner gains 10/0 and 22/0 (results-7v.txt item 6).
- The world-aware oracle gains +0.9 to +2.1 points at the bad node (results-P.txt).
- Removing the per-world choice recovers 21 of 25 lost paths (results-7ac.txt item 3).

*Against:*
- One policy at margin 0 adds nothing material over the reader (results-7v.txt item 5 FALSIFIED).
- Learning is slow (solve.js:270-276).

**RC4 (0.10). Grid-phase aliasing and argmax kinks.**

*For:*
- O67's sign-blind part is 7% to 34% of the gap (results-7ai.txt via deep-review-log.md 30 Sep 18:03 UK).
- O47's parity is set by the grid (results-7ad.txt).
- Gaps move ±14% to 28% with the grid.
- The toy shows a ripple of ±0.05 to 0.2 points.

*Against:*
- The shipping arm responds smoothly to tier shifts: a sign-blind ratio of 0.03 to 0.28 on 6 of 7 households.
- The bundle's jitter was mostly its stored margin: the charge's sign-blind part is a third of it or less (items/O67.md, 7aq item 2).

**RC5 (0.08). Genuine plateaus.**

*For:*
- Any tie margin from 1e-10 upward rewrites the tax on every path (results-probe-tailm.txt).
- Survival and the whole score disagree in sign on 36 of 220 comparisons (results-verdicts-whole.txt).
- The tie-break goes to menu order (deep-review-log.md 5 Oct 09:27 UK).

*Against:* the material harms sit away from the plateaus, at 34% to 98% survival.

**Not ranked: M1.** No record result is affected, since everything is at yf = 1. It is a risk only for how the results carry over to the product, and it has its own check.

---

## 5. The decisive test (ask 4): OPEN-SWAP

**The question.**
- Is the opening a real near-tie when its continuation is consistent (the candidate)?
- Is it a material choice that the shipping product decides wrongly?
- Can a paired rollout choose it safely?

**Households.** Seven, on seed 7002, the tuning seed. S224's and S380's 7u reads were on seed 7013, and 7u-F keeps a fresh seed for them. Their roles [record: results-7u.txt; results-7v.txt; derived]:

| Role | Households | Why |
|---|---|---|
| Candidate knife edges (gap on top of the charge under 1e-3) | S194 5.46e-4, bridge 4 5.75e-4, S126 4.13e-4, S224 9.08e-6 | The primary item |
| Shipping sub-margin openings | S194 5.43e-4, share 0.95 1.67e-5, S360 5.01e-4, S224 8.04e-4 | Item 2 |
| Positive control | share 0.95 under the candidate, which opens 2/2 on 1.83e-2 | The test must see a material difference here, or it cannot see one at all |
| Guard | S360 under the shipping arm | Leaving lost 9/497 in 7v and must read as harm |
| Opening swap | S224, S380 | The two arms open differently there (M6) |

**Arms.**
- SHIP and CAND, exactly as 7u ran them at W0.02: blend-median tiers, and CAND with e3pcls.
- Identity gate: the u = 0 solves must reproduce 7u's printed table, gap and opening lines.

**Stage 1 (always).**
- For each household and arm, define two openings:
  - A: the arm's best year-0 move keeping the plan's tiers;
  - B: the arm's best move leaving them, i.e. its margin-0 choice among leaving pairs.
- Follow each opening with the arm's own chooser, using runPolicy's `start` hook.
- Paths: 1-16,000, common to all runs; paths 1-8,000 are enough for SHIP's legs, whose effects are large.
- Print the signed gap s: best leave, less the charge, less best stay, not floored at zero.
- Reported diagnostics, at zero solves, on CAND's tables:
  - the gap at 33 opening wealths across two cells, to measure the ripple;
  - the Bellman residuals at cell midpoints, by layer, in years 1 to 5 (M5).

**Stage 2 (only if item 1 is FALSIFIED or INCONCLUSIVE).**
- On the failed households, re-solve CAND at three more grid phases: hiYears and headroom both multiplied by e^{u·h}, for u = 1/4, 1/2 and 3/4, where h is the 30-point log step. Both options already exist (grid.js:98).
- Record the gap and the opening at each phase.

**Items.** Each uses exact paired intervals, with Holm correction within the item. Materiality m is 0.25 points where the arm's survival is 95% or more, and 0.5 below. The whole score is read, with its survival part beside it.

1. **(Primary) The candidate's knife edges are real near-ties.**
   - Read on every household where CAND's |s| < 1e-3: does B − A on the whole score lie inside ±m by its exact interval?
   - HELD: inside on every such household, and the positive control reads material.
   - FALSIFIED: material on at least one, on the side CAND did not open.
   - INCONCLUSIVE: anything else, including a positive control that does not read material (the test is then blind).
2. **The shipping product's sub-margin openings are material.**
   - HELD: B − A is beyond +m on S194 and share 0.95, and beyond −m on S360.
   - FALSIFIED: inside ±m on two or more of the three.
   - INCONCLUSIVE: anything else.
3. **(Stage 2) The candidate's opening is limited by resolution.**
   - HELD (RC4): on every failed household, the gap's range over the four phases is at least its distance to the threshold.
   - FALSIFIED (a stable bias, RC2): the range is under a quarter of that distance on every one.
   - INCONCLUSIVE: anything else.
4. **A paired rollout is a safe opening rule.**
   - Choose A or B by the paired difference on paths 1-8,000, then compare that choice with each arm's own opening on paths 8,001-16,000.
   - HELD: no material harm on any household for either arm, and a material gain on at least one for SHIP.
   - FALSIFIED: material harm on any household.
   - INCONCLUSIVE: anything else.
5. **(Reported, grade C)** On S224 and S380, run each arm's continuation from the other arm's opening, and report the share of 7u's discordant paths that the opening carries.

**Expected outcome [derived].** This is for the regimen's own derivation to replace.
- Item 1 HELD about 0.6: the node runs, weighted by 1/6, put B − A at 0.05 to 0.13 points.
- Item 2 HELD about 0.85: a replication on the blend-median tiers.
- That puts the "else" row near 0.3, under escalation.md's 0.6 trigger.

**What each outcome would change.**
- **Items 1 and 2 HELD:**
  - RC1 rises to about 0.7.
  - The candidate needs no opening rule beyond a declared tie-break: keep the plan's tiers when |s| is below the resolution item 1 measures.
  - O44 and O67 close as immaterial for openings, and NE-GRID's remit narrows to the table level (RC2).
  - The shipping product's harm is its hold. Ship the candidate's consistent switching after 7u-F, or in the interim use the rollout rule if item 4 holds.
- **Item 1 FALSIFIED:** stage 2 decides between:
  - RC4 (jitter): choose the opening by rollout (zero solves), or by a gap averaged over grid phases (four solves, outside gate 5);
  - RC2 (bias): fix the bad world's price and the bridge read before designing any opening rule.
- **Item 2 FALSIFIED:** on the blend-median tiers the product's near-ties are near-ties after all, and keeping is safe. RC1 falls toward RC2.
- **Item 4 HELD:** register the rollout rule's confirmation on a fresh seed, as the product's interim opening rule.
- **Item 5:** if the opening carries most of S224's and S380's discordance, 7u-F should include the opening swap, and the wealth axis becomes secondary for those two households.

**Cost (to be confirmed by a preflight timing run).**
- **Stage 1, solves:** 14 — 7 SHIP at about 250 to 350 s and 7 CAND at about 700 to 2,050 s (results-7v.txt; results-P.txt). About 2.7 core-hours.
- **Stage 1, forward runs:** 7 × (2 × 8,000 + 2 × 16,000) = 336,000 runs of one path each. At about 0.07 to 0.08 s each (7v's 550 s per 8,000-path run; 7ad's 589 to 686 s per pair of 4,000-path runs), about 7 core-hours.
- **Stage 1 total:** about 10 core-hours, roughly 2.5 hours on four cores.
- **Stage 2:** up to 21 CAND solves, about 6.4 core-hours.
- **Zero-solve diagnostics:** minutes.
- **Side check for M1:** 4 solves, about 0.3 core-hours.

---

## 6. What the shipping product should do now (ask 5)

**Recommendation [judgement].** When the year-0 gap is below a stated resolution, keep the plan's tier and say so, with numbers from the engine rather than the tables. In detail:

1. **The resolution.** Until the test measures it, use the regimen's materiality margin: 2.5e-3, a quarter of a survival point. On any household whose year-0 table error exceeds 1 point, treat every gap as unresolved. On the record's 25 tuning households, that flags all 14 bridge-misread households.
2. **Inside that band, keep the plan's tier.**
   - This is what the margin already does today for gaps under 0.001.
   - Label it a near-tie: "your risk level and the more cautious one are within this planner's precision".
   - Show both openings' outcomes from the engine on common paths: survival, the unlucky-tenth pot and the median estate.
   - Offer one click to choose the other opening.
3. **In that band, stop showing the table's "what skipping it would cost" for the risk move** (HOW-IT-WORKS.md section 10). There it shows a one-year table gap, while the user is choosing for decades.
4. **For valuations after January, say that a year-0 risk change covers only the rest of the calendar year** (M1).
5. **After the test's item 4 and a fresh-seed confirmation,** replace "keep" with the paired rollout, using an indifference zone equal to the materiality margin and defaulting to keep.
6. **Do not lower SWITCH_MARGIN and do not free the opening in the product.** The freed opening harms S360 by 9/497 under the shipping read (results-7ab.txt item 3).

**Trade-offs** [record: results-7v.txt, results-7w.txt, results-7ab.txt, results-7x.txt; derived; judgement]:

| Option | Record cases decided right (S194, share 0.95, S360, reader's S126) | Cost | Stability and determinism | Main risk |
|---|---|---|---|---|
| Keep the plan's tier (today, below 0.001) | S360 only | None | Stable; deterministic | Gives up 0.5 points (S194) and 12.3 points (share 0.95) where leaving pays |
| Free the opening (margin 0 in year 0) | S194, share 0.95, reader's S126 | None | Flips with any input (O67) | S360 −6.1 points |
| Paired rollout with an indifference zone | All four, in-sample | Two forward passes, no solve; sequential stopping cuts it | Deterministic with a fixed seed; inside the zone it defaults to keep | Untested out of sample (item 4); report on a separate seed (optimizer's curse) |
| Disclose the near-tie with both outcomes | Whatever the user picks; an informed user picks right on share 0.95 and S360 | The same passes as the rollout | Deterministic | Hands a technical choice to the user |
| Lifetime-held comparison (two held-tier solves, as in 7x) | S126, S194, bridge 4 (ratios 0.79-0.97) | Two cheaper solves (104 to 201 s each) | Deterministic | Inherits the misreads: S360's sign wrong, share 0.95 at a ratio of 0.21 |
| Ship the candidate's consistent switching | Turns the opening back into a one-year question | Gate 5 met (E2X) | Deterministic | 7u-F still open |

**Why "keep and disclose" now, rather than the rollout [judgement].**
- No product change can be made without the maintainer's decision and a registered test.
- Keeping is today's behaviour for sub-margin gaps, so it adds no new risk.
- Disclosure adds information without moving the default.
- The rollout is the better rule on the record, but it needs item 4 and a fresh-seed confirmation before it can ship.
