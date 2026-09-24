# DRAFT - not registered. Test design: do the years before the last one need better averaging too? (the quadrature reference)

**Status:** drafted 24 Sep ~21:35 UK at the maintainer's request ("go ahead with planning the tests - but ... assess the
findings of m14c and O19, take them into account, and update the predictions and tests based on them before running").
It is NOT a registered prediction. After M14c (7f) and O19 (7g) are read, it is revised against their results
(section "To revisit"), written as `predictions/<name>.md` with the full fair-test table, committed and pushed, and only
then launched through the launcher. Nothing below is a result.

## Why

The solver averages each year over 5 return points. The final year is now exact (`finalIntegral`, O19). But every earlier
year averages next year's table read over the same 5 points, and near the end-of-plan line that table has a cliff about
V x sqrt(years left) wide in ln W (results-cliff-grid.txt; blurred-lines-brief.md section 5), while the outer points sit
1.36 V apart. So for the last few years before the end the average can still step across the cliff, one year earlier each
time and fading as the cliff blurs. The outside review's extension (a cliff template integrated exactly, the 5 points used
for the residual) would fix those years; it is worth building only if they matter.

## Part A - the diagnostic (cheap: one solve per household, no new forward simulation)

At the positions where the solver holds the tier above (from O19's `o19-ux` and `o19-u5` records; the same draw as M14c:
up to 40 first-bet positions per household), re-score every move with the next year's table averaged over 5 points and
over 41 points (Gauss-Hermite, the same tables), and report by years to the end:
- how often the best move changes between 5 and 41 points, and how often the change is into or out of the tier above;
- the size of the score change against the table's margin at that position.

**Draft prediction:** changes concentrated in the last ~6 years at Medium (the cliff narrower than a grid gap there,
results-cliff-grid.txt), rare before 10 years out; fewer with the final year exact than without, but not zero in years
T-1 to T-4.

## Part B - the reference arm (a full solve with near-exact averaging every year)

Arms: 15 return points in every year plus the exact final year, against O19's 5 points plus the exact final year, each with
and without the tier above; the plan held at Medium, M14b's settings. Households: S194, S162, S252 (M14b's lost bets) and
S330 (the bet helped). 15 points cost about 3x a solve (roughly 70 min each at M14b's pace): 8 solves, two rounds of four,
~2.5 h. Plus a 5-world arm (`MIX=5`, 5 points, exact final year, tier above) on S194 and S330: does the 3-world
approximation of the persistent shift matter?

**Draft prediction:** the reference arm changes survival by less than two paired se against 5 points with the exact final
year, on each household - the final year carries almost all of the averaging error. **Falsified if** it raises survival
beyond two se on any of the three, or shrinks the tier above's cost there beyond two se: earlier years matter, and the
template-residual averaging is worth building.

## Revised for M14c (22:28 UK; O19 still to come)

- **Record the full score, not only survival.** M14c measured survival only, but the solver trades survival against cuts
  (λ = 2 on S194 and S252). Part A's rollouts at each position also record years below target, total cut, the estate
  and the score (survival + estate credit − λ × cut cost − the charge for years without money (FAILSHORT: each year from
  a failure to the end at the floor's cut cost) + raise credit), so a bet that loses survival but wins on the score is
  told apart from a misread. This answers O20.
- **Positions at every horizon, at risk only.** S194's at-risk bet positions sit mostly 6 or more years from the end
  (results-m14c-horizon.txt); 17 of its 19 last-5-year positions survive for certain either way. Part A takes all
  at-risk positions (either choice below 100%), not only the last 6 years.
- **S162 (lambda 0.1) as a separate question:** 3 of its 7 lost paths bet and 4 never did (results-m14b-why.txt).
  A records-only check (no new run) compares, on paths that never bet, the everyday tier and level with and without
  the option (m14b-down against m14b-up, fair-tested first as a new question on old files, rule 3). This is O16.

## To revisit after M14c and O19 (before registering)

- If O19's exact final year already removes the tier above's cost on S194, S162 and S252: Part B's tier arms answer
  "is anything left?" - keep them, but the prediction is "no change". If O19 is FALSIFIED (the cost remains): Part B is
  the main question, and Part A shows where the remaining error sits.
- If M14c finds the bets were NOT wrong when made (betting simulates at least as well as staying): the losses come from
  later decisions, and Part A should score all positions in the last 10 years, not only first bets.
- Reuse O19's `o19-u5`/`o19-ux` files as Part B's 5-point arms only after fair-testing them (rule 3: a new question on old
  files is a new test); otherwise re-run them in the same batch.
- Pin the households and positions from O19's records before looking at Part A's scores.
- Re-estimate the time from O19's measured solve times (the exact arms' cost is unmeasured today).
