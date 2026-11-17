# What the household plan refuses (step 7, D122; EXPLORATORY; nothing built)

`householdPlanFor` (`research/solver/household.mjs`) builds the household's single plan, or throws rather than guess.
None of the library's 210 couples is refused (the review's `results-coverage.txt` on review/external-2026-10-21 at
f1f44727), and none of step 5's 28 shapes (`results-shapes-panel.txt`). So no test so far has met a plan of any kind
below. For each: what such a plan looks like, and whether the household plan could take it and how. Where a way is
offered, it is unbuilt and unchecked.

| it refuses | such a plan | could it take it, and how |
|---|---|---|
| the two people's accounts of one wrapper at different risks | one pension at High Risk and the partner's at Medium | Not as design A stands. The household table holds one account a wrapper at one tier. A blended risk (the two returns weighted by balance) drifts as the balances move, so it would be an approximation. Two risks in one wrapper is a new state, like the axis. |
| the two people's contributions to one wrapper growing at different rates | both paying into ISAs, one rising and one flat | Probably. Each year's summed contribution could go as a dated deposit, as the later retiree's contributions already do from the first retirement. For a pension, whether the relief then lands as the engine gives it is not checked. |
| the two salaries growing at different rates | both working, one salary rising faster | Not exactly. The household's one salary grows at one rate. Before the first retirement nothing is spent, but the salary still sets the tax on savings income and the limits on pension contributions. Pay as a year-by-year schedule needs an engine that takes one. After the first retirement, the later retiree's pay already goes year by year, as take-home. |
| a cash ISA subscription | either person paying into a cash ISA each year | Probably, while each person's subscription fits their own cash ISA and ISA allowances: the two subscriptions added, against the household's doubled allowances. |
| a later retiree paid or saving in plan year 0 | one retired and the other still working in the plan's first, part year | Probably. That year's take-home and deposits would be priced on the pay as the engine pro-rates it, and the year after goes on as now. |
| the partner's own limits (`tierCeilingPart`) | the partner's wrappers capped at a lower risk than the first person's | Only where the two limits agree. Otherwise the one merged wrapper must take the stricter limit. That binds the less-limited person more than the couple's own rule does. |
