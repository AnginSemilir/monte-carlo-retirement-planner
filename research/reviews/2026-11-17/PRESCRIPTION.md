# The prescription for the household plan, 17 Nov: what to build, test and run, in order

This turns `ANSWERS.md` beside it into instructions for the agent on `claude/project-access-i58m0x`. It ends with the
prompt to send. Everything in it is EXPLORATORY and changes no default, no gate and nothing in the candidate. The ruling
is the maintainer's own message: the prompt carries each ruling as I would give it, so change any line you rule
differently before sending.

D114 stopped the household line with its lead test unrun. The prompt restarts it, so it is the ruling the agent records.

## What is asked of the maintainer

| | The question | What I would do |
|---|---|---|
| M1 | When the household plan keeps more paths and delivers no less spending, is a smaller pot left a harm? | No. Record the pot, counted up to the cap and in pounds, beside the spending and survival it comes with, and do not make today's default's pot a bar. Today's default forecasts `43.0%` where `89.3%` survive on S147-db; its pot is what that misreading leaves. If you want couples to leave more, that is the estate aim, measured on singles and couples alike. **If you rule yes instead,** part 4 of step 4's rule becomes JOINT-WIDE's (pooled not lower by more than 0.1%, no unit by more than 0.5%), and the pilot says the arm will fail it on about eight of twelve units, so the estate aim would have to be looked at before the household plan. |
| M2 | Restart the household line (D114), with the lead test amended as step 4 sets out? | Yes. About 3 hours on four cores. |
| M3 | Which form of the household's move decides the lead test? | The move taken from the single solver's own chooser, its tie-break above the cap on, at the best of five splits. Design A as built runs beside it and decides nothing. |
| M4 | The capital gains band: mended in research code only, or in the engine? | In research code for now. An engine edit moves the code stamp (`code-id.mjs` hashes `research/engine.mjs`), and the lead test's K2 is held to JOINT-WIDE's units at `603eeb595679`. The engine takes the band's width as a setting only if the household plan heads for the app. |
| M5 | D111 (3)'s speed work on LOOKHOLD? | Held, as the agent recommends, until step 4 reads. If the mended move holds, the look and the hold are no longer on a couple's path. |
| M6 | Build design B? | No. Step 6 says what evidence would call for an axis in the years the split matters, and that it comes back to you first. |
| M7 | A panel of the shapes the library lacks, after the lead test (step 5)? | Yes. A day to build and land. Neither today's default nor the household plan has been read on any of them. |

## The order on one screen

| step | what | its test | box | stops for the maintainer |
|---|---|---|---|---|
| 1 | The household's move from the single's chooser, in `household.mjs` | the review's arrays reproduced on three units; its planted checks | 3 hours | an array that differs and is not explained |
| 2 | The household plan's capital gains band put right, in research code | the band is two people's; the default put back; the couple's model untouched | 1 hour | - |
| 3 | The twin in `household.test.mjs`; `biasesOf` records five things; two things traced | each kind of tax within its bar on six twins; each plant fails | half a day | a twin outside its bars for a reason not found in 2 hours |
| 4 | The lead test, amended: four arms on the 28 units, seed 7002 | its rule below, dated before launch; K2 equal to JOINT-WIDE's byte for byte | half a day to amend and smoke, 3 to 4 hours to run, half a day to read | every outcome comes back |
| 5 | Twenty-eight units of shapes the library lacks | step 4's rule by shape, and each unit against its own table | a day to build and land, 4 hours to run, half a day to read | every outcome comes back |
| 6 | Whether an axis is needed | evidence named below; a design note first | - | the maintainer rules before anything is built |
| 7 | What the household plan refuses | a note, then two units | half a day | - |
| 8 | A registered test of what holds | its registration to the design review | - | launched only on the maintainer's word |

## Step 1. The household's move from the single's chooser

**Why.** Width buys nothing, and design A's own ranking has no working tie rule above the estate cap (`ANSWERS.md`
section 4; `results-above-cap.txt`).

**Build, in `research/solver/household.mjs`, beside `chooseHousehold`, which stays as it is:**

1. **One household table, two settings of its chooser.** The tie-break above the cap is a setting of the forward
   chooser and changes no table (D95). The lead test's audit solves with `tieAboveCap: undefined`. For the mended move
   the household table carries the candidate's own (`1e-4`). Solve once and check the two forms' table digests are
   equal; do not solve twice.
2. **The move.** `chooseAction(H, vecOf(H.m, mergedState(cp, state)), t, held)`, as `bridge.js` `tablePolicy` asks it
   for a single. `held` is the first person's tier pair where the table's menu has tiers, else null. Both people take
   that move: its steps, re-wrap and ceiling, its tiers, its level, its sweep, its lump sum.
3. **The split, two forms:**
   - **HS1:** the even split, no step and no table read.
   - **HS5:** the even split first, then 0, 0.25, 0.75 and 1; each stepped one year by the couple's exact model and
     valued by `householdValue` at the move's own layer; another split replaces the even one only if it scores more
     than `1e-9` higher, so every tie keeps the even split. The plan's last year as `chooseHousehold` scores it. A split
     that does not fund the year is skipped; if none funds it, the even split, and the year fails on its own terms.
4. **Nothing else of the couple's on the path:** no `rankFor` over several moves, no `tiePick`, no `lookPick`, no hold.
5. **Its policy for the engine,** as `householdPolicy` is, and its path in the exact model, as `runHouseholdPolicy` is.

**The check against the review, first, and before step 2's mend is in** (the review's table had the band as it is
today). On S327F, S227-90 and S147-db, solved as `audit-household.mjs` solves a unit, on
`E.pathsForSeed(99003, 1500, T)` at arm A's MPAA ages, HS1's `survived` must equal the review's `HT0` path for path,
and its `wealth`, `tax` and `delivered` to the pound (`units/pilot-extra-99003-45/<unit>.json.gz`, read as
`scripts/pilot-read.mjs` reads it; `scripts/pilot-extra.mjs` `singlePolicy` is what produced them). The review's lines:
survival `95.80%`, `95.87%` and `99.40%`. HS5 need not equal the review's `HT5`: the review took the first best split in
the order 0, 0.25, 0.5, 0.75, 1, so a tie went to 0. Report how many paths differ.

**Its tests** (`household.test.mjs`, each new check failing on its plant once):

- both people take the chooser's move, at every decision of 20 paths; plant: the partner given the table's second move;
- the engine under the policy and the exact model's path agree on every one of 20 paths (check 4's form);
- with the household above its cap, the move is the one `chooseAction` returns with the tie-break on, and by the
  household table's own year it pays no more tax that year than the move returned with the tie-break off; plant: the
  table left at `tieAboveCap: undefined`;
- HS5 with the four other splits removed is HS1, path for path; plant: a tie given to split 0.

**Record, deciding nothing:** the decisions at which the household's wealth is past twice the top of the table's wealth
axis, and of those how many step a wrapper down in risk. Today's default has the hold for that case and a single has
none. If it happens at more than one decision in a thousand, say so in the read.

**Time box:** 3 hours.

## Step 2. The capital gains band

**The defect.** `App.jsx` `taxParams` sets `cgtBandWidth` to the engine's own default basic band limit less the plan's
allowance. The household plan doubles the allowance, so it is given £25,130 where two people have £75,400
(`results-bias-table.txt`, `results-twin-trace.txt`). The fast year, the exact model and the engine all read it as
`P.cgtBandWidth`.

**The mend, in research code, changing no file under `src/` and not `research/engine.mjs`:** wherever the household
plan's context is built (its solve, and any `E.buildContext` or `M.prepare` of the household plan in a test or an
audit), the band is two people's. `scripts/pilot-extra.mjs` `solveOneC` does it by doubling `E.DEFAULT_CONFIG`'s basic
band limit for that call alone and putting it back in a `finally`. Any equivalent that touches nothing outside
`research/` will do; say which you took.

**Its checks:**
- the household plan's `P.cgtBandWidth` is twice a person's in the couple's model, on every unit;
- the engine's default is what it was before and after every such call; plant: the `finally` removed;
- the couple's model and the couple's engine context, built after it, carry a person's band (37,700 at the defaults);
- the solver's code id is still `603eeb595679`.

**What to expect.** In the pilot it moved no path's survival on five units and lifetime tax by `-0.6%` to `+0.3%`. It is
mended because it is wrong, not because it is large.

**Time box:** 1 hour.

## Step 3. The twin, the biases recorded, and two things to trace

**The twin, in `household.test.mjs`.** For each of check 3's six couples, the couple made of the first person twice: the
partner given the first person's age, retirement age, pay, employment, state pension and incomes, and a copy of each of
the first person's accounts; a one-off deposit of the first person's landing half with each (`scripts/twin-trace.mjs`
builds it). Under the app's own rules (arm A's policy, as check 3), on 100 paths of seed 99001, the household plan
against the couple.

**It is not an identity to the pound, and its bar says so** (`results-twin-trace.txt`, `results-twin-trace-mended.txt`:
seed 99002, 100 paths).

| twin | before step 2's mend: capital gains tax, the household plan against the couple | after it | the largest gap in end wealth on a path, before and after |
|---|---|---|---|
| S205 | `£2` and `£2` | the same | `£0` and `£0` |
| S061-dbpart | `£0` and `£1` | the same | `£158` and `£158` (one path, its last year) |
| S327F | `£40,494` and `£38,079` | `£37,982` and `£38,079` | `£43,806` and `£3,856` |
| S227-90 | `£126,479` and `£108,498` | `£108,037` and `£108,498` | `£352,171` and `£21,682` |
| S023-db | `£1,975` and `£1,607` | `£1,569` and `£1,607` | `£5,940` and `£787` |
| S149 | `£370` and `£443` | the same | `£40,352` and `£40,352` |

- **The bars, with step 2's mend in:** on every twin but S149, capital gains tax over the plan within 3% of the
  couple's (or £50, where that is more) and income tax (with the tax on interest and dividends) within 0.1%; on S205
  and S061-dbpart, every wrapper within a pound in every plan year on every path, bar S061-dbpart's one path. The
  review's figures after the mend are inside both: capital gains tax within 0.3%, 0.4% and 2.4% on the three that
  parted. They are on seed 99002; if seed 99001 puts a twin outside a bar, report the figure and do not move the bar.
- **Plants:** the capital gains band as it is today (6%, 17% and 23% over on S327F, S227-90 and S023-db); one allowance
  left single.
- **Two things to trace, two hours between them:**
  1. **Why twins part at all once the band is right.** In the couple the two twins hold or draw unequal amounts in
     `89.3%` to `94.1%` of path-years, S205 included, so the engine's couple year puts the first person first
     somewhere. Where one twin then realises more gains than the other, part of one person's exempt amount goes unused.
     Name the step. If the engine means it, it is design A's allowance bias in its smallest form and the bars above
     stand; say so in the test's comment.
  2. **S149's twin,** which the mend does not touch: dividend tax and the year's target, first in plan year 3, the year
     of its one-off cost; `£160` of `£34,649` of income tax over the plan, and `£40,352` of end wealth on its worst
     path. If it is the plan's construction, mend it with the test. If it is arm A's rule reading something the merge
     changes, say what, and name S149 in the test as the one exception with its size.

**Check 3 as it stands** stays, with two changes: it prints lifetime tax beside survival and wealth, and its bar on
median wealth is stated for what it is. On seed 99002 S227-90 is `-15.3%`, past the 15% bar it passed on seed 99001 by
1.4 points, because arm A's bracket-fill rule fills two bands on the merged plan (`results-fidelity.txt`). Either run
check 3 under a rule that does not read the bands, or keep the six and say which two are expected to part and why.

**`biasesOf` records five things for each unit, not two** (`scripts/bias-table.mjs` computes the three new ones):
1. the plan years one pension is open and the other locked while the household spends;
2. the first person's share of the two pensions;
3. the income tax the household plan leaves out on the two people's guaranteed incomes alone, a year once all are in
   payment, and over the plan as a share of its spending;
4. a one-off deposit owned by one person;
5. the capital gains band, the household plan's against two people's (nil after step 2).

**Time box:** half a day.

## Step 4. The lead test, amended

A dated amendment to `HOUSEHOLD.md` section 5, committed before the launch and before any unit runs. What changes:

**The arms,** each unit's two tables and its one household table (its band as step 2 leaves it) solved once, and
every arm run on the same 4,000 paths of seed 7002:
1. **K2:** as written. Its arrays must equal JOINT-WIDE's K2 byte for byte on every unit; any difference is a STOP.
2. **HOUSE:** design A as built, unchanged but for step 2's band: its top three moves, five splits, its own tie rule,
   the hold, the table's tie-break off. Beside the rule, deciding nothing. It joins this read to the handover and the
   pilot.
3. **HS5:** step 1's move at the best of five splits, the same table with its tie-break on. **The deciding arm.**
4. **HS1:** step 1's move at the even split. It decides only whether the split's search stays.

**Recorded, more than was:**
- as written: survival, the failure year, the pot left, the estate, lifetime tax, spending delivered, unmet spending;
  each arm's solve time and CPU a path; the household table's opening forecast;
- **why the pot differs:** on each unit's first 300 paths, for K2 and HS5, at every decision the spending level taken
  and the risk held coming into it (the mean real return of the tiers held, weighted by the money in them), printed
  by third of the spending years (`scripts/why-pot.mjs` is the form);
- **above and below the cap:** each arm's lifetime tax and pot left on the paths that end above the household's cap
  under K2 and under the arm, and on those that end at or below it under both and are kept by both
  (`scripts/above-cap.mjs`);
- each unit's five biases (step 3);
- step 1's count of decisions past twice the table's top.

**The rule,** HS5 less K2, paired by path, on the exact paired interval (`stats.mjs` `survivalChange`), so the read does
not wait on D112's unlock:

1. pooled survival over the 28 units: the interval's lower end above 0;
2. no unit's interval wholly below `-0.3` points;
3. pooled spending delivered **on the paths both arms keep**: not lower by more than `0.05%`. Spending over every path
   is printed beside it and decides nothing: it counts a failed path's lost spending, so it rewards survival twice;
4. **the pot, by the maintainer's ruling (M1).** As I would rule: recorded, pooled and by unit, counted up to the cap
   and in pounds a path beside the spending, and not a bar;
5. the mend works: HS5's pooled lifetime tax is lower than HOUSE's;
6. the forecast: the household table's opening forecast is within 2 points of HS5's survival on every unit. A unit
   outside is named. It does not decide the lead; it decides whether the page may show a couple that forecast.

**Outcomes:**
- **A LEAD:** parts 1, 2, 3 and 5 hold. To the maintainer with the trade in pounds by unit, the time, the forecast, and
  step 5 next.
- **NO LEAD:** part 1 fails, or part 2 fails on a unit whose five recorded biases are all nil, or part 3 fails. Back to
  the maintainer with the read.
- **A unit lost beyond the bar that carries a recorded bias** is not NO LEAD. It is reported against that bias, with
  its failing years, and goes to step 6.
- **Part 5 fails:** the tie-break is not reaching the household's move. STOP and report; it is a fault in step 1.
- **The split's search,** HS1 less HS5: it is dropped if pooled survival's interval reaches 0 or above, no unit lies
  wholly below `-0.3`, spending on the paths both keep is not lower by more than `0.05%`, and pooled lifetime tax is not
  higher by more than `1%`. Otherwise it stays.
- **The time** is HS5's and HS1's CPU a path against K2's. HOUSE's is the prototype's and is not the design's
  (`ANSWERS.md` section 6).

**The "nearest exact" clause and its amendment are withdrawn.** Four of its eight units leave out income tax on a
guaranteed income for the whole plan and five have a one-off deposit owned by one person (`results-bias-table.txt`).

**What the pilot leads you to expect** (other seeds, twelve units, 1,500 paths: a lead and no more): pooled survival
about `+1.7`, about `+1.0` without S147-db, which was half of the net paths; the capped pot lower by 1.5% to 13% on
about two units in three; a path at about `x0.3` to `x0.6` of K2's. If the read is far from that, look for a fault
before a finding.

**In the write-up:** no cause without a decomposition beside it (this morning's reviewer, finding 2); the pooled figure
with and without its largest unit (finding 3); the reviewer at the read.

**Size:** about 12 core-hours: K2 about 130 ms a path, HOUSE 110, HS5 70, HS1 50, on 112,000 paths, and one couple's
solve and one household solve a unit. Chunked and resumable, as JOINT-WIDE's amendment 2 built it.

**Time box:** half a day to amend, build the reducer's new parts with their planted checks and smoke two units at 6
points with no figure printed; 3 to 4 hours to run; half a day to read.

## Step 5. The shapes the library lacks

**Why.** All 210 of the library's couples are three years apart, retire at one age, and have the first person holding
more (`results-coverage.txt`). So are all 28 units. The pilot's three units of other shapes were of my own making and
not landed.

**Units: 28,** four base couples in each of seven shapes.
- **Bases,** each already on an exploratory panel: S149, S337F, S147-db, S061-dbpart.
- **Shapes,** each the base changed in one way:
  1. the two the same age;
  2. the partner eight years younger;
  3. the partner twelve years younger;
  4. the first person the younger by three years;
  5. the younger partner holding 60% of every wrapper;
  6. the partner holding 90% of the pensions, the other wrappers as they are;
  7. the partner with no pension at all.
- **Landed,** each unit's target, by the landing the panels use, so the app's rules sit near 85% on it.

**The household plan when the first person is the younger (shape 4).** `householdPlanFor` takes the first person's ages,
so there its merged pension would read as locked while the elder's is open, the reverse of its bias elsewhere. Build
it elder first, as the app's swap hands a couple to the solver (D104), so the bias keeps one direction. Say so in the
plan's comment and test it on one unit both ways.

**Arms,** on the same 4,000 paths of seed 7002: the app's rules (arm A); K2, solved as the app would hand the couple to
the solver if the guard were lifted, the swap included; the form step 4 keeps; and the household table run on its own
single plan, as the pilot's CEIL (`scripts/pilot.mjs`).

**The rule:** step 4's parts 1 to 3 and 6, pooled over the 28 and read by shape. Beside them, for every unit, the
household table on its own plan less the household plan on the couple: that is the size of the plan's biases in
survival, and the most an axis could add. In the pilot it was `1.67` points at the worst, on S147-db with eight locked
years, and a third of a point or less on eleven of fifteen units.

**Time box:** a day to build and land, 4 hours to run, half a day to read.

## Step 6. Whether an axis is needed

Nothing is built here without the maintainer's ruling. The evidence that calls for it, from steps 4 and 5:
- a unit lower than K2 beyond the bar that carries a recorded bias; or
- a shape whose units fall more than 1 point short of their own table, beyond noise.

If either is found, a design note first: the smaller pension's share of the two as an axis of three points, from the
household's first retirement to the younger person's state pension age and dropped at both ends (`ANSWERS.md` section
3); how its year is held to the couple's exact year; its cost in table size on the units that need it (1.2 to 1.9 times
a single's table on the lead test's 28). Not the planned path of design B: it puts an approximation in the table's year
that cannot be tested exactly.

If neither is found, the household plan goes to step 8 as it stands and designs B and C are closed with the reads.

## Step 7. What the household plan refuses

`householdPlanFor` refuses a couple whose two people hold one wrapper at different risks, or whose partner has limits
of their own. The library has none, so nothing read can say how common they are or what to do. A note, half a page:
for each refusal, whether the household plan can take it (with consent to change risk the solver moves both to the
tier it chooses, so only the starting tier and one switch are at stake) or whether the two tables stay as the way to
solve those couples. Then the cheaper of the two built off in code and read on two units changed to that shape.

**Time box:** half a day.

## Step 8. The registered test, and the speed work

Only after steps 4 and 5 have read and the maintainer has ruled on what they show.

- **The registration:** the form that held against K2 and against the app's rules; held-out couples of the library's
  shape and units of step 5's shapes; a held-out seed; the pot as M1 rules it; no unit harmed by D34's rule. To the
  design review, then to the maintainer, who launches it.
- **A pass** changes the couples' default with the reviewer on it. The guard is looked at again then: a household
  table weighs no estate by a first person, so D99's limits on who is entered first may not be needed, but that needs
  its own units.
- **Speed:** if HS1 holds, a couple's path is a little over a single's and there is nothing to speed up. If HS5 stays,
  `householdValue` on the flat form of item 11 is the one piece of speed work, exact, with its identity test.

## What not to do

- Tune the share further, or test another fixed share rule.
- Port a wider joint move for the two tables.
- Build design B, or an axis, before a read shows a unit that needs it.
- Edit the engine or `src/solver` for any of steps 1 to 5.
- Read the prototype's path time as the design's.
- Give a cause for a figure without the decomposition that shows it.

## The prompt for the agent

It carries M1 to M7 as I would answer them. Change any line you rule differently before sending.

```
The household line restarts (D114 ends). On claude/project-access-i58m0x, fetch review/external-2026-10-21 and read,
at its head, research/reviews/2026-11-17/PRESCRIPTION.md first, then ANSWERS.md and README.md beside it. Everything
below is EXPLORATORY and changes no default, no gate and nothing in the candidate. Record each ruling as its own
D-line. Nothing under src/ and not research/engine.mjs is edited for steps 1 to 5: the solver's code id stays
603eeb595679.

1. The pot (M1): where the household plan keeps more paths and delivers no less spending, a smaller pot left is not a
   harm. It is recorded, counted up to the cap and in pounds a path beside the spending, and is not a bar.
2. Step 1: the household's move from the single solver's own chooser, its tie-break above the cap on, in
   household.mjs beside chooseHousehold: HS1 at the even split, HS5 at the best of five with every tie kept at the
   even split. First, before step 2, reproduce the review's HT0 arrays on S327F, S227-90 and S147-db (seed 99003,
   1,500 paths): any path that differs and is not explained is a STOP. Three hours.
3. Step 2: the household plan's capital gains band is two people's, in research code only, the engine's default put
   back after each call, with its checks. One hour.
4. Step 3: the twin in household.test.mjs with its bars and plants; biasesOf records the five things; two hours to
   trace why twins part once the band is right, and S149's twin. Half a day.
5. Step 4: amend HOUSEHOLD.md section 5 as PRESCRIPTION.md step 4 sets out, dated before launch: the arms K2, HOUSE,
   HS5 and HS1; HS5 decides; the "nearest exact" clause withdrawn; the pot by line 1; the exact paired interval.
   Smoke two units with no figure printed. Then launch on the 28 units, seed 7002, 4,000 paths, chunked and
   resumable. K2 must equal JOINT-WIDE's arrays byte for byte: any difference is a STOP. Read it once by its rule,
   the reviewer at the read, and send me the read whole with the trade in pounds by unit. In the write-up: no cause
   without its decomposition, and the pooled figure with and without its largest unit.
6. D111 (3)'s speed work on LOOKHOLD stays held until step 4 reads.
7. Step 5, after step 4's read and without waiting for me unless step 4 reads NO LEAD or stops: the 28 units of
   shapes the library lacks, landed, on seed 7002, its rule committed first. Send me the read whole.
8. Design B is not built. No axis is built. If step 4 or 5 shows the evidence step 6 names, send me the design note
   and stop.
9. Step 7's note on what the household plan refuses, after step 5.
10. Nothing is registered and no default changes. Step 8 waits for my word.

No held-out seed is read, printed or estimated. Stop at each STOP the documents name. When a time box runs out, stop
and report.
```
