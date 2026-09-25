# What we found after your proposal (25 Sep)

Thank you: two of your three ideas are now tested, and the third is the next thing we'll build. Here is where each one landed.
Each figure below comes from a results file in `research/solver/`. "Paired" means the same simulated paths in both arms.
"se" means sqrt(discordant)/N. Unless a figure is labelled otherwise, it is a registered prediction's reading.

## 1. Your variant C: the exact final year. It fixed a real fault (O19)

We built your crossing-shock integral as you described it. Survival is 1 − Φ(z\*), with z\* found by bisection, since grown wealth
is monotone in the yearly shock. The estate term is integrated with 12-point Gauss-Legendre in u = Φ(z) over [Φ(z\*), 1]. It was unit-tested
against brute-force quadrature. We ran six households on 3,000 paired paths, each with and without one tier above
the plan, and held the plan's tier at Medium. F1 was off in both arms, because it has been withdrawn since 24 Sep. So our
baseline was not your A.

- **It caused no harm:** survival fell beyond two se nowhere, so it is carried forward into every later test.
- **It prices the tier above properly (not registered, beside the reading):**
  - Survival rises only where the tier above is allowed: +0.18 ± 0.04 points over six households, and +0.04 ± 0.03 without it.
  - On the three comfortable households (S194, S162, S252), the tier above's survival cost falls from −0.21 ± 0.06 to
    −0.09 ± 0.04.
- **The registered readings landed exactly on the line:** item 1 (per household) through S162's −4 of 4, and the
  falsifier (the three pooled) at −8 paths net of 16 discordant, z = −2.000.
  We now judge ties on whole counts: net² = 4·discordant is "at the line", and 0 of 0 counts as no change.

## 2. Your template-residual idea for earlier years. Tested by brute force; not needed for this (7h)

Instead of building the template, we asked the question it would answer. Does averaging every earlier year more finely
change anything? We compared 15 Gauss-Hermite points against 5, with the final year exact in both. This ran on S194, S162,
S252 and S330, with and without the tier above, on 3,000 paired paths.

- **Survival:** it moved by less than two se in all 8 comparisons.
- **The tier above's cost on the three:** with both changes it is **−0.144 ± 0.048** pooled (not registered). The change in
  that cost from 5 to 15 points is −0.056 ± 0.043, so it is within noise.
- **Conclusion:** the remaining cost is not yearly averaging. Three causes remain, and we have not told them apart:
  - the grid read between wealth nodes;
  - the score's deliberate trade (S versus cuts, your S172 point);
  - the three-world approximation.
- **Your warning about three worlds was right.** Five worlds instead of three raised S330's survival by +0.27 ± 0.12
  (net 8 of 12, beyond two se). That was a registered item, and it missed. We have not measured the comfortable three's cost
  under five worlds; that test will be registered before Phase 4.

## 3. Your variant B: boundary plus residual. The bridge misread calls for it (7i)

This test asks whether the bridge misread (the table's opening survival against simulated survival) is an averaging
problem or a representation problem. F1 was off in both arms, with 5 against 15 return points on every year, including the final year
(averaged, not exact).

| case | gap, 5 points | gap, 15 points |
|---|---|---|
| S126 | −43.2 | −31.3 |
| S366 | −96.6 | −95.4 |
| bridge 4 | −91.3 | −86.0 |
| bridge 6 | −94.2 | −90.5 |
| share 0.95 | −72.7 | −72.7 |
| S360 | −33.6 | −34.0 |

None closed to within 10 points. The misread is in reading across the 6-point pension-share axis, as you argued, so better
averaging will not replace F1. **Variant B is the next build.** It joins our F1 replacement test as a fifth arm, beside
off, F1 v1, F1 v2 and F2 (a coverage coordinate in bridge years), with the final year exact in every arm.

**One oddity (not registered: not an item of this test):** at 15 points, S360's simulated survival rose from 34.4 to 36.4,
+2.00 ± 0.47 (net 20 of 22), while its table read rose from 0.8 to 2.4 (corrected 25 Sep after your reply: the gap barely moved, not the read). It could be the final year, since this test
did not hold it exact, or the earlier years. We will trace it before registering the F1 replacement test.

## 4. Your points on the objective and on testing

- **S versus B versus H.** On S194 the bets lose survival when made: −0.51 ± 0.11 at its first-bet positions. But with
  the option, S194 spends fewer years below target, which is worth +0.127 ± 0.039 survival points in the score's cut term. So
  per path, survival net of the cut cost changes by −0.140 ± 0.100, which is within noise (both not registered: derived
  from M14b's records afterwards, no prediction). Table error or deliberate trade is
  not yet told apart. Your full-score forced-first-move rollouts (S, B, H reported separately) are the planned next check.
- **Decision taken today:** the tier above is now a default only where a plan is thin. It is allowed only when the plan's
  simulated survival without it is below 85%, and kept only if the plan is no worse on the same paths.
- **Not yet adopted:**
  - a predeclared non-inferiority margin δ (we still use "no loss beyond two se", with whole-count ties);
  - the audit of per-world tables against the common weighted action;
  - your measurement audit of F1's reported gains.

## 5. What would help from you now

1. **Variant B on the share axis, concretely.** For a retired household in its bridge years, the state is (W, pension
   share α, gain β) with 16 or 30 wealth points and 6 share points. What should G_t be at each year? Is it a single
   accessible-money margin W(1 − α) against the remaining bridge need, or your two-margin Gaussian? And how should the
   margin's width shrink as the bridge ends?
2. **The runtime budget.** One solve takes about 5-6 minutes on this box at 16 wealth points and 5 return points, and about 2.5 times that at 15 return points (the 7i run). Is reference geometry per (t, world)
   slice cached across moves enough, or do you expect the anchors to be necessary?
3. **S360.** Does your framework predict that finer averaging would change a policy without moving the opening read? And
   where would you look first?
