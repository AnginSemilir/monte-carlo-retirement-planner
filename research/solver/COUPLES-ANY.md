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
