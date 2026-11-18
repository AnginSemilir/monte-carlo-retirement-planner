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
- **Leaving the bands single recovers most of each loss.** By the rule's measure it recovers 99.0% of S191-90's lost
  paths, 67.3% of S333F's and 74.6% of S335F's, each beyond noise.
  - The measure counts the paths it keeps of those lost, less the paths the household plan kept that it loses.
  - Pooled it is 95.5%, mostly S191-90's: without S191-90 it is 88 of 123 (71.5%).
  - Against today's default, the household plan with the bands single is not below the lead test's `-0.3` bar on any of
    the three (`results-household-decomp-beside.txt`):
    - S191-90 `+0.500` (`+0.195` to `+0.718`), beyond noise above it;
    - S333F `+0.025` (`-0.234` to `+0.278`);
    - S335F `+0.100` (`-0.222` to `+0.406`).
- **Leaving the tax-free cash cap single recovers about half.** It recovers 56.7% on S191-90 and 64.8% on S335F (each
  past the rule's half) and 34.6% on S333F (under it). S333F's outcome turns on a few paths: the cap recovers 18 of its
  52, where half is 26.
- **Once the bands are single, leaving the cap single as well adds nothing.** Both single, less the bands single:
  - S191-90 `-0.325` (`-0.540` to `-0.040`), a loss beyond noise;
  - S335F `-0.125` (`-0.212` to `+0.045`);
  - S333F `+0.275` (`+0.091` to `+0.324`), on the couple where the cap alone does not recover.

  So no part of these losses is shown to rest on the cap beyond the bands.
- **By the rule:** S333F **RESTS ON THE BANDS**; S191-90 and S335F **EITHER**, each simplification alone recovering half
  or more.
- **Once the bands are single, the table's own plan and the couple agree.**
  - The household table on its own plan (CEIL) did far better than its moves on the couple: CEIL less HS `+21.775`,
    `+1.575` and `+1.725` points.
  - With the bands single, that gap closes to within about half a point: `-0.525`, `-0.200` and `-0.300`.
  - With the cap single, it closes only in part: `+9.825`, `+0.775` and `+0.400`.
- **What the lost paths are** (`results-household-decomp-beside.txt`, on L, the paths today's default keeps and the
  household plan loses):
  - most end the plan just under the minimum pot: 670 of S191-90's 832, 44 of S333F's 52 and 56 of S335F's 71, short of
    it by `£31,293`, `£14,655` and `£17,213` on average;
  - on them the household plan pays far more tax than its own table does on its own plan: `£955,054` against
    `£436,732` on S191-90, `£561,826` against `£420,272` on S333F, and `£521,835` against `£363,033` on S335F;
  - with the bands single it keeps 824, 43 and 57 of them. On those it spends no less than the household plan
    (`+0.104%`, `+1.046%`, `+0.575%`), pays `£280,418`, `£143,051` and `£155,072` less tax, and ends with `£318,210`,
    `£116,043` and `£106,418` more. So on these paths it recovers through cheaper draws, not by spending less;
  - with the cap single, S191-90's 477 recovered paths pay only `£14,111` less tax and end `£69,333` higher. The tax
    account above is the bands', not the cap's.
- **Why the doubled bands overstate what S191-90 can use.** Its first person holds 90% of the pensions. The figures are
  from `results-axis.txt`, on the 829 paths the lead test's HS5 lost, a size measured on 17 Nov and not part of this run:
  - while both are retired before the younger's state pension age, the partner draws `£32,532` of taxable pension a year,
    more than the first person's `£29,268`, so the partner's small pension goes first;
  - after that age, the first person draws `£88,659` a year and the partner `£461`;
  - those later draws fall on one person's bands, which the doubled bands price as if shared.
  - That account is S191-90's alone. On S333F and S335F as much of the bands' part falls before anyone retires
    (`£35,309` and `£36,578` a path) as after the younger's state pension age (`£34,852` and `£37,243`).
- **What it costs, and what it does not show.**
  - Single bands make the table expect more tax, so it spends less where both arms last: on the paths both keep, HSB
    spends `2.24%` less than HS on S191-90, and `0.30%` and `0.39%` less on S333F and S335F.
  - Against today's default, HSB spends `+0.46%`, `+0.16%` and `-0.27%`. On S335F it spends less than the default at
    the same survival.
  - The pot and tax run against it on S333F and S335F:
    - the capped pot is lower than HS's by `0.697%` and `0.582%`, and lower than the default's by `1.797%` and `1.452%`;
    - lifetime tax is higher than both HS's and the default's.
  - On S191-90 the capped pot is `9.855%` above HS's and `0.305%` below the default's, and lifetime tax is the lowest
    of the three.
  - Single bands are a pessimistic stand-in, not a remedy: they price the couple's income as if one person had it all.
  - The read shows these losses rest on the doubled bands (and, on two of them, the doubled cap) overstating what the
    couple can use. It does not show what to put in their place.

## What comes next, by the rule ("What each outcome leads to")

- **One remedy for both the bands and the cap:** S333F calls for the bands, S191-90 and S335F for one remedy covering
  both. The read shows no part of the losses resting on the cap beyond the bands, so the remedy's read also prices the
  bands alone, to see whether pricing the cap adds anything.
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

## The reviewer at the read

PASS, four MINORs, all in this write-up, each answered above (`reviews/2026-11-18-read-household-decomp.md`). The
reviewer recomputed every outcome from the unit files apart from the reducer, and found the rule's files unchanged since
2b03a19a. The figures its findings asked for are printed by `household-decomp-beside.mjs` into
`results-household-decomp-beside.txt`:
1. each variant's interval against today's default, and the pooled recovery without S191-90;
2. the pot and tax beside the spending;
3. what the lost paths are, and how the variants recover them;
4. the cap single beside the bands single.
