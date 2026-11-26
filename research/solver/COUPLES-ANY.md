# Every couple on the solver, the rest of the way: the plan (23 Nov, D145)

The maintainer, 23 Nov: "Go ahead, unlock enforcement. Work towards it handling any couple". Written before any of it is
built or run. Nothing here changes a default until its test reads and the reviewer has looked at the change (CHECKLIST 1, 2).
The plan before it is `COUPLES-OPEN.md` (D139 to D141), whose registered read opened Y, E, S and G on the household route
(D143, D144), and whose step 4 the household plan now takes (`STEP4-SHAPES.md`, D145).

## Where couples stand after step 4's change of default

A couple runs the solver in the new planner on one of two routes, or keeps the app's own rules (`src/couplesSwitch.js`
`coupleSolverOn`). What still keeps a couple off the household route:

| what | which couples | where they go today |
|---|---|---|
| `risks` | the two people's accounts of one wrapper at different risk levels (after each person's own limits) | inside the guard before D143, today's two-table route; outside it, the app's rules (the card's reason `shape`) |
| `limits` | the partner's own risk limits differing from the first person's | as `risks` |
| `salaries` | both paid, the two salaries growing at different rates | as `risks` |
| `noretire` | neither person retiring within the plan | as `risks` |
| `ages` | a plan running past the elder's 120th year | the app's rules (the card's reason `ages`) |

Today's two-table route is the one measured below the app's rules on six couples (`COUPLES-OPEN.md` amendment 2). The guard
keeps it only for couples the guard before D143 ran whose shape the household plan refuses.

## What the household route rests on

The household route solves one table on the household plan, but every figure the page shows comes from the engine running the
couple's own plan, each person with their own accounts, risks, pay and tax, under that table's moves
(`src/solver/household.js` `householdSinglePolicy`, `src/solverStrategy.js` `solvedContext`). So where the household plan is
only an approximation of a couple, its decisions may be less good, but no figure it shows is wrong. A shape can be taken where:

1. every move the table makes is one the engine can apply to each person; and
2. its decisions are no worse than the app's rules for such couples. Where the household plan is exact this follows from the
   tested classes by inference, as step 4's shapes do; where it is not exact it is measured (the test below).

## The ways in

### A. Different risks in one wrapper (`risks`) and the partner's own limits (`limits`)

*Amended on 24 Nov, before any of it was built: amendment 1, at the end, says how each person's tier is named and what
its check on a person's risk reads.*

- **Why it is refused now.** Each person's pension and ISA hold a ladder of tiers in the engine (`App.jsx` `buildContext`
  `tierProfiles`): their own risk first, then up to three steps safer, then every riskier tier. The household's move names a
  tier by its index for both people (`perOwner` self and partner alike). Where the two ladders differ, one index means two
  tiers, and the engine and the forward run refuse the move (`table move: tier k ... in the engine but ... in the table`).
- **The way.**
  - The household plan holds the wrapper at the more cautious of the two people's risks, each after their own limits, so the
    table never moves either person riskier than they chose.
  - The household's move carries, for each person, the index of the table's tier in that person's own ladder, by its name.
  - A tier the table can choose that one person's ladder lacks is taken at the nearest tier that person's ladder holds,
    never a riskier one. This happens only below the riskier person's third step down.
  - The partner's own limits reduce to this: after `lockedPlan` each person's wrapper is held at their own limit, the stricter
    for the household.
- **Not exact**, so tested:
  - the table sees one wrapper at one tier;
  - in the plan's first year the riskier person's wrapper moves onto the shared tier at the switch charge the engine takes,
    which the table does not see;
  - the riskier person is held at or below the cautious person's tier.
  - The other investments, cash and cash ISA carry no moves. Each person's grows at their own risk in the engine, and the
    table sees the merged account at the larger holding's risk.
- **Its checks**, each with its plant:
  - On the library's couples with each wrapper's risks planted apart (one to three steps, either way, and the limits
    likewise), every move of the household policy is accepted by the engine and the forward run, in step to a penny. No
    person's tier is ever riskier than their own locked risk.
  - With the risks alike, every household plan is the code before's, byte for byte.
  - The plants: the index not mapped (the engine refuses), a riskier tier allowed (a person moved above their own risk).

### B. Salaries growing at different rates (`salaries`)

- **What the salary does in the household plan.** Before the first retirement nothing is spent from the pots. The household's
  one salary sets the tax on savings income and the limits on pension contributions. After it, the later retiree's pay already
  goes year by year as take-home.
- **The way, exact as `growth` was.** The household's salary becomes a year-by-year schedule: the two salaries added, each
  grown at its own rate. The engine, the forward run and the exact model read it through `salaryAtYear`, as contributions
  read `contribByYear`.
- **It is an engine change** (`App.jsx`, `research/engine.mjs`, `src/solver/model.js`, `src/solver/fast.js` in lockstep). A
  plan without a schedule runs to the penny as before.
- **Its checks:**
  - the household plan's run equals the couple's own in every plan year before the first retirement, to a penny, where the two
    must agree;
  - no plan without a schedule changes (the library, every figure pinned);
  - its plant: the schedule read in one place and not the other (the engine and the forward run part).

### C. Nobody retiring within the plan (`noretire`)

- **What it is.** Both people work to the plan's end, so the household plan has no first retirement to build around.
- **The way.** First see what the single solver does with a person who works to the plan's end. If it solves such a plan,
  the household plan takes the couple with its first retirement past the plan's end: the salaries added (with B), the
  contributions added (step 4's `growth`), no take-home income.
- **Its check:** the household plan's run against the couple's own on such couples, as B's.
- **If the single solver cannot solve such a plan,** C stops here and comes back to the maintainer. Such a couple has no
  drawdown for the solver to plan.

### D. A plan past the elder's 120th year (`ages`)

- Not a shape of the couple. It is a plan asking for years past the model's range: every table, and the engine's ages, end at
  120.
- **Kept, proposed:** the card tells the user that ending the plan at the elder's 120th year brings it in. This is the
  maintainer's to overrule.

### E. Today's two-table route leaves the app

- Once A to C are taken, no couple the guard runs needs today's route.
- Every couple the guard runs goes on the household route. Today's route leaves the app's solve; its code stays for the
  research arms.
- This is a change of default, once A to C's classes have read.

## The test, by D141's rule

- **Its classes**, each on the household route (ROUTE) against the app's rules (APP), on the same paths:
  - W, step 4's shapes (contributions growing at different rates, a cash ISA paid into, a later retiree paid in plan year 0),
    taken today by inference and measured here; before its read, the page's route held to the audit's on W's units path
    for path (as `couples-open-port-identity.mjs` held D144's), which no arm could do for these shapes before this test (the
    reviewer on step 4's change of default, finding 4);
  - R, risks (the pension and the ISA one, two and three steps apart, each way);
  - L, limits (the partner's own differing);
  - P, pay (two salaries growing at different rates);
  - N, nobody retiring, only if C solves.
- **Each class's units** are made on four couples, at holdings inside the guard before D143 and outside it (as `COUPLES-OPEN.md`
  made Y, E, S and G's), each landed so APP survives `85 +/- 1%` on `1,000` paths of seed 7005.
- **First, a dress rehearsal** (EXPLORATORY, the tuning seed 7002, touched couples, `4,000` paths a unit), its rule committed
  before any unit runs. A class it shows harmed goes to the maintainer with its units before anything is registered.
- **Then the registered test** (`registrations/couples-any.md`):
  - couples no run has used (`held-out.mjs touchedAll` on the day);
  - a held-out seed, 7027, reserved in `check-prediction.mjs` for `couples-any*.md`;
  - its paths by D34 from the rehearsal's discordance;
  - its design review, pilot and budget, then the launch through the launcher, read once by its rule, the reviewer at the
    read, the deep review after.
- **The rule, for each class:** (1) no unit flagged by D34's harm rule, in whole paths; (2) the class's pooled survival change
  by path, its interval's lower end above nought; (3) the class's pooled spending on the paths both keep, the units weighted
  equally, its point not lower than `-0.05%`.
- **Outcomes:**
  - A class that passes opens by its own change of default, with the reviewer and B1's gate.
  - A class that fails keeps today's handling (today's route inside the guard before D143, the app's rules outside it) and
    goes to the maintainer with its units.
  - W failing comes back to the maintainer at once: it is on by default now.

## Order and time

1. Step 4's change of default, with the reviewer (in hand).
2. A, built off in code with its checks: a day.
3. B, the engine's salary schedule in lockstep: a day.
4. C: half a day, perhaps less.
5. The dress rehearsal: its panel, audit, read and planted checks half a day (step 8's and `COUPLES-OPEN.md`'s machinery
   reused), the landing an hour, the run about four hours on four cores, the read an hour.
6. The registered test: its panel and pilot half a day, its run about fifteen hours, its read and reviews half a day.
7. Each passing class's change of default, then E: half a day each.

Each overrun is reported to the maintainer.

## What it does not do

- The maintainer's own plan is never a unit or a fixture (CLAUDE.md): the panels are the library's couples and their shapes.
- No class opens on the dress rehearsal alone, and no default moves before the registered read and the reviewer.
- What a class's pass reaches beyond its units (other steps apart, other incomes, the estate aim, consent withdrawn, the dial's
  other positions, the speed mode, a couple entered younger first) is by inference, said in its D-line.
- The protected edits it needs (the seed's reservation; the tests that pin each change of default) are asked by name when they
  arise, unless an unlock in force covers them (D145).

## Amendment 1 (24 Nov, before A is built): how each person's tier is named where the two people's risks differ

Read before building A: the engine's ladders (`src/App.jsx` `buildContext` `tierProfiles`, its year's 7f), the forward run's
(`src/solver/fast.js` `tiersFor`, the same rule), the exact model's year (`src/solver/model.js`, which reads the engine's
ladders), and the household's move (`src/solver/household.js` `chooseHouseholdSingle`, `householdMoveOf`, and the page's
views in `src/solverCouple.js`, each giving both people the table's index). Two things in A as written change.

**1. A tier the table chooses that one person's ladder lacks.** A says it "is taken at the nearest tier that person's ladder
holds, never a riskier one". That cannot always hold.
- Tiers run from High Risk (0) to Cash Equivalents (5). A ladder is the wrapper's own risk, up to two or three steps safer,
  then, where all those steps exist, every riskier tier.
- Where the household holds a wrapper at the cautious risk c and the riskier person's own risk is r < c, the household's
  safest steps can lie past the riskier person's safest.
- Example: r High, c Medium/High. The household can choose Low Risk, which the riskier person's ladder lacks. Its nearest
  tier in that ladder, Medium/Low, is riskier than the table's choice.

The way, exact for the engine:
- **Each person's ladder gains the household's missing tiers.** In a couple whose two people's accounts of one wrapper differ
  in risk, each person's ladder for that wrapper is their own, with the household's tiers it lacks added at its end (the
  household's ladder: the cautious risk's, by the same rule, with as many steps below as both wrappers' cautious risks
  allow).
  - Their own risk stays index 0, the tier they hold at the start. Every index of their own ladder means what it meant.
  - So outside the household route (today's two-table route, the app's own rules) nothing a table asks moves.
  - The forward run and the exact model read the same ladders. The model reads the engine's; the forward run solves the
    household plan, whose ladder is the household's.
- **The household's move names its tier.** Each person takes that name's index in their own ladder, so the engine's name
  check holds by construction.
- **The riskier person's first move is a switch.** In the plan's first year, moving the riskier person onto the shared tier
  is a change from their own risk. The engine charges it at the switch charge, as it charges any change of tier, and the
  table, solved on the household plan, does not see it.
- **The tier the table reads as held** is the name the cautious person holds, at its index in the household's ladder:
  index 0 at the start, and the shared tier once the household has moved.
- **Where nothing tiers, no mapping is needed.** With consent to change risk withdrawn (the table has no tier state), each
  person holds their own risk throughout, the riskier person's wrapper growing at it while the table sees the cautious.

**2. A person's tier against their own risk.** A's check, "no person's tier is ever riskier than their own locked risk",
holds only where the solve may not go riskier than its risk: where a ceiling binds or consent to change risk is withdrawn
(`lockedPlan`'s `riskAbove: false`). With consent given, a single's table may choose a tier riskier than its own wherever
the tier above is offered (D16), its ladder running on to High Risk. So may the household's, past the cautious risk, and
under it the riskier person can be moved riskier than their own risk, as a single can.
- So the check is: no person's tier is ever riskier than their own ceiling.
- Where `riskAbove` is false, no person's tier is ever riskier than their own locked risk.
- The household plan's ceiling for a wrapper is the stricter of the two people's. Its `riskAbove` is false wherever either
  person's binds, as a single's is wherever one of theirs binds.

Its checks, beside A's as written, each with its plant:
- **The moves.** On the library's couples with the pension's and the ISA's risks planted apart (one to three steps, either
  way): every person's tier is a tier of their own ladder; every move the table makes is the engine's, in step with the
  exact model to a penny; and with ceilings, no person's tier is ever riskier than their ceiling.
- **The switch charge.** The first year's switch is charged on the riskier person's wrapper, and on no wrapper whose two risks
  are alike.
- **Identity.** With the risks alike, every ladder and every household plan is the code before's, byte for byte. With them
  apart, every run of today's two-table route and of the app's own rules is the code before's on every path.
- **Plants:** the household's index given to both people (the engine refuses, as today); the added tiers left off (the name
  check refuses the household's safest tiers); the riskier person's first move left at their own tier (no switch charged,
  and their wrapper not on the shared tier); the household's ceiling the first person's alone.

## Amendment 2 (24 Nov, before any unit runs): the dress rehearsal's panel, arms and reading

A, B and C are built off in code (STATE.md section 5). The dress rehearsal of the test above, EXPLORATORY, on the tuning seed
7002, `4,000` paths a unit, on touched couples. Nothing it reads changes a default.

**Its couples.** COUPLES-OPEN's four (S025 and S273 of the library, S351F and S357F of the younger cohort), with S227 (the
library's, touched by the household line) in S025's place for the units where both people work, S025 being retired.

**Its units**, each at two holdings: the library's own, the elder holding `60%` (inside the guard before D143), and the
younger holding `75%` (outside it, Y's).
- W, step 4's shapes, taken by default since D146:
  - Wg: both working at least three more years, each paying `£3,000` a year into their ISA, the first person's growing at
    `3%` a year and the partner's flat;
  - Wc: both working at least three more years, each paying `£2,000` a year into a cash ISA;
  - W0: the first person retired today and the partner paid and saving in the plan's first year (COUPLES-OPEN's
    `laterWorking`).
- R, A's risks, as the test above names them: the pension, or the ISA, one, two and three profiles apart, each way (the first
  person's the safer, or the partner's), the other person's account left at the library's: twelve kinds.
- L, A's limits: the first person's pension ceiling Medium/High Risk, the partner's own Medium Risk.
- P, B's pay: both paid and working at least five more years, their salaries growing at `2%` and `-1%` a year.
- N, C's nobody retiring: both working past the plan's end.

Each is landed so APP survives `85 +/- 1%` on `1,000` paths of seed 7005 (D4's procedure), but N cannot be. Nothing is
spent from the pots before the first retirement (the engine's year spends from it), so where nobody retires both arms survive
every path at any target. N's units therefore run at the library's own target, and are reported on the pot and the tax, not
read by the rule. Whether C opens by inference from its exactness, or not at all, goes to the maintainer with the read.

The panel: 144 units (W 24, R 96, L 8, P 8, N 8). The kinds where both work (Wg, Wc, P, N) are on S227, S273, S351F and S357F;
the rest (W0, R, L) on S025, S273, S351F and S357F.

Every unit is checked before it runs. The household plan takes it with its class's shape named, and without it refuses it
for that shape's reason, except W's, which the app's own shapes take. The app's guard (`src/couplesSwitch.js`) keeps R, L, P
and N off the household route for their shape, and puts W's on it.

The plan handed to the solvers is the one the household line's audits hand theirs (`shapes-panel.mjs` `solverPlanOf`: arm A's
policy, the app's aims), with the plan's own locks kept, as the page hands its solve. The household line's audits handed the
solver no locks (`audit-couples.mjs` `solverPlan`), which none of their units set. L's units set the two people's limits, so
without them L would run with no limits at all. On a plan with no locks the solvers' plan is the old one, byte for byte
(`couples-any-panel.mjs`'s planted checks).

**Its arms**, each by the engine on the same paths, at estate weight `0.02` and the app's points:
- APP, arm A, the app's own rules;
- ROUTE, the household route taking every shape, the page's own cut and assembly (`src/solverCouple.js` `householdCut` and
  `householdSolved` with `takeShapes` step 4's three, 'risks', 'limits', 'salaries' and 'noretire').

**Before the read**, W's identity (the test above, class W): on every W unit, the app's own route (the cut, the table and the
assembly as the page's worker makes them, at the app's own shapes) held to the rehearsal's ROUTE path for path, with the
guard on (`couples-any-port-identity.mjs`, `results-couples-any-port-identity.txt`, naming the run's stamp). Where the
younger holds `75%` the guard puts the couple on the household route alone, lifting Y (D144). At the library's holdings,
inside the guard before D143, it names no route of its own and lifts nothing. The client then solves the couple at the
couples' default form (`src/solverClient.js`, `APP_COUPLE.household`), on the household route wherever the household plan
takes its shape, which the cut at the app's own shapes shows. Without it W is not read. (Corrected 24 Nov, before any unit
ran: the smoke showed the library's holdings naming no route, which the first wording missed.)

**Its reading**, for each class W, R, L and P, by D141's rule as the test above states it:
1. no unit flagged by D34's harm rule, in whole paths;
2. the class's pooled survival change by path, its interval's lower end above nought;
3. the class's pooled spending on the paths both keep, the units weighted equally, its point not below `-0.05%`.

**Its outcomes.** A class that passes goes to the registered test. A class that fails goes to the maintainer with its units.
W failing goes to the maintainer at once.

## Amendment 3 (26 Nov, D150, before any of it is built): every plan and every option on the solver

The maintainer, on C and the classic planner: "We need all options be able to be run". Read as every plan the new planner
takes, and every option its cards offer, solved, none left on the app's rules. Two kinds of couple are left on them today:
C's (nobody retiring within the plan) and D's (a plan past the elder's 120th year). Both open, each without a new test against
the app's rules, as below. The classic planner is not retired by this.

### C opens by inference

- **Why no test against the app's rules.** It cannot read one: nothing is spent from the pots before the first retirement, so
  both arms survive every path at any target (amendment 2, N's units).
- **What it rests on.** Its exactness: the household's salary and contributions are the couple's two added, in every year, to a
  penny (`household-salaries.test.mjs` check 4). Beside it, the dress rehearsal's N units: the capped pot higher under ROUTE on
  all eight, the tax higher on the younger cohort's four, traced to cash invested, not a defect
  (`results-couples-any-tax-trace.txt`).

### D: the solver's horizon past the elder's 120th year

- **What breaks today.** The plan's end age is the first person's, at most 120. A partner older than the first person can pass
  120 within the plan, and the engine runs the plan as entered to its end with the partner past 120. The household route
  solves the couple elder first, on its mirror (`src/coupleOrder.js` `otherOrder`), whose end age is then past 120.
  `buildContext` clamps it to 120, so the mirror has fewer years than the plan and the solve fails. The guard therefore keeps
  such a couple on the app's rules (`horizonFits`, the card's reason `ages`).
  - Measured (EXPLORATORY, plans only): the first person 50, the plan ending at 95. With the partner 80, the plan as entered
    runs 45 years and its mirror 40. With the partner 75 or younger, both run 45.
- **The way.** A plan the solver derives from the plan as entered (the mirror, and the household and single plans cut from it)
  keeps the plan's own years where its end age passes 120. `buildContext` lifts its 120 ceiling on the end age for such a
  derived plan alone, marked as derived. A plan as entered keeps the ceiling, so every plan within it is the same to the bit.
  - Nothing in the engine's rules reads an age past 120 differently from 120. The state pension, the pension rules from 75 and
    the dial's age weights all continue.
- **Its test of the class** (a new test):
  - **The variants:** the library's couples with the partner made older and entered second, so that their age at the plan's
    end passes 120, at more than one gap.
  - **Check 1:** the mirror runs the plan's whole years.
  - **Check 2:** every year's flows (pay, incomes, bands, the state pension) are the plan as entered's, as
    `couple-horizon.test.mjs` holds for couples within the ceiling.
  - **Check 3:** the household's table covers the plan, the solve completes, and its figures are shown back as entered.
  - **Check 4, the identity:** every plan within the ceiling the same to the bit (the library's 420 plans and their mirrors).
  - **Its plants:** the ceiling kept for a derived plan (the solve fails), and the mark dropped from the cut (the plans part).
- **By inference only.** No couple past 120 is tested against the app's rules. It takes the household route's outcomes as
  any couple does.
- **Built off in code (26 Nov).** The mirror is marked `derivedEnd` where its end age passes 120 (`src/coupleOrder.js`), and
  `buildContext` keeps such a plan's years (`src/App.jsx`). The guard still keeps such a couple on the app's rules.
  - **Its test:** `research/tests/couple-past120.test.mjs` (the full tier until the unlock), ALL PASS. Its plants 'nomark'
    and 'markall' each fail exactly their checks (`results-couple-past120.txt`).
  - **The solver's code id** moves to 3fb20e2156f8 (`household.test.mjs` (7d)). The e3pcls pin is unchanged: no file
    under `src/solver` moved.

### The change of default (one commit, for C and D together)

- **The code.**
  - The household plan takes `noretire` (`src/solverSettings.js` `APP_COUPLE.takeShapes`), and the guard reads it as taken
    (`HOUSEHOLD_TAKES`).
  - The guard's age cap is lifted.
  - The coverage line says the solver plans for one person or for a couple: no shape is left that it refuses.
  - The decided-defaults block's `couples` entry changes with it.
- **The tests.**
  - The fast-tier tests of the couples' guard and defaults change with it, under the maintainer's unlock asked by name (D130):
    `couple-default.test.mjs`, `couple-shape.test.mjs`, `couple-limits-card.test.mjs` (its couple kept off for nobody
    retiring), `couple-swap.test.mjs` (its couple kept off past 120) and `couple-horizon.test.mjs` (its grid read within the
    ceiling). D's new test joins the fast tier's joining list (`research/tests/run-all.mjs`, under the same unlock).
  - `household-client.test.mjs` checks 7 and 9 take a plant in place of the refused shape, since none is left.
  - The planner harness's check 19 (g) is solved on the household route.
  - The two checks that need a couple kept off (`solver-config-ui.cjs` check 3, `solver-strategy-ui.cjs` check 5) take
    one under the guard before this change, set from a harness build's plant.
- **Then** the reviewer on the change of default, B1's gate and the nineteenth batch.
- **What becomes unreachable.** Today's two-table route is then reached by no couple the app solves (E), so the client's
  fallback to it is reached by none. Its code stays, for the research arms.
- **Built (26 Nov), as above but for these, each said to the reviewer on the change of default:**
  - `research/tests/run-all.mjs` is not edited: the maintainer's word was "Yes", not the hook's "unlock enforcement" (D151),
    so `couple-past120.test.mjs` stays in the full tier.
  - The planner harness's (g) keeps the client's fallback, today's route, under test: it runs on a preview built with the cut
    before this change (the plant 'cutbeforeall', `src/solverCouple.js`, set from that build's `PLANNER_PLANT`), where the
    household plan refuses nobody retiring. So the plants 'couplehalf', 'coupleage' and 'workernotie', which act on today's
    route alone, still fail check 19. The two couples with nobody retiring that check 19 showed the 'shape' card (re-held
    25/75, and 12 years apart with other taxable income) are solved on the household route instead.
  - Check 19 gains (h): a couple whose elder would pass 120 before the plan ends, solved on its mirror. Its plant
    'beforeall' (the guard before this change) shows the cards again.
  - The harness's plant 'nogapguard' is retired: with no shape refused, its couple is solved the same way with the plant or
    without it. `couple-default.test.mjs` checks 8 and 9 still hold the guard's own answer.
  - `household-client.test.mjs` check 9 passes unchanged; check 7 takes the cut's plant 'cutbeforeall'.
  - The tests that read the refused shape read it under the rollback, the plants 'beforeall' (the guard) and 'cutbeforeall'
    (the cut), so the guard's refusal code stays held to the cut's for the rollback.
