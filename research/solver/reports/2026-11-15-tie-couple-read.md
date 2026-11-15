# A couple's tie rule above the estate caps, read (15 Nov): FAILS

EXPLORATORY, seed 7002 (D97 (2); `TIE-C.md`, its rule committed before launch at af04f0f4). The read whole is
`results-tie-couple.txt`. Beside it, written after the read and deciding nothing:
- `results-tie-couple-beside.txt` (`tie-couple-beside.mjs`, sections A to F, from the stored arrays);
- `results-tie-couple-trace.txt` (`tie-couple-trace.mjs`: S311F solved again as the run solved it, and its two deciding paths
  traced year by year, each path's pot and tax matching the stored arrays to the penny).

Every figure below is printed in one of those files. The reviewer at the read: `reviews/2026-11-15-read-tie-couple.md`
(FAIL, two BLOCKING, answered in one fix); again, `reviews/2026-11-15-read-tie-couple-2.md` (FAIL, one new BLOCKING: the
tax's half of a sentence the first answer drew from the trace). The second is answered below, from a decomposition the trace
now prints, but not reviewed again: by D81 (F) a FAIL standing after one fix is yours.

## In plain words

The solver values what a couple leaves only up to a cap: four times what each partner opened with. Above it, a pound more
left is worth nothing to its score, so between two choices that are otherwise equal it has no reason to pick the one that
pays less tax. For a single, a tie-break has handled this since D95. This test tried the same tie-break for a couple: where
both partners are above their caps, among choices that score almost the same and spend the same at the same risk, take the
one that pays the least tax this year. It was tried at two margins of "almost the same", on the eight couples of the
couples' tier test, 8,000 paths each.

**What it found:**
- **Pooled, survival and spending are unchanged and tax falls, but most of the tax saved is one couple's.**
  - The capped pot is within 0.004% on every couple. The pooled pot is a little higher (+0.032% and +0.051%).
  - Pooled lifetime tax falls by 2.76% at the smaller margin and 3.39% at the singles' margin. S311F is 68.7% and 72.6% of
    that; without it the fall is 1.36% and 1.46%.
- **Couple by couple:**
  - The pot is higher beyond noise on seven couples at both margins. S311F's change is within noise.
  - Tax falls beyond noise on seven couples at the smaller margin; S317F's rises. At the singles' margin S317F's rises and
    S293's change is within noise.
- **It fails part 5 on S311F, and two paths decide that.** S311F's average pot left is lower by 0.692% and 0.804%, against
  the rule's bar of 0.1%.
  - Two paths carry more than the whole fall: path 4468 ends 34.1% lower and path 5461 16.8% lower, each paying more lifetime
    tax (+£763,916 and +£420,250 at the smaller margin).
  - Without those two, S311F's change is +0.263% and +0.146%, and both margins would have passed.
  - The change's paired standard error (0.671% and 0.720%) is about its own size. S311F's average is dominated by paths
    worth billions: its ten largest are 30.4% of its summed pots. So the bar, a point bar, is decided on this couple by two
    paths.
  - Where the rule pays less tax on S311F (2,541 paths at the smaller margin), the pot is higher on balance. The fall sits on
    the paths that pay more tax.
- **What happens on those two paths** (traced):
  - The two arms' moves first part in plan year 23 (plan year 12 at the singles' margin on path 4468).
  - The risk held stays the same until plan year 53, when the first partner is 90. Then, on the tie arm's path, the first
    partner's pension and ISA step three tiers down, where the candidate keeps them.
  - The candidate's own chooser, handed the tie arm's state that year, makes the same step. That state holds more in the
    taxable account and less in the ISAs: £7,078,624 against £1,435,943, and £22,000,985 against £25,504,839, on path 4468.
  - After the step the tie arm pays more tax (£896,660 against £120,439 to the end, on path 4468) and ends far lower.
- **What the step does, and what the wrappers do** (the decomposition, both paths, both margins):
  - With the first partner's tiers held where the candidate holds them from plan year 53, the tie arm's pot ends +0.06% and
    +0.02% of the candidate's at the smaller margin (+0.07% and +0.02% at the singles'). Forced onto the candidate's path,
    the step cuts its pot by 34.21% and 16.77%. So the pot's fall is the step down.
  - The extra tax is mostly not the step's. With the step undone, 80% and 90% of the tie arm's extra lifetime tax remains
    (+£614,483 and +£379,403 at the smaller margin). Forced onto the candidate, the step adds only £55,427 and £98,212.
  - On path 4468 the tie arm pays £45,150 to £84,478 a year in dividend tax from plan year 53, against the candidate's
    £2,576 to £4,903, on the larger taxable account its earlier picks left. Its yearly tax is already higher in plan years
    50 to 52.

  So on these two paths the rule's own picks, each the least tax that year, left more in the taxable account and raised
  lifetime tax. The tables' later step down, at the state those picks led to, cut the pot. Why the tables step down there,
  with both partners far above their caps, is a lead.
- **The rule never changes the risk held at the decision it acts on, but its arm's path can change later.** The replay along
  the candidate's own path shows no differing decision at another level, tier pair or below a cap. Along the tie arms' own
  paths:
  - S311F's two deciding paths hold another tier pair from plan year 53;
  - at the singles' margin the spending level differs in some year on 11 paths that survive in both arms (9 of S309F's and 2
    of S293's).

**So:** the couples' default stays as it is. By the rule the tie rule is closed and nothing is run again, and reopening it
would be yours alone. It leaves one question for you, if you want to weigh it: whether a couple's pot of billions, far above
its cap, should count against a rule like this. Here two such paths decided it. On them the rule's own picks raised
lifetime tax, and the tables' later step down left a third and a sixth less.

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

**TIE-C OUTCOME: FAILS.** By hand, no figure sits at a bar where floating point could decide it. The survival bars are on
interval ends, and part 5 on S311F is decided by two paths, not by the last digit.

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

- **S311F's other large losses** (section D): path 658 ends 18.6% and 18.5% lower at the two margins, and path 2900 32.2%
  lower at the singles' margin. These are not traced.
- **Each couple's tax change with its standard error** (section E), and each couple's figures in each arm in the read.

## What it does not show

- It covers eight couples, 8,000 paths of the tuning seed and one estate weight.
- The replay covers only the candidate's own path, on the first 100 paths. It says nothing of the decisions the tie arms take
  on their own paths, where the risk held and the spending level can differ later (above). Neither of S311F's deciding paths
  is among the 100.
- It does not show why the tables step down at 90 on those paths, with both partners far above their caps.
- It says nothing of singles, whose tie-break has been in the candidate since D95.

## Files

`TIE-C.md` (the rule), `audit-tie-couple.mjs`, `batch-tie-couple.sh`, `reduce-tie-couple.mjs`, `results-tie-couple.txt` (the
read whole), `tie-couple-beside.mjs` and `results-tie-couple-beside.txt`, `tie-couple-trace.mjs` and
`results-tie-couple-trace.txt` (beside it, written after the read), `reviews/2026-11-15-read-tie-couple.md` and `-2.md`
(the reviewer at the read, twice).
