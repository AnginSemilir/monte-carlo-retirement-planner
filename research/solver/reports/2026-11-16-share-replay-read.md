# The share replay, read (16 Nov): MIXED, no single part of a couple's move carries the lost paths

EXPLORATORY (D110: "Run the deep review's test on seed 7023"). Its rule, `SHARE-REPLAY.md`, was committed before the run
(4767cb74). The read whole is `results-share-replay.txt` (`reduce-share-replay.mjs`). Every figure below is printed there,
or in the share rules' read and its beside file where named.

The run:
- **What:** the ten comparisons the share rules' read flagged, and S147-db under MEANS as their mirror, on the read's own
  code (the launch worktree at e1239959, code c0dcfa9ef2f2) and on seed 7023's paths, which the registered read had
  already read.
- **When:** 16 Nov 17:16 to 17:53 UK, nine units four at a time, run directly as D110 says. No unit failed.
- **Replayed:**
  - for each comparison, the rule's lost paths (up to 400), its saved paths (up to 400) and 200 paths both arms keep;
  - 2,368 of the rule's lost paths in all, of the 4,044 the read counted on the ten.
- **Checked:**
  - every replayed path of the rule's own run (X) and TODAY's (T) matched the registered runs' stored arrays to the bit;
  - the gate is fair, and the fair-test gate passed on the 88 registered logs the replay starts from.

## In plain words

The share rules' read found that moving a couple's share loses some couples' paths. The deep review's leading cause:
each person's table plans a slice of the household that never lives alone, so the couple's joint move values money by
whose pot it sits in.

This test took the lost paths apart. Each lost path was run again with one part of the rule's move swapped for today's:
- the spending level (L);
- each person's investment tiers (R);
- the split of the draw between them (S);
- or the rule's own move with each person's top six moves on offer instead of two (TK).

A part "carries" the loss if swapping it alone recovers at least half of it.

**What it found: no part carries half, so the outcome is MIXED.**
- By the rule, nothing is built, and the read comes to you with its figures.
- Today's split stays the couples' default in every outcome.

## The read, by its rule

Each variant's recovery: the rule's lost paths it keeps, less the saved and the both-keep paths it loses, each scaled to
its whole count. It is pooled over the ten flags, out of the rule's 4,044 lost paths.

| variant | recovers | paths |
|---|---|---|
| TK, each person's top six moves | `+0.4835` | `+1955.3` |
| R, TODAY's tiers | `+0.4367` | `+1765.8` |
| L, TODAY's spending level | `+0.1555` | `+628.7` |
| S, TODAY's split | `-0.1378` | `-557.4` |

- **The mechanism** the deep review named shows on 1,227 of the 2,368 lost paths replayed (`51.8%`): more than half. In
  the five years before such a path fails, the household draws from a person whose own table reads them at `0.98` or
  more, or `0.02` or less, while TODAY at the same state would spend less.
- **But the cause, as the rule defines it, needs L to recover half as well, and L recovers `0.1555`.**
- **The equity:** at the same states, the rule's tiers hold more equity than TODAY's (`+0.1028` places of the tiers' order
  a slot, over 47,360 slot-years).
- **The outcome, the rule's sixth:**
  - L is under half, so neither THE CAUSE HOLDS nor THE LEVEL;
  - R is under half, so not THE RISK RIVAL;
  - S is under half, so not THE SPLIT;
  - R and TK each recover more than a quarter, so not NO PART RECOVERS A QUARTER;
  - **MIXED.**

## What the units show (beside, deciding nothing)

These are leads read off the run after the read.

**The two kinds of loss part ways.** A lost path either runs short in some year, or ends the plan below the household's
minimum pot. The replayed lost paths split about evenly between them, and each variant keeps them differently:

| | running short (1,170) | below the minimum pot (1,198) |
|---|---|---|
| R, TODAY's tiers | 579 | 621 |
| TK, top six moves | 359 | 806 |
| L, TODAY's level | 128 | 812 |
| S, TODAY's split | 90 | 301 |

- **Paths that run short:** TODAY's tiers keep the most of them. The level keeps few.
- **Paths below the minimum pot:** TODAY's level keeps the most of them, and the top six moves about as many.

**The largest loss, S061-dbpart under MEANS** (1,985 lost paths), is mostly the tiers:
- R keeps 330 of its 400 replayed lost paths (`+1636.6` paths);
- TK keeps 216 (`+1071.9`);
- L keeps 47 and loses more than it keeps (`-176.6`).

That one comparison is about half of the pooled loss.

**The 90/10 units under MEANS lean the other way.** Most of their losses are the minimum pot's
(`results-share-rules-beside.txt` section F).
- on S023-90 the level recovers `+372.0` paths and the top six moves `+433.3`;
- on S147-90 the level recovers `+230.0`, while the top six moves lose ground (`-49.3`);
- on S227-90 the top six moves recover `+156.0`.

**The split is not the fault.** TODAY's split does worse than the rule's own, pooled (`-557.4` paths). It does worse on
five of the ten, most on S023-90 (`-322.0`) and S147-45 (`-127.5`).

**The mirror, S147-db's gain under MEANS** (1,505 saved paths): with TODAY's level the rule keeps 234 of the 400 saved
paths replayed, and with TODAY's tiers 291. With TODAY's split or the top six moves, it keeps nearly all of them (393, 390).
So MEANS's gain there comes from its level and its tiers together.

**The failing year of the paths that run short** (1,170): the rule's move funds none of them in the exact model. In 194 of
them, a level of the menu at some split would have funded the year.

**When the arms part:** on the lost paths, the rule's move first differs from TODAY's a median of 27 years before the
failure (a quarter at 9 years, three quarters at 39). On every lost path the two moves part before the failure year.

## What it means

The deep review read a single cause. The replay shows two failure modes, which the share brings out differently:
- **Running short is mostly the tiers.** At the same states the rule's tables take more equity than TODAY's (the equity
  line above). TODAY's tiers keep about half of these paths, and the level very few.
- **Ending below the minimum pot is mostly the level.** The rule spends more than TODAY would at the same state, and
  TODAY's level keeps most of these paths.

Offering each person's top six moves instead of two (TK) recovers about half of the loss across both modes. It keeps most
of the minimum pot's losses, and a third of the paths that run short.

So the joint move's short list of two moves a person is a material limit wherever the share moves. It is the one change
that helps with both kinds of loss, and it needs no new solver code (`solveCouple`'s `topK`). But it costs time: six
moves a person instead of two makes nine times the joint candidates each year.

## What the read cannot show

- **TK's effect on today's split.** TK was tested on the rules' own policies, to recover their losses. Whether a wider
  joint move improves today's default, and at what cost in time, was not run.
- **Anything on the other 1,676 lost paths** of S061-dbpart, S023-90 and FLAT's S061-dbpart that the cap of 400 left
  unreplayed. The scaling assumes they behave as the first 400 in path order.
- **The panel's shape** (the share rules' read's list):
  - every couple's first person three years older;
  - the elder holding 45% to 90%;
  - the 'standard' estate aim.
- **LOOKHOLD,** the couples' default since D109, which the read's code predates.
- **Why the rule's tables take more equity,** which the record shows at the states but does not explain.

## The reviewer at the read

(to come)

## For the maintainer

By its rule, the replay builds nothing; it comes to you as a read. Two ways on:
1. **A wider joint move for couples, tested on today's split** (the agent's recommendation).
   - Each person's top four, and top six, moves against today's two, on today's couples' default (with LOOKHOLD).
   - EXPLORATORY on a panel of couples at seed 7002, its rule committed first.
   - It reads survival, spending and the pot as the tie tests did, beside a couple's solve and path times.
   - It needs no new solver code. If it gains, it comes back to you as a trade, survival against time, like LOOKHOLD's.
2. **Leave the share and the joint move as they are,** and go on to the research queue's two factorials and then your
   work on the screens.
