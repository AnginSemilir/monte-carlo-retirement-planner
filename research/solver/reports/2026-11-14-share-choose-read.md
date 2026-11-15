# The solver choosing a couple's share, stage A, read (14 Nov): THE FORECAST MISSES

## In plain words

A couple's plan is worked out as two plans, one for each partner. The household's spending is split between them, and so
is the minimum pot the plan must leave at the end. You chose (D102) to let the solver choose that split itself: it works
the plan out at a few splits and keeps the one its own forecast rates best. This test asked whether the forecast can be
trusted to choose well. It worked out 14 couples at five or six splits each, and simulated every split on the same 4,000
paths.

**What it found:**
- **The forecast does not choose reliably.** On two couples it chose a split that failed clearly more often than the best
  split tried:
  - S129-75, by 2.950 points. Almost all of it is the plan ending below its minimum pot of £1,080,000 (113 of 118 paths),
    not running out of money.
  - S183-spa67, by 2.675 points. Most of it is running out of money before the end (94 of 111 paths).

  Across all 14, the best split beat the forecast's choice by 0.464 points. It was chosen fairly, on one half of the paths
  and scored on the other. The bar was 0.2.
- **The forecast's choice still beats today's split overall,** by 1.089 points. It is worse beyond noise on the same two
  couples.
- **The fixed split by each partner's full means does better than the forecast.** This was the other option you were
  offered. It beats the forecast's choice by 0.359 points overall, and today's split by 1.448.
  - **Most of that gain is just dropping today's 40%-to-60% band.** Eight of these couples hold 60/40, where today's rule
    says "half each". Splitting them 60/40 by their savings gains 1.950 points over today's on those eight. Over all 14
    that is 1.114 of the means' 1.448.
  - **The means add 0.334 on top, measured only on couples picked for it.** On the four plain couples new to this test, the
    means' split is level with dropping the band. Its extra gain comes from the ten couples the deep review chose because
    their savings and their means differ.
  - **It loses beyond noise on two couples, both through the minimum pot.** S129-90 loses 0.950 points and S129-75 loses
    0.225. Every path they lose ends the plan below the minimum pot.
  - **The gain is in survival, partly paid for from the pot.** Spending is up a little on 11 of 14 couples. But the average
    pot left is lower beyond noise on 7 of 14, by up to £567,268 (S211-db).
- **Choosing the split by a short simulation does about as well as the means' split, but is far too slow.** This takes the
  split that does best on 1,000 paths and scores it on the other 3,000.
  - It gains 1.548 points over today's split, and 0.081 over the means' split. No couple does worse than under today's
    beyond noise.
  - It needs every split worked out and simulated. By this run's own clocks that is about ten to eleven times a couple's
    solve today (x11.42; x10.04 if the chosen split's paths are reused for the plan's own figures). D103's target is at most
    a quarter more.
- **Neither quick first pass can stand in for the full forecast.** One was at 15 wealth points, the other at 6. Each chose
  worse than the full forecast, beyond the bar, on some couples.

**By the rule: THE FORECAST MISSES.** Nothing is built for the app, and it comes to you with the figures. Today's split (the
pots', D99) stays.

## The outcome

`SHARE-CHOOSE.md`, its rule committed before launch (4380aa81). Launched 14 Nov 17:37 UK through the launcher (code
b7cd77e5ebec, audit 13446e2e2128); runs done 21:51 UK. Read once by `reduce-share-choose.mjs`, its output whole in
`results-share-choose.txt`. The gate is fair. EXPLORATORY, seed 7002, 4,000 paths, 45 points, estate weight 0.02.

| part of the rule | result |
|---|---|
| (i) on each unit, no split more than 0.5 points better than the pick beyond noise | fails on S129-75 (0.75: +2.950, +2.451 to +3.511) and S183-spa67 (0.6: +2.675, +2.182 to +3.232) |
| (i) pooled, the best split (chosen on one half, scored on the other) less the pick, under 0.2 | +0.464 (+0.396 to +0.534): fails |
| (ii) the pick less today's split, pooled, its lower end above -0.1 | +1.089 (+0.970 to +1.211): holds |
| (ii) no unit below -0.5 with its interval wholly below nought | S129-75 (-2.950), S183-spa67 (-1.350): fails |
| said first: the means' split beats the pick pooled by more than 0.2 beyond noise | the pick less the means' split -0.359 (-0.439 to -0.280): said |
| (iv) the 15-point pass, its pick solved in full less the full pick | pooled -0.145 (-0.184 to -0.106), above -0.2; below -0.5 beyond noise on S237-90 (-0.825) and S019-90 (-1.225): fails |
| (iv) the 6-point pass, the same | pooled -0.241 (-0.284 to -0.200), below -0.2; S129-db (-3.375): fails on both counts |

**OUTCOME: THE FORECAST MISSES** ((i) fails).

## Beside the rule, deciding nothing

From `results-share-choose.txt`, and from `results-share-choose-beside.txt` (`share-choose-beside.mjs`). That script was
written after the read, partly at the reviewer's request. It reads the same units on the same paths and prints the figures
your choice turns on that the read does not.

**Survival, by couple.** The split is the first person's share of the spending and of the minimum pot. Each figure is a
change in survival points, paired on the same 4,000 paths. Where the means' split rounds to a split on the grid (S265-90,
S019-90, S043-gain), that split's own run is used.

| couple | today's split | without the band | the means' split | the forecast's pick | the means' split less today's | the forecast's pick less today's |
|---|---|---|---|---|---|---|
| S211-75pdb | 0.75 | 0.75 | 0.6089 | 0.6 | -0.175 (-0.477 to +0.116) | +0.075 (-0.219 to +0.374) |
| S129-75 | 0.75 | 0.75 | 0.7314 | 0.9 | -0.225 (-0.434 to -0.036) | -2.950 (-3.511 to -2.451) |
| S291-db | 0.5 | 0.6 | 0.6542 | 0.7 | +3.975 (+3.361 to +4.636) | +4.200 (+3.596 to +4.856) |
| S265-spa67 | 0.5 | 0.6 | 0.5910 | 0.6 | -0.050 (-0.452 to +0.351) | -0.075 (-0.480 to +0.328) |
| S389-gain | 0.5 | 0.6 | 0.5834 | 0.6 | +0.375 (+0.089 to +0.679) | +0.275 (-0.060 to +0.621) |
| S211-db | 0.5 | 0.6 | 0.6468 | 0.7 | +6.575 (+5.810 to +7.390) | +6.125 (+5.397 to +6.903) |
| S237-90 | 0.9 | 0.9 | 0.8374 | 0.8 | +0.675 (+0.405 to +0.976) | +0.825 (+0.541 to +1.144) |
| S129-90 | 0.9 | 0.9 | 0.8643 | 0.9 | -0.950 (-1.384 to -0.537) | +0.000 (-0.087 to +0.087) |
| S129-db | 0.5 | 0.6 | 0.6298 | 0.8 | +1.150 (+0.797 to +1.547) | +0.475 (+0.130 to +0.838) |
| S183-spa67 | 0.5 | 0.6 | 0.5747 | 0.7 | +1.300 (+0.947 to +1.708) | -1.350 (-1.803 to -0.935) |
| S265-90 | 0.9 | 0.9 | 0.7011 | 0.7 | +2.800 (+2.278 to +3.358) | +2.800 (+2.278 to +3.358) |
| S015-db | 0.5 | 0.6 | 0.6918 | 0.7 | +1.700 (+1.301 to +2.165) | +1.725 (+1.324 to +2.193) |
| S019-90 | 0.9 | 0.9 | 0.8048 | 0.8 | +1.225 (+0.898 to +1.601) | +1.225 (+0.898 to +1.601) |
| S043-gain | 0.5 | 0.6 | 0.5963 | 0.6 | +1.900 (+1.419 to +2.426) | +1.900 (+1.419 to +2.426) |
| **pooled** | | | | | **+1.448 (+1.331 to +1.568)** | **+1.089 (+0.970 to +1.211)** |

**Without the band** is the split by each person's share of the pots with D99's 40%-to-60% band taken away: today's rule
on the six couples outside the band, the run at 0.6 on the eight 60/40 couples.
- It gains +1.114 (+1.016 to +1.215) over today's, pooled over the 14. On the eight couples inside the band, the only
  ones where it changes the split, it gains +1.950 (+1.780 to +2.126). Every one of them holds exactly 60/40 with the elder
  entered first.
- The means' split gains +0.334 (+0.253 to +0.416) over it.
- **On the four plain couples, the only ones new to this test:** the means' split less today's is +0.881 (+0.687 to
  +1.083). Without the band is +0.856 (+0.652 to +1.067), so the means less it is +0.025 (-0.091 to +0.141). The
  simulation's pick less the means is -0.125 (-0.301 to +0.049).
- **On the share ensemble's ten:** without the band less today's is +1.218, the means less it +0.457 (+0.353 to +0.564),
  and the simulation's pick less the means +0.163 (+0.079 to +0.249).

**The minimum pot.** The share cuts the household's minimum pot between the two partners as it cuts the spending
(`couple.js` `singlePlanFor`). S129's couples must end with £1,080,000:
- at 0.9 the first person's table aims to leave £972,000 and the second person's £108,000;
- at the means' 0.86 they aim for £928,800 and £151,200, against £240,000 of the second person's pots on S129-90.

Of all 18,484 failing paths in the solver's runs, 9,444 end the plan below the minimum pot; none fails in the last year
otherwise. The paths that split the comparisons:

| comparison | lost | of which below the minimum pot at the end | saved |
|---|---|---|---|
| S129-75, the forecast's pick (0.9) against the best tried (0.75) | 118 | 113 | 0 |
| S183-spa67, the forecast's pick (0.7) against the best tried (0.6) | 111 | 17 | 4 |
| S129-90, the means' split against today's | 55 | 55 | 17, all at the minimum pot |
| S129-75, the means' split against today's | 11 | 11 | 2, both at the minimum pot |

**Spending, the pot and tax**, each design against today's split, paired by path. Beyond noise means more than 1.96 standard
errors from nought.

| design (on the last 3,000 paths, for a like-for-like comparison) | spending, mean change over couples | couples with the pot lower beyond noise | the pot, mean change over couples | couples with lifetime tax higher |
|---|---|---|---|---|
| the means' split | +0.32% | 7 of 14 | -3.60% | 6 |
| the simulation's pick | +0.05% | 6 of 14 | -2.37% | 6 |
| the forecast's pick | -0.18% | 5 of 14 | -1.55% | 8 |

On all 4,000 paths, the means' split's pot is lower beyond noise on 7 couples. The largest falls are S211-db (-£567,268),
S129-db (-£509,667) and S043-gain (-£271,655). Its spending is up beyond noise on 11 couples and down on 3 (S211-db -0.98%).

**Solve time** of the designs, against one full solve at today's split, by the run's own clocks: the median over the 14,
with the range. It is a guide only: four units ran at a time, and the pre-commit hook ran beside part of the run.

| | median | range |
|---|---|---|
| every split solved in full | x4.93 | x3.67 to x8.04 |
| 1,000 simulated paths at every split | x6.42 | |
| **both together: a choice by simulation** | **x11.42** | **x7.92 to x18.43** |
| the same, the chosen split's paths reused for the plan's own figures | x10.04 | |
| the 15-point pass over the grid, then its pick in full | x2.92 | |
| the 6-point pass, the same | x1.76 | |
| the means' split, or the band dropped | x1 | (one solve, as today) |

**The forecast.** At the start of the plan it is the joint move's score:
- the two tables' own chances that each half lasts, multiplied;
- plus the estate term;
- less this year's and the coming years' cuts.

Each chance is judged against that partner's share of the minimum pot. In a bridge year the two are read with their
accessible money shared. Seven of the 14 couples have a forecast above 1, up to 1.059400. The estate term is a few
hundredths, the size of the differences the forecast has to rank. How well its order matches the simulation's (Kendall's
tau, averaged over the 14) is +0.66.

The share ensemble's arms that this run repeats are the same path for path, in survival and estate, on 22 of 22.

## What it does not show

- **Why the forecast misses.** A lead, not shown. It multiplies the two partners' chances as if their halves were
  independent, each judged against a share of the minimum pot. The simulated household spends from both, and ends judged
  against one pot. So on S129-90 at a 0.5 split, the second person's table must leave £540,000 from £240,000 of pots. The
  forecast there is 0.018, where the couple survives 79.13% of paths. Near the top the forecast can be nearly flat where
  survival is not: on S183-spa67 it is 0.942618 at 0.6 and 0.943066 at 0.7, while survival falls from 98.67% to 96.00%. The
  run kept the forecast's total only, so its parts cannot be separated.
- **Whether splitting the minimum pot by the share is right.** Every design here cuts the minimum pot by the same share as
  the spending, as today's code does. Splitting them separately is a design choice of its own, untested.
- **A held-out estimate.** All 14 couples are stage C's, on the tuning seed. Ten were picked because the split matters
  there, and the means' gain beyond the band was measured only on them.

## The choice for you

The forecast cannot choose the split, so option 2 as planned, the solver choosing by its own forecast, is off the table.
Three ways on:

1. **A fixed rule, tested before it can change the default (my recommendation).** Two candidates go into one registered
   test against today's split:
   - **the band dropped:** the split by each partner's share of the savings, for every couple;
   - **the means' split:** the split by each partner's full means.

   **Why:**
   - neither adds solve time, so D103's speed work is not needed;
   - between them they hold almost all the gain measured here;
   - the test can tell them apart. Its couples should include ones where the two differ: 90/10 holdings, final-salary
     pensions and different state pension ages.

   **One gap the test must close:** dropping the band was measured only on couples holding exactly 60/40 with the elder
   entered first. For every couple it would also set splits between 0.5 and 0.6, and below a half where the first person
   holds 40% to 50%. There the estate is weighed at the smaller holder's table's weight, D100's open question. The test
   either includes such couples, or the rule is scoped to what it tested.

   **What happens next:** the registration comes to you before launch. It says beforehand what happens to a couple that
   loses, as S129-90 does under the means' split.
2. **A choice by short simulation, after speed work.**
   - **For it:** the best figures here, +0.081 points over the means' split.
   - **Against it:** about ten to eleven times a couple's solve today. D103's target would need about nine-tenths of that
     cut. A smaller version, trying only a few splits around the means' split, is unmeasured.
3. **Keep today's split.** On these couples it is about 1.4 points behind the means' split.

**Meanwhile**, as queued, none of it waiting on this choice:
- couples entered the other way round (D100's stage A), launched 14 Nov 21:57 UK;
- then the couples' tie rule;
- then the speed mode's wider read;
- then the allowance's step at both places (D98).

## The reviewer at the read

`reviews/2026-11-14-read-share-choose.md`: **FAIL, one BLOCKING and four MINORs.**
- **What it confirmed:** the read was made once, by the rule as committed, the gate fair, every figure recomputed from the
  arrays, and the outcome right.
- **The BLOCKING finding:** the first draft costed a choice by simulation at its solves alone, about five times. It is ten
  to eleven times with its simulated paths.
- **The four MINORs:**
  - the minimum pot's part in the losses;
  - the forecast's terms;
  - how much of the means' gain is the band's removal;
  - the pot and spending beside survival.

All five are answered above, each figure printed by `share-choose-beside.mjs`.

The reviewer again (`reviews/2026-11-14-read-share-choose-2.md`): **PASS, two MINORs**, every figure reproduced from the
arrays and both scripts' output byte for byte. Both MINORs are answered above:
- the band's removal was tried only at 60/40 with the elder first;
- the 60/40 couples' own gain is +1.950 on those eight, the +1.114 being pooled over all 14.
