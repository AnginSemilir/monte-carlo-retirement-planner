# Solver research: the record of completed work

**What this file is.** The full text of every phase, gate and measurement that has been COMPLETED,
moved here verbatim from PLAN.md on 23 Sep so that the plan can hold only the current design without
losing track of what was done, how, and what it found. Nothing here is a live instruction: where a
section below describes a design that was later changed, the change is recorded in PLAN.md and this
text is the record of what was actually run. Designs that were superseded BEFORE they ran are not
kept here; they remain in git history (PLAN.md at commit af670e8 and earlier).

Results files named in the text sit beside this file in `research/solver/`.

---

## Part A. The research build

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


---

## Part B. Couples, the risk tier, and the 6-series

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


### Phase 6f. The kink nobody chose: is resilience doing anything the bequest term is not?

**Asked by the maintainer, 23 Sep: "why do we even need resilience if we have bequest?"** Working it
through gives an answer I did not expect and did not like.

**They are not two concepts.** Both take the SAME quantity - terminal net wealth - and both are gated
by the same `alive` test. Added together they are ONE piecewise-linear concave function of terminal
wealth: resilience is its steep first segment, bequest its shallow second one. At K = opening wealth
of 500,000:

| terminal net | combined score | marginal value of the next 1,000 |
|---|---|---|
| 0 to K | rising to 0.52 | **10.4e-4** |
| K to 4K | 0.52 to 0.58 | **0.4e-4** - a **26x drop**, at K |
| above 4K | 0.58, flat | **0** - the cap, studied in 6c and 6e |

So the honest answer to the question is: **mathematically you do not need both.** One concave utility
of terminal wealth expresses the same preference. Resilience's stated justification - "a decomposable
stand-in for the unlucky tenth" - is satisfied by the SHAPE, not by being a separate term; any concave
function weights the bottom of the distribution automatically.

**There is one real reason to keep them apart, and it is a product reason rather than a modelling one.**
Phase 6d turns the bequest weight into a user control. Fused into a single function, moving the estate
dial would also change the slope protecting the downside; kept separate, the user moves `wB` and the
downside protection stays where it is. Separable dials are worth something. That is an argument for
the parameterisation, not for the values.

#### What the question actually exposed

**The kink at K is 26 times larger than the cliff at 4K that 6c and 6e spent about fifteen hours of
compute on.** And nobody chose it: it is what falls out of `wR = 0.5` and `wB = 0.02` having been
picked independently, at different times, for different stated reasons.

It also sits INSIDE the distribution rather than off in its tail. Measured across the 41: the unlucky
tenth lands at **0.64 to 0.84 of opening wealth** - always on the steep side - while medians run
**2.2x to 3.9x** - always on the shallow side. Every household straddles the bend.

**The constants audit could not have found this, and that is a fault in how it was done.** It examined
each constant for flat regions one at a time. The shape exists only in the SUM, which is the function
the solver actually maximises and which appears nowhere in this plan until now. Term-by-term auditing
is structurally blind to a relationship between terms.

#### The screen (tag wr-*), ~1.2 h

Four arms - `wR` in {0, 0.25, 0.5, 1.0}, making the slope ratio 1x, 13x, 26x (today) and 52x - on six
households spanning opening wealth 180k to 950k and p10/K from 0.64 to 0.84. Lambda held at each
household's landed flex-tiers value, so each cell is one solve.

**`wR = 0` is the maintainer's question asked directly.** If deleting resilience changes nothing, the
term is doing no work and should go.

**The metric that decides it is p10 terminal net**, the unlucky tenth - because that is what resilience
exists to protect, by its own comment. If varying its weight does not move the unlucky tenth, it is not
doing the job it was added for, whatever else it moves.

**What it decides.**
- **If `wR = 0` leaves p10 within 2% on all six**: resilience earns nothing and the objective should
  lose a term. A simpler objective with the same behaviour is strictly better.
- **If all four arms are within 2%**: the 26x ratio is arbitrary and not load-bearing. Record it, stop
  treating 0.5 as meaningful, and leave it alone.
- **If p10 moves materially with `wR`**: the term is doing its job, the ratio is load-bearing, and it
  deserves a proper study with a landing rather than a screen - and `wR` becomes a candidate for the
  same user-lever treatment 6d is giving `wB`.

**What it cannot decide.** Lambda is held, so the floor rate is not pinned, the arms are not compared
at equal downside, and no figure here is a headline. It answers whether the weight matters, not what it
should be.

#### The decision this feeds, agreed 23 Sep: keep, remove, or RE-ANCHOR

The maintainer asked for the argument both ways and we aligned on the shape of the answer before the
run, so the result cannot be read to taste afterwards.

**The case to keep rests on exactly one point, and it is a good one.** Nothing else discriminates at
the bottom. Survival is BINARY - a household ending with £10k and one ending with £400k both "survive"
where no minimum pot is set - and the bequest term's slope down there is 0.4e-4, essentially flat.
Delete resilience and **the solver becomes near-indifferent between scraping through and finishing
comfortably.**

**The case to remove has four, of which the first is the strongest.** It is a HIDDEN DUPLICATE of a
control the user already has: `config.solvencyFloor`, the minimum end-of-life pot, is the visible,
user-set way to say "do not leave me with nothing". Resilience says the same thing implicitly, at a
level nobody chose. Its anchor is an accident - opening wealth at PLAN time, so for a 37-year-old with
28 working years ahead it means ending with what they hold today. It is not a distinct concept, only
the steep segment of one concave function. And it is a preference held on the user's behalf,
invisibly, outweighing six to one one of the three things they did ask for.

**Both are right, which is why the answer is probably neither.** The keep case says something must
grade the bottom; the remove case says we already have a user-facing way to express that and this one
is anchored arbitrarily. So:

> **RE-ANCHOR.** Keep a graded downside term, but hang it on the minimum-pot figure the user actually
> sets rather than on opening wealth at plan time. One downside preference: visible, user-chosen, and
> graded - which also fixes `solvencyFloor`'s own binary cliff, since a hard floor is the same
> pathology this plan has been hunting everywhere else.

**How 6f decides between the three.**
- **`wR = 0` leaves p10 within 2% on all six** -> the term earns nothing. **Remove it.** The objective
  loses a term and the 26x kink goes with it, at no cost. Question closed.
- **p10 moves materially with `wR`** -> the term is load-bearing, and the choice is NOT between keeping
  a bad anchor and losing the protection. **Design the re-anchoring**, with its own gate.
- **All four arms within 2% but p10 does move between the extremes** -> the weight is not load-bearing
  even though the term is. Record it, stop treating 0.5 as meaningful, and leave it alone until the
  re-anchoring is designed.

---

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

#### A conditional follow-up: 6c may deserve a fresh run, and only a fresh one

**Noted 22 Sep, while 6e stage 1 was running. Conditional, not scheduled.**

6c failed on S390, its control, whose estate sits at 97% of its bend. **S390 is also seventh worst on
the unrealised-gain axis: its true gain fraction reaches 80.3% and the grid reads it as 55%.** S300,
worst of all at 89.0%, was one of the nine over-trim cases in gate 6b. So two of this series' awkward
judgements sit on households that the constants audit has now measured a known distortion on.

**No claim is made that the distortion caused either**, and 6c's recorded verdict does not move on this
note. But if 6e stage 1 fires and stage 2 lands a fix, then 6c's failure was measured on a value
function with a named error on that exact household, and the honest response is:

> **Re-run 6c from scratch, as a NEW run with a new record.** Not a re-reading of the old numbers, not
> a re-specification of the control now that we know which way it went. The old run stays on the record
> as a failure, because it was one, under the solver as it stood.

That distinction is the whole discipline here. 6c's control clause was already corrected once with
partial sight, and a second re-specification with full sight was refused for this reason. A fresh run
after a fix chosen for unrelated reasons is legitimate; re-reading the same numbers through a new lens
is not.

**Trigger:** 6e stage 2 passes and lands. **Cost:** a 6c-class run, twelve households, now much cheaper
with `SOLVERONLY`. **If 6e stage 1 is quiet this note expires** - the ceiling was second-order, 6c's
failure stands unexplained by it, and nothing is owed.

---


### Phase 6e. Grid fidelity: three flat regions the audit found, in one field check

Pre-registered 22 Sep from `research/solver/results-audit-constants.txt`, before any code. That audit
was asked for after the bequest cap turned out to hide £12.8M of pot movement: go and find the same
shape elsewhere. It found three live faults, and they are grouped here for one reason - **each of them
changes what the value function returns, so by the working rule each needs a paired field check on the
41, and that run is 6b-class: ~44 core-hours, ~13 hours wall. Three separate ones is 39 hours of
machine time for changes that barely interact.** One phase, one field check.

**Fault 1, and the largest: the unrealised-gain axis tops out at 55% and households reach 89%.**
`grid.js:104` holds `gain = [0.05, 0.25, 0.55]`, and `grid.js:190` snaps to the nearest of them with no
interpolation, while the three pot axes beside it are interpolated. Measured on the clean 41, walking
each household's own model forward: **1,035 of 1,485 GIA-holding household-years (70%) snap more than 5
points from the truth; the worst is 34.0 points; the highest fraction reached is 89.0%.** Above 55% the
axis is flat, so a position at 89% gain is valued as though liquidating it cost 55%-of-value in taxable
gain. The solver **over-values those positions and under-prices the CGT of touching them.** CGT is on by
default, so this is live for every household holding a GIA.

**Fault 2: the lump-sum-allowance axis reads 8 of 41 as never having taken their lump.** Three buckets
on how much of the £268,275 allowance is used, nearest-snap, so the boundaries sit at £67,069 and
£201,206. Two separate problems, and only the second is a resolution question:

- the allowance figure is wrong by up to £67k **in either direction** - noise, not bias;
- `grid.js:183` derives the lump-taken FLAG from the bucket (`out[5] = pcls[ic] > 0 ? 1 : 0`), so the
  eight households in bucket 0 are valued as still able to take a tax-free lump they have already
  spent. S172 has used £56,047 of allowance and is read as having used none. **That is not coarseness;
  it is an action the real household no longer has.**

**Fault 3: gross against net.** `config.solvencyFloor` is judged on the gross pot while the bequest is
valued net of pension death tax, on adjacent lines. **Parked, not fixed here.** Every library household
runs at `pensionDeathTaxRate = 0`, so no run can show the difference, and fixing it without a household
that shows it is tuning against nothing. It needs a synthetic fixture first; it is on the list.

#### Why this runs before E3, which is the part that is easy to miss

The gain axis has three buckets. **If the fix is a fourth, the grid gets 33% more cells (3 → 4 on one
dimension multiplies the whole grid by 4/3). E3's measured saving is 30.2%. Adding a fourth gain bucket
costs almost exactly what E3 saves.** Running E3 and E4 first and then finding we need that bucket
means a day and a half of build measured against a grid about to change size, for a net gain near zero.
It is the same mistake the schedule already avoids for E1: do not measure against a reference that is
about to be replaced.

Three ways to fix the axis, and they cost very differently:

| Option | Cell cost | What it does |
|---|---|---|
| re-space the three buckets, e.g. to 0.10 / 0.45 / 0.80 | **free** | covers the real 5-89% range; the middle gets coarser |
| **interpolate it instead of snapping** | **no extra cells**, 2x the reads inside `interp` (8 corners → 16) | removes the flat top outright |
| add a fourth bucket | **+33% cells** | best fidelity, eats E3 |

**Interpolation is the recommendation** - it kills the flat region, costs no memory, and does not
collide with E3. Which one is actually needed is what stage 1 exists to answer.

#### Stage 1: the screen (tag `grid-fidelity`), ~40 minutes

The twelve households worst affected on the gain axis - **S300, S240, S252, S276, S330, S268, S390,
S410, S292, S414, S184, S172** - at **lambda held at each one's landed value from `flex-tiers`**, so
each cell is one solve rather than five to seven. Four arms:

1. **current** - the build as it stands, for the paired baseline;
2. **re-spaced** - gain buckets 0.10 / 0.45 / 0.80, everything else identical;
3. **interpolated** - gain interpolated as the pot axes are, buckets unchanged;
4. **flag-fixed** - fault 2 alone: the lump-taken flag read from the true state, not the bucket.

48 solves at roughly 170 s, about 136 core-minutes, ~35 minutes on four cores.

**What it decides, and being a screen it decides only this.**
- **If every arm's median pot is within 2% of `current` on all twelve households**, the ceilings are
  second-order, the current buckets stand on evidence rather than on nobody having looked, stage 2 is
  never run, and the audit's three findings are closed as recorded-and-checked. E3 and E4 are then
  sized against a grid that is not going to move.
- **If any arm differs materially**, the axis is a live variable. Stage 2 follows, and it must land
  **before 6d stage 2 and before E1**, because both are paired comparisons that would otherwise be
  measured against distorted numbers.

**What it cannot decide.** With lambda fixed the floor rate is not pinned, so the arms are not compared
at equal downside and none of these numbers is a headline. It answers "does the ceiling matter", not
"by how much".

**Two households worth watching for a reason that is not the arithmetic.** S390 is seventh worst on this
axis (80.3% read as 55%) and is the household whose failure made 6c not-passed. S300 is worst of all
(89.0%) and was one of the nine over-trim cases in 6b. **No claim is made here that the ceiling caused
either.** But two of the series' awkward judgements sit on the households the ceiling distorts most,
and forty minutes settles whether that is coincidence. If stage 1 is quiet, it is coincidence and both
judgements stand as recorded.

#### Stage 2: the field check, ~13 hours wall, only if stage 1 moved

Full 41, seeds 7001/7002, 3,000 held-out paths, three-world mixture, 30 x 6 x 6, single-stage landing
on 5,400 search paths, tiers on - **paired household by household against gate 6b, same asks, same
paths**, so the comparison is like for like. Winning arm from stage 1 plus the flag fix, against
`flex-tiers` as the baseline.

**Gate 6e, pre-registered before the run.**

1. **Landing is not damaged.** Floor rate at or above the ask less 0.5 on 41 of 41, as 6b delivered.
   **This is the safety condition and it is the one that can fail the phase on its own.**
2. **No household is materially worse.** No household's held-out floor rate falls by more than 0.3
   against its 6b figure, and no household's median pot falls by more than 2%.
3. **The fix does something.** On the twelve stage-1 households, the median pot or the years-at-target
   moves by more than the paired noise floor on at least six. **A change that costs 13 hours and moves
   nothing is a change not worth carrying**, and it is then recorded as measured-and-rejected with the
   buckets left alone.
4. **The flag fix is exact where it should be.** The 33 households not in bucket 0 are bit-identical to
   their 6b results. The flag fix cannot touch them, so if it does, it is a bug and not a finding.

**Pass**: the winning arm and the flag fix land on main, the audit file gains its "after" column, and
E3/E4 are re-sized if the cell count changed. **Fail on 1**: reverted outright, recorded.
**Fail on 2 or 3**: recorded as not passed, buckets unchanged, exactly as 6c was. **If a condition
fails I record it and stop rather than tune until it passes.**

**What is deliberately NOT in this phase.** `wR = 0.5`, `SWITCH_COST = 0.0025` and
`SWITCH_MARGIN = 0.001` were all set by argument and never swept. They are recorded as never-swept in
the audit file and stay closed: three more sweeps is scope we have no evidence to justify. The raise
credit's cap at level 1.2 sits exactly at the top of the shipped menu, so it is dormant - it wants a
comment tying the two numbers together, not a phase.


---


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

`solveMixture` is nine lines and the whole of it is `zs.map(z => solve(E, M, plan, {...opts, shiftZ: z}))`:
three independent solves, each rebuilding every post-decision state. `F.flow(c, t, ai, post)` moves the
year's money - draws, tax, sweeps - and the world's shift enters only the growth rates, so the three
tables compute that identically and diverge only from the growth step on. With tiers on, flow is 29% of
a solve and two of the three copies are waste, about 19% of the mixture; with tiers off, 51% and 34%.

**The premise, checked in the code rather than assumed (22 Sep).** `flow()` reads off the action only
`steps`, `costSteps`, `harvest`, `harvestCeil`, `level`, `lump` and `sweep` - all structural - and off
the context only `T`, `acts`, `ctx`, `yr`, `P`, `tb`, `rule`, `guard`, `inflation`, `floorFrac`,
`solvencyFloor`, `cashNominal`, `cashIsaContrib`, `last`. It never touches `c.real`, `c.sigma`,
`volEff` or `volEffAt`, which are the only fields `compile` shifts. `makeGrid` has no reference to the
shift either, so **all three worlds index the same cells**, which is what makes interleaving possible at
all. If any of this stops being true the phase is void, so the gate below is bit-equality and not a
tolerance.

**What is shared and what is not**, which is the whole of the implementation:

| Shared across worlds | Per world |
|---|---|
| the grid and cell indexing | the compiled context `c` (its `real`, `sigma`, `volEff`) |
| `base`, the state vector at a cell | `nodeRealOfAt[t][ai][zi]`, the growth rates |
| the action list and `tierBase` | the next year's tables read at the growth step |
| `flow()`'s result: `post`, `unmet`, `fail` | the output tables `surv`, `lsurv`, `resil`, `lresil`, `beq`, `short`, `pol` |
| the penalties `costOf`, `driftCostOf` | |
| `scale`, `wR`, `wB`, `beqCap`, `resilK` | |

**Granularity: buffer the flows per cell, loop worlds on the outside.** E0 does less arithmetic but
touches more memory, and the second can eat the first. At 30 points each world's next-year tables read
at the growth step - `lsurv`, `beq`, `lresil`, `short` - are 4 x 9,720 x 8 bytes = **311 KB**, which sits
in L2. Interleaving naively, world-inside-action, makes the hot working set **933 KB** for three worlds
and spills to L3. Removing a third of the work and giving it straight back in cache misses is a real
outcome and the most demoralising kind: the arithmetic is right and the clock does not move.

So the loop is: at a cell, compute all the flows once into a scratch buffer, then loop worlds outside
and actions inside. The buffer is 216 actions x 7 doubles = **about 12 KB**, nothing, and each world's
pass then reads only its own tables - today's access pattern exactly. It also makes condition 2 easier,
since within a world nothing is reordered. A search of the cache-blocking and cache-oblivious DP
literature (Intel's loop-interchange guidance; Lam et al. 1991; Chowdhury and Ramachandran 2006) offers
the principle - maximise work done on data while it is resident - but nothing specific: that work is
about recursive divide-and-conquer over DP *tables*, where the table walk is the cost, and here the
transition function is the cost. The sizing above is ours.

**De-risking step before the rewrite, twenty minutes.** Time a loop that reads three worlds' next-year
tables against one that reads one, at 30 points, on this machine. If the difference is negligible the
simpler world-inside-action structure is fine; if it is not, the buffered structure is built knowing
why. A number rather than a guess, for the price of a coffee.

**Design decision: one loop carrying K, not two loops.** The alternative - leaving `solve` alone and
writing a second interleaved version - duplicates the hottest code in the project and guarantees the two
drift apart. Factoring the per-cell body into a function to share it would put a call in the inner loop
and give back the gain. So `solve` takes `opts.shifts`, an array, with the single-world path being
`K = 1`. **That means the ordinary path is restructured too, and the gate has to cover it.**

**Traps, each of which costs a day if met unprepared.**
- **Floating-point order.** Bit-equality is the gate, and addition is not associative. Each world's
  accumulation - the five-node `s += WEIGHTS[zi] * rd[0]` and the rest - must happen in exactly the
  order it does now, per world, not reassociated into a K-wide sum. Interleaving may reorder work
  *between* worlds freely; it may not reorder work *within* one.
- **`c.last` belongs to whichever context computed the flow.** One flow means one `c`. `solve` reads
  `c.last.preNmpaInsolvent` and the tax fields from it; none is shift-dependent, so world 0's context
  may serve, but the code must say so deliberately rather than by accident.
- **`nodeRealOfAt` becomes per-world.** At 61 years x 216 actions x 5 nodes x 4 pots that is about
  2 MB a world - not a problem, but it is now built K times and must be indexed by world.
- **Peak memory does not change.** `solveMixture` already retains all three tables at the end, so
  holding them at once is what happens today; interleaving moves when they are allocated, not how many.

**Gate E0 passes when all four hold. Any one fails and the change is dropped, not tuned.**
1. **K = 1 is bit-identical to today's `solve`.** The ordinary single-world path must be untouched in
   its output: `surv`, `beq`, `resil`, `short`, `pol` equal on two households, tiers off and on. The
   first draft of this gate checked only the mixture and would have let a broken single-world path
   through; it is the path every unit test and the whole of Part C use.
2. **The interleaved mixture equals three separate solves, bit for bit**, on the same two households,
   tiers off and on, all five tables.
3. **The mechanism is real, not just the wall clock.** With `SOLVER_PROFILE=1`, `PROF.flows` for the
   interleaved K = 3 mixture is exactly a third of the sum over three separate solves. Wall-clock timing
   is noisy and a 1.2x claim is inside that noise; the call count is exact and is the honest check that
   the work was actually shared.
4. **Field check:** `runPolicy` on S004, S178 and S184 gives the same floor rate to the hundredth.

**Reported:** solve time before and after, tiers on and off, at 30 points. Expected 1.2x with tiers on,
1.5x with them off.

**RUN AND PASSED, 22 Sep.** All four conditions, and the gain beat the forecast.

| | |
|---|---|
| 1 K = 1 bit-identical to the solve before E0 | **pass**, 4 of 4, S004 and S178, tiers off and on |
| 2 interleaved mixture equals three separate solves | **pass**, 4 of 4, bit for bit, all five tables and the moves |
| 3 flow calls exactly a third | **pass**, 19,595,520 to 6,531,840 |
| 4 field check, floor rate to the hundredth | **pass**, S004 94.25, S178 79.38, S184 75.38, identical |

**Measured 1.66x with tiers off and 1.33x on**, against 1.5x and 1.2x forecast. **The cache risk did not
bite**, and the reason is the structure chosen for it: a cell's flows are buffered and the worlds looped
outside, so each world's pass reads only its own 311 KB rather than three worlds' 933 KB. Had the naive
world-inside-action interleave been written, this line would likely record a disappointment instead.

Two process notes worth keeping, because they are the transferable part:
- **The gate was the call count, not the clock.** A 1.2x claim sits inside timing noise, so a build that
  shared nothing could have passed a stopwatch. The count could not be argued with.
- **Two steps, not one.** The restructure was proved at K = 1 before any world was added, so a failure
  was never ambiguous between a refactoring bug and a sharing bug. It cost one extra verification run.

**Found and fixed in the same phase:** the restructure made the world loop the outer one, which left the
per-action spend penalty being computed K times for the same answer, about ten million redundant calls a
solve. Hoisted to once a year; bit-equality re-checked after, because an obviously harmless change to a
hot loop is exactly the kind that is not.

**The durable check** is `research/tests/solver-mixture-shared.test.mjs`. The gate compared against a
verbatim copy of the pre-change solver, which cannot live in the tree forever; the test asks the same
question against K separate builds made by the current code, so nothing rots.

**What E0 does not establish.** Two households at 20 points and three at 30, which is the gate as
written and proportionate for an exact change with a bit-equality oracle. It is not the 41-household
sweep a behavioural change would need, and should not be cited as one.

**Order of work**, so the risky part is never the unverified part: build the K-carrying loop with K = 1
first and prove condition 1 before any world is added; then K = 3 and condition 2; then 3 and 4. A
failure at condition 1 is a refactoring bug, at condition 2 a sharing bug, and keeping them apart is
worth the extra step.

**Not attempted:** sharing flows across the landing's five to seven solves, which are also identical in
flow, because it means holding every year's post-decision states at once - about 1 GB at 30 points.

### Phases E2 to E4. What is left after E0, all exact

Written 22 Sep, after E0 landed and with its lessons applied. E0 moved the target: with tiers on the
profile was flow 29% / nodes 59% / other 12%, and sharing the flow three ways leaves roughly **flow 12%,
nodes 73%, other 15%**. The node loop is now the whole game, and its hot centre is `readValues` -
locate, eight corner reads across four separate arrays, eight weight products, and an `expit` - called
once per node per action per world per cell per year. On S004 at 30 points that is of the order of a
billion calls.

**What is NOT available, said once so it is not re-proposed.** A cheaper `expit`, or three quadrature
nodes instead of five, or fewer share points: each changes the answer, and the standing rule is that
speed is not bought with accuracy. The certain-success shortcut was tried and retired (see
`zeroGrowthNeed` in `grid.js`); it is not revived here without new evidence.

---

**Phase E2. Split the cells across cores.** The biggest exact win left, and worth more than E0 and E1
together. Within a year every cell is independent: it reads only next year's tables, which are complete
and read-only, and writes only its own index. Split the 12,960 cells across N workers and synchronise
once a year. Near-linear in cores - **about 4x here, more on a modern laptop** - and bit-exact, because
each cell computes precisely what it computes now.

The plan already carried "one world per thread" as a Phase 7 idea worth 2 to 3x. Splitting cells is
strictly better: it is not capped at three, and **it composes with E0** rather than competing with it -
E0 merged the worlds, E2 splits the work underneath them. In research runs that is `worker_threads` over
a `SharedArrayBuffer`; in the product it is the Phase 7 worker plumbing, so the two should be designed
together rather than twice.

**Gate E2.** Bit-equality against the single-threaded build on two households, tiers off and on; the
same at two different worker counts, because a result that depends on how the work was divided is a
race. Reported: wall clock at 1, 2 and 4 workers, and the efficiency (speedup divided by workers), since
falling well short of linear means the year barrier is costing more than the split saves.

---

**Phase E3. Collapse the dimensions that describe an empty pot.** Exact, contained, no new
infrastructure, and **measured at 30.2% of the cell work** on the shipping grid.

The grid carries three embedded-gain buckets and three lump-sum buckets. The gain bucket describes the
taxable account; where that account is empty the three buckets are the same state and the three
solves are the same arithmetic. The lump-sum bucket describes the pension; where the pension is empty,
likewise. On the 6 x 6 share plane the taxable account is empty on 11 of 36 cells (a = 1 or b = 1) and
the pension on 6 of 36 (a = 0), so:

    gain redundant   20.4% of cell work
    pcls redundant   11.1%
    less the overlap  1.2%
    ------------------------
    removable        30.2%, exactly

Compute one bucket at such a cell and copy it to the others. The values stored are the values that
would have been computed, so interpolation from neighbours is unaffected.

**Gate E3.** Bit-equality on two households, tiers off and on - and specifically **a check that the
copied cells equal the computed ones**, which is the assertion that fails if "empty pot" has been
mis-identified. Reported: the measured saving against the 30.2% predicted here, since a prediction from
cell counts ignores that the skipped cells may be cheaper or dearer than average.

---

**Phase E4. One interleaved value array instead of four.** `readValues` accumulates from `lsArr`,
`bArr`, `lrArr` and `shArr` at the same index: four arrays, four places in memory, eight corners, so up
to 32 cache lines a call. At 30 points each array is 78 KB, so the four together miss L1 (32 to 48 KB) on
every read. Store the four values for a cell adjacently - value `v` at `4i + v` - and one corner is four
consecutive doubles, 32 bytes, one line: **8 lines a call instead of 32**. Identical arithmetic in an
identical order; only the storage changes.

**Measure before building.** E0's forecast was beaten because the structure was chosen from a sizing
calculation rather than a guess, and the honest lesson is the other way round too: cache guesses are
exactly the guesses that come out wrong. Time a loop reading four separate arrays against one
interleaved array, at this size, on this machine, before touching `grid.js`. A morning's work if the
number is good; nothing if it is not.

---

**Considered and not queued.** Dominance pruning - if one action leaves more in every pot at the same
spend level and tier it cannot lose, which is exact given monotonicity in wealth - but most draw orders
trade one pot against another, so strict dominance is probably rare; worth a counting experiment before
any code. Duplicate post-states at low-wealth cells, where orders coincide because the pots they differ
over are empty: the comparisons may cost more than the evaluations they save. A WebAssembly inner loop:
plausibly 2 to 3x and exact if written carefully, but a large project and a second implementation of the
hottest code to keep in step.

**Order and timing, settled 22 Sep.** E4's measurement, then E3, then E4's build if the measurement
justified it - all **before** 6d, at the maintainer's direction and against my recommendation to wait,
with both positions recorded above. E2 waits for Phase 7's workers, because concurrency is the one place
where the bit-equality gate stops being a guarantee and because the infrastructure is being built there
anyway.

E3 is built in two steps, as E0 was: first identify the redundant cells and **assert they would have
produced identical values**, then skip them. That keeps a failure from being ambiguous between
mis-identifying a cell and breaking the copy, which is the single practice that made E0 go smoothly.

---

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


---

## The phase ledger as it stood on 23 Sep (historical table)

## Order, gates and rough size

| Phase | Deliverable | Gate | Size relative to the evolver build |
|---|---|---|---|
| 1 | reduced model + golden test | **done**: exact to the pound, 29 assertions | 1.5× |
| 2 | single solver | closed form, monotone, band, incremental, timing | 1.5× |
| 2c | perturbed-model check, expected shortfall, tuned weights, loss ledger | **done**: edge grows in every perturbed world; shortfall adopted; (0.5, 0.02) confirmed; every loss named | 0.5× |
| 2d | Part D pilot in the reduced model, against the guardrails | **done, 2d.1 to 2d.4**: at equal downside, years at target 0.92 vs 0.52, whipsaw 2 vs 26, ahead on 41 of 41; with raises on (2d.4) spending delivered 1.116 vs 1.054 at the same pot, ahead in the unlucky tenth on 41 of 41; Vanguard and ARVA beaten on years at target and floor rate ; **re-run clean under the mixture with the fixed landing: lands 41 of 41, years at or above target 0.849 vs 0.439, spending delivered 1.101 vs 1.012, 5.2 changes vs 26.4, pot +£186k** | 1× |
| 2e | savings-interest tax, dividend tax and the Cash ISA wrapper in the engine | **done**: 27 assertions, golden test exact, edge unchanged at +0.73 | 1× |
| 3 | table override in engine | **done, gate met**: exact to the pound (echo table, 160 paths); with the five-world mixture the engine is within 2 points of the model's forecast on 41 of 41 (mean −0.15, within 1 on 39; the one-year fold managed 4 of 41); engine edge +1.62, up 31 / down 10 | 0.5× |
| - | **maintainer, 22 Sep**: E0 and E1 run **before** Phase 4, so the decision gate is run once at the lower cost, not twice. **Rows here are in phase-number order, not running order** - see "What runs next, in order" above: E0 goes early because its gate is bit-equality and the objective cannot affect it, E1 goes after the 6-series because its gate is a paired comparison against a baseline the 6-series is still moving | | |
| E0 | one flow per cell shared across the three worlds | **done 22 Sep, all four conditions**: K=1 bit-identical, the interleaved mixture bit-equal to three separate solves, flow calls 19,595,520 → 6,531,840 exactly, field check identical on three households. **Measured 1.66× tiers off, 1.33× on** against a 1.5×/1.2× forecast; the cache risk did not bite because a cell's flows are buffered and the worlds looped outside | 0.25× |
| E2 | split the cells across cores | gate E2: bit-equal to the single-threaded build and to itself at two worker counts (a result that depends on the division is a race); near-linear, about 4× here; composes with E0 and should be designed with Phase 7's workers | 0.75× |
| E3 | collapse the dimensions that describe an empty pot | gate E3: bit-equal, and the copied cells equal the computed ones; **30.2% of cell work removable, measured from the grid** | 0.25× |
| E4 | one interleaved value array instead of four | 8 cache lines a corner-read instead of 32; measure the access pattern before building, because cache guesses are the ones that come out wrong | 0.25× |
| E1 | candidate-set search seeded from the following year | gate E1: lands on 41, paired with flex-tiers within the margins above, ≤0.5× cost; pre-registered, not yet run | 0.5× |
| 4 | versus study | **rewritten and approved 22 Sep.** Five conditions on a HELD-OUT panel of 40 households no tuning run has touched, at seed 7003, at one declared bequest weight: (1) both arms land within 0.5 of the ask on 38 of 40; (2) the solver delivers more years at target AND is not behind on total spending delivered; (3) no household worse by more than 1 point of floor rate or 5% of spending delivered; (4) historical backtest not worse and the sign holds on all three perturbed engines; (5) it fits Phase 7's worker budget. Survival rate is no longer the headline - both arms are landed to the same ask first, so it is equal by construction | 0.5× |
| - | **phase 2 says**: +0.73 on 41 households on the total-wealth grid (was +0.59 per pot), 29 up / 5 down, sign test p < 0.001, picker 33 of 41; median pot −£182k; 21s a solve. Gate passed; 2c and 2d before Phase 3 | | |
| 5 | couples by rollout | **done, survival conditions met**: +0.77 vs the best fixed rule on 19 couples, 14 up / 3 down, worst −0.85; tiers off for couples; backtest and perturbed worlds not yet run | 1× |
| 6 | tiers and spend dimension | **tiers done, confirmed by the engine**: +6.13 in the model and **+6.16 in the real engine**, 41 of 41 both ways, 1.7 tier changes a retirement; 2× solve time (gate asked 1.5×); a preset, off by default; spend dimension deferred | 1× |
| 6b | flexible spending and tiers together | **run 22 Sep**: conditions 2 (years at target +0.125, 30 up / 1 down), 3 (1.80× of 2.5×) and 4 (1.57 changes of 3) pass; **condition 1b fails as written on 9 of 41**, seven of them households that took no trimming at all and two that are inside the bound on the sample the landing optimised. Fully-funded rate +54.93 vs the guardrails (p = 0.000) against flex-landed's +13.43 (p = 0.755); pot −£870k, the tier trade Phase 6 measured at −£917k. Recorded, not tuned, not merged | 1× |
| 6c | the bequest shape: a shoulder, not a cliff | gate 6c: default bit-identical, `soft` equal below the cap and strictly increasing above, pot up on the 9 cap-binding households with no floor rate more than 0.5 lower, and bit-equality with the cap above the grid top (3b). Conditions 1 and 2 pass; condition 3's control clause was unsatisfiable as written and is corrected in place, with 8 of 12 reported | 0.5× |
| 6c-screen | is the curve's shape a free choice? | 20 minutes at fixed lambda: if the median pot is within 2% across p on every household the logarithm stands, otherwise the curve is a live variable and 6d cannot validate the objective until it is settled; runs before 6d | 0.1× |
| 6e | grid fidelity: three flat regions the audit found | **two stages, pre-registered 22 Sep from `results-audit-constants.txt`.** Stage 1, ~40 min: twelve worst-affected households at fixed lambda, four arms (current / re-spaced / interpolated / flag-fixed); if every arm is within 2% on median pot the ceilings are second-order and stage 2 never runs. Stage 2, ~13 h wall, paired against 6b: (1) landing undamaged 41 of 41 - the safety condition; (2) no floor rate down more than 0.3 and no median pot down more than 2%; (3) the fix must MOVE something on at least six of the twelve, or it is recorded as measured-and-rejected; (4) the 33 households outside bucket 0 bit-identical to 6b. **Runs before both 6d stages, and stage 1 runs before E3 because a fourth gain bucket would cost 33% of cells against E3's 30.2% saving** | 0.5× |
| 6d | two levers for the estate, and calibrating them | **approved 22 Sep, restructured into two stages before running** (1-2 h sweep at fixed lambda, then the promise landed at the two extremes only, against 13 h for the single-sweep first draft), gate 6d: monotone, ends distinct on 6 of 8, the promise holds at every weight including zero; plus whether re-weighting without a re-solve is close enough to make the lever instant; pre-registered, not yet run | 0.5× |
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


---

## Runs completed or cancelled 22-23 Sep, as recorded in the run-order table at the time

Rows copied verbatim. #108 and the convergence test ran after these rows were written; their outcomes
are in `results-108-paths.txt` and `results-converge.txt` and summarised in PLAN.md's ledger.

| When | What | Outcome at the time |
|---|---|---|
| done | **6c** field check | **not passed**: conditions 1, 2 and 3b pass, 3's control clause fails on S390, whose estate sits at 97% of its bend and which was therefore never a control. `soft` stays off; the curve returns as a question inside 6d |
| done | **E0**, one flow per cell across the three worlds | **passed**, 1.66× / 1.33× |
| done | **6e stage 1**, the grid-fidelity screen | **QUIET**: every arm inside 2% on all twelve (re-spaced -1.74%, interpolated -0.22%, lump flag +0.00%), no household's years-at-target moved. The buckets now stand on evidence. Stage 2 cancelled; E3/E4 sized against a grid that will not grow. |
| done | **E4's measurement** and **the solve/forward split** | **E4 is DEAD**: interleaving is 3.8% SLOWER at the real shape, not faster - the prefetcher handles four sequential streams better than one strided one. **The split**: solving is 45.7% of a landing, running paths forward is 54.3%, and the ratio holds at any solve count. So all of Part E speeds up the minority half, and E3's 30.2% of cell work is 13.8% of a landing. |
| **next** | **Task #108**, sweep the landing against search-path count | **Promoted ahead of E3 on the split measurement, 23 Sep.** Every solve is followed by 5,400 forward runs costing 373 s against the solve's own 314 s, and that number was chosen once and never swept. If 1,000 lands as well, roughly 44% comes off a landing - three times E3 - and it is a parameter sweep, not new code. **Not free money**: those paths CHOOSE lambda as well as measure it, and 2d finding (d) already measured the winner's curse at up to 0.8 of a point of undershoot. It may conclude 5,400 is needed, which is worth knowing before a day and a half goes into E3 rather than after. |
| cancelled | **E4's build** | Its measurement killed it: 3.8% slower, not faster. Recorded in results-part-e-measured.txt. |
| then | **the convergence test**, ~1.9 h | **Replaces the lambda curve.** Bisection on log lambda takes the GEOMETRIC midpoint, so five steps take the 400x bracket to **1.21x** (not 12.5x - that first claim was wrong by ten). Measured from the #108 landings, a 1.21x uncertainty in lambda costs about **1.1 points of floor rate** on sensitive households, and `best` is the last lambda that MET the ask, so the miss is always on the OVER-TRIMMING side. Overshoot decomposes as +0.5 deliberate margin, up to ~1.1 bracket, remainder granularity. **Still matters for Phase 4** - the app's own optimizeSpend converges to a 250-pound bracket while ours stops a point short, so the bias is one-sided against the solver on a headline metric. |
| ~~cancelled~~ | ~~**the lambda curve**~~ | **Cancelled before running.** Its question - is floorRate(lambda) a staircase - was answered by algebra plus free data. The search is a Lagrangian relaxation, so the floor rate IS piecewise constant, but the trim cost is a sum over ~9,720 cells x 40 years and cells flip one at a time, so the steps are microscopic: effectively a smooth monotone curve. The four landings per household in task #108 confirm it - **0 reversals in 15 adjacent pairs.** Spending 1.6 h to confirm something derivable is the mistake this plan keeps making in reverse. | What shape is floorRate(lambda)? Asked against my claim that it is smooth and monotone, which was a quote from a comment rather than a description. It is a STAIRCASE - the policy is an argmax over a finite action set - and the tax kinks enlarge its steps. Decides how much a bracketed superlinear root-finder can buy; Brent degrades to bisection on a bad staircase, so the shape bounds the upside only. |
| done | **6f**, the kink screen | **Run 23 Sep: prediction confirmed.** Removing resilience cuts the unlucky tenth's end pot on all six (19% to 99%), so per the agreed rule it is load-bearing -> re-anchor, not remove. **The larger finding: it buys that pot with trimmed spending** - years below target 1.6 -> 9.4 (S126), 2.8 -> 14.6 (S390), 4.0 -> 13.8 (S112) from wR 0 to today's 0.5, for 0.4-2.1 points of floor rate. It is the main source of trimming, and it is not a lever the user chose. Re-anchoring must include 'off by default, downside protected through the user's own pot floor'. Maintainer's decision. `results-p6f-kink.txt` |
| done | **#106, the dead corner** | **Confirmed 23 Sep, every prediction.** S126 reads 7.6% against 96.8% simulated; five controls within 2.5 points, three of them at S126's own share but still working. Halving the dead corner's pull (clamp 1e-3) lifts S126 to 45.6 and moves the controls by at most 0.5. Fix lands once, after Phase V, which first extends to the share axes. `results-106-deadcorner.txt` |
| done | **E1 and single-peak probes**, S184 | **E1 fails its own bar**: the best candidate set (38 of 360) covers 98.68% of cell-years - a silent wrong move one time in 76; not built. **Single-peakedness confirmed** over 5.0 million combinations: 72 exceptions, ternary search never worse; but with five levels it saves about one evaluation in five, not two. After Phase 4. A first run on the default menu (216 actions, three levels) tested nothing and printed 'safe' - discarded, and both probes now refuse that. `results-probes-e1-unimodal.txt` |
| cancelled | **6e stage 2**, the field check | Stage 1 came back quiet on every arm, so the ~13 h field check does not run. Task #125 (a fresh 6c) expires with it: nothing is owed. |

**E3 and E4 run BEFORE 6d; E2 waits for Phase 7. Maintainer's decision, 22 Sep, against my
recommendation, which is recorded here rather than quietly replaced.** I argued they should wait: 30%
off a one-to-two-hour run saves twenty minutes, against roughly a day and a half to build, and 6d
answers a product question that had been open all day. The decision was to take them first on the
grounds that they carry no risk to the model, and on that the answer is: **E3 and E4 carry very little,
E2 carries a different kind.**

E3 and E4 are single-threaded and must produce byte-identical answers, and bit-equality is unfakeable -
an index-arithmetic error fails the check immediately and loudly. E2 is concurrency, where a passing
test is not proof: a race can pass a hundred times and fail on the hundred-and-first, because it turns
on timing rather than logic. Bit-equality there is evidence, not a guarantee. E2 also needs worker
infrastructure that Phase 7 builds regardless, so it is designed alongside that rather than twice.

The distinction between E0 and E1 is the point: **exact work can run against a moving objective, measured
work cannot.** E0's gate is arithmetic; E1's gate is a comparison, and a comparison needs a fixed thing
to compare against.

---

## Phase V (COMPLETED 23 Sep 16:35, decision A) - moved here from PLAN.md 23 Sep evening

Outcome: the plans are stable, the table's own numbers are not; V1 and V2 failed as written on the table
reading, and the maintainer decided (A) to judge numerics on the simulated outcome. Results:
`results-phase-v.txt`, `results-phase-v-raw.txt`. The sub-point check V could not make runs inside step 2.

**Two arithmetic corrections found by the method audit, 23 Sep evening (neither changes a conclusion):**
the V1 text says a 10% band of wealth spans "about 0.8 sd"; it is ln(1.1)/0.13 = 0.73 sd. The V2 text
says the wealth axis has "h = ln(600)/n = 0.21 at 30 points, near 24% steps"; the axis has 29 log-spaced
points, so h = ln(600)/28 = 0.23, steps of 26%.

## Phase V: OUTCOME AND THE DECISION IT NEEDS (23 Sep, 16:35)

**Result, in one line: the plans are stable; the table's own numbers are not.** Changing the quadrature
(5/9/15 nodes), the wealth axis (16 to 56 points) and the share axes (6/9/12) moved the SIMULATED survival
by no more than noise on all three households, while the TABLE's reading moved by up to several points
and does not settle even at 56 points - optimistic by 2 to 3 points against its own simulation. 6 to 9%
of stored moves change with the settings without moving the simulation, which points to near-ties.
#106's dead corner is confirmed four ways and confined to S126's bridge years. Linear interpolation is not
a safe replacement for log-odds (better on average along wealth for two households, catastrophic on the
third). Full tables and predictions against outcomes: `results-phase-v.txt`.

**Gate status: V1 and V2 FAILED as written** - the pass marks were set on the table's reading as well as
the simulation. By the standing rule the queue stops here.

**DECIDED 23 Sep, maintainer: (A).** The numerics are judged on the simulated outcome - what a user is
shown - with the table used only to choose moves. The maintainer's test, in his words: as long as the
solver's choices give a strong simulated result against the current app with the same inputs and
settings, the table's own number does not matter. That is Phase 4; the step-2 check below adds the
sub-point confirmation V could not make.

**The options that were put:**
- **(A) Re-judge V1, V2 and V2s on the SIMULATED outcome** - what a user is shown - and add the check
  V could not make: at 3,000 paths, on the 12 step-2 households, the settings' extremes (5 vs 15 nodes,
  30 vs 56 points) compared on survival AND spending delivered AND lifetime tax, gated at half a point and
  1% of spending. Folded into step 2's field check; about an hour more. The table is never a reported
  number (already a requirement, now written into the Fixed requirements). *Recommended.*
- **(B) Treat V as failed and raise the resolution.** The table does not converge even at 56 points, so
  no practical setting passes the gate as written; this buys solve time and not a pass.
- **(C) Stop and investigate the table's bias further** before anything else. Informative, but the bias
  does not reach the decisions on any evidence so far.

**Unaffected either way:** the #106 fix (keep a dead share node out of the read) goes into step 2.

---

## Phase V. Is the numerical machinery converged?

Nobody had asked whether the discretisation is converged: five Gauss-Hermite nodes, never varied; a
30-point wealth axis never run as a convergence sequence; six points on each share axis, never tested at
all; log-odds interpolation never compared against linear. **An unconverged discretisation biases
everything, invisibly, and identically in both arms of Phase 4, so Phase 4 cannot detect it.** #106 then
found a real fault on a share axis, which the original design could not have seen.

#### HYPOTHESES, derived before the run

**V1, and it is NOT simply "five is too few".** The rule integrates the next year's value against a
standard normal. Computed from the rule itself:

| nodes | nodes inside +/-2.2 sd | largest gap between nodes |
|---|---|---|
| 5 | **3** | **1.501 sd** |
| 9 | 5 | 1.307 sd |
| 15 | 5 | 1.174 sd |

So at five nodes, 95% of the probability is carried by THREE points and the widest blind spot is 1.5
standard deviations across. How wide is the cliff in the same units? Wealth grows by `exp(mu + sigma z)`,
so at an equity volatility near 0.13 a 10% band of wealth spans about **0.8 sd** - narrower than the
gap. On that alone five nodes look inadequate.

**But the integrand is not the cliff.** `V_{t+1}` is already an expectation over every remaining year,
so twenty years of future uncertainty have smoothed it into a sigmoid far wider than one year's cliff.
The smoothing is weakest at the END of the horizon, where little future remains to average over.

**So the prediction is specific: the quadrature error is concentrated in the last few years and largely
washes out of the opening value.** V1 PASSES on its headline (opening survival within 0.1 of a point)
**and** the policy differences it does find are concentrated at high `t`. **Falsified if** the opening
value moves more than 0.1 of a point, or if the differing moves are spread evenly across years - the
second would mean the smoothing argument is wrong and the error is everywhere.

**V2.** Total wealth sits on a LOG axis read by linear interpolation, whose error is order
`h^2 * |V''|` for spacing `h`. The axis spans roughly 600x, so `h = ln(600)/n = 6.4/n`: about 0.21 in
log-wealth at 30 points, near 24% steps. **Prediction: successive differences shrink roughly as
1/n^2**, so the 30-to-56 gap should be around three and a half times smaller than the 16-to-24 one.
**Falsified if** the steps shrink materially slower than quadratically - which would mean the
interpolation is resolving something non-smooth (the cliff) rather than a smooth function, and the
resolution is genuinely insufficient rather than merely finite.

**V3.** Survival as a function of log-wealth is approximately a normal CDF, being the probability that a
sum of lognormal returns clears a threshold. A logistic and a probit agree to under 1% across the
central range, so **log-odds interpolation should be close to exact near the cliff while plain linear
interpolation carries the full curvature error.** Prediction: log-odds beats linear near the cliff by a
visible margin and ties elsewhere. **Falsified if** linear matches or beats it - which would mean the
comment in `grid.js` is folklore.

#### V1. The quadrature: five nodes, hardcoded, never varied

`NODES` holds five Gauss-Hermite points and nothing in the repository has ever changed it.

Gauss-Hermite with five nodes is exact for polynomials to degree nine. **That guarantee does not apply
here.** The integrand is a value function containing a survival cliff; near the cliff it is closer to a
step than to a polynomial, and the degree-nine bound says nothing about steps.

Concretely: the nodes sit at 0, +/-1.356 and +/-2.857, and **the outer pair carry 1.1% weight each**. If a
cell's cliff falls near z = -2, the rule has NO NODE THERE - it spans the drop between a point worth
1.1% and one worth 22%.

**The check.** One household at 30 points, three arms: 5 nodes (today), 9, and 15. Node count multiplies
the expectation step linearly, so this is about 5.8 solve-equivalents, half an hour.

**Gate V1.** Five nodes stand if, against the 15-node answer: the opening position's survival is within
**0.1 of a point**, and the stored move differs on **under 1% of cells**. If either fails, every result
in this project carries an unmeasured bias and the node count must be raised before Phase 4.

#### V2. Grid resolution: is thirty points converged?

Runs exist at 20 and at 40 - but as ALTERNATIVES, chosen between, not as a convergence sequence. Nobody
has solved the same household at increasing resolution and shown the answer stop moving.

**And the code knows.** `solve()` carries a field `rich` - "a second solve at half the resolution, for
Richardson extrapolation of the move scores" - permanently set to `null`. Someone saw this question
coming and did not finish it.

**The check.** One household at 16 / 24 / 30 / 40 / 56 points, all else fixed. Cost scales with the
dense axis, so the five together are about 5.5 solve-equivalents.

**Gate V2.** Thirty points stand if the sequence is visibly converging - each successive difference
smaller than the last - **and** the gap from 30 to 56 is under **0.2 of a survival point** on the
opening position. A sequence that is NOT visibly converging is the worse outcome: it would mean the
answer depends on a resolution nobody chose on evidence.

#### V3. The interpolation scheme

Survival is read in log-odds "so the cliff between making it and not survives the read". A reasonable
choice, never compared against the alternative.

**It interacts with V2**, which is why it shares its run: better interpolation means fewer grid points
are needed for the same accuracy, so the two questions are cheaper together than apart.

**The check.** Take V2's 56-point solve as the reference. At positions BETWEEN coarse-grid nodes,
compare what a 30-point table predicts under log-odds against what it predicts under plain linear
interpolation, each against the fine-grid truth. No new solves.

**Gate V3.** Log-odds stands if its worst error against the reference is no larger than linear's. If
linear is better, the comment in `grid.js` is wrong and the read should change. If both are large, the
problem is V2's, not V3's.


#### Phase V as run, 23 Sep - extended, and its predictions written before the run

`audit-converge-numerics.mjs`, rewritten: runs on the objective that will SHIP (resilience off, six
levels, raises on, joint tiers, the household's landed lambda), reads every arm two ways - the table's
opening value AND the simulated survival of its policy on 1,000 held-out paths - because #106 showed
the first can be badly wrong while the second is fine. Adds **V2s** (the share axes at 6 / 9 / 12
points) and a **census** of cells reading 50% or more with a dead corner one step along a share axis.
Three households in parallel: S184 (the gate household, still working, no bridge), S330 (61-year
horizon, the largest smear in the old loss ledger) and S126 (the #106 household).

PREDICTIONS, derived:
- **V1 passes on S184 and S330** (table within 0.1, under 1% of moves): the outer nodes carry 1.1% each
  and the survival term is read in log-odds, where the cliff is a slope, not a step.
- **V2 passes on S184 and S330**: phase 2 found 60 x 8 x 8 matching 40 x 6 x 6 to the decimal.
- **V2s FAILS on S126 on the table read, and it is the dead corner, not resolution.** At 6 share points
  the nodes are 0.8 and 1.0 and S126's 0.85 puts a quarter of its read on the dead all-pension node; at
  9 points they are 0.75 and 0.875 and at 12 they are 0.818 and 0.909, so S126's read never touches the
  dead node and should JUMP from about 8% toward its simulated ~97%. The SIMULATED survival should move
  far less (within a point or two), because simulation walks real pots. V2s passes on S184 and S330.
- **V3: log-odds beats linear along total wealth** (that is what it is for), **and loses along the share
  axes where a dead corner sits** - which is the evidence for fix (a), reading linearly across a dead
  share corner.
- **Census: dead share corners in S126's bridge years only, near zero for S184 and S330**, whose
  all-pension node is alive in every year.

#### What each outcome costs

- **All three pass**: the foundation is sound, this is recorded once and never revisited, and Phase 4
  runs on a floor that has been checked rather than assumed. Cost: a few hours.
- **V1 or V2 fails**: every existing result carries an unmeasured bias in an unknown direction. The
  fix is more nodes or more points, both of which cost run time and neither of which is hard. **The
  6-series conclusions would need re-reading**, though the PAIRED ones (6e, 6f) survive,
  because a bias common to both arms cancels in a paired comparison - the same argument that saved
  them from the lambda under-convergence.
- **V2s fails on S126 only, as predicted**: the fix is the step-2 interpolation change, not more share
  points everywhere.

**A prediction I should have got right from the records (written mid-run, 23 Sep).** The V2 prediction
("passes on S184 and S330") cited phase 2's "60 x 8 x 8 matched 40 x 6 x 6 to the decimal" - but that was
a match of SIMULATED results, not of the table's own reading. The records on the table's reading say the
opposite, and say it plainly: the phase-2 loss ledger (`ledger-bias.txt`, `ledger-smear-fixes.txt`)
measured the table optimistic on S070 by +21, +16, +13 and +9 points at 12, 16, 20 and 28 points - a
slow, roughly 1/n shrinkage, not the 1/n^2 assumed here - while the simulated survival of the same
policy stayed at 67 to 68.5 throughout. Read correctly, the existing data predicted exactly what V2 is
showing: **the table's reading does not converge at practical sizes; the simulated outcome does.** The
same ledger showed linear interpolation cutting S070's table bias from +21 to +9 at 12 points, which is
a clue V3 should confirm. This is the check-existing-data rule failing in my own hands, recorded as such.

**Restart note, 23 Sep:** the first launch (14:59) was stopped after 15 minutes when the byte-wide policy
bug was found - its simulations read the final year from that table. It restarts on the fixed code.

---

## Step 2 (COMPLETED 23 Sep 19:45, with its re-check) - moved here from PLAN.md

Outcome: the exact final year (finalExact, M10) is on everywhere; the ternary search is OUT (the full scan is
used, +35% solve time); the grid stays at 30 points; no #106 option joins the baseline. Results:
`results-step2.txt` (first run and re-check), `results-e1-records.txt`.

## Step 2. The solver changes, and one field check

Each change is built behind an option, defaulting to today's behaviour, and bit-identity of the default
is tested before anything is switched on.

- **The interpolation fix** for #106, chosen by Phase V's measurements. Candidates: (a) read survival
  linearly across a corner at the clamp - the cliff log-odds is for runs along total wealth, not the
  shares; (b) a share node at each household's opening share, which only helps at t = 0; (c) mark cells
  that cannot fund a bridge and exclude them from the read. Prediction: (a), because V3 should show
  linear winning only across dead share corners.
- **Resilience off by default** (weight 0). Its effect at a fixed lambda is already measured by 6f.
- **Lambda as a direct setting** - one solve, no landing. The landing code stays for Phase 4's
  equal-survival diagnostic and K5's matching.
- **Six levels plus the ternary level search** (`levelSearch: 'ternary'`, written and waiting). Gate: on
  the field-check households, stored moves differ from the exhaustive scan on under 0.01% of cells, the
  simulated survival within noise, and the solve at least 15% faster.
- **The E1 probe re-run** on the fixed code before its verdict is trusted.

**The #106 fix, as built (both options, default off, in `readValues`):** `shareDead: 'drop'` gives a
share-axis corner that is dead no weight while a live corner sits in the same total-wealth slice;
`'linear'` blends survival in probability instead of log-odds when such a pair is present. Neither
touches the survival cliff along total wealth, which is what log-odds is for.

**The field check (`batch-step2.sh`), single table, 3,000 held-out paths, judged on simulation (A):**
- **The new baseline against today's code on 12 households:** today (resilience 0.5, five levels,
  exhaustive) against new (resilience off, six levels, ternary). Reported: survival, spending delivered,
  years below target, total cut, lifetime tax, median and unlucky-tenth end pot.
- **Ternary against exhaustive, on the new baseline:** survival within 0.5, spending within 1%, and the
  solve faster by at least 15%.
- **The sub-point numerics check V could not make (decision A):** the new baseline at 15 nodes and at 56
  points against 5 and 30, on survival, spending and tax. Gate: within half a point of survival and 1% of
  spending on every household.
- **The #106 fix on S126 and two controls** (S184, S162): none / drop / linear.
  PREDICTION: 'drop' leaves every control bit-identical (no dead share corner, per the census) and on S126
  cuts the bridge-year trimming (years below target, 1.6 with resilience off) toward zero without moving
  survival; 'linear' helps less. FALSIFIED IF 'drop' LOWERS S126's survival - which would mean the
  dropped corner was carrying real information near the all-pension edge, where a household really
  cannot fund its bridge.
The winning #106 option joins the new baseline, which every later step builds on.

**FIRST RUN, 17:32-18:52 - OUTCOME (`results-step2.txt`).** Two of three gates FAILED as written and the
#106 falsifier FIRED; all three stand as recorded. Ternary vs exhaustive: S390 -0.67 (3.3 se), 26% faster;
15 nodes vs 5: PASS; 56 points vs 30: S206 -1.67 (6.7 se); `drop` on S126: -1.23 (5.3 se). The saved records
put one defect behind most of all three: **the final year read the nearest cell's stored move** (M10) - all
53 paths S206 lost at 56 points, 27 of 28 S390 lost under ternary, and 37 of 43 S126 lost under `drop` fail
in the final year. Also: the "cuts far less" prediction was falsified on 5 of 12 (raises paid back as cuts,
K3's falsifier), and without any #106 fix S126 cuts to the floor and holds both wrappers two tiers down from
year 0. **The re-check** (`batch-step2-recheck.sh`, 42 cells, launched 19:00) repeats the failed comparisons
and the #106 options with `finalExact`, its predictions written in its header before launch; the base
carries no #106 option until the re-check clears one.

**How the re-check decides, written 19:15 before any re-check result was read:**
- **Ternary (M11):** stays only if `fnew` against `fnewex` passes step 2's own gate unchanged - every household
  within 0.5 of survival and 1% of spending - AND no household is worse by more than two paired standard
  errors. Otherwise every run from here uses the full scan (`TERNARY=0`, about +35% solve time) and the
  maintainer is told the six-levels-at-today's-cost decision no longer holds.
- **Resolution:** `fnew` against `fnewp56` under the same gate. A failure there does not change the grid
  tonight (56 points is twice the cost and Phase V showed no convergence to chase); it is recorded, and each
  failing household's lost paths are located by year from the records, as M10 was.
- **#106:** `drop` joins the baseline if, on S126, its survival is within 0.5 of `fnew`'s and within two paired
  standard errors, AND it cuts S126's trimmed years; and both controls stay within noise. `linear` joins
  instead only if it meets the same test and beats `drop` on S126's trimming. If neither passes, the
  baseline carries no #106 option and S126's bridge-year trimming is recorded as a known defect.

**RE-CHECK, 19:00-19:45 - OUTCOME (`results-step2.txt` section 5), judged by the rules above:**
- **The exact final year** (`fnew` against `new`): survival up on 9 of 12, never down beyond noise (S070
  +1.67, S330 +0.70, S390 +0.47, S126 +0.40). Prediction held; `finalExact` is on from here.
- **Ternary: OUT.** The original gate passes (worst -0.20, spending within 0.26%), but S112 and S390 each
  lose 0.20 +/- 0.08 (2.4 paired se) and no household gains. By the rule: the full scan from here (about
  +35% solve time), and six levels now cost about 20% more than the old five.
- **56 points against 30:** one household outside the gate, S184 -0.67 +/- 0.40 (1.7 se, failures spread
  over years 10-40: noise-shaped); S206's -1.67 was entirely the final year and is gone. S162 (+0.50,
  3.9 se) and S054 (+0.30, 3.0 se) are better at 56. Recorded; the grid stays at 30 points.
- **#106: no option.** `drop` on S126: -0.30 +/- 0.10 (3.0 se) and more trimmed years (2.20 against
  1.71); `linear` identical to none. Without a fix S126 holds its pension off-tier all 40 years (median
  pot GBP1.9m, unlucky tenth GBP307k); with `drop` it keeps its tier, 71% of paths fully funded, median
  GBP2.6m, unlucky tenth GBP81k. Recorded as an open defect for the maintainer and as the mathematician's
  question 5.

## Step 2b (COMPLETED 23 Sep 21:00, decision: nothing) - moved here from PLAN.md

**OUTCOME (`results-ranking.txt`).** 479 positions on the 12 step-2 households, 500 paired paths each, full scan, exact final year. 387 positions: first and second choice give identical outcomes (337 with a margin of exactly 0 - moves that do the same thing). 76 differ only in spending (0.00-0.04%). 16 differ in survival: 8 better, 8 worse, none beyond two paired se; mean loss 0.25, worst 0.60 (S112, one tier down against two). By the agreed table: **nothing**. The prediction held on near-ties, average loss and worst loss; its clear-margin clause is untested, because the plan's positions almost never offer a clear second choice (99th percentile margin 1.6e-4, none above 0.005).

## Step 2b. The ranking check (as planned), and what follows from its result

**The question (maintainer, 23 Sep): when the table ranks two moves, does its first choice really simulate
better than its second?** Phase V showed the table's own numbers are off by several points while the
plans are stable; the phase-2 loss ledger showed a near-tie misranked on the old grid (S070, about 6 points
on that one decision). This measures how often the table picks the worse of its top two, and what it costs.

**Method (`audit-ranking.mjs`, ~30 min).** On the new baseline for the 12 step-2 households: sample
positions along simulated paths across the whole retirement; at each, take the table's top two moves and
their score margin; simulate each (take the move, then follow the solver) on the same 500 paths; record
whether the first choice did at least as well, and by how much it lost when it did not, bucketed by the
table's margin. Prediction and falsifier: in the predictions register.

**What each result leads to - agreed with the maintainer before the run:**

| result | answer | why |
|---|---|---|
| wrong picks rare, or losses under half a point | **nothing** | the imperfection is real but does not reach outcomes |
| wrong picks frequent on near-ties, losses small | **a tie-break rule** among near-tied moves - less tax, then fewer changes; a tax-averse tie-break was measured in phase 2 | cheap, and removes pointless churn between equal moves |
| losses of a point or more on near-ties | **settle near-ties by simulation (rollout)**: when the top moves are within a margin, simulate each for a few hundred paths and take the better | **provably no worse than the table**: the table's own pick is one of the candidates, so rollout can only correct it (the rollout-improvement property). Costs only on near-ties; for the app's "this year's action" it is seconds |
| errors concentrated where survival changes sharply | **extra grid points on the cliff only** (the adaptive grid the loss ledger already named) | puts resolution where it pays, not everywhere |

**Already in the code (finding M7):** the tie-break row is `tieMargin` in `chooseAction`, off, measured on the
old grid at +1.5 points on S070 and -0.5 on the largest wins; it is re-measured, not rebuilt. Richardson
extrapolation (`rich`) also exists and has never been measured.

**Not the answer: a uniformly finer grid.** Phase V showed the table's error shrinks only slowly with
resolution - still moving at 56 points, about twice today's cost - and near-ties exist at any resolution.

**If a fix is needed** it is built and checked before K5, so the guardrail matching and Phase 4 run on the
fixed solver. It adds a few hours to Thursday.

## M14b (COMPLETED 24 Sep 16:49 UK, FALSIFIED; the default decision held for M14c) - moved here from PLAN.md 18:30 UK

Outcome (results-m14b.txt, results-m14b-why.txt; the ledger row 24 Sep 16:49): the thin four gained less than predicted and comfortable plans lost survival beyond two se (S172, S194, S162), so the falsifier's second clause fired and its registered consequence is 'auto'. 'Auto' at 85% was approved at 16:57 UK and held at 17:35 UK for M14c. The section as it stood:

## M14b. Risk above the tier, re-checked under the step-6 defaults (prediction committed 24 Sep 07:33 UK in 204335d, before the run)

Plan held at Medium; the M17 fix on, cap 1.1, one-year minimum pot; landed lambdas; 3,000 paired paths of held-out seed 7011
(not 7002: see below). **Run in the
three-world mixture (MIX=3), changed 24 Sep 08:39 before the run:** it decides a product default, and the 'auto'
fallback's 95% threshold is a level, which the fold reads low. About three times the solve time (~2 h, not 40 min).
Households: the thin four (S070 S184 S330 S354), two comfortable (S162, S252), and six with solver survival
85-96% at the top tier (S082 S020 S194 S414 S234 S172).

**The maths.** Survival is convex in wealth below the cliff, so more spread helps a position that is behind
(Jensen). The M17 fix charges each unfunded year at the floor's price, which a bet that fails early now pays
for. So the bet stays worth making where it saves futures, and gets dearer where it only brings failure
forward. In M14, unfunded years FELL with the bet, so the fix should trim it at the margin, not reverse it.
The gain should scale with the share of years spent behind, and so roughly with the failure rate: about 0.11
points per point of failure on M14's thin four (2.5 / 22).

**PREDICTION (revised 07:33 UK, commit 204335d, for the widened default, still before the run; registered as `predictions/m14b.md`, which the launcher requires):**
1. **The thin four:** still better with it, +1 to +3 points each, beyond two paired se on at least 3 of 4. Unfunded
   years per path not higher on any.
2. **Where the bets happen:** the share of up-move years in failing paths' last three paid years falls below 10%
   on each thin household (it was 10-20%).
3. **The zone six:** gains between 0 and the thin ones', about 0.1 points per point of failure without it:
   - roughly +1 at 90%;
   - within noise at 95% and above;
   - none worse beyond two paired se.
4. **Comfortable (S162, S252):** within noise. M14's one loss (S162, -0.23 +/- 0.09) came under the old objective. The
   M17 fix makes a failed bet dearer, so the loss should shrink.

**FALSIFIED IF** any thin household is worse with it by more than two paired se, or unfunded years rise beyond two
se on the thin four. Then the default reverts to opt-in. **What decides between "every plan" and `'auto'`:** if any
zone or comfortable household is worse with it beyond two paired se, the default becomes `'auto'` (thin plans,
with the no-worse guard) and the threshold is set from item 3. Otherwise "every plan" stands. **Held-out paths moved to seed 7011 (24 Sep 10:33 UK, the plan-auditor's third review, before the run):** the zone six and the thin four were chosen on seed 7002's paths (flex-tiers and M14), the paths M14b first meant to report on, so a selection on survival there could lean the result. Measured on seed 7011's paths, which chose nothing, the selection cannot lean it, and the falsifier reads both ways again.
