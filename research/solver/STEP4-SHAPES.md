# Step 4: the household plan takes three shapes it refuses (DRAFT, nothing built)

`COUPLES-OPEN.md` step 4 (D139's plan; D141: "until the household plan takes its shape: step 4, three shapes, comes
next"). Written on 23 Nov before any build. The three shapes `REFUSALS.md` marks "Probably" are built into the household
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
