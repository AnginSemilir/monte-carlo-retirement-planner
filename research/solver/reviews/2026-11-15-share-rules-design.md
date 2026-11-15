# Design review: the share rules' test, `registrations/share-rules.md` (before launch)

15 Nov 2026, 19:35 to 19:55 UTC. The `reviewer` agent, at the registration's design (CHECKLIST 2), on the main tree at
26d78e02 (HEAD moved to f9b382e6 during the review, which adds one line to `runs.log` and nothing else): code-id
c0dcfa9ef2f2 (the panel's), `stampFilesHash()` 45a34b0c61dc. Nothing of seed 7023 or 7021 was run or read; `d4-backup` and
`d4b-backup` were not opened; `results/share-rules-run` was only tested for existence (absent); `results/tie-c2-7001` was
not touched. No file but this one was written in the repository.

## What I read (git blobs at 26d78e02)

- `registrations/share-rules.md` 6be605f12a8b; `audit-share-rules.mjs` 7bb8052cbef3; `reduce-share-rules.mjs`
  b1ab4d44fef1; `batch-share-rules.sh` 7b21acc995e5; `size-share-rules.mjs` 159f021c806d; `share-rules-panel.mjs`
  168dcae982f6; `share-rules-panel.json` 9349aa206f9c; `share-rules-orders.json` ef3bffb6c4ee; `share-rules-paths.json`
  bc7091df6ac5; `results-share-rules-panel.txt` cea03391eff0; `results-share-rules-sizing.txt` 4c649bde9fbb;
  `check-prediction.mjs` ec4dfb8038ad; `paired-exact.mjs` ab68627187ab.
- What they borrow: `fair-gate.mjs` 4d4a20402b1c (`checkLogStamps`, `requireFairLogs`, `declaredCorrection`);
  `reduce-couples.mjs` cae05c5a8e75 (`harmOf`); `reduce-phase4.mjs` ac319aad1f44 (`byPath`, `survivalItem`, `spendingItem`,
  `lossOf`, `harmFlag`); `size-phase4.mjs` f66f13d055ed (`thresholdFor`, `harmRate`, `sizeFor`); `audit-couples.mjs`
  f50aa99da601 (`wantProblems`, `coupleProblems`, `d80Of`); `audit-couples-share.mjs` ac476126024d (`COUPLES_CANDIDATE`,
  `settingsOf`); `audit-phase4.mjs` 5ace83959b96 (`runPath`); `run-from-snapshot.sh` cf7ab99bb4ec; `code-id.mjs`
  f00aa5b3bd48; `reduce-couples-share.mjs` 7f694a1d419f (its stamp gate, for comparison); `src/solver/couple.js`
  9fa640a0ceca (`shareFor`, `meansOf`, `shareBy`, `solveCouple`); `src/solverCouple.js` c3a002068ca4; `src/couplesSwitch.js`
  84f2038f792e; `src/solverSettings.js` fb3004da3841 (`APP_COUPLE`); `research/tests/couple-share-rules.test.mjs`
  73aa497e3488.
- The precedent: `registrations/couples-share.md` 94548edcce1b and its two design reviews; STATE.md D99, D102, D104, D105;
  `reports/2026-11-14-share-choose-read.md`; `results-share-choose.txt` and `results-share-choose-beside.txt`.
- The pilot's 33 records and logs (`results/share-rules-pilot/`, seed 7002) and the two landings
  (`results/share-rules-land/`, `results/share-rules-land-prev/`).

## What I ran (each at nice 19; scratch scripts in
`/tmp/claude-0/-home-user-monte-carlo-retirement-planner/4e4f86b0-577d-55d5-8df9-2dbd990f8aaf/scratchpad/review-share-design/`)

- The planted suites: the read 12, the audit 8, the sizing 5, the panel 16: all read as they should.
  `couple-share-rules.test.mjs`: 5 passed; `--planted`: 'flatband' fails exactly check 2, 'meansnoinc' exactly check 3.
- `check-prediction.mjs` on the registration: NOT COMPLETE only for the Design review. `--seeds` as the launcher calls it:
  under `share-rules.md` "seeds: 7023"; under a measurement and under `couples-share.md`, refused.
- `code-id.mjs` c0dcfa9ef2f2 (the panel file's `code`); `stampFilesHash()` 45a34b0c61dc, the same in a `git archive`
  copy of HEAD (`tree/`). `closure.mjs` with a resolve hook: the 43 modules Node loads for the audit, the read, the sizing,
  the panel's script and `fair-gate.mjs` are all in the stamp or code-id's files.
- `share-rules-panel.mjs summary` again: byte for byte `results-share-rules-panel.txt`. The two landings: every variant's
  target, arm A's label, survival and shares the same; the panel's units the same as the first landing's.
- `size-share-rules.mjs` in the scratch copy on the pilot: byte for byte `results-share-rules-sizing.txt`, and
  `share-rules-paths.json` the same but its `built` time.
- `pilotgate.mjs`: the read's own `gate` and `compare` on the pilot (seed 7002) with the pilot's own audit stamp
  206aeb6bcf54: the gate fair; full inputs one per unit; each arm's own MPAA ages the ones taken; no fidelity gap.
  (`reduce-share-rules.mjs --pilot` itself refuses the pilot only on its audit stamp, the files having changed since.)
- `gateprobe.mjs`: each refusal the planted suite does not plant, on built records carrying a real settings line.
  `meansflat.mjs`: the units MEANS against FLAT compares, on built records for all 32 units.
- `rates.mjs`: D34's rates at 16,000 paths; `cmpBar` on every lattice threshold.
- The read itself, in the scratch copy, on two logs stamped as the launcher stamps them (finding 1), and the same read
  with the stamp gate's default blob.

## Verdict

Verdict: FAIL

Two BLOCKING findings, both in the stamped read, so both must be fixed before launch: as committed the registered read
cannot be made at all, and its choice between the two rules is not the registered one. Five MINOR. The design otherwise
holds (last section).

## Findings

1. **BLOCKING. The read's stamp gate refuses every unit the launcher runs, so the registered read can never be made; and it
   accepts units run by hand outside the launcher.**
   - `reduce-share-rules.mjs` line 158 calls `requireFairLogs(..., REGISTRATION, { blob: () => '-' })`: the form the
     EXPLORATORY reducers use under `'none'`, whose logs carry `sha -`. The registered reads pass no `blob`
     (`reduce-couples-share.mjs` line 156, `reduce-couples.mjs` line 540, `reduce-phase4.mjs` line 179).
   - The launcher stamps every unit with the registration's git blob (`run-from-snapshot.sh` line 66,
     `PREDICTION_SHA="$(git hash-object "$PRED")"`). `checkLogStamps` (`fair-gate.mjs` lines 258-269) compares it with
     `blob(prediction)`, here `'-'`; they differ, and `declaredCorrection` returns null when the registration is unchanged
     (line 238), so each log is "PREDICTION EDITED" and `requireFairLogs` exits 1 before the gate.
   - Shown on the read as committed, in the scratch copy, two logs stamped `prediction
     research/solver/registrations/share-rules.md sha 6be605f12a8b...` (the registration's blob now):
     `FAIR-TEST GATE: FAILED (stamps)` / `case0.txt: PREDICTION EDITED - 6be605f1 at launch, - now` (exit 1). With the
     default blob the same logs pass the stamps and the read goes on to its gate.
   - The check is inverted, not just strict: a log made by hand with `PREDICTION_FILE` set and no `PREDICTION_SHA`
     (`sha -`) passes it (`checkLogStamps` returns `[]`), where the default blob refuses it.
   - The read is in the stamp (`STAMP_ROOTS`), so after launch it cannot be changed without the gate refusing every unit
     on its audit stamp (line 65): 58 core-hours would end unreadable but by an amendment. No planted case reaches the stamp
     gate (the read's 12 checks: lines 117-145).
   - Fix: the default blob, as stage C's read; a planted case on logs stamped as the launcher stamps them: fair under the
     registration's blob, refused under another blob, `NOT-LAUNCHED`, another registration, and `sha -`. The audit stamp
     then changes and the registration names the new one.

2. **BLOCKING. The choice between the two rules is made on 24 units, not the registered 32: MEANS against FLAT drops the
   eight 90/10 units, and on the pilot's own records that flips the choice.**
   - The registration: "If both hold, MEANS is taken only if, against FLAT on the units where their shares differ ..."
     (lines 71-72); at 90/10 "the two arms take one solve" (lines 28-29); the audit's header: "on the 90/10 units the two
     are one share, and the read takes TODAY's runs for both" (`audit-share-rules.mjs` line 8). MEANS's share differs from
     FLAT's (0.9) on all eight 90/10 units (0.717 to 0.854).
   - The read: `compare(U, units, 'MEANS', 'FLAT')` (line 162) keeps only units with a FLAT record (line 97), and the batch
     never runs FLAT there (`unitsOf`, audit line 88; the gate refuses it, read line 58). Nothing stands TODAY's run in for
     FLAT's.
   - Built records for all 32 units (`meansflat.mjs`, no run): MEANS against FLAT as the read makes it compares 24 units,
     none of them 90/10; MEANS 2 points down on each 90/10 unit and 0.5 up elsewhere reads +0.500 (lower end +0.063)
     there, and -0.125 (lower end -0.520) on the registered 32.
   - The pilot (seed 7002, EXPLORATORY), through the read's own `compare`: as coded, 9 units, +0.222 (+0.040 to +0.404),
     its lower end above 0, so MEANS; with TODAY's runs as FLAT's on the 90/10 units, 12 units, +0.167 (-0.032 to +0.365),
     so FLAT. The registered rule and the read would make different rules the couples' default.
   - The planted choice checks hand `decide()` made-up objects (lines 127-133), so they never reach `compare()`'s unit set.
   - The same gap in the registration's text: "must agree path for path: the gate's identity check" (line 29) and the
     gate's "where two arms share a solve, the same on every path" (line 97). No line of the read checks it; no two arms
     share a solve.
   - Fix (either): in the read, TODAY's record stands for FLAT's where `flatRuns` is false, with a planted case (a 90/10
     unit where MEANS loses is in MEANS against FLAT), and the identity clause taken out; or FLAT run on the 90/10 units
     too (8 runs, about 5 core-hours), the gate checking it against TODAY path for path. Either way the read and its stamp
     change before launch.

3. **MINOR. The spending bar is registered in one unit and read in another.**
   - Registration line 69: "not lower than TODAY's by more than 0.05% of target". The read (lines 13, 106, 169) takes
     `spendingItem` (`reduce-phase4.mjs` line 126): each unit's change in lifetime spending delivered, path by path, in
     percent of that unit's TODAY mean, the units weighted equally, and holds the point estimate at -0.05.
   - It matters at this bar: on the pilot FLAT reads -0.0630% (se 0.0218; about 0.005 at 16,000 paths), past it.
   - Fix: state the read's unit in the Decision rule (the registration is what the read is held to).

4. **MINOR. The stamped read does not print what the registration says it reports.**
   - Primary metric (lines 60-61): the rollout beside the engine, "a path the two score differently is a fidelity gap,
     reported": the audit stores it (`beside`, line 182) and the read never prints it, so the run has no `runPolicy`
     beside in its output. Of "Reported, deciding nothing" (lines 83-88) the read prints each comparison's two shares
     and survival (line 165) and nothing more: not the means' share by kind of unit, the mean pot left or lifetime tax
     by rule, or the solve times (read lines 160-177).
   - The OUTCOME line (line 176) prints a PASS without the registration's scope (lines 77-78); STATE.md and the D-line
     are written from it (stage C's second review, finding 1).
   - Fix, before launch since the read is stamped: print them, or say in the registration that a script beside the read
     prints them from the arrays after it.

5. **MINOR. Most of the gate's refusals have no planted case (CHECKLIST 5).**
   - Planted: FLAT missing, FLAT where TODAY's, a share, seed, code (as "more than one"), plan, tie-break (lines 140-145).
     Not: the audit stamp, prediction, estate weight, Node version, the panel's code, a unit's paths, an array's length,
     arm A's pick, the target, the configuration, the couples' path flat or fast, a shortlist or item 12's option, a
     person's settings line (the planted gate filters every self/part line, line 139), and the stamp gate (finding 1).
   - `gateprobe.mjs`: each of those fires on a built record (for example "a unit's code is not the code the panel was
     landed on", "S023-45 MEANS self: pts 30 (want 45)"), so this is coverage, not a fault.
   - A note for any change of N: `harmExact`'s whole-path check holds for every threshold at 16,000 paths (j to 4,000);
     at 19,000 `cmpBar` throws on 3,790 of 4,001 thresholds (100 j / 19,000 does not terminate), and the same at 17,000
     or 18,000.

6. **MINOR. A PASS reaches couples the panel does not hold, and the registration names only "holdings between the
   panel's".**
   - The elder holding 40% to 45%: inside the band these couples run the solver today at a half (`couplesSwitch.js`
     lines 79-83); under FLAT their share would be 0.40 to 0.45, below the panel's lowest (45), in the direction the
     pilot shows FLAT losing (finding 7). The share choice's report asked that the test "either includes such couples, or
     the rule is scoped to what it tested" (`reports/2026-11-14-share-choose-read.md` lines 186-189); 45 is one such
     holding, 40 to 45 is extrapolation.
   - Equal ages (no elder; every panel couple is three years apart); means that part from the pots by more than the
     panel's (-0.215 to +0.081, S061-dbpart and S147-db); the 'lower' estate aim (one weight, 0.02, not explained as stage
     C's was).
   - TIE-C2 (D105) is running now; a pass makes its rule the couples' default. This run's arms carry no joint tie rule,
     and the hold reads each person's table's wealth top, six times their opening wealth or 60 years of their spending
     (`couple.js` lines 782-784), so the share moves it: a PASS here applied on top of it is by inference.
   - Fix: the Outcomes name these as reached by extrapolation or inference, or limit a PASS to what the panel holds; the
     maintainer's choice at launch. (S191 is named in the app's `policy-study/confirmed-results.json`, the app's rules
     only, as five of stage C's twelve were; stage C's registration said so.)

7. **MINOR. The registration does not say what its pilot shows about the likely outcome.**
   - The Paths line gives the pilot's discordances only. Its changes (`results-share-rules-sizing.txt` lines 2-22): FLAT
     loses on all three piloted 45 units (-0.70, -0.50, -0.80 points on 1,000 paths); MEANS loses 2.40 on S023-90 (27
     lost, 3 saved), flagged by the read's own `harmExact` at 1,000 paths.
   - `rates.mjs`, D34 at 16,000 paths: were those losses true, FLAT's three 45 units would be flagged with chance 0.929 to
     1.000 and MEANS on S023-45 and S023-90 with chance 1.000; FLAT's pooled spending (-0.063%) is past its bar. If they
     hold on 7023 the run reads NEITHER.
   - Fix: say so with the launch request, so the maintainer spends the 58 core-hours knowing it.

## What holds (checked, no finding)

- **Held out.** The frozen scan rehashes to 40836a8ffa0a (310 ids); none of the eight is in it, in stage C's or D4's
  panel, in TIE-C2.md's couples, or in any results file of the couples' reads (speed B, other order, tie rule, share
  choice and ensemble, sweep, item 12, tiers, stage C). The first eight of the frozen order are the panel. Seed 7023 as a
  whole number appears before its reservation (5f1a25af) only inside decimals (0.7023) on this branch, `main` and the
  review branch; no seed a multiple of 7919 away (`pathsForSeed`'s stride) is used.
- **The arms differ only in the share.** TODAY 27d2a7c7ee9d, FLAT d17e66b604a1, MEANS bd5c568d2f42 recomputed;
  `shareRule` reaches the solve only through the share (`couple.js` lines 242-243) and its record; TODAY is stage C's
  CANDS; the app's couple solve takes the same `shareBy` (`solverCouple.js` line 51). Paths paired by construction.
- **The test sees the fault it exists for on the holdings it holds.** A share not the rule's is refused by the audit and
  the gate (planted); D34 at 16,000 paths flags a true 1-point loss at least 90% of the time up to 10.50% discordance (the
  pilot's highest 3.00%), a quarter-point loss 4.5% to 5.0%; the flag in whole paths is `harmOf`'s on every loss tried.
- **The panel.** 32 units as the summary prints them; FLAT differs from TODAY on 24, MEANS on 32; every unit sets its own
  minimum pot, so the audit's household-floor check reads the panel's; the features reach the engine (the planted panel
  checks).
- **The stamp and the launch.** Every file the run and the read import is stamped or in code-id; the audit refuses a code
  other than the panel's (line 131) and the read a unit on another (line 66); the registered mode refuses limits and any
  prediction but this one; no log under the registration prints survival.
- **The sizing and the budget** reproduce from the pilot (58.1 core-hours, 14.5 hours on four cores, the longest run
  0.82 hours); the batch runs in index order, not longest first, so the end may come up to one run later.
