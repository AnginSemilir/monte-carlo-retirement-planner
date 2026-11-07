# Part D: couples in the solver (during the singles' beta)

The launch plan's section 6 (`research/reviews/2026-11-01/LAUNCH-PLAN.md` on review/external-2026-10-21 at 90fcb10) and
B9: D1 to D3 build while the singles' beta runs, D4 is the registered held-out test (its registration to the maintainer
before its run), D5 the couples' screens in the new planner, D6 the couples' beta. The rules while the beta runs: the
singles' tables stay the same bit for bit, with an identity test on every commit; the e3pcls pin is retaken after each
solver change; nothing merges to `main` mid-beta that moves a single's number. Couples stay on the app's rules under the
switch (D42) until D4 reads and D6.

## D1. M4's three gaps (box one day, from 6 Nov 19:45 UTC)

The archive's M4 (`archive/PLAN.md`): the couples' rollout (`src/solver/couple.js`, the archived pilot: two single tables,
half the spending each, a yearly one-step rollout over the funding split) left out the cut term, took the year's spending
level from the first person's move, and fixed five quadrature nodes. Each is now scored as the single chooser
(`scoreMoves`) scores a move:

- **The cut term.** A joint move's score charges the household's cut. This year's is the two tables' own cost of the
  household's level (`costOf`: lambda x (1 - level)^2 below the target, a raise's credit above it, age-weighted under
  `ageWeight`), averaged: the household spends at one level, so a cut is counted once, not once a person. A raise's credit
  is weighted by the chance both last, as `raiseSurvival` weights a single's. The years ahead are the two tables' expected
  future cut cost (each table's `short`, read over the same corners as its survival), averaged. So the dial reaches
  couples.
- **The household's level.** Each joint candidate tries the level of either person's ranked move, and both tables value
  where it leaves them. **Found on the way:** the exact model the couples' year runs on (`src/solver/model.js` `step`) spent
  the scheduled target whatever the move's level, so the rollout chose a level its own year ignored. It now spends the
  target times the move's level, as the engine's year does (the same line, before the guardrails). Nothing in the singles'
  path calls `step`: a single's tables and runs use `fast.js`.
- **The quadrature.** The expectation takes the tables' own nodes and weights (`quadNodes`); unset, they are the five, so
  nothing changes there.

**Its test:** `research/tests/couple-quick.test.mjs` (named in `FAST_JOINING`, so in the fast tier as it exists; into FAST
at the next unlock), on S007 at light settings with the menu's levels, a dial setting and seven nodes, three paths:
1. the exact model's year at the move's level, as the engine's;
2. the expectation on the tables' own nodes (the cut held out on both sides);
3. the cut term in the value and in the joint move's score, against oracles built from the tables' own reads;
4. the rollout's pick the best of every candidate, both levels tried; some years take a level only the second person's
   moves proposed;
5. a single's tables (S116 at the library sweep's light settings) the code before D1's, bit for bit;
6. the dial reaches couples: the household spends higher with the cut term than without it.

Plants (`--plants`), each the old rule: `nolevel` (model.js) fails check 1; `fivenodes` checks 2, 3 and 4; `nocut` checks
3, 4 and 6; `firstlevel` checks 4 and 6. All four together are the code before D1, bit for bit: the couples' rollout on
S007, 60 paths, the same outcomes as on b4ea006. The old couples test (`solver-couple.test.mjs`, no dial and one level)
reads exactly as before. The results: `results-couple-quick.txt`.

## D2. The candidate's features on two tables (box three days, from 7 Nov 07:30 UTC)

The launch plan's D2: each person's table at the candidate's settings (the tier state per person, three steps below,
HR, the table without the dealing cost, the failure year at what it can pay, the floor), the bridge reader with the
household's money (O11), the two tables solved side by side; tested by the engine and the couples' year in step, O11's
case planted, and the singles' tables and the pin unchanged. In parts, each with its test:

- **D2.1, the engine executes a couple's joint move** (done). A solved couple's year needs the engine (`src/App.jsx`
  `stepYear`, under a table's move) to carry what the joint move says: the share of the net need the first person funds
  and each person's own draw order, harvest and ceiling, as the exact model's year (`model.js` `step`) applies them. Before
  it the engine split a couple's need evenly in one order whatever the move. A single's move, and a couple's year with no
  table, run as before. **Found on the way:** the exact model's couple year had no case for N4's pension ceilings
  (`menuPlus: ['hr']`, the candidate's): a `penHR` step in a couple's order or one-off cost order reached `drawPot` with no
  pot id and threw a TypeError, and an `hr` harvest ceiling fell to the personal allowance. Both now draw as the engine
  draws (the engine's own `N4_PEN` and `N4_HARVEST`), and any other step the year knows nothing of throws by name.
  **Its test:** `couple-lockstep.test.mjs` (the full tier): eight library couples, three paths each, every year a random
  joint move from the candidate's menu (an uneven split, two orders, HR's ceilings, every spending level, now and then the
  lump sum): the engine and the model within a pound on every pot, basis, gain carried, tax-free cash, cash ISA, lump-sum
  flag and the year's flows; the engine's years with no table and a single's years under a solved table the code before
  D2's bit for bit; an unknown step throws by name. The plant `non4` (the model before D2) fails checks 1 and 4; the
  engine of c6f9456 fails check 1 (`results-couple-lockstep.txt`).
- **D2.2, tiers per person** (done). Under a couple's joint move each person's pension and ISA move to the tier their own
  move holds, are charged the round trip on the slice traded, and grow at it, in the engine (before it, `self` only) and in
  the exact model (before it, none: `model.js` gains each person's `tierHeld`, the switch at the engine's place, after the
  cash ISA and before growth, and `profileOf`, the profile a pot grows at; `prepare` takes `tiersBelow`, so the model's
  lists are the engine's). couple.js grows each pot at its person's tier held, in the forward run and the rollout's
  expectation. And each person's tier lists take the third step down by their own wrappers: before it the engine built the
  second person's lists by the first person's rule. **Its test:** `couple-lockstep.test.mjs` as above, each person's tiers
  switched at random (the third step down on half the couples) and the tiers held and the switch charged compared too; a
  single under a tiered table the code before D2's bit for bit; check 5, every library couple's per-person lists that
  person's own table's (`tiersFor`), with one couple made where the two people take the third step differently (no
  library couple does). The plant `notier` fails checks 1 and 2; the engines of c6f9456 and a82c904 fail checks 1 and 5.
- **D2.3, the tables at the candidate's settings** (done). `solveCouple`'s `solveOne` solves each person's plan as a
  single's is solved (`solveForApp`: the tier state three steps below, HR, the table without the dealing cost, the
  failure year at what it can pay, the floor at 80% of their share), the two side by side. The rollout ranks each
  person's moves with the tiers they hold, as their own chooser does (`rankFor`: the round trip in the flows, a move that
  leaves the tiers held paying `switchCharge`, the mixture's worlds weighted), charges each person's switch in the joint
  score, and reads each person at the tier pair their move goes to (`solve.js` `value(s, t, layer)`, the tier state's
  layer). The engine runs a solved couple (`couplePolicy`, `withCouple`: its state read as the model's). **Found on the
  way:** each person's plan carried the household's whole minimum pot (`singlePlanFor`; 84 of the library's 210 couples
  set one), and a household whose plan sets none was judged against none while each person's table set one
  (`solvePlan`'s `minPotYears`); the two now add up. **Its test:** `couple-tables.test.mjs` (the full tier), S007 and
  S105 at the library sweep's light settings: (1) each table a single's at the candidate's settings, the two minimum
  pots the household's; (2) on every library couple and one made, the two plans add back to the household's on every
  money amount; (3) the layer reads against grid.js's own reads of that layer, world views too, and the expectation
  against an oracle that reads each person's layer by hand; (4) each person's candidates their chooser's pick, the joint
  score against an oracle with each switch charged, the chosen move the best; (5) the engine under the solved couple and
  the rollout, the same joint move every year and the same end; (6) S116's and S224's tables, value reads and runs the
  code before D2.3's bit for bit. Plants: `fullfloor` fails checks 1 and 2, `nohhfloor` 1, `baselayer` 3 and 4, `nocharge` 4,
  `noheld` 5 (`results-couple-tables.txt`).
- **D2.4, the bridge with the household's money** (the archive's O11, done). Each person's table reads their bridge as
  paid from their own ISA, taxable account and cash (the bridge reader's chance). In a year either person's table reads
  as a bridge year, the rollout reads the two people with their accessible money shared between them as best serves both
  (`shareBridge`): x moved from one to the other, each wrapper to the same wrapper (the taxable account with its share of
  the basis), x at most what the giver holds and the receiver's floor bills ahead to their access (`bridgeTable`'s
  need), x = 0 always among those tried (nine points, then a golden-section refinement). Pensions never move. Two limits,
  for D4 to measure: the giver's pension, where they can draw it, is not counted, and a year before a bridge starts still
  reads it on the person's own money (only bridge years are read with the household's). **Its test:**
  `couple-tables.test.mjs` checks 7 and 8, on a planted O11 couple (made from S105: the second person retired at 50,
  eight years from their pension, with £40,000 they can reach; the first past access with a large ISA): (7) the share
  within its bounds, the read at it the best the search tried, never below the own-money read and above it at every
  bridge decision, short of a 41-point scan by nothing, each wrapper's household total, the pensions, the basis and the
  giver's gain share kept, and after the bridge the expectation the own-money one bit for bit; (8) the year-0 read of
  both lasting with the household's money within 10 points of the household's simulated survival, on each person's own
  money more than 50 points below it. Plant `ownmoney` fails both (`results-couple-tables.txt`).

## D3. The levers for couples (box one day, from 7 Nov 12:25 UTC)

Each person's table is a single's solved by `solveForApp` on their own plan (D2.3), so the plan's aims and locks reach
both tables as they reach a single's; D3 makes each lever hold for the household:

- **The dial**, through D1's cut term: each table at lambda times the position, the household's cut counted once.
- **B3a's age weights on the chance that at least one partner is alive.** A single's weights are the Gompertz chance of
  being alive at each year. A couple spends while either lives, so each person's table now weighs a cut by
  1 - (1 - w_self)(1 - w_other), the other person's age given to the solve (`solveForApp`'s `ageWith`, `solve.js`
  `ageWeighted`'s `with`); the two tables' weights are the same. A single's are as before.
- **The candidate's tiers locked per person.** Each person's table above position 1 is solved on their own base (their
  plan at position 1), and the rollout now keeps each person to the tier pair their base's chooser picks where they
  stand (`rankFor`, as `chooseAction`'s `lockMask` does a single's). Before D3 the rollout ranked each person's moves
  unlocked.
- **Consent** withdrawn: each table one tier pair, so neither person's tiers move.
- **The locks, for each person.** The plan's locks are the household's (the pension age, the tier ceiling on every
  pension and ISA, the lump sum), applied to both people's plans and the household's; each is checked on each person.
  Locks that differ between the two people wait on D5's screens ("the limits per person").

**Its test:** `couple-levers.test.mjs` (the full tier), the singles' all-pairs design (`lever-matrix.mjs`) on two
library couples (S007, S127), each person's table at the library sweep's light settings: (1) the design covers every
pair; (2) each combination solves, each person's run record (lambda, the age weights with the other's age, the floor,
the base and its lock), each person's pair the base's at every decision of 20 paths, and on 100 engine paths consent,
raises blocked and each lock held for each person; (3) the age weights by hand; (4) plants: the lock dropped in the
rollout (`nolock`, the code before D3), the age weights each person's own (before D3), the base with the other estate
weight, the floor at 0 (`results-couple-levers.txt`).
