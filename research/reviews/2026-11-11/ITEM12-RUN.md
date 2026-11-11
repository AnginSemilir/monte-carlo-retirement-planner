# Item 12's stage A, run by the review: the design, written and pushed before the run

The maintainer asked for it on 11 Nov at 15:38 UK ("run the experiment here"). EXPLORATORY. It decides nothing: a
port needs the maintainer's ruling naming this run. No panel couple is run, and no result of D4 or of seed 7021 is
read.

Item 12 is `../2026-11-09/EXPERIMENTS-AND-PORTS.md`: approximate cuts on a couple's path, on top of item 11's exact
cut. This file is everything that is fixed before the first path runs. The read is added below it when every chunk
is in.

## What is run

- **Couples:** item 12's eight, all in a `touched` list, none in the panel: S007, S127, S391, S303, S261, S209,
  `S303@52:land`, `S313@52:land` (`scripts/plan-of.mjs`'s names).
- **One solve a couple at 45 points,** the candidate d71f65ae871e (before D73's port), on a copy of the working
  branch at 6331361 with `couple-flat.diff`, `shortlist.diff` and `couple-approx.diff` of `../2026-11-09/prototype`
  applied. Their sha256 prefixes there: `couple.js` 3adde11d916404b9, `solve.js` 662603103d44fd16, `grid.js`
  9fddf91153675f58.
- **The comparison:** the flat path on the whole menu (item 11: the path as it is, bit for bit, checked again on
  each chunk's first 20 paths).
- **Two arms, each on the same paths:**
  1. `order`: item 7's shortlist width in each person's ranking;
  2. `order+one+thin4x3+nodraw+near`: the same with every joint option.
- **Paths:** 16,000 a couple, 128,000 in all, seed 99012.
- **The unit:** `scripts/couple-approx-full.mjs`. **The read:** `scripts/couple-approx-pool.py` over the outputs.
  Both are in this commit.

## Where it differs from stage A as item 12 wrote it

1. **The review runs it,** on its own two-core machine, on the prototype and not on a port. Item 12 asked for item
   11 to be in first; the flat path here is item 11's patch.
2. **Seed 99012, not 7002.** No registered run, prediction or earlier look of the review uses it, so these are new
   paths. The review's 15,000 paths of this morning were seed 4242.
3. **Two arms, not three.** The middle arm (`order` with the thinner bridge search alone) is dropped to save a fifth
   of the time. The joint options alone were inside noise this morning (13 saved, 12 lost of 15,000).
4. **`order` without a ruling.** Item 12 waited for the maintainer to rule a width of item 7 on. None is ruled yet.
   `order` is the width that passed on singles.
5. **Each couple in two chunks of 8,000 paths** (paths 0 to 7,999 and 8,000 to 15,999 of the seed's stream),
   because a job here may run two hours at most. Each chunk solves again; the tables are the same.
6. **The tally of the tiers held** (the rule's part 5) is in the script, which item 12 said to add first.

## The rule (item 12's, as pushed at 6ef22176)

An arm passes if:
1. pooled, the paired survival difference's 95% interval has its lower end above -0.1 points;
2. no couple's interval lies wholly below -0.3;
3. pooled spending delivered is not lower than the whole menu's by more than 0.05 points of target. That figure is
   the review's and is tighter than D65's example of 0.1%, so it is read at both;
4. the pooled mean pot left is not lower by more than 0.5%, and no couple's by more than 1%;
5. each person's tiers held, averaged over the decisions, are within 0.01 of the whole menu's.

**How each is computed** (`couple-approx-pool.py`):
- survival: over every path, saved less lost, with the paired standard error and 1.96 of it either way;
- spending: each couple's mean yearly spending delivered, arm less flat, in points of its target; pooled as the
  mean of the eight;
- the pot: each couple's change in the mean pot left; pooled as the mean of the eight (the ratio of the summed
  pots is printed beside it);
- the tiers: each person's pension and ISA tier as the engine holds it coming into each decision, averaged; the
  largest difference of the four, on any couple.

## What I expect, written before the run

This morning, on 15,000 paths of five of these couples: `order` -0.06 points (se 0.058), spending -0.07%, the pot
-0.25%; the stack -0.09 (se 0.062), spending -0.09%, the pot -0.26%.

| | `order` | the stack |
|---|---|---|
| Pooled survival | between -0.10 and +0.02 | between -0.13 and 0.00 |
| Part 1 (lower end above -0.1) | 0.50 | 0.35 |
| Part 2 (no couple wholly below -0.3) | 0.85 | 0.80 |
| Part 3 at 0.05 points; at 0.1 | 0.35; 0.70 | 0.25; 0.60 |
| Part 4 (the pot) | 0.80 | 0.80 |
| Part 5 (the tiers) | 0.60 | 0.50 |

**What would show I am wrong about `order` being a small loss at worst:** a pooled interval wholly below -0.1, or a
couple wholly below -0.3. **What would show it is harmless:** a pooled interval that includes nought with its lower
end above -0.05.

## The reading

No pooled figure is read before all sixteen chunks are in. If the machine is lost part way, the first chunk of each
couple is a balanced half (64,000 paths) and is read as that, said to be incomplete.

About 14 core-hours: about seven hours on two cores.
