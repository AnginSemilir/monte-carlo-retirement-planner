# The household plan's allowances at what the two people can use: the remedy's design (D129 (1), (3); EXPLORATORY)

Written 18 Nov (evening), after the decomposition's read, and committed before anything of it is built. The
decomposition's rule (`HOUSEHOLD-DECOMP.md`, "What each outcome leads to") asks for this design, "written first with its
form and its test", then the build, off in code in research code alone, then a read on the lead test's 28 units by a
rule committed first. EXPLORATORY: nothing in the app, its defaults or the candidate changes, and nothing under `src/` or
`research/engine.mjs` is edited (the solver's code id stays 603eeb595679).

## What the decomposition found (`results-household-decomp.txt`)

- **The doubled income-tax bands carry all three losses.** Leaving them single recovers 99.0%, 67.3% and 74.6% of the
  paths lost (S191-90, S333F, S335F). With them single, the household table's own plan and the couple agree to within
  about half a point.
- **The doubled tax-free cash cap carries about half of two of them** (56.7% on S191-90, 64.8% on S335F).
- Single allowances are a pessimistic stand-in: they price the couple's income as if one person had it all. The remedy
  has to price what the two can actually use.
- **Where the couple departs from the pricing** (`results-axis.txt`, the lead test's HS5 paths):
  - at the even split, the smaller pension is drawn first: on S191-90 the partner draws `£32,532` a year while both are
    retired before the younger's state pension age, more than the first person's `£29,268`;
  - after that, the first person draws `£88,659` a year and the partner `£461`.
  - So the household's draws fall more and more on one person's bands as the plan goes on.

## The design: two parts, each a research option off unless asked

**Part 1, the allowances priced at the pensions' split** (`householdPlanFor`, `opts.scale: 'pensions'`):
- Let `s` be the larger person's share of the two pensions at the plan's start (from `0.5` to `1`; `0.5` where neither
  holds a pension), and `k = 1 / s`: `2` at an even split, `1.667` at 60/40, `1.111` at 90/10.
- **The personal allowance stays doubled.** Each person's own allowance takes their own state pension and other incomes
  first.
- **Each band's width above the allowance is one person's times `k`.** A band limit `L` (an income level: the UK basic
  and higher limits, each Scottish limit, the allowance's taper threshold) becomes `2 x PA + k x (L - PA)`.
- **The band for capital gains is one person's times `k`.** The engine reads it off the default basic band and the
  plan's allowance, so the table is solved inside a band of `k` times one person's: `twoBands` generalised to a factor.
- **The tax-free cash cap is one person's times `k`.**
- Every other allowance stays doubled: ISA, savings, dividend and capital gains allowances, NIC thresholds, the pension
  allowances.
- **Why `k = 1 / s`.** When the two people draw their pensions in proportion to what they hold, the larger holder reaches
  the top of each band, and of their cap, when the household's draws reach `1 / s` times one person's. So `k = 1 / s` is
  exact for proportional draws, and doubling (`k = 2`) is its even case.

**Part 2, the funding split at the pensions' share** (`chooseHouseholdSingle`, `cp.split: 'pensions'`):
- Each year, the first person funds the share of the year's need that their pension is of the two pensions as they
  stand that year. Where both pensions are empty, the share is their part of all the household's pots, and the even
  split where those are empty too.
- So the two pensions are drawn down in proportion, and part 1's pricing describes the year the couple lives.
- At the even split the smaller pension goes first, and the pricing's assumption breaks as the plan goes on.
- Neither part needs a state the household table lacks. The pricing is fixed at the plan's start, and part 2 keeps the
  couple near it, where design B's axis carries the share as a state (`AXIS.md`).

## The test (`household.test.mjs` group 10, the full tier; each check shown failing on its plant)

1. **The plan under part 1:**
   - each band limit is `2 x PA + k x (L - PA)`, the cap `k x` one person's, and every other doubled entry design A's;
   - on a couple whose pensions are even, `k = 2`, so the plan is design A's byte for byte;
   - unset, the plan is design A's byte for byte.
   - Plant `scaleall`: the allowance scaled with the bands.
2. **The solve under part 1:** the table's band for gains is `k` times one person's, and the engine's default is the same
   after the solve.
   - Plant `scalecgt`: the bands scaled, the solve inside `twoBands`; `solveHousehold`'s own check refuses it.
3. **Part 2's split:** at every decision along a path, the move's split is the first person's share of the two pensions as
   they stand. Where the pensions are empty it is the share of all pots, then the even split.
   - The engine under the policy and `runHouseholdSinglePolicy` agree on every path.
   - Plant `splitstart`: the share read from the plan's start, not the year's.

## The read (its rule, `HOUSEHOLD-REMEDY-READ.md`, committed before it runs)

- **Units and paths:** the lead test's 28 units and its 4,000 paths of seed 7002, at `45` points.
- **K2 and HS** are the lead test's stored arrays. Each unit's tables are checked against the lead test's digests, and
  HS is run again on its first `200` paths, path for path, before they are used.
- **Two new arms:**
  - **HSP:** part 1 alone, at the even split;
  - **HSPS:** parts 1 and 2.
- **What it decides:**
  - whether either arm mends the three units: no longer wholly below `-0.3` points against K2;
  - whether it keeps the lead test's gain elsewhere: pooled survival against HS and K2, the units wholly below `-0.3`,
    and spending on the paths both keep.
- **What follows:** an arm that mends the three and keeps the gain opens step 8's registration, drafted, put to the
  design reviewer and brought to the maintainer before launch (D129 (3)). Otherwise it goes back to the maintainer with
  the read.

## Box

- Half a day to build and test, from 18 Nov 21:00 UTC.
- The read's run is about five core-hours: 28 units, each with two household tables of about `80` s and two arms of
  about `240` s. It runs when the cores are free, after the windfall factorial and before the savings factorial.
- Half a day to read.

When the box runs out, stop and report.
