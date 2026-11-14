# Deep review after a confirmatory read: item 6's stage C, couples who hold their money unevenly (`couples-share.md`, seed 7022), read 14 Nov

Subject: what stage C's read (`results-couples-share.txt`, PASS; the reviewer at the read,
`reviews/2026-11-14-read-couples-share.md`, PASS with six MINORs) says together with the couples' registered read and its
deep review, the couples' tier test, stage A and the singles' Phase 4, before D99 goes to `main` (the couples' default
`shareRule: 'pots'`, the guard lifted for an elder holding more than 60% and at most 90%, `COUPLES` on).

Read: STATE.md whole, CHECKLIST.md, the registration and its two design reviews, the results, panel and sizing files, the
read's review, `reports/2026-11-14-stage-c-read.md`, PART-D.md (D5, D6), `results-couples-d4b.txt` with
`reviews/2026-11-13-read-couples-d4b.md` and `-deep-couples-d4b.md`, `results-couple-tiers.txt` with `COUPLE-TIERS.md` and
its review, `SHARE-A.md` and `results-share-a.txt`, Phase 4's block; `src/solver/couple.js` whole, `solve.js` (the
objective's weights, l.597-608), `model.js` (the couple's year), `src/solveStatus.js`, and the working tree's uncommitted
D99 draft (`src/couplesSwitch.js`, `src/solverSettings.js`, `src/solverClient.js`, `src/PlannerCards.jsx`).

Ran (EXPLORATORY; nothing written but this file): reads of the 108 stored units of seed 7022 through the reducer's own
`loadDir` (the registered read made), and plan-level arithmetic on the panel's 36 plans (`E.buildContext`; no solve, no
path). Scripts in the session scratchpad's `deep/` (`load.mjs`, `res.mjs`, `s1.mjs` to `s10.mjs`). Nothing of seed 7021,
`d4-backup` or `d4b-backup` was opened. Every figure below that is not in the results file or the read's review is from
them: a post hoc read of units already read once by the registered rule, so a lead, not a result.

## Summary

- The PASS is sound. I recomputed the pooled +10.682 and +9.930 from the arrays with my own code. The twelve feature
  units' CANDS and CANDH are the same on all 12,000 shared paths. It is the size of gain the singles (+10.71) and the 60/40
  couples (+10.01) showed. It now holds for couples whose elder, entered first, holds 75% or 90%. The pots' share is what
  makes it hold at 90/10: +20.7 points over the half share there.
- One part of the drafted switch-on should be held back: the elder entered second.
  - The draft guard lifts for the elder whichever person the elder is. With the elder second, the code runs with the
    first person holding 10% to 40% of the pots, and no run has held that.
  - The joint move is not symmetric in the two people. It weighs both estates at the first person's own weight
    (couple.js l.383 and l.515), which there is 3 to 9 times what the panel ran.
- Four things must be said on the couples' screens:
  - the pot: the median is lower on 20 of 24 re-held units, and on the paths both arms keep the lowest tenth is lower on
    23 of 36 units;
  - tax is higher on the long-horizon couples;
  - the oldest couples gain no spending;
  - the progress strip's "your half" is no longer true.
- Three things are unexplained:
  - the gain is 0.66 points smaller at 90/10 than at 75/25, on the same couples and paths;
  - the DB units gain least (S211-db +4.6);
  - on the two working couples the share rule changes nothing.

  The leading cause: the share is read from today's pots alone. It does not see each person's incomes or the
  contributions still to come.
- The one test: a share ensemble. Fixed shares around the rule's, through `solveCouple`'s own `share`; ten units, seed
  7002, 4,000 paths, about 6 core-hours.

## 1. What the result says, and what it does not

**It says.**
- On 12 held-out couples, the couples' candidate with the pots' share keeps more couples solvent than the app's rules on
  every unit. In each couple the elder, always the first person, held 75% or 90% of every wrapper.
  - Re-held units: +6.8 to +14.3 points, pooled +10.682 (+10.442 to +10.921).
  - The 12 units with a feature: +4.6 to +13.1, pooled +9.930.
  - Every unit's interval is above +4.28 (the read's review). Spending delivered +4.0%.
  - The eight comparisons named below D34's 0.90 rate each gain 12 to 14 points, so the shortfall is moot.
- The share rule is what carries the gain.
  - CANDS less CANDH: +5.0 points at 75/25 (+4.4 to +5.6) and +20.7 at 90/10 (+19.4 to +22.1).
  - At 90/10 the half share is below the app's rules beyond noise on 9 of 12 couples (the read's review, paired).
  - Stage A's finding holds at 45 points on held-out couples.
- The capital gains bill's class appears on no path of any arm: 0 of 1.40 million paths. The class is a path that fails
  before the last year while ending with more than it opened with.
- The rollout in the model agrees with the engine on survival on 18,000 paths.

**It does not say.**
- Anything for a couple entered with the elder second, where the first person holds 10% to 40% of the pots. No unit had
  it (section 2).
- Anything about the share rule on a couple with a DB pension, a gain or a state pension from 67. Every feature unit held
  60/40 and was solved at 0.5 (the read's review, finding 5). Item 8's question is answered for the half share at 60/40
  only, with the DB always the first person's.
- Anything for incomes uneven in other ways: a pension income with the partner holding fewer of the pots, or state
  pensions far apart. The re-holding moved balances only. Contributions, salaries and state pensions stayed as the
  library has them.
- 60% to 75% (interpolated), above 90%, the younger holding more, or equal ages outside the band.
- The early years' spending. These arrays store lifetime totals, not each year's level. The couples' re-run read the cut:
  92.5% of target in the first five retired years, against 98.2% under the app's rules.
- That the branch's code now gives the same result. The code stamp has moved since 7002a1fec94c (the read's review,
  finding 6). I agree that an identity on a few units belongs in the change of default.

## 2. Should anything hold the switch-on back, or be said on the screens

**Hold back: the elder entered second.**
- The D99 guard draft (`src/couplesSwitch.js` `elderOf`, `coupleSolverOn`) lifts for an elder holding more than 60% and
  at most 90%, whichever person the elder is.
  - With the elder second, `shareFor` gives the first person 10% to 40%. The code then runs with the first person as the
    smaller holder.
  - Every re-held unit of stage C had the first person holding more. The couples' re-run had the first person at 60%.
- The registration and the second design review treat the entry order as the plan's horizon only. The code is not
  symmetric:
  - **The estate weight.** The joint move weighs both people's estates at the first person's table's weight:
    `A.wB * (rA[1] + rB[1])`, couple.js l.383 and l.515, with `A = cp.tables.self`. A table's weight is 0.02 over that
    person's own opening wealth (solve.js l.604-606). Per pound of the household's opening wealth:

    | | weight |
    |---|---|
    | a single, for comparison | 0.02 |
    | tested: the couples' re-run, 60/40 at W0.01 and W0.02 | 0.017 and 0.033 |
    | tested: stage C, 75/25 and 90/10 | 0.027 and 0.022 |
    | admitted, never run: the first person at 40%, inside the band since M4 | 0.05 |
    | admitted, never run: the elder second with 75% | 0.08 |
    | admitted, never run: the elder second with 90% | 0.2 |

    The first person at 40% inside the band is half again the tested top (0.033). The elder second at 75% and 90% is 2.4
    and 6 times it.

  - **What that does to the estate term.** At 75% and 90% held by the elder entered second, the estate term can be
    worth up to 0.32 and 0.8 of a survival unit. At the panel's holdings it is 0.11 and 0.09. At 90% the joint move
    would give up one point of survival for capped estate worth 5% of the household's wealth. On the panel it took 45%.
  - **Ties.** Ties go to the first split tried, which is the second person funding the year (`chooseJoint`'s
    `score > bestScore`, splits from 0).
- What a higher weight does to survival is unmeasured. No run has held a weight above 0.033 (B12: no higher estate
  priority). Section 3 shows that the outcome at the minimum pot moves with the holding, and the weight is among the
  suspects.
- My recommendation, for the maintainer to choose and write into the D-line:
  - Either lift the guard for an elder holding more than 60% and at most 90% only where the elder is the first person.
    A couple with the elder second then keeps the app's rules. Its card's new wording ("couples where the older partner
    holds up to 90%") must not tell it that it is covered.
  - Or weigh the household's estate at one weight, 0.02 over the household's opening wealth as for a single. That
    changes the tested couples too, so it needs its own test before it goes on.

**The read's review, finding 6.** The change of default should show a panel couple's solve and paths at the new defaults
the same as on 7002a1fec94c, or say what moved.

**Say on the couples' screens.** None of these changes the outcome; each is a figure a couple would read as "better".
- **The pot.**
  - The median is lower under the candidate on 20 of 24 re-held units, median ratio 0.88 (the read's review).
  - The mean is 0.40 of the app's rules', pooled.
  - Capped at four times the opening pots it is level (mean of the ratios 1.00).
  - The lowest tenth over all paths is higher on all 36 units, because fewer paths fail.
  - On the paths both arms survive, the lowest tenth is lower on 23 of 36 (S155-gain 0.37 of APP's, S103-75 0.50).
    Where both last, the candidate spends nearer the line.
  - So the screen should show the pot's median and its lower tenth beside survival, as the couples' deep review asked.
- **Tax.** Higher under the candidate on 10 of 36 units: every unit of S265, S291 and S129, and S183-75 (S291-75: £32,572
  to £209,812). Lower on the rest. No tie rule reaches a couple's joint move yet (D97 (2)).
- **The oldest couples (68/65) gain survival only.** Spending delivered is lower on S015's three units, S019-75 and
  S043-gain, by up to 2.9%.
- **The progress strip** (`src/solveStatus.js` l.45) says "your half" and "your partner's half". Under the pots' share
  at 90/10 the parts are 90% and 10%.

## 3. What is unexplained, and its leading cause

What the PASS leaves unexplained:

1. **The gain shrinks with the holding.**
   - On the same couples and paths, CANDS less APP is 0.662 points smaller at 90/10 than at 75/25 (se 0.034). CANDS's
     own survival is 0.556 lower.
   - By couple: S129 -2.44, S019 -2.12, S265 -1.26, S237 -1.22, S183 -1.14, S291 -1.04, S389 -0.50. The other five
     move +0.06 to +0.84.
   - S129: CANDS at 90/10 loses 518 paths that its own 75/25 unit keeps. All of them end below the minimum pot (£1.08m,
     45% of the opening pots). On those paths it spent 1.96 years of target more and paid £88,000 more tax.
   - S019 is the same: 216 paths, all at the end, 0.79 years of target more. So are most of S237's and S389's lost
     paths. S183, S265 and S291 lose theirs in the last decade.
2. **The DB units gain least.**
   - Pooled: +9.08 (+8.84 to +9.31), against +10.46 for a gain and +10.26 for a state pension from 67.
   - S211-db, +4.60, is the panel's smallest gain: half of what its couple's re-held units gain (+9.30, +9.36). Its
     candidate runs out mid-plan on 9.20% of paths, against 4.10% and 4.76% there, mostly in plan years 20 to 39.
   - Each DB unit is below its couple's re-held mean (-0.9, -0.1, -4.7, -2.6). The other features scatter (-1.5 to
     +2.1). This is a rough baseline: the holding and the landed target differ.
3. **On the two working couples the share rule does nothing.**
   - S265 and S291 are 45/42 and contribute until 60. They do as well at the half share as at the pots' share: CANDS less
     CANDH -0.3, -0.9, +1.2, +2.6.
   - On the other ten couples the half share at 90/10 is 11.8 to 38.3 points worse.

**The leading cause: the share is read from today's pots alone.** What decides whether each person's table can fund its
share is that person's whole means: the state pension, any DB pension and the contributions still to come.
- Each table is solved on its share of the household's spending, against its own person's incomes (`singlePlanFor`).
- So the two tables add up to the household's year only when each person's means match their share.
- Where they do not, one table carries a need the household does not have. The other banks a surplus the engine never
  makes, because the household's year nets both people's incomes against one need.

Evidence for:
- **The DB units.** They are solved at 0.5 while the first person holds 0.63 to 0.69 of the household's means. Means here
  are pots, contributions to come, and the state and DB pensions to the plan's end, at 2.5% real; this is my arithmetic
  on the plans.
  - So the second person carries half the spending with about a third of the means: stage A's fault in a milder form.
  - Stage C's own CANDH at 75/25 has a means gap of similar size, and it is 5.0 points worse than the pots' share,
    pooled.
- **The 90/10 units.** At 90/10 every couple's second person holds 14% to 30% of the means against a 10% share.
  - On 10 of 12 couples their state pension also exceeds their share of the spending, by £2,900 to £7,700 a year. At
    75/25 that is true of S389 alone.
  - So their table reads them as safer than the household is.
  - The losses against 75/25 fall where the household is tight late: at a minimum pot that binds (S129 and S019 at 45% of
    the opening pots, S237 at 20%), after spending more, or in the last decade.
- **The working couples.** S265's and S291's contributions and state pensions bring the first person's means to 0.70 and
  0.74 at "90/10" pots. Half and 0.9 are about equally far off, and they do about equally well.

Evidence against:
- S015-db: its first person's means (0.69) are as far from 0.5 as S211-db's, yet it gains +13.1, level with its
  re-held units.
- S015 at 90/10: the second person's state pension exceeds their share by 27% of the household's need after both
  pensions, yet it gains +0.50. The cause needs a binding floor or a tight last decade to bite, and on its own it does not
  predict where that is.
- A rival cause:
  - The joint estate weight also falls from 75/25 to 90/10, by a sixth.
  - A lower weight ends more paths below the minimum pot: the couples' re-run lost 72 such paths at W0.01, against 25
    at W0.02.
  - But halving the weight moved that run's survival by 0.08 points pooled, too little for S129's 2.4.
- Nothing per year is stored. The tables' reads, the levels and the split are inferred from lifetime totals.

## 4. The one test

**The share ensemble.** This is V4's policy ensemble on one lever. Each unit is solved at fixed shares around the rule's,
through `solveCouple`'s own `share` option (no new code, no new rule in the candidate), and run by the engine on the same
paths. EXPLORATORY, its rule committed first, deciding nothing in the code.

- **Units and shares.** Stage C's panel plans, now spent as held-out. APP runs beside on every unit. Estate weight 0.02, 45
  points, the couples' candidate af001697ce1b as in stage C's arms.

  | units | shares |
  |---|---|
  | the DB units S015-db, S129-db, S211-db, S291-db | 0.5 (the rule's), 0.6, 0.7 |
  | S129-90 and S019-90 (the largest losses, both at the minimum pot), S265-90 (working), S237-90 (no state-pension excess: the counter-case) | 0.9 (the rule's), 0.8, 0.75 |
  | S129-75: the same couple at the same share with the 75/25 holding (the anchor) | 0.75 |
  | S211-75 with the panel's £15,000 DB moved to the second person (the read's review's least covered case; built in the test's audit, not landed) | 0.75 (the rule's), 0.65, 0.55 |

- **Seed and paths.** 7002, the first 4,000 paths, paired across shares.
- **Cost.** From stage C's own recorded times (solves 63 to 200 s; the engine 68 to 186 ms a path), the 28 solver arms
  come to about 5.4 core-hours. Allow 7: two hours on four free cores.
- **How it is read.** Each unit's survival at each share, paired against the rule's share (`survivalChangeU`). Then the
  best share's gain over the rule's, against D4's targets (0.5 a unit, 0.2 pooled).
  - **THE SHARE'S MEASURE** if all three hold:
    - a share toward each person's means beats the rule's by more than 0.5 points, beyond noise, on at least two of
      S211-db, S291-db and S211-75 with the partner's DB;
    - the same on S129-90 or S019-90;
    - pooled over the units, the best share beats the rule's by more than 0.2.
  - **NOT THE SHARE** if the rule's share is within D4's targets of the best on every unit.
  - Otherwise **MIXED**, named by which group held.
  - Beside the rule:
    - S129-90 at 0.75 against S129-75 at 0.75. This is the holding's own effect at one share: what is left once the
      share is equal is where the pots sit and the joint weight.
    - Each arm's minimum-pot failures and its lifetime tax.
- **What each outcome changes.**
  - **The share's measure.**
    - Build a share from each person's means (pots, contributions to come, state and DB pensions) as an option, off in
      code. It becomes the couples' default only after a registered test reads, as `'pots'` did.
    - Meanwhile D99 stands for what stage C held, since no harm was found there.
    - The D-line says the guard reads pots alone. Couples whose incomes are more uneven than the panel's, inside the
      band or out, are reached by an inference this test contradicts; above all, a pension income with the partner
      holding fewer of the pots.
    - The maintainer decides whether the guard reads incomes until the new rule reads.
  - **Not the share.**
    - The pots' share stands as tested, and the shortfalls are the holding's own.
    - If S129-90 at 0.75 still loses to S129-75 at the minimum pot, the joint weight is the next lead. It is the same
      code the elder-second couples turn on (section 2): one household weight, built and tested, settles both.
  - **Mixed.** Each group's outcome decides its own half, as above.

## 5. Open items the result moves

- **CGT-BILL** (fixed, replayed). Its class is absent from a registered couples' run on the fixed engine: 0 of 1.40
  million paths, in every arm. This panel held no couple of the shape that showed it (pension-heavy, retiring at 52).
- **New for the register: the joint estate weight follows the first person's opening wealth.**
  - The couples' deep review named it for stage C.
  - Stage C ran it at 0.022 to 0.027 per pound of household wealth. D99's guard admits 0.05 to 0.2.
  - Measured effect: none yet.
  - It closes when the guard is held to the elder first, or by one household weight with its test.
- **New for the register: the share's measure (pots only).**
  - Measured effect: the gain is 0.66 points smaller at 90/10 than at 75/25, and the DB units gain +9.08 against +10.3 to
    +10.5 for the other features.
  - It closes by the one test.
- **T-GAPS.** Unchanged, and still needs no couples' line: D5's couples' figures are the engine's run of the solved
  couple (PART-D.md D5.2).
- **FD-RAISE.** Not measurable here, since no year's level is stored. For couples it rests on the re-run's lead: a
  110% year in the failing year on the younger couples.
- **D97 (2), a couple's tie rule.** This run shows where such a rule would act.
  - Tax is higher under the candidate on 10 of 36 units, all long-horizon or rich (S291, S265, S129), and lower on the
    rest.
  - It is still a tax matter.
- **The decided defaults (STATE.md section 2).** The couples' `shareRule: 'pots'` joins with D99. The block should name
  the guard's terms as the code was tested: the elder entered first.
