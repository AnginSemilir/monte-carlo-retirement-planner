# Couples entered the other way round, stage A, read (15 Nov): NEITHER, on a tie at the bar

EXPLORATORY, seed 7002 (D100; `PART-D.md` D7; `OTHER-ORDER.md`, its rule committed before launch at 159898ef). The read
whole is `results-other-order.txt`; the figures beside it, written after the read and deciding nothing, are
`results-other-order-beside.txt` (`other-order-beside.mjs`, sections A to L). Every figure below is printed in one of those
two files. The reviewer at the read: `reviews/2026-11-15-read-other-order.md` (FAIL, one BLOCKING, answered here in one
fix).

## In plain words

The app calls the first partner entered "you". Every couple in the registered couples' tests was entered with the older
partner first: the re-run's 40 (the first registered run's own couples) and stage C's 36 units. Since D99 the solver plans
for a couple whose older partner holds more than 60% of the pots only when that partner is entered first. This test took
stage C's 24 re-held couples and entered each the other way round: the same two people, the same money, the plan ending in
the same year. Each was solved three ways and run on the same 4,000 paths:
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
- **With the option, spending is level (+0.075%), and survival is a little lower:** -0.048 points pooled (-0.085 to -0.011).
  That is a loss beyond noise, though well inside the bar of -0.2. Three couples lose beyond noise and none gains: S129-90 by
  0.500 points, S389-90 by 0.400 and S389-75 by 0.275.
- **The outcome turns on one couple's tie with the bar.** S129-90 lost 25 paths and saved 5: 20 paths net, of 4,000,
  exactly half a point. The rule fails a couple that is "below -0.5 points" with its interval wholly below nought.
  - The reducer forms the change as the difference of two rounded percentages (94.65% less 95.15%), which in floating point
    is -0.50000000000000044. So it read S129-90 as just below the bar and printed NEITHER.
  - The committed sentence says "below", and -20 paths is at the bar, not below it. Read that way, the option is within all
    three targets and the outcome would be THE OPTION.
  - But the rule names its bars as D4's targets, and D4's own words are "under 0.5 on every household". A loss of exactly
    0.5 is not under 0.5, so by the rule's named source S129-90 is outside its target and the outcome is NEITHER, on grounds
    that have nothing to do with floating point. Part (a) keeps D4's strictness ("above -0.2"); part (b) as written turns it
    round.
  - All 25 of S129-90's lost paths, and all 5 saved, are decided in the plan's last year by the pot against the couple's own
    minimum pot of £1,080,000; none runs out of money. On the lost paths the tested order's pot cleared that floor by a
    median £26,244. So the outcome turns on whether one couple's last-year pot clears its floor, the same floor the share
    choice's read turned on.

  I have not changed the reducer or read again. Which reading stands is yours to rule.
- **What is left with the option sits in the couple's joint plan and the engine's year, not in either partner's own plan.**
  - Each partner's own plan (their table) came out the same in either order on 23 of 24 couples, and the estate weight is
    the same to the bit, so what differs is downstream of the tables.
  - Yet 74,490 of the 96,000 paths still differ somewhere: an estate a pound or more apart, or another survival. Survival
    itself differs on few: 182 paths lost and 136 saved.
  - The code has four sources of it, which are leads. How much of the loss each one causes is not shown: the run kept no
    year-by-year trace. They are:
    - the joint plan takes the tax-free lump sum from the first partner's own move;
    - it takes the order a one-off cost is met in from the same move;
    - the year's draws run the first partner first;
    - between moves that score the same, the first found is kept.

    The smoke before the launch saw them part one path of S129-90.
  - The app's own rules depend on the order too, with no solver at all. Under the same policy in both orders, they part on
    7 couples, and on S237-90 beyond noise (-0.200: 8 paths lost, none saved). That is the most direct evidence that the
    engine's year depends on who is entered first.
- **On S155-75 the arms differ in money, not only in the order.** The solver's plans take the policy's name from the app's
  own pick in each order, as stage C's did. The app picked differently in the other order, so the older partner's £432,000
  windfall of 2030 lands differently:
  - entered elder first, £3,600 goes to the pension and £429,120 to the taxable account;
  - entered younger first, £20,000 goes to the ISA and £412,000 to the taxable account.

  That is why the older partner's plan differs there; the younger's is the same. This comes from the test's own rule for the
  arms, not from anything the app does with the order. Without S155-75 and S237-75 the read comes out the same: spending as
  the code stands -0.886%, and with the option S129-90 at the bar again.

**What I recommend: take the order out of the question, done in full.** When the older partner is entered second, the app
would hand the solver the couple with the older partner first, and show every figure back the way the couple entered it
("you" stays you).
- The couple would then get, bit for bit, the plan the app gives the same couple entered older first, **provided the swap
  mirrors every field the engine and the solver read in the first partner's terms.** Today's mirror (`couple-order.mjs`)
  does not yet do that. Two things must change first:
  - **The spending bands.** They are entered in the first partner's ages, and the mirror leaves them where they are. A
    couple with a band would be planned with it in the wrong years: on S129-90 with one band, the plan and its mirror spend
    differently in 6 plan years (section K). No couple in the library or in any panel has a band, so no test so far could
    see it.
  - **The age cap.** The guard keeps a couple to the app's rules when the partner entered second would pass 120 before the
    plan ends. It has to be read on the plan as entered, before any swap. A couple entered at 50 and 80 with its plan to 95
    is kept to the app's rules today; swapped first, the guard says on, and the engine runs 40 years where the plan has 45
    (section L).
- **The figures shown back need mapping too,** not only each partner's own figures:
  - the yearly rows' ages;
  - the age at which a plan fails;
  - the bands;
  - a stored solve and its restore.
- **What it would be tested by:**
  - an identity on plans entered younger first independently of the mirror, entered both ways through the page harness or
    written by hand, so the test does not rest on the mirror it checks;
  - planted faults failing it: a band left unmoved, the swap made before the age cap, the mapping back left out.
- **What stage C's PASS would then cover.** It covers the swapped solve exactly. Its comparison with the app's rules covers
  a couple entered younger first by inference only, because such a couple, with the solver off, gets the app's rules in
  that order, and those differ a little (above). On this read the solver beats the app's younger-first rules by at least
  +6.400 points on every couple (S265-90 the least), so the inference is strong on this panel, but it is an inference.
- **With that in,** the guard could open for the older partner entered second (`ELDER_FIRST` off) without stage B's
  registered run, the reviewer on the change of default. It also covers couples inside the 40%-to-60% band who are entered
  younger first, who run the solver today in an order no registered test has covered, so the reviewer should look at that
  change too.
- **It replaces D100's stage B, so it is your call.** The rule names this route for a NEITHER. My estimate is about two days
  with its tests: the mirror completed, the cap read first, the page's solve of a couple, every figure mapped back, the
  identity, and the plants.

**The other ways on:**
1. **Stage B on the option:** a registered run on a new held-out seed, the candidate with the option against the app's
   rules. Its outcome would be THE OPTION by the committed sentence, but not by D4's wording. It would test a solve that
   still differs a little from the older-first one (the three couples above).
2. **Take the order out of the joint plan and the engine's year:** the lump sum, the cost order, the draw order and the
   ties, each with its test. Then read again and register stage B. This is the slowest, and each change also moves the
   older-first figures.

**Separately: the bars.**
- **What is exposed.** The exposure is a paired change formed as the difference of two rounded percentages (`stats.mjs`
  `survivalChangeU`, and `pooledSummed` through it), compared with a bar a whole number of paths away. That is this read's
  parts (a) and (b), and the share choice's four point-change bars, none of whose figures sat near its bar.
- **What is not.** The reads running and queued (the couples' tie rule, the speed mode's wider read, the allowance step's)
  put their survival bars on interval ends, where a whole-path tie cannot arise. The change `stats.mjs` `survivalChange`
  forms from the counts is exact at a tie.
- **My proposal.** Form the paired change from the counts in `survivalChangeU`, so it is exact at a tie, with a test planting
  a unit exactly at each such bar on the side its words give: exactly -0.2 pooled fails "above -0.2", and exactly -20 of
  4,000 holds "below -0.5".
- **When.** It would go in after the tie rule's read, since `stats.mjs` is in that run's launch stamp. It moves no printed
  figure beyond the last digit.

**Separately: a defect on `main` found while checking the mirror, now fixed with its test.** A couple's plan is cut into one
plan for each partner. The cut sent the household's spending bands to the partner's plan at the partner's own ages, where
the household spends by the first partner's. It also sent the household's gifts, and its regular gift from surplus income,
whole into both plans, where every other cost is shared. It reached every couple with a band or a gift that the solver has
planned for since D99. No couple in the library or any panel has either, so no tested figure moves. The fix and its test
are in their own commit, `couple-cut.test.mjs`, its plants failing.

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

**OTHER ORDER OUTCOME: NEITHER** (the reducer). Beside it (`results-other-order-beside.txt` section A):
- With (b) counted in whole paths by the committed sentence, S129-90's change is -20 paths against the bar's -20, at the
  bar and not below it, so YOUNGE is within the targets: THE OPTION.
- By D4's wording, which the rule names as the source of its bars, a loss of exactly 0.5 is outside the target: NEITHER.

No other part sits at a bar. The next units under YOUNGE are S389-90 at -16 paths and S389-75 at -11.

## Beside the rule, deciding nothing

- **By unit:**
  - YOUNG is above ELDER beyond noise on 8 couples (the largest S129-90, +1.775) and below on 3 (S265-90, S389-90,
    S389-75);
  - YOUNGE is below on 3 (S129-90, S389-90, S389-75) and above on none.
- **How the lost paths are decided** (section I):
  - S129-90's 25 lost paths fall short of the minimum pot of £1,080,000 in the last year, YOUNGE's pot short by a median
    £44,145.
  - On S389-90, 13 of the 16 lost paths fall short of its minimum pot in the last year and 3 run out before it.
  - On S389-75, 13 of the 19 do and 6 run out before it.
- **The app's own rules in either order** (APPY less APP; section H): they part on survival on 9 of 24 couples, 7 of them
  under the same policy, and beyond noise on 2. One is S237-90, -0.200, under the same policy. The other is S237-75,
  +1.500, where the policy search picked another policy.
- **The solver against the app's younger-first rules:** ELDER, YOUNG and YOUNGE each beat APPY on every couple, by at least
  +6.400, +6.125 and +6.200 points.
- **The money:** YOUNG's mean pot is higher than ELDER's on every couple. YOUNGE's is within -1.17% to +0.65% of ELDER's.
  Lifetime tax and the paths failing in the last year below the minimum pot, by couple and arm, are in the read.
- **The guard's age cap** holds in either order as the guard stands. S015-90 entered younger first at 50 and 80, with its
  plan to 95 (the elder 125 at its end), keeps the app's rules for its ages. It does so as the guard stands, and with the
  guard opened for the elder entered second.

## What it does not show

- It covers stage C's 24 re-held couples only, the older partner holding 75% or 90%. The run used 4,000 paths of the tuning
  seed and one estate weight.
- None of these couples has a spending band, a DB pension, a gain held in the taxable account or a state pension from 67
  (section J). So the mirror and the option are untested on those.
- It does not split what is left with the option among its sources: the run kept no year-by-year trace.
- It says nothing about couples inside the 40%-to-60% band, nor about a younger partner holding more.

## Files

`OTHER-ORDER.md` (the rule), `audit-other-order.mjs`, `batch-other-order.sh`, `reduce-other-order.mjs`, `couple-order.mjs`
(the other order), `results-other-order.txt` (the read whole), `other-order-beside.mjs` and `results-other-order-beside.txt`
(beside it, written after the read), `reviews/2026-11-15-read-other-order.md` (the reviewer at the read).
