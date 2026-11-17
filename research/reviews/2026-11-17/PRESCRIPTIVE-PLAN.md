# The prescriptive plan for the household plan, 17 Nov

What the agent on `claude/project-access-i58m0x` builds, tests and runs, in order, with the names to use, the checks to
pass, the rule each read is made by, and the time each step gets. It follows from `ANSWERS.md` beside it and ends with
the prompt to send.

It leaves the agent no choice of design. Where a step could be done two ways, one is given. Where a step turns on
something not yet known, the plan says what to measure and what each result means. The agent's judgment is asked for
in one kind of place only: a STOP, where it reports and waits.

Everything in it is EXPLORATORY and changes no default, no gate and nothing in the candidate. The ruling is the
maintainer's own message: the prompt carries each ruling as I would give it, so change any line you rule differently
before sending. D114 stopped the household line with its lead test unrun; the prompt restarts it.

**Tried before it was prescribed** (`results-onetable-smoke.txt`, a smoke at 6 points on three units, 60 paths each):
design A as built takes the same path on a household table solved with the tie-break above the cap on as on one solved
with it off, so one household table serves every arm; and one helper gives the household plan a capital gains band of
£75,400 while the couple's model keeps £37,700 and the engine's default is as it was.

## What is asked of the maintainer

| | The question | What I would do |
|---|---|---|
| M1 | When the household plan keeps more paths and delivers no less spending, is a smaller pot left a harm? | No. Record the pot, counted up to the cap and in pounds, beside the spending and survival it comes with, and do not make today's default's pot a bar. Today's default forecasts `43.0%` where `89.3%` survive on S147-db; its pot is what that misreading leaves. If you want couples to leave more, that is the estate aim, measured on singles and couples alike. **If you rule yes instead,** change line 1 of the prompt to: "the pot counted up to the cap is a bar: pooled not lower by more than 0.1%, no unit by more than 0.5%". The pilot says the household arm then fails on about eight units in twelve. |
| M2 | Restart the household line (D114), with the lead test amended as step 4 sets out? | Yes. About 3 hours on four cores. |
| M3 | Which form of the household's move decides the lead test? | The move taken from the single solver's own chooser, its tie-break above the cap on, at the best of five splits (HS5). Design A as built runs beside it and decides nothing. |
| M4 | The capital gains band: mended in research code, or in the engine? | In research code. An engine edit moves the code stamp (`code-id.mjs` hashes `research/engine.mjs`), and the lead test's K2 is held to JOINT-WIDE's units at `603eeb595679`. |
| M5 | D111 (3)'s speed work on LOOKHOLD? | Held until step 4 reads. |
| M6 | Build design B? | No. Step 6 names the evidence that would call for an axis, and it comes back to you first. |
| M7 | A panel of the shapes the library lacks, after the lead test (step 5)? | Yes. |

## The order on one screen

| step | what | passes when | box | comes back to the maintainer |
|---|---|---|---|---|
| 1 | The household's move from the single's chooser, in `household.mjs` | the review's arrays reproduced on three units; four new checks, each failing on its plant | 3 hours | a path that differs and is not explained |
| 2 | The household plan's capital gains band, in `household.mjs` | four checks | 1 hour | - |
| 3 | The twin in `household.test.mjs`; `biasesOf` records five things; two traces | the twin's bars; each plant fails | half a day | a twin outside its bars, cause not found in 2 hours |
| 4 | The lead test, amended: four arms, 28 units, seed 7002 | its rule, dated before launch; K2 equal to JOINT-WIDE's byte for byte | half a day to build, 3 to 4 hours to run, half a day to read | always: the read |
| 5 | Twenty-eight units of shapes the library lacks | its rule, committed first | a day to build and land, 4 hours to run, half a day to read | always: the read |
| 6 | Whether an axis is needed | - | - | a design note, only if steps 4 or 5 show the evidence |
| 7 | What the household plan refuses | a note | 2 hours | the note |
| 8 | A registered test | - | - | waits for the maintainer's word |

## Step 1. The household's move from the single's chooser

**Do this before step 2,** so the check against the review is on the plan as the review ran it.

**In `research/solver/household.mjs`, add; change nothing that is there:**

1. `chooseHouseholdSingle(cp, state, t)`. It returns a joint move of the same shape `chooseHousehold` returns.
   - The position: `vecOf(cp.H.m, mergedState(cp, state))`.
   - The tiers held: `state.tierHeld.self` (`{ pen, isa }`, each 0 where absent) where the table's menu has tiers (the
     file's own `tiered(H)`), else `null`.
   - The move: `ai = chooseAction(cp.H, position, t, held)` (`src/solver/solve.js`), as `bridge.js` `tablePolicy` asks.
   - Both people take `cp.H.actions[ai]`: its `steps`, `costSteps`, `harvest`, `harvestCeil`, tier pair and tier names,
     `lump`, `sweepIsa`; `sweepCash: true`; `contrib: null`; `switchCost: cp.switchCost`; `ia` and `ib` both `ai`. The
     level is `cp.H.levelOf[ai]` where the table has `levelOf`, else the move's `spendLevel`, else 1.
   - The split, by `cp.split`:
     - `'even'`: 0.5. No step, no table read.
     - `'best5'`: try 0.5, then 0, 0.25, 0.75, 1, in that order. For each: `M.cloneState(state)`, `M.step(m, st, joint,
       t, null, true)`; skip it if `row.unmetDemand > 1 || row.preNmpaInsolvent`; value it by `householdValue(cp, st,
       t, null, ai)`, or in the plan's last year by the pots' sum. Keep 0.5 unless another scores more than `1e-9`
       above the best so far. If none funds the year, 0.5.
   - No `rankFor`, no `tiePick`, no `lookPick`, no hold.
2. `householdSinglePolicy(cp)`, `withHouseholdSingle(plan, cp)` and `runHouseholdSinglePolicy(cp, zs)`: as
   `householdPolicy`, `withHousehold` and `runHouseholdPolicy` are, calling `chooseHouseholdSingle`.
3. `HOUSE.plant` gains three names: `'partnersecond'` (the partner takes the table's second-ranked move),
   `'tiezero'` (the splits tried in the order 0, 0.25, 0.5, 0.75, 1, the first best kept), `'notiebreak'`
   (`chooseAction` called on a copy of the table with `tieAboveCap` 0).

**The household table, from here on,** is solved once a unit by `solveForApp(E, M, plan, { points, ageWith, research:
{ ...light } })`: the candidate as it stands (`17ff82379838`), its tie-break above the cap left on. Not `tieAboveCap:
undefined`, which stays for the two people's tables (`af001697ce1b`). Every household arm reads that one table.
`audit-household.mjs`'s settings check holds the household table's line to the first person's line with the tie-break
the one difference.

**The check against the review** (`units/` here; seed 99003, 1,500 paths, 45 points; each unit solved as
`audit-household.mjs` solves it and run by `runPath` at arm A's MPAA ages, as `scripts/pilot-extra.mjs` does):

| unit | arm here | the review's arrays | must equal |
|---|---|---|---|
| S327F, S227-90, S147-db | `split: 'even'` | `units/pilot-extra-99003-45/<unit>.json.gz`, `arms.HT0` | `survived` path for path; `wealth`, `tax`, `delivered` to the pound |
| S327F, S227-90, S147-db | design A as built (`chooseHousehold`, top 3) on the one table | `units/pilot-99003-45/<unit>.json.gz`, `arms.HOUSE` | the same |

The review's survival on those: `95.80%`, `95.87%`, `99.40%` (HT0) and `95.80%`, `95.87%`, `99.27%` (HOUSE). A path that
differs and is not explained in the 3 hours is a STOP. `split: 'best5'` is not held to the review's HT5, which kept the
first best split in the order 0 to 1 and took the even split in the plan's last year; print how many paths differ
from it.

**Four checks in `research/tests/household.test.mjs`,** at check 4's settings (6 points, the light lattice), on 20
paths of seed 99002, each shown failing on its plant once:

| check | unit | plant |
|---|---|---|
| both people take the chooser's move at every decision | S061-dbpart | `'partnersecond'` |
| the engine under `householdSinglePolicy` and `runHouseholdSinglePolicy` agree on every path | S061-dbpart | (check 4's own form; no new plant) |
| the move is `chooseAction`'s on the table as solved, and over the 20 paths it differs from `chooseAction`'s on a copy with `tieAboveCap` 0 at 100 decisions or more, every one of them with the household above `cp.H.estateCap` | S327F | `'notiebreak'` |
| `split: 'best5'` returns 0.5 at every decision where no other split scores more than `1e-9` above the even one, and that is 600 decisions or more of the 700 before the last year | S061-dbpart | `'tiezero'` |

Both counts are from `results-tiebreak-count.txt`, at those settings:
- the third check is on S327F because the tie-break has nothing to do on S061-dbpart: there the household is above its
  cap at 7 of 720 decisions and the pick never changes; on S327F it is above at 450 of 1,220 and the pick changes at
  342, never at or below the cap;
- on S061-dbpart no split scores more than `1e-9` above the even one at 674 of the 700 decisions before the last year,
  and a rule that keeps the first best in the order 0 to 1 takes another split at 668 of them. The household table
  reads the two people's money added, so who draws rarely changes what it reads. That is also what the review's HT5
  did: it took split 0 at most decisions, so it is another arm than HS5.

**Record in the audit, deciding nothing:** the decisions at which `s[0] + s[1] + s[2] > 2 * cp.H.g.axes.W.hi`, and of
those how many take a wrapper to a less risky tier than it holds. Print both counts for each unit.

**Time box:** 3 hours.

## Step 2. The capital gains band

**In `research/solver/household.mjs`:**

1. `twoBands(E, fn)`: `const old = E.DEFAULT_CONFIG.basicBandLimit; E.DEFAULT_CONFIG.basicBandLimit = 2 * old; try {
   return fn(); } finally { E.DEFAULT_CONFIG.basicBandLimit = old; }`. It throws if called while another call of it is
   running.
2. `solveHousehold` wraps its one call of `opts.solveOne(hp, ...)` in `twoBands`. After it, throw unless
   `Math.abs(H.m.ctx.P.cgtBandWidth - 2 * m0.ctx.P.cgtBandWidth) < 1e-6` and unless the model it prepares next
   (`m`) carries `m0`'s band.
3. `householdContext(E, hp)`: `twoBands(E, () => E.buildContext(hp))`. Every `E.buildContext` or `M.prepare` of a
   household plan in `household.test.mjs` and `audit-household.mjs` goes through it or through `twoBands`.
4. `HOUSE.plant` gains `'cgtband'`: `twoBands` calls `fn` without changing the default.

Nothing under `src/` and not `research/engine.mjs` is edited.

**Four checks in `household.test.mjs`:**

| check | plant |
|---|---|
| on the six fidelity units, the household plan's `P.cgtBandWidth` is twice a person's in the couple's model | `'cgtband'` |
| `E.DEFAULT_CONFIG.basicBandLimit` is the same before and after `solveHousehold` and `householdContext` | a `twoBands` without its `finally`, on a throwing `fn` |
| a couple's `M.prepare` and `E.buildContext`, called after `solveHousehold`, carry a person's band | (the same plant) |
| `code-id.mjs` prints `603eeb595679` | - |

**Time box:** 1 hour.

## Step 3. The twin, the biases recorded, and two traces

**A new check in `household.test.mjs`: the twin.** For each of check 3's six units, the couple made of the first person
twice, built as `scripts/twin-trace.mjs` builds it: the partner given the first person's `currentAge`, `retireAge`,
`salary`, `salaryGrowth`, `employment`, `cgtGainsUsed`, `cfBroughtForward`, `mpaaAge` and `statePension`; the partner's
accounts replaced by copies of the first person's; the first person's other incomes copied to the partner; each one-off
deposit of the first person's halved, one half to each. Under arm A's policy, as check 3, on 100 paths of seed 99001,
the household plan (through `householdContext`) against the couple.

**Its bars** (the review's figures on seed 99002: `results-twin-trace.txt` before step 2's mend,
`results-twin-trace-mended.txt` after):

| twin | capital gains tax over the plan, the household plan and the couple, before the mend | after it | the largest gap in end wealth on a path, before and after |
|---|---|---|---|
| S205 | `£2` and `£2` | the same | `£0` and `£0` |
| S061-dbpart | `£0` and `£1` | the same | `£158` and `£158` (one path, its last year) |
| S327F | `£40,494` and `£38,079` | `£37,982` and `£38,079` | `£43,806` and `£3,856` |
| S227-90 | `£126,479` and `£108,498` | `£108,037` and `£108,498` | `£352,171` and `£21,682` |
| S023-db | `£1,975` and `£1,607` | `£1,569` and `£1,607` | `£5,940` and `£787` |
| S149 | `£370` and `£443` | the same | `£40,352` and `£40,352` |

1. On S205, S061-dbpart, S327F, S227-90 and S023-db: the household plan's mean capital gains tax over the plan within 3%
   of the couple's, or within £50 where that is more; its mean income tax (with the tax on interest and dividends)
   within 0.1%.
2. On S205: every wrapper within a pound in every plan year on every path.
3. S149 is printed and not held to a bar until trace 2 below is done.
4. Plants: `'cgtband'` (fails bar 1 on S327F, S227-90 and S023-db); `'singleband'` (fails bar 1).
5. If seed 99001 puts a twin outside a bar the review's seed did not, print the figure and STOP. Do not move the bar.

**Check 3 stays as it is,** with one addition: it prints each unit's mean lifetime tax, the household plan's less the
couple's. Its comment names the two differences that are expected and why: S061-dbpart, the partner's DB pension taxed
against the first person's spare allowance (`-£23,637` on the review's seed); S227-90, arm A's bracket-fill rule filling
two bands (`+£88,329`). Its bars are not changed.

**`biasesOf` in `audit-household.mjs` returns five things,** the last three as `scripts/bias-table.mjs` computes them:

| field | what |
|---|---|
| `lockedYears`, `lockedAt` | as now |
| `penShareSelf` | as now |
| `incomeTaxLeftOut` | `{ aYear, overPlan, shareOfSpending }`: the two people's guaranteed incomes (state pensions, taxable other incomes) taxed each on its owner's bands, less the same taxed together on the household plan's |
| `oneOffOwned` | the one-off deposits owned by one person: `[{ owner, amount, year }]` |
| `cgtBand` | `{ household, twoPeople }` |

A unit's biases are **nil** when `lockedYears` is 0, `penShareSelf` is between 0.25 and 0.75, `incomeTaxLeftOut.aYear`
is under £100, `oneOffOwned` is empty, and `cgtBand.household` equals `cgtBand.twoPeople`.

**Two traces, one hour each. Report what is found; mend nothing in the engine.**

1. **Why twins part once the band is right.** In the couple the twins hold or draw unequal amounts in `89.3%` to
   `94.1%` of path-years. Find the step of the couple's year that treats the first person first (the candidates: the
   one-off cost, the capital gains bill's settlement, the order in which each covers the other's shortfall, the cash
   buffer's top-up). Name it in the twin check's comment.
2. **S149's twin.** It first parts in plan year 3, the year of its one-off cost, on `taxPaid`, `dividendTax`,
   `netGuaranteed`, `netDrawdown` and `targetSpend`. Find which figure parts first within that year and why. If the cause
   is in `householdPlanFor`, mend it and hold S149 to bar 1. If it is arm A's rule, name S149 in the check as the one
   exception, with its size.

**Time box:** half a day.

## Step 4. The lead test, amended

**Amend `HOUSEHOLD.md` section 5** with a dated amendment, committed before the launch and before any unit runs,
saying exactly what follows. The "nearest exact" clause and its earlier amendment are withdrawn by it.

**Arms.** Each unit's two tables are solved as now. Its household table is solved once, as step 1 says, through step
2's `twoBands`. Every arm runs on the same 4,000 paths of seed 7002, each held to `E.runTrial` on its first 200.

| arm | what | role |
|---|---|---|
| `K2` | the couples' default, as written | the base. Its arrays must equal JOINT-WIDE's K2 byte for byte on every unit: a difference is a STOP |
| `HOUSE` | `chooseHousehold` on the household table: its top three moves, five splits, `tieJoint`, `holdPast` | beside the rule |
| `HS5` | `chooseHouseholdSingle`, `split: 'best5'` | **decides** |
| `HS1` | `chooseHouseholdSingle`, `split: 'even'` | decides only whether the split's search stays |

The order of the arms on unit `k` is `ARMS` rotated by `k % 4`.

**Recorded for each unit,** beside what is recorded now:

1. on the first 300 paths, for `K2` and `HS5`, at every decision: the spending level taken, and the risk held coming
   into it, as `scripts/why-pot.mjs` records them; stored by third of the spending years;
2. `biasesOf`'s five things;
3. step 1's two counts;
4. the household's estate cap (as now) and the household table's opening forecast (as now).

**`reduce-household.mjs` prints,** in this order, with a planted check for each rule part:

| part | what, `HS5` less `K2`, paired by path, on `stats.mjs` `survivalChange` | holds when |
|---|---|---|
| 1 | pooled survival over the 28 units | the interval's lower end is above 0 |
| 2 | survival by unit | no unit's interval lies wholly below `-0.3` points |
| 3 | pooled spending delivered on the paths both arms keep, as a percentage of K2's | not lower by more than `0.05%` |
| 4 | the pot counted up to the cap, pooled and by unit, as a percentage and in pounds a path, beside spending in pounds a path | recorded; not a bar (M1) |
| 5 | pooled lifetime tax, `HS5` against `HOUSE` | `HS5`'s is lower |
| 6 | by unit, the household table's opening forecast less `HS5`'s survival | within 2 points; a unit outside is named and does not change the outcome |

Beside the parts, deciding nothing: spending delivered over every path; pooled survival without its largest unit; each
arm's lifetime tax and pot left on the paths that end above the cap under `K2` and the arm, and on those that end at or
below it under both and are kept by both (`scripts/above-cap.mjs`); step 1's counts; the record of part 1 above, `K2`
beside `HS5`, by third; `HOUSE` less `K2` on parts 1 to 4; each arm's solve seconds and CPU a path against `K2`'s.

**Outcomes, printed by the reducer:**

| outcome | when | then |
|---|---|---|
| `STOP` | `K2` differs from JOINT-WIDE's on any path; or part 5 fails | report; nothing else is read |
| `A LEAD` | parts 1, 2 and 3 hold | the read to the maintainer; step 5 |
| `A LEAD, WITH A UNIT TO PLACE` | parts 1 and 3 hold; part 2 fails only on units whose biases are not nil | the same, each such unit printed with its biases and its failing years; step 6 reads them |
| `NO LEAD` | part 1 fails; or part 3 fails; or part 2 fails on a unit whose biases are nil | the read to the maintainer; nothing further |

**The split's search,** `HS1` less `HS5`, printed after the outcome. `THE SEARCH GOES` when all four hold: pooled
survival's interval reaches 0 or above; no unit's interval lies wholly below `-0.3`; pooled spending on the paths both
keep is not lower by more than `0.05%`; pooled lifetime tax is not higher by more than `1%`. Otherwise `THE SEARCH STAYS`.

**The reducer's planted checks,** each a changed copy of a unit's arrays:

1. a unit with nil biases put 1 point below K2: `NO LEAD`;
2. the same unit given a one-off deposit owned by one person: `A LEAD, WITH A UNIT TO PLACE`;
3. spending on the kept paths `0.06%` lower with spending over every path higher: part 3 fails;
4. `HS5`'s tax made higher than `HOUSE`'s: `STOP`;
5. a forecast 3 points from its arm: the unit named, the outcome unchanged;
6. `HS1` put 1 point below `HS5` on one unit: `THE SEARCH STAYS`;
7. one path of `K2` changed: `STOP`.

**Files.** `audit-household.mjs`, `reduce-household.mjs`, `batch-household.sh` (changed); `results/household-7002/`;
`results-household.txt` (the reducer's output whole); `reports/<the read's date>-household-read.md`. Chunks of 1,000
paths, resumable, as now.

**Before the launch:** the fast suite; `household.test.mjs` ALL PASS; the reducer's planted checks ALL PASS; a smoke of
two units at 6 points and 30 paths read through the gate, no figure printed.

**The read.** Once, by the reducer. The reviewer at the read. In the write-up: every cause with the decomposition that
shows it, or no cause; every pooled figure with and without its largest unit.

**What the pilot leads you to expect** (other seeds, twelve units, 1,500 paths): pooled survival about `+1.7`, about
`+1.0` without S147-db; the pot counted up to the cap lower by 1.5% to 13% on about two units in three; `HS1`'s path at
`x0.29` to `x0.44` of `K2`'s and `HS5`'s at `x0.42` to `x0.60`. A read far from that is checked for a fault before it is
written up.

**Size:** about 12 core-hours (`K2` about 130 ms a path, `HOUSE` 110, `HS5` 70, `HS1` 50, on 112,000 paths; one couple's
solve and one household solve a unit).

**Time box:** half a day to build and smoke; 3 to 4 hours to run; half a day to read.

## Step 5. The shapes the library lacks

All 210 of the library's couples are three years apart, retire at one age, and have the first person holding more
(`results-coverage.txt`).

**Commit `research/solver/SHAPES.md` first,** saying exactly what follows.

**Units: 28.** Four bases, each as its panel holds it: S149, S337F, S147-db, S061-dbpart. Seven shapes of each, named
`<base>@<shape>`:

| shape | the one change to the base's plan |
|---|---|
| `even` | `currentAgePart` set to `currentAgeSelf` |
| `gap8` | `currentAgePart` set to `currentAgeSelf - 8` |
| `gap12` | `currentAgePart` set to `currentAgeSelf - 12` |
| `elder2nd` | `currentAgeSelf` and `currentAgePart` exchanged, so the first person is the younger |
| `part60` | every wrapper re-held so the first person holds 40% of its total (`share-rules-panel.mjs` `reheldAt`) |
| `penB90` | the two pensions' balances and contributions re-held so the first person holds 10% of each total; the other wrappers as they are |
| `penA100` | the partner's pension balance and contribution added to the first person's and set to nil |

- **Landed:** each unit's target by `phase4-panel.mjs` `landTarget`, as the share rules' panel landed its variants
  (arm A, searched anew at each target, 85% within a point on 1,000 paths of seed 7005). A unit that does not land is
  printed and left out.
- **A unit `householdPlanFor` refuses** is printed with its message and left out. The plan is not changed to take it.
- **`elder2nd`:** the couple is handed to both solvers as its mirror, `src/coupleOrder.js` `otherOrder(E, plan)`, as the
  app hands such a couple to the solver (D104). Every figure the rule reads is the household's (survival, spending,
  the pot, tax), so nothing is mirrored back.

**Arms,** on the same 4,000 paths of seed 7002:

| arm | what |
|---|---|
| `APP` | arm A, the app's rules |
| `K2` | the couples' default, solved by `solveCouple` whatever the guard says of the couple |
| `HS` | `HS5` if step 4 printed `THE SEARCH STAYS`, `HS1` if it printed `THE SEARCH GOES` |
| `CEIL` | the household table on the household's own single plan: `E.buildContext(withTable(cp.hplan, cp.H))` inside `twoBands` |

**The rule,** `HS` less `K2`: step 4's parts 1, 2, 3 and 6, pooled over the units that ran and by shape. Beside them,
for every unit: `CEIL` less `HS` in survival, paired by path; and `HS` less `APP`.

| outcome | when |
|---|---|
| `HOLDS ON EVERY SHAPE` | parts 1 and 3 hold pooled; no unit's interval lies wholly below `-0.3`; no shape's units average more than 1 point of `CEIL` less `HS` |
| `A SHAPE TO PLACE` | parts 1 and 3 hold pooled; a unit lies below the bar, or a shape averages more than 1 point of `CEIL` less `HS` | 
| `DOES NOT HOLD` | part 1 or part 3 fails pooled |

**Files:** `SHAPES.md`, `shapes-panel.mjs` (the units and their landing), `audit-shapes.mjs`, `reduce-shapes.mjs` with
its planted checks, `batch-shapes.sh`, `results-shapes.txt`.

**Time box:** a day to build and land; 4 hours to run; half a day to read.

## Step 6. Whether an axis is needed

Nothing is built. If step 4 printed `A LEAD, WITH A UNIT TO PLACE` or step 5 printed `A SHAPE TO PLACE`, write
`research/solver/AXIS.md`, one page, and send it:

1. the units or shapes, with their biases and `CEIL` less `HS`;
2. the design: the smaller pension's share of the two as an axis of three points (0, the plan's opening share, 0.5),
   carried from the household's first retirement to the younger person's state pension age and dropped at both ends
   (`ANSWERS.md` section 3);
3. how its year is held to the couple's exact year;
4. its cost in table size on those units.

Then stop. If neither was printed, write nothing: designs B and C are closed by the two reads, and say so in STATE.md.

## Step 7. What the household plan refuses

Write `research/solver/REFUSALS.md`, half a page, and send it. For each thing `householdPlanFor` throws on (two people's
accounts of one wrapper at different risks; contributions growing at different rates; salaries growing at different
rates; a cash ISA subscription; a later retiree paid or saving in plan year 0; the partner's own limits): what a plan of
that kind looks like, and whether the household plan could take it and how. Build nothing.

**Time box:** 2 hours.

## Step 8. The registered test

Not started. It waits for the maintainer's word after steps 4 and 5 have read.

## What not to do

- Tune the share, or test another fixed share rule.
- Port a wider joint move for the two tables.
- Build design B, or an axis.
- Edit anything under `src/`, or `research/engine.mjs`, for steps 1 to 7.
- Read `HOUSE`'s path time as the design's.
- Give a cause for a figure without the decomposition that shows it.
- Move a bar after a figure is seen.

## The prompt for the agent

It carries M1 to M7 as I would answer them. Change any line you rule differently before sending.

```
The household line restarts (D114 ends). On claude/project-access-i58m0x, fetch review/external-2026-10-21 and read,
at its head, research/reviews/2026-11-17/PRESCRIPTIVE-PLAN.md whole, then ANSWERS.md and README.md beside it. Do
what PRESCRIPTIVE-PLAN.md says, in its order, with its names, its checks, its rules and its time boxes. Where it gives
one way, take that way. If you find a reason it cannot be done as written, stop and tell me; do not substitute.
Everything is EXPLORATORY and changes no default, no gate and nothing in the candidate. Record each ruling below as its
own D-line. Nothing under src/ and not research/engine.mjs is edited: the solver's code id stays 603eeb595679.

1. The pot (M1): where the household plan keeps more paths and delivers no less spending, a smaller pot left is not a
   harm. It is recorded, counted up to the cap and in pounds a path beside the spending, and is not a bar.
2. Step 1, then step 2, then step 3, each in its own commit with its checks shown failing on their plants. Step 1's
   check against the review's arrays comes before step 2. A path that differs and is not explained is a STOP.
3. Step 4: the amendment to HOUSEHOLD.md section 5 committed first, as the plan words it. HS5 decides. Then the smoke,
   then the launch on the 28 units, seed 7002, 4,000 paths. Read it once by the reducer, the reviewer at the read,
   and send me results-household.txt whole with the report.
4. D111 (3)'s speed work on LOOKHOLD stays held until step 4 reads.
5. Step 5 follows step 4 without waiting for me if step 4 prints A LEAD or A LEAD, WITH A UNIT TO PLACE. If it prints
   NO LEAD or STOP, stop there. Send me results-shapes.txt whole with the report.
6. Step 6: AXIS.md only if a read printed the outcome that calls for it. Nothing is built.
7. Step 7: REFUSALS.md, after step 5. Nothing is built.
8. Step 8 is not started.

No held-out seed is read, printed or estimated. Stop at each STOP the plan names. When a time box runs out, stop and
report what is done and what is not.
```
