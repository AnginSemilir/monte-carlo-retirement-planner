# Registration: the guard's own units, every couple on the solver (D139; COUPLES-OPEN.md step 2)

DRAFT (22 Nov). Its dress rehearsal (EXPLORATORY, seed 7002, `results-couples-open-rehearsal.txt`) passed every class by this
rule, on four couples step 8 used; its reviewer's FAIL (`reviews/2026-11-22-read-couples-open-rehearsal.md`) was answered by
`COUPLES-OPEN.md` amendment 1: each class on its own route, five units added to every couple, and the rehearsal's addendum on
them (`results-couples-open-addendum.txt`). Here the same rule runs on couples no run has used and a held-out seed. Read in two parts, each once
when its units are in, by `research/solver/reduce-couples-open.mjs --registered --part household|today` (with `REG=1`), after
its gate (The read, below). Launched only as
`MODE=registered PREDICTION=research/solver/registrations/couples-open.md research/solver/run-from-snapshot.sh bash research/solver/batch-couples-open.sh`,
from a git worktree at the launch commit, where every relaunch under `RESUME=1` and the read also run. After the pilot is
read, only Paths, Budget, The launch, What the pilot shows and Design review change; anything else goes back to the reviewer.

- **Question:** For couples today's guard keeps on the app's rules, does the app's own route for a couple, the guard alone bypassed, keep more couples solvent than the app's rules, delivering no less spending on the paths both keep, with no harm to any couple, in each class the guard names, on each of the app's two routes?
  - The guard (`src/couplesSwitch.js` `coupleSolverOn`) keeps a couple on the app's rules for three reasons:
    - `uneven`: the younger partner holding more than 60%, either holding more than 90%, or the two the same age and outside
      40% to 60%;
    - `gapincome`: more than three years apart with other taxable income;
    - `ages`: a partner who would pass 120 before the plan ends.
  - Each rested on today's two-table route, before the household plan became the couples' default (D136). `ages` is not
    tested here: a table runs to 120.
  - The app's route is the household plan where it takes the couple, and today's two-table route where the household plan
    refuses the plan's shape (`REFUSALS.md`), as `src/solverClient.js` falls back. Each class reads one route, and its pass
    lifts its reason on that route alone.
- **Arms:** APP `ef459a5c8ccb`, ROUTE `35ee3a2dc6ad` (`audit-couples-open.mjs` `configOf`)
  - **APP:** arm A, the app's withdrawal-policy search on the couple's plan, without the tournament (D36).
  - **ROUTE:** the app's own route for the couple, solved and assembled as the page does it, with the guard alone bypassed:
    - the household's cut (`src/solverCouple.js` `householdCut` at 'pensionsPA');
    - its one table solved by `solveForApp` at the app's 45 points inside the cut's bands (`src/solver/household.js`
      `bandsAt`);
    - its assembly at the even split (`householdSolved`);
    - or, where `householdPlanFor` refuses the plan's shape, `couplePlans` at the couples' share rule, each person's table
      solved with the partner's age, and `assembleCouple` with the couples' joint move (`APP_COUPLE`, `appJoint`).
    - The plan handed to it is the household line's (`shapes-panel.mjs` `solverPlanOf`: arm A's policy). Its paths run on
      the page's own context for the solved couple (`src/solverStrategy.js` `solvedContext`: the solved plan's own MPAA
      ages), its configuration naming it (`ctx`); each arm's MPAA ages are recorded.
- **Households:** the panel `couples-open-registered-panel.json` (`results-couples-open-registered-panel.txt`): four couples, sixteen units each, 64 units (40 on the household route, 24 on today's), every one kept off by today's guard for its class's reason and on its class's route
  - **Couples:** the library's order (D4's) with every couple a run has touched left out (`held-out.mjs` `touchedAll` from
    the main tree on 22 Nov, with the couples the tests take by place, the household line's bases and step 8's couples:
    337 ids, `couples-open-orders.json`); four taken evenly: S037, S119, S199 and S279. The younger cohort has no couple
    left untouched (all 26 used), so it rests on the dress rehearsal (S351F and S357F there), by inference.
  - **Units** (`couples-open-panel.mjs`), each landed so arm A survives `85 +/- 1%` on 1,000 paths of seed 7005 (D4's
    procedure), the first person the elder in every one. On the household route:
    - Y (Y75, Y90, Y100): the younger partner holding 75%, 90%, 100% of every wrapper;
    - E (E95, E100): the elder holding 95%, 100%;
    - S (S75): the two the same age, the first person holding 75%;
    - G (G8, G12, G8Y75, G12P): 8 and 12 years apart with the elder's `£15,000` a year DB pension from the state pension
      age, the library's own holding; 8 years apart with it, the younger holding 75%; 12 years apart with the partner's
      (the younger's) DB pension instead, the library's own holding.
  - On today's route, each a shape the household plan refuses:
    - RY (RY75, RWY75): the younger holding 75%, with the partner's pension one risk profile safer (RY75), or with the
      first person retired today and the partner still paid in the plan's first year (RWY75);
    - RE (RE100): E100 with the partner's pension one profile safer;
    - RS (RS75): S75 with the partner's pension one profile safer;
    - RG (RG8, RG12P): G8 and G12P with the partner's pension one profile safer.
- **Seed:** 7026, to be reserved in `check-prediction.mjs` for `couples-open*.md` by the maintainer's unlock (asked by name, `DECISIONS-PENDING.md`); the batch names it on a line the launcher's seed check reads; the pilot runs on 7002.
- **Paths:** after the pilot: one N for every unit, D34's size at the pilot's discordance, its upper 95% bound, at most D61's 19,000 (`size-couples-open.mjs`, `couples-open-paths.json`).
- **Primary metric:** survival scored by the engine (`audit-phase4.mjs runPath`, held to `E.runTrial` on the first 200 paths of every arm), paired on the same paths of the held-out seed across the arms.
  - Beside it: spending delivered, the pot left (and capped at the route's estate caps) and lifetime tax.
- **Decision rule:** ROUTE against APP, for each class (Y, E, S and G on the household route; RY, RE, RS and RG on today's) on its own units; a class OPENS if all three hold, as the dress rehearsal's rule
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
- **Outcomes:** each class that OPENS lifts its part of the guard on its own route by a change of default; each that STAYS keeps the app's rules for its reason on its route and goes to the maintainer; a flagged unit holds its class
  - The change of default reads the household plan's refusal (its shape checks, `householdPlanFor`'s) in the guard, so each
    reason lifts on the route its class read and on no other. The guard has no imports, so the page's first load can ask
    it without the solver (`src/couplesSwitch.js`): the shape checks are written there again and held equal to
    `householdPlanFor`'s refusals by a test over the library's couples and the panel's shapes, each check with its plant.
  - **Y opens:** a couple the household plan takes, whose younger partner holds more than 60%, runs the solver whatever the
    split. **RY opens:** the same for a couple whose shape it refuses.
  - **E opens:** for a couple the household plan takes, the elder's ceiling `ELDER_UP_TO` lifts from 90% to all of it.
    **RE opens:** the same for a couple whose shape it refuses.
  - **S opens:** two people the same age, whose plan the household plan takes, run the solver whatever the split. **RS
    opens:** the same for a couple whose shape it refuses.
  - **G opens:** for a couple the household plan takes, an age gap with other taxable income no longer keeps it off
    (`DB_GAP_UP_TO`). **RG opens:** the same for a couple whose shape it refuses.
  - **The change of default**, for the classes that open, in the commit of the D-line naming this run, with the reviewer on
    it:
    - `src/couplesSwitch.js` and the couples card's and the coverage line's words;
    - the decided-defaults block and `couple-default.test.mjs` (protected: the maintainer's unlock, asked by name);
    - the app's route held to the tested arm path for path;
    - to `main` on B1's gate.
  - **What a pass reaches beyond the panel** is by inference, said in the D-line:
    - splits between those tested;
    - gaps other than 8 and 12 years, and incomes other than a DB pension of the elder's;
    - the younger cohort (the dress rehearsal and its addendum alone);
    - on today's route, the shapes the household plan refuses beyond the two read here (a cash ISA subscription,
      contributions or salaries growing at different rates, the partner's own limits);
    - the 'lower' estate aim, consent to change risk withdrawn, the dial's other positions and the speed mode.
  - **Reported, deciding nothing:** each unit's two survivals; spending on the paths both keep and over all paths, with its
    interval, the units below APP over all paths beyond noise named; the pot capped and in pounds; lifetime tax in percent
    and in pounds a path; the route; each arm's MPAA ages; the solve and path times.
  - **The code** (`COUPLES-OPEN.md` amendment 1, MINOR 6): the registered test runs on the code its panel was landed on
    (36e4d2a860b2), before `COUPLES-OPEN.md` step 4. Step 4 lands after this read as its own change of default with the
    reviewer: a shape it moves from today's route onto the household's takes the household route's outcomes for its reason
    by inference, said in its D-line.
- **The read:** in two parts, each read once by the decision rule when its units are in. The batch runs the household
  route's 40 units first, then today's 24 (`audit-couples-open.mjs` `unitsOf`).
  - **Part 1, the household route:** classes Y, E, S and G (`--part household`).
  - **Part 2, today's route:** classes RY, RE, RS and RG (`--part today`).
  - A part's read opens no record and no launch log of the other's (`reduce-couples-open.mjs` `partOf`, with its planted
    check). Each class has its own rule, so reading one part first changes nothing in the other's.
  - Each part's outcome goes to its own change of default, on its own route. So the household route's classes, the most
    couples, can open while today's route's units still run.
- **The gate:** first the launch logs' stamps against the registration's git blob (`fair-gate.mjs requireFairLogs`), then `reduce-couples-open.mjs gate` (`--planted`: each refusal on its planted fault)
  - every unit of the panel with both arms, and each unit's own launch log, naming it, with its done line;
  - one code, audit, seed and Node version;
  - every unit at the registered paths, the app's 45 points and estate weight 0.02, every array one a path;
  - each unit off by the guard for its class's reason and on the panel's route, its class's route;
  - each arm at its configuration, ROUTE on the page's own context.
  - A part of a unit's run saved before a restart is taken up again only under the same stamp and the same tables.
- **What the pilot shows:** after the pilot (every unit, 1,000 paths of seed 7002, EXPLORATORY; `results-couples-open-sizing.txt`), beside the dress rehearsal and its addendum.
- **Budget:** after the pilot (`results-couples-open-sizing.txt`).
- **The launch:** after the design review and the maintainer's unlock of seed 7026; the stamp filled by hand at the launch commit.
- **Design review:** to come (the `reviewer` agent, before launch).
