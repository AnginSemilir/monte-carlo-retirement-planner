# Registration: the household plan priced at the pensions' split (HSPA) against today's couples' default (D129 (3), D130 (2); STEP8.md)

COMPLETE (19 Nov), but for the launch's stamp, filled by hand at the launch commit. The first design review
(`reviews/2026-11-19-household-hsp-design.md`) was FAIL, with three BLOCKING and seven MINOR. BLOCKING 1 and 3 were ruled
(D130 (2) and (3), 19 Nov). Step 8 is registered on the arm that passed the arm read (`HOUSEHOLD-ARM.md`, EXPLORATORY: step
8's own rule on 56 units), and that arm is HSPA (`results-household-arm.txt`; its reviewer PASS). The household table
keeps the candidate's tie-break above the cap. The panel, the pilot and the sizing were taken again on the code with the
ISA allowance fixed (675090f5; D130 (1)). The second design review was PASS with four MINOR, each answered before the
launch commit (`STEP8.md`). The seed is reserved (D131). Next comes the maintainer, before launch (D129 (3)). Read once, by
`research/solver/reduce-household-hsp.mjs`, after its gate. Launched only as
`PREDICTION=research/solver/registrations/household-hsp.md research/solver/run-from-snapshot.sh bash research/solver/batch-household-hsp.sh`,
from a git worktree at the launch commit, where every relaunch under `RESUME=1` and the read also run. After the pilot is
read, only Paths, Budget, The launch, What the pilot shows and Design review change; anything else goes back to the reviewer.

- **Question:** Does the household plan, one table for the couple with its allowances priced at the pensions' split (HSPA), keep more couples solvent than today's couples' default (K2), delivering no less spending, with no harm to any couple?
  - The household plan (`research/solver/household.mjs`, design A): one table for the household, solved by the single
    solver on one plan (`householdPlanFor`), and the year's move from the single solver's own chooser where the household
    stands (`chooseHouseholdSingle`).
  - HSPA prices the personal allowance, each income-tax band limit and the tax-free cash cap at `k = 1 / s` times one
    person's, `s` the larger person's share of the two pensions. Its band for gains is `k` times one person's, and the
    year's need is split evenly.
  - The reads behind it, each EXPLORATORY on seed 7002: the lead test (`results-household.txt`), step 5
    (`results-shapes.txt`), the decomposition (`results-household-decomp.txt`), the remedy's read
    (`results-household-remedy.txt`: HSP, the allowance doubled, MENDS by its rule; read by this registration's own rule it
    FAILS on S191-90, the design review's BLOCKING 1) and the arm read (`results-household-arm.txt`: by this registration's
    own rule on 56 units, HSP FAILS part 1 on S191-90, `26` paths net against `23`, and HSPA PASSES all three, no unit
    flagged; S191-90's `+0.050` under HSPA is in sample, HSPA proposed after that loss was seen on those paths).
- **Arms:** APP `ef459a5c8ccb`, K2 `21ca0ea6a7f0`, HSPA `e7913cca6fcd` with the candidate's tie-break above the cap, D80 lifted for the household table alone (D130 (3)) (`audit-household-hsp.mjs` `configOf`)
  - **APP:** arm A, the app's withdrawal-policy search on the couple's plan, without the tournament (D36).
  - **K2:** today's couples' default as the app solves a couple: each person's table at the couples' candidate
    (`COUPLES_CANDIDATE`, 45 points, weight 0.02), the joint move `JOINT` (the pots' share, D99; LOOKHOLD, D109), arm A's
    MPAA ages. The lead test's K2.
  - **HSPA:** one household table at the candidate 17ff82379838, its plan `householdPlanFor` with `scale: 'pensionsPA'`,
    the move at the even split: the arm read's HSPA (`audit-household-arm.mjs`), the same configuration. Its table carries
    the candidate's tie-break above the cap, as every read of the household plan ran it. D80 kept a tie-break out of any
    registered couples' arm (BLOCKING 3); D130 (3) lifts it for the household table alone, its tie-break kept.
- **Households:** the panel `household-hsp-panel.json` (`results-household-hsp-panel.txt`): eight couples, five units each, 40 units, every one inside today's guard
  - **Couples:** the library's S025, S193, S273 and S027 (D4's library order, first person older than 44; S111 passed over,
    its own plan not landing) and the younger cohort's S349F, S351F, S355F and S357F (first person 44 or under, each
    retiring at 52). The touched were left out by `held-out.mjs touchedAll` on the day, with the base of every unit the
    household line has read (`household-hsp-orders.json`: 318 ids, hash acedff4811b5). Four were taken evenly in each order.
  - **Units:** each couple five times, each landed so arm A survives 85 +/- 1% on 1,000 paths of seed 7005 (D4's
    procedure), arm A from 84.1% to 86.0%: own (60/40); 45 and 90 (every wrapper re-held so the first person holds that
    share); a feature at 60/40 by the couple's place (the first person's `£15,000` a year DB pension from the state pension
    age, the same of the partner's, or the partner's state pension at 60%); gap8 (the partner eight years younger, no other
    income). Each unit's own guard on (`src/couplesSwitch.js` `coupleSolverOn`) and `householdPlanFor` taking it at
    HSPA's form.
  - Reserves landed beside, unused: S033, S353F and S359F.
  - Landed again on the fixed code 71fb4271c681 (D130 (1); `results/household-hsp-land.log`): the same couples and units,
    every target, arm A's survival and pick the same as on 603eeb595679.
- **Seed:** 7024, reserved in `check-prediction.mjs` for `household-hsp*.md` by the maintainer's unlock of 19 Nov (D130 (4), D131; the file named in its commit). As a whole number it appears nowhere before in the repository; the batch names it on a line the launcher's seed check reads; the pilot runs on 7002.
- **Paths:** 16,000 for every unit (`household-hsp-paths.json`; `results-household-hsp-sizing.txt`). D34's size for each unit's HSPA-against-K2 comparison at the pilot's discordance, its upper 95% bound, is the floor of 16,000 on all 15 pilot units (that bound at most 3.43%), and at 16,000 a true 1-point loss reads as harm at least 90% of the time up to a discordance of 10.50%. The cap is D61's 19,000. A comparison whose 1-point rate at its realised discordance falls below 0.90 is read there and named with its rate (D34 (4), as D61 and D96 (2) ruled).
- **Primary metric:** survival scored by the engine (`audit-phase4.mjs runPath`, held to `E.runTrial` on the first 200 paths of every arm), paired on the same paths of the held-out seed across the arms.
  - Beside it: spending delivered, the pot left and lifetime tax.
  - The couples' rollout runs beside the engine on K2's first 500 paths; a path the two score differently is a fidelity gap,
    reported. HSPA has no rollout of its own beside the engine: its table's move is executed by the engine alone.
- **Decision rule:** HSPA against K2 over the 40 units; it passes if all three hold (BLOCKING 1, ruled by D130 (2): step 8 held until the arm read, and registered on the arm that passed this rule on its 56 units, HSPA: `results-household-arm.txt`)
  1. **no harm:** no unit flagged by D34's harm rule (`reduce-couples.mjs harmOf`): the loss in survival (paths K2 keeps
     and HSPA loses, less those HSPA saves) above the threshold its realised discordance sets, compared in whole paths
     (`reduce-share-rules.mjs harmExact`);
  2. **a gain:** the pooled survival change has its 95% interval's lower end above 0, the interval by path
     (`reduce-phase4.mjs survivalItem`: every unit runs the same paths, so cells summed over the units would read them as
     independent; BLOCKING 2);
  3. **spending:** pooled spending delivered on the paths both keep, each unit's change in percent of K2's mean on those
     paths and the units weighted equally (`reduce-household-hsp.mjs keptSpend`, by path), its point estimate not lower
     than -0.05%.
  - **The pot's ruling (D116, M1):** where HSPA keeps more paths and delivers no less spending, a smaller pot left is not a
    harm. It is recorded, capped at the two people's estate caps and in pounds a path beside the spending, and is not a bar.
    It is read pooled and, beside it, by unit (`m1ByUnit`). A unit where HSPA keeps more paths but spends less on the paths
    both keep, beyond noise, is named with its pot and its spending over all paths beside that on the paths both keep; M1's
    condition is not met there. It is not a bar to the rule, but under a PASS each unit it names goes to the maintainer with
    the read before the default changes (the second design review, MINOR 2; the read's outcome line names them).
  - **Against APP, beside the rule:** HSPA and K2 against APP, pooled and by unit. D34's harm flags against APP each send
    their unit to investigation and do not block on their own (D34 (3)).
- **Outcomes:** PASS makes HSPA the couples' default by a build and the reviewer on the change of default; FAIL keeps today's default; a flagged unit stops the default
  - **PASS:** HSPA becomes the couples' default, in the commit of the D-line naming this run, with the reviewer on the
    change of default. Where M1 names a unit, the read goes to the maintainer first, with those units, and the default
    changes only on the maintainer's word. That is a build:
    - the household plan's construction, its table and its move put into the app's solve of a couple (`src/`);
    - the port shown identical to the tested arm, path for path, as D99 and D109's changes of default were;
    - the decided-defaults block and the test that pins it, to `main` on B1's gate.
    Then the guard is looked at again with its own units, as the external review asks. What it reaches beyond the panel is
    by inference, said in the D-line:
    - couples the guard keeps on the app's rules: an age gap above three years with other taxable income, the younger
      holding more than 60%, either over 90%;
    - shapes the panel lacks: gaps other than eight years, an elder entered second, pensions held unlike the pots;
    - the 'lower' estate aim, consent to change risk withdrawn, the dial's other positions and the speed mode.
  - **FAIL:** today's default stays. The read goes to the maintainer, with each failing part and its units.
  - **A unit flagged:** HSPA does not become the default, whatever its pooled gain. The unit goes to investigation (D34
    (3)) and is reported with its paths, discordance, threshold and `k`.
  - **Reported, deciding nothing:** each unit's `k` and three survivals; spending; the pot capped and in pounds; lifetime
    tax; each table's forecast against its survival; the fidelity gaps; the solve and path times.
- **The engine's ISA defect** (`reports/2026-11-18-windfall-read.md`; the design review's MINOR 7) is fixed (675090f5,
  D130 (1)): a dated deposit or staged transfer into an ISA counts against that year's allowance in the engine, the exact
  model and the forward run. It reached this run in two ways, each now closed: S027-gap8's own pick (Windfall to ISA) puts a
  dated deposit into its ISA in all three arms, and on 30 units `householdPlanFor` turns the later retiree's ISA
  contributions into dated deposits, which the exact model now counts too. The code moved (603eeb595679 to 71fb4271c681),
  so the panel was landed again on it (the audit refuses a run on code other than the panel's).
- **The guard** (D128) is read at the launch commit. Its key is with the maintainer (D129 (4)); were it re-keyed before the
  launch, each unit's guard is read again and the panel landed again where it changes.
- **The gate:** first the launch logs' stamps against the registration's git blob (`fair-gate.mjs requireFairLogs`), then
  `reduce-household-hsp.mjs gate`. Each refusal has its planted case (`--planted`: 27 on built units; and the settings lines' and the household line's re-checks, 6, on a real pilot record's lines, each fault refused by its own check). It requires:
  - every unit of the panel with its three arms, and each unit's own launch log, naming it, with its done line;
  - one code, audit, seed, prediction, estate weight, points and Node version;
  - every unit at its registered paths, every array one a path;
  - each unit at the panel's target, with arm A's pick the landing's and the guard on;
  - each arm at its configuration, and HSPA's `k` 1 / s;
  - from each unit's record: each table's settings line (`audit-couples.mjs wantProblems`), the household table's line
    against the first person's (`audit-shapes.mjs shapesLineProblems`), HSPA's plan entries its form's from one person's
    (`hspaPlanProblems`: the allowance, each band limit and the cap `k` times one person's, every other doubled entry design
    A's as built), and its band for gains `k` times one person's.
  - A part of a unit's run saved before a restart is taken up again only under the same stamp, registration hash and Node
    version.
- **What the pilot shows:** the pilot's 15 units of three couples (S025, S273 and S351F, every shape), 1,000 paths a unit on seed 7002, on the fixed code (`results-household-hsp-sizing.txt`; EXPLORATORY, deciding nothing)
  - HSPA against K2 from `-0.30` to `+2.30` points; by shape, the mean over the pilot's couples: db `+1.20`, 90 `+0.90`,
    gap8 `+0.80`, dbpart `+0.60`, own `+0.00`, sppart `-0.10`, 45 `-0.10`.
  - Were each pilot change the truth, D34 at 16,000 would flag S273-45 (`-0.30`, 3 of 1,000 paths discordant) with chance
    0.145 and S351F-own (`-0.20`) with 0.018; every other unit at most 0.001. Under HSP the pilot on the code before gave
    S273-sppart 0.901 (BLOCKING 1's direction); under HSPA it is `-0.10`, its chance nought.
  - Its gate fair (`reduce-household-hsp.mjs --pilot`). It ran on the final files 19 Nov 19:10 to 19:53 UK, audit
    7fa755346a65, nothing beside it (`results/household-hsp-pilot-5.log`). Its arrays are the same in every stored figure
    on every path as the run on HSPA before the second round's edits (15:05 to 15:53 UK, audit a11dd70ee278, kept aside),
    which moved no unit's run. The pilots on HSP and the code before the fix are kept aside, unread or superseded
    (`STEP8.md`).
  - Beside it, the preflight (the second round's MINOR 1; `results-household-hsp-preflight.txt`): the 25 units the pilot
    did not run, each through every check before any path at 45 points and two paths of seed 7002, none refused.
- **Budget:** 54.5 core-hours; on four cores in the batch's own order, the panel's, 14.8 hours (longest first 13.8); the longest unit 3.48 hours (`results-household-hsp-sizing.txt`)
  - It counts the 200 checked paths of each arm and one relaunch of the longest unit.
  - It is measured from the pilot's units on this machine (D21, an Intel Xeon at 2.10GHz), four at a time, with nothing
    else running. The sizing on HSP and the code before the fix (the pilot of 19 Nov 03:29 UK) gave 44.3 core-hours: K2's
    path on the same units ran slower in the pilots on HSPA (S025-own `88.7` ms a path against `71.7`), the cause not
    measured.
  - The run passes the task's 12-hour limit once: that window is relaunched under `RESUME=1`, each unit done kept and each
    unfinished one resumed from its saved chunks.
- **The launch:** `<the stamp: code 71fb4271c681 audit <audit-household-hsp.mjs stampFilesHash> at the launch commit>` (filled by hand at the launch commit: `check-prediction.mjs` does not read this field, the second design review's MINOR 4)
- **Design review:** research/solver/reviews/2026-11-19-household-hsp-design-3.md (the third look, at the second round's answers: PASS, two MINOR; the second round: `reviews/2026-11-19-household-hsp-design-2.md`, PASS, four MINOR, each answered (`STEP8.md`); the first round: `reviews/2026-11-19-household-hsp-design.md`, FAIL)
