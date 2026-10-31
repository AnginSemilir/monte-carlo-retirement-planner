# The outside reviewer's second reply (received 25 Sep ~07:15 UK, pasted by the maintainer)

Its answer to `outside-review-findings.md` section 5. It is kept here as received, as an input to the reader's design
(`drafts/reader-design.md`), and it is not a result. Its claims are checked in that draft before anything rests on them.

---

I would build Variant B with one bridge event, a fitted continuation value, and no production anchors initially. The main refinement is timing: today's withdrawal is already due; only later bridge withdrawals are exposed to future returns.

Your results support retaining five return points for this build. They have not shown a consistent benefit from finer earlier-year integration in the tested panel.

For the bridge template, distinguish crossing the bridge from surviving the whole plan.

Let \(p_t(s)\) approximate the probability of paying every remaining pre-access floor withdrawal. I would use:

\[ G_t(s)=p_t(s)\,c_t(s), \qquad \widehat S_t(s)=G_t(s)+I[S_t-G_t](s), \]

where \(c_t\) is a smooth, fitted continuation value and \(I\) is probability-linear interpolation. Clamp the reconstructed survival to \([0,1]\).

The continuation value matters. Consider the final bridge year, with: share-grid endpoints \(\alpha=0.8\) and \(1.0\); stored survival \(0.4\) and \(0\); a query at \(\alpha=0.95\) that can still pay its bridge bill. Using a unit-height template \(G=p\) gives \(1+0.25(0.4-1)+0.75(0-0)=0.85\). It manufactures 85% survival where the funded-side continuation value is 40%. Using \(G=0.4p\) recovers 40% in this example.

A concrete first implementation is:
1. Calculate reference bridge probabilities \(p_i\) at existing nodes.
2. Where \(p_i\ge0.5\), initialise \(c_i=\operatorname{clip}_{[0,1]}(S_i/p_i)\).
3. Extend that fitted value towards the unfunded side along each share row. If a row has no supporting values, use neighbouring wealth rows; mark wholly unsupported regions for diagnostics.
4. Store \(R_i=S_i-p_ic_i\).
5. At a query, calculate \(p_t\) from the actual accessible balance, then return \(\widehat S=p_t(s)I[c_i]+I[R_i]\).

The 0.5 support threshold is a proposed fixed development choice. It avoids division by tiny probabilities.

Do not interpolate \(p_t\) across the six share points: that would reintroduce the problem. Interpolate the smoother continuation and residual fields. All corners still contribute to the residual, and \(p_t\) is not an upper cap on reconstructed survival.

For B and H, use the same bridge geometry with appropriate funded/unfunded values. B has a zero bridge-failure value. In the last bridge year, H's immediate-failure value is \(F_t\); earlier bridge failures can happen later, so their H value differs. Preserve accumulated raise credits and allow H to be negative.

The reference probability should separate today's bill from future bills. Let: \(h\): pre-access spending dates remaining, including today; \(A=W(1-\alpha)\); \(d_0,\ldots,d_{h-1}\): reference gross withdrawals after income and taxes; \(x=A-d_0\): accessible money left after today's reference withdrawal. These are reference calculations; actual action cash flows remain with your exact engine.

For nonnegative future net withdrawals, the accessible capital needed after today's payment is the random discounted sum
\[ D=\sum_{j=1}^{h-1} d_j\exp\left[-\sum_{r=0}^{j-1}(\rho_r+v_rZ_r)\right]. \]
Here \(\rho_r\) and \(v_r\) describe a fixed reference accessible-portfolio path in the current persistent world. Because all these withdrawals are nonnegative, funding their total discounted value also funds every prefix.

Approximate \(\ln D\) by \(N(\mu_D,\sigma_D^2)\), giving \(p_t(s)\approx\Phi\left(\frac{\ln(A-d_0)-\mu_D}{\sigma_D}\right)\). Handle nonpositive remaining balances and deterministic cases explicitly.

The first two moments are cheap. Start \(m=q=0\) beyond the final bridge bill and work backwards through future bills, updating both from their old values:
\[ m'=e^{-\rho+v^2/2}(d+m), \qquad q'=e^{-2\rho+2v^2}(d^2+2dm+q). \]
Then \(\sigma_D^2=\ln(q/m^2)\), \(\mu_D=\ln m-\tfrac12\sigma_D^2\). That is linear work in bridge length, performed during setup. The moments are exact for this frozen reference model; the lognormal distribution fitted to them is an approximation for longer bridges. Lognormal approximations to sums have an established literature, but this particular reference still needs your forward validation.

For two remaining payments, the single-effective-pot reference is especially useful because it is exact:
\[ p_t(s)=\Phi\left(\frac{\ln((A-d_0)/d_1)+\rho_0}{v_0}\right). \]
Only one return occurs before the second bill.

For one remaining payment, there is no future return before the bill: \(p_t(s)=0\) if the current floor payment is unaffordable, \(1\) if it is affordable. Use the engine's affordability boundary, including its £1 tolerance. The whole-plan survival value need not jump to one: that is precisely why \(c_t\) is separate. The width therefore goes to zero in the last bridge year.

With locally fixed reference geometry: \(A^*=d_0+e^{\mu_D}\), \(\omega_{\ln A}\approx\frac{e^{\mu_D}}{A^*}\sigma_D\). Translate that directly onto the share axis: \(\alpha^*=1-\frac{A^*}{W}\), \(\omega_\alpha\approx\frac{A^*}{W}\omega_{\ln A}\).

As a useful check, equal bills, zero log drift and small constant effective volatility \(v\) give (payments remaining, including today: approximate width in \(\ln A\)): 1: \(0\); 2: \(0.500v\); 3: \(0.745v\); 4: \(0.935v\).

These are reference-model widths, not measured widths of the optimised policy. They avoid assigning uncertainty to money that must be paid before any return arrives.

Two exceptions need explicit handling: Large future inflows: use the maximum discounted prefix requirement. A terminal net sum can hide an earlier shortfall. If two prefixes compete, two correlated bridge margins may be worthwhile. Cash buffers and mixed tiers: derive effective growth and exposure from the post-withdrawal reference mix. Conditional on a world, cash has zero yearly volatility. Do not count its invested fraction twice.

I would reserve a joint bridge-and-terminal Gaussian for evidence that the residual still has an overlapping terminal cliff. It adds assumptions that are unnecessary for the first share-axis repair.

Caching is necessary, but its granularity and the hot-path cost determine whether it is enough. Cache the reference parameters, nodal templates and residuals. Year and world alone suffice only if the reference gross withdrawals and portfolio mix are constant. Generally the cache also needs the relevant wealth/gain slice and reference composition.

Choose one declared reference risk schedule for each representation. Do not calculate a query's template using the candidate move's volatility while subtracting nodal templates built with another volatility. The same continuation state must receive the same representation.

At runtime, the intended extra work is parameter interpolation, one reference probability, and the additional interpolation fields. There should be no tax replay, root search or forward rollout inside an ordinary lookup.

Your timings also provide a useful budget estimate. If \(T(n)=C+nD\), then \(T(15)\approx2.5T(5)\) implies about 75% of baseline work scales with return-node count. Under that approximation, a 20% total allowance permits roughly 27% extra work in that loop before setup costs. Caching alone does not establish that the new reader fits. For a five-to-six-minute baseline, the allowance is 60–72 seconds.

I would initially use diagnostic probes, not production anchors. At selected off-grid bridge states, compare the new read with a full Bellman evaluation using the already-solved next layer. These probes test representation consistency, not true survival. Add anchors only if they reveal unsupported continuation values or a remaining sharp residual that changes action rankings. Freeze any anchored version before its registered validation.

S360 is plausible, but first reconcile the reported quantities. If the gaps and survival figures describe the same runs: simulated survival 34.4% (five points), 36.4% (fifteen); table-minus-simulation gap −33.6 pp, −34.0 pp; implied opening table read 0.8%, 2.4%. The opening read increased by 1.6 points. The approximately unchanged quantity was the calibration gap. If these came from different runs, align their identifiers before interpreting the trace.

Even a genuinely unchanged opening read could accompany a better policy. Actions depend on local differences between scores, including the 0.001 switching threshold. Small changes at later states can alter actions and save paths while a large share-interpolation error continues to dominate the opening read.

I would inspect:
1. The first differing action on the 22 discordant paths—21 saved and one lost, given net 20. Record its year, distance to access, accessible balance, spending, draw order and tier.
2. Both actions' S, weighted B, H and switching margins at that identical state.
3. The source of the changed ranking: evaluate five versus fifteen return points against the same continuation table, then compare the two continuation tables under one fixed integration rule.
4. Five versus fifteen points with the same exact final year. The legacy comparison changed terminal integration too; its gain cannot identify earlier-year integration alone.

Keep world count and tier eligibility fixed across the five bridge arms so those choices do not obscure the representation comparison.
