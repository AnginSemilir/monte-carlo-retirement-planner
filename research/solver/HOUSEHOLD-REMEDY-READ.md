# The remedy's read: does pricing the allowances at the pensions' split mend the three couples? (D129 (3); EXPLORATORY)

Written 18 Nov (evening), and committed before any unit runs, after the remedy's design (`HOUSEHOLD-REMEDY.md`, 5b1eeed4)
and its build. EXPLORATORY on the tuning seed: it changes no default, no gate and nothing in the candidate.

## The question

The decomposition (`results-household-decomp.txt`) found the household plan's three losses resting on its doubled
income-tax bands, and two of them in part on its doubled tax-free cash cap. The remedy prices both at what the two
people can use.
- **Part 1:** each band's width above the allowance, the band for gains and the cap at `k = 1 / s` times one person's,
  with `s` the larger person's share of the two pensions.
- **Part 2:** the year's need funded at the pensions' share as they stand.

Does it mend the three couples, and keep the household plan's gain on the other 25?

## Units, paths and arms

- **Units:** the lead test's 28 (`audit-household.mjs` `UNITS`), each plan as the lead test solves it.
- **Paths:** the lead test's `4,000` paths of seed 7002, at `45` points and estate weight `0.02`.
- **Arms:**
  - **K2:** today's couples' default, the lead test's stored arrays;
  - **HS:** the household plan as built at the even split, the lead test's stored HS1 arrays;
  - **HSP:** part 1 alone, at the even split;
  - **HSPS:** parts 1 and 2.
- Each new arm reads its own household table, solved as the lead test's was but on the remedy's plan. Each is held to
  `E.runTrial` on its first `200` paths. Its paths are saved in chunks of `1,000`.

## Checks before any figure is read (a failure is a STOP, nothing read)

1. On each unit, K2's two tables and HS's household table are solved again and carry the lead test's digests. K2 and HS
   are run again on their first `200` paths, and each is the lead test's arrays on those paths byte for byte. Only then
   are the stored `4,000`-path arrays used.
2. Each remedy table's plan is part 1's: the allowance doubled, each band limit `2 x PA + k x (L - PA)`, the cap `k`
   times one person's, every other doubled entry design A's; its band for gains `k` times one person's; `k` recorded.
3. The fair-test gate: one code id, one audit stamp, seed 7002, `4,000` paths and `45` points on every unit.

## The rule, for each of HSP and HSPS

1. **THE THREE MENDED:** on S191-90, S333F and S335F, the arm less K2 (`stats.mjs` `survivalChange`, the exact
   interval) does not lie wholly below `-0.3` points.
2. **THE GAIN KEPT:** the lead test's own three parts, the arm against K2 over the 28 units:
   - pooled survival's interval has its lower end above nought;
   - no unit's interval lies wholly below `-0.3`;
   - pooled spending delivered on the paths both keep is not lower than K2's by more than `0.05%`.

Each arm's outcome, the first that holds:
- **MENDS:** 1 and 2 hold.
- **MENDS THE THREE, NOT THE GAIN:** 1 holds, 2 does not.
- **DOES NOT MEND:** 1 fails.

## What it decides

- **An arm MENDS:** step 8's registration is drafted on it, put to the design reviewer and brought to the maintainer
  before launch (D129 (3)). If both mend, HSP is taken, the smaller change.
- **Otherwise:** back to the maintainer with the read; nothing is built on it.

## Beside, deciding nothing

- each arm less HS, pooled and by unit;
- the capped pot, pooled and by unit;
- lifetime tax;
- each unit's `k`;
- each table's opening forecast against its survival;
- the three couples' lost paths by kind;
- each arm's pooled figures without its largest unit.

## Box

- Its build and planted checks within the remedy's half day.
- The run, about five core-hours, when the cores are free: after the windfall factorial and before the savings factorial.
- Half a day to read, with the `reviewer` agent at the read.

## Amendment 1 (18 Nov, evening, before any unit runs; the decomposition's reviewer, finding 4)

The remedy's design gains a form of part 1 that prices the bands alone, the cap doubled (`HOUSEHOLD-REMEDY.md`
amendment 1). So the read runs three new arms, each with its own household table where its plan differs:
- **HSPB:** the bands alone priced (`scale 'bands'`), at the even split;
- **HSP:** the bands and the cap priced (`scale 'pensions'`), at the even split;
- **HSPS:** HSP's table, at the pensions' split.

The rule is the same for each. The arm taken is the smallest change that MENDS: HSPB, then HSP, then HSPS. The gate
checks HSPB's plan as part 1's with the cap HS's.
