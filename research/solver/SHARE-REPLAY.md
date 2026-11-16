# The share replay: which part of a couple's move loses the paths a fixed share loses (D110)

EXPLORATORY. The maintainer's ruling (D110, 16 Nov): "Run the deep review's test on seed 7023". This is the one test of the
deep review of the share rules' read (`reviews/2026-11-16-deep-share-rules.md`, section 3). Its rule below is committed
before the run. In every outcome, today's split stays the couples' default until a registered test reads.

## Why

The share rules' registered read (`results-share-rules.txt`) was NEITHER: neither fixed rule passed. Moving the share moved
survival from `-12.381` to `+9.338` points.

The deep review's leading cause:
- each person's table plans a part of the household that the household never lives: a fixed share of its spending and
  minimum pot, met from that person's own pots and incomes, from their own retirement;
- the joint move then prices the household's money, and its room to spend, by those parts;
- so a pound in the pot of a person whose table reads them safe, or lost, counts for almost nothing, and the household
  spends it without cutting.

This test takes the lost paths apart to see which part of the move loses them.

## What runs

- **The code:** the read's own, the launch worktree at e1239959 (code c0dcfa9ef2f2), imported by `share-replay.mjs`. Each
  arm is solved as the read solved it (`audit-share-rules.mjs` `solveArm`), and the engine runs at arm A's MPAA ages.
- **The comparisons:** the ten the read flagged, and S147-db under MEANS, the largest gain, as their mirror (reported only).
  - FLAT on S023-45, S147-45, S191-45 and S061-dbpart;
  - MEANS on S061-dbpart, S023-90, S147-90, S227-90, S191-45 and S377-dbpart;
  - MEANS on S147-db, the mirror.
- **The paths:** seed 7023's, which the registered read has already read, so no new outcome of a held-out seed is read.
  For each comparison:
  - the rule's lost paths (TODAY kept them): the first 400 in path order;
  - its saved paths: the first 400;
  - paths both arms keep, the controls: the first 200.
- **The runs on each path:**
  - **X:** the rule's own move. It must match the rule's stored arrays to the bit (survival, failure year, the pot, the
    estate, spending delivered, unmet spending, lifetime tax), or the replay stops;
  - **T:** TODAY's own move. It must match TODAY's stored arrays to the bit, likewise;
  - **L:** the rule's move with TODAY's spending level;
  - **R:** the rule's move with TODAY's tiers for each person;
  - **S:** the rule's move with TODAY's split;
  - **TK:** the rule's own policy offering each person's top six moves, not two.
- **How the parts are mixed:** each year both arms' joint moves are asked at the same household state (`couple.js`
  `chooseJoint`, the engine's state mapped as `couplePolicy` maps it). The parts partition a joint move's fields: the
  level, the split, the tiers, and the draws (everything else).
  - So every part from TODAY is TODAY's move, field for field; X and T check that every year.
  - No part from TODAY is the rule's move.
- **The record of each year on X and T:**
  - the move's level, split and tiers, and the other arm's at the same state;
  - each person's own table's reading of their own position at the start of the year (its survival, at the tiers they
    hold), and each person's pots;
  - whether the move funds the year in the exact model and, where it does not, the highest level of the menu that would,
    at any split;
  - the year's net drawdown, unmet spending and tax.

## The measures

- **A variant's recovery,** pooled over the ten flagged comparisons (the mirror apart):
  - the rule's lost paths the variant keeps, less the saved paths and the both-keep paths it loses;
  - each category scaled from the paths replayed to its whole count in the arm's `16,000` paths;
  - the total over the rule's lost paths, pooled (`reduce-share-replay.mjs` `gainOf`).
- **The mechanism,** on the replayed lost paths (`mechanismOf`). A path shows it if, in the five years before its failure
  year (the failure year itself left out), there is a year in which:
  - the household draws;
  - a person funding at least half of the draw (by the split; both at an even split) reads their own position at `0.98`
    or more, or `0.02` or less;
  - TODAY's policy, at that state, picks a lower level than the rule's.
- **The equity,** over the same years (`equityOf`): the rule's tiers against TODAY's at the same states, by their place in
  `TIER_ORDER`. Above nought, the rule holds more equity.

## The rule

The outcome is the first of these that holds:
1. **THE CAUSE HOLDS:** L recovers half or more, and the mechanism shows on more than half the lost paths. TK then names
   which half of the cause it is:
   - TK recovers half or more: **THE LEVELS ON OFFER**;
   - TK recovers under half: **THE PRICING**.
2. **THE RISK RIVAL:** R recovers half or more, L and TK each recover under a quarter, and the rule holds more equity than
   TODAY.
3. **THE SPLIT:** S recovers half or more.
4. **THE LEVEL, ITS MECHANISM NOT SHOWN:** L recovers half or more, and the mechanism does not show on more than half.
5. **NO PART RECOVERS A QUARTER:** no variant recovers a quarter.
6. **MIXED:** otherwise.

**Beside, deciding nothing:**
- each comparison's counts and each variant's gain;
- the mirror: which part's loss takes S147-db's gain away;
- the lost paths by kind (running short, or below the minimum pot), with each variant's keeping of each;
- the funding check on the failing years;
- the years from the rule's first move apart from TODAY's to the failure.

## What each outcome leads to (the deep review's section 3)

- **The cause holds:**
  - no fixed share and no choice of share can remove it, and the share's search stops;
  - the next build is in the joint move. With THE LEVELS ON OFFER, offer the household's level from the whole menu. With
    THE PRICING, price each pound at the household's chance, not its holder's: the two tables read with the household's
    accessible money shared in every year, as D2.4 does before pension access;
  - built off in code with its test, then read EXPLORATORY on this panel's units at seed 7002.
- **The risk rival:** the next build is how a short part's tiers enter the joint move. EXPLORATORY.
- **The split:** the household's money shared in the reading, as above. EXPLORATORY.
- **No part recovers a quarter:** the deep review reads this as the minimum pot as the share cuts it. The build would cut
  the minimum pot by where the money is, not by the share (`couple.js` `singlePlanFor`), with its test. EXPLORATORY.
- **The level, its mechanism not shown, or mixed:** to the maintainer with the figures; nothing is built.

## Files and checks

- `share-replay.mjs` replays one unit's comparisons. It stops on any path of X or T that differs from the stored runs, and
  on a year where the mixed move is not the arm's own as the parts say.
  - Its smoke (`--smoke`: three lost, two saved and two control paths) matched every path of X and T on S023-45 under
    FLAT, to the bit.
  - Its planted swap (`--plant swap`: TODAY's replay taking the rule's level) failed there, as it must: lost path 117's T
    replay departed from the stored TODAY run.
- `reduce-share-replay.mjs` is the read. Its gate refuses a missing or extra comparison, a smoke file, another code, seed
  or paths, a top other than six, a category replayed short of its cap or its whole count, and more than one tree or Node
  version.
  - It then runs the fair-test gate on the registered runs the replay starts from: `fair-gate.mjs` `requireFairLogs` on
    their launch logs, under the registration, as the share rules' read called it. The replay's X and T match those runs to
    the bit, and its variants run in the same process on the same paths.
  - Its `--planted`: 18 cases, each branch of the rule, the gain's scaling, the mechanism's window and conditions, the
    equity, and the gate.
  - Its two plants (`REDUCE_SHARE_REPLAY_PLANT=window`, `unscaled`) each fail it.
- `batch-share-replay.sh` runs the nine units, longest first, four at a time at low priority. It refuses a worktree not at
  e1239959 or with edits in its code. It is run directly as a tracked task (D110).

**Said before the run:** the smoke, run before this rule was written, printed the variants' counts on its seven paths
(S023-45 under FLAT). The script prints none in a smoke from now on. The rule's thresholds (half and a quarter) and its
parts are the deep review's, written before any run, and are not changed.

**Box:** about an hour and a half on four cores; half a day to read. The read goes to the maintainer whole, the reviewer at
the read first.
