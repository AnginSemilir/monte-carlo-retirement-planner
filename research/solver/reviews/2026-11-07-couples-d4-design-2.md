# Design re-review: Part D's D4, the candidate for couples against the app's rules and the couples' solver at the product's settings

Subject: `registrations/couples-d4.md` and the batch, audit, panel, sizing and read it names, before launch, at 3009aa6 on
claude/project-access-i58m0x (code-id a8d0e9568319; the audit stamp over STAMP_FILES a25986e0d140, the batch's AUDIT the
same), after the first review's FAIL (`reviews/2026-11-07-couples-d4-design.md`, at 4cd54db).

## What I read

Blobs (git hash-object, first 12): couples-d4.md b2688c2b7fcb; audit-couples.mjs 42e863dfddc1; reduce-couples.mjs
82ed0a0df7e2; size-couples.mjs be452b66eb2a; couple-panel.mjs 5962004085a2; batch-couples.sh 465fb2d61fdc;
couples-paths.json f460210ef40b; couples-panel.json 133b00059a89; couples-orders.json 0dc6f3cb4245;
results-couples-sizing.txt ab88456e7b15; results-couples-pilot.txt 7d8443d01c49; results-couples-panel.txt 4dec54055192;
PART-D.md 6ec99c3e497a; src/solverApp.js ff0b79d55a06; src/solverSettings.js 5d18fb6a3a6d; src/solver/couple.js
007be531192f; src/solver/solve.js 178b5333a872 (solvePlan, tierCombos, ONE_PAIR, menuPlus, the reader's years);
audit-phase4.mjs 5ace83959b96; reduce-phase4.mjs ac319aad1f44; size-phase4.mjs ab2da96ea302; fair-gate.mjs 4d4a20402b1c;
candidate.mjs 8e17a0268f01; code-id.mjs f00aa5b3bd48; check-prediction.mjs 37e208f33478; run-from-snapshot.sh
cf7ab99bb4ec; batch-phase4.sh dacac4cce378; research/engine.mjs 4342a35dd6a1 (stepYear's retired rule and unmet demand,
pathsForSeed); results-phase4-sizing.txt cc141ee94825. Also STATE.md, CHECKLIST.md, the commit's diff against 4cd54db, the
pilot's ten units (results/d4-pilot) and the EXPLORATORY smoke run of the chunked audit (S301F, seed 7002, 12 paths, 8
points; the session scratchpad's d4-smoke). Nothing of seed 7021.

What I ran (nothing written under research/ but this file; scratch scripts in the session scratchpad):
- `audit-couples.mjs --planted` 9 of 9; `reduce-couples.mjs --planted` 36 of 36; `size-couples.mjs --planted` 6 of 6;
  `couple-panel.mjs --planted` 8 of 8.
- `reduce-couples.mjs --pilot`: byte for byte results-couples-pilot.txt.
- `stampFilesHash()` a25986e0d140; the batch's AUDIT line (the same `cat` list, run by hand) a25986e0d140; `configOf`
  CANDC d71f65ae871e, SHIPC 07c069b6e330; `--units` 520.
- `check-prediction.mjs registrations/couples-d4.md`: NOT COMPLETE on two lines only (no registered seed; this file absent).
- size-couples.mjs's functions imported (no file written): 835.4 core-hours, 20 windows, 231 hours, 88.9 cut off, longest
  chunk 2.79 h at 19,000; 403.2, 9, 105, 17.1, 1.41 at 8,000; tpLimit 12.45% and 5.18%; at 19,000 a 1-point loss read 0.901
  at 12.45%, 0.846 at 15%, 0.825 at 16%, the quarter-point rate 0.048 to 0.050 throughout: the sizing file's figures.
- The reducer's loadDir and gate over the smoke run: only the expected problems (seed 7002, NOT-LAUNCHED, 8 points, the old
  audit hash on the CANDC/SHIPC chunks, the weight not run, a beside sized to a 3-path chunk).
- Over all 40 panel couples (d4-tiers.mjs, d4-retired.mjs, d4-minpot.mjs): each person's tier pairs as each arm builds them;
  the audit's `retiredAt` against the engine's own spending row, year by year; each person's minimum pot, target and floor
  in each arm at each weight. A transitive import walk of audit-couples.mjs and reduce-couples.mjs against codeFiles and
  STAMP_FILES (imports.mjs). Phase 4's pilot bounds against APP above 12.45% (results-phase4-sizing.txt).

Verdict: PASS

The three BLOCKING findings are fixed as claimed, and the fixes break nothing I could find; five MINORs below, none of
which changes a figure the run will read. The registration states plainly the three things that are the maintainer's
before launch (the seed's reservation, 19,000 or 8,000 paths, and the rule for a comparison past D34's limit) and is ready
to go to the maintainer; MINOR 5 is what follows if the ruling is other than the option built.

## The first review's findings

- BLOCKING 1 (the cost years averaged zeros): fixed. The audit records, per cost year, whether either person is retired
  (audit-couples.mjs l.86, l.183); over 2,026 couple-years of the 40 couples, `retiredAt` and the engine's `targetSpend > 0`
  agree on every year, and 13 couples have someone retired in year 3, as results-couples-panel.txt prints. The read takes
  the cost years' spending over those 13 alone and names the 27 (reduce-couples.mjs l.218-222), and over all 40 the paths
  failing in a cost year or the two after (l.223-227); both planted (+20%, not +10% with a zero averaged in; C2 named).
- BLOCKING 2 (the stamps): fixed. STAMP_FILES and the batch's AUDIT list the same 17 files in the same order and hash alike
  (a25986e0d140). Each solver unit is refused by the audit and the gate unless its configuration hashes d71f65ae871e
  (CANDC) or 07c069b6e330 (SHIPC) (l.174; reduce-couples.mjs l.139), planted; the person's run record now carries HR,
  the joint worlds, the bridge step, the switch charge and margin, the allowance axis, e3pcls, the split and the lattice,
  and the smoke run's real solves show every one of them read right in both directions (CANDC `hr yes`, `e3pcls true`,
  `lattice 160x41x128+foot+stepAll`, `readerYears 6`; SHIPC `hr no`, `e3pcls false`, `lattice unbuilt`). The import walk
  finds nothing outside the two stamps that moves a figure of the run (MINOR 3 for what is left).
- BLOCKING 3 (D34's limit): fixed as far as a design can fix it. All 160 comparisons are printed with the discordance,
  its bound, the threshold and both rates, the ones below 0.90 named (l.213-216, planted at 15% and 5%); the registration
  states the limit with the size-couples.mjs figures (reproduced above), the proposed rule, the alternative, and that the
  departure from D34 (2) and (4) needs the maintainer's ruling before launch. "27 of 80" on Phase 4's pilot: recomputed
  from results-phase4-sizing.txt (upper bounds to 16.75%).
- MINORs 4 to 9: fixed. The fair-test diff person by person (FAIR, l.153) and APP's guardrails, lookahead and cap (l.134),
  each planted; on all 40 couples each person's minimum pot, target and floor are the same in CANDC and SHIPC at both
  weights, so the new check will not refuse a fair run. The chunks: path i is the seed's path i in any chunk (engine.mjs
  pathsForSeed builds path i from seed + 7919 i alone), the ranges cover each unit once (planted), the gate holds every
  chunk to its range and its unit's shared fields, and the solve has no clock or random input (src/solver: only profiling
  timers), so each chunk solves the same tables. The wording, the six prior uses and the panel's figures are as asked;
  the planted cases asked for in MINOR 9 are there; PART-D.md's D2.4 sentence no longer claims D4 isolates the limits.

What holds besides, on the questions asked:
- No unit will be refused for a reason the registration does not intend: every one of the 80 people holds a pension at
  High Risk and an ISA at Medium/High Risk, so CANDC has four tier pairs and SHIPC three for each (no one-pair solve
  dropping the switch charge the WANT requires), and HR is on the menu whatever the accounts (solve.js l.122-129).
- The arms differ in the solver's settings and points alone, on one plan per couple (inputs hash), on paired paths of the
  held-out seed; the decision rule is Phase 4's. S1's se, 0.014 to 0.064 points at 19,000 (0.022 to 0.099 at 8,000), puts
  a true S1 of +0.8 (Phase 4's) or +1.3 (the pilot's) far above the -0.1 bar at either count; at the pessimistic se a true
  S1 of nought would pass only about a third of the time, which is the non-inferiority bar doing its work. Scored by the
  engine, with the couples' rollout beside it on 500 paths of every solver unit.

## Findings

1. MINOR. The batch keeps a chunk on a weaker rule than the read accepts it by. RESUME keeps a chunk whose log names this
   code and this audit (batch-couples.sh l.20); the gate wants one stamp across all units, the registration's blob and the
   Node version included (reduce-couples.mjs l.113, l.155), and its refusal does not say which units carry which stamp.
   Over about 20 relaunches in ten days, a Node change in the container, or a declared correction to the registration,
   leaves kept chunks on one stamp and new ones on another, and the read refuses at the end with "2 stamps across the
   units" and no list. Phase 4's batch had the same rule (batch-phase4.sh l.19) over fewer relaunches. Fix: keep a chunk
   only when its stamp line also names this launch's PREDICTION_SHA and its log this Node version, and have the gate name
   the units under each stamp.

2. MINOR. Each relaunch copies the working tree as it then stands (run-from-snapshot.sh l.124), and this branch will move
   during the run (D5's couples' screens; any beta fix to src/solverApp.js or src/solverSettings.js). An edit to a stamped
   file or to src/solver between windows is now caught (every kept chunk's stamp differs, so the batch reruns all of
   them), so it costs the run and not its validity; and the read must run on the launch's tree, since the gate compares
   the units' audit hash with the files as read (reduce-couples.mjs l.128, l.355-356). Fix: relaunch and read from a git
   worktree at the launch commit, and say so in the registration or the batch's header.

3. MINOR. "the audit hash over every file the run and the read take beyond it" (registration l.4-6; reduce-couples.mjs
   l.15-17) is not quite so. Outside both stamps: fair-gate.mjs (the read's provenance check, requireFairLogs and LOG_STAMP,
   reduce-couples.mjs l.54, l.349), audit-7uf-checks.mjs (imported by audit-phase4.mjs l.47, not on D4's path),
   held-out.mjs, select-7u-broad.mjs and scan-touched.mjs (the panel's build, frozen into the stamped couples-panel.json),
   e3pcls-pin.mjs (solveCandidate's, not called) and code-id.mjs. None moves a figure of the run (results-o60.txt, read
   by candidatePlan for every arm's returns, is covered through CANDC's configuration hash and the per-couple inputs
   hash); fair-gate.mjs can change what the read refuses. Fix: add fair-gate.mjs and audit-7uf-checks.mjs to STAMP_FILES
   and the batch's AUDIT, or narrow the sentence.

4. MINOR. The budget is an estimate good to about a tenth either way, not the 835.4 it prints. The library cohort is scaled
   linearly in years from S011 (28 years, no bridge year), yet the sizing's own line shows the candidate's engine per
   year 1.53 times as dear on S301F (1805.3 ms a path over 61 years against 539.0 over 28; "3.35 times ... 2.18 times the
   years"), and six library couples retire before access (S133, S149, S167 at 55; S371, S387, S403 at 50). With the
   library's CANDC chunks at S301F's per-year rate: 915.9 core-hours, 22 windows, about 253 hours at 19,000 (433.1, 10,
   about 113 at 8,000), the longest chunk unchanged (scratch d4-budget.mjs, size-couples.mjs's chunkSecs and scheduleOf).
   Against that, the pilot timed E.runTrial on 200 of its 1,000 paths inside the engine's seconds (4cd54db's audit, the
   check inside the timed loop), which the run spends on 200 of 19,000, so the engine's milliseconds a path are up to
   about a sixth high. Fix: say beside the budget that it may be about a tenth off either way, for the maintainer's call
   on the paths.

5. MINOR. Of the three choices the registration puts to the maintainer, only one is built (19,000 paths, a comparison past
   the limit reported as below D34's rate). 8,000 paths: size-couples.mjs writes only the pilot-sized N (l.167), so
   couples-paths.json (stamped) and the registration's Paths, Decision rule ("on every couple's 19,000 paths") and Budget
   change by hand. The second stage: nothing in the audit, the batch or the reducer runs or reads a unit past N, and its
   rates are not simulated (the extension would be conditional on the first 19,000 paths' discordance, which a loss itself
   raises). Either choice changes stamped files after this review. Fix: say in the registration that a change of N or the
   second stage comes back for a design check before launch, and where the ruling is recorded (STATE.md section 3).
