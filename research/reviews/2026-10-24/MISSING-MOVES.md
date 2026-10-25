# Missing moves (EXPLORATORY), 24 and 25 Oct: is N4 missing better moves?

The maintainer's questions, while N4 was running:
- Could a quick test show whether N4 is missing better moves, so that a new test is needed after it?
- What tier flexibility has been tested?
- Which commonly recommended moves do the tests cover?

Section 2's panel ran on 25 Oct, after N4's read. These checks use the candidate's own tables and the solver's own forward run, at 45 wealth points, estate weight 0.02,
on seed 7002 (the tuning seed). They ran on a separate machine from N4. Every figure is printed in
`results-missing-moves.txt` by the scripts in `scripts/`.

## The answers

1. **No new test of a finer drawing menu is needed after N4.**
   - **N4's ceilings carry real gains on the big spenders.** Used one year at a time with today's tables (no re-solve),
     they add +1.90 survival points on S370 and +0.67 on S248. They add nothing on S224 or S330. N4's own read, which
     re-solves, has since found +1.71 and +0.80 for HR.
   - **Nothing finer adds much beyond N4's ceilings.** A far finer menu of the same kinds of move was tried: spend levels
     in 1% steps, and draw-first and re-wrap ceilings at any income in GBP 2,500 steps. Its gain over N4's menu is between
     -0.10 and +0.03 survival points on three of the four households. The exception is +0.17 on S330 (se 0.07), from a
     re-wrap near GBP 30,000. That is below N4's 0.5 bar.
2. **The tier menu is where a real move is missing.** The pension and ISA can step down at most two tiers. A third
   joint step down (Medium/Low under a High Risk plan) was run on all seven of N4's households at weight 0.02, paired on
   3,000 paths.
   - **The panel mean:** +0.55 survival points (se 0.08) and +0.26 in the whole score (se 0.08).
   - **By household:** S370 +2.20, S248 +0.53, S330 +0.53; no household loses.
   - **By N4's own bar it would pass.** This is exploratory: one weight, 3,000 paths.
   - **A fourth step adds nothing more:** S370 +1.80, against +2.20 with the third.
   - **History:** designed in September as M15 v2's sibling arm, never run.
   - **Next:** it should go through V4's ensemble as N4's kinds did. Because S370 gains from both, it should be tested
     with HR as a factorial (D6).
3. **The app's strategy search has two choices the solver lacks:** taking the full 25% lump sum, and sending an
   inheritance to the ISA first ("Windfall to ISA"). For a fair head-to-head, Phase 4 should run the solver on the plan
   variant the app's search picks.
4. **Several common moves are not modelled at all** (the table in section 3).

## 1. Finer moves: one step of policy improvement with the solver's own tables

### The method

At a position s in year t, the chooser scores each move a by Q(s, a): the year's own terms plus next year's value from the
tables, mixed over the three worlds, less the switch charge (`chooseAction`). Let A be the menu and A' a far finer set of
the same kinds of move. The gap at s is

    G(s) = max over A' of Q(s, a) - max over A of Q(s, a)        (never below zero: A' contains A)

The performance-difference identity is exact when Q is the menu policy's own value; the tables stand in for it here.

- **The greedy policy over A'** (one step of policy improvement) gains the gaps summed along its own paths.
- **The best policy over A'** (the finer menu solved in full) gains at most the gaps summed along the paths it visits.

So tiny gaps along the paths mean no refinement in these dimensions can matter. The gaps are measured on the candidate's
own paths, in the tables' units, so they are an estimate. The greedy policies are therefore also run on the same paths,
and their gains measured in simulated outcomes, paired, in N4's units.

### The finer menu, and N4's

- **The finer menu:**
  - spend levels in 1% steps from the floor (80%) to the raise cap (110%): 31 levels, against the menu's 5;
  - the draw-first ceiling at any taxable income in GBP 2,500 steps to GBP 150,000, with the corners and N4's three
    ceilings: 66, against 4;
  - the re-wrap ceiling on the same grid: 65, against 3.
- **The search:** from the three best menu moves, each dimension on its own, then climbing one dimension at a time until
  nothing improves.
- **N4's menu:** the same search held to N4's ceilings (half the allowance, the middle of the basic band, the taper
  threshold) at the menu's five levels, with no CGT sale.
- **How the moves are scored:** by `scoreMoves` itself, on the solve's own compiled moves with only the ceiling or level
  changed (a ceiling rides on N4's step code 6). No line of `src/solver` changes.

### The checks

Each passed on all four households:
1. The probe's own scoring of the menu picks the candidate's move at every recorded decision.
2. Every finer move that is also a menu move scores the menu move's score, bit for bit.
3. Twenty paths under the probe's own chooser reproduce the candidate's run, bit for bit.
4. **The planted hole:** with the basic-rate corner removed from the menu, the search finds the gap it leaves. On all four
   households it recovers half or more at 99.6% or more of the decisions where the hole costs over 0.001 points.

### The results

Points a path. The tables' estimate is the gaps summed along 1,000 of the candidate's paths. The simulated gains are
paired on 3,000 paths: whole score, then survival (se in brackets).

| household | the candidate's survival | tables: finer menu (N4's part / beyond it) | simulated: N4's menu less the candidate | simulated: the finer menu less N4's |
|---|---|---|---|---|
| S224 | 69.93% | 0.127 (0.078 / 0.050) | -0.062 (0.048) / -0.067 (0.047) | +0.041 (0.034) / +0.033 (0.033) |
| S370 | 80.50% | 1.982 (1.771 / 0.211) | +2.034 (0.254) / +1.900 (0.254) | -0.090 (0.088) / -0.100 (0.088) |
| S248 | 52.83% | 1.293 (1.146 / 0.146) | +0.824 (0.157) / +0.667 (0.156) | +0.024 (0.106) / +0.000 (0.105) |
| S330 | 89.97% | 0.142 (0.104 / 0.038) | +0.034 (0.058) / +0.033 (0.058) | +0.171 (0.075) / +0.167 (0.074) |

- **Where N4's gain comes from:** on S370 and S248, eight of the ten largest gaps stop the draw at GBP 100,000 (the
  taper threshold) instead of drawing everything, or instead of stopping at the higher-rate threshold. The other two
  re-wrap up to it. Expect N4's HR arm to clear its bar on both.
- **N4's own read has since come in, and agrees** (bda93da, `research/solver/results-n4.txt` on the agent's branch). It
  re-solves the tables, runs 8,000 paths, and tests HR and MID separately. HR passes N4's bar with S370 +1.712 survival
  points (se 0.163) and S248 +0.800 (se 0.126) at W0.02. The one-step estimates here were +1.900 and +0.667.
- **The spend level hardly matters:** on its own it is worth 0.007 to 0.011 points in the tables on every household.
- **The tables predicted the large gains well and the small ones badly.** N4's part on S370 was 1.77 predicted against
  2.03 simulated. The small gains beyond N4 (0.04 to 0.21 predicted) did not show in simulation, except S330's, which
  showed more than predicted. Effects under about 0.2 points a path are within the tables' own error.

## 2. The tier menu

### What the solver can do today

Checked in `src/solver/fast.js` `tiersFor` and `solve.js` `tierCombos`/`solvePlan`.

- **The pension and the ISA move together**, on one joint step: the plan's tier, one tier down, or two down. They never
  move separately.
- **The GIA never changes tier.** Cash has no tiers.
- **Above the plan's tier:** only the product's 'auto' rule moves it (with consent, on a thin plan, one tier up). Every
  panel household's pension already holds the top tier, so it never acts.

### What has been tested, from the archive

- **The pension and ISA moving separately ('pairs'):** Phase 6 (September), on three households. It compared only the
  tables' opening value: the same to four places, at several times the solve cost. It was never run in simulation, and
  it predates the tier state, the switch charge and the 29 Sep growth correction (7m).
- **The GIA joining the joint step (M15):** run, and FALSIFIED. S330 lost 3.2 points, because dragging the GIA down
  removed the pension-only de-risking move.
- **M15 v2:** GIA rungs below the joint steps, with a third pension/ISA step as the rival arm. Designed (archived
  PLAN.md), held for other work, and never run.
- **The bottom step binds:** M22 (24 Sep, an older solver) found the lowest step chosen in 87-91% of spending years on
  four thin households.

### The test: a third joint step down, on N4's seven households

`scripts/third-step.mjs` and `scripts/third-step.diff`:
- **The option:** `tiersBelow`, two lines beside `tiersAbove`. Under a High Risk plan it adds Medium/Low as the third
  step.
- **Its identity:** with the option unset, the copy gives the candidate's tables and run hash for hash (`scripts/twin.mjs`).
- **The run:** e3pcls off, because the pin is stale on an edited copy. e3pcls's own test holds its tables bit for bit
  either way.
- **The comparison:** paired against the candidate's run on the same 3,000 paths. For S370, S224, S248 and S330 the
  candidate's run is the menu-gap run's own; for S380, S362 and S002 it is solved in the same process, with e3pcls off.
- **The read:** `scripts/third-step-read.mjs`, by N4's bar as `n4-menu.mjs` reads it.

| household | survival: the candidate, then with the third step | the third step less the candidate: survival (saved / lost), whole score | spending years at the new bottom step |
|---|---|---|---|
| S370 | 80.50%, 82.70% | +2.200 (se 0.351; 89 / 23), +0.987 (se 0.357) | 65.7% |
| S224 | 69.93%, 70.23% | +0.300 (se 0.224; 27 / 18), +0.146 (se 0.226) | 20.4% |
| S248 | 52.83%, 53.37% | +0.533 (se 0.231; 32 / 16), +0.140 (se 0.234) | 53.6% |
| S330 | 89.97%, 90.50% | +0.533 (se 0.176; 22 / 6), +0.316 (se 0.178) | 70.9% |
| S380 | 73.37%, 73.50% | +0.133 (se 0.189; 18 / 14), +0.107 (se 0.189) | 13.5% |
| S362 | 48.80%, 48.93% | +0.133 (se 0.163; 14 / 10), +0.132 (se 0.183) | 37.2% |
| S002 | 100.00%, 100.00% | +0.000 (0 / 0), +0.019 (se 0.004) | 13.6% |

- **The panel mean:** +0.548 survival points (se 0.081; its 95% interval +0.389 to +0.706), and +0.264 in the whole
  score (se 0.083).
- **By N4's bar:**
  - beyond the targets on S370 (survival and the whole score), S248 and S330 (survival), and the panel mean (both);
  - no household loses beyond 0.5.
  - It would pass, though this is not N4's read: one weight and 3,000 paths, not N4's two weights and 8,000.
- **Survival gains more than the whole score.** De-risking gives up growth, so the estate and the raises fall a little.
- **A fourth step (Low under a High Risk plan) adds nothing beyond the third.** S370 gains +1.800 (se 0.358; 85 / 31) and
  +0.541 in the whole score (se 0.363), against +2.200 and +0.987 with the third. It uses the new bottom step in only
  4.1% of spending years and stays on the third in 61.5%.
- **Not yet run:** the weight 0.01; HR and the third step together.

## 3. Commonly recommended moves, covered or not

Annuities are left out, at the maintainer's request.

| move | covered? |
|---|---|
| which pot to spend first (GIA, ISA, pension) | yes, the menu |
| fill the personal allowance or basic band from the pension each year | yes, the menu; finer ceilings add nothing (section 1) |
| stay under the GBP 100k taper | N4 (HR): large gains on S370 and S248 (section 1) |
| draw extra pension and re-wrap it into the ISA | yes, the menu and N4; finer re-wraps add little (S330 +0.17) |
| cut or raise spending (guardrail-like) | yes, five levels; 1% steps add nothing |
| use the CGT exemption each year | N4 (CGT) |
| phased tax-free cash | yes, every draw takes its 25% |
| de-risk in retirement | two steps down only; the bottom binds (section 2) |
| asset location (equities in the ISA, bonds in the pension) | no: the joint step; separate tiers tested only in the tables, in September |
| de-risk the GIA | no: M15 failed and M15 v2 never ran |
| Bed & ISA (move the GIA into the ISA, GBP 20k a year) | partly: N4's CGT sale moves its proceeds into the ISA, but only as much as the exemption allows; the app stages it only for a deposit given an ISA target |
| take the full 25% tax-free lump sum at once | not a solver choice (the plan's setting); the app's search tries both |
| route an inheritance to the ISA first | not a solver choice; the app's search has "Windfall to ISA". On the panel's four inherited deposits it changes only the first year's placement: S370 GBP 3,600 to the pension becomes GBP 20,000 to the ISA, S330 GBP 53,710 to the pension becomes GBP 13,105 to the ISA, and no later transfers either way (`scripts/routing.mjs`) |
| pension contributions after retirement (GBP 3,600 gross a year, to 75) | no: contributions only while working; worth most to low spenders whose draws are tax-free (S362, S002) |
| defer the State Pension (5.8% more a year deferred) | no |
| realise losses against gains | no: the engine never realises a loss |
| a cash bucket that is not refilled after a fall | no: the buffer is refilled every year |
| pensions in the estate from April 2027 | an input (the library's death-tax rate is 0), not a move |

## 4. What to do

1. **N4:** reads as planned. No finer-ceiling or finer-level test is needed after it.
2. **The tier menu, before Phase 4 registers:**
   - **What to run:** a third joint step down as a research option, through V4's ensemble on V3's households at both
     weights, as N4 runs its kinds, and with HR as a factorial (D6). A fourth step is not needed (section 2).
   - **The build:**
     - the option, as a two-line change (`scripts/third-step.diff`);
     - the engine executing the new tier by name (F2a's fix);
     - its test and plants;
     - the bridge reader's reference, which takes the menu's tiers.
   - **The cost:** the menu grows from 360 moves to 480, and the tier state from three layers to four. The solve cost
     needs measuring like for like: this check ran with e3pcls off.
   - **To read alongside it:** separate pension and ISA tiers in simulation (Phase 6's 'pairs').
3. **Phase 4's fairness:** run the solver on the plan variant the app's strategy search picks for each household (its
   lump-sum choice and its deposit policy). Otherwise the app has moves the solver cannot make.
4. **Later builds, each its own test:**
   - the GIA ladder (M15 v2);
   - pension contributions after retirement;
   - State Pension deferral;
   - loss harvesting.

## How to rerun

From the root of a copy of the code at eb8709d with the engine built. `third-step.mjs` runs on a copy with
`scripts/third-step.diff` applied.

    OUT=S370.json node <review>/scripts/menu-gap.mjs S370 0.02 1000 3000
    node <review>/scripts/menu-gap-read.mjs S370.json
    BASEJSON=S370.json OUT=step3-S370.json node <review>/scripts/third-step.mjs S370 0.02 3000 3
    node <review>/scripts/third-step-read.mjs step3-*.json
    node <review>/scripts/routing.mjs S370 S330 S362 S002

On one core:
- `menu-gap.mjs`: about 45 minutes a household;
- `third-step.mjs`: about 20 minutes a household with `BASEJSON`, about 35 without (it solves the candidate too).
