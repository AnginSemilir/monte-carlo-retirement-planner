# The couples trade, read once (23 Nov): A CONTROL FAILS; THE PRICING HOLDS

EXPLORATORY (`COUPLES-TRADE.md`, its rule committed before any unit ran, 2f827ee0). This is the deep review's one test
after the registered couples read (`reviews/2026-11-22-deep-couples-open.md`, section 3).
- **The run.** Launched 23 Nov 03:18 UK through the launcher from 2f827ee0 (code 36e4d2a860b2, audit 4f8d4cd86ede). Its
  runs were done 03:54 UK: 13 units, none exiting with an error.
- **The read.** Read once by `reduce-couples-trade.mjs`. Its output is whole in `results-couples-trade.txt`.
- **The reviewer at the read** (`reviews/2026-11-23-read-couples-trade.md`, `-2.md`):
  - first look: FAIL, one BLOCKING (the write-up settled what the failed control means) and six MINOR, answered in one fix
    round;
  - second look: PASS, two MINOR, answered.
- **The figures.** Every figure below is the read's own, unless it is marked post hoc. The post hoc figures come from
  `results-couples-trade-beside.txt` (`couples-trade-beside.mjs`, written after the read, deciding nothing). Simple
  arithmetic on printed figures is marked as such.
- **The gate.** Fair: every unit, one stamp, each arm's configuration, every check recorded and the logs' stamps.
- **The checks.** Every unit passed all six:
  - ROUTE's table carries the registered read's digest and the pilot's.
  - APP and ROUTE match the pilot's arrays on the first 1,000 paths.
  - L given ROUTE's own levels is ROUTE, bit for bit, on the first 200 paths.
  - L's spending demand matches APP's in every year of every path.
  - PA2's `k` and allowance are as the rule sets them.
  - Every arm matches `E.runTrial` on its first 200 paths.
- **What the checks do not cover.** Every unit here has a whole first year and no spending bands, so check 4 does not
  exercise either. The level's handling of both is right by reading (the reviewer at the read, MINOR 6).
- **The planted runs** are kept in `results-couples-trade-planted.txt`. The audit's plant (each path's donor levels taken
  from the next path) fails checks 3 and 4 on 40 of 40 paths. The reducer's six planted cases pass.

## In plain words

The registered read flagged nine of S037's units (M1): the household plan keeps far more paths than the app's rules
there, but spends less on the paths both keep. The deep review offered two explanations, and this test asks about each.
- **THE TRADE.** Is the lower spending what buys the survival?
  - Arm L runs the household plan's own moves, with each year's spending demand set to the app's rules' demand on the
    same path, as the app's rules' own run of that path had it.
  - If L keeps at most half of the household plan's survival gain on S037, while keeping at least three-quarters on each
    of three control couples, the trade holds.
- **THE PRICING.** On Y90, Y100, E95 and E100, is the shortfall below Y75 the household table's tax on a partner's state
  pension? Arm PA2 is the household plan at the 'pensions' form: the allowance two people's, the bands at `k`. If PA2's
  shortfall is at most half of the household plan's, the pricing holds.

## What it found, by the rule

**THE TRADE is not read.** The controls' shares:
- S119-E100: L keeps `0.902` (331 of 367 paths net);
- S199-E100: `0.791` (371 of 469);
- S279-E100: `0.695` (298 of 429), below the bar of `0.75`.

So A CONTROL FAILS. By the rule, that puts either L's wiring or the controls' gains in question, and THE TRADE is not
read. The rule does not say which of the two it is.

Post hoc, deciding nothing (`results-couples-trade-beside.txt` A):
- **How L takes APP's demand.** L takes APP's demand as APP's own run had it. The engine's guardrails cut only while a
  pot is left, so after APP has run out its demand is its full target.
- **On S279-E100.** ROUTE keeps 132 paths that APP and L both lose. On 121 of them, APP ran out before the plan's final
  year.
  - There, APP's level is `0.801` in the three years before its fail year and `1.000` in the 1,325 years after.
  - A path there:
    - APP delivered `£1,397,301` and left `£372,645` unmet;
    - ROUTE delivered `£1,611,784` and survived;
    - L delivered `£1,699,548` and failed.
- **With APP's early ruins set aside,** each control's L keeps more than the bar: S119-E100 `0.934`, S199-E100 `0.891`,
  S279-E100 `0.945`.
- **So** the failed control may rest on L's specification, which replays APP's demand from APP's own run past APP's own
  ruin, rather than on the controls' gains. These figures do not decide it, and the rule's outcome stands.

**THE PRICING HOLDS.** Spending on the paths both keep, less APP's, a year, below Y75's:
- ROUTE's shortfall averages £369 (Y75 itself `+£101`).
- PA2's averages £55 (Y75 itself `+£70`).

| unit | ROUTE below Y75 | PA2 below Y75 |
|---|---|---|
| Y90 | £201 | £42 |
| Y100 | £381 | £40 |
| E95 | £389 | £62 |
| E100 | £503 | £76 |

PA2's shortfall is under half of ROUTE's, so the pricing holds. By the rule's outcomes, this is a defect in the household
plan: it taxes a partner's state pension against the household's allowance. It is to be fixed as its own change, with
its test of the class and its plant. Opening Y and E need not wait for the fix.

**OUTCOME: A CONTROL FAILS; THE PRICING HOLDS.**

## Beside, deciding nothing

**S037's share,** pooled over the nine units the rule names: L keeps `-0.230` of ROUTE's gain (-1,149 of 4,986 paths
net; by path `-0.279` to `-0.181`).
- On eight of the nine, L survives below APP itself, from 49 (Y100) to 324 (G8Y75) paths fewer of 4,000. On S75 it keeps
  143 more. G12P's share is `0.567` (302 of 533).
- Post hoc (`results-couples-trade-beside.txt` A): on S037 the paths APP runs out on before the final year are fewer
  (from 72 to 105 a unit), and with them set aside L's share stays below nought on the same eight units.
- The read does not show why. L takes the household table's moves made for its own spending, which no arm would run on
  its own.

**PA2 beside ROUTE.**
- Survival:
  - D34 flags PA2 against ROUTE on none of the 13 units. PA2 loses 1 to 14 paths of 4,000 and saves 0 to 13, against
    thresholds of 21.
  - Its sign (post hoc, `results-couples-trade-beside.txt` B): PA2 is below ROUTE on 11 of the 13 units, level on G12P and
    above on S279-E100. On the four the pricing names, together, it loses 28 and saves 1 of 16,000 unit-paths. D34 at
    4,000 paths cannot read a change that small.
- Spending on the paths both keep, each against APP:
  - PA2 is above ROUTE on 11 of the 13 units. It is below on Y75 (`+£70` a year against `+£101`) and S75 (`-£67` against
    `-£47`).
  - On the four the pricing names, PA2 against APP is `+£28`, `+£30`, `+£8` and `-£6` a year (Y90, Y100, E95, E100). ROUTE
    is `-£100`, `-£280`, `-£288` and `-£402`.
- Tax: PA2's lifetime tax is above ROUTE's on all four of those units. ROUTE pays `£24`, `£70`, `£685` and `£935` a path;
  PA2 pays `£383`, `£970`, `£2,192` and `£3,028` (post hoc, B).
- PA2 is not the fix. It doubles the allowance, and every threshold above it moves up with it, for all of the household
  table's income, not only for the partner's state pension (`src/solver/household.js` `householdPlanFor`). It is also HSP, which step 8's arm read set aside for
  HSPA because HSP was flagged on S191-90 (`results-household-arm.txt`).

**L beside ROUTE.** D34 flags L against ROUTE on all 13 units, as L takes APP's demand.

**The worst fifth, by APP's end pot, on S037's units but G12P.**
- ROUTE ends with `£25,742` to `£64,340` more pot a path than APP, and spends `£15,314` to `£63,451` less.
- L there spends within `-£4,331` to `+£1,822` of APP, and ends with `-£10,421` to `+£15,502` of pot.

**Lifetime tax elsewhere.** On S119, S199 and S279 the household plan's tax falls as the registered read found. For
S119-E100: APP `£149,028`, ROUTE `£10,752`, PA2 `£6,328` a path.

## What it means

**The pricing.** The household plan's tax on a partner's state pension, at an allowance of `k` times one person's, now has
a measured effect.
- On the four uneven S037 units it costs about £369 a year of spending against Y75. Doubling the allowance and the
  thresholds above it (PA2) removes £314 of that (arithmetic, £369 less £55).
- That £314 is PA2's size, not the fix's. PA2 raises the allowance, and every threshold above it, for all the
  household's income, and pays more tax than ROUTE on those four units.
- The T-GAPS item has a measured effect for couples now, as the deep review said it would. It becomes an open item of its
  own with the fix.
- **The fix is its own change to the household plan:** each person's state pension and other income priced against
  their own allowance.
  - It comes with its test of the class (the library's couples with `k` below 1.2 and a partner's state pension) and its
    plant.
  - It is read EXPLORATORY on these 13 units and on S191-90, where step 8's arm read flagged HSP, since these 13 alone
    could not show that harm.
  - It becomes a default only after that read.
- Opening Y and E need not wait for the fix.

**The trade.** It is not settled by this test.
- S037's spending shortfall on its other named units (S75, G8, G12, G8Y75, G12R) stays what the registered read and the
  deep review found.
- The maintainer's word on M1's units is still a word on that shortfall, without this test's backing either way.

**In every case:**
- the registered read stands;
- nothing of seed 7026 ran again;
- the default changes only on the maintainer's word.

## What it does not show

- Which of the rule's two readings of the failed control holds: L's specification or the controls' gains. The post hoc
  figures point to L's specification, but do not decide it.
- Why L does worse than APP on S037. The arrays hold lifetime totals, and the beside file adds only APP's year-by-year
  demand.
- What the pricing fix, as built, does to spending or survival. PA2 is not the fix.
- Anything beyond seed 7002 at 4,000 paths. The figures are a lead for the fix's own read, not a result.
