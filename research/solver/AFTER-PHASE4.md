# After Phase 4: D37's and D38's items, sized (D40 (5))

The maintainer's go-ahead of 29 Oct (D40 (5)) on the items queued for after Phase 4's read. Two are done and in STATE.md
section 6: the GIA basis guarded under CGT off (`state-check.test.mjs`'s CGT-off household, failing before; results in
`research/tests/results-cgt-basis.txt`) and the held-out scan reading the review branch (`held-out.mjs`, a planted case;
`research/tests/results-held-out.txt`). This page sizes the three new solver choices, records the cash ISA limitation and
weighs the review's sweep for the nightly check. Nothing here is built or run yet; each build waits for the maintainer.

The archived plan lists "contributions" and "lump sum vs phased" as out of scope by design (archive/PLAN.md, "Known,
recorded, and NOT planned"). D37 and D38 reopen them for sizing only.

## 1. The windfall split (D37)

**What.** Each Auto deposit (a dated one-off contribution with no target account) lands in cash, and in the deposit year a
move chooses the split: the pension up to its headroom, the ISA up to its allowance, the rest kept taxable. The engine
carries the chosen split out that year, instead of fixing the routing when the plan is set up.

**Where the code stands.** The engine routes each Auto deposit once, in `buildContext`, by the plan's named policy's
deposit order; Phase 4 had to route it alike in every arm for that reason (`audit-phase4.mjs` solverPlanOf). `fast.js`
reads the routed deposits as a fixed per-pot schedule; `model.js` the same.

**The build.**
1. The engine: under a table, an Auto deposit lands in cash; the year's move may carry a split, applied in step 1 (dated
   deposits) before contributions, with the pension's annual allowance and relief and the ISA's allowance respected.
2. `model.js` and `fast.js`: the same split in the forward run (the deposit-year pots no longer a fixed schedule).
3. The menu: split variants only in deposit years (the plan's own routing; pension first; ISA first; all taxable). The
   menu grows only in those years, so the solve's cost grows little.
4. Tests: a windfall household in `state-check.test.mjs` (the engine and the forward run in step through the split), a
   hand calculation of each split, and a planted case (a split the engine ignores).

**The test.** A factorial on the panel's 17 windfall households (`phase4-panel.json`: the households with a dated deposit),
the candidate with the split and without, seed 7002, 8,000 paths, EXPLORATORY: about 11 core-hours (Phase 4's CAND units,
about 0.3 core-hours a household at 8,000 paths), about 3 hours on four cores.

**Size.** The second largest of the three, after the savings split; about a day's build with its tests, then the run.

## 2. The lump sum: already almost a solver choice

**What.** The solver chooses whether, and when, to take the 25% lump sum, where today it reads the plan's choice.

**Where the code stands** (corrected 29 Oct, after the maintainer's question): nearly everything is in place. Every move
carries a `lump` flag; the forward run takes the whole lump on a move that asks for it, in any year after access once the
owner has retired, while it has not been taken (`fast.js`); the engine does the same under a table (`App.jsx`:
`fullLumpSum: !!chosen.lump`; `bridge.js` hands the move's flag over); the table's state carries the allowance used and
the lump-taken flag (`grid.js`). What stops the solver choosing is one line: `solve()` stamps every move with the plan's
own choice (`.map(a => ({ ...a, lump: !!opts.lump }))`), so in one solve every move takes the lump or every move phases.
`solveBoth` (solve both ways, keep the better) is not needed for it.

**The build.** Offer both versions of each move (the lump and phased) in the years the lump is still open: from pension
access, retired, not yet taken. Small: the menu, a check that the engine and the forward run take the lump in the same
year (a household in `state-check.test.mjs` whose table takes it), and a planted case.

**What it would cost.** The menu grows in the years after access. Where the lump is already taken the two versions are the
same move, which the solver's memo (S1) should mostly absorb; the solve time against gate 5 (D11) is to be measured, not
assumed.

**The caveat.** The table reads the lump-taken flag from the allowance bucket (`grid.js`, Phase 6e arm 4): a household that
has used a little of its allowance is valued as one that may still take the whole lump. Stated in the code; the choice
inherits it.

**What it would gain.** Small on present evidence: the review's probe (EXPLORATORY, seed 7002, `gaps/results-plan-probes.txt`
on the review branch) found the full lump sum against phased, fixed for the whole plan, changed survival by -0.54 to 0.00
points on its four households, never for the better; Phase 4 found no difference between the households where arm A took
the lump sum and the rest. A choice can only match or beat both fixed settings in the model, so the risk is the solve's
time, not the outcomes.

**The test.** The candidate with the choice and without, on the panel's households with a pension before access or at it,
seed 7002, 8,000 paths, EXPLORATORY, with the solve's time beside it. Sized when the build is: a few core-hours.

**Recommendation.** Build it: about half a day with its tests, cheaper than either other choice here. Part C's lump-sum lock
(`lumpSum: 'free' | 'never' | 'now'`) then becomes a restriction on a choice the solver makes, as the other locks are.

## 3. The savings split while working (`action.contrib`, D38 (4))

**What.** While the household works, the solver chooses where the year's saving goes (the pension or the ISA, at the same
net cost), instead of the plan's fixed contributions.

**Where the code stands.** `model.js` has the slot (`action.contrib`, a map of account to amount; null means the plan's
schedule) and steps it correctly; `buildActions` sets it to null. `fast.js` precomputes the scheduled contributions per
year, so the forward run ignores it; the engine has no hook for a contribution chosen by a policy.

**The build.**
1. The engine: under a table, the year's contributions from the move (an employer match stays in the pension; relief at
   source and the annual allowance, its taper and the MPAA applied as today).
2. `fast.js`: contributions per move, where they are precomputed now; the gross-up so that moving saving between the ISA
   and the pension keeps the net cost the same.
3. The menu: in working years, the plan's split, pension first and ISA first, at the same net cost.
4. Tests: a saving household in `state-check.test.mjs`, a hand calculation of the gross-up, a planted case.

**The probe's limits** (D38 (4)): it moved the whole contribution, any employer match included, and its households sat
at 95 to 98% survival; one of three (S302F) failed its bridge with everything in the pension. No fixed split suits all
three, which is the case for a choice.

**The test.** A factorial on the panel's 27 working households with contributions, the candidate with the choice and
without, seed 7002, 8,000 paths, EXPLORATORY: about 17 core-hours, about 4.5 hours on four cores.

**Size.** The largest of the three: the accumulation years enter the forward run's choices for the first time. About two
days' build with its tests.

## 4. The cash ISA under a table (D38 (5)): a known limitation

Under a table, cash above the buffer goes to the taxable account, cash-ISA money included, so that money loses its
shelter. The review counted 94 of 153 library singles losing some in year 0. Moving the cash ISA into the stocks and
shares ISA first gained under a fifth of a point of survival on each of its two households (S224, S380; an upper guide,
since the money also changes tier). The fix is cheap (the sweep takes the cash ISA last, or moves it within the ISA
wrapper) but not a priority. Recorded, not scheduled.

## 5. The review's sweep for the nightly check (D38 (6))

**What it is.** `gaps/sweep.mjs` on the review branch (250 lines): 58 cases, each a base household with one plan option
changed, run through `state-check.test.mjs`'s lockstep, each with two guards: a count of the years its option acted (none
fails the case) and a planted fault in the forward run's copy of the option (it must part the two). It found one gap, the
GIA basis under CGT off, now fixed.

**Cost.** The review timed it at about 55 minutes on one core. The nightly CI (`verify.yml`, 02:17 UTC) runs every test
file in `research/tests` two at a time, so a ported sweep adds that to the night.

**Recommendation.** Port it as `research/tests/gaps-sweep.test.mjs`, outside FAST (the nightly tier only), with the CGT
case now expected to pass. It covers 58 plan options that the state check's five households never use, each with its own
plant, for under an hour a night. The port is small: the imports from the repository root, an exit code, and the review's
case list taken whole.
