# The couples trade: the deep review's one test (EXPLORATORY)

Written and committed on 23 Nov, before any unit runs. It is the test the deep review of the guard's own units proposes
(`reviews/2026-11-22-deep-couples-open.md`, section 3). It is EXPLORATORY: it changes no default, no gate and nothing in
the candidate (CHECKLIST 1). Its read goes to the maintainer beside the registered read (`DECISIONS-PENDING.md`).

## The questions

The deep review's leading cause, and the evidence it found against it, give two questions:
1. **THE TRADE.** On S037, does the household plan's lower spending buy its survival?
2. **THE PRICING.** On S037's Y90, Y100, E95 and E100, is the shortfall below Y75 the household table's tax on a partner's
   state pension? The household plan puts that pension on the household person, whose allowance is `k` times one person's.

## What runs

- **Code and settings.** The read's code (code id 36e4d2a860b2, which the tree still has, as at the launch commit
  1632296f) and the read's configurations: APP `ef459a5c8ccb` and ROUTE `35ee3a2dc6ad`.
- **Paths.** Seed 7002, the tuning seed and the pilot's, not held out: 4,000 paths a unit, at the app's 45 points and
  estate weight 0.02.
- **Units (13), all from the registered panel.**
  - S037's ten distinct household-route units: Y75, Y90, Y100, E95, E100, S75, G8, G12, G8Y75 and G12P. G12R is G12's own
    plan (`COUPLES-OPEN.md` amendment 3), so it is left out.
  - Three controls, where the household plan finds money besides spending: S119-E100, S199-E100 and S279-E100.
- **Arms.** Each is run by the engine on the same paths, every arm of a unit in one process (`audit-couples-trade.mjs`).
  - **APP and ROUTE**, as in the read.
  - **L** is ROUTE's own move each year, with its spending level set so the year's spending demand is APP's that year on
    the same path.
    - APP runs first, and its demand is kept unrounded.
    - The level is APP's demand over the year's scheduled target on ROUTE's context, and also over the year's fraction in
      plan year 0. That is how the engine sets a year's demand from a move's level.
    - In a year where APP has no demand, ROUTE's own level stands.
    - Everything else is ROUTE's: the order of drawing, the tiers, the lump sum and the sweep.
  - **PA2** is the household plan solved and assembled at the 'pensions' form (HSP: the allowance two people's, the
    bands at `k`). Everything else is ROUTE's.
- **Checks.** A failure ends the unit. Checks 1 and 2 failing is a STOP for the whole test.
  1. ROUTE's household table, solved again, carries the registered read's digest and the pilot's.
  2. APP and ROUTE on the first 1,000 paths equal the pilot's arrays (`results/couples-open-pilot`) on every key.
  3. ROUTE run through the level recorder equals ROUTE run without it. L given ROUTE's own levels equals ROUTE. Both bit
     for bit, on the first 200 paths.
  4. L's spending demand equals APP's in every year of every path, to a part in a billion.
  5. PA2's `k` is the unit's own, its allowance is two people's, and ROUTE's is `k` times one person's.
  6. Each arm's first 200 paths match `E.runTrial`.
- **The planted fault** (`CT_PLANT=nextpath`: each path's donor levels taken from the next path). It is run once on a
  smoke before launch, and checks 3 and 4 must both catch it.

## The rule

`reduce-couples-trade.mjs` reads the test once, when all 13 units are in, behind its gate: every unit present, one stamp,
seed 7002, 4,000 paths at 45 points, each arm's configuration, every check recorded, and the logs' stamps.

- **THE TRADE.**
  - The share is L's surviving paths less APP's, over ROUTE's less APP's, summed over units in whole paths.
  - Pooled over S037's nine distinct units other than G12P, the share is at most 0.5. On each control, its own share is
    at least 0.75.
  - If either part fails on the controls (a control's share below 0.75, or no gain), the outcome is A CONTROL FAILS,
    and THE TRADE is not read.
  - Otherwise the outcome is THE TRADE HOLDS, or NOT THE TRADE.
  - G12P's share is printed beside. The deep review predicts L keeps most of its gain.
- **THE PRICING.**
  - A unit's figure for an arm is its spending on the paths it and APP both keep, less APP's, in pounds a year. That is
    the mean difference in lifetime spending over those paths, divided by the unit's years with a demand.
  - An arm's shortfall is the mean, over Y90, Y100, E95 and E100, of its Y75 figure less the unit's.
  - THE PRICING holds when PA2's shortfall is at most 0.5 of ROUTE's.
  - If ROUTE's shortfall is not above nought, the outcome is NO SHORTFALL, and THE PRICING is not read.
  - Otherwise the outcome is THE PRICING HOLDS, or THE PRICING DOES NOT HOLD.
- **Beside, deciding nothing.**
  - each unit's share, and each pooled share's interval by path (a bootstrap over the paths, the units resampled
    together, since they share seed 7002's paths);
  - each arm's survival and its paths net of APP's;
  - spending on the paths both keep, in per cent and in pounds a year, and over all paths;
  - the mean pot capped at the route's estate cap, and lifetime tax;
  - the worst fifth's accounting, the paths ranked by APP's end pot: the arm less APP in pot, spending and tax, and the
    paths saved and lost there;
  - D34 for L and for PA2, each against ROUTE, in whole paths.

## What each outcome changes (the deep review's)

- **THE TRADE HOLDS.** S037's shortfall is the price of its survival. The maintainer's word on the default is then a word
  on that trade. Nothing in the household plan is broken by it, and the change of default's D-line names that kind of
  couple: a retired couple living mostly on state pensions.
- **THE PRICING HOLDS** (with or without the trade). The household plan taxing a partner's state pension against the
  household's allowance is a defect.
  - It is fixed as its own change: each person's state pension and other income priced against their own allowance.
  - The fix comes with its test of the class (the library's couples with `k` below 1.2 and a partner's state pension)
    and its plant, and is read EXPLORATORY first on these units.
  - Y and E need not wait for it, and the D-line says so.
- **NOT THE TRADE.** S037's cut buys little of its survival. The maintainer hears that before the change is committed.
  Next comes ROUTE at the lower estate aim (`bequestWeight` 0.01) on the G units, EXPLORATORY.
- **A CONTROL FAILS.** Either L's wiring or the controls' gains is in question. It is reported, and THE TRADE is not read.
- **In every case:**
  - the registered read stands;
  - nothing of seed 7026 runs again;
  - the default changes only on the maintainer's word.

## Box

- Half a day to build, from 23 Nov 02:20 UK.
- About half an hour to run, on four cores (about two core-hours, by the read's own timings).
- Half a day to read.
