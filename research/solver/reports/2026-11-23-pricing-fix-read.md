# The pricing fix's read (23 Nov, EXPLORATORY, seed 7002): FIX DOES NOT HOLD

The household plan's price of a partner's income, candidate A (`PRICING-FIX.md`; the form 'pensionsPAown', built off in
code in 61eed66d), read once on 23 Nov at about 16:15 UK by `reduce-pricing-fix.mjs`, the rule committed before any unit
ran (5910b162, the premise fix after the smoke 33d50fb1). Every figure below is in `results-pricing-fix.txt` (the read) or
`results-pricing-fix-beside.txt` (written after the read by `pricing-fix-beside.mjs`, deciding nothing).

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
- **How the lost paths fail.** FIX loses 121 paths in all.
  - 119 of them fail in the last plan year that any arm fails in on their unit, the plan's last year. The other 2 are
    S191-90's, the earliest in plan year 38 of its 40.
  - 111 have no spending unmet: their end pot is below the minimum pot.
  - The other 10 are all S191-90's, with spending unmet; the 2 early failures are among them.
- **Spending on the paths both keep.** FIX less ROUTE pooled is `+0.5988%` (`+0.5820` to `+0.6157`). By unit it runs from
  `-0.2013%` on S037-Y75 to `+1.6595%` on S037-E100. The uneven units gain most (Y100, E95, E100 above `+1.2%`).
- **Lifetime tax a path, FIX less ROUTE.**
  - S191-90: `+£40,707`.
  - S279-E100: `-£14,010`.
  - S119-E100: `-£4,394`.
  - The other eleven units: under `£1,000` either way.
- **S191-90's 25 lost paths.** On them, FIX against ROUTE spends `-£23,160` a path over the plan, pays `+£12,703` more tax,
  and ends `-£104,165` lower.

## What it says

Candidate A does what it was built to do on the shortfall: the four uneven S037 units' spending gap below Y75 falls from
`£369` to `£56` a year. It does so at a cost in survival, and that cost lies at the plan's end. 111 of the 121 lost paths end with the pot below the
minimum pot. The other 10, all S191-90's, run short of money in its last three plan years. None fails earlier.

**The leading explanation is not shown by this read.** Candidate A takes the partner's fixed income off the household's
schedule but leaves that schedule's allowance and bands at `k` times one person's. The table may now price the year's draws
as if the household's scaled allowance and basic band, less the first person's own fixed income, were all open to them. In
the engine, each person's draws meet only their own allowance and bands. So the table would under-price the draws, where it
over-priced the fixed incomes before. `PRICING-FIX.md` named this, the error A leaves, before the read.

The figures fit it: more spending on the uneven units' kept paths, smaller end pots, and on S191-90 (the first person holding
90% of the pensions) much more tax paid in the engine. Which allowance or band carries it is not measured.

## What next (to the maintainer)

- **C (recommended).** Two schedules in the household table's forward run, the year's draw split as the engine funds it.
  - It is exact for the even split, and prices the draws as well as the fixed incomes.
  - It changes `src/solver/fast.js` and `model.js` in lockstep, with V2's state check.
  - Its test of the class would be `household-pricing.test.mjs` extended to the year's draws.
  - Its read would use these 14 units and this rule.
  - Its cost: two schedule evaluations a year in the chooser's inner loop, which gate 5's measure would size.
- **B.** One schedule, its allowance and bands moved each year to the binding person's thresholds after their own fixed
  income (`k x L - (k - 1) x F_A(t)` for each limit `L`). It is cheaper, but approximate for the even split. Its read would
  be the same.
- **Stop.** The shipped route stays as it is (D144 accepted S037's shortfall as D134 accepted S273-90's), and the form stays
  off.
- **In every case,** the timing fix that the test of the class found (each moved income counted from its owner's retirement,
  as the engine counts it) stands. It moves no figure of any read (`results-household-timing.txt`), and goes to `main` with
  the next batch on B1's gate.
