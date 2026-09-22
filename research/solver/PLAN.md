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

**The bequest cost, diagnosed and priced.** The median pot fell £241k on average and £1.25m on S294
for +1.2 points of survival. Tracing S294 against the fixed winner on the same paths: the solver
harvests to the basic-rate limit for decades, pre-paying income tax to turn pension pounds into ISA
pounds, because in a bad year an ISA pound buys a whole pound of spending and a pension pound buys
eighty pence. Real insurance, and it works. The premium: the median pension left falls from £5.9m to
£2.5m, terminal wealth on surviving paths from £7.3m to £5.5m, lifetime tax doubles from £73k to £164k
- and `pensionDeathTaxRate` is zero in these scenarios and zero by default, so none of that tax buys an
inheritance benefit.

The cause was the objective, not the solver. Survival strictly first with the bequest breaking only an
exact tie means any survival gain however small justifies any bequest loss however large. The value
now scores `survival + weight x bequest / openingWealth`, where the weight reads as how many points of
survival one multiple of current wealth in extra bequest is worth. The frontier, 16 points, 1,500
held-out paths, against the same fixed winner:

| household | weight 0 | 0.02 | 0.1 | 0.5 |
|---|---|---|---|---|
| S294 survival | +1.2 | +1.0 | +0.9 | +0.8 |
| S294 median pot | −1,242k | **−929k** | −812k | −775k |
| S336 survival | +1.3 | +1.0 | +1.0 | +0.9 |
| S336 median pot | −736k | **−385k** | −359k | −356k |
| S252 survival | +0.3 | 0.0 | 0.0 | −0.1 |
| S252 median pot | −204k | **+53k** | +64k | +64k |

**That first frontier was measured wrong, and the corrected one says something better.** Only the
solver had been given the bequest weight; the fixed arm went on choosing by survival alone, so those
rows compared two different questions. With the SAME objective on both sides, 16 points, 1,500
held-out paths, solved minus fixed at each weight:

| household | weight 0 | 0.02 | 0.1 |
|---|---|---|---|
| S252 | +0.5, −359k | +0.2, −102k | +0.1, −90k |
| S294 | +0.7, −1,254k | +0.4, −941k | **+1.3**, −927k |
| S336 | +1.3, −736k | +1.0, −385k | **+1.9**, −361k |

**The solver's advantage GROWS as the bequest is valued, and that is the real argument for
state-dependence.** At weight 0.1 the fixed arm's own survival falls (S294 86.1 to 85.4, S336 88.3 to
87.4) because a fixed rule has only one lever: to hold more bequest it must pick a rule that is worse
on survival for the whole plan. The solver has no such bind. It can favour the bequest in the years
where that is cheap and protect survival in the years where it matters, so on S336 at weight 0.1 it
holds 89.3 survival while keeping twice the bequest it kept at weight 0. That is a point the fixed
rules cannot reach at any setting, which is precisely the claim worth testing.

**On the product's weight, which is a different question.** Which weight to ship is about what the
household wants, and belongs to the prioritisation presets, not to this measurement. This measurement
only says the solver beats fixed rules at every weight tried, and by most where the bequest counts.

**THE OBJECTIVE IS STILL NOT THE APP'S, and that is the next thing to fix.** The app ranks candidates
through `DEFAULT_PRIORITIES`: survive, **downside**, bequest, bridge, pot, tax. The solver knows two of
those six and has no notion of downside resilience at all, which the app puts SECOND. So the solver
optimises a poorer objective than the app and is then scored on survival, the one thing it does
optimise - which flatters it and hides where it may be worse. Owed, in order: measure the unlucky tenth
and the failure age; add downside to the solver's value, which is already the lower tail of what the
table holds; and for gate 4 select the fixed arm with `explainPick` and the app's own ranking rather
than a survival-first simplification.

**What is still not measured**, and should be before part C: the unlucky tenth and the failure age.
Survival is a cliff, so +1.2 points means 1.2% of paths crossed from failing to not failing, and those
paths were marginal either way. If the solver also lifts the bad tail the case is stronger than the
points suggest; if it only nudges paths over the line it is weaker. `insample.mjs` carries median and
tax but not p10 or failure age.

**Phase 2 experiment, complete (tag p2-7001; 41 even-indexed households of the 70-98 band, 20 points,
3,000 held-out paths, seeds 7001/7002; full table in `results-p2-7001.txt`).** Solver against the same
menu chosen by the app's own judge: **mean +0.59 points, 32 up / 5 down beyond two standard errors,
sign test p < 0.001; the app's own picker prefers the solver in 28 of 41 (p = 0.028)**. Against the app
as it stands: +0.60, 32 up / 6 down, picker 30 of 41 (p = 0.004). Unlucky tenth +£10k; median pot
−£243k; lifetime tax +£38k; failure age on failing paths −0.19 years. The wins cluster where decisions
matter (in-drawdown and far-from-retirement households at 70-85% survival: +1.5 to +2.3); the losses
are five, all with the solver paying more tax on a household that fails often anyway (S070 −2.1,
S330 −1.4, S342 −1.2, S318 −0.8, S112 −0.4). The gate (about half a point with a clear sign test) is
passed, and by the literature's reading a half-point edge is what withdrawal order alone is worth.
The five losses go to the loss ledger (2c.4); the next steps are Phase 2c and the Part D pilot (2d),
not Phase 3.

**Loss ledger, entry 1: S070 (−2.1). Cause: grid smear, and it converges.** The value function at the
opening position ranks "draw the whole spend from the pension into higher-rate tax" above "pension to
the basic-rate limit, the rest from the taxable pot", 0.8049 to 0.8021; the simulation says 67.2 to
69.3 the other way, and on all 63 discordant paths the fixed plan survived and the solver did not.
The table is optimistic by +21 points at 12 grid points, +16 at 16, +13 at 20, +9 at 28
(`ledger-bias.txt`); fitting a + b/n gives a residual of about half a point at infinite resolution, so
the bias is the grid's, not the five-node return model's. The wrong margin shrinks with it (0.011,
0.004, 0.003, 0.001) and would cross below about 32 points. The same optimism holds on every household
probed (+1.5 to +11 at 20 points) and is largest on the far-from-retirement households with the
longest horizons, wins and losses alike, so bias by itself does not predict a loss; what loses is a
household where two moves differ by less than the smear and the smear favours the dearer one. Work
item: resolution where it matters (the adaptive grid near the cliff, already listed; more points on
the low end of the taxable axis, where a small pot is over-valued), paid for by the reachable band and
the cheaper reads. `diagnose.mjs` and `bias.mjs` are the ledger's tools; `ledger-S070.txt` the entry.

**Loss ledger, entry 2: S330 (−1.4). Cause: grid smear, the same signature as S070.** A household 28
years from retirement (61-year horizon, table optimistic by +11). Identical to the fixed plan for the
28 accumulation years, then at 65 the solver takes "whole spend from the pension" on 49% of paths for
four years (£25k tax a year against £8k), and afterwards leans on the ISA so that at 80 the ISA holds
£1.2m against the fixed plan's £2.1m. On the discordant paths the fixed plan survived and the solver
did not. Same work item as entry 1; the far households carry the largest smear because it compounds
over the most years. `ledger-S330.txt`.

**Loss ledger, entry 3: S112 (−0.4). Cause: the objective, as designed - not an error.** A modest
household (spend £18k, survival 97%, table optimistic by only +1.5). At the opening position the
solver's move and the fixed winner tie on survival to four places (0.9847) and differ in the fourth
decimal of resilience; the solver's choice is the tie-break. Over the plan it keeps the ISA growing
(£376k against £96k at 96) and ends with more total wealth (£1.41m against £1.31m on the mean path,
median pot +£83k, unlucky tenth +£6k) for 0.4 points of survival. The app's own picker prefers the
solver here: within its one-point epsilon on survival, then better on downside. This is the trade the
weights buy at 0.02 and 0.5, and Phase 2c.3 (weights tuned on the odd households) is where it is
settled. `ledger-S112.txt`.

**Loss ledger, entry 4: S342 (−1.2). Cause: grid smear, S070's signature a third time.** Far household,
61-year horizon, table optimistic by +11. Identical through accumulation; at 65 the "whole spend from
the pension" move on 49% of paths, £27k tax against £8k, then a switch to ISA-first moves; lifetime tax
£755k against £263k. Fixed-only survivals 33, solver-only 1. `ledger-S342.txt`.

**Loss ledger, entry 5: S318 (−0.8). Cause named, not yet separated: the taxable pot over-valued.** Far
household, table optimistic by +8. A different signature: no higher-rate tax (lifetime tax £167k
against the fixed plan's £251k); instead the solver spends the ISA first while harvesting the GIA to
the basic-rate limit on 88% of paths, so that at 76 it holds £1.09m in the taxable pot against the
fixed plan's £45k, and £3.4m in the ISA against £4.5m. The table values holding a growing taxable pot
above holding the ISA, and the simulation disagrees by 0.8 points (31 fixed-only survivals against 6).
Two approximations could do this and the diagnosis does not separate them: the low end of the taxable
axis (as in entries 1, 2 and 4) or the three-bucket unrealised-gain axis, where a freshly harvested
pot sits at the favourable bucket. The separating test is a solve with finer gain buckets at the same
points; it is queued with the resolution work. `ledger-S318.txt`.

**The ledger, closed for phase 2.** Five losses: three are one cause (the smear at the cliff favouring
the dearer move, converging with resolution), one is that cause or the gain buckets, one is the
objective doing what it was set to do. None points at the five-node return model, none is
unexplained, and none needs a change to the method; the first four need the resolution work already
listed, the fifth the weight tuning.

**The smear: three cheap fixes tried on S070, none adopted (`ledger-smear-fixes.txt`).** (1) Density on
one axis: the smear is spread evenly across the three pot axes (28 points on any one axis alone takes the
optimism from +21 to +18 or +19; on all three, to +9), so the fix is n-cubed and there is no cheap axis.
A tighter axis top does nothing (+20.7). (2) The interpolation scheme: plain probability in place of
log-odds halves the optimism (+21 to +9 at 12 points, +7 at 20 and 28, where it plateaus) but smears the
cliff itself - Gate 2's closed-form case reads 77% well above the need and 12% well below - and the
wrong ranking survives at every resolution. A looser clamp behaves the same way. Log-odds stays. (3) A
tax-averse tie-break in the forward choice (within the table's own margin, take the move that pays the
least tax this year; values untouched, off by default, `tieMargin`): S070 recovers 1.5 points (67.2 to
68.9, still short of the fixed 70.3) but the two largest wins each give back half a point (S082 83.6 to
83.1, S354 82.5 to 81.9). Across 32 wins and 3 smear losses that is a net loss on the mean, so it is not
switched on. As fixed policies on S070's own paths the contested moves are six points apart (basic-band
69.3, whole-from-pension 63.1), which the table reads the wrong way by 0.3; the solver's simulated
survival moves little under any variant (67.2 to 68.9). The honest reading: the smear at this
dimensionality is a property of a trilinear table, the number it produces is soft, the decisions it
produces are mostly right, and the fix is resolution paid for by the reachable band and the cheaper
reads (Phase 2c), not a patch. `points` may now differ per axis and `tieMargin` exists, both default
off, for that work.

**The total-wealth grid, on all 41 households (tag p2-total40; `results-p2-total40.txt`).** Same
households, seeds, menu and judge as p2-7001, the grid changed to total-wealth coordinates at
40 x 6 x 6 (1,440 cells against 8,000). Solver against the same menu: **mean +0.73 (was +0.59);
29 up / 5 down beyond two standard errors; sign test p < 0.001; the app's own picker prefers the
solver in 33 of 41 (was 28), p < 0.001.** Unlucky tenth +£19k (was +£10k); median pot −£182k (was
−£243k); tax +£30k (was +£38k). Every one of the five losses shrank (S070 −2.1 to −0.7, S330 −1.4 to
−1.0, S342 −1.2 to −0.6, S318 −0.8 to −0.5, S112 −0.4 to −0.3) and no win was lost; S058 moved from
−0.3 to −0.5. **Mean solve time 144s to 21s.** 60 x 8 x 8 matched 40 x 6 x 6 to the decimal on the
eight probe households, so the grid has converged; the cliff is one-dimensional in total wealth and
smooth in the split, as guessed. This becomes the default grid. The four other candidates in the same
batch (shortfall risk term at two weights, six gain buckets, Richardson extrapolation) moved nothing
beyond noise and stay optional (`ledger-smear-fixes.txt`).

**Phase 2c.1, the perturbed-world evaluation: passed, and the edge grows when the world is worse
(`results-2c1-perturbed.txt`).** Both arms solved and chosen exactly as in p2-total40, then scored on
the same 3,000 held-out paths in three worlds neither arm was told about. Solver minus the same-menu
fixed arm: **return one point lower, +0.95 (33 up / 4 down, picker 32 of 41); volatility a quarter
higher, +0.96 (32 / 5, picker 35 of 41); a fatter left tail, +1.60 (32 / 8, picker 36 of 41)**; sign
test p < 0.001 in all three, against +0.73 in the fitted world. No household's sign flipped from a win
to a loss beyond two standard errors; two (S112, S206) flipped from loss to win under the lower return.
The worst household in any world is S330 at −1.5 under the lower return. The median-pot cost shrinks
as the world worsens (−£182k fitted, −£34k lower return, +£75k fatter tail): a state-dependent plan
gives up upside it never needed and keeps it when it does. Gate 2c.1 is met; the solver's edge is a
property of the policy, not of the model it was solved in.

**Phase 2c.3, the weights tuned on the odd households: (0.5, 0.02) confirmed
(`results-2c3-tuning.txt`).** The nine pairs of resilience weight {0.25, 0.5, 1} and bequest weight
{0, 0.02, 0.1}, with the shortfall risk term, on the 41 odd-indexed households the experiment never
sees, 40 x 6 x 6, 1,500 held-out paths, scored by the app's own picker against the same menu:

| wR \ wB | 0 | 0.02 | 0.1 |
|---|---|---|---|
| 0.25 | 34 of 41, +1.19, pot −£342k | 33, +1.14, −£246k | 32, +0.86, −£94k |
| 0.5 | **35**, +1.12, −£305k | **35**, +1.05, **−£221k** | 33, +0.82, −£94k |
| 1 | **35**, +0.96, −£266k | 34, +0.84, −£203k | 31, +0.68, −£108k |

Three pairs tie on the picker at 35 of 41; of those (0.5, 0.02) gives up the least median pot for its
survival edge, so the pair in use stands and the even set is not re-run. The bequest weight is the
lever that matters: 0.1 halves the pot cost and takes a third off the survival edge, which is the
frontier the prioritisation presets should expose rather than a constant to settle here.

**Phase 2c.2 adopted as the default.** The shortfall term changed no decision on the losses or the
wins (batch 2 of `ledger-smear-fixes.txt`) and the tuning above was run with it; it removes the step
at the line that a probability objective gambles against, so it is the default from here and
`resilience: 'indicator'` restores the old term for comparison.

**Gate 2e, the 41 households with the tax gaps closed (tag p2-2e; `results-2e.txt`).** Savings-interest
tax, dividend tax and the Cash ISA wrapper on, the library now splitting each household's cash none,
half or all into the ISA, everything else as p2-total40. Solver against the same menu: **mean +0.73
(unchanged), 32 up / 4 down, sign test p < 0.001, picker 30 of 41 (was 33)**; against the app as it
stands +0.76, picker 31. The fixed arms' lifetime tax rose from £75k to £94k on average and their
survival barely moved (87.8 to 87.7), which is the honest size of the gap that was closed: the
interest and dividend tax are a real bill and a small survival effect. The one household that changed
character is S354 (far, cash-heavy): its cash is now half in an ISA, its fixed arm re-chose and rose
from 79.9 to 82.1, and the solver's +2.5 became a tie; the cash- and GIA-heavy households' mean edge
is +0.50 (was +0.65). Gate 2e is met on its first condition (the edge holds) and its second turned
out smaller than expected (the fixed arms fall in tax, not in survival). Phase 1's golden test stays
exact across the library with the split, so the engine and the solver agree to the pound on all three.

**Phase 2d pilot, equal downside, 41 households (tag flex-eq; `results-2d-flex-eq.txt`).** Each
household's solver was asked for exactly the floor rate the guardrails-with-floor arm achieved (Pfau's
calibration), floor 80% of target, 30×6×6 grid, 3,000 held-out paths. At that equal downside (mean floor
rate 92.3 against 92.7) the solver delivers **more years at the target on 40 of 41** (median run 0.87
against 0.52 of retired years; unlucky tenth 0.45 against 0.07), changes the spend level **2.7 times a
run against 26**, and ends with a larger median pot on 34 of 41 (+£293k on average). Fully funded on
never-trimmed paths: solver 31.5 points above the guardrails on average, 28 up / 13 down, sign test
p = 0.028. Against the guardrails as shipped (no floor, so 4.4 points more floor rate bought by cuts
below 80%): years at target 0.87 against 0.45, whipsaw 2.7 against 30. Against fixed spending: +4.6
points of floor rate at the cost of trimming on 42 points of paths. The one household where the
guardrails deliver more years at target is S070, where the solver ends £1.2m richer. **Gate 2d is
met on the reduced model**: the flexible solver beats the guardrails at equal downside on every
reported figure except raises above target, which it does not make (2d.4). Three findings carried
into 2d.3: the landing undershoots the ask by more than half a point on 12 of 41 (worst 1.4, all in
the same direction), so a half-point margin is the default from here; the fully-funded rate reads
zero on 13 of 41 because the 0.95 level is nearly free under a squared shortfall, so the first trial
is the levels without it; six households needed no trimming at all and the solve returned in one
pass.

**Phase 2d.2 and 2d.3, five arms on the same seeds (tag flex-2d3; `results-2d-flex-2d3.txt`).** One
change to the solver, on the pilot's evidence: the 0.95 level dropped and a half-point landing margin.
Both adopted. Against the guardrails-with-floor at the same floor rate (92.7 both): years at target
0.87 → **0.92** (unlucky tenth 0.45 → 0.53), whipsaw 2.7 → **2.0** changes a run, fully funded
31.5 → **50.2** (the guardrails 13.8), ahead on **41 of 41**, median pot +£311k. The landing now
undershoots by more than half a point on 6 households (was 12), mean gap +0.1 (was −0.4). The two new
opponents, each with the person's floor but landed on nothing: Vanguard dynamic spending reaches a
floor rate of 90.4 with 0.80 years at target and 34 changes a run (its 2.5% steps are many small
ones); ARVA reaches 86.8 with 0.90 years at target, 33 changes, and ends with a tenth of everyone
else's pot, because it spends the pot. **Spending delivered is where the solver is behind**: median
run 0.991 of target-years against 1.054 (guardrails), 1.123 (Vanguard) and 1.832 (ARVA), ahead of the
guardrails on only 10 of 41, because every opponent raises and the solver never does; the solver's
larger end pot is that unspent surplus. That is the case for 2d.4, made on the numbers: the solver
protects the target better than any rule and keeps the surplus as bequest, and whether to spend some
of it is a preference the objective must be able to hold.

**Phase 2d.4 raise-weight sweep, 8 households (tags flex-mu-*; `results-2d4-sweep.txt`).** The credit
is weight × √(level − 1), capped at a 20% raise, levels 1.2 and 1.1 added to the menu, the penalty on
trims still bisected to land the floor. Even the smallest weight tried (0.005) raises more often than
the guardrails (21 years a run above target against 16) while still landing the floor on 8 of 8
(91.4 against 91.2), and is ahead on spending delivered (1.096 against 1.058 in the median run, 0.95
against 0.87 in the unlucky tenth) with 7 changes a run against 25 and £266k more pot. Three findings.
(1) The whipsaw gate: raises bring the changes-per-run figure from 2 to 7 at the smallest weight,
still a quarter of the guardrails', and falling as the weight rises (3 at 0.05, 1.4 at 0.15) because a
heavier credit holds the raise rather than dipping in and out. (2) The floor and the credit fight: from
0.05 up the bisection on the penalty cannot reach the confidence on half the households, because the
credit is in absolute score units while the penalty is scaled by λ, so at the small λ the bracket
starts from the credit still dominates. If a heavier preference is ever wanted, the credit should be a
ratio to λ (a raise worth ρ trims) so the bisection scales both and stays monotone; at the weights
that land, the absolute form is fine. (3) The calibration point is below the sweep: the guardrails'
16 years sits under 0.005, so the full pass runs at 0.003. What the sweep already shows: at any weight
that lands, the solver delivers more spending than the guardrails in the median run AND the unlucky
tenth, with a fraction of the whipsaw and a larger pot.

**Gate 6, the versus protocol with the tier as part of the move, 41 households (tag p6-tiers;
`results-p6-tiers.txt`).** Joint steps (pension and ISA down together, up to two tiers below the
plan's, never above), 40-point grid, the same seeds as gate 2e. Solver against the same menu held
fixed: **mean +5.03 points of survival (was +0.73 without tiers), 41 up / 0 down, sign test
p < 0.001, the app's own picker for the solver on 41 of 41**; against the app as it stands +5.06.
Every household gained from the tier freedom (smallest +1.1, largest +8.6 on S020, an ISA-heavy
household in drawdown), the unlucky tenth is £85k better and the median pot **£917k smaller**: the
solver buys survival with the upside, which is what the objective asks (survival first, the bequest
capped and lightly weighted). How it uses the freedom, on six households across the band: **one or
two tiers below the plan's for 72 to 91% of the years**, changing tier 3 to 7 times a run. The
plan-tier of most library households is the highest, so this reads as "the app's default risk is
above what a survival-first objective wants once the pot is ahead", and a bequest-weighted preset
would keep more of it; that is a product question for the presets, not a solver fault. Cost: the
solve took **2.05× the phase 2 time** on the same grid (45s against 22s, both measured with three
other jobs running), so the gate's 1.5× is not met as measured; every pair of tiers costs 4 to 5×
and adds nothing to the value, which is why the joint step is the default. Gate 6's first condition
is met by a wide margin, its time condition is missed by a third, and its safe-spend condition is
deferred with the spend dimension. Two follow-ups for Part C: a switching cost or a "stay unless it
is worth it" margin, because free switching flips tiers more than a person would; and the GIA's tier,
which needs a memory bucket.

**Phase 2d.4 full pass, 41 households (tag flex-2d4; `results-2d4-flex.txt`).** Raise weight 0.003,
levels 1.2 and 1.1 on the menu, everything else as flex-2d3. At the same floor rate as the guardrails
with floor (92.7 both, landed within half a point on 37 of 41) the solver now delivers **more spending:
1.116 of target-years against 1.054 in the median run (ahead on 34 of 41) and 0.96 against 0.87 in the
unlucky tenth (ahead on 41 of 41)**, with 5.7 changes a run against 26 and the same median pot (+£7k):
the surplus the no-raise solver kept as bequest is now spent, and spent where the value function says
it is safe. It raises in 23 years a run against the guardrails' 17, so the calibration point sits
lower still (about 0.0015), and the "equal pot" reading is the more natural one: at 0.003 the solver
and the guardrails end with the same money, and the solver has spent 6% more of it on the way while
keeping the target in 93% of years against 52%. Against Vanguard it delivers the same spending (1.116
against 1.123) at 2.4 points more floor rate, a sixth of the whipsaw and £382k more pot; against ARVA
it delivers far less (ARVA spends the pot: 1.83) at 5.9 points more floor rate and ten times the pot,
and is ahead in the unlucky tenth on only 12 of 41, because ARVA's unlucky paths still spend the pot
down. **2d.4 done, and adopted as an option, not the default**: the raise weight is the preference the
presets expose (0 keeps the surplus as bequest; 0.003 spends it), and the whipsaw it adds (2 → 5.7
changes a run) is the price of the raises, still a fifth of any rule's. The one household where the
confidence was not reachable with raises on (S154, early bridge, GIA-heavy, 75%) is the one whose
floor rate is lowest, where the credit and the penalty fight at the bottom of the bracket.

**Gate 6 re-run with a switching cost (tag p6-tiers-cost; `results-p6-tiers-cost.txt`).** A tier
change is a sale and a purchase of the slice that moves: from the highest tier (90% equities) to the
next (70%) a fifth of the wrapper is traded. On a UK platform that costs the spread and any dealing
charge both ways and a day or two out of the market, about a tenth of a percent each way, so **0.25%
of the slice traded** is charged to the wrapper the year the tier changes: £400 on a £400k pension
for a two-tier step, a tenth of a percent of the pot. It is charged at decision time given the tier
held (the forward run remembers it); the table is solved with free switching, an optimism of well
under a tenth of a percent of the pot per step. Result: the edge is **+4.97 (was +5.03), 41 of 41,
picker 41 of 41**, the solver spends £5.9k a run on switching (£1k to £22k by household), the median
pot is £21k lower than with free switching and the unlucky tenth unchanged. Flipping fell by a third
at the grid the pilots use (six households at 30 points: 4.8 → 3.4 changes a run) and sits at 5.1 a
run at 40 points, 2.5 to 8.8 by household: the cost removes the flips worth less than their price
and leaves the ones the value function pays for, which is what a cost should do. The realistic cost
is small enough that the tier freedom survives it whole; a household that wants fewer moves needs a
preference (a hysteresis margin), not a bigger cost. Adopted: the cost is on whenever tiers are.

**Gate 6 re-run with the worth-it margin (tag p6-tiers-margin; `results-p6-tiers-margin.txt`).** The
cost alone left 5 changes a run, because a realistic cost is small against what the table sees in
most flips. So a change is now made only when the table's gain from it beats a margin, a tenth of a
survival point (0.001 of score): the moves that keep the tiers held are scored on their own, and if
the best of them is within the margin of the best overall, it is chosen. A sweep on six households
(one solve each, the margin applied at decision time) put the knee at 0.001: changes 3.4 → 1.6 a run
with survival and both pots unchanged, while 0.002 and above began blocking the first de-risking step
rather than the flips (years below the plan tier 31 → 24 → 13, survival down). On the 41 households:
**edge +4.91 (free 5.03, cost 4.97), 41 of 41, picker 41 of 41; tier changes 1.7 a run (was 5.1),
0.7 to 3.2 by household; switching cost paid £2.9k a run (was £5.9k)**; median pot £48k below the
cost-only run, the unlucky tenth £3k. The household now changes tier about twice in a retirement and
pays about £3k to do it, which reads like advice rather than trading. Adopted: cost and margin are
both on whenever tiers are.

**Gate 3, the bridge (`research/tests/solver-bridge.test.mjs`, 27 assertions).** The engine honours
`spending.policyOverride = { kind: 'table', choose }`: at the top of each year `choose(state, t,
tiersHeld)` returns the move and the year runs on a context carrying it (draw order, cost order,
harvesting, the lump sum), with the spend level applied to the target, the model's cash sweep as step
7d, the tier's switching cost and growth as step 7f, and the audit row gaining `action`, `spendLevel`,
`tierPen`, `tierIsa` and `switchPaid`. `src/solver/bridge.js` turns a solve result into that override
(`tablePolicy`, `withTable`) and maps the engine's state to the model's without copying. Results: a
table that answers with the plan's own settings reproduces the engine to the pound on eight households,
deterministic and on 160 Monte Carlo paths; the opening position is the same vector from either side
and still is after two years; the solved table through the real engine scores **within 0.5 of a point
of the model's forecast on all three households tried** (gate asked 2), and beats the plan's own rule
in the real engine (+0.6 on average, +2.1 on the far household). A pension forced two tiers down pays
the round trip once and compounds at that tier's rate. One known gap kept honest: the sweep's top-up
sale books its gain into next year's tally in the engine, which the reduced model does not tax.

**Gate 3 on the pre-registered set, and what it found (tags bridge-41, bridge-41-fold;
`results-p3-bridge-41-before.txt`, `results-p3-bridge-41-fold2.txt`).** The first gate-3 run used three
households picked by position in the library, two of them at 99.5 and 100% survival; on the 41 band
households the gate's condition **failed**: the real engine scored the solved table 4.4 points below
the reduced model's forecast on average, worst 9.0, within 2 points on only 4 of 41, and the gap was
negative on every household. The cause was isolated on the worst case by zeroing the per-path mean
shift (sigmaParam) in both: the gap went from −4.7 to −0.2. The reduced model folded that shift
into each year's spread as one year's noise; a shift held for n years disperses the outcome as n²σ²,
not nσ², so the model understated a long horizon's spread and thought long retirements safer than
the engine does. The fold was rewritten to grow with the years left (`foldedVol`, the (2n − 1) rule
that matches a held pot's growth variance over every remaining horizon exactly): on the 41 the gap
flipped to +3.1 on average, positive on every household, so the exact rule overshoots for a pot
being drawn down and a solver that fails year by year. The rule is therefore parametrised
(vol² + (1 + k(n − 1))σ²; k = 0 the old fold, k = 2 the exact sum) and k is calibrated on the
model-to-engine gap (sweep below). Two things did not move: the engine's score of the fixed rule
(the engine is the same engine), and the solved table's own engine score (83.8 → 84.0), which
says the policy is nearly insensitive to the fold and the fold mostly changes the forecast. The edge
in the real engine against the plan's own rule is +1.6 to +1.7 on average, up on 30 to 33 of 41,
worst −1.2, on either fold.

**Gate 3 at the calibrated fold (tag bridge-41-k075; `results-p3-bridge-41-k075.txt`).** The sweep on
eight households put the gap's zero between k = 0.5 (−1.0) and k = 1 (+1.0), so the fold runs at
k = 0.75. On the 41: **model-to-engine gap mean −1.07 (was −4.39), within 2 points on 32 of 41
(was 4), within 1 on 21, worst −4.6**; the edge in the real engine against the plan's own rule
**+1.63, up on 32, down on 9, worst −0.97, median pot +£322k**. The gate as written (within 2 on every
household) is met in the mean and on 32 of 41, not on all: the nine outside are mostly the far-from-
retirement households, where a shift held for 40 or more years correlates the whole path in a way no
memoryless fold can carry. Recorded as met with that residual named; the honest answer to "does the
engine agree with the model" is now "to about a point, and to two points on four in five households",
and the honest measure of the solver is the engine's own score, which every later gate uses.

**The versus results re-measured under the calibrated fold (tags p2-fold, p6-fold; `results-p2-fold.txt`,
`results-p6-fold.txt`).** Every earlier edge was solved and forecast under the one-year fold, so both were
re-run on the same seeds with the fold at k = 0.75. Withdrawal order only: **+0.86 (was +0.73), 33 up /
6 down beyond two standard errors, the app's picker for the solver on 34 (was 30)**, unlucky tenth +£35k,
median pot −£226k. The tier as a move with the switching cost and the margin: **+6.13 (was +4.91),
41 of 41 up, picker 41 of 41**, unlucky tenth +£123k, median pot −£889k, 1.7 tier changes a run, £3.3k
paid. Both edges grew under the corrected model, which is the direction one would expect: a model that
sees the long horizon's true spread values de-risking and tax-efficiency more, and those are the two
things the solver does that the fixed rules cannot. The results the plan quotes from here are these.

**Gate 3 with the scenario mixture, 41 households (tag bridge-41-mix5; `results-p3-bridge-41-mix5.txt`).**
The statistician's option 1: five tables per household, each solved with the per-path shift held at a
Gauss–Hermite node for the whole horizon and the yearly spread the plain volatility, the move chosen by
the weighted average of the five scores; the forward run applies each path's own shift as the engine
does. Learning which world the path drew is discarded, and costs nothing here (twenty years of returns
narrow the mean from ±2.1 to ±1.8 points). Result: **model-to-engine gap −0.15 on average, within 2
points on 41 of 41, within 1 on 39 of 41, worst −1.4** (the calibrated fold: −1.07, 32 of 41, worst
−4.6; the one-year fold: −4.39, 4 of 41). Twenty households agree to the tenth of a point; the 21 that
differ still lean negative (18 to 3, sign test p = 0.001), by a few tenths, which is the correlation a
persistent shift adds across years that no memoryless model carries. The engine's score of the plan is
unchanged (83.86 against 83.87 under the fold, 83.80 under the one-year fold), so the mixture changes
the forecast, not the tactics. Cost: five solves, 67 s against 13 s on the 30-point grid, independent
and parallel. **Gate 3 is met with no tuned constant. Adopted**: the mixture is the default for every
gate, forecast and floor landing from here (`MIX=5`; `solveMixture`), the fold kept at k = 0.75 as the
cheap single-table option and for the app's first draft while the worker fan-out is built (Part C).
The two versus results under the fold (p2-fold, p6-fold) stand as the quoted edges: they are paired
forecasts, so the fold's small bias cancels between arms, and the engine edge (+1.62 against the plan's
own rule, up on 31 of 41) is the product's number. The spending pilot re-run under the
mixture, whose floor landings are the one place the forecast's bias reaches a promise, was run next: its
first pass (tag flex-mix) found the landing itself was measured on the wrong sample and is shelved
(`results-2d-flex-mix.txt`); the clean pass with the fixed landing is tag flex-landed.

**The tier solver scored by the real engine (tag bridge-41-tiers; `results-p3-bridge-41-tiers.txt`).**
The large edges had only been measured in the reduced model; this is the referee's number. Five-world
mixture, joint tier steps with the switching cost and the margin, through the real engine on the 41
against the plan's own rule on the same 3,000 paths: **+6.16 points of survival, up on 41 of 41, worst
+1.5, best +12.1**; the forecast within 2 points of the engine on all 41 (mean −0.17). Against the
withdrawal-only solver in the same engine, +4.54, better on every household. The trade is the one the
model showed: the median pot £459k smaller, the unlucky tenth £94k larger. The model's +6.13 and the
engine's +6.16 agree to the decimal, which closes the question of whether the model's edges survive
contact with the engine. Cost: five tables with tiers, 130 s a household with four jobs on four cores.

**Three worlds are enough (tag bridge-41-mix3; `results-p3-bridge-41-mix3.txt`).** The three-node
mixture (−√3, 0, +√3 with weights 1/6, 2/3, 1/6, exact for the bell curve to second order) matches the
five-node one on the 41 to the hundredth: gap −0.15 against −0.15, within a point on 39 of 41 both, the
engine's score of the plan 83.86 both, at 40 s against 71 s a household. Three is the default; the app's
first solve is then three tables in parallel, about the cost of one.

**Gate 5, couples by rollout (tag couple-20; `results-p5-couples.txt`).** Nineteen households across
the couple band, three-world mixture, 2,000 held-out paths, every arm in the exact model on the engine's
market. Rollout against the best of the same 24-move menu: **+0.77 points of survival, 14 up / 3 down
beyond two standard errors, sign test p = 0.013, worst −0.85, median pot +£97k**; against the plan's own
rule +0.91, 14 up / 2 down, p = 0.004, median pot +£217k. The split is used in 29 of about 32 retired
years a run and averages 0.49, even overall but not even in any one household (0.33 to 0.72): it leans
on whichever person's wrappers the tables say can bear it. Gate 5's survival conditions are met (the
mean beats the epsilon, no household is worse by more than a point); its backtest and perturbed-world
conditions, inherited from gate 4, have not been run for couples. Three households lose by up to 0.85,
two of them with the most uneven splits (0.72, 0.66), which is where the single tables' assumption that
the split stays even is most wrong; a second rollout step, or tables solved at the split the rollout
tends to, are the candidates. The couples' edge is the singles' withdrawal-order edge in size (+0.86),
which is what it should be: the tier freedom that gave the singles +6 is off for couples in this pilot.
Cost: 81 s to solve the two people, 164 s to run 2,000 paths under the rollout.

**Phase 2d under the mixture, clean (tag flex-landed; `results-2d-flex-landed.txt`).** The re-run with
the fixed landing, from a frozen snapshot so all 41 share one solver. **It lands 41 of 41**, against 28
of the 35 clean households in the shelved pilot; the margin runs from −0.27 to +2.10 with a mean of
+0.80, and nothing is short by more than a third of a point. The cost of keeping the promise is
visible: lambda is 0.69 of what it was, so the solver trims about a third more, and paired on the 35
the two runs share, years at or above target fall 0.037 and spending delivered 0.005. Against the
guardrails at equal downside on the 41: floor rate +0.73, **years at or above target 0.849 against
0.439**, spending delivered 1.101 against 1.012, 5.2 spend-level changes a run against 26.4, median pot
+£186k. Against Vanguard +3.50 on the floor with a £472k larger pot; against ARVA +7.53. One metric
runs the other way and belongs in the product copy rather than a footnote: the fully-funded rate (never
below target in any year) is +13.4 on the mean but 22 up / 19 down, p = 0.755, because the solver makes
small adjustments across most futures while the guardrails leave good futures untouched and cut hard in
bad ones. Cost 1.29× the pilot (5.0 solves a household, 26.6 core-hours for the 41), not the 2.2× first
measured under contention. Seven households finishing at the bottom of the lambda bracket were
mislabelled "confidence not reachable"; every one delivered within 0.37 of an ask between 97.6 and 99.0,
and the label now reads "at the bracket floor" with no behaviour changed.

**The floor landing was measured on the wrong sample (`results-2d-flex-landing.txt`).** In the
flex-mix pilot three households missed their floor by about a point. None of it was the solver: all
three MET their ask on the 600 search paths lambda is chosen on, and fell 1.5 to 2.1 points short on
the 3,000 held-out paths it is judged on, each gap about one standard error of a 600-path estimate.
`solveFlex` searched on seed 7001 and promised on 7002, which is the arrangement `optimizeSpend`
already warns about in the app after the same bug was found there ("all twelve of twelve fixtures came
back 0.5 to 2.4 points BELOW the target"). The low solve counts were a symptom: the bisection breaks as
soon as the noisy estimate clears. Confirmed by brute force, search paths 600 to 5,400: all three land,
at 2.2x the runtime. `solveFlex` now draws one sample so the search set is a prefix of the verification
set, and re-measures the chosen table on the full draw before returning. The first version of that
verification was a worse bug than the one it fixed, landing the floor by over-trimming on all three
(lambda collapsing tenfold to the bracket bottom, the floor cleared by 2 to 7 points, years at the full
target halving); stage 2 now interpolates for the crossing rather than bisecting to it. Two debts:
single-stage at 5,400 paths is the proven option and the two-stage design must beat it head to head
before it stays the default, and the unit suite passed both the broken version and the repair, so a
landing assertion with teeth is owed. Audited the same pattern elsewhere: `optimizeSpend`,
`safeRetirementAge` and the Monte Carlo spend dial all verify already; the tournament's headline is
re-scored at 4,000 paths and only its search panel needed labelling; `pickFixed` is left alone because
choosing the opponent on search data models what the app does for a user.

**Experiments run from a snapshot, always.** `solve.js` was edited three times while the 41-household
flex-mix run was in flight, and the batch spawns a fresh Node per household, so the run is a mix of
three solver versions and is not reportable. The 33 that finished before the first edit are clean. Two
rules follow: batch scripts copy the tree and run from the copy, and every result record carries a
solver version stamp so contamination shows in the JSON instead of being reconstructed from process
start times.

**The grid's ceiling: the multiple stays (`results-grid-ceiling.txt`).** The wealth axis tops out at
the larger of 60 years of spending and six times what the household opens with, so a wealthy
household's axis stretches and its cliff is resolved by fewer points: 10 across 5 to 40 years of
spending against 12 for a lean one, 11.22 on average over the 41. A fixed ceiling was tested against
it on the six most-stretched households. It loses: at 60 years the table's bias is better on one and
worse on three, and at 40 years it is worse on all six, by up to 10 points. Wealth that compounds
past the top is clamped to the top point, so a tight ceiling makes the table pessimistic, and that
costs more than the extra resolution buys. The best move was identical under all three ceilings, so
the ceiling is a forecasting parameter, not a tactical one. Two bugs fell out: `opts.headroom || 6`
read a headroom of 0 as absent, so the knob could not be set at all (now `??`), and `bias.mjs` and
`diagnose.mjs` still allocated the 6-slot state vector that grew to 7 with the cash-ISA slot. One
anomaly is logged and not chased: S126 reads 7.5% at its opening cell against 96.8% simulated.

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

### Phase 2c. Before Phase 3: what the literature says to do first (`research/solver/LITERATURE.md`)

Four additions, decided after the phase 2 experiment was designed and while it ran, so none of them
could bend it. Each is a re-run on the SAME 41 households, the same seeds, the same reduce; none
touches the engine or the app.

**2c.1 The perturbed-model evaluation.** Every serious published comparison solves under a fitted
model and then tests on data that model did not generate (Forsyth: block-bootstrap resamples of
history). Ours tests on held-out seeds of the same model, which rules out luck and nothing else. So:
both arms, solved and chosen as they were, are re-scored on the engine with each of three
perturbations the solver never saw: expected real return down one point on every tier; volatility up
a quarter; a fatter left tail (the per-path shock `sigmaParam` doubled). Reported exactly as the main
experiment is, one table per perturbation. **Read:** the solver's edge must keep its sign under all
three. An edge that flips under any of them is a property of the model, not of the policy, and
Phase 3 does not start. Where the engine can be driven from a return series, a block-bootstrap of the
historical years is the fourth table.

**2c.2 Expected shortfall in place of the resilience indicator.** `P(terminal ≥ opening)` is a step,
and a step objective rewards a gamble at the line; the ruin literature shows the ruin-minimising
investor takes MORE risk as wealth falls. Replace it with expected shortfall below the threshold,
`E[max(0, K − W_T)] / K` with `K` the opening wealth, which is additive over paths and so stays
exactly decomposable for the backward pass; the weight is set so that a full shortfall costs what the
indicator did (0.5). Gate 2 re-run (B1 and B2 must still hold), then the 41 households re-run.
**Read:** a survival edge no smaller than before with a smaller median-pot cost is the expected
result; anything else is written down.

**2c.3 The weights tuned on households the experiment never sees.** The two weights (0.5, 0.02) are
preferences, not estimates, and they are the only free parameters. The band has 82 households and
the experiment uses the even-indexed 41; the odd-indexed 41 are the tuning set. Grid the pair over
{0.25, 0.5, 1} × {0, 0.02, 0.1}, score each by the app's own picker rate on the odd set, and re-run the
even set only if the winner differs from (0.5, 0.02). **Read:** if the tuned pair changes the even-set
verdict, the earlier verdict was the weights' and not the method's.

**2c.4 The loss ledger.** Every household the solver loses by more than two standard errors gets a
year-by-year diff against the fixed plan on the same seeds, written into the results log with the
approximation it points at (grid smear near the cliff, the five-node return, the merged or bucketed
state, or the objective). S070 (−2.1, just-retired, pension-heavy, £215k more lifetime tax) is the
first entry. A loss with no named cause is a finding against the method; a loss with a named cause is
a work item, and the ledger is what decides which approximations get tightened first.

**Gate 2c:** sign held under all three perturbations; 2c.2 not worse on survival and better on the
median pot; the tuned weights either confirm (0.5, 0.02) or the even set is re-run and the verdict
re-stated; every loss in the ledger has a named cause or is recorded as unexplained.

### Phase 2d. The Part D pilot, in the reduced model, before any bridge is built

Every published gain worth having came from spending that responds to wealth; every withdrawal-order
study found a modest one (DiLellio and Ostrov: ten percent of a bequest). Phase 2 is a
withdrawal-order test, so a mean of half a point is what the literature predicts for it and is not the
case for or against the method. The case is Part D, and it can be run in the reduced model now:
spend as an action with a target and a floor exactly as Part D specifies, the solver against the
engine's guardrails on the same 41 households at the same floor and confidence, reported by Part D's
rule (fully-funded rate never omitted, floor rate never alone). Three moves per drawing year triples
the move count; five minutes a household at 20 points. **This is the experiment that decides whether
the solver ships. Phase 3 waits for it.**

Three arms, not two, and the judge is the reporting rule. (1) The app with Guyton-Klinger on, exactly
as it ships: the honest "what you get today". (2) Guyton-Klinger with the person's floor: GK's 10% cuts
have no floor of their own and can cut below the minimum the person named, so a version whose cuts stop
at the floor is the like-for-like opponent that sees the same inputs the solver sees; it is probably an
improvement to the app in its own right. (3) Fixed spending at the target, the phase 2 fixed arm, so the
result can say what flexibility of any kind buys before arguing about whose is better. Survival is
gameable once spending can flex (cut to the floor early and everything survives), so each arm reports
the fully-funded rate and the floor rate, and the comparison is Pfau's: hold the floor rate equal, then
ask who delivered more years at the target. Plumbing first: guardrails are a projection-time rule the
fast flow does not have, and the paired-seed design needs every arm on the same draws, so GK goes into
the fast flow and the model, proved against the engine by the golden test, before any solve.

**The queue after the first pass (2d.2 and 2d.3).** Two more opponents, as fast-flow forward-run arms
carrying their memory in extra state slots the way GK does: Vanguard's dynamic spending (a percentage
of the pot, bounded to +5% / −2.5% of last year's spend - the deliberately smooth rule, the fair test of
whipsaw) and ARVA / percentage-of-pot by remaining years (Waring and Siegel; the rule that never runs
out, spends up in good times, and is the benchmark of the decumulation literature - the fair test of
raises). Risk-based guardrails (cut below 70% success, raise above 95%, re-projected yearly) are noted
as the closest practical rival and left for a nested-simulation study if the solver clears the first
three. Then 2d.3: whatever the first pass shows about the solver's own method - the levels, the
shortfall exponent, the landing tolerance, a memory dimension if whipsaw appears, the ask's cap - is
changed once, on the evidence, and every arm re-run on the same seeds. Findings from the first pass are
listed under the results below as they land.

**2d.4, at the end of the queue: spending above the target when it has been a great run.** The solver
never spends above the plan, because nothing in its objective rewards it: the shortfall term punishes
levels below 1 and is silent above it, so a level of 1.1 would never be chosen. The guardrails raise
10% whenever the draw has fallen a fifth below its starting rate of the pot, and on this pass that is
3 to 28 years a run. The exploration: add levels above 1 to the menu (1.1, then 1.2, matching the
size of a GK raise) and a bounded reward for them, a concave credit for spending delivered above the
target so that a raise is taken only when the pot is well ahead of the plan and the table still meets
the confidence on the floor. The trade is priced by the value function: a raise this year means a
smaller pot next year, and the table already says what that costs in survival, resilience and
bequest over every later year and path, so a raise is taken only where the credit beats that cost -
which the guardrails' band cannot know. The reward weight converts spending into the score's units,
and there is no ground truth for it, so for the experiment it is tuned so the solver's above-target
years land near the guardrails' count on the same households: a calibration for a fair comparison
at equal downside AND a similar rate of raises, not a claim that the guardrails' rate is right. In
the product it is a preference, exposed as the bequest weight is (never raise; raise a little when
well ahead; treat a good run as licence to spend), each preset reported on the same three figures.
The bisection on the penalty stays whatever the weight, so raises come only out of the surplus the
confidence leaves. Measured on
spending delivered (mean level, median run and unlucky tenth), years at or above target, whipsaw,
and the end pot, against every arm on the same seeds. What to watch: a raise that is later trimmed
is the whipsaw the solver has so far avoided, so the changes-per-run figure is a gate, not a
footnote; and a raise spends the bequest, so the presets must expose the trade as they do the
bequest weight.

**Findings at the quarter mark of the equal-downside pass (ten households), for 2d.3.**
(a) At the same floor rate the solver delivers nearly twice the years at target in the median run
(0.66 against 0.35) and five times in the unlucky tenth (0.20 against 0.04), changes the spend level
4 times a run against the guardrails' 24, and ends with a larger median pot on all ten. (b) The
guardrails spend ABOVE target 3 to 18 years a run (the raises); the solver never does, so the report
needs total spending delivered (the mean spend level over retirement) beside years at target, or it
flatters the solver. (c) The solver trims at least once in every run on seven of ten households even
when the ask is modest: with the shortfall squared, a 5% trim costs a hundredth of a 50% one, so the
0.95 level is sprinkled freely and the fully-funded rate reads zero. Candidate changes, to be tried
one at a time: the levels without 0.95, and a linear shortfall (exponent 1) that makes small trims
proportionally dear. (d) The landing undershoots the ask on held-out paths by up to 0.8 of a point
(the penalty is chosen on the search paths, a winner's curse). Candidate: land at the ask plus half a
point, or 1,000 search paths. (e) The one household where the guardrails deliver more years at target
(S070) is the one where the solver ends £1.2m richer: the objective is trading years at target for the
pot there, which the bequest weight governs and the presets should expose.

**At 34 of 41 households, three signals firm enough to act on before the pass lands.** (1) The
headline holds at equal downside: more years at target on 33 of 34 (median 0.85 against 0.51, unlucky
tenth 0.43 against 0.06), a tenth of the whipsaw, richer on 28 of 34. (2) The landing undershoots the
ask on 10 of 34, always in the same direction and always by under a point: systematic, so the half-point
margin is the default from the 2d.3 re-run on, not a candidate. (3) Fully funded reads zero on 12 of 34
while four households needed no trim at all: the 0.95 level is the cause, so the first 2d.3 trial is the
levels without it, the linear exponent second only if that fails to move it.

**How the 2d.2 opponents are built.** Both run in the fast flow as rules in the same four memory slots
the guardrails use, with the person's floor applied exactly as it is to the guardrails-with-floor arm,
and each fixed arm's withdrawal order chosen by the app's picker with that rule on. Vanguard dynamic
spending: the first retired year's draw as a rate of the pot; each later year's draw is that rate of
the pot, held within +5% and −2.5% of last year's draw in real terms. ARVA: each year's draw is the pot
spread as a level real annuity over the years the plan has left, at the household's own geometric
expected real return (its pots' expected returns less half their variance, floored at zero); the
literature's rate is a riskless real yield, which would make ARVA spend less and sooner cut - the
household's own assumption is used because the solver and the guardrails are calibrated on the same
assumption, so no arm is told more about the future than the others. Both re-foot, not react, when the
plan itself changes what it draws (the State Pension starting, a band beginning), as the guardrails
do. Total spending delivered (the mean spend level over the retired years, median run and unlucky
tenth) is reported beside years at target from this pass on, per finding (b).

### Phase 2e. Two engine gaps that flatter the taxable side, to close before any bridge

Both are engine work, not solver work; the solver inherits them through the fast flow's tax table and
the model's golden test, which is why they come before Phase 3 and not after. Neither changes the
phase 2 verdict (both make the wrapper split matter MORE, in the direction the solver already wins),
but a bridge is the moment the engine's tax and the solver's must agree to the pound, and they should
agree on the truth.

**2e.1 Tax on savings interest.** Cash Savings is modelled with no tax on its interest and the docs
say so: it stands for a cash ISA or savings inside the personal savings allowance. Add the allowance
(£1,000 basic, £500 higher, nil additional; the starting rate for savings where earned income is
below it) as a config field with the other allowances, tax interest above it as income in the year it
arises, and let the plan hold cash as "cash ISA" (untaxed, counts against the ISA allowance) or
"savings" (taxed). Default for existing plans: savings within the allowance behave exactly as today,
so no plan's numbers move unless it holds enough cash to breach it. Golden test: a household with
£200k of taxable cash at 4% pays the right tax at each band and the solver's model matches the engine
to the pound.

**2e.2 Dividend tax in the GIA.** The GIA is taxed only as CGT on disposal; dividends inside it are not
taxed. Built as one configurable dividend yield for the GIA (2% a year by default; the capital-market
presets carry no income component to derive a per-tier figure from, so per tier is a later refinement),
the dividend allowance and the three dividend rates as config fields, and the excess taxed at the
dividend rate of the band it falls in, in the year it arises, with the yield paid out of the return
(not on top of it) so total return is unchanged. Golden test as above.

**Gate 2e:** both engine tests green; the phase 1 golden test still exact; the 41-household experiment
re-run once with both on, expecting the solver's edge to hold or grow and the cash-heavy and GIA-heavy
households' fixed arms to fall.

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
point, the historical backtest is not worse on average, and the sign holds on the three perturbed
engines of Phase 2c. Anything short of that and the write-up
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

**How 5 is built (21 Sep).** `src/solver/couple.js`. The reduced model already steps couples to the pound
(the golden test's twenty couples), so everything runs in it, on the engine's own market (a yearly draw
per wrapper, a held shift per path). Each person gets a single plan cut from the couple's: their own
wrappers and incomes, their own ages, half the household's spending, the household's horizon year for
year; a table is solved for each (the mixture by default). The model's year gains two action fields:
`split`, the first person's share of the household's net need (the engine's rule is even), and
`perOwner`, each person's own draw order and harvest; at each step index the two draw from their own
k-th pot and then cover each other's shortfall, which is the engine's interleaving exactly when the
orders match. Each year the joint move is chosen by one-step rollout: five splits (0, ¼, ½, ¾, 1) times
each person's two best moves from their own table at their own position, each candidate stepped one
exact year in the model and valued by the two tables after growth, over the market's five nodes and
the mixture's worlds, with survival and resilience multiplied (both must last) and the bequest summed.
An infeasible candidate is dropped; if none funds the year the even split with each first-ranked move
is taken and the year fails on its own terms. Cost: two solves plus about 20 model steps and 300 table
reads a decision, 25 ms a path, so 2,000 held-out paths in under a minute. Tiers are off for couples in
this pilot. The gate runs on 20 households across the couple band (74 couples with the plan's own rule
between 70 and 98 on the search seed), the arms being the rollout, the plan's own rule, and the best of
the same 24-move menu picked on the search seed, all in the same model on the same paths.

### Phase 6. The risk tier as an action, and spend as a dimension

- Each wrapper's action set gains the tier set on Plan Inputs and up to two tiers below it; never above.
  Rebalancing inside a wrapper is free; in the GIA it realises gain through `gainFrac`.
- Spend target becomes the seventh state dimension, at eight levels around the plan's target (60% to
  130%). With it the safe spend, the safe retirement age, the age-against-spend grid and the quick
  dials are all reads from the table.

**Gate 6:** the versus protocol with tiers on; the safe spend from the table within £500 of
`optimizeSpend` on the same plan; the solve stays inside 1.5× the Phase 2 budget.

**How 6 is built (decided before the build, 20 Sep).** The tier is part of the move, not of the state:
switching funds inside the pension or the ISA is free and leaves nothing to remember, so the grid gains
no dimension and every cell simply has more moves. The GIA's tier stays the plan's for now, because a
switch there realises gain and the cost of the next switch depends on the last, which is a memory the
grid does not carry (a fourth bucket if it ever earns one). Each wrapper offers its plan tier and up to
two below, so a household has up to nine tier pairs; a move's tier variants share its flow (the year's
draws and tax are the same whatever the funds hold) and differ only in growth, so the flow runs once per
base move and the variants pay only for growth and the table reads. The forward run grows each year at
the tiers the chosen move holds, and reports the years each wrapper sat below its plan tier and how often
the tiers changed. The fixed arms cannot change tier, which is the point of the comparison. The second
half of the phase as first written, the spend target as a seventh dimension, is deferred: Part D now
carries spend as levels on the move, and the safe spend and the age-against-spend grid can be read by a
sweep of solves rather than a dimension; that is decided when Part C reaches them.

### Phase 6b. Flexible spending and the tier as a move, together

Pre-registered 21 Sep, before any run. The two presets ship together, off by default, so a household can
turn on both; nothing above tests that. Phase 2d has spending flexible with the tier fixed, Phase 6 has
the tier free with spending fixed, and their headline figures come from two solvers that have never
been the same solver.

**The run (tag flex-tiers, `batch-flex-tiers.sh`, from a snapshot, nothing else on the box).** The same
41 households, seeds 7001/7002, 3,000 held-out paths, three-world mixture, 30 points, exactly the
flex-landed configuration (levels 1.2/1.1/1/0.9/0.8, raise weight 0.003, CONF=gkFloor, margin 0.5pt,
single-stage landing on 5,400 search paths) plus `TIERS=1`: joint steps, the switching cost, the
worth-it margin. The ask is the guardrails' floor rate, which does not depend on tiers, so every
household's ask is identical in flex-landed and flex-tiers and the two solvers can be compared
household by household on the same paths.

**Hypothesis.** De-risking narrows the spread of outcomes, so the floor is easier to hold and less
trimming buys the same promise: with tiers on, years at or above target and spending delivered should
rise at equal floor, and the median pot should not fall by more than the tier trade already seen.

**Gate 6b passes when all four hold:**
1. Landing: floor rate at or above each household's ask less 0.5 on all 41, and no household more
   than 2 points above its ask (the over-trim guard, C4b in the suite).
2. Against flex-landed, paired on the 41: years at or above target (median run) not lower on the mean,
   and spending delivered (mean level, median run) not lower; sign test reported.
3. Cost: solve time per household at most 2.5x flex-landed (Phase 6 measured the tier menu at 2x).
4. Tier behaviour: at most 3 tier changes a retirement on the mean (Phase 6: 1.7), years below the
   plan tier reported per household.

Reported, not gated: the comparison against the guardrails at equal downside, and the decomposition
per household of (flex-tiers minus flex-landed), which is what the tier freedom adds on top of flexible
spending. If 2 fails because the tiers trade spending for pot, that is a finding about the objective,
not a bug, and the preset copy has to say so.

**Run 22 Sep, 01:42 to 13:05 UTC, 43.6 core-hours (`results-p6b-flex-tiers.txt`). Conditions 2, 3 and 4
pass; condition 1's over-trim clause fails as written on 9 of 41. Not merged, not re-specified.**

- 1a lands 41 of 41, margin +0.27 to +3.00, mean +1.33. 1b (nothing more than 2 points above the ask)
  fails on nine. Seven of the nine took no trimming at all - lambda at the bracket **top**, one solve,
  zero trims - which is the case C4b was not written for: it excuses the bracket bottom, and flex-landed
  had 0 of 41 needing no trimming against this run's 18 of 41. The other two, S268 (+2.73) and S292
  (+2.37) on the held-out sample, are +1.40 and +0.73 on the 5,400 search paths the landing actually
  optimised against, and both trim *less* than they did in flex-landed. Nothing over-trimmed; the clause
  still failed, and re-specifying a pre-registered condition after seeing the numbers is not mine to do.
- 2 passes: years at or above target +0.125 (30 up / 1 down, p = 0.000); spending delivered +0.001 on the
  mean but 15 up / 23 down, so tiers buy consistency of spending rather than more of it.
- 3 passes at 1.80x mean (gate 2.5x), cheaper than expected because 18 of 41 need one solve instead of
  five. 4 passes at 1.57 tier changes a retirement (gate 3).
- The headline is the fully-funded rate against the guardrails: +54.93 points, 37 up / 4 down, p = 0.000,
  where flex-landed managed +13.43 at p = 0.755. The pot falls £870k against flex-landed, 3 up / 38 down,
  which is the tier trade Phase 6 already measured at £917k and not larger.
- Left open, ungated and worth a read before any preset ships: the solver holds a de-risked pension tier
  for 0.70 of retired years on the mean and up to 0.97. That is not de-risking with age, it is a
  different portfolio for most of retirement, and the copy cannot call it a glidepath if it is not one.

### Phase 6c. The bequest shape: a shoulder, not a cliff

Pre-registered 22 Sep, after gate 6b and before any code. **This is an objective change, so it cannot be
gated on the solver scoring better: the objective is what "better" means.** It is gated on the cliff
being gone and on nothing else moving.

**What 6b exposed.** The bequest term is `wB x min(net, 4 x openingWealth)`. Above four times opening
wealth an extra pound of estate scores exactly zero, so the solver is *indifferent* there and will trade
the pot away for any gain at all. Measured on the 41: the cap binds on **9 households** (all 52 or 61
year horizons), and of the £35.9M of median pot the tiers gave up against flex-landed, **£12.8M sat
above the cap and cost nothing in the score**. S354 went £7.31M to £4.69M with both ends above its
£3.80M cap: the whole £2.6M was free. The other £23.1M was below the cap, priced, and chosen - that part
is the objective doing what it was told, and it is a question about `wB`, not about the cap.

The cap earns its keep. Survival and resilience are bounded; an estate is not, and an unbounded average
is dominated by the lucky tail - a strategy leaving £200M in one future of a hundred beats one leaving
£1M in all hundred on the mean. The fault is not that the solver stops chasing upside, it is that it
stops caring *abruptly*.

**The change.** `opts.bequestShape`, `'cap'` (today, the default) or `'soft'`:

    soft(net) = net                                             for net <= cap
              = cap x (1 + ln(1 + (net - cap) / cap))           for net >  cap

Identical below the cap, C1-continuous at it (both one-sided derivatives are 1), and above it the
marginal value decays like cap/net - always positive, never zero. An outcome a hundred times the cap
scores about 5.6 cap, not 100, so the lottery ticket still loses. The same shape the raise credit
already uses, for the same reason.

**Gate 6c passes when all four hold:**
1. Inertness: with `bequestShape` unset the tables are bit-identical to the current solver - `surv`,
   `beq`, `resil`, `short` and `pol` on two households, tiers off and on.
2. The transform itself: `soft` equals `cap` to the pound at every wealth at or below the cap, is
   continuous and strictly increasing above it, and its slope at the cap is 1 from both sides.
3. Field, on the 9 cap-binding households plus 3 low-exposure households: median pot rises on all 9,
   no household's floor rate falls by more than 0.5 points, and the 3 low-exposure households move by
   less than a tenth of the mean move of the 9.

   **Corrected 22 Sep, with 8 of the 12 already reported, and the correction is recorded rather than
   made quietly.** As first written this condition asked for 3 controls "whose grid never reaches the
   cap", unchanged to the pound. No such household exists. The grid's top is
   `max(60 x spend, 6 x openingWealth)` (`grid.js`, `top()`) and the cap is `4 x openingWealth`; six
   exceeds four, so **every** household's grid extends above its cap and `soft` perturbs every table
   somewhere. The clause was unsatisfiable by any correct implementation - the same fault as an
   assertion corrected in `solver-bequest.test.mjs` the same morning, but in a pre-registered gate,
   which is worse. S004's result was already in when the fault was found, so this correction is made
   with partial sight of the outcome and that has to be weighed when reading the verdict.

3b. **The exact control the original clause was reaching for.** Solve one household twice with
   `bequestCap` set above the top of its grid, once at `bequestShape: 'cap'` and once at `'soft'`. The
   shoulder cannot activate there, so the tables must be bit-identical - `surv`, `beq`, `resil`, `short`
   and `pol`. Unfakeable, costs one pair of solves, and tests what condition 3 was meant to test. It is
   a unit test, not a field run, and it is the condition that carries the weight.
4. Reported, not gated: how much of the £12.8M is recovered; the tier occupancy before and after; the
   effect on all 41 when the full re-run happens.

**Decision.** Pass: `'soft'` becomes the default, every headline figure from Phase 2 onward is restated
under it, and the results files say which shape they were measured with. Fail: it stays off and the
numbers are recorded. **If the pot recovers but the solver still holds a de-risked tier for most of
retirement, that is the point at which `wB` is the question** - a preference, to be decided with the
£23.1M in view, not guessed at now. The drift penalty (`driftWeight`, 2a94a4a) stays at zero throughout
and is a fallback only if 6c and a `wB` decision together leave the behaviour unexplained.

**Scope.** The cap binds wherever a household's grid reaches above four times opening wealth, which is a
function of horizon, so this touches Phase 2, 2c, 2d and 6 as well as 6b. Nothing is restated until the
gate is judged.

### Phase 6c-screen. Is the curve's shape a free choice? A twenty-minute screen

Written 22 Sep while 6c was still running, before any code. **The logarithm in 6c was asserted, not
derived.** Its recorded justification is that it joins the straight part smoothly, never reaches zero,
and holds a hundred-times-the-cap outcome to about 5.6 cap. Those are sanity conditions, and a whole
family of curves satisfies every one of them. Nothing says why a logarithm, and nothing tests it.

**Why that matters more than it looks: curvature and weight substitute for each other.** A gentle curve
at a high weight and a steep curve at a low weight behave almost alike over the range households reach.
So Phase 6d could pass on every condition - smooth, ends distinct, promise intact - while the curve
beneath it is the wrong shape, because the weight sweep quietly compensated. "The lever works" would
not then mean "the curve is right". This screen runs **before** 6d for exactly that reason.

**The family.** Write the marginal value above the bend as `(C / net)^p`, integrating to

    p = 1    soft(net) = C (1 + ln(1 + (net - C)/C))        the current logarithm
    p != 1   soft(net) = C + C ((net/C)^(1-p) - 1) / (1 - p)

Every member is C1-continuous at `C` with slope 1 from both sides, concave above it, and strictly
increasing. `p = 0.5` bends gently and grows like the square root; `p = 2` bends hard and its total
approaches `2C` without ever reaching it - a ceiling it never touches, which is the cap's intent with
none of the cap's cliff. One parameter, so this is a sweep rather than a beauty contest.

**The screen (tag beq-curve).** Four households where the cap binds hardest (S318, S330, S342, S354)
and two where it barely does (S004, S206), at `p` in {0.5, 1, 2, 4}. **Lambda is held at each
household's landed value from flex-tiers rather than re-searched**, so each cell is one solve instead of
five to seven: 24 solves at roughly 170 s a solve, about 68 core-minutes - 20 minutes on four cores.

**What it decides, and it is a screen so it decides only this.**
- **If the four shapes give near-identical policies and pots** (median pot within 2% across `p` on every
  household), the shape is second-order, the logarithm stands on the evidence, and nothing more is spent
  on it. Recorded and closed.
- **If they differ materially**, the curve is a live variable, it must be chosen before anything ships,
  and 6d's weight sweep cannot be read as validating the objective until it is.

**What it cannot decide.** With lambda fixed the floor rate is not pinned, so the arms are not compared
at equal downside and none of these numbers is a headline. It answers "does the shape matter", not
"which shape is best". If the answer is that it matters, the proper study is a separate phase with its
own landing, and this screen will have earned its cost by saying so for twenty minutes rather than
thirteen hours.

---

### Phase 6d. Two levers for the estate, and calibrating them

Pre-registered 22 Sep, before any code, at the maintainer's direction. **Approved 22 Sep; parked the
same evening before starting, to be scheduled deliberately rather than chained behind 6c.** The batch
script and the weight passthrough are in place, so it starts on a word. **How much an estate is worth
against the risk of running out is the household's question, not ours.** Phase 6c removes a flat spot
that made a real loss invisible; it does not settle the exchange rate, and it should not. The weight is
currently `wB = 0.02` of opening wealth, a constant no user can reach, and the curve bends at `4 x
opening wealth`, a number never justified in writing and measured against the household's savings *at
plan time* - for S342 that is age 37, twenty-eight working years before the drawdown the plan is about.

**This was already the conclusion.** Phase 2c.3 swept the weight and recorded: *"The bequest weight is
the lever that matters: 0.1 halves the pot cost and takes a third off the survival edge, which is the
frontier the prioritisation presets should expose rather than a constant to settle here."* The frontier
was mapped and the constant stayed. This phase acts on it.

**The two levers.**

1. **The floor, which already exists.** `config.solvencyFloor`, "I must leave at least this much",
   a hard requirement: a run finishing below it is a failure. Built, and tested as of 22 Sep
   (`solver-minpot.test.mjs`, nine assertions).
2. **What an extra pound above the floor is worth, which does not exist.** Today: 0.02, fixed. The
   household that says *"hit my number and nothing beyond it matters"* sets this to zero and every
   remaining pound goes into making the plan safe - which is a coherent, common preference the solver
   cannot currently express.

The shoulder's anchor moves with lever 1 where it is set, so the bend sits at **the household's own
number** rather than four times what they happened to have when they opened the app. Where no minimum
is set the default anchor stands, and choosing it is part of this phase, not inherited.

**The experiment (tag beq-lever).** Eight households spanning the horizons and both sides of the cap -
S004, S070, S178, S184, S206, S258, S318, S342 - swept across `bequestWeight` in
{0, 0.02, 0.05, 0.1, 0.2} with the shoulder on and everything else at the gate 6b configuration. Forty
landings. **Cost, measured from what these eight took in gate 6b rather than guessed: 51.9 core-hours,
13 hours on four cores.** An earlier draft of this section said "about four hours", which was an
invented figure; the household set is unchanged and the estimate is corrected rather than the set
trimmed to fit it.

**What this run does and does not cover.** It sweeps lever 2 only. Moving the shoulder's anchor onto
lever 1 (the household's own minimum pot) is part of the design above but is a separate change with its
own inertness check, and is not in this sweep: mixing an objective change and an anchor change in one
run would leave neither attributable.

**Gate 6d passes when all four hold:**
1. **Monotone.** Median pot rises with the weight and the survival edge falls, with no reversals on any
   household. A lever that is not monotone is not a lever.
2. **The ends are distinct.** At 0 against 0.2 the median pot differs by at least 20% on at least six
   of the eight. If both ends behave alike the control is decorative and must not ship.
3. **The promise survives every setting.** The floor rate lands within the usual tolerance at all five
   weights, including zero. A preference about inheritance must not be able to break a spending promise.
4. **Zero is safe.** At `bequestWeight` 0 the landing still converges, no household fails to solve, and
   nothing in the score is degenerate.

   **Named before the run, because zero is not a neutral setting.** With the weight at zero the estate
   contributes nothing to the score but still breaks exact ties (`solve.js`, the `b > bestB` clause), so
   survival differences of any size beat estate differences of any size. That is structurally the
   configuration Phase 2c replaced, and the note above the weights records what it did: *"with survival
   strictly first and the bequest only breaking exact ties, ANY survival gain justified ANY bequest
   loss, and the solver doubled a household's lifetime tax for a death-tax benefit that was zero."*
   **Median lifetime tax is therefore reported at every weight**, and a return of that behaviour at zero
   - tax sharply up against the other weights for no gain the household can see - fails this condition.
   If it fails, the finding is that the lever needs a floor above zero, or that the tie-break should
   scale with the weight, and either is a design decision rather than a tuning.

**Reported, not gated, and the finding that decides the product shape:** whether the lever can be
*instant*. The tables already carry survival, resilience and bequest separately and combine them at
action selection, so a table solved at one weight can be re-scored at another without re-solving. That
is one step of policy improvement over the wrong table, not the right table, so it is an approximation
and its size is unknown. Measure it: at each weight, compare re-scoring the default table against a
full re-solve at that weight, on floor rate, years at target and median pot. If the gap is negligible
the household moves the lever and sees the answer change immediately; if not, moving it costs a
ten-minute re-solve and the interface has to say so.

**A consequence to settle before Phase 4, not during it.** A user-settable objective means the versus
study must run at one declared weight, and that weight is the number every headline figure is measured
at. It has to be chosen and written down before the study, with its reason.

**Decision.** Pass: the two levers go into Part C as the prioritisation control, with the default named
and justified here. Fail on 2: the frontier is too flat to be worth a control and the constant stays,
recorded. Fail on 1 or 3: the lever is unsafe and does not ship in that form.

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
components. Two more presets, both off by default (decided 21 Sep): "spend some of the surplus after
good years" (the 2d.4 raise credit at 0.003) and "let the plan step down a risk tier when it is ahead"
(the Phase 6 joint tier moves with the switching cost); each re-solves, so it is a re-solve away
rather than instant.

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
nowhere. The term the penalty multiplies is the expected shortfall BELOW the floor, `Σ_years max(0, floor − spend) / floor`, not the floor-survival indicator: the indicator is what is reported and what the bisection lands, but it is never what the table optimises, because a step objective rewards a gamble at the line (Phase 2c.2). Both shortfall terms are sums over years, so the value stays decomposable. **No constant is ever asked of the person and none is hard-coded**: the floor, the target
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

## Part E. Speed, measured

Written 22 Sep while gate 6b was running, before any code. Nothing here runs until 6b has reduced and
been judged, and nothing here touches `src/solver` while a run is live. **Ordered before Phase 4 by the
maintainer, 22 Sep**: Phase 4 is the decision gate and the largest run left (60 households, both arms,
about 15 hours on four cores at today's cost), and it is the one you least want to repeat over a
configuration mistake. E0 is exact, so it cannot change what Phase 4 measures; E1 either holds its
pre-registered margins or stays off. Whichever way E1 lands, Phase 4 runs once, after them, at whatever
the cost then is. The profile (`profile.mjs`,
22 Sep, S004 at 20 points) says where a solve goes: tiers off, flow 51% / node loop 39% / other 10%;
tiers on, flow 29% / nodes 59% / other 12%. Both phases below attack those two shares, and they are kept
apart on purpose: E0 is exact (the same tables to the bit, so its gate is equality and it needs no
study), E1 is a heuristic (it can choose a different move, so its gate is a paired study on the 41 with
a pre-registered loss it may not exceed). Not queued, only noted: the alternatives at the end.

### Phase E0. One flow per cell, shared across the three worlds (exact)

`solveMixture` calls `solve` three times, once per held shift, and each call recomputes every
post-decision state. `F.flow(c, t, ai, post)` moves money within the year; the world's shift enters
only the growth rates (`fast.js`, `shifted` and `nodeRealOfAt`), so the three tables compute identical
flows and differ only from the growth step on. With tiers on, flow is 29% of a solve and two of the
three copies are redundant, about 19% of the mixture's time; with tiers off, 51% and about 34%.

**Change.** `solve` takes an optional list of held shifts and solves the K tables interleaved: for each
year, each cell and each base move, one flow, then for each world the growth at that world's node rates
and the read of that world's own next-year table. Each table's year t depends only on its own year t+1,
so the tables are those of the three separate solves. `solveMixture` becomes a call of that form; the
single-world path is untouched.

**Gate.** Bit-equality: a unit test that the interleaved mixture and three separate solves give the same
`surv`, `beq`, `resil`, `short` and `pol` on two library households at 20 points, tiers off and on; and
a field check that `runPolicy` on S004, S178 and S184 gives the same floor rate to the hundredth. If the
tables differ, the flow depends on the world after all: the item is dropped and the reason written
here. Reported: solve time before and after, tiers on and off. Expected 1.2× (tiers on) to 1.5× (tiers
off). Not attempted: sharing flows across the landing's five to seven solves, which are also identical
in flow, because it means holding every year's post-decision states at once (about 1 GB at 30 points).

### Phase E1. Candidate-set search seeded from the following year (heuristic)

**What was seen** (`policy-shape.mjs`, S004, 22 Sep, tiers and levels on). Along wealth a cell agrees
with its poorer neighbour on 70.7% of pairs. Against next year's table at the same cell, 94.5% of moves
are identical, 96.8% share the draw order (the steps and the harvest key; nine of 216 moves share an
order), 97.7% share the order of next year's move or of the poorer neighbour's; and only 65 of the 216
moves are ever chosen anywhere. The node loop tries all 216 at every cell. Searching only upward from
the neighbour (a monotone policy) was rejected: 29.3% of pairs switch, in both directions.

**Step 0, reads, minutes, after 6b.** Repeat `policy-shape.mjs` on four households of different shape
(S004 at 28 years, S184 at 41, S268 at 52, S330 at 61) at the shipping configuration (30 points, levels
1.2/1.1/1/0.9/0.8, tiers on, λ from each household's flex-tiers record). Proceed only if "same draw
order as next year OR as the wealth neighbour" is at or above 95% on all four; otherwise stop and
report the numbers.

**Step 1, implementation, after 6b, behind an option.** `opts.search: 'full' | 'candidates'`, default
`'full'`, and `opts.anchorEvery`, default 5. In candidates mode the last year, year 0 and every
`anchorEvery`-th year are full sweeps; at every other year a cell tries only its candidate set: every
move sharing the draw order of `pol[t+1][idx]`, every move sharing the order of `pol[t][idx-1]` (the
poorer wealth neighbour, already solved this year) and the plan's own move. On an anchor year the
candidates are scored first and the full sweep after, and the cell is a disagreement when the full
sweep's best is not in the candidate set; the disagreement rate and the mean score gap at disagreeing
cells go into `meta.search`, with `anchorEvery` and the counts of candidate and full evaluations. Unit
test: with `anchorEvery: 1` candidates mode equals full mode exactly, every year being an anchor.
`experiment.mjs` passes `SOLVER_SEARCH` and `SOLVER_ANCHOR` through. Expected: about 15 candidates of
216 at non-anchor years, so the flow and node work (88% with tiers on) falls to a fifth on four years in
five, about 3× on a solve, less once E0 has taken its share.

**Step 2, the run (tag flex-tiers-cand, `batch-flex-tiers-cand.sh`, from a snapshot, nothing else on
the box).** `batch-flex-tiers.sh`'s configuration exactly plus `SOLVER_SEARCH=candidates
SOLVER_ANCHOR=5`, so it pairs with flex-tiers household by household on the same ask and the same
paths.

**The standard, set by the maintainer 22 Sep: speed is not bought with accuracy.** E0 meets it by
construction, because bit-equality is the gate. E1 cannot be proved exact - it is a heuristic, and a
heuristic that never misses is a heuristic you did not need - so it has to meet the standard by
measurement instead, and the margins below are set at the level where a difference stops being visible
to the household rather than at the level where it stops being significant. E1 is not approved for
being fast. It is approved only for being fast and indistinguishable, and the burden is on E1.

**Gate E1 passes when all of 1 to 4 hold. Any one fails and it stays off.**
1. Landing: the floor rate is at or above each household's ask less 0.5 on all 41.

   **Not** gate 6b's condition 1 as a whole. **Rewritten 22 Sep, before E1 runs and before any E1
   numbers exist.** That condition's second half - nothing more than 2 points above the ask - failed in
   gate 6b on 9 of 41 for reasons that were not over-trimming: seven took no trim at all with lambda at
   the bracket top, and the two genuine landings were inside the bound on the 5,400 search paths the
   bisection optimised against, the excess appearing only in the 3,000-path held-out re-score at about
   0.8 points of standard error. Inheriting it would fail E1 on the same households for the same wrong
   reason, and a gate that fails for a reason unconnected to what it is testing tells you nothing.
   Over-trimming is still reported for E1, measured on the search sample the landing actually
   optimised against, and flagged above +2 there - but it does not gate, because E1 changes the search
   over actions and not the landing at all.
2. **No household is worse.** Paired against flex-tiers on the same 41, same asks, same paths: no
   household's floor rate lower by more than 0.5 points - the landing tolerance itself, so a household
   inside it is one whose promise is still kept - and no household's median pot lower by more than
   £25k. A single household outside either is a fail, however good the means.
3. **The means do not move.** Floor rate within ±0.1 points; years at or above target (median run)
   within ±0.005; spending delivered within ±0.005; median pot within ±£25k. These are equivalence
   bands, not significance tests: the claim being made is that the two solvers are the same, so the
   burden is on E1 to fall inside them, and a wide confidence interval is a fail, not a pass. The sign
   test on each measure is reported beside it.
4. **The search itself does not miss.** On anchor years, where both searches run, the candidate set
   contains the full sweep's best move on at least 97% of cells, and the mean score gap at the cells
   where it does not is below 0.001 of the cell's score. This is the direct measurement, and it is the
   one that would catch a loss the 41 happened not to show: the paired run says E1 did no harm to these
   households on these paths, while the anchor report says how much room there was to do harm at all.
   Reported beside it: the disagreement rate by household and the worst household by name.

**Decision.** Pass on all four: `'candidates'` becomes the default and the full sweep stays as an option
for anomaly checks. Fail on any: it stays off. **One pre-registered retry, declared here before the
run**: `anchorEvery` 5 failing on 2, 3 or 4 may be re-run once at `anchorEvery: 2`, which trades speed
for accuracy monotonically and is the one knob that does; the cost condition still has to hold at the
new anchor. That is the only second run, it is declared now rather than chosen after seeing the
numbers, and nothing else is tuned to make it pass. Budget: step 0 minutes, step 1 a day, step 2 three
to four hours if it works.

**Not available: an exact version.** A search that skipped moves with a proof they could not win would
be exact, and would need an upper bound on an unevaluated move's score that costs less than evaluating
it. The expensive part is the flow, and the flow is what such a bound would have to avoid computing, so
any bound cheap enough to help is almost certainly too loose to skip anything. Noted here so the option
is on the record as considered and rejected on its merits, not overlooked.

**Alternatives considered, ranked below these, not queued.** Fewer share points (`SHARES=5` or `4`, no
code: 1.44× or 2.25× on every phase): the share axes were never studied the way the wealth axis was,
and the tier as a move is exactly a move along them, so the accuracy is unknown and a study costs a
full batch; a read for later. Three Gauss-Hermite nodes instead of five: the note at the top of
`solve.js` says fat tails are the safe direction, and thinning the tails is not. Workers in the product
(one world per thread): exact and worth 2 to 3× on a phone, but that is Phase 7's plumbing, not a
solver change.

---

## Order, gates and rough size

| Phase | Deliverable | Gate | Size relative to the evolver build |
|---|---|---|---|
| 1 | reduced model + golden test | **done**: exact to the pound, 29 assertions | 1.5× |
| 2 | single solver | closed form, monotone, band, incremental, timing | 1.5× |
| 2c | perturbed-model check, expected shortfall, tuned weights, loss ledger | **done**: edge grows in every perturbed world; shortfall adopted; (0.5, 0.02) confirmed; every loss named | 0.5× |
| 2d | Part D pilot in the reduced model, against the guardrails | **done, 2d.1 to 2d.4**: at equal downside, years at target 0.92 vs 0.52, whipsaw 2 vs 26, ahead on 41 of 41; with raises on (2d.4) spending delivered 1.116 vs 1.054 at the same pot, ahead in the unlucky tenth on 41 of 41; Vanguard and ARVA beaten on years at target and floor rate ; **re-run clean under the mixture with the fixed landing: lands 41 of 41, years at or above target 0.849 vs 0.439, spending delivered 1.101 vs 1.012, 5.2 changes vs 26.4, pot +£186k** | 1× |
| 2e | savings-interest tax, dividend tax and the Cash ISA wrapper in the engine | **done**: 27 assertions, golden test exact, edge unchanged at +0.73 | 1× |
| 3 | table override in engine | **done, gate met**: exact to the pound (echo table, 160 paths); with the five-world mixture the engine is within 2 points of the model's forecast on 41 of 41 (mean −0.15, within 1 on 39; the one-year fold managed 4 of 41); engine edge +1.62, up 31 / down 10 | 0.5× |
| - | **maintainer, 22 Sep**: E0 and E1 run **before** Phase 4, so the decision gate is run once at the lower cost, not twice | | |
| E0 | one flow per cell shared across the three worlds | bit-equal to three separate solves on two households, tiers off and on; expected 1.2 to 1.5×; pre-registered, not yet run | 0.25× |
| E1 | candidate-set search seeded from the following year | gate E1: lands on 41, paired with flex-tiers within the margins above, ≤0.5× cost; pre-registered, not yet run | 0.5× |
| 4 | versus study | > 1 point, none worse than 1, historical not worse | 0.5× |
| - | **phase 2 says**: +0.73 on 41 households on the total-wealth grid (was +0.59 per pot), 29 up / 5 down, sign test p < 0.001, picker 33 of 41; median pot −£182k; 21s a solve. Gate passed; 2c and 2d before Phase 3 | | |
| 5 | couples by rollout | **done, survival conditions met**: +0.77 vs the best fixed rule on 19 couples, 14 up / 3 down, worst −0.85; tiers off for couples; backtest and perturbed worlds not yet run | 1× |
| 6 | tiers and spend dimension | **tiers done, confirmed by the engine**: +6.13 in the model and **+6.16 in the real engine**, 41 of 41 both ways, 1.7 tier changes a retirement; 2× solve time (gate asked 1.5×); a preset, off by default; spend dimension deferred | 1× |
| 6b | flexible spending and tiers together | **run 22 Sep**: conditions 2 (years at target +0.125, 30 up / 1 down), 3 (1.80× of 2.5×) and 4 (1.57 changes of 3) pass; **condition 1b fails as written on 9 of 41**, seven of them households that took no trimming at all and two that are inside the bound on the sample the landing optimised. Fully-funded rate +54.93 vs the guardrails (p = 0.000) against flex-landed's +13.43 (p = 0.755); pot −£870k, the tier trade Phase 6 measured at −£917k. Recorded, not tuned, not merged | 1× |
| 6c | the bequest shape: a shoulder, not a cliff | gate 6c: default bit-identical, `soft` equal below the cap and strictly increasing above, pot up on the 9 cap-binding households with no floor rate more than 0.5 lower, and bit-equality with the cap above the grid top (3b). Conditions 1 and 2 pass; condition 3's control clause was unsatisfiable as written and is corrected in place, with 8 of 12 reported | 0.5× |
| 6c-screen | is the curve's shape a free choice? | 20 minutes at fixed lambda: if the median pot is within 2% across p on every household the logarithm stands, otherwise the curve is a live variable and 6d cannot validate the objective until it is settled; runs before 6d | 0.1× |
| 6d | two levers for the estate, and calibrating them | **approved 22 Sep**, gate 6d: monotone, ends distinct on 6 of 8, the promise holds at every weight including zero; plus whether re-weighting without a re-solve is close enough to make the lever instant; pre-registered, not yet run | 0.5× |
| 7 | worker, staleness, locks, cache | suite green with switch off | 1× |
| 8 | Config | harness | 0.5× |
| 9 | Strategy | harness | 1.5× |
| 10 | Projection, Simple, scenarios, audit | harness | 1× |
| 11 | phone | phone harnesses | 0.5× |
| 12 | words, docs, tests, rollout | full suite both ways | 1× |
| 13 | flexible spending, guardrails retired | gate 13, versus guardrails | 1.5× |

Distillation is a standing deliverable from Phase 2 on, not a fallback: every move the solver takes that a fixed rule
does not (the cash sweep was the first; the loss ledger and the wins will name more) is written as a rule, given the
versus protocol, and shipped into the fixed policies if it holds. Blanchett's regression formulas kept 99.9 percent of
the strategy they were fitted to; the solver's findings can ship as rules wherever the solver itself does not.

The decision point is the end of Phase 2d, confirmed at the end of Phase 4. Phases 1 to 4 together are about the size of the evolver
build twice over, and nothing the person sees changes until Phase 8.

## Decisions I have taken that you may want to overrule

- Decided 21 Sep: raises after a good run (2d.4) and the tier as a move (Phase 6) ship as **presets,
  default off**. In the solver both are off unless asked for (`raiseWeight` 0, `tiers` unset), and in
  Part C each is a row under "What the solver may change": "spend some of the surplus after good years"
  (raise weight 0.003) and "let the plan step down a risk tier when it is ahead" (joint steps, the
  switching cost charged). Both trade bequest for spending or survival, so neither is a default.
- Authorised overnight (20 Sep): 2d.2 and 2d.3 on the same seeds, then 2d.4 (raises above target)
  incorporating what the earlier passes show, then Phase 6 (the risk tier as an action) started
  without a further check-in if the 2d gate is passed. Each step recorded here and committed; merge
  to main only on a green suite.

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
- Phase 3 waits for the Part D pilot (2d) and the robustness checks (2c); a small positive phase 2
  result is read as "what withdrawal order alone is worth", not as the verdict on the method.
- The risk term is expected shortfall, never a probability, wherever the table optimises; probabilities
  are reported, not optimised.
- If couples by rollout (Phase 5) fail their gate, the reserve is model-predictive control (re-plan
  each year with a convex model of the rules, act on the first year), which the literature shows
  handles many accounts where the grid cannot; it is not optimal under uncertainty and is not preferred.
