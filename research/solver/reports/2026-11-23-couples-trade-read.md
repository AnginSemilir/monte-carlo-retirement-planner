# The couples trade, read once (23 Nov): A CONTROL FAILS; THE PRICING HOLDS

EXPLORATORY (`COUPLES-TRADE.md`, its rule committed before any unit ran, 2f827ee0). This is the deep review's one test
after the registered couples read (`reviews/2026-11-22-deep-couples-open.md`, section 3).
- **The run.** Launched 23 Nov 03:18 UK through the launcher from 2f827ee0 (code 36e4d2a860b2, audit 4f8d4cd86ede). Its
  runs were done 03:54 UK: 13 units, none exiting with an error.
- **The read.** Read once by `reduce-couples-trade.mjs`. Its output is whole in `results-couples-trade.txt`, and every
  figure below is the read's own.
- **The gate.** Fair: every unit, one stamp, each arm's configuration, every check recorded and the logs' stamps.
- **The checks.** Every unit passed all six:
  - ROUTE's table carries the registered read's digest and the pilot's.
  - APP and ROUTE match the pilot's arrays on the first 1,000 paths.
  - L given ROUTE's own levels is ROUTE, bit for bit.
  - L's spending demand matches APP's in every year of every path.
  - PA2's `k` and allowance are as the rule sets them.
  - Every arm matches `E.runTrial`.

## In plain words

The registered read flagged nine of S037's units (M1): the household plan keeps far more paths than the app's rules
there, but spends less on the paths both keep. The deep review offered two explanations, and this test asks about each.
- **THE TRADE.** Is the lower spending what buys the survival? Arm L runs the household plan's own moves with the app's
  rules' spending put back, path by path and year by year. If L keeps at most half of the household plan's survival gain
  on S037, while keeping at least three-quarters on three control couples, the trade holds.
- **THE PRICING.** On Y90, Y100, E95 and E100, is the shortfall below Y75 the household table's tax on a partner's state
  pension? Arm PA2 is the household plan with the allowance two people's. If PA2's shortfall is at most half of the
  household plan's, the pricing holds.

## What it found, by the rule

**THE TRADE is not read.**
- The controls:
  - S119-E100: L keeps `0.902` (331 of 367 paths net);
  - S199-E100: `0.791` (371 of 469);
  - S279-E100: `0.695` (298 of 429), below the bar of `0.75`.
- So A CONTROL FAILS, and by the rule THE TRADE is not read.
- L's wiring held on every unit (checks 3 and 4). So what the failure puts in question is the controls' premise: that on
  them the household plan's gain owes almost nothing to spending. On S279, the youngest couple, it holds less than the
  rule asked.

**THE PRICING HOLDS.**
- Spending on the paths both keep, less APP's, a year, below Y75's:
  - ROUTE's shortfall averages £369 (Y75 itself `+£101`).
  - PA2's averages £55 (Y75 itself `+£70`).
- By unit, ROUTE then PA2:

| unit | ROUTE below Y75 | PA2 below Y75 |
|---|---|---|
| Y90 | £201 | £42 |
| Y100 | £381 | £40 |
| E95 | £389 | £62 |
| E100 | £503 | £76 |

- PA2's shortfall is under half of ROUTE's, so the pricing holds.
- By the rule's outcomes, this is a defect in the household plan: it taxes a partner's state pension against the
  household's allowance. It is to be fixed as its own change, with its test of the class and its plant, read EXPLORATORY
  first. Y and E need not wait for it.

**OUTCOME: A CONTROL FAILS; THE PRICING HOLDS.**

## Beside, deciding nothing

- **S037's share, pooled over the nine units the rule names:** L keeps `-0.230` of ROUTE's gain (-1,149 of 4,986 paths
  net; by path `-0.279` to `-0.181`).
  - On eight of the nine, L survives below APP itself, from 49 (Y100) to 324 (G8Y75) paths fewer of 4,000. On S75 it
    keeps 143 more.
  - G12P's share is `0.567` (302 of 533).
  - So with the app's rules' spending put in, the household plan's other choices keep fewer paths than the app's rules on
    most of S037's units.
  - The read does not show why. L takes the household table's moves made for its own spending, which no arm would run
    on its own. The rule did not read this as THE TRADE, and this write-up does not either.
- **PA2 beside ROUTE.**
  - Survival: D34 flags PA2 against ROUTE on none of the 13 units. PA2 loses 1 to 14 paths of 4,000 and saves 0 to 13,
    against thresholds of 21.
  - Spending on the paths both keep, each against APP: PA2 is above ROUTE on 11 of the 13 units. It is below on Y75
    (`+£70` a year against `+£101`) and S75 (`-£67` against `-£47`).
  - On the four the pricing names, PA2 against APP is `+£28`, `+£30`, `+£8` and `-£6` a year (Y90, Y100, E95, E100),
    where ROUTE is `-£100`, `-£280`, `-£288` and `-£402`.
  - Note: PA2 is HSP, which step 8's arm read set aside for HSPA because HSP was flagged on S191-90
    (`results-household-arm.txt`). So the fix is not PA2 itself, but the change the rule names: each person's state
    pension and other income priced against their own allowance.
- **L beside ROUTE.** D34 flags L against ROUTE on all 13 units, as L takes the app's rules' spending.
- **The worst fifth, by APP's end pot, on S037's units but G12P.**
  - ROUTE ends with `£25,742` to `£64,340` more pot a path than APP, and spends `£15,314` to `£63,451` less.
  - L there spends within `-£4,331` to `+£1,822` of APP and ends with `-£10,421` to `+£15,502` of pot.
- **Lifetime tax.**
  - On S119, S199 and S279 the household plan's tax falls as the registered read found. For S119-E100: APP `£149,028`,
    ROUTE `£10,752`, PA2 `£6,328` a path.
  - On S037's E95 and E100, PA2's tax is above ROUTE's (`£2,192` and `£3,028`, against `£685` and `£935`), while it spends
    more.

## What it means

- **The pricing.** The household plan's tax on a partner's state pension at an allowance of `k` times one person's is
  measured now. It costs the four uneven S037 units about £369 a year of spending against Y75. PA2 takes all but about
  £55 of it away, with D34 flagging no unit against ROUTE.
  - That gives the T-GAPS item a measured effect for couples, as the deep review said it would. It becomes an open item
    of its own with the fix.
  - The fix is a change to the household plan, its own build: each person's state pension and other income against
    their own allowance. It needs its test of the class (the library's couples with `k` below 1.2 and a partner's state
    pension), its plant, and an EXPLORATORY read on these units before any default moves.
- **The trade.** It is not settled by this test. S037's spending shortfall on its other units (S75, G8, G12, G8Y75, G12R)
  stays what the registered read and the deep review found. The maintainer's word on M1's units is still a word on that
  shortfall, without this test's backing either way.
- **In every case:**
  - the registered read stands;
  - nothing of seed 7026 ran again;
  - the default changes only on the maintainer's word.

## What it does not show

- Why S279's gain owes about a third to spending, or why L does worse than APP on S037. The arrays hold lifetime totals
  and the worst fifth's accounting only.
- Whether the pricing fix, as built, moves survival. PA2 moves spending with D34 flagging no unit against ROUTE, but PA2
  is not the fix.
- Seed 7002 alone, at 4,000 paths. The figures are a lead for the fix's own read, not a result.
