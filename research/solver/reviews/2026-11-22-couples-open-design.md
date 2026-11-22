Verdict: FAIL

# Design review: the guard's own units, the registered test (registrations/couples-open.md; COUPLES-OPEN.md step 2 and amendments 1 and 2; D139, D140, D141)

Subject: the registration and the batch, audit, reducer, panel and sizing it names, before its launch on seed 7026. The main
tree is at 07c35c7c (claude/fervent-goodall-e2mrnf), clean and pushed.

Read (git blobs at 07c35c7c):
- The registration and its rulings: `registrations/couples-open.md` f82bb79af634, `COUPLES-OPEN.md` 46d7ea327b1d, STATE.md
  4bf3f00b32cc (D139 to D141), CHECKLIST.md 45e387294c8d, `DECISIONS-PENDING.md` a2249a821394.
- The machinery: `couples-open-panel.mjs` 07a0afc6ff2c, `audit-couples-open.mjs` 661fbc456194, `reduce-couples-open.mjs`
  6ab51039f754, `batch-couples-open.sh` c4f7c5df9c75, `size-couples-open.mjs` eb1d3a3a90c2.
- The panel and its records: `couples-open-registered-panel.json` 4e755f2cad14, `results-couples-open-registered-panel.txt`
  ff23a7df1bfa, `couples-open-orders.json` 145ac30ba44a, `couples-open-paths.json` 506116dff618,
  `results-couples-open-sizing.txt` 942a2974d89a.
- The helpers: `size-household-hsp.mjs` 1a555ce15e0d, `size-phase4.mjs` f66f13d055ed, `reduce-share-rules.mjs` b46fa5187e99,
  `reduce-couples.mjs` cae05c5a8e75, `reduce-phase4.mjs` ac319aad1f44, `reduce-household-hsp.mjs` 153cbfeebc48, `fair-gate.mjs`
  c6b3e87e1643, `check-prediction.mjs` 8619e0fa3ef3, `run-from-snapshot.sh` cf7ab99bb4ec, `held-out.mjs` fe5111ee6129,
  `phase4-panel.mjs` f5d8e7411e88, `share-rules-panel.mjs` 168dcae982f6, `audit-phase4.mjs` 5ace83959b96.
- The app's route and the guard: `src/couplesSwitch.js` b33f855de049, `src/solverClient.js` bd27a8004521 (l.243 to 346),
  `src/solver/household.js` 06b69ec74e77, `src/coupleOrder.js` bf2578bd6ccc, `src/solverSettings.js` 9b833da7e794,
  `src/solverCouple.js` c85332888894, `src/solverApp.js` a822d56e2e09, `src/solverStrategy.js` df881f8dd151. No file under
  `src/` has changed since c4e86633, where the rehearsal's reviewer held ROUTE to the page.
- The evidence:
  - `results-couples-open-rehearsal.txt` 09809867d079 and its beside file 7fa45cad9574;
  - `results-couples-open-addendum.txt` 0f8c68f51ab3 and `reports/2026-11-22-couples-open-addendum.md`;
  - `results-guard.txt` 56df67561cdf, `results-guard-beside.txt` ffd8eb74b44d, `reports/2026-11-18-guard-key-read.md`
    6e75d9cdbcab;
  - `results-household-arm.txt` 0eef14d8b4e6;
  - the two reviews of the rehearsal's read, 6e9b6c81b3bf and f7dc61e101ff;
  - `registrations/household-hsp.md` fb070defb6d3, for precedent.

Ran (scripts in the session's scratchpad; nothing in the tree changed; no path of seed 7026 run, read or estimated):
- `check-prediction.mjs` on the registration: NOT COMPLETE, with one problem, "Design review" names no review file.
  - Its seed check under the registration, with the batch: seeds 7002 and 7026, exit 0.
  - Under a measurement: refused, 7026 reserved.
- `configOf`: APP ef459a5c8ccb and ROUTE 35ee3a2dc6ad, with and without REG=1.
  - `hashOf(APP_CANDIDATE)` is 06bc8f910b3f, STATE.md's candidate.
  - `APP_COUPLE.household` is 'pensionsPA'.
- The planted modes:
  - the reducer: ALL PASS (12), with and without REG=1;
  - the panel: 55 of 55, both ways;
  - the audit: 13 of 13, both ways (S357F-Y90 without REG=1, S279-RY75 with it).
- `MODE=registered TODO_ONLY=1 PREDICTION_FILE=research/solver/registrations/couples-open.md bash research/solver/batch-couples-open.sh`:
  stamp code 36e4d2a860b2 audit 811bdbded3f1, todo 0 to 39.
- The stamp by commit. Each tree was taken by `git archive`, with the main tree's built `research/engine.mjs` copied in.
  - The REG=1 audit stamp is 76e31af903d7 (the pilot's) at 75dc7015, 046eafb5, 4358cc2b and 1fe592bd.
  - It is 414cc741bd96 at 54b5870b and 811bdbded3f1 at 07c35c7c.
  - The code id is 36e4d2a860b2 throughout.
  - Between 1fe592bd and 07c35c7c, the stamped files that differ are the audit and the reducer and `couples-open-paths.json`.
    The audit and reducer changes are D141's `unitsOf 'registered'`, its planted case, and the withdrawal of the two-part
    read.
- The sizing, run from the 1fe592bd tree on `results/couples-open-pilot`:
  - `results-couples-open-sizing.txt` byte for byte;
  - `couples-open-paths.json` the committed file, but for `built`.
- Probes (no solve):
  - the guard and the route of each of the 40 units;
  - `touched()`'s scan with this study's own files left out, and the review branch: S037, S119, S199 and S279 are named
    nowhere else;
  - the held-out order's retirement and access ages;
  - the library's other incomes;
  - D34's rates per unit at 19,000 and 25,000 paths, and the budget at each (`unitSecs` on the pilot's records);
  - the pilot's 40 household-route units read by the registered rule (seed 7002, EXPLORATORY).
- Not run: the registered mode's own refusals. The permission system refused even a refusal case, so I read them from the
  audit (l.184 to 198) and have not seen them fire.

## What holds

1. **The registration is complete but for this review, and its seed is its own.**
   - `check-prediction.mjs` l.45 to 47 reserve 7026 for `/^couples-open[\w.-]*\.md$/`.
   - The batch names it on a line the launcher's seed check reads (`batch-couples-open.sh` l.19).
2. **The arms are the hashes `configOf` prints, and the paths are paired.**
   - ROUTE carries the app's candidate (06bc8f910b3f), `APP_COUPLE` and `appJoint()`.
   - Both arms run one `pathsForSeed` array, on one horizon, which the audit checks (l.225 to 231).
3. **The panel is held out.**
   - It was frozen at 11:42 on 22 Nov (337 touched ids, hash 34bd7257bd88).
   - The four couples are the order's first four, and none was passed over.
   - No file outside this study's own names them, and neither does the review branch.
   - They were landed on seed 7005 and piloted on 7002.
4. **Every one of the 40 units is kept off by today's guard for its class's reason, and takes the household route.**
   - The reason is 'gapincome' on G8, G12 and G12P, and 'uneven' on the rest.
   - In every unit the elder is entered first, so no swap applies, and every horizon fits.
   - The 24 units on today's route are not run (the dry run lists 40).
5. **The rule as coded is the registration's** (`reduce-couples-open.mjs` l.98 to 121):
   - `harmExact(ROUTE, APP)`: lost is APP keeping a path ROUTE loses, read against the threshold set by the realised
     discordance's upper bound;
   - part 2: the interval's lower end must be above 0;
   - part 3: the point must be at or above -0.05;
   - M1 names a unit where saved exceeds lost and the upper end of the interval on the paths both keep is below 0;
   - each part fails on its plant, and each of the gate's 20 refusals fires on its planted fault.
6. **The gate and the registered mode refuse what they should, but for finding 7.**
   - The gate checks units, stamps, seed, paths, points, estate weight, Node version, the guard, the route, ROUTE's context,
     a class's route, the configurations, array lengths and logs. Then it runs `requireFairLogs` against the registration's
     blob.
   - The registered mode refuses REG unset, `CO_PTS`, `CO_N`, `CO_ONLY`, `CO_OUT`, another `PREDICTION_FILE` and another
     code id (audit l.187 to 191).
7. **The sizing on the pre-D141 stamp is sound.**
   - It reproduces from the 1fe592bd tree, whose stamp is the pilot's.
   - D141's changes reach no unit's computation.
   - N and the budget follow from the pilot as the registration says.
8. **The run cannot read the held-out seed early.**
   - A registered log prints no survival (audit l.260).
   - The size and beside scripts refuse records of another seed or stamp, and `--pilot` refuses them by seed.
   - `--smoke` is refused at the read's own paths and points.
   - The stamp's 54 files cover the scripts, the panel, the order, the paths file, the guard and the app's route modules. The
     code id covers the solver and the engine.
9. **Scoring is the engine's.**
   - `runPath` is held to `E.runTrial` on each arm's first 200 paths.
   - As in step 8, the household route has no rollout of its own beside the engine (`registrations/household-hsp.md` l.55
     to 56).

## Findings

1. **BLOCKING. G can open for an income that starts before its owner's state pension age. That is the one income that
   has been measured harmful at an age gap, and no unit carries one.**
   - **What the units carry.** Each G unit carries a £15,000 a year DB pension from the state pension age, 68
     (`share-rules-panel.mjs` l.72 to 74).
     - Only on S037 does it pay from plan year 0, because S037's elder is already 68.
     - On S119, S199 and S279 it starts 7, 13 and 23 years in.
     - S037-G12P's partner's pension starts 12 years in.
   - **No run has tested it.** No library couple has any other taxable income (0 of 210, my probe). So the household route
     has never been run with such an income before the pension age. That holds here, in the rehearsal and its addendum, in
     step 5's shapes and in the household-arm read, which use the same features. The addendum's write-up says so
     (`reports/2026-11-22-couples-open-addendum.md` l.57 to 58).
   - **The one measurement is the guard test, on today's route** (`results-guard.txt` l.12; `results-guard-beside.txt`
     l.6 to 14):
     - S149@gap12 with £15,000 of rent from plan year 0 (the first person 56, retired at 55): K2 less APP -6.850 (-7.622 to
       -5.984), 81 paths saved and 355 lost;
     - S149's two units with rent from now, pooled: -3.200;
     - the same couples with the DB pension instead: +6.325 and +4.350;
     - what brings the harm is not shown (`reports/2026-11-18-guard-key-read.md` l.42).
   - **The household plan's pass on the DB shapes does not carry over.** Those passes came where K2 failed. On the gap
     shapes without that income the household plan runs close to K2: HSPA is above it by +0.250 to +2.075
     (`results-household-arm.txt` l.47, 48, 54 and 55). A pattern that harmed K2 for another reason has not been read.
   - **What a pass would change.** If G opens, `DB_GAP_UP_TO` lifts for every couple the household plan takes, whatever the
     income's kind, amount or start (`src/couplesSwitch.js` l.101 to 110: any amount above nought, its ages not read).
     - The change follows the read with the reviewer on it.
     - The maintainer is asked first only about the units M1 names (D140 (2); the registration l.66 to 69 and l.80).
   - **The inference list does not say it.** Its "incomes other than a DB pension of the elder's" (l.89) does not say
     when an income starts. It does not say that the one income measured before the pension age was harmful. Nor does it
     say that G12P already reads the partner's DB pension.
   - **Needed before launch, one of these:**
     - (a) Add a G unit to every registered couple, as amendment 1 added its five: 12 years apart, with £15,000 a year of
       the first person's other taxable income typed from now (the guard test's rent). Land it on 36e4d2a860b2, pilot it
       on seed 7002 and size it. On S119 the income runs from plan year 0, 7 years before the pension age, which is S149's
       shape. On S199 and S279 it runs from their retirement at 60, 8 years before it.
     - (b) Restrict G's outcome to incomes that start at or after the owner's state pension age. The engine counts an
       income from its owner's retirement at the earliest. The guard would keep 'gapincome' for an income that starts
       earlier, until a unit reads one.
     - (c) The maintainer's word that this reach rests on inference, with S149@gap12 and its rent named in the D-line.
   - Each of these changes the registration beyond Paths, Budget, The launch, What the pilot shows and Design review, so it
     comes back to the reviewer.

2. **MINOR. The cap of 19,000 paths is not ruled for this test.**
   - D61 capped D4 at 19,000 ("D34 (2) and (4) so amended for D4"). D96 (2) applied the cap to stage C on the maintainer's
     own choice, put to them as "D61's choice for D4, yours here" (`DECISIONS-PENDING.md` l.966 to 968). Step 8 and save-v2
     cited the cap where it did not bind.
   - Here it binds on 24 of the 40 units, while `COUPLES-OPEN.md` step 2 says "paths by D34 ... a true 1-point loss read as
     harm at least 90% of the time".
   - At 19,000, those 24 units read a true 1-point loss as harm with chance 0.824 to 0.888 at their pilot bounds. The low
     end is S037-G12, at a discordance bound of 16.09%. The high end is S199-Y75 and S199-G8, at 13.00%.
   - At 25,000 every unit reaches 0.903 or more. That costs 13.1 core-hours (3.4 hours on four cores) against 10.1 (2.7).
   - D34 (4)'s per-unit thresholds and rates are printed in neither the registration nor the sizing.
   - Little rides on it here, since every pilot unit gains 8.9 to 13.8 points. But the registration cites a ruling that
     does not cover this test.
   - The fix is to run 25,000 paths, which the registration lets Paths and Budget take after the pilot. The paths file is
     stamped, so the new stamp should be stated. Otherwise, put the cap to the maintainer.

3. **MINOR. "What the pilot shows" gives one figure the code does not compute, and leaves out the pilot's spending.**
   - "were each unit's pilot change the truth, D34 would flag it at 19,000 with chance 0.003 to 0.006" (l.107) is not that
     chance. `flagChance` clamps a gain to a true change of nought (`size-household-hsp.mjs` l.48), so 0.003 to 0.006 is the
     chance at no change. At the pilot's own changes the chance is 0 to double precision on every unit.
   - I read the pilot by the registered rule (seed 7002, EXPLORATORY). S037 is retired at 68/65, the rehearsal's S025 shape.
     - On the paths both keep, it spends less on 7 of its 10 units, each beyond noise: from -0.475% (S037-Y90) to -2.540%
       (S037-G8Y75).
     - Over all paths it spends less on 9 of them, from -0.275% to -3.183%.
     - M1 names those 7, while every class still opens (pooled spending on the paths both keep +2.795% to +3.575%).
   - So the registered read will most likely go to the maintainer before any default changes. Print the pilot's part 3 and
     M1 beside its survival, so the maintainer knows this before the launch.

4. **MINOR. No registered couple retires before its pension can be drawn, though 30 of the 83 held-out couples do.**
   - Every plan's access age is 58 (`privatePensionAge`). S037 retired at 66, S119 at 60, and S199 and S279 retire at 60.
   - The frozen order holds 17 couples aged 56/53 who retired at 55 (positions 23 to 39) and 13 aged 50/47 who retire at 50
     (positions 70 to 82).
   - The household table reads the merged pension as open from the first person's access age (`src/solver/household.js`
     l.28). That approximation matters most during such a bridge, and most of all for Y, where the younger partner holds the
     pension.
   - A pass would open those couples by inference. The inference rests on three exploratory or inside-the-guard reads, all
     positive:
     - the rehearsal's S351F and S357F, couples already used, on the tuning seed;
     - the household-arm read's S337F shapes: penB90 +3.550 and gap12 +0.575 above K2 (`results-household-arm.txt` l.58 and
       l.55);
     - step 8's younger cohort, inside the guard.
   - The registration says the younger cohort "has no couple left untouched" (l.43 to 44). That is true, but it is not why
     the bridge is missing: the library's held-out couples have it.
   - Say so in the inference list, or add a bridge couple from the frozen order, chosen on its plan inputs alone.

5. **MINOR. The inference list leaves out five reaches that the Outcomes take.**
   - A couple entered younger first, solved on its mirror (`SWAP_ELDER`). Every unit has the elder first.
   - A couple with no minimum pot set, the page's default. That is 126 of the library's 210 couples, and D136 (1) gives each
     one year of its target. Every unit sets a minimum pot, from £35,000 to £1,080,000.
   - S opens "whatever the split" (l.79), but only 75/25 is read. Two people of the same age holding 90% to 100% are not
     between the splits tested.
   - Y at age gaps wider than the library's three years, without other taxable income. Y's opening reaches any gap, and only
     G8Y75, which has an income, reads a wider one.
   - G with the elder holding more than 60%. G's opening reaches up to the elder's ceiling, but G reads 60% (G8, G12, G12P)
     and the younger holding 75% (G8Y75) only.

6. **MINOR (for the reviewer on the change of default). The guard's refusal check should be held equal on the plan the
   route reads, and should fail closed.**
   - The guard reads the plan as entered. The client asks `householdPlanFor` of `mirror || plan` (`src/solverClient.js`
     l.256 to 258), and takes today's route on any refusal (l.262 and l.304).
   - The mirror swaps `tierCeiling` and `tierCeilingPart` (`src/coupleOrder.js` l.69). So the partner's-limits refusal can
     differ between the plan as entered and its mirror. The equality test should take couples entered younger first.
   - A miss would put an opened couple outside today's guard onto today's route, which is the measured harm D141 avoids.
   - One check in the client closes it: if the household plan refuses a couple that the guard, as it stood before the
     change, keeps off, that couple keeps the app's rules and does not take today's route.

7. **MINOR. Three gaps in the registered mode and the gate.**
   - **The panel file can be switched.** The panel comes from `COUPLES_OPEN_PANEL` where that is set
     (`couples-open-panel.mjs` l.99), and the registered mode does not refuse it.
     - Audit l.188 refuses `CO_*` alone. Phase 4's registered audit refuses `P4_PANEL` (`audit-phase4.mjs` l.152).
     - With it set to the rehearsal panel, `REG=1 node research/solver/audit-couples-open.mjs --units registered` lists the
       rehearsal's 40 household-route units, starting with S025-Y75.
     - The batch's dry run prints the same stamp, 811bdbded3f1, because `STAMP_DATA` names the default file.
     - A stray variable would spend seed 7026 on couples already used, under the registration's stamp. The read refuses such
       records by id, but by then the seed is spent.
     - Refuse the variable in the registered run and in the read, with a plant.
   - **The gate does not hold a record's class and variant to the panel's.**
     - `want` holds only id and route (`reduce-couples-open.mjs` l.61 to 95).
     - The class check skips a record that has no class (l.78).
     - The rule takes its classes from the records (l.106).
     - So a record with no class would drop out of every class while the gate passed. As built, the audit writes both from
       the stamped panel, so this cannot happen. A check against the panel, with its plant, would close it.
   - **The stamp is not stated.** The registration leaves it to be "filled by hand at the launch commit" (l.109). This
     review read code 36e4d2a860b2 and audit 811bdbded3f1. State them, so that a launch on any other stamp comes back to
     the reviewer.
