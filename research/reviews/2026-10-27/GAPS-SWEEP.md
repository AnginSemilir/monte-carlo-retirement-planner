# Other gaps like the windfall's: a sweep and four probes (EXPLORATORY), 27 Oct

The maintainer, 27 Oct, after the windfall-routing question: "Do you think there's other similar gaps to find in the
solver!", then, on the plan below in outline: "Go ahead". Written, committed and pushed before either part is launched. Two
runs were made before writing, and both are declared below. Nothing here changes a default, a gate or the candidate
(CHECKLIST 1). Seeds 99001 and 7002 only. No household in Phase 4's panel or its reserve orders is used
(`phase4-panel.json`, `phase4-orders.json` at 9bfb57b).

## The two kinds of gap

1. **A choice made by a fixed rule or a plan setting.** The solver plans around it but cannot make it. The windfall's
   routing is one (D37's item, after Phase 4).
2. **A rule the solver's model and the engine apply differently.** The forward run and the tables then plan for a year
   the engine does not run. The deposit-order defect of 27 Oct was a fairness gap between arms, not this kind: both sides
   build their deposits from the same `buildContext`. V2's state check catches this kind, but only on the plan options
   its five households use.

## The inventory: what the engine decides by rule under a solved table

Read from `research/engine.mjs` (built from App.jsx at 9bfb57b) and `src/solver` for this plan.

| The decision | Where the rule is | The solver's menu |
|---|---|---|
| Where a deposit goes: the policy's deposit order for an Auto deposit, the named wrapper otherwise | `buildContext`, `policyRoute` | not a choice (D37's item) |
| How fast a deposit's surplus moves into its wrapper later: a tranche each year at that year's headroom | `buildContext`, the staging loop | not a choice |
| Contributions while working: how much, and into which wrapper | the plan's schedule (`contribAtYear`) | not a choice. `model.js` has a slot for it (`action.contrib`); `buildActions` always sets `contrib: null` |
| The full 25% lump sum at first access, or phased | the plan's drawdown strategy: `solvePlan` passes `lump: m.ctx.fullLumpSum` | not a choice. `solveBoth` exists but `solvePlan` does not call it |
| The size of the cash buffer, refilled every year | `cashBufferMonths` (6 by default); every move sweeps (`sweepCash: true`) | not a choice |
| Cash above the buffer goes into the GIA, **including cash-ISA money**, which loses its shelter | engine 7d and 7e; `fast.js` 7d and 7e alike | not a choice |
| Guaranteed income above the spend goes to cash up to the buffer, then the ISA, then cash (swept to the GIA) | engine step 7 | not a choice |
| A CGT bill is paid from cash, then the GIA, the ISA and the pension | engine 7c | not a choice (minor) |
| A one-off cost is met in the move's own draw order | engine step 5 | a choice, through the draw order |
| Draw order, harvest and its ceiling, spend level, tiers (pension and ISA together), the HR re-wrap | the move | the solver's |
| Paying into a pension after retiring (£3,600 gross) | only as a dated deposit | not a choice |
| Two people's draws, allowances and bridges | the solver plans one person (`fast.compile` refuses a couple) | outside the solver |
| An annuity, State Pension deferral | not in the engine (deferral tested 24 Oct: no gain) | outside the engine |

The sixth row is new. It came from reading `fast.js` against the engine for this plan. Both sides apply it alike, so it is
the first kind, and Part B probes it (ISA2ISA).

## Part A. The sweep: V2's state check across the plan options (the second kind)

**What.** `gaps/sweep.mjs` runs `state-check.test.mjs`'s lockstep, one case at a time. A case is a base household with one
change to its plan. The light candidate (the state check's `LIGHT`) is solved on it, and the engine then takes the forward
run's move each year on the same 20 paths of seed 99001. The states are compared slot by slot at the top of every year, and
the wealth at the end where the forward run survives, as in the state check.

**Two guards, so a pass cannot come from a check that ran on nothing** (CHECKLIST 5):
- **live**: each case counts the household-years its change acted in (a deposit landing, a tranche, a deduction, a cost, a
  band, an income, the lump sum, year 0 with a part year, a year-0 gain, a working year), read from the engine's context and
  rows in the years the forward run was still running. A case with none fails.
- **planted**: each case then perturbs the forward run's copy of its feature in the compiled household (`r.c` after the
  solve) and runs the lockstep again. The two must part by more than a pound, or the case fails. The plants: a deposit moved
  one pot along, the tranches or deductions dropped, the cost dropped, the bands ignored, the other incomes dropped, the
  buffer set to six months (twelve where the plan's is six), the lump sum turned off, a full first year, the year-0 exemption
  restored, the cash-ISA subscription dropped, the pension contribution halved, or every spending year 5% dearer for the
  settings with no data of their own. Each plant is undone and checked undone before the next case.

**The 58 cases** (`node gaps/sweep.mjs --list`). The base households are the state check's own: carry, S370, S380, S224 and
S008. The sixth is S330F, S330 retiring at 52 at a 4% draw.
- the five named policies routing S370's Auto deposit; Windfall to ISA routing one while working (S224);
- deposits into the ISA (two households), the pension while working and after retiring (each staged), cash and the GIA;
- Bed & ISA from the GIA over three years, a recycle from cash into the pension, the ISA into cash (deductions);
- a one-off cost (three households), a gift, a regular gift out of surplus income;
- spend bands (two shapes), a DB pension, rental and tax-free income with an end, part-time earnings after retiring,
  guaranteed income above the spend (the surplus path);
- a cash buffer of 0, 24 and 3 months; the full 25% lump sum (three households); a part first year, valued on 27 October
  (three households);
- CGT gains already used with a sale in year 0; carry-forward with a pension deposit; a cash ISA paid into while working;
  a contribution schedule; salary growth and self-employment with a pension deposit; the FIRE household, with and without
  an Auto deposit under Windfall to ISA;
- inflation at 4% with a 3.5% dividend yield; CGT off and cash interest untaxed; the pension and ISA at lower tiers; cash
  at Low Risk; no flexible spending; a horizon to 100; rUK and Welsh tax; and a control on each base household.

**Prediction.** All 58 pass. `fast.js`'s year follows the engine's step by step on every feature listed, and reading them
side by side for this plan found no difference. If one parts, the likeliest is the part first year (the frac terms) or a
staged deposit.

**What a result means.** A case that parts by more than a pound in any slot, or whose lump-sum flag or tiers differ, is a
fidelity gap. It is reported with its first year and slot, and its class is searched (CHECKLIST 7) before anything else is
read. A case with no live years, or whose plant does not part, is a failed check: fixed and rerun, not counted.

## Part B. Four probes: what a setting the solver cannot choose is worth (the first kind)

**What.** `gaps/plan-probe.mjs` solves the candidate (candidate.json as it stands, fcd8096217b7) on the plan as it is (BASE)
and on the plan with one setting changed. Both run forward by the solver's chooser (`runPolicy`) on the same 8,000 paths
of seed 7002 at 45 wealth points and estate weight 0.02, as N1's probe. A variant that beats BASE shows what the fixed setting
costs that household. A solver choice of the setting could recover at least that: exactly that for a once-only choice
solved both ways, as `solveBoth` does for the lump sum, and more if the choice could follow the state. Part A covers each
probed setting's fidelity.

| Arm | The change | Households |
|---|---|---|
| BUF0, BUF24 | the cash buffer at 0 or 24 months (the plan's: 6) | S370, S380, S224, S362 |
| LUMP | the full 25% lump sum at first access (the plan's: phased) | S370, S380, S224, S362 |
| ISA2ISA | the cash ISA above the year-0 buffer moved into the stocks and shares ISA at the start (an ISA transfer: no allowance used), so the sweep cannot move it into the GIA | S224 (£60,000 moved), S380 (£68,750) |
| MOREISA | each working year, half the pension contribution's net cost saved in the ISA instead (the pension at half its gross; the ISA gets the net cost saved, priced by the engine's `netCostOfPensionContrib`) | S302F, S330F, S342F |
| MOREPEN | each working year, the ISA contribution saved in the pension instead, grossed up to the same net cost | S302F, S330F, S342F |

S370, S380, S224 and S362 are tuning households already in V3's panel, and none is in Phase 4's. The FIRE households are
library households retiring at 52, as Phase 4 builds its FIRE cohort, from library households earlier runs used (so none
is in Phase 4's panel or reserves): S302 (pension-heavy, lean), S330 (GIA-heavy, comfortable) and S342 (balanced,
comfortable). Each is saving from 37 to 52, with a bridge to 58. Each is landed by `gaps/land.mjs` where its outcome is in
doubt: the target set until the plan's own rules survive 85% +/- 2 on 500 engine paths of seed 99001, at the candidate's
return assumptions.

**ISA2ISA's confound:** the money moved then sits at the ISA's tier (the joint step with the pension), not the GIA's
Medium Risk. So the probe measures the shelter together with a change of tier, and is read as an upper guide to the
shelter's worth.

**Prediction.**
- MOREISA beats BASE on S302F (pension-heavy, its bridge funded by little accessible money) by a point or more, and
  MOREPEN loses there. On S330F and S342F, where taxable money covers the bridge, both are within half a point.
- LUMP is within half a point everywhere.
- BUF0 gains 0.1 to 0.5 points from less cash drag; BUF24 loses 0.3 to 1.
- ISA2ISA gains 0.2 to 0.8 on S380 and S224.

**The rule** (`gaps/read-probes.mjs`, applied to each arm across its households; no verdict for an arm until all its
units are in):
- **Worth a solver choice:** on some household the arm beats BASE beyond noise (the paired 95% interval's lower end above
  nothing) by 0.5 or more, in survival points or in the whole score.
- **Not worth it now:** on every household the arm is within 0.25 of BASE, or below it, in both measures.
- **Otherwise marginal:** the maintainer's call.

A loss is reported beside it: it shows the setting matters, though the plan's own value is already the better one there.

**The fair test:** the read refuses to pair units that differ in code, candidate, seed, paths, points or weight.

## Declared: the two runs made before writing

- The sweep's timing smoke: `control S370` on 4 paths. PASS, a solve of 38 s, every gap within 1.3e-10 pounds, the plant
  parting by £2,238,443.
- The landing (`gaps/landing.json`): S302F at £15,100 a year (the rules survive 83.2%), S330F at £57,200 (85.8%), S342F at
  £50,900 (86.0%).

## The budget

On this machine's two cores: Part A about 55 minutes on one; Part B's 27 units at about 17 minutes each (N1's solve and
run times), about 4 hours on two. The read is taken when each part is in.
