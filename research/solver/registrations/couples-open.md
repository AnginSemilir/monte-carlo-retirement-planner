# Registration: the guard's own units, every couple on the solver (D139; COUPLES-OPEN.md step 2)

DRAFT (22 Nov). Its dress rehearsal (EXPLORATORY, seed 7002, `results-couples-open-rehearsal.txt`) passed every class by this
rule, on four couples step 8 used. Here the same rule runs on couples no run has used and a held-out seed. Read once, by
`research/solver/reduce-couples-open.mjs --registered` (with `REG=1`), after its gate. Launched only as
`MODE=registered PREDICTION=research/solver/registrations/couples-open.md research/solver/run-from-snapshot.sh bash research/solver/batch-couples-open.sh`,
from a git worktree at the launch commit, where every relaunch under `RESUME=1` and the read also run. After the pilot is
read, only Paths, Budget, The launch, What the pilot shows and Design review change; anything else goes back to the reviewer.

- **Question:** For couples today's guard keeps on the app's rules, does the app's own route for a couple, the guard alone bypassed, keep more couples solvent than the app's rules, delivering no less spending on the paths both keep, with no harm to any couple, in each class the guard names?
  - The guard (`src/couplesSwitch.js` `coupleSolverOn`) keeps a couple on the app's rules for three reasons:
    - `uneven`: the younger partner holding more than 60%, either holding more than 90%, or the two the same age and outside
      40% to 60%;
    - `gapincome`: more than three years apart with other taxable income;
    - `ages`: a partner who would pass 120 before the plan ends.
  - Each rested on today's two-table route, before the household plan became the couples' default (D136). `ages` is not
    tested here: a table runs to 120.
  - The app's route is the household plan where it takes the couple, and today's two-table route where the household plan
    refuses the plan's shape (`REFUSALS.md`), as `src/solverClient.js` falls back.
- **Arms:** APP `ef459a5c8ccb`, ROUTE `9ae677b16e77` (`audit-couples-open.mjs` `configOf`)
  - **APP:** arm A, the app's withdrawal-policy search on the couple's plan, without the tournament (D36).
  - **ROUTE:** the app's own route for the couple, solved and assembled as the page does it, with the guard alone bypassed:
    - the household's cut (`src/solverCouple.js` `householdCut` at 'pensionsPA');
    - its one table solved by `solveForApp` at the app's 45 points inside the cut's bands (`src/solver/household.js`
      `bandsAt`);
    - its assembly at the even split (`householdSolved`);
    - or, where `householdPlanFor` refuses the plan's shape, `couplePlans` at the couples' share rule, each person's table
      solved with the partner's age, and `assembleCouple` with the couples' joint move (`APP_COUPLE`, `appJoint`).
    - The plan handed to it is the household line's (`shapes-panel.mjs` `solverPlanOf`: arm A's policy), its MPAA ages
      arm A's, as step 8's arms ran.
- **Households:** the panel `couples-open-registered-panel.json` (`results-couples-open-registered-panel.txt`): four couples, eleven units each, 44 units, every one kept off by today's guard for its class's reason
  - **Couples:** the library's order (D4's) with every couple a run has touched left out (`held-out.mjs` `touchedAll` from
    the main tree on 22 Nov, with the couples the tests take by place, the household line's bases and step 8's couples:
    337 ids, `couples-open-orders.json`); four taken evenly: S037, S119, S199 and S279. The younger cohort has no couple
    left untouched (all 26 used), so it rests on the dress rehearsal (S351F and S357F there), by inference.
  - **Units** (`couples-open-panel.mjs`), each landed so arm A survives `85 +/- 1%` on 1,000 paths of seed 7005 (D4's
    procedure), the first person the elder in every one:
    - Y75, Y90, Y100: the younger partner holding 75%, 90%, 100% of every wrapper;
    - E95, E100: the elder holding 95%, 100%;
    - S75: the two the same age, the first person holding 75%;
    - G8, G12: 8 and 12 years apart with the elder's `£15,000` a year DB pension from the state pension age, the
      library's own holding;
    - G8Y75: 8 years apart with the DB pension, the younger holding 75%;
    - RY75: the partner's pension one risk profile safer, the younger holding 75%, which the household plan refuses (today's
      route);
    - RWY75: the first person retired today and the partner still paid in the plan's first year, the younger holding 75%,
      which the household plan refuses (today's route).
- **Seed:** 7026, to be reserved in `check-prediction.mjs` for `couples-open*.md` by the maintainer's unlock (asked by name, `DECISIONS-PENDING.md`); the batch names it on a line the launcher's seed check reads; the pilot runs on 7002.
- **Paths:** after the pilot: one N for every unit, D34's size at the pilot's discordance, its upper 95% bound, at most D61's 19,000 (`size-couples-open.mjs`, `couples-open-paths.json`).
- **Primary metric:** survival scored by the engine (`audit-phase4.mjs runPath`, held to `E.runTrial` on the first 200 paths of every arm), paired on the same paths of the held-out seed across the arms.
  - Beside it: spending delivered, the pot left (and capped at the route's estate caps) and lifetime tax.
- **Decision rule:** ROUTE against APP, for each class (Y, E, S, G, R) on its own units; a class OPENS if all three hold, as the dress rehearsal's rule
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
- **Outcomes:** each class that OPENS lifts its part of the guard by a change of default; each that STAYS keeps the app's rules and goes to the maintainer; a flagged unit holds its class
  - **Y opens:** a couple whose younger partner holds more than 60% runs the solver, whatever the split.
  - **E opens:** the elder's ceiling `ELDER_UP_TO` lifts from 90% to all of it.
  - **S opens:** two people the same age run the solver whatever the split.
  - **G opens:** `DB_GAP_UP_TO` lifts: an age gap with other taxable income no longer keeps a couple off.
  - **R opens:** a couple the household plan refuses by its shape runs on today's route outside today's band too. If R
    stays while Y, E or S opens, such a couple outside today's band keeps the app's rules: the change of default reads the
    household plan's refusal before it lifts the band.
  - **The change of default**, for the classes that open, in the commit of the D-line naming this run, with the reviewer on
    it:
    - `src/couplesSwitch.js` and the couples card's and the coverage line's words;
    - the decided-defaults block and `couple-default.test.mjs` (protected: the maintainer's unlock, asked by name);
    - the app's route held to the tested arm path for path;
    - to `main` on B1's gate.
  - **What a pass reaches beyond the panel** is by inference, said in the D-line:
    - splits between those tested;
    - gaps other than 8 and 12 years, and incomes other than a DB pension of the elder's;
    - the younger cohort (the dress rehearsal alone);
    - the shapes the household plan refuses beyond the two of class R;
    - the 'lower' estate aim, consent to change risk withdrawn, the dial's other positions and the speed mode.
  - **Reported, deciding nothing:** each unit's two survivals; spending on the paths both keep and over all paths; the pot
    capped and in pounds; lifetime tax; the route; the solve and path times.
- **The gate:** first the launch logs' stamps against the registration's git blob (`fair-gate.mjs requireFairLogs`), then `reduce-couples-open.mjs gate` (`--planted`: each refusal on its planted fault)
  - every unit of the panel with both arms, and each unit's own launch log, naming it, with its done line;
  - one code, audit, seed and Node version;
  - every unit at the registered paths, the app's 45 points and estate weight 0.02, every array one a path;
  - each unit off by the guard for its class's reason and on the panel's route;
  - each arm at its configuration.
  - A part of a unit's run saved before a restart is taken up again only under the same stamp and the same tables.
- **What the pilot shows:** after the pilot (every unit, 1,000 paths of seed 7002, EXPLORATORY; `results-couples-open-sizing.txt`).
- **Budget:** after the pilot (`results-couples-open-sizing.txt`).
- **The launch:** after the design review and the maintainer's unlock of seed 7026; the stamp filled by hand at the launch commit.
- **Design review:** to come (the `reviewer` agent, before launch).
