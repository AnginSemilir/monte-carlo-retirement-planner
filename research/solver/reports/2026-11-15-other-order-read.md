# Couples entered the other way round, stage A, read (15 Nov): NEITHER, on a tie at the bar

EXPLORATORY, seed 7002 (D100; `PART-D.md` D7; `OTHER-ORDER.md`, its rule committed before launch at 159898ef). The read
whole is `results-other-order.txt`; the figures beside it, written after the read and deciding nothing, are
`results-other-order-beside.txt` (`other-order-beside.mjs`). Every figure below is printed in one of those two files.

## In plain words

The app calls the first partner entered "you". Every couple in the registered couples' tests was entered with the older
partner first: the re-run's 40 (the first registered run's own couples) and stage C's 36 units. Since D99 the solver plans
for a couple whose older
partner holds more than 60% of the pots only when that partner is entered first. This test took stage C's 24 re-held couples
and entered each the other way round: the same two people, the same money, the plan ending in the same year. Each was solved
three ways and run on the same 4,000 paths:
- **ELDER:** as stage C tested it;
- **YOUNG:** the other way round, as the code stands;
- **YOUNGE:** the other way round, with the option that weighs the estate at the older partner's weight whichever partner is
  first.

**What it found:**
- **As the code stands, the order changes what the solver aims for.** The weight the couple's plan puts on the money left at
  the end is tied to the first partner's own savings. Entered younger first, each pound left counts 3 times as much for the
  75/25 couples and 9 times as much for the 90/10 couples. So the solver keeps more and spends less:
  - the average pot left is higher on all 24 couples (by +2.57% on the couples' average);
  - spending is lower on all 24, by -0.905% pooled, against the rule's bar of 0.1%;
  - survival is a little higher, +0.143 points pooled.

  By the rule this fails on spending.
- **With the option, spending is level (+0.075%) and survival nearly so** (-0.048 points pooled, inside the bar of -0.2).
  Three couples still lose a little beyond noise and none gains: S129-90 by 0.500 points, S389-90 by 0.400 and S389-75 by
  0.275.
- **The outcome turns on a tie.** S129-90 lost 25 paths and saved 5: 20 paths net, of 4,000, exactly half a point. The rule
  fails a couple that is "below -0.5 points" with its interval wholly below nought.
  - The reducer works in floating point, where 20 of 4,000 comes out as -0.50000000000000044. So it read S129-90 as just
    below the bar and printed NEITHER.
  - Counted in whole paths, S129-90 is exactly at the bar, not below it. Taken that way, the option is within all three
    targets and the outcome would be THE OPTION.

  I have not changed the reducer or read again. Which reading stands is yours to rule.
- **With the option, some dependence on the order remains, and its known causes are in the couple's joint plan and the
  engine's year, not in either partner's own plan.**
  - Each partner's own plan (their table) came out the same in either order on 23 of 24 couples.
  - Yet 74,490 of the 96,000 paths still differ somewhere: an estate a pound or more apart, or another survival. Survival
    itself differs on few: 182 paths lost and 136 saved.
  - The smoke before the launch traced why on S129-90. The joint plan takes the tax-free lump sum, and the order a one-off
    cost is met in, from the first partner's own move. The year's draws run the first partner first. Between moves that
    score the same, the first found is kept.
- **On two couples the app's own rules picked a different policy in the other order.** The solver's plans take the policy's
  name from the app's pick, as stage C's did. On S155-75 the older partner's plan changed with it; why was not traced. Without
  S155-75 and S237-75 the read comes out the same: spending as the code stands -0.886%, and with the option S129-90 at the
  bar again.

**What I recommend: take the order out of the question.** When the older partner is entered second, the app would hand the
solver the couple with the older partner first, and show every figure back the way the couple entered it ("you" stays you).
- A couple entered younger first then gets, bit for bit, the plan the app already gives the same couple entered older
  first, which stage C's PASS covers.
- It needs no change to the solver and costs no solve time.
- What needs testing is the swap and the mapping back:
  - an identity: each of stage C's 24 couples, entered younger first, gets the older-first plan's moves and figures exactly,
    each partner's under their own name;
  - the couples' screens in the page harness, entered both ways;
  - a planted fault (the mapping back left out) failing both.
- With that in, the guard could open for the older partner entered second (`ELDER_FIRST` off) without stage B's registered
  run, since the solve is the tested one; the reviewer on the change of default.
- It also covers couples inside the 40%-to-60% band who are entered younger first. Those run the solver today in an order
  no registered test has covered, so the reviewer should look at that change too.
- It replaces D100's stage B, so it is your call. My estimate is about a day with its tests: the guard, the page's solve of
  a couple, and each figure the couples' screens show per partner.

**The other ways on:**
1. **Stage B on the option,** as the rule's words would have it: a registered run on a new held-out seed, the candidate with
   the option against the app's rules. It would test a solve that still differs a little from the older-first one (the
   three couples above).
2. **Take the order out of the joint plan and the engine's year:** the lump sum, the cost order, the draw order and the
   ties, each with its test. Then read again and register stage B. This is the slowest, and each change also moves the
   older-first figures.

**Separately: the bars.** A change counted in whole paths can land exactly on a bar, and floating point can put it a hair to
either side. Once you have ruled which way a tie reads, I propose that the reads still to launch (the speed mode's wider
read and the allowance step's) compare at their bars in whole paths, with a test of the class. The couples' tie rule's read,
running now, has its reducer fixed by its launch stamp; at its read I would check any figure at a bar by hand and say so.

## The read

`reduce-other-order.mjs`, once, its gate fair: 24 re-held units of stage C's panel, code df5511a96f99, audit af4f9ea14c3a,
seed 7002, 4,000 paths, 45 points, estate weight 0.02, the couples' candidate af001697ce1b. Launched 14 Nov 21:57 UK through
the launcher on frozen code, its runs done 15 Nov 01:15 UK, no unit exiting with an error.

The rule, each against ELDER:
- (a) the summed change above -0.2 points;
- (b) no unit below -0.5 points with its interval wholly below nought;
- (c) the spending delivered, pooled, not lower by more than 0.1%.

| arm | (a) survival, pooled | (b) units | (c) spending | the reducer's verdict |
|---|---|---|---|---|
| YOUNG | +0.143 (+0.097 to +0.189): holds | none: holds | -0.905%: fails | not within them |
| YOUNGE | -0.048 (-0.085 to -0.011): holds | S129-90: fails | +0.075%: holds | not within them |

**OTHER ORDER OUTCOME: NEITHER** (the reducer). Beside it, with (b) counted in whole paths: S129-90's change is -20 paths
against the bar's -20, at the bar and not below it, so YOUNGE is within the targets: THE OPTION
(`results-other-order-beside.txt` section A).

## Beside the rule, deciding nothing

- **By unit:**
  - YOUNG is above ELDER beyond noise on 8 couples (the largest S129-90, +1.775) and below on 3 (S265-90, S389-90,
    S389-75);
  - YOUNGE is below on 3 (S129-90, S389-90, S389-75) and above on none.
- **The app's own rules in either order** (APPY less APP): +0.051 points summed. S237-75's is +1.500, where the policy
  search picked another policy.
- **The money:** YOUNG's mean pot is higher than ELDER's on every couple. YOUNGE's is within -1.17% to +0.65% of ELDER's.
  Lifetime tax and the paths failing in the last year below the minimum pot, by couple and arm, are in the read.
- **The guard's age cap** holds in either order: S015-90 entered younger first at 50 and 80 with its plan to 95 (the elder 125
  at its end) keeps the app's rules for its ages, as the guard stands and with it opened for the elder entered second.

## What it does not show

- It covers stage C's 24 re-held couples only, the older partner holding 75% or 90%. The run used 4,000 paths of the tuning
  seed and one estate weight.
- It does not split what is left with the option among its causes: the run kept no year-by-year trace.
- It says nothing about couples inside the 40%-to-60% band, nor about a younger partner holding more.

## Files

`OTHER-ORDER.md` (the rule), `audit-other-order.mjs`, `batch-other-order.sh`, `reduce-other-order.mjs`, `couple-order.mjs`
(the other order), `results-other-order.txt` (the read whole), `other-order-beside.mjs` and `results-other-order-beside.txt`
(beside it, written after the read).
