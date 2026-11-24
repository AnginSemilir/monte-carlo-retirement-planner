# Registration: every couple on the solver, the rest of the way (D145 (3); COUPLES-ANY.md, the test)

DRAFT (24 Nov). Its dress rehearsal (EXPLORATORY, seed 7002, touched couples, `results-couples-any.txt`) passed W, R, L and P
by this rule, N reported and not read; its reviewer FAIL, one BLOCKING and three MINOR answered in one fix round, then PASS, two
MINOR answered (`reviews/2026-11-24-read-couples-any-rehearsal.md`, `-2.md`). Here the rule runs on couples no run has used and
a held-out seed. Read once, by `research/solver/reduce-couples-any.mjs --registered` (with `REG=1`), after its gate and after W's
identity on the run. Launched only as
`MODE=registered PREDICTION=research/solver/registrations/couples-any.md research/solver/run-from-snapshot.sh bash research/solver/batch-couples-any.sh`,
from a git worktree at the launch commit, where every relaunch under `RESUME=1`, W's identity and the read also run. After the
pilot is read, only Paths, Budget, The launch, What the pilot shows and Design review change; anything else goes back to the
reviewer.

- **Question:** For couples whose plan has a shape the household plan now takes in code, does the household route taking every such shape keep more couples solvent than the app's rules, delivering no less spending on the paths both keep, with no harm to any couple, in each class?
  - **W:** step 4's three shapes (contributions to one wrapper growing at different rates, a cash ISA paid into, a later
    retiree paid and saving in plan year 0), taken by the app by default since D146 by inference (`COUPLES-OPEN.md`
    amendment 1, MINOR 6), measured here.
  - **R:** one wrapper, the pension or the ISA, held by the two at different risks (A's 'risks').
  - **L:** the partner's own limits differing from the first person's (A's 'limits').
  - **P:** two salaries growing at different rates (B's 'salaries').
  - Today the household plan refuses R's, L's and P's shapes, so such a couple keeps today's two-table route inside the guard
    before D143 and the app's rules outside it (D141, D144).
  - **N**, nobody retiring within the plan (C's 'noretire'), is not registered: nothing is spent from the pots before the
    first retirement, so both arms survive every path and no rule reads it. Whether C opens by inference from its exactness,
    or not at all, is the maintainer's (`COUPLES-ANY.md` amendment 2).
- **Arms:** APP `ef459a5c8ccb`, ROUTE `0fea0d25d803` (`audit-couples-any.mjs` `configOf`)
  - **APP:** arm A, the app's withdrawal-policy search on the couple's plan, without the tournament (D36).
  - **ROUTE:** the household route taking every shape the household plan takes (`couples-any-panel.mjs` `TAKES`: 'growth',
    'cashisa', 'year0', 'risks', 'limits', 'salaries' and 'noretire'):
    - the page's own cut (`src/solverCouple.js` `householdCut` at 'pensionsPA', its shapes named);
    - its one table solved as the page solves it (`src/solverApp.js` `solveForApp` at the app's 45 points, the partner's age
      the cut's, inside the cut's bands, `src/solver/household.js` `bandsAt`);
    - its assembly as the page makes it (`householdSolved`: the even split, the top three, the couples' joint move's tie-break
      and hold, its shapes named);
    - its paths on the page's own context for the solved couple (`src/solverStrategy.js` `solvedContext`).
    - The plan handed to it is the one the household line's audits hand their solvers (`shapes-panel.mjs` `solverPlanOf`: arm
      A's policy), with the plan's own locks kept, as the page hands its solve (`couples-any-panel.mjs` `anySolverPlanOf`; L's
      units alone set any).
  - **W's identity:** before the read, the app's own route at the app's own shapes (the guard, the page's worker's cut, table
    and assembly, the page's context) held to ROUTE on every W unit of the run, its table digest and every key of every path
    (`couples-any-port-identity.mjs` with `REG=1`, its file naming the run's stamp), as on the rehearsal (`24 of 24 units
    IDENTICAL`, `results-couples-any-port-identity.txt`).
- **Households:** the 136 units of `couples-any-registered-panel.json` (`results-couples-any-registered-panel.txt`; `couples-any-panel.mjs` with `REG=1`): W, R, L and P on four couples no run has used, at two holdings each
  - **Couples:** the library's order (D4's) with every couple a run has touched left out (`held-out.mjs` `touchedAll` from the
    main tree on 24 Nov, with the couples the tests take by place, the household line's bases and step 8's couples: 343 ids,
    `couples-any-orders.json`; 77 library couples left); four taken evenly: S041, S123, S207 and S281.
    - S041 retired at 68 and 65; S123 retired at 56 and 53, before the pension access age; S207 working at 55 and 52; S281
      working at 45 and 42 (the library's plans).
    - The kinds where both work (Wg, Wc, P) run on the four where both still work. In a retired couple's place they run on the
      next couple in the order where both still work: S185 in S041's place, S197 in S123's (`couples-any-panel.mjs`
      `walkAny`: the rehearsal's S227 in S025's place, made a rule).
    - The younger cohort has no couple left untouched, so it rests on the dress rehearsal (S351F and S357F there), by
      inference.
  - **Units** (`couples-any-panel.mjs` `unitPlan`), each at the library's holding, 'own' (the elder holding 60%, inside the
    guard before D143), and at 'Y75' (the younger holding 75%); each landed so arm A survives `85 +/- 1%` on `1,000` paths of
    seed 7005 (D4's procedure); the first person the elder in every one:
    - W, 24 units: Wg, both working at least three more years, each paying `£3,000` a year into their ISA, the first person's
      growing at `3%` a year and the partner's flat; Wc, both working at least three more years, each paying `£2,000` a year
      into a cash ISA; W0, the first person retired today, the partner paid and saving in plan year 0;
    - R, 96 units: the pension or the ISA one, two and three profiles apart, each way (the first person's the safer, or the
      partner's), the other's account at the library's risk;
    - L, 8 units: the first person's pension ceiling Medium/High Risk, the partner's own Medium Risk;
    - P, 8 units: both paid and working at least five more years, their salaries growing at `2%` and `-1%` a year.
- **Seed:** 7027, reserved in `check-prediction.mjs` for `couples-any*.md` under the maintainer's unlock (D145); the batch names it on a line the launcher's seed check reads; the pilot runs on 7002.
- **Paths:** TO BE SET FROM THE PILOT (`couples-any-paths.json`, `results-couples-any-sizing.txt`): D34's size at each unit's pilot discordance, its upper 95% bound, the largest taken, uncapped (`size-couples-any.mjs`), as `registrations/couples-open.md` took its paths.
- **Primary metric:** survival scored by the engine (`audit-phase4.mjs runPath`, held to `E.runTrial` on the first 200 paths of every arm), paired on the same paths of the held-out seed across the arms.
  - Beside it: spending delivered, the pot left (and capped at the route's estate cap) and lifetime tax.
- **Decision rule:** ROUTE against APP, for each class (W, R, L and P) on its own units; a class PASSES if all three hold, the dress rehearsal's rule (D141's)
  1. **no harm:** no unit of the class flagged by D34's harm rule (`reduce-couples.mjs harmOf`: the paths APP keeps and ROUTE
     loses less those ROUTE saves, above the threshold its realised discordance sets), compared in whole paths
     (`reduce-share-rules.mjs harmExact`);
  2. **a gain:** the class's pooled survival change has its 95% interval's lower end above 0, the interval by path
     (`reduce-phase4.mjs survivalItem`: every unit runs the same paths);
  3. **spending:** the class's pooled spending delivered on the paths both keep, each unit's change in percent of APP's mean on
     those paths and the units weighted equally (`reduce-household-hsp.mjs keptSpend`), its point estimate not lower than
     -0.05%.
  - **W is read only with its identity** on the run, its file naming the run's stamp, every W unit IDENTICAL and the count
    whole (`reduce-couples-any.mjs identityOf`); without it W is NOT READ and goes to the maintainer.
  - **The pot (D116, M1):** where ROUTE keeps more paths and delivers no less spending, a smaller pot left is not a harm. It is
    recorded, capped and in pounds a path, and is not a bar. A unit where ROUTE keeps more paths but spends less on the paths
    both keep, beyond noise, is named (`m1ByUnit`). It is not a bar, but under a pass each unit named goes to the maintainer
    with the read before the default changes.
- **Outcomes:** each class that passes opens by its own change of default, W passing stays on by default (D146); each that fails keeps today's handling and goes to the maintainer with its units, W at once; a flagged unit holds its class
  - **R, L or P opens:** the household plan takes its shape in the app ('risks', 'limits', 'salaries': `src/solverSettings.js`
    `APP_COUPLE.takeShapes` and the guard's `HOUSEHOLD_TAKES`), so such a couple runs the household route, inside the guard
    before D143 and outside it where its class is open.
  - **The change of default**, for each class that opens, in the commit of the D-line naming this run, with the reviewer on it:
    - the shape taken in the app and the guard, and the coverage line's words;
    - the decided-defaults block, `couple-default.test.mjs` and `couple-shape.test.mjs` (protected: the maintainer's unlock,
      asked by name);
    - the app's route held to the tested arm path for path;
    - to `main` on B1's gate.
  - **W fails:** it comes back to the maintainer at once, being on by default since D146, with its units.
  - **E** (today's two-table route leaves the app's solve, `COUPLES-ANY.md` E) is its own change of default, once A to C's
    classes have read; this read decides nothing of it.
  - **What a pass reaches beyond the panel** is by inference, said in the D-line:
    - other contributions' growth than Wg's (`3%` and flat), other cash ISA payments than Wc's, a later retiree's other plans
      than W0's;
    - R: risks apart in both wrappers at once, or a wrapper apart more than three profiles;
    - L: limits other than L's, the ISA's, and limits with risks apart;
    - P: salary growths other than `2%` and `-1%`;
    - two of the shapes at once (each unit holds one);
    - a couple entered younger first (its mirror; every unit has the elder first), a couple with no minimum pot set;
    - the younger cohort (the dress rehearsal alone, EXPLORATORY);
    - the 'lower' estate aim, consent to change risk withdrawn, the dial's other positions and the speed mode;
    - N's class, C, which is the maintainer's.
  - **Reported, deciding nothing:** each unit's two survivals; spending on the paths both keep and over all paths, with its
    interval, the units below APP over all paths beyond noise named; the pot capped and in pounds; lifetime tax in percent and
    in pounds a path; each arm's MPAA ages; R by its parts; the solve and path times.
  - **The code:** the registered test runs on the code its panel was landed on (d91a642206b9, the rehearsal's).
- **The gate:** first the launch logs' stamps against the registration's git blob (`fair-gate.mjs requireFairLogs`), then `reduce-couples-any.mjs gate` (`--planted`: each refusal on its planted fault)
  - every unit of the panel with both arms, and each unit's own launch log, naming it, with its done line;
  - one code, audit, seed and Node version;
  - every unit at the registered paths, the app's 45 points and estate weight 0.02, every array one a path;
  - each record's class, variant, kind and holding the panel's, its shape as it ran as the panel requires
    (`couples-any-panel.mjs unitProblems`: taken with every shape, refused without its own for its shape's reason, and the
    app's guard keeping R, L and P off the household route and putting W on it);
  - each arm at its configuration, ROUTE on the page's own context.
  - A part of a unit's run saved before a restart is taken up again only under the same stamp and the same tables.
- **What the pilot shows:** TO BE SET FROM THE PILOT (`results-couples-any-sizing.txt`; the 136 registered units, 1,000 paths of seed 7002, EXPLORATORY).
- **Budget:** TO BE SET FROM THE PILOT (`results-couples-any-sizing.txt`, measured on this machine, D21), with W's identity after the run.
- **The launch:** the agent launches once the design review passes (`COUPLES-ANY.md`, the test: "its design review, pilot and budget, then the launch through the launcher"; D145 (3)), seed 7027 reserved (D145), on the stamp the design review passed, printed by `MODE=registered TODO_ONLY=1 PREDICTION_FILE=research/solver/registrations/couples-any.md bash research/solver/batch-couples-any.sh`. A launch on any other stamp comes back to the reviewer.
- **Design review:** TO BE SET (`research/solver/reviews/2026-11-24-couples-any-design.md`).
