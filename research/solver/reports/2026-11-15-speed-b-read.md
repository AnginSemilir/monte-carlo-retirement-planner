# The speed mode on more singles and couples, read (15 Nov): singles HOLDS, couples LOSES

EXPLORATORY, seed 7002 (D97 (3); `SPEED-B.md`, its rule committed before launch at a8a26e16). The read whole is
`results-speed-b.txt`; the figures beside it, written after the read and deciding nothing, are `results-speed-b-beside.txt`
(`speed-b-beside.mjs`, sections A to I). Every figure below is printed in one of those two files, or, for item 7's earlier
read, in `results-tie-a.txt`. The read decides nothing by itself: it goes to you as the trade it is (D90 (2)). The reviewer
at the read: `reviews/2026-11-15-read-speed-b.md` (FAIL, one BLOCKING, answered in one fix); again,
`reviews/2026-11-15-read-speed-b-2.md` (PASS, three MINORs, answered here).

## In plain words

The speed mode ("Beta - speed mode", off by default) works a plan's figures out faster. In each simulated year it scores
only a shortlist of choices, the ones its tables already favour, instead of every choice. This read ran 20 more singles and
12 more couples, none of them in the earlier reads, each with and without the speed mode on the same 4,000 paths, at the
dial's first position.

**Singles: it holds, but this read cannot speak to the singles' warning.**
- Survival is unchanged: +0.001 points pooled (-0.012 to +0.015). Spending and the pot are level: spending +0.0004%, the
  pot +0.054%, the capped pot +0.007%.
- The engine's time for a path is about halved: the median is x0.54 (x0.39 to x0.67).
- **The warning's figures come from item 7's read.** "About 2 in 10,000 on average, and at most about 2 in 1,000" are its
  pooled -0.019 and its S370's -0.175 (-0.310 to -0.040), measured on 16,000 paths (`results-tie-a.txt`).
- **This read rules such a loss out on its own singles, but none of them is a household like S370.** Every single's
  interval has its lower end above -0.175, the lowest S326F's -0.163. But they all survive 92.58% to 99.20%, and only 27
  of their 80,000 paths part between the arms, where S370 survived 83.94% with 120 of 16,000 parting. On a household like
  S370, simulated at its own rates, a loss of S370's size reads beyond noise in 22.8% of runs at 4,000 paths and 70.8% at
  16,000 (section E). So this read neither measures the warning's "at most" on such a household again nor contradicts
  it.

**Couples: it loses, on spending.**
- Pooled spending delivered is lower by 0.0683%, against a bar of 0.05% either way. Leaving out any one couple, it still
  fails: the nearest is -0.0558% without S133.
- Couple by couple the loss is larger: -0.122% with each couple weighted equally. The two cohorts pool to nearly the same
  loss (-0.0698% and -0.0674%; -0.0686% weighted equally), so the gap is the small-spending couples' larger losses. S133
  spends 0.620% less (lower on 2,716 of its 4,000 paths) and S097 0.278%, with 2.21% and 2.27% of the pounds; a couple's
  pounds and its change in spending correlate +0.40. S031 spends 0.216% less.
- Pooled survival holds at -0.023 (-0.084 to +0.038), but two couples lose beyond noise, each still beyond it after a
  Holm adjustment over the twelve (section F): S031 by 0.550 (-0.879 to -0.238) and S063 by 0.500 (-0.830 to -0.187). Both
  intervals' upper ends are above the rule's -0.3, so part 2 holds. Each loss is more than twice the singles' warning's
  "at most".
- The six library couples together lose -0.150 (-0.254 to -0.048) and the six younger couples gain +0.104 (+0.036 to
  +0.173). But each cohort's figure rests on two couples: without S031 and S063 the library's four come to +0.037, and
  without S301F and S325F the younger four come to +0.019. S301F's and S325F's gains are not beyond noise after the Holm
  adjustment. So the cohort pattern is a lead.
- The pot is higher, +1.169% pooled and +0.521% capped. The mean pot's rise is mostly S063's (+0.336% without it): its pot
  is 10.33% higher, only 1.31% with the cap. The capped pot's is not (+0.449% without S063). S063's lifetime tax doubles at
  the mean (+99.0%), and at the median rises 14.1%.
- The engine's time for a path saves less than for a single: the median is x0.79 (x0.52 to x0.90).

**By the rule:** for singles, to you with the time it saves; for couples, the warning stays and nothing changes.

**My recommendation, for you to rule on (D90 (2), the trade):**
- **Singles:** keep the speed mode a beta with its warning's figures on survival as they stand. This read adds a wider
  panel that shows no loss, but not of the households where item 7 measured one. If you want the warning reconsidered, the
  read that could do it would take households like S370 at 16,000 paths: a new test with its own rule, if you ask for it.
- **The warnings' speed.** "About twice as fast" for singles and "nearly twice as fast" for couples rest on the engine's
  time per path. With the solve counted as well, this read's ratio is x0.66 for singles and x0.82 for couples (the
  median; section I). A user's wait has not been measured. Whether the words should say "faster" rather than "about twice
  as fast" is yours, as the words are (D98).
- **Couples:** keep it as it is, with one change for you to weigh. The couples' warning says nothing about survival, and
  here two couples lost half a point each. Its words are yours (D98), so whether it should say so, and how, is your call.

## The read

`reduce-speed-b.mjs`, once, its gate fair: 20 singles and 12 couples, code 6b2dc56b2f82, audit 7a7989082a7a, seed 7002, 4,000
paths, 45 points. Launched 15 Nov 03:57 UK through the launcher on frozen code, its runs done 05:35 UK, no unit exiting with
an error.

| part | the bar | singles | couples |
|---|---|---|---|
| 1. pooled survival | lower end above -0.1 | +0.001 (-0.012 to +0.015): holds | -0.023 (-0.084 to +0.038): holds |
| 2. a unit wholly below -0.3 | none | none: holds | none: holds |
| 3. pooled spending | within 0.05% | +0.0004%: holds | -0.0683%: **fails** |
| 4. the pot, the capped pot | not below -0.5%, -0.1% | +0.054%, +0.007%: holds | +1.169%, +0.521%: holds |
| the engine's time for a path, SPEED over WHOLE | beside | the median x0.54 (x0.39 to x0.67) | the median x0.79 (x0.52 to x0.90) |

**SPEED-B OUTCOME: singles HOLDS; couples LOSES.** By hand, no figure sits at a bar where floating point could decide it: the
survival bars are on interval ends, and the couples' spending, -0.0683%, is clear of its bar of 0.05%.

## Beside the rule, deciding nothing

- **The cohorts apart** (section B):

  | group | cohort | survival | spending | the pot | the capped pot | a path's time |
  |---|---|---|---|---|---|---|
  | singles | library (10) | +0.003 (-0.012 to +0.017) | -0.0003% | +0.099% | +0.007% | x0.52 |
  | singles | younger (10) | +0.000 (-0.025 to +0.025) | +0.0005% | +0.009% | +0.007% | x0.63 |
  | couples | library (6) | -0.150 (-0.254 to -0.048) | -0.0698% | +2.323% | +0.823% | x0.59 |
  | couples | younger (6) | +0.104 (+0.036 to +0.173) | -0.0674% | +0.015% | +0.219% | x0.81 |

- **What the times measure.** Each is the engine's time to run the solved plan on one path, nothing else. That leaves out:
  - the solve itself;
  - the run of "your plan" the Strategy tab makes beside each path;
  - the decisions the pages show, made on the whole menu.

  The units ran four at a time at the lowest priority, WHOLE always timed before SPEED. The session's two traces of the
  couples' tie rule, a solve of S311F taking about two and a half minutes each time, ran on the same cores while this read
  ran. With each unit's solve added to its 4,000 paths, SPEED over WHOLE is the median x0.66 for singles (x0.48 to x0.76)
  and x0.82 for couples (x0.58 to x0.92), section I. A user's wait falls by less than the per-path ratios.
- **Lifetime tax and the time by unit** are in section C.

## How this read sits beside the earlier two

The earlier reads were made differently, so their figures are not one panel under one bar:
- **Item 7** (twelve singles, `results-tie-a.txt`) ran on 11 Nov's prototypes, before the harvest ceiling, at 16,000 paths,
  with its own measures of spending and of the pot.
- **Item 12's stage A** (eight couples, `results-item12-a.txt`) ran on 12 Nov's code, with spending measured in points of
  target against a one-sided bar of 0.1. It too found the couples spending less: -0.1089 points of target pooled, in its own
  measure, which is not this read's.

## What it does not show

- It covers 20 singles and 12 couples, 4,000 paths of the tuning seed, one estate weight and the dial's first position.
- Its singles survive 92.58% to 99.20%: it cannot show a loss the size of S370's on households like S370.
- It does not show why the shortlist costs S031 and S063 survival, nor why S063's tax doubles.
- Its times are the engine's per path only, on this machine, not on a phone or in a browser.

## Files

`SPEED-B.md` (the rule), `audit-speed-b.mjs`, `batch-speed-b.sh`, `reduce-speed-b.mjs`, `results-speed-b.txt` (the read
whole), `speed-b-beside.mjs` and `results-speed-b-beside.txt` (beside it, written after the read),
`reviews/2026-11-15-read-speed-b.md` and `-2.md` (the reviewer at the read, twice).
