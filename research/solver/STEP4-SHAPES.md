# Step 4: the household plan takes three shapes it refuses (built off in code; its change of default to come)

`COUPLES-OPEN.md` step 4 (D139's plan; D141: "until the household plan takes its shape: step 4, three shapes, comes
next"). Written on 23 Nov before any build (aea8eed8). Built the same evening, off in code; what was built and what its
checks found is in "As built" at the end. The three shapes `REFUSALS.md` marks "Probably" are built into the household
plan, off in code, each with a check of its class against the engine and its plant. Then, as its own change of default with
the reviewer, the guard stops keeping such couples off. D144 lists it among what the opened classes reach by inference
only: "a shape the household plan later takes (`COUPLES-OPEN.md` step 4)".

## Why off in code first

The client solves a couple on the household route where `householdPlanFor` takes it. Inside the guard before D143 it falls
back to today's two-table route where the plan refuses its shape (D136; `household-client.test.mjs` check 7). So a refusal
lifted in `householdPlanFor` would move such couples' route at once. Each shape is therefore taken only under an option,
`opts.takeShapes`, until its change of default. With the option unset, every household plan is the code before's, byte for
byte, which a check holds.

## The three shapes

1. **The two people's contributions to one wrapper growing at different rates** (both paying in).
   - The engine's `contribAtYear` reads an account's `contribByYear` where it has one, and so do the solver's forward run
     (`src/solver/fast.js`) and its exact model (`model.js`).
   - So the merged account carries a schedule: in each plan year before the first retirement, the two people's
     `contribAtYear` added. From the first retirement, the later retiree's contributions stay the dated deposits they are
     today.
   - This holds for every wrapper, pensions included. A contribution stays a regular contribution, so the household's
     taxable pay is reduced by it as before, and nothing turns into a deposit. The relief question `REFUSALS.md` raised for
     the deposit route does not arise.
   - Where the two rates are the same, nothing changes; the schedule is used only for the shape.
   - **Its check:** in every plan year, each wrapper's contribution in the household plan's context equals the couple's two
     people's added. Each person is counted while they work, and from the first retirement the later retiree's comes as
     deposits.
2. **A cash ISA subscription** (either person paying into a cash ISA each year).
   - The engine shelters, each year a person works, the least of: their subscription, their cash ISA cap at their own age,
     their ISA allowance left after their S&S ISA contributions, and their cash not yet sheltered.
   - The household plan adds the two subscriptions on its cash ISA account. Its cash ISA allowances and ISA allowance are
     already doubled (`DOUBLED`).
   - That is exact while no one person's own limit binds: their cap, their ISA room, their cash, and the cap's age test,
     which the household person reads at the first person's age.
   - **Its check:** on each plan year and path of the engine's run of the couple, the household plan's sheltered amount
     against the couple's two people's added. Exact in every year where none of the four binds, and counted and sized where
     one does.
3. **A later retiree paid or saving in plan year 0** (one person retired and the other still working in the plan's first,
   part year).
   - The engine pro-rates year 0: pay, contributions and incomes on the year's fraction, the allowance whole.
   - The household plan prices that year's take-home on the pro-rated pay, and dates that year's deposits in year 0 at the
     contribution times the fraction. The years after go on as now.
   - **Its check:** in plan year 0, the household plan's tax-free take-home and its deposits against the engine's working
     person's take-home and contributions, to a penny; from plan year 1, the code before's.

## The checks' class and plants

- **The class:** the library's 210 couples, each given the shape as a variant, as `household-pricing.test.mjs` gives its
  classes:
  - each person's ISA contributions at their own growth (one rising 3% a year, one flat);
  - each person's cash ISA subscription;
  - the first person retired at the start while the partner works on, valued in July.
  A plan refused for another shape is left out, and its count is printed.
- **The identity:** with the option unset, every household plan of the library's couples, the registered panel's and step
  8's panel is the code before's, byte for byte.
- **The plants** (`HOUSE.plant`): 'shapesched' (the schedule's later retiree's years left in), 'cashisasum' (one person's
  subscription alone), 'year0whole' (year 0 priced on the whole year's pay). Each must fail exactly its check.

## Then the change of default (its own, with the reviewer)

- `src/couplesSwitch.js` `householdShapeOf`: the three shapes no longer refused, behind a constant set at the change.
- `APP_COUPLE`: the option on.
- `couple-shape.test.mjs` (protected; its unlock asked by name): the guard's shapes held equal to the household plan's again.
- The decided-defaults block.
- The app's route held to the tested arm on such couples.
- The reviewer on the change of default, then B1's gate.
- Its D-line says these shapes take the household route's classes' outcomes by inference (`COUPLES-OPEN.md` amendment 1,
  MINOR 6).

## Box

- The build and its checks: a day, from 23 Nov evening.
- The change of default: half a day.
- Each overrun is reported to the maintainer.

## As built (23 Nov, evening)

- **The option.** `householdPlanFor` takes the shapes `TAKE_SHAPES` ('growth', 'cashisa', 'year0') only where
  `opts.takeShapes` names them (`true` for all three); nothing in the app passes it.
- **The identity.** With the option unset, every household plan is the code before's, byte for byte, refusals included:
  972 asked for across every panel run on the household route and the library's couples, both orders, 96 refused by
  both, none differing (`household-shapes-identity.mjs`, `results-household-shapes-identity.txt`).
- **The checks** (`research/tests/household-shapes.test.mjs`, in the full tier for now; `results-household-shapes.txt`):
  1. The option naming every shape changes none of the 420 library plans that have none of them.
  2. **'growth':** 180 plans refused today are taken (90 each for S&S ISAs and pensions). Over 9,240 plan years, no year
     is apart before the first retirement or after it, to a penny.
  3. **'year0':** 120 plans refused today are taken, each with plan year 0 a fraction (0.5014) of a year. The year-0
     take-home equals the engine's own working take-home (`E.stepYear`) to a penny, as do the year's deposits and those
     of the years after.
  4. **'cashisa':** 180 plans refused today are taken (even and uneven subscriptions).
     - The subscription is the two added, and the cash contribution matches in each of 2,880 working years.
     - The subscription is equal in every one of the 1,495 years where no one person's own limit binds.
     - Where one binds (1,385 years, all in the uneven variant, the first person's own cash ISA cap), the household's
       doubled cap lets the household subscribe more, by as much as £7,428.38 a year.
     - From the first retirement the household plan makes no subscription for the later retiree (540 years, £1,890,000
       in all). Their money lands in its cash, as the engine's does. Whether the engine's year-end step shelters it within
       the household's own cap is not measured.
- **The plants:** 'shapesched' fails checks 2 and 4 (shape 2 carries its cash on the same schedule), 'year0whole' check 3,
  and 'cashisasum' check 4: each exactly its checks.
- **What the change of default would carry,** said in its D-line: shapes 1 and 3 exact on what their checks measure; shape
  2 exact before the first retirement while no one person's own cash ISA limit binds. Past that, the household's doubled
  cap shelters more than the two people's own caps allow, and after the first retirement the later retiree's
  subscriptions are not made, with their sheltering left to the year-end step, unmeasured.
- **The change of default asks, by name, for these protected edits:**
  - `couple-shape.test.mjs`, the guard's shapes held equal to the household plan's again;
  - `couple-default.test.mjs`, the decided-defaults block's new key;
  - `research/tests/run-all.mjs`, household-shapes joining the fast tier's joining list.

