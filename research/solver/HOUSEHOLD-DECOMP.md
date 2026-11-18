# Why the household plan loses on three couples: the decomposition (D129 (1); EXPLORATORY)

Written 18 Nov (evening), and committed before any unit runs. The maintainer's ruling: "Go ahead" on the agent's first
recommendation after D128 (D129 (1)): run the household plan again on the lead test's three units to place, undoing each
of its two simplifications in turn. EXPLORATORY on the tuning seed: it changes no default, no gate and nothing in the
candidate, and nothing under `src/` or `research/engine.mjs` is edited (the solver's code id stays 603eeb595679).

## The question

The lead test (`results-household.txt`, step 4) printed three units wholly below its bar: S191-90 (`-20.725` points,
829 paths lost, none saved), S333F (`-1.000`; 51 lost, 11 saved) and S335F (`-1.500`; 70 lost, 10 saved). On each, the
household table on its own plan (CEIL) does better than its move on the couple (`AXIS.md`), so what is lost lies between
the household plan and the couple. The household plan simplifies the couple in two ways that could cost money it does not
see:
- **the bands:** one pair of income-tax bands, doubled, where each person has their own. A household whose taxable income
  falls mostly on one person (S191-90's first person holds 90% of the pensions) pays more than the doubled bands price;
- **the cap:** one tax-free cash cap, doubled, where each person has their own on their own pension. On S333F and S335F
  the first person ends at their own cap on 50 of 51 and 67 of 70 lost paths (an association, `AXIS.md`).

Does each unit's loss rest on either, both or neither?

## Units, paths and settings

- **Units:** S191-90, S333F and S335F, at their landed targets, each plan as the lead test solves it
  (`audit-household.mjs` `unitPlans`: arm A's policy on the plan prepared for the solver, arm A's MPAA ages).
- **Paths:** the lead test's: the same `4,000` paths of seed 7002, `45` points, estate weight `0.02`. One process a unit.

## Arms

Run by the couple's engine on every path:
- **K2:** today's couples' default, as the lead test ran it (`couple.js` `solveCouple`, the pots' share, LOOKHOLD).
- **HS:** the household plan as built, its move from the single solver's own chooser at the even split
  (`household.mjs` `chooseHouseholdSingle`, `'even'`): the lead test's HS1.
- **HSB:** HS with the household plan's income-tax bands at one person's (`householdPlanFor`'s `opts.single`
  `['bands']`: the personal allowance, the taper's threshold, and the UK and Scottish band limits). The table is then
  solved outside `twoBands`, so its band for capital gains is one person's too. Every other allowance stays doubled.
- **HSC:** HS with the tax-free cash cap at one person's (`['cap']`: `pclsMaxCap`).
- **HSBC:** both (`['bands', 'cap']`).

Each household arm reads its own household table, solved as the lead test's was: `solveForApp` at the candidate as it
stands, with its tie-break above the estate cap on. Only the plan the table is solved on differs. The move is executed
on the couple exactly as in HS: a variant changes which move the household plan picks, never how a move is carried out.

**Why the even split, not HS5:** the lead test dropped the split's search (THE SEARCH GOES), and step 5 ran HS at the
even split. On these three units HS1 is within `0.075` points of HS5 (S191-90 `76.83%` and `76.90%`, S333F `91.70%` and
`91.72%`, S335F `92.92%` and `92.95%`), so HS1's loss is HS5's to within that.

**Beside, deciding nothing:** each household table on its own plan (CEIL, CEILB, CEILC, CEILBC: `bridge.js`
`withTable` on the household plan, run by the engine as a single's plan), as `household-ceil-check.mjs` runs CEIL.

## Checks before any figure is read (a failure is a STOP, reported, nothing read)

1. On each unit, K2's two tables and HS's household table have the lead test's digests, and K2's and HS's arrays are
   the lead test's (`results/household-7002/<unit>.json.gz`) byte for byte on every path.
2. Each variant's household plan leaves exactly its group single and every other doubled entry as design A's
   (`householdPlanFor`; `household.test.mjs` group 9 in the code). Its table carries one person's capital gains band
   with the bands single, and two people's otherwise.
3. Each household table passes the lead test's settings check (`houseLineProblems`, `wantProblems`).
4. Each arm is held to `E.runTrial` on its first `200` paths, as the lead test's was.
5. The reducer's fair-test gate: one code id, one audit stamp, seed 7002, `4,000` paths and `45` points on every unit.

## The measures

On each unit:
- **The loss, L:** the paths K2 keeps and HS loses (the lead test's count: S191-90 829, S333F 51, S335F 70).
- **A variant's recovery:** the paths of L it keeps, less the paths HS keeps that it loses (the share replay's form,
  `SHARE-REPLAY.md`), as a share of L.
- **Beyond noise:** the variant less HS, paired by path, its exact interval (`stats.mjs` `survivalChange`) wholly above
  nought.

A variant **recovers the loss** where its recovery is half of L or more and it is beyond noise.

## The rule

On each unit, the first of these that holds:
1. **RESTS ON THE BANDS:** HSB recovers the loss and HSC does not.
2. **RESTS ON THE CAP:** HSC recovers the loss and HSB does not.
3. **EITHER:** HSB and HSC each recover the loss.
4. **TOGETHER:** neither alone does, and HSBC does.
5. **NOT THESE TWO:** HSBC does not recover the loss.

**Beside, deciding nothing:**
- each arm's survival, and each variant less HS and less K2;
- each arm's lost paths by kind: at the minimum pot at the end, or a year unfunded;
- spending delivered on the paths both keep, each variant against HS and against K2;
- the end pot and the capped pot;
- lifetime tax;
- each household table's opening forecast;
- CEIL less HS for each table (how much of the gap each simplification closes);
- the three units pooled.

S333F's and S335F's losses are small (51 and 70 paths), so their outcomes can turn on a few paths. The counts are
printed beside each.

A variant can recover survival by spending less: a table that expects more tax spends less. That is the mechanism
these variants test, not a flaw in them, but it means a recovery shows which allowance the table misprices, not a
remedy. The spending and the pot beside each variant show the price.

## What each outcome leads to

On every unit, step 8 stays held (D129 (3)) until the losses are fixed and re-checked on the couples that lose.
- **RESTS ON THE BANDS:** the remedy is in the household plan's pricing of the bands. Its next step is a design that
  prices them by what the two people can each use, written first with its form and its test. It is built off in code
  (research code alone) and read EXPLORATORY on these three units and the lead test's other 25 at seed 7002, by a rule
  committed first. Design B, the axis (`AXIS.md`), is built only if that design is the axis (D129 (2)).
- **RESTS ON THE CAP:** the same for the tax-free cash cap: each person's own cap on their own pension.
- **EITHER or TOGETHER:** one remedy for both, built and read the same way.
- **NOT THESE TWO:** neither doubled allowance is the cause. The read goes to the maintainer with the next candidate
  causes, and nothing is built.

Where the three units part, each remedy is taken for the units that call for it.

## Box

- Half a day to build, from 18 Nov 19:00 UTC: the option and its test (in), this rule, the audit, the batch and the
  reducer with its planted checks, and a smoke.
- About an hour to run, on three cores.
- Half a day to read.

The read goes to the maintainer whole, with the `reviewer` agent at the read. When the box runs out, stop and report.
