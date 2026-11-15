# Registration (DRAFT, not complete): the two fixed share rules against today's split (D104 (5); PART-D.md D8)

DRAFT. The design below is fixed; the fields marked TO COME are filled from the panel's landing, the pilot and the sizing,
then the design review, before it goes to the maintainer, who launches it (D104 (5): "its registration to the maintainer
before launch"). Read once, by `research/solver/reduce-share-rules.mjs`, after its gate. Launched only as
`PREDICTION=research/solver/registrations/share-rules.md research/solver/run-from-snapshot.sh bash research/solver/batch-share-rules.sh`,
from a git worktree at the launch commit, where every relaunch under `RESUME=1` and the read also run.

- **Question:** Does either fixed rule for a couple's share keep more couples solvent than today's split, with no harm to
  any couple? The share is the first person's part of the household's spending, on which each person's table is solved
  (src/solver/couple.js `shareBy`):
  - TODAY, `'pots'`, the couples' default since D99: half where the first person holds 40% to 60% of the pots, their share
    of the pots outside it, held to 5% to 95%;
  - FLAT, `'potsflat'`: their share of the pots for every couple, the band dropped, held to 5% to 95%;
  - MEANS, `'means'`: their share of the two people's means (the pots, the contributions paid until each retires, the
    state pension from its age and other incomes, at 2.5% real over the plan's years), held to 5% to 95%.
  Both were built off in code (0eb49fe4, `couple-share-rules.test.mjs`); neither adds solve time. The share choice's read
  (`results-share-choose.txt` and its beside file, EXPLORATORY, seed 7002; `reports/2026-11-14-share-choose-read.md`):
  - dropping the band gained +1.114 points over today's, pooled, but was measured only on couples holding 60/40 with the
    elder entered first;
  - the means' split gained +0.334 on top, measured only on couples chosen because their savings and their means differ;
  - the means' split lost 55 paths of 4,000 on S129-90.
- **Arms:** TODAY, FLAT and MEANS: the couples' candidate as the app solves a couple (`audit-couples-share.mjs`
  `COUPLES_CANDIDATE`: 45 points, the dial at 1, the estate aim 'standard', weight 0.02, each person's table with the
  partner's age, arm A's MPAA ages, the couples' rollout with COUPLE.flat and COUPLE.fast), each at its rule's share. Since
  D104 (1) a couple whose elder is entered second runs on its mirror, so the first person is the elder in every arm. Where
  two rules give one share on a unit (TODAY and FLAT at 90/10), the two arms take one solve and must agree path for path:
  the gate's identity check. Configuration hashes: TO COME (`state.mjs` prints them).
- **Households:** TO COME: the panel's ids, its scan's hash and the code it was landed on. The design:
  - **Couples:** eight, from the library order of `couples-orders.json` (D4's, first person older than 44). The touched are
    left out by `held-out.mjs touchedAll` run on the day and frozen with the order. That leaves out stage C's twelve, the
    couples' re-run panel, the share ensemble's and the share choice's. The eight are taken evenly in the order
    (`select-7u-broad.mjs pick`), spreading them over the library's age patterns.
  - **Units:** each couple four times, each landed so arm A survives 85 +/- 1% on 1,000 paths of seed 7005 (D4's
    procedure, as stage C):
    - **45:** the elder holds 45% of every wrapper, inside the band and below half. TODAY solves at 0.5 and FLAT at 0.45:
      the region the share choice's report named, where the estate is weighed at the smaller holder's table's weight;
    - **55:** the elder holds 55%. TODAY 0.5, FLAT 0.55;
    - **90:** the elder holds 90%. TODAY and FLAT 0.9, MEANS where the means fall;
    - **a feature at the library's own holding** (60/40: TODAY 0.5, FLAT 0.6), set by the couple's place in the panel,
      where the means and the pots part:
      - a £15,000 a year DB pension of the first person's from the state pension age;
      - the same of the partner's;
      - the partner's state pension at 60% of the full amount.
- **Seed:** 7023, reserved in `check-prediction.mjs` for `share-rules*.md` (D93's unlock, named in its commit). As a whole
  number it appears nowhere before, on this branch or any other: only inside decimals in the archive (0.7023). The batch names
  it on a line the launcher's seed check reads. The pilot runs on 7002.
- **Paths:** TO COME. D34's size for each comparison (FLAT against TODAY, MEANS against TODAY, where their shares differ) at
  the pilot's discordance, its upper 95% bound, at most D61's 19,000. A comparison whose 1-point rate at its realised
  discordance falls below 0.90 is read there and named with its rate (D34 (4), as D61 ruled).
- **Primary metric:** survival scored by the engine (`audit-phase4.mjs runPath`, held to `E.runTrial` on the first 200
  paths of every arm), paired on the same paths of the held-out seed across the arms. Spending delivered over every year is
  beside it, and so are the mean pot left and lifetime tax. The couples' rollout runs beside the engine on the first 500
  paths of each solver arm, and a path the two score differently is a fidelity gap, reported.
- **Decision rule:** each of FLAT and MEANS against TODAY, on the units where its share differs from TODAY's. A rule holds
  if all three hold:
  1. **no harm:** no unit flagged by D34's harm rule (`reduce-couples.mjs harmOf`): the loss in survival, paths TODAY keeps
     and the rule loses less those it saves, above the threshold its realised discordance sets, the threshold at which a
     true quarter-point loss reads as harm at most 5% of the time. The loss is compared with its threshold in whole paths
     (`paired-exact.mjs`), so a loss on the threshold is read exactly;
  2. **a gain:** the pooled survival change over those units has its 95% interval's lower end above 0;
  3. **spending:** pooled spending delivered is not lower than TODAY's by more than 0.05% of target.
- **Which is taken:**
  - If both hold, MEANS is taken only if, against FLAT on the units where their shares differ, its pooled survival change
    has its lower end above 0. Otherwise FLAT is taken, the simpler rule: it needs no incomes.
  - If one holds, that one is taken.
- **Outcomes:**
  - **A RULE PASSES:** it becomes the couples' default (`src/solverSettings.js` `APP_COUPLE.shareRule`, the
    decided-defaults block's couples entry, `couple-default.test.mjs` pinning it), in the commit of the D-line naming this
    run, with the reviewer on the change of default. What it reaches beyond the panel is by inference, said in the D-line:
    holdings between the panel's, and couples uneven in some wrappers only.
  - **NEITHER:** today's split stays; reported.
  - **A couple that loses:** a rule with any unit flagged does not become the default, whatever its pooled gain, as
    S129-90's 55 paths under the means' split would be flagged. The flagged unit goes to investigation (D34 (3)) and is
    reported with its paths, discordance, threshold and the two rules' shares.
  - **Reported, deciding nothing:**
    - each unit's three shares and their figures in each arm;
    - the means' share against the pots' by kind of unit;
    - spending, the mean pot left and lifetime tax by rule;
    - the fidelity gaps;
    - the solve times.
- **The gate:** TO COME (`reduce-share-rules.mjs gate`, each refusal with its planted case). It requires:
  - every unit in every arm, one code, audit, seed, prediction and Node version, every unit at its registered paths;
  - each unit's arms on one plan, at the panel's target;
  - each arm's share as its rule gives it, read back from the solve;
  - the couples' settings as stage C's (`audit-couples.mjs wantProblems`);
  - D80's three (a shortlist, item 12's options, a tie-break) none;
  - where two arms share a solve, the same on every path.
- **Budget:** TO COME, measured from the pilot on this machine with nothing else running (D21). As designed: 32 units, at
  most three solves and three runs each.
- **Design review:** TO COME: the `reviewer` agent's PASS before it goes to the maintainer.
