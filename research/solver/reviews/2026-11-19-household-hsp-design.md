# Design review: step 8, the household plan priced at the pensions' split (HSP) against today's couples' default (K2) and the app's rules (APP), `registrations/household-hsp.md` (DRAFT; D129 (3); before launch)

19 Nov 2026, about 01:15 to 01:50 UTC. The `reviewer` agent, first round, on a draft whose pilot, sizing, Paths and Budget
are not yet done; reviewed as designed. Main tree at 96c26bab (work-i58m0x, pushed as claude/project-access-i58m0x; clean;
HEAD did not move during the review): code-id 603eeb595679 (the panel's), `stampFilesHash()` 4fe11f21a31b (before
`household-hsp-paths.json` exists), the registration's blob aa3f2f50bee3. Nothing of seed 7024 was run or read;
`results/joint-wide-7002-stopped/` and `research/solver/archive/` were not opened. Every probe ran at nice 19 with 11 GB or
more free, beside the savings factorial's four processes; none ran more than 20 paths of a household; the only seed-7002
outcomes read are the remedy read's stored arrays, already read and reviewed. Scripts and outputs:
`/tmp/claude-0/-home-user-monte-carlo-retirement-planner/4e4f86b0-577d-55d5-8df9-2dbd990f8aaf/scratchpad/hsp-design/`. No
repository file but this one was written.

## What I read (git blobs at 96c26bab)

- The design: `STEP8.md` 5b58639ec629; `registrations/household-hsp.md` aa3f2f50bee3; `STATE.md` c1c2a08c4e0d (D3, D34,
  D80, D95, D116, D128, D129); `CHECKLIST.md` 45e387294c8d; `DECISIONS-PENDING.md` b29344fc9117 (items 3 and 4); the
  external review's next step 6 (`git show f1f44727:research/reviews/2026-11-17/ANSWERS.md`) and `PRESCRIPTIVE-PLAN.md`'s
  step 8 at the same commit.
- The read that took HSP: `results-household-remedy.txt` 85efb2a0eba1, `reports/2026-11-19-household-remedy-read.md`
  c43b6846de54, `reviews/2026-11-19-read-household-remedy.md` 3c436af7870e, its 28 unit files
  (`results/household-remedy-7002/`, seed 7002); `reports/2026-11-18-windfall-read.md` 21f6d45ea04a (the ISA defect).
- The panel: `household-hsp-panel.mjs` 24ea1b926fe5, `household-hsp-orders.json` 3d2c295ae95a, `household-hsp-panel.json`
  263ee09bad98, `results-household-hsp-panel.txt` cbc47a663e3a; the twelve landings in `results/household-hsp-land/` and
  `results/household-hsp-land.log`, `-reserves.log` (untracked).
- The run and its read: `audit-household-hsp.mjs` 4bf73bbf032e, `reduce-household-hsp.mjs` f08c7fb046a6,
  `size-household-hsp.mjs` eb3a780d5402, `batch-household-hsp.sh` 40f3585c07b7.
- What they build on: `household.mjs` 83df4db5009b, `audit-household.mjs` f40361acbe6c, `audit-household-remedy.mjs`
  8c8df6cfd44c, `audit-shapes.mjs` 94180a00e4ae, `shapes-panel.mjs` af92d5e2e71a, `share-rules-panel.mjs` 168dcae982f6,
  `couple-panel.mjs` 9db4b1f6c4cf, `held-out.mjs` 6544b128345a, `reduce-share-rules.mjs` b46fa5187e99 (`harmExact`),
  `reduce-couples.mjs` cae05c5a8e75 (`harmOf`), `reduce-household.mjs` 2a762db28f98 (`cells`, `spendOn`),
  `reduce-phase4.mjs` ac319aad1f44 (`byPath`, `survivalItem`), `size-phase4.mjs` f66f13d055ed, `stats.mjs` a4095c8e339e
  (`survivalChange`), `fair-gate.mjs` c6b3e87e1643, `audit-phase4.mjs` 5ace83959b96 (`runPath`), `check-prediction.mjs`
  ec4dfb8038ad, `run-from-snapshot.sh` cf7ab99bb4ec, `run-unit.sh` 57c3654f9162, `src/couplesSwitch.js` b33f855de049,
  `src/solver/model.js` 7cfc7fec8ff9 (step 2), `research/engine.mjs` (generated, inside code-id 603eeb595679:
  `pathsForSeed`, the deposit routing).
- The precedent: `registrations/share-rules.md` 94878b497e36 and its two design reviews (`reviews/2026-11-15-share-rules-design.md`, `-2.md`).

## What I ran

1. The planted suites: the panel's 11, the audit's 9, the read's 8, the sizing's 5, and `reduce-share-rules.mjs --planted`
   17 (it pins `harmExact`): all read as they should.
2. `node research/solver/check-prediction.mjs research/solver/registrations/household-hsp.md` (finding 4).
3. `configOf`: APP ef459a5c8ccb, K2 21ca0ea6a7f0, HSP dd698f0bcb93, as registered; `stampFilesHash()` 4fe11f21a31b;
   `code-id.mjs` 603eeb595679.
4. The panel: `household-hsp-panel.mjs summary` byte for byte `results-household-hsp-panel.txt`; `combine` into a scratch
   file from the landings, equal to `household-hsp-panel.json` but for its built time; the frozen scan's ids rehashed; the
   guard (`coupleSolverOn`) and `pensionsSplit` recomputed on all 40 units.
5. Held out: a search of the panel files, `results-*.txt`, reports, reviews and registrations for the eight couples, and of
   the file names under `results/`; `git grep -w` for 7024 and 7024 + 7919k (k 1 to 11) on HEAD, origin/main and the
   review branch (the archive left out); `git ls-remote` for the review branch's head.
6. A smoke of step 8's audit on S191-90 (6 points, 20 paths of seed 7002, pilot mode, through a scratch panel holding
   S191-90) and of the remedy's audit on the same unit at the same settings; their records compared; the read's `gate`
   on step 8's record. No figure printed.
7. The read's own stamp gate (`reduce-household-hsp.mjs <dir>`) on four scratch folders of one log each, stamped as the
   launcher stamps it, `sha -`, `NOT-LAUNCHED` and under another registration.
8. Four mutants of the read's rule (finding 5).
9. The read's own `rule()` on the remedy read's 28 unit files; D34's rates at 16,000 and 19,000 paths for a unit like
   S191-90 (finding 1).
10. The pooled interval on the remedy's units by summed cells and by path (finding 2).
11. Where each inheritance lands under arm A's own pick (`E.buildContext` on the plan as the arms run it), and the dated
    deposits `householdPlanFor` makes on each own and gap8 unit (finding 7).
12. A resolve hook loading the audit, the read, the sizing, the panel's script and `fair-gate.mjs`: every module against
    the stamp and code-id.

## Verdict

Verdict: FAIL

Three BLOCKING findings, each to be answered before launch: the arm already fails this rule's harm part on the read that
took it, and the Outcomes do not say what a PASS decides about that; the gain part's interval is not a 95% interval for 40
units run on the same paths; and HSP carries a tie-break that D80 keeps out of registered couples' arms, unnamed. Seven
MINOR. Findings 5 and 6 are in stamped files, so they are best fixed before launch, since nothing stamped can change after
it. The rest of the design holds (the last section): the panel is held out, inside the guard and reproduces; the audit runs
the remedy's K2 and HSP byte for byte; the harm part is D34's as the share rules applied it.

## Findings

1. **BLOCKING. HSP already fails this registration's own harm rule on the read that took it (S191-90), and the Outcomes do
   not say what a PASS on the held-out panel decides about that.**
   - Step 8's own `rule()` (`reduce-household-hsp.mjs`), on the remedy read's 28 unit files (seed 7002, 4,000 paths):
     `FAIL {"harm":false,"gain":true,"spend":true}`; flagged: `S191-90 net 25 against 23 (tp 0.986)`. The pooled figures it
     prints, `+1.163` and spending `+0.6723`, are the remedy's, so it reads those files as the remedy read did. S335F, the
     other unit with a net loss, is 6 against 21.
   - The remedy's bar (an upper end above `-0.3`, `survivalChange`) passed S191-90 by 0.38 of a path. Step 8 registers
     D34's bar in whole paths (`harmExact`), which at S191-90's discordance stands at 23 paths of 4,000 (0.575 points).
   - At the registered size, a unit with S191-90's discordance (1.125%) and loss (0.625 points) is flagged with chance
     0.996 at 16,000 paths (threshold 0.400 points) and 0.999 at 19,000 (`thresholdFor` and `harmRate` at `harmOf`'s upper
     bound). A quarter-point loss: 0.034 and 0.038. A 0.4-point loss: 0.483 and 0.566.
   - HSP was taken, of three forms, on these same paths, as the one that mends S191-90. Its observed loss there is more
     likely to understate the true one than to overstate it.
   - So the remedy's "MENDS" on S191-90 does not meet the bar step 8 registers. D129 (3) held step 8 "until those losses
     are fixed".
   - The PASS outcome (registration lines 73 to 81) makes HSP the default for every couple inside the guard. Couples like
     S191-90 are among them: it is 90/10, inside the guard and run on K2 today. Yet the same rule already flags S191-90. A
     PASS on 40 other couples cannot clear a flag on a known one, and "with no harm to any couple" would not stand.
   - The registration must say, before launch, which of these it does (the maintainer's choice):
     - (a) step 8 stays held, and HSP's residual loss on S191-90 goes back to the remedy line, as D129 (3)'s "until those
       losses are fixed" reads under step 8's own bar;
     - (b) S191-90 runs in the registered run on seed 7024 as a named replication unit (not held out, outside the 40 and
       the pooled parts), read by the same D34 rule, a flag there a FAIL like a panel unit's;
     - (c) a PASS does not by itself change the default: it goes to the maintainer with S191-90's flag as unresolved harm
       (D34 (3)), and couples like it stay on K2 until that is resolved.
   - Whichever is chosen, "What the pilot shows" carries the forecast: were the remedy's 28 units this panel, the rule
     would read FAIL, on S191-90 alone.

2. **BLOCKING. The gain part's interval treats the 40 units' paths as independent, but every unit runs the same paths. On
   the remedy's data it is 2.3 times too narrow.**
   - Part 2 reads `stats.mjs survivalChange` on the units' cells summed (`reduce-household-hsp.mjs` lines 84 and 97). That
     is Clopper-Pearson on the lost share of all discordant path-units, conditional on their number (`stats.mjs` lines 87
     to 92).
   - Every unit's paths are `E.pathsForSeed(seed, n, T)` (audit line 201; in the engine, path i is
     `gaussianPath(seed + 7919 i)`), so path i is the same market path in all 40 units. A bad path loses in several units
     at once, and the discordant path-units are not independent.
   - On the remedy's 28 units (seed 7002, HSP less K2):
     - summed cells: `+1.163 (+1.110 to +1.213)`, half-width 0.051;
     - by path (`reduce-phase4.mjs survivalItem`: the change averaged over the units on each path, its se across paths):
       `+1.163 (+1.046 to +1.281)`, half-width 0.118, se 0.0600.
   - The registered interval is 2.3 times as narrow as the by-path one, so a lower end above 0 on it is not a 2.5%
     one-sided test.
   - D3 registers the pooled change "its interval taken by path", and Phase 4, 7u-F and the share rules' part 2
     (`reduce-share-rules.mjs` line 14: "survivalItem, its 95% interval by path") read it so. The summed-cells form is
     the lead test's and the remedy's, both EXPLORATORY.
   - With the gain the remedy saw, part 2 holds either way, but the rule has to be right where the gain is small.
   - Fix before launch (the read is stamped): part 2 by `survivalItem` by path, with a planted case where the two
     intervals part (units whose changes fall on the same paths) and the rule reads the by-path one. The pooled APP lines
     beside (lines 191 to 194) take the same interval.

3. **BLOCKING. HSP carries item 13's tie-break, which D80 keeps out of every registered couples' arm, and neither the
   registration nor STEP8.md names D80.**
   - D80, in force (STATE.md line 73): "No registered couples' arm takes a shortlist, item 12's options or item 13's
     tie-break."
   - HSP's configuration is the candidate's, with `"tieAboveCap":0.0001` (audit line 64; `configOf('HSP')` dd698f0bcb93
     prints it). The audit's planted check requires it ("K2's carries no tie-break; HSP's the candidate's", line 129).
     D80's check runs on K2's two tables alone (line 122).
   - D95 found that the tie-break reaches no couple's path, because a couple's joint move takes no tie rule. HSP's move
     is the single solver's chooser, where it acts, so HSP is the first registered couples' arm in which it acts.
   - The last registered couples' read held D80 as binding: `reduce-share-rules.mjs --planted` prints "the gate: a
     tie-break on is refused (D80): true".
   - The household line's rulings (D117, D129 (3)) put the tie-break in the household table for EXPLORATORY steps. None
     of them lifts D80 for a registered arm.
   - Fix before launch: the Arms say HSP takes it, and the maintainer rules, in a D-line or with the launch, that D80
     does not bind HSP. Otherwise HSP runs without the tie-break, which is not the remedy's HSP.

4. **MINOR. The launcher's registration check refuses this draft on two lines besides the seed and the design review, and
   it would accept Paths unfilled.**
   - `check-prediction.mjs` on the registration: `NOT COMPLETE` / `no "- **Arms:**" line` / `"Outcomes" is empty` /
     `"Seed" names no held-out seed from the registry` / `"Design review" names no review file`. The last two are
     expected until the unlock and the review.
   - Line 23 reads `- **Arms** (...)`. The check wants `- **Arms:**`, and a 12-character hash on that same line
     (`check-prediction.mjs` line 18 reads a field's own line, line 26 its hash); the hashes are on lines 24 to 29.
   - Line 72, `- **Outcomes:**`, has nothing after it on its line.
   - Line 49, `- **Paths:** (to be filled ...)`, passes the check as it stands: only `<...>` reads as a placeholder (line 24).
     Write each unfilled field as `<...>`, so that the launcher refuses it until it is filled.

5. **MINOR. The planted checks cannot tell which end of the interval parts 2 and 3 read.**
   - I made four mutants of `reduce-household-hsp.mjs` line 97 in a scratch copy:
     - part 2 reading the point (`C.pooled.d > 0`);
     - part 2 reading the upper end (`C.pooled.hi > 0`);
     - part 3 reading the lower end of spending;
     - part 3 reading the upper end of spending.
   - Each prints `PLANTED: ALL PASS (8)`, as the read does. Every planted unit is built so that the point and both ends
     fall on the same side of each bar.
   - The remedy reviewer's MINOR 1 was carried to part 1 alone. The code reads the right ends now (part 2 the lower end,
     part 3 the point), but the read is stamped and read once.
   - Part 1 is not part of this finding. The "either side" case (lines 124 to 127) finds its bar with `harmExact` itself,
     so it pins part 1's wiring (the arms' order, the paths), not the threshold. The threshold is pinned by
     `reduce-share-rules.mjs --planted` ("the threshold in whole paths at 16,000 to 19,000 paths"), which is in the
     stamp.
   - Fix: planted unit sets either side of parts 2 and 3's bars, on which the point and the ends part.

6. **MINOR. The records do not carry what each arm ran with, so the gate's "each arm at its configuration" cannot fail.**
   - A unit's record (audit line 245; the smoke's keys `k, id, couple, base, cohort, place, variant, feature, target,
     label, seed, N, warm, pts, W, stamp, configs, joint, order, digests, share, split, guard, caps, houseCap,
     solvencyFloor, T, beside, arms`) holds the hash of the audit's constants and the constant `JOINT`.
   - It holds no settings line of the three tables, none of HSP's plan entries or its band for gains, and no joint options
     read back from the solve. The remedy's records kept `plans` and `bands`, and its reviewer checked k against them.
   - The gate's check (line 75) compares `configOf(arm)` at the run with `configOf(arm)` at the read. They are the same
     constant unless the audit changed, and the audit stamp refuses that anyway.
   - So the arms are held to their settings only by the checks before any path (`solveProblems`, exit 3), and those leave
     no record. Their wiring has no planted case in this suite: its planted cases call `pickGuardProblems` alone. The
     share rules' gate read each person's settings line and the share back from the solve.
   - "One launch log a unit" is a count (line 54). It does not check that each log holds its unit's done line, or that
     `case<k>.txt` is unit k's.
   - A resumed arm (line 209) is held to its saved part's code, audit and prediction, but not to the registration's blob
     (`sha`) or the Node version.
   - Fix before launch (the audit and the read are stamped):
     - record each table's `lineOf`, HSP's `DOUBLED` entries and the bands for gains;
     - re-check them at the gate (`wantProblems`, `unitLineProblems`, `scaleProblems`, the band k times a person's), each
       refusal with its planted case;
     - check each log's done line;
     - hold a resume to the blob too.

7. **MINOR. The engine's ISA defect reaches HSP's table on 30 units, not one.**
   - S027-gap8 is the only unit whose engine run meets it. Under arm A's own pick (Windfall to ISA) its 2030 inheritance
     lands `isa_self=20000+other_self=61000`.
   - Every other inheritance in the panel lands `pen_self=3600` and the rest in the GIA: S027's other four units, and
     S351F's and S355F's five each. STEP8.md item 5 is right about the engine.
   - But `householdPlanFor` turns the later retiree's contributions into dated External deposits (`household.mjs` lines
     146 to 162). On six couples, S193, S273, S349F, S351F, S355F and S357F, these include ISA contributions:
     - three years on each own, 45, 90 and feature unit;
     - eight years on gap8;
     - from £1,419 a year (S193) to £10,795 (S273-gap8, 2041 to 2048).
   - The model counts the year's ISA subscription from regular contributions alone (`src/solver/model.js` lines 250 to
     262), which is the defect the windfall read found.
   - So HSP's household table plans on ISA room the couple does not have in those years. The engine, running the couple,
     counts the partner's regular contribution. K2's tables carry those contributions as each person's own regular ones,
     so the defect does not reach them.
   - It acts on one arm's table on 30 of the 40 units. Its size is not measured, and it was in the lead test's and the
     remedy's younger units too. Most likely it costs HSP (it plans for room it is not given), but that is not shown.
   - Fix:
     - STEP8.md and the registration state its reach.
     - Before the pilot, the registration says whether step 8 waits for the defect's fix. That fix is the maintainer's
       call, pending since the windfall read, and it moves the code, so the panel would be landed again.
     - If step 8 does not wait, the scope says the run tests HSP with the defect, and the read prints the pooled figures
       without S027-gap8 beside the rule.

8. **MINOR. Part 3 is weighted by pounds, and M1's measure is not stated.**
   - `spendOn` (`reduce-household.mjs` lines 113 to 124) pools pounds across units. By target times spending years:
     - S273's five units carry 29.3% of part 3, and S357F's 26.2%;
     - S025's, S193's, S027's and S349F's twenty units carry 18.7% between them.
   - The share rules weighted units equally (`spendingItem`) and said so. State the weighting in the Decision rule, and
     print the unit-equal figure beside it.
   - M1 by unit (`m1ByUnit`, line 91) reads "delivers no less spending" on the paths both keep. On the remedy's S023-db
     the two measures part: `-0.174%` on the paths both keep, `+0.095%` over all paths. D116 names no measure.
   - State the measure used, print both by unit, and say that a named unit goes to the maintainer with the outcome,
     since D116 does not rule on it.
   - Keeping M1 out of the bars is right: D116 says the pot "is not a bar", so making a named unit block would add a bar
     the maintainer did not give.

9. **MINOR. The guard may move before the launch, and the audit would then refuse units mid-run.**
   - D129 (4)'s read put re-keying the guard to the maintainer (DECISIONS-PENDING.md item 4), not yet ruled.
   - `src/couplesSwitch.js` is in the audit stamp, and the audit requires the guard on before any path (lines 105 and
     183). A unit that a re-keyed guard keeps off would exit 3 mid-run, and the read would refuse it as missing.
   - The landings' verdicts are today's guard's: on for all 40 (recomputed).
   - The registration should say what happens: either the panel is re-checked against a new guard, and walked again,
     before the pilot, or step 8 launches before any change to the guard.

10. **MINOR. HSP has nothing beside the engine, and a PASS's port is not tied to the tested arm.**
    - The rollout beside the engine runs for K2 alone (lines 236 to 242). For HSP, the only model-side figure is the
      household table's forecast at the start.
    - Report HSP's own rollout beside the engine on its first 500 paths, its policy stepped in the household model, so
      the household plan's approximation is sized unit by unit. Otherwise say why not.
    - A PASS ports research code (`household.mjs`) into `src/`. The Outcomes should require the port to be shown
      identical to the tested arm before the change of default is committed: the page's route against the audit's HSP,
      path for path on named units, as D99 and D109 did (`results-couple-default-identity.txt`,
      `results-couple-joint-identity.txt`).

## What I would require of the pilot and the sizing

1. **The pilot as built.**
   - It runs the 15 `pilotUnits` (S025, S273 and S351F, five units each) at 45 points, on 1,000 paths of seed 7002, on
     code 603eeb595679, with nothing else running.
   - The savings factorial was running four solver processes during this review. The chunks' recorded load should be the
     pilot's own four.
   - `size-household-hsp.mjs` checks one code and seed 7002 across the pilot (lines 69 to 71), not the panel's code. Add
     that check.
2. **The pilot's gate first.** Run `reduce-household-hsp.mjs --pilot` before the sizing writes `household-hsp-paths.json`.
   That file is in the audit stamp, so once it exists the pilot's records carry another stamp and the pilot's gate
   refuses them.
3. **What the pilot shows.**
   - Each pilot unit's HSP less K2, by shape.
   - D34's chance of a flag at the registered N, had that loss been true, as `share-rules-pilot-power.mjs` gave it.
   - Finding 1's forecast.
   - Sixteen of the 40 units are shapes HSP has never run on: the eight 45s (k 1.818) and the eight gap8s. The pilot holds
     six of them, the only look before launch.
4. **Paths.** N is the largest of the 15 sizes, at most 19,000. Units past it are named at the read with their 1-point
   rate (D34 (4)). Say that the 25 unpiloted units are sized only through the piloted ones.
5. **Budget.**
   - Include the `E.runTrial` check (200 paths an arm).
   - Allow for a relaunch after an out-of-memory stop (the remedy's unit 1).
   - Show the longest unit inside the task's 12-hour limit.
6. **What may change after the pilot.** Once the pilot is read, only Paths, Budget, The launch, What the pilot shows and
   Design review change. A change to the rule, the panel, the arms, the audit or the gate comes back to the design
   reviewer, with the pilot's figures named as seen.

## What holds (checked, no finding)

- **Held out.**
  - The frozen scan rehashes to acedff4811b5 (318 ids, sorted).
  - None of the eight couples or the four reserves is in it. None is in any panel file, `results-*.txt`, report, review
    or registration (only in the three orders files, as untaken candidates), or in a file name under `results/` but step
    8's landings.
  - The review branch's local ref, which `touchedAll` reads, is f1f44727, its remote head now.
  - Seed 7024, and 7024 + 7919k for k = 1 to 11, appear nowhere but step 8's files and the proposal's mentions in STATE.md
    and DECISIONS-PENDING.md. That holds on HEAD, origin/main and the review branch (the archive not opened).
  - No seed in the registry differs from 7024 by a multiple of 7919.
- **The panel.**
  - Recombined from the landings, it is `household-hsp-panel.json` but for its built time, and its summary reproduces byte
    for byte.
  - All twelve landings are on code 603eeb595679, the code now. `household-hsp-panel.mjs` is unchanged since the orders
    were frozen (30e3083d).
  - Every unit's guard is on (recomputed). k is 1.667 on own, the features and gap8, 1.818 at 45 and 1.111 at 90.
  - S111 is passed over by the frozen rule: its own variant was at 86.3% after 11 steps.
  - The next in order, S027, takes its place. S027 sits next to S025 in the order, and both are 68/65, so the library
    cohort has no couple near S111's 61/58. That belongs in the scope.
  - The younger cohort's untouched pool is now S353F and S359F. The guard's own units after a PASS, and any replication,
    will need couples from elsewhere.
- **The arms are the remedy's.** Step 8's audit and the remedy's audit were each smoked on S191-90, at 6 points and 20
  paths of seed 7002. Step 8's ran through a scratch panel; the two panels' `unitPlan` build S191-90 alike.
  - K2's and HSP's seven arrays are the same in both.
  - So are the three table digests (step 8's household table is the remedy's 'pensions' table), s, k, the caps, the
    minimum pot and the horizon.
  - The read's `gate` reads step 8's record: fair at its settings, and refused under the registration's prediction.
- **The stamp and the launch.**
  - All 55 modules that the audit, the read, the sizing, the panel's script and `fair-gate.mjs` load are in the stamp or
    in code-id.
  - The read's own stamp gate passes a log stamped as the launcher stamps it (it then stops at the missing paths file, as
    it should for now). It refuses `sha -`, `NOT-LAUNCHED` and another registration.
  - The registered mode refuses limits, any other prediction and any code but the panel's. No log under the registration
    prints an outcome.
  - The batch's `HELD_SEED=7024` is the only seed the launcher's seed check reads in it.
- **Part 1 is D34's, as the share rules applied it.**
  - It is `harmExact(HSP, K2, N)` in whole paths, its threshold at `harmOf`'s upper bound of the realised discordance.
  - Its orientation is pinned: the 2% plant would not flag with the arms swapped.
