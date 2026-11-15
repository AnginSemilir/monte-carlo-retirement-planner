# Registration: the two fixed share rules against today's split (D104 (5); PART-D.md D8)

Complete: its fields filled from the panel's landing, the pilot and the sizing (15 Nov), then its design review, before it
goes to the maintainer, who launches it (D104 (5): "its registration to the maintainer before launch"). Read once, by `research/solver/reduce-share-rules.mjs`, after its gate. Launched only as
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
- **Arms:** TODAY `27d2a7c7ee9d`, FLAT `d17e66b604a1` and MEANS `bd5c568d2f42` (`audit-share-rules.mjs` `configOf`).
  Each is the couples' candidate as the app solves a couple, at its rule's share (`shareRule`):
  - `audit-couples-share.mjs` `COUPLES_CANDIDATE`: 45 points, the dial at 1, the estate aim 'standard', weight 0.02;
  - each person's table with the partner's age, arm A's MPAA ages;
  - the couples' rollout with COUPLE.flat and COUPLE.fast.
  TODAY's configuration is stage C's CANDS. Since D104 (1) a couple whose elder is entered second runs on its mirror, so the
  first person is the elder in every arm. Where FLAT's share is TODAY's (the 90/10 units), FLAT is not run: its solve would
  be TODAY's to the bit (the same share on the same plan), so TODAY's run stands for FLAT's there (`reduce-share-rules.mjs`
  `withStandIn`), and MEANS against FLAT is read on all 32 units. The gate requires FLAT exactly where the two shares
  differ, and refuses it where they do not.
- **Households:** the panel (`share-rules-panel.json`, `results-share-rules-panel.txt`): S023, S061, S109, S147, S191,
  S227, S271 and S377, 32 units, arm A from 84.1% to 86.0%; their features by place: db, dbpart, sppart, db, dbpart, sppart,
  db, dbpart. The scan 310 ids, hash 40836a8ffa0a, the order frozen 15 Nov 10:49 UTC. Landed on code c0dcfa9ef2f2 (15 Nov
  18:42 UK); the first landing, on f5ee3a567425, gave the same targets and plans to the bit. The design:
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
- **Paths:** 16,000 a unit (`share-rules-paths.json`). D34's size for each comparison (FLAT against TODAY, MEANS against
  TODAY, where their shares differ) at the pilot's discordance, its upper 95% bound, at most D61's 19,000: the floor of
  16,000 on all 21 of the pilot's comparisons (`results-share-rules-sizing.txt`; the pilot EXPLORATORY, seed 7002, 1,000
  paths, places 0, 4 and 6: S023, S191 and S271; discordance 0.3% to 3.0%, upper bounds 0.87% to 4.26%). At 16,000 a true
  1-point loss reads as harm at least 90% of the time up to an upper-bound discordance of 10.50%. A comparison whose
  1-point rate at its realised discordance falls below 0.90 is read there and named with its rate (D34 (4), as D61 ruled).
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
  3. **spending:** the pooled change in spending delivered, each unit's in percent of TODAY's mean spending delivered and the
     units weighted equally (`reduce-phase4.mjs spendingItem`), its point estimate not below -0.05%.
- **Which is taken:**
  - If both hold, MEANS is taken only if, against FLAT on every unit where their shares differ (all 32, TODAY's run
    standing for FLAT's at 90/10), its pooled survival change has its lower end above 0. Otherwise FLAT is taken, the
    simpler rule: it needs no incomes.
  - If one holds, that one is taken.
- **Outcomes:** a rule that passes becomes the couples' default; if neither passes, today's split stays. In full:
  - **A RULE PASSES:** it becomes the couples' default (`src/solverSettings.js` `APP_COUPLE.shareRule`, the
    decided-defaults block's couples entry, `couple-default.test.mjs` pinning it), in the commit of the D-line naming this
    run, with the reviewer on the change of default. What it reaches beyond the panel is by inference, said in the D-line:
    - holdings between the panel's, and couples uneven in some wrappers only;
    - an elder holding 40% to 45% of the pots, whom FLAT would give 0.40 to 0.45, below the panel's lowest share (0.45) and
      in the direction the pilot shows losing;
    - couples of equal age (every panel couple's first person is three years older);
    - means' shares further from the pots' own than the panel's range (MEANS's share less FLAT's, -0.215 to +0.081;
      `results-share-rules-pilot-power.txt`);
    - the 'lower' estate aim (the panel runs 'standard');
    - TIE-C2's rule, were it to become the couples' default (D105), with either rule.
    S191 also appears in the policy study's confirmed results, under the app's rules only: never in a solver read.
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
- **The gate:** first the launch logs' stamps against the registration's git blob (`fair-gate.mjs requireFairLogs`), then
  `reduce-share-rules.mjs gate`. Each refusal has its planted case (`--planted`, 16 checks): the logs stamped as the
  launcher stamps them, one under an edited registration and one run by hand; FLAT missing where its share differs, and
  run where its share is TODAY's; a share not the rule's; another seed, code or plan; D80's three; and each other refusal
  on its own fault (16 faults). Also checked: the threshold in whole paths from 16,000 to 19,000 paths, TODAY's run standing
  for FLAT's, and the choice between the rules. It requires:
  - every unit in every arm, one code, audit, seed, prediction and Node version, every unit at its registered paths;
  - each unit's arms on one plan, at the panel's target;
  - each arm's share as its rule gives it, read back from the solve;
  - the couples' settings as stage C's (`audit-couples.mjs wantProblems`);
  - D80's three (a shortlist, item 12's options, a tie-break) none;
  - FLAT run exactly where its share differs from TODAY's; where it does not, TODAY's run stands for it (above).
- **What the pilot shows** (`results-share-rules-pilot-power.txt`; EXPLORATORY, seed 7002, 1,000 paths a unit, deciding
  nothing; the maintainer should weigh it before the 58 core-hours below):
  - FLAT loses survival on all three of the pilot's 45 units (0.70, 0.50 and 0.80 points). MEANS loses 0.70 points on
    S023-45 and 2.40 on S023-90.
  - Were those losses true, D34's rule would flag each at 16,000 paths with chance 0.93 to 1.00 (S191-45 under FLAT 0.93,
    the others 1.00). A flag on any unit stops a rule, so the run would most likely read NEITHER.
  - MEANS against FLAT on the pilot: +0.167 points (-0.032 to +0.365) on the 12 units, with TODAY's run standing for FLAT's
    at 90/10.
  - The pilot is 1,000 paths of three couples, and the run is 16,000 of eight: a loss this size could also be noise.
- **Budget:** 58.1 core-hours over 88 runs (32 units: TODAY and MEANS on each, FLAT on the 24 where its share differs),
  about 14.5 hours on four cores longest first, the longest run 0.82 hours, inside the 12-hour limit
  (`results-share-rules-sizing.txt`: measured from the pilot's units on this machine, D21, each unit scaled from the pilot
  couple nearest in horizon; the pilot's solves 75 to 102 s, the engine 107 to 164 ms a path).
- **The launch:** the stamp `code c0dcfa9ef2f2 audit ba4f53953da5` (`audit-share-rules.mjs`: the code, and its files with
  the panel, its order and the paths). Launched only as above, from a git worktree at the commit that records the
  maintainer's go, its code and files these; a change of code before it (the couples' default, were TIE-C2.md's rule to
  take one, D105) waits until the run is launched, since the audit refuses a run on code other than the panel's.
- **Design review:** TO COME: the `reviewer` agent's PASS before it goes to the maintainer.
