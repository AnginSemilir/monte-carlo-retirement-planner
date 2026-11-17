# A wider joint move for couples, read (17 Nov): FAILS, the joint move stays at two

## In plain words

Each year a couple's move is chosen from each person's own top two moves, every pairing tried at each split of the year's
drawing between them. This test (D111 (2), `JOINT-WIDE.md`, EXPLORATORY, seed 7002) offered each person's top four (K4) and
top six (K6) instead, on today's split, on 28 couples' units, the same 4,000 simulated markets for every arm.

**What it found:**
- **More choices keep the money lasting a little more often.** Pooled, K4 adds `+0.236` points of survival (`+0.190` to
  `+0.282`) and K6 `+0.454` (`+0.402` to `+0.506`), both beyond noise.
- **One couple's survival is lower beyond noise under K4,** by the rule's own interval by unit: S061-90, `-0.225` points
  (`-0.465` to `-0.001`; 14 paths lost, 5 saved). That is inside the rule's bar of `-0.3`, and by the exact paired interval
  it is not beyond noise (`-0.388` to `+0.011`). None under K6.
- **The gain is uneven, and one couple carries much of it.** S147-db gains `+5.150` points under K6 (206 paths saved, none
  lost) and `+1.350` under K4. It is two fifths of K6's net paths saved (`40.6%`); without it K6's pooled gain is `+0.280`
  (`+0.232` to `+0.327`) and K4's `+0.194` (`+0.150` to `+0.239`). S147-db is the couple MEANS helped most in the share
  rules' test (`+9.3` points). Elsewhere: S271-90 `+1.175` under K4, S023-db `+1.225` under K6. By group under K6: the
  feature units `+1.016`, the library `+0.312`, the younger `+0.225`, the 90/10 units `+0.191`.
- **The pot counted up to the estate cap falls on some couples.** Under K4 it is lower on 9 of the 28 units and lower by
  more than half a percent on five, most on S109-sppart (`-5.020%`). Under K6 it is lower on ten, seven by more than half
  a percent, and pooled spending also falls `0.158%` (the bar is `0.05%`). **Why the pot falls is not shown:** no
  decomposition was run, and the falls do not follow spending (of K4's five, two spend less).
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

## Beside the rule, deciding nothing (`results-joint-wide.txt`; and, written after the read for its reviewer's findings, `results-joint-wide-beside.txt` by `joint-wide-beside.mjs`)

- **By group, survival (spending):** K4 younger `+0.062` (`-0.192%`), library `+0.206` (`-0.315%`), 90/10 `+0.234`
  (`+0.179%`), feature `+0.425` (`+0.057%`); K6 younger `+0.225` (`-0.452%`), library `+0.312` (`-0.565%`), 90/10 `+0.191`
  (`+0.432%`), feature `+1.016` (`-0.160%`).
- **The pot on the typical path** (each path's own change where both arms leave a pot) rises with width, `+5.385%` under
  K4 and `+8.787%` under K6 pooled, but mostly through S147-db: without it `+3.215%` and `+3.946%`. S147-db's own figure
  (`+63.982%`, `+139.489%`) comes almost wholly from paths K2 fails, a small pot against a larger one; its median path
  rises `+2.8%`.
- **Lifetime tax** falls about a tenth under both (`£272,343` to `£244,986` and `£245,211` pooled).
- **K6 against K4:** survival `+0.218` beyond noise, spending `-0.116%`; the capped pot lower on twelve units, five by more
  than half a percent.
- **The replays:** at every decision along K2's own path the wider best scores at or above K2's, never below. The wider pick
  differs from K2's on `32.4%` (K4) and `41.9%` (K6) of decisions pooled, from `9.7%` to `66.2%` by unit; a different split
  is under half of those (`45.7%` and `48.2%`), and under half of a unit's differing picks on 15 of the 28 units.
- **The time:** K2 `129.8` ms a path, K4 `219.6`, K6 `358.4` (over all units); the solve 97 s a couple, the same tables for
  every arm. By which arm ran first, K4's median is `x1.489` to `x1.530` and K6's `x2.182` to `x2.441`, but each group is
  different units, so these do not measure an order effect. The younger group's time is over its four units whose three
  arms ran in one process.

## What the read cannot show

- **Why the capped pot falls on the units it does.** No decomposition was run. The falls do not follow spending: of K4's
  five, S109-90 and S061-dbpart spend less. On S109-sppart spending rises `0.44%` and tax falls; how its capped pot comes to
  be `5%` lower is not shown.
- **Why the gain falls where it does.** The run measures no misreading of the household by the tables; that the couple
  MEANS helped most here gains most here is a lead, not a cause shown.
- **Anything beyond these 28 units, one seed and one estate weight.** Sixteen of them are the share rules' couples, on which
  the replay found the wider set helping (at other shares), so the gain may be larger here than on couples at large.
- **The time in the app.** The ratios are CPU time in Node with four units at a time; the page's wait is an inference
  from one couple's split.

## The reviewer at the read

`reviews/2026-11-17-read-joint-wide.md`: FAIL, three BLOCKING and four MINORs, the outcome itself sound (the rule's files and
stamps unchanged since the launch's commit, the amendments before the launches they govern, the four resumed units each
passing the check against `E.runTrial`, every figure of the results file recomputed from the units' arrays, the reducer's
output reproduced byte for byte). The findings were all in this write-up's words and the handover's, answered in one fix:
S061-90 named (finding 1); the account of why the pot falls withdrawn, the cause not shown (2); the claim that the gain sits
where the tables misread the household most withdrawn, S147-db's part of it stated (3); the replays' rates (4), the typical
path without S147-db (5), the counts with and without their bar (6) and the time groups (7) corrected, each figure printed
by `joint-wide-beside.mjs`.

## For the maintainer

- **By its rule, closed:** today's split and each person's top two moves stay the couples' default.
- **What it adds to the household question** (D114, with the external review in `QUESTIONS-2026-11-17.md`): a wider move's
  gain is real but uneven, two fifths of K6's net gain one couple (S147-db); elsewhere it gains a few tenths of a point, the
  capped pot falls on some couples, and a path costs `x1.5` to `x2.3`. It does not by itself say why the gain falls where
  it does.
- **The question already put:** D111 (3)'s speed work on LOOKHOLD's cost follows this read by the rule. If the review backs
  one plan for the household, that plan would replace the joint move whose cost the speed work targets, so the agent
  recommends holding the speed work until the review answers.
