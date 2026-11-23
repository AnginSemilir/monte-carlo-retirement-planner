# The household plan's price of a partner's income: the fix D143 orders (EXPLORATORY)

DRAFT, written on 23 Nov before any build or run. D143 orders it after the change of default (D144): the household plan's
tax on a partner's state pension fixed as its own change, each person's state pension and other income against their own
allowance, with its test of the class and its plant, read EXPLORATORY on the couples trade's units and S191-90 before it
becomes a default. It changes no default, gate or candidate until that read, by its rule below.

## The defect

- **The household plan** (`src/solver/household.js` `householdPlanFor`, the form 'pensionsPA', the couples' default since
  D136) moves the partner's state pension and every partner income onto the household person as taxable income, and taxes
  the household's year on one schedule whose allowance and bands are `k` times one person's (`k = 1/s`, `s` the larger
  person's share of the two pensions at the plan's start).
- **The engine** taxes each person on their own income, each against their own allowance and bands. A household's year is
  funded half by each person (the even split, `research/engine.mjs` the joint move), each drawing their own pension only up
  to their own allowance or band before the next step.
- **So** where both people's state pensions sit near the allowance, the couple uses close to two allowances, and the
  household plan prices the year against `k` of them (`k` near 1 for an uneven couple). A worked year at basic rate
  (`s` 0.75, two state pensions of 11,500, an allowance of 12,570): the table taxes a year with no draw at about 1,248 that
  the engine taxes at nothing.
- **Measured** (the couples trade, `results-couples-trade.txt`, EXPLORATORY): on S037's Y90, Y100, E95 and E100 the household
  plan's spending on the paths both keep falls short of Y75's by 369 a year on average; with the allowance doubled (PA2) by
  55. PA2 is not the fix: it doubles the allowance for every income and every draw, and step 8's arm read set it aside for
  harm on S191-90 (`results-household-arm.txt`).

## The fix, candidate A (the literal reading of D143)

- The partner's own taxable income that the plan fixes (their state pension from their state pension age, and each other
  income they own) is taxed alone against the partner's own allowance and bands, year by year, at the engine's own rules for
  one person; the household person receives it as tax-free income net of that tax, one dated income a year, as the household
  plan already hands it a later retiree's take-home.
- The first person's fixed income stays in the household's schedule, whose allowance is `k` times one person's, at least
  their own.
- The cash the household plan sees is the same as before; only its tax moves.
- **What it leaves:** the household's schedule still prices the draws as `k` times the binding person's, so a partner's
  draws meet an allowance their own fixed income has used up; the error is largest where the pensions are split evenly and
  the partner alone has a state pension.
- **If A falls short:** B, the household's allowance a year `k x PA - (k - 1) x F_A(t)` (the binding person's threshold
  exactly; an allowance that varies by year in the table's tax); C, two schedules in the table's forward run, the year's
  draw split as the engine funds it (exact for the even split; `src/solver/fast.js` and `model.js` in lockstep).

## The test of the class (built with A, before its read)

- On the library's couples whose `k` is below 1.2 and whose partner has a state pension: on each year of the engine's run of
  the solved household on a few paths, the engine's two-person tax against the household table's tax of the same year's
  income and draw, as now and under A. The gap a year, its mean and its worst.
- Its plant: the partner's state pension put back onto the household person, giving the gap as now.

## The read (EXPLORATORY, seed 7002, the couples trade's 13 units and S191-90, 4,000 paths)

- **Arms:** ROUTE (the household plan as now), FIX (candidate A); APP beside.
- **The rule**, committed with the read's machinery before any unit runs:
  - THE SHORTFALL CLOSES: FIX's shortfall below Y75, measured as the couples trade measured ROUTE's, at most half of ROUTE's;
  - NO HARM: D34 flags FIX against ROUTE on no unit, in whole paths, S191-90 among them; FIX less ROUTE's pooled survival
    not below `-0.1` points, by path.
- **Outcomes:** both hold, FIX HOLDS: candidate A becomes the couples' default by a change of default, with the reviewer on
  it and B1's gate. Otherwise it goes back to the maintainer with the figures, and B or C is offered.
- **Box:** half a day to build A and its test, two hours to run, half a day to read.
