# Design review: the savings split's v2 (`registrations/save-v2.md`), before launch

20 Nov 2026. This is the reviewer agent's design review before a confirmatory launch (CHECKLIST 2; D130 (7), D133). The
registration is a DRAFT. Seed and Design review are open; Paths and Budget are provisional until the pilot and the sizing
are taken again on the final files.

## What I read

At HEAD eef8c374. The draft was committed in ccc42af5. The one commit since is step 8's read, which touches none of this
study's files, and the audit's stamp is 17ca54eedf37 before and after it.
- **The design:**
  - `registrations/save-v2.md` (blob 53ce9df4ea), `SAVE-V2.md` (1a14844532) and `SAVINGS-SPLIT.md` (289229f414);
  - STATE.md's D130, D133, D112 (M6), D34 and D95;
  - step 8's registration, for its form (`registrations/household-hsp.md`, fb070defb6).
- **This study's code:** `audit-save-v2.mjs` (22415495e6), `reduce-save-v2.mjs` (9cb8462981), `size-save-v2.mjs`
  (fcaeff29e1), `save-v2-panel.mjs` (68a3f892aa) and `batch-save-v2.sh` (e357485deb).
- **What that code leans on:**
  - `candidate.mjs` `solveCandidate` and `hashOf` (5484638a0a);
  - `audit-couples.mjs` `WANT` and `wantProblems` (f50aa99da6), and `audit-couples-share.mjs` `settingsOf`;
  - `audit-phase4.mjs` `runPath` (5ace83959b) and `audit-save.mjs` `choiceYears` (fd54695f17);
  - `reduce-share-rules.mjs` `harmExact` (b46fa5187e), `reduce-couples.mjs` `harmOf` (cae05c5a8e) and `size-phase4.mjs`
    `thresholdFor` and `harmRate` (f66f13d055);
  - `reduce-phase4.mjs` `byPath`, `survivalItem` and `spendingItem` (ac319aad1f);
  - `reduce-gainbucket.mjs` `flipTest` (f7b4e88f1f), `b7-verdict.mjs` `spendDiffs` and `seedOf` (18aa465877),
    `reduce-household.mjs` `cells` and `spendOn` (2a762db28f), and `stats.mjs` `holm` (a4095c8e33);
  - `size-household-hsp.mjs` `sizeOf` and `runN` (1a555ce15e), and `check-prediction.mjs` (818af86a4d).
- **The solver, the engine and the app:**
  - `src/solver/solve.js` (b3c20b3e7f): `coarseWhereFits`, `saveOn`, `splitCounts`, `withSaveCopies` and `runPolicy`;
  - the engine on code 71fb4271c681: `saveSplitRoutes`, `stepYear` step 2, `calculateMarginalRelief`, `grossUpNet` and
    `pathsForSeed`;
  - `src/solverSettings.js` (0684649dde), `src/solverApp.js` (484d5c38e1), and `src/App.jsx` (4f649bd7bb) line 12650.
- **The data:**
  - `save-v2-orders.json` (0a0c7179ef), `save-v2-panel.json` (40bc84062f) and `save-v2-paths.json` (a24e9a845f);
  - `results-save-v2-panel.txt` (d60e000275) and `results-save-v2-sizing.txt` (d1878f3373);
  - the 40 landing records (`results/save-v2-land/`), the pilot's four units and logs (`results/save-v2-pilot/`), and the
    preflight's logs so far (`results/save-v2-preflight/`).
- **The factorial before it:** `results-save.txt` (a970fad1a7) and its reviews (`reviews/2026-11-19-read-save.md`
  181daf7985, `-2.md` 12ad6e8475).

## What I ran

All of it light and at low priority. Nothing of seed 7025 was produced or estimated.
- **Planted checks:** `audit-save-v2.mjs --planted` passes 13 of 13. `reduce-save-v2.mjs --planted` reads ALL PASS (12),
  and the gate's 26 refusals all fire. `size-save-v2.mjs --planted` passes 4 of 4.
- **The arms' hashes (`configOf`):** CANDD 3a344e9f7ec6, CANDS 3f7b0397f544, CANDDA 17ff82379838 (= `CANDIDATE_HASH`) and
  CANDSA bf1cac401c13, as registered. CANDD's settings are the candidate's less `coarse`, nothing else. CANDS's are
  CANDD's plus `saveSplit`, nothing else.
- **The stamps:**
  - `stampFilesHash()` gives 17ca54eedf37, the preflight's.
  - `code-id.mjs` gives 71fb4271c681, the panel's.
  - `check-prediction.mjs` on the registration finds only Seed and Design review open.
- **The pilot's gate,** at the pilot's own audit 00c0d9bc90b7 and seed 7002: fair.
- **From the pilot's units** (seed 7002, EXPLORATORY): each household's paired spending noise, its beside record, and the
  pooled survival change's variance by path.
- **From the panel's plans:** each household's employment, salary, years with a choice and first net budget.
- **A search for 7025 in the tree:** it appears as a seed only in this study's files and the planning documents. Elsewhere
  it is digits inside a hex digest and a decimal. No literal in the scripts is `7025 + 7919 k` for k up to 40 but a
  money floor, 205000.

Verdict: PASS

## What holds

- **The arms differ in what is tested, and in nothing else.**
  - `solveCandidate` spreads the arm's base and then the run's own options: lambda, 45 points, 0.02, and `saveSplit` on
    the split arms (candidate.mjs 107-117).
  - With no `coarse` in the base, `coarseWhereFits` returns the options unchanged (solve.js 3022). So CANDD and CANDS
    solve on the whole menu, and the arms on anchors take the candidate's `coarse` where the solve can.
  - Before any path, each arm's settings line is held to the candidate's on its own menu (`coarse none` on the whole
    menu). Its `saveSplit`, save copies, failDelivered, lambda, tier state, switch charge and tie-break are checked.
  - The four arms are held to one plan (its inputs hash), one horizon and the same working years with a choice (audit
    197-212).
  - On the pilot, the paired arms' settings lines are equal byte for byte (CANDD = CANDS, CANDDA = CANDSA) on all four
    households.
- **The arms are paired on the same paths of a held-out seed.**
  - Each unit generates one set of paths, once (audit 213). The anchors arms run its first 4,000 (`nOf`).
  - `runPath` is held to `E.runTrial` on each arm's first 200 paths (239-240).
  - No other script uses 7025. A path's generator seed is `7025 + 7919 i` (`pathsForSeed`), so no path is shared with
    7002, 7005 or any other seed in the registry.
- **The panel is the one D133 (1) and (2) ruled, and it was drawn without reading any outcome.**
  - The pool is 63 households: 10 younger and 53 of the library's.
  - The orders were frozen on 20 Nov at 05:06 UTC, before the first landing at 08:21 UTC.
  - There are 40 landing records, all on code 71fb4271c681. Every household landed with working years to choose, and none
    was passed over.
  - No household is among the factorial's 27 or `save-split.test.mjs`'s six.
  - S254 and S266 are untouched, as the registration says. Arm A runs from 84.0% to 86.0%.
- **The rule the reducer computes is the rule as written.**
  - **Part 1** is `harmExact(CANDS, CANDD, n)`. It takes the net loss in whole paths against D34's threshold, set at the
    upper bound of the realised discordance, floored at 1.01% (reduce-couples.mjs 254; reduce-share-rules.mjs 99-105).
  - **Part 2** is `survivalItem`. Each path's change is averaged over the households, the interval is taken by path
    (Z 1.96), and its lower end must be above nought (reduce-save-v2.mjs 125, 132).
  - **Part 3, by household:**
    - each household's change is in percent of its CANDD mean;
    - its p is a one-sided `flipTest` on `spendDiffs(CANDD, CANDS)`, seeded by the household's id, with 20,000 flips;
    - Holm runs over the 40, and a household fails at a Holm p below 0.05 with its change below -0.1% (108-117).
  - **Part 3, pooled:** `spendingItem`, the households weighted equally, its point estimate not below -0.05% (126, 132).
  - The planted cases pin the directions (cases 2, 5 and 6), the interval by path (case 4), and the bar one path either
    side (case 8).
- **The pair on anchors cannot decide.**
  - The parts and the outcome come from the whole-menu comparison alone (131-134).
  - The pair's D34 flags are only named, and only under a PASS (145; planted case 9).
- **The gate refuses what it should.**
  - Each of its 26 planted faults fires.
  - It holds every unit to:
    - one code, the panel's;
    - one audit, the read's own files;
    - one prediction, seed, estate weight, count of points and Node version;
    - the registered paths;
    - each arm's configuration, arrays, menu and settings;
    - one plan, horizon and set of working years;
    - the target and arm A's pick;
    - its own launch log, with its done line.
  - `requireFairLogs` holds the logs to the registration's blob.
- **D130 (7)'s record is there.**
  - On the pilot, CANDS's beside record holds the save choice at each working-year decision: ISA first in 14,991 of
    15,000 on S300F, pension first in 14,880 on S330F, and pension first in every decision on S180 and S238.
  - It holds the tier pair taken (0 to 3), and the pots at the top of the first retired year, which are non-zero on every
    path.
  - `runPolicy` beside the engine differs on no path of 1,000 in any arm.
- **The engine counts the split's ISA money against the year's subscription** (engine.mjs 2218). So an ISA-first year
  cannot carry a sweep or a re-wrap on top of a full allowance, which is D130 (1)'s class.
- **The registered run is fenced.**
  - Its logs carry no outcome (audit 261).
  - It refuses limits, a code other than the panel's, another candidate, and any prediction but its own (179-183).
- **The paths give each part the power it needs.**
  - **Part 1:** at 16,000 paths, a true 1-point loss is flagged at least 90% of the time up to a discordance of 10.5%. The
    pilot's upper bounds are at most 2.59%.
  - **Part 2:** I estimated the pooled change's standard error at 40 households and 16,000 paths from the pilot's per-path
    variances and their covariances: about 0.014 points (0.010 were the households independent). So a pooled gain of a
    few hundredths of a point is read.
  - **Part 3:** finding 4.
- **The budget is the pilot's own measurement (D21).** The load at its chunks was its own four units, and S300F's 1.28
  hours can be re-derived from its record.

## Findings

1. **MINOR: the preflight should finish before launch, with no household refused. The registration does not say so.**
   - At 09:21 UTC the preflight (`results/save-v2-preflight-launch.log`, started 08:59 UK on audit 17ca54eedf37) had
     finished 4 of its 36 households: S302F, S312F, S318F and S324F. Each passed every check before any path in all four
     arms, and none was refused. Units 4 to 7 were running.
   - For the 36 households the pilot does not run, the preflight is the only test of the checks before any path (audit
     197-212):
     - arm A's pick against the landing's;
     - each arm's settings;
     - the split on, with its copies;
     - one plan, one horizon and the same working years.
   - In the registered run, a refusal ends that unit (exit 3). The gate then refuses the read for a household missing, as
     step 5's unit 20 did (D125).
   - **The ask:** name the preflight as a condition of launch, as step 8's was ("the preflight of the 25 units the pilot
     did not run, none refused", D131 and D132):
     - it must complete, with none refused;
     - it must run again if `audit-save-v2.mjs`'s checks, or anything they import, change after it.

2. **MINOR: part 3 is presented as the guard against S308F's kind of harm, but it does not reach the menu that ships.**
   - **What the registration says.** Lines 69-70: "S308F's harm in the factorial, `-0.250%`, would fail part 3: a
     household whose spending the split cuts is a harm, however the panel gains."
   - **Where that harm was seen.** The factorial ran both arms on anchors (`SAVE-V2.md` lines 10-11).
   - **What a PASS changes.** `saveSplit: true` joins the candidate, which carries `coarse`, so what ships is CANDSA
     (bf1cac401c13).
   - **What the read does with the pair on anchors.**
     - Under a PASS it names only that pair's D34 flags (`anchorsFlagged`, reduce-save-v2.mjs 133 and 145).
     - The households it finds lower in spending by part 3's own test are printed only in a line beside the rule (147).
     - So is the pair's pooled survival.
   - **The consequence.** Suppose the split cuts a household's spending on anchors alone. That is the approximation the
     factorial left open (registration lines 23-24). The split would PASS, and the default would change with the harm in
     a beside line only.
   - D133 (3) as ruled covers D34's flags alone, so this is the maintainer's to choose. Either:
     - under a PASS, the outcome also names each household that fails part 3's household clause on anchors, and the pair
       on anchors if its pooled survival interval lies wholly below nought; each goes to the maintainer before any change
       of default, deciding nothing, with a planted case; or
     - the registration says plainly that a spending harm on anchors does not stop the change.

3. **MINOR, for the maintainer: the split's own choice is priced on salary-sacrifice NIC relief that the engine leaves
   uncapped, though the law caps it from April 2029. The bias runs one way: towards pension first.**
   - **How the engine prices the choice.**
     - An employee's sacrifice is relieved of income tax and employee NIC in every year (engine `calculateMarginalRelief`,
       engine.mjs 1370-1387).
     - The split's two variants are each `grossUpNet` of one net budget (engine.mjs 3542-3546).
     - Employer pass-through is 0 by default (engine.mjs 444-445).
   - **The size of the bias.** Above the cap's £2,000, the engine credits pension first in the main band with
     1/(1 - 0.20 - 0.08) = 1.389 of pension a net pound, where the law gives 1/0.80 = 1.25. That is about 11% more. At
     the higher rate it is 1/0.58 against 1/0.60, about 3% more.
   - **The cap is known and stated, not modelled.** The app's caption (`src/App.jsx` line 12650) says the £2,000 cap on
     National Insurance relief for salary sacrifice from April 2029 is not modelled (D112 (M6)).
   - **How much of the panel it reaches.**
     - 30 of the 40 households are employees. The ten self-employed are S196, S202, S208, S214, S226, S238, S250, S280,
       S286 and S292.
     - Every household's choices start in 2026.
     - Of the 15 years to choose on the younger cohort and library places 16-29, 12 fall from 2029. Of the 5 on library
       places 0-15, 2 do.
   - **On the pilot,** the split took pension first in every decision on S180, an employee, and in 14,880 of 15,000 on
     S330F, also an employee.
   - **Why this is not a fairness fault.** Both arms share the model, so the comparison is fair within the app's model,
     and M6 is the maintainer's ruling.
   - **Why it still matters here.** This test's lever is exactly where a net pound of saving goes, and the unmodelled cap
     favours one of its two answers. A PASS would carry that into the default.
   - **The ask:**
     - the registration says this limitation bears on this test, and in which direction;
     - the read prints beside the rule, for CANDS, the share of employees' working-year decisions from 2029 that take
       pension first.
   - Whether to model the cap before this test runs is the maintainer's.

4. **MINOR: the registration does not state part 3's operating characteristic. No planted case shows part 3 catching a
   harm among forty households.**
   - **The bar is read on the point estimate.** Part 3 fails a household at a Holm p below 0.05 together with an observed
     change below -0.1% (reduce-save-v2.mjs 115). So a true loss of exactly 0.1% fails about half the time: the structure
     D3 had at 1 point.
   - **The noise, at 16,000 paths:**
     - on the pilot, each household's paired spending se (my computation from `results/save-v2-pilot`, scaled from 1,000
       paths): S238 0.0045%, S180 0.0075%, S330F 0.0136%, S300F 0.0152%;
     - on S308F in the factorial: 0.0562% at 4,000 paths (`results-save.txt` line 11), about 0.028% at 16,000.
   - **The rates, by the normal approximation.** The Holm condition is implied wherever the change is below -0.1%. At an
     se of 0.015% and of 0.028%, a true loss of:
     - 0.12% fails about 91% and 76% of the time;
     - 0.10% fails about 50% at either se;
     - 0.08% fails about 9% and 24%;
     - 0.05% fails under 0.1% and about 4%.
   - The factorial's -0.250% would fail with near certainty.
   - **The ask:** put these rates in the registration's Decision rule or Paths, as D34 (4) has them for survival, so the
     maintainer reads what 0.1% means before the launch.
   - **The planted cases.**
     - A harm is caught with three households, so Holm runs over 3 (case 5). A noisy loss among forty is missed (case 7).
     - None shows a harm caught among forty. That is what keeps part 3 from going blind if `FLIPS` were ever lowered:
       `reduce-gainbucket.mjs` line 60 sets 20,000 flips, the smallest p is 1/20,001, and 40 times that is 0.002.
   - **The ask:** add a planted case in which an S308F-sized loss (-0.25%, with per-path noise) among forty households
     fails part 3.

5. **MINOR: the pilot does not sample the library's households with fifteen working years, and its rerun must have the
   machine to itself (D21).**
   - **Which households the pilot takes.** `PILOT_PLACES` (audit-save-v2.mjs 66) takes library places 0 and 15, S180 and
     S238. Both have 5 working years. Places 16-29, fourteen households, have 15 (`results-save-v2-panel.txt`).
   - **How the sizer covers them.** It scales those fourteen from S180 and S238 by horizon alone (size-save-v2.mjs 86-89).
   - **Why that undercounts.** The split's cost grows with the years to choose, not only with the horizon:
     - CANDS's solve is 1.25 times CANDD's on the younger households with 15 years, and 1.08 times on the library's with 5;
     - CANDS takes 109 to 121 ms a path there, against 80 to 88 ms here.
   - The budget is modestly short for those fourteen. Their discordance is not sampled either.
   - **The ask:** put one library place among 16-29 in the pilot, or take those households' solve times from the
     preflight's logs, which record all four solves of every household.
   - **The rerun's timing.** The pilot on the final files must run after the preflight has finished, which is on all four
     cores now. Otherwise its budget is not measured with nothing else running.

6. **MINOR: a PASS reaches more than this run measures. The Outcomes should say how far.**
   - **Where the split would land.** Joining the candidate means joining `APP_CANDIDATE` (`src/solverSettings.js`
     15-23), which every solve in the app takes (`src/solverApp.js` 55: `asked = { ...APP_CANDIDATE, ... }`).
   - **What that includes.** Each person's table of a couple, since couples run the solver (D99; each person is solved
     through `solveForApp`, as `audit-couples.mjs` 106 does).
   - **What the Outcomes rest on.** "A couple's plan does not take the split" (registration line 76) rests on
     `SAVINGS-SPLIT.md` line 47. That line cites D42 ("a couple's plan keeps the app's rules"), which lapsed with D99.
     Nothing in the code keeps a couple's person-solves off the split.
   - **What the run measures, and what it does not.**
     - It measures the dial's position 1, with consent given, at 0.02.
     - A PASS also reaches the locked positions 3, 6 and 10, consent withdrawn (one tier pair, on the whole menu), and the
       speed mode.
   - **The ask:**
     - the PASS line commits the change of default to a guard that keeps a couple's solves off the split, with its test
       and plant;
     - it lists the solves it reaches untested, for the maintainer, as D95 did for the tie-break.

7. **MINOR: three things should be printed beside the rule.**
   - **The estate by household.**
     - The product question includes the estate (STATE.md section 1). The rule leaves it out ("survival first, then
       spending").
     - The report prints the pot left only as two panel means (reduce-save-v2.mjs 152-153). By household it prints the
       pots at the top of the first retired year (161), not the pot left.
     - In the factorial, S308F's estate rose by a mean of +£424,840 a path while its median fell by £25,840 (STATE.md;
       `reviews/2026-11-19-read-save.md` finding 3).
     - **Print** each household's pot left, CANDS less CANDD, its mean, its median and the capped pot, as the earlier
       reads did.
   - **The cohorts.**
     - The pilot's survival gain sits in the younger cohort: +1.60 and +0.80 there, against +0.10 and +0.00 in the
       library's (`results-save-v2-sizing.txt`).
     - The younger cohort carries a quarter of the pooled weight.
     - **Print** the pooled survival and spending by cohort.
   - **The shape of a spending harm.**
     - The factorial's audit kept each path's level in every year (`audit-save.mjs` 104 and 108, `level`), and its
       reviewers needed those levels to show where S308F's harm lay.
     - This audit runs `runPath(ctx, paths[k], false)` and keeps none.
     - **Keep** each year's level, on all paths or at least on the beside paths. Then a household that fails part 3 can be
       shown without another pass over the held-out seed.

8. **MINOR: the Outcomes and what may change after this review.**
   - **(a) A gate refusal is missing from the Outcomes.** It gives no outcome, and goes back to the maintainer with no
     result of seed 7025 read.
   - **(b) A FAIL on part 2 alone closes the split, even with spending up beyond noise.** The question orders "survival
     first, then spending", and that ordering would call level survival with more spending better. On the pilot, S238 has
     no path discordant (0 of 1,000) and spends +0.3228% more.
     - Either say the rule takes a survival gain as the gain, or add the other reading.
     - Either way, the maintainer should see it before the launch.
   - **(c) The registration does not say what else may change after this review.** Step 8's registration said: "After the
     pilot is read, only Paths, Budget, The launch, What the pilot shows and Design review change; anything else goes
     back to the reviewer" (`household-hsp.md` line 13). This one says Paths and Budget are provisional, and stops there.
     - Add such a clause, so this PASS covers a bounded set of later edits.

9. **MINOR: the gate checks each arm's settings line against a list of wanted values, not against its paired arm's
   line.**
   - `WANT.CANDC` leaves out mix, levels, raiseW, finalIntegral, tierState, minPot and readerYears (audit-couples.mjs 187).
   - Those fields are recorded but compared to nothing.
   - On the pilot, the paired lines are equal.
   - **The ask:** have the gate require CANDD's line to equal CANDS's, and CANDDA's to equal CANDSA's. That is the fair
     test's diff of the settings each run recorded (CHECKLIST 3), and it costs one line and one planted refusal.
