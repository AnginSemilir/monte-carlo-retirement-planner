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
   procedure), eleven units each, every one kept off by today's guard:
   - **Y**, the younger partner holding most: `Y75`, `Y90`, `Y100` (every wrapper re-held so the younger holds that share);
   - **E**, the elder holding more than 90%: `E95`, `E100`;
   - **S**, the two the same age, outside 40% to 60%: `S75`;
   - **G**, more than three years apart with other taxable income (a `£15,000` a year DB pension of the elder's from the
     state pension age): `G8` and `G12` (8 and 12 years apart, the elder holding 60%), and `G8Y75` (8 years apart, the
     younger holding 75%);
   - **R**, a shape the household plan refuses, so on today's route: `RY75` (the two people's pensions at different risks,
     the younger holding 75%) and `RWY75` (one retired today and the other still paid in the plan's first year, the younger
     holding 75%: a shape real couples often have, added before any unit ran).
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

## Amendment 1 (22 Nov, afternoon): the classes by route

Made after the dress rehearsal's read (every class passing, `results-couples-open-rehearsal.txt`) and its reviewer's FAIL
(`reviews/2026-11-22-read-couples-open-rehearsal.md`), answered in one fix (D81 (F)), before the registered test's design
review. Its BLOCKING 1: today's two-table route, which the app takes wherever the household plan refuses a plan's shape, was
read only by class R and at one holding (the younger 75%), while a class's pass would lift its reason on both routes; and
today's route is where `gapincome`'s own evidence was measured (step 5's shapes, `results-shapes-beside.txt`; the guard
test, `results-guard.txt`).

- **Each class opens its reason on its own route alone.** The household route: Y, E, S and G, as step 1 has them. Today's
  route: RY (step 1's R, its two units), RE, RS and RG. The change of default reads the household plan's refusal (its shape
  checks, `householdPlanFor`'s) before it lifts a reason, so a couple on today's route runs the solver outside today's guard
  only where a today's-route class opened for its reason, and keeps the app's rules otherwise.
- **Five units added to every couple**, both panels, each landed as the others on the same code (`couples-open-panel.mjs
  land --only`):
  - `G12P`: 12 years apart with the partner's (the younger's) `£15,000` a year DB pension, the elder holding 60%: G's reach
    to a partner's income, the case step 5's S061-dbpart read;
  - `RE100`, `RS75`, `RG8` and `RG12P`: E100, S75, G8 and G12P with the partner's pension one risk profile safer, which the
    household plan refuses (`REFUSALS.md`), so today's route.
- **The dress rehearsal's addendum**: the five on its four couples, 20 units, EXPLORATORY on the same 4,000 paths of seed 7002 a
  unit, read on their own by step 2's rule (`results-couples-open-addendum.txt`), before the registered test's design review.
  A class the addendum shows harmed is not registered: it goes to the maintainer with its units and keeps the app's rules.
- **ROUTE on the page's own context** (MINOR 2): ROUTE's paths run on `src/solverStrategy.js` `solvedContext` for the solved
  couple, the solved plan's own MPAA ages, where the rehearsal took arm A's (the two differ on 1 of its 44 units, where the
  reviewer found no path changed, and on 13 of the registered panel's); its configuration names it (`ctx`).
- **Spending over all paths** (MINOR 4): printed beside the rule for every unit and class with its interval, the units below
  beyond noise named; not a bar. Lifetime tax in pounds a path beside its percentage (MINOR 3).
- **The planted checks** (MINOR 5): part 2 on a gain within noise, part 3 at its bar, and each of the gate's refusals.
- **Step 4's order** (MINOR 6): the registered test runs on the code its panel was landed on (36e4d2a860b2), before step 4.
  Step 4 lands after the read as its own change of default, with the reviewer: a shape it moves from today's route onto the
  household's takes the household route's classes' outcomes by inference, said in its D-line; RWY75 reads today's route for
  that shape as the code stands.
- **Its time:** the registered panel 64 units (40 on the household route, 24 on today's); the pilot again on all 64 (its audit's
  stamp changed), the run's paths and budget from it; the addendum about half an hour on four cores.

## Amendment 2 (22 Nov, evening): the household route alone (D141)

The reviewer's second look at the rehearsal's read (`reviews/2026-11-22-read-couples-open-rehearsal-2.md`: FAIL, standing
after amendment 1's fix, D81 (F)) found that amendment 1 answered its BLOCKING 1 only in part. Today's two-table route was
measured below the app's rules on six couples of RY's, RE's and RG's reasons (`results-household-arm.txt`: S147-db@gap8,
S147-db@gap12, S061-dbpart@gap12, S061-dbpart@penB90, S061-dbpart@penA100; `results-guard.txt`: S149@gap12 with rent from
now). Each is kept off by today's guard, and no unit of any panel reads them, so a pass of RY, RE or RG could open today's
route for couples like them while a measured harm stands. The addendum's own RG12P, S061-dbpart's feature on other couples,
was above the app's rules on all four, so the harm goes with those couples, not with the feature.

The maintainer ruled between its two ways on (D141): "Household route only (Recommended)".
- **The registered test reads Y, E, S and G on the household route alone**, the registered panel's 40 household-route
  units; the 24 units on today's route are landed and not run.
- **A couple whose plan's shape the household plan refuses keeps today's guard** in every outcome (inside it, today's route
  as now; outside it, the app's rules) until the household plan takes its shape: step 4, three shapes, comes next; the other
  three (`REFUSALS.md`) need the household plan to hold more than one risk or salary path.
- **The change of default reads the household plan's refusal in the guard** (its shape checks written again in
  `src/couplesSwitch.js`, which has no imports, held equal to `householdPlanFor`'s by a test), so a class that opens lifts its
  reason only where the household plan takes the couple.
- **The registered run** is the 40 units on one read; about a third of amendment 1's 64-unit run.
- The rehearsal's and the addendum's figures stand; their write-ups are corrected as the reviewer gave them, unreviewed
  (D81 (F)).
