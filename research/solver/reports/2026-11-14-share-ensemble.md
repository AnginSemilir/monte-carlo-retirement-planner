# The share ensemble, read (14 Nov): THE SHARE'S MEASURE, and the maintainer's option 2 (D102)

## In plain words

A couple's plan is worked out as two plans, one for each partner, and the household's spending is split between them.
Since today's change (D99), the split follows the savings each partner holds today, and is half each when they hold 40%
to 60%. The deep review asked whether that split is the best one. This test tried other splits on ten couples from
stage C.

**What it found:**
- On 7 of the 10 couples, some other split kept the money lasting clearly more often than today's.
- On average the best split tried was about 2 points better.
- Every split tried, today's included, still beat the app's own rules on every couple, by 4.6 to 14.4 points. Nothing here
  is a reason to hold couples back.

**What it does not show:**
- **Which split is best in general.** The best split varied from couple to couple, and on two couples today's split was
  already the best or level.
- **That counting each partner's full means is the answer.** Their pensions and future contributions as well as their
  savings fit 7 of the 10 cases. But simply giving the older partner 70% to 80% fitted 8. And on the couple built to tell
  the two readings apart, the split nearest the full means did worst.
- **Why the final-salary pension couples gained.** Those couples hold their savings 60/40, where today's rule says "half
  each". Splitting them 60/40 by their savings, the rule without its band, captured most of the gain. So the band may be
  the cost, not the pension. The couples the solver already plans for may gain from a better split too.

**What happens next, by your choice (option 2, D102):** the solver is to choose each couple's split itself. It works the
plan out at a few splits and keeps the one its own forecast rates best. That is built first as an option, switched off,
and tested exploratorily on these couples and some plain 60/40 ones, beside the full-means split. Whichever holds up then
gets a registered test, and only that can change the default. Today's split stays until then.

## The outcome

`SHARE-ENSEMBLE.md`, its rule committed before launch (ed29f25d); launched 14 Nov 14:57 UK from edb5f861 through the
launcher (code b7cd77e5ebec, audit 9adb8c1e7fca), runs done 16:08 UK. Read once by `reduce-share-ensemble.mjs`; its output
whole is in `results-share-ensemble.txt`. The gate is fair. EXPLORATORY, seed 7002, 4,000 paths.

| part of the rule | result |
|---|---|
| (a) another share beats the pots' on at least two of S211-db, S291-db, S211-75pdb | S211-db (0.6: +6.150), S291-db (0.7: +4.200): holds |
| (b) on S129-90 or S019-90 | S019-90 (0.8: +1.225): holds |
| (c) the best share's mean gain over the pots', pooled over nine units | +1.978 points: holds |

**OUTCOME: THE SHARE'S MEASURE.** By its rule, D99 stands for what stage C held. Every share of every unit is above the
app's rules beyond noise, from +4.575 (S211-db at 0.5) to +14.350.

## The reviewer at the read: PASS, eight MINORs (`reviews/2026-11-14-read-share-ensemble.md`)

The read was made once, by the rule as committed:
- every stamp file was unchanged from the rule's commit to the read;
- the reducer reproduces the results file byte for byte;
- every figure was recomputed from the arrays.

What a fair write-up must say, and says above:
1. **Part (a) cannot tell the DB income from the 40% to 60% band.** The DB units hold 60/40, where the band puts the share
   at 0.5. Their plain pots' share would be 0.6, and that takes most of the gain: all of S211-db's +6.150, and 3.625 of
   S291-db's 4.2. Stage A's 60/40 couples without a DB also did better at 0.6 on six of six (500 paths, not paired). This
   run has no plain 60/40 unit.
2. **The means fit, and so do the alternatives.** Counting each person's means as the deep review did (pots, contributions
   to come, state and DB pensions, 2.5% real):
   - the share nearest the means is best or level on 7 of 9 units;
   - a first-person share of about 0.7 to 0.8 fits 8 of 9;
   - on S211-75pdb, the case meant to tell them apart, the share nearest its means (0.65) is the worst, beyond noise;
   - on S291-db, S129-db and S015-db survival is still rising at 0.7, the edge of the grid.
3. **The share also moves each person's minimum pot.** `singlePlanFor` scales it, and S019-90's beat in (b) is entirely
   minimum-pot paths in the last year (49 of 49). The DB units' gains come mid-plan.
4. **The 90/10 holding costs points that no share recovers.** S129-90 against S129-75 at the same share (0.75):
   -5.95 points; at S129-90's best share (0.9): -2.775. The app's rules, re-held the same way: -0.325. The joint estate
   weight (the deep review's lead, its condition now met) is carried as a lead, not a cause.
5. **The post hoc pick of the best share is a small bias.** With no true effect, (c) would average 0.111. Picking on one
   half of the paths and scoring on the other gives 1.933 and 1.961, against 1.978 in sample.
6. **Differences under about half a point between shares may be the 45-point solve's own error.** S211-75pdb is V-shaped
   in the share.
7. **The arms' records are built from names, not read back from the solve.** The settings lines show the solves were
   stage C's.
8. **The run cannot speak to the solver choosing the share, or to the joint estate weight.** It stored no forecast, and
   the weight does not move with the share within a unit.

## The maintainer's choice: option 2 (D102)

The rule's outcome named a share from each person's means, built off in code and tested before it could become a
default. Put to the maintainer as two options:
1. that fixed rule;
2. the solver choosing the share itself.

The maintainer chose option 2. The reviewer's findings support it: no single rule fitted every couple, and the band itself
may be the cost for 60/40 couples.

The plan (`PART-D.md` D8):
- **The build.** `shareRule: 'choose'`, a research option, off in code. Each couple is solved at a few first-person shares
  around its own. The solver keeps the share whose couple its own forecast at the start rates best, the same joint value
  the rollout maximises. Each forecast is stored. The test of its class: the pick is the best forecast, and the option
  unset changes nothing bit for bit.
- **The exploratory read**, its rule committed first:
  - the units: these ten, plus plain 60/40 couples without a DB;
  - the arms, all on the same paths: the solver's pick, the full-means share, the pots' share and the shares tried;
  - the reading: whether the forecast ranks the shares as the simulation does, and the pick's gain over the pots' share
    against D4's targets;
  - its cost in solve time, with a light first pass to choose and the chosen share solved in full, so a couple's solve in
    the app stays near today's time.
- **Then a registered test** of whichever holds up, its registration to the maintainer before launch. Only that can
  change the default.
