# The speed mode on more singles and couples, read (15 Nov): singles HOLDS, couples LOSES

EXPLORATORY, seed 7002 (D97 (3); `SPEED-B.md`, its rule committed before launch at a8a26e16). The read whole is
`results-speed-b.txt`; the figures beside it, written after the read and deciding nothing, are `results-speed-b-beside.txt`
(`speed-b-beside.mjs`, sections A to D). Every figure below is printed in one of those two files, or, for item 7's earlier
read, in `results-tie-a.txt`. The read decides nothing by itself: it goes to you as the trade it is (D90 (2)).

## In plain words

The speed mode ("Beta - speed mode", off by default) works a plan's figures out faster. In each simulated year it scores
only a shortlist of choices, the ones its tables already favour, instead of every choice. This read ran 20 more singles and
12 more couples, none of them in the earlier reads, each with and without the speed mode on the same 4,000 paths.

**Singles: it holds.**
- Survival is unchanged: +0.001 points pooled (-0.012 to +0.015). No single's interval comes near the bar; the lowest upper
  end is +0.058, against a bar of -0.3.
- Spending and the pot are level: spending +0.0004%, the pot +0.054%, the capped pot +0.007%.
- A path takes about half the time: the median is x0.54 (x0.39 to x0.67). On the library's singles that is about 40
  milliseconds a path down to about 20.
- Item 7's earlier read on twelve other singles found a small loss beyond noise, inside the same bar: pooled survival -0.019
  (-0.034 to -0.005), in `results-tie-a.txt`. So on 32 singles across the two reads the speed mode is inside every bar,
  with a small loss on the first twelve and none here.

**Couples: it loses, on spending.**
- Pooled spending delivered is lower by 0.0683%, against a bar of 0.05% either way. Leaving out any one couple, it still
  fails: the nearest is -0.0558% without S133.
- Pooled survival holds at -0.023 (-0.084 to +0.038), but that nets out two cohorts going opposite ways:
  - the six library couples lose -0.150 points (-0.254 to -0.048), beyond noise;
  - two of them lose beyond noise on their own: S031 by 0.550 (-0.879 to -0.238) and S063 by 0.500 (-0.830 to -0.187). Both
    intervals are wholly below nought, but their upper ends are above the rule's -0.3, so part 2 holds;
  - the six younger couples gain +0.104 (+0.036 to +0.173), beyond noise.
- The pot is higher: +1.169% pooled, the capped pot +0.521%. On S063 the pot is higher by 10.33% and its lifetime tax
  roughly doubles, from £11,390 to £22,666 a path on average.
- A path saves less time than for a single: the median is x0.79 (x0.52 to x0.90).
- Item 12's earlier read on eight other couples also failed on spending (`results-item12-a.txt`).

**By the rule:** for singles, to you with the time it saves; for couples, the warning stays and nothing changes.

**My recommendation, for you to rule on (D90 (2), the trade):**
- **Singles:** drop the singles' warning and keep the speed mode an opt-in. On 32 singles across two reads it stays inside
  every bar while halving a path's time. I would not make it the default: the first read's small loss beyond noise says the
  whole menu is still the safer choice where time does not matter.
- **Couples:** keep it as it is, with its warning. It fails on spending in both reads, and here it loses survival beyond
  noise on the library's couples while saving a fifth of the time.

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
| a path's time, SPEED over WHOLE | beside | the median x0.54 (x0.39 to x0.67) | the median x0.79 (x0.52 to x0.90) |

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

- **Two younger couples gain survival beyond noise:** S301F +0.275 (+0.063 to +0.504) and S325F +0.275 (+0.031 to +0.530).
- **Lifetime tax and the time by unit** are in section C. The units ran four at a time, so the times are a guide.

## What it does not show

- It covers 20 singles and 12 couples, 4,000 paths of the tuning seed and one estate weight.
- It does not show why the shortlist costs the library's couples survival and gains the younger couples some, nor why
  S063's tax doubles.
- The times are measured four units at a time on this machine, not on a phone or in a browser.

## Files

`SPEED-B.md` (the rule), `audit-speed-b.mjs`, `batch-speed-b.sh`, `reduce-speed-b.mjs`, `results-speed-b.txt` (the read
whole), `speed-b-beside.mjs` and `results-speed-b-beside.txt` (beside it, written after the read).
