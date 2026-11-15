# A better tie rule for couples above their estate caps (D105; EXPLORATORY, seed 7001)

The plan, committed before anything is built or run. The maintainer reopened the couples' tie rule on 15 Nov, after
`TIE-C.md`'s read failed and closed it: "Plan out and add a test to the queue for an improved couples tie rule based on
learnings so far." The rule below is fixed now. The build, its test and the read's files come later, in the queue's order
(STATE.md action 3). A change to this file after the build starts is a dated amendment, made before the launch and before
any unit runs.

## In plain words

The solver values what a couple leaves only up to a cap, four times what each partner opened with. Above the cap, a pound
more is worth nothing to its score. The first tie rule (`TIE-C.md`) acted where both partners are above their caps: among
moves that score almost the same, it took the one paying the least tax this year. It cut tax overall, but it failed on one
couple, S311F. Two of S311F's 8,000 paths decided that, each ending a third or a sixth lower.

What those two paths showed, and what this test changes for each:

1. **This year's least tax was short-sighted.** To avoid a little tax now, the rule drew down the tax-free ISAs and kept a
   large taxable account. That account then paid dividend and capital gains tax every year for decades. With the later
   step in risk undone, 80% and 90% of the extra lifetime tax remained (`results-tie-couple-trace.txt`).
   *The change:* rank near-ties by what each move leaves at the end of the plan, not by this year's tax.
2. **A late step down in risk cut the pot, and it came from a misread.** At 90 the first partner's pension and ISA stepped
   three tiers down to lower risk, and the pot ended a third and a sixth lower.
   - Each person's table covers wealth up to the top of its range. The top is six times what the person opened with, or
     60 years of their spending if that is more, so one and a half times their cap or more (`grid.js` `makeGrid`).
   - A read beyond the top is read as the top (`grid.js` `locate`).
   - In the year before the step, the two pots were about £2.9 billion and £7.1 billion, against the couple's caps of
     £9.6 million together (`results-tie-couple-trace.txt`).
   - So the first partner's table read a pot of billions as one at the top of its range, about one and a half times the
     cap. There a fall below the cap is possible, and less risk is worth its charge. For the real household it bought
     nothing.
   *The change:* where a person's wealth is more than twice the top of their table's range, they never step down in risk.
   That limit is at least three times their cap and 120 years of their spending.
3. **Two extreme paths decided the pot.** On S311F the average pot is carried by paths worth billions. The paired standard
   error of its change (0.67%) was about the size of the change, so the rule's bar of 0.1%, set with no allowance for
   noise, was a coin toss there.
   *The change:* judge each couple's pot two ways. Average each path's own change, so no path counts more for being worth
   billions. Then check the average pound with an allowance for noise.

Two more lessons shape the read:
- The first read checked the rule only along the candidate's own path. That could not see the rule's own path, where risk
  and spending later differed. This read checks both.
- The tax cut was mostly one couple's, so the pooled tax is also shown without the couple that carries most of it.

## What is built (options, off in code)

Both are forward only (no table reads them) and change nothing for any user until a ruling.

- **The forward look (`tieLook`, with `tieJoint`'s margin):**
  - It acts on the first rule's tie set, unchanged: both people above their caps, not the plan's last year, and the moves
    at the best move's spending level and each person's tier pair that score within the margin of it.
  - It ranks that set by the household's pot at the plan's end on the median path:
    - every wrapper grows at its tier's median return;
    - in each later year the household makes the best move's own choices (its split, each person's draw order, re-wrap and
      ceiling, its spending level), with each person's tiers as the move leaves them.
  - The largest end pot wins, by more than a penny. Ties go to the least tax this year, then the larger wealth after the
    move. A look that runs out ranks below any that does not.
  - Only where and how the money is drawn can change: never the spending, never the risk.
- **The hold (`holdPast: 2`):**
  - It applies to the move the chooser picks, after the tie set where that acts, before the plan's last year.
  - It applies to each person whose wealth, as their table reads it (pension, ISA and taxable account together), is more
    than twice the top of their table's wealth axis.
  - For that person, any wrapper the move would step down to less risk keeps the tier the person holds. A step up, and the
    rest of the move, stand.
  - Below that limit nothing changes. In the last year the score is not a table read, so nothing changes there either.
  - Why it is safe:
    - At that wealth the person's survival and spending cannot turn on the risk they hold.
    - The capped pot is guarded by part 4 of the rule.
- **Their test** (FAST_JOINING), each check shown failing on its plant:
  - both options unset, every couple's path is the code before's, to the bit;
  - the hold acts only beyond the limit and only on a step down;
  - the look's ranking matches a hand-run look on a built state;
  - the engine and the forward run stay in step under each option;
  - the refusals.
- **Before the launch, deciding nothing (seed 7002):** S311F's two deciding paths of the first read are run under each new
  arm. Printed for each: the first person's wealth against twice their table's top in plan year 53; the score gap of the
  step at the clamped read; whether either person steps down beyond the limit (by construction, never); and the pot and
  lifetime tax against the candidate's.

## Units

Twelve couples from the couples' re-run panel (`couples-panel-d4b.json`), at their landed targets. None is in `TIE-C.md`,
the couples' tier test or `SPEED-B.md`:
- eight of the younger cohort, retiring at 52, where the first read found the rule acting most (its younger four spent
  about a fifth of their decisions above both caps): S327F, S329F, S331F, S333F, S335F, S337F, S341F, S343F;
- four of the library's: S149, S167, S205, S223.

The seed is 7001, the search seed. It is not the seed whose paths shaped these changes, so the test is not tuned on the
paths that failed.

## The arms

Each couple is solved once, as the app solves a couple since D99 (`audit-couples-share.mjs` `COUPLES_CANDIDATE`:
`shareRule: 'pots'`, 45 points, estate weight 0.02, each person's table with the partner's age, arm A's MPAA ages). Every
arm takes those same tables. Each unit records each person's table digest before the first arm and after the last.

Every arm is run by the engine on the same 8,000 paths of seed 7001:
1. **CANDS:** the couples' candidate as it stands.
2. **HOLD:** with the hold (`holdPast: 2`).
3. **LOOKHOLD:** with the first rule's tie set at the singles' margin (`tieJoint` 1e-4, D85), the forward look and the
   hold.
4. **TIE4**, beside the rule: the first rule at the same margin. It decides nothing and cannot be taken, whatever it
   shows.

Stored for each path and arm: survival, the year a path failed, the pot left, lifetime tax and the spending delivered. Each
unit also records the household's cap, each person's table top, and each arm's engine time.

**The replays** (the first 100 paths), in the exact model:
- **Along CANDS's own path:** at each decision, each arm's choice at CANDS's state against CANDS's. Counted: the decisions
  that differ, and of those any at another spending level; any outside the tie set (LOOKHOLD); and any that differ by
  more than a step down put back for a person past the limit.
- **Along each arm's own path:** the decisions where a person past the limit steps down (HOLD and LOOKHOLD: by
  construction, none). Beside the rule, for every arm: the years at another spending level or tier pair than CANDS's
  path in the same year.

## How it is read

`reduce-tie-c2.mjs`, once, after its gate. The gate requires:
- every unit in every arm, one code and one audit stamp;
- seed 7001 and 8,000 paths in every arm;
- the candidate stage C ran;
- each arm's options as named, read back from the fields the chooser reads;
- each person's tables the same before the first arm and after the last.

For HOLD and LOOKHOLD against CANDS, on the twelve couples, every comparison paired on the same paths:
- **survival:** by couple and pooled, as in the first read (`survivalChangeU`, `pooledSummed`);
- **spending delivered:** pooled, in percent;
- **the capped pot**, as the solver scores it: by couple and pooled;
- **the pot left, two ways:**
  - **the typical path:** over the paths where both arms leave a pot, each path's own change in percent, averaged for
    each couple; pooled, the couples' figures averaged, each with its 95% interval;
  - **the average pound:** each couple's mean pot, the arm over CANDS in percent, with its paired standard error and 95%
    interval;
- **lifetime tax:** each couple's mean; pooled, the couples' means averaged.

## The rule

An arm passes if all eight hold, against CANDS:
1. pooled survival's 95% interval has its lower end above -0.1 points;
2. no couple's interval lies wholly below -0.3;
3. pooled spending delivered is within 0.05% either way;
4. the capped pot is not lower by more than 0.1% pooled, nor by more than 0.5% on any couple;
5. the pot left, on every couple:
   - (a) the typical path is not lower by more than 0.1%;
   - (b) no couple's 95% interval for the average pound lies wholly below -0.1%;
   - (c) where a couple's average-pound standard error is 0.05% or less, its change is not below -0.1%. That is the first
     read's bar, kept where the average can be read at it;
6. pooled lifetime tax is not higher;
7. in the replays, every differing decision is one the arm allows, and no person past the limit steps down on HOLD's or
   LOOKHOLD's own paths. One that is not is a bug in the rule or the audit: STOP;
8. a gain: the pooled typical-path change in the pot is higher beyond noise (its 95% interval's lower end above nought).

**Which is taken:**
- If both pass, LOOKHOLD is taken only if, against HOLD on the same paths:
  - its pooled typical-path pot is higher beyond noise; and
  - no couple's 95% interval for the average pound lies wholly below nought.
- Otherwise HOLD is taken. It adds no time to a path.
- If one passes, that one is taken.

**The outcomes:**
- **PASSES:**
  - The arm taken comes to the maintainer with the read and the agent's recommendation to make it the couples' default:
    `src/solverSettings.js` `APP_COUPLE`, with the decided-defaults block and the test that pins them. The reviewer looks at
    the change of default before it is committed.
  - If the maintainer says before the launch that a pass goes in without another word, as D97 (2) said for the first
    rule, it goes in on that word.
  - If the arm taken adds more than a quarter to a couple's path (the median over the twelve), it comes as the trade it
    is, the time against the gain (D90 (2)'s form).
- **NO GAIN** (neither arm passes, and one holds parts 1 to 7 and fails only part 8): closed. Nothing measured changes,
  so nothing is added; reported.
- **FAILS** (neither arm holds parts 1 to 7): closed and reported; nothing changes. Part 7 failing is a STOP, reported as
  a bug.

**Beside the rule, deciding nothing:**
- TIE4 against CANDS by the same parts: the first rule on new couples and new paths;
- LOOKHOLD against HOLD: the forward look's own effect, with neither arm taking the misread step;
- each couple's figures in each arm, and the paths ending more than a tenth lower or higher, with their lifetime tax;
- how often the hold acts and the look changes the pick, and the years each person spends past the limit;
- the pooled tax without the couple that carries most of its change;
- the figures by cohort, and each arm's engine time a path.

## What it cannot show

- It covers twelve couples, one seed and one estate weight.
- The forward look uses one median path, as a guide. It is not the expected end pot.
- With the allowance for noise, a loss like S311F's in the first read, -0.7% on an average whose standard error is 0.7%,
  would pass part 5(b). This read cannot tell a loss that size from noise on a couple like that. What it relies on there
  is the hold, which removes the step that caused the loss, by construction (part 7). If the maintainer would rather keep
  the first read's point bar on the average pound for every couple, the rule is amended before the launch.
- The same misread reaches a single's chooser, whose tie-break has been in the candidate since D95. That is a lead for a
  later test, not part of this one.

## Cost and time box

- **The build:** the two options and their test, then the audit, the batch and the reducer with their planted checks. One
  day.
- **The run:** about 21 core-hours, about five and a half hours on four free cores. Each of the twelve couples takes one
  solve and four runs of 8,000 paths; the forward look adds about a fifth to a younger couple's path, to be confirmed by
  the build's timing.
- **The read and its report:** half a day.

## Launch

On frozen code, through the launcher, once the build's test passes and the cores are free:
`PREDICTION="none:EXPLORATORY: an improved tie rule for couples (TIE-C2.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-tie-c2.sh`.
The cores are free after B1's gate on the fourth batch and the share rules' pilot (D104 (5)). It runs as a harness-tracked
task, relaunched under `RESUME=1` after a restart.
