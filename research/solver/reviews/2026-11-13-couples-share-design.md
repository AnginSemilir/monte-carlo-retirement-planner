# Design review: item 6's stage C, `registrations/couples-share.md` (before launch)

13 Nov 2026. The `reviewer` agent, at the registration's design (CHECKLIST 2), on the main tree at fdf994a9: code-id
7002a1fec94c (the panel's landing code), `stampFilesHash()` 0332f08e77d4 (the pilot's). Nothing of seed 7021 or 7022 was
run or read; `d4-backup` and `d4b-backup` were not opened; no file but this one was edited.

## What I read (git blobs at fdf994a9)

- `registrations/couples-share.md` 00b53200cfc2.
- The panel: `couples-share-panel.mjs` 2476bda6d1df, `couples-share-orders.json` 57270d174efc, `couples-share-panel.json`
  16ec3d233bfa, `results-couples-share-panel.txt` 737aa8fdf8dd, and the 13 landing records in `results/share-c-land/`.
- The run and the read: `audit-couples-share.mjs` 7057129dfce8, `reduce-couples-share.mjs` 2caa97b398e7,
  `size-couples-share.mjs` ff194c268830, `couples-share-paths.json` 5522a142c347, `results-couples-share-sizing.txt`
  0ac06535def6, `batch-couples-share.sh` 5313f8c3d90d, the pilot's 27 units in `results/share-c-pilot/` (seed 7002),
  `check-prediction.mjs` 260436a43d48 (the reservation, fc3a777a).
- What they borrow: `audit-couples.mjs` f50aa99da601, `reduce-couples.mjs` cae05c5a8e75, `reduce-phase4.mjs` ac319aad1f44,
  `audit-phase4.mjs` 5ace83959b96, `fair-gate.mjs` 4d4a20402b1c, `size-phase4.mjs` f66f13d055ed, `select-phase4.mjs`,
  `phase4-panel.mjs`, `held-out.mjs`, `select-7u-broad.mjs`, `audit-share.mjs`, `code-id.mjs`, `run-from-snapshot.sh`,
  `run-unit.sh`; `src/solver/couple.js` f66038d648b3, `src/solverApp.js` 9b354ce6f980, `src/solverSettings.js`
  85fa071d7421; `research/engine.mjs` as generated (buildContext, wrapperHeadroomAtYear, stepYear, resolveMpaa,
  pathsForSeed); the uncommitted `src/couplesSwitch.js` in the main tree (the guard as being built).
- The source design: `research/reviews/2026-11-09/EXPERIMENTS-AND-PORTS.md` on origin/review/external-2026-10-21
  (a8fab383): item 6 (stage C, lines 520-545), item 8 (lines 610-630), item 9 (line 636 on). STATE.md D34, D61, D66 (M4),
  D80, D93, D94, D95; `reports/2026-11-13-d4b-stage-gate.md`; `reviews/2026-11-13-couples-d4b-amendment-1.md`;
  `reviews/2026-11-07-couples-d4-design.md`; `results-share-a.txt`.

## What I ran

- The four `--planted`: all pass (the panel 11, the audit 7, the read 12, the sizing 5).
- `reduce-couples-share.mjs --pilot` (seed 7002, EXPLORATORY): the gate fair on the pilot's nine units and every item
  printed. CANDS less APP +4.1 to +12.3 points a unit; CANDS and CANDH the same on the three units with a feature; CANDH
  (the share at 0.5) below APP at 90/10 on all three pilot couples (S015-90 65.9% against 86.5%, S211-90 76.2% against
  85.7%, S389-90 83.0% against 85.4%).
- `check-prediction.mjs` on the registration: incomplete only for this file. `--seeds` on the launch command with the batch:
  "seeds: none registered in the command or its scripts".
- Scratch scripts, plan-level or seed 7002 only, in
  `/tmp/claude-0/-home-user-monte-carlo-retirement-planner/4e4f86b0-577d-55d5-8df9-2dbd990f8aaf/scratchpad/scdesign/`:
  `closure.mjs` (the audit's and the read's import closure against STAMP_FILES and code-id's files); `inputs.mjs` and
  `mpaa.mjs` (each unit's APP context, arm A searched on 7001 as the landing searched it, against its solver arms' context
  from `solverPlan` with guardrails and the lookahead off; no solve, no path: the inputs hash with and without the MPAA
  ages, and the deposit schedules); `features.mjs` and `reheld.mjs` (the 36 units' holdings, shares and features as the
  engine and each person's single plan read them, and the panel file against the landings); `power.mjs` (D34's rates at
  19,000 paths by discordance).

## Verdict

Verdict: FAIL

Two BLOCKING findings, each a small change before launch, and five MINOR. Much of the design holds (last section).

## Findings

1. **BLOCKING. The read's deciding arithmetic, its provenance check and the registered paths are outside the unit stamp,
   so the read can change after the run without the gate seeing it.**
   - The registration (lines 8-12) says the stamp covers "every file the run and the read take beyond" the code.
     STAMP_FILES (`audit-couples-share.mjs` line 57) does not list `reduce-phase4.mjs`, `fair-gate.mjs` or
     `couples-share-paths.json`.
   - Every deciding figure passes through `reduce-phase4.mjs`: the pooled gain is its `survivalItem`
     (`reduce-couples-share.mjs` lines 24 and 158); each unit's loss, discordance and flag come from `harmOf`
     (`reduce-couples.mjs` lines 253-256), which calls its `lossOf` and `harmFlag` (`reduce-couples.mjs` line 79;
     `reduce-phase4.mjs` lines 125-129). Rules 1, 2 and 3 are all computed in an unstamped file.
   - `fair-gate.mjs`'s `requireFairLogs` (`reduce-couples-share.mjs` lines 146-147) is the only check that the
     registration is the blob the run was launched under.
   - `couples-share-paths.json` sets each unit's N at run time (audit lines 115-119) and the gate holds each unit to the
     file as it stands at the read (read lines 59-63 and 149), not as it stood at launch; RESUME keys on code and audit
     alone (batch lines 18-19), so an edit between windows is not refused.
   - `closure.mjs`: in the closure of the audit and of the read, and in neither stamp: `reduce-phase4.mjs`,
     `fair-gate.mjs`, `stage-couples.mjs`, `couples-d4b-amendment.mjs`, `audit-7uf-checks.mjs`, `research-opts.mjs`,
     `e3pcls-pin.mjs` (with the panel builder's `held-out.mjs`, `scan-touched.mjs`, `select-7u-broad.mjs`,
     `panel-7u.mjs`, `code-id.mjs`).
   - This is the class of the 7 Nov design review's BLOCKING 2 on D4 (`reviews/2026-11-07-couples-d4-design.md` line 78),
     whose fix sits in the couples' re-run's list (`audit-couples.mjs` line 108 holds `reduce-phase4.mjs`,
     `fair-gate.mjs` and `couples-paths-d4b.json`). This run spans at least two 12-hour windows (15.3 hours on four cores).
   - Fix: add those files to STAMP_FILES (or derive the list from the import closure, as `code-id.mjs --smoke` does, plus
     the panel and paths files), with a planted case that an edit to each changes `stampFilesHash()`. No new landing or
     pilot is needed: code-id does not move, and the sizing checks the pilot's code and seed, not its audit.

2. **BLOCKING. A PASS takes the guard off for every couple outside 40% to 60%, but the panel holds only couples whose
   older partner holds the larger share, at 75% or 90%.**
   - Outcomes (lines 75-77): PASS makes `shareRule: 'pots'` the couples' default "and the guard comes off". The guard (D66
     M4) keeps the app's rules for a first person holding under 40% or over 60% of the pots; as being built
     (`src/couplesSwitch.js`, uncommitted, `coupleSolverOn`) it turns the solver on only inside the band, so a PASS turns it
     on for every holding.
   - In every panel couple the first person is three years older (`results-couples-share-panel.txt`: 68/65, 61/58,
     56/53, 55/52, 45/42, 50/47), and every re-held unit has that older person holding 75% or 90% of each wrapper
     (`reheld.mjs`: all 24, every total kept). No unit has the younger partner holding the larger share (a first person
     under 40% in the library's order, or in the app a "Myself" who is the younger), and none holds over 90%, where
     `shareFor` holds the share at 0.95. Stage A held the same direction only (`results-share-a.txt`: 65/35 to all-one).
   - `shareFor` is symmetric in the two people; the couples are not. The younger person reaches pension access and the
     state pension three years later, so under a younger-heavy holding the larger table carries the longer bridge (S389,
     both retiring at 50, access at 58: the older's pension opens after 8 years, the younger's after 11). Nothing measured
     says the pot share does no harm there. The review's item 8 itself names the library's fixed three-year gap among what
     the library never holds (EXPERIMENTS-AND-PORTS.md line 617).
   - So the test would pass with a harm present on those holdings: none is in the panel.
   - Fix before launch, the maintainer's choice: scope the PASS to what is measured (the guard comes off where the older
     partner holds 60% to 90%; the other holdings keep the app's rules until a test of them reads); or add the mirrored
     holdings (the younger holding 75% and 90%, landed and piloted as the others, about 40 more core-hours); or have the
     maintainer accept in writing, before launch, that a PASS lifts the guard for holdings the panel does not hold.

3. **MINOR. One stage at 19,000 holds D34's 1-point rate only to 12.45% discordance. The registration justifies the
   shortfall by units gaining about 12 points, where it is moot; stage A shows it can fall on a near-neutral unit, where
   it is not.**
   - `power.mjs` (`size-phase4.mjs` `thresholdFor` and `harmRate` at 19,000; the quarter-point rate 0.049 to 0.050
     throughout): the 1-point rate 0.901 at 12.45% discordance, 0.855 at 14.5%, 0.825 at 16%, 0.782 at 18%, 0.766 at 19%,
     0.729 at 21%; D34's own size 23,000 at 14.5%, 28,000 at 18%, 33,000 at 21%.
   - Registration lines 54-56 cite only the oldest couple's re-held units, "each discordant because the candidate saves
     about 12 points of paths there". Stage A's S267 at 90/10 under the pot share (`results-share-a.txt` line 33): d -0.8
     points with 92 of 500 paths discordant (18.4%): near no change at high discordance, where a true 1-point loss would
     be missed about a fifth to a quarter of the time at 19,000. The pilot's three couples hold no such unit; nine
     couples are unpiloted.
   - D61 amended D34 (2) and (4) "for D4"; the registration applies it here ("as D61 ruled for D4") without saying that it
     takes the maintainer's word for this run.
   - Recommendation (asked for): keep one stage at 19,000, the registration stating plainly that the rate may fall on a
     near-neutral unit (the figures above) and that D61's form is applied to this run by the maintainer's launch. Item 9's
     two stages at the same N change neither rate (its own figures: 0.9005 against 0.9010 at 12.45%); they would save
     about three quarters of the machine time (every pilot unit gains 0.5 points or more at 5,000) at the price of a
     registered stage gate, the step that stopped the couples' re-run. D34's own sizes from this pilot (up to 23,000) add
     paths only to units gaining about 12 points, where the rate is moot. If the maintainer wants D34's 0.90 held where it
     can bite, more paths must go to the near-neutral units: item 9's two stages with the second stage at D34's size for
     about 19% (30,000), the gaining units stopping at 5,000 and the exact rates from `size-phase4.mjs` `twoStageRate` in
     the sizing file; or every unit at 30,000 in one stage (about 95 core-hours).

4. **MINOR. Leaving the MPAA ages out of the plan check is right in effect, but it is not the remedy D94's ruling adopted,
   and the registration does not say so.**
   - From the plans alone on all 36 units (`inputs.mjs`): every unit's arms agree on the inputs with the MPAA ages left
     out, so the gate will not refuse on plans; 7 of 36 differ in a person's MPAA age, APP against the solver arms: S015-db
     none/65 against 68/65, S183-75 60/60 against 60/58, S265-75, S265-90, S265-spa67, S291-75 and S291-90 60/60 against
     58/58.
   - Why it moves no money: the engine reads the age only in `buildContext`, as a pension's room for dated deposits,
     staged transfers and the Auto deposit (`wrapperHeadroomAtYear`, `research/engine.mjs` line 3555, used at lines
     1797-1909), and in the windfall and savings splits, which the candidate does not take; `stepYear` (lines 2095-2847)
     never reads it. The inputs hash still compares `oneOffContribs`, `stagedTransfers` and `oneOffStaging`
     (`audit-phase4.mjs` line 77), so an age that moved a deposit would still be refused. S291-75's and S291-90's one
     deposit (£81,000, Auto) lands in 2038 at 57, before the earlier age, its surplus to the taxable account; S265 has
     none. The amendment's review found the same (`reviews/2026-11-13-couples-d4b-amendment-1.md`, MINOR 2).
   - But the report D94 ruled on recommended "the audit's solver arms will take arm A's MPAA ages from item 6's stage C
     on" (`reports/2026-11-13-d4b-stage-gate.md` line 57; the amendment's review, line 74: "the remedy named for the next
     test ... stand[s]"), and D94 accepted the re-run's difference "and nothing wider". The registration (lines 88-92)
     cites D94 in support of a wider acceptance, and the cause it gives ("arm A's pick may take the lump sum, the candidate
     has no lump-sum route") is not the mechanism: the solver arms' age is `prepareForSolve`'s `resolveMpaa` on the plan's
     own named policy's expected path (as the app resolves a solved plan's), not anything the candidate draws.
   - Fix: state the departure and the reason above in the registration; add a planted case on real contexts (a unit whose
     arms' ages differ across a pension deposit staged over the earlier age is refused).

5. **MINOR. The log line that carries a unit's engine timing also carries its survival, and the registration lets the
   agent read "its timings" before the read.**
   - `audit-couples-share.mjs` line 168 prints `run CANDS: engine 99.2000 on 1000; engine secs 184 (184.5 ms a path)`
     (`results/share-c-pilot/case0.txt`); line 175 prints the rollout's survival. Registration lines 100-101: "the batch
     and the agent read only each unit's stamp line, its done line and its timings". A grep for the engine's seconds
     prints seed 7022's survival unit by unit; D4's pace script read each finished log whole to print its timings (STATE.md,
     item 1's statement; D67).
   - Fix: print no survival in the log (it is in the arrays), or narrow what may be read to the stamp line, the solve's
     seconds on the `ran` line and the done line.

6. **MINOR. The gate's gaps against the couples' re-run's.**
   - No planted case for: more than one code or audit across units, a unit's audit not the files', another prediction,
     another estate weight, an array not one a path, the couples' path flat or fast off, a shortlist or item 12's option
     ON (CHECKLIST 5). Each line reads right; the class was D4's MINOR 9.
   - No one Node version across units (the re-run's gate wanted one stamp, its Node version included: `reduce-couples.mjs`
     line 236), and RESUME keeps a unit on code and audit alone, not the launch's `PREDICTION_SHA` or Node version (D4's
     second design review, `reviews/2026-11-07-couples-d4-design-2.md` lines 86-92). A container restart between windows can change Node.
   - The by-unit line (`reduce-couples-share.mjs` line 155) prints the discordance, threshold and rates but not the bound
     the threshold is set at (`r.dUp`), which the decision rule says every comparison prints.
   - The launcher's seed check sees no seed in this launch (7022 sits in the audit, which the command does not name); the
     reservation is held by the audit's own `PREDICTION_FILE` guard alone.

7. **MINOR. Departures and disclosures not named.**
   - Features by place in the panel, not by "its place in the frozen order" (EXPERIMENTS-AND-PORTS.md line 622). With S073
     passed over, every couple after it takes the next feature in turn (by the frozen order S103 would take the DB
     pension, S129 the gain, and so on). Harmless: every candidate's five variants were landed (20:21 to 20:26 UTC) after
     the order was frozen (20:19:42 UTC) and before the walk, every one but S073-90 landed, and nothing of the solver was
     seen; say so.
   - One estate weight is named but given no reason; D4 and the couples' re-run read both. State why (0.02 is the app's
     default aim; the share rule does not touch the estate term) and that a PASS reaches the 'lower' aim by inference.
   - The even pick's stated reason ("where an uneven holding bites least") is contradicted by stage A: the 68/65 couple
     S007 at 90/10 under 0.5 read d -14.4 (`results-share-a.txt` line 8), as large as the others'. The pick stands on
     coverage (six age patterns, the bridge years, a state pension age of 67 that does something).
   - S265 is named in `research/policy-study/coupling.mjs` line 26 (the app's coupling study, 20 Sep: a confirmation
     command on S265 and S279 at 3,000 paths), beside the five named in `confirmed-results.json`. The app's rules only, no
     solver run; add it to the disclosure.

## What holds (checked, no finding)

- **Held out.** The frozen scan's 295 ids rehash to af1a9e309651; the pool (`couples-orders.json`'s library order less
  them, 114 couples) is in library order, and the even pick's twelve are its places 0, 9, 19, 28, 38, 47, 57, 66, 76, 85,
  95, 104 (S073 at 19), S019 the first reserve. Before 802ca0e2 the thirteen ids appear only in `couples-orders.json` (and
  S265 in the policy study, finding 7); the review branch, read whole, names none of them. Seed 7022 is named nowhere
  before 802ca0e2 on either branch (the earlier matches are hash substrings), and no seed congruent to 7022 modulo 7919
  (`pathsForSeed`'s stride) appears in either branch. No `share-c-run` folder exists and `runs.log` has no 7022 launch.
- **The panel.** Every re-held unit keeps every wrapper's total with the first person at 0.75 or 0.9 of each, and no
  account falls outside the re-holding's categories; `shareFor` gives 0.75, 0.9 or 0.5 exactly as wanted on all 36. The
  features reach the engine and both persons' single plans: the DB pension the first person's, £15,000, taxable, from 68,
  in the first person's table only; half of each taxable account a gain, in the engine's and the model's basis; the state
  pension age 67 for both. The panel file matches the landings unit for unit, on the code the run requires (the code now).
- **The arms.** `configOf` gives 27d2a7c7ee9d and af001697ce1b; `solveForApp` spreads `research` after the candidate and
  `solve.js` sets `tieAboveCap` only when defined (line 2914), so the tie-break is off and D80's guard reads none (the
  pilot's records: `tieBreak off:tieMargin`); each person's settings are checked against the re-run's WANT, run and read.
- **Pairing.** Path i is `gaussianPath(seed + 7919 i)` whatever the count, so CANDH's first 1,000 paths are CANDS's.
- **The test sees the fault it exists for, on the holdings it holds**: a CANDS not at `shareFor`'s share is refused by the
  audit and the gate (planted), and the pilot shows the harm rule would flag the half share at 90/10.
- **The budget and the run.** 61.3 core-hours as the sizing prints; the longest unit 2.5 hours, inside a window; RESUME
  keeps finished units; a wipe costs a rerun with nothing read, as the registration says.
