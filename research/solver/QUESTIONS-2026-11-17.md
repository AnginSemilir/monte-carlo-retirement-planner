# For the external review, 17 Nov: one plan for the whole household (couples)

From the agent on `claude/project-access-i58m0x` (the commit that adds this file, and the prototype's files with it). The
maintainer asked for this handover and stopped the line here (STATE.md D114): the idea is designed, a prototype of its
cheapest form is built and checked, and its lead test is written and smoke-run but **not run**. Everything below is
EXPLORATORY; nothing in the app or its defaults has changed. The rules of the work are `research/solver/CHECKLIST.md`;
where it stands is `research/solver/STATE.md` (decisions D99 to D114 for couples).

## 1. The problem

A couple is solved as two single people (`src/solver/couple.js`, D99, D109):
- each person's table is a single's table (`solveForApp` at the candidate's settings, 45 wealth points), solved on a
  **share** of the household's spending and minimum pot, from that person's own pots and incomes, spending only from
  that person's own retirement (the share since D99 is `'pots'`: half where the elder holds 40% to 60% of the pots,
  their share of the pots outside it, held to 5% to 95%);
- each year a rollout picks the joint move: a funding split (0, 0.25, 0.5, 0.75, 1) x each person's top two moves from
  their own table x the level of either; each candidate is stepped one year by the exact couple model (`model.js`) and
  valued by the **product** of the two tables' chances, each table reading only its own person's pots; then LOOKHOLD
  (D109: a tie rule above the estate caps with a forward look, and a hold on risk past twice a table's wealth top).

What the reads since 13 Nov say (files in `research/solver/`):
- **The share is right at the coarse level** (stage C, registered, seed 7022, `results-couples-share.txt`): with the
  pots' share every uneven unit beats the app's rules, +10.7 points pooled; with half each, the 90/10 units survived
  57% to 92%, below the app's own rules on 9 of 12 couples, by up to 27 points.
- **But no fixed share is right for every couple.** The share ensemble (`results-share-ensemble.txt`, seed 7002): another
  share beats today's on 7 of 10 units, about +2 points on average. The share rules' registered test
  (`results-share-rules.txt`, seed 7023): NEITHER; FLAT (the pots' share, band dropped) +0.421 pooled but four units
  flagged and spending -0.075%; MEANS (pots and incomes) +0.217 pooled, six flagged, S061-dbpart -12.381. Moving the share
  by up to 0.18 moves survival from -12.4 to +9.3 points, beyond noise on 43 of 56 comparisons.
- **The tables misread the household.** At the start the joint value read 0.018 on S129-90, where 79% of paths survive;
  the forecast ranked shares at a Kendall's tau of 0.66 against simulation. Choosing the share by short simulation gained
  +1.55 points over today's split, out of sample, but costs about 10 to 11 times a couple's solve
  (`results-share-choose.txt`).
- **The deep review's leading cause** (`reviews/2026-11-16-deep-share-rules.md`): each person's table plans a part of the
  household that the household never lives, and the joint move values the household's money by those parts. A pound
  counts by whose pot it is in. Every couple on both panels has one to three years in which one person has retired and
  the other has not; the household spends the full target in them while the younger's table plans nothing.
- **Taking the lost paths apart** (`results-share-replay.txt`, D110): MIXED, no single part of the move carries the loss;
  offering each person's top six moves instead of two was the most consistent help (+0.4835 of the lost paths pooled,
  0.35 or more on eight of ten comparisons).
- **The wider joint move on today's split** (JOINT-WIDE, D111 (2): top four and top six against two, 28 units, 4,000
  paths of seed 7002): ran overnight, **its read is due this morning** (`results-joint-wide.txt` and
  `reports/2026-11-17-joint-wide-read.md` once committed). Read it with this: it says how much of the gap a wider move
  closes on the same 28 units the household test below would use.
- **Time today:** a couple's two tables take 64 to 143 s on one core (Node, `results-joint-wide-pilot.txt`); a couple's
  path 79 to 210 ms, about 3 ms a year, three to four times a single's year (a single's path about 25 to 36 ms). In the
  browser (S069, four parts, a loaded machine, `results-couple-timing.txt`) the two solves took 157 s and the paths 301 s
  of a 458 s wait: most of a couple's wait is its paths.

## 2. The idea: one plan for the whole household (D113; `research/solver/HOUSEHOLD.md`)

A share is the price of solving two single people. One table for the household has no share. Its position is a single's
(total wealth, the pension's share, the ISA's share of the rest, the taxable gain, the tax-free cash used, three worlds,
the tiers held) with both people's money added; the incomes depend only on the year, so they cost no table space. What is
per person and moves money: each person's tax bands and allowances, pension access age, tax-free cash allowance, and how
the pension is split between them. Three ways to build it:
- **A, the household as one person with both allowances** (built; no solver change): a synthetic single plan (both
  people's pots added by wrapper; the household's spending, costs and minimum pot, spending from the first retirement; the
  later retiree's take-home, the engine's own sum, as tax-free income and their contributions as deposits until they
  retire; the partner's state pension and incomes in the first person's ages; every per-person allowance doubled), solved
  as a single's plan is, judging the couple's rollout alone: its top three moves at the household's merged position, each
  at every funding split with both people taking it, stepped by the exact couple model, valued by the one table. Its two
  known biases: the doubled allowances take taxable income as always splittable evenly (wrong where one person holds
  little of the pension, before the state pension fills the personal allowances: at most about £2,500 of tax a year), and
  the merged pension reads as open from the first person's access age (wrong in the years the younger's is still locked).
  This year's tax and access are exact (the rollout's step); only the table's view of later years carries the biases.
- **B, the household table with each person's share of the pension carried as a planned path** (designed, not built): the
  same one table, its year (`fast.js`) splitting the pension between the two by the share a forward run of the expected
  policy gives for each year, each person's tax, tax-free cash and access worked on their own part. It removes A's two
  biases along the expected path. A household year in `fast.js`, held to `model.js` as a single's is: about two to three
  days with its tests.
- **C, the full joint table**, the pension's split an axis (three to five points), tax-free cash per person: exact in the
  model, three to five times a single's table before anything else.

**The agent's expectation, untested:** B gains about 1 to 3 points of survival on uneven and feature couples and about 0.5
on even ones, with no couple losing beyond noise; it should at least match the best fixed share per couple, since it can
do anything a fixed share does and change it by year and position. A should show most of that where its biases do not
bite. **Time:** A about 0.4 to 0.5 of today's wait (one table not two, and the path cheaper); B about 0.5 to 0.7; C about
0.8 to 1.4. The only measured hint: on a smoke at 6 points, S023-90's household table solved in 5 s against 18 s for the
two tables (direction only).

## 3. What is built and checked (design A, off in code; nothing in the app imports it)

- `research/solver/household.mjs`: `householdPlanFor`, `mergedState`, `solveHousehold`, `householdValue`, `chooseHousehold`,
  `runHouseholdPolicy`, `householdPolicy` and `withHousehold`; refusals for what it does not carry (two people's accounts of
  one wrapper at different risks or contribution growth, a later retiree paid in plan year 0, a cash ISA subscription, the
  partner's own limits); `HOUSE.plant` for its tests.
- `research/tests/household.test.mjs` (the full tier), ALL PASS, 15 checks. Its strongest: **the plan's fidelity** - on
  six panel couples the household plan run under the app's own rules (arm A's policy) against the couple under the same
  rules, 300 paths of seed 99001: survival within 1.3 points on all six (S205 +0.0, S061-dbpart +1.3, S327F +0.3,
  S227-90 +0.0, S149 +0.3, S023-db +0.7), the median end wealth within 13.6% (S227-90 -13.6%, S061-dbpart +11.3%, the
  rest within 3.6%); each of four plants fails it (the partner's state pension dropped: S205 -23.7 points; the later
  retiree's take-home dropped: S205 -10.0; the allowances single: S061-dbpart -7.0; the partner's pots left out). Also:
  the rollout's engine and exact model agree on 20 of 20 paths at smoke settings, both people take the household's move.
- The lead test, written and smoked, **not run**: `HOUSEHOLD.md` section 5 (its rule, committed before any launch, and an
  amendment setting "nearest exact" by each unit's recorded biases: eight units with at most one locked year and the
  first person holding 25% to 75% of the pensions), `audit-household.mjs` (K2, the couples' default, against HOUSE on
  JOINT-WIDE's 28 units, the same 4,000 paths of seed 7002, chunked and resumable; K2 must equal JOINT-WIDE's K2 byte for
  byte), `batch-household.sh`, `reduce-household.mjs` (its planted checks ALL PASS, 8). A two-unit smoke at 6 points read
  through the gate, fair, no figure printed. Its cost: about two to three hours on four cores.

## 4. The questions

1. **The direction.** Is one plan for the household the right next step for couples, against the smaller fix (each
   person's table on the household's clock: spending from the first retirement, the partner's incomes counted in the gap
   years), or against stopping at whatever JOINT-WIDE's read gives? Is there a known formulation (a household-level
   dynamic programme with income splitting, or the life-cycle literature on couples) that points to a better state or
   decision structure?
2. **Design A as the lead test.** Are its two biases acceptable for a test whose purpose is to show whether a household
   table judges a couple better than two tables, given the rule reads them apart (the eight nearest-exact units decide
   NO LEAD; losses elsewhere are placed against the locked years)? Would you run A as written, change the test, or go
   straight to B?
3. **Design B's planned split.** Is carrying each person's share of the pension as a deterministic path from a forward run
   sound, or is there a better cheap treatment (a coarse axis only where the split matters; the split chosen each year
   to equalise marginal rates, so it need not be a state; a second pass solved on the first pass's realised splits)?
4. **The decision step.** One judge, the household's top three moves, five splits, both people taking the same move: too
   narrow? Should it offer asymmetric moves (one person to their basic-rate limit, the other to their allowance), and how
   many?
5. **The fidelity check.** Survival within 2 points and median end wealth within 15% under the app's rules: a fair bar for
   the plan's construction? S227-90's -13.6% and S061-dbpart's +11.3% in median wealth: a sign of something the merge
   misses (the agent's leads: the doubled ISA allowance sheltering the taxable account faster, the GIA's starting basis
   copied from the first person's account, the lump sum taken on the merged pension at the first person's access)?
6. **The time model.** Does it hold, and where would B's household year in `fast.js` be hardest (the inversion of a net
   need into each person's gross pension draw across two sets of bands)?
7. **Anything misread** in section 1's evidence or the agent's expectation.

## 5. What to read

On `claude/project-access-i58m0x`: this file; `research/solver/HOUSEHOLD.md` (the design, the expectation, the time
model, the lead test's rule and its amendments); `research/solver/household.mjs`; `research/tests/household.test.mjs`;
`research/solver/audit-household.mjs`, `reduce-household.mjs`, `batch-household.sh`; `src/solver/couple.js` (today's
couples: `singlePlanFor`, `solveCouple`, `expectedValue`, `chooseJoint`, `rankFor`, `holdMove`, `lookPick`);
`src/solver/fast.js` (a single's year, the basis of B); the reads named in section 1 with their reports in
`research/solver/reports/`; STATE.md D99 to D114. The constraints: seeds 7001 (search), 7002 (tuning) and 99001 to 99005
(the review's) are free to use; held-out seeds are reserved; no model identifier in any pushed file; the maintainer's own
household is never a fixture; `research/solver/archive/` is never edited.
