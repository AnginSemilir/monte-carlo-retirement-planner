# The share replay, read (16 Nov): MIXED; which part recovers the lost paths differs by comparison

EXPLORATORY (D110: "Run the deep review's test on seed 7023"). Its rule, `SHARE-REPLAY.md`, was committed before the run
(4767cb74).
- **The read whole:** `results-share-replay.txt` (`reduce-share-replay.mjs`). It was printed again after the reviewer at
  the read found that two of its lines compared the floor's rounding. Those two lines changed; the outcome did not (below).
- **Beside it,** written after the read and deciding nothing: `results-share-replay-beside.txt`
  (`share-replay-beside.mjs`, sections A to G).
- Every figure below is printed in one of those two files, or in the share rules' read and its beside file where named.

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

**What it found:**
- **No part carries half, so the outcome is MIXED.** By the rule nothing is built, and the read comes to you with its
  figures. Today's split stays the couples' default.
- **Which part recovers differs from one comparison to the next.** No single story covers the ten.

## The read, by its rule

Each variant's recovery: the rule's lost paths it keeps, less the saved and the both-keep paths it loses, each scaled to
its whole count. It is pooled over the ten flags, out of the rule's 4,044 lost paths. Its sampling error is the
standard deviation from reading each category replayed short of its whole count as a sample of it (section C).

| variant | recovers | sd | paths |
|---|---|---|---|
| TK, each person's top six moves | `+0.4835` | `0.021` | `+1955.3` |
| R, TODAY's tiers | `+0.4367` | `0.053` | `+1765.8` |
| L, TODAY's spending level | `+0.1555` | `0.045` | `+628.7` |
| S, TODAY's split | `-0.1378` | `0.063` | `-557.4` |

**The mechanism the deep review named shows on 1,002 of the 2,368 lost paths (`42.3%`), not more than half.**
- The test: in the five years before such a path fails, the household draws from a person whose own table reads them at
  `0.98` or more, or `0.02` or less, while TODAY at the same state would spend a step of the menu less.
- **The first print read 1,227 (`51.8%`), through a fault the reviewer at the read found.** It compared the two arms'
  levels raw. Under MEANS each person's floor is a ratio of amounts rounded to the pound, so it reads, for instance,
  0.799995 or 0.800031 where TODAY's reads 0.8 (section J). Both arms at the floor then counted as TODAY spending less.
- The read now compares a step of the menu, with a planted case of floors at 0.8 and 0.800031, and a plant that compares
  raw levels fails it (CHECKLIST 7). No other script compares two arms' spending levels.
- The outcome does not move: L recovers `0.1555`, so neither THE CAUSE HOLDS nor THE LEVEL could hold however the
  mechanism read.

**The equity, as the rule takes it pooled:** at the same states the rule's tiers hold more equity than TODAY's
(`+0.1028` places of the tiers' order a slot). By comparison its sign is mostly S061-dbpart's (below).

**The outcome, the rule's sixth:**
- L is under half, so neither THE CAUSE HOLDS nor THE LEVEL;
- R is under half, so not THE RISK RIVAL;
- S is under half, so not THE SPLIT;
- R and TK each recover more than a quarter, so not NO PART RECOVERS A QUARTER;
- **MIXED.**

It is not near another branch: L would need `0.5`, 7.6 standard deviations from `0.1555` (section I).

## What the units show (beside, deciding nothing)

These are leads read off the run after the read. Each variant's recovery over the comparison's own lost paths
(section A):

| comparison | lost | L | R | S | TK |
|---|---|---|---|---|---|
| FLAT S023-45 | 106 | `+0.396` | `+0.528` | `+0.226` | `+0.443` |
| FLAT S147-45 | 241 | `+0.320` | `+0.444` | `-0.529` | `+0.469` |
| FLAT S191-45 | 160 | `+0.169` | `+0.594` | `-0.386` | `+0.381` |
| FLAT S061-dbpart | 440 | `+0.103` | `-0.451` | `+0.088` | `+0.074` |
| MEANS S061-dbpart | 1985 | `-0.089` | `+0.824` | `-0.047` | `+0.540` |
| MEANS S023-90 | 451 | `+0.825` | `-0.130` | `-0.714` | `+0.961` |
| MEANS S147-90 | 274 | `+0.839` | `-0.294` | `+0.073` | `-0.180` |
| MEANS S227-90 | 169 | `-0.124` | `+0.533` | `+0.059` | `+0.923` |
| MEANS S191-45 | 117 | `+0.171` | `+0.598` | `+0.214` | `+0.359` |
| MEANS S377-dbpart | 101 | `+0.129` | `+0.485` | `-0.691` | `+0.475` |

**How precise these are** (section A2): a comparison with no control path lost has a plug-in sd of nought, so section A
reads more precise than it is.
- At each variant's pooled control-loss rate, the seven comparisons of 101 to 274 lost paths have sds of `0.23` to `0.82`
  for L, R and S, and `0.09` to `0.24` for TK. Their differences are within noise.
- What stands at comparison level rests on large comparisons or on kept counts, which are exact:
  - MEANS S061-dbpart, whose sds are `0.03` or less;
  - FLAT S061-dbpart, where each variant keeps 46 of 400 or fewer;
  - TODAY's level on S023-90 (337 of 400 kept) and S147-90 (243 of 274);
  - the top six on S147-90, under a quarter: they keep 42 of 274 and lose 16 saved paths.

**The part that recovers differs by comparison.**
- **MEANS on S061-dbpart** (1,985 lost paths, half the pooled loss, every one running short):
  - TODAY's tiers recover `+0.824`, the top six `+0.540`, and TODAY's level `-0.089`;
  - the pooled figure for TODAY's tiers is mostly this comparison: without it, R pools to `+0.0628` (section B).
- **FLAT on S061-dbpart** (440 lost paths, every one running short):
  - no part recovers it: each variant keeps 34 to 46 of its 400 replayed lost paths (section D);
  - here the rule's tiers hold the most equity of any comparison, yet TODAY's tiers keep 45 of the 400.
- **MEANS on S023-90 and S147-90** (most of their losses end below the minimum pot):
  - TODAY's level recovers `+0.825` and `+0.839`;
  - the mechanism shows on `75.0%` and `91.6%` of their lost paths (section F);
  - the top six recover `+0.961` on S023-90 but `-0.180` on S147-90.
- **MEANS on S227-90:**
  - the top six recover `+0.923` (they keep 160 of 169), TODAY's tiers `+0.533`, and TODAY's level `-0.124`;
  - TODAY's level keeps 73 of the 169, and its net loss is one control path, so it is within noise;
  - here the rule's level is below TODAY's at the same states, `-0.0062` of target on its paths below the minimum pot
    (section E).
- **The 45/55 units (four comparisons on three couples) and S377-dbpart:** TODAY's tiers recover `+0.444` to `+0.598`,
  the top six `+0.359` to `+0.475`, and TODAY's level `+0.129` to `+0.396`. These are small comparisons, all within
  noise of each other.

**The top six moves are the most consistent variant.**
- Pooled they recover `+0.4835` with an sd of `0.021`, losing one control path of 2,000 (section C).
- By comparison they recover `0.35` or more on eight of the ten, but the small comparisons are within noise (MEANS
  S191-45's `0.359` has an sd of `0.21` at the pooled rate).
- They recover under a quarter on FLAT S061-dbpart (`+0.074`) and MEANS S147-90 (`-0.180`), both exact by kept counts.
- They are the only variant that is a policy one could run on its own. L, R and S each borrow a part of TODAY's move.

**The equity goes with TODAY's tiers' recoveries only on MEANS S061-dbpart** (section E).
- The rule holds more equity than TODAY on S061-dbpart: `+0.410` under MEANS, where TODAY's tiers recover most.
- Under FLAT the same couple's rule holds more equity still (`+0.505`), yet TODAY's tiers keep 45 of 400 there.
- On the other eight comparisons the rule holds less: `-0.078` a slot pooled, negative on six of eight. It is a little
  positive on S191-45 under FLAT (`+0.018`) and on S227-90 (`+0.069`).
- Yet TODAY's tiers keep 204 of those eight comparisons' 370 replayed paths that run short (section I).
- A co-occurrence, then, with no decomposition behind it, not an explanation.

**The split is not the fault, but its pooled loss is noise-heavy.**
- TODAY's split keeps lost paths worth `+449.2` paths of the 4,044.
- Its pooled `-557.4` is mostly `-894.7` from 12 control paths lost of 2,000 (section C); each lost control path counts
  68.3 to 77.6 paths (section I).
- Where it does worse than the rule on a single comparison, it rests on one to six control paths.

**The mirror, S147-db's gain under MEANS** (1,505 saved paths), counts only:
- with TODAY's level the rule keeps 234 of the 400 saved paths replayed;
- with TODAY's tiers, 291;
- with TODAY's split or the top six, 393 and 390.

**The failing year of the lost paths that run short** (1,170): the rule's move funds none of them in the exact model. In
194 of them, a level of the menu at some split would have funded the year.

**The arms part at the start on nearly every path, lost or not** (section H):
- in year 0 on 2,267 of the 2,368 lost paths (the rest by year 5);
- on 280 of the 307 saved paths;
- on 1,800 of the 2,000 controls.

Two tables solved on two shares part at once, so this line says nothing of the deep review's signature for the minimum
pot, either way.

**Two open items' questions, as leads** (section G; neither item's status changes):
- **FD-RAISE:** of the 1,170 lost paths that run short, 60 have a year at 110% of target in the three years before the
  failing year, 10 of them in the year just before.
- **CGT-BILL:** 33 run short by under £1,000 in all, and 10 of those pay tax, income and gains together, in the failing
  year.

## What it means

- **No part carries half of the loss, pooled.**
- **The part that recovers differs by comparison:**
  - TODAY's tiers on MEANS S061-dbpart;
  - TODAY's level on S023-90 and S147-90;
  - the top six on S023-90 and S227-90;
  - nothing on FLAT S061-dbpart.
- **The swaps overlap.** Each takes one part of TODAY's move, and what one recovers another often recovers too. Their
  recoveries do not add up, and no swap of two parts together was run.
- **The deep review's single cause is not shown.** Its mechanism shows on `42.3%` of the lost paths pooled, and on more
  than half of them on three units (section F):
  - S023-90 and S147-90, where TODAY's level recovers most, so both of the deep review's conditions hold there;
  - S227-90, where the mechanism shows on `64.5%` but the level swap keeps 73 of 169 and recovers nothing net, while the
    top six recover `+0.923`.
- **The top six moves are the most consistent change, but they fail on two comparisons.** Their path time was not
  measured here; the deep review estimates up to nine times a path.

## What the read cannot show

- **That the swaps decompose the loss.** They overlap, and no joint swap was run.
- **Precision at comparison level.** Each lost control path counts 68.3 to 77.6 paths (section I). Several comparisons'
  figures rest on one to six of them (sections A, A2 and C).
- **Why a variant keeps a path.** L, R, S and TK kept no record of each year; only X and T did.
- **The paths both arms lose** (330 to 622 a comparison, section I), which were not replayed. A policy like TK might save some of
  them, which bears on TK as a change for today's split.
- **Money.** The equity and the mechanism count tier places and readings per slot or person, not the money in them.
- **TK's effect on today's split, and its time.** TK was tested on the rules' own policies.
- **The other 1,676 lost paths.** The cap of 400 left them unreplayed (MEANS and FLAT S061-dbpart, S023-90). The scaling
  assumes they behave as the first 400 in path order.
- **The panel's shape:**
  - every couple's first person three years older;
  - the elder holding 45% to 90%;
  - the 'standard' estate aim.
- **LOOKHOLD.** The read's code holds the hold and the forward look as options, off. The read predates D109's change of
  default, so its arms ran without them.

## The reviewer at the read

FAIL, two BLOCKING and three MINORs (`reviews/2026-11-16-read-share-replay.md`). The run, the to-the-bit matches, the
four pooled recoveries and MIXED stand. Answered in this one fix:
1. **The first write-up's "two failure modes" and its case for TK went beyond the data.** It is replaced by the
   per-comparison picture, printed beside the read.
2. **The mechanism's "more than half" came from the floor's rounding.** It is corrected in the read, with its planted case
   and a plant that fails it, and stated above.
3. The sampling error is given.
4. The list of what the read cannot show is completed, and the LOOKHOLD item corrected.
5. The line on when the arms part now prints the year they part, not the failure year.

**The second round** (`reviews/2026-11-16-read-share-replay-2.md`): FAIL, one new BLOCKING and four MINORs. Both of the
first round's BLOCKINGs and its MINORs 3 and 4 were answered.
- **The new BLOCKING:** the rewritten "What it means" said the mechanism shows on more than half of the lost paths only
  on the two units where TODAY's level recovers most. Section F prints three such units: S227-90 is the third, where the
  level swap recovers nothing net.
- **Its MINORs:**
  - the parting line cannot be evidence either way, since the arms part at once on the controls too (the reviewer
    correcting its own first-round suggestion);
  - the comparison-level figures are less precise than section A reads;
  - the equity's two summary lines overstated it;
  - some figures were not printed in either file.
- **A FAIL standing after one fix is the maintainer's (D81 (F)).** The sentence and the MINORs are corrected above as the
  reviewer gave them, with the figures they need printed in the beside's new sections A2, H, I and J. This is unreviewed:
  no third round was asked for.

## For the maintainer

By its rule, the replay builds nothing; it comes to you as a read. Two ways on:
1. **A wider joint move for couples, tested on today's split** (the agent's recommendation).
   - The basis: the top six moves are the most consistent variant (`+0.4835` pooled, sd `0.021`) and the only one that
     is a policy one could run. By comparison they reach `0.35` or more on eight of ten, the small comparisons within
     noise.
   - They fail on two comparisons, FLAT S061-dbpart and MEANS S147-90, and their time was not measured here.
   - The test: each person's top four and top six moves against today's two, on today's couples' default (with
     LOOKHOLD), EXPLORATORY on a panel at seed 7002, its rule committed first.
   - It reads survival, spending and the pot beside a couple's solve and path times. No new solver code is needed.
   - A gain comes back to you as a trade of survival against time, like LOOKHOLD's.
2. **Leave the share and the joint move as they are,** and go on to the research queue's two factorials, then your work
   on the screens.
