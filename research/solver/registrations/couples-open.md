# Registration: the guard's own units, every couple on the solver (D139; COUPLES-OPEN.md step 2)

DRAFT (22 Nov). Its dress rehearsal (EXPLORATORY, seed 7002, `results-couples-open-rehearsal.txt`) passed every class by this
rule, on four couples step 8 used; its reviewer's FAIL (`reviews/2026-11-22-read-couples-open-rehearsal.md`) was answered by
`COUPLES-OPEN.md` amendment 1 (each class on its own route, five units added to every couple) and the rehearsal's addendum on
them (`results-couples-open-addendum.txt`), and its second look's FAIL, standing after that fix
(`reviews/2026-11-22-read-couples-open-rehearsal-2.md`: today's two-table route measured below the app's rules on six couples
that no unit reads), by the maintainer's ruling D141 (`COUPLES-OPEN.md` amendment 2): this test reads the household route's
classes alone. Its design review's FAIL (`reviews/2026-11-22-couples-open-design.md`) was answered in one fix (D81 (F)): G12R
added, the paths uncapped, the pilot run again on the final files, and the findings below. Here the rule runs on couples no
run has used and a held-out seed. Read once, by
`research/solver/reduce-couples-open.mjs --registered` (with `REG=1`), after its gate. Launched only as
`MODE=registered PREDICTION=research/solver/registrations/couples-open.md research/solver/run-from-snapshot.sh bash research/solver/batch-couples-open.sh`,
from a git worktree at the launch commit, where every relaunch under `RESUME=1` and the read also run. After the pilot is
read, only Paths, Budget, The launch, What the pilot shows and Design review change; anything else goes back to the reviewer.

- **Question:** For couples today's guard keeps on the app's rules and whose plan the household plan takes, does the app's own route for a couple (the household plan), the guard alone bypassed, keep more couples solvent than the app's rules, delivering no less spending on the paths both keep, with no harm to any couple, in each class the guard names?
  - The guard (`src/couplesSwitch.js` `coupleSolverOn`) keeps a couple on the app's rules for three reasons:
    - `uneven`: the younger partner holding more than 60%, either holding more than 90%, or the two the same age and outside
      40% to 60%;
    - `gapincome`: more than three years apart with other taxable income;
    - `ages`: a partner who would pass 120 before the plan ends.
  - Each rested on today's two-table route, before the household plan became the couples' default (D136). `ages` is not
    tested here: a table runs to 120.
  - The app's route is the household plan where it takes the couple, and today's two-table route where the household plan
    refuses the plan's shape (`REFUSALS.md`), as `src/solverClient.js` falls back. This test reads the household route alone
    (D141): today's route was measured below the app's rules on six couples of the guard's reasons
    (`results-household-arm.txt`, `results-guard.txt`), so a couple whose shape the household plan refuses keeps today's guard
    whatever this test reads.
- **Arms:** APP `ef459a5c8ccb`, ROUTE `35ee3a2dc6ad` (`audit-couples-open.mjs` `configOf`)
  - **APP:** arm A, the app's withdrawal-policy search on the couple's plan, without the tournament (D36).
  - **ROUTE:** the app's own route for the couple, solved and assembled as the page does it, with the guard alone bypassed:
    - the household's cut (`src/solverCouple.js` `householdCut` at 'pensionsPA');
    - its one table solved by `solveForApp` at the app's 45 points inside the cut's bands (`src/solver/household.js`
      `bandsAt`);
    - its assembly at the even split (`householdSolved`);
    - or, where `householdPlanFor` refuses the plan's shape, today's route, as the page falls back; no unit of this test
      takes it (each unit's route is checked before any solve and by the gate).
    - The plan handed to it is the household line's (`shapes-panel.mjs` `solverPlanOf`: arm A's policy). Its paths run on
      the page's own context for the solved couple (`src/solverStrategy.js` `solvedContext`: the solved plan's own MPAA
      ages), its configuration naming it (`ctx`); each arm's MPAA ages are recorded.
- **Households:** the household route's 44 units of the panel `couples-open-registered-panel.json` (`results-couples-open-registered-panel.txt`; `audit-couples-open.mjs` `unitsOf` 'registered'): four couples, eleven units each, every one kept off by today's guard for its class's reason and taken by the household plan; the panel's 24 units on today's route are landed and not run (D141)
  - **Couples:** the library's order (D4's) with every couple a run has touched left out (`held-out.mjs` `touchedAll` from
    the main tree on 22 Nov, with the couples the tests take by place, the household line's bases and step 8's couples:
    337 ids, `couples-open-orders.json`); four taken evenly: S037, S119, S199 and S279. The younger cohort has no couple
    left untouched (all 26 used), so it rests on the dress rehearsal (S351F and S357F there), by inference.
  - **Units** (`couples-open-panel.mjs`), each landed so arm A survives `85 +/- 1%` on 1,000 paths of seed 7005 (D4's
    procedure), the first person the elder in every one. On the household route:
    - Y (Y75, Y90, Y100): the younger partner holding 75%, 90%, 100% of every wrapper;
    - E (E95, E100): the elder holding 95%, 100%;
    - S (S75): the two the same age, the first person holding 75%;
    - G (G8, G12, G8Y75, G12P, G12R): 8 and 12 years apart with the elder's `£15,000` a year DB pension from the state
      pension age, the library's own holding; 8 years apart with it, the younger holding 75%; 12 years apart with the
      partner's (the younger's) DB pension instead; 12 years apart with the first person's `£15,000` a year of rent from
      plan year 0 to the plan's end instead (G12R, added on the design review's BLOCKING 1: an income starting before the
      state pension age, the case the guard test measured on today's route, `results-guard.txt`).
- **Seed:** 7026, reserved in `check-prediction.mjs` for `couples-open*.md` under the maintainer's unlock (D140); the batch names it on a line the launcher's seed check reads; the pilot runs on 7002.
- **Paths:** 25,000 for every unit (`couples-open-paths.json`, `results-couples-open-sizing.txt`): D34's size at each unit's pilot discordance, its upper 95% bound, from 17,000 to 25,000, the largest taken, uncapped (the design review's MINOR 2: D61's 19,000 was ruled for D4 and applied to stage C by D96 (2), not to this test). At 25,000 a true 1-point loss reads as harm at least 90% of the time up to a discordance of `16.30%`, and no unit's upper bound is past it.
- **Primary metric:** survival scored by the engine (`audit-phase4.mjs runPath`, held to `E.runTrial` on the first 200 paths of every arm), paired on the same paths of the held-out seed across the arms.
  - Beside it: spending delivered, the pot left (and capped at the route's estate caps) and lifetime tax.
- **Decision rule:** ROUTE against APP, for each class (Y, E, S and G, each on the household route) on its own units; a class OPENS if all three hold, as the dress rehearsal's rule
  1. **no harm:** no unit of the class flagged by D34's harm rule (`reduce-couples.mjs harmOf`: the loss in survival, paths
     APP keeps and ROUTE loses less those ROUTE saves, above the threshold its realised discordance sets), compared in
     whole paths (`reduce-share-rules.mjs harmExact`);
  2. **a gain:** the class's pooled survival change has its 95% interval's lower end above 0, the interval by path
     (`reduce-phase4.mjs survivalItem`: every unit runs the same paths);
  3. **spending:** the class's pooled spending delivered on the paths both keep, each unit's change in percent of APP's mean
     on those paths and the units weighted equally (`reduce-household-hsp.mjs keptSpend`), its point estimate not lower
     than -0.05%.
  - **The pot (D116, M1):** where ROUTE keeps more paths and delivers no less spending, a smaller pot left is not a harm. It
    is recorded, capped and in pounds a path, and is not a bar. A unit where ROUTE keeps more paths but spends less on the
    paths both keep, beyond noise, is named (`m1ByUnit`). It is not a bar, but under an OPENS each unit named goes to the
    maintainer with the read before the default changes.
- **Outcomes:** each class that OPENS lifts its part of the guard for couples the household plan takes, by a change of default; each that STAYS keeps the app's rules for its reason and goes to the maintainer; a flagged unit holds its class
  - A couple whose plan's shape the household plan refuses keeps today's guard in every outcome: inside it, today's route
    as now; outside it, the app's rules, until the household plan takes its shape (`COUPLES-OPEN.md` step 4).
  - So the change of default reads the household plan's refusal in the guard before it lifts a reason. The guard has no
    imports, so the page's first load can ask it without the solver (`src/couplesSwitch.js`): the shape checks are written
    there again, erring towards the app's rules, and held by a test over the library's couples and planted shapes, on the plan
    the page hands the solver (its mirror where the elder is entered second, whose limits are swapped): no refusal missed,
    each check with its plant. The client fails closed beside it (the design review's MINOR 6): a couple the household plan
    refuses that today's guard keeps off is not solved on today's route but keeps the app's rules.
  - **Y opens:** a couple whose younger partner holds more than 60% runs the solver whatever the split.
  - **E opens:** the elder's ceiling `ELDER_UP_TO` lifts from 90% to all of it.
  - **S opens:** two people the same age run the solver whatever the split.
  - **G opens:** an age gap with other taxable income no longer keeps a couple off (`DB_GAP_UP_TO`).
  - **The change of default**, for the classes that open, in the commit of the D-line naming this run, with the reviewer on
    it:
    - `src/couplesSwitch.js` and the couples card's and the coverage line's words;
    - the decided-defaults block and `couple-default.test.mjs` (protected: the maintainer's unlock, asked by name);
    - the app's route held to the tested arm path for path;
    - to `main` on B1's gate.
  - **What a pass reaches beyond the panel** is by inference, said in the D-line:
    - splits between those tested, and the same age at holdings other than 75% (S reads 75/25 alone);
    - gaps other than 8 and 12 years; incomes other than those read (the elder's DB pension from the state pension age, the
      partner's, and the first person's rent from now); G with the elder holding more than 60% (G8Y75 reads the younger
      holding 75%); Y at an age gap over three years without other income;
    - a couple entered younger first (its mirror; every unit has the elder first);
    - a couple with no minimum pot set (every unit sets one);
    - other taxable income paid while the household cannot yet draw a pension (before the access age of 58): G12R's rent
      runs before the state pension age but after pension access on every registered couple, so the guard test's harmed
      shape (S149's rent from 56, on today's route) is read in two halves by different runs, by inference (the design
      review's second look, MINOR 1);
    - a couple retiring before the pension access age of 58 (no registered couple does; 30 of the 83 held-out couples do):
      the dress rehearsal's younger cohort (S351F and S357F, retiring at 52) read it, EXPLORATORY;
    - the younger cohort (the dress rehearsal and its addendum alone);
    - a shape `COUPLES-OPEN.md` step 4 later moves onto the household route, which takes these outcomes by inference;
    - the 'lower' estate aim, consent to change risk withdrawn, the dial's other positions and the speed mode.
  - **Reported, deciding nothing:** each unit's two survivals; spending on the paths both keep and over all paths, with its
    interval, the units below APP over all paths beyond noise named; the pot capped and in pounds; lifetime tax in percent
    and in pounds a path; the route; each arm's MPAA ages; the solve and path times.
  - **The code** (`COUPLES-OPEN.md` amendment 1, MINOR 6): the registered test runs on the code its panel was landed on
    (36e4d2a860b2), before `COUPLES-OPEN.md` step 4. Step 4 lands after this read as its own change of default with the
    reviewer: a shape it moves from today's route onto the household's takes the household route's outcomes for its reason
    by inference, said in its D-line.
- **The gate:** first the launch logs' stamps against the registration's git blob (`fair-gate.mjs requireFairLogs`), then `reduce-couples-open.mjs gate` (`--planted`: each refusal on its planted fault)
  - every unit of the panel with both arms, and each unit's own launch log, naming it, with its done line;
  - one code, audit, seed and Node version;
  - every unit at the registered paths, the app's 45 points and estate weight 0.02, every array one a path;
  - each unit off by the guard for its class's reason and on the panel's route, its class's route;
  - each arm at its configuration, ROUTE on the page's own context.
  - A part of a unit's run saved before a restart is taken up again only under the same stamp and the same tables.
- **What the pilot shows** (`results-couples-open-sizing.txt`; the 44 registered units, 1,000 paths of seed 7002, run 22 Nov 19:02 to 19:29 UK on the final files, EXPLORATORY):
  - ROUTE against APP from `+8.90` to `+13.80` points on every unit; by class the mean Y `+10.94`, E `+11.11`, S `+10.53`, G
    `+11.27`. D34's chance of flagging a unit at 25,000 paths with no true change is at most `0.004`; at the pilot's gains it
    is nought.
  - M1, by the read's own rule, names 8 of S037's 11 units (S037 retired, 68/65): spending on the paths both keep from
    `-0.4751%` to `-2.5403%` with far more paths kept. So the registered read most likely goes to the maintainer first,
    with the units it names, before any change of default.
  - G12R on S037, whose first person is at the state pension age now, is the same plan as G12 (its rent from now and the DB
    pension from the state pension age the same `£15,000` a year from 68; one target, one pilot result), so the income
    before the state pension age is read on the other three couples' G12R.
  - Beside it, the dress rehearsal (every class passing, `results-couples-open-rehearsal.txt`) and its addendum
    (`results-couples-open-addendum.txt`).
- **Budget:** `14.8` core-hours over the 44 units and the longest once more for a relaunch; about `3.9` hours on four cores in the batch's order (`results-couples-open-sizing.txt`, measured from the pilot on this machine, D21).
- **The launch:** the agent launches once the design review passes (D140 (3)), seed 7026 reserved (D140 (1)), on the stamp the design review passed: `code 36e4d2a860b2 audit f9b56fb0b6a1`, the 44 units at 25,000 paths (`MODE=registered TODO_ONLY=1 PREDICTION_FILE=research/solver/registrations/couples-open.md bash research/solver/batch-couples-open.sh` prints it). A launch on any other stamp comes back to the reviewer first (the design review's second look, MINOR 2).
- **Design review:** PASS on its second look (`research/solver/reviews/2026-11-22-couples-open-design-2.md`, three MINORs answered in this file), after the first's FAIL answered in one fix (`research/solver/reviews/2026-11-22-couples-open-design.md`; `COUPLES-OPEN.md` amendment 3).
