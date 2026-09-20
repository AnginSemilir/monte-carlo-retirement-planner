# The solver: a state-dependent plan in place of players and policies

*Plan of record. Research phases first, each with a gate; nothing in the app changes until phase 4's gate passes.*

## What changes, in one paragraph

Today the app answers "what should I do" with hand-written rules and searches over them: 18 draw-order
and harvest combinations on the Config tab, a tournament of named saving shapes on the Strategy tab, an
evolver for bridge households, and three separate rules for spending (guardrails), known costs
(lookahead) and surplus (harvest). The solver replaces that decision layer with one policy, solved by
backward induction over the household's state, that says for every year and every wealth position what
to contribute where, what to draw from where, what to re-wrap, and which risk tier to hold. The tax
engine, the simulation, the reporting and the inputs stay. The person sees two plans side by side, theirs
and the solved one, and gets this year's actions, the rule of thumb behind them, and the cost of not
following them. The app becomes an annual review: come back with real balances and it re-solves.

Flexible spending is Part D, after the app has switched over, with its own inputs, objective and
reporting rule. Out of scope altogether, each a plan of its own if ever wanted: gifting as an action
(needs the seven-year clock as state), retirement age as an action, mortality, annuities, a regime
belief, and any change to the return model.

---

## Working conventions for whoever builds this

These are the rules this repository already runs on. They are not optional and none of them is
repeated in the phases below.

- **Branch and merge.** Develop on the session's designated branch. Merge to `main` with
  `git merge --no-ff` only after `bash research/ui-harnesses/run-all.sh 4173` prints
  `ALL REQUIRED GREEN`; that script builds, serves on the port given, runs every required harness and
  then every engine test. Never merge on a partial run. Commit after each gate passes, with a message
  that says what changed and why in prose; end it with the attribution lines the session provides, and
  never put a model identifier in a commit, a comment or a pushed file.
- **The engine is a slice, not a copy.** Everything from after the lucide-react import in
  `src/App.jsx` down to the single one-line `export { … }` is the engine, and `python3
  research/build-engine.py` slices it into `research/engine.mjs` (git-ignored) for the tests and
  studies. So: no JSX and no React in that region; any new engine function must be added to BOTH the
  `const E = { … }` map (App.jsx, one line, currently near line 6426) and the `export { … }` line, or
  the app sees `E.name` as undefined while the tests pass. `src/solver/` is a separate module the
  engine must not import at module level (the app imports it lazily); the studies import it directly.
- **Tests.** Engine tests are `research/tests/*.test.mjs`, plain node scripts printing PASS/FAIL lines
  and exiting non-zero on failure; `npm run test:engine` runs them all after rebuilding the slice.
  Harnesses are `research/ui-harnesses/*-ui.cjs`, Playwright from `/tmp/node_modules/playwright` with
  `executablePath: '/opt/pw-browsers/chromium'`, each with `open`, `tab` and `ok` helpers at the top
  and a fixture plan seeded through localStorage; a new harness is registered in `run-all.sh`'s
  `REQUIRED` list. The load-perf harness holds a 220 KB gzipped ceiling on the entry chunk and a
  typing-latency ceiling; both stand throughout.
- **Golden comparison is the method.** Every engine change in this repository has been proved by
  running the same households through the old and new code and diffing, and every study reports
  held-out figures. Do the same: the reference for "what the engine does" is `simulateDeterministic`
  and `monteCarlo` on `research/engine.mjs` built from `main`, kept in the scratchpad as
  `engine-main.mjs`, never a hand-written expectation.
- **Households come from the library.** `research/policy-study/scenarios.mjs` builds 420 households;
  the FIRE cohort is those under 45 with `retireAgeSelf` set to 52; the cost variants are built as in
  `research/policy-study/lookahead-study.mjs`. The versus protocol is `research/policy-study/versus.mjs`
  and its comment header is the specification of a fair comparison. Use `RATE_EPSILON_PTS` from the
  engine as the tie threshold everywhere; never invent one.
- **The person's own household is not a fixture.** No test, harness or study fixture may carry the
  maintainer's real figures; invent households.
- **Phones are first-class.** Anything on the Strategy or Projection tabs is checked on the phone
  harnesses too, with 44px targets and no horizontal scroll.
- **Words.** UI copy in the same voice as the existing tabs: plain sentences, no jargon without the
  glossary, numbers labelled as today's money. New copy is added to the editable-copy manifest the
  edit mode reads.

---

## Part A. The research build (phases 1 to 4)

All of it lives under `research/solver/` and `src/solver/`, imports the engine through
`research/engine.mjs` exactly as the studies do, and touches nothing the app renders. Each phase has a
gate; a failed gate stops the plan, not the app.

### Phase 1. The reduced model: `src/solver/model.js`

A pure one-year transition the solver can call tens of millions of times.

**State** (per person, all in today's money, all on a log grid):

| Field | Kind | Points | Note |
|---|---|---|---|
| `pen` | pension balance | 20 | uncrystallised and crystallised together |
| `isa` | ISA balance | 20 | |
| `tax` | taxable side: GIA plus cash above the buffer | 20 | cash buffer is a rule, not state |
| `gainFrac` | GIA unrealised gain as a fraction | 3 buckets | 0–10%, 10–40%, over 40% |
| `pclsFrac` | uncrystallised fraction of the pension | 3 buckets | phased draws crystallise a quarter; the cap applies |
| `mpaa` | MPAA triggered | 2 | taxable pension drawn while still able to contribute |
| age | | one table per year | |

Couples: the same per person; the funding split is an action (Phase 5).

**Not state, and why:** cash below the buffer (rule), the cost calendar and the State Pension
(functions of age, in the transition), carry-forward of unused allowance (a rule: three years' history
approximated by the current year's allowance plus the prior year's unused), guardrail multiplier (the
solver assumes guardrails off), spend target (a parameter; see the spend dimension in Phase 6).

**Actions, working years** (surplus after spending and the cash buffer is the budget):

| Lever | Choices | Dominance rule that prunes the rest |
|---|---|---|
| pension contribution | none · to the basic-rate relief limit · to the higher-rate relief limit · to the annual allowance | relief has three marginal values, so only the breakpoints can be optimal |
| ISA | the remainder up to the allowance | paying into the GIA with ISA room left is dominated |
| Bed and SIPP | off · on | a transfer of ISA into pension up to the relief limit |
| risk tier per wrapper | the tier set on Plan Inputs and up to two below it (Phase 6) | never above the person's own ceiling |

**Actions, drawing years:**

| Lever | Choices |
|---|---|
| pension ceiling | none · personal allowance · basic-rate limit · higher-rate limit · whatever the year needs |
| GIA disposal | to the CGT exemption · not |
| re-wrap the surplus into the ISA | on · off |
| lump sum | take the tax-free cash now · phased (a one-time switch that moves `pclsFrac`) |
| risk tier per wrapper | as above (Phase 6) |

Breakpoints beyond the obvious three that the pension ceiling list must include: the tapered personal
allowance (60% effective between the taper start and end), the CGT rate step at the basic-rate limit,
the lump-sum allowance cap, and one midpoint per band, because the value function is not linear between
breakpoints even though the tax is. Scottish and Welsh bands come from `taxParams` as today.

**Transition:** `step(state, action, z, ctx) → { next, tax, fail }` where `z` is the market-factor
node. The year's spending need, State Pension, other incomes, the cost calendar, planned gifts and
one-off deposits come from the same `buildContext` the engine uses, so the reduced model and the engine
read one plan. Returns: one market factor with the equity weight per tier from `RISK_EQUITY_WEIGHTS`,
five Gauss-Hermite nodes; the per-path expected-return shock is folded into the variance. Tax per year
is a precomputed piecewise-linear table per person (`taxTable(ctx, year)`), so a tax evaluation is two
lookups and a multiply.

**Gate 1, `research/tests/solver-model.test.mjs` — BUILT, and stricter than this plan first drafted.**
The first draft allowed 1.5% per wrapper, on the assumption that the state collapse lived in the model.
It does not, and should not: the collapse (cash merged into the taxable pot, the gain fraction in three
buckets, returns as five nodes) is a property of the solver's GRID, so it belongs in `grid.js` where
its cost is measured on its own. The model keeps all four pots per owner, calls the engine's own tax
functions, and follows the engine's order, so under a fixed action it must agree **to the pound**.
That makes this gate a bug detector rather than a tolerance negotiation: if the model ever drifts from
`stepYear`, it names the year.

Measured: 29 assertions, 200 household-policy pairs across the library and the five named policies,
20 couples, and one case each for the lump sum, both harvest ceilings, a large one-off cost, an
external and an internally-funded deposit, a Scottish taxpayer, spend bands, a household already in
drawdown, a pre-access bridge, and four draw orders outside the named five. **Worst difference £0.00
everywhere.** It also pins the gain-fraction invariant (a GIA sale leaves the fraction unchanged;
only a deposit at cost and growth move it), which is what makes the grid's three buckets meaningful,
and the two refusals below.

**What the model refuses**, with the reason in the error: guardrails on and the cost lookahead on. The
solver plans at the full spend and sees costs through the calendar, so neither rule has anything to do
inside it; `prepare(E, plan, { allowUnsupported: true })` is the escape for a caller that knows.

**Deferred to Phase 2, on purpose:** the precomputed piecewise-linear tax tables and the flat typed
state. Fidelity first; the model is already 1.5x the engine's speed on a 40-year run simply by not
assembling an audit row, and this gate is what will prove the fast versions changed nothing.

### Phase 2. The single-person solver: `src/solver/solve.js`

- **Backward induction** from the terminal age over the state grid, one table per year, values in
  `Float32Array`, actions in `Uint8Array`.
- **Objective:** a two-component value, survival probability and expected terminal wealth net of death
  tax, combined lexicographically (survival first, bequest as tie-break within `RATE_EPSILON_PTS`).
  Solve for the three priority presets at once by carrying the components separately and combining at
  action selection with the preset's weights, so switching prioritisation in the app is instant.
- **Post-decision state:** the value after the action and before the return is stored once, and the
  five-node expectation is taken over it, so the return integral is per post-decision state, not per
  state-action pair.
- **Bounds:** per year, a binary search on total wealth for certain success (pays every remaining year at
  zero real return through the worst tax route) and certain failure (cannot pay next year). Only the band
  between is solved.
- **Reachable band:** a 400-path forward run under the current pipeline's policy gives the 0.5th to
  99.5th percentile per wrapper per age, padded by a factor of two each way; states outside it are not
  solved. A post-solve check re-runs the solved policy forward and asserts it stayed inside.
- **Interpolation** in logit space for the survival component, linear for the bequest component.
- **Monotone scan:** for each state, start the action scan at the neighbouring lower-wealth state's
  optimum (pension ceiling and contribution split are non-decreasing in the respective wealth).
- **Incremental re-solve:** tables are keyed by the year they describe and the hash of the inputs that
  affect that year and later. A balance edit changes no table (lookup only); a spend, age, cost or
  contribution edit re-solves from the earliest affected year.
- **Budget:** single person, 20 points per wrapper, 3×3×2 buckets: 144,000 states per year, 45 years,
  about 25 actions, 5 nodes. Target under 4 s in one worker on a desktop and under 10 s on a phone,
  measured in Phase 2's test; if the phone misses, the phone grid drops to 14 points per wrapper.
- **Output:** `{ tables, policy(state, year) → action, value(state, year), meta }` where `meta`
  records the band, the grid, the version of the model, and the solve time.

**Early signal, before Phase 3:** `research/solver/insample.mjs` scores, inside the reduced model
only, the solved policy against the current pipeline's winning policy on ten library households. It is
in-model and cannot pass any gate, but if the solver is not clearly ahead even on its own terms, the
plan stops here rather than after the bridge is built.

**Convergence, measured — the result that says this is worth continuing.** The first solver lost to
the best fixed rule. Three single-person households, scored in-model on 600 held-out paths, with the
certain-success shortcut off so it could not confound the reading:

| grid points | solved minus fixed, mean | S140 | S280 | wins / ties / losses |
|---|---|---|---|---|
| 8 | −1.50 | −3.5 | −1.0 | 0 / 2 / 1 |
| 10 | −0.83 | −2.3 | −0.3 | 0 / 2 / 1 |
| 12 | −0.39 | −2.3 | +1.2 | 1 / 1 / 1 |
| 16 | **+0.61** | −0.7 | +2.5 | 1 / 2 / 0 |

Monotone in every household, crossing zero between 12 and 16 points, and not yet plateaued. So the
gap was resolution, not structure, and the fast flow is worth building. It is **not** evidence for
gate 4: three households at +0.61 is nowhere near "more than a point ahead with none worse", and
16 points costs 157–345s a household on the model, which is why the fast flow comes next.

**The one thing that does not converge away**: the solver pays £38–55k more lifetime tax and ends with
a lower median pot at every resolution, while winning on survival. That is the objective doing exactly
what it was told — survival first, bequest only as a tie-break — but a plan that buys 2.5 points of
survival with £382k of median pot is a trade the Strategy tab must show rather than bury, and it is
what prioritisation is for.

**The fair comparison, which is the number that matters.** The first signal confounded two things
with the claim under test: the solver had the cash sweep on and the fixed arm off, and the two menus
did not nest. Re-run with the solver's own 24 moves held fixed for life on the other side, sweep on
both, 16 points, 600 held-out paths:

| household | fixed, same menu | solved | difference |
|---|---|---|---|
| S000 | 100.0 | 100.0 | 0.0 |
| S140 | 49.5 | 48.8 | −0.7 |
| S280 | 67.0 | 68.7 | +1.7 |
| mean | | | **+0.33** |

So of the earlier +0.61, about half was the sweep and the wider menu, and +0.33 is state-dependence
on three households. Thin, positive, and under-powered: 600 held-out paths give a paired standard
error near a point, so −0.7 is noise and +1.7 is barely not. Two things follow. The solver must never
lose to a fixed rule from its OWN menu, since "always this move" is a policy it could choose; where
it does, as on S140, that shortfall is the approximation cost, measured directly. And the next run
needs 3,000 held-out paths and 20 points, which is running. The fast flow waits on it.

**At 20 points and 3,000 held-out paths — the decision.** Same fair protocol, paired standard error
now about half a point:

| household | fixed, same menu | solved | difference |
|---|---|---|---|
| S000 | 100.0 | 100.0 | 0.0 |
| S140 | 49.3 | 49.3 | 0.0 |
| S280 | 67.5 | 69.5 | **+1.9** |
| mean | | | **+0.63**, no losses |

S140's −0.7 was resolution, and at 20 points the solver matches the best fixed rule from its own
menu exactly, which is the dominance property a correct solver must have. S280's gain held and grew
to +1.9, outside the noise. So state-dependence is real, small on average, and concentrated in
households with something to decide; and every step of resolution has helped, which is the case for
the fast flow: 20 points costs 301–686s a household on the exact model, and a ten-household run needs
it. **Decision: build the fast flow.**

The trade it makes is unchanged at every resolution: S280 buys +1.9 of survival with −£583k of
median pot and +£67k of lifetime tax. That is the objective as specified, and the Strategy tab must
show it as a trade rather than hide it behind the survival figure.

**The fast flow, built.** `src/solver/fast.js` is one person's year with nothing allocated: calendars
and tax as tables, the state as six numbers, the pension draw inverted over the tax table's segments.
Held to `model.js` on 6,400 random positions and moves across sixteen households at £0.0000 worst
difference, including the insolvency flag and growth from the post-decision state, and the tax table
to the engine at every £137 to £400k for both ladders (`solver-fast.test.mjs`, 7 assertions). Per
year: 425ns against the exact model's 4,150ns. The solve loop and the true-position read were then
rewritten on it with an allocation-free table read, Gate 2 still passing and the table values bit for
bit the same. A 12-point solve went from 140s to 43s and a 20-point one from 686s to 209s. That is
3.3x, not 10x: the remaining cost is the twelve transcendental calls per table read (three axis logs,
eight log-odds, one exp), which a stored log-odds table would halve, and the cell count, which the
reachable band is for. Neither is done; the signal at proper size comes first, because it is what the
speed was for.

**TEN HOUSEHOLDS, 20 POINTS, 3,000 HELD-OUT PATHS - the phase 2 result.**

| household | fixed, same menu | solved | survival | median pot | lifetime tax |
|---|---|---|---|---|---|
| S000 in-drawdown, pension-heavy | 100.0 | 100.0 | 0.0 | -3k | 0 |
| S042 in-drawdown, balanced | 99.7 | 99.7 | +0.1 | -21k | -5k |
| S084 just-retired, GIA-heavy | 100.0 | 100.0 | 0.0 | -40k | 0 |
| S126 early-bridge, pension-heavy | 98.6 | 98.6 | +0.1 | **+354k** | **-82k** |
| S168 early-bridge, cash-heavy | 100.0 | 100.0 | 0.0 | -77k | +4k |
| S210 near, GIA-heavy | 98.5 | 98.6 | +0.1 | +185k | -4k |
| S252 mid, ISA-heavy | 95.3 | 96.0 | +0.7 | -423k | +22k |
| S294 mid, cash-heavy | 85.0 | 86.2 | **+1.2** | **-1,253k** | +83k |
| S336 far, balanced | 87.5 | 88.9 | **+1.4** | -757k | +98k |
| S378 long-bridge, ISA-heavy | 98.1 | 98.3 | +0.2 | -373k | +38k |
| **mean** | | | **+0.37** | **-241k** | **+15k** |

Wins 2, ties 8, **losses 0**. The dominance property holds everywhere at 20 points: the solver never
loses to a fixed rule drawn from its own menu, which is what a correct solver must do. The gains are
where they should be - the three households with real risk and a long horizon - and there is nothing
to win on the four already at or near 100%.

**What this does and does not settle.** +0.37 is state-dependence alone, and it is BELOW gate 4's bar
of more than a point. Gate 4 asks a different and easier question, solver against the app as it stands,
which also carries the cash sweep (+0.30 measured in the real engine) and the wider menu, so that
comparison would land higher, plausibly +0.6 to +0.9, still short of a point. On fixed spending the
fixed rules are close to optimal for this model, exactly as the evolver found.

**The bequest cost is the finding that most needs answering.** The median pot falls by £241k on
average and by £1.25m on S294, for +1.2 points of survival. Lifetime tax is up only £83k there, so tax
does not explain it: the solver is doing something structural to protect survival that costs a great
deal of terminal wealth, and nobody asked for that trade. **One diagnostic is owed before any of part C
is built**: trace S294's chosen moves against the fixed winner's and say in one sentence what differs.
If the lexicographic objective is pathological at the top, the fix is prioritisation weights, not more
solver.

**Two corrections from gate 2's first run.** The certain-success bound in the plan was wrong for an
invested pot: "no growth" is not the worst case when returns can be negative, and on a full solve
8,645 cells above the line read below 0.999, the lowest 0.864. There is no certain-success shortcut;
the saving comes from the reachable band and the fast flow. And the table smears its cliff: eleven
backward steps of interpolation compound, so at 8% either side of a closed-form need a 12-point table
reads 0.8 and 0.2 rather than 1 and 0. The simulated policy is right at 2% either side, which is why
the table's own figure is never the measurement and an adaptive grid near the cliff stays on the list.

**Gate 2, `research/tests/solver.test.mjs`:** on a household with no tax and one wrapper the solved
survival equals a closed-form answer within 0.5 points; the policy is monotone where the theory says
it must be; the forward check stays inside the band; re-solving after a balance edit touches no table
and after a spend edit touches only years from the affected one; the timing budget holds on the CI box.

### Phase 3. The bridge into the engine: a `table` policy override

`plan.spending.policyOverride = { kind: 'table', solve }` is honoured by `buildContext` and consumed in
`stepYear`: at the top of the year the engine maps its exact state to the reduced grid, reads the
action, and executes it through the engine's own machinery (`drawPension` with the chosen ceiling, the
cost and deposit orders, the re-wrap, the Bed and SIPP transfer, the lump-sum switch). Everything the
engine already does for tax, MPAA, carry-forward, guardrails, CGT basis and the audit row keeps
happening exactly; the table only chooses. The audit row gains `action`, a short code, so the Audit
Data Table can show what was chosen each year.

`monteCarlo`, `simulateHistorical`, `simulateDeterministic`, `optimizeSpend`, `safeRetirementAge` and
the spend grid all work on a plan carrying the override with no change, because they only call
`stepYear`.

**Gate 3, `research/tests/solver-bridge.test.mjs`:** a table that encodes "Bracket Fill Basic" exactly
reproduces the engine's Bracket Fill Basic path to the pound; the solved policy run through the real
engine scores, on the expected path, within 2 points of the survival the reduced model predicted for
the same household (the model-to-engine gap, reported per household).

### Phase 4. The versus study, and the decision: `research/solver/versus-solver.mjs`

The same protocol as `research/policy-study/versus.mjs`: 40 households, half the library spread across
it and half the FIRE cohort retiring at 52, plus the 20 cost variants from the lookahead study. Arm A is
the current pipeline (policy search, then tournament, then the evolver where it applies). Arm S is the
solver. Every finalist scored on a held-out seed at 3,000 paths through the real engine; the historical
backtest run on both as the out-of-model check.

**Gate 4, the decision:** the solver goes forward into the app only if, on held-out scoring, it beats
the current pipeline by more than `RATE_EPSILON_PTS` on average, no household is worse by more than one
point, and the historical backtest is not worse on average. Anything short of that and the write-up
says why and the app is untouched.

---

## Part B. Couples and the risk tier (phases 5 and 6, research)

### Phase 5. Couples by rollout: `src/solver/couple.js`

Two single-person tables solved against the household's spending, with each person's share of the
shared need as the year's first action (five splits: 0/100, 25/75, 50/50, 75/25, 100/0, pruned to the
two adjacent the basic bands allow). Then a one-step rollout: for each candidate joint action, the real
engine steps one year from the exact state and the two tables value the result. By the policy
improvement theorem the rollout policy is at least as good as the base. Cost: about 50 engine steps per
decision, so a 45-year path is 2,000 steps; a 1,000-path Monte Carlo under the rollout policy is two
million engine steps, which is what the app runs today for a tournament.

Fallback if the gate fails: the joint grid at 8 points per wrapper per person (262,000 states per year)
in the worker, minutes rather than seconds, offered as "solve in the background".

**Gate 5:** the versus protocol on the library's couple households; the same thresholds as gate 4.

### Phase 6. The risk tier as an action, and spend as a dimension

- Each wrapper's action set gains the tier set on Plan Inputs and up to two tiers below it; never above.
  Rebalancing inside a wrapper is free; in the GIA it realises gain through `gainFrac`.
- Spend target becomes the seventh state dimension, at eight levels around the plan's target (60% to
  130%). With it the safe spend, the safe retirement age, the age-against-spend grid and the quick
  dials are all reads from the table.

**Gate 6:** the versus protocol with tiers on; the safe spend from the table within £500 of
`optimizeSpend` on the same plan; the solve stays inside 1.5× the Phase 2 budget.

---

## Part C. The app (phases 7 to 12), behind a switch

A module constant `const SOLVER = false` beside `SHOW_INHERITANCE` in `src/App.jsx`. Everything in
Part C is gated on it, so main stays shippable throughout and beta users can be flipped to compare.

### Phase 7. Plumbing: worker, state, staleness, locks

- `src/solverWorker.js` (the `mcWorker.js` pattern, with `workerShim.js` first). Messages: `solve`
  with the plan and the years to re-solve, `progress` per year, `done` with the tables as transferable
  buffers. The app keeps `solveState: 'idle' | 'solving' | 'solved' | 'stale'` beside `solveMeta`.
- Every plan edit computes the earliest affected year (a small pure function `firstAffectedYear(prev,
  next)` in `src/solver/diff.js`) and either marks the tables `stale` and re-solves from there, or does
  nothing for a balance-only edit.
- **Locks**, `plan.solver.locks`, normalised in `normalizePlan`: per wrapper `contribution: 'free' |
  'fixed'`, `pensionBefore: age | null` ("do not draw the pension before"), `tierCeiling` per wrapper,
  `lumpSum: 'free' | 'never' | 'now'`. Locks shrink the action set in `model.js`; they never add
  actions.
- The solver chunk is a lazy `import('./solver/index.js')`, and `load-perf-ui.cjs`'s 220 KB ceiling
  stands.
- Tables are cached in IndexedDB under the plan hash so reopening the app does not re-solve; the cache
  is cleared when the model version changes.

### Phase 8. Config

Removed from the tab (the fields stay in the saved plan for the baseline and for import of old
exports): decumulation policy, drawdown strategy, harvest switch and ceiling, the lookahead field, and
the whole policy search block with its results and trade-off cards (lines around 12810 to 13060 today).
The bridge safety margin becomes a solver constraint, "hold at least this much liquid before access",
or is removed; recommendation: keep it as a lock.

Kept: guardrails (with the note that the solver assumes them off and the projection applies them on
top), cash buffer, returns and CMA presets, tax region, valuation date, inflation, solvency floor,
death-tax rate, number format.

Promoted: prioritisation moves to the top of the tab under "What the solver optimises for", with the
three presets and the advanced weights as today; switching is instant because the tables carry the
components.

Added: a "What the solver may change" card holding the locks, one row per wrapper plus the pension-age
and lump-sum rows, with the equity ceiling per wrapper beside the tier from Plan Inputs.

### Phase 9. Strategy: one comparison, and what to do

The tournament, its players, the evolver and `data-strategy-card` go. The tab becomes, top to bottom:

1. **The comparison.** Your plan against the solved plan: survival, median and unlucky-tenth pot,
   lifetime tax, bequest net of death tax, each with the delta. "Your plan" is the baseline: the
   contributions as entered and the plain sequential draw order, or the policy an old export carried.
2. **This year's actions, per person.** A short list in the playbook vocabulary (`phraseFor`): "Pay
   £X into the pension and £Y into the ISA", "Draw the pension up to the basic-rate limit and re-wrap
   £Z into the ISA", "Move the ISA to the Medium tier". Each with the survival cost of skipping it,
   read from the table by valuing the next-best action.
3. **The rule of thumb.** A decision tree fitted to the policy (`src/solver/distil.js`, CART on the
   action table with depth 3), printed as the instruction sheet's steps, with its fidelity: "following
   these rules instead of the table costs 0.4 points". The printable sheet in `actionPlan.js` gets the
   same content.
4. **What changes over time.** A compact year-by-year action strip for the next ten years under the
   expected path, from the audit rows' `action` codes.
5. **Come back next year.** The line that says the plan is state-dependent and is re-solved from real
   balances.

`diffStrategyPlans` and `summarizeStrategyChange` survive for the comparison; `buildTournament`,
`resolveSearchPlayer`, `accumulationCandidate`, `bedAndSippFor`, `solveEscalation` and `evolve.js`
are removed from the app once the switch is on for good (Phase 12), and stay in `research/` as the
baseline's tooling until then.

### Phase 10. Projection, Simple, scenarios, audit, historical

- **Projection** runs the solved plan and reports it as the headline, with the baseline's survival
  beside it in one line ("as you are now: 71%"). The reporting rule of Part D applies from the day
  flexible spending lands: no safety-net rate anywhere without the fully-funded rate beside it. The run card gains a solve state and a progress bar;
  the guardrail note stays; the lookahead note goes.
- **Quick dials** read the table (Phase 6's spend dimension), so they stay instant; the retirement-age
  dial still re-solves, with the progress bar visible, unless the age table has been pre-solved for
  ±3 years, which is the recommended default.
- **The Simple page** switches its safe spend and safe age to the table once Phase 6 lands; until then
  it stays on `optimizeSpend` and `safeRetirementAge` unchanged.
- **Scenarios** each carry a solve; the overlay and the comparison table show a solving pill per
  scenario and compare solved outcomes.
- **Audit Data Table** gains an "Action" column from the row's code, replacing the guardrail and
  set-aside columns' role of showing what the rule did (the guardrail column stays while guardrails
  exist).
- **Historical backtest** is labelled the out-of-model check: "the policy was solved for the return
  model; this is how it would have fared on the actual sequences".

### Phase 11. Phone

- Solve in the worker with a coarser grid (14 points) and a visible progress bar on the run card; never
  block the UI.
- The Strategy tab's five blocks become the phone deck's slides, with this year's actions first.
- The locks card folds by default.

### Phase 12. Words, docs, tests, rollout

- **Rename pass:** "tournament", "player", "policy search", "entrant" leave the UI, the copy manifest,
  `Docs.jsx`, the README and the harness names. The glossary gains "solved plan", "your plan",
  "locks", "rule of thumb".
- **Documentation:** a new card, "How the solver decides", replacing the policies, tournament,
  guardrails-as-decision and lookahead explainers; the guardrails card stays as a spending rule; the
  coverage card lists the reduced model's approximations verbatim from Phase 1.
- **Tests retired:** `entrants.test.mjs`, `evolve.test.mjs`, `lookahead.test.mjs`, the tournament
  half of `escalation.test.mjs`, the search half of `policy.test.mjs`; **harnesses retired:**
  `tournament-ui.cjs`, `tradeoffs-ui.cjs`, `priorities-ui.cjs`. **Replaced by:** the three solver
  test files from Part A, `solver-couple.test.mjs`, `distil.test.mjs`, and harnesses
  `solver-strategy-ui.cjs` (comparison, actions, rule of thumb, fidelity figure, print sheet),
  `solver-config-ui.cjs` (removed fields gone, locks shrink the actions, prioritisation switch is
  instant), `solver-progress-ui.cjs` (stale and solving states, phone progress, balance edit needs no
  re-solve). `run-all.sh` updated; the 220 KB and typing-latency ceilings unchanged.
- **Rollout:** `SOLVER = true` for beta once the full suite is green with it on and off; two weeks of
  both paths shipping; then the retirements above and the switch removed.

---

## Part D. Flexible spending (phase 13, after the switch is on for good)

The one question the app has never answered properly: "if I could trim in a bad stretch, how much
safer would I be, and how often would I be trimming?" Guardrails answer it with a fixed rail.
This phase answers it from the person's position.

### Inputs, on Plan Inputs beside the spending target

| Field | Plan key | Default | Rule |
|---|---|---|---|
| Target spend | `spending.targetSpend` | as today | unchanged |
| Floor spend | `spending.floorSpend` | equal to the target | `0 < floor ≤ target`; equal means fixed spending, exactly today's question |
| Confidence at the floor | `spending.floorConfidence` | the existing target survival rate | percent, 50 to 99 |

Spend bands keep working: the floor is a fraction of the band's target, `floor / target`, applied to
every band. Both new fields are normalised in `normalizePlan` and carried by old exports as "equal to
the target".

### The objective, exactly

1. **Hard:** the probability of never spending below the floor must be at least `floorConfidence`.
2. **Then:** minimise the expected lifetime shortfall from target, with each year's shortfall squared
   so one deep cut costs more than two shallow ones: `Σ_years ((target − spend) / target)²`.
3. **Then:** the bequest net of death tax, ordered against 2 by the prioritisation preset (survival
   presets put 2 first; the bequest preset puts 3 first; balanced weighs them as it weighs today).

A constraint cannot go into backward induction directly. It is solved as a penalty: the value carried
through the table is `survivalAtFloor − λ · shortfall` (plus the bequest component, kept separate as
in Phase 2), and `λ` is found by bisection on the solved policy's actual floor survival, measured by
a 1,000-path run in the reduced model, until it lands within half a point of `floorConfidence` from
above. Each bisection step is one solve; eight steps bound it. `λ` is stored in `solve.meta` and shown
nowhere. **No constant is ever asked of the person and none is hard-coded**: the floor, the target
and the confidence are theirs, the exponent 2 and the half-point landing tolerance are structural and
named in the docs card.

### Actions

Drawing years gain one lever: the year's spend, one of `target · {1, 0.9, 0.8, floor/target}`,
de-duplicated and never below the floor. Working years are unchanged. The `pensionCeiling` action of
"whatever the year needs" now means "whatever this year's chosen spend needs".

**Why this needs no new dimension**, stated precisely because the whole phase's cost turns on it. Two
things have to hold and both do. The consequence of a cut flows entirely through the pots: spending
less leaves more money, and that money is already in the state, so next year's choice is unconstrained
by this year's. And the objective is additively separable across years, so the shortfall accumulated so
far is a constant that cannot change which move is best from here. It would fail for an objective like
"minimise the deepest single cut" or "minimise the variance of spending", which cannot be decomposed
year by year, and for habit, which is why habit is out of scope.

Worth noticing the direction: Guyton-Klinger genuinely does have memory - a multiplier that ratchets
with every past cut and rise, the rate the rails were set from, whether last year lost money, all of it
in `state.guard`. This phase replaces a memory-carrying heuristic with a memoryless optimal decision.

**THE BUFFER TRAP — the one way an implementer could destroy a grid dimension by accident.**

The grid merges cash and the GIA into one taxable pot, and it can do that only because `cashAt` is a
function of the YEAR alone. That in turn holds only because the cash buffer is sized on the plan's
spending target. The obvious-looking move when spending becomes a decision is to size the buffer on the
spend actually chosen - and that is the trap: this year's cash split would then depend on last year's
decision, `cashAt` would become path-dependent, the merged pot would be invalid, and cash would need a
dimension of its own. The grid would grow several-fold and the phase's cost estimate with it.

So: **the buffer stays sized on `spendTargetAtAge`, the planned target, never on the chosen spend.**
That is also the better reading of what a buffer is - it holds the life you planned for, not the
trimmed one - and it means a household trimming in a bad stretch does not also shrink its safety
cushion at the worst moment. `bufferAt` in `model.js` and `yr.buffer` in `fast.js` already do this;
gate 13 asserts that a solve with a floor below target produces the same `cashAt` series as one with
the floor equal to it, which is what would break the moment someone "fixes" the buffer to follow the
cut.

### The engine hook

`stepYear`'s `spendOverride` parameter accepts a function `(t, state) → spend` as well as a number,
and `runTrial` and `monteCarlo` pass it through unchanged. The table policy override supplies that
function, reading the spend action for the exact state at the top of each year, and the year then runs
as today. The guardrail machinery (`state.guard`, the rails, the multiplier) is not touched by the
table; with both on, the guardrail multiplier applies to the table's chosen spend, and the Config note
says so. The audit row carries `spendChosen` beside `targetSpend`.

### The reporting rule, and it is a rule

A plan that survives by trimming is not a plan that never trims. So, on every surface that shows
survival (the deck, the dashboard, the Simple page, the scenarios comparison, the print sheet, the
Strategy comparison, the Audit summary):

- the **fully-funded rate** (never below target, the number the app has always shown) is the headline
  and is never omitted;
- the **safety-net rate** (never below the floor) is shown beside it, labelled "safety net at £X held",
  and is never shown alone;
- the **years at target** in a typical run and the **unlucky tenth's typical spend** are shown with
  them, in the tile the guardrails already use;
- when years at target in the typical run fall below 80%, a sentence says so in words: "In a typical
  run this plan spends the full £50,000 in 21 of 35 years. It is closer to a £45,000 plan."

The harness asserts all four on every surface, and the copy manifest carries the sentence.

### What it retires

The Guyton-Klinger guardrails: the Config switch, `GUARDRAILS`, `state.guard`, the audit column, the
run-card note and the docs card, replaced by the solved rails. The docs card becomes "Trimming in a bad
stretch": what the floor means, what the two rates mean, and the two structural constants.

### Gate 13

- `research/tests/solver-flex.test.mjs`: with floor equal to target the solve is identical to Phase
  6's tables to the bit; with a floor, floor survival lands within half a point above the confidence
  on a held-out seed; the bisection converges in at most eight solves on every library household;
  shortfall is monotone non-increasing in wealth at every age; the reporting rule's four figures are
  present in `summarizeTrials`' output; and **the cash buffer series is identical whether the floor is
  below the target or equal to it**, which is the buffer trap above caught in the act.
- The versus protocol against today's guardrails on the same households at the same floor: the solved
  rails must match or beat the guardrails' floor survival at a lower expected shortfall on average,
  with no household worse on both.
- `research/ui-harnesses/solver-flex-ui.cjs`: the two fields, the four figures on every surface, the
  sentence below 80%, the guardrail switch gone, phones included.

---

## Order, gates and rough size

| Phase | Deliverable | Gate | Size relative to the evolver build |
|---|---|---|---|
| 1 | reduced model + golden test | **done**: exact to the pound, 29 assertions | 1.5× |
| 2 | single solver | closed form, monotone, band, incremental, timing | 1.5× |
| 3 | table override in engine | exact reproduction of a named policy | 0.5× |
| 4 | versus study | > 1 point, none worse than 1, historical not worse | 0.5× |
| - | **phase 2 says**: +0.37 fair, no losses, but -£241k median pot. Diagnose the bequest cost, and test flexible spending in-model, BEFORE part C | | |
| 5 | couples by rollout | same on couple households | 1× |
| 6 | tiers and spend dimension | same, plus safe spend within £500 | 1× |
| 7 | worker, staleness, locks, cache | suite green with switch off | 1× |
| 8 | Config | harness | 0.5× |
| 9 | Strategy | harness | 1.5× |
| 10 | Projection, Simple, scenarios, audit | harness | 1× |
| 11 | phone | phone harnesses | 0.5× |
| 12 | words, docs, tests, rollout | full suite both ways | 1× |
| 13 | flexible spending, guardrails retired | gate 13, versus guardrails | 1.5× |

The decision point is the end of Phase 4. Phases 1 to 4 together are about the size of the evolver
build twice over, and nothing the person sees changes until Phase 8.

## Decisions I have taken that you may want to overrule

- The baseline "your plan" is contributions as entered plus the plain sequential draw order, not the
  best of the old policy search, because the point of the comparison is what you would do without the
  app.
- The bridge safety margin survives as a lock rather than being removed.
- The retirement-age dial pre-solves ±3 years rather than making age a dimension.
- Guardrails stay a projection-time rule the solver does not see, until flexible spending is a phase.
- Old exports keep their policy fields and import as the baseline; nothing is migrated.
- Flexible spending waits until the switch is on for good, and the guardrails stay until then.
- The shortfall exponent is 2 and the floor-confidence landing tolerance is half a point; both are
  structural, named in the docs, and not settings.
- Habit (a cut hurting more after a cut) is left out of Part D; it needs last year's spend as state.
- The cash buffer stays sized on the planned target rather than the chosen spend, which is what keeps
  cash out of the grid; see the buffer trap in Part D.
