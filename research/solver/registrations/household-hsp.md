# Registration: the household plan priced at the pensions' split against today's couples' default (D129 (3); STEP8.md)

DRAFT (19 Nov): its panel, paths and budget are filled from the landing, the pilot and the sizing, then it goes to its design
review, then to the maintainer before launch (D129 (3): "its registration drafted, put to the design reviewer and brought to
the maintainer before launch"). Read once, by `research/solver/reduce-household-hsp.mjs`, after its gate. Launched only as
`PREDICTION=research/solver/registrations/household-hsp.md research/solver/run-from-snapshot.sh bash research/solver/batch-household-hsp.sh`,
from a git worktree at the launch commit, where every relaunch under `RESUME=1` and the read also run.

- **Question:** Does the household plan, one table for the couple with its allowances priced at the pensions' split (HSP),
  keep more couples solvent than today's couples' default (K2), delivering no less spending, with no harm to any couple?
  - The household plan (`research/solver/household.mjs`, design A): one table for the household, solved by the single
    solver on one plan (`householdPlanFor`), and the year's move from the single solver's own chooser where the household
    stands (`chooseHouseholdSingle`).
  - HSP prices each income-tax band above two personal allowances, and the tax-free cash cap, at `k = 1 / s` times one
    person's, `s` the larger person's share of the two pensions. Its band for gains is `k` times one person's, and the
    year's need is split evenly.
  - The reads behind it, each EXPLORATORY on seed 7002:
    - the lead test (`results-household.txt`): A LEAD, WITH A UNIT TO PLACE, three couples wholly below its bar;
    - step 5 (`results-shapes.txt`): A SHAPE TO PLACE, the household plan above K2 on the shapes the library lacks;
    - the decomposition (`results-household-decomp.txt`): the three losses rest on the doubled bands;
    - the remedy's read (`results-household-remedy.txt`): HSP MENDS the three and keeps the gain, on S191-90 by `0.38` of
      a path (`results-household-remedy-beside.txt`).
- **Arms** (`audit-household-hsp.mjs` `configOf`), all three on each unit's plan, in one process, on the same paths:
  - **APP** `ef459a5c8ccb`: arm A, the app's withdrawal-policy search on the couple's plan, without the tournament (D36).
  - **K2** `21ca0ea6a7f0`: today's couples' default as the app solves a couple. Each person's table is at the couples'
    candidate (`COUPLES_CANDIDATE`, 45 points, weight 0.02), with the joint move `JOINT` (the pots' share, D99, and LOOKHOLD,
    D109) and arm A's MPAA ages. It is the lead test's K2.
  - **HSP** `dd698f0bcb93`: one household table at the candidate 17ff82379838 with its tie-break above the cap, its plan
    `householdPlanFor` with `scale: 'pensions'`, the move at the even split. It is the remedy's read's HSP.
- **Households:** the panel (`household-hsp-panel.json`, `results-household-hsp-panel.txt`; to be filled from the landing):
  eight couples, five units each, 40 units, every one inside today's guard (`src/couplesSwitch.js` `coupleSolverOn` on).
  - **Couples:** four from the library order of `couples-orders.json` (D4's, first person older than 44) and four from its
    younger cohort (first person 44 or under, each retiring at 52). The touched are left out by `held-out.mjs touchedAll`
    on the day, with the base of every unit the household line has read, frozen with the orders
    (`household-hsp-orders.json`: 318 ids, hash acedff4811b5). Four are taken evenly in each order.
  - **Units:** each couple five times, each landed so arm A survives 85 +/- 1% on 1,000 paths of seed 7005 (D4's
    procedure):
    - **own:** as the library holds it (60/40, the first person the elder);
    - **45:** every wrapper re-held so the first person holds 45%;
    - **90:** the same at 90%;
    - **a feature at 60/40, by the couple's place in its cohort:** the first person's `£15,000` a year DB pension from the
      state pension age, the same of the partner's, or the partner's state pension at 60%;
    - **gap8:** the partner eight years younger, no other income.
  - A couple joins only if all five of its units land, the guard is on for each and `householdPlanFor` takes each at HSP's
    settings. Otherwise it is passed over for the next reserve, and reported.
- **Seed:** 7024, reserved in `check-prediction.mjs` for `household-hsp*.md`. That is a protected file, so it needs the
  maintainer's unlock, named in its commit. As a whole number it appears nowhere before in the repository. The batch names it
  on a line the launcher's seed check reads. The pilot runs on 7002.
- **Paths:** (to be filled from the sizing: `household-hsp-paths.json`, `results-household-hsp-sizing.txt`). D34's size for
  each unit's HSP-against-K2 comparison is taken at the pilot's discordance, using its upper 95% bound. The floor is 16,000
  and the cap D61's 19,000. A comparison whose 1-point rate at its realised discordance falls below 0.90 is read there and
  named with its rate (D34 (4), as D61 and D96 (2) ruled).
- **Primary metric:** survival scored by the engine (`audit-phase4.mjs runPath`, held to `E.runTrial` on the first 200 paths
  of every arm), paired on the same paths of the held-out seed across the arms. Beside it: spending delivered, the pot left
  and lifetime tax. The couples' rollout runs beside the engine on K2's first 500 paths; a path the two score differently is
  a fidelity gap, reported.
- **Decision rule:** HSP against K2 over the 40 units. It passes if all three hold:
  1. **no harm:** no unit flagged by D34's harm rule (`reduce-couples.mjs harmOf`). The flag is the loss in survival (paths
     K2 keeps and HSP loses, less those HSP saves) above the threshold its realised discordance sets. The loss is compared
     with its threshold in whole paths (`reduce-share-rules.mjs harmExact`);
  2. **a gain:** the pooled survival change (`stats.mjs survivalChange` on the units' cells summed) has its 95% interval's
     lower end above 0;
  3. **spending:** pooled spending delivered on the paths both keep (`reduce-household.mjs spendOn`) is not lower than K2's
     by more than 0.05%.
  - **The pot's ruling (D116, M1):** where HSP keeps more paths and delivers no less spending, a smaller pot left is not a
    harm. It is recorded, capped at the two people's estate caps and in pounds a path beside the spending, and is not a bar.
    It is read pooled and, beside it, by unit (`reduce-household-hsp.mjs m1ByUnit`). A unit where HSP keeps more paths but
    spends less on the paths both keep, beyond noise, is named with its pot; M1's condition is not met there. It is not a
    bar.
  - **Against APP, beside the rule:** HSP and K2 against APP, pooled and by unit. D34's harm flags against APP each send
    their unit to investigation and do not block on their own (D34 (3)).
- **Outcomes:**
  - **PASS:** HSP becomes the couples' default, in the commit of the D-line naming this run, with the reviewer on the
    change of default. That is a build: the household plan's construction, its table and its move put into the app's solve
    of a couple (`src/`), with the decided-defaults block and the test that pins it, to `main` on B1's gate. Then the guard
    is looked at again with its own units, as the external review asks. What it reaches beyond the panel is by inference,
    said in the D-line:
    - couples the guard keeps on the app's rules: an age gap above three years with other taxable income, the younger
      holding more than 60%, either over 90%;
    - shapes the panel lacks: gaps other than eight years, an elder entered second, pensions held unlike the pots;
    - the 'lower' estate aim, consent to change risk withdrawn, the dial's other positions and the speed mode.
  - **FAIL:** today's default stays. The read goes to the maintainer, with each failing part and its units.
  - **A unit flagged:** HSP does not become the default, whatever its pooled gain. The unit goes to investigation (D34 (3))
    and is reported with its paths, discordance, threshold and `k`.
  - **Reported, deciding nothing:** each unit's `k` and three survivals; spending; the pot capped and in pounds; lifetime
    tax; each table's forecast against its survival; the fidelity gaps; the solve and path times.
- **The gate:** first the launch logs' stamps against the registration's git blob (`fair-gate.mjs requireFairLogs`), then
  `reduce-household-hsp.mjs gate`. Each refusal has its planted case (`--planted`). It requires:
  - every unit of the panel, with its three arms;
  - one code, audit, seed, prediction, estate weight, points and Node version;
  - every unit at its registered paths, every array one a path;
  - each unit at the panel's target, with arm A's pick the landing's and the guard on;
  - each arm at its configuration, and HSP's `k` 1 / s;
  - one launch log a unit.
- **What the pilot shows:** (to be filled: `results-household-hsp-sizing.txt`; EXPLORATORY, seed 7002, 1,000 paths a unit,
  deciding nothing).
- **Budget:** (to be filled: measured from the pilot's units on this machine with nothing else running, D21).
- **The launch:** (to be filled: the stamp `code 603eeb595679 audit <audit-household-hsp.mjs stampFilesHash>`). The audit
  refuses a run on code other than the panel's.
- **Design review:** (to be filled: the `reviewer` agent's verdict in `research/solver/reviews/`).
