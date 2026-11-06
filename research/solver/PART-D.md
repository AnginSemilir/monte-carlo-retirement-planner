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

## D2 and D3

D2, the candidate's features on two tables (three days); D3, the levers for couples (one day): as the launch plan's
section 6 gives them, after D1.
