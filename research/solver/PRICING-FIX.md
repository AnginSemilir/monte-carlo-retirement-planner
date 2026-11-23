# The household plan's price of a partner's income: the fix D143 orders (EXPLORATORY)

The design was written on 23 Nov before any build or run (ceb5e223). This revision adds what was built, what its test
found, and the read's rule. Its rule and machinery are committed before any unit of the read runs.

D143 orders this fix after the change of default (D144): "the household plan's tax on a partner's state pension fixed after
it as its own change (each person's state pension and other income against their own allowance, with its test of the class
and its plant, read EXPLORATORY on the trade test's units and S191-90 before it becomes a default)". Until its read it changes
no default, gate or candidate. After it, the outcomes below say what happens.

## The defect

- **The household plan** (`src/solver/household.js` `householdPlanFor`, the form 'pensionsPA', the couples' default since
  D136) moves the partner's state pension and every partner income onto the household person as taxable income. It taxes
  the household's year on one schedule whose allowance and bands are `k` times one person's (`k = 1/s`, `s` the larger
  person's share of the two pensions at the plan's start).
- **The engine** taxes each person on their own income, against their own allowance and bands. Each person funds half of a
  household's year (the even split), and each draws their own pension only up to their own allowance or band before the
  next step.
- **So** where both people's state pensions sit near the allowance, the couple uses close to two allowances, but the
  household plan prices the year against `k` of them (`k` near 1 for an uneven couple). A worked year at basic rate: `s`
  0.75, two state pensions of 11,500, and an allowance of 12,570. The table taxes a year with no draw at about 1,248, where
  the engine taxes it at nothing.
- **Measured** (the couples trade, `results-couples-trade.txt`, EXPLORATORY): on S037's Y90, Y100, E95 and E100, the
  household plan's spending on the paths both keep falls short of Y75's by 369 a year on average. With the allowance
  doubled (PA2) it falls short by 55. PA2 is not the fix: it doubles the allowance for every income and every draw, and step
  8's arm read set it aside for harm on S191-90 (`results-household-arm.txt`).

## The fix, candidate A (built, off unless named: the form 'pensionsPAown')

- **The partner's fixed income.** This is the partner's taxable income that the plan fixes: their state pension from the
  state pension age, and each other taxable income of theirs not typed as earnings.
  - Each plan year, as the engine counts it, it is taxed alone at one person's rules.
  - It is stacked on the partner's taxable pay that year (the engine's, after a sacrifice into their pension) and on their
    earnings.
  - The household person receives it net of that tax, as one dated tax-free income a year, as the household plan already
    hands it a later retiree's take-home.
  - In plan year 0 it is taken on the year's fraction, with the allowance whole, as the engine does.
- **What stays where it was.**
  - The partner's pay stays where it was: the household's salary while both work, and the later retiree's take-home after.
  - An income of theirs typed as earnings stays on the household person, as before. Its relevant earnings and its move
    with the retirement age are kept.
  - The first person's fixed income stays on the household's schedule, whose allowance is `k` times one person's.
- **The cash** the household plan sees is the same as before; only its tax moves.
- **What it leaves:** the household's schedule still prices the draws as `k` times the binding person's, so a partner's
  draws meet an allowance their own fixed income has used up. The error is largest where the pensions are split evenly and
  the partner alone has a state pension.
- **If A falls short,** there are two next steps.
  - B: the household's allowance a year set to `k x PA - (k - 1) x F_A(t)` (the binding person's threshold exactly; an
    allowance that varies by year in the table's tax).
  - C: two schedules in the table's forward run, with the year's draw split as the engine funds it (exact for the even
    split; `src/solver/fast.js` and `model.js` in lockstep).

## Found by its test: the years of a moved income (fixed with it)

- **The defect.** The engine counts every income from its owner's retirement at the earliest (`research/engine.mjs`
  `incomeFloor`). The household plan moved each income onto the household person with its own ages, and the household
  person's floor is the household's first retirement. So where the other person retires first, the household plan counted
  such an income from earlier than the engine.
- **The fix.** Each moved income now starts at its owner's retirement at the earliest, as the engine counts it. The plant
  'incfloor' is the move before the fix.
- **Its pattern search** is `household-timing.mjs` (`results-household-timing.txt`): 788 household plans, from every panel
  run on the household route and from the library's couples, each as handed over and on its mirror. None was counted in
  other years before the fix, and none is after it, so no figure of any read moves.
- **It is shipped** with the next batch on B1's gate, whatever the read below gives.

## The test of the class (`research/tests/household-pricing.test.mjs`, in the fast tier's joining list)

- **The class** is the library's 210 couples, re-held 90/10 and 10/90 (`k` 10/9, below 1.2, as on the couples trade's Y90
  and E95 units), each with a partner's state pension, in seven variants:
  - as entered;
  - the partner's DB pension from the state pension age;
  - both given one;
  - the partner's DB pension from now, with the plan valued in July;
  - the same with the partner retiring now;
  - the partner's DB pension with earnings;
  - the partner working past the state pension age.
- **Each plan year** is read with the fixed incomes alone and no draw.
- **The checks:**
  1. As now, the defect: the household plan taxes the fixed incomes above the engine's two-person tax in some year.
  2. Under the form, the cash is as now less the partner's own tax, in every plan year. Each branch is reached: the partner
     taxed on their own income, plan year 0 on a fraction, the partner working, and their earnings.
  3. Under the form, in every year both are retired, the household's tax plus the partner's own, less the engine's, is
     what stays on the household's schedule. That is nought where the first person's fixed income is within one allowance.
  4. As now, each moved income is counted in the engine's years.
- **The plants:** 'partsp' fails checks 2 and 3; 'incfloor' fails checks 2 and 4 (`results-household-pricing.txt`).

## The read (EXPLORATORY, seed 7002)

- **Code and settings.**
  - The code at the commit that adds this rule, code id 7aee4099f6dc.
  - APP and ROUTE as the couples read and the couples trade ran them: APP `ef459a5c8ccb`, ROUTE `35ee3a2dc6ad`.
  - FIX is ROUTE at the form 'pensionsPAown': `0f0c68c18ed3`.
- **Paths:** seed 7002, the tuning seed, 4,000 paths a unit, at the app's 45 points and estate weight 0.02.
- **Units (14):**
  - the couples trade's 13 from the registered panel: S037's ten distinct household-route units, and the controls
    S119-E100, S199-E100 and S279-E100;
  - S191-90, the share rules' panel's S191 held 90/10. It is on the household route today, with `k` 1.11 and a partner's
    state pension.
- **Arms:** each is run by the engine on the same paths, every arm of a unit in one process (`audit-pricing-fix.mjs`).
- **Checks.** A failure ends the unit. Check 1 or 2 failing on the thirteen is a STOP for the whole read.
  - Before them, on the thirteen, the registered panel's own premise: arm A's pick is the landing's, and the unit is one
    the guard before D143 kept off, for its class's reason. It is read as the registered test read it, on the guard's
    plant 'noopen', since D144 has opened these classes. The smoke found the premise read on today's guard at first; this
    was fixed before any unit of the read ran.
  1. On the thirteen, ROUTE's household table, solved again, carries the registered read's digest and the pilot's, and the
     app's guard today (D144) opens the unit on the household route. On S191-90, the unit is in the class.
  2. On the thirteen, APP and ROUTE equal the couples trade's arrays on all 4,000 paths, every key, so ROUTE's shortfall is
     the trade's. On S191-90, they are set beside the household arm read's, deciding nothing.
  3. FIX's `k` and allowance are ROUTE's, and FIX's household plan is ROUTE's but for its incomes.
  4. Each arm's first 200 paths match `E.runTrial`.
- **The rule.** `reduce-pricing-fix.mjs` reads the test once, when all 14 units are in, behind its gate: every unit
  present, one stamp, seed 7002, 4,000 paths at 45 points, each arm's configuration, every check recorded, and the logs'
  stamps.
  - **THE SHORTFALL CLOSES.** It is measured as the couples trade measured ROUTE's.
    - A unit's figure for an arm is its spending on the paths it and APP both keep, less APP's, in pounds a year.
    - An arm's shortfall is the mean, over Y90, Y100, E95 and E100, of its Y75 figure less the unit's.
    - It closes when FIX's shortfall is at most 0.5 of ROUTE's.
    - If ROUTE's shortfall is not above nought, that is a STOP: check 2 holds ROUTE to the trade's, whose shortfall was.
  - **NO HARM.** FIX is measured against ROUTE.
    - D34 flags no unit, in whole paths, S191-90 among them.
    - The pooled survival change over the 14, the units weighted equally, has its interval by path with its lower end
      above `-0.1` points.
  - **Outcomes:** both parts give FIX HOLDS; otherwise FIX DOES NOT HOLD.
  - **Beside, deciding nothing:**
    - each unit's survival, and FIX less ROUTE in paths saved and lost;
    - spending on the paths both keep, FIX against ROUTE and each against APP;
    - each unit's shortfall;
    - the capped pot;
    - lifetime tax;
    - the worst fifth;
    - the checks' lines.
- **What each outcome changes.**
  - **FIX HOLDS.** The fix becomes the couples' default as D143 orders ("before it becomes a default"):
    - `APP_COUPLE.household` becomes 'pensionsPAown', with the decided-defaults block and `couple-default.test.mjs`, under
      D143's unlock;
    - the app's route is held to FIX's arm on these units;
    - the reviewer comes in on the change of default, then B1's gate;
    - the read and the change go to the maintainer.
  - **FIX DOES NOT HOLD.** It goes back to the maintainer with the figures, and B or C is offered. Nothing changes.
  - **A STOP.** It goes back to the maintainer.
  - **In every case,** the timing fix stands.
- **Box:**
  - the build: half a day from 23 Nov 13:30 UK;
  - the run: about 40 minutes on four cores;
  - the read: half a day.
