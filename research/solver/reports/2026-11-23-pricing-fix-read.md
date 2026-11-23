# The pricing fix's read (23 Nov, EXPLORATORY, seed 7002): FIX DOES NOT HOLD

The household plan's price of a partner's income, candidate A (`PRICING-FIX.md`; the form 'pensionsPAown', built off in
code in 61eed66d), read once on 23 Nov at about 16:15 UK by `reduce-pricing-fix.mjs`. The rule was committed before any
unit ran (5910b162; the premise fix after the smoke, 33d50fb1). Every figure below is in `results-pricing-fix.txt` (the
read) or `results-pricing-fix-beside.txt` (written after the read by `pricing-fix-beside.mjs`, deciding nothing).

This write-up is corrected after the reviewer at the read (`reviews/2026-11-23-read-pricing-fix.md`: FAIL, one BLOCKING
and three MINOR). The first version said the losses fit the draws being under-priced and recommended C on it; on four of
the read's own units they do not.

## What ran

- 14 units, seed 7002, 4,000 paths each, at 45 points, launched through the launcher at 15:39 UK (task bwj85i2fj, its log
  `results/pricing-fix-launch-1.log`), its runs 15:46 to 16:14 UK, no unit stopped by a check.
- Code 7aee4099f6dc, audit d9a390cb3558.
- The launcher's snapshot reports "+ 2 uncommitted file(s)": STATE.md and DECISIONS-PENDING.md, edited just after the copy
  was taken. The snapshot holds 33d50fb1's text of both, and every code file is 33d50fb1's.
- The gate: fair (every unit, one stamp, each arm's configuration, every check recorded, the logs' stamps).
- The checks held.
  - On the thirteen registered units: ROUTE's household table is the registered read's and the pilot's, and APP and ROUTE
    are the couples trade's on all 4,000 paths, so ROUTE's shortfall is the trade's.
  - On S191-90, APP and ROUTE equal the household arm read's APP and HSPA on all 4,000 paths (0 apart).
  - FIX's `k` and allowance are ROUTE's on every unit, and its plan is ROUTE's but for its incomes.

## The rule

- **THE SHORTFALL CLOSES.** ROUTE's shortfall below Y75 is `+£369` a year, the trade's figure. FIX's is `+£56`, 0.153 of
  ROUTE's, within the bar of 0.5.
  - Y90: ROUTE `+£201`, FIX `+£44`.
  - Y100: ROUTE `+£381`, FIX `+£40`.
  - E95: ROUTE `+£389`, FIX `+£64`.
  - E100: ROUTE `+£503`, FIX `+£77`.
- **NO HARM fails, on both parts.**
  - D34, in whole paths, flags S191-90: FIX loses 25 paths and saves 3, against its threshold of 21.
  - The pooled survival change, FIX less ROUTE over the 14 units, is `-0.173` points (`-0.231` to `-0.115` by path). Its
    lower end is below the bar of `-0.1`.
- **OUTCOME: FIX DOES NOT HOLD.** By the rule it goes back to the maintainer with the figures, with B or C offered, and
  nothing changes.

## Beside, deciding nothing

- **Survival.** FIX keeps fewer paths than ROUTE on 12 of the 14 units, by `-0.100` (S037-S75) to `-0.550` (S191-90) points.
  - S037-G12P is unchanged, and S279-E100 is up `+0.125` (`-0.110` to `+0.360`).
  - Pooled without S191-90, the change is `-0.144` (`-0.202` to `-0.087`). Over S037's ten, it is `-0.160` (`-0.227` to
    `-0.093`).
- **How the lost paths fail.** Each is read against its unit's own context (its minimum pot and its last plan year).
  - FIX loses 121 paths in all.
  - 111 have no spending unmet and end below the minimum pot in the last plan year.
  - The other 10, all S191-90's, have spending unmet, in plan years 38 to 40 of its 40.
  - None fails any other way.
- **Spending on the paths both keep.** FIX less ROUTE pooled is `+0.5988%` (`+0.5820` to `+0.6157`). By unit it runs from
  `-0.2013%` on S037-Y75 to `+1.6595%` on S037-E100.
- **Lifetime tax a path, FIX less ROUTE.**
  - S191-90: `+£40,707`.
  - S279-E100: `-£14,010`.
  - S119-E100: `-£4,394`.
  - The other eleven units: under `£1,000` either way.
- **S191-90's 25 lost paths.** On them, FIX against ROUTE spends `-£23,160` a path over the plan, pays `+£12,703` more tax,
  and ends `-£104,165` lower.
- **The couples trade's PA2** (the allowance two people's), on the same thirteen units and paths, beside FIX against ROUTE.
  PA2 loses 98 paths and saves 25, pooled `-0.140` (`-0.199` to `-0.082` by path). FIX loses 96 and saves 21, pooled
  `-0.144` (`-0.202` to `-0.087`). Unit by unit, the two arms' lost paths are within two of each other.

## What it says

**What A does.** Candidate A does what it was built to do on the shortfall: the four uneven S037 units' spending gap below
Y75 falls from `£369` to `£56` a year. It does so at a cost in survival, and that cost lies at the plan's end. 111 of the
121 lost paths end below the minimum pot. The other 10, all S191-90's, run short of money in its last three plan years.

**What drives the loss is not shown by this read.** Before the read, `PRICING-FIX.md` named the error A leaves: with the
partner's fixed income off the household's schedule, but that schedule's allowance and bands still `k` times one
person's, the table may under-price the year's draws. That cannot be the whole cause.
- **E100 and the three controls (S119-E100, S199-E100, S279-E100).** The elder holds every wrapper and `k` is 1. Every draw
  is the first person's, against their own allowance and bands, and the partner's state pension is taxed alone, as in the
  engine. A prices these units' year as the engine does.
- **Y100.** The younger partner holds every wrapper. The table prices the partner's draws against the allowance the first
  person's state pension leaves, which is less than the partner's own leaves. A prices those draws above the engine.
- **FIX still loses paths on four of them:**
  - Y100: `-0.225` points, lifetime tax `-£67` a path;
  - E100: `-0.150` points, lifetime tax `-£930` a path;
  - S119-E100: `-0.200` points, lifetime tax `-£4,394` a path;
  - S199-E100: `-0.200` points, lifetime tax `-£34` a path.
  These four hold 37 of the 121 lost paths.
- **And the couples trade's PA2**, which removed ROUTE's over-pricing another way, lost about as many paths on the same
  units.

So both ways of removing ROUTE's over-pricing come with these end-of-plan losses. Which part of either drives them is not
shown.

One reading, not shown: ROUTE's over-pricing kept the household's spending down and its end pot up, a margin the household
table's own judgement of the plan's end does not otherwise hold. The deep review of step 8 named the household table's
thinner late cushion as its leading cause (`reviews/2026-11-20-deep-household-hsp.md`).

## What next (to the maintainer)

- **Keep the route as shipped (recommended).** This is the rule's outcome in any case: D143 accepted S037's shortfall, and
  the form stays off.
  - Removing the over-pricing, by A here or by PA2 in the couples trade, costs survival at the plan's end. The product's
    order puts survival first.
  - If the pricing is to be corrected later, the plan's end comes first. That means a test (EXPLORATORY) of the household
    table's judgement of the minimum pot against the engine's, on the units where A's price is already right (E100 and
    the three controls). It is named here, not designed, and B or C would follow on what it finds.
- **C now.** Two schedules in the household table's forward run, the year's draw split as the engine funds it.
  - It is not shown exact. The household table's state holds each wrapper summed over both people (`household.js`
    `mergedState`), so once one person's wrapper runs down it cannot tell whose allowance a draw meets.
  - On E100 and the controls it would price as A does, so it would not by itself remove the loss there.
  - It changes `src/solver/fast.js` and `model.js` in lockstep.
- **B now.** One schedule whose allowance and bands move each year to the binding person's thresholds. It is cheaper, and
  approximate.
- **In every case,** the timing fix that the test of the class found stands: each moved income is counted from its owner's
  retirement, as the engine counts it. It moves no figure of any read: none of 876 household plans across every panel run
  on the household route and the library's couples (`results-household-timing.txt`). It goes to `main` with the next batch
  on B1's gate.
