# A wider joint move for couples, read (17 Nov): FAILS, the joint move stays at two

## In plain words

Each year a couple's move is chosen from each person's own top two moves, every pairing tried at each split of the year's
drawing between them. This test (D111 (2), `JOINT-WIDE.md`, EXPLORATORY, seed 7002) offered each person's top four (K4) and
top six (K6) instead, on today's split, on 28 couples' units, the same 4,000 simulated markets for every arm.

**What it found:**
- **More choices keep the money lasting a little more often.** Pooled, K4 adds `+0.236` points of survival (`+0.190` to
  `+0.282`) and K6 `+0.454` (`+0.402` to `+0.506`), both beyond noise. No couple's survival is lower beyond noise under
  either.
- **The gain sits where the two tables misread the household most.** S147-db, the couple on which the share rules swung most
  (MEANS `+9.3` points), gains `+5.150` points under K6 (206 paths saved, none lost) and `+1.350` under K4. S271-90 gains
  `+1.175` under K4; S023-db `+1.225` under K6. By group under K6: the feature units `+1.016`, the library `+0.312`, the
  younger `+0.225`, the 90/10 units `+0.191`.
- **But on other couples it spends the pot.** With K4 the pot counted up to the estate cap falls by more than half a percent
  on five couples, most on S109-sppart (`-5.020%`; its spending `+0.44%`, its tax lower). With K6 pooled spending falls
  `0.158%` (the bar is `0.05%`), and the capped pot falls on seven couples.
- **It costs time.** A path takes `x1.51` as long with K4 and `x2.34` with K6. On the one couple measured in the browser,
  where paths were two thirds of the wait, that would make a couple's wait about `x1.34` and `x1.88` (an inference).

**By the rule committed before the run: FAILS.** Neither width holds all four parts (K4 fails the pot, K6 the pot and
spending). The test is closed and nothing changes: the joint move stays at two. By the rule, D111 (3)'s speed work follows;
whether it waits for the external review of the household plan (D114) is the maintainer's question below.

## The read, by its rule

`reduce-joint-wide.mjs`, its output whole in `results-joint-wide.txt`. The gate fair: 28 units, one code (603eeb595679)
and audit (109137137d97), seed 7002, 4,000 paths, 45 points, the couples' candidate af001697ce1b, the joint move the
couples' default (`'pots'`, LOOKHOLD).

| part | K4 against K2 | K6 against K2 |
|---|---|---|
| 1. pooled survival's lower end above -0.1 | `+0.236` (`+0.190` to `+0.282`): holds | `+0.454` (`+0.402` to `+0.506`): holds |
| 2. no unit wholly below -0.3 | none: holds | none: holds |
| 3. spending not lower by more than 0.05% | `-0.0416%` (`-0.0488` to `-0.0343`): holds | `-0.1579%` (`-0.1669` to `-0.1489`): fails |
| 4. the capped pot: pooled within 0.1%, no unit lower by 0.5% | pooled `+0.116%`; S109-sppart `-5.020%`, S377-dbpart `-1.830%`, S337F `-1.113%`, S109-90 `-0.654%`, S061-dbpart `-0.547%`: fails | pooled `+0.144%`; S109-sppart `-4.241%`, S191-90 `-2.515%`, S109-90 `-1.854%`, S377-dbpart `-1.771%`, S271-90 `-1.347%`, S337F `-1.307%`, S061-dbpart `-0.607%`: fails |
| 5. the replays: no wider best below K2's, nothing unfunded | holds | holds |
| the gain | survival | survival |
| CPU a path against K2 (the 24 units in one process) | `x1.514` (all 28: `x1.524`) | `x2.336` (all 28: `x2.373`) |

**OUTCOME: FAILS.**

## Beside the rule, deciding nothing (`results-joint-wide.txt`)

- **By group, survival (spending):** K4 younger `+0.062` (`-0.192%`), library `+0.206` (`-0.315%`), 90/10 `+0.234`
  (`+0.179%`), feature `+0.425` (`+0.057%`); K6 younger `+0.225` (`-0.452%`), library `+0.312` (`-0.565%`), 90/10 `+0.191`
  (`+0.432%`), feature `+1.016` (`-0.160%`).
- **The pot on the typical path** rises with width (K4 `+5.385%`, K6 `+8.787%` pooled, both beyond noise), led by the
  feature units; lifetime tax falls about a tenth under both (`£272,343` to `£244,986` and `£245,211` pooled). So the pot
  falls where a couple spends more or ends near its cap, and rises elsewhere.
- **K6 against K4:** survival `+0.218` beyond noise, spending `-0.116%`, the capped pot lower on five units.
- **The replays:** at every decision along K2's own path the wider best scores at or above K2's (never below), and the
  wider pick differs from K2's on a third to a half of decisions (S327F: K4 2,133 of 5,935, K6 2,853), mostly in the split.
- **The time:** K2 `129.8` ms a path, K4 `219.6`, K6 `358.4` (over all units); the order effect small (K4
  `x1.489` to `x1.530`, K6 `x2.182` to `x2.441` by which arm ran first); the solve 97 s a couple, the same tables for
  every arm.

## What the read cannot show

- **Why the pot falls on the units it does.** No decomposition was run; on S109-sppart spending rises and tax falls, so
  the wider move spends the pot sooner there, not on tax.
- **Anything beyond these 28 units, one seed and one estate weight.** Sixteen of them are the share rules' couples, on which
  the replay found the wider set helping (at other shares), so the gain may be larger here than on couples at large.
- **The time in the app.** The ratios are CPU time in Node with four units at a time; the page's wait is an inference
  from one couple's split.

## For the maintainer

- **By its rule, closed:** today's split and each person's top two moves stay the couples' default.
- **What it adds to the household question** (D114, with the external review in `QUESTIONS-2026-11-17.md`): where the two
  tables misread the household most, a wider move recovers a lot (S147-db `+5.2` points), which says the misread is real
  and large on some couples; but the wider move also spends the pot on others, and costs `x1.5` to `x2.3` a path. A plan
  that does not misread the household in the first place is what the handover asks the reviewer about.
- **The question already put:** D111 (3)'s speed work on LOOKHOLD's cost follows this read by the rule. If the review backs
  one plan for the household, that plan would replace the joint move whose cost the speed work targets, so the agent
  recommends holding the speed work until the review answers.
