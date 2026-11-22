# Every couple on the solver: the plan (22 Nov)

The maintainer, 22 Nov: "Plan and execute so we can have complete flexibility for couples". Written before any of it is
built or run. Nothing here changes a default until a registered read and the maintainer's word, as below (CHECKLIST 1, 2).

## Where couples stand

A couple runs the solver in the new planner only inside the guard (`src/couplesSwitch.js` `coupleSolverOn`); outside it the
plan keeps the app's own rules, and the couples card says why. Its reasons, and what each rests on:

| reason | who it keeps off | what it rests on |
|---|---|---|
| `uneven` | the younger partner holding more than 60% of the pots; either holding more than 90%; the two the same age and outside 40% to 60% | D99: stage C tested today's two-table route, each person's table solved on a share of the spending, on holdings from 40% to 60% and with the elder holding 75% and 90% (`results-couples-share.txt`) |
| `gapincome` | more than three years apart in age and with other taxable income (a DB pension, an annuity, rent) | D128: step 5's shapes ran the two-table route below the app's rules on three such couples (`results-shapes-beside.txt`) |
| `ages` | a partner who would pass 120 before the plan ends | a table cannot run past 120; the card says how to end the plan earlier |

Since D136 a couple the guard hands to the solver is solved as one household (`src/solver/household.js`, HSPA): one table, no
share of the spending for each person, which is what `uneven` guarded. A couple whose plan's shape the household plan refuses
(`REFUSALS.md`: one wrapper at different risks for the two, contributions or salaries growing at different rates, a cash ISA
subscription, a later retiree paid or saving in plan year 0, a partner's own limits) is solved on today's two-table route. No
test has read either route against the app's rules on the couples the guard keeps off: step 8's 40 units were all inside it,
and its registration names this as the next step ("the guard is looked at again with its own units").

## The plan

1. **The guard's own test, a dress rehearsal (EXPLORATORY, the tuning seed 7002), its rule committed before any unit runs.**
   The app's own route for a couple (ROUTE: the household plan where it takes the couple, today's two-table route where it
   refuses its shape; each solved as the page solves it, the guard alone bypassed) against the app's own rules (APP: arm A, the
   app's withdrawal-policy search on the plan as entered), on the same paths, by the rule in step 2. Its panel: four couples
   step 8 used (touched, so not held out), each landed so APP survives `85 +/- 1%` on `1,000` paths of seed 7005 (D4's
   procedure), ten units each, every one kept off by today's guard:
   - **Y**, the younger partner holding most: `Y75`, `Y90`, `Y100` (every wrapper re-held so the younger holds that share);
   - **E**, the elder holding more than 90%: `E95`, `E100`;
   - **S**, the two the same age, outside 40% to 60%: `S75`;
   - **G**, more than three years apart with other taxable income (a `£15,000` a year DB pension of the elder's from the
     state pension age): `G8` and `G12` (8 and 12 years apart, the elder holding 60%), and `G8Y75` (8 years apart, the
     younger holding 75%);
   - **R**, a shape the household plan refuses, so on today's route: `RY75` (the two people's pensions at different risks,
     the younger holding 75%).
   On `4,000` paths a unit. It decides nothing (CHECKLIST 1). It shows which classes the registered test can expect to pass
   and sizes its paths; a class it shows harmed goes to the maintainer with its units before anything is registered.
2. **The registered test** (`registrations/couples-open.md`), its rule as the dress rehearsal's, per class:
   - the panel the same design on couples no run has used (`held-out.mjs touchedAll` on the day, frozen with its orders);
   - a held-out seed, 7026, reserved in `check-prediction.mjs` for `couples-open*.md` (a protected file: the maintainer's
     unlock);
   - paths by D34 from the dress rehearsal's discordance (a true 1-point loss read as harm at least 90% of the time, a
     quarter point at most 5%);
   - **the rule, ROUTE against APP for each class:** (1) no unit flagged by D34's harm rule, in whole paths; (2) the class's
     pooled survival change, by path, its 95% interval's lower end above nought; (3) the class's pooled spending delivered on
     the paths both keep, the units weighted equally, its point not lower than `-0.05%`. The pot recorded as D116 has it.
   - **Outcomes:** each class that passes all three opens its part of the guard; a class that fails keeps the app's rules and
     goes to the maintainer with its units; a flagged unit holds its class whatever its pooled gain (D34 (3)).
   - its design review (the `reviewer` agent), its pilot and budget, then the maintainer's word to launch; through the
     launcher from a worktree at the launch commit; read once by its rule; the reviewer at the read, the deep review after.
3. **The change of default**, for each class that passed: `src/couplesSwitch.js` (the band, the elder's ceiling, the same-age
   rule and `DB_GAP_UP_TO`, as the classes passed), the couples card's and the coverage line's words, the decided-defaults
   block and `couple-default.test.mjs` (protected: the maintainer's unlock), the app's route held to the tested arm path for
   path, the reviewer on the change of default, B1's gate, then `main`.
4. **The household plan's refusals, beside it (engineering):** the three shapes `REFUSALS.md` marks "Probably" built into the
   household plan, each with a check of its class against the engine (the household plan's paths the couple's own where the
   two must agree) and its plant: contributions to one wrapper growing at different rates (as dated deposits), a cash ISA
   subscription (the two added, against the doubled allowances), a later retiree paid or saving in plan year 0 (that year
   priced as the engine pro-rates it). They move such couples from today's route onto the household's, which the registered
   test reads through its other classes. The shapes it cannot take exactly (one wrapper at different risks, salaries growing
   at different rates, limits that differ) stay on today's route, which class R reads.
5. **`ages` stays**: a table runs to 120, and the card's advice holds.

## What it does not do

- The maintainer's own plan is never a unit or a fixture (CLAUDE.md); the panel is the library's couples and their shapes.
- No class opens on the dress rehearsal alone, and no default moves before the registered read and the reviewer.
- What a class's pass reaches beyond its units (other splits between those tested, other gaps, other incomes, the estate
  aim, consent withdrawn, the dial's other positions, the speed mode) is by inference, said in the D-line.

## Its time

- The dress rehearsal: its panel, audit, read and planted checks about half a day to build (step 8's machinery reused:
  `household-hsp-panel.mjs`, `audit-household-hsp.mjs`, `reduce-household-hsp.mjs`), the landing about an hour, the run
  about four hours on four cores, its read an hour.
- The registered test: its panel and pilot half a day, its run about fifteen hours, its read and reviews half a day.
- The change of default and the gate: half a day. Track 4 beside it: about a day.
