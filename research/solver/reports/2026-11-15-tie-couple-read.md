# A couple's tie rule above the estate caps, read (15 Nov): FAILS

EXPLORATORY, seed 7002 (D97 (2); `TIE-C.md`, its rule committed before launch at af04f0f4). The read whole is
`results-tie-couple.txt`; the figures beside it, written after the read and deciding nothing, are
`results-tie-couple-beside.txt` (`tie-couple-beside.mjs`). Every figure below is printed in one of those two files.

## In plain words

The solver values what a couple leaves only up to a cap: four times what each partner opened with. Above it, a pound more
left is worth nothing to its score, so between two choices that are otherwise equal it has no reason to pick the one that
pays less tax. For a single, a tie-break has handled this since D95. This test tried the same tie-break for a couple: where
both partners are above their caps, among choices that score almost the same and spend the same at the same risk, take the
one that pays the least tax this year. It was tried at two margins of "almost the same", on the eight couples of the
couples' tier test, 8,000 paths each.

**What it found:**
- **Pooled, it does what it is meant to.** Survival and spending are unchanged, the capped pot is within 0.004% on every
  couple, and in the replay no decision changes the spending level or the risk held. Pooled lifetime tax falls by 2.76% at
  the smaller margin and 3.39% at the singles' margin, and the pooled pot rises a little (+0.032% and +0.051%).
- **Couple by couple, six of the eight leave more and pay less.** S317F's pot is higher but its tax a little higher too, the
  only couple whose tax rises.
- **It fails on one couple's pot, S311F.** Its average pot left is lower by 0.692% and 0.804%, against the rule's bar of
  0.1%. So both margins fail part 5, and by the rule the tie rule is closed and nothing changes. Nothing is run again to pass
  it.
- **Why S311F's average falls, from the figures beside the rule:** the fall sits on a few paths with enormous pots, far
  above the cap. Its average pot under the candidate is £61,720,523.
  - The median path's pot is unchanged.
  - The pot is higher on 2,657 of the 8,000 paths and lower on 637 (at the smaller margin).
  - The 80 worst paths alone account for -£608,480 of the per-path average change, more than the whole fall of -£426,962;
    across the other paths the pot is higher on balance.
  - Its lifetime tax is lower on 2,541 paths, by £77,735 on average.

  Why paying less tax this year leaves less on those few paths is not traced: the run kept no year-by-year trace.

**So:** the couples' default stays as it is. Since part 5 failed on a mean that a few far-above-the-cap paths carry, you may
want the question looked at again with a different measure of the pot. That would be a new test with its own rule, decided
before it runs, not a re-read of this one.

## The read

`reduce-tie-couple.mjs`, once, its gate fair: 8 couples, code be2f925c8252, audit 7b9df3fbbd4b, seed 7002, 8,000 paths, 45
points, estate weight 0.02, the couples' candidate af001697ce1b. Launched 15 Nov 01:21 UK through the launcher on frozen
code, its runs done 03:52 UK, no unit exiting with an error.

| part | the bar | TIE5 (within 0.00001 of score) | TIE4 (within 0.0001) |
|---|---|---|---|
| 1. pooled survival | lower end above -0.1 | +0.000 (-0.005 to +0.005): holds | +0.000 (-0.005 to +0.005): holds |
| 2. a couple wholly below -0.3 | none | none: holds | none: holds |
| 3. pooled spending | within 0.05% | +0.0000%: holds | +0.0000%: holds |
| 4. the capped pot | pooled not below -0.1%, a couple not below -0.5% | -0.000%, none: holds | -0.000%, none: holds |
| 5. a couple's mean pot | none lower by more than 0.1% | S311F -0.692%: **fails** | S311F -0.804%: **fails** |
| 6. pooled lifetime tax | not higher | £511,945 to £497,794 (-2.76%): holds | £511,945 to £494,595 (-3.39%): holds |
| 7. the replay | no differing decision at another level, tier pair or below a cap | 2,232 differing, none so: holds | 2,462 differing, none so: holds |

**TIE-C OUTCOME: FAILS.** By hand, no figure sits at its bar: the survival bars are on interval ends, and S311F's -0.692% and
-0.804% are far past part 5's.

## Beside the rule, deciding nothing

- **The replay by couple** (section A): on the four younger couples about a fifth of the decisions are above both caps
  (21.7% to 23.3%), on the library's four from 0.9% to 16.4%. The tie arms' moves differ most on S311F, at 671 and 775
  decisions.
- **By cohort** (section B):

  | cohort | arm | the pot | lifetime tax |
  |---|---|---|---|
  | the younger four | TIE5 | -0.007% | -2.21% |
  | the younger four | TIE4 | +0.002% | -2.58% |
  | the library's four | TIE5 | +0.072% | -0.52% |
  | the library's four | TIE4 | +0.101% | -0.29% |

- **Each couple's figures** in each arm are in the read. S317F's tax is a little higher under both arms (£193,943 to
  £194,901 and £196,267), with its pot higher (+0.149% and +0.179%).

## What it does not show

- It covers eight couples, 8,000 paths of the tuning seed, one estate weight.
- It does not trace why the least tax this year leaves less in the pot on S311F's largest paths.
- It says nothing of singles, whose tie-break has been in the candidate since D95.

## Files

`TIE-C.md` (the rule), `audit-tie-couple.mjs`, `batch-tie-couple.sh`, `reduce-tie-couple.mjs`, `results-tie-couple.txt` (the
read whole), `tie-couple-beside.mjs` and `results-tie-couple-beside.txt` (beside it, written after the read).
