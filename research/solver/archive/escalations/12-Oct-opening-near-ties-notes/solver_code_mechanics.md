# Opening risk tier near ties: solver code mechanics at ff13828

Labels: **[PRODUCT]** = `solvePlan` with PRODUCT_BASELINE; **[CANDIDATE]** = `solveCandidate` with CANDIDATE_OPTS; **[BOTH]** = shared code. Links point to ff13828; "l." is a line in the same file.

## 1. Settings, and how each version chooses the year-0 move

### Takeaway
- **[PRODUCT]** The tables assume tier switching is free, and each world picks its own moves. The forward chooser starts every path in the plan's tiers (0/0). In every year, year 0 included, it keeps the held tier unless the best move that leaves it beats the best move that stays by more than 0.001.
- **[CANDIDATE]** The margin is 0, but every move that leaves the held pair pays a 0.001 charge, in both passes.
- **In year 0 both rules leave only when best leave − best stay > 0.001.** So "margin 0" does not free the opening; what differs is the score being compared.

### Cited Findings
- **[PRODUCT] Settings.** PRODUCT_BASELINE: resilienceWeight 0, raiseWeight 0.003, finalExact, mix 3, points 30, raiseSurvival, failureShortfall, finalIntegral, bridgeRead false, e3 false; `solvePlan` adds the tiers (unless riskConsent is false), productLevels, raiseCap 1.1 and the 'auto' tier-above rule — [solve.js:1863-1966](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/solve.js#L1863-L1966)
- **[PRODUCT] Switching.** With tiers on, `switchCost = F.SWITCH_COST`, `switchMargin = SWITCH_MARGIN`; jointWorlds (l.366), tierState (l.391), switchCharge (l.423, default 0) are off unless passed — [solve.js:366-423](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/solve.js#L366-L423). "a tenth of a survival point": `SWITCH_MARGIN = 0.001` (l.56-57).
- **[PRODUCT] Backward pass ("PASS 2, once per world").** Each world takes its own best move per cell: no held tier, money cost or margin. l.377: "Off, the backward pass solves every table as if the tier could be changed each year for nothing" — [solve.js:1189-1236](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/solve.js#L1189-L1236)
- **[CANDIDATE] Settings.** CANDIDATE_OPTS: bridgeRead 'reader', tierState, jointWorlds, bequestWeight 0.02, bridgeStep 'exact', switchCharge 0.001, switchMargin 0, plus RESEARCH_OPTS {e3, pclsInterp, e3pcls} (research-opts.mjs l.46); solved through `solvePlan` on a plan with O60's tier returns, so PRODUCT_BASELINE and 'auto' still apply — [candidate.mjs:42-73](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/candidate.mjs#L42-L73)
- **[CANDIDATE] Backward pass, per layer j (the pair held entering the year).** A leaving move pays `chargeSwitch` on the post-flow state, reads next year's layer of its own pair, and adds `h += switchCharge` (l.1110); TS+J takes one move for all worlds by Σ JW·score (l.1122-1135); the charge sits "in h, so the stored values carry every later switch's charge" (l.415-422) — [solve.js:1066-1135](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/solve.js#L1066-L1135)
- **[BOTH] The start.** `held = { pen: 0, isa: 0, gia: 0 }`, "the plan's until a move changes them" (l.1559); year 0 starts at the exact opening state (l.1552); each year calls `chooseAction(r, s, t, held)` (l.1571) — [solve.js:1546-1578](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/solve.js#L1546-L1578). Tier index 0 is the account's own tier (fast.js l.98).
- **[BOTH] `chooseAction`, in order** — [solve.js:1342-1428](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/solve.js#L1342-L1428):
  1. Scores moves per world with `held` (a leaving move pays the money cost), weights the worlds, −∞ if any world fails (l.1361-1370).
  2. Argmax (l.1382-1386).
  3. If `held && sc > 0`: subtracts the charge from leaving moves and redoes the argmax (l.1393-1400).
  4. If the best leaves and `bestScore - stayScore <= sm`: takes the best staying move (l.1401-1412).
  - `held` is never null in runPolicy, so the product's margin applies in year 0; O30: "the chooser starts in the plan's tier and applies the margin every year" — [PLAN.md:151](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/PLAN.md?plain=1#L151)
- **The freed opening (research only; no product option).** 7w's "/1e-3+open" and 7ab's FREED take the year-0 move at margin 0 and 0.001 after, via runPolicy's `choose` hook and `chooseAt(r, st, 0, held, 0)`, which sets `r.switchMargin` temporarily (l.616-645, l.1101-1122) — [audit-s126.mjs:616-1122](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/audit-s126.mjs#L616-L1122)
- **Other audit opening rules.** OPEN0 (7ac, 7ad, 7ae, P) uses `chooseAt(…, open0 ? Infinity : r.switchMargin)` to hold the plan's tiers in year 0 (l.1396); OPEN2 forces the best 2/2 move; WA knows its world (l.1574-1575) — [audit-s126.mjs:1396-1575](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/audit-s126.mjs#L1396-L1575)
- **The "year-0 gap" (`openGap`).** From runPolicy's own year-0 state, 40 bisection steps find the smallest margin at which the chooser keeps the plan's tier ('0' if kept at margin 0) — [audit-s126.mjs:661-672](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/audit-s126.mjs#L661-L672). P's gaps are "on top of any charge" (results-P.txt l.75).

### Inferences
- **The two rules agree in year 0 (derived).**
  - [CANDIDATE] leaves when best leave − 0.001 > best stay + 1e-12.
  - [PRODUCT] leaves when best leave − best stay > 0.001.
  - So year 0 has the same 0.001 threshold in both. The candidate's tables also price the later charges.
- **[PRODUCT]** Gaps at or below 0.001 keep the plan's tier (S126 8.0e-4, S194 7.6e-4). The knife edge is at 0.001, not at 0.
- **[CANDIDATE]** P's gaps net of the charge include 5.78e-5 (share 0.50), 1.47e-4 (share 0.90) and 0 (S360) — [results-P.txt:155-175](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/results-P.txt#L155-L175)

### Gaps
- The product has no option to free the year-0 decision or to tolerate a near-tie there. Every variant lives only in audit-script hooks.

## 2. How ties and near-ties are broken

### Takeaway
**[BOTH]**
- Comparisons are strict, with an exact-tie window of eps = 1e-12. Inside the window the larger expected bequest wins; failing that, the earlier move in the menu stays.
- The margin test is non-strict (`<=`), so equality stays put.
- The plan's tier pair comes first only within each withdrawal-order and spend-level group.
- The only tolerance in the code is the optional `tieMargin`, which picks the least tax this year. In the probe, any value from 1e-10 upwards changed every path's tax.

### Cited Findings
- **eps.** `eps` defaults to 1e-12. A larger value "lets any move within a point of the best on survival win on the bequest ... Here the tie must be exact" — [solve.js:466-477](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/solve.js#L466-L477)
- **The comparison everywhere.** `score > bestScore + eps || (Math.abs(score - bestScore) <= eps && b > bestB)`: the chooser (l.1385), the tier-state pass (l.1113), TS+J (l.1130), the product's per-world pass (l.1231). The stay rule `bestScore - stayScore <= sm` sits at l.1411 forward and l.1118, l.1133 backward — [solve.js:1113-1133](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/solve.js#L1113-L1133)
- **The menu order.** `buildActions` nests its loops in this order:
  1. pension prefix: none, the allowance, the basic limit, all;
  2. taxable before ISA, then ISA first;
  3. harvest: none, to the allowance, to the basic limit;
  4. spend level, with 1 first;
  5. tier pair, the plan's first.

  The code comments say the plan as written "comes first ... so a tie in the score goes to it", and that tier variants "share its flow" — [solve.js:112-137](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/solve.js#L112-L137). `tierCombos` yields (0,0), (1,1) and (2,2), plus the tier above if allowed — [solve.js:300-311](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/solve.js#L300-L311)
- **Tier variants share the cash flow.** A tier variant copies the post-flow state of its base move — [solve.js:1052-1063](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/solve.js#L1052-L1063)
- **`tieMargin` (off by default).** "Within `tieMargin` of the best score, prefer the move with the least tax this year; an exact tie there still goes to the larger bequest". It scans every move, after the charge and margin steps — [solve.js:1413-1426](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/solve.js#L1413-L1426)
- **The probe (probe-tailm.mjs).** ADOPT-PI's unit (product settings, no reader, lambda 0.02236, estate weight 0.02, 30 points, PCLSI) on share 0.90 and S130, 500 paths of seed 7002; `r.tieMargin` set after the solve to 1e-10 ... 1e-3 and compared path by path with 0 — [probe-tailm.mjs:1-46](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/probe-tailm.mjs#L1-L46)
  - At every margin the tax changed on 500 of 500 paths. Share 0.90: lost 0, saved 0-1, mean tax −£18,099 (1e-10) to −£71,240 (1e-3), net estate −£6.23M to −£4.69M on a £10.97M mean. S130: lost 7-8, saved 6, tax +£12,665 at 1e-10 — [results-probe-tailm.txt:2-17](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/results-probe-tailm.txt#L2-L17)
- **O100 (grade C).** "moves whose scores differ by less than the tables can resolve, decided by menu order or interpolation noise" — [PLAN.md:202](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/PLAN.md?plain=1#L202)
- **`rankActions`.** It sorts with `(SC[b] - SC[a]) || (BQ[b] - BQ[a])`, an exact comparison, and applies neither the margin nor the charge — [solve.js:1527-1537](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/solve.js#L1527-L1537)

### Inferences
- **"Rewrote the tax paid on every path", mechanically.** A positive `tieMargin` swaps each year's argmax for the least-tax move within the tolerance. Tax varies by withdrawal order and harvest while many scores sit within 1e-10 (survival saturated at 1, or above the bequest cap where `min(net, cap)` is flat), so every path's decisions change.
- **Tier pairs cannot be told apart by this year's tax** (shared flow); inside the tolerance they fall to the bequest, then menu order. Untested reading: as `tieMargin` runs after the margin step, it can pick a leaving move within the tolerance.
- **An exact tie between tier pairs** at the same withdrawal move and level goes to the larger weighted bequest, then the plan's pair; across withdrawal groups the earlier group wins.

### Gaps
- No probe ran `tieMargin` with the tier state, with the charge, or in year 0 only.

## 3. The score being compared

### Takeaway
**[BOTH]**
- The score is survival + wR·resilience + wB·bequest − h. h carries the cut, raise and failure costs, plus the charge in the candidate.
- The product sets wR to 0.
- The estate term is 0.02 × E[min(net, 4·W0)]/W0, where W0 is the opening wealth. The app's estate slider would replace it with a log curve above the minimum pot, at weight 0.01 or more.
- Survival, bequest, resilience and h are separate tables. A score of 0.001 equals 0.1 point of survival.

### Cited Findings
- **The formula.** `SC = sv + wR*rs + wB*bq - h` — [solve.js:1517-1519](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/solve.js#L1517-L1519); the backward pass uses the same form at l.1112.
- **Weights and bequest shapes.** `scale` = opening wealth; `wB` = bequestWeight (default 0.02)/scale; `beqCap` = 4·scale (l.502-506). 'cap' is `min(net, cap)`; 'logfloor' is `estS·ln(1 + (net − minPot)/estS)` above the minimum pot; 'soft' also exists (l.535-541) — [solve.js:502-541](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/solve.js#L502-L541)
- **[PRODUCT]** The slider `estateWeight` switches to 'logfloor' at `max(0.01, estateWeight)`; unset, the 0.02 'cap' default stays (solve.js l.1959). **[CANDIDATE]** passes `bequestWeight: 0.02`, so 'cap'; logs show "scale 950000 cap 3800000" (results-7v-timing.txt l.13).
- **The end pot.** The plan's own `solvencyFloor`, else `minPotYears` (default 1) × target (l.1950-1953); at T a path is alive only if `!(floor > 0 && total < floor)` (scoreMoves l.1494; backward l.1093, l.1212) — [solve.js:1950-1953](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/solve.js#L1950-L1953)
- **Cost terms.** Trim λ(1 − level)²; raise credit μ·√min(0.2, level − 1), μ = raiseWeight (0.003 in the product); drift weight 0 by default (l.594); raiseSurvival weights the raise credit by survival (l.1481); a failing move costs `failCostAt[t]`, the remaining years at the floor level's trim cost (l.836-843) — [solve.js:558-594](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/solve.js#L558-L594)
- **Separate tables.** `surv`, `lsurv`, `resil`, `lresil`, `beq`, `short` (h) and `pol`, per world and per layer under the tier state (l.613-623); `scoreMoves` returns survival alone via `SV` (l.1453-1462) — [solve.js:613-623](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/solve.js#L613-L623)

### Inferences
- **What can differ between two tier pairs at the same move and spend** (derived). The flow, the tax and the level's own cost are identical. What differs:
  1. the money switch cost, which reduces the post-flow pension and ISA;
  2. growth at the tier's rates;
  3. next year's survival, bequest and h reads; h covers future trims, raises and failure;
  4. the raise credit × survival;
  5. [CANDIDATE] the 0.001 charge.
- **The scale (arithmetic).**
  - 0.001 = 0.1 point of survival. At weight 0.02 with the cap shape, it also equals 5% of W0 in expected capped bequest.
  - One year's trim to 0.8 at λ 0.0224 costs 8.9e-4; one year's raise to 1.1 earns about 9.5e-4. Both are the same size as the year-0 gaps.

### Gaps
- No committed file splits the panel's year-0 gaps into their survival, estate and h parts. 7ad split them into whole and survival only, and O105 suspects a non-survival term (PLAN.md:202).

## 4. The tier menu and the price of a switch

### Takeaway
- The menu is 0/0 (the plan's tiers), 1/1 and 2/2 steps down, with the pension and ISA moving together. The product's 'auto' rule may add one step above for thin plans.
- **[PRODUCT]** uses linear-blend tier returns. **[CANDIDATE]** uses O60's blend medians, as plan inputs.
- A switch costs 0.25% of the slice traded. For a 2-step de-risk that is about 0.1% of the pension and ISA, worth roughly 1/50 of the 0.001 charge in score terms.

### Cited Findings
- **The tiers.** `tiersFor` returns the plan's tier, then up to two below along High, Medium/High, Medium, Medium/Low, Low, Cash; tiers above go after these — [fast.js:79-126](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/fast.js#L79-L126). The library's tiers: pension High, ISA Medium/High, taxable Medium (research/policy-study/scenarios.mjs l.26).
- **The 'auto' rule** allows the tier above only with consent, only where the plan is thin (below 85% on 1,000 paths of seed 7101), and only if no worse on those paths — [solve.js:1911-1942](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/solve.js#L1911-L1942)
- **Equity weights and the default CMA.** Equity 0.90, 0.70, 0.50, 0.30, 0.10, 0 (l.160-163). Default source `blackrock2026` (l.218); nominal / volatility / sigmaParam: High 7.41/17.10/2.14, Medium/High 6.85/13.42/1.69, Medium 6.28/9.93/1.31, Medium/Low 5.72/6.89/1.03, Low 5.16/5.19/0.97 — [App.jsx:160-235](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/App.jsx#L160-L235)
- **O60, real returns, linear (the model) against blend median:** High 4.79/4.97, Medium/High 4.24/4.65, Medium 3.69/4.18, Medium/Low 3.14/3.55, Low 2.59/2.76; the de-risk's step falls from 1.10 to 0.79 points a year — [results-o60.txt:1-9](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/results-o60.txt#L1-L9)
- **Item 8's option.** It is the tier set '@logblend' in audit-7ai.mjs, where `realOf('logblend')` returns the blend median — [audit-7ai.mjs:12-114](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/audit-7ai.mjs#L12-L114). In the candidate it is `CANDIDATE_TIERS = 'o60-blend'`, applied by candidatePlan as "a change to the plan's inputs, not a solver option" — [candidate.mjs:26-66](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/candidate.mjs#L26-L66)
- **The money cost.** `SWITCH_COST = 0.0025` of the slice (wrapper × |Δequity|), charged at decision time — [fast.js:128-146](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/fast.js#L128-L146)

### Inferences
- **The library's 0/0 to 2/2 move** (arithmetic):
  - the equity change is 0.40 on both wrappers, so the money cost is 0.1% of each;
  - through 0.02 × capped bequest / W0, that is worth at most about 2e-5 of score;
  - so the 0.001 charge, not the money, is what holds a tier in the candidate.

### Gaps
- None material.

## 5. Snaps, interpolation and the half-step test (item 4)

### Takeaway
- **Interpolated:** total wealth (log axis) and the two shares (linear axes).
- **Snapped:** the gain fraction, to the nearest of 3 buckets [BOTH]; the allowance used, in the [PRODUCT]. The [CANDIDATE] interpolates the allowance.
- **The tier pair** is an exact layer, neither snapped nor interpolated.
- **7am's half-step test** perturbs the tier returns. Its sign-blind part did not shrink at half the step on 6 of 7 households.

### Cited Findings
- **Interpolated and snapped axes.** `locateVec` reads wealth on the log axis and shares a, b on linear axes (l.252-267); `interp` is trilinear (l.602-612). Gain buckets [0.05, 0.25, 0.55] (l.104) go by `nearest` unless `gainInterp`, set by neither version (l.158-163, l.260-262); allowance buckets [0, 0.5, 1] (l.105) go by `nearest` or are bracketed under `pclsInterp` (l.255-258), a research default only (research-opts.mjs l.20-28) — [grid.js:104-612](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/grid.js#L104-L612)
- **`nearestIndex`** rounds each axis at weight 0.5 (l.1814-1828) and serves only stored moves: `stored` mode (l.1571), `policy()`, and the final year when finalExact is off (l.1353; both versions set it on). The tier state reads `r.tsLayers[r.tsLayerOf[ai]]`, an exact layer (l.1505-1507) — [solve.js:1814-1828](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/solve.js#L1814-L1828)
- **The snaps the reviews named:** gain and allowance by `nearest`; "nearestIndex still snaps the allowance at 0.75 for stored policies"; 6 share and 5 quadrature points — [deep-review-log.md:57](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/deep-review-log.md?plain=1#L57). The ranking after 7aq: "(B2) interpolation and argmax kinks of the 30x5 solve, (B1) the nearest snaps, (C) the reader's reassembly" — [items/O67.md:5](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/items/O67.md?plain=1#L5)
- **The half-step test (audit-7am.mjs).** It shifts each tier's real return, a plan input: 'logblend' (the O60 median), 'reversed' (linear − (blend − linear)), 'halfblend', 'halfreversed'; on P (READER/TS+J, charge 0.001, margin 0) and the bundle (READER/TS+J/W0.02, margin 0.001), 30 points, seed 7002 — [audit-7am.mjs:1-77](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/audit-7am.mjs#L1-L77)
  - Output: each set's year-0 gap, split into a following part F = (B − R)/2 and a blind part C = (B + R)/2 − L, with q = |C at half| / |C at full| (about 0.25 if smooth to second order) — [reduce-7am.mjs:25-33](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/reduce-7am.mjs#L25-L33)
  - Results: S126's gaps (linear, blend, reversed, two halves) 1.0600e-3, 1.2191e-3, 1.6147e-3, 1.5461e-3, 1.8649e-3, q 1.81. "ITEM 3 ... q 0.4 or more on 6 of 7 ... HELD" — [results-7am.txt:12-23](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/results-7am.txt#L12-L23)

### Inferences
- In the forward chooser, snaps act only through next year's reads: the gain bucket in both versions, and the allowance in the product. The year-0 choice itself is never a stored-cell lookup.

### Gaps
- No test isolates the gain-bucket snap. The review marks it "NOT CHECKED".

## 6. Under tier state, joint worlds and the charge: storage, forward re-scoring, agreement and item 5

### Takeaway
- **[CANDIDATE]** Each world stores its own components of the single joint move, layer by layer. The forward chooser re-scores at the exact state through the same layer reads, so the forward and backward rules agree in form.
- **[PRODUCT]** The forms differ. The backward pass is per-world with free switching; the forward pass is the mixture with the money cost and the margin.
- **Item 5's "stored decisions"** are the move stored at the nearest grid cell, in the held layer, in world 0's table.

### Cited Findings
- **Storage and re-scoring.** Layer `tsJ0` (the plan's pair) is each world's main table (l.620-623); under TS+J each world's layer stores its own s, b, rs, h and the joint move (l.1122-1135). Each world's view carries `tsLayers: layW[k]` (l.1317); `scoreMoves` runs the exact flow, the money cost, 5-node Gauss-Hermite growth (or `stepExpect` in reader step years), then `readValues` on the move's next-year layer — [solve.js:1471-1516](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/solve.js#L1471-L1516)
- **Item 5 (7ae).** For years 1 to 10, among paths still in the plan's tiers, the forward move is compared with `tab.tsLayers[j].pol[t][nearestIndex(r.g, st)]`, `tab = r.mix.tables[0]` — [audit-s126.mjs:1343-1399](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/audit-s126.mjs#L1343-L1399). At margin 1e-3 the forward move holds where the cell leaves on 21.44% of held path-years (14,168 of 66,085), 6.41% the reverse, 0.00% at margin 0; 13.52% in odd years, 36.06% in even (l.155) — [results-7ae.txt:138-142](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/results-7ae.txt#L138-L142)

### Inferences
- **[CANDIDATE] The passes agree** on the weighted score, the money cost and 0.001 charge (weights sum to 1, so the charge is equal either way), the next-layer read, margin 0 and the tie rule. They differ only in the evaluation point (exact state against node) and in failure (−∞ forward, s = 0 with h = failCostAt backward), minor since the flow, and so failure, is the same in every world.
- **The 21% in item 5 measures the chooser against a nearest-cell lookup.** So part of it is the stored-move snap, not disagreement between the tables.

### Gaps
- 7ae ran TS+J at margins 1e-3 and 0, not with the charge. I did not trace the brief's "net 6.5 points" under the charge to a file.

## 7. Costs, gate 5 and determinism, with each remedy's cost

### Takeaway
- **Gate 5:** the candidate, split across 4 cores, may take at most 1.25 times the product's one-core solve. It measured ×0.784, which leaves about 0.47 of a product solve, roughly 165-175 s.
- **Solve times:** a 30x5 product solve takes about 230-380 s. 60 points takes about ×2.1, 15 return points about ×2.4, and 120 points took 5,046 s on S380.
- **Forward runs:** about 62 s per 1,000 paths (product, 30 points).
- **Determinism:** the backward solve and the seeded paths are deterministic on one engine. Bit-identity across engines is not assured.

### Cited Findings
- **Gate 5.** "at most 25% more time than today's product solve (the same household, settings and machine load)", in wall-clock, the candidate split across 4 cores (E2) against the product on one; premise (grade D): the app's pool uses the reported cores, or 2 — [PLAN.md:1377-1385](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/PLAN.md?plain=1#L1377-L1385)
- **E2X (30 points, 4 households):** PRODUCT on 1 core 347-377 s; CAND on 1 core 997-1,260 s (×2.995); SPLIT on 4 cores 239-294 s (×0.784); "E2: EXACT", "GATE 5 ... MET" — [results-e2x.txt:3-13](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/results-e2x.txt#L3-L13). Absolute times drift up to about 3 times between batches; ratios hold (O120, PLAN.md l.217).
- **The forward run (7v; product settings, S126, 30 points).** The solve took 232 s; each forward run of 1,000 paths took 61-64 s — [results-7v-timing.txt:9-20](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/results-7v-timing.txt#L9-L20)
- **[CANDIDATE] 120 points.** S380 took 5,046 s with a peak of 1.09 GB; forceIdentity on 40 paths took 35 s — [results-negrid-c-measure.txt:3-6](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/results-negrid-c-measure.txt#L3-L6)
- **60 points.** "60 points took 2.07-2.17 times the 30-point solves, about 1.6-1.7 times today's product solve ... outside gate 5's 25%; about 40 points fits" — [deep-review-log.md:153](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/deep-review-log.md?plain=1#L153)
- **"30x15" is 30 wealth points × 15 return (quadrature) points.** batch-7ad.sh reads "at 30x15 and at 60x5 (wealth points x return points)", so the brief's "share points" is wrong — [batch-7ad.sh:6](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/batch-7ad.sh#L6)
- **15 return points.** Solves took ×2.3-2.7, e.g. S126 at 316 s against 755 s — [results-bridgequad.txt:6-12](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/results-bridgequad.txt#L6-L12)
- **The P batch:** TS+J solves at 30x5 took 699-814 s (results-P.txt l.76-84).
- **Paths.** `pathsForSeed` builds path i from `(seed + i*7919)` with years + 2 draws, by mulberry32 and Box-Muller (`Math.log`, `Math.cos`); the last draw is the path's long-run shift (solve.js l.1555) — [App.jsx:1497-2685](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/App.jsx#L1497-L2685) (l.1497-1515, l.2681-2685). [PRODUCT] already simulates on a fixed seed: the 'auto' rule runs 1,000 paths of seed 7101 (solve.js l.1928-1942).
- **Determinism evidence.** "Backward induction has no sampling noise" — [solve.js:470](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/solve.js#L470); E2 is bit-identical (above); NE-GRID C hashes the survival bits and checks that forcing the candidate's own opening reproduces its unforced run (audit-negridc.mjs l.14-16). Across engines, Node 20 (V8 11.3) and Chrome 149 gave different `Math.sin`/`Math.cos` bits (a third-party report, not the spec) — [codeberg bounce #8](https://codeberg.org/perplexdotgg/bounce/issues/8)
- **Where it runs.** The app's Monte Carlo runs in Web Workers, up to `navigator.hardwareConcurrency` or 2 (App.jsx l.7131-7135); the solver worker (Phase 7, `src/solverWorker.js`) is planned and absent — [PLAN.md:1432-1447](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/PLAN.md?plain=1#L1432-L1447)

### Inferences
- **A forward path-year costs about 1.5 ms** on 7v's machine: 62 s / (1,000 paths × about 40 years). S126's 39.96 tier-below years imply T + 1 ≥ 40.
- **The time each remedy may add under gate 5:**
  - [PRODUCT]: 25% of a 230-380 s solve, about 58-94 s.
  - [CANDIDATE]: about 165-175 s of wall-clock over SPLIT, or about 4 times that in core-seconds if parallel.
- **The remedies' costs** (derived; "deterministic" means on one engine):

  | Remedy | Extra solves | Extra path-years | Wall-clock against gate 5 | Deterministic |
  |---|---|---|---|---|
  | **Tie threshold keeping the plan's tier** (year 0; OPEN0 is τ = ∞) | 0 | 0 | One comparison, already computed by the margin code | Yes |
  | **Monte Carlo re-rank of the top k on common random numbers** (`rankActions`, `start.firstAi`, `pathsForSeed`) | 0 | k × N × T, ×3 if world nodes are forced as in the audits | k = 2, N = 1,000: about 124 s on 1 core, over the product's 58-94 s; about 31 s on 4 cores | Yes, on a fixed seed; the 'auto' rule is a precedent |
  | **Smoothing**, e.g. averaging the year-0 scores over m shifted states | 0 (or one half-grid solve, via `r.rich`) | 0 | About m × 360 × 3 × 5 reads: negligible | Yes, if not random |
  | **Unanimity across grid variants** | 1 or more per variant: 60x5 ×2.1, 30x15 ×2.4, a shifted 30x5 ×1 | 0 | Any extra 30-point solve breaks both budgets unless split or cut | Yes |

- **A re-rank on N paired paths resolves only gaps of order √(saved + lost)/N.** It catches S360-sized harms (9 saved against 497 lost of 8,000), not true 1e-4 gaps.

### Gaps
- No committed per-path timing exists for the candidate's forward runs at 30 points; the case logs are gitignored.
- No candidate-only timing exists for 30x15 or 60x5.

## 8. What the product UI shows

### Takeaway
- The shipping app does not run the solver, so no UI shows a recommended opening tier or later switches.
- The plan's tiers are the user's own choice, set in Plan Inputs.
- The planned UI offers natural places for a near-tie note.

### Cited Findings
- **The app has no solver.** No app file imports src/solver; `src/solverWorker.js` and `src/solver/index.js` are absent (repo listing). The engine has only the `policyOverride: { kind: 'table', choose }` bridge: "Each account's tiers are the one set on Plan Inputs and up to two below it, never above" — [App.jsx:1843-1866](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/App.jsx#L1843-L1866)
- **Phase 8 (planned):** "What the solver aims for", including "consent to change investment risk"; "What the solver may change", the locks with the equity ceiling per wrapper beside the tier from Plan Inputs — [PLAN.md:1462-1468](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/PLAN.md?plain=1#L1462-L1468). With `riskConsent` false there is no tier menu (solve.js l.1963).
- **Phase 9 (planned):** "This year's actions", e.g. "Move the ISA to the Medium tier", each "with the survival cost of skipping it, **measured by simulation** (take the next-best move this year, then follow the plan: the ranking check's method)"; a ten-year action strip; "Come back next year" — [PLAN.md:1470-1494](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/PLAN.md?plain=1#L1470-L1494)

### Inferences
- Phase 9's simulated skip cost is in effect a top-2 re-rank on common random numbers. A year-0 near-tie would show there as a near-zero cost, which makes it the natural place for a "near-tie" note.

### Gaps
- I did not check whether the app's table bridge can carry out a tier above the plan (the 'auto' rule's index 3); its profiles list only the tiers below.

## 9. Research tools that already support the remedies

### Takeaway
- Every remedy can be prototyped without changing the solver, except a smoothing rule.
- The tools exist for forced openings, custom choosers, per-year margins, top-K ranking, paired paths with saved and lost counts, grid dials, and Richardson's second solve.

### Cited Findings
- **`runPolicy`'s hooks:** `start {t, s, held, firstAi}`, `choose`, `stored`, `visit`, `trace` (solve.js l.1546-1574; section 1). Richardson `r.rich` takes a second solve at half the points and scores 2·score(n) − score(n/2) (l.1371-1381); `holdTier` holds one pair for life (l.337-342); `quadNodes` (l.449); `tieMargin` (section 2) — [solve.js:337-1574](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/solve.js#L337-L1574)
- **The ranking check (step 2b).** It takes the table's top two moves at positions the plan reaches and simulates each ("take that move now, follow the solver afterwards") on the same fresh paths — [audit-ranking.mjs:1-14](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/audit-ranking.mjs#L1-L14). Of 479 positions, 387 identical; of the rest "8 better, 8 worse"; clear-margin positions never sampled — [PLAN.md:563](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/PLAN.md?plain=1#L563)
- **Forced openings across grids.** NE-GRID C forces P (0,0) and D (2,2) in year 0 at each world's node, at 30, 60 and 120 points, on 4,000 or 16,000 paths a world, and hashes the bits — [audit-negridc.mjs:160-168](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/audit-negridc.mjs#L160-L168). Paired readouts give saved/lost, the difference and its 95% interval (results-P.txt l.86-100). `chooseAt`/`openGap` are at audit-s126.mjs l.645-672.
- **Grid dials:** `points`, `shares`, `hiYears`, `headroom` (the last two move the axis top, and so every geometric node), `gainBuckets`, `pclsBuckets` — [grid.js:86-121](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/src/solver/grid.js#L86-L121). XAS swapped openings between arms: "BASE with COV's opening 5971 to 5968 of 6000, COV with BASE's 5960 to 5971" (PLAN.md l.202).

### Inferences
- **A unanimity rule** can be prototyped by solving each grid and comparing their year-0 `chooseAction` or `rankActions` picks at the same opening state.
- **A Monte Carlo re-rank** is the ranking check restricted to year 0, run with the forced openings the audits already use.

### Gaps
- There is no dedicated node-shift option. `hiYears` and `headroom` also move the top of the axis.
- No tool runs one grid's whole forward policy on another grid's tables; only openings are swapped between them.

## 10. Changes between 8654333 and ff13828, and the standing constraints

### Takeaway
- None of the 34 commits touches the chooser, the switching rules or the ties.
- The only source changes are NE-GRID C's reader probe hook and an optional reader support line.
- escalation.md set up this escalation process.

### Cited Findings
- **The source changes**, all in [fb6f99a](https://github.com/AnginSemilir/monte-carlo-retirement-planner/commit/fb6f99a): grid.js adds `READER_PROBE` ("null in every product path"); reader.js and solve.js add `readerSupportLine` (default 0.5).
- **escalation.md** (dc7e3e0, 500bbd1, 6733335, b0f2b96, ff13828): "the maintainer's own run is the default", the agent a fallback after an hour; this brief is logged under trigger 2 — [escalation.md:38-63](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/escalation.md?plain=1#L38-L63)
- **Standing constraints, noted but not judged:**
  - "No mortality, no annuities, no regime belief." — [PLAN.md:406](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/PLAN.md?plain=1#L406)
  - A synthetic fixture is used, "never the maintainer's own household" (PLAN.md l.401-402).
  - After a pass on all five gates, "the maintainer decides whether it ships" — [PLAN.md:1387](https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828/research/solver/PLAN.md?plain=1#L1387)

### Inferences
- The earlier notes' chooser and switching facts, written at 8654333, still hold at ff13828. The line numbers given here are the current ones.

### Gaps
- None material.
