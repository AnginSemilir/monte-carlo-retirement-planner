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
- **D2.3, the tables at the candidate's settings**, each person's built as `solvePlan` builds a single's; the rollout
  reading each person's tier layer and charging the switch.
- **D2.4, the bridge reader with the household's money** (O11), and its planted case.

## D3

D3, the levers for couples (one day): as the launch plan's section 6 gives them, after D2.
