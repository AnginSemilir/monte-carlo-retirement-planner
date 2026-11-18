# Why the household plan loses on three couples, read (18 Nov): the doubled bands on all three, the doubled cap on two

EXPLORATORY, seed 7002, deciding nothing in the app (D129 (1); the rule `HOUSEHOLD-DECOMP.md`, committed in 2b03a19a before
any unit ran; the read whole in `results-household-decomp.txt`).

## In plain words

The lead test (17 Nov) found one plan for the whole household better than today's couples' default overall, but worse
on three couples. The household plan treats the two people as one person, so it gives them one pair of income-tax
bands and one tax-free cash cap, each doubled. This run solved the household plan again with each of those left at one
person's, then both, and asked couple by couple which recovers the loss. It ran on the lead test's 4,000 simulated
markets, at the even split, the lead test's HS1:

| couple | the household plan less today's default | paths lost (L) |
|---|---|---|
| S191-90 | `-20.800` points of survival | 832 |
| S333F | `-1.025` | 52 |
| S335F | `-1.525` | 71 |

**What it found:**
- **Leaving the bands single recovers almost all of each loss.** It recovers 99.0% of S191-90's lost paths, 67.3% of
  S333F's and 74.6% of S335F's (95.5% pooled), each beyond noise.
  - The count is the paths it keeps of those lost, less the paths the household plan kept that it loses.
  - With the bands single, the household plan survives as well as today's default on all three:
    - S191-90 `+0.500` points, beyond noise above it;
    - S333F `+0.025`;
    - S335F `+0.100`.
- **Leaving the tax-free cash cap single recovers about half.** It recovers 56.7% on S191-90 and 64.8% on S335F (each
  past the rule's half) and 34.6% on S333F (under it).
- **By the rule:** S333F **RESTS ON THE BANDS**; S191-90 and S335F **EITHER**, each simplification alone recovering half
  or more.
- **Once the bands are single, the table's own plan and the couple agree.**
  - The household table on its own plan (CEIL) did far better than its moves on the couple: CEIL less HS `+21.775`,
    `+1.575` and `+1.725` points.
  - With the bands single, that gap closes to within about half a point: `-0.525`, `-0.200` and `-0.300`.
  - With the cap single, it closes only in part: `+9.825`, `+0.775` and `+0.400`.
- **Why the doubled bands overstate what these couples can use.** On S191-90 the first person holds 90% of the pensions.
  The figures below are from `results-axis.txt`, on the 829 paths the lead test's HS5 lost, a size measured on 17 Nov
  and not part of this run:
  - while both are retired before the younger's state pension age, the partner draws `£32,532` of taxable pension a year,
    more than the first person's `£29,268`, so the partner's small pension goes first;
  - after that age, the first person draws `£88,659` a year and the partner `£461`;
  - those later draws fall on one person's bands, which the doubled bands price as if shared.
  - The lost paths are ones that end the plan below the minimum pot (673 of HS's 927 on S191-90). Run on the couple, the
    plan pays more tax than its table expected, so it ends with less.
- **What it costs, and what it does not show.**
  - Single bands make the table expect more tax, so it spends less where both arms last: on the paths both keep, HSB
    spends `2.24%` less than HS on S191-90, and `0.30%` and `0.39%` less on S333F and S335F.
  - Against today's default, HSB spends `+0.46%`, `+0.16%` and `-0.27%`.
  - Single bands are a pessimistic stand-in, not a remedy: they price the couple's income as if one person had it all.
  - The read shows these losses rest on the doubled bands (and, on two of them, the doubled cap) overstating what the
    couple can use. It does not show what to put in their place.

## What comes next, by the rule ("What each outcome leads to")

- **One remedy for both the bands and the cap:** S333F calls for the bands, S191-90 and S335F for one remedy covering
  both.
  - Its first step is a design that prices each by what the two people can each use, written first with its form and
    its test.
  - It is then built off in code, in research code alone (`household.mjs`; nothing under `src/` and not the engine).
  - It is read EXPLORATORY on these three couples and the lead test's other 25, at seed 7002, by a rule committed first.
- **Design B (the axis) is not built** unless that design turns out to be the axis (D129 (2)). On these couples most of
  the bands' part falls outside the axis's window (`AXIS.md`).
- **Step 8 stays held** until the losses are fixed and re-checked on the couples that lose (D129 (3)).

## Beside, for the record

- **The gate:** fair. One code (603eeb595679) and one audit stamp. K2 and HS are the lead test's K2 and HS1 arrays byte
  for byte on all three couples, checked by the audit and again by the reducer. Each variant's plan leaves exactly its
  group single. Each table's band for gains is one person's with the bands single, and two people's otherwise.
- **The loss's counts.** The rule's text quoted the lead test's counts for HS5 (829, 51, 70). The read's L is HS1's, the
  arm the decomposition runs: 832, 52, 71.
- **The paths' cost.** Each household arm cost `50` to `69` ms a path against K2's `124` to `256`.
