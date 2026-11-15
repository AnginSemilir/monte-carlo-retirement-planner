# Review before a change of default: a couple whose elder is entered second, solved on its mirror (D104 (1), `SWAP_ELDER` on)

Subject: D104 (1)'s change of default, on the working branch at 8099d75b. The swap was built off in code in 9ee957f0
(`src/coupleOrder.js`, `src/couplesSwitch.js`, `src/solverClient.js`, `couple-order.test.mjs`, `couple-swap.test.mjs`) and
switched on in d2dd13d5 (`SWAP_ELDER` true, the decided-defaults block's `swapElder`, `couple-default.test.mjs` and
`couple-swap.test.mjs`, the words). The page's check came in d36278ef and 1465c822 (`solver-planner-ui.cjs` check 19 (e)),
with its results in f16aff51 and 8099d75b. It rests on 4ada22b4 and da4669d8.

Read (blobs at 8099d75b):
- the change: `src/coupleOrder.js` 7b90d24e, `src/couplesSwitch.js` 84f2038f, `src/solverClient.js` e41ef74a,
  `src/PlannerCards.jsx` 7ab26015, `src/solverApproximations.js` 80bf1a54;
- the code it feeds: `src/solverCouple.js` c3a00206, `src/solverStrategy.js` a4bbb1c4, `src/solverWorker.js` ba539012,
  `src/useSolver.js` c9b94ff8, `src/PlannerPlan.jsx` ddcaa68d, `src/solverWords.js` dff35b17, `src/solverSettings.js` fb3004da,
  `src/solver/couple.js` d1c9ce6c (`singlePlanFor`, `personLocks`, `chooseJoint`, `couplePolicy`), and `src/App.jsx` 6f9e21aa
  (`normalizePlan`, `normaliseSpendBands`, `normalizeSolverLocks`, `buildContext`, `stepYear`'s row, `evaluateRows`,
  `resolveMpaa`, the solved ledger and history at l.9285-9320 and l.9478-9511);
- the tests and results: `research/tests/couple-order.test.mjs` adb00a00, `couple-swap.test.mjs` 95eac1eb,
  `couple-default.test.mjs` dad9d761, `couple-cut.test.mjs` 42e13f7a, `income-end.test.mjs` 3d8f61d7,
  `research/ui-harnesses/solver-planner-ui.cjs` cec51296, `results-planner-ui-swap.txt` 0d389b24,
  `results-planner-ui-noback.txt` 47f5390b;
- the record: `STATE.md` 702f4af0 (the decided-defaults block, D104, action 3), `reports/2026-11-15-other-order-read.md`
  c087da49, `reviews/2026-11-15-read-other-order.md` 3ab9547d and `-2.md` 570af114.

Ran (read-only on the repository; my scripts are in the session scratchpad, `review-swap/`). I opened nothing of seed 7021,
D4, `d4-backup` or `d4b-backup`.
- `couple-order`, `couple-swap`, `couple-default` and each with `--planted`; `couple-cut`; `income-end`. All pass as their
  results files say, and every plant fails exactly its checks.
- The fast tier (`run-all.mjs fast`): see the line at the end.
- `probe-ages.mjs`: S007 entered elder first and younger first. Each is solved at the harness's light settings by the
  page's own route: the mirror where `swapOf` holds, then `couplePlans`, each person's `solveForApp`, and `assembleCouple`.
  Then the worker's 'strategy' and 'ahead' answers for the plan as entered, put back as `solverClient.js` puts them back.
  `probe-ages-swapoff.mjs` is the same with the plant 'swapoff' (the code before the change).
- `scan-horizon.mjs`, `scan-horizon2.mjs`, `probe-horizon-solve.mjs` and `probe-horizon-swapoff.mjs`: horizons with
  fractional ages.
- `probe-locks.mjs`: the limits per person through the mirror, with real ceilings.
- Planted mirrors, the repository untouched: `plant-loader.mjs` resolves `src/coupleOrder.js` to a copy with one line
  changed, and I ran `couple-order` and `couple-swap` against each copy.

Verdict: FAIL

## What holds

- **The mirror moves every field the engine and the solver read in the first person's terms that I could find.**
  - The nine Self/Part pairs are every pair in `BLANK_PLAN.demographics`.
  - Each account moves with every field it holds, and its id moves with it. `normalizePlan` then rebuilds the canonical
    order.
  - Incomes, deposits and one-off costs move their owner. A deposit with no owner is the first person's. Neither the engine
    nor the cut reads a cost's owner.
  - The end age moves, so the plan ends in the same year (in whole ages: finding 2).
  - The spending bands move by `bandTo`. I checked it against the engine's reading: rounded ages, both ends inclusive,
    compared with age0 + t. It covers exactly the same whole plan years at both edges, for any fractional age.
  - The limits per person swap.
  - The household's own fields need no mirror. Some are read per person at that person's own age: the state pension age,
    and the pension access age with `pensionBefore`, which raises it. The gifts are read by year. The rest are settings of
    the household's: the lump sum, the aims, the speed mode and the config.
  - Planted mirrors run against the tests catch four of these:

    | plant | couple-order fails | couple-swap fails |
    |---|---|---|
    | deposits left with their entered owner | 3 | 3 |
    | incomes left with their entered owner | 2 and 4 | none |
    | the end age left as entered | 2, 3 and 4 | 3 |
    | costs left with their entered owner | 3 | 3 |

    The limits are the exception (finding 3).
- **The identity.** Couple-swap check 3 cuts the younger-first entry of S007 (with a band) through the mirror, and the cut
  is the elder-first entry's to the bit. My probe repeats it with a real ceiling for each person and a deposit: the cut is
  the same to the bit, and each person's prepared plan holds their own ceiling (`probe-locks.mjs`).
  - So the solved figures of a couple entered younger first are those of the same couple entered elder first.
  - Stage C's PASS covers that solve exactly. Its comparison with the app's rules on the plan as entered rests on
    inference, as D104 says.
- **The guard reads what D104 (1) says.**
  - The elder's holding is `1 - share` where the couple is swapped.
  - The age cap is read on the plan as entered.
  - Couple-default check 2 covers 10080 plans with 0 differing. Couple-swap check 2 fails exactly on its plant 'capafter'.
  - Reading the cap before the swap is the same condition as the mirror's end age staying within 120.
- **The rollback.** With the plant 'swapoff', the guard's decisions on the library's couples, as entered and mirrored, match
  the code before's digest e18be1b36a22a4b8.
- **The decided-defaults block and the code agree, changed in one commit (d2dd13d5) with the test that pins them.**
  - The block's couples entry is `{"on":true,"shareRule":"pots","band":[0.4,0.6],"elderUpTo":0.9,"elderFirst":true,"swapElder":true}`.
  - The code has `COUPLES`, `APP_COUPLE.shareRule`, `COUPLE_BAND`, `ELDER_UP_TO`, `ELDER_FIRST` and `SWAP_ELDER` true.
  - Couple-default check 1 passes.
- **Most answers are put back, and the code is right for them.** The meta and the share, the progress label, this year's
  actions (each person's moves and the split), the next ten years' ages, and the year rows are put back. For the rows that
  means every Self/Part key, `pots` by the entered ids, and the tiers from `parts.part` (`chooseJoint` always returns a
  move, so every year has its parts). The verdict's failure age is put back too.
  - Pinned: the actions and the next years' ages, by check 4 and the harness's check 19 (e), whose plant 'noback' fails
    exactly 19. The rows' ages, ids, figures and tiers, by check 4.
  - Finding 4 lists what is not pinned.
- **The words on who is planned for** (`COUPLES_LINE.on`, the 'uneven' card) follow `SWAP_ELDER`. They match the guard.
  Couple-default check 4 pins the line both ways.

## Findings

1. **BLOCKING. The Strategy answer is never put back, so the Your-plan place shows a couple entered younger first in its
   older partner's ages. The next ten years on the same page show the entered first person's ages.**
   - `src/solverClient.js` puts back the job's `ask` and `actions` answers (l.288, l.290) but returns `strategy` raw
     (l.289). `backAnswer` has no case for it (`src/coupleOrder.js` l.97-99).
   - The answer is worked out on the solved context, which is the mirror's household (`solverStrategy.js` l.220-222). It
     carries ages in the mirror's first person's terms:
     - `outlook.spend[].age` is `ctx.ageSelf0 + t` (l.159);
     - `raise.age` is the same (l.136).
   - The page reads both:
     - the spending chart's axis and the "Age" column of its table (`PlannerPlan.jsx` l.241, l.255);
     - the wealth chart and its table, at `ageAt0 + t`, where `ageAt0` comes from `spend[0]` (l.237, l.263);
     - the back mark (l.245);
     - the chart's sentence, the ages of its stretches and its "from about" age (l.242, l.286);
     - the raise line, "you could spend up to 10% above your target from about age 70" (`solverWords.js` l.34).
   - Measured (`probe-ages.mjs`): S007 entered younger first, its first person 65 and the elder 68.
     - The next ten years, put back, read ages 65, 66, 67.
     - The outlook reads 68, 69, 70.
     - The wealth chart starts at 68.
     - The raise is `{"level":110,"age":70,"t":2}`, so the page tells the entered first person "from about age 70" for the
       year they are 67.
     - The same couple entered elder first reads 68, 69, 70 throughout. The younger-first entry is therefore shown the
       elder's ages, and the elder is the partner.
     - The harness's own fixture shows the same (`probe-ages-75.mjs`): S001 (65 and 68) re-held 75/25 and entered younger
       first, a couple the change newly turns on ('uneven' before it). Its next ten years read 65, 66, 67, its outlook 68,
       69, 70, and its raise is `{"level":110,"age":68,"t":0}`.
     - My re-hold scales each person's pots, while the harness's splits each wrapper. The outlook's ages depend on the two
       ages alone, so the page that check 19 (e) passed on showed 68, 69, 70 in the outlook beside 65, 66, 67 in the next
       ten years.
   - It is also a regression. Before the change, a couple inside the 40% to 60% band entered younger first was solved as
     entered and shown its own ages. S007 entered younger first is such a couple (its first person holds 40%). With the plant
     'swapoff' its outlook reads 65, 66, 67 and its raise age is 67 (`probe-ages-swapoff.mjs`). With the swap on it is
     mirrored and reads 68, 69, 70. So the change puts every couple entered younger first that the solver runs onto the
     partner's ages: those it newly turns on, and those inside the band that the solver already ran.
   - This is against D104 (1)'s "its figures shown back as entered" and against `coupleOrder.js`'s own contract, "each age
     the entered first person's" (l.56-61).
   - No test can see it:
     - Couple-swap check 4 puts back the actions, the next years and the rows, never a Strategy answer.
     - The harness's check 19 (e) compares the page's whole Strategy answer (`data-strategy-figures`) with `refCoupleSwap`
       (`solver-planner-ui.cjs` l.233). That reference is `strategyOf` on the mirror's solve, so it carries the same elder's
       ages and the check passes with the fault present.
     - The check's next-ten-years comparison reads `[age, spend]` alone (l.759-768).
   - To clear:
     - Put the Strategy answer back as the others are: `outlook.spend[].age` and `raise.age` by `gap`, through `strategy()`
       as well as `ask('strategy')`.
     - Add a check of the class that fails on today's code: each age in the younger-first entry's Strategy answer is the
       elder-first entry's less the gap, year for year with the next ten years' ages, in `couple-swap.test.mjs` and in check
       19 (e).
     - Give the check its plant.

2. **MINOR. With fractional ages, the mirror's end age can give the plan one year fewer than the plan as entered. This is
   the cut's floating-point horizon, already on `main`, repeated in the mirror.**
   - `otherOrder` writes the end age as `ctx.terminalAge - ctx.ageSelf0 + ctx.agePart0` (`coupleOrder.js` l.39). The engine
     counts the plan's years as `Math.round(terminalAge - ageSelf0)` (`App.jsx` l.1705).
   - Where the entered first age ends in .5, as in 60.5, the plan as entered has T - a exactly x.5, which rounds up. The
     mirror's ((T - a) + b) - b can land at x.49999999999999, which rounds down.
   - The scan (`scan-horizon.mjs`): the younger entered first at 55.0 to 70.0 in half years, the elder 0.1 to 6.0 years
     older, plans to 90, 95 and 100. The horizon differs on 216 of 5580 couples, every one with a first age ending in .5.
     Example: 60.5 and 62.1 to 95 gives 35 years entered and 34 in the mirror.
   - Solved by the page's route (`probe-horizon-solve.mjs`), that couple is on (in the band) and swapped. The worker's
     strategy answer throws "strategyRuns: the solved plan runs 34 years and yours 35", so the page shows its failure card.
   - It is not a regression for the couples the solver already ran. `singlePlanFor` (`couple.js` l.117) gives the partner
     `age0 + (T - a)`, the same sum, so the same 216 couples failed before the change: one person's table is a year short
     of the household's. With the plant 'swapoff' the same couple throws "undefined is not iterable"
     (`probe-horizon-swapoff.mjs`). `scan-horizon2.mjs` finds the failing sets equal, 216 with the swap and 216 without,
     none in one alone.
   - The class is on `main` for couples entered elder first too. With the elder first at an age ending .5,
     `probe-elderfirst-frac.mjs` finds 432 of 2880 couples with the partner's plan a year short: 55.5 and 55.1 to 90 has a
     household of 35 years and a partner's plan of 34.
   - What the change adds: a couple it newly turns on (the elder second, holding over 60%) with such ages now meets the
     failure card where it had the couples card. Both send it to the classic planner.
   - Still, `coupleOrder.js`'s "the plan ends in the same year" holds in whole ages only. Couple-order check 2's fractional
     case cannot reach it, because its first age is whole.
   - The age inputs accept a fraction (the second round's finding 2 (c)), and the project tests fractional gaps.
   - The fix is of the class, in both places: write each horizon in whole plan years (the mirror's end age as
     `agePart0 + totalYears`, and the cut's likewise), with a check over fractional ages. It belongs with the next batch.

3. **MINOR. The swap of the limits per person is pinned by nothing.**
   - Couple-order's built couples are said to hold "a tier ceiling each". They are written as strings (l.57:
     `tierCeiling: 'Medium Risk', tierCeilingPart: 'Medium/High Risk'`). `normalizeSolverLocks` keeps only `{ pen, isa }`
     objects, so the built plans hold `tierCeiling: {pen: null, isa: null}` and no `tierCeilingPart`.
   - The library holds no ceiling (0 of 210), S007 holds no locks, and check 19 (e)'s hand swap refuses a fixture with locks.
   - With l.50 of `coupleOrder.js` removed (the plant 'nolocks'), couple-order passes 4 of 4 and couple-swap 4 of 4.
   - The code is right: with real `{ pen, isa }` ceilings the cut through the mirror is the elder-first cut to the bit
     (`probe-locks.mjs`).
   - To clear: write the built couples' ceilings as the page writes them (`SolverConfig.jsx` l.191) and plant the swap's
     removal.

4. **MINOR. Three answers put back are not pinned.** Each was removed from a copy of `coupleOrder.js`, and couple-swap
   passed 4 of 4 every time:
   - **The next ten years' moves.** Without `backParts` in `backAhead`, each person's moves in the next-ten-years table are
     shown under the other's name.
   - **The ledger's moves.** Without `backParts` in `backRows`' `parts`, the Details ledger's "you: ... · partner: ..." words
     are shown under the other's name.
   - **The failure age.** Without `backVerdict`, the history check names the failure at the elder's age: "Age ...",
     "Pension still locked at Age ..." and the "Ran dry after ... drawdown years" count (`App.jsx` l.9487-9502,
     l.12468-12470).
   - Why no check fails:
     - Couple-swap check 4 checks the next years' ages, not their parts. It checks the rows' tier from `parts.part`, not the
       parts it hands back.
     - It checks the failure age only when the light S007 run fails on the expected path, which it does not.
     - The harness compares the next years' `[age, spend]` alone and does not open Details for the younger-first couple.
   - The code is right by reading. Couple-swap's header claims all three are tested ("each person's meta, actions and parts
     under their own name ... the failure age the entered first person's"); they are not.
   - To clear: one check on each, and a fixture that fails on its expected path for the failure age, each with its plant.

The fast tier, `node research/tests/run-all.mjs fast` on 8099d75b: "74 files found, 74 run, 74 passed" (69 minutes). It holds with the findings above, none of which it reaches.
