# One plan for the whole household (D113): the design, the gain to expect, the time, and the lead test

The maintainer, 17 Nov: "Look at bigger - one plan for the whole household. Think deeply about how that would work and how
much more accurate you'd expect to be, and if it could be done without significant increase in timing. After that if
you're confident at least there's a good lead, follow up on it with tests as needed and then get back to me. Do this
before the speed work." EXPLORATORY throughout: nothing here changes a default, a gate or the candidate.

## 1. What the two tables get wrong, in one place

Today a couple is two single people (`couple.js`): each person's table is solved on a fixed share of the household's
spending and minimum pot, from their own pots and incomes, spending only from their own retirement; each year a rollout
tries joint moves (a funding split, each person's top two moves, the level of either) and values each by the product of
the two tables' chances, each table reading its own person's pots. The reads since 13 Nov say where that bites:

- **The share matters a great deal, and no fixed rule gets it right.** Moving a couple's share by up to 0.18 moves
  survival from -12.4 to +9.3 points, beyond noise on 43 of 56 comparisons (`results-share-rules.txt`). The best share
  differs by couple (`results-share-ensemble.txt`: another share beats today's on 7 of 10, by about 2 points on average).
- **The tables misread the household.** At the start the joint value read 0.018 on S129-90, where 79% of paths survive;
  the forecast ranked the shares at a Kendall's tau of 0.66 against simulation (`results-share-choose.txt`).
- **The deep review's leading cause** (`reviews/2026-11-16-deep-share-rules.md`): each person's table plans a part of the
  household that the household never lives, and the joint move values the household's money by those parts. A pound
  counts by whose pot it is in. In the years where one person has retired and the other has not (every couple of both
  panels has one to three), the household spends the whole target and the younger's table plans nothing.
- **Taking the lost paths apart** found no single part of the move to blame; offering each person's top six moves was the
  most consistent help (`results-share-replay.txt`). JOINT-WIDE reads that on today's split.

A share is the price of solving two single people. One plan for the household has no share to choose.

## 2. How one plan for the household would work

The household's position is what the single's table already holds, with the two people's money added together: total
wealth (45 points on a log axis in years of the household's spending), the pension's share of it, the ISA's share of the
rest, the taxable account's gain, the tax-free cash used, the world (three) and the tiers held. What it needs that a
single's does not is anything that is per person and changes the money: each person's income tax bands (two personal
allowances and two basic-rate bands), each person's pension access age, each person's tax-free cash allowance, and each
person's state pension and other incomes. The incomes depend only on the year, so they cost no table space (a single's
table already carries its own that way). What is left is how the pension is split between the two people.

Three ways to build it, cheapest first:

**A. The household as one person with both allowances** (the prototype; no change to the solver). A synthetic single
plan: both people's pots added by wrapper, the first person's ages, the household's spending, target, bands, costs and
minimum pot, spending from the household's first retirement, the later retiree's pay and the partner's state pension
and incomes as other incomes in the first person's ages, the later retiree's contributions after the first retirement
as yearly deposits, and every per-person allowance doubled (the personal allowance, the bands and the taper threshold,
the ISA, savings, dividend and capital gains allowances, the tax-free cash cap, the annual allowance). It is solved
exactly as a single's plan is (`solveForApp`, the candidate's settings), so every part of the single solver comes with
it: the tiers, the bridge reader, the three worlds, the estate cap, the floor, the dial. Each year the household's move
is chosen by the same rollout as today, with one judge in place of two: the household table's own top moves at the
household's position, each tried at every funding split, stepped one year by the exact couple model (`model.js`, each
person's own tax and access), and valued by the household table at where it lands.
- What it mends: the share (gone); the years one person has retired (the household plans them as they are lived); a
  pound is a pound whoever holds it; the household's level is chosen from the whole menu; its forecast is the
  household's own.
- What it approximates: the doubled allowances assume the household can always split its taxable income evenly. That is
  nearly right where both people hold a fair part of the pension, and from the state pension age, when each person's
  state pension fills most of their own personal allowance. Before it, where one person holds little of the pension, the table
  sees up to one personal allowance a year of tax-free drawing that the household does not have (at most about £2,500 of
  tax a year). And it reads the merged pension as open from the first person's access age, so in the years the younger
  person's pension is still locked (three on most of the panel's couples, in their mid-fifties) it sees money the
  household cannot yet draw. This year's tax and access are always exact (the rollout steps the exact couple model);
  the bias is only in what the table expects of later years.

**B. The household table with each person's share of the pension carried as a planned path** (the production design).
The same table as A, the same size as one single's table, whose year (`fast.js`) splits the household's pension
between the two people by the share a forward run of the household's expected policy gives for that year, and works out
each person's tax, tax-free cash and access on their own part. It removes A's two biases where the household follows its
expected path, and leaves a small one where a path wanders far from it. It needs a household year written into
`fast.js` and held to `model.js` as a single's is (about two to three days with its tests).

**C. The full joint table**, the pension's split between the two people a seventh axis of the table (three to five
points), each person's tax-free cash per person. Exact in the model, and three to five times a single's table before
anything else; six to fifteen times with per-person tax-free cash. The fallback if B's planned path proves too rough.

## 3. How much more accurate it should be

The household plan can do anything a fixed split can do and more (it can change the effective split by year and by
position), so where its table is accurate it should at least match the best fixed split per couple. The reads put that at
about 1.5 to 2 points of survival over today's on the uneven and feature couples tested (`results-share-ensemble.txt`
+1.98 over 9 units; the share choice's pick by simulation +1.55 over 14, chosen on half the paths and scored on the other
half, `results-share-choose.txt`), and up to 6 to 9 points on single couples (S211-db +6.15 at 0.6; S147-db +9.34 under
MEANS). On couples near 60/40 with both pensions open the two tables are close to right; what remains there is the
retirement gap's years and the top-two limit, perhaps half a point. Survival under today's default is 89.5% to 99.1% on
those units (stage C), so the room is the 1 to 10 in 100 that fail.

The expectation, before any test: B gains about 1 to 3 points on uneven and feature couples and about 0.5 on even
ones, with no couple losing beyond noise. A, the prototype, should show most of that on couples whose pensions are open and
fairly split, and may give some back where its two biases bite: the 90/10 couples before their state pension age, and
the younger couples in the years the younger pension is locked. A loss there is a bias of A's that B mends, not a
verdict on the idea; a loss on couples where A is nearly exact would be.

A second gain, not a survival figure: the table's forecast becomes the household's. Today it can read 0.018 where 79%
survive. A single's forecast is close to the engine's (a sixth of a point on average when it was measured, with the known
gaps of T-GAPS on some households); the household's should be as close, which is what the page needs to show a couple
their own forecast and to find a safe spend by reading the table.

**The identity inside the test.** K2 is the couples' default on code where the household option is off, so its arrays
must equal JOINT-WIDE's K2 arrays byte for byte on every unit; any difference is a STOP.

## 4. The time

Measured today (Node, one core, the JOINT-WIDE pilot, `results-joint-wide-pilot.txt`): a couple's two tables take 64 to
143 s; a couple's path takes 79 to 210 ms, about 3 ms a year, three to four times a single's year (a single's path about
25 to 36 ms, `results-retime-port.txt`). In the browser (`results-couple-timing.txt`, S069 at the app's settings, four
parts, under load): the two solves 157 s, the headline's 2,000 paths 92 s and this year's skips (5,000 paths) 209 s, so
two thirds of a couple's wait is its paths.

- **A:** one table in place of two: the solve about halves. A decision ranks the household table's top moves (one
  single's chooser) and steps about 15 joint moves (3 moves x 5 splits) with one table read each, against today's 20 to 40
  with two reads each: a path about a half to a third of today's. The wait about 0.4 to 0.5 of today's.
- **B:** one table whose year works two people's tax: about 1.5 to 2 times a single's, so 0.75 to 1 times today's two
  solves; paths as A or cheaper. The wait about 0.5 to 0.7 of today's.
- **C:** three to five times a single's table at three to five split points, so 1.5 to 2.5 times today's two solves (more
  with per-person tax-free cash); paths as A. The wait about 0.8 to 1.4 of today's.

So one plan for the household need not cost more time than two tables do today, and A and B should cost less: the
solve is one table, and the path, which is most of a couple's wait, gets cheaper. Each figure above is an estimate from
measured parts; A's are measured by the lead test below.

## 5. The lead test (EXPLORATORY; its rule below, committed before any launch)

**What runs.** Design A as a research option, off in code (`research/solver/household.mjs`: the synthetic plan, the merged
position, the household's rollout and its policy for the engine; nothing in the app imports it), each part with its test
and its plants. Two arms on each unit, on the same 4,000 paths of seed 7002, each held to `E.runTrial` on its first 200:
- **K2**: the couples' default as the app solves a couple (`APP_COUPLE`, LOOKHOLD; as JOINT-WIDE's K2);
- **HOUSE**: design A, the household plan solved at the candidate's settings at 45 points, the same estate weight.

**The panel.** JOINT-WIDE's 28 units (TIE-C2's eight younger couples and four library couples, the share rules' eight
90/10 and eight feature units), the same landings, so each unit's K2 is JOINT-WIDE's and its groups say where A's biases
bite: the younger couples (the locked years), the 90/10 units (the allowance before the state pension age), the
library and feature units (A nearest exact).

**Recorded.** Survival, the failure year, the pot left, the estate, lifetime tax, spending delivered and unmet spending a
path; each arm's solve time and CPU a path; the household table's opening forecast beside each arm's survival.

**The rule.** Paired, by path, HOUSE less K2, the paired exact interval as JOINT-WIDE's reducer takes it:
1. pooled survival over the 28 units;
2. survival by unit: a unit whose interval lies wholly below -0.3 points is a loss beyond the bar;
3. pooled spending delivered, as a percentage of K2's;
4. the time: CPU a path and the solve, HOUSE over K2.

Outcomes:
- **A LEAD:** pooled survival's interval wholly above 0, or (its interval reaching 0 or above and) pooled spending's
  wholly above 0; and no unit of the library or feature groups (where A is nearest exact) a loss beyond the bar. Then B is
  proposed to the maintainer as the build, with its time budget, and the test's losses where A's biases bite are named.
- **NO LEAD:** pooled survival's interval reaching below 0 with spending not above, or a library or feature unit lost
  beyond the bar. Then the household plan goes back to the maintainer with the read, and the smaller fix (each table on
  the household's clock) is offered in its place.
- Losses on the younger or 90/10 units, whatever the outcome, are reported against A's two biases (the locked years; the
  allowance before the state pension age) with the paths' failing years, so they can be told from a fault of the idea.

**Amended before any launch (17 Nov, morning), with the audit and the read built.** "Nearest exact" is read from what the
audit records for each unit (`audit-household.mjs` `biasesOf`), not from its group: at most one plan year in which the
household spends with one person's pension open and the other's still locked, and the first person's share of the two
pensions between 0.25 and 0.75. On the panel that is eight units: S205 and S223 (library; one such year each), S023-db,
S061-dbpart and S109-sppart (none) and S191-dbpart, S227-sppart and S271-db (one each). The library's S149 and S167 and the
features S147-db and S377-dbpart have three such years each, and every 90/10 unit holds 90% of the pensions with its first
person, so each of those carries one of A's biases. Every younger couple has three such years (plan years 21 to 23).

**Built and smoked before any launch (17 Nov, morning).** `research/solver/household.mjs` with `research/tests/household.test.mjs`
(15 checks, ALL PASS: the plan's construction on S327F, the merged position, the plan's fidelity under the app's own rules
on six couples with each of its four plants failing it, the rollout's engine and exact model agreeing on 20 paths, the
refusals); `audit-household.mjs`, `batch-household.sh` and `reduce-household.mjs` (its planted checks ALL PASS, 8); a smoke
of two units at 6 points and 30 paths read through the gate (fair), no figure printed. The smoke's first read was refused
for an audit stamp the read had moved after the units ran, as the gate should; the units were run again on the files as
they stand.

**Time box.** The build and its tests one working day from the commit of this file; the run and the read half a day.
If the box runs out, stop and report.

**Stopped by the maintainer (D114, 17 Nov, morning), before the lead test's launch:** "Handover your thoughts and the problem
so far as a prompt for an external reviewer, stop that line of thought for now." The lead test is not run; design A's
prototype is committed as built, off in code; the handover is `QUESTIONS-2026-11-17.md`.
