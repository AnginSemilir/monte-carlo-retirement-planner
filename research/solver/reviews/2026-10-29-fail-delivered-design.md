# Design and default-change review: `failDelivered` (the port, its test, the candidate's default, registrations/fail-delivered.md)

Subject: the uncommitted working tree of 29 Oct (HEAD 89c8215) that ports the external review's `failDelivered` into
src/solver/solve.js (D43 (1)), makes it the candidate's default, registers its held-out test on seed 7019, and adds the
EXPLORATORY dial run (D44 (1)); reviewed before commit and before launch.

## What I read

Working-tree blobs (git hash-object, first 12): src/solver/solve.js 113e3da7d08b (against 8e63de3's); research/tests/
fail-delivered.test.mjs 93679f34f5a1, results-fail-delivered.txt 775a14e2c804; candidate.json 6ecabd1100ef; candidate.mjs
8e17a0268f01; research/tests/candidate.test.mjs 97932e95db83, results-candidate.txt c5625aa0c352; STATE.md 8fcf0abcf464;
e3pcls-pin.json 9dade78d083b; state.mjs 3a361fbf49af; registrations/fail-delivered.md 17f82870da31; audit-curve.mjs
b71813586a9c; reduce-curve.mjs 59388d60c253; batch-curve.sh 16933bc8e452; results-v-candidate-d43.txt e508e7ea8cd5;
check-prediction.mjs 37e208f33478 (edited while I reviewed: 7019 added to the registry, owned by fail-delivered*.md).
From 37fdbf7: SPENDING-CURVE.md, curve/solve-faildelivered.patch, curve/solve-spendutility.patch, curve/curve-test2.mjs,
curve/results-curve-test2.txt, curve/curve-audit2.mjs, curve/curve-reduce.mjs, curve/tier-read.mjs,
curve/results-spending-curve.txt. Also: run-from-snapshot.sh, fair-gate.mjs (requireFairLogs), audit-phase4.mjs (runPath,
STAMP_FILES), reduce-phase4.mjs l.85-111, run-all.mjs (FAST), e3pcls-guard.test.mjs l.75-100, speed-port.test.mjs l.1-90,
solver-memo.test.mjs l.25-45, engine.mjs (pathsForSeed, mulberry32), grid.js l.38-41, fast.js flow (l.378-670),
results/curve-smoke/case0.txt, results-v-candidate-d30.txt.

What I ran:
- `node research/tests/fail-delivered.test.mjs`: ALL PASS, 12 checks, 8 min 28 s; its S090 and S304F CAND hashes (off,
  on, planted) are results-curve-test2.txt's bit for bit.
- `node research/tests/run-all.mjs fast -j 4`: 45 files, 43 passed, FAILED: e3pcls-guard.test.mjs, speed-port.test.mjs.
- `node research/solver/check-prediction.mjs --seeds ...` for both batch modes (finding 2); `check-prediction.mjs` on the
  registration (now only the design review missing); `reduce-curve.mjs --planted` (15 of 15); `check-state.mjs` (passes).
- Scratch probes (my scratchpad, nothing written to the repository's results): sites2.mjs (the three failure sites the
  test does not run, panel S090, 4 points); failpick.mjs (cells where the table's chosen move fails while another pays,
  S090, S304F at 4 points, S050, S340F at 12); v2pair.mjs (V2's settings, seed 99001, 2,000 paths, Phase 4's candidate
  against the new one on this code, S008 and S330); move0.mjs (what the chooser's fallback move delivers in an all-fail
  year); harm.mjs (reduce-curve's HARM rule on synthetic units); overlap.mjs (mulberry32 stream overlap for seed 7019).

Verdict: FAIL

Two BLOCKING findings: the commit as prepared fails the FAST suite (the pre-commit hook), and the registered launch
command is refused by the seed registry. The port itself is right (checked below); the rest are MINOR.

## Findings

1. BLOCKING. The commit fails FAST, two files, both caused by this change.
   (a) `e3pcls-guard.test.mjs` throws: "no research script or test first committed from 2026-10-07T22:50:00+01:00 solves
   with the candidate's options unguarded (fail-delivered.test.mjs)". fail-delivered.test.mjs l.46 and l.51 call
   solvePlan with CANDIDATE_OPTS and the file has neither `checkE3pclsPin` nor a `// e3pcls guard: <why>` line
   (e3pcls-guard.test.mjs l.88, l.98-99). Fix: add the marker with its reason (the file is new and not protected).
   (b) `speed-port.test.mjs` check 1: "FAIL 1 S224 CAND at 4 points, the option unset: the same as before the port" and
   the same for S370 CAND (FAILED: 2 of 20, 1233 s). Its CAND is `D29_OPTS`, CANDIDATE_OPTS less tableDealing (l.47),
   compared with hashes recorded before the port (WANT, l.79); D29_OPTS now carries `failDelivered: true`. This is the
   one script that silently assumed the candidate was fcd8096217b7. Fix: strip failDelivered there too
   (`{ tableDealing: _td, failDelivered: _fd, ...D29_OPTS }`), as tableDealing was stripped at D30. The file is in FAST,
   so the edit needs the maintainer's unlock.
   Everything else in FAST passes on the new candidate, including solver-memo (memo off and on identical for CAND and
   the joint-worlds route with failDelivered on), chooser-share, state-check and risk-consent.

2. BLOCKING. The registered launch is refused as written. batch-curve.sh holds both modes, and the launcher scans its
   non-comment lines (run-from-snapshot.sh, SEEDARGS): l.11 names 7019, l.12 names 7002. With the registry as now
   edited:
   `check-prediction.mjs --seeds research/solver/registrations/fail-delivered.md --text "bash research/solver/batch-curve.sh registered" research/solver/batch-curve.sh`
   prints "the run uses seed 7002 (tuning), which the registration's Seed field does not declare" (exit 1), and the
   dial's launch under `PREDICTION=none` prints "seed 7019 is reserved (...) and this launch is under a measurement"
   (exit 1). Fix: one batch script per mode (the registered one naming 7019 only), and the registration's launch line
   (l.6-7) naming it.

3. MINOR (for the maintainer). The failure year priced at what it delivers, with the years after it at the floor, makes
   the backward pass take a failing move where a paying move exists, which the chooser never does (scoreMoves gives a
   move that cannot pay -Infinity, solve.js l.1811). Failing now while most of the target can still be paid costs
   lambda (1 - delivered)^2 + failCostAt[t + 1]; paying the floor now and failing next year with little left costs the
   floor plus that year's (1 - delivered)^2, so at near-doomed cells failing now is cheaper. Measured (failpick.mjs,
   panel plans, light lattice), layer-cells whose stored move fails while another pays: S050 at 12 points 88,488 of
   1,040,256 with failDelivered against 3,024 without; S340F at 12 points 65,472 of 2,266,272 against 0; S090 and
   S304F at 4 points 0 against 0. There the table stores survival 0 and the fail-now price, where the engine will pay
   this year; a paying move loses this way only if its survival is below about lambda (2.2 points), but the table is
   log-odds clamped at 1e-6 (grid.js l.38-40), so reads between such a cell and its neighbour are pulled down. The port
   is the patch the maintainer chose; the registered P1 (every path) is the outcome check that would see an effect.
   Two forms that remove the mismatch, each needing its own test: the years after the failure priced at what they
   deliver (the guaranteed income, as the review's spendUtility patch did with ruinLevelAt), or the backward pass kept
   to paying moves where one pays, as the chooser is. Report beside P3 (not deciding) the run-out paths with a 110% year
   in the two or three years before ruin, so a raise moved one year earlier is seen.

4. MINOR. P1 as predicted is unlikely to hold on 32,000 paths, and HARM fires on an immaterial handful. On this code at
   V2's settings (seed 99001, 2,000 paths, v2pair.mjs), Phase 4's candidate against the new one: S008 95.50% to 95.45%,
   one path lost and none saved (path 321 ends below the minimum pot in year 27, every year met); S330 89.65% to 89.60%,
   the same (path 539, year 60); results-v-candidate-d30.txt against -d43.txt show S370 82.50% to 82.60%. The review's
   "the same on every path" held on its 8,000 paths; P1 will most likely read MISSED, which the registration should
   say rather than "need no power" (l.26). HARM is `sv.hi < 0` on the normal interval (reduce-curve.mjs l.155): four
   paths lost and none saved of 32,000 (-0.013 points) reads HARM, three reads MISSED (harm.mjs); the exact one-sided
   sign test at four is p 0.0625. HARM then holds Part C's default until a ruling. An exact sign (McNemar) test with a
   materiality margin (D3's pooled 0.1 point, or D34's per-household thresholds) would match the project's harm rule;
   or record that HARM is a deliberate hair trigger.

5. MINOR. P2's power argument (l.26-29) uses 0.07%, the largest se of any of the review's arms against CAND
   (SPENDING-CURVE.md l.357). CANDD's own was 0.001% at 1,000 paths (results-spending-curve.txt l.41), about 0.0005% at
   4,000. The band of +-0.1% is then some 200 se wide: the predicted -0.007% cannot be told from -0.09% (v2pair: S330
   -0.0285%, S008 -0.0082%). Either tighten the band or say P2 tests materiality, not the prediction.

6. MINOR. The read's gate does not diff what each unit ran (CHECKLIST 3). gate() (reduce-curve.mjs l.32-49) holds code,
   audit, seed, paths, inputs, target, retireT and Y, but not `ran`: pts, actions, levels, lambda, raiseWeight,
   failureShortfall, switchCharge, tierState, bequestWeight, minPot. armProblems at run time (audit-curve.mjs l.59-67)
   and the audit stamp (candidate.json, candidate.mjs) cover most of it, but reduce-phase4.mjs (l.107-108) diffed the
   records. Add: every `ran` field equal on a household's two units but failDelivered, with a planted case. runPolicy
   beside the engine is printed (l.242-243) but does not gate; D3 calls a difference a fidelity gap, not a result.

7. MINOR. The registered read prints no investment line though every unit records it. The 6-point smoke
   (results/curve-smoke/case0.txt) has S090's first-year pension and ISA equity at 43% under CAND and 83% under CANDD:
   the option can move the first tier choice, the likeliest route to a survival change. Print each arm's equity at
   years 1, 5, 10 and 20 beside P1 to P3, reported, not deciding.

8. MINOR. The test (fail-delivered.test.mjs) shows (a) identity at three solves, with its planted lambda x (1 + 1e-9),
   (b) and (c) at two of the five failure sites (E5's phase A through CAND, the ternary search through PRODUCT ternary),
   and the refusal. BASE 8e63de3 is right (`git log -1 -- src/solver/solve.js`). It does not run the joint-worlds site
   (l.1481: the candidate with one tier pair, D39's route that Part C ships), the tier-state layer loop (l.1413) or
   PASS 2 (l.1543). sites2.mjs (panel S090, 4 points): at each, on differs from off and the plant from on; the layer
   loop's hashes equal results-fail-delivered.txt's E5 hashes bit for bit (9519c7c96bcb5634 / 9ff9791aeb3c8d3a /
   30b136ab611c3621). Add the three routes. FAST: not as written (8.5 minutes, and check 1 is tied to 8e63de3's solve.js,
   so the next edit that moves a table fails it). Nothing in FAST shows the option reaching the solve: candidate.test.mjs
   reads meta only. A quick form, checks 2 to 4 on one light household over the five routes, should join FAST on the
   maintainer's unlock.

## Checked and sound

- The port is the patch less spendUtility, line for line: the five failure sites (l.1197 with tierBase[ai], l.1328,
  l.1413, l.1481, l.1543), the unmet stored in the ternary's `ensure` (l.1157) and pass 1 (l.1239), with the tier
  variant's copy (l.1245); the cost lambda x shortOf(level less unmet over the year's target, clamped to [0, 1]) plus
  failCostAt[t + 1], and failCostAt[t] in a year with no spending (l.984-989); the refusal without failureShortfall
  (l.982); meta.failDelivered (l.1588). Nothing in the spendUtility patch is needed without it. The memo is untouched
  (a failing move neither reads nor writes it, l.1289-1327; the override follows), and E7 and phase B read e5H, which
  carries it. `unmet` includes deductions, one-off costs and CGT bills (fast.js l.418-646), so the delivered level is
  understated when those go unpaid; the review measured the same quantity.
- The chooser needs nothing: it reads the option through next year's h; in a year where every move fails it keeps
  move 0 (l.1714-1718), whose steps end in penAny, and on S090 it delivers as much as the best failing move at all 22,680
  all-fail cells in spending years (move0.mjs).
- The default change: candidate.json, the decided-defaults block, candidate.test.mjs (51 passed: Phase 4's
  fcd8096217b7 and 7u-F's e65e5e99ba49 reproduced, the planted solve on PHASE4_OPTS caught), state.mjs's candidate line
  and the e3pcls pin (f7239113db074d9e, the code's fingerprint now). Committed together, once finding 1 is fixed, it is
  complete. The evidence is exploratory, but D43 names the run (CHECKLIST 1's exception). V1 and V2 on d71f65ae871e:
  ALL PASS on 7 of 7 (results-v-candidate-d43.txt), so the commit need not wait.
- The scripts that assumed fcd8096217b7: audit-phase4.mjs and audit-tiers.mjs refuse at run time; reduce-phase4.mjs,
  reduce-tiers.mjs and reduce-gate5.mjs would now refuse a re-read (their audit stamp includes candidate.mjs, or they
  want CANDIDATE_HASH). All are refusals, not silent changes. speed-port.test.mjs is the exception (finding 1b). N7's
  data.json is of fcd8096217b7, so its timings are Phase 4's candidate's.
- The design: the arms differ only in failDelivered (armOf l.57: PHASE4_OPTS against CANDIDATE_OPTS, both through
  solveCandidate with the same extras); the households are the review's eight. P1, P2 and P3 are computed as registered
  and as curve-reduce.mjs did: paired() matches lin(..., 'CAND'), and raiseBefore counts as fails/raiseBefore did, unmet
  above 1 and the year before at 110% or more. Seed 7019 shares no path with 7001-7005, 7011-7014, 7018 or 7101
  (seed + 7919 i), and no mulberry32 stream of its first 4,000 paths overlaps theirs within 200 draws (overlap.mjs). The
  budget fits the tier test's CAND units (solve 230-360 s, engine 51-79 ms a path). The harness ran end to end (the
  smoke's audit 62feebb5da67 is the files' now). The equity read takes the year's move's tiers (r.c.acts[ai]), so its
  year n is the move of index n - 1, as tier-read.mjs's `held` at index n was.
