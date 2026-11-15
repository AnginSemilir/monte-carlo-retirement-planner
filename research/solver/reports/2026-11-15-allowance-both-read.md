# The allowance's step at both places, read (15 Nov): FAILS

EXPLORATORY, seed 7002 (D98; `ALLOWANCE-BOTH.md`, its rule committed before launch at bb2c48dd). The read whole is
`results-allowance-both.txt`; the figures beside it, written after the read and deciding nothing, are
`results-allowance-both-beside.txt` (`allowance-both-beside.mjs`). Every figure below is printed in one of those two files.

## In plain words

Since the harvest ceiling (13 Nov), a pension draw "to the personal allowance" stops where the year's whole tax bill would
first rise, counting the year's interest and dividends. The test of that change found it cost tax on the households with
most in their taxable accounts, for a larger pot, and the question went to the external review: should the solver be
offered the allowance at its old place as well as its new one? D98 built that offer, off in code, and this read tried it on
the review's eight households, 16,000 paths each.

**What it found:**
- **Survival is a hair higher:** +0.019 points pooled (+0.002 to +0.035), beyond noise. Spending is level (+0.0059 points of
  target).
- **The pot below the cap is a little lower:** -0.187% pooled, against the rule's bar of 0.1%. That fails part 4. The mean
  pot over all paths is -0.155%, inside its own bar of 0.5%.
- **Most of that fall is one household's.** S090's capped pot is 1.130% lower, 71.3% of the summed change. Without S090,
  part 4 would hold (-0.061%). That is beside the rule and decides nothing.
- **Tax moves both ways.** S090 pays less (£74,608 to £68,519 on average) while its capped pot falls; S188 pays more
  (£180,950 to £189,190). Pooled, lifetime tax is £84,890 under the candidate and £85,333 with the offer.
- **The solver takes the new step where it bites:** on S030 and S090 it re-wraps to the allowance at its old place in 2,028
  of 5,600 and 1,820 of 7,200 decision-years over the first 200 paths, and S188 draws through it 1,510 times.
- **The old engine-wide allowance** (beside, the arm called RAWPA) gives about the same survival (+0.020) and also fails
  the capped pot (-0.244%).
- **The solve takes x1.06 the time**, the menu 1,200 moves against 800.

**By the rule:** FAILS, so the offer is closed and reported, and nothing changes. The allowance step stays where the harvest
ceiling put it, and the external review's question is answered for this panel: no.

## The read

`reduce-allowance-both.mjs`, once, its gate fair: 8 households, code 6b2dc56b2f82, audit 07b1ad74d638, seed 7002, 16,000
paths, 45 points, the candidate 17ff82379838. Launched 15 Nov 05:35 UK through the launcher on frozen code, its runs done
07:21 UK, no unit exiting with an error.

| part | the bar | BOTH against NOW |
|---|---|---|
| 1. pooled survival | lower end above -0.1 | +0.019 (+0.002 to +0.035): holds |
| 2. a household wholly below -0.3 | none | none: holds |
| 3. pooled spending | not lower by more than 0.05 points of target | +0.0059: holds |
| 4. the pot, the capped pot | not lower by more than 0.5%, 0.1% | -0.155%, -0.187%: **fails** |
| 5. a gain | the whole score's or survival's lower end above nought | the whole score +0.014 (-0.003 to +0.030); survival's lower end +0.002: holds |

**ALLOWANCE-BOTH OUTCOME: FAILS (4).** By hand, no figure sits at a bar where floating point could decide it: the capped
pot's -0.187% is clear of its -0.1%, and the survival bars are on interval ends.

## Beside the rule, deciding nothing

- **The capped pot by household** (`results-allowance-both-beside.txt`): S090 -£15,369 (-1.130%), S188 -£4,624 (-0.253%),
  S328F -£1,378 (-0.111%), the other five within £300 either way.
- **Each household's line in each arm**, lifetime tax over all paths and over those at or below the cap, how often the new
  moves are taken, and RAWPA against NOW and against BOTH are in the read.

## What it does not show

- It covers the review's eight households, 16,000 paths of the tuning seed and one estate weight.
- It does not show why the offer lowers S090's pot below its cap while it cuts its tax.

## Files

`ALLOWANCE-BOTH.md` (the rule), `audit-allowance-both.mjs`, `batch-allowance-both.sh`, `reduce-allowance-both.mjs`,
`results-allowance-both.txt` (the read whole), `allowance-both-beside.mjs` and `results-allowance-both-beside.txt` (beside
it, written after the read).
