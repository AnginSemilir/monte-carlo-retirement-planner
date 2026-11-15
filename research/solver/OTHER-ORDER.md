# Couples in the other order, stage A's read (D100; `PART-D.md` D7; EXPLORATORY, seed 7002)

Committed before launch. It decides nothing in the code by itself. Its outcome says what stage B, the registered test,
tests, or sends the question back to the maintainer, as below.

## In plain words

The app calls the first partner entered "you". Stage C tested couples where "you" are the older partner and hold most of
the money, so since D99 the solver plans for such a couple only when the older partner is entered first. The other way round
is common: "you" are the younger partner and your older partner holds the larger pension. Those couples keep the app's rules
until this test, and then stage B, read.

This read takes stage C's own couples and enters each the other way round: the same two people, the same money, the plan
ending in the same year, only the order swapped. If the solver plans for them about as well in either order, the PASS stage C
gave the tested order can be tested again for the other order (stage B).

One known difference comes first. The joint move weighs the household's estate at the first-entered person's own weight,
0.02 of that person's opening wealth (the deep review of stage C, section 2). Entered younger first, a couple whose elder
holds 90% weighs its estate nine times as much. So each couple is solved in the other order twice: as the code stands, and
with the option that weighs the estate at the elder's weight in either order (`estateWeight: 'elder'`, built off in code;
`couple-estate.test.mjs`).

**Found at the smoke, before launch (EXPLORATORY: one path of S129-90 at 6 points, traced year by year).** Each person's
table came out the same in either order, and with the option the estate weight was the same too, yet the two runs parted
from the plan's fourth year. The joint move takes some of the household's choices from the first person's own move: whether
the tax-free lump sum is taken, and the order in which a one-off cost is met (S129-90 meets a £144,000 cost in 2029 from the
elder's pension first when the elder is entered first, and from the younger's cash first the other way round). The year's
draws also run the first person first, and between moves that score the same to the bit, the one found first is kept. The
read measures what all of this costs together. If it reads NEITHER, the report says which of these to change, or whether the
app should hand the solver a couple elder first and show the figures back the way the couple entered them.

## The question

Entered the other way round, the younger partner first, does the couples' candidate keep a couple solvent about as often as
in the order stage C tested, and spend about as much, without the option and with it?

## Units

Stage C's 24 re-held units (`couples-share-panel.json`): its twelve couples, each held so the elder, entered first, holds 75%
and 90% of the pots, each at its landed target. The twelve units with a feature are not in it.

## The orders and the arms

**The other order** (`couple-order.mjs` `otherOrder`): every field of each person's moves to the other, every account, income,
deposit and limit with its owner, and the plan's end age moves so that the plan ends in the same year. Each person's spending
share under the couples' default (`shareRule: 'pots'`) is the same in either order, since the pots' share is symmetric.

**The arms, every one run by the engine on the same first 4,000 paths of seed 7002** (the horizon is the same in both
orders, so are the paths):
- **ELDER:** the couples' candidate as stage C's CANDS ran it (`COUPLES_CANDIDATE`, `shareRule: 'pots'`, 45 points, estate
  weight 0.02, arm A's MPAA ages), the plan as tested, the elder first. With the option it is the same couple, bit for bit
  (`couple-estate.test.mjs` checks 1 to 3), so it is run once.
- **YOUNG:** the same, the plan entered the other way round, the option unset.
- **YOUNGE:** YOUNG with the option (`estateWeight: 'elder'`). Each person's tables are YOUNG's; only the joint move's estate
  weight differs.
- **APP and APPY,** beside, deciding nothing: the app's rules, arm A's pick on each order's plan.

Recorded for each person's table in each order: its digest (`solverDigest.js`), to say whether each person's table is the
same in either order.

**Cost.** About 11 core-hours, from the share ensemble's own times: two couple solves and three engine runs of 4,000 paths a
unit, and the two APP runs. That is about three hours on four free cores.

## How it is read

`reduce-other-order.mjs`, once, after its gate. The gate requires:
- every unit in every arm;
- one code and one audit stamp;
- seed 7002 and 4,000 paths in every arm;
- the couples' candidate stage C ran;
- ELDER on the plan as tested, YOUNG and YOUNGE on its other order;
- each person's spending share the same in both orders;
- YOUNGE with the option and the elder's weight, YOUNG and ELDER without it;
- the same horizon in both orders.

Each comparison is paired on the same paths (`survivalChangeU`: the change in points and its 95% interval). Each pooled
figure adds the units' paired cells into one table (`pooledSummed`).

**The rule.** For each of YOUNG and YOUNGE against ELDER, "within the targets" means three things (D4's targets, 0.5 points
a couple and 0.2 pooled, and item 12's bar on spending):
- **(a) survival, pooled:** the summed change is above -0.2 points;
- **(b) survival, by unit:** no unit is below -0.5 points with its interval wholly below nought;
- **(c) spending:** the mean spending delivered, pooled over the 24 units' paths, is not lower than ELDER's by more than
  0.1%.

**The outcomes:**
- **AS IT IS** if YOUNG is within the targets. Stage B tests the candidate as it is, in the other order.
- **THE OPTION** if YOUNG is not within them and YOUNGE is. Stage B tests the candidate with the option in it.
- **NEITHER** if neither is. Back to the maintainer, with the figures.

Either way, stage B is registered and goes to its design review and then to the maintainer before launch. Only its PASS opens
the guard for the elder entered second (`ELDER_FIRST`).

**Beside the rule, deciding nothing:**
- each unit's survival in each arm, and the changes by unit;
- the mean pot left and lifetime tax in each arm, and the spending by unit;
- APP and APPY: the app's own rules in either order;
- each person's table the same in either order or not, by digest;
- the paths on which the other order's run parts from ELDER's at all, with or without the option: with the same tables and
  the same weight, any that part show where the joint move or the engine still depends on who is entered first;
- paths failing in the last year with the pot below the minimum;
- the guard's age cap in either order: a couple entered so that the partner entered second would pass 120 before the plan
  ends (the reviewer on D99, second round, MINOR 1) is kept to the app's rules, entered either way (`couplesSwitch.js`).

## Launch

On frozen code, through the launcher, after D102's stage A (`SHARE-CHOOSE.md`) frees the cores:
`PREDICTION="none:EXPLORATORY: couples in the other order, stage A (OTHER-ORDER.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-other-order.sh`.
It runs as a harness-tracked task, relaunched under `RESUME=1` after a restart.
