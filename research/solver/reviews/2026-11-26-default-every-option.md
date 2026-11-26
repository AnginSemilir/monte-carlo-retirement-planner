# Review of a change of default: every couple the new planner takes on the solver (D150, D151; D152 the record)

Subject: C and D's change of default, read as the working tree against 10f682be on claude/fervent-goodall-e2mrnf and
committed while I read as 92966015, byte for byte the tree I read (every code, test and harness blob below the same at
92966015; STATE.md, COUPLES-ANY.md and DECISIONS-PENDING.md as committed there, since moved only by D153's 005635a8). The
household plan takes 'noretire' (C, nobody retiring within the plan); the guard's age cap is off where a couple is solved on
its mirror (D, a partner past 120); the coverage line and the household sentence; the decided-defaults block; the tests and
three harnesses; the rollback's plants 'beforeall', 'cutbeforeall' and the words' 'beforeall'. Not reviewed: af3ec6ef (the
planner harness's record, read as evidence below) and D153 (005635a8, `run-all.mjs` under the maintainer's unlock).

## What I read

- **The rulings and the plan:** STATE.md 77ddd3e59004 (D150, D151, D152; the decided-defaults block; section 6, action 2);
  `git diff 98c331f5^ 10f682be` of STATE.md and COUPLES-ANY.md; COUPLES-ANY.md a3ae32e72f41 (amendments 2 and 3, the notes
  "Built off in code" and "Built (26 Nov)"); DECISIONS-PENDING.md 4514de2ee100 (D151's and D150's entries, the C entry as put,
  l.86-115).
- **The change:** `src/couplesSwitch.js` e18add8186d6 (`AGE_CAP` l.67, `HOUSEHOLD_TAKES` l.84, `takenShape` l.97,
  `householdShapeOf` l.195-232, `coupleSolverOn` l.233-270, `capped` l.260); `src/solverSettings.js` 13ce91d016af
  (`APP_COUPLE` l.141); `src/solverCouple.js` 7ff5cdda8bee (`cutRule`, `appTakes` l.40-43); `src/solverApproximations.js`
  d5d113b3f324 (l.48-127); `src/App.jsx` 503071f15217 (l.8793); `src/PlannerCards.jsx` 655b23296291.
- **What it rests on or reaches:** `src/solverClient.js` 587a8bda30d0 (l.243-276, the route and the fallback);
  `src/limitsCard.js` 55f25aea93e8; `src/SolverFigures.jsx` c766338b8222 (l.58-61, l.205-210); `src/PlannerStart.jsx`
  c22db4d1e95c (l.86-94); `src/coupleOrder.js` 3cbbb912a4c8 (`otherOrder`, the mark); `src/App.jsx` `buildContext`
  (l.1716-1739, spend bands l.2038-2045, incomes l.1849-1859, `estateForPlanAt` l.5643-5650); `src/solver/household.js`
  94aca9051d20 (`householdPlanFor` l.144-330); `src/solver/solve.js` `ageWeighted` (l.2868-2881); cdbaa4e4 (D's build);
  `.claude/hooks/pre-tool.mjs` (`PROTECTED`) and `research/tests/run-all.mjs` (`FAST_JOINING`).
- **The tests and harnesses:** `couple-default.test.mjs` c958c09ca166, `couple-shape.test.mjs` 1542493fe426,
  `couple-limits-card.test.mjs` 921382a9aa66, `couple-swap.test.mjs` a37915bfbe87, `couple-horizon.test.mjs` df56090ae020,
  `household-client.test.mjs` 2b0564af6ea9, `couple-past120.test.mjs` 936202e35a3d; `solver-planner-ui.cjs` 5a52d715e02c
  (check 19 (g), (b2), the gap couple, (h), the plant lists) and its 10f682be version (the removed `shapeCard`, l.846-858);
  `solver-config-ui.cjs` 9864c04e6758; `solver-strategy-ui.cjs` c0a5cfda1a57.
- **The records:** `results-couples-any.txt` be232e8c528b (class N, l.170-178); `results-couples-any-beside.txt`
  05aaa7023eb2 (l.14, l.23-30); `reports/2026-11-24-couples-any-rehearsal-read.md` ceb70f902aaa (l.93-106);
  `results-couple-default.txt` 42117d424bfb (D146's run of 24 Nov, not rewritten by this change); `results-couple-past120.txt`
  19cd77220434; `results-planner-ui-d152.txt` (af3ec6ef).

## What I ran

On this tree (the machine shared with the agent's planner harness and the pre-commit's fast tier):
- `node research/tests/couple-default.test.mjs`: ALL PASS, 9 checks (51 s). Check 2: "15120 plans, 15120 on ... 'shape' {},
  before D150 {"noretire":1260} ... the page's cut on 210 such couple-arrangements refusing 0". Check 6: "since D150 1443
  plans, 813 past 120 by the end (0 of them 'shape'), 1443 run (813 of them past 120; 721 on the household route, its cut
  refused on 0) ... the reviewer's two on, swapped and on, swapped; before it ... 540 run (0 of them past 120) ... ages and ages".
- `node research/tests/couple-default.test.mjs --planted`: all 26 exact, among them 'beforeall' 2, 6, 8; 'cutbeforeall' 2, 6,
  9; 'beforeallline' 4; 'notake', 'cutnotake', 'beforeany' and 'cutbeforeany' 2, 6, 9; 'noagecap' 6, 8; 'noshape' 2, 6, 9.
- `couple-shape.test.mjs`: ALL PASS, 4 checks (2 m 38 s): at the defaults "the page refuses 0 for their shape" on 4,830 plans
  each way round; under the rollback 210 and 210 refusals, none missed; check 3 each kind missed under its skip ("noretire
  (under 'beforeall') 42"); check 4's eight batteries as the plants want.
- `couple-limits-card.test.mjs`: ALL PASS, 6; `--planted` 7 exact ('beforeanycard' 1, 5; 'beforeany' 1, 3, 5, 6).
- `couple-swap.test.mjs`: 5 passed; `--planted` 6 exact ('capafter' 2). `couple-horizon.test.mjs`: 4 passed.
- `couple-past120.test.mjs`: 5 passed. `household-client.test.mjs`: ALL PASS, 9 (check 7 under 'cutbeforeall').
- Probes, in the session's scratchpad, not committed:
  - (a) the guard on hand-made couples (S001's plan re-held): at the defaults, 50 and 80 to 95 held 50/50, 80/20, 20/80 and
    5/95 each on and swapped (no route, Y, no route, E); nobody retiring at 60/40 on with no route, at 25/75 on the household
    route (Y). Under 'swapoff' the four past-120 couples each `{"on":false,"why":"ages"}`; under 'beforeall' the same, and
    nobody retiring at 25/75 `{"why":"shape","shape":"noretire"}`. Both people aged 120, or 119.6 and 119.5, are 'ages' at the
    defaults too (the engine forces the end to the first person's age plus one; degenerate, not material).
  - (b) the household cut the page makes, on the mirror, for 540 past-120 couples inside the guard (60 library couples, the
    elder holding 50%, 60% and 70%, at 50 and 80 to 95, 45 and 75 to 100, 60 and 95 to 90): none short of the plan's years,
    none refused; with `src/coupleOrder.js`'s plant 'nomark', all 540 short (40 years against 45, and so on).
  - (c) the guard's over-reach (refused by the guard, taken by the cut) on 1,050 plans (the library's couples as entered and
    swapped, and with nobody retiring to 100 and to 119): at the defaults 0 (the cut refuses 0); under 'beforeall' with
    'cutbeforeall' 0 (the cut refuses 630, none missed).
- Not run: the three browser harnesses and their plants (their ports in use; the caller asked me not to). The planner harness
  unplanted on this code is recorded in `results-planner-ui-d152.txt`: every check ok, (g) on the fallback's preview, the two
  nobody-retiring couples on the household route and (h) on its mirror among them.

Verdict: PASS

No finding is BLOCKING. The code does what D150 says and no more; the block, the code and check 1 agree; every plant I ran
fails exactly its checks; nothing reachable at the defaults is now tested only under a rollback plant. The findings below are
each MINOR.

## Findings

1. **MINOR. `couple-shape.test.mjs` check 2 can no longer fail.** It counts an over-reach only where the guard refuses and
   the page's cut takes (l.100) and asserts `B.asEntered === 0 && BM.asEntered === 0` (l.121), both batteries at the
   defaults, where `householdShapeOf` refuses nothing (`HOUSEHOLD_TAKES` all seven, `takenShape`, couplesSwitch.js l.84,
   l.97). My run: "the guard reads refused where the page takes the plan: none; entered the other way none; of them as
   entered 0 and 0". Check 1 moved its reading to the rollback batteries `BR` and `BRM`; check 2 did not, though they compute
   `over` and `asEntered` already. Probe (c) gives 0 over-reach under the rollback, so asserting
   `BR.asEntered === 0 && BRM.asEntered === 0` (and printing `BR.over`) passes today and keeps the guard's year-short reading
   of nobody retiring held to the cut for the rollback.
2. **MINOR. The 'shape' card's words lost their only check, and the cards left unreachable are not said.** Before this change
   check 19 read the 'shape' card's reason, its refusal and its words (`shapeCard` at 10f682be, l.846-858: `/Neither of you
   retires within the plan\./`, `/cannot take a plan like that yet/`); both uses became `solvedHere`. No test or harness reads
   `SHAPE_WORDS` (`src/PlannerCards.jsx`) now. The config and strategy harnesses' previews, built with 'beforeall', show
   exactly that card for their couple, but read only that some couples card is present (`solver-config-ui.cjs` l.77,
   `solver-strategy-ui.cjs` l.97). At the defaults the 'shape' card is unreachable (no shape refused), and the 'ages' card is
   reached only with the swap off (and the degenerate ages of probe (a)); so are `SolverFigures.jsx`'s 'shape' and 'ages'
   words (l.210). D152 names the couples that leave the two cards, not that the cards are now the rollback's alone and
   unchecked. Asking `[data-planner-couple]` for 'shape', `data-couple-shape` for 'noretire' and the card's words in
   `solver-config-ui.cjs` check 3 restores the check; one clause in D152 says the rest.
3. **MINOR. The quick start still says some couples keep the app's rules.** `src/PlannerStart.jsx` l.88, shown with couples
   on: "The new planner works out most couples' plans for the two of you together, and says so where yours still follows the
   app's own rules." With the swap on, every couple the guard sees is on since D150 (check 2: 15,120 of 15,120; probe (a)), so
   "most" and the second clause now describe the rollback. The coverage line was changed; this sentence was not. The agent's
   draft and the maintainer's to change, as the other words.
4. **MINOR. With the swap off the age cap still applies, as the brief says, but no test holds it.** `capped = AGE_CAP ||
   planted('beforeall') || !swap` (couplesSwitch.js l.260). With the swap on, `!swap` acts only on couples not mirrored, all of
   which fit (but ages of 119 and over), so it is invisible at the defaults. Probe (a): under 'swapoff' each past-120 couple is
   'ages'. Nothing fails if `|| !swap` is dropped: `couple-swap.test.mjs` check 1's 'swapoff' digest covers the library's 210
   couples, all within the ceiling; `couple-default.test.mjs` derives `fits` with `SWAP_ELDER` true, and its 'beforeall' sweep
   reads the cap on every couple. Dropped, the swap's rollback would solve a past-120 couple inside the band in the order
   entered, younger first, which no household-route read ran (and its fallback, today's route, would cut the elder's table at
   120). One past-120 couple under 'swapoff', wanted 'ages', in couple-swap check 1 or 2 holds it.
5. **MINOR. `couple-default.test.mjs` check 6 holds today's route's cut, not the household cut, for couples inside the guard.**
   For a couple the guard runs with no route it cuts `couplePlans` (l.538), the fallback; at the defaults the page cuts such a
   couple at the household form (`src/solverClient.js` l.243-276), the fallback only on a shape refusal, which none meets
   (couple-shape: 0 of 4,830 each way). In check 6's own run that is 722 of the 1,443 it runs. The household cut on a past-120
   mirror is held for the 721 opened couples there and in `couple-past120.test.mjs` check 3, and probe (b) finds it whole on
   540 inside-guard past-120 couples, so this hides no defect; but the check's "as the page cuts it" is not what it checks for
   half its couples. Checking both cuts for a no-route couple closes it.
6. **MINOR. Beside C, the mean pot: D152's by-inference clause should carry it.** On the dress rehearsal's N units
   (`results-couples-any.txt` l.171-178, EXPLORATORY, seed 7002), with survival 100% in both arms and spending the same, ROUTE
   leaves a mean pot `-54.469%` and `-55.178%` on S227's two units and `-4.697%` and `-5.258%` on S273's (`+4.0%` to `+4.3%`
   on the younger cohort's), beside the capped pot `+0.216%` to `+2.475%` and lifetime tax `-15.3%` to `+204.7%`. The
   rehearsal's report gave the range (l.96); the C entry put to the maintainer for D150 (DECISIONS-PENDING.md l.93-110) gives
   the capped pot and the tax only; D152 says "By inference only: C" without it. D116 counts the pot up to the cap and does
   not bar a smaller one, so this does not stop the change; but its case is a route that keeps more paths, and on N both keep
   every path. Outside the guard these couples move from the app's rules to a route that on S227's units leaves about half
   their mean pot; inside it they move from today's route, which no run compared with either on N. One clause in D152.
7. **MINOR. D152 states browser outcomes not yet shown.** It says (g) runs on the fallback's preview "so 'couplehalf',
   'coupleage' and 'workernotie' still fail it", and that the config and strategy harnesses run on 'beforeall' builds; per
   the caller none of those plants, nor the two harnesses, has run on this code, and `results-planner-ui-d152.txt` records the
   planner harness unplanted only. They are B1's gate's to show (D92: each new check failed on its plant): the planner
   harness's plants 'beforeall', 'couplehalf', 'coupleage' and 'workernotie', each alone on its own build failing exactly
   check 19, and the config and strategy harnesses unplanted. Until then D152 should say so, and carry the record when run,
   as `results-planner-ui-d148-plants.txt` did for D148. (The Node figures it states hold: every plant I ran fails exactly
   its checks.)

## The brief's questions

1. **What D150 says and no more.** Yes. 'noretire' is taken by the cut and the guard alike (`APP_COUPLE.takeShapes`,
   `HOUSEHOLD_TAKES`; couple-shape check 4, every kind taken alike either way round). With the swap on, a partner can pass 120
   only as the elder entered second, so every such couple is mirrored and the cap is never read for it; the mirror keeps the
   plan's years (couple-default check 6 `ranPast === capped`; probe (b); the harness's (h)). Singles never reach the guard,
   the cut or the words' couple line; the classic planner never runs the solver (`solverOn` needs the new planner, App.jsx
   l.8798). With the swap off the cap holds (probe (a); finding 4). The one thing beyond C and D, inside-the-guard couples
   with nobody retiring leaving today's route for the household route, is amendment 3's E, written before the build and said
   in D152.
2. **The block.** `couples.takeShapes` the seven and `ageCap: false` equal the code; couple-default check 1 pins both, a
   block without `ageCap` or with it on failing it.
3. **The tests.** Each still tests its header but for findings 1 and 5; no check was loosened to pass. Reading the refused
   shape and the cap under the rollback's plants is sound: each plant is the code before D150 to the line (the guard's
   'beforeall' is HOUSEHOLD_TAKES without 'noretire' and the cap on every couple; 'cutbeforeall' the cut's takeShapes without
   it; the words' 'beforeall' D148's line, couple-default check 4), and what is read only under them (today's route, the
   'shape' answer, the client failing closed for a shape, the one-row card for a couple kept off) is reachable only on a
   rollback. What is tested nowhere now: the 'shape' card's words (finding 2) and check 2's over-reach (finding 1).
4. **The words.** Accurate at the defaults with the swap on ("It plans for one person or for a couple.", the sentence without
   "plans each of you separately"; every couple on); with the swap off, accurate as before (its "only if" omits the age cap,
   as every line before D150 did). Elsewhere: finding 3.
5. **Unreachable at the defaults.** Today's two-table route (said; the fallback kept under test on the rollback's cut, its
   three plants to be shown, finding 7); the 'shape' card and, with the swap on, the 'ages' card (not said, finding 2);
   'nogapguard' at the page (said: with every shape taken both routes give the same figures; couple-default checks 8 and 9
   still fail on it).
6. **By inference.** C (said; finding 6 for what sits beside it). D (said): the route is tested at light settings
   (couple-past120 check 3, the harness's (h)), no outcome. The engine running a partner past 120 in the plan as entered is
   what the app's rules did before D150; what is new is the solver's mirror past 120, whose flows are each person's plan year
   by plan year (couple-past120 check 2); I found no age-indexed lookup in `src/solver`, spend bands and incomes are not
   clamped, and the dial's age weights read the chance either person lives (`ageWith`). The engine's estate-at-death
   functions clamp the death age at 120 (App.jsx l.5647 and after) but serve the Inheritance tab, not the new planner's
   figures.
7. **Contradictions.** None material. Amendment 3's "the guard's age cap is lifted" is built as off where mirrored and on
   with the swap off, which D152 says; household-client check 9 needed no plant, as the built note says; D151's undone
   `run-all.mjs` edit is D153's since.
