# Deep review after a confirmatory read: the share rules' registered test (`registrations/share-rules.md`, seed 7023), read 16 Nov

Subject: what the share rules' read (`results-share-rules.txt`, NEITHER; the reviewer at the read,
`reviews/2026-11-16-read-share-rules.md`, PASS with four MINORs) says together with the share ensemble, the share choice,
stage C and its deep review, and the other order's read; the ten flags taken together (D34 (3)).

Read: STATE.md whole, CHECKLIST.md; the registration; `results-share-rules.txt`, `results-share-rules-beside.txt`,
`reports/2026-11-16-share-rules-read.md`, the reviewer at the read, DECISIONS-PENDING.md's "RULED (D107" entry;
`results-share-ensemble.txt` with `reports/2026-11-14-share-ensemble.md`; `results-share-choose.txt`, its beside file and
`reports/2026-11-14-share-choose-read.md`; `reviews/2026-11-14-deep-couples-share.md`; `results-other-order.txt`. The code
the run rests on, in the launch worktree (e1239959): `src/solver/couple.js` (`shareFor`, `shareBy`, `singlePlanFor`,
`solveCouple`, `expectedValue`, `shareBridge`, `rankFor`, `chooseJoint`), `src/solver/model.js` (the couple's year),
`src/solver/solve.js` (the objective's weights), `research/engine.mjs` (the living costs), `audit-share-rules.mjs`,
`reduce-share-rules.mjs`, `audit-phase4.mjs` `runPath`. From the archive: `PLAN.md`'s M17 (failing futures) and M18 (the
purpose test).

Ran (EXPLORATORY, after the read, deciding nothing; each under `nice -n 19` beside B1's gate; no solve, path, batch or
suite): the 88 stored arrays decoded through the reducer's own `loadDir` in the launch worktree, and plan-level
arithmetic (`E.buildContext`) on the panel's 32 plans. Scripts in the session scratchpad's `deep-sr/` (`when.mjs`,
`demand.mjs`, `demand2.mjs`, `spread.mjs`, `short.mjs`, `near.mjs`, `cgtclass.mjs`, `cgtsmall.mjs`, `working.mjs`,
`s061.mjs`, `plans.mjs`, `dist.mjs`). Nothing of seed 7021, `d4-backup` or `d4b-backup` was opened. Every figure below
that is not in the results files or the read's review is from those scripts: a post hoc read of units already read once,
so a lead, not a result.

## Summary

- **NEITHER stands.** The reviewer re-ran the read byte for byte and recomputed every figure. Nothing here changes it, and
  today's split stays.
- **Taken with the earlier reads, the fixed-share route is spent.**
  - The share ensemble found the best share differs by couple.
  - The share choice found the solver's own forecast cannot pick it, and a pick by simulation costs about ten times a
    couple's solve.
  - Now, on held-out couples, neither fixed rule passes. Moving the share by up to 0.18 moves survival from `-12.38` to
    `+9.34` points, beyond noise on 43 of 56 comparisons.
- **The leading cause.** Each person's table plans a part of the household that the household never lives:
  - a fixed share of its spending and minimum pot, for the whole plan;
  - met from that person's own pots and own incomes, starting only at their own retirement.

  The joint move then prices the household's money and its room to spend from those two parts. A pound counts by whose pot
  it sits in, and the household's spending level can only be one that a table ranks in its own top two. The share decides
  whose table reads its part as safe, and in which years. That depends on when each person's own incomes start, which
  neither the pots nor the lifetime means measure.
- **The one test.** Replay the read's own lost and saved paths on its own code, with a record of each year. Then run four
  variants of each rule's policy, each changing one part of its move:
  - today's spending level;
  - today's tiers;
  - today's split;
  - the rule's own policy offering each person's top six moves.

  About 4.5 core-hours, EXPLORATORY. Whichever variant recovers the lost paths names the part of the move that is wrong,
  and so what to build next. In every outcome the default stays until a registered test reads.
- **Open items it moves:**
  - a new line for the share, with its measured effect;
  - CGT-BILL's absence check, whose signature these couples share;
  - FD-RAISE's lead on couples, which the test answers;
  - D99's list of what was not shown: the DB case is now measured.

## 1. What the result says, and what it does not

**It says.**
- Neither fixed rule may become the couples' default, and the registered rule is why.
  - FLAT: four units flagged, and spending down `0.0746%` against a bar of `0.05%`.
  - MEANS: six units flagged, S061-dbpart losing `12.381` points.
  - Each rule's pooled survival gain holds: `+0.421` and `+0.217`. These pooled gains hide swings both ways.
- On held-out couples the share is a first-order lever, not a refinement.
  - It moves survival by up to 1.5 points at 45/55 and 55/45 (S147).
  - With the elder's DB, by 1.9 to 9.3 points.
  - On S061-dbpart, by 12.4 points.
- Three findings first seen on the tuning seed now hold on held-out couples:
  - **The elder's DB gains from a larger elder share.** Stage C's panel showed it on S211-db, S291-db, S129-db and
    S015-db. Here it shows on S023-db (`+1.98`, `+2.71`), S147-db (`+6.66`, `+9.34`) and S271-db (`+1.94`, `+2.25`).
  - **The means' share harms where a later income dominates the means.** On 7002 the partner's-DB unit S211-75pdb was
    V-shaped in the share, and the means' share did no better than the pots' (`-0.175`, within noise). Here MEANS loses
    `12.38` points on S061-dbpart and `0.46` on S377-dbpart.
  - **At 90/10 the means' share harms at the minimum pot.** S129-90 lost `0.95` this way on 7002. Here S023-90 loses
    `2.48`, S147-90 `1.21` and S227-90 `0.88`.
- **Today's default leaves points on the elder's-DB couples.** On S147-db, TODAY survives `89.51%`, against `98.85%` at
  the means' 0.681.
  - It is still above the app's rules by inference: the landing put arm A near 85%. The app's rules were not run here.

**It does not say.**
- **Which share is best on a unit.** There are three shares a unit, so the read cannot say whether some other fixed rule
  could pass.
- **Why.** The arrays hold lifetime totals only. No year's level, tiers, split or table reading is stored.
- **That every flag is money running out.**
  - 2,448 of the 5,646 lost paths end the plan below the minimum pot.
  - Three of MEANS's six flags are almost wholly that.
- **Anything about couples outside the panel's shape:**
  - the younger partner holding more than 55%, or equal ages;
  - the 'lower' estate aim;
  - consent withdrawn, or the dial's other positions;
  - LOOKHOLD, the couples' default since D109. It acts only where both people are above their caps, or past twice a
    table's top, so it does not act on a path running low.

## 2. The leading cause of what is unexplained

What the read leaves unexplained:
- **S061-dbpart runs short whichever way its share moves.** Its failing paths run short in the years before the partner's
  incomes start, yet end the plan with a median `£276k` to `£305k`.
- **At 90/10, MEANS trades one failure for another.** Fewer paths run short mid-plan on 6 of 8 couples, but more end below
  the minimum pot on 7 of 8.
- **The elder's DB gains 2 to 9 points from a larger elder share.**
- **Survival moves with the elder's part.** On 24 of 37 unit-directions it rises with the elder's part or falls with it, at
  45/55 too, where the pots' share would lower the elder's part.

**The cause: each person's table plans a part the household never lives, and the joint move prices the household's money
and room to spend by those parts.**
- **Each person's plan, as cut** (`couple.js` `singlePlanFor`):
  - takes a fixed share of the household's spending and of its minimum pot, for the whole plan;
  - meets it from that person's own pots and own incomes;
  - spends only from that person's own retirement (the engine and `model.js` spend only once anyone is retired,
    `anyRetired`).
- **The household's year:**
  - spends from the first retirement;
  - nets both incomes against one need;
  - draws the rest by the split.
- **How the joint move values a year** (`expectedValue`):
  - it multiplies the two tables' chances;
  - each table reads only its own person's pots, except in a pension-access bridge (`shareBridge` moves ISA, taxable and
    cash money there, never pensions);
  - the household's level can only be one of the levels in the two tables' own top two moves (`rankFor`, `topK` 2).
- **What follows.** A pound in the pot of a person whose table reads them safe, or lost, adds almost nothing to the
  product. So the household spends that money first, and does not cut while it does, however tight the household is.
  `couple.js`'s own note on `'pots'` names one half of this: a person who cannot fund half alone "has a table reading ruin
  everywhere, and the rollout then chooses blind".
- **How the share comes in.** It decides whose table reads safe, and in which years, by when each person's own incomes
  start.

Evidence for:
1. **S061-dbpart.**
   - The couple: the elder is 61 and retired. The partner is 58, and nominally works to 60 with no pay. The elder's state
     pension starts in plan year 7; the partner's state pension and £15,000 DB start in year 10.
   - When the paths fail: in every arm the failures fall before the partner's incomes. FLAT's lost paths fail between the
     two state pensions (435 of 440). MEANS's fail there (1,527) or before both (458).
   - How badly: by little. The lost paths' median unmet is `0.62` (FLAT) and `0.76` (MEANS) years of target in all.
   - Near misses: in year 9, the last year before the partner's incomes, 61 MEANS paths (TODAY 19, FLAT 9) run dry by under
     £1,000 in all.
   - The household could have afforded the bridge: its own need over it, no growth, before tax, is `£146,600` at the floor
     against `£180,000` of pots.
   - MEANS gives the partner 61.5% of the spending because of a DB that starts in year 10. The elder's own state pension
     then meets all but £40 a year of the elder's part from year 7. On the paths both arms keep, MEANS asks `0.95` years of
     target more over the plan than TODAY.
2. **The elder's DB.**
   - At the half share, the elder's own DB and pension cover their part from 68. By my arithmetic, not the table's reading,
     their part needs `0.66` of their own pots at the floor, no growth; the partner's needs `2.05` of theirs.
   - TODAY loses 10.5% of S147-db's paths, mostly mid-plan. Of the 1,505 that MEANS saves, 683 failed between the two state
     pensions, 447 in the decade after and 177 before both.
   - Where MEANS saves a path at the minimum pot (192 of them), it asked `1.29` years of target less. The household cut.
3. **90/10 under MEANS.** Lowering the elder's part does two things:
   - by the same arithmetic, the partner's part (on 10% of the money) is no longer one their own pots and pension cover
     with room to spare, and fewer paths run short;
   - the elder's part of the minimum pot falls, and the paths lost there asked for more spending: S227-90 `+0.634` years of
     target, S023-90 `+0.238`, S147-90 `+0.203`, S377-90 `+0.543`.
4. **The cut's own clock.** On all eight couples there are one to three years in which the elder is retired and the younger
   partner is not yet at their retirement age. On five of them the partner has no pay (S023, S061, S109, S147, S377).
   - The household spends from the elder's retirement: on those five, the full target.
   - The partner's own plan spends nothing until they retire.
   - So on those five, in those years, the two tables plan less than the household draws, by the partner's part. That gap
     grows as the elder's share falls.
5. **The share choice measured the misreading directly.** The joint value at the start read `0.018` on S129-90 at the half
   share, where `79.13%` of paths survive. Its order of the shares matched simulation's at a Kendall's tau of only `0.66`.
6. **What the share's effect is not.** With the estate weight held, the other order alone moves survival `-0.048` pooled,
   `-0.5` at most on a unit (`results-other-order.txt`, YOUNGE). So the share's swings are not the asymmetry of whichever
   person comes first.

Evidence against:
1. **A static reading predicts poorly.** I took each person's part at the floor against their own pots and incomes (real
   rate 0 or 3%).
   - Who it says is short predicts survival's direction no better than "the elder's part went up": Spearman `0.19` to
     `0.36`, against `0.43` to `0.46`. Its sign is right on 19 to 23 of the 35 changes over 0.3 points.
   - At 45/55 the share it balances (0.45 to 0.49) does worse than 0.5 on S023, S147 and S191.
   - If the cause is right, it acts through each year's state, and nothing stored shows that.
2. **Spending explains only part of the minimum pot's losses.**
   - On the 2,448 paths lost at the minimum pot, the extra spending asked is `0.10` years of target, a seventh of the end
     pot's fall of `0.70`. The rest is timing, returns or tax, which the stored totals cannot separate.
   - The 45/55 flags carry a risk signature. The spread of the log end pot over the paths both keep widens where survival
     falls (S023-45 `x1.037`, S147-45 `x1.041`, S191-45 `x1.027`). On the same couples at 55/45 it narrows where survival
     rises (`x0.964`, `x0.950`, `x0.977`).
   - That is the rival cause: a table reading its part as short holds more risk with the money it steers. This is M17's
     failing-futures behaviour, inside a part. Over all 56 comparisons, though, the spread does not track survival
     (Spearman `-0.11`).
3. **FLAT on S061-dbpart cuts more, yet loses more.** It asks `0.65` years of target less over the plan on the paths both
   keep, and still loses 440 paths in the window. If the cause is right, it cut in the wrong years.
4. **A misreading table alone does not collapse the household.** TODAY leaves S061-dbpart's partner a part beyond their own
   money over the window, even at the floor (ten years at £8,560 against £72,000), and still survives `97.79%`.

## 3. The one test: the lost paths, replayed and taken apart

**What it runs.**
- The read's own code, from the launch worktree (e1239959, code c0dcfa9ef2f2).
- Each comparison's two arms, solved again as `audit-share-rules.mjs` `solveArm` solved them.
- Each named path run by the engine as `runPath` runs it. Its survival, end pot, spending, unmet and tax must match the
  stored arrays to the penny; any difference stops the test.
- **A record of each path and year:**
  - the household's level, the split, and each person's tiers and pots;
  - the year's unmet and tax;
  - beside these, each person's table's reading of their own position, and whether any level of the menu would have funded
    a failing year.
- **Four variants of the rule's policy, each changing one part of its move:**
  - **L:** its move with TODAY's spending level, as TODAY's policy picks it at the same household state;
  - **R:** its move with TODAY's tiers for each person, likewise;
  - **S:** its move with TODAY's split, likewise;
  - **TK:** the rule's own policy offering each person's top six moves, not two (`solveCouple`'s `topK`: no new solver
    code).
- **Checks:** a variant taking every part from TODAY must reproduce TODAY's stored arrays bit for bit; one taking none must
  reproduce the rule's. A planted swap, the level taken from the wrong policy, must fail.

**Which couples and paths.** The ten flags, and the largest gain as their mirror. All on seed 7023's own paths: these are
already read, so no new outcome of a held-out seed.

| comparison | lost paths replayed | saved | paths both keep (a control) |
|---|---|---|---|
| FLAT on S023-45, S147-45, S191-45 | 106, 241, 160 | 16, 8, 34 | 200 each |
| FLAT on S061-dbpart | 400 of 440 | 23 | 200 |
| MEANS on S061-dbpart | 400 of 1,985 | 4 | 200 |
| MEANS on S023-90, S147-90, S227-90 | 400 of 451, 274, 169 | 55, 81, 28 | 200 each |
| MEANS on S191-45, S377-dbpart | 117, 101 | 31, 27 | 200 each |
| MEANS on S147-db (the mirror) | 11 | 400 of 1,505 | 200 |

**Size.**
- 20 solves (66 to 337 s each by section H). About 5,300 paths, at about 17 path-costs each: the two arms, three variants at
  twice a path's cost, and TK at up to nine times.
- About 4.5 core-hours: a little over an hour on four free cores, after B1's gate.
- Half a day to build it with its planted checks, and half a day to read.

**How it is read** (the rule committed before it runs). A variant recovers a lost path if it keeps it, counted net of the
paths it loses among the saved and the controls.
- **The cause holds** if two things are true:
  - L recovers at least half of the rule's lost paths, pooled over the ten flags;
  - on most lost paths, in the five years before the failure, the year's draw falls on a pot whose own table reads it at
    `0.98` or more, or `0.02` or less, while TODAY's policy at that state picks a lower level.

  TK then says which half it is. If TK also recovers half, the trouble is the levels on offer; if not, the pricing.
- **The risk rival holds** if R recovers at least half, L and TK under a quarter, and the rule holds more equity than TODAY
  at the same states.
- **Neither holds** if S carries it: then the split is the part that is wrong. If no variant recovers a quarter, the
  trouble is the minimum pot as the share cuts it, and the lost paths' moves part only in the last years.

**What each outcome changes.**
- **The cause holds:**
  - No fixed share and no choice of share can remove it; the share's search stops.
  - The next build is in the joint move. Either offer the household's level from the whole menu (if TK), or price each
    pound at the household's chance rather than its holder's. The second means reading the two tables with the household's
    accessible money shared in every year, as D2.4 does before pension access, pensions where both can draw.
  - Either way, a partner's part counts from the household's first retirement, not their own.
  - Built off in code with its test, then read EXPLORATORY on this panel's units at seed 7002 at all three shares. Its rule:
    the share's swings shrink, and no unit loses to TODAY beyond noise.
- **The risk rival:** the next build is how a short part's tiers enter the joint move. EXPLORATORY.
- **The split:** the joint move's split of five steps cannot carry what the parts misstate; the next build is the
  household's money shared in the reading, as above. EXPLORATORY.
- **The minimum pot:** cut it by where the money is, not by the share (`singlePlanFor`), with its test. EXPLORATORY.
- **In every case** today's split stays the couples' default until a registered test reads.

## 4. Open items the result moves

- **A new line: the couples' share.** It moves survival from `-12.38` points (S061-dbpart, 0.5 to 0.385) to `+9.34`
  (S147-db, 0.5 to 0.681) on held-out couples, beyond noise on 43 of 56 comparisons (`results-share-rules.txt`,
  `-beside.txt`).
  - It has a measured effect, so by STATE.md's rule it belongs in the table.
  - It closes by the test above, then a registered test of whatever it builds.
  - It replaces stage C's deep review's proposed line, "the share's measure (pots only)": pots with the band, pots without
    it, and the means have each now been read.
- **CGT-BILL (fixed).** Stage C's deep review showed the class absent using a signature: a path that fails before the last
  year yet ends with more than it opened with. That signature is not specific on couples whose incomes start later.
  - This run has 3,137 such paths, all on the two partner's-DB units, in every arm. Most run short by a large part of a
    year's spending (the lost paths' median `0.47` to `0.86` years of target).
  - 72 have under £1,000 unmet in all, every one in the last year before the partner's incomes (year 9 or 20): near misses
    in a bridge, not a bill by their timing.
  - The test's record of each failing year's tax would confirm it. The status is unchanged; a later absence check must also
    read the unmet's size.
- **FD-RAISE (closed, reported).** For couples it rests on the re-run's lead: a 110% year in the failing year. The test's
  record answers that for these couples: whether the household raised in the years before running dry. No change of status.
- **The decided defaults (D99's list of what was not shown).** The share rule on a couple with a DB pension is now measured
  on held-out couples:
  - with the elder's DB, the half share is beaten by a larger elder share on all three couples, by `1.94` to `9.34` points;
  - with the partner's DB, it is the best of the three shares on S061-dbpart, level with 0.6 on S377-dbpart, and below 0.6
    by `0.98` on S191-dbpart.

  NEITHER leaves the default as it was, but D99's coverage note should say this.
- **T-GAPS.** Unchanged, and still no couples' line. The share choice's forecast gap stays a lead; the test's readings
  beside its variants would show whether those readings drive the moves.
