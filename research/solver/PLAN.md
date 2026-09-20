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

Out of scope, deliberately, and each is a phase of its own afterwards: flexible spending as an action
(needs a utility), gifting as an action (needs the seven-year clock as state), retirement age as an
action, mortality, annuities, a regime belief, and any change to the return model.

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

**Gate 1, `research/tests/solver-model.test.mjs`:** run the reduced model under each of the four
bracket-fill policies and the sequential policy, mapped to fixed actions, on 40 library households and
the harness fixtures, and compare year by year against `simulateDeterministic` on the expected path.
Pass: every wrapper within 1.5% or £500 (whichever is larger) in every year, lifetime tax within 1%, and
the failure year identical where one occurs. The differences that remain are listed with their cause in
the test header, and each must be one of the approximations above, not a bug.

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
  beside it in one line ("as you are now: 71%"). The run card gains a solve state and a progress bar;
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

## Order, gates and rough size

| Phase | Deliverable | Gate | Size relative to the evolver build |
|---|---|---|---|
| 1 | reduced model + golden test | model matches engine within tolerance | 1.5× |
| 2 | single solver | closed form, monotone, band, incremental, timing | 1.5× |
| 3 | table override in engine | exact reproduction of a named policy | 0.5× |
| 4 | versus study | > 1 point, none worse than 1, historical not worse | 0.5× |
| 5 | couples by rollout | same on couple households | 1× |
| 6 | tiers and spend dimension | same, plus safe spend within £500 | 1× |
| 7 | worker, staleness, locks, cache | suite green with switch off | 1× |
| 8 | Config | harness | 0.5× |
| 9 | Strategy | harness | 1.5× |
| 10 | Projection, Simple, scenarios, audit | harness | 1× |
| 11 | phone | phone harnesses | 0.5× |
| 12 | words, docs, tests, rollout | full suite both ways | 1× |

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
