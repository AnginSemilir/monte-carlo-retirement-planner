# The couples' sweep check: read, passing (12 Nov; D88, D89)

EXPLORATORY, seed 7002. The rule and the design: `research/solver/COUPLE-SWEEP.md`, committed before launch (c3b4a9a5).
The read, whole: `research/solver/results-couple-sweep.txt`, printed by `reduce-couple-sweep.mjs`.

- Run through the launcher from a clean tree at c3b4a9a5, 12 Nov 10:02 to 12:18 UK, twelve units, four at a time.
- The gate is fair: one code and audit, both arms on each couple's plan, each arm's sweep read back from each person's
  table and the engine's sweep in step with it.
- The rule's lines, as the results file prints them:

```
The rule (ISA-SWEEP.md's, as written for singles; ISA less GIA):
  1. pooled survival, the mean of d over 12 couples: +0.329 (95% +0.262 to +0.397, se 0.0345); its lower end above -0.2: HOLDS
  2. no couple's interval wholly below -0.5: none: HOLDS
  3. the mean pot left, ISA less GIA averaged over couples: +£6,463; not lower: HOLDS
  beside, deciding nothing: pooled spending delivered +0.0239 points of target; pooled lifetime tax £53,314 to £42,847 (-19.63%); couples with a lower mean pot under ISA: S175, S235, S415, S173, S079, S391; with an observed loss of survival: S091 -0.025, S029 -0.025
COUPLE-SWEEP OUTCOME: PASSES: the sweep to the ISA stands for a couple (the first reading, D87); by D88 the couples' re-run is launched as registered, the code not having moved
```

What the maintainer should know beside the outcome:

- Part 3, the pot, holds on one couple. S059 holds by far the most cash ISA money and gains most; six of the twelve leave
  a smaller mean pot under the sweep to the ISA, as the results file lists them. The rule averages over the couples and is
  read as written.
- Survival is the same or higher on ten of the twelve; the two observed losses are a net of one path each of 4,000, inside noise.
- Lifetime tax is lower pooled under the sweep to the ISA; spending delivered moves little either way.

By D88 and the maintainer's word on the check ("ok, let it finish then launch if it passes") the couples' re-run is
launched as registered (`registrations/couples-d4b.md`). The reviewer is asked to check this read beside the launch; a
FAIL on it stops the run unread and comes to the maintainer.
